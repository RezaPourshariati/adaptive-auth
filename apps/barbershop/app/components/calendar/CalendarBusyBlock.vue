<script setup lang="ts">
import type { CalendarBlockItem } from '~/utils/calendar-types'

defineProps<{
  block: CalendarBlockItem
  compact: boolean
}>()
</script>

<template>
  <div class="h-full overflow-hidden border border-dashed border-stone-500 bg-stone-300/80 px-1 py-0.5 text-left">
    <p class="truncate text-sm font-medium">
      {{ block.title }}
    </p>
    <p
      v-if="!compact"
      class="truncate text-xs"
    >
      {{ block.staffMemberId ? 'Blocked' : 'Shop-wide' }}
      {{ block.startLocal }}–{{ block.endLocal }}
    </p>
  </div>
</template>
