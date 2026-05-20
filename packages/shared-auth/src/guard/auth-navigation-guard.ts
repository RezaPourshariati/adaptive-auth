import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'

/** Minimal surface used by `resolveAuthRedirect` for tests and production. */
export interface AuthStoreForGuard {
  authChecked: boolean
  isAuthenticated: boolean
  sessionExpiryCode: string | null
  hasRole: (role: string) => boolean
  bootstrapAuth: () => Promise<void>
}

/** Named or path-based targets for auth guard redirects. */
export type AuthGuardRedirectTarget
  = | { name: string }
    | { path: string }

export interface AuthGuardRedirects {
  home: AuthGuardRedirectTarget
  login: AuthGuardRedirectTarget
  unauthorized: AuthGuardRedirectTarget
}

function toRouteLocation(
  target: AuthGuardRedirectTarget,
  query?: Record<string, string>,
): RouteLocationRaw {
  if ('name' in target)
    return query ? { name: target.name, query } : { name: target.name }
  return query ? { path: target.path, query } : { path: target.path }
}

/**
 * Router navigation resolution for auth (guest-only, requiresAuth, roles).
 * Kept pure of router registration so it can be unit-tested without mounting an app.
 */
export function createResolveAuthRedirect(redirects: AuthGuardRedirects) {
  return async function resolveAuthRedirect(
    to: RouteLocationNormalized,
    authStore: AuthStoreForGuard,
  ): Promise<RouteLocationRaw | true> {
    if (!authStore.authChecked)
      await authStore.bootstrapAuth()

    if (to.meta.guestOnly && authStore.isAuthenticated)
      return toRouteLocation(redirects.home)

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
      const query: Record<string, string> = { redirect: to.fullPath }
      if (authStore.sessionExpiryCode)
        query.session = authStore.sessionExpiryCode
      return toRouteLocation(redirects.login, query)
    }

    const roles = to.meta.roles
    if (Array.isArray(roles) && roles.length > 0) {
      const roleList = roles as string[]
      const hasAnyRole = roleList.some(role => authStore.hasRole(role))
      if (!hasAnyRole)
        return toRouteLocation(redirects.unauthorized)
    }

    return true
  }
}
