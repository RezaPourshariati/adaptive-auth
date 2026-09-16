import { reserveAppointment } from '../application/scheduling/reserve-appointment'
import { getDb } from '../db/client'
import { business } from '../db/schema'
import { badRequest, throwDomain } from '../utils/http-error'
import { reserveBodySchema } from '../validation/config'

export default defineEventHandler(async (event) => {
  const parsed = reserveBodySchema.safeParse(await readBody(event))
  if (!parsed.success)
    badRequest('Check the booking fields and try again.')

  try {
    const db = getDb()
    const shop = (await db.select({ id: business.id }).from(business).limit(1))[0]
    if (!shop)
      badRequest('Business is not configured.')
    return await reserveAppointment(db, {
      businessId: shop.id,
      serviceIds: parsed.data.serviceIds,
      staffMemberId: parsed.data.staffMemberId,
      source: parsed.data.source,
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
