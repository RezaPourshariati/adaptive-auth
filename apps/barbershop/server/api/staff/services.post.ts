import { and, eq } from 'drizzle-orm'
import { getDb } from '../../db/client'
import { service } from '../../db/schema'
import { assertName, assertServiceDuration, centsToDollars, dollarsToCents } from '../../domain/rules'
import { badRequest, throwDomain } from '../../utils/http-error'
import { requireStaff } from '../../utils/staff-auth'
import { serviceBodySchema } from '../../validation/config'

export default defineEventHandler(async (event) => {
  const user = await requireStaff(event)
  const parsed = serviceBodySchema.safeParse(await readBody(event))
  if (!parsed.success)
    badRequest('Check the service fields and try again.')

  let name: string
  let priceCents: number
  try {
    name = assertName(parsed.data.name)
    assertServiceDuration(parsed.data.durationMinutes)
    priceCents = dollarsToCents(parsed.data.priceDollars)
  }
  catch (error) {
    throwDomain(error)
  }

  const db = getDb()
  const duplicate = await db.select({ id: service.id }).from(service).where(and(
    eq(service.businessId, user.businessId),
    eq(service.name, name),
  )).limit(1)
  if (duplicate[0])
    badRequest('A service with this name already exists.', 'DUPLICATE_SERVICE')

  const [created] = await db.insert(service).values({
    businessId: user.businessId,
    name,
    description: parsed.data.description.trim(),
    durationMinutes: parsed.data.durationMinutes,
    priceCents,
    active: parsed.data.active,
    sortOrder: 100,
  }).returning()

  return { service: { ...created, priceDollars: centsToDollars(created!.priceCents) } }
})
