import { createCalendarBlock } from '../../application/scheduling/create-calendar-block'
import { getDb } from '../../db/client'
import { badRequest, throwDomain } from '../../utils/http-error'
import { requireStaff } from '../../utils/staff-auth'
import { calendarBlockBodySchema } from '../../validation/config'

export default defineEventHandler(async (event) => {
  const user = await requireStaff(event)
  const parsed = calendarBlockBodySchema.safeParse(await readBody(event))
  if (!parsed.success)
    badRequest('Check the block fields and try again.')

  try {
    return await createCalendarBlock(getDb(), {
      businessId: user.businessId,
      staffMemberId: parsed.data.staffMemberId,
      startAt: parsed.data.startAt,
      endAt: parsed.data.endAt,
      title: parsed.data.title,
    })
  }
  catch (error) {
    throwDomain(error)
  }
})
