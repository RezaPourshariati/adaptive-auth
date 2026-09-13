export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith('/app') || to.path === '/app/login')
    return

  try {
    const data = await $fetch<{ user: { email: string } }>('/api/staff/me')
    useState('staff-email', () => '').value = data.user.email
  }
  catch {
    return navigateTo('/app/login')
  }
})
