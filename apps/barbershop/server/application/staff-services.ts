import type { DbExecutor } from './types'
import { and, eq, inArray } from 'drizzle-orm'
import { service, staffService } from '../db/schema'
import { DomainError } from '../domain/rules'

export async function replaceStaffServices(
  db: DbExecutor,
  input: { businessId: string, staffMemberId: string, serviceIds: string[] },
): Promise<void> {
  const uniqueIds = [...new Set(input.serviceIds)]

  await db.transaction(async (tx) => {
    if (uniqueIds.length) {
      const allowed = await tx.select({ id: service.id }).from(service).where(and(
        eq(service.businessId, input.businessId),
        inArray(service.id, uniqueIds),
      ))
      if (allowed.length !== uniqueIds.length)
        throw new DomainError('One or more services are invalid.', 'INVALID_SERVICE')
    }

    await tx.delete(staffService).where(eq(staffService.staffMemberId, input.staffMemberId))
    if (uniqueIds.length) {
      await tx.insert(staffService).values(uniqueIds.map(serviceId => ({
        staffMemberId: input.staffMemberId,
        serviceId,
        businessId: input.businessId,
      })))
    }
  })
}
