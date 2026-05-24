<script setup lang="ts">
const route = useRoute()

const pageTitle = computed(() => {
  const title = route.meta.pageTitle
  return typeof title === 'string' ? title : 'Workspace'
})
</script>

<template>
  <div class="flex min-h-screen flex-col bg-gray-50">
    <header class="border-b border-gray-200 bg-white">
      <div class="flex h-14 items-center justify-between px-4 md:px-6">
        <h1 class="m-0 text-lg font-semibold text-gray-900 md:text-xl">
          {{ pageTitle }}
        </h1>
        <LayoutAppNav />
      </div>
    </header>
    <div class="mx-auto flex w-full max-w-7xl flex-1">
      <LayoutDashboardSidebar />
      <main class="min-w-0 flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <slot />
      </main>
    </div>
  </div>
</template>
