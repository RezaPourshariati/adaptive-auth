import { checkAvailability } from '../application/scheduling/check-availability'
import { getDb } from '../db/client'
import { business } from '../db/schema'
import { badRequest, throwDomain } from '../utils/http-error'
import { availabilityQuerySchema } from '../validation/config'

export default defineEventHandler(async (event) => {
  const parsed = availabilityQuerySchema.safeParse(getQuery(event))
  if (!parsed.success)
    badRequest('Date and serviceIds are required.')

  const serviceIds = Array.isArray(parsed.data.serviceIds)
    ? parsed.data.serviceIds
    : [parsed.data.serviceIds]

  try {
    const db = getDb()
    const shop = (await db.select({ id: business.id }).from(business).limit(1))[0]
    if (!shop)
      badRequest('Business is not configured.')
    return await checkAvailability(db, {
      businessId: shop.id,
      serviceIds,
      localDate: parsed.data.localDate,
      staffMemberId: parsed.data.staffMemberId,
    })
  }
  catch (error) {
    throwDomain(error)
  }
})
