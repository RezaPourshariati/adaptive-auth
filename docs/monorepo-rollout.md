# Monorepo rollout sequence

This doc mirrors the phased rollout plan (including items that lived on the Cursor canvas when this repo was reorganized). Use it when prioritizing after Phase D.

## Completed phases

| Phase                       | Scope                                                                                                                       | Status |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------ |
| **A — Structure**           | `apps/vue-app`, `services/auth-server`, `pnpm-workspace.yaml`, root scripts & CI paths                                      | Done   |
| **B — Tooling**             | `packages/eslint-config`, `packages/config-typescript`, per-app ESLint                                                      | Done   |
| **C — Shared libraries**    | `packages/shared-types`, `packages/shared-auth` (`browser` entry), vue-app wiring                                           | Done   |
| **D — Nuxt SPA**            | `apps/nuxt-app` (Pinia, shared-auth, global auth middleware, `ssr: false`), auth-server CORS for `:3000`, CI validate/build | Done   |
| **D follow-ups**            | Shared `createResolveAuthRedirect` in `shared-auth`, Nuxt Playwright E2E + CI                                               | Done   |
| **E — Validation**          | `packages/validation` (Zod register/login/change-password), auth-server `register` + `login` wired                          | Done   |
| **E follow-up**             | Vue-app Playwright E2E in CI (`validate-vue-app`, `deploy-check-vue-app`)                                                   | Done   |
| **F — Frontend validation** | `parseRegisterBody` / `parseLoginBody` on vue-app + nuxt-app login & register forms before API calls                        | Done   |

## Next steps (recommended order)

1. **Land changes** — Smoke `pnpm dev:stack`, run `pnpm lint`, `pnpm type-check`, `pnpm test`, `pnpm build`, `pnpm test:e2e`, `pnpm test:e2e:nuxt-app`, commit and open a PR.

2. **Nuxt SSR (when needed)** — Route-by-route SSR and server-side cookie/session forwarding for `bootstrapSession`; keep current SPA mode until SEO or first-hit auth matters.

3. **UI parity** — Align Nuxt screens with vue-app (e.g. PrimeVue / shared component kit) if both apps stay product-facing.

4. **`turbo.json` (optional)** — Faster pipelines and clearer task graph once package/app count grows.

5. **Future apps** — Placeholders only until scoped: admin SPA, mobile client, etc.

## Canvas note

If your Cursor canvas (`monorepo-structure-and-rollout`) diverges from this file, treat the canvas as the source of naming/timeline and sync bullets here occasionally so the repo stays self-contained.
