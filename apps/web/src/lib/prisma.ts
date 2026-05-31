import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrisma() {
  const url = process.env.DATABASE_URL
  const isServerless = process.env.VERCEL === "1"
  const connectionUrl = isServerless && url && !url.includes("?")
    ? `${url}?pgbouncer=true&connection_limit=1&pool_timeout=10`
    : url

  return new PrismaClient({
    datasources: connectionUrl ? { db: { url: connectionUrl } } : undefined,
  })
}

export const prisma = globalForPrisma.prisma ?? createPrisma()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
