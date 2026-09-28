import type { DbExecutor } from '../types'
import type { CalendarDay, GetCalendarDayInput } from './types'
import { and, asc, eq, gt, inArray, isNull, lt } from 'drizzle-orm'
import { appointment, appointmentService, business, calendarBlock, staffMember, workingHours } from '../../db/schema'
import { schedulingError } from '../../domain/scheduling/errors'
import { intersectLocalIntervals } from '../../domain/scheduling/hours'
import { formatLocalDate, formatLocalHm, localDayBounds, sundayWeekday } from '../../domain/scheduling/time'
import { pickBarberOrder } from './pick-barber'
import { OCCUPYING_STATUSES } from './types'

function hm(value: unknown): string {
  return String(value).slice(0, 5)
}

export async function getCalendarDay(db: DbExecutor, input: GetCalendarDayInput): Promise<CalendarDay> {
  const now = input.now ?? new Date()
  const shop = (await db.select().from(business).where(eq(business.id, input.businessId)).limit(1))[0]
  if (!shop)
    schedulingError('BUSINESS_NOT_FOUND', 'Business not found.')

  const date = input.localDate ?? formatLocalDate(now, shop.timezone)
  const bounds = localDayBounds(date, shop.timezone)
  const weekday = sundayWeekday(date, shop.timezone)

  const hourRows = await db.select().from(workingHours).where(and(
    eq(workingHours.businessId, shop.id),
    eq(workingHours.weekday, weekday),
  ))
  const shopRow = hourRows.find(row => row.ownerType === 'business' && row.staffMemberId == null)
  const shopInterval = shopRow
    ? { startLocal: hm(shopRow.startLocal), endLocal: hm(shopRow.endLocal) }
    : null

  const members = await db.select().from(staffMember).where(eq(staffMember.businessId, shop.id))
  const appointments = await db.select().from(appointment).where(and(
    eq(appointment.businessId, shop.id),
    inArray(appointment.status, [...OCCUPYING_STATUSES]),
    lt(appointment.startAt, bounds.end),
    gt(appointment.endAt, bounds.start),
  )).orderBy(asc(appointment.startAt))
  const appointmentIds = appointments.map(row => row.id)
  const services = appointmentIds.length
    ? await db.select().from(appointmentService).where(inArray(appointmentService.appointmentId, appointmentIds))
    : []
  const blocks = await db.select().from(calendarBlock).where(and(
    eq(calendarBlock.businessId, shop.id),
    isNull(calendarBlock.cancelledAt),
    lt(calendarBlock.startAt, bounds.end),
    gt(calendarBlock.endAt, bounds.start),
  )).orderBy(asc(calendarBlock.startAt))

  const referenced = new Set<string>()
  for (const row of appointments)
    referenced.add(row.staffMemberId)
  for (const row of blocks) {
    if (row.staffMemberId)
      referenced.add(row.staffMemberId)
  }

  const staff = pickBarberOrder(members.filter(member => member.active || referenced.has(member.id))).map((member) => {
    const staffRow = hourRows.find(row => row.ownerType === 'staff' && row.staffMemberId === member.id)
    const staffInterval = staffRow
      ? { startLocal: hm(staffRow.startLocal), endLocal: hm(staffRow.endLocal) }
      : null
    return {
      id: member.id,
      name: member.name,
      active: member.active,
      sortOrder: member.sortOrder,
      hours: intersectLocalIntervals(shopInterval, staffInterval),
    }
  })

  return {
    date,
    timezone: shop.timezone,
    today: formatLocalDate(now, shop.timezone),
    now: now.toISOString(),
    nowLocal: formatLocalHm(now, shop.timezone),
    closed: shopInterval == null,
    shopHours: shopInterval,
    staff,
    appointments: appointments.map(row => ({
      id: row.id,
      staffMemberId: row.staffMemberId,
      startAt: row.startAt.toISOString(),
      endAt: row.endAt.toISOString(),
      startLocal: formatLocalHm(row.startAt, shop.timezone),
      endLocal: formatLocalHm(row.endAt, shop.timezone),
      status: row.status as 'confirmed' | 'completed',
      source: row.source,
      guestName: row.guestName,
      guestPhone: row.guestPhone,
      guestEmail: row.guestEmail,
      notes: row.notes,
      timezone: row.timezone,
      services: services
        .filter(item => item.appointmentId === row.id)
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map(item => ({
          serviceNameSnapshot: item.serviceNameSnapshot,
          durationMinutesSnapshot: item.durationMinutesSnapshot,
          priceCentsSnapshot: item.priceCentsSnapshot,
          sortOrder: item.sortOrder,
        })),
    })),
    blocks: blocks.map(row => ({
      id: row.id,
      staffMemberId: row.staffMemberId,
      startAt: row.startAt.toISOString(),
      endAt: row.endAt.toISOString(),
      startLocal: formatLocalHm(row.startAt, shop.timezone),
      endLocal: formatLocalHm(row.endAt, shop.timezone),
      title: row.title,
    })),
  }
}
