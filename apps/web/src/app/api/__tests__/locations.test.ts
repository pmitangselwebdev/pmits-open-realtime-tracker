import { describe, it, expect, vi, beforeEach } from "vitest"

const mockPrisma = vi.hoisted(() => ({
  vehicle: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
  },
  location: {
    create: vi.fn(),
    createMany: vi.fn(),
    findMany: vi.fn(),
  },
}))

const mockSupabase = vi.hoisted(() => ({
  channel: vi.fn(() => ({
    send: vi.fn(),
  })),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}))

vi.mock("@/lib/supabase", () => ({
  supabase: mockSupabase,
}))

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}))

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}))

import { GET, POST } from "../locations/route"
import type { Mock } from "vitest"

beforeEach(() => {
  vi.clearAllMocks()
  ;(mockPrisma.vehicle.findUnique as Mock).mockResolvedValue({
    id: "vehicle-1",
    uniqueId: "TRK-TEST",
  })
  ;(mockPrisma.vehicle.findFirst as Mock).mockResolvedValue({
    id: "vehicle-1",
    userId: "user-1",
  })
  ;(mockPrisma.location.findMany as Mock).mockResolvedValue([
    {
      id: "loc-1",
      vehicleId: "vehicle-1",
      lat: -6.2,
      lng: 106.8,
      speed: 50,
      heading: 180,
      accuracy: 10,
      battery: null,
      timestamp: new Date(),
    },
  ])
})

describe("POST /api/locations", () => {
  it("accepts device mode (uniqueId)", async () => {
    const req = new Request("http://localhost:3000/api/locations", {
      method: "POST",
      body: JSON.stringify({
        uniqueId: "TRK-TEST",
        lat: -6.2,
        lng: 106.8,
        speed: 50,
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(201)
  })

  it("rejects invalid lat", async () => {
    const req = new Request("http://localhost:3000/api/locations", {
      method: "POST",
      body: JSON.stringify({
        uniqueId: "TRK-TEST",
        lat: 100,
        lng: 106.8,
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("returns 404 for unknown uniqueId", async () => {
    ;(mockPrisma.vehicle.findUnique as Mock).mockResolvedValue(null)

    const req = new Request("http://localhost:3000/api/locations", {
      method: "POST",
      body: JSON.stringify({
        uniqueId: "TRK-UNKNOWN",
        lat: -6.2,
        lng: 106.8,
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(404)
  })
})

describe("GET /api/locations", () => {
  it("requires authentication", async () => {
    const { getServerSession } = await import("next-auth")
    ;(getServerSession as Mock).mockResolvedValue(null)

    const req = new Request("http://localhost:3000/api/locations")
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it("returns locations for authenticated user", async () => {
    const { getServerSession } = await import("next-auth")
    ;(getServerSession as Mock).mockResolvedValue({
      user: { id: "user-1", email: "test@test.com" },
    })

    const req = new Request(
      "http://localhost:3000/api/locations?vehicleId=vehicle-1&limit=10"
    )
    const res = await GET(req)
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(Array.isArray(body.locations)).toBe(true)
    expect(body.locations.length).toBe(1)
    expect(body.hasMore).toBe(false)
  })
})
