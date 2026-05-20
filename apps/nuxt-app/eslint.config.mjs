import vue from '@adaptive-auth/eslint-config/vue'

export default vue.append({
  ignores: ['.nuxt/**', '.output/**', 'dist/**', 'node_modules/**'],
})
