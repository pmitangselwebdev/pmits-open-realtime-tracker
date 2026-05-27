import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { supabase } from "@/lib/supabase"
import { locationSchema, deviceLocationSchema } from "shared"
import { ZodError } from "zod"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    let vehicleId: string

    if (body.uniqueId) {
      const data = deviceLocationSchema.parse(body)
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

    const location = await prisma.location.create({
      data: {
        vehicleId,
        lat: body.lat,
        lng: body.lng,
        speed: body.speed ?? null,
        heading: body.heading ?? null,
        accuracy: body.accuracy ?? null,
        battery: body.battery ?? null,
      },
    })

    if (supabase) {
      await supabase.channel("locations").send({
        type: "broadcast",
        event: "location_update",
        payload: {
          vehicleId,
          location: {
            id: location.id,
            vehicleId: location.vehicleId,
            lat: location.lat,
            lng: location.lng,
            speed: location.speed,
            heading: location.heading,
            accuracy: location.accuracy,
            battery: location.battery,
            timestamp: location.timestamp.toISOString(),
          },
        },
      })
    }

    return Response.json(location, { status: 201 })
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
    const limit = Math.min(Number(url.searchParams.get("limit")) || 100, 1000)
    const before = url.searchParams.get("before")

    const where: Record<string, unknown> = {
      vehicle: { userId: session.user.id },
    }

    if (vehicleId) where.vehicleId = vehicleId
    if (before) where.timestamp = { lt: new Date(before) }

    const locations = await prisma.location.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: limit,
    })

    return Response.json(locations)
  } catch {
    return Response.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    )
  }
}
