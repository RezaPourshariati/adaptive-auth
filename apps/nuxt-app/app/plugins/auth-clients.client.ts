import { createBrowserAuthClients } from '@adaptive-auth/shared-auth/browser'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const apiRoot = String(config.public.apiRoot).replace(/\/$/, '')
  const { auth, users, refreshSession } = createBrowserAuthClients({ apiRoot })

  return {
    provide: {
      authApi: auth,
      usersApi: users,
      refreshSession,
    },
  }
})
