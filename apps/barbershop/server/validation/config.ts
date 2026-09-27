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

export const availabilityQuerySchema = z.object({
  localDate: z.string(),
  serviceIds: z.preprocess((value) => {
    if (typeof value === 'string' && value.includes(','))
      return value.split(',').map(item => item.trim())
    return value
  }, z.union([z.string().uuid(), z.array(z.string().uuid())])),
  staffMemberId: z.string().uuid().optional(),
})

export const reserveBodySchema = z.object({
  serviceIds: z.array(z.string().uuid()).min(1),
  staffMemberId: z.string().uuid().optional(),
  source: z.enum(['online', 'phone', 'walk_in', 'staff_created']).default('online'),
  guestName: z.string().min(1).max(80),
  guestPhone: z.string().max(40).optional(),
  guestEmail: z.string().email().optional(),
  notes: z.string().max(500).optional(),
  localDate: z.string().optional(),
  startLocal: z.string().optional(),
  startAt: z.string().optional(),
})

const blockTimeFields = {
  staffMemberId: z.string().uuid().nullable().optional(),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  localDate: z.string().optional(),
  startLocal: z.string().optional(),
  endLocal: z.string().optional(),
  title: z.string().min(1).max(80),
}

function hasBlockRange(value: { startAt?: string, endAt?: string, localDate?: string, startLocal?: string, endLocal?: string }) {
  return Boolean((value.startAt && value.endAt) || (value.localDate && value.startLocal && value.endLocal))
}

export const calendarBlockBodySchema = z.object(blockTimeFields).refine(hasBlockRange, {
  message: 'Start and end are required.',
})

export const calendarBlockUpdateSchema = z.object({
  ...blockTimeFields,
  staffMemberId: z.string().uuid().nullable(),
}).refine(hasBlockRange, {
  message: 'Start and end are required.',
})

export const calendarQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})
