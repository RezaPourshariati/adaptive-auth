<template>
  <div class="flex min-h-screen items-center justify-center px-4">
    <div class="flex flex-col items-center gap-4 text-slate-600">
      <ProgressSpinner
        style="width: 48px; height: 48px"
        stroke-width="6"
        fill="transparent"
        animation-duration=".9s"
        aria-label="Application is loading"
      />
      <span class="text-sm font-medium">Preparing session...</span>
    </div>
  </div>
</template>
