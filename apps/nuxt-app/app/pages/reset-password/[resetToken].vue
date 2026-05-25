<script setup lang="ts">
import { parseResetPasswordBody } from '@adaptive-auth/validation'

definePageMeta({ guestOnly: true, layout: 'default' })

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

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
    const result = await auth.resetPassword(resetToken.value, parsed.value.password)
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
    <p class="mb-6 text-slate-600">
      Choose a new password for your account.
    </p>

    <form
      class="space-y-4"
      @submit.prevent="handleSubmit"
    >
      <Password
        v-model="password"
        placeholder="New password"
        toggle-mask
        :feedback="false"
        input-class="w-full"
        class="w-full"
        autocomplete="new-password"
      />
      <Button
        type="submit"
        label="Update password"
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
