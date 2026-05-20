# @adaptive-auth/nuxt-app

Nuxt 4 SPA for AdaptiveAuth. Uses the same `@adaptive-auth/shared-auth` client and `auth-server` API as `vue-app`.

Phase D runs with **`ssr: false`** so auth stays cookie/CSRF-based on the client (same as the incremental plan).

## Commands

From repo root:

```sh
pnpm dev:nuxt-app
pnpm build:nuxt-app
pnpm type-check:nuxt-app
pnpm lint:nuxt-app
```

End-to-end (needs MongoDB + `services/auth-server` env; CORS must allow `http://localhost:3000`). Build shared packages first (`pnpm build:packages`) if `dist/` is missing. First time, install browsers: `pnpm --dir apps/nuxt-app exec playwright install chromium`.

```sh
# from repo root
pnpm test:e2e:nuxt-app
```

Run API + both frontends:

```sh
pnpm dev:stack
```

## Environment

Copy `.env.example` to `.env`.

Set `NUXT_PUBLIC_API_ROOT_URL` to the auth-server origin (no path).

Add `NUXT_PUBLIC_APP_URL=http://localhost:3000` to **`services/auth-server/.env`** so CORS allows the Nuxt dev origin.
