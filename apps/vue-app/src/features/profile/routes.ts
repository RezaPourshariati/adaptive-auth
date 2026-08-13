import type { RouteRecordRaw } from 'vue-router'
import RouterViewOutlet from '@/layouts/RouterViewOutlet.vue'

export const profileRoutes: RouteRecordRaw[] = [
  {
    path: '/profile',
    component: RouterViewOutlet,
    meta: {
      layout: 'app',
      requiresAuth: true,
    },
    children: [
      {
        path: '',
        name: 'Profile',
        component: () => import('@/features/profile/views/ProfileView.vue'),
        meta: {
          showInNav: true,
          navGroup: 'app',
          navOrder: 60,
          title: 'Profile',
        },
      },
    ],
  },
]
