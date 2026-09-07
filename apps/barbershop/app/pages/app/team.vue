<script setup lang="ts">
definePageMeta({ layout: 'app' })

interface ServiceRow {
  id: string
  name: string
}

interface StaffRow {
  id: string
  name: string
  specialty: string | null
  active: boolean
  serviceIds: string[]
}

const { data: teamData, refresh: refreshTeam } = await useFetch<{ staff: StaffRow[] }>('/api/staff/team')
const { data: serviceData } = await useFetch<{ services: ServiceRow[] }>('/api/staff/services')
const staff = computed(() => teamData.value?.staff ?? [])
const services = computed(() => serviceData.value?.services ?? [])
const error = ref('')
const pending = ref(false)
const editing = ref(false)
const form = reactive({
  id: '',
  name: '',
  specialty: '',
  active: true,
  serviceIds: [] as string[],
})

function serviceNames(ids: string[]) {
  const names = services.value.filter(item => ids.includes(item.id)).map(item => item.name)
  return names.length ? names.join(', ') : 'None assigned'
}

function startCreate() {
  editing.value = true
  form.id = ''
  form.name = ''
  form.specialty = ''
  form.active = true
  form.serviceIds = services.value.filter(item => !item.name.includes('Design')).map(item => item.id)
}

function edit(member: StaffRow) {
  editing.value = true
  form.id = member.id
  form.name = member.name
  form.specialty = member.specialty ?? ''
  form.active = member.active
  form.serviceIds = [...member.serviceIds]
}

async function save() {
  error.value = ''
  pending.value = true
  try {
    const body = {
      name: form.name,
      specialty: form.specialty || null,
      active: form.active,
      serviceIds: form.serviceIds,
    }
    if (form.id)
      await $fetch(`/api/staff/team/${form.id}`, { method: 'PATCH', body })
    else
      await $fetch('/api/staff/team', { method: 'POST', body })
    await refreshTeam()
  }
  catch (err: unknown) {
    error.value = (err as { statusMessage?: string }).statusMessage || 'Could not save barber.'
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
        Barbers
      </h1>
      <Button
        label="Add barber"
        @click="startCreate"
      />
    </div>
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
            :value="staff"
            data-key="id"
            striped-rows
          >
            <Column header="Barber">
              <template #body="{ data: member }">
                <strong>{{ member.name }}</strong>
                <div
                  v-if="member.specialty"
                  class="text-xs uppercase tracking-wide text-muted"
                >
                  {{ member.specialty }}
                </div>
              </template>
            </Column>
            <Column header="Services">
              <template #body="{ data: member }">
                {{ serviceNames(member.serviceIds) }}
              </template>
            </Column>
            <Column header="Status">
              <template #body="{ data: member }">
                <Tag
                  :value="member.active ? 'Active' : 'Inactive'"
                  :severity="member.active ? 'success' : 'secondary'"
                />
              </template>
            </Column>
            <Column>
              <template #body="{ data: member }">
                <Button
                  label="Edit"
                  severity="secondary"
                  text
                  size="small"
                  @click="edit(member)"
                />
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>
      <Card v-if="editing">
        <template #title>
          {{ form.id ? 'Edit barber' : 'New barber' }}
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
              Specialty
              <InputText
                v-model="form.specialty"
                fluid
              />
            </label>
            <p class="text-xs uppercase tracking-wide text-muted">
              Services this barber can perform
            </p>
            <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label
                v-for="item in services"
                :key="item.id"
                class="flex items-center gap-2 text-sm"
              >
                <Checkbox
                  v-model="form.serviceIds"
                  :value="item.id"
                />
                {{ item.name }}
              </label>
            </div>
            <label class="flex items-center gap-2 text-sm">
              <Checkbox
                v-model="form.active"
                binary
              />
              Active (appears as a bookable resource later)
            </label>
            <Button
              type="submit"
              label="Save barber"
              :disabled="pending"
              :loading="pending"
            />
          </form>
        </template>
      </Card>
    </div>
  </div>
</template>
