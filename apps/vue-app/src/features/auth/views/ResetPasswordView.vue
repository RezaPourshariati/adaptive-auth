<script setup lang="ts">
import { parseResetPasswordBody } from '@adaptive-auth/validation'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth'
import AuthNotice from '@/shared/components/feedback/AuthNotice.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const password = ref('')
const errorMessage = ref('')
const successMessage = ref('')

const resetToken = computed(() => String(route.params.resetToken || ''))

async function handleSubmit() {
  errorMessage.value = ''
  successMessage.value = ''
  const parsed = parseResetPasswordBody({ password: password.value })
  if (!parsed.ok) {
    errorMessage.value = parsed.message
    return
  }
  if (!resetToken.value) {
    errorMessage.value = 'Reset token is missing.'
    return
  }
  try {
    const result = await authStore.resetPassword(resetToken.value, parsed.value.password)
    successMessage.value = result.message
    setTimeout(() => {
      router.push('/login')
    }, 1000)
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to reset password'
  }
}
</script>

<template>
  <section class="mx-auto max-w-md py-10">
    <h1 class="mb-4 text-2xl font-semibold">
      Reset Password
    </h1>
    <form
      class="space-y-4"
      @submit.prevent="handleSubmit"
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
        {{ authStore.isAccountLoading ? 'Updating...' : 'Update Password' }}
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
