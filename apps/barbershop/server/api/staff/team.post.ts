import { replaceStaffServices } from '../../application/staff-services'
import { getDb } from '../../db/client'
import { staffMember } from '../../db/schema'
import { assertName } from '../../domain/rules'
import { badRequest, throwDomain } from '../../utils/http-error'
import { requireStaff } from '../../utils/staff-auth'
import { staffBodySchema } from '../../validation/config'

export default defineEventHandler(async (event) => {
  const user = await requireStaff(event)
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

  try {
    const created = await getDb().transaction(async (tx) => {
      const [row] = await tx.insert(staffMember).values({
        businessId: user.businessId,
        name,
        specialty: parsed.data.specialty?.trim() || null,
        active: parsed.data.active,
        sortOrder: 100,
      }).returning()
      await replaceStaffServices(tx, {
        businessId: user.businessId,
        staffMemberId: row!.id,
        serviceIds: parsed.data.serviceIds,
      })
      return row
    })
    return { staff: { ...created, serviceIds: parsed.data.serviceIds } }
  }
  catch (error) {
    throwDomain(error)
  }
})
