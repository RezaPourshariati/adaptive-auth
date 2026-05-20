/** @type {import('eslint').Linter.Config} */
export const vueRules = {
  files: ['**/*.vue'],
  rules: {
    'vue/max-attributes-per-line': ['error', {
      singleline: { max: 1 },
      multiline: { max: 1 },
    }],
  },
}
