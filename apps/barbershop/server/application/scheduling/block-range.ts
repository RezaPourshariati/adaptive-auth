import type { DbExecutor } from '../types'
import { eq } from 'drizzle-orm'
import { business } from '../../db/schema'
import { schedulingError } from '../../domain/scheduling/errors'
import { localToInstant } from '../../domain/scheduling/time'

export interface BlockRangeInput {
  startAt?: Date | string
  endAt?: Date | string
  localDate?: string
  startLocal?: string
  endLocal?: string
}

export function resolveBlockRange(input: BlockRangeInput, timeZone: string): { startAt: Date, endAt: Date } {
  if (input.localDate && input.startLocal && input.endLocal) {
    return {
      startAt: localToInstant(input.localDate, input.startLocal, timeZone),
      endAt: localToInstant(input.localDate, input.endLocal, timeZone),
    }
  }
  if (input.startAt != null && input.endAt != null) {
    const startAt = input.startAt instanceof Date ? input.startAt : new Date(input.startAt)
    const endAt = input.endAt instanceof Date ? input.endAt : new Date(input.endAt)
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()))
      schedulingError('INVALID_TIME', 'Start time is invalid.')
    return { startAt, endAt }
  }
  schedulingError('INVALID_TIME', 'Start and end are required.')
}

export async function blockRangeForBusiness(db: DbExecutor, businessId: string, input: BlockRangeInput) {
  const shop = (await db.select({ timezone: business.timezone }).from(business).where(eq(business.id, businessId)).limit(1))[0]
  if (!shop)
    schedulingError('BUSINESS_NOT_FOUND', 'Business not found.')
  return resolveBlockRange(input, shop.timezone)
}
