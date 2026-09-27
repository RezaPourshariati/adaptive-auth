<script setup lang="ts">
const props = defineProps<{
  open: boolean
  title: string
}>()

const emit = defineEmits<{
  close: []
}>()

const dialog = ref<HTMLDialogElement | null>(null)

async function sync() {
  await nextTick()
  const node = dialog.value
  if (!node)
    return
  if (props.open && !node.open)
    node.showModal()
  if (!props.open && node.open)
    node.close()
}

watch(() => props.open, sync)

function onDialogClick(event: MouseEvent) {
  if (event.target === dialog.value)
    dialog.value?.close()
}

function onClose() {
  if (props.open)
    emit('close')
}

onMounted(sync)
</script>

<template>
  <dialog
    ref="dialog"
    class="calendar-sheet"
    @click="onDialogClick"
    @close="onClose"
  >
    <div class="flex max-h-dvh flex-col md:max-h-[90vh] md:w-[min(100vw,36rem)]">
      <header class="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <h2 class="text-lg font-semibold">
          {{ title }}
        </h2>
        <button
          type="button"
          class="min-h-11 rounded px-3 text-sm"
          @click="dialog?.close()"
        >
          Close
        </button>
      </header>
      <div class="overflow-auto p-4">
        <slot />
      </div>
    </div>
  </dialog>
</template>
