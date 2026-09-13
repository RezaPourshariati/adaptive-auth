import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { hashPassword } from './password'
import {
  business,
  service,
  staffMember,
  staffService,
  staffUser,
  workingHours,
} from './schema'
import {
  SEED_BARBERS,
  SEED_BUSINESS,
  SEED_CLOSE,
  SEED_OPEN,
  SEED_SERVICES,
  WEEKDAYS,
} from './seed-catalog'
import { resolveSeedOwnerCredentials } from './seed-credentials'

async function main() {
  const url = process.env.DATABASE_URL?.trim()
  if (!url)
    throw new Error('DATABASE_URL is required to seed.')

  const { email, password, usedDevelopmentDefaults } = resolveSeedOwnerCredentials()
  const client = postgres(url)
  const db = drizzle(client)

  const existing = await db.select({ id: business.id }).from(business).limit(1)
  if (existing[0]) {
    console.log(`Seed skipped: business ${existing[0].id} already exists.`)
    await client.end()
    return
  }

  const [shop] = await db.insert(business).values(SEED_BUSINESS).returning()
  if (!shop)
    throw new Error('Failed to insert business.')

  await db.insert(workingHours).values(
    WEEKDAYS.map(weekday => ({
      businessId: shop.id,
      ownerType: 'business' as const,
      staffMemberId: null,
      weekday,
      startLocal: SEED_OPEN,
      endLocal: SEED_CLOSE,
    })),
  )

  const barbers = await db.insert(staffMember).values(
    SEED_BARBERS.map(row => ({
      businessId: shop.id,
      name: row.name,
      specialty: row.specialty,
      active: true,
      sortOrder: row.sortOrder,
    })),
  ).returning()

  const services = await db.insert(service).values(
    SEED_SERVICES.map(row => ({
      businessId: shop.id,
      name: row.name,
      description: row.description,
      durationMinutes: row.durationMinutes,
      priceCents: row.priceCents,
      currency: 'CAD',
      active: true,
      sortOrder: row.sortOrder,
    })),
  ).returning()

  const assignments = []
  for (const barber of barbers) {
    const seedBarber = SEED_BARBERS.find(item => item.name === barber.name)
    for (const item of services) {
      const catalog = SEED_SERVICES.find(row => row.name === item.name)
      if (catalog?.specialtyOnly && !seedBarber?.includeSpecialtyServices)
        continue
      assignments.push({ staffMemberId: barber.id, serviceId: item.id, businessId: shop.id })
    }
  }
  if (assignments.length)
    await db.insert(staffService).values(assignments)

  await db.insert(staffUser).values({
    businessId: shop.id,
    email,
    passwordHash: await hashPassword(password),
    role: 'owner',
  })

  const ownerCount = await db.select({ id: staffUser.id }).from(staffUser).where(eq(staffUser.email, email))
  if (!ownerCount[0])
    throw new Error('Failed to insert owner.')

  console.log(`Seeded business ${shop.id} with ${barbers.length} barbers and ${services.length} services.`)
  if (usedDevelopmentDefaults)
    console.log(`Development owner login: ${email} (not for production)`)
  else
    console.log(`Owner login: ${email}`)
  await client.end()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
