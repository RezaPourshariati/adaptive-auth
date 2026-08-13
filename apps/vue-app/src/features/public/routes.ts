import type { RouteRecordRaw } from 'vue-router'
import { createLayoutConfig } from '@/layouts'

export const publicRoutes: RouteRecordRaw[] = [
  {
    path: '/unauthorized',
    name: 'Unauthorized',
    component: () => import('@/features/public/views/UnauthorizedView.vue'),
    meta: {
      layout: 'marketing',
      title: 'Unauthorized',
    },
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('@/features/public/views/HomeView.vue'),
    meta: {
      // Documented one-off: hero gradient chrome for the home route only.
      layout: createLayoutConfig({
        name: 'home',
        header: {
          type: 'hero',
          showNavigation: true,
          title: 'Welcome Home',
          height: '8rem',
        },
        container: {
          maxWidth: '1100px',
          centered: true,
          padding: '2rem',
          className: 'home-container',
        },
      }),
      showInNav: true,
      navGroup: 'public',
      navOrder: 10,
      title: 'Home',
    },
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('@/features/public/views/AboutView.vue'),
    meta: {
      layout: 'marketing',
      showInNav: true,
      navGroup: 'public',
      navOrder: 20,
      title: 'About',
    },
  },
  {
    path: '/contacts',
    name: 'Contacts',
    component: () => import('@/features/public/views/ContactsView.vue'),
    meta: {
      layout: 'marketing',
      showInNav: true,
      navGroup: 'public',
      navOrder: 30,
      title: 'Contacts',
    },
  },
  {
    path: '/landing',
    name: 'Landing',
    component: () => import('@/features/public/views/LandingView.vue'),
    meta: {
      layout: 'marketing',
      showInNav: true,
      navGroup: 'public',
      navOrder: 40,
      title: 'Landing',
    },
  },
]
