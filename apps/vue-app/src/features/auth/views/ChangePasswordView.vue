<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/features/auth'
import AuthNotice from '@/shared/components/feedback/AuthNotice.vue'

const authStore = useAuthStore()
const oldPassword = ref('')
const password = ref('')
const errorMessage = ref('')
const successMessage = ref('')

async function handleSubmit() {
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const result = await authStore.changePassword({
      oldPassword: oldPassword.value,
      password: password.value,
    })
    successMessage.value = result.message
    oldPassword.value = ''
    password.value = ''
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to change password'
  }
}
</script>

<template>
  <section class="mx-auto max-w-md py-10">
    <h1 class="mb-4 text-2xl font-semibold">
      Change Password
    </h1>
    <form
      class="space-y-4"
      @submit.prevent="handleSubmit"
    >
      <input
        v-model="oldPassword"
        type="password"
        placeholder="Current password"
        class="w-full rounded border px-3 py-2"
      >
      <input
        v-model="password"
        type="password"
        placeholder="New password"
        class="w-full rounded border px-3 py-2"
      >
      <button
        type="submit"
        class="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
        :disabled="authStore.isAccountLoading"
      >
        {{ authStore.isAccountLoading ? 'Updating...' : 'Change Password' }}
      </button>
    </form>
    <AuthNotice
      v-if="successMessage"
      class="mt-4"
      kind="success"
      :message="successMessage"
    />
    <AuthNotice
      v-if="errorMessage"
      class="mt-2"
      kind="error"
      :message="errorMessage"
    />
  </section>
</template>
