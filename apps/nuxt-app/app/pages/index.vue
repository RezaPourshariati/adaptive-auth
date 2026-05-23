<script setup lang="ts">
const auth = useAuthStore()
</script>

<template>
  <section class="mx-auto max-w-lg py-6">
    <h1 class="mb-2 text-3xl font-bold text-gray-900">
      AdaptiveAuth
    </h1>
    <p class="mb-6 text-gray-600">
      Adaptive session and token flow for Nuxt + Pinia, using the same auth-server and shared packages as the Vue app.
    </p>

    <p
      v-if="auth.isAuthenticated"
      class="mb-6 text-sm text-gray-700"
    >
      Signed in as <strong>{{ auth.user?.email }}</strong> ({{ auth.user?.role }}).
    </p>

    <div class="grid gap-4 md:grid-cols-2">
      <Card v-if="!auth.isAuthenticated">
        <template #content>
          <Button
            label="Go to Login"
            class="w-full"
            @click="navigateTo('/login')"
          />
        </template>
      </Card>
      <Card v-if="!auth.isAuthenticated">
        <template #content>
          <Button
            label="Go to Register"
            severity="secondary"
            class="w-full"
            @click="navigateTo('/register')"
          />
        </template>
      </Card>
      <Card v-if="auth.isAuthenticated">
        <template #title>
          Dashboard
        </template>
        <template #content>
          <p class="mb-4 text-sm text-gray-600">
            Protected workspace for authenticated users.
          </p>
          <Button
            label="Go to Dashboard"
            severity="secondary"
            class="w-full"
            @click="navigateTo('/dashboard')"
          />
        </template>
      </Card>
    </div>
  </section>
</template>
