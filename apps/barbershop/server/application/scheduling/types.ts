export const APPOINTMENT_SOURCES = ['online', 'phone', 'walk_in', 'staff_created'] as const
export type AppointmentSource = (typeof APPOINTMENT_SOURCES)[number]

export const OCCUPYING_STATUSES = ['confirmed', 'completed'] as const

export interface AvailabilityInput {
  businessId: string
  serviceIds: string[]
  localDate: string
  staffMemberId?: string
}

export interface AvailabilitySlot {
  startAt: string
  startLocal: string
  staffMemberId?: string
}

export interface AvailabilityResult {
  timezone: string
  durationMinutes: number
  slots: AvailabilitySlot[]
}

export interface ReserveAppointmentInput {
  businessId: string
  serviceIds: string[]
  staffMemberId?: string
  source: AppointmentSource
  guestName: string
  guestPhone?: string | null
  guestEmail?: string | null
  notes?: string | null
  startAt?: Date | string
  localDate?: string
  startLocal?: string
}

export interface CancelAppointmentInput {
  businessId: string
  appointmentId: string
}

export interface CreateCalendarBlockInput {
  businessId: string
  staffMemberId?: string | null
  startAt: Date | string
  endAt: Date | string
  title: string
}

export interface UpdateCalendarBlockInput {
  businessId: string
  blockId: string
  staffMemberId?: string | null
  startAt: Date | string
  endAt: Date | string
  title: string
}

export interface CancelCalendarBlockInput {
  businessId: string
  blockId: string
}

export interface GetCalendarDayInput {
  businessId: string
  localDate?: string
  now?: Date
}

export interface CalendarDayStaff {
  id: string
  name: string
  active: boolean
  sortOrder: number
  hours: { startLocal: string, endLocal: string } | null
}

export interface CalendarDayAppointment {
  id: string
  staffMemberId: string
  startAt: string
  endAt: string
  startLocal: string
  endLocal: string
  status: 'confirmed' | 'completed'
  source: AppointmentSource
  guestName: string
  guestPhone: string | null
  guestEmail: string | null
  notes: string | null
  timezone: string
  services: Array<{
    serviceNameSnapshot: string
    durationMinutesSnapshot: number
    priceCentsSnapshot: number
    sortOrder: number
  }>
}

export interface CalendarDayBlock {
  id: string
  staffMemberId: string | null
  startAt: string
  endAt: string
  startLocal: string
  endLocal: string
  title: string
}

export interface CalendarDay {
  date: string
  timezone: string
  today: string
  now: string
  nowLocal: string
  closed: boolean
  shopHours: { startLocal: string, endLocal: string } | null
  staff: CalendarDayStaff[]
  appointments: CalendarDayAppointment[]
  blocks: CalendarDayBlock[]
}
