import { describe, it, expect } from "vitest"
import {
  locationSchema,
  deviceLocationSchema,
  vehicleSchema,
  loginSchema,
  registerSchema,
} from "./validation"

describe("locationSchema", () => {
  const validLocation = {
    vehicleId: "clxabc123def456",
    lat: -6.2088,
    lng: 106.8456,
    speed: 45.5,
    heading: 180,
    accuracy: 10,
  }

  it("accepts valid location data", () => {
    const result = locationSchema.safeParse(validLocation)
    expect(result.success).toBe(true)
  })

  it("rejects lat out of range", () => {
    const result = locationSchema.safeParse({ ...validLocation, lat: 100 })
    expect(result.success).toBe(false)
  })

  it("rejects lng out of range", () => {
    const result = locationSchema.safeParse({ ...validLocation, lng: 200 })
    expect(result.success).toBe(false)
  })

  it("rejects speed < 0", () => {
    const result = locationSchema.safeParse({ ...validLocation, speed: -1 })
    expect(result.success).toBe(false)
  })

  it("rejects speed > 500", () => {
    const result = locationSchema.safeParse({ ...validLocation, speed: 600 })
    expect(result.success).toBe(false)
  })

  it("rejects heading > 360", () => {
    const result = locationSchema.safeParse({ ...validLocation, heading: 400 })
    expect(result.success).toBe(false)
  })

  it("accepts optional fields as undefined", () => {
    const { speed, heading, accuracy, ...required } = validLocation
    const result = locationSchema.safeParse(required)
    expect(result.success).toBe(true)
    expect(result.data?.speed).toBeUndefined()
  })

  it("rejects missing vehicleId", () => {
    const { vehicleId, ...rest } = validLocation
    const result = locationSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })
})

describe("deviceLocationSchema", () => {
  const validDeviceLocation = {
    uniqueId: "TRK-A7X3K9",
    lat: -6.2088,
    lng: 106.8456,
    speed: 50,
  }

  it("accepts valid device location", () => {
    const result = deviceLocationSchema.safeParse(validDeviceLocation)
    expect(result.success).toBe(true)
  })

  it("rejects empty uniqueId", () => {
    const result = deviceLocationSchema.safeParse({
      ...validDeviceLocation,
      uniqueId: "",
    })
    expect(result.success).toBe(false)
  })

  it("rejects long uniqueId", () => {
    const result = deviceLocationSchema.safeParse({
      ...validDeviceLocation,
      uniqueId: "A".repeat(51),
    })
    expect(result.success).toBe(false)
  })
})

describe("vehicleSchema", () => {
  it("accepts valid vehicle data", () => {
    const result = vehicleSchema.safeParse({
      name: "Honda Civic",
      plate: "B 1234 XYZ",
      color: "#3b82f6",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty name", () => {
    const result = vehicleSchema.safeParse({
      name: "",
      plate: "B 1234 XYZ",
    })
    expect(result.success).toBe(false)
  })

  it("rejects name over 50 chars", () => {
    const result = vehicleSchema.safeParse({
      name: "A".repeat(51),
      plate: "B 1234 XYZ",
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid hex color", () => {
    const result = vehicleSchema.safeParse({
      name: "Civic",
      plate: "B 1234 XYZ",
      color: "not-a-color",
    })
    expect(result.success).toBe(false)
  })

  it("accepts missing optional color", () => {
    const result = vehicleSchema.safeParse({
      name: "Civic",
      plate: "B 1234 XYZ",
    })
    expect(result.success).toBe(true)
  })
})

describe("loginSchema", () => {
  it("accepts valid login", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "password123",
    })
    expect(result.success).toBe(true)
  })

  it("rejects short password", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "12",
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    })
    expect(result.success).toBe(false)
  })
})

describe("registerSchema", () => {
  it("accepts valid registration", () => {
    const result = registerSchema.safeParse({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty name", () => {
    const result = registerSchema.safeParse({
      name: "",
      email: "test@example.com",
      password: "password123",
    })
    expect(result.success).toBe(false)
  })
})
