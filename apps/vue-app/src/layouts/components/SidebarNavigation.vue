<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth'
import { buildNavLinks } from '@/layouts'

interface Props {
  variant?: string
}

defineProps<Props>()

const router = useRouter()
const authStore = useAuthStore()

const navigationLinks = computed(() => {
  return buildNavLinks(
    router,
    {
      isAuthenticated: authStore.isAuthenticated,
      hasRole: role => authStore.hasRole(role),
    },
    ['app', 'admin'],
  )
})
</script>

<template>
  <div class="sidebar-navigation">
    <h3 class="sidebar-title">
      Navigation
    </h3>
    <ul class="nav-list">
      <li
        v-for="link in navigationLinks"
        :key="link.path"
      >
        <router-link
          :to="link.path"
          class="nav-item"
        >
          <span class="nav-text">{{ link.name }}</span>
        </router-link>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.sidebar-navigation {
  padding: 0;
}

.sidebar-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #495057;
}

.nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  color: #6c757d;
  text-decoration: none;
  border-radius: 6px;
  margin-bottom: 0.25rem;
  transition: all 0.2s ease;
}

.nav-item:hover {
  background: rgba(66, 185, 131, 0.1);
  color: #42b983;
}

.nav-item.router-link-active {
  background: #42b983;
  color: white;
}

.nav-text {
  font-weight: 500;
}
</style>
