import { describe, expect, it } from 'vitest'
import {
  DEV_OWNER_EMAIL,
  DEV_OWNER_PASSWORD,
  resolveSeedOwnerCredentials,
} from '../server/db/seed-credentials'

describe('resolveSeedOwnerCredentials', () => {
  it('uses development defaults when env is unset', () => {
    const result = resolveSeedOwnerCredentials({})
    expect(result).toEqual({
      email: DEV_OWNER_EMAIL,
      password: DEV_OWNER_PASSWORD,
      usedDevelopmentDefaults: true,
    })
  })

  it('refuses production seed without explicit credentials', () => {
    expect(() => resolveSeedOwnerCredentials({ NODE_ENV: 'production' }))
      .toThrow(/STAFF_OWNER_EMAIL/)
  })

  it('refuses known development credentials in production', () => {
    expect(() => resolveSeedOwnerCredentials({
      NODE_ENV: 'production',
      STAFF_OWNER_EMAIL: DEV_OWNER_EMAIL,
      STAFF_OWNER_PASSWORD: 'a-real-secret',
    })).toThrow(/development credentials/)

    expect(() => resolveSeedOwnerCredentials({
      NODE_ENV: 'production',
      STAFF_OWNER_EMAIL: 'owner@shop.example',
      STAFF_OWNER_PASSWORD: DEV_OWNER_PASSWORD,
    })).toThrow(/development credentials/)
  })

  it('accepts explicit non-default production credentials', () => {
    expect(resolveSeedOwnerCredentials({
      NODE_ENV: 'production',
      STAFF_OWNER_EMAIL: 'owner@shop.example',
      STAFF_OWNER_PASSWORD: 'a-real-secret',
    })).toEqual({
      email: 'owner@shop.example',
      password: 'a-real-secret',
      usedDevelopmentDefaults: false,
    })
  })
})
