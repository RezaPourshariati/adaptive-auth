# Monorepo rollout sequence

This doc mirrors the phased rollout plan (including items that lived on the Cursor canvas when this repo was reorganized). Use it when prioritizing after Phase D.

## Architecture principles

- **Reusable foundation** — `auth-server` plus `packages/shared-types`, `shared-auth`, and `validation` (contracts, browser client, input rules). Not a shared UI kit.
- **Apps are thin shells** — Each `apps/*` client owns layout, routes, and components. UI is not extracted into `packages/ui`; if only one frontend remains later, delete or archive the other app rather than maintaining shared Vue components.
- **Extract on pain** — Add packages only when a second or third consumer needs the same logic (e.g. validation used by server + both clients). Avoid `auth-core` or similar until duplication actually hurts.
- **Primary vs experiment** — `vue-app` is the reference product client; `nuxt-app` validates that `shared-auth` works outside Vue Router. Do not chase full UI parity indefinitely—match routes and API usage, not every screen pixel-for-pixel.

## Completed phases

| Phase                        | Scope                                                                                                                       | Status |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------ |
| **A — Structure**            | `apps/vue-app`, `services/auth-server`, `pnpm-workspace.yaml`, root scripts & CI paths                                      | Done   |
| **B — Tooling**              | `packages/eslint-config`, `packages/config-typescript`, per-app ESLint                                                      | Done   |
| **C — Shared libraries**     | `packages/shared-types`, `packages/shared-auth` (`browser` entry), vue-app wiring                                           | Done   |
| **D — Nuxt SPA**             | `apps/nuxt-app` (Pinia, shared-auth, global auth middleware, `ssr: false`), auth-server CORS for `:3000`, CI validate/build | Done   |
| **D follow-ups**             | Shared `createResolveAuthRedirect` in `shared-auth`, Nuxt Playwright E2E + CI                                               | Done   |
| **E — Validation**           | `packages/validation` (Zod register/login/change-password), auth-server `register` + `login` wired                          | Done   |
| **E follow-up**              | Vue-app Playwright E2E in CI (`validate-vue-app`, `deploy-check-vue-app`)                                                   | Done   |
| **F — Frontend validation**  | `parseRegisterBody` / `parseLoginBody` on vue-app + nuxt-app login & register forms before API calls                        | Done   |
| **G — UI parity (phase 1)**  | Nuxt: Tailwind + PrimeVue (Aura), layouts/nav, auth pages aligned with vue-app                                              | Done   |
| **G2 — UI parity (phase 2)** | Nuxt: `app-shell` + sidebar, profile, change-password, users admin; extended auth/users stores                              | Done   |
| **G3 — UI parity (phase 3)** | Nuxt: forgot-password, reset-password, verify-email routes; validation helpers; login link parity                           | Done   |
| **G4 — Parity follow-up**    | Vue-app: `parseForgotPasswordBody` / `parseResetPasswordBody`; Nuxt: `/about`, `/contacts` + public nav                     | Done   |

## Next steps (recommended order)

1. **Land changes** — Smoke `pnpm dev:stack`, run full quality gates, commit and open a PR.

2. **Pick a primary client (when ready)** — Keep one production `apps/web-app`; move the other to `examples/` or remove from default CI.

3. **Nuxt SSR (when needed)** — Route-by-route SSR and server-side cookie/session forwarding for `bootstrapSession`.

4. **`turbo.json` (optional)** — Faster pipelines and clearer task graph once package/app count grows.

5. **Future apps** — Add `admin-web` / `mobile` only when scoped; no placeholder packages in `packages/`.

## Canvas note

If your Cursor canvas (`monorepo-structure-and-rollout`) diverges from this file, treat the canvas as the source of naming/timeline and sync bullets here occasionally so the repo stays self-contained.
