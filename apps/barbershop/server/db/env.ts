/** Read DATABASE_URL without throwing. Empty or missing means unconfigured. */
export function readDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string | null {
  const url = env.DATABASE_URL?.trim()
  return url || null
}
