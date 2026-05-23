<template>
  <div class="flex min-h-screen flex-col bg-gray-50">
    <header class="border-b border-gray-200 bg-white">
      <div class="mx-auto flex h-12 max-w-6xl items-center justify-between px-6 md:px-8">
        <NuxtLink
          to="/"
          class="text-lg font-semibold text-gray-900"
        >
          AdaptiveAuth
        </NuxtLink>
        <LayoutAppNav />
      </div>
    </header>
    <main class="mx-auto w-full max-w-6xl flex-1 p-6 md:p-8">
      <slot />
    </main>
    <footer class="border-t border-gray-200 py-4 text-center text-sm text-gray-500">
      AdaptiveAuth — Nuxt client
    </footer>
  </div>
</template>
