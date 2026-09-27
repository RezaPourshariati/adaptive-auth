<script setup lang="ts">
defineProps<{
  date: string
  today: string
}>()

const emit = defineEmits<{
  shift: [days: number]
  today: []
  pick: [date: string]
  refresh: []
  walkIn: []
  block: []
}>()
</script>

<template>
  <div class="mb-3 flex flex-wrap items-center gap-2">
    <button
      type="button"
      class="min-h-11 rounded border border-line bg-panel px-3"
      @click="emit('shift', -1)"
    >
      Previous
    </button>
    <button
      type="button"
      class="min-h-11 rounded border border-line bg-panel px-3"
      @click="emit('today')"
    >
      Today
    </button>
    <button
      type="button"
      class="min-h-11 rounded border border-line bg-panel px-3"
      @click="emit('shift', 1)"
    >
      Next
    </button>
    <input
      :value="date"
      type="date"
      class="min-h-11 rounded border border-line bg-panel px-3"
      :aria-label="`Selected date, today is ${today}`"
      @change="emit('pick', ($event.target as HTMLInputElement).value)"
    >
    <button
      type="button"
      class="min-h-11 rounded border border-line bg-panel px-3"
      @click="emit('refresh')"
    >
      Refresh
    </button>
    <button
      type="button"
      class="min-h-11 rounded bg-accent px-3 text-white"
      @click="emit('walkIn')"
    >
      Add walk-in
    </button>
    <button
      type="button"
      class="min-h-11 rounded border border-line bg-panel px-3"
      @click="emit('block')"
    >
      Block time
    </button>
  </div>
</template>
