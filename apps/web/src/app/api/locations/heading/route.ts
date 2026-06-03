import { prisma } from "@/lib/prisma"
import { supabase } from "@/lib/supabase"

export async function POST(req: Request) {
  try {
    const { uniqueId, heading } = await req.json()

    if (!uniqueId || heading == null) {
      return Response.json(
        { error: "uniqueId and heading required", code: "VALIDATION_ERROR" },
        { status: 400 }
      )
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { uniqueId },
      select: { id: true },
    })

    if (!vehicle) {
      return Response.json(
        { error: "Vehicle not found", code: "NOT_FOUND" },
        { status: 404 }
      )
    }

    if (supabase) {
      try {
        await supabase.channel("locations").send({
          type: "broadcast",
          event: "heading_update",
          payload: { vehicleId: vehicle.id, heading },
        })
      } catch {}
    }

    return Response.json({ ok: true })
  } catch {
    return Response.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    )
  }
}
