<script setup lang="ts">
const email = useState('staff-email', () => '')
const menuOpen = ref(false)
const route = useRoute()

const links = [
  { to: '/app/calendar', label: 'Calendar' },
  { to: '/app', label: 'Overview', exact: true },
  { to: '/app/services', label: 'Services' },
  { to: '/app/team', label: 'Barbers' },
  { to: '/app/hours', label: 'Hours' },
  { to: '/app/business', label: 'Business' },
]

watch(() => route.path, () => {
  menuOpen.value = false
})

async function logout() {
  await $fetch('/api/staff/logout', { method: 'POST' })
  await navigateTo('/app/login')
}
</script>

<template>
  <div class="min-h-screen bg-paper text-ink md:flex">
    <header class="flex items-center justify-between bg-sidebar px-4 py-3 text-stone-100 md:hidden">
      <span class="font-semibold tracking-wide">Crypto Barber</span>
      <button
        type="button"
        class="min-h-11 rounded px-3"
        @click="menuOpen = !menuOpen"
      >
        {{ menuOpen ? 'Close' : 'Menu' }}
      </button>
    </header>
    <div
      v-if="menuOpen"
      class="bg-sidebar px-4 pb-4 text-stone-100 md:hidden"
    >
      <nav class="flex flex-col gap-1">
        <NuxtLink
          v-for="link in links"
          :key="`mobile-${link.to}`"
          :to="link.to"
          class="flex min-h-11 items-center rounded px-3 text-stone-300 no-underline hover:bg-stone-800 hover:text-white bg-red-300"
          :active-class="link.exact ? undefined : 'bg-stone-800 text-white'"
          exact-active-class="bg-stone-800 text-white"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>
      <div class="mt-4 flex flex-col gap-2 text-sm text-stone-400">
        <span>{{ email }}</span>
        <Button
          label="Sign out"
          severity="secondary"
          outlined
          size="small"
          @click="logout"
        />
      </div>
    </div>
    <aside class="hidden w-64 shrink-0 flex-col gap-5 bg-sidebar p-6 text-stone-100 md:flex">
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
    <div class="min-w-0 flex-1 p-4 md:p-8">
      <slot />
    </div>
  </div>
</template>
