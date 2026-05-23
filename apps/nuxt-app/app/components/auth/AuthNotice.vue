<script setup lang="ts">
interface Props {
  kind: 'success' | 'error' | 'info'
  message: string
}

defineProps<Props>()

function classes(kind: Props['kind']): string {
  if (kind === 'success')
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (kind === 'error')
    return 'border-red-200 bg-red-50 text-red-700'
  return 'border-blue-200 bg-blue-50 text-blue-700'
}
</script>

<template>
  <div
    class="rounded border px-3 py-2 text-sm"
    :class="classes(kind)"
  >
    {{ message }}
  </div>
</template>
