import type { AuthApi, UsersApi } from '@adaptive-auth/shared-auth'

declare module '#app' {
  interface NuxtApp {
    $authApi: AuthApi
    $usersApi: UsersApi
    $refreshSession: () => Promise<{ message: string }>
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $authApi: AuthApi
    $usersApi: UsersApi
    $refreshSession: () => Promise<{ message: string }>
  }
}

export {}
