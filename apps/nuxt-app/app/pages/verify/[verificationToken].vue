<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()
const auth = useAuthStore()

const errorMessage = ref('')
const successMessage = ref('')
const loading = ref(true)

onMounted(async () => {
  const token = String(route.params.verificationToken || '')
  if (!token) {
    errorMessage.value = 'Verification token is missing.'
    loading.value = false
    return
  }
  try {
    const result = await auth.verifyUser(token)
    successMessage.value = result.message
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Verification failed'
  }
  finally {
    loading.value = false
  }
})
</script>

<template>
  <section class="mx-auto max-w-lg py-10">
    <h1 class="mb-4 text-2xl font-semibold">
      Verify Account
    </h1>
    <p
      v-if="loading"
      class="text-slate-600"
    >
      Verifying your account…
    </p>
    <AuthNotice
      v-if="successMessage"
      kind="success"
      :message="successMessage"
    />
    <AuthNotice
      v-if="errorMessage"
      class="mt-2"
      kind="error"
      :message="errorMessage"
    />
    <p
      v-if="!loading && (successMessage || errorMessage)"
      class="mt-4 text-sm"
    >
      <NuxtLink
        to="/login"
        class="text-blue-600 hover:underline"
      >
        Go to login
      </NuxtLink>
    </p>
  </section>
</template>
