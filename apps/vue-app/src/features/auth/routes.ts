import type { RouteRecordRaw } from 'vue-router'

/** Leaf auth routes — do not nest under `path: '/'` or Home will never match. */
export const authRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/features/auth/views/LoginView.vue'),
    meta: {
      layout: 'auth',
      guestOnly: true,
      showInNav: true,
      navGroup: 'guest',
      navOrder: 80,
      title: 'Login',
    },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/features/auth/views/RegisterView.vue'),
    meta: {
      layout: 'auth',
      guestOnly: true,
      showInNav: true,
      navGroup: 'guest',
      navOrder: 90,
      title: 'Register',
    },
  },
  {
    path: '/login-with-code',
    name: 'LoginWithCode',
    component: () => import('@/features/auth/views/LoginWithCodeView.vue'),
    meta: {
      layout: 'auth',
      guestOnly: true,
    },
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/features/auth/views/ForgotPasswordView.vue'),
    meta: {
      layout: 'auth',
      guestOnly: true,
    },
  },
  {
    path: '/reset-password/:resetToken',
    name: 'ResetPassword',
    component: () => import('@/features/auth/views/ResetPasswordView.vue'),
    meta: {
      layout: 'auth',
      guestOnly: true,
    },
  },
  {
    path: '/verify/:verificationToken',
    name: 'VerifyEmail',
    component: () => import('@/features/auth/views/VerifyEmailView.vue'),
    meta: {
      layout: 'auth',
    },
  },
  {
    path: '/change-password',
    name: 'ChangePassword',
    component: () => import('@/features/auth/views/ChangePasswordView.vue'),
    meta: {
      layout: 'auth',
      requiresAuth: true,
    },
  },
]
