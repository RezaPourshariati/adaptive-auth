<script setup lang="ts">
import { parseLoginBody } from '@adaptive-auth/validation'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth'
import AuthNotice from '@/shared/components/feedback/AuthNotice.vue'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const email = ref('admin@adaptive-auth.dev')
const password = ref('password123')
const errorMessage = ref('')

const redirectTo = computed(() => {
  const redirect = route.query.redirect
  if (typeof redirect !== 'string')
    return '/'
  // Prevent open-redirect behavior: only allow in-app absolute paths.
  return redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/'
})

const sessionMessage = computed(() => {
  const session = route.query.session
  if (session === 'SESSION_IDLE_EXPIRED')
    return 'You were inactive for too long. Please log in again.'
  if (session === 'SESSION_ABSOLUTE_EXPIRED')
    return 'Your maximum session time has ended. Please log in again.'
  return authStore.sessionExpiryMessage
})

onMounted(async () => {
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
    await authStore.login(parsed.value)
    await router.push(redirectTo.value)
  }
  catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed'
    errorMessage.value = message
    if (message.includes('New browser or device detected')) {
      try {
        await authStore.sendLoginCode(email.value)
        await router.push({ name: 'LoginWithCode', query: { email: email.value } })
      }
      catch (sendError) {
        const sendMsg = sendError instanceof Error ? sendError.message : 'Could not send login code'
        errorMessage.value = `${message} We could not email your code: ${sendMsg}`
      }
    }
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
    <p class="mb-6 text-xs text-slate-500">
      Test accounts: `admin@adaptive-auth.dev` / `password123`
    </p>

    <form
      class="space-y-4"
      @submit.prevent="handleLogin"
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
        {{ authStore.isSessionLoading ? 'Signing in...' : 'Sign in' }}
      </button>
    </form>

    <AuthNotice
      v-if="errorMessage || sessionMessage"
      class="mt-4"
      kind="error"
      :message="errorMessage || sessionMessage"
    />
    <p class="mt-4 text-sm">
      <RouterLink
        to="/forgot-password"
        class="text-blue-600 hover:underline"
      >
        Forgot password?
      </RouterLink>
    </p>
  </section>
</template>
