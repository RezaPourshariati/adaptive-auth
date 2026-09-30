import { describe, expect, it } from 'vitest'
import { cancelAppointment } from '../server/application/scheduling/cancel-appointment'
import { completeAppointment } from '../server/application/scheduling/complete-appointment'
import { markNoShow } from '../server/application/scheduling/mark-no-show'

const appointmentId = '11111111-1111-1111-1111-111111111111'
const businessId = '22222222-2222-2222-2222-222222222222'

function dbWithStatus(status: 'confirmed' | 'completed' | 'cancelled' | 'no_show') {
  const row = { id: appointmentId, businessId, status }
  let updated: { status: string } | undefined
  const db = {
    transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(db),
    execute: async () => [],
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => [{ ...row }],
        }),
      }),
    }),
    update: () => ({
      set: (values: { status: string }) => ({
        where: () => ({
          returning: async () => {
            updated = { ...row, ...values }
            return [updated]
          },
        }),
      }),
    }),
  }
  return { db, getUpdated: () => updated }
}

describe('cancelAppointment transitions', () => {
  it('allows CONFIRMED → CANCELLED', async () => {
    const { db, getUpdated } = dbWithStatus('confirmed')
    const result = await cancelAppointment(db as never, { businessId, appointmentId })
    expect(result.appointment.status).toBe('cancelled')
    expect(getUpdated()?.status).toBe('cancelled')
  })

  it('rejects COMPLETED → CANCELLED', async () => {
    const { db, getUpdated } = dbWithStatus('completed')
    await expect(cancelAppointment(db as never, { businessId, appointmentId }))
      .rejects
      .toMatchObject({ code: 'INVALID_APPOINTMENT' })
    expect(getUpdated()).toBeUndefined()
  })

  it('rejects NO_SHOW → CANCELLED', async () => {
    const { db, getUpdated } = dbWithStatus('no_show')
    await expect(cancelAppointment(db as never, { businessId, appointmentId }))
      .rejects
      .toMatchObject({ code: 'INVALID_APPOINTMENT' })
    expect(getUpdated()).toBeUndefined()
  })

  it('rejects CANCELLED → CANCELLED', async () => {
    const { db, getUpdated } = dbWithStatus('cancelled')
    await expect(cancelAppointment(db as never, { businessId, appointmentId }))
      .rejects
      .toMatchObject({ code: 'APPOINTMENT_ALREADY_CANCELLED' })
    expect(getUpdated()).toBeUndefined()
  })

  it('allows CONFIRMED → COMPLETED', async () => {
    const { db, getUpdated } = dbWithStatus('confirmed')
    const result = await completeAppointment(db as never, { businessId, appointmentId })
    expect(result.appointment.status).toBe('completed')
    expect(getUpdated()?.status).toBe('completed')
  })

  it('allows CONFIRMED → NO_SHOW', async () => {
    const { db, getUpdated } = dbWithStatus('confirmed')
    const result = await markNoShow(db as never, { businessId, appointmentId })
    expect(result.appointment.status).toBe('no_show')
    expect(getUpdated()?.status).toBe('no_show')
  })

  it('rejects COMPLETED → COMPLETED', async () => {
    const { db, getUpdated } = dbWithStatus('completed')
    await expect(completeAppointment(db as never, { businessId, appointmentId }))
      .rejects
      .toMatchObject({ code: 'INVALID_APPOINTMENT' })
    expect(getUpdated()).toBeUndefined()
  })

  it('rejects CANCELLED → NO_SHOW', async () => {
    const { db, getUpdated } = dbWithStatus('cancelled')
    await expect(markNoShow(db as never, { businessId, appointmentId }))
      .rejects
      .toMatchObject({ code: 'INVALID_APPOINTMENT' })
    expect(getUpdated()).toBeUndefined()
  })
})
