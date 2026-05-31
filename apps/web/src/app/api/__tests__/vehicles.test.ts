import { describe, it, expect, vi, beforeEach } from "vitest"

const mockPrisma = vi.hoisted(() => ({
  vehicle: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}))

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}))

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}))

vi.mock("shared", () => ({
  vehicleSchema: {
    parse: (data: any) => data,
  },
}))

import { GET, POST } from "../vehicles/route"
import { GET as getVehicle, DELETE } from "../vehicles/[id]/route"
import type { Mock } from "vitest"

beforeEach(() => {
  vi.clearAllMocks()

  const mockVehicle = {
    id: "v1",
    name: "Test Car",
    plate: "B 1234 XYZ",
    uniqueId: "TRK-TEST",
    userId: "user-1",
    icon: null,
    color: "#3b82f6",
    createdAt: new Date(),
    locations: [
      {
        id: "loc-1",
        lat: -6.2,
        lng: 106.8,
        speed: 50,
        heading: 180,
        timestamp: new Date(),
      },
    ],
  }

  ;(mockPrisma.vehicle.findMany as Mock).mockResolvedValue([mockVehicle])
  ;(mockPrisma.vehicle.findFirst as Mock).mockResolvedValue(mockVehicle)
  ;(mockPrisma.vehicle.findUnique as Mock).mockResolvedValue(null)
  ;(mockPrisma.vehicle.create as Mock).mockResolvedValue({
    id: "v1",
    name: "Test Car",
    plate: "B 1234 XYZ",
    uniqueId: "TRK-TEST",
    userId: "user-1",
    icon: null,
    color: "#3b82f6",
    createdAt: new Date(),
  })
  ;(mockPrisma.vehicle.delete as Mock).mockResolvedValue({ id: "v1" })
})

describe("GET /api/vehicles", () => {
  it("requires authentication", async () => {
    const { getServerSession } = await import("next-auth")
    ;(getServerSession as Mock).mockResolvedValue(null)

    const res = await GET()
    expect(res.status).toBe(401)
  })

  it("returns vehicles for authenticated user", async () => {
    const { getServerSession } = await import("next-auth")
    ;(getServerSession as Mock).mockResolvedValue({
      user: { id: "user-1" },
    })

    const res = await GET()
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body[0].name).toBe("Test Car")
    expect(body[0].online).toBeDefined()
  })
})

describe("POST /api/vehicles", () => {
  it("creates a vehicle", async () => {
    const { getServerSession } = await import("next-auth")
    ;(getServerSession as Mock).mockResolvedValue({
      user: { id: "user-1" },
    })

    const req = new Request("http://localhost:3000/api/vehicles", {
      method: "POST",
      body: JSON.stringify({
        name: "Honda Civic",
        plate: "B 9999 XYZ",
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(201)

    const body = await res.json()
    expect(body.name).toBe("Test Car")
  })
})

describe("GET /api/vehicles/[id]", () => {
  it("returns a single vehicle", async () => {
    const { getServerSession } = await import("next-auth")
    ;(getServerSession as Mock).mockResolvedValue({
      user: { id: "user-1" },
    })

    const req = new Request("http://localhost:3000/api/vehicles/v1")
    const res = await getVehicle(req, { params: { id: "v1" } })
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.name).toBe("Test Car")
  })
})

describe("DELETE /api/vehicles/[id]", () => {
  it("deletes a vehicle", async () => {
    const { getServerSession } = await import("next-auth")
    ;(getServerSession as Mock).mockResolvedValue({
      user: { id: "user-1" },
    })

    const req = new Request("http://localhost:3000/api/vehicles/v1", {
      method: "DELETE",
    })

    const res = await DELETE(req, { params: { id: "v1" } })
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.success).toBe(true)
  })
})
