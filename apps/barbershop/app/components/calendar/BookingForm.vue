<script setup lang="ts">
import type { CalendarHours, CalendarStaff, CatalogService } from '~/utils/calendar-types'
import { isSlotAligned, resolveWalkInNow } from '~/utils/calendar-layout'

const props = defineProps<{
  open: boolean
  date: string
  timezone: string
  services: CatalogService[]
  staff: CalendarStaff[]
  shopHours: CalendarHours | null
  preset: {
    source: 'walk_in' | 'phone' | 'staff_created'
    staffMemberId: string
    startLocal: string
  }
  pending: boolean
  error: string
  nowHm: string
}>()

const emit = defineEmits<{
  close: []
  submit: [body: {
    source: 'walk_in' | 'phone' | 'staff_created'
    guestName: string
    guestPhone: string
    serviceIds: string[]
    staffMemberId: string
    startLocal: string
  }]
}>()

const guestName = ref('')
const guestPhone = ref('')
const source = ref<'walk_in' | 'phone' | 'staff_created'>('walk_in')
const staffMemberId = ref('')
const startLocal = ref('10:00')
const serviceIds = ref<string[]>([])
const formError = ref('')

watch(() => props.open, (open) => {
  if (!open)
    return
  guestName.value = ''
  guestPhone.value = ''
  source.value = props.preset.source
  staffMemberId.value = props.preset.staffMemberId
  startLocal.value = props.preset.startLocal
  serviceIds.value = []
  formError.value = ''
})

const selectedHours = computed(() => {
  if (!staffMemberId.value)
    return props.shopHours
  return props.staff.find(member => member.id === staffMemberId.value)?.hours ?? props.shopHours
})

const duration = computed(() => {
  return props.services
    .filter(service => serviceIds.value.includes(service.id))
    .reduce((sum, service) => sum + service.durationMinutes, 0)
})

function toggleService(id: string) {
  serviceIds.value = serviceIds.value.includes(id)
    ? serviceIds.value.filter(item => item !== id)
    : [...serviceIds.value, id]
}

function useNow() {
  startLocal.value = resolveWalkInNow(props.nowHm, duration.value || 10, selectedHours.value)
}

function save() {
  formError.value = ''
  if (!guestName.value.trim()) {
    formError.value = 'Name is required.'
    return
  }
  if (!serviceIds.value.length) {
    formError.value = 'Choose at least one service.'
    return
  }
  if (!isSlotAligned(startLocal.value)) {
    formError.value = 'Start must be a 10-minute time, such as 10:00 or 10:10.'
    return
  }
  emit('submit', {
    source: source.value,
    guestName: guestName.value.trim(),
    guestPhone: guestPhone.value.trim(),
    serviceIds: serviceIds.value,
    staffMemberId: staffMemberId.value,
    startLocal: startLocal.value.slice(0, 5),
  })
}
</script>

<template>
  <CalendarSheet
    :open="open"
    title="Add to calendar"
    @close="emit('close')"
  >
    <form
      class="flex flex-col gap-3"
      @submit.prevent="save"
    >
      <p
        v-if="error || formError"
        class="text-sm text-accent"
      >
        {{ formError || error }}
      </p>
      <label class="flex flex-col gap-1 text-sm">
        Name
        <input
          v-model="guestName"
          required
          maxlength="80"
          class="min-h-11 rounded border border-line px-3"
        >
      </label>
      <label class="flex flex-col gap-1 text-sm">
        Phone
        <input
          v-model="guestPhone"
          type="tel"
          maxlength="40"
          class="min-h-11 rounded border border-line px-3"
        >
      </label>
      <label class="flex flex-col gap-1 text-sm">
        Source
        <select
          v-model="source"
          class="min-h-11 rounded border border-line bg-panel px-3"
        >
          <option value="walk_in">
            Walk-in
          </option>
          <option value="phone">
            Phone
          </option>
          <option value="staff_created">
            Staff
          </option>
        </select>
      </label>
      <fieldset class="flex flex-col gap-2 text-sm">
        <legend>Services</legend>
        <label
          v-for="service in services"
          :key="service.id"
          class="flex min-h-11 items-center gap-2"
        >
          <input
            type="checkbox"
            :checked="serviceIds.includes(service.id)"
            @change="toggleService(service.id)"
          >
          {{ service.name }} · {{ service.durationMinutes }} min
        </label>
      </fieldset>
      <label class="flex flex-col gap-1 text-sm">
        Barber
        <select
          v-model="staffMemberId"
          class="min-h-11 rounded border border-line bg-panel px-3"
        >
          <option value="">
            Any Barber
          </option>
          <option
            v-for="member in staff.filter(item => item.active)"
            :key="member.id"
            :value="member.id"
          >
            {{ member.name }}
          </option>
        </select>
      </label>
      <label class="flex flex-col gap-1 text-sm">
        Start on {{ date }}
        <span class="text-xs text-muted">Times use {{ timezone }}</span>
        <input
          v-model="startLocal"
          type="time"
          step="600"
          required
          class="min-h-11 rounded border border-line px-3"
        >
      </label>
      <button
        type="button"
        class="min-h-11 rounded border border-line px-3"
        @click="useNow"
      >
        Now
      </button>
      <button
        type="submit"
        class="min-h-11 rounded bg-accent px-3 text-white"
        :disabled="pending"
      >
        Reserve
      </button>
    </form>
  </CalendarSheet>
</template>
