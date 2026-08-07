<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppBootstrapLoader from '@/app/components/AppBootstrapLoader.vue'
import { useAuthStore } from '@/features/auth'
import AppLayout from '@/layouts/AppLayout.vue'

const router = useRouter()
const authStore = useAuthStore()
const isAppReady = ref(false)

onMounted(async () => {
  try {
    await router.isReady()
    if (!authStore.authChecked)
      await authStore.bootstrapAuth()
  }
  finally {
    isAppReady.value = true
  }
})
</script>

<template>
  <div class="min-h-screen flex flex-col font-sans antialiased text-center theme-app overflow-x-hidden">
    <Transition
      name="app-shell"
      mode="out-in"
      appear
    >
      <div
        v-if="!isAppReady"
        key="bootstrap-loader"
      >
        <AppBootstrapLoader />
      </div>
      <AppLayout
        v-else
        key="app-layout"
      >
        <router-view />
      </AppLayout>
    </Transition>
  </div>
</template>

<style scoped>
.app-shell-enter-active,
.app-shell-leave-active {
  transition:
    opacity 360ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 360ms cubic-bezier(0.22, 1, 0.36, 1);
}

.app-shell-enter-from,
.app-shell-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.995);
}
</style>
