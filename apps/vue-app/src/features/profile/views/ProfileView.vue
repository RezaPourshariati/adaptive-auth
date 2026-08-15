<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth'
import AuthNotice from '@/shared/components/feedback/AuthNotice.vue'

const authStore = useAuthStore()
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
  () => authStore.user,
  (user) => {
    profileForm.name = user?.name || ''
    profileForm.phone = user?.phone || ''
    profileForm.bio = user?.bio || ''
    profileForm.photo = user?.photo || ''
  },
  { immediate: true },
)

onMounted(async () => {
  if (!authStore.user && authStore.isAuthenticated)
    await authStore.bootstrapAuth()
})

async function submitProfile() {
  errorMessage.value = ''
  successMessage.value = ''
  try {
    await authStore.updateUser(profileForm)
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
    const result = await authStore.sendVerificationEmail()
    successMessage.value = result.message
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to send verification email'
  }
}

async function handleLogout() {
  await authStore.logout()
  await router.push('/login')
}
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <div
      class="profile-header flex items-center gap-8 mb-12 p-8 rounded-xl text-white md:flex-col md:text-center md:gap-6 md:p-6"
    >
      <div class="flex-shrink-0">
        <img
          src="/favicon.ico"
          alt="Profile Avatar"
          class="w-30 h-30 rounded-full border-4 border-white/30 object-cover md:w-25 md:h-25"
        >
      </div>
      <div>
        <h1 class="text-2xl md:text-3xl lg:text-4xl font-extrabold mb-2">
          John Doe
        </h1>
        <p class="text-base md:text-lg lg:text-xl opacity-90 mb-2">
          Frontend Developer
        </p>
        <p class="opacity-80">
          📍 San Francisco, CA
        </p>
      </div>
    </div>

    <div class="flex flex-col gap-8">
      <div class="bg-white border border-gray-200 rounded-md p-8 shadow-sm md:p-6">
        <h2 class="text-xl md:text-2xl font-bold text-gray-900 mb-6 border-b-2 border-emerald-600 pb-2">
          Auth Profile
        </h2>
        <form
          class="grid gap-4"
          @submit.prevent="submitProfile"
        >
          <input
            v-model="profileForm.name"
            type="text"
            placeholder="Name"
            class="rounded border px-3 py-2"
          >
          <input
            v-model="profileForm.phone"
            type="text"
            placeholder="Phone"
            class="rounded border px-3 py-2"
          >
          <textarea
            v-model="profileForm.bio"
            placeholder="Bio"
            class="rounded border px-3 py-2"
          />
          <input
            v-model="profileForm.photo"
            type="text"
            placeholder="Photo URL"
            class="rounded border px-3 py-2"
          >
          <button
            type="submit"
            class="rounded bg-emerald-600 px-4 py-2 text-white disabled:opacity-60"
            :disabled="authStore.isAccountLoading"
          >
            Save Profile
          </button>
        </form>
        <div class="mt-4 flex flex-wrap gap-2">
          <button
            class="rounded bg-blue-600 px-4 py-2 text-white"
            @click="sendVerification"
          >
            Send Verification Email
          </button>
          <RouterLink
            to="/change-password"
            class="rounded bg-gray-700 px-4 py-2 text-white"
          >
            Change Password
          </RouterLink>
          <RouterLink
            v-if="authStore.isAdmin || authStore.hasRole('author')"
            to="/users"
            class="rounded bg-indigo-600 px-4 py-2 text-white"
          >
            Manage Users
          </RouterLink>
          <button
            class="rounded bg-red-600 px-4 py-2 text-white"
            @click="handleLogout"
          >
            Logout
          </button>
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
        <div class="mt-4 text-sm text-gray-700">
          <p><strong>Email:</strong> {{ authStore.user?.email }}</p>
          <p><strong>Role:</strong> {{ authStore.user?.role }}</p>
          <p><strong>Verified:</strong> {{ authStore.user?.isVerified ? 'Yes' : 'No' }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* All styles now handled by Tailwind utility classes */
</style>
