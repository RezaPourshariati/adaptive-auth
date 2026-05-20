# Monorepo rollout sequence

This doc mirrors the phased rollout plan (including items that lived on the Cursor canvas when this repo was reorganized). Use it when prioritizing after Phase D.

## Completed phases

| Phase                    | Scope                                                                                                                       | Status                  |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| **A — Structure**        | `apps/vue-app`, `services/auth-server`, `pnpm-workspace.yaml`, root scripts & CI paths                                      | Done                    |
| **B — Tooling**          | `packages/eslint-config`, `packages/config-typescript`, per-app ESLint                                                      | Done                    |
| **C — Shared libraries** | `packages/shared-types`, `packages/shared-auth` (`browser` entry), vue-app wiring                                           | Done                    |
| **D — Nuxt SPA**         | `apps/nuxt-app` (Pinia, shared-auth, global auth middleware, `ssr: false`), auth-server CORS for `:3000`, CI validate/build | Done                    |
| **D follow-ups**         | Shared `createResolveAuthRedirect` in `shared-auth`, Nuxt Playwright E2E + CI when `validate-nuxt-app` runs                 | Done (keep maintaining) |

## Next steps (recommended order)

1. **Land changes** — Smoke `pnpm dev:stack`, run `pnpm lint`, `pnpm type-check`, `pnpm test`, `pnpm build`, commit and open a PR so CI runs Nuxt E2E against MongoDB.

2. **`packages/validation` (optional Phase)** — Shared Zod (or similar) schemas for requests/responses and forms across vue-app, nuxt-app, and auth-server where duplication hurts.

3. **Vue-app E2E in CI** — Same pattern as Nuxt (Mongo service + secrets): run `pnpm test:e2e` for parity with local regression gates.

4. **Nuxt SSR (when needed)** — Route-by-route SSR and server-side cookie/session forwarding for `bootstrapSession`; keep current SPA mode until SEO or first-hit auth matters.

5. **UI parity** — Align Nuxt screens with vue-app (e.g. PrimeVue / shared component kit) if both apps stay product-facing.

6. **`turbo.json` (optional)** — Faster pipelines and clearer task graph once package/app count grows.

7. **Future apps** — Placeholders only until scoped: admin SPA, mobile client, etc.

## Canvas note

If your Cursor canvas (`monorepo-structure-and-rollout`) diverges from this file, treat the canvas as the source of naming/timeline and sync bullets here occasionally so the repo stays self-contained.
