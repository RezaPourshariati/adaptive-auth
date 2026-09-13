import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'

/** Aura tuned to the shop palette. Used in `/app` only. */
export const cryptoBarberPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#fdf6f3',
      100: '#f8e8e1',
      200: '#efc9b8',
      300: '#e3a285',
      400: '#c96a42',
      500: '#9a3412',
      600: '#852d10',
      700: '#6b240d',
      800: '#521c0b',
      900: '#3b1408',
      950: '#210b04',
    },
  },
})
