import type { DbExecutor } from '../types'
import type { CreateCalendarBlockInput } from './types'
import { and, eq, sql } from 'drizzle-orm'
import { calendarBlock, staffMember } from '../../db/schema'
import { assertName } from '../../domain/rules'
import { isPostgresExclusionViolation, schedulingError } from '../../domain/scheduling/errors'
import { rangesOverlap } from '../../domain/scheduling/ranges'
import { hasOccupyingConflict, loadActiveBlocks, loadOccupyingAppointments } from './occupancy'

function asDate(value: Date | string, label: string): Date {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime()))
    schedulingError('INVALID_TIME', `${label} is invalid.`)
  return date
}

export async function createCalendarBlock(db: DbExecutor, input: CreateCalendarBlockInput) {
  const startAt = asDate(input.startAt, 'Start')
  const endAt = asDate(input.endAt, 'End')
  if (endAt <= startAt)
    schedulingError('INVALID_TIME', 'Block end must be after start.')
  const title = assertName(input.title)
  const range = { start: startAt, end: endAt }

  try {
    return await db.transaction(async (tx) => {
      await tx.execute(sql`select id from business where id = ${input.businessId} for update`)
      if (input.staffMemberId) {
        await tx.execute(sql`select id from staff_member where id = ${input.staffMemberId} for update`)
        const member = (await tx.select().from(staffMember).where(and(
          eq(staffMember.id, input.staffMemberId),
          eq(staffMember.businessId, input.businessId),
        )).limit(1))[0]
        if (!member)
          schedulingError('STAFF_NOT_FOUND', 'Barber not found.')
      }

      const appointments = await loadOccupyingAppointments(tx, {
        businessId: input.businessId,
        staffMemberIds: input.staffMemberId ? [input.staffMemberId] : undefined,
        range,
      })
      const blocks = await loadActiveBlocks(tx, {
        businessId: input.businessId,
        staffMemberIds: input.staffMemberId ? [input.staffMemberId] : [],
        range,
      })
      if (input.staffMemberId && hasOccupyingConflict(range, input.staffMemberId, appointments, blocks))
        schedulingError('CALENDAR_BLOCKED', 'That time already has an appointment or block.')
      if (!input.staffMemberId && appointments.some(item => rangesOverlap(range, item)))
        schedulingError('CALENDAR_BLOCKED', 'That time already has an appointment.')

      const [created] = await tx.insert(calendarBlock).values({
        businessId: input.businessId,
        staffMemberId: input.staffMemberId ?? null,
        startAt,
        endAt,
        title,
      }).returning()
      return { block: created! }
    })
  }
  catch (error) {
    if (isPostgresExclusionViolation(error))
      schedulingError('CALENDAR_BLOCKED', 'That time already has a calendar block.')
    throw error
  }
}
