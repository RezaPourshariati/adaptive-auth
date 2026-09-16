import { describe, expect, it } from 'vitest'
import { replaceStaffServices } from '../server/application/staff-services'
import { DomainError } from '../server/domain/rules'

function createEligibilityDb(options: {
  allowedIds?: string[]
  failInsert?: boolean
} = {}) {
  const calls: string[] = []
  const inserted: Array<{ staffMemberId: string, serviceId: string, businessId: string }> = []
  const db = {
    transaction: async (fn: (tx: object) => Promise<void>) => {
      calls.push('begin')
      const tx = {
        select: () => ({
          from: () => ({
            where: async () => (options.allowedIds ?? []).map(id => ({ id })),
          }),
        }),
        delete: () => ({
          where: async () => {
            calls.push('delete')
          },
        }),
        insert: () => ({
          values: async (rows: typeof inserted) => {
            calls.push('insert')
            if (options.failInsert)
              throw new Error('insert failed')
            inserted.push(...rows)
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
  return { db, calls, inserted }
}

const businessId = '11111111-1111-1111-1111-111111111111'
const otherBusinessService = '22222222-2222-2222-2222-222222222222'
const localService = '33333333-3333-3333-3333-333333333333'

describe('replaceStaffServices', () => {
  it('writes business_id on every eligibility row', async () => {
    const { db, inserted, calls } = createEligibilityDb({ allowedIds: [localService] })
    await replaceStaffServices(db as never, {
      businessId,
      staffMemberId: '44444444-4444-4444-4444-444444444444',
      serviceIds: [localService],
    })
    expect(inserted).toEqual([{
      staffMemberId: '44444444-4444-4444-4444-444444444444',
      serviceId: localService,
      businessId,
    }])
    expect(calls).toEqual(['begin', 'delete', 'insert', 'commit'])
  })

  it('rejects a service that is not in the same business', async () => {
    const { db, calls } = createEligibilityDb({ allowedIds: [] })
    await expect(replaceStaffServices(db as never, {
      businessId,
      staffMemberId: '44444444-4444-4444-4444-444444444444',
      serviceIds: [otherBusinessService],
    })).rejects.toBeInstanceOf(DomainError)
    expect(calls).toEqual(['begin', 'rollback'])
  })

  it('rolls back if insert fails after delete', async () => {
    const { db, calls } = createEligibilityDb({ allowedIds: [localService], failInsert: true })
    await expect(replaceStaffServices(db as never, {
      businessId,
      staffMemberId: '44444444-4444-4444-4444-444444444444',
      serviceIds: [localService],
    })).rejects.toThrow('insert failed')
    expect(calls).toEqual(['begin', 'delete', 'insert', 'rollback'])
  })
})
