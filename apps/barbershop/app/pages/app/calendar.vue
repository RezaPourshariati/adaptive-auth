<script setup lang="ts">
import type { CalendarAppointment, CalendarBlockItem, CalendarDayView, CatalogService } from '~/utils/calendar-types'
import { addLocalDays, addMinutesHm, defaultFocusedStaffId, localNowParts, mutationFollowUp, resolveWalkInNow } from '~/utils/calendar-layout'

definePageMeta({ layout: 'app' })

function staffApi<T = unknown>(url: string, options?: { method?: string, body?: unknown }): Promise<T> {
  const request = $fetch as unknown as (path: string, init?: { method?: string, body?: unknown }) => Promise<T>
  return request(url, options)
}

const route = useRoute()
const router = useRouter()

const { data, refresh, error, pending } = await useFetch<CalendarDayView>('/api/staff/calendar', {
  query: computed(() => {
    const date = typeof route.query.date === 'string' ? route.query.date : undefined
    return date ? { date } : {}
  }),
})

watch(() => data.value?.date, (date) => {
  if (!date)
    return
  const current = typeof route.query.date === 'string' ? route.query.date : ''
  if (current !== date)
    void router.replace({ query: { ...route.query, date } })
})

const focusedId = ref('')
const showAll = ref(false)
const clockHm = ref<string | null>(null)
const actionError = ref('')
const actionPending = ref(false)
const services = ref<CatalogService[] | null>(null)
const bookingOpen = ref(false)
const detailOpen = ref(false)
const blockOpen = ref(false)
const selected = ref<CalendarAppointment | null>(null)
const bookingPreset = ref({
  source: 'walk_in' as 'walk_in' | 'phone' | 'staff_created',
  staffMemberId: '',
  startLocal: '10:00',
})
const blockPreset = ref({
  id: null as string | null,
  title: '',
  staffMemberId: null as string | null,
  startLocal: '12:00',
  endLocal: '13:00',
})

watch(() => data.value?.staff, (staff) => {
  if (!staff?.length) {
    focusedId.value = ''
    return
  }
  focusedId.value = defaultFocusedStaffId(staff, focusedId.value || null)
}, { immediate: true })

watch(data, (day) => {
  if (!selected.value || !day)
    return
  const next = day.appointments.find(item => item.id === selected.value?.id)
  if (!next)
    detailOpen.value = false
  else
    selected.value = next
})

watch(focusedId, (id) => {
  if (import.meta.client && id)
    sessionStorage.setItem('barbershop-calendar-staff', id)
})

function syncClock() {
  const timezone = data.value?.timezone
  if (!timezone)
    return
  clockHm.value = localNowParts(timezone).hm
}

function onVisible() {
  if (document.visibilityState === 'visible')
    void refresh()
}

let timer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  const staff = data.value?.staff ?? []
  const stored = sessionStorage.getItem('barbershop-calendar-staff')
  if (stored)
    focusedId.value = defaultFocusedStaffId(staff, stored)
  syncClock()
  timer = setInterval(syncClock, 30_000)
  document.addEventListener('visibilitychange', onVisible)
})

onBeforeUnmount(() => {
  if (timer)
    clearInterval(timer)
  document.removeEventListener('visibilitychange', onVisible)
})

const nowLocal = computed(() => {
  const day = data.value
  if (!day || day.date !== day.today)
    return null
  return clockHm.value ?? day.nowLocal
})

const shopBlocks = computed(() => (data.value?.blocks ?? []).filter(block => block.staffMemberId == null))

const loadMessage = computed(() => {
  const failure = error.value as { statusMessage?: string } | null
  return failure?.statusMessage || 'Could not load the calendar.'
})

function setDate(date: string) {
  if (date)
    void router.push({ query: { date } })
}

function shift(days: number) {
  if (data.value?.date)
    setDate(addLocalDays(data.value.date, days))
}

function goToday() {
  const timezone = data.value?.timezone
  if (timezone)
    setDate(localNowParts(timezone).date)
}

function readFetchError(err: unknown): { statusCode: number, message: string } {
  const typed = err as { statusCode?: number, statusMessage?: string }
  return {
    statusCode: typed.statusCode ?? 0,
    message: typed.statusMessage || 'Could not save that change.',
  }
}

async function runMutation(action: () => Promise<unknown>, close: () => void) {
  actionError.value = ''
  actionPending.value = true
  try {
    await action()
    close()
    if (mutationFollowUp(null) === 'refresh')
      await refresh()
  }
  catch (err: unknown) {
    const parsed = readFetchError(err)
    actionError.value = parsed.message
    if (mutationFollowUp(parsed.statusCode) === 'refresh-after-error')
      await refresh()
  }
  finally {
    actionPending.value = false
  }
}

async function loadServices() {
  if (services.value)
    return
  const result = await staffApi<{ services: CatalogService[] }>('/api/staff/services')
  services.value = result.services.filter(service => service.active)
}

function currentHm() {
  const timezone = data.value?.timezone
  if (!timezone)
    return data.value?.nowLocal ?? '10:00'
  return localNowParts(timezone).hm
}

async function openWalkIn() {
  await loadServices()
  const hours = data.value?.staff.find(member => member.id === focusedId.value)?.hours ?? data.value?.shopHours ?? null
  bookingPreset.value = {
    source: 'walk_in',
    staffMemberId: focusedId.value,
    startLocal: resolveWalkInNow(currentHm(), 40, hours),
  }
  actionError.value = ''
  bookingOpen.value = true
}

async function openEmpty(payload: { staffId: string, startLocal: string }) {
  await loadServices()
  bookingPreset.value = {
    source: 'staff_created',
    staffMemberId: payload.staffId,
    startLocal: payload.startLocal,
  }
  actionError.value = ''
  bookingOpen.value = true
}

function submitBooking(body: {
  source: 'walk_in' | 'phone' | 'staff_created'
  guestName: string
  guestPhone: string
  serviceIds: string[]
  staffMemberId: string
  startLocal: string
}) {
  return runMutation(() => staffApi('/api/staff/appointments', {
    method: 'POST',
    body: {
      source: body.source,
      guestName: body.guestName,
      guestPhone: body.guestPhone || undefined,
      serviceIds: body.serviceIds,
      staffMemberId: body.staffMemberId || undefined,
      localDate: data.value?.date,
      startLocal: body.startLocal,
    },
  }), () => {
    bookingOpen.value = false
  })
}

function openAppointment(appointment: CalendarAppointment) {
  selected.value = appointment
  actionError.value = ''
  detailOpen.value = true
}

function barberName(id: string) {
  return data.value?.staff.find(member => member.id === id)?.name ?? 'Barber'
}

function cancelSelected() {
  const id = selected.value?.id
  if (!id)
    return
  return runMutation(() => staffApi(`/api/staff/appointments/${id}/cancel`, { method: 'POST' }), () => {
    detailOpen.value = false
  })
}

function completeSelected() {
  const id = selected.value?.id
  if (!id)
    return
  return runMutation(() => staffApi(`/api/staff/appointments/${id}/complete`, { method: 'POST' }), () => {
    detailOpen.value = false
  })
}

function noShowSelected() {
  const id = selected.value?.id
  if (!id)
    return
  return runMutation(() => staffApi(`/api/staff/appointments/${id}/no-show`, { method: 'POST' }), () => {
    detailOpen.value = false
  })
}

function openNewBlock() {
  const start = data.value?.shopHours?.startLocal ?? '12:00'
  blockPreset.value = {
    id: null,
    title: '',
    staffMemberId: focusedId.value || null,
    startLocal: start,
    endLocal: addMinutesHm(start, 60) ?? data.value?.shopHours?.endLocal ?? '13:00',
  }
  actionError.value = ''
  blockOpen.value = true
}

function openBlock(block: CalendarBlockItem) {
  blockPreset.value = {
    id: block.id,
    title: block.title,
    staffMemberId: block.staffMemberId,
    startLocal: block.startLocal,
    endLocal: block.endLocal,
  }
  actionError.value = ''
  blockOpen.value = true
}

function saveBlock(body: { id: string | null, title: string, staffMemberId: string | null, startLocal: string, endLocal: string }) {
  const payload = {
    title: body.title,
    staffMemberId: body.staffMemberId,
    localDate: data.value?.date,
    startLocal: body.startLocal,
    endLocal: body.endLocal,
  }
  return runMutation(() => body.id
    ? staffApi(`/api/staff/blocks/${body.id}`, { method: 'PATCH', body: payload })
    : staffApi('/api/staff/blocks', { method: 'POST', body: payload }), () => {
    blockOpen.value = false
  })
}

function removeBlock(id: string) {
  return runMutation(() => staffApi(`/api/staff/blocks/${id}/cancel`, { method: 'POST' }), () => {
    blockOpen.value = false
  })
}
</script>

<template>
  <div>
    <h1 class="mb-3 text-2xl font-semibold">
      Calendar
    </h1>
    <p
      v-if="pending && !data"
      class="text-sm text-muted"
    >
      Loading calendar…
    </p>
    <div v-else-if="error">
      <p class="mb-3 text-sm text-accent">
        {{ loadMessage }}
      </p>
      <button
        type="button"
        class="min-h-11 rounded border border-line bg-panel px-3"
        @click="refresh()"
      >
        Retry
      </button>
    </div>
    <template v-else-if="data">
      <CalendarToolbar
        :date="data.date"
        :today="data.today"
        @shift="shift"
        @today="goToday"
        @pick="setDate"
        @refresh="refresh()"
        @walk-in="openWalkIn"
        @block="openNewBlock"
      />
      <ul
        v-if="shopBlocks.length"
        class="mb-3 flex flex-col gap-1 text-sm"
      >
        <li
          v-for="block in shopBlocks"
          :key="block.id"
        >
          <button
            type="button"
            class="min-h-11 w-full rounded border border-dashed border-stone-500 bg-stone-200 px-3 text-left"
            @click="openBlock(block)"
          >
            {{ block.title }} · {{ block.startLocal }}–{{ block.endLocal }} · shop-wide
          </button>
        </li>
      </ul>
      <CalendarClosedState
        v-if="data.closed"
        :day="data"
        @appointment="openAppointment"
        @block="openBlock"
      />
      <template v-else-if="data.shopHours">
        <div class="md:hidden">
          <CalendarFocus
            v-model:focused-id="focusedId"
            v-model:show-all="showAll"
            :day="data"
            :now-local="nowLocal"
            :row-px="36"
            @appointment="openAppointment"
            @block="openBlock"
            @empty="openEmpty"
          />
        </div>
        <div class="hidden md:block lg:hidden">
          <CalendarTimeline
            v-if="data.staff.length > 0 && data.staff.length <= 4"
            :staff="data.staff"
            :appointments="data.appointments"
            :blocks="data.blocks"
            :shop-hours="data.shopHours"
            :now-local="nowLocal"
            :row-px="32"
            @appointment="openAppointment"
            @block="openBlock"
            @empty="openEmpty"
          />
          <CalendarFocus
            v-else
            v-model:focused-id="focusedId"
            v-model:show-all="showAll"
            :day="data"
            :now-local="nowLocal"
            :row-px="32"
            @appointment="openAppointment"
            @block="openBlock"
            @empty="openEmpty"
          />
        </div>
        <div class="hidden lg:block">
          <CalendarTimeline
            :staff="data.staff"
            :appointments="data.appointments"
            :blocks="data.blocks"
            :shop-hours="data.shopHours"
            :now-local="nowLocal"
            :row-px="28"
            @appointment="openAppointment"
            @block="openBlock"
            @empty="openEmpty"
          />
        </div>
      </template>
      <CalendarAppointmentDetailSheet
        :open="detailOpen"
        :appointment="selected"
        :barber-name="selected ? barberName(selected.staffMemberId) : ''"
        :timezone="data.timezone"
        :pending="actionPending"
        :error="actionError"
        @close="detailOpen = false"
        @cancel="cancelSelected"
        @complete="completeSelected"
        @no-show="noShowSelected"
      />
      <CalendarBookingForm
        v-if="services"
        :open="bookingOpen"
        :date="data.date"
        :timezone="data.timezone"
        :services="services"
        :staff="data.staff"
        :shop-hours="data.shopHours"
        :preset="bookingPreset"
        :pending="actionPending"
        :error="actionError"
        :now-hm="currentHm()"
        @close="bookingOpen = false"
        @submit="submitBooking"
      />
      <CalendarBlockForm
        :open="blockOpen"
        :date="data.date"
        :staff="data.staff"
        :preset="blockPreset"
        :pending="actionPending"
        :error="actionError"
        @close="blockOpen = false"
        @save="saveBlock"
        @remove="removeBlock"
      />
    </template>
  </div>
</template>
