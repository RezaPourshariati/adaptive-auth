import type { DbExecutor } from '../types'
import type { ReserveAppointmentInput } from './types'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { appointment, appointmentService, business, service, staffMember, staffService, workingHours } from '../../db/schema'
import { assertName, DomainError } from '../../domain/rules'
import { isPostgresExclusionViolation, schedulingError } from '../../domain/scheduling/errors'
import { intersectLocalIntervals } from '../../domain/scheduling/hours'
import { assertSlotAligned } from '../../domain/scheduling/slots'
import { addMinutes, formatLocalDate, formatLocalHm, localToInstant, sundayWeekday } from '../../domain/scheduling/time'
import { hasOccupyingConflict, loadActiveBlocks, loadOccupyingAppointments } from './occupancy'
import { pickBarberOrder } from './pick-barber'
import { APPOINTMENT_SOURCES } from './types'

function asHm(value: unknown): string {
  if (typeof value === 'string')
    return value.slice(0, 5)
  return String(value).slice(0, 5)
}

export async function reserveAppointment(db: DbExecutor, input: ReserveAppointmentInput) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select id from business where id = ${input.businessId} for update`)
    const shop = (await tx.select().from(business).where(eq(business.id, input.businessId)).limit(1))[0]
    if (!shop)
      schedulingError('BUSINESS_NOT_FOUND', 'Business not found.')

    const snapshots = await snapshotServices(tx, input.businessId, input.serviceIds)
    const durationMinutes = snapshots.reduce((sum, item) => sum + item.durationMinutesSnapshot, 0)
    const startAt = resolveStart(input, shop.timezone)
    const endAt = addMinutes(startAt, durationMinutes)
    if (endAt <= startAt)
      schedulingError('INVALID_TIME', 'Appointment end must be after start.')

    const startLocal = formatLocalHm(startAt, shop.timezone)
    const localDate = formatLocalDate(startAt, shop.timezone)
    assertSlotAligned(startLocal)
    validateGuest(input)

    const candidates = pickBarberOrder(await loadCandidates(tx, {
      businessId: shop.id,
      serviceIds: snapshots.map(item => item.serviceId),
      staffMemberId: input.staffMemberId,
    }))
    if (!candidates.length)
      schedulingError('STAFF_NOT_ELIGIBLE', 'No eligible barber is available.')

    const weekday = sundayWeekday(localDate, shop.timezone)
    const visit = { start: startAt, end: endAt }
    let lastError: DomainError | null = null

    for (const barber of candidates) {
      await tx.execute(sql`select id from staff_member where id = ${barber.id} for update`)
      const locked = (await tx.select().from(staffMember).where(and(
        eq(staffMember.id, barber.id),
        eq(staffMember.businessId, shop.id),
      )).limit(1))[0]
      if (!locked?.active) {
        lastError = new DomainError('That barber is not available.', 'STAFF_INACTIVE')
        continue
      }
      if (!await isEligible(tx, shop.id, locked.id, snapshots.map(item => item.serviceId))) {
        lastError = new DomainError('That barber cannot perform the requested services.', 'STAFF_NOT_ELIGIBLE')
        continue
      }

      const hours = await effectiveHours(tx, shop.id, locked.id, weekday)
      if (!hours) {
        lastError = new DomainError('The shop is closed on that day.', 'OUTSIDE_WORKING_HOURS')
        continue
      }
      const windowStart = localToInstant(localDate, hours.startLocal, shop.timezone)
      const windowEnd = localToInstant(localDate, hours.endLocal, shop.timezone)
      if (startAt < windowStart || endAt > windowEnd) {
        lastError = new DomainError('That time is outside working hours.', 'OUTSIDE_WORKING_HOURS')
        continue
      }

      const appointments = await loadOccupyingAppointments(tx, {
        businessId: shop.id,
        staffMemberIds: [locked.id],
        range: visit,
      })
      const blocks = await loadActiveBlocks(tx, {
        businessId: shop.id,
        staffMemberIds: [locked.id],
        range: visit,
      })
      const conflict = hasOccupyingConflict(visit, locked.id, appointments, blocks)
      if (conflict === 'block') {
        lastError = new DomainError('That time is blocked on the calendar.', 'CALENDAR_BLOCKED')
        continue
      }
      if (conflict === 'appointment') {
        lastError = new DomainError('That time is no longer available.', 'SLOT_UNAVAILABLE')
        continue
      }

      try {
        const [created] = await tx.insert(appointment).values({
          businessId: shop.id,
          staffMemberId: locked.id,
          startAt,
          endAt,
          timezone: shop.timezone,
          status: 'confirmed',
          source: input.source,
          guestName: assertName(input.guestName),
          guestPhone: input.guestPhone?.trim() || null,
          guestEmail: input.guestEmail?.trim() || null,
          notes: input.notes?.trim() || null,
        }).returning()
        await tx.insert(appointmentService).values(snapshots.map(item => ({
          ...item,
          appointmentId: created!.id,
          businessId: shop.id,
        })))
        return {
          appointment: created!,
          services: snapshots,
        }
      }
      catch (error) {
        if (isPostgresExclusionViolation(error)) {
          lastError = new DomainError('That time is no longer available.', 'SLOT_UNAVAILABLE')
          continue
        }
        throw error
      }
    }

    if (lastError)
      throw lastError
    schedulingError('SLOT_UNAVAILABLE', 'That time is no longer available.')
  })
}

function resolveStart(input: ReserveAppointmentInput, timeZone: string): Date {
  if (input.startAt) {
    const start = input.startAt instanceof Date ? input.startAt : new Date(input.startAt)
    if (Number.isNaN(start.getTime()))
      schedulingError('INVALID_TIME', 'Start time is invalid.')
    return start
  }
  if (input.localDate && input.startLocal)
    return localToInstant(input.localDate, input.startLocal, timeZone)
  schedulingError('INVALID_TIME', 'Start time is required.')
}

function validateGuest(input: ReserveAppointmentInput) {
  if (!APPOINTMENT_SOURCES.includes(input.source))
    schedulingError('INVALID_SOURCE', 'Booking source is invalid.')
  assertName(input.guestName)
  if (input.source === 'online' && !input.guestPhone?.trim())
    throw new DomainError('Phone is required for online bookings.', 'VALIDATION_ERROR')
  if (input.guestEmail?.trim() && !/^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(input.guestEmail.trim()))
    throw new DomainError('Email is invalid.', 'VALIDATION_ERROR')
}

async function snapshotServices(db: DbExecutor, businessId: string, serviceIds: string[]) {
  if (!serviceIds.length)
    throw new DomainError('At least one service is required.', 'VALIDATION_ERROR')
  const uniqueIds = [...new Set(serviceIds)]
  const rows = await db.select().from(service).where(and(
    eq(service.businessId, businessId),
    inArray(service.id, uniqueIds),
  ))
  if (rows.length !== uniqueIds.length)
    schedulingError('SERVICE_NOT_FOUND', 'One or more services were not found.')
  const inactive = rows.find(item => !item.active)
  if (inactive)
    schedulingError('SERVICE_INACTIVE', `${inactive.name} is not available.`)
  return uniqueIds.map((id, sortOrder) => {
    const row = rows.find(item => item.id === id)!
    return {
      serviceId: row.id,
      serviceNameSnapshot: row.name,
      durationMinutesSnapshot: row.durationMinutes,
      priceCentsSnapshot: row.priceCents,
      currencySnapshot: row.currency,
      sortOrder,
    }
  })
}

async function loadCandidates(
  db: DbExecutor,
  input: { businessId: string, serviceIds: string[], staffMemberId?: string },
) {
  const members = await db.select().from(staffMember).where(and(
    eq(staffMember.businessId, input.businessId),
    input.staffMemberId ? eq(staffMember.id, input.staffMemberId) : undefined,
  ))
  if (input.staffMemberId && !members[0])
    schedulingError('STAFF_NOT_FOUND', 'Barber not found.')
  const active = members.filter(item => item.active)
  if (input.staffMemberId && members[0] && !members[0].active)
    schedulingError('STAFF_INACTIVE', 'That barber is not available.')
  const eligible: typeof active = []
  for (const member of active) {
    if (await isEligible(db, input.businessId, member.id, input.serviceIds))
      eligible.push(member)
  }
  if (input.staffMemberId && members[0] && !eligible.length)
    schedulingError('STAFF_NOT_ELIGIBLE', 'That barber cannot perform the requested services.')
  return eligible
}

async function isEligible(db: DbExecutor, businessId: string, staffMemberId: string, serviceIds: string[]) {
  const links = await db.select().from(staffService).where(and(
    eq(staffService.businessId, businessId),
    eq(staffService.staffMemberId, staffMemberId),
    inArray(staffService.serviceId, serviceIds),
  ))
  return links.length === serviceIds.length
}

async function effectiveHours(
  db: DbExecutor,
  businessId: string,
  staffMemberId: string,
  weekday: number,
) {
  const shopHours = (await db.select().from(workingHours).where(and(
    eq(workingHours.businessId, businessId),
    eq(workingHours.ownerType, 'business'),
    eq(workingHours.weekday, weekday),
  )).limit(1))[0]
  if (!shopHours)
    return null
  const staffHours = (await db.select().from(workingHours).where(and(
    eq(workingHours.businessId, businessId),
    eq(workingHours.ownerType, 'staff'),
    eq(workingHours.staffMemberId, staffMemberId),
    eq(workingHours.weekday, weekday),
  )).limit(1))[0]
  return intersectLocalIntervals(
    { startLocal: asHm(shopHours.startLocal), endLocal: asHm(shopHours.endLocal) },
    staffHours
      ? { startLocal: asHm(staffHours.startLocal), endLocal: asHm(staffHours.endLocal) }
      : null,
  )
}
