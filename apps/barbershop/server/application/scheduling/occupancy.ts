import type { InstantRange } from '../../domain/scheduling/ranges'
import type { DbExecutor } from '../types'
import { and, eq, gt, inArray, isNull, lt, or } from 'drizzle-orm'
import { appointment, calendarBlock } from '../../db/schema'
import { rangesOverlap } from '../../domain/scheduling/ranges'
import { OCCUPYING_STATUSES } from './types'

export async function loadOccupyingAppointments(
  db: DbExecutor,
  input: { businessId: string, staffMemberIds?: string[], range: InstantRange },
): Promise<Array<InstantRange & { staffMemberId: string }>> {
  if (input.staffMemberIds && !input.staffMemberIds.length)
    return []
  const rows = await db.select({
    staffMemberId: appointment.staffMemberId,
    startAt: appointment.startAt,
    endAt: appointment.endAt,
  }).from(appointment).where(and(
    eq(appointment.businessId, input.businessId),
    input.staffMemberIds ? inArray(appointment.staffMemberId, input.staffMemberIds) : undefined,
    inArray(appointment.status, [...OCCUPYING_STATUSES]),
    lt(appointment.startAt, input.range.end),
    gt(appointment.endAt, input.range.start),
  ))
  return rows.map(row => ({
    staffMemberId: row.staffMemberId,
    start: row.startAt,
    end: row.endAt,
  }))
}

export async function loadActiveBlocks(
  db: DbExecutor,
  input: { businessId: string, staffMemberIds: string[], range: InstantRange },
): Promise<Array<InstantRange & { staffMemberId: string | null }>> {
  const rows = await db.select({
    staffMemberId: calendarBlock.staffMemberId,
    startAt: calendarBlock.startAt,
    endAt: calendarBlock.endAt,
  }).from(calendarBlock).where(and(
    eq(calendarBlock.businessId, input.businessId),
    isNull(calendarBlock.cancelledAt),
    lt(calendarBlock.startAt, input.range.end),
    gt(calendarBlock.endAt, input.range.start),
    input.staffMemberIds.length
      ? or(
          isNull(calendarBlock.staffMemberId),
          inArray(calendarBlock.staffMemberId, input.staffMemberIds),
        )
      : isNull(calendarBlock.staffMemberId),
  ))
  return rows.map(row => ({
    staffMemberId: row.staffMemberId,
    start: row.startAt,
    end: row.endAt,
  }))
}

export function blocksForBarber(
  blocks: Array<InstantRange & { staffMemberId: string | null }>,
  staffMemberId: string,
): InstantRange[] {
  return blocks.filter(block => block.staffMemberId === null || block.staffMemberId === staffMemberId)
}

export function hasOccupyingConflict(
  range: InstantRange,
  staffMemberId: string,
  appointments: Array<InstantRange & { staffMemberId: string }>,
  blocks: Array<InstantRange & { staffMemberId: string | null }>,
): 'appointment' | 'block' | null {
  if (appointments.some(item => item.staffMemberId === staffMemberId && rangesOverlap(range, item)))
    return 'appointment'
  if (blocksForBarber(blocks, staffMemberId).some(item => rangesOverlap(range, item)))
    return 'block'
  return null
}
