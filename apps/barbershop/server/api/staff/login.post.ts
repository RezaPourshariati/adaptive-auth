import { eq } from 'drizzle-orm'
import { getDb } from '../../db/client'
import { verifyPassword } from '../../db/password'
import { staffSession, staffUser } from '../../db/schema'
import { badRequest } from '../../utils/http-error'
import { assertLoginAllowed } from '../../utils/login-limit'
import { hashToken, newSessionToken, sessionExpiry, STAFF_COOKIE } from '../../utils/staff-auth'
import { loginBodySchema } from '../../validation/config'

export default defineEventHandler(async (event) => {
  const parsed = loginBodySchema.safeParse(await readBody(event))
  if (!parsed.success)
    badRequest('Email and password are required.')

  const email = parsed.data.email.toLowerCase()
  assertLoginAllowed(`${getRequestIP(event) || 'unknown'}:${email}`)

  const db = getDb()
  const users = await db.select().from(staffUser).where(eq(staffUser.email, email)).limit(1)
  const user = users[0]
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash)))
    badRequest('Invalid email or password.', 'INVALID_CREDENTIALS')

  const token = newSessionToken()
  await db.insert(staffSession).values({
    staffUserId: user.id,
    tokenHash: hashToken(token),
    expiresAt: sessionExpiry(),
  })

  setCookie(event, STAFF_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 12 * 60 * 60,
    secure: process.env.NODE_ENV === 'production',
  })

  return {
    user: { id: user.id, email: user.email, role: user.role, businessId: user.businessId },
  }
})
