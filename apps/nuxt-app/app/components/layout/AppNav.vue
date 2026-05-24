<script setup lang="ts">
const auth = useAuthStore()
const router = useRouter()

const guestLinks = [
  { name: 'Login', path: '/login' },
  { name: 'Register', path: '/register' },
]

const authLinks = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Profile', path: '/profile' },
  { name: 'Users', path: '/users', roles: ['admin', 'author'] },
]

async function onLogout() {
  await auth.logout()
  await router.push('/login')
}
</script>

<template>
  <nav class="flex flex-wrap items-center gap-1 md:gap-2">
    <NuxtLink
      v-for="link in auth.isAuthenticated ? authLinks : guestLinks"
      :key="link.path"
      :to="link.path"
      class="rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
    >
      {{ link.name }}
    </NuxtLink>
    <NuxtLink
      v-if="!auth.isAuthenticated"
      to="/"
      class="rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
    >
      Home
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
