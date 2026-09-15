import { and, eq } from 'drizzle-orm'
import { replaceStaffServices } from '../../../application/staff-services'
import { getDb } from '../../../db/client'
import { staffMember } from '../../../db/schema'
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

  try {
    const updated = await db.transaction(async (tx) => {
      const [row] = await tx.update(staffMember).set({
        name,
        specialty: parsed.data.specialty?.trim() || null,
        active: parsed.data.active,
        updatedAt: new Date(),
      }).where(eq(staffMember.id, id)).returning()
      await replaceStaffServices(tx, {
        businessId: user.businessId,
        staffMemberId: id,
        serviceIds: parsed.data.serviceIds,
      })
      return row
    })
    return { staff: { ...updated, serviceIds: parsed.data.serviceIds } }
  }
  catch (error) {
    throwDomain(error)
  }
})
