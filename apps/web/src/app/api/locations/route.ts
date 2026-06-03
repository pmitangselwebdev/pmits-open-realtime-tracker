import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { supabase } from "@/lib/supabase"
import { locationSchema, deviceLocationSchema } from "shared"
import { ZodError } from "zod"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { calculateDistance } from "@/lib/geo"

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

    let distance = 0
    if (replay && locations.length > 1) {
      const coords = locations.map((l) => [l.lng, l.lat] as [number, number])
      distance = calculateDistance(coords)
    }

    return Response.json({ locations, hasMore, distance })
  } catch {
    return Response.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    )
  }
}
