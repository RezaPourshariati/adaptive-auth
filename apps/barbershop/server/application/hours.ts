import type { DbExecutor } from './types'
import { and, eq } from 'drizzle-orm'
import { workingHours } from '../db/schema'
import { assertCompleteWeek, assertTimeRange, assertWeekday, normalizeTime } from '../domain/rules'

export interface HoursDayInput {
  weekday: number
  closed: boolean
  startLocal: string
  endLocal: string
}

export async function replaceBusinessHours(
  db: DbExecutor,
  input: { businessId: string, days: HoursDayInput[] },
): Promise<{ openDays: number }> {
  assertCompleteWeek(input.days.map(day => day.weekday))

  const openRows = input.days.flatMap((day) => {
    assertWeekday(day.weekday)
    if (day.closed)
      return []
    assertTimeRange(day.startLocal, day.endLocal)
    return [{
      businessId: input.businessId,
      ownerType: 'business' as const,
      staffMemberId: null,
      weekday: day.weekday,
      startLocal: normalizeTime(day.startLocal),
      endLocal: normalizeTime(day.endLocal),
    }]
  })

  await db.transaction(async (tx) => {
    await tx.delete(workingHours).where(and(
      eq(workingHours.businessId, input.businessId),
      eq(workingHours.ownerType, 'business'),
    ))
    if (openRows.length)
      await tx.insert(workingHours).values(openRows)
  })

  return { openDays: openRows.length }
}
