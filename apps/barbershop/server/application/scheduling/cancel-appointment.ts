import type { DbExecutor } from '../types'
import type { CancelAppointmentInput } from './types'
import { transitionAppointment } from './transition-appointment'

export async function cancelAppointment(db: DbExecutor, input: CancelAppointmentInput) {
  return transitionAppointment(db, { ...input, status: 'cancelled' })
}
