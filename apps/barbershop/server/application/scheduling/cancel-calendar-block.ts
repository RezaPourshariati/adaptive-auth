import type { DbExecutor } from '../types'
import type { CancelCalendarBlockInput } from './types'
import { and, eq, sql } from 'drizzle-orm'
import { calendarBlock } from '../../db/schema'
import { schedulingError } from '../../domain/scheduling/errors'

export async function cancelCalendarBlock(db: DbExecutor, input: CancelCalendarBlockInput) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select id from calendar_block where id = ${input.blockId} and business_id = ${input.businessId} for update`)
    const current = (await tx.select().from(calendarBlock).where(and(
      eq(calendarBlock.id, input.blockId),
      eq(calendarBlock.businessId, input.businessId),
    )).limit(1))[0]
    if (!current)
      schedulingError('CALENDAR_BLOCK_NOT_FOUND', 'Calendar block not found.')
    if (current.cancelledAt)
      schedulingError('CALENDAR_BLOCK_ALREADY_CANCELLED', 'Calendar block is already cancelled.')

    const [updated] = await tx.update(calendarBlock).set({
      cancelledAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(calendarBlock.id, current.id)).returning()
    return { block: updated! }
  })
}
