import { describe, expect, it } from 'vitest'
import { intersectLocalIntervals } from '../server/domain/scheduling/hours'

describe('working-hour intersection', () => {
  it('uses business hours when staff hours are absent', () => {
    expect(intersectLocalIntervals(
      { startLocal: '08:00', endLocal: '19:00' },
      null,
    )).toEqual({ startLocal: '08:00', endLocal: '19:00' })
  })

  it('intersects staff hours with business hours', () => {
    expect(intersectLocalIntervals(
      { startLocal: '08:00', endLocal: '19:00' },
      { startLocal: '10:00', endLocal: '16:00' },
    )).toEqual({ startLocal: '10:00', endLocal: '16:00' })
  })

  it('returns no availability when the shop is closed', () => {
    expect(intersectLocalIntervals(null, { startLocal: '10:00', endLocal: '16:00' })).toBeNull()
  })

  it('returns no availability when the intersection is empty', () => {
    expect(intersectLocalIntervals(
      { startLocal: '08:00', endLocal: '12:00' },
      { startLocal: '13:00', endLocal: '19:00' },
    )).toBeNull()
  })
})
