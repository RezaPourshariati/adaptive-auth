import { describe, expect, it } from 'vitest'
import { pickBarberOrder } from '../server/application/scheduling/pick-barber'

describe('any Barber order', () => {
  it('sorts by sort_order then id', () => {
    const ordered = pickBarberOrder([
      { id: 'b', sortOrder: 1 },
      { id: 'a', sortOrder: 1 },
      { id: 'c', sortOrder: 0 },
    ])
    expect(ordered.map(item => item.id)).toEqual(['c', 'a', 'b'])
  })
})
