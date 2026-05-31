import { Redis } from "ioredis"

const globalForRedis = globalThis as unknown as { redis: Redis | null }

function createRedis() {
  const url = process.env.REDIS_URL
  if (!url) {
    console.warn("REDIS_URL not set — Redis features disabled")
    return null
  }
  const client = new Redis(url, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      if (times > 3) return null
      return Math.min(times * 200, 2000)
    },
    lazyConnect: true,
  })

  client.on("error", (_err) => {
    console.warn("Redis connection error")
  })

  return client
}

export const redis = globalForRedis.redis ?? createRedis()

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis

export async function withRedis<T>(
  fn: (client: Redis) => Promise<T>,
  fallback: T
): Promise<T> {
  if (!redis) return fallback
  try {
    return await fn(redis)
  } catch {
    return fallback
  }
}
