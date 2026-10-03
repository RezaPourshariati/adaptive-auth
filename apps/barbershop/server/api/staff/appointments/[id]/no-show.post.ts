import { markNoShow } from '#server/application/scheduling/mark-no-show'
import { getDb } from '#server/db/client'
import { badRequest, throwDomain } from '#server/utils/http-error'
import { requireStaff } from '#server/utils/staff-auth'

export default defineEventHandler(async (event) => {
  const user = await requireStaff(event)
  const id = getRouterParam(event, 'id')
  if (!id)
    badRequest('Appointment id is required.')

  try {
    return await markNoShow(getDb(), {
      businessId: user.businessId,
      appointmentId: id,
    })
  }
  catch (error) {
    throwDomain(error)
  }
})
