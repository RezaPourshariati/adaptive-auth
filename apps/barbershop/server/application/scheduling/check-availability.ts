import type { DbExecutor } from '../types'
import type { AvailabilityInput, AvailabilityResult } from './types'
import { and, eq, inArray } from 'drizzle-orm'
import { business, service, staffMember, staffService, workingHours } from '../../db/schema'
import { DomainError } from '../../domain/rules'
import { schedulingError } from '../../domain/scheduling/errors'
import { intersectLocalIntervals } from '../../domain/scheduling/hours'
import { subtractRanges } from '../../domain/scheduling/ranges'
import { generateSlotStarts } from '../../domain/scheduling/slots'
import { formatLocalHm, localDayBounds, localToInstant, sundayWeekday } from '../../domain/scheduling/time'
import { blocksForBarber, loadActiveBlocks, loadOccupyingAppointments } from './occupancy'

function asHm(value: unknown): string {
  if (typeof value === 'string')
    return value.slice(0, 5)
  return String(value).slice(0, 5)
}

export async function checkAvailability(
  db: DbExecutor,
  input: AvailabilityInput,
  now = new Date(),
): Promise<AvailabilityResult> {
  const shop = await loadBusiness(db, input.businessId)
  const catalog = await loadActiveServices(db, input.businessId, input.serviceIds)
  const durationMinutes = catalog.reduce((sum, item) => sum + item.durationMinutes, 0)
  const weekday = sundayWeekday(input.localDate, shop.timezone)
  const day = localDayBounds(input.localDate, shop.timezone)
  const businessHours = await loadHours(db, {
    businessId: shop.id,
    ownerType: 'business',
    weekday,
  })
  if (!businessHours) {
    return { timezone: shop.timezone, durationMinutes, slots: [] }
  }

  const candidates = await loadEligibleBarbers(db, {
    businessId: shop.id,
    serviceIds: catalog.map(item => item.id),
    staffMemberId: input.staffMemberId,
  })
  if (!candidates.length) {
    if (input.staffMemberId)
      schedulingError('STAFF_NOT_ELIGIBLE', 'That barber cannot perform the requested services.')
    return { timezone: shop.timezone, durationMinutes, slots: [] }
  }

  const appointments = await loadOccupyingAppointments(db, {
    businessId: shop.id,
    staffMemberIds: candidates.map(item => item.id),
    range: day,
  })
  const blocks = await loadActiveBlocks(db, {
    businessId: shop.id,
    staffMemberIds: candidates.map(item => item.id),
    range: day,
  })

  const starts = new Map<number, string | undefined>()
  for (const barber of candidates) {
    const staffHours = await loadHours(db, {
      businessId: shop.id,
      ownerType: 'staff',
      weekday,
      staffMemberId: barber.id,
    })
    const effective = intersectLocalIntervals(businessHours, staffHours)
    if (!effective)
      continue
    const freeStart = localToInstant(input.localDate, effective.startLocal, shop.timezone)
    const freeEnd = localToInstant(input.localDate, effective.endLocal, shop.timezone)
    const busy = [
      ...appointments.filter(item => item.staffMemberId === barber.id),
      ...blocksForBarber(blocks, barber.id),
    ]
    const open = subtractRanges({ start: freeStart, end: freeEnd }, busy)
    for (const range of open) {
      for (const instant of generateSlotStarts(
        input.localDate,
        range.start,
        range.end,
        durationMinutes,
        shop.timezone,
        now,
      )) {
        starts.set(instant.getTime(), input.staffMemberId ? barber.id : undefined)
      }
    }
  }

  const slots = [...starts.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([time, staffMemberId]) => {
      const startAt = new Date(time)
      return {
        startAt: startAt.toISOString(),
        startLocal: formatLocalHm(startAt, shop.timezone),
        ...(staffMemberId ? { staffMemberId } : {}),
      }
    })

  return { timezone: shop.timezone, durationMinutes, slots }
}

async function loadBusiness(db: DbExecutor, businessId: string) {
  const rows = await db.select().from(business).where(eq(business.id, businessId)).limit(1)
  if (!rows[0])
    schedulingError('BUSINESS_NOT_FOUND', 'Business not found.')
  return rows[0]
}

async function loadActiveServices(db: DbExecutor, businessId: string, serviceIds: string[]) {
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
  return uniqueIds.map(id => rows.find(item => item.id === id)!)
}

async function loadEligibleBarbers(
  db: DbExecutor,
  input: { businessId: string, serviceIds: string[], staffMemberId?: string },
) {
  const members = await db.select().from(staffMember).where(and(
    eq(staffMember.businessId, input.businessId),
    input.staffMemberId ? eq(staffMember.id, input.staffMemberId) : undefined,
  ))
  if (input.staffMemberId && !members[0])
    schedulingError('STAFF_NOT_FOUND', 'Barber not found.')
  if (input.staffMemberId && members[0] && !members[0].active)
    schedulingError('STAFF_INACTIVE', 'That barber is not available.')

  const active = members.filter(item => item.active)
  if (!active.length)
    return []
  const links = await db.select().from(staffService).where(and(
    eq(staffService.businessId, input.businessId),
    inArray(staffService.staffMemberId, active.map(item => item.id)),
  ))
  return active.filter((member) => {
    const offered = new Set(
      links.filter(link => link.staffMemberId === member.id).map(link => link.serviceId),
    )
    return input.serviceIds.every(id => offered.has(id))
  })
}

async function loadHours(
  db: DbExecutor,
  input: {
    businessId: string
    ownerType: 'business' | 'staff'
    weekday: number
    staffMemberId?: string
  },
) {
  const rows = await db.select().from(workingHours).where(and(
    eq(workingHours.businessId, input.businessId),
    eq(workingHours.ownerType, input.ownerType),
    eq(workingHours.weekday, input.weekday),
    input.ownerType === 'staff' && input.staffMemberId
      ? eq(workingHours.staffMemberId, input.staffMemberId)
      : undefined,
  )).limit(1)
  const row = rows[0]
  if (!row)
    return null
  return { startLocal: asHm(row.startLocal), endLocal: asHm(row.endLocal) }
}
