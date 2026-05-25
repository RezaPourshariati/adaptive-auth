<script setup lang="ts">
import { isAuthApiErrorCode } from '@adaptive-auth/shared-auth'
import { parseLoginBody } from '@adaptive-auth/validation'

definePageMeta({ guestOnly: true, layout: 'default' })

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const email = ref('')
const password = ref('')
const errorMessage = ref('')

const redirectTo = computed(() => {
  const redirect = route.query.redirect
  if (typeof redirect !== 'string')
    return '/'
  return redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/'
})

const sessionMessage = computed(() => {
  const session = route.query.session
  if (session === 'SESSION_IDLE_EXPIRED')
    return 'You were inactive for too long. Please log in again.'
  if (session === 'SESSION_ABSOLUTE_EXPIRED')
    return 'Your maximum session time has ended. Please log in again.'
  return auth.sessionExpiryMessage
})

onMounted(async () => {
  const code = route.query.session
  if (typeof code === 'string' && isAuthApiErrorCode(code))
    auth.setSessionExpiryCode(code)

  if (!route.query.session)
    return

  const nextQuery = { ...route.query }
  delete nextQuery.session
  await router.replace({ query: nextQuery })
})

async function handleLogin() {
  errorMessage.value = ''
  const parsed = parseLoginBody({ email: email.value, password: password.value })
  if (!parsed.ok) {
    errorMessage.value = parsed.message
    return
  }
  try {
    await auth.login(parsed.value)
    await router.push(redirectTo.value)
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Login failed'
  }
}
</script>

<template>
  <section class="mx-auto max-w-md py-10">
    <h1 class="mb-4 text-2xl font-semibold">
      Login
    </h1>
    <p class="mb-6 text-slate-600">
      Sign in to access protected AdaptiveAuth routes.
    </p>

    <form
      class="space-y-4"
      @submit.prevent="handleLogin"
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
        autocomplete="current-password"
        class="w-full rounded border border-gray-300 px-3 py-2"
      >
      <Button
        type="submit"
        label="Sign in"
        class="w-full"
        :disabled="auth.sessionLoading"
        :loading="auth.sessionLoading"
      />
    </form>

    <AuthNotice
      v-if="errorMessage || sessionMessage"
      class="mt-4"
      kind="error"
      :message="errorMessage || sessionMessage"
    />

    <p class="mt-4 space-y-1 text-sm">
      <span class="block">
        <NuxtLink
          to="/forgot-password"
          class="text-blue-600 hover:underline"
        >
          Forgot password?
        </NuxtLink>
      </span>
      <span class="block">
        <NuxtLink
          to="/register"
          class="text-blue-600 hover:underline"
        >
          Create an account
        </NuxtLink>
      </span>
    </p>
  </section>
</template>
