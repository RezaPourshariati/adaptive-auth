import { formatInTimeZone, fromZonedTime } from 'date-fns-tz'
import { DomainError } from '../rules'

const LOCAL_DATE = /^\d{4}-\d{2}-\d{2}$/
const LOCAL_HM = /^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/

export function assertLocalDate(value: string): string {
  if (!LOCAL_DATE.test(value))
    throw new DomainError('Date must be YYYY-MM-DD.', 'INVALID_TIME')
  return value
}

export function assertLocalHm(value: string): string {
  const match = LOCAL_HM.exec(value.trim())
  if (!match)
    throw new DomainError('Time must be HH:MM.', 'INVALID_TIME')
  return `${match[1]}:${match[2]}`
}

/**
 * Sunday = 0 to match working_hours.weekday.
 * date-fns-tz 'i' is ISO weekday (Monday = 1 … Sunday = 7).
 */
export function sundayWeekday(localDate: string, timeZone: string): number {
  assertLocalDate(localDate)
  const noon = localToInstant(localDate, '12:00', timeZone)
  const iso = Number(formatInTimeZone(noon, timeZone, 'i'))
  return iso === 7 ? 0 : iso
}

export function nextLocalDate(localDate: string): string {
  assertLocalDate(localDate)
  const [year, month, day] = localDate.split('-').map(Number)
  const utc = new Date(Date.UTC(year!, month! - 1, day! + 1))
  return utc.toISOString().slice(0, 10)
}

export function localToInstant(localDate: string, localTime: string, timeZone: string): Date {
  const date = assertLocalDate(localDate)
  const hm = assertLocalHm(localTime)
  const instant = fromZonedTime(`${date}T${hm}:00`, timeZone)
  const echoed = formatInTimeZone(instant, timeZone, 'yyyy-MM-dd\'T\'HH:mm')
  if (echoed !== `${date}T${hm}`) {
    throw new DomainError(
      'That local time does not exist in this timezone.',
      'INVALID_TIME',
    )
  }
  return instant
}

export function formatLocalHm(instant: Date, timeZone: string): string {
  return formatInTimeZone(instant, timeZone, 'HH:mm')
}

export function formatLocalDate(instant: Date, timeZone: string): string {
  return formatInTimeZone(instant, timeZone, 'yyyy-MM-dd')
}

export function addMinutes(instant: Date, minutes: number): Date {
  return new Date(instant.getTime() + minutes * 60_000)
}

export function localDayBounds(localDate: string, timeZone: string): { start: Date, end: Date } {
  return {
    start: localToInstant(localDate, '00:00', timeZone),
    end: localToInstant(nextLocalDate(localDate), '00:00', timeZone),
  }
}
