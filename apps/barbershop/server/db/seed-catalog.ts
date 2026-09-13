/** Seed defaults. Editable in the dashboard. Not claimed as the shop's final menu. */
export interface SeedService {
  name: string
  description: string
  durationMinutes: number
  priceCents: number
  sortOrder: number
  specialtyOnly?: boolean
}

export interface SeedBarber {
  name: string
  specialty: string | null
  sortOrder: number
  includeSpecialtyServices: boolean
}

export const SEED_TIMEZONE = 'America/Vancouver'
export const SEED_OPEN = '08:00:00'
export const SEED_CLOSE = '19:00:00'
export const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const

export const SEED_BUSINESS = {
  name: 'Crypto Barber Shop',
  phone: '+1 604-695-5907',
  email: 'contact@cryptobarbershops.com',
  addressLine: '1285 Kingsway',
  city: 'Vancouver',
  region: 'BC',
  postalCode: 'V5V 3E2',
  country: 'Canada',
  timezone: SEED_TIMEZONE,
  cancelNoticeHours: 4,
  lateCancelBehavior: 'contact_shop',
  contactInstructions: 'Please call the shop to cancel or reschedule within the notice window.',
  depositPercent: 20,
}

/** Names from the current public site. */
export const SEED_BARBERS: SeedBarber[] = [
  { name: 'Moe', specialty: 'Fades', sortOrder: 0, includeSpecialtyServices: true },
  { name: 'Jamil', specialty: null, sortOrder: 1, includeSpecialtyServices: false },
  { name: 'Jay', specialty: 'Fades', sortOrder: 2, includeSpecialtyServices: true },
  { name: 'Shams', specialty: null, sortOrder: 3, includeSpecialtyServices: false },
  { name: 'Asad', specialty: null, sortOrder: 4, includeSpecialtyServices: false },
]

/**
 * Core names follow the live WordPress menu. Durations follow a 10-minute grid.
 * Prices are CAD example defaults for a Vancouver men's shop (2026), except the
 * lineup combo which uses the $40 figure published on the current site.
 */
export const SEED_SERVICES: SeedService[] = [
  {
    name: 'Haircut',
    description: 'Standard mens cut and style.',
    durationMinutes: 40,
    priceCents: 4000,
    sortOrder: 0,
  },
  {
    name: 'Skin Fade',
    description: 'Tapered fade from skin on the sides to longer hair on top.',
    durationMinutes: 45,
    priceCents: 4500,
    sortOrder: 1,
  },
  {
    name: 'Beard Trim',
    description: 'Beard shape, trim, and lineup.',
    durationMinutes: 20,
    priceCents: 2500,
    sortOrder: 2,
  },
  {
    name: 'Haircut & Beard',
    description: 'Full cut plus beard trim in one visit.',
    durationMinutes: 60,
    priceCents: 5500,
    sortOrder: 3,
  },
  {
    name: 'Fade, Beard Trim & Lineup',
    description: 'Fade with beard trim and hot-towel lineup.',
    durationMinutes: 55,
    priceCents: 4000,
    sortOrder: 4,
  },
  {
    name: 'Kids Fade',
    description: 'Fade or cut for children.',
    durationMinutes: 35,
    priceCents: 3000,
    sortOrder: 5,
  },
  {
    name: 'Senior Haircut',
    description: 'Shorter, lower-maintenance cut.',
    durationMinutes: 40,
    priceCents: 3000,
    sortOrder: 6,
  },
  {
    name: 'Hot Towel Shave',
    description: 'Straight-razor shave with hot towel.',
    durationMinutes: 40,
    priceCents: 4000,
    sortOrder: 7,
  },
  {
    name: 'Hair Design',
    description: 'Custom hair design. Assigned only to some barbers in the seed.',
    durationMinutes: 50,
    priceCents: 5000,
    sortOrder: 8,
    specialtyOnly: true,
  },
]
