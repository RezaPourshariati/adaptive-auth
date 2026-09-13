import { describe, expect, it } from 'vitest'
import { SEED_SERVICES } from '../server/db/seed-catalog'
import {
  assertCompleteWeek,
  assertServiceDuration,
  assertTimeRange,
  centsToDollars,
  dollarsToCents,
  DomainError,
  normalizeTime,
} from '../server/domain/rules'

describe('service rules', () => {
  it('accepts seed catalog durations', () => {
    for (const service of SEED_SERVICES)
      expect(() => assertServiceDuration(service.durationMinutes)).not.toThrow()
  })

  it('rejects durations off the 5-minute grid', () => {
    expect(() => assertServiceDuration(45)).not.toThrow()
    expect(() => assertServiceDuration(42)).toThrow(DomainError)
  })

  it('converts dollars to cents', () => {
    expect(dollarsToCents(40)).toBe(4000)
    expect(centsToDollars(4000)).toBe('40.00')
  })
})

describe('working hours', () => {
  it('normalizes HH:MM to HH:MM:00', () => {
    expect(normalizeTime('08:00')).toBe('08:00:00')
  })

  it('rejects inverted ranges', () => {
    expect(() => assertTimeRange('19:00', '08:00')).toThrow(DomainError)
  })

  it('requires each weekday once', () => {
    expect(() => assertCompleteWeek([0, 1, 2, 3, 4, 5, 6])).not.toThrow()
    expect(() => assertCompleteWeek([1, 2, 3, 4, 5, 6])).toThrow(DomainError)
  })
})
