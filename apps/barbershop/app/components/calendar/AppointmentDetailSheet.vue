<script setup lang="ts">
import type { CalendarAppointment } from '~/utils/calendar-types'
import { durationMinutes, sourceLabel, statusLabel } from '~/utils/calendar-layout'

const props = defineProps<{
  open: boolean
  appointment: CalendarAppointment | null
  barberName: string
  timezone: string
  pending: boolean
  error: string
}>()

const emit = defineEmits<{
  close: []
  cancel: []
  complete: []
  noShow: []
}>()

const confirm = ref<null | 'completed' | 'no_show'>(null)

watch(() => [props.open, props.appointment?.id], () => {
  confirm.value = null
})
</script>

<template>
  <CalendarSheet
    :open="open"
    title="Appointment"
    @close="emit('close')"
  >
    <div v-if="appointment">
      <p
        v-if="error"
        class="mb-3 text-sm text-accent"
      >
        {{ error }}
      </p>
      <dl class="grid grid-cols-1 gap-2 text-sm">
        <div>
          <dt class="text-muted">
            Guest
          </dt>
          <dd>{{ appointment.guestName }}</dd>
        </div>
        <div>
          <dt class="text-muted">
            Phone
          </dt>
          <dd>{{ appointment.guestPhone || '—' }}</dd>
        </div>
        <div>
          <dt class="text-muted">
            Email
          </dt>
          <dd>{{ appointment.guestEmail || '—' }}</dd>
        </div>
        <div>
          <dt class="text-muted">
            Services
          </dt>
          <dd>
            <p
              v-for="service in appointment.services"
              :key="service.serviceNameSnapshot"
            >
              {{ service.serviceNameSnapshot }} · {{ service.durationMinutesSnapshot }} min
            </p>
          </dd>
        </div>
        <div>
          <dt class="text-muted">
            Time
          </dt>
          <dd>
            {{ appointment.startLocal }}–{{ appointment.endLocal }}
            · {{ durationMinutes(appointment.services, appointment.startAt, appointment.endAt) }} min
            · {{ timezone }}
          </dd>
        </div>
        <div>
          <dt class="text-muted">
            Barber
          </dt>
          <dd>{{ barberName }}</dd>
        </div>
        <div>
          <dt class="text-muted">
            Source
          </dt>
          <dd>{{ sourceLabel(appointment.source) }}</dd>
        </div>
        <div>
          <dt class="text-muted">
            Status
          </dt>
          <dd>{{ statusLabel(appointment.status) }}</dd>
        </div>
        <div v-if="appointment.notes">
          <dt class="text-muted">
            Notes
          </dt>
          <dd>{{ appointment.notes }}</dd>
        </div>
      </dl>
      <div
        v-if="appointment.status === 'confirmed'"
        class="mt-4 flex flex-col gap-2"
      >
        <template v-if="confirm === 'completed'">
          <p>Mark this appointment completed? This cannot be undone.</p>
          <button
            type="button"
            class="min-h-11 rounded bg-accent px-3 text-white"
            :disabled="pending"
            @click="emit('complete')"
          >
            Confirm complete
          </button>
          <button
            type="button"
            class="min-h-11 rounded border border-line px-3"
            :disabled="pending"
            @click="confirm = null"
          >
            Back
          </button>
        </template>
        <template v-else-if="confirm === 'no_show'">
          <p>Mark this appointment as a no-show? This cannot be undone.</p>
          <button
            type="button"
            class="min-h-11 rounded bg-accent px-3 text-white"
            :disabled="pending"
            @click="emit('noShow')"
          >
            Confirm no-show
          </button>
          <button
            type="button"
            class="min-h-11 rounded border border-line px-3"
            :disabled="pending"
            @click="confirm = null"
          >
            Back
          </button>
        </template>
        <template v-else>
          <button
            type="button"
            class="min-h-11 rounded bg-accent px-3 text-white"
            :disabled="pending"
            @click="confirm = 'completed'"
          >
            Complete
          </button>
          <button
            type="button"
            class="min-h-11 rounded border border-line px-3"
            :disabled="pending"
            @click="confirm = 'no_show'"
          >
            No-show
          </button>
          <button
            type="button"
            class="min-h-11 rounded border border-line px-3"
            :disabled="pending"
            @click="emit('cancel')"
          >
            Cancel appointment
          </button>
        </template>
      </div>
    </div>
  </CalendarSheet>
</template>
