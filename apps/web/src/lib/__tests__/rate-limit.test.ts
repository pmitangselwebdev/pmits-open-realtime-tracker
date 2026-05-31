import { describe, it, expect } from "vitest"
import { checkRateLimit, rateLimitResponse } from "../rate-limit"

describe("checkRateLimit", () => {
  it("allows first request", async () => {
    const result = await checkRateLimit("test-device", "locations", {
      interval: 3000,
      maxRequests: 1,
    })

    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(0)
  })

  it("blocks second request within interval", async () => {
    const config = { interval: 3000, maxRequests: 1 }

    const first = await checkRateLimit("device-2", "locations", config)
    expect(first.allowed).toBe(true)

    const second = await checkRateLimit("device-2", "locations", config)
    expect(second.allowed).toBe(false)
    expect(second.remaining).toBe(0)
  })

  it("allows request after interval passes", async () => {
    const config = { interval: 100, maxRequests: 1 }

    const first = await checkRateLimit("device-3", "locations", config)
    expect(first.allowed).toBe(true)

    await new Promise((r) => setTimeout(r, 150))

    const second = await checkRateLimit("device-3", "locations", config)
    expect(second.allowed).toBe(true)
  })

  it("separates different identifiers", async () => {
    const config = { interval: 3000, maxRequests: 1 }

    const a = await checkRateLimit("device-a", "locations", config)
    const b = await checkRateLimit("device-b", "locations", config)

    expect(a.allowed).toBe(true)
    expect(b.allowed).toBe(true)
  })
})

describe("rateLimitResponse", () => {
  it("returns 429 with retry headers", () => {
    const future = Date.now() + 5000
    const res = rateLimitResponse(future)

    expect(res.status).toBe(429)
    expect(res.headers.get("Retry-After")).toBe("5")
    expect(res.headers.get("X-RateLimit-Reset")).toBe(String(future))
  })
})
