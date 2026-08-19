import type { RouteRecordRaw } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { buildNavLinks } from '@/layouts/nav-from-routes'

const EmptyView = { template: '<div />' }

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: EmptyView,
    meta: { showInNav: true, navGroup: 'public', navOrder: 10, title: 'Home' },
  },
  {
    path: '/about',
    name: 'About',
    component: EmptyView,
    meta: { showInNav: true, navGroup: 'public', navOrder: 20, title: 'About' },
  },
  {
    path: '/login',
    name: 'Login',
    component: EmptyView,
    meta: {
      guestOnly: true,
      showInNav: true,
      navGroup: 'guest',
      navOrder: 80,
      title: 'Login',
    },
  },
  {
    path: '/',
    component: EmptyView,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: EmptyView,
        meta: { showInNav: true, navGroup: 'app', navOrder: 50, title: 'Dashboard' },
      },
      {
        path: 'users',
        name: 'Users',
        component: EmptyView,
        meta: {
          roles: ['admin', 'author'],
          showInNav: true,
          navGroup: 'admin',
          navOrder: 70,
          title: 'Users',
        },
      },
    ],
  },
  {
    path: '/hidden',
    name: 'Hidden',
    component: EmptyView,
    meta: { title: 'Hidden' },
  },
]

describe('buildNavLinks', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('shows public + guest links when unauthenticated', () => {
    const router = createRouter({ history: createMemoryHistory(), routes })
    const links = buildNavLinks(router, {
      isAuthenticated: false,
      hasRole: () => false,
    })

    expect(links.map(l => l.name)).toEqual(['Home', 'About', 'Login'])
  })

  it('shows public + app links when authenticated without admin roles', () => {
    const router = createRouter({ history: createMemoryHistory(), routes })
    const links = buildNavLinks(router, {
      isAuthenticated: true,
      hasRole: () => false,
    })

    expect(links.map(l => l.name)).toEqual(['Home', 'About', 'Dashboard'])
  })

  it('includes role-gated admin links when the user has a matching role', () => {
    const router = createRouter({ history: createMemoryHistory(), routes })
    const links = buildNavLinks(router, {
      isAuthenticated: true,
      hasRole: role => role === 'admin',
    })

    expect(links.map(l => l.name)).toEqual(['Home', 'About', 'Dashboard', 'Users'])
  })

  it('can filter to sidebar groups only', () => {
    const router = createRouter({ history: createMemoryHistory(), routes })
    const links = buildNavLinks(
      router,
      {
        isAuthenticated: true,
        hasRole: role => role === 'author',
      },
      ['app', 'admin'],
    )

    expect(links.map(l => l.name)).toEqual(['Dashboard', 'Users'])
  })
})
