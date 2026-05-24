export interface SidebarNavItem {
  name: string
  path: string
  icon: string
  roles?: string[]
}

const baseLinks: SidebarNavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: 'pi pi-chart-bar' },
  { name: 'Profile', path: '/profile', icon: 'pi pi-user' },
  { name: 'Change password', path: '/change-password', icon: 'pi pi-lock' },
  { name: 'Users', path: '/users', icon: 'pi pi-users', roles: ['admin', 'author'] },
]

export function useSidebarNav() {
  const auth = useAuthStore()
  const route = useRoute()

  const links = computed(() =>
    baseLinks.filter((link) => {
      if (!link.roles?.length)
        return true
      return link.roles.some(role => auth.hasRole(role))
    }),
  )

  function isActive(path: string) {
    return route.path === path || route.path.startsWith(`${path}/`)
  }

  return { links, isActive }
}
