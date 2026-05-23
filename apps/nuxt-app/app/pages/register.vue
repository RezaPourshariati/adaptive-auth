<script setup lang="ts">
import { parseRegisterBody } from '@adaptive-auth/validation'

definePageMeta({ guestOnly: true, layout: 'default' })

const auth = useAuthStore()
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
    await auth.register(parsed.value)
    await router.push('/dashboard')
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
        autocomplete="name"
        class="w-full rounded border border-gray-300 px-3 py-2"
      >
      <input
        v-model="email"
        type="email"
        placeholder="Email"
        autocomplete="email"
        class="w-full rounded border border-gray-300 px-3 py-2"
      >
      <input
        v-model="password"
        type="password"
        placeholder="Password"
        autocomplete="new-password"
        class="w-full rounded border border-gray-300 px-3 py-2"
      >
      <Button
        type="submit"
        label="Create account"
        class="w-full"
        :disabled="auth.sessionLoading"
        :loading="auth.sessionLoading"
      />
    </form>

    <AuthNotice
      v-if="errorMessage"
      class="mt-4"
      kind="error"
      :message="errorMessage"
    />

    <p class="mt-4 text-sm">
      <NuxtLink
        to="/login"
        class="text-blue-600 hover:underline"
      >
        Already have an account?
      </NuxtLink>
    </p>
  </section>
</template>
