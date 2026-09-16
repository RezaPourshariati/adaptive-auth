import { reserveAppointment } from '../../application/scheduling/reserve-appointment'
import { getDb } from '../../db/client'
import { badRequest, throwDomain } from '../../utils/http-error'
import { requireStaff } from '../../utils/staff-auth'
import { reserveBodySchema } from '../../validation/config'

export default defineEventHandler(async (event) => {
  const user = await requireStaff(event)
  const parsed = reserveBodySchema.safeParse(await readBody(event))
  if (!parsed.success)
    badRequest('Check the booking fields and try again.')

  try {
    return await reserveAppointment(getDb(), {
      businessId: user.businessId,
      serviceIds: parsed.data.serviceIds,
      staffMemberId: parsed.data.staffMemberId,
      source: parsed.data.source === 'online' ? 'staff_created' : parsed.data.source,
      guestName: parsed.data.guestName,
      guestPhone: parsed.data.guestPhone,
      guestEmail: parsed.data.guestEmail,
      notes: parsed.data.notes,
      localDate: parsed.data.localDate,
      startLocal: parsed.data.startLocal,
      startAt: parsed.data.startAt,
    })
  }
  catch (error) {
    throwDomain(error)
  }
})
