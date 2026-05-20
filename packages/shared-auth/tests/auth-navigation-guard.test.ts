import type { RouteLocationNormalized } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createResolveAuthRedirect } from '../src'

const resolveAuthRedirect = createResolveAuthRedirect({
  home: { name: 'Home' },
  login: { name: 'Login' },
  unauthorized: { name: 'Unauthorized' },
})

function makeTo(partial: Partial<RouteLocationNormalized> & { path: string, fullPath: string, meta: Record<string, unknown> }): RouteLocationNormalized {
  return {
    name: undefined,
    params: {},
    query: {},
    hash: '',
    matched: [],
    redirectedFrom: undefined,
    ...partial,
  } as RouteLocationNormalized
}

describe('resolveAuthRedirect', () => {
  const bootstrapAuth = vi.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    bootstrapAuth.mockClear()
  })

  it('calls bootstrapAuth when auth is not checked', async () => {
    const store = {
      authChecked: false,
      isAuthenticated: false,
      sessionExpiryCode: null,
      hasRole: () => false,
      bootstrapAuth,
    }
    const to = makeTo({ path: '/', fullPath: '/', meta: {} })
    await resolveAuthRedirect(to, store)
    expect(bootstrapAuth).toHaveBeenCalledTimes(1)
  })

  it('redirects guest from guestOnly route when authenticated', async () => {
    const store = {
      authChecked: true,
      isAuthenticated: true,
      sessionExpiryCode: null,
      hasRole: () => false,
      bootstrapAuth,
    }
    const to = makeTo({
      path: '/login',
      fullPath: '/login',
      meta: { guestOnly: true },
    })
    const r = await resolveAuthRedirect(to, store)
    expect(r).toEqual({ name: 'Home' })
  })

  it('redirects unauthenticated user to Login with redirect query', async () => {
    const store = {
      authChecked: true,
      isAuthenticated: false,
      sessionExpiryCode: 'SESSION_IDLE_EXPIRED',
      hasRole: () => false,
      bootstrapAuth,
    }
    const to = makeTo({
      path: '/users',
      fullPath: '/users',
      meta: { requiresAuth: true },
    })
    const r = await resolveAuthRedirect(to, store)
    expect(r).toEqual({
      name: 'Login',
      query: { redirect: '/users', session: 'SESSION_IDLE_EXPIRED' },
    })
  })

  it('redirects to Unauthorized when roles required but none match', async () => {
    const store = {
      authChecked: true,
      isAuthenticated: true,
      sessionExpiryCode: null,
      hasRole: (role: string) => role === 'subscriber',
      bootstrapAuth,
    }
    const to = makeTo({
      path: '/users',
      fullPath: '/users',
      meta: { requiresAuth: true, roles: ['admin', 'author'] },
    })
    const r = await resolveAuthRedirect(to, store)
    expect(r).toEqual({ name: 'Unauthorized' })
  })

  it('allows navigation when user has a required role', async () => {
    const store = {
      authChecked: true,
      isAuthenticated: true,
      sessionExpiryCode: null,
      hasRole: (role: string) => role === 'admin',
      bootstrapAuth,
    }
    const to = makeTo({
      path: '/users',
      fullPath: '/users',
      meta: { requiresAuth: true, roles: ['admin', 'author'] },
    })
    const r = await resolveAuthRedirect(to, store)
    expect(r).toBe(true)
  })

  it('uses path-based redirects when configured', async () => {
    const pathGuard = createResolveAuthRedirect({
      home: { path: '/' },
      login: { path: '/login' },
      unauthorized: { path: '/unauthorized' },
    })
    const store = {
      authChecked: true,
      isAuthenticated: false,
      sessionExpiryCode: null,
      hasRole: () => false,
      bootstrapAuth,
    }
    const to = makeTo({
      path: '/dashboard',
      fullPath: '/dashboard',
      meta: { requiresAuth: true },
    })
    const r = await pathGuard(to, store)
    expect(r).toEqual({
      path: '/login',
      query: { redirect: '/dashboard' },
    })
  })
})
