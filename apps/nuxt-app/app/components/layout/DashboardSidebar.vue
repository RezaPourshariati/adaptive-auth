<script setup lang="ts">
const { links, isActive } = useSidebarNav()
</script>

<template>
  <aside class="flex w-56 shrink-0 flex-col border-r border-gray-200 bg-white md:w-64">
    <div class="border-b border-gray-200 px-4 py-4">
      <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">
        Navigation
      </p>
    </div>
    <nav class="flex-1 space-y-1 p-3">
      <NuxtLink
        v-for="link in links"
        :key="link.path"
        :to="link.path"
        class="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors"
        :class="isActive(link.path)
          ? 'bg-emerald-600 text-white'
          : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'"
      >
        <i
          :class="link.icon"
          aria-hidden="true"
        />
        <span>{{ link.name }}</span>
      </NuxtLink>
    </nav>
    <div class="border-t border-gray-200 p-3">
      <NuxtLink
        to="/"
        class="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
      >
        <i
          class="pi pi-home"
          aria-hidden="true"
        />
        <span>Public home</span>
      </NuxtLink>
    </div>
  </aside>
</template>
