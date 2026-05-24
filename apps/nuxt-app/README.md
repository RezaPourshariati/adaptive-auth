# @adaptive-auth/nuxt-app

Nuxt 4 SPA for AdaptiveAuth. Uses the same `@adaptive-auth/shared-auth` client and `auth-server` API as `vue-app`.

Phase D runs with **`ssr: false`** so auth stays cookie/CSRF-based on the client (same as the incremental plan).

UI uses **Tailwind v4** and **PrimeVue** (Aura theme), aligned with `apps/vue-app` for auth and home flows.

Authenticated workspace routes use the **`app-shell`** layout (header + sidebar): `/dashboard`, `/profile`, `/change-password`, `/users` (admin/author).

## Commands

From repo root:

```sh
pnpm dev:nuxt-app
pnpm build:nuxt-app
pnpm type-check:nuxt-app
pnpm lint:nuxt-app
```

End-to-end (needs MongoDB + `services/auth-server` env; CORS must allow `http://localhost:3000`). `pretest:e2e` downloads Chromium automatically if missing.

```sh
pnpm build:packages
pnpm build:nuxt-app   # optional locally; CI uses preview
pnpm test:e2e:nuxt-app
```

Or only install browsers: `pnpm --dir apps/nuxt-app test:e2e:install`

Run API + both frontends:

```sh
pnpm dev:stack
```

## Environment

Copy `.env.example` to `.env`.

Set `NUXT_PUBLIC_API_ROOT_URL` to the auth-server origin (no path).

Add `NUXT_PUBLIC_APP_URL=http://localhost:3000` to **`services/auth-server/.env`** so CORS allows the Nuxt dev origin.
