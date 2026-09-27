<script setup lang="ts">
import type { CalendarStaff } from '~/utils/calendar-types'

const props = defineProps<{
  staff: CalendarStaff[]
  focusedId: string
}>()

const emit = defineEmits<{
  select: [id: string]
}>()

const index = computed(() => props.staff.findIndex(member => member.id === props.focusedId))

function move(step: number) {
  const next = props.staff[index.value + step]
  if (next)
    emit('select', next.id)
}
</script>

<template>
  <div class="mb-3 flex items-center gap-2">
    <button
      type="button"
      class="min-h-11 min-w-11 rounded border border-line bg-panel"
      :disabled="index <= 0"
      aria-label="Previous barber"
      @click="move(-1)"
    >
      ‹
    </button>
    <label class="min-w-0 flex-1 text-sm">
      <span class="sr-only">Barber</span>
      <select
        :value="focusedId"
        class="min-h-11 w-full rounded border border-line bg-panel px-3"
        @change="emit('select', ($event.target as HTMLSelectElement).value)"
      >
        <option
          v-for="member in staff"
          :key="member.id"
          :value="member.id"
        >
          {{ member.name }}{{ member.active ? '' : ' (inactive)' }}
        </option>
      </select>
    </label>
    <button
      type="button"
      class="min-h-11 min-w-11 rounded border border-line bg-panel"
      :disabled="index < 0 || index >= staff.length - 1"
      aria-label="Next barber"
      @click="move(1)"
    >
      ›
    </button>
  </div>
</template>
