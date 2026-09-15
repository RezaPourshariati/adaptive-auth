import { and, eq, ne } from 'drizzle-orm'
import { getDb } from '#server/db/client'
import { service } from '#server/db/schema'
import { assertName, assertServiceDuration, centsToDollars, dollarsToCents } from '#server/domain/rules'
import { badRequest, notFound, throwDomain } from '#server/utils/http-error'
import { requireStaff } from '#server/utils/staff-auth'
import { serviceBodySchema } from '#server/validation/config'

export default defineEventHandler(async (event) => {
  const user = await requireStaff(event)
  const id = getRouterParam(event, 'id')
  if (!id)
    badRequest('Service id is required.')

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
  const current = await db.select({ id: service.id }).from(service).where(and(
    eq(service.id, id),
    eq(service.businessId, user.businessId),
  )).limit(1)
  if (!current[0])
    notFound('Service not found.')

  const duplicate = await db.select({ id: service.id }).from(service).where(and(
    eq(service.businessId, user.businessId),
    eq(service.name, name),
    ne(service.id, id),
  )).limit(1)
  if (duplicate[0])
    badRequest('A service with this name already exists.', 'DUPLICATE_SERVICE')

  const [updated] = await db.update(service).set({
    name,
    description: parsed.data.description.trim(),
    durationMinutes: parsed.data.durationMinutes,
    priceCents,
    active: parsed.data.active,
    updatedAt: new Date(),
  }).where(eq(service.id, id)).returning()

  return { service: { ...updated, priceDollars: centsToDollars(updated!.priceCents) } }
})
