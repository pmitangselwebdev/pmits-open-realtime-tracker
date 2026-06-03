import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const geofences = await prisma.geofence.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  })

  return Response.json(geofences)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { name, type, vertices, radius, color } = body

  if (!name || !type || !vertices?.length) {
    return Response.json({ error: "Name, type, and vertices required" }, { status: 400 })
  }

  const geofence = await prisma.geofence.create({
    data: {
      name,
      type,
      vertices,
      radius: radius ?? null,
      color: color ?? "#3b82f6",
      userId: session.user.id,
    },
  })

  return Response.json(geofence, { status: 201 })
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { id, name, type, vertices, radius, color } = body

  if (!id) {
    return Response.json({ error: "ID required" }, { status: 400 })
  }

  const existing = await prisma.geofence.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!existing) {
    return Response.json({ error: "Geofence not found" }, { status: 404 })
  }

  const geofence = await prisma.geofence.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(type && { type }),
      ...(vertices && { vertices }),
      ...(radius !== undefined && { radius }),
      ...(color && { color }),
    },
  })

  return Response.json(geofence)
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = new URL(req.url)
  const id = url.searchParams.get("id")

  if (!id) {
    return Response.json({ error: "ID required" }, { status: 400 })
  }

  const existing = await prisma.geofence.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!existing) {
    return Response.json({ error: "Geofence not found" }, { status: 404 })
  }

  await prisma.geofence.delete({ where: { id } })
  return Response.json({ success: true })
}
