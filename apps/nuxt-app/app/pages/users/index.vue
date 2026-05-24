<script setup lang="ts">
import type { UserRole } from '@adaptive-auth/shared-types'

definePageMeta({
  requiresAuth: true,
  roles: ['admin', 'author'],
  layout: 'app-shell',
  pageTitle: 'User management',
})

const usersStore = useUsersStore()
const message = ref('')
const errorMessage = ref('')

const roleDraft = ref<Record<string, UserRole>>({})

const roleOptions: { label: string, value: UserRole }[] = [
  { label: 'subscriber', value: 'subscriber' },
  { label: 'author', value: 'author' },
  { label: 'admin', value: 'admin' },
  { label: 'suspended', value: 'suspended' },
]

function syncRoleDraft() {
  roleDraft.value = Object.fromEntries(usersStore.list.map(user => [user._id, user.role]))
}

onMounted(async () => {
  try {
    await usersStore.fetchUsers()
    syncRoleDraft()
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to load users'
  }
})

async function handleDelete(id: string) {
  message.value = ''
  errorMessage.value = ''
  try {
    const result = await usersStore.removeUser(id)
    message.value = result.message
    syncRoleDraft()
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to delete user'
  }
}

async function handleRoleUpdate(id: string) {
  message.value = ''
  errorMessage.value = ''
  const nextRole = roleDraft.value[id]
  if (!nextRole)
    return
  try {
    const result = await usersStore.upgradeRole({ id, role: nextRole })
    message.value = result.message
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to update user role'
  }
}
</script>

<template>
  <section>
    <AuthNotice
      v-if="message"
      class="mb-4"
      kind="success"
      :message="message"
    />
    <AuthNotice
      v-if="errorMessage"
      class="mb-4"
      kind="error"
      :message="errorMessage"
    />

    <DataTable
      :value="usersStore.list"
      :loading="usersStore.loading"
      size="small"
      striped-rows
      show-gridlines
      data-key="_id"
      class="text-sm"
      table-style="min-width: 50rem"
    >
      <template #empty>
        <span class="text-gray-500">No users found.</span>
      </template>
      <Column
        field="name"
        header="Name"
        sortable
      />
      <Column
        field="email"
        header="Email"
        sortable
      />
      <Column header="Role">
        <template #body="{ data }">
          <Select
            v-model="roleDraft[data._id]"
            :options="roleOptions"
            option-label="label"
            option-value="value"
            placeholder="Role"
            class="w-full min-w-40 md:w-56"
            :disabled="usersStore.loading"
          />
        </template>
      </Column>
      <Column header="Actions">
        <template #body="{ data }">
          <div class="flex flex-wrap gap-2">
            <Button
              label="Update role"
              size="small"
              :disabled="usersStore.loading"
              @click="handleRoleUpdate(data._id)"
            />
            <Button
              label="Delete"
              severity="danger"
              size="small"
              :disabled="usersStore.loading"
              @click="handleDelete(data._id)"
            />
          </div>
        </template>
      </Column>
    </DataTable>
  </section>
</template>
