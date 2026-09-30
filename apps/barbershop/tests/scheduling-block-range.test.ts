import { describe, expect, it } from 'vitest'
import { resolveBlockRange } from '../server/application/scheduling/block-range'
import { DomainError } from '../server/domain/rules'

describe('calendar block local times', () => {
  it('converts business-local start and end', () => {
    const range = resolveBlockRange({
      localDate: '2026-09-14',
      startLocal: '10:00',
      endLocal: '11:00',
    }, 'America/Vancouver')
    expect(range.endAt.getTime() - range.startAt.getTime()).toBe(60 * 60_000)
  })

  it('rejects a spring-forward gap', () => {
    expect(() => resolveBlockRange({
      localDate: '2026-03-08',
      startLocal: '02:30',
      endLocal: '03:30',
    }, 'America/Vancouver')).toThrow(DomainError)
  })
})
