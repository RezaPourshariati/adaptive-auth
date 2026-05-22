import { describe, expect, it } from 'vitest'
import { firstZodIssueMessage, loginBodySchema, registerBodySchema } from '../src'

describe('registerBodySchema', () => {
  it('accepts valid payload', () => {
    const r = registerBodySchema.safeParse({
      name: 'Ada',
      email: 'ada@example.com',
      password: 'password12',
    })
    expect(r.success).toBe(true)
  })

  it('rejects short password', () => {
    const r = registerBodySchema.safeParse({
      name: 'Ada',
      email: 'ada@example.com',
      password: 'short',
    })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(firstZodIssueMessage(r.error)).toMatch(/8 characters/)
  })

  it('rejects empty name', () => {
    const r = registerBodySchema.safeParse({
      name: '   ',
      email: 'ada@example.com',
      password: 'password12',
    })
    expect(r.success).toBe(false)
  })
})

describe('loginBodySchema', () => {
  it('requires email and password', () => {
    const r = loginBodySchema.safeParse({ email: '', password: '' })
    expect(r.success).toBe(false)
  })
})
