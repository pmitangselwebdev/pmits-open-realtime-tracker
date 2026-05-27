import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const password = await hash("password123", 12)

  const user = await prisma.user.upsert({
    where: { email: "demo@tracker.io" },
    update: {},
    create: {
      email: "demo@tracker.io",
      name: "Demo User",
      password,
      vehicles: {
        create: [
          {
            name: "Honda Civic",
            plate: "B 1234 XYZ",
            uniqueId: "TRK-A7X3K9",
            color: "#3b82f6",
            locations: {
              create: generateLocations(
                -6.2088, 106.845, 30,
                new Date(Date.now() - 30 * 60 * 1000)
              ),
            },
          },
          {
            name: "Mitsubishi Colt Truck",
            plate: "B 5678 ABC",
            uniqueId: "TRK-M2P5R7",
            color: "#22c55e",
            locations: {
              create: generateLocations(
                -6.3088, 106.945, 20,
                new Date(Date.now() - 20 * 60 * 1000)
              ),
            },
          },
          {
            name: "Toyota Fortuner",
            plate: "B 9012 DEF",
            uniqueId: "TRK-J8W4N1",
            color: "#a855f7",
            locations: {
              create: generateLocations(
                -6.1088, 106.745, 15,
                new Date(Date.now() - 45 * 60 * 1000)
              ),
            },
          },
          {
            name: "Yamaha NMAX",
            plate: "B 3456 GHI",
            uniqueId: "TRK-B9X6Q2",
            color: "#f59e0b",
            locations: {
              create: generateLocations(
                -6.1588, 106.895, 25,
                new Date(Date.now() - 15 * 60 * 1000)
              ),
            },
          },
          {
            name: "Toyota Hiace Van",
            plate: "B 7890 JKL",
            uniqueId: "TRK-D4K8C5",
            color: "#ef4444",
            locations: {
              create: generateLocations(
                -6.2588, 106.785, 18,
                new Date(Date.now() - 10 * 60 * 1000)
              ),
            },
          },
        ],
      },
    },
    include: { vehicles: true },
  })

  console.log(`Seeded user: ${user.email} with ${user.vehicles.length} vehicles`)
}

function generateLocations(
  baseLat: number,
  baseLng: number,
  count: number,
  startTime: Date
) {
  return Array.from({ length: count }, (_, i) => ({
    lat: baseLat + (Math.random() - 0.5) * 0.01,
    lng: baseLng + (Math.random() - 0.5) * 0.01,
    speed: Math.round(Math.random() * 60),
    heading: Math.round(Math.random() * 360),
    battery: Math.round(Math.random() * 100),
    accuracy: Math.round(5 + Math.random() * 15),
    timestamp: new Date(startTime.getTime() + i * 60 * 1000),
  }))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
