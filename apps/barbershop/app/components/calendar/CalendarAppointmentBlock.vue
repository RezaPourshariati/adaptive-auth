<script setup lang="ts">
import type { CalendarAppointment } from '~/utils/calendar-types'
import { sourceLabel } from '../../utils/calendar-layout'

defineProps<{
  appointment: CalendarAppointment
  compact: boolean
}>()
</script>

<template>
  <div
    class="h-full overflow-hidden px-1 py-0.5 text-left"
    :class="appointment.status === 'completed' ? 'bg-stone-200 text-stone-700' : 'bg-orange-100 text-ink'"
  >
    <p class="truncate text-sm font-medium">
      {{ appointment.guestName }}
    </p>
    <p
      v-if="!compact"
      class="truncate text-xs"
    >
      {{ appointment.startLocal }}–{{ appointment.endLocal }}
    </p>
    <p
      v-if="!compact"
      class="truncate text-xs"
    >
      {{ sourceLabel(appointment.source) }}
    </p>
  </div>
</template>
