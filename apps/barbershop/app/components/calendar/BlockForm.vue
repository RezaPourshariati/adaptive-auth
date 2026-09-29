<script setup lang="ts">
import type { CalendarStaff } from '~/utils/calendar-types'
import { addMinutesHm } from '~/utils/calendar-layout'

const props = defineProps<{
  open: boolean
  date: string
  staff: CalendarStaff[]
  preset: {
    id: string | null
    title: string
    staffMemberId: string | null
    startLocal: string
    endLocal: string
  }
  pending: boolean
  error: string
}>()

const emit = defineEmits<{
  close: []
  save: [body: { id: string | null, title: string, staffMemberId: string | null, startLocal: string, endLocal: string }]
  remove: [id: string]
}>()

const title = ref('')
const scope = ref<'staff' | 'shop'>('staff')
const staffMemberId = ref('')
const startLocal = ref('12:00')
const endLocal = ref('13:00')
const formError = ref('')
const confirmRemove = ref(false)

watch(() => props.open, (open) => {
  if (!open)
    return
  title.value = props.preset.title
  scope.value = props.preset.staffMemberId ? 'staff' : 'shop'
  staffMemberId.value = props.preset.staffMemberId ?? props.staff.find(member => member.active)?.id ?? ''
  startLocal.value = props.preset.startLocal
  endLocal.value = props.preset.endLocal
  formError.value = ''
  confirmRemove.value = false
})

function applyChip(minutes: number) {
  const next = addMinutesHm(startLocal.value.slice(0, 5), minutes)
  if (next)
    endLocal.value = next
}

function save() {
  formError.value = ''
  const start = startLocal.value.slice(0, 5)
  const end = endLocal.value.slice(0, 5)
  if (!title.value.trim()) {
    formError.value = 'Title is required.'
    return
  }
  if (end <= start) {
    formError.value = 'End must be after start.'
    return
  }
  if (scope.value === 'staff' && !staffMemberId.value) {
    formError.value = 'Choose a barber or make the block shop-wide.'
    return
  }
  emit('save', {
    id: props.preset.id,
    title: title.value.trim(),
    staffMemberId: scope.value === 'shop' ? null : staffMemberId.value,
    startLocal: start,
    endLocal: end,
  })
}
</script>

<template>
  <CalendarSheet
    :open="open"
    :title="preset.id ? 'Edit block' : 'Block time'"
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
        Title
        <input
          v-model="title"
          maxlength="80"
          required
          class="min-h-11 rounded border border-line px-3"
        >
      </label>
      <label class="flex flex-col gap-1 text-sm">
        Who
        <select
          v-model="scope"
          class="min-h-11 rounded border border-line bg-panel px-3"
        >
          <option value="staff">
            One barber
          </option>
          <option value="shop">
            Shop-wide
          </option>
        </select>
      </label>
      <label
        v-if="scope === 'staff'"
        class="flex flex-col gap-1 text-sm"
      >
        Barber
        <select
          v-model="staffMemberId"
          class="min-h-11 rounded border border-line bg-panel px-3"
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
      <label class="flex flex-col gap-1 text-sm">
        Start on {{ date }}
        <input
          v-model="startLocal"
          type="time"
          required
          class="min-h-11 rounded border border-line px-3"
        >
      </label>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="minutes in [30, 60, 90]"
          :key="minutes"
          type="button"
          class="min-h-11 rounded border border-line px-3"
          @click="applyChip(minutes)"
        >
          {{ minutes }} min
        </button>
      </div>
      <label class="flex flex-col gap-1 text-sm">
        End
        <input
          v-model="endLocal"
          type="time"
          required
          class="min-h-11 rounded border border-line px-3"
        >
      </label>
      <button
        type="submit"
        class="min-h-11 rounded bg-accent px-3 text-white"
        :disabled="pending"
      >
        Save block
      </button>
      <template v-if="preset.id">
        <template v-if="confirmRemove">
          <p class="text-sm">
            Remove this block?
          </p>
          <button
            type="button"
            class="min-h-11 rounded border border-line px-3"
            :disabled="pending"
            @click="emit('remove', preset.id)"
          >
            Confirm remove
          </button>
          <button
            type="button"
            class="min-h-11 rounded border border-line px-3"
            :disabled="pending"
            @click="confirmRemove = false"
          >
            Back
          </button>
        </template>
        <button
          v-else
          type="button"
          class="min-h-11 rounded border border-line px-3"
          :disabled="pending"
          @click="confirmRemove = true"
        >
          Remove block
        </button>
      </template>
    </form>
  </CalendarSheet>
</template>
