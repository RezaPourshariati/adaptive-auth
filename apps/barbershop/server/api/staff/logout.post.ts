import { eq } from 'drizzle-orm'
import { getDb } from '../../db/client'
import { staffSession } from '../../db/schema'
import { hashToken, STAFF_COOKIE } from '../../utils/staff-auth'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, STAFF_COOKIE)
  if (token) {
    await getDb().delete(staffSession).where(eq(staffSession.tokenHash, hashToken(token)))
  }
  deleteCookie(event, STAFF_COOKIE, { path: '/' })
  return { ok: true }
})
