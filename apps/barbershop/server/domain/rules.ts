export class DomainError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message)
    this.name = 'DomainError'
  }
}

export function assertServiceDuration(minutes: number): void {
  if (!Number.isInteger(minutes) || minutes < 10 || minutes > 240 || minutes % 5 !== 0) {
    throw new DomainError(
      'Duration must be a 5-minute step between 10 and 240 minutes.',
      'INVALID_DURATION',
    )
  }
}

export function assertPriceCents(cents: number): void {
  if (!Number.isInteger(cents) || cents < 0 || cents > 100_000) {
    throw new DomainError('Price must be between $0 and $1,000.00.', 'INVALID_PRICE')
  }
}

export function dollarsToCents(dollars: number): number {
  if (!Number.isFinite(dollars))
    throw new DomainError('Price is required.', 'INVALID_PRICE')
  const cents = Math.round(dollars * 100)
  assertPriceCents(cents)
  return cents
}

export function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2)
}

export function assertWeekday(weekday: number): void {
  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6)
    throw new DomainError('Weekday must be 0 (Sunday) through 6 (Saturday).', 'INVALID_WEEKDAY')
}

export function assertCompleteWeek(weekdays: number[]): void {
  const sorted = [...weekdays].sort((left, right) => left - right)
  if (sorted.join() !== '0,1,2,3,4,5,6')
    throw new DomainError('Working hours must include each weekday once.', 'INVALID_WEEKDAYS')
}

const TIME = /^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/

export function normalizeTime(value: string): string {
  const match = TIME.exec(value.trim())
  if (!match)
    throw new DomainError('Time must be HH:MM.', 'INVALID_TIME')
  return `${match[1]}:${match[2]}:00`
}

export function assertTimeRange(startLocal: string, endLocal: string): void {
  const start = normalizeTime(startLocal)
  const end = normalizeTime(endLocal)
  if (start >= end)
    throw new DomainError('Opening time must be before closing time.', 'INVALID_HOURS')
}

export function assertCancelNoticeHours(hours: number): void {
  if (!Number.isInteger(hours) || hours < 0 || hours > 72) {
    throw new DomainError('Cancellation notice must be between 0 and 72 hours.', 'INVALID_NOTICE')
  }
}

export function assertDepositPercent(percent: number): void {
  if (!Number.isInteger(percent) || percent < 0 || percent > 100)
    throw new DomainError('Deposit percent must be 0–100.', 'INVALID_DEPOSIT')
}

export function assertName(name: string): string {
  const trimmed = name.trim()
  if (trimmed.length < 1 || trimmed.length > 80)
    throw new DomainError('Name must be 1–80 characters.', 'INVALID_NAME')
  return trimmed
}
