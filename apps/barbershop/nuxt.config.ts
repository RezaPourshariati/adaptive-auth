import tailwindcss from '@tailwindcss/vite'
import { cryptoBarberPreset } from './app/theme/crypto-barber'

export default defineNuxtConfig({
  compatibilityDate: '2025-05-19',
  devtools: { enabled: true },
  ssr: true,
  modules: ['@primevue/nuxt-module'],
  css: ['~/assets/css/main.css', 'primeicons/primeicons.css'],
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL || '',
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3001',
    },
  },
  primevue: {
    options: {
      ripple: true,
      theme: {
        preset: cryptoBarberPreset,
        options: {
          darkModeSelector: 'none',
        },
      },
    },
    components: {
      include: [
        'Button',
        'Card',
        'Checkbox',
        'Column',
        'DataTable',
        'InputNumber',
        'InputText',
        'Message',
        'Password',
        'Tag',
        'Textarea',
      ],
    },
  },
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['primevue'],
    },
  },
})
