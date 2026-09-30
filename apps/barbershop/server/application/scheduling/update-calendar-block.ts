import type { DbExecutor } from '../types'
import type { UpdateCalendarBlockInput } from './types'
import { and, eq, gt, isNull, lt, ne, or, sql } from 'drizzle-orm'
import { calendarBlock, staffMember } from '../../db/schema'
import { assertName } from '../../domain/rules'
import { isPostgresExclusionViolation, schedulingError } from '../../domain/scheduling/errors'
import { rangesOverlap } from '../../domain/scheduling/ranges'
import { hasOccupyingConflict, loadOccupyingAppointments } from './occupancy'

function asDate(value: Date | string, label: string): Date {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime()))
    schedulingError('INVALID_TIME', `${label} is invalid.`)
  return date
}

export async function updateCalendarBlock(db: DbExecutor, input: UpdateCalendarBlockInput) {
  const startAt = asDate(input.startAt, 'Start')
  const endAt = asDate(input.endAt, 'End')
  if (endAt <= startAt)
    schedulingError('INVALID_TIME', 'Block end must be after start.')
  const title = assertName(input.title)
  const staffMemberId = input.staffMemberId ?? null
  const range = { start: startAt, end: endAt }

  try {
    return await db.transaction(async (tx) => {
      await tx.execute(sql`select id from business where id = ${input.businessId} for update`)
      await tx.execute(sql`select id from calendar_block where id = ${input.blockId} and business_id = ${input.businessId} for update`)
      const current = (await tx.select().from(calendarBlock).where(and(
        eq(calendarBlock.id, input.blockId),
        eq(calendarBlock.businessId, input.businessId),
      )).limit(1))[0]
      if (!current)
        schedulingError('CALENDAR_BLOCK_NOT_FOUND', 'Calendar block not found.')
      if (current.cancelledAt)
        schedulingError('CALENDAR_BLOCK_ALREADY_CANCELLED', 'Calendar block is already cancelled.')

      if (staffMemberId) {
        await tx.execute(sql`select id from staff_member where id = ${staffMemberId} for update`)
        const member = (await tx.select().from(staffMember).where(and(
          eq(staffMember.id, staffMemberId),
          eq(staffMember.businessId, input.businessId),
        )).limit(1))[0]
        if (!member)
          schedulingError('STAFF_NOT_FOUND', 'Barber not found.')
      }

      const appointments = await loadOccupyingAppointments(tx, {
        businessId: input.businessId,
        staffMemberIds: staffMemberId ? [staffMemberId] : undefined,
        range,
      })
      const blocks = (await tx.select({
        staffMemberId: calendarBlock.staffMemberId,
        startAt: calendarBlock.startAt,
        endAt: calendarBlock.endAt,
      }).from(calendarBlock).where(and(
        eq(calendarBlock.businessId, input.businessId),
        isNull(calendarBlock.cancelledAt),
        ne(calendarBlock.id, input.blockId),
        lt(calendarBlock.startAt, endAt),
        gt(calendarBlock.endAt, startAt),
        staffMemberId
          ? or(isNull(calendarBlock.staffMemberId), eq(calendarBlock.staffMemberId, staffMemberId))
          : isNull(calendarBlock.staffMemberId),
      ))).map(row => ({
        staffMemberId: row.staffMemberId,
        start: row.startAt,
        end: row.endAt,
      }))

      const blocked = staffMemberId
        ? hasOccupyingConflict(range, staffMemberId, appointments, blocks) != null
        : appointments.some(item => rangesOverlap(range, item)) || blocks.some(item => rangesOverlap(range, item))
      if (blocked)
        schedulingError('CALENDAR_BLOCKED', 'That time already has an appointment or block.')

      const [updated] = await tx.update(calendarBlock).set({
        staffMemberId,
        startAt,
        endAt,
        title,
        updatedAt: new Date(),
      }).where(eq(calendarBlock.id, current.id)).returning()
      return { block: updated! }
    })
  }
  catch (error) {
    if (isPostgresExclusionViolation(error))
      schedulingError('CALENDAR_BLOCKED', 'That time already has a calendar block.')
    throw error
  }
}
