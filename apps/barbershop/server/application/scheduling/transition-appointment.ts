import type { DbExecutor } from '../types'
import type { CancelAppointmentInput } from './types'
import { and, eq, sql } from 'drizzle-orm'
import { appointment } from '../../db/schema'
import { schedulingError } from '../../domain/scheduling/errors'

export type AppointmentTransition = 'cancelled' | 'completed' | 'no_show'

const ILLEGAL_MESSAGE: Record<AppointmentTransition, string> = {
  cancelled: 'Only confirmed appointments can be cancelled.',
  completed: 'Only confirmed appointments can be completed.',
  no_show: 'Only confirmed appointments can be marked no-show.',
}

/**
 * Confirmed appointments may move to cancelled, completed, or no-show.
 * The row lock makes concurrent transitions settle on one winner.
 */
export async function transitionAppointment(
  db: DbExecutor,
  input: CancelAppointmentInput & { status: AppointmentTransition },
) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select id from appointment where id = ${input.appointmentId} and business_id = ${input.businessId} for update`)
    const current = (await tx.select().from(appointment).where(and(
      eq(appointment.id, input.appointmentId),
      eq(appointment.businessId, input.businessId),
    )).limit(1))[0]
    if (!current)
      schedulingError('APPOINTMENT_NOT_FOUND', 'Appointment not found.')
    if (input.status === 'cancelled' && current.status === 'cancelled')
      schedulingError('APPOINTMENT_ALREADY_CANCELLED', 'Appointment is already cancelled.')
    if (current.status !== 'confirmed')
      schedulingError('INVALID_APPOINTMENT', ILLEGAL_MESSAGE[input.status])

    const [updated] = await tx.update(appointment).set({
      status: input.status,
      updatedAt: new Date(),
    }).where(eq(appointment.id, current.id)).returning()
    return { appointment: updated! }
  })
}
