<script setup lang="ts">
import type { CalendarAppointment, CalendarBlockItem, CalendarDayView } from '~/utils/calendar-types'

const props = defineProps<{
  day: CalendarDayView
  nowLocal: string | null
  rowPx: number
}>()

const emit = defineEmits<{
  appointment: [appointment: CalendarAppointment]
  block: [block: CalendarBlockItem]
  empty: [payload: { staffId: string, startLocal: string }]
}>()
const focusedId = defineModel<string>('focusedId', { required: true })
const showAll = defineModel<boolean>('showAll', { required: true })

const focusedStaff = computed(() => props.day.staff.find(member => member.id === focusedId.value) ?? null)
</script>

<template>
  <div data-testid="calendar-focus">
    <CalendarBarberSwitcher
      :staff="day.staff"
      :focused-id="focusedId"
      @select="focusedId = $event"
    />
    <button
      type="button"
      class="mb-3 min-h-11 rounded border border-line bg-panel px-3"
      @click="showAll = !showAll"
    >
      {{ showAll ? 'One barber' : 'All' }}
    </button>
    <CalendarDayList
      v-if="showAll"
      :staff="day.staff"
      :appointments="day.appointments"
      :blocks="day.blocks"
      @appointment="emit('appointment', $event)"
      @block="emit('block', $event)"
    />
    <CalendarTimeline
      v-else-if="day.shopHours && focusedStaff"
      :staff="[focusedStaff]"
      :appointments="day.appointments"
      :blocks="day.blocks"
      :shop-hours="day.shopHours"
      :now-local="nowLocal"
      :row-px="rowPx"
      @appointment="emit('appointment', $event)"
      @block="emit('block', $event)"
      @empty="emit('empty', $event)"
    />
    <p
      v-else
      class="text-sm text-muted"
    >
      No barber to show.
    </p>
  </div>
</template>
