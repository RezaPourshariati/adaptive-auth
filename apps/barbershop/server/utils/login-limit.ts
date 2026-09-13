const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 10
const attempts = new Map<string, { count: number, resetAt: number }>()

export function assertLoginAllowed(key: string): void {
  const now = Date.now()
  const current = attempts.get(key)
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return
  }
  current.count += 1
  if (current.count > MAX_ATTEMPTS) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many sign-in attempts. Try again in a few minutes.',
    })
  }
}
