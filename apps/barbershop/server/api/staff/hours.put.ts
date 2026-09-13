import { replaceBusinessHours } from '../../application/hours'
import { getDb } from '../../db/client'
import { badRequest, throwDomain } from '../../utils/http-error'
import { requireStaff } from '../../utils/staff-auth'
import { hoursPutSchema } from '../../validation/config'

export default defineEventHandler(async (event) => {
  const user = await requireStaff(event)
  const parsed = hoursPutSchema.safeParse(await readBody(event))
  if (!parsed.success)
    badRequest('Working hours must include all 7 days.')

  try {
    const result = await replaceBusinessHours(getDb(), {
      businessId: user.businessId,
      days: parsed.data.days,
    })
    return { ok: true, ...result }
  }
  catch (error) {
    throwDomain(error)
  }
})
