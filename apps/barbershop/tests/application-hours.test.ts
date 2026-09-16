import { describe, expect, it } from 'vitest'
import { replaceBusinessHours } from '../server/application/hours'
import { DomainError } from '../server/domain/rules'

function openWeek() {
  return [0, 1, 2, 3, 4, 5, 6].map(weekday => ({
    weekday,
    closed: weekday === 0,
    startLocal: '08:00',
    endLocal: '19:00',
  }))
}

function createHoursDb(options?: { failInsert?: boolean }) {
  const calls: string[] = []
  const db = {
    transaction: async (fn: (tx: object) => Promise<void>) => {
      calls.push('begin')
      const tx = {
        delete: () => ({
          where: async () => {
            calls.push('delete')
          },
        }),
        insert: () => ({
          values: async () => {
            calls.push('insert')
            if (options?.failInsert)
              throw new Error('insert failed')
          },
        }),
      }
      try {
        await fn(tx)
        calls.push('commit')
      }
      catch (error) {
        calls.push('rollback')
        throw error
      }
    },
  }
  return { db, calls }
}

describe('replaceBusinessHours', () => {
  it('deletes and inserts inside one transaction', async () => {
    const { db, calls } = createHoursDb()
    const result = await replaceBusinessHours(db as never, {
      businessId: '11111111-1111-1111-1111-111111111111',
      days: openWeek(),
    })
    expect(result.openDays).toBe(6)
    expect(calls).toEqual(['begin', 'delete', 'insert', 'commit'])
  })

  it('does not keep a delete if insert fails', async () => {
    const { db, calls } = createHoursDb({ failInsert: true })
    await expect(replaceBusinessHours(db as never, {
      businessId: '11111111-1111-1111-1111-111111111111',
      days: openWeek(),
    })).rejects.toThrow('insert failed')
    expect(calls).toEqual(['begin', 'delete', 'insert', 'rollback'])
    expect(calls).not.toContain('commit')
  })

  it('rejects an incomplete week before writing', async () => {
    const { db, calls } = createHoursDb()
    await expect(replaceBusinessHours(db as never, {
      businessId: '11111111-1111-1111-1111-111111111111',
      days: openWeek().slice(1),
    })).rejects.toBeInstanceOf(DomainError)
    expect(calls).toEqual([])
  })
})
