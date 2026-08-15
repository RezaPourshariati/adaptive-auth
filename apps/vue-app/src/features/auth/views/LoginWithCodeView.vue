<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth'
import AuthNotice from '@/shared/components/feedback/AuthNotice.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const loginCode = ref('')
const errorMessage = ref('')

const email = computed(() => {
  const queryEmail = route.query.email
  if (typeof queryEmail === 'string' && queryEmail.length)
    return queryEmail
  return authStore.pendingLoginCodeEmail
})

async function handleSubmit() {
  errorMessage.value = ''
  if (!email.value) {
    errorMessage.value = 'Email context is missing, please login again.'
    return
  }
  try {
    await authStore.loginWithCode(email.value, loginCode.value)
    await router.push('/')
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to verify login code'
  }
}
</script>

<template>
  <section class="mx-auto max-w-md py-10">
    <h1 class="mb-4 text-2xl font-semibold">
      Verify Login Code
    </h1>
    <p class="mb-4 text-slate-600">
      Enter the 6-digit code sent to <strong>{{ email || 'your email' }}</strong>.
    </p>
    <form
      class="space-y-4"
      @submit.prevent="handleSubmit"
    >
      <input
        v-model="loginCode"
        type="text"
        maxlength="6"
        placeholder="6-digit code"
        class="w-full rounded border px-3 py-2"
      >
      <button
        type="submit"
        class="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
        :disabled="authStore.isSessionLoading"
      >
        {{ authStore.isSessionLoading ? 'Verifying...' : 'Verify and Login' }}
      </button>
    </form>
    <AuthNotice
      v-if="errorMessage"
      class="mt-4"
      kind="error"
      :message="errorMessage"
    />
  </section>
</template>
