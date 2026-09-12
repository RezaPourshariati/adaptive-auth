import { z } from 'zod'

export const loginBodySchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
})

export const businessPatchSchema = z.object({
  name: z.string().min(1).max(80),
  phone: z.string().min(1).max(40),
  email: z.string().trim().email(),
  addressLine: z.string().min(1).max(120),
  city: z.string().min(1).max(80),
  region: z.string().min(1).max(40),
  postalCode: z.string().min(1).max(20),
  country: z.string().min(1).max(80),
  cancelNoticeHours: z.number().int(),
  contactInstructions: z.string().max(500),
  depositPercent: z.number().int(),
})

export const hoursDaySchema = z.object({
  weekday: z.number().int().min(0).max(6),
  closed: z.boolean(),
  startLocal: z.string(),
  endLocal: z.string(),
})

export const hoursPutSchema = z.object({
  days: z.array(hoursDaySchema).length(7),
})

export const serviceBodySchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(400).default(''),
  durationMinutes: z.number().int(),
  priceDollars: z.number(),
  active: z.boolean(),
})

export const staffBodySchema = z.object({
  name: z.string().min(1).max(80),
  specialty: z.string().max(80).nullable(),
  active: z.boolean(),
  serviceIds: z.array(z.string().uuid()),
})
