<script setup lang="ts">
const auth = useAuthStore()
</script>

<template>
  <section>
    <h1>AdaptiveAuth — Nuxt</h1>
    <p>Client-side SPA using <code>@adaptive-auth/shared-auth</code> against the same auth-server as the Vue app.</p>
    <p v-if="auth.isAuthenticated">
      Signed in as {{ auth.user?.email }} ({{ auth.user?.role }}).
    </p>
    <p v-else>
      <NuxtLink to="/login">
        Sign in
      </NuxtLink>
      to continue.
    </p>
  </section>
</template>
