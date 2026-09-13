import { and, eq } from 'drizzle-orm'
import { getDb } from '../../db/client'
import { workingHours } from '../../db/schema'
import { requireStaff } from '../../utils/staff-auth'

const LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default defineEventHandler(async (event) => {
  const user = await requireStaff(event)
  const rows = await getDb().select().from(workingHours).where(and(
    eq(workingHours.businessId, user.businessId),
    eq(workingHours.ownerType, 'business'),
  ))

  const byDay = new Map(rows.map(row => [row.weekday, row]))
  const days = LABELS.map((label, weekday) => {
    const row = byDay.get(weekday)
    return {
      weekday,
      label,
      closed: !row,
      startLocal: row?.startLocal?.slice(0, 5) ?? '08:00',
      endLocal: row?.endLocal?.slice(0, 5) ?? '19:00',
    }
  })

  return { days }
})
