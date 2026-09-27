<script setup lang="ts">
import type { CalendarAppointment, CalendarBlockItem, CalendarDayView } from '~/utils/calendar-types'

defineProps<{
  day: CalendarDayView
}>()

const emit = defineEmits<{
  appointment: [appointment: CalendarAppointment]
  block: [block: CalendarBlockItem]
}>()
</script>

<template>
  <div data-testid="calendar-closed">
    <p class="mb-4 rounded border border-line bg-panel p-4">
      The shop is closed on this date. There is no bookable timeline.
    </p>
    <CalendarDayList
      :staff="day.staff"
      :appointments="day.appointments"
      :blocks="day.blocks"
      @appointment="emit('appointment', $event)"
      @block="emit('block', $event)"
    />
  </div>
</template>
