<script setup lang="ts">
import type { CalendarAppointment, CalendarBlockItem, CalendarStaff } from '~/utils/calendar-types'
import { sourceLabel } from '~/utils/calendar-layout'

const props = defineProps<{
  staff: CalendarStaff[]
  appointments: CalendarAppointment[]
  blocks: CalendarBlockItem[]
}>()

const emit = defineEmits<{
  appointment: [appointment: CalendarAppointment]
  block: [block: CalendarBlockItem]
}>()

const rows = computed(() => [...props.appointments].sort((left, right) => left.startLocal.localeCompare(right.startLocal)))
const blockRows = computed(() => [...props.blocks].sort((left, right) => left.startLocal.localeCompare(right.startLocal)))

function barberName(id: string) {
  return props.staff.find(member => member.id === id)?.name ?? 'Barber'
}
</script>

<template>
  <div data-testid="calendar-day-list">
    <h2 class="mb-2 text-sm font-medium text-muted">
      Appointments
    </h2>
    <p
      v-if="!rows.length"
      class="mb-4 text-sm text-muted"
    >
      No occupying appointments on this day.
    </p>
    <ul
      v-else
      class="mb-4 flex flex-col gap-2"
    >
      <li
        v-for="appointment in rows"
        :key="appointment.id"
      >
        <button
          type="button"
          class="min-h-11 w-full rounded border border-line bg-panel px-3 py-2 text-left"
          @click="emit('appointment', appointment)"
        >
          <span class="font-medium">{{ appointment.startLocal }}–{{ appointment.endLocal }}</span>
          {{ appointment.guestName }}
          <span class="text-muted">· {{ barberName(appointment.staffMemberId) }} · {{ sourceLabel(appointment.source) }}</span>
        </button>
      </li>
    </ul>
    <h2 class="mb-2 text-sm font-medium text-muted">
      Blocks
    </h2>
    <p
      v-if="!blockRows.length"
      class="text-sm text-muted"
    >
      No blocks on this day.
    </p>
    <ul
      v-else
      class="flex flex-col gap-2"
    >
      <li
        v-for="block in blockRows"
        :key="block.id"
      >
        <button
          type="button"
          class="min-h-11 w-full rounded border border-dashed border-stone-500 bg-stone-200 px-3 py-2 text-left"
          @click="emit('block', block)"
        >
          <span class="font-medium">{{ block.startLocal }}–{{ block.endLocal }}</span>
          {{ block.title }}
          <span class="text-muted">· {{ block.staffMemberId ? barberName(block.staffMemberId) : 'Shop-wide' }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>
