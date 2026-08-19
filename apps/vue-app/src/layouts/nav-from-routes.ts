import type { RouteMeta, Router, RouteRecordNormalized } from 'vue-router'
import type { NavGroup, NavLink } from './types'

export interface NavVisibility {
  isAuthenticated: boolean
  hasRole: (role: string) => boolean
}

function resolvePath(route: RouteRecordNormalized): string | null {
  if (!route.name)
    return null
  // Prefer the concrete path Vue Router computed for this record.
  if (route.path && !route.path.includes(':') && !route.path.includes('*'))
    return route.path
  return null
}

function canShowMeta(meta: RouteMeta, visibility: NavVisibility): boolean {
  if (!meta.showInNav)
    return false

  if (meta.guestOnly)
    return !visibility.isAuthenticated

  if (meta.requiresAuth && !visibility.isAuthenticated)
    return false

  if (meta.roles?.length) {
    if (!visibility.isAuthenticated)
      return false
    if (!meta.roles.some(role => visibility.hasRole(role)))
      return false
  }

  return true
}

/**
 * Builds primary-nav links from route `meta` (`showInNav`, `navGroup`, `navOrder`, `title`).
 * Uses `router.resolve` so parent meta (`requiresAuth`, `layout`, …) merges with the leaf.
 */
export function buildNavLinks(
  router: Router,
  visibility: NavVisibility,
  groups?: NavGroup[],
): NavLink[] {
  const allowedGroups = groups ? new Set(groups) : null

  return router
    .getRoutes()
    .flatMap((route) => {
      // Leaf opt-in only — parent layout routes should not set showInNav.
      if (!route.meta.showInNav)
        return []

      const path = resolvePath(route)
      if (!path)
        return []

      const resolvedMeta = router.resolve(path).meta
      if (!canShowMeta(resolvedMeta, visibility))
        return []

      const title = resolvedMeta.title
      const navGroup = resolvedMeta.navGroup
      if (!title || !navGroup)
        return []

      if (allowedGroups && !allowedGroups.has(navGroup))
        return []

      return [{
        name: title,
        path,
        navGroup,
        navOrder: resolvedMeta.navOrder ?? 100,
      }]
    })
    .sort((a, b) => a.navOrder - b.navOrder || a.name.localeCompare(b.name))
}
