import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const sql = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../drizzle/0001_remarkable_slyde.sql'),
  'utf8',
)

describe('working_hours uniqueness migration', () => {
  it('replaces the NULL-unsafe unique constraint with partial unique indexes', () => {
    expect(sql).toContain('DROP CONSTRAINT "working_hours_unique_day"')
    expect(sql).toMatch(/CREATE UNIQUE INDEX "working_hours_business_day"[\s\S]*WHERE[\s\S]*owner_type" = 'business'[\s\S]*staff_member_id" IS NULL/)
    expect(sql).toMatch(/CREATE UNIQUE INDEX "working_hours_staff_day"[\s\S]*WHERE[\s\S]*owner_type" = 'staff'[\s\S]*staff_member_id" IS NOT NULL/)
    expect(sql).toContain('working_hours_owner_consistency')
  })
})

describe('staff_service tenant isolation migration', () => {
  it('adds business_id and composite foreign keys to the same business', () => {
    expect(sql).toContain('ADD COLUMN "business_id" uuid')
    expect(sql).toContain('SET "business_id" = "sm"."business_id"')
    expect(sql).toContain('staff_service_member_business_fk')
    expect(sql).toContain('staff_service_service_business_fk')
    expect(sql).toContain('UNIQUE("id","business_id")')
  })
})
