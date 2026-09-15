import { drizzle } from 'drizzle-orm/postgres-js'
import { createError } from 'nuxt/app'
import postgres from 'postgres'
import { readDatabaseUrl } from './env'
import * as schema from './schema'

let sql: ReturnType<typeof postgres> | null = null

export function getSql(): ReturnType<typeof postgres> | null {
  const url = readDatabaseUrl()
  if (!url)
    return null
  if (!sql)
    sql = postgres(url)
  return sql
}

export function getDb() {
  const client = getSql()
  if (!client)
    throw createError({ status: 503, statusText: 'Database is not configured.' })
  return drizzle(client, { schema })
}

export function requireSql() {
  const client = getSql()
  if (!client)
    throw createError({ status: 503, statusText: 'Database is not configured.' })
  return client
}

export async function pingDatabase(): Promise<'up' | 'down' | 'unconfigured'> {
  const client = getSql()
  if (!client)
    return 'unconfigured'
  try {
    await client`select 1`
    return 'up'
  }
  catch {
    return 'down'
  }
}
