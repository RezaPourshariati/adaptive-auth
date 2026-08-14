<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth'
import { buildNavLinks } from '@/layouts'

interface Props {
  variant?: 'minimal' | 'standard' | 'hero'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'standard',
})

const router = useRouter()
const authStore = useAuthStore()

const navigationLinks = computed(() => {
  return buildNavLinks(router, {
    isAuthenticated: authStore.isAuthenticated,
    hasRole: role => authStore.hasRole(role),
  })
})

function getLinkClasses(variant: string) {
  const baseClasses = 'hover:bg-gray-100 active:bg-gray-200'

  switch (variant) {
    case 'minimal':
      return `${baseClasses} text-gray-600 hover:text-gray-900`
    case 'hero':
      return 'text-white/90 hover:text-white hover:bg-white/10 active:bg-white/20'
    case 'standard':
    default:
      return `${baseClasses} text-gray-700 hover:text-gray-900`
  }
}

async function handleLogout() {
  await authStore.logout()
  await router.push('/login')
}
</script>

<template>
  <nav class="flex items-center space-x-1 md:space-x-2">
    <router-link
      v-for="link in navigationLinks"
      :key="link.path"
      :to="link.path"
      class="nav-link-animated px-3 py-2 rounded-md text-sm font-medium transition-all duration-200"
      :class="[
        getLinkClasses(props.variant),
      ]"
    >
      {{ link.name }}
    </router-link>
    <button
      v-if="authStore.isAuthenticated"
      class="px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 text-red-600 hover:bg-red-50"
      @click="handleLogout"
    >
      Logout
    </button>
  </nav>
</template>

<style scoped>
.nav-link-animated {
  position: relative;
}

.nav-link-animated.router-link-active {
  color: var(--color-emerald-600);
  background-color: var(--color-emerald-50);
}

.nav-link-animated.router-link-active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 2px;
  background-color: var(--color-emerald-600);
  animation: expandUnderline 0.3s ease-out forwards;
}

.nav-link-animated.router-link-active:where(.text-white\/90) {
  color: white;
  background-color: rgba(255, 255, 255, 0.2);
}

.nav-link-animated.router-link-active:where(.text-white\/90)::after {
  background-color: white;
}

@keyframes expandUnderline {
  from {
    width: 0;
  }
  to {
    width: 80%;
  }
}
</style>
