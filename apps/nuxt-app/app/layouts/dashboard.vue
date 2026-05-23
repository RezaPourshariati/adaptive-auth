<template>
  <div class="flex min-h-screen flex-col bg-gray-50">
    <header class="border-b border-gray-200 bg-white">
      <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 md:px-8">
        <h1 class="m-0 text-xl font-semibold text-gray-900 md:text-2xl">
          Dashboard
        </h1>
        <LayoutAppNav />
      </div>
    </header>
    <main class="mx-auto w-full max-w-6xl flex-1 overflow-y-auto p-6 md:p-8">
      <slot />
    </main>
  </div>
</template>
