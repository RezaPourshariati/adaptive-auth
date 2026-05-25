<script setup lang="ts">
import { parseChangePasswordBody } from '@adaptive-auth/validation'

definePageMeta({
  requiresAuth: true,
  layout: 'app-shell',
  pageTitle: 'Change password',
})

const auth = useAuthStore()

const oldPassword = ref('')
const password = ref('')
const errorMessage = ref('')
const successMessage = ref('')

async function handleSubmit() {
  errorMessage.value = ''
  successMessage.value = ''
  const parsed = parseChangePasswordBody({
    oldPassword: oldPassword.value,
    password: password.value,
  })
  if (!parsed.ok) {
    errorMessage.value = parsed.message
    return
  }
  try {
    const result = await auth.changePassword(parsed.value)
    successMessage.value = result.message
    oldPassword.value = ''
    password.value = ''
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to change password'
  }
}
</script>

<template>
  <section class="mx-auto max-w-md">
    <Card>
      <template #title>
        Change password
      </template>
      <template #content>
        <form
          class="space-y-4"
          @submit.prevent="handleSubmit"
        >
          <Password
            v-model="oldPassword"
            placeholder="Current password"
            :feedback="false"
            toggle-mask
            class="w-full"
            input-class="w-full"
          />
          <Password
            v-model="password"
            placeholder="New password"
            toggle-mask
            class="w-full"
            input-class="w-full"
          >
            <template #footer>
              <Divider />
              <ul class="pl-2 my-0 leading-normal text-sm">
                <li>At least one lowercase</li>
                <li>At least one uppercase</li>
                <li>At least one numeric</li>
                <li>Minimum 8 characters</li>
              </ul>
            </template>
          </Password>
          <Button
            type="submit"
            label="Update password"
            class="w-full"
            :loading="auth.isAccountLoading"
            :disabled="auth.isAccountLoading"
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
      </template>
    </Card>
  </section>
</template>
