<script setup lang="ts">
import { parseRegisterBody } from '@adaptive-auth/validation'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth'
import AuthNotice from '@/shared/components/feedback/AuthNotice.vue'

const authStore = useAuthStore()
const router = useRouter()

const name = ref('')
const email = ref('')
const password = ref('')
const errorMessage = ref('')

async function handleRegister() {
  errorMessage.value = ''
  const parsed = parseRegisterBody({
    name: name.value,
    email: email.value,
    password: password.value,
  })
  if (!parsed.ok) {
    errorMessage.value = parsed.message
    return
  }
  try {
    await authStore.register(parsed.value)
    await router.push('/')
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Registration failed'
  }
}
</script>

<template>
  <section class="mx-auto max-w-md py-10">
    <h1 class="mb-4 text-2xl font-semibold">
      Register
    </h1>
    <form
      class="space-y-4"
      @submit.prevent="handleRegister"
    >
      <input
        v-model="name"
        type="text"
        placeholder="Name"
        class="w-full rounded border px-3 py-2"
      >
      <input
        v-model="email"
        type="email"
        placeholder="Email"
        class="w-full rounded border px-3 py-2"
      >
      <input
        v-model="password"
        type="password"
        placeholder="Password"
        class="w-full rounded border px-3 py-2"
      >
      <button
        type="submit"
        class="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
        :disabled="authStore.isSessionLoading"
      >
        {{ authStore.isSessionLoading ? 'Creating account...' : 'Create account' }}
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
