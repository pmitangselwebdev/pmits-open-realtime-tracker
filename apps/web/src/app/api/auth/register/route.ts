import { hash } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { registerSchema } from "shared"
import { ZodError } from "zod"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = registerSchema.parse(body)

    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (existing) {
      return Response.json(
        { error: "Email already registered", code: "EMAIL_EXISTS" },
        { status: 409 }
      )
    }

    const hashedPassword = await hash(data.password, 12)

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
      },
      select: { id: true, name: true, email: true },
    })

    return Response.json(user, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: "Validation failed", code: "VALIDATION_ERROR", details: error.errors },
        { status: 400 }
      )
    }

    return Response.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    )
  }
}
