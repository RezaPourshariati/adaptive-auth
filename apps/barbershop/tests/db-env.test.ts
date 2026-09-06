import { describe, expect, it } from 'vitest'
import { readDatabaseUrl } from '../server/db/env'

describe('readDatabaseUrl', () => {
  it('returns null when DATABASE_URL is missing', () => {
    expect(readDatabaseUrl({})).toBeNull()
  })

  it('returns null when DATABASE_URL is blank', () => {
    expect(readDatabaseUrl({ DATABASE_URL: '  ' })).toBeNull()
  })

  it('returns a trimmed connection string', () => {
    expect(readDatabaseUrl({ DATABASE_URL: '  postgres://localhost/shop  ' }))
      .toBe('postgres://localhost/shop')
  })
})
