<script setup lang="ts">
import { isAuthApiErrorCode } from '@adaptive-auth/shared-auth'

definePageMeta({ guestOnly: true })

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

onMounted(() => {
  const code = route.query.session
  if (typeof code === 'string' && isAuthApiErrorCode(code))
    auth.setSessionExpiryCode(code)
})

const email = ref('')
const password = ref('')
const error = ref('')
const submitting = ref(false)

async function onSubmit() {
  error.value = ''
  submitting.value = true
  try {
    await auth.login({ email: email.value, password: password.value })
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.push(redirect)
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Login failed'
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="login">
    <h1>Log in</h1>
    <p
      v-if="auth.sessionExpiryMessage"
      class="login__notice"
    >
      {{ auth.sessionExpiryMessage }}
    </p>
    <form
      class="login__form"
      @submit.prevent="onSubmit"
    >
      <label>
        Email
        <input
          v-model="email"
          type="email"
          required
          autocomplete="email"
        >
      </label>
      <label>
        Password
        <input
          v-model="password"
          type="password"
          required
          autocomplete="current-password"
        >
      </label>
      <p
        v-if="error"
        class="login__error"
      >
        {{ error }}
      </p>
      <button
        type="submit"
        :disabled="submitting"
      >
        {{ submitting ? 'Signing in…' : 'Sign in' }}
      </button>
    </form>
    <p>
      <NuxtLink to="/register">
        Create an account
      </NuxtLink>
    </p>
  </section>
</template>

<style scoped>
.login {
  max-width: 24rem;
}

.login__form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 1rem 0;
}

.login__form label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.login__error,
.login__notice {
  color: #b91c1c;
  font-size: 0.875rem;
}
</style>
