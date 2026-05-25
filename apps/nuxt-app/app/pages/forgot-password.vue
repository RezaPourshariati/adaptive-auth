<script setup lang="ts">
import { parseForgotPasswordBody } from '@adaptive-auth/validation'

definePageMeta({ guestOnly: true, layout: 'default' })

const auth = useAuthStore()

const email = ref('')
const errorMessage = ref('')
const successMessage = ref('')

async function handleSubmit() {
  errorMessage.value = ''
  successMessage.value = ''
  const parsed = parseForgotPasswordBody({ email: email.value })
  if (!parsed.ok) {
    errorMessage.value = parsed.message
    return
  }
  try {
    const result = await auth.forgotPassword(parsed.value.email)
    successMessage.value = result.message
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to submit forgot password request'
  }
}
</script>

<template>
  <section class="mx-auto max-w-md py-10">
    <h1 class="mb-4 text-2xl font-semibold">
      Forgot Password
    </h1>
    <p class="mb-6 text-slate-600">
      Enter your email and we will send a reset link if an account exists.
    </p>

    <form
      class="space-y-4"
      @submit.prevent="handleSubmit"
    >
      <input
        v-model="email"
        type="email"
        placeholder="Email"
        autocomplete="email"
        class="w-full rounded border border-gray-300 px-3 py-2"
      >
      <Button
        type="submit"
        label="Send reset link"
        class="w-full"
        :disabled="auth.isAccountLoading"
        :loading="auth.isAccountLoading"
      />
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

    <p class="mt-4 text-sm">
      <NuxtLink
        to="/login"
        class="text-blue-600 hover:underline"
      >
        Back to login
      </NuxtLink>
    </p>
  </section>
</template>
