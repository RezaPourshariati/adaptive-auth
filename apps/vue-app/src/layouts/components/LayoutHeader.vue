<script setup lang="ts">
import type { HeaderConfig } from '../types'
import { computed } from 'vue'
import LayoutNavigation from './LayoutNavigation.vue'

interface Props {
  config: HeaderConfig
}

const props = defineProps<Props>()

const headerTypeClasses = computed(() => {
  switch (props.config.type) {
    case 'minimal':
      return 'h-12 border-b border-b-gray-200'
    case 'standard':
      return 'h-20 shadow-sm'
    case 'hero':
      return 'h-32 header-hero-gradient text-white'
    default:
      return 'h-16'
  }
})

const headerStyles = computed(() => {
  const styles: Record<string, string> = {}

  if (props.config.height)
    styles.height = props.config.height

  if (props.config.color) {
    // Gradients must use `background`, not `background-color`.
    if (props.config.color.includes('gradient'))
      styles.background = props.config.color
    else
      styles.backgroundColor = props.config.color
  }

  return styles
})
</script>

<template>
  <!-- ✅ 90% TailwindCSS + 10% custom complex styles -->
  <header
    class="w-full flex items-center transition-[height,box-shadow,background-color,background] duration-300"
    :class="[
      headerTypeClasses,
      { 'header-glassmorphism': config.transparent },
    ]"
    :style="headerStyles"
  >
    <div class="w-full max-w-6xl mx-auto px-8 flex justify-between items-center">
      <h1
        v-if="config.title"
        class="font-semibold m-0"
        :class="[
          config.type === 'hero'
            ? 'text-2xl md:text-3xl text-white'
            : 'text-xl md:text-2xl text-gray-900',
        ]"
      >
        {{ config.title }}
      </h1>

      <LayoutNavigation
        v-if="config.showNavigation"
        :variant="config.type"
      />
    </div>
  </header>
</template>

<style scoped>
/* ✅ Only complex styles that TailwindCSS can't handle (10% of styling) */

/* Complex gradient background */
.header-hero-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* Complex glassmorphism effect */
.header-glassmorphism {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

/* Dark mode glassmorphism */
[data-theme='dark'] .header-glassmorphism {
  background: rgba(0, 0, 0, 0.7);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
