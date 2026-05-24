<script setup lang="ts">
definePageMeta({
  requiresAuth: true,
  layout: 'app-shell',
  pageTitle: 'Profile',
})

const auth = useAuthStore()
const router = useRouter()

const errorMessage = ref('')
const successMessage = ref('')

const profileForm = reactive({
  name: '',
  phone: '',
  bio: '',
  photo: '',
})

watch(
  () => auth.user,
  (user) => {
    profileForm.name = user?.name ?? ''
    profileForm.phone = user?.phone ?? ''
    profileForm.bio = user?.bio ?? ''
    profileForm.photo = user?.photo ?? ''
  },
  { immediate: true },
)

async function submitProfile() {
  errorMessage.value = ''
  successMessage.value = ''
  try {
    await auth.updateUser({ ...profileForm })
    successMessage.value = 'Profile updated successfully.'
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to update profile'
  }
}

async function sendVerification() {
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const result = await auth.sendVerificationEmail()
    successMessage.value = result.message
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to send verification email'
  }
}

async function onLogout() {
  await auth.logout()
  await router.push('/login')
}
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <Card>
      <template #title>
        Auth profile
      </template>
      <template #content>
        <form
          class="grid gap-4"
          @submit.prevent="submitProfile"
        >
          <InputText
            v-model="profileForm.name"
            placeholder="Name"
            class="w-full"
          />
          <InputText
            v-model="profileForm.phone"
            placeholder="Phone"
            class="w-full"
          />
          <Textarea
            v-model="profileForm.bio"
            placeholder="Bio"
            rows="3"
            class="w-full"
          />
          <InputText
            v-model="profileForm.photo"
            placeholder="Photo URL"
            class="w-full"
          />
          <Button
            type="submit"
            label="Save profile"
            :loading="auth.isAccountLoading"
            :disabled="auth.isAccountLoading"
          />
        </form>

        <div class="mt-4 flex flex-wrap gap-2">
          <Button
            label="Send verification email"
            severity="info"
            outlined
            :disabled="auth.isAccountLoading"
            @click="sendVerification"
          />
          <Button
            label="Change password"
            severity="secondary"
            outlined
            @click="navigateTo('/change-password')"
          />
          <Button
            v-if="auth.hasRole('admin') || auth.hasRole('author')"
            label="Manage users"
            @click="navigateTo('/users')"
          />
          <Button
            label="Logout"
            severity="danger"
            outlined
            @click="onLogout"
          />
        </div>

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

        <div
          v-if="auth.user"
          class="mt-6 space-y-1 text-sm text-gray-700"
        >
          <p><strong>Email:</strong> {{ auth.user.email }}</p>
          <p><strong>Role:</strong> {{ auth.user.role }}</p>
          <p><strong>Verified:</strong> {{ auth.user.isVerified ? 'Yes' : 'No' }}</p>
        </div>
      </template>
    </Card>
  </div>
</template>
