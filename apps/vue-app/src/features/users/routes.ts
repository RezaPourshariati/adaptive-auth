import type { RouteRecordRaw } from 'vue-router'
import RouterViewOutlet from '@/layouts/RouterViewOutlet.vue'

/** Admin-area parents use concrete paths (`/admin`, `/users`), never bare `/`. */
export const userRoutes: RouteRecordRaw[] = [
  {
    path: '/admin',
    component: RouterViewOutlet,
    meta: {
      layout: 'admin',
      requiresAuth: true,
      roles: ['admin'],
    },
    children: [
      {
        path: '',
        name: 'Admin',
        component: () => import('@/features/dashboard/views/DashboardView.vue'),
        meta: {
          title: 'Admin',
          navGroup: 'admin',
          navOrder: 65,
        },
      },
    ],
  },
  {
    path: '/users',
    component: RouterViewOutlet,
    meta: {
      layout: 'admin',
      requiresAuth: true,
      roles: ['admin', 'author'],
    },
    children: [
      {
        path: '',
        name: 'Users',
        component: () => import('@/features/users/views/UserListView.vue'),
        meta: {
          showInNav: true,
          navGroup: 'admin',
          navOrder: 70,
          title: 'Users',
        },
      },
    ],
  },
]
