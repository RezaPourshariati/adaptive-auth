<script setup lang="ts">
definePageMeta({ layout: 'app' })

const { data: team } = await useFetch<{ staff: { active: boolean }[] }>('/api/staff/team')
const { data: serviceData } = await useFetch<{ services: unknown[] }>('/api/staff/services')
const { data: hours } = await useFetch<{ days: { closed: boolean }[] }>('/api/staff/hours')

const services = computed(() => serviceData.value?.services ?? [])
const activeBarbers = computed(() => (team.value?.staff ?? []).filter(row => row.active).length)
const openDays = computed(() => (hours.value?.days ?? []).filter(day => !day.closed).length)
</script>

<template>
  <div>
    <h1 class="mb-3 text-2xl font-semibold">
      Overview
    </h1>
    <Message
      severity="info"
      class="mb-4"
      :closable="false"
    >
      Services and prices below are seed defaults (Vancouver men's-shop norms, plus names from the current website). Change them anytime. They are not locked in.
    </Message>
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Card>
        <template #title>
          Active barbers
        </template>
        <template #content>
          <p class="text-3xl font-semibold">
            {{ activeBarbers }}
          </p>
        </template>
      </Card>
      <Card>
        <template #title>
          Services
        </template>
        <template #content>
          <p class="text-3xl font-semibold">
            {{ services.length }}
          </p>
        </template>
      </Card>
      <Card>
        <template #title>
          Open days
        </template>
        <template #content>
          <p class="text-3xl font-semibold">
            {{ openDays }}
          </p>
        </template>
      </Card>
    </div>
  </div>
</template>
