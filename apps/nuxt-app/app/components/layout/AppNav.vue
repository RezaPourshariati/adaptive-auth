<script setup lang="ts">
const auth = useAuthStore()
const router = useRouter()

const publicLinks = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'Contacts', path: '/contacts' },
]

const guestLinks = [
  { name: 'Login', path: '/login' },
  { name: 'Register', path: '/register' },
]

const protectedLinks = computed(() => {
  const links = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Profile', path: '/profile' },
  ]
  if (auth.hasRole('admin') || auth.hasRole('author'))
    links.push({ name: 'Users', path: '/users' })
  return links
})

const navigationLinks = computed(() =>
  auth.isAuthenticated
    ? [...publicLinks, ...protectedLinks.value]
    : [...publicLinks, ...guestLinks],
)

async function onLogout() {
  await auth.logout()
  await router.push('/login')
}
</script>

<template>
  <nav class="flex flex-wrap items-center gap-1 md:gap-2">
    <NuxtLink
      v-for="link in navigationLinks"
      :key="link.path"
      :to="link.path"
      class="rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
    >
      {{ link.name }}
    </NuxtLink>
    <Button
      v-if="auth.isAuthenticated"
      label="Logout"
      severity="secondary"
      size="small"
      @click="onLogout"
    />
  </nav>
</template>
