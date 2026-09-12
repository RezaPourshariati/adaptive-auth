import { and, eq, inArray } from 'drizzle-orm'
import { getDb } from '../../../db/client'
import { service, staffMember, staffService } from '../../../db/schema'
import { assertName } from '../../../domain/rules'
import { badRequest, notFound, throwDomain } from '../../../utils/http-error'
import { requireStaff } from '../../../utils/staff-auth'
import { staffBodySchema } from '../../../validation/config'

export default defineEventHandler(async (event) => {
  const user = await requireStaff(event)
  const id = getRouterParam(event, 'id')
  if (!id)
    badRequest('Staff id is required.')

  const parsed = staffBodySchema.safeParse(await readBody(event))
  if (!parsed.success)
    badRequest('Check the barber fields and try again.')

  let name: string
  try {
    name = assertName(parsed.data.name)
  }
  catch (error) {
    throwDomain(error)
  }

  const db = getDb()
  const current = await db.select().from(staffMember).where(and(
    eq(staffMember.id, id),
    eq(staffMember.businessId, user.businessId),
  )).limit(1)
  if (!current[0])
    notFound('Barber not found.')

  if (parsed.data.serviceIds.length) {
    const allowed = await db.select({ id: service.id }).from(service).where(and(
      eq(service.businessId, user.businessId),
      inArray(service.id, parsed.data.serviceIds),
    ))
    if (allowed.length !== parsed.data.serviceIds.length)
      badRequest('One or more services are invalid.')
  }

  const [updated] = await db.update(staffMember).set({
    name,
    specialty: parsed.data.specialty?.trim() || null,
    active: parsed.data.active,
    updatedAt: new Date(),
  }).where(eq(staffMember.id, id)).returning()

  await db.delete(staffService).where(eq(staffService.staffMemberId, id))
  if (parsed.data.serviceIds.length) {
    await db.insert(staffService).values(
      parsed.data.serviceIds.map(serviceId => ({
        staffMemberId: id,
        serviceId,
      })),
    )
  }

  return { staff: { ...updated, serviceIds: parsed.data.serviceIds } }
})
