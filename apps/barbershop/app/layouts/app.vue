<script setup lang="ts">
const email = useState('staff-email', () => '')

const links = [
  { to: '/app', label: 'Overview', exact: true },
  { to: '/app/services', label: 'Services' },
  { to: '/app/team', label: 'Barbers' },
  { to: '/app/hours', label: 'Hours' },
  { to: '/app/business', label: 'Business' },
]

async function logout() {
  await $fetch('/api/staff/logout', { method: 'POST' })
  await navigateTo('/app/login')
}
</script>

<template>
  <div class="flex min-h-screen bg-paper text-ink">
    <aside class="flex w-64 flex-col gap-5 bg-sidebar p-6 text-stone-100">
      <div class="font-semibold tracking-wide">
        Crypto Barber
      </div>
      <nav class="flex flex-col gap-1">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="rounded px-3 py-2 text-stone-300 no-underline hover:bg-stone-800 hover:text-white"
          :active-class="link.exact ? undefined : 'bg-stone-800 text-white'"
          exact-active-class="bg-stone-800 text-white"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>
      <div class="mt-auto flex flex-col gap-2 text-sm text-stone-400">
        <span>{{ email }}</span>
        <Button
          label="Sign out"
          severity="secondary"
          outlined
          size="small"
          @click="logout"
        />
      </div>
    </aside>
    <div class="min-w-0 flex-1 p-8">
      <slot />
    </div>
  </div>
</template>
