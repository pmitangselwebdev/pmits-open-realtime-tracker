import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { vehicleSchema } from "shared"
import { ZodError } from "zod"

function generateUniqueId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let result = "TRK-"
  for (let i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 })
  }

  const vehicles = await prisma.vehicle.findMany({
    where: { userId: session.user.id },
    include: {
      locations: {
        orderBy: { timestamp: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const onlineThreshold = new Date(Date.now() - 3 * 60 * 1000)

  const result = vehicles.map(({ locations, ...rest }) => ({
    ...rest,
    latestLocation: locations[0] ?? null,
    online: locations[0]
      ? new Date(locations[0].timestamp) > onlineThreshold
      : false,
  }))

  return Response.json(result)
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 })
    }

    const body = await req.json()
    const data = vehicleSchema.parse(body)
    const uniqueId = data.uniqueId || generateUniqueId()

    const existing = await prisma.vehicle.findUnique({ where: { uniqueId } })
    if (existing) {
      return Response.json(
        { error: "Unique ID already in use", code: "DUPLICATE_UNIQUE_ID" },
        { status: 409 }
      )
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        name: data.name,
        plate: data.plate,
        uniqueId,
        userId: session.user.id,
        icon: data.icon ?? null,
        color: data.color ?? "#3b82f6",
      },
    })

    return Response.json(vehicle, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: "Validation failed", code: "VALIDATION_ERROR", details: error.errors },
        { status: 400 }
      )
    }
    console.error("POST /api/vehicles error:", error)
    return Response.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    )
  }
}
