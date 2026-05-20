<script setup lang="ts">
definePageMeta({ guestOnly: true })

const auth = useAuthStore()
const router = useRouter()

const name = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const submitting = ref(false)

async function onSubmit() {
  error.value = ''
  submitting.value = true
  try {
    await auth.register({ name: name.value, email: email.value, password: password.value })
    await router.push('/dashboard')
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Registration failed'
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="register">
    <h1>Register</h1>
    <form
      class="register__form"
      @submit.prevent="onSubmit"
    >
      <label>
        Name
        <input
          v-model="name"
          type="text"
          required
          autocomplete="name"
        >
      </label>
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
          autocomplete="new-password"
        >
      </label>
      <p
        v-if="error"
        class="register__error"
      >
        {{ error }}
      </p>
      <button
        type="submit"
        :disabled="submitting"
      >
        {{ submitting ? 'Creating…' : 'Create account' }}
      </button>
    </form>
    <p>
      <NuxtLink to="/login">
        Already have an account?
      </NuxtLink>
    </p>
  </section>
</template>

<style scoped>
.register {
  max-width: 24rem;
}

.register__form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 1rem 0;
}

.register__form label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.register__error {
  color: #b91c1c;
  font-size: 0.875rem;
}
</style>
