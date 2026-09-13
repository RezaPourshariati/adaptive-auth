import { createHash, randomBytes } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { getDb } from '../db/client'
import { staffSession, staffUser } from '../db/schema'
import { unauthorized } from './http-error'

export const STAFF_COOKIE = 'staff_session'
const SESSION_HOURS = 12

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function newSessionToken(): string {
  return randomBytes(32).toString('hex')
}

export function sessionExpiry(from = new Date()): Date {
  return new Date(from.getTime() + SESSION_HOURS * 60 * 60 * 1000)
}

export async function requireStaff(event: Parameters<typeof getCookie>[0]) {
  const token = getCookie(event, STAFF_COOKIE)
  if (!token)
    unauthorized()

  const db = getDb()
  const hash = hashToken(token)
  const rows = await db.select({
    sessionId: staffSession.id,
    expiresAt: staffSession.expiresAt,
    userId: staffUser.id,
    email: staffUser.email,
    role: staffUser.role,
    businessId: staffUser.businessId,
  }).from(staffSession).innerJoin(staffUser, eq(staffSession.staffUserId, staffUser.id)).where(eq(staffSession.tokenHash, hash)).limit(1)

  const row = rows[0]
  if (!row || row.expiresAt.getTime() <= Date.now()) {
    if (row)
      await db.delete(staffSession).where(eq(staffSession.id, row.sessionId))
    unauthorized()
  }

  return {
    id: row.userId,
    email: row.email,
    role: row.role,
    businessId: row.businessId,
  }
}
