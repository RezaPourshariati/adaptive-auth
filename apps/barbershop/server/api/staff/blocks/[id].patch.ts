import { blockRangeForBusiness } from '#server/application/scheduling/block-range'
import { updateCalendarBlock } from '#server/application/scheduling/update-calendar-block'
import { getDb } from '#server/db/client'
import { badRequest, throwDomain } from '#server/utils/http-error'
import { requireStaff } from '#server/utils/staff-auth'
import { calendarBlockUpdateSchema } from '#server/validation/config'

export default defineEventHandler(async (event) => {
  const user = await requireStaff(event)
  const id = getRouterParam(event, 'id')
  if (!id)
    badRequest('Block id is required.')
  const parsed = calendarBlockUpdateSchema.safeParse(await readBody(event))
  if (!parsed.success)
    badRequest('Check the block fields and try again.')

  try {
    const db = getDb()
    const range = await blockRangeForBusiness(db, user.businessId, parsed.data)
    return await updateCalendarBlock(db, {
      businessId: user.businessId,
      blockId: id,
      staffMemberId: parsed.data.staffMemberId,
      startAt: range.startAt,
      endAt: range.endAt,
      title: parsed.data.title,
    })
  }
  catch (error) {
    throwDomain(error)
  }
})
