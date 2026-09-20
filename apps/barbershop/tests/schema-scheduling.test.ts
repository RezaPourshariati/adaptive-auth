import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const sql = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../drizzle/0002_curious_scarecrow.sql'),
  'utf8',
)

describe('scheduling migration', () => {
  it('enables gist exclusion on half-open appointment ranges', () => {
    expect(sql).toContain('CREATE EXTENSION IF NOT EXISTS btree_gist')
    expect(sql).toContain('tstzrange("start_at", "end_at", \'[)\')')
    expect(sql).toContain('appointment_no_overlap')
    expect(sql).toContain('WHERE ("status" IN (\'confirmed\', \'completed\'))')
    expect(sql).toContain('calendar_block_staff_no_overlap')
    expect(sql).toContain('calendar_block_shop_no_overlap')
    expect(sql).toContain('appointment_staff_business_fk')
    expect(sql).toContain('appointment_service_service_business_fk')
  })
})
