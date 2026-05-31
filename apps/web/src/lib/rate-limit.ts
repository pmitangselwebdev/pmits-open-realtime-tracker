import { withRedis } from "./redis"

interface RateLimitConfig {
  interval: number
  maxRequests: number
}

const inMemory = new Map<string, { count: number; resetAt: number }>()

function getKey(identifier: string, route: string): string {
  return `ratelimit:${route}:${identifier}`
}

export async function checkRateLimit(
  identifier: string,
  route: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = Date.now()
  const key = getKey(identifier, route)

  const result = await withRedis(
    async (kv) => {
      const windowKey = `${key}:${Math.floor(now / config.interval)}`
      const count = await kv.incr(windowKey)
      if (count === 1) {
        await kv.pexpire(windowKey, config.interval)
      }
      const ttl = await kv.pttl(windowKey)
      const resetAt = now + Math.max(ttl, 0)
      return {
        allowed: count <= config.maxRequests,
        remaining: Math.max(config.maxRequests - count, 0),
        resetAt,
      }
    },
    null
  )

  if (result) return result

  let entry = inMemory.get(key)
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + config.interval }
    inMemory.set(key, entry)
  }

  entry.count++
  return {
    allowed: entry.count <= config.maxRequests,
    remaining: Math.max(config.maxRequests - entry.count, 0),
    resetAt: entry.resetAt,
  }
}

export function rateLimitResponse(resetAt: number) {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000)
  return Response.json(
    {
      error: "Too many requests",
      code: "RATE_LIMITED",
      retryAfter,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Reset": String(resetAt),
      },
    }
  )
}
