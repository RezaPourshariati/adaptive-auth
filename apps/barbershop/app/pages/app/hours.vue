<script setup lang="ts">
definePageMeta({ layout: 'app' })

interface DayRow {
  weekday: number
  label: string
  closed: boolean
  startLocal: string
  endLocal: string
}

const { data } = await useFetch<{ days: DayRow[] }>('/api/staff/hours')
const days = ref<DayRow[]>(structuredClone(data.value?.days ?? []))
const error = ref('')
const saved = ref(false)
const pending = ref(false)

async function save() {
  error.value = ''
  saved.value = false
  pending.value = true
  try {
    await $fetch('/api/staff/hours', {
      method: 'PUT',
      body: { days: days.value },
    })
    saved.value = true
  }
  catch (err: unknown) {
    error.value = (err as { statusMessage?: string }).statusMessage || 'Could not save hours.'
  }
  finally {
    pending.value = false
  }
}
</script>

<template>
  <div>
    <h1 class="mb-3 text-2xl font-semibold">
      Working hours
    </h1>
    <Message
      severity="info"
      class="mb-4"
      :closable="false"
    >
      Seeded as 08:00–19:00 every day. Closed days have no bookable slots later.
    </Message>
    <Message
      v-if="error"
      severity="error"
      class="mb-4"
      :closable="false"
    >
      {{ error }}
    </Message>
    <Message
      v-if="saved"
      severity="success"
      class="mb-4"
      :closable="false"
    >
      Hours saved.
    </Message>
    <Card>
      <template #content>
        <form
          class="flex flex-col gap-4"
          @submit.prevent="save"
        >
          <DataTable
            :value="days"
            data-key="weekday"
          >
            <Column
              field="label"
              header="Day"
            />
            <Column header="Closed">
              <template #body="{ data: day }">
                <Checkbox
                  v-model="day.closed"
                  binary
                />
              </template>
            </Column>
            <Column header="Start">
              <template #body="{ data: day }">
                <input
                  v-model="day.startLocal"
                  type="time"
                  :disabled="day.closed"
                  class="rounded border border-line bg-white px-3 py-2 disabled:opacity-50"
                >
              </template>
            </Column>
            <Column header="End">
              <template #body="{ data: day }">
                <input
                  v-model="day.endLocal"
                  type="time"
                  :disabled="day.closed"
                  class="rounded border border-line bg-white px-3 py-2 disabled:opacity-50"
                >
              </template>
            </Column>
          </DataTable>
          <Button
            type="submit"
            label="Save hours"
            :disabled="pending"
            :loading="pending"
          />
        </form>
      </template>
    </Card>
  </div>
</template>
