<script setup lang="ts">
const auth = useAuthStore()
const router = useRouter()

async function onLogout() {
  await auth.logout()
  await router.push('/login')
}
</script>

<template>
  <div class="layout">
    <header class="layout__header">
      <NuxtLink to="/">
        AdaptiveAuth (Nuxt)
      </NuxtLink>
      <nav class="layout__nav">
        <NuxtLink to="/dashboard">
          Dashboard
        </NuxtLink>
        <NuxtLink
          v-if="auth.isAuthenticated"
          to="/login"
          @click.prevent="onLogout"
        >
          Log out
        </NuxtLink>
        <NuxtLink
          v-else
          to="/login"
        >
          Log in
        </NuxtLink>
      </nav>
    </header>
    <main class="layout__main">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: system-ui, sans-serif;
}

.layout__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.layout__nav {
  display: flex;
  gap: 1rem;
}

.layout__main {
  flex: 1;
  padding: 1.5rem;
}
</style>
