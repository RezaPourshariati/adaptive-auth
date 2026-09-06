import postgres from 'postgres'
import { readDatabaseUrl } from './env'

let sql: ReturnType<typeof postgres> | null = null

export function getSql(): ReturnType<typeof postgres> | null {
  const url = readDatabaseUrl()
  if (!url)
    return null
  if (!sql)
    sql = postgres(url)
  return sql
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
