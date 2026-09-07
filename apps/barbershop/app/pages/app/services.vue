<script setup lang="ts">
definePageMeta({ layout: 'app' })

interface ServiceRow {
  id: string
  name: string
  description: string
  durationMinutes: number
  priceDollars: string
  active: boolean
}

const { data, refresh } = await useFetch<{ services: ServiceRow[] }>('/api/staff/services')
const services = computed(() => data.value?.services ?? [])
const error = ref('')
const pending = ref(false)
const editing = ref(false)
const form = reactive({
  id: '',
  name: '',
  description: '',
  durationMinutes: 40,
  priceDollars: 40,
  active: true,
})

function startCreate() {
  editing.value = true
  form.id = ''
  form.name = ''
  form.description = ''
  form.durationMinutes = 40
  form.priceDollars = 40
  form.active = true
}

function edit(item: ServiceRow) {
  editing.value = true
  form.id = item.id
  form.name = item.name
  form.description = item.description
  form.durationMinutes = item.durationMinutes
  form.priceDollars = Number(item.priceDollars)
  form.active = item.active
}

async function save() {
  error.value = ''
  pending.value = true
  try {
    const body = {
      name: form.name,
      description: form.description,
      durationMinutes: form.durationMinutes,
      priceDollars: form.priceDollars,
      active: form.active,
    }
    if (form.id)
      await $fetch(`/api/staff/services/${form.id}`, { method: 'PATCH', body })
    else
      await $fetch('/api/staff/services', { method: 'POST', body })
    await refresh()
  }
  catch (err: unknown) {
    error.value = (err as { statusMessage?: string }).statusMessage || 'Could not save service.'
  }
  finally {
    pending.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-4 flex items-center justify-between gap-4">
      <h1 class="m-0 text-2xl font-semibold">
        Services
      </h1>
      <Button
        label="Add service"
        @click="startCreate"
      />
    </div>
    <Message
      severity="info"
      class="mb-4"
      :closable="false"
    >
      Example defaults you can edit. Durations must be 5-minute steps. Slot starts later use a 10-minute grid.
    </Message>
    <Message
      v-if="error"
      severity="error"
      class="mb-4"
      :closable="false"
    >
      {{ error }}
    </Message>
    <div class="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <template #content>
          <DataTable
            :value="services"
            data-key="id"
            striped-rows
          >
            <Column header="Service">
              <template #body="{ data: item }">
                <strong>{{ item.name }}</strong>
                <div class="text-xs uppercase tracking-wide text-muted">
                  {{ item.description }}
                </div>
              </template>
            </Column>
            <Column header="Duration">
              <template #body="{ data: item }">
                {{ item.durationMinutes }} min
              </template>
            </Column>
            <Column header="Price">
              <template #body="{ data: item }">
                CAD {{ item.priceDollars }}
              </template>
            </Column>
            <Column header="Status">
              <template #body="{ data: item }">
                <Tag
                  :value="item.active ? 'Active' : 'Inactive'"
                  :severity="item.active ? 'success' : 'secondary'"
                />
              </template>
            </Column>
            <Column>
              <template #body="{ data: item }">
                <Button
                  label="Edit"
                  severity="secondary"
                  text
                  size="small"
                  @click="edit(item)"
                />
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>
      <Card v-if="editing">
        <template #title>
          {{ form.id ? 'Edit service' : 'New service' }}
        </template>
        <template #content>
          <form
            class="flex flex-col gap-4"
            @submit.prevent="save"
          >
            <label class="flex flex-col gap-1 text-sm text-muted">
              Name
              <InputText
                v-model="form.name"
                required
                fluid
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-muted">
              Description
              <Textarea
                v-model="form.description"
                rows="3"
                fluid
              />
            </label>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label class="flex flex-col gap-1 text-sm text-muted">
                Duration (minutes)
                <InputNumber
                  v-model="form.durationMinutes"
                  :min="10"
                  :max="240"
                  :step="5"
                  fluid
                />
              </label>
              <label class="flex flex-col gap-1 text-sm text-muted">
                Price (CAD)
                <InputNumber
                  v-model="form.priceDollars"
                  mode="currency"
                  currency="CAD"
                  locale="en-CA"
                  :min="0"
                  :max-fraction-digits="2"
                  fluid
                />
              </label>
            </div>
            <label class="flex items-center gap-2 text-sm">
              <Checkbox
                v-model="form.active"
                binary
              />
              Active
            </label>
            <Button
              type="submit"
              label="Save service"
              :disabled="pending"
              :loading="pending"
            />
          </form>
        </template>
      </Card>
    </div>
  </div>
</template>
