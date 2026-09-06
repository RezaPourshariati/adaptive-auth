# Crypto Barber Shop (`apps/barbershop`)

Nuxt 4 application for the Crypto Barber Shop rebuild. Lives in the AdaptiveAuth workspace until it is extracted to its own git repository.

**Runtime isolation:** this app must not import `@adaptive-auth/shared-auth`, `@adaptive-auth/shared-types`, or call `auth-server`. ESLint and TypeScript presets from `packages/` are tooling only.

## Phase 0

Foundation: SSR Nuxt, TypeScript, Drizzle config, health check. No calendar, booking, or OTP.

## Scripts

```bash
pnpm --dir apps/barbershop dev          # http://localhost:3001
pnpm --dir apps/barbershop test
pnpm --dir apps/barbershop lint
pnpm --dir apps/barbershop type-check
pnpm --dir apps/barbershop build
```

Copy `.env.example` to `.env` and set `DATABASE_URL` when Postgres is available. Without it, `GET /api/health` returns `database: "unconfigured"` and the app still runs.

## Product tables

Not in this phase. See `docs/ideas/start-beauty-platform-2.md` and `docs/ideas/crypto-barber-plan-acceptance.md`.
