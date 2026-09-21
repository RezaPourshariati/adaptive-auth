import { DomainError } from '../rules'
import { addMinutes, formatLocalHm, localToInstant } from './time'

export const SLOT_INTERVAL_MINUTES = 10

export function assertSlotAligned(localHm: string): void {
  const [hours, minutes] = localHm.split(':').map(Number)
  if ((minutes ?? 0) % SLOT_INTERVAL_MINUTES !== 0)
    throw new DomainError('Start time must align to a 10-minute slot.', 'INVALID_TIME')
  void hours
}

function ceilToSlot(totalMinutes: number): number {
  return Math.ceil(totalMinutes / SLOT_INTERVAL_MINUTES) * SLOT_INTERVAL_MINUTES
}

function hmToMinutes(hm: string): number {
  const [hours, minutes] = hm.split(':').map(Number)
  return (hours ?? 0) * 60 + (minutes ?? 0)
}

function minutesToHm(total: number): string {
  const hours = Math.floor(total / 60)
  const minutes = total % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

/**
 * 10-minute wall-clock starts where start + duration fits in [rangeStart, rangeEnd).
 * Invalid DST local times are skipped.
 */
export function generateSlotStarts(
  localDate: string,
  rangeStart: Date,
  rangeEnd: Date,
  durationMinutes: number,
  timeZone: string,
  now: Date,
): Date[] {
  const startHm = formatLocalHm(rangeStart, timeZone)
  const endHm = formatLocalHm(rangeEnd, timeZone)
  const first = ceilToSlot(hmToMinutes(startHm))
  const lastExclusive = hmToMinutes(endHm)
  const starts: Date[] = []

  for (let minute = first; minute + durationMinutes <= lastExclusive; minute += SLOT_INTERVAL_MINUTES) {
    try {
      const instant = localToInstant(localDate, minutesToHm(minute), timeZone)
      if (instant < rangeStart)
        continue
      const end = addMinutes(instant, durationMinutes)
      if (end > rangeEnd)
        continue
      if (instant < now)
        continue
      starts.push(instant)
    }
    catch (error) {
      if (error instanceof DomainError && error.code === 'INVALID_TIME')
        continue
      throw error
    }
  }
  return starts
}
