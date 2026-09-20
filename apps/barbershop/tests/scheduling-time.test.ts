import { describe, expect, it } from 'vitest'
import { DomainError } from '../server/domain/rules'
import { localToInstant, sundayWeekday } from '../server/domain/scheduling/time'

const TZ = 'America/Vancouver'

describe('timezone conversion', () => {
  it('does not treat Vancouver local time as UTC', () => {
    const instant = localToInstant('2026-01-15', '08:00', TZ)
    expect(instant.toISOString()).toBe('2026-01-15T16:00:00.000Z')
  })

  it('maps Sunday correctly for working hours', () => {
    expect(sundayWeekday('2026-09-13', TZ)).toBe(0)
    expect(sundayWeekday('2026-09-14', TZ)).toBe(1)
  })
})

describe('dST', () => {
  it('rejects the spring-forward gap', () => {
    expect(() => localToInstant('2026-03-08', '02:30', TZ)).toThrow(DomainError)
  })

  it('resolves the fall-back overlap to the earlier instant', () => {
    const instant = localToInstant('2026-11-01', '01:30', TZ)
    expect(instant.toISOString()).toBe('2026-11-01T08:30:00.000Z')
  })
})
