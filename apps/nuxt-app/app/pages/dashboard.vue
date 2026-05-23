<script setup lang="ts">
definePageMeta({ requiresAuth: true, layout: 'dashboard' })

const auth = useAuthStore()
const router = useRouter()

async function onLogout() {
  await auth.logout()
  await router.push('/login')
}
</script>

<template>
  <div>
    <p class="mb-6 text-base text-gray-600 md:text-lg">
      Welcome to your dashboard overview
      <span v-if="auth.user">, {{ auth.user.name }}.</span>
    </p>

    <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
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
          Quick links
        </template>
        <template #content>
          <div class="flex flex-wrap gap-2">
            <Button
              label="Home"
              severity="secondary"
              size="small"
              @click="navigateTo('/')"
            />
            <Button
              label="Logout"
              severity="danger"
              size="small"
              outlined
              @click="onLogout"
            />
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>
