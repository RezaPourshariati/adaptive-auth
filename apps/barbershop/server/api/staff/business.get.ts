import { eq } from 'drizzle-orm'
import { getDb } from '../../db/client'
import { business } from '../../db/schema'
import { notFound } from '../../utils/http-error'
import { requireStaff } from '../../utils/staff-auth'

export default defineEventHandler(async (event) => {
  const user = await requireStaff(event)
  const rows = await getDb().select().from(business).where(eq(business.id, user.businessId)).limit(1)
  if (!rows[0])
    notFound('Business not found.')
  return { business: rows[0] }
})
