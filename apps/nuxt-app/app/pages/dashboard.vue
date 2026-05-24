<script setup lang="ts">
definePageMeta({
  requiresAuth: true,
  layout: 'app-shell',
  pageTitle: 'Dashboard',
})

const auth = useAuthStore()
</script>

<template>
  <div>
    <p class="mb-6 text-base text-gray-600 md:text-lg">
      Welcome to your dashboard overview
      <span v-if="auth.user">, {{ auth.user.name }}.</span>
    </p>

    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <template #title>
          Session
        </template>
        <template #content>
          <p class="text-sm text-gray-600">
            Signed in as <strong>{{ auth.user?.email }}</strong>
            (role: <strong>{{ auth.user?.role }}</strong>).
          </p>
        </template>
      </Card>
      <Card>
        <template #title>
          Profile
        </template>
        <template #content>
          <p class="mb-4 text-sm text-gray-600">
            Update your name, contact details, and bio.
          </p>
          <Button
            label="Go to Profile"
            severity="secondary"
            class="w-full"
            @click="navigateTo('/profile')"
          />
        </template>
      </Card>
      <Card
        v-if="auth.hasRole('admin') || auth.hasRole('author')"
      >
        <template #title>
          User management
        </template>
        <template #content>
          <p class="mb-4 text-sm text-gray-600">
            List users and update roles (admin / author).
          </p>
          <Button
            label="Manage Users"
            class="w-full"
            @click="navigateTo('/users')"
          />
        </template>
      </Card>
    </div>
  </div>
</template>
