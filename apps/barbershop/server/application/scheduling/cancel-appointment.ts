import type { DbExecutor } from '../types'
import type { CancelAppointmentInput } from './types'
import { and, eq } from 'drizzle-orm'
import { appointment } from '../../db/schema'
import { schedulingError } from '../../domain/scheduling/errors'

export async function cancelAppointment(db: DbExecutor, input: CancelAppointmentInput) {
  const rows = await db.select().from(appointment).where(and(
    eq(appointment.id, input.appointmentId),
    eq(appointment.businessId, input.businessId),
  )).limit(1)
  const current = rows[0]
  if (!current)
    schedulingError('APPOINTMENT_NOT_FOUND', 'Appointment not found.')
  if (current.status === 'cancelled')
    schedulingError('APPOINTMENT_ALREADY_CANCELLED', 'Appointment is already cancelled.')
  if (current.status !== 'confirmed')
    schedulingError('INVALID_APPOINTMENT', 'Only confirmed appointments can be cancelled.')

  const [updated] = await db.update(appointment).set({
    status: 'cancelled',
    updatedAt: new Date(),
  }).where(eq(appointment.id, current.id)).returning()
  return { appointment: updated! }
}
