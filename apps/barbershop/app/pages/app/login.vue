<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const email = ref('owner@local.test')
const password = ref('')
const error = ref('')
const pending = ref(false)

async function submit() {
  error.value = ''
  pending.value = true
  try {
    await $fetch('/api/staff/login', {
      method: 'POST',
      body: { email: email.value, password: password.value },
    })
    await navigateTo('/app')
  }
  catch (err: unknown) {
    const typed = err as { statusMessage?: string, statusCode?: number }
    error.value = typed.statusCode === 503
      ? 'Database is not configured. Set DATABASE_URL and run migrate + seed.'
      : (typed.statusMessage || 'Could not sign in.')
  }
  finally {
    pending.value = false
  }
}
</script>

<template>
  <Card class="w-full max-w-md">
    <template #title>
      <p class="mb-1 text-xs uppercase tracking-widest text-muted">
        Staff
      </p>
      Sign in
    </template>
    <template #content>
      <Message
        v-if="error"
        severity="error"
        class="mb-4"
        :closable="false"
      >
        {{ error }}
      </Message>
      <form
        class="flex flex-col gap-4"
        @submit.prevent="submit"
      >
        <label class="flex flex-col gap-1 text-sm text-muted">
          Email
          <InputText
            v-model="email"
            type="email"
            autocomplete="username"
            required
            fluid
          />
        </label>
        <label class="flex flex-col gap-1 text-sm text-muted">
          Password
          <Password
            v-model="password"
            autocomplete="current-password"
            :feedback="false"
            toggle-mask
            required
            fluid
          />
        </label>
        <Button
          type="submit"
          :label="pending ? 'Signing in…' : 'Sign in'"
          :disabled="pending"
          :loading="pending"
        />
      </form>
    </template>
  </Card>
</template>
