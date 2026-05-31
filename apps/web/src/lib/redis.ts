const globalForKv = globalThis as unknown as { kv: import("@vercel/kv").VercelKV | null }

function createKv() {
  try {
    const { createClient } = require("@vercel/kv")
    const url = process.env.KV_URL || process.env.REDIS_URL
    if (!url) return null
    return createClient({ url })
  } catch {
    return null
  }
}

export const kv = globalForKv.kv ?? createKv()

if (process.env.NODE_ENV !== "production") globalForKv.kv = kv

export async function withRedis<T>(
  fn: (client: NonNullable<typeof kv>) => Promise<T>,
  fallback: T
): Promise<T> {
  if (!kv) return fallback
  try {
    return await fn(kv)
  } catch {
    return fallback
  }
}
