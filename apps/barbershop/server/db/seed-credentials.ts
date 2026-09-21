export const DEV_OWNER_EMAIL = 'owner@local.test'
export const DEV_OWNER_PASSWORD = 'changeme'

export function isKnownDevOwnerCredential(email: string, password: string): boolean {
  return email.trim().toLowerCase() === DEV_OWNER_EMAIL || password === DEV_OWNER_PASSWORD
}

/**
 * Local seed may use the known development owner.
 * Production seed requires explicit env vars and refuses those defaults.
 */
export function resolveSeedOwnerCredentials(env: NodeJS.ProcessEnv = process.env): {
  email: string
  password: string
  usedDevelopmentDefaults: boolean
} {
  const email = env.STAFF_OWNER_EMAIL?.trim()
  const password = env.STAFF_OWNER_PASSWORD
  const production = env.NODE_ENV === 'production'

  if (production) {
    if (!email || !password) {
      throw new Error('Production seed requires STAFF_OWNER_EMAIL and STAFF_OWNER_PASSWORD.')
    }
    if (isKnownDevOwnerCredential(email, password)) {
      throw new Error('Refusing to seed known development credentials in production.')
    }
    return { email: email.toLowerCase(), password, usedDevelopmentDefaults: false }
  }

  const resolvedEmail = (email || DEV_OWNER_EMAIL).toLowerCase()
  const resolvedPassword = password || DEV_OWNER_PASSWORD
  return {
    email: resolvedEmail,
    password: resolvedPassword,
    usedDevelopmentDefaults: isKnownDevOwnerCredential(resolvedEmail, resolvedPassword),
  }
}
