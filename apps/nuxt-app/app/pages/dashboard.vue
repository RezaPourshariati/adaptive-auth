<script setup lang="ts">
definePageMeta({ requiresAuth: true })

const auth = useAuthStore()
</script>

<template>
  <section>
    <h1>Dashboard</h1>
    <p v-if="auth.user">
      Welcome, {{ auth.user.name }}.
    </p>
  </section>
</template>
