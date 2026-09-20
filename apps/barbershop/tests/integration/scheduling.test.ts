import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { cancelAppointment } from '../../server/application/scheduling/cancel-appointment'
import { checkAvailability } from '../../server/application/scheduling/check-availability'
import { createCalendarBlock } from '../../server/application/scheduling/create-calendar-block'
import { reserveAppointment } from '../../server/application/scheduling/reserve-appointment'
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
import { DomainError } from '../../server/domain/rules'
import { rangesOverlap } from '../../server/domain/scheduling/ranges'
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

describeDb('scheduling integration', () => {
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
      name: 'Test Shop',
      phone: '+1 604-555-0100',
      email: 'shop@test.example',
      addressLine: '1 Test St',
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
      { businessId: shop!.id, name: 'Inactive', active: false, sortOrder: 2 },
    ]).returning()
    const services = await db.insert(service).values([
      { businessId: shop!.id, name: 'Haircut', durationMinutes: 40, priceCents: 4000, active: true },
      { businessId: shop!.id, name: 'Beard Trim', durationMinutes: 20, priceCents: 2500, active: true },
      { businessId: shop!.id, name: 'Retired Cut', durationMinutes: 40, priceCents: 4000, active: false },
    ]).returning()
    const moe = barbers.find(item => item.name === 'Moe')!
    const jamil = barbers.find(item => item.name === 'Jamil')!
    const cut = services.find(item => item.name === 'Haircut')!
    const beard = services.find(item => item.name === 'Beard Trim')!
    await db.insert(staffService).values([
      { businessId: shop!.id, staffMemberId: moe.id, serviceId: cut.id },
      { businessId: shop!.id, staffMemberId: moe.id, serviceId: beard.id },
      { businessId: shop!.id, staffMemberId: jamil.id, serviceId: cut.id },
    ])
    return { shop: shop!, moe, jamil, cut, beard, inactive: barbers.find(item => item.name === 'Inactive')! }
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

  it('creates an appointment with service snapshots', async () => {
    const { shop, moe, cut } = await seedShop()
    const result = await reserve(shop.id, { staffMemberId: moe.id, serviceIds: [cut.id] })
    expect(result.appointment.status).toBe('confirmed')
    expect(result.appointment.staffMemberId).toBe(moe.id)
    expect(result.services[0]).toMatchObject({
      serviceId: cut.id,
      serviceNameSnapshot: 'Haircut',
      durationMinutesSnapshot: 40,
      priceCentsSnapshot: 4000,
    })
    await db.update(service).set({ name: 'New Cut', priceCents: 9900, durationMinutes: 50 }).where(eq(service.id, cut.id))
    const stored = await db.select().from(appointmentService).where(eq(appointmentService.appointmentId, result.appointment.id))
    expect(stored[0]).toMatchObject({
      serviceNameSnapshot: 'Haircut',
      priceCentsSnapshot: 4000,
      durationMinutesSnapshot: 40,
    })
  })

  it('rejects inactive service, inactive barber, and ineligible barber', async () => {
    const { shop, moe, jamil, cut, beard, inactive } = await seedShop()
    const retired = (await db.select().from(service).where(eq(service.businessId, shop.id))).find(item => item.name === 'Retired Cut')!
    await expect(reserve(shop.id, { staffMemberId: moe.id, serviceIds: [retired.id] }))
      .rejects
      .toMatchObject({ code: 'SERVICE_INACTIVE' })
    await expect(reserve(shop.id, { staffMemberId: inactive.id, serviceIds: [cut.id] }))
      .rejects
      .toMatchObject({ code: 'STAFF_INACTIVE' })
    await expect(reserve(shop.id, { staffMemberId: jamil.id, serviceIds: [beard.id] }))
      .rejects
      .toMatchObject({ code: 'STAFF_NOT_ELIGIBLE' })
  })

  it('rejects closed days and times outside hours', async () => {
    const { shop, moe, cut } = await seedShop()
    await expect(reserve(shop.id, { staffMemberId: moe.id, serviceIds: [cut.id], localDate: '2026-09-13' }))
      .rejects
      .toMatchObject({ code: 'OUTSIDE_WORKING_HOURS' })
    await expect(reserve(shop.id, { staffMemberId: moe.id, serviceIds: [cut.id], startLocal: '19:00' }))
      .rejects
      .toMatchObject({ code: 'OUTSIDE_WORKING_HOURS' })
  })

  it('blocks confirmed and completed appointments but not cancelled or no-show', async () => {
    const { shop, moe, cut } = await seedShop()
    const first = await reserve(shop.id, { staffMemberId: moe.id, serviceIds: [cut.id] })
    let slots = await checkAvailability(db, { businessId: shop.id, serviceIds: [cut.id], localDate: DATE, staffMemberId: moe.id }, NOW)
    expect(slots.slots.some(slot => slot.startLocal === '10:00')).toBe(false)

    await cancelAppointment(db, { businessId: shop.id, appointmentId: first.appointment.id })
    slots = await checkAvailability(db, { businessId: shop.id, serviceIds: [cut.id], localDate: DATE, staffMemberId: moe.id }, NOW)
    expect(slots.slots.some(slot => slot.startLocal === '10:00')).toBe(true)

    const again = await reserve(shop.id, { staffMemberId: moe.id, serviceIds: [cut.id] })
    await db.update(appointment).set({ status: 'no_show' }).where(eq(appointment.id, again.appointment.id))
    slots = await checkAvailability(db, { businessId: shop.id, serviceIds: [cut.id], localDate: DATE, staffMemberId: moe.id }, NOW)
    expect(slots.slots.some(slot => slot.startLocal === '10:00')).toBe(true)

    const third = await reserve(shop.id, { staffMemberId: moe.id, serviceIds: [cut.id] })
    await db.update(appointment).set({ status: 'completed' }).where(eq(appointment.id, third.appointment.id))
    slots = await checkAvailability(db, { businessId: shop.id, serviceIds: [cut.id], localDate: DATE, staffMemberId: moe.id }, NOW)
    expect(slots.slots.some(slot => slot.startLocal === '10:00')).toBe(false)
  })

  it('respects staff and shop-wide calendar blocks', async () => {
    const { shop, moe, jamil, cut } = await seedShop()
    await createCalendarBlock(db, {
      businessId: shop.id,
      staffMemberId: moe.id,
      startAt: localToInstant(DATE, '10:00', TZ),
      endAt: localToInstant(DATE, '11:00', TZ),
      title: 'Lunch',
    })
    let moeSlots = await checkAvailability(db, { businessId: shop.id, serviceIds: [cut.id], localDate: DATE, staffMemberId: moe.id }, NOW)
    let jamilSlots = await checkAvailability(db, { businessId: shop.id, serviceIds: [cut.id], localDate: DATE, staffMemberId: jamil.id }, NOW)
    expect(moeSlots.slots.some(slot => slot.startLocal === '10:00')).toBe(false)
    expect(jamilSlots.slots.some(slot => slot.startLocal === '10:00')).toBe(true)

    await createCalendarBlock(db, {
      businessId: shop.id,
      startAt: localToInstant(DATE, '12:00', TZ),
      endAt: localToInstant(DATE, '13:00', TZ),
      title: 'Staff meeting',
    })
    moeSlots = await checkAvailability(db, { businessId: shop.id, serviceIds: [cut.id], localDate: DATE, staffMemberId: moe.id }, NOW)
    jamilSlots = await checkAvailability(db, { businessId: shop.id, serviceIds: [cut.id], localDate: DATE, staffMemberId: jamil.id }, NOW)
    expect(moeSlots.slots.some(slot => slot.startLocal === '12:00')).toBe(false)
    expect(jamilSlots.slots.some(slot => slot.startLocal === '12:00')).toBe(false)
  })

  it('sums multiple services and requires eligibility for all of them', async () => {
    const { shop, moe, cut, beard } = await seedShop()
    const result = await reserve(shop.id, { staffMemberId: moe.id, serviceIds: [cut.id, beard.id] })
    expect(result.appointment.endAt.getTime() - result.appointment.startAt.getTime()).toBe(60 * 60_000)
    expect(result.services).toHaveLength(2)
  })

  it('allows adjacent appointments and rejects overlapping ones', async () => {
    const { shop, moe, cut } = await seedShop()
    await reserve(shop.id, { staffMemberId: moe.id, serviceIds: [cut.id], startLocal: '10:00' })
    await expect(reserve(shop.id, { staffMemberId: moe.id, serviceIds: [cut.id], startLocal: '10:20' }))
      .rejects
      .toBeInstanceOf(DomainError)
    const next = await reserve(shop.id, { staffMemberId: moe.id, serviceIds: [cut.id], startLocal: '10:40' })
    expect(next.appointment.startAt).toEqual(localToInstant(DATE, '10:40', TZ))
  })

  it('rejects a failed reservation without leaving appointment rows', async () => {
    const { shop, moe, cut } = await seedShop()
    await expect(reserve(shop.id, { staffMemberId: moe.id, serviceIds: [cut.id], startLocal: '18:40' }))
      .rejects
      .toMatchObject({ code: 'OUTSIDE_WORKING_HOURS' })
    const rows = await db.select().from(appointment).where(eq(appointment.businessId, shop.id))
    expect(rows).toHaveLength(0)
  })

  it('lets only one of two concurrent same-barber reserves succeed', async () => {
    const { shop, moe, cut } = await seedShop()
    const results = await Promise.allSettled([
      reserve(shop.id, { staffMemberId: moe.id, serviceIds: [cut.id] }),
      reserve(shop.id, { staffMemberId: moe.id, serviceIds: [cut.id] }),
    ])
    const ok = results.filter(item => item.status === 'fulfilled')
    const failed = results.filter(item => item.status === 'rejected')
    expect(ok).toHaveLength(1)
    expect(failed).toHaveLength(1)
    expect((failed[0] as PromiseRejectedResult).reason).toMatchObject({ code: 'SLOT_UNAVAILABLE' })
  })

  it('assigns concurrent Any Barber requests to different barbers', async () => {
    const { shop, cut } = await seedShop()
    const results = await Promise.all([
      reserve(shop.id, { serviceIds: [cut.id] }),
      reserve(shop.id, { serviceIds: [cut.id] }),
    ])
    const staffIds = results.map(item => item.appointment.staffMemberId)
    expect(new Set(staffIds).size).toBe(2)
  })

  it('intersects staff-specific hours with business hours', async () => {
    const { shop, moe, cut } = await seedShop()
    await db.insert(workingHours).values({
      businessId: shop.id,
      ownerType: 'staff',
      staffMemberId: moe.id,
      weekday: 1,
      startLocal: '12:00:00',
      endLocal: '16:00:00',
    })
    const slots = await checkAvailability(db, {
      businessId: shop.id,
      serviceIds: [cut.id],
      localDate: DATE,
      staffMemberId: moe.id,
    }, NOW)
    expect(slots.slots.some(slot => slot.startLocal === '10:00')).toBe(false)
    expect(slots.slots.some(slot => slot.startLocal === '12:00')).toBe(true)
  })

  it('rejects a service from another business', async () => {
    const first = await seedShop()
    const second = await seedShop()
    await expect(reserve(first.shop.id, { staffMemberId: first.moe.id, serviceIds: [second.cut.id] }))
      .rejects
      .toMatchObject({ code: 'SERVICE_NOT_FOUND' })
  })

  async function assertNoOccupyingAppointmentBlockOverlap(shopId: string) {
    const appointments = await db.select().from(appointment).where(eq(appointment.businessId, shopId))
    const blocks = await db.select().from(calendarBlock).where(eq(calendarBlock.businessId, shopId))
    const occupying = appointments.filter(item => item.status === 'confirmed' || item.status === 'completed')
    const activeBlocks = blocks.filter(item => item.cancelledAt == null)
    const overlap = occupying.some(item => activeBlocks.some(block =>
      rangesOverlap({ start: item.startAt, end: item.endAt }, { start: block.startAt, end: block.endAt })
      && (block.staffMemberId == null || block.staffMemberId === item.staffMemberId),
    ))
    expect(overlap).toBe(false)
    return { occupying, activeBlocks }
  }

  it('does not commit an overlapping staff block and appointment at the same time', async () => {
    const { shop, moe, cut } = await seedShop()
    const sqlA = postgres(databaseUrl!)
    const sqlB = postgres(databaseUrl!)
    try {
      const results = await Promise.allSettled([
        reserveAppointment(drizzle(sqlA), {
          businessId: shop.id,
          source: 'online',
          guestName: 'Alex Guest',
          guestPhone: '6045550100',
          localDate: DATE,
          startLocal: '10:00',
          serviceIds: [cut.id],
          staffMemberId: moe.id,
        }),
        createCalendarBlock(drizzle(sqlB), {
          businessId: shop.id,
          staffMemberId: moe.id,
          startAt: localToInstant(DATE, '10:00', TZ),
          endAt: localToInstant(DATE, '11:00', TZ),
          title: 'Lunch',
        }),
      ])
      const succeeded = results.filter(item => item.status === 'fulfilled')
      const failed = results.filter(item => item.status === 'rejected')
      expect(succeeded.length).toBe(1)
      expect(failed.length).toBe(1)
      expect((failed[0] as PromiseRejectedResult).reason).toBeInstanceOf(DomainError)
      await assertNoOccupyingAppointmentBlockOverlap(shop.id)
    }
    finally {
      await sqlA.end()
      await sqlB.end()
    }
  })

  it('does not commit an overlapping shop-wide block and appointment at the same time', async () => {
    const { shop, moe, cut } = await seedShop()
    const sqlA = postgres(databaseUrl!)
    const sqlB = postgres(databaseUrl!)
    try {
      const results = await Promise.allSettled([
        reserveAppointment(drizzle(sqlA), {
          businessId: shop.id,
          source: 'online',
          guestName: 'Alex Guest',
          guestPhone: '6045550100',
          localDate: DATE,
          startLocal: '10:00',
          serviceIds: [cut.id],
          staffMemberId: moe.id,
        }),
        createCalendarBlock(drizzle(sqlB), {
          businessId: shop.id,
          startAt: localToInstant(DATE, '10:00', TZ),
          endAt: localToInstant(DATE, '11:00', TZ),
          title: 'Staff meeting',
        }),
      ])
      const succeeded = results.filter(item => item.status === 'fulfilled')
      const failed = results.filter(item => item.status === 'rejected')
      expect(succeeded.length).toBe(1)
      expect(failed.length).toBe(1)
      expect((failed[0] as PromiseRejectedResult).reason).toBeInstanceOf(DomainError)
      await assertNoOccupyingAppointmentBlockOverlap(shop.id)
    }
    finally {
      await sqlA.end()
      await sqlB.end()
    }
  })
})
