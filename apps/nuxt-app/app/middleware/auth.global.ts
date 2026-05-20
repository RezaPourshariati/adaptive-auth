import { resolveAuthRedirect } from '~/utils/auth-navigation-guard'

export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()
  const result = await resolveAuthRedirect(to, authStore)
  if (result !== true)
    return navigateTo(result)
})
