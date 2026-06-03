import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { supabase } from "@/lib/supabase"
import { locationSchema, deviceLocationSchema } from "shared"
import { ZodError } from "zod"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { calculateDistance, smoothRoute } from "@/lib/geo"
import { matchRoute } from "@/lib/map-match"
import { checkGeofence, generateEventMessage } from "@/lib/geofence"

const LOCATION_BATCH: {
  vehicleId: string
  lat: number
  lng: number
  speed: number | null
  heading: number | null
  accuracy: number | null
  battery: number | null
}[] = []

let batchTimer: ReturnType<typeof setTimeout> | null = null

async function flushBatch() {
  if (LOCATION_BATCH.length === 0) return

  const batch = LOCATION_BATCH.splice(0, LOCATION_BATCH.length)
  try {
    await prisma.location.createMany({ data: batch })
  } catch (err) {
    console.error("Batch insert failed:", err)
  }
}

function scheduleFlush() {
  if (process.env.VERCEL) return
  if (batchTimer) return
  batchTimer = setTimeout(() => {
    batchTimer = null
    flushBatch()
  }, 5000)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    let vehicleId: string
    let identifier: string

    if (body.uniqueId) {
      const data = deviceLocationSchema.parse(body)
      identifier = `device:${data.uniqueId}`
      const vehicle = await prisma.vehicle.findUnique({
        where: { uniqueId: data.uniqueId },
      })
      if (!vehicle) {
        return Response.json(
          { error: "Vehicle not found", code: "NOT_FOUND" },
          { status: 404 }
        )
      }
      vehicleId = vehicle.id
    } else {
      const session = await getServerSession(authOptions)
      if (!session?.user?.id) {
        return Response.json(
          { error: "Unauthorized", code: "UNAUTHORIZED" },
          { status: 401 }
        )
      }
      identifier = `user:${session.user.id}`
      const data = locationSchema.parse(body)
      const vehicle = await prisma.vehicle.findFirst({
        where: { id: data.vehicleId, userId: session.user.id },
      })
      if (!vehicle) {
        return Response.json(
          { error: "Vehicle not found", code: "NOT_FOUND" },
          { status: 404 }
        )
      }
      vehicleId = vehicle.id
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: { user: true },
    })
    if (!vehicle) {
      return Response.json({ error: "Vehicle not found" }, { status: 404 })
    }

    const userId = vehicle.userId

    const rateLimit = await checkRateLimit(identifier, "locations", {
      interval: 3000,
      maxRequests: 1,
    })

    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetAt)
    }

    const batchEntry = {
      vehicleId,
      lat: body.lat,
      lng: body.lng,
      speed: body.speed ?? null,
      heading: body.heading ?? null,
      accuracy: body.accuracy ?? null,
      battery: body.battery ?? null,
    }

    if (process.env.VERCEL) {
      await prisma.location.create({ data: batchEntry })
    } else {
      LOCATION_BATCH.push(batchEntry)
      scheduleFlush()
    }

    const locationEntry = {
      vehicleId,
      lat: body.lat,
      lng: body.lng,
      speed: body.speed ?? null,
      heading: body.heading ?? null,
      accuracy: body.accuracy ?? null,
      battery: body.battery ?? null,
      timestamp: new Date().toISOString(),
    }

    if (supabase) {
      await supabase.channel("locations").send({
        type: "broadcast",
        event: "location_update",
        payload: {
          vehicleId,
          location: locationEntry,
        },
      })
    }

    processEvents(vehicle, body).catch(() => {})

    return Response.json(locationEntry, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        {
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          details: error.errors,
        },
        { status: 400 }
      )
    }
    return Response.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return Response.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      )
    }

    const url = new URL(req.url)
    const vehicleId = url.searchParams.get("vehicleId")
    const replay = url.searchParams.get("replay") === "true"
    const limit = replay
      ? Math.min(Number(url.searchParams.get("limit")) || 2000, 5000)
      : Math.min(Number(url.searchParams.get("limit")) || 100, 1000)
    const before = url.searchParams.get("before")
    const after = url.searchParams.get("after")
    const cursor = url.searchParams.get("cursor")

    const now = new Date()
    const maxAge = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const where: Record<string, unknown> = {
      vehicle: { userId: session.user.id },
      timestamp: { gte: maxAge },
    }

    if (vehicleId) where.vehicleId = vehicleId

    if (after) {
      const afterDate = new Date(after)
      if (afterDate < maxAge) {
        return Response.json(
          { error: "Date range exceeds 7-day limit", code: "RANGE_TOO_LARGE" },
          { status: 400 }
        )
      }
      where.timestamp = {
        ...(where.timestamp as Record<string, unknown>),
        gte: afterDate,
      }
    }

    if (before) {
      where.timestamp = {
        ...(where.timestamp as Record<string, unknown>),
        lt: new Date(before),
      }
    }

    if (cursor) {
      const cursorLoc = await prisma.location.findUnique({
        where: { id: cursor },
        select: { timestamp: true },
      })
      if (cursorLoc) {
        where.timestamp = {
          ...(where.timestamp as Record<string, unknown>),
          lt: cursorLoc.timestamp,
        }
      }
    }

    const orderBy = replay
      ? { timestamp: "asc" as const }
      : { timestamp: "desc" as const }

    const locations = await prisma.location.findMany({
      where,
      orderBy,
      take: limit,
    })

    const hasMore = locations.length === limit

    let route: [number, number][]
    let distance = 0

    if (replay && locations.length > 1) {
      const coords = locations.map((l) => [l.lng, l.lat] as [number, number])
      const matched = await matchRoute(coords)
      if (matched) {
        route = matched.coords
        distance = matched.distance
      } else {
        distance = calculateDistance(coords)
        route = smoothRoute(coords, 12)
      }
    } else {
      route = []
    }

    return Response.json({ locations, hasMore, route, distance })
  } catch {
    return Response.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    )
  }
}

async function processEvents(
  vehicle: { id: string; name: string; userId: string; speedLimit?: number | null },
  body: { lat: number; lng: number; speed?: number | null }
) {
  const geofences = await prisma.geofence.findMany({ where: { userId: vehicle.userId } })
  const lastLoc = await prisma.location.findFirst({
    where: { vehicleId: vehicle.id },
    orderBy: { timestamp: "desc" },
    skip: 1,
  })

  const point = { lat: body.lat, lng: body.lng }
  const speed = body.speed ?? 0
  const now = new Date()

  for (const gf of geofences) {
    const inside = checkGeofence(point, gf.type, gf.vertices as any[], gf.radius)
    const lastCheck = lastLoc ? checkGeofence(
      { lat: lastLoc.lat, lng: lastLoc.lng },
      gf.type,
      gf.vertices as any[],
      gf.radius
    ) : false

    if (inside && !lastCheck) {
      await prisma.event.create({
        data: {
          userId: vehicle.userId,
          vehicleId: vehicle.id,
          geofenceId: gf.id,
          type: "geofence_enter",
          message: generateEventMessage("geofence_enter", vehicle.name, gf.name),
          attributes: { lat: body.lat, lng: body.lng },
          timestamp: now,
        },
      })
    } else if (!inside && lastCheck) {
      await prisma.event.create({
        data: {
          userId: vehicle.userId,
          vehicleId: vehicle.id,
          geofenceId: gf.id,
          type: "geofence_exit",
          message: generateEventMessage("geofence_exit", vehicle.name, gf.name),
          attributes: { lat: body.lat, lng: body.lng },
          timestamp: now,
        },
      })
    }
  }

  if (vehicle.speedLimit && speed > vehicle.speedLimit) {
    await prisma.event.create({
      data: {
        userId: vehicle.userId,
        vehicleId: vehicle.id,
        type: "speed_exceed",
        message: generateEventMessage("speed_exceed", vehicle.name),
        attributes: { speed, limit: vehicle.speedLimit },
        timestamp: now,
      },
    })
  }

  if (lastLoc) {
    const wasMoving = (lastLoc.speed ?? 0) > 0.5
    const isMoving = speed > 0.5

    if (isMoving && !wasMoving) {
      await prisma.event.create({
        data: {
          userId: vehicle.userId,
          vehicleId: vehicle.id,
          type: "device_moving",
          message: generateEventMessage("device_moving", vehicle.name),
          attributes: { lat: body.lat, lng: body.lng, speed },
          timestamp: now,
        },
      })
    } else if (!isMoving && wasMoving) {
      await prisma.event.create({
        data: {
          userId: vehicle.userId,
          vehicleId: vehicle.id,
          type: "device_stopped",
          message: generateEventMessage("device_stopped", vehicle.name),
          attributes: { lat: body.lat, lng: body.lng },
          timestamp: now,
        },
      })
    }
  }
}
