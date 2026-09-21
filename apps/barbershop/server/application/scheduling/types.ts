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
