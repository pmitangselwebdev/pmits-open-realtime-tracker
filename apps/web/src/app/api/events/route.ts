import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = new URL(req.url)
  const vehicleId = url.searchParams.get("vehicleId")
  const type = url.searchParams.get("type")
  const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 200)

  const where: Record<string, unknown> = { userId: session.user.id }

  if (vehicleId) where.vehicleId = vehicleId
  if (type) where.type = type

  const events = await prisma.event.findMany({
    where,
    orderBy: { timestamp: "desc" },
    take: limit,
    include: {
      vehicle: { select: { name: true, plate: true } },
      geofence: { select: { name: true } },
    },
  })

  return Response.json(events)
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = new URL(req.url)
  const id = url.searchParams.get("id")

  if (id) {
    const event = await prisma.event.findFirst({
      where: { id, userId: session.user.id },
    })
    if (!event) {
      return Response.json({ error: "Event not found" }, { status: 404 })
    }
    await prisma.event.delete({ where: { id } })
  } else {
    await prisma.event.deleteMany({
      where: { userId: session.user.id },
    })
  }

  return Response.json({ success: true })
}
