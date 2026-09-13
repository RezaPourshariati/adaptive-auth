import { relations, sql } from 'drizzle-orm'
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  time,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const staffRoleEnum = pgEnum('staff_role', ['owner', 'manager', 'barber'])
export const hoursOwnerEnum = pgEnum('hours_owner_type', ['business', 'staff'])
export const appointmentStatusEnum = pgEnum('appointment_status', [
  'confirmed',
  'completed',
  'cancelled',
  'no_show',
])
export const appointmentSourceEnum = pgEnum('appointment_source', [
  'online',
  'phone',
  'walk_in',
  'staff_created',
])

export const business = pgTable('business', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  addressLine: text('address_line').notNull(),
  city: text('city').notNull(),
  region: text('region').notNull(),
  postalCode: text('postal_code').notNull(),
  country: text('country').notNull(),
  timezone: text('timezone').notNull().default('America/Vancouver'),
  cancelNoticeHours: integer('cancel_notice_hours').notNull().default(4),
  lateCancelBehavior: text('late_cancel_behavior').notNull().default('contact_shop'),
  contactInstructions: text('contact_instructions').notNull(),
  depositPercent: integer('deposit_percent').notNull().default(20),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const staffMember = pgTable('staff_member', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessId: uuid('business_id').notNull().references(() => business.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  specialty: text('specialty'),
  active: boolean('active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  unique('staff_member_id_business').on(table.id, table.businessId),
])

export const service = pgTable('service', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessId: uuid('business_id').notNull().references(() => business.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  durationMinutes: integer('duration_minutes').notNull(),
  priceCents: integer('price_cents').notNull(),
  currency: text('currency').notNull().default('CAD'),
  active: boolean('active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  unique('service_business_name').on(table.businessId, table.name),
  unique('service_id_business').on(table.id, table.businessId),
])

export const staffService = pgTable('staff_service', {
  staffMemberId: uuid('staff_member_id').notNull(),
  serviceId: uuid('service_id').notNull(),
  businessId: uuid('business_id').notNull(),
}, table => [
  primaryKey({ columns: [table.staffMemberId, table.serviceId] }),
  foreignKey({
    name: 'staff_service_member_business_fk',
    columns: [table.staffMemberId, table.businessId],
    foreignColumns: [staffMember.id, staffMember.businessId],
  }).onDelete('cascade'),
  foreignKey({
    name: 'staff_service_service_business_fk',
    columns: [table.serviceId, table.businessId],
    foreignColumns: [service.id, service.businessId],
  }).onDelete('cascade'),
])

export const workingHours = pgTable('working_hours', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessId: uuid('business_id').notNull().references(() => business.id, { onDelete: 'cascade' }),
  ownerType: hoursOwnerEnum('owner_type').notNull(),
  staffMemberId: uuid('staff_member_id').references(() => staffMember.id, { onDelete: 'cascade' }),
  weekday: smallint('weekday').notNull(),
  startLocal: time('start_local').notNull(),
  endLocal: time('end_local').notNull(),
}, table => [
  uniqueIndex('working_hours_business_day')
    .on(table.businessId, table.weekday)
    .where(sql`${table.ownerType} = 'business' AND ${table.staffMemberId} IS NULL`),
  uniqueIndex('working_hours_staff_day')
    .on(table.businessId, table.staffMemberId, table.weekday)
    .where(sql`${table.ownerType} = 'staff' AND ${table.staffMemberId} IS NOT NULL`),
  check(
    'working_hours_owner_consistency',
    sql`(
      (${table.ownerType} = 'business' AND ${table.staffMemberId} IS NULL)
      OR (${table.ownerType} = 'staff' AND ${table.staffMemberId} IS NOT NULL)
    )`,
  ),
])

export const staffUser = pgTable('staff_user', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessId: uuid('business_id').notNull().references(() => business.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  passwordHash: text('password_hash').notNull(),
  role: staffRoleEnum('role').notNull().default('owner'),
  staffMemberId: uuid('staff_member_id').references(() => staffMember.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  unique('staff_user_business_email').on(table.businessId, table.email),
])

export const staffSession = pgTable('staff_session', {
  id: uuid('id').defaultRandom().primaryKey(),
  staffUserId: uuid('staff_user_id').notNull().references(() => staffUser.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const appointment = pgTable('appointment', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessId: uuid('business_id').notNull().references(() => business.id, { onDelete: 'restrict' }),
  staffMemberId: uuid('staff_member_id').notNull(),
  startAt: timestamp('start_at', { withTimezone: true }).notNull(),
  endAt: timestamp('end_at', { withTimezone: true }).notNull(),
  timezone: text('timezone').notNull(),
  status: appointmentStatusEnum('status').notNull().default('confirmed'),
  source: appointmentSourceEnum('source').notNull(),
  guestName: text('guest_name').notNull(),
  guestPhone: text('guest_phone'),
  guestEmail: text('guest_email'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  unique('appointment_id_business').on(table.id, table.businessId),
  foreignKey({
    name: 'appointment_staff_business_fk',
    columns: [table.staffMemberId, table.businessId],
    foreignColumns: [staffMember.id, staffMember.businessId],
  }).onDelete('restrict'),
  check('appointment_end_after_start', sql`${table.endAt} > ${table.startAt}`),
  check('appointment_guest_name', sql`char_length(btrim(${table.guestName})) BETWEEN 1 AND 80`),
  index('appointment_business_start').on(table.businessId, table.startAt),
  index('appointment_staff_start').on(table.staffMemberId, table.startAt),
  index('appointment_business_status_start').on(table.businessId, table.status, table.startAt),
])

export const appointmentService = pgTable('appointment_service', {
  id: uuid('id').defaultRandom().primaryKey(),
  appointmentId: uuid('appointment_id').notNull().references(() => appointment.id, { onDelete: 'cascade' }),
  businessId: uuid('business_id').notNull(),
  serviceId: uuid('service_id').notNull(),
  serviceNameSnapshot: text('service_name_snapshot').notNull(),
  durationMinutesSnapshot: integer('duration_minutes_snapshot').notNull(),
  priceCentsSnapshot: integer('price_cents_snapshot').notNull(),
  currencySnapshot: text('currency_snapshot').notNull().default('CAD'),
  sortOrder: integer('sort_order').notNull().default(0),
}, table => [
  foreignKey({
    name: 'appointment_service_appointment_business_fk',
    columns: [table.appointmentId, table.businessId],
    foreignColumns: [appointment.id, appointment.businessId],
  }).onDelete('cascade'),
  foreignKey({
    name: 'appointment_service_service_business_fk',
    columns: [table.serviceId, table.businessId],
    foreignColumns: [service.id, service.businessId],
  }).onDelete('restrict'),
  check(
    'appointment_service_duration',
    sql`${table.durationMinutesSnapshot} >= 10 AND ${table.durationMinutesSnapshot} <= 240`,
  ),
])

export const calendarBlock = pgTable('calendar_block', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessId: uuid('business_id').notNull().references(() => business.id, { onDelete: 'restrict' }),
  staffMemberId: uuid('staff_member_id'),
  startAt: timestamp('start_at', { withTimezone: true }).notNull(),
  endAt: timestamp('end_at', { withTimezone: true }).notNull(),
  title: text('title').notNull(),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  foreignKey({
    name: 'calendar_block_staff_business_fk',
    columns: [table.staffMemberId, table.businessId],
    foreignColumns: [staffMember.id, staffMember.businessId],
  }).onDelete('restrict'),
  check('calendar_block_end_after_start', sql`${table.endAt} > ${table.startAt}`),
  check('calendar_block_title', sql`char_length(btrim(${table.title})) BETWEEN 1 AND 80`),
  index('calendar_block_business_start').on(table.businessId, table.startAt),
  index('calendar_block_staff_start').on(table.staffMemberId, table.startAt),
])

export const businessRelations = relations(business, ({ many }) => ({
  staffMembers: many(staffMember),
  services: many(service),
  workingHours: many(workingHours),
  staffUsers: many(staffUser),
  appointments: many(appointment),
  calendarBlocks: many(calendarBlock),
}))

export const staffMemberRelations = relations(staffMember, ({ one, many }) => ({
  business: one(business, { fields: [staffMember.businessId], references: [business.id] }),
  services: many(staffService),
  appointments: many(appointment),
}))

export const serviceRelations = relations(service, ({ one, many }) => ({
  business: one(business, { fields: [service.businessId], references: [business.id] }),
  staff: many(staffService),
}))

export const staffServiceRelations = relations(staffService, ({ one }) => ({
  staffMember: one(staffMember, { fields: [staffService.staffMemberId], references: [staffMember.id] }),
  service: one(service, { fields: [staffService.serviceId], references: [service.id] }),
}))

export const appointmentRelations = relations(appointment, ({ one, many }) => ({
  business: one(business, { fields: [appointment.businessId], references: [business.id] }),
  staffMember: one(staffMember, { fields: [appointment.staffMemberId], references: [staffMember.id] }),
  services: many(appointmentService),
}))

export const appointmentServiceRelations = relations(appointmentService, ({ one }) => ({
  appointment: one(appointment, { fields: [appointmentService.appointmentId], references: [appointment.id] }),
  service: one(service, { fields: [appointmentService.serviceId], references: [service.id] }),
}))

export const calendarBlockRelations = relations(calendarBlock, ({ one }) => ({
  business: one(business, { fields: [calendarBlock.businessId], references: [business.id] }),
  staffMember: one(staffMember, { fields: [calendarBlock.staffMemberId], references: [staffMember.id] }),
}))
