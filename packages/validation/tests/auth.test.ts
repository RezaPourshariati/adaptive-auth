import { describe, expect, it } from 'vitest'
import {
  firstZodIssueMessage,
  forgotPasswordBodySchema,
  loginBodySchema,
  parseForgotPasswordBody,
  parseLoginBody,
  parseRegisterBody,
  parseResetPasswordBody,
  registerBodySchema,
  resetPasswordBodySchema,
} from '../src'

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

describe('parseRegisterBody', () => {
  it('returns parsed value on success', () => {
    const r = parseRegisterBody({
      name: 'Ada',
      email: 'ada@example.com',
      password: 'password12',
    })
    expect(r).toEqual({
      ok: true,
      value: { name: 'Ada', email: 'ada@example.com', password: 'password12' },
    })
  })

  it('returns message on failure', () => {
    const r = parseRegisterBody({ name: '', email: 'bad', password: 'x' })
    expect(r.ok).toBe(false)
    if (!r.ok)
      expect(r.message.length).toBeGreaterThan(0)
  })
})

describe('parseLoginBody', () => {
  it('returns parsed value on success', () => {
    const r = parseLoginBody({ email: 'a@b.com', password: 'secret' })
    expect(r.ok).toBe(true)
  })
})

describe('forgotPasswordBodySchema', () => {
  it('requires a valid email', () => {
    const r = forgotPasswordBodySchema.safeParse({ email: 'not-an-email' })
    expect(r.success).toBe(false)
  })
})

describe('resetPasswordBodySchema', () => {
  it('rejects short password', () => {
    const r = resetPasswordBodySchema.safeParse({ password: 'short' })
    expect(r.success).toBe(false)
  })
})

describe('parseForgotPasswordBody', () => {
  it('returns parsed email on success', () => {
    const r = parseForgotPasswordBody({ email: 'user@example.com' })
    expect(r).toEqual({ ok: true, value: { email: 'user@example.com' } })
  })
})

describe('parseResetPasswordBody', () => {
  it('returns parsed password on success', () => {
    const r = parseResetPasswordBody({ password: 'password12' })
    expect(r.ok).toBe(true)
  })
})
