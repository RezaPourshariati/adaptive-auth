import Aura from '@primeuix/themes/aura'
import tailwindcss from '@tailwindcss/vite'
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-19',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt', '@primevue/nuxt-module'],

  css: ['~/assets/css/main.css', 'primeicons/primeicons.css'],

  /** Phase D: client-only auth (cookie + CSRF) matches vue-app; SSR session forwarding comes later. */
  ssr: false,

  runtimeConfig: {
    public: {
      apiRoot: process.env.NUXT_PUBLIC_API_ROOT_URL || 'http://localhost:4000',
    },
  },

  primevue: {
    options: {
      ripple: true,
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '[data-theme="dark"]',
        },
      },
    },
    components: {
      include: ['Button', 'Card', 'InputText', 'Message', 'Password'],
    },
  },

  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: [
        '@adaptive-auth/shared-auth',
        '@adaptive-auth/shared-types',
        '@adaptive-auth/validation',
        'primevue',
      ],
    },
  },
})
