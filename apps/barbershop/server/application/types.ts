import type { ExtractTablesWithRelations } from 'drizzle-orm'
import type { PgQueryResultHKT, PgTransaction } from 'drizzle-orm/pg-core'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type * as schema from '../db/schema'

/** Drizzle handle. Use cases accept this instead of an H3 event. */
export type BarbershopDb = PostgresJsDatabase<typeof schema>

export type BarbershopTx = PgTransaction<
  PgQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>

export type DbExecutor = BarbershopDb | BarbershopTx
