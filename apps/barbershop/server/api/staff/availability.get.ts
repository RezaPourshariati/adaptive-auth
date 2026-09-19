import { checkAvailability } from '../../application/scheduling/check-availability'
import { getDb } from '../../db/client'
import { badRequest, throwDomain } from '../../utils/http-error'
import { requireStaff } from '../../utils/staff-auth'
import { availabilityQuerySchema } from '../../validation/config'

export default defineEventHandler(async (event) => {
  const user = await requireStaff(event)
  const parsed = availabilityQuerySchema.safeParse(getQuery(event))
  if (!parsed.success)
    badRequest('Date and serviceIds are required.')

  const serviceIds = Array.isArray(parsed.data.serviceIds)
    ? parsed.data.serviceIds
    : [parsed.data.serviceIds]

  try {
    return await checkAvailability(getDb(), {
      businessId: user.businessId,
      serviceIds,
      localDate: parsed.data.localDate,
      staffMemberId: parsed.data.staffMemberId,
    })
  }
  catch (error) {
    throwDomain(error)
  }
})
