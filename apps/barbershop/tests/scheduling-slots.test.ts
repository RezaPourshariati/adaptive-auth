import { describe, expect, it } from 'vitest'
import { rangesOverlap, subtractRanges } from '../server/domain/scheduling/ranges'
import { generateSlotStarts } from '../server/domain/scheduling/slots'
import { addMinutes, localToInstant } from '../server/domain/scheduling/time'

const TZ = 'America/Vancouver'

describe('half-open ranges', () => {
  it('treats adjacent appointments as non-overlapping', () => {
    const left = {
      start: localToInstant('2026-09-14', '10:00', TZ),
      end: localToInstant('2026-09-14', '10:40', TZ),
    }
    const right = {
      start: localToInstant('2026-09-14', '10:40', TZ),
      end: localToInstant('2026-09-14', '11:20', TZ),
    }
    expect(rangesOverlap(left, right)).toBe(false)
  })

  it('detects a true overlap', () => {
    const left = {
      start: localToInstant('2026-09-14', '10:00', TZ),
      end: localToInstant('2026-09-14', '10:40', TZ),
    }
    const right = {
      start: localToInstant('2026-09-14', '10:20', TZ),
      end: localToInstant('2026-09-14', '11:00', TZ),
    }
    expect(rangesOverlap(left, right)).toBe(true)
  })

  it('subtracts a busy interval from a free window', () => {
    const free = {
      start: localToInstant('2026-09-14', '10:00', TZ),
      end: localToInstant('2026-09-14', '11:00', TZ),
    }
    const busy = [{
      start: localToInstant('2026-09-14', '10:20', TZ),
      end: localToInstant('2026-09-14', '10:40', TZ),
    }]
    const open = subtractRanges(free, busy)
    expect(open).toHaveLength(2)
    expect(open[0]?.end).toEqual(busy[0]!.start)
    expect(open[1]?.start).toEqual(busy[0]!.end)
  })
})

describe('10-minute slots', () => {
  it('fits a 40-minute service into a 60-minute window', () => {
    const start = localToInstant('2026-09-14', '10:00', TZ)
    const end = localToInstant('2026-09-14', '11:00', TZ)
    const slots = generateSlotStarts('2026-09-14', start, end, 40, TZ, localToInstant('2026-09-14', '08:00', TZ))
    expect(slots.map(slot => slot.toISOString())).toEqual([
      localToInstant('2026-09-14', '10:00', TZ).toISOString(),
      localToInstant('2026-09-14', '10:10', TZ).toISOString(),
      localToInstant('2026-09-14', '10:20', TZ).toISOString(),
    ])
  })

  it('drops starts that are already in the past', () => {
    const start = localToInstant('2026-09-14', '10:00', TZ)
    const end = localToInstant('2026-09-14', '11:00', TZ)
    const now = localToInstant('2026-09-14', '10:15', TZ)
    const slots = generateSlotStarts('2026-09-14', start, end, 40, TZ, now)
    expect(slots.map(slot => addMinutes(slot, 0).toISOString())).toEqual([
      localToInstant('2026-09-14', '10:20', TZ).toISOString(),
    ])
  })
})
