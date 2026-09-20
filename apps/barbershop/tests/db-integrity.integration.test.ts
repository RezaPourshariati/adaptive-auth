import { describe, it } from 'vitest'

const databaseUrl = process.env.DATABASE_URL?.trim()

describe.skipIf(!databaseUrl)('postgresql constraint behavior', () => {
  // Requires a migrated database. This file is skipped when DATABASE_URL is unset.
  it.todo('documents PostgreSQL constraint behavior against a migrated database')
})
