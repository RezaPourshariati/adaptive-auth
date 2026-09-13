import { eq } from 'drizzle-orm'
import { getDb } from '../../db/client'
import { business } from '../../db/schema'
import { assertCancelNoticeHours, assertDepositPercent, assertName } from '../../domain/rules'
import { throwDomain } from '../../utils/http-error'
import { requireStaff } from '../../utils/staff-auth'
import { businessPatchSchema } from '../../validation/config'

export default defineEventHandler(async (event) => {
  const user = await requireStaff(event)
  const parsed = businessPatchSchema.safeParse(await readBody(event))
  if (!parsed.success)
    throw createError({ statusCode: 400, statusMessage: 'Check the business fields and try again.' })

  try {
    assertName(parsed.data.name)
    assertCancelNoticeHours(parsed.data.cancelNoticeHours)
    assertDepositPercent(parsed.data.depositPercent)
  }
  catch (error) {
    throwDomain(error)
  }

  const [updated] = await getDb().update(business).set({
    name: parsed.data.name.trim(),
    phone: parsed.data.phone.trim(),
    email: parsed.data.email.trim(),
    addressLine: parsed.data.addressLine.trim(),
    city: parsed.data.city.trim(),
    region: parsed.data.region.trim(),
    postalCode: parsed.data.postalCode.trim(),
    country: parsed.data.country.trim(),
    cancelNoticeHours: parsed.data.cancelNoticeHours,
    contactInstructions: parsed.data.contactInstructions.trim(),
    depositPercent: parsed.data.depositPercent,
    updatedAt: new Date(),
  }).where(eq(business.id, user.businessId)).returning()

  return { business: updated }
})
