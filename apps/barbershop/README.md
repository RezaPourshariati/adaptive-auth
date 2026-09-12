# Crypto Barber Shop (`apps/barbershop`)

Nuxt 4 application for the Crypto Barber Shop rebuild. Lives in the AdaptiveAuth workspace until it is extracted to its own git repository.

**Runtime isolation:** this app must not import `@adaptive-auth/shared-auth`, `@adaptive-auth/shared-types`, or call `auth-server`.

## Phase 1

Business configuration dashboard: services, barbers, hours, and shop settings. Seed data is an editable starting point.

## Local database

```bash
docker compose -f apps/barbershop/docker-compose.yml up -d
cp apps/barbershop/.env.example apps/barbershop/.env
pnpm --dir apps/barbershop db:migrate
pnpm --dir apps/barbershop db:seed
pnpm --dir apps/barbershop dev
```

Staff login (change after first sign-in): `owner@local.test` / `changeme`

Dashboard: http://localhost:3001/app

## UI

Tailwind CSS v4 (`@tailwindcss/vite`, tokens in `app/assets/css/main.css`). PrimeVue 4 + Aura (copper preset) on `/app`. The public home page stays Tailwind-only.

## Scripts

```bash
pnpm --dir apps/barbershop dev
pnpm --dir apps/barbershop test
pnpm --dir apps/barbershop lint
pnpm --dir apps/barbershop type-check
pnpm --dir apps/barbershop build
```
