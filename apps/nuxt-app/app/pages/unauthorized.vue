<script setup lang="ts">
definePageMeta({ requiresAuth: true })
</script>

<template>
  <section>
    <h1>Unauthorized</h1>
    <p>You do not have permission to view this page.</p>
    <NuxtLink to="/">
      Home
    </NuxtLink>
  </section>
</template>
