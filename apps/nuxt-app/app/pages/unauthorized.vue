<script setup lang="ts">
definePageMeta({ layout: 'default' })
</script>

<template>
  <section class="mx-auto max-w-xl py-10">
    <h1 class="mb-4 text-2xl font-semibold">
      Unauthorized
    </h1>
    <p class="text-slate-600">
      You are signed in but do not have permission to view this page.
    </p>
    <p class="mt-4">
      <NuxtLink
        to="/"
        class="text-blue-600 hover:underline"
      >
        Back to home
      </NuxtLink>
    </p>
  </section>
</template>
