import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { blockRangeForBusiness } from '../../server/application/scheduling/block-range'
import { cancelAppointment } from '../../server/application/scheduling/cancel-appointment'
import { cancelCalendarBlock } from '../../server/application/scheduling/cancel-calendar-block'
import { checkAvailability } from '../../server/application/scheduling/check-availability'
import { completeAppointment } from '../../server/application/scheduling/complete-appointment'
import { createCalendarBlock } from '../../server/application/scheduling/create-calendar-block'
import { getCalendarDay } from '../../server/application/scheduling/get-calendar-day'
import { markNoShow } from '../../server/application/scheduling/mark-no-show'
import { reserveAppointment } from '../../server/application/scheduling/reserve-appointment'
import { updateCalendarBlock } from '../../server/application/scheduling/update-calendar-block'
import {
  appointment,
  appointmentService,
  business,
  calendarBlock,
  service,
  staffMember,
  staffService,
  workingHours,
} from '../../server/db/schema'
import { localToInstant } from '../../server/domain/scheduling/time'

function loadDatabaseUrlFromEnvFile() {
  if (process.env.BARBERSHOP_TEST_DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim())
    return
  const envPath = join(dirname(fileURLToPath(import.meta.url)), '../../.env')
  if (!existsSync(envPath))
    return
  const line = readFileSync(envPath, 'utf8').split(/\r?\n/).find(item => item.startsWith('DATABASE_URL='))
  if (line)
    process.env.DATABASE_URL = line.slice('DATABASE_URL='.length).trim()
}

loadDatabaseUrlFromEnvFile()

const databaseUrl = process.env.BARBERSHOP_TEST_DATABASE_URL?.trim()
  || process.env.DATABASE_URL?.trim()

const describeDb = describe.skipIf(!databaseUrl)
const TZ = 'America/Vancouver'
const DATE = '2026-09-14'
const NOW = localToInstant(DATE, '07:00', TZ)

describeDb('calendar integration', () => {
  const sql = postgres(databaseUrl!)
  const db = drizzle(sql)
  const shops: string[] = []

  beforeAll(async () => {
    await migrate(db, {
      migrationsFolder: join(dirname(fileURLToPath(import.meta.url)), '../../drizzle'),
    })
  })

  afterAll(async () => {
    for (const id of shops)
      await destroyShop(id)
    await sql.end()
  })

  async function destroyShop(id: string) {
    await db.delete(appointmentService).where(eq(appointmentService.businessId, id))
    await db.delete(appointment).where(eq(appointment.businessId, id))
    await db.delete(calendarBlock).where(eq(calendarBlock.businessId, id))
    await db.delete(business).where(eq(business.id, id))
  }

  async function seedShop() {
    const [shop] = await db.insert(business).values({
      name: 'Calendar Shop',
      phone: '+1 604-555-0199',
      email: 'calendar@test.example',
      addressLine: '2 Test St',
      city: 'Vancouver',
      region: 'BC',
      postalCode: 'V5V 1A1',
      country: 'Canada',
      timezone: TZ,
      contactInstructions: 'Call the shop.',
    }).returning()
    shops.push(shop!.id)
    await db.insert(workingHours).values(
      [1, 2, 3, 4, 5, 6].map(weekday => ({
        businessId: shop!.id,
        ownerType: 'business' as const,
        weekday,
        startLocal: '08:00:00',
        endLocal: '19:00:00',
      })),
    )
    const barbers = await db.insert(staffMember).values([
      { businessId: shop!.id, name: 'Moe', active: true, sortOrder: 0 },
      { businessId: shop!.id, name: 'Jamil', active: true, sortOrder: 1 },
    ]).returning()
    const [cut] = await db.insert(service).values({
      businessId: shop!.id,
      name: 'Haircut',
      durationMinutes: 40,
      priceCents: 4000,
      active: true,
    }).returning()
    const moe = barbers.find(item => item.name === 'Moe')!
    const jamil = barbers.find(item => item.name === 'Jamil')!
    await db.insert(staffService).values([
      { businessId: shop!.id, staffMemberId: moe.id, serviceId: cut!.id },
      { businessId: shop!.id, staffMemberId: jamil.id, serviceId: cut!.id },
    ])
    return { shop: shop!, moe, jamil, cut: cut! }
  }

  function reserve(shopId: string, extra: Record<string, unknown>) {
    return reserveAppointment(db, {
      businessId: shopId,
      source: 'online',
      guestName: 'Alex Guest',
      guestPhone: '6045550100',
      localDate: DATE,
      startLocal: '10:00',
      serviceIds: [],
      ...extra,
    } as never)
  }

  it('loads one business day in the shop timezone and omits cancelled visits', async () => {
    const { shop, moe, jamil, cut } = await seedShop()
    const booked = await reserve(shop.id, { staffMemberId: moe.id, serviceIds: [cut.id], source: 'walk_in', guestPhone: null })
    await reserve(shop.id, { staffMemberId: jamil.id, serviceIds: [cut.id], startLocal: '11:00' })
    const other = await seedShop()
    await reserve(other.shop.id, { staffMemberId: other.moe.id, serviceIds: [other.cut.id], guestName: 'Other Shop' })

    let day = await getCalendarDay(db, { businessId: shop.id, localDate: DATE, now: NOW })
    expect(day.timezone).toBe(TZ)
    expect(day.closed).toBe(false)
    expect(day.shopHours).toEqual({ startLocal: '08:00', endLocal: '19:00' })
    expect(day.staff.map(item => item.name)).toEqual(['Moe', 'Jamil'])
    expect(day.appointments).toHaveLength(2)
    expect(day.appointments.find(item => item.id === booked.appointment.id)).toMatchObject({
      source: 'walk_in',
      startLocal: '10:00',
      endLocal: '10:40',
      status: 'confirmed',
    })
    expect(day.appointments.some(item => item.guestName === 'Other Shop')).toBe(false)

    await cancelAppointment(db, { businessId: shop.id, appointmentId: booked.appointment.id })
    day = await getCalendarDay(db, { businessId: shop.id, localDate: DATE, now: NOW })
    expect(day.appointments.some(item => item.id === booked.appointment.id)).toBe(false)
  })

  it('shows a closed day and intersects staff hours', async () => {
    const { shop, moe } = await seedShop()
    const closed = await getCalendarDay(db, { businessId: shop.id, localDate: '2026-09-13', now: NOW })
    expect(closed.closed).toBe(true)
    expect(closed.shopHours).toBeNull()

    await db.insert(workingHours).values({
      businessId: shop.id,
      ownerType: 'staff',
      staffMemberId: moe.id,
      weekday: 1,
      startLocal: '12:00:00',
      endLocal: '16:00:00',
    })
    const day = await getCalendarDay(db, { businessId: shop.id, localDate: DATE, now: NOW })
    expect(day.staff.find(item => item.id === moe.id)?.hours).toEqual({ startLocal: '12:00', endLocal: '16:00' })
    expect(day.staff.find(item => item.name === 'Jamil')?.hours).toEqual({ startLocal: '08:00', endLocal: '19:00' })
  })

  it('keeps an inactive barber when that barber still has a booking', async () => {
    const { shop, moe, cut } = await seedShop()
    await reserve(shop.id, { staffMemberId: moe.id, serviceIds: [cut.id] })
    await db.update(staffMember).set({ active: false }).where(eq(staffMember.id, moe.id))
    const day = await getCalendarDay(db, { businessId: shop.id, localDate: DATE, now: NOW })
    expect(day.staff.some(item => item.id === moe.id && item.active === false)).toBe(true)
  })

  it('treats completed as occupying and no-show as free', async () => {
    const { shop, moe, cut } = await seedShop()
    const booked = await reserve(shop.id, { staffMemberId: moe.id, serviceIds: [cut.id] })
    await completeAppointment(db, { businessId: shop.id, appointmentId: booked.appointment.id })
    let slots = await checkAvailability(db, {
      businessId: shop.id,
      serviceIds: [cut.id],
      localDate: DATE,
      staffMemberId: moe.id,
    }, NOW)
    expect(slots.slots.some(slot => slot.startLocal === '10:00')).toBe(false)
    let day = await getCalendarDay(db, { businessId: shop.id, localDate: DATE, now: NOW })
    expect(day.appointments[0]?.status).toBe('completed')

    await expect(cancelAppointment(db, { businessId: shop.id, appointmentId: booked.appointment.id }))
      .rejects
      .toMatchObject({ code: 'INVALID_APPOINTMENT' })

    const again = await reserve(shop.id, { staffMemberId: moe.id, serviceIds: [cut.id], startLocal: '12:00' })
    await markNoShow(db, { businessId: shop.id, appointmentId: again.appointment.id })
    slots = await checkAvailability(db, {
      businessId: shop.id,
      serviceIds: [cut.id],
      localDate: DATE,
      staffMemberId: moe.id,
    }, NOW)
    expect(slots.slots.some(slot => slot.startLocal === '12:00')).toBe(true)
    day = await getCalendarDay(db, { businessId: shop.id, localDate: DATE, now: NOW })
    expect(day.appointments.some(item => item.id === again.appointment.id)).toBe(false)
    await reserve(shop.id, { staffMemberId: moe.id, serviceIds: [cut.id], startLocal: '12:00' })
  })

  it('creates, updates, and cancels blocks without leaving an overlap', async () => {
    const { shop, moe, cut } = await seedShop()
    const range = await blockRangeForBusiness(db, shop.id, {
      localDate: DATE,
      startLocal: '15:00',
      endLocal: '16:00',
    })
    const created = await createCalendarBlock(db, {
      businessId: shop.id,
      staffMemberId: moe.id,
      title: 'Lunch',
      ...range,
    })
    const renamed = await updateCalendarBlock(db, {
      businessId: shop.id,
      blockId: created.block.id,
      staffMemberId: moe.id,
      title: 'Late lunch',
      startAt: range.startAt,
      endAt: range.endAt,
    })
    expect(renamed.block.title).toBe('Late lunch')

    await reserve(shop.id, { staffMemberId: moe.id, serviceIds: [cut.id], startLocal: '12:00' })
    await expect(updateCalendarBlock(db, {
      businessId: shop.id,
      blockId: created.block.id,
      staffMemberId: moe.id,
      title: 'Late lunch',
      startAt: localToInstant(DATE, '12:00', TZ),
      endAt: localToInstant(DATE, '13:00', TZ),
    })).rejects.toMatchObject({ code: 'CALENDAR_BLOCKED' })

    await cancelCalendarBlock(db, { businessId: shop.id, blockId: created.block.id })
    const slots = await checkAvailability(db, {
      businessId: shop.id,
      serviceIds: [cut.id],
      localDate: DATE,
      staffMemberId: moe.id,
    }, NOW)
    expect(slots.slots.some(slot => slot.startLocal === '15:00')).toBe(true)
    const day = await getCalendarDay(db, { businessId: shop.id, localDate: DATE, now: NOW })
    expect(day.blocks).toHaveLength(0)
  })

  it('lets only one of concurrent complete and cancel win', async () => {
    const { shop, moe, cut } = await seedShop()
    const booked = await reserve(shop.id, { staffMemberId: moe.id, serviceIds: [cut.id] })
    const sqlA = postgres(databaseUrl!)
    const sqlB = postgres(databaseUrl!)
    try {
      const results = await Promise.allSettled([
        completeAppointment(drizzle(sqlA), { businessId: shop.id, appointmentId: booked.appointment.id }),
        cancelAppointment(drizzle(sqlB), { businessId: shop.id, appointmentId: booked.appointment.id }),
      ])
      expect(results.filter(item => item.status === 'fulfilled')).toHaveLength(1)
      expect(results.filter(item => item.status === 'rejected')).toHaveLength(1)
      const row = (await db.select().from(appointment).where(eq(appointment.id, booked.appointment.id)))[0]
      expect(['completed', 'cancelled']).toContain(row?.status)
    }
    finally {
      await sqlA.end()
      await sqlB.end()
    }
  })

  it('does not commit an overlapping block update and reservation', async () => {
    const { shop, moe, cut } = await seedShop()
    const created = await createCalendarBlock(db, {
      businessId: shop.id,
      staffMemberId: moe.id,
      title: 'Errand',
      startAt: localToInstant(DATE, '12:00', TZ),
      endAt: localToInstant(DATE, '13:00', TZ),
    })
    const sqlA = postgres(databaseUrl!)
    const sqlB = postgres(databaseUrl!)
    try {
      const results = await Promise.allSettled([
        reserveAppointment(drizzle(sqlA), {
          businessId: shop.id,
          source: 'walk_in',
          guestName: 'Alex Guest',
          localDate: DATE,
          startLocal: '14:00',
          serviceIds: [cut.id],
          staffMemberId: moe.id,
        }),
        updateCalendarBlock(drizzle(sqlB), {
          businessId: shop.id,
          blockId: created.block.id,
          staffMemberId: moe.id,
          title: 'Errand',
          startAt: localToInstant(DATE, '14:00', TZ),
          endAt: localToInstant(DATE, '15:00', TZ),
        }),
      ])
      expect(results.filter(item => item.status === 'fulfilled')).toHaveLength(1)
      expect(results.filter(item => item.status === 'rejected')).toHaveLength(1)
      const day = await getCalendarDay(db, { businessId: shop.id, localDate: DATE, now: NOW })
      const occupying = day.appointments.filter(item => item.staffMemberId === moe.id)
      const blocks = day.blocks.filter(item => item.staffMemberId === moe.id)
      const overlap = occupying.some(item => blocks.some(block => item.startLocal < block.endLocal && block.startLocal < item.endLocal))
      expect(overlap).toBe(false)
    }
    finally {
      await sqlA.end()
      await sqlB.end()
    }
  })
})
