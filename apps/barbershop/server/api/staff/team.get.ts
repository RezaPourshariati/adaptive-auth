import { asc, eq, inArray } from 'drizzle-orm'
import { getDb } from '../../db/client'
import { staffMember, staffService } from '../../db/schema'
import { requireStaff } from '../../utils/staff-auth'

export default defineEventHandler(async (event) => {
  const user = await requireStaff(event)
  const db = getDb()
  const members = await db.select().from(staffMember).where(eq(staffMember.businessId, user.businessId)).orderBy(asc(staffMember.sortOrder), asc(staffMember.name))

  const memberIds = members.map(member => member.id)
  const links = memberIds.length
    ? await db.select().from(staffService).where(inArray(staffService.staffMemberId, memberIds))
    : []

  const serviceIdsByStaff = new Map<string, string[]>()
  for (const link of links) {
    const list = serviceIdsByStaff.get(link.staffMemberId) ?? []
    list.push(link.serviceId)
    serviceIdsByStaff.set(link.staffMemberId, list)
  }

  return {
    staff: members.map(member => ({
      ...member,
      serviceIds: serviceIdsByStaff.get(member.id) ?? [],
    })),
  }
})
