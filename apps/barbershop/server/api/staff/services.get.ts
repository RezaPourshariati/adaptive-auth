import { asc, eq } from 'drizzle-orm'
import { getDb } from '../../db/client'
import { service } from '../../db/schema'
import { centsToDollars } from '../../domain/rules'
import { requireStaff } from '../../utils/staff-auth'

export default defineEventHandler(async (event) => {
  const user = await requireStaff(event)
  const rows = await getDb().select().from(service).where(eq(service.businessId, user.businessId)).orderBy(asc(service.sortOrder), asc(service.name))

  return {
    services: rows.map(row => ({
      ...row,
      priceDollars: centsToDollars(row.priceCents),
    })),
  }
})
