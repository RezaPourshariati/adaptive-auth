<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/features/auth'
import AuthNotice from '@/shared/components/feedback/AuthNotice.vue'

const route = useRoute()
const authStore = useAuthStore()
const errorMessage = ref('')
const successMessage = ref('')

onMounted(async () => {
  const token = String(route.params.verificationToken || '')
  if (!token) {
    errorMessage.value = 'Verification token is missing.'
    return
  }
  try {
    const result = await authStore.verifyUser(token)
    successMessage.value = result.message
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Verification failed'
  }
})
</script>

<template>
  <section class="mx-auto max-w-lg py-10">
    <h1 class="mb-4 text-2xl font-semibold">
      Verify Account
    </h1>
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
  </section>
</template>
