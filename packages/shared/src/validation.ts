import { z } from "zod"

export const locationSchema = z.object({
  vehicleId: z.string().cuid(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  speed: z.number().min(0).max(500).optional().nullable(),
  heading: z.number().min(0).max(360).optional().nullable(),
  accuracy: z.number().min(0).optional().nullable(),
  battery: z.number().min(0).max(100).optional().nullable(),
})

export const deviceLocationSchema = z.object({
  uniqueId: z.string().min(1).max(50),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  speed: z.number().min(0).max(500).optional().nullable(),
  heading: z.number().min(0).max(360).optional().nullable(),
  accuracy: z.number().min(0).optional().nullable(),
  battery: z.number().min(0).max(100).optional().nullable(),
})

export const vehicleSchema = z.object({
  name: z.string().min(1).max(50),
  plate: z.string().min(1).max(15),
  uniqueId: z.string().min(3).max(50).optional(),
  icon: z.string().optional().nullable(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional()
    .nullable(),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const registerSchema = z.object({
  name: z.string().min(1).max(50),
  email: z.string().email(),
  password: z.string().min(6),
})
