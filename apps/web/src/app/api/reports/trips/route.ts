import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { detectTrips } from "@/lib/trips"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = new URL(req.url)
  const vehicleId = url.searchParams.get("vehicleId")
  const after = url.searchParams.get("after")
  const before = url.searchParams.get("before")
  const format = url.searchParams.get("format")

  if (!vehicleId) {
    return Response.json({ error: "vehicleId required" }, { status: 400 })
  }

  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, userId: session.user.id },
  })
  if (!vehicle) {
    return Response.json({ error: "Vehicle not found" }, { status: 404 })
  }

  const now = new Date()
  const maxAge = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const where: Record<string, unknown> = {
    vehicleId,
    timestamp: { gte: maxAge },
  }

  if (after) where.timestamp = { ...(where.timestamp as object), gte: new Date(after) }
  if (before) where.timestamp = { ...(where.timestamp as object), lt: new Date(before) }

  const locations = await prisma.location.findMany({
    where,
    orderBy: { timestamp: "asc" },
    take: 10000,
  })

  const points = locations.map((l) => ({
    lat: l.lat,
    lng: l.lng,
    speed: l.speed ?? 0,
    timestamp: l.timestamp,
  }))

  const trips = detectTrips(points)

  if (format === "csv") {
    const header = "Start Time,End Time,Duration (s),Distance (km),Avg Speed,Max Speed,Start Lat,Start Lng,End Lat,End Lng"
    const rows = trips.map(
      (t) =>
        `${t.startTime.toISOString()},${t.endTime.toISOString()},${t.duration},${t.distance},${t.avgSpeed},${t.maxSpeed},${t.startLat},${t.startLng},${t.endLat},${t.endLng}`
    )
    return new Response([header, ...rows].join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="trips-${vehicleId}.csv"`,
      },
    })
  }

  return Response.json(trips)
}
