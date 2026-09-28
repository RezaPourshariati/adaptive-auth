export interface CalendarHours {
  startLocal: string
  endLocal: string
}

export interface CalendarStaff {
  id: string
  name: string
  active: boolean
  sortOrder: number
  hours: CalendarHours | null
}

export interface CalendarService {
  serviceNameSnapshot: string
  durationMinutesSnapshot: number
  priceCentsSnapshot: number
  sortOrder: number
}

export interface CalendarAppointment {
  id: string
  staffMemberId: string
  startAt: string
  endAt: string
  startLocal: string
  endLocal: string
  status: 'confirmed' | 'completed'
  source: 'online' | 'phone' | 'walk_in' | 'staff_created'
  guestName: string
  guestPhone: string | null
  guestEmail: string | null
  notes: string | null
  timezone: string
  services: CalendarService[]
}

export interface CalendarBlockItem {
  id: string
  staffMemberId: string | null
  startAt: string
  endAt: string
  startLocal: string
  endLocal: string
  title: string
}

export interface CalendarDayView {
  date: string
  timezone: string
  today: string
  now: string
  nowLocal: string
  closed: boolean
  shopHours: CalendarHours | null
  staff: CalendarStaff[]
  appointments: CalendarAppointment[]
  blocks: CalendarBlockItem[]
}

export interface CatalogService {
  id: string
  name: string
  durationMinutes: number
  active: boolean
}
