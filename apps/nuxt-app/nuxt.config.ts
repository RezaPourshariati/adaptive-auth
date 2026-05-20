// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-19',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt'],

  /** Phase D: client-only auth (cookie + CSRF) matches vue-app; SSR session forwarding comes later. */
  ssr: false,

  runtimeConfig: {
    public: {
      apiRoot: process.env.NUXT_PUBLIC_API_ROOT_URL || 'http://localhost:4000',
    },
  },

  vite: {
    optimizeDeps: {
      include: ['@adaptive-auth/shared-auth', '@adaptive-auth/shared-types'],
    },
  },
})
