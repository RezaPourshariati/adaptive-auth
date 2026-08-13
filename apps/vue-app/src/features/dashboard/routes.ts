import type { RouteRecordRaw } from 'vue-router'
import RouterViewOutlet from '@/layouts/RouterViewOutlet.vue'

/** Parent path is `/dashboard`, not `/`, so Home can own `/`. */
export const dashboardRoutes: RouteRecordRaw[] = [
  {
    path: '/dashboard',
    component: RouterViewOutlet,
    meta: {
      layout: 'app',
      requiresAuth: true,
    },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/features/dashboard/views/DashboardView.vue'),
        meta: {
          showInNav: true,
          navGroup: 'app',
          navOrder: 50,
          title: 'Dashboard',
        },
      },
    ],
  },
]
