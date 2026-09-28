import type { CalendarHours } from './calendar-types'

export const SOURCE_LABELS = {
  online: 'Online',
  phone: 'Phone',
  walk_in: 'Walk-in',
  staff_created: 'Staff',
} as const

const SLOT_MINUTES = 10

export function sourceLabel(source: string): string {
  if (source in SOURCE_LABELS)
    return SOURCE_LABELS[source as keyof typeof SOURCE_LABELS]
  return source
}

export function statusLabel(status: string): string {
  if (status === 'confirmed')
    return 'Confirmed'
  if (status === 'completed')
    return 'Completed'
  if (status === 'no_show')
    return 'No-show'
  if (status === 'cancelled')
    return 'Cancelled'
  return status
}

export function mutationFollowUp(statusCode: number | null): 'refresh' | 'refresh-after-error' | 'keep' {
  if (statusCode == null)
    return 'refresh'
  if (statusCode === 409 || statusCode === 404)
    return 'refresh-after-error'
  return 'keep'
}

export function defaultFocusedStaffId(staff: { id: string }[], stored: string | null): string {
  if (stored && staff.some(member => member.id === stored))
    return stored
  return staff[0]?.id ?? ''
}

export function timelineColumns(count: number): { template: string, scroll: boolean } {
  if (count < 1)
    return { template: '4.5rem', scroll: false }
  const scroll = count >= 9
  const track = scroll ? '9rem' : 'minmax(0, 1fr)'
  return { template: `4.5rem repeat(${count}, ${track})`, scroll }
}

export function addLocalDays(localDate: string, days: number): string {
  const [year, month, day] = localDate.split('-').map(Number)
  const utc = new Date(Date.UTC(year!, (month ?? 1) - 1, (day ?? 1) + days))
  return utc.toISOString().slice(0, 10)
}

export function localNowParts(timeZone: string, now = new Date()): { date: string, hm: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)
  const pick = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)?.value ?? ''
  let hour = pick('hour')
  if (hour === '24')
    hour = '00'
  return {
    date: `${pick('year')}-${pick('month')}-${pick('day')}`,
    hm: `${hour}:${pick('minute')}`,
  }
}

function minutes(hm: string): number {
  const [hours, mins] = hm.slice(0, 5).split(':').map(Number)
  return (hours ?? 0) * 60 + (mins ?? 0)
}

function minutesToHm(total: number): string {
  const hours = Math.floor(total / 60) % 24
  const mins = ((total % 60) + 60) % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

export function addMinutesHm(hm: string, amount: number): string | null {
  const total = minutes(hm) + amount
  if (total < 0 || total >= 24 * 60)
    return null
  return minutesToHm(total)
}

export function isSlotAligned(hm: string): boolean {
  const mins = Number(hm.slice(0, 5).split(':')[1])
  return Number.isInteger(mins) && mins >= 0 && mins < 60 && mins % SLOT_MINUTES === 0
}

export function floorToSlot(hm: string): string {
  const total = minutes(hm)
  return minutesToHm(total - (total % SLOT_MINUTES))
}

export function timeSlots(startLocal: string, endLocal: string): string[] {
  const slots: string[] = []
  let cursor = minutes(startLocal)
  const end = minutes(endLocal)
  while (cursor < end) {
    slots.push(minutesToHm(cursor))
    cursor += SLOT_MINUTES
  }
  return slots
}

export function resolveWalkInNow(nowHm: string, durationMinutes: number, hours: CalendarHours | null): string {
  const floored = floorToSlot(nowHm)
  if (!hours)
    return floored
  const open = minutes(hours.startLocal)
  const close = minutes(hours.endLocal)
  const fits = (slot: string) => {
    const start = minutes(slot)
    return start >= open && start + durationMinutes <= close
  }
  if (fits(floored))
    return floored
  const next = timeSlots(hours.startLocal, hours.endLocal).find(slot => slot > floored && fits(slot))
  return next ?? floored
}

export function blockSpan(
  windowStart: string,
  startLocal: string,
  endLocal: string,
  slotCount: number,
): { start: number, end: number } | null {
  const windowMinutes = minutes(windowStart)
  const startMinutes = minutes(startLocal)
  const endMinutes = minutes(endLocal)
  const windowEnd = windowMinutes + slotCount * SLOT_MINUTES
  if (endMinutes <= windowMinutes || startMinutes >= windowEnd)
    return null
  const start = Math.max(0, Math.floor((startMinutes - windowMinutes) / SLOT_MINUTES))
  const end = Math.min(slotCount, Math.max(start + 1, Math.ceil((endMinutes - windowMinutes) / SLOT_MINUTES)))
  return { start, end }
}

export function nowOffsetPx(windowStart: string, nowLocal: string, rowPx: number, slotCount: number): number | null {
  const delta = minutes(nowLocal) - minutes(windowStart)
  if (delta < 0 || delta >= slotCount * SLOT_MINUTES)
    return null
  return (delta / SLOT_MINUTES) * rowPx
}

export function durationMinutes(
  services: { durationMinutesSnapshot: number }[],
  startAt: string,
  endAt: string,
): number {
  const fromServices = services.reduce((sum, item) => sum + item.durationMinutesSnapshot, 0)
  if (fromServices > 0)
    return fromServices
  return Math.max(0, Math.round((new Date(endAt).getTime() - new Date(startAt).getTime()) / 60_000))
}

export function slotOpen(hours: CalendarHours | null, slot: string): boolean {
  if (!hours)
    return false
  return slot >= hours.startLocal && slot < hours.endLocal
}
