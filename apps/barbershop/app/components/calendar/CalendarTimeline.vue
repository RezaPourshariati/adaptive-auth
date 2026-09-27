<script setup lang="ts">
import type { CalendarAppointment, CalendarBlockItem, CalendarStaff } from '~/utils/calendar-types'
import { blockSpan, nowOffsetPx, slotOpen, timelineColumns, timeSlots } from '~/utils/calendar-layout'

const props = defineProps<{
  staff: CalendarStaff[]
  appointments: CalendarAppointment[]
  blocks: CalendarBlockItem[]
  shopHours: { startLocal: string, endLocal: string }
  nowLocal: string | null
  rowPx: number
}>()

const emit = defineEmits<{
  appointment: [appointment: CalendarAppointment]
  block: [block: CalendarBlockItem]
  empty: [payload: { staffId: string, startLocal: string }]
}>()

const slots = computed(() => timeSlots(props.shopHours.startLocal, props.shopHours.endLocal))
const columns = computed(() => timelineColumns(props.staff.length))
const gridStyle = computed(() => ({
  gridTemplateColumns: columns.value.template,
  gridTemplateRows: `repeat(${slots.value.length}, ${props.rowPx}px)`,
  minWidth: columns.value.scroll ? `calc(4.5rem + ${props.staff.length} * 9rem)` : undefined,
}))
const nowTop = computed(() => {
  if (!props.nowLocal)
    return null
  return nowOffsetPx(props.shopHours.startLocal, props.nowLocal, props.rowPx, slots.value.length)
})

function appointmentsFor(staffId: string) {
  return props.appointments.filter(item => item.staffMemberId === staffId)
}

function blocksFor(staffId: string) {
  return props.blocks.filter(item => item.staffMemberId == null || item.staffMemberId === staffId)
}

function spanFor(startLocal: string, endLocal: string) {
  return blockSpan(props.shopHours.startLocal, startLocal, endLocal, slots.value.length)
}

const overlapWarning = computed(() => {
  return props.staff.some((member) => {
    const spans = appointmentsFor(member.id)
      .map(item => spanFor(item.startLocal, item.endLocal))
      .filter(item => item != null)
    return spans.some((left, index) => spans.some((right, other) => other > index && left.start < right.end && right.start < left.end))
  })
})

function showLabel(slot: string) {
  return slot.endsWith(':00') || slot.endsWith(':30')
}
</script>

<template>
  <div data-testid="calendar-timeline">
    <p
      v-if="overlapWarning"
      class="mb-2 text-sm text-accent"
    >
      Two bookings overlap on the same barber. Refresh to load the latest schedule.
    </p>
    <div
      class="max-h-[70vh] overflow-auto rounded border border-line bg-panel"
      :class="columns.scroll ? 'overflow-x-auto' : ''"
    >
      <div
        class="sticky top-0 z-40 grid border-b border-line bg-paper"
        :style="{ gridTemplateColumns: columns.template, minWidth: gridStyle.minWidth }"
      >
        <div />
        <div
          v-for="member in staff"
          :key="member.id"
          class="truncate px-2 py-2 text-sm font-medium"
        >
          {{ member.name }}
          <span
            v-if="!member.active"
            class="font-normal text-muted"
          >(inactive)</span>
        </div>
      </div>
      <div
        class="relative"
        :style="{ minWidth: gridStyle.minWidth }"
      >
        <div
          class="grid"
          :style="gridStyle"
        >
          <div
            v-for="(slot, row) in slots"
            :key="`time-${slot}`"
            class="sticky left-0 z-30 border-b border-line/70 bg-paper pr-2 text-right text-xs text-muted"
            :style="{ gridColumn: 1, gridRow: row + 1 }"
          >
            {{ showLabel(slot) ? slot : '' }}
          </div>
          <template
            v-for="(member, column) in staff"
            :key="member.id"
          >
            <template
              v-for="(slot, row) in slots"
              :key="`${member.id}-${slot}`"
            >
              <button
                v-if="member.active && slotOpen(member.hours, slot)"
                type="button"
                class="border-b border-l border-line/70 bg-panel"
                :style="{ gridColumn: column + 2, gridRow: row + 1 }"
                :aria-label="`Book ${member.name} at ${slot}`"
                @click="emit('empty', { staffId: member.id, startLocal: slot })"
              />
              <div
                v-else
                class="border-b border-l border-line/40 bg-stone-200/80"
                :style="{ gridColumn: column + 2, gridRow: row + 1 }"
              />
            </template>
            <template
              v-for="block in blocksFor(member.id)"
              :key="`${member.id}-${block.id}`"
            >
              <button
                v-if="spanFor(block.startLocal, block.endLocal)"
                type="button"
                class="z-10 mx-0.5 my-px min-h-0 overflow-hidden p-0"
                :style="{ gridColumn: column + 2, gridRow: `${spanFor(block.startLocal, block.endLocal)!.start + 1} / ${spanFor(block.startLocal, block.endLocal)!.end + 1}` }"
                :aria-label="`${block.title} ${block.startLocal}`"
                @click="emit('block', block)"
              >
                <CalendarBusyBlock
                  :block="block"
                  :compact="spanFor(block.startLocal, block.endLocal)!.end - spanFor(block.startLocal, block.endLocal)!.start < 2"
                />
              </button>
            </template>
            <template
              v-for="appointment in appointmentsFor(member.id)"
              :key="appointment.id"
            >
              <button
                v-if="spanFor(appointment.startLocal, appointment.endLocal)"
                type="button"
                class="z-20 mx-0.5 my-px min-h-0 overflow-hidden border-l-4 border-accent p-0"
                :style="{ gridColumn: column + 2, gridRow: `${spanFor(appointment.startLocal, appointment.endLocal)!.start + 1} / ${spanFor(appointment.startLocal, appointment.endLocal)!.end + 1}` }"
                :data-appointment="appointment.id"
                :aria-label="`${appointment.guestName} ${appointment.startLocal}`"
                @click="emit('appointment', appointment)"
              >
                <CalendarAppointmentBlock
                  :appointment="appointment"
                  :compact="spanFor(appointment.startLocal, appointment.endLocal)!.end - spanFor(appointment.startLocal, appointment.endLocal)!.start < 2"
                />
              </button>
            </template>
          </template>
        </div>
        <div
          v-if="nowTop != null"
          class="pointer-events-none absolute right-0 z-30 border-t-2 border-accent"
          :style="{ top: `${nowTop}px`, left: '4.5rem' }"
          data-testid="calendar-now"
        />
      </div>
    </div>
  </div>
</template>
