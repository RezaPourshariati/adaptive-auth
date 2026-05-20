import 'dotenv/config'

function readPositiveMs(raw: string | undefined, fallback: number): number {
  if (!raw)
    return fallback
  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed <= 0)
    return fallback
  return parsed
}

function readString(name: string, fallback = ''): string {
  return process.env[name]?.trim() || fallback
}

const nodeEnv = readString('NODE_ENV', 'development')
const isTest = nodeEnv === 'test'

function readBool(name: string, fallback: boolean): boolean {
  const raw = process.env[name]
  if (raw === undefined || raw.trim() === '')
    return fallback
  return raw.toLowerCase() === 'true' || raw === '1'
}

export const config = {
  nodeEnv,
  isTest,
  isDevelopment: nodeEnv === 'development',
  isProduction: nodeEnv === 'production',
  port: Number(readString('PORT', '4000')) || 4000,
  mongoUri: readString('MONGO_URI'),
  jwtSecret: readString('JWT_SECRET'),
  jwtRefreshSecret: readString('JWT_REFRESH_SECRET') || readString('JWT_SECRET'),
  cryptrKey: readString('CRYPTR_KEY'),
  googleClientId: readString('GOOGLE_CLIENT_ID'),
  redisUrl: readString('REDIS_URL') || undefined,
  clientUrl: readString('CLIENT_URL', 'http://localhost:5173'),
  frontendUrl: readString('FRONTEND_URL', 'http://localhost:5173'),
  /** Nuxt app origin for CORS (matches NUXT_PUBLIC_APP_URL in apps/nuxt-app). */
  nuxtPublicAppUrl: readString('NUXT_PUBLIC_APP_URL', 'http://localhost:3000'),
  /** Comma-separated extra origins, e.g. https://app.example.com,http://localhost:3001 */
  corsOrigins: readString('CORS_ORIGINS'),
  email: {
    host: readString('EMAIL_HOST'),
    port: Number(readString('EMAIL_PORT', '587')) || 587,
    user: readString('EMAIL_USER'),
    pass: readString('EMAIL_PASS'),
  },
  devLoginCodeConsoleOnly: readString('DEV_LOGIN_CODE_CONSOLE_ONLY') === 'true',
  /** Structured JSON auth lines to stdout; default off in test env, on otherwise (see LOG_AUTH_TELEMETRY). */
  logAuthTelemetry: readBool('LOG_AUTH_TELEMETRY', !isTest),
  session: {
    refreshLifetimeMs: readPositiveMs(process.env.REFRESH_TOKEN_LIFETIME_MS, 1000 * 60 * 60 * 24 * 2),
    idleTimeoutMs: readPositiveMs(process.env.SESSION_IDLE_TIMEOUT_MS, 1000 * 60 * 30),
    absoluteTimeoutMs: readPositiveMs(process.env.SESSION_ABSOLUTE_TIMEOUT_MS, 1000 * 60 * 60 * 24 * 30),
    lastUsedTouchIntervalMs: readPositiveMs(process.env.SESSION_LAST_USED_TOUCH_INTERVAL_MS, 1000 * 30),
  },
} as const

/** Call once at startup (skipped in test — integration tests set env before import). */
export function assertConfigValid(): void {
  if (isTest)
    return

  const missing: string[] = []
  if (!config.mongoUri)
    missing.push('MONGO_URI')
  if (!config.jwtSecret)
    missing.push('JWT_SECRET')
  if (!config.cryptrKey)
    missing.push('CRYPTR_KEY')

  if (missing.length > 0)
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
}

export function warnIfRateLimitNotDistributed(): void {
  if (config.isProduction && !config.redisUrl) {
    console.warn(
      '[adaptive-auth] REDIS_URL is not set; rate limiting is in-memory per process. '
      + 'Set REDIS_URL for consistent limits across instances.',
    )
  }
}
