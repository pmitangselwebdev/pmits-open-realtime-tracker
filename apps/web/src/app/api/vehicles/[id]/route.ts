import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { vehicleSchema } from "shared"
import { ZodError } from "zod"

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 })
  }

  const vehicle = await prisma.vehicle.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: {
      locations: {
        orderBy: { timestamp: "desc" },
        take: 1,
      },
    },
  })

  if (!vehicle) {
    return Response.json({ error: "Vehicle not found", code: "NOT_FOUND" }, { status: 404 })
  }

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
  const { locations, ...rest } = vehicle

  return Response.json({
    ...rest,
    latestLocation: locations[0] ?? null,
    online: locations[0]
      ? new Date(locations[0].timestamp) > fiveMinutesAgo
      : false,
  })
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 })
    }

    const existing = await prisma.vehicle.findFirst({
      where: { id: params.id, userId: session.user.id },
    })
    if (!existing) {
      return Response.json({ error: "Vehicle not found", code: "NOT_FOUND" }, { status: 404 })
    }

    const body = await req.json()
    const data = vehicleSchema.partial().parse(body)

    if (data.uniqueId && data.uniqueId !== existing.uniqueId) {
      const dup = await prisma.vehicle.findUnique({ where: { uniqueId: data.uniqueId } })
      if (dup) {
        return Response.json(
          { error: "Unique ID already in use", code: "DUPLICATE_UNIQUE_ID" },
          { status: 409 }
        )
      }
    }

    const vehicle = await prisma.vehicle.update({
      where: { id: params.id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.plate && { plate: data.plate }),
        ...(data.uniqueId && { uniqueId: data.uniqueId }),
        ...(data.icon !== undefined && { icon: data.icon }),
        ...(data.color !== undefined && { color: data.color }),
      },
    })

    return Response.json(vehicle)
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: "Validation failed", code: "VALIDATION_ERROR", details: error.errors },
        { status: 400 }
      )
    }
    return Response.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 })
  }

  const vehicle = await prisma.vehicle.findFirst({
    where: { id: params.id, userId: session.user.id },
  })
  if (!vehicle) {
    return Response.json({ error: "Vehicle not found", code: "NOT_FOUND" }, { status: 404 })
  }

  await prisma.vehicle.delete({ where: { id: params.id } })
  return Response.json({ success: true })
}
