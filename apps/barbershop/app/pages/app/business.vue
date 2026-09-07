<script setup lang="ts">
definePageMeta({ layout: 'app' })

const { data } = await useFetch<{ business: Record<string, unknown> }>('/api/staff/business')
const timezone = computed(() => String(data.value?.business.timezone ?? 'America/Vancouver'))
const form = reactive({
  name: String(data.value?.business.name ?? ''),
  phone: String(data.value?.business.phone ?? ''),
  email: String(data.value?.business.email ?? ''),
  addressLine: String(data.value?.business.addressLine ?? ''),
  city: String(data.value?.business.city ?? ''),
  region: String(data.value?.business.region ?? ''),
  postalCode: String(data.value?.business.postalCode ?? ''),
  country: String(data.value?.business.country ?? ''),
  cancelNoticeHours: Number(data.value?.business.cancelNoticeHours ?? 4),
  contactInstructions: String(data.value?.business.contactInstructions ?? ''),
  depositPercent: Number(data.value?.business.depositPercent ?? 20),
})
const error = ref('')
const saved = ref(false)
const pending = ref(false)

async function save() {
  error.value = ''
  saved.value = false
  pending.value = true
  try {
    await $fetch('/api/staff/business', { method: 'PATCH', body: form })
    saved.value = true
  }
  catch (err: unknown) {
    error.value = (err as { statusMessage?: string }).statusMessage || 'Could not save.'
  }
  finally {
    pending.value = false
  }
}
</script>

<template>
  <div>
    <h1 class="mb-3 text-2xl font-semibold">
      Business
    </h1>
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
      Saved.
    </Message>
    <Card>
      <template #content>
        <form
          class="flex max-w-3xl flex-col gap-4"
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
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label class="flex flex-col gap-1 text-sm text-muted">
              Phone
              <InputText
                v-model="form.phone"
                required
                fluid
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-muted">
              Email
              <InputText
                v-model="form.email"
                type="email"
                required
                fluid
              />
            </label>
          </div>
          <label class="flex flex-col gap-1 text-sm text-muted">
            Address
            <InputText
              v-model="form.addressLine"
              required
              fluid
            />
          </label>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label class="flex flex-col gap-1 text-sm text-muted">
              City
              <InputText
                v-model="form.city"
                required
                fluid
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-muted">
              Region
              <InputText
                v-model="form.region"
                required
                fluid
              />
            </label>
          </div>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label class="flex flex-col gap-1 text-sm text-muted">
              Postal code
              <InputText
                v-model="form.postalCode"
                required
                fluid
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-muted">
              Country
              <InputText
                v-model="form.country"
                required
                fluid
              />
            </label>
          </div>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label class="flex flex-col gap-1 text-sm text-muted">
              Cancel notice (hours)
              <InputNumber
                v-model="form.cancelNoticeHours"
                :min="0"
                :max="72"
                fluid
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-muted">
              Deposit percent
              <InputNumber
                v-model="form.depositPercent"
                :min="0"
                :max="100"
                suffix="%"
                fluid
              />
            </label>
          </div>
          <label class="flex flex-col gap-1 text-sm text-muted">
            Late-cancel instructions
            <Textarea
              v-model="form.contactInstructions"
              rows="3"
              fluid
            />
          </label>
          <p class="text-xs uppercase tracking-wide text-muted">
            Timezone {{ timezone }} — not editable in this phase
          </p>
          <Button
            type="submit"
            label="Save business"
            :disabled="pending"
            :loading="pending"
          />
        </form>
      </template>
    </Card>
  </div>
</template>
