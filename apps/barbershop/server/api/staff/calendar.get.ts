import { getCalendarDay } from '../../application/scheduling/get-calendar-day'
import { getDb } from '../../db/client'
import { badRequest, throwDomain } from '../../utils/http-error'
import { requireStaff } from '../../utils/staff-auth'
import { calendarQuerySchema } from '../../validation/config'

export default defineEventHandler(async (event) => {
  const user = await requireStaff(event)
  const parsed = calendarQuerySchema.safeParse(getQuery(event))
  if (!parsed.success)
    badRequest('Choose a valid date.')

  try {
    return await getCalendarDay(getDb(), {
      businessId: user.businessId,
      localDate: parsed.data.date,
      now: new Date(),
    })
  }
  catch (error) {
    throwDomain(error)
  }
})
