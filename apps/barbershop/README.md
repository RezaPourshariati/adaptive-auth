# Crypto Barber Shop (`apps/barbershop`)

Nuxt 4 application for the Crypto Barber Shop rebuild. Lives in the AdaptiveAuth workspace until it is extracted to its own git repository.

**Runtime isolation:** this app must not import `@adaptive-auth/shared-auth`, `@adaptive-auth/shared-types`, or call `auth-server`.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the Nitro-as-adapter rule.

## Phase 1–2

Business configuration dashboard plus scheduling core (`checkAvailability`, `reserveAppointment`). No calendar UI and no public booking UI yet.

Integration tests need PostgreSQL. They skip unless `DATABASE_URL` or `BARBERSHOP_TEST_DATABASE_URL` is set:

```bash
docker compose -f apps/barbershop/docker-compose.yml up -d
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/barbershop
pnpm --dir apps/barbershop db:migrate
pnpm --dir apps/barbershop test
```

## Local database

```bash
docker compose -f apps/barbershop/docker-compose.yml up -d
cp apps/barbershop/.env.example apps/barbershop/.env
pnpm --dir apps/barbershop db:migrate
pnpm --dir apps/barbershop db:seed
pnpm --dir apps/barbershop dev
```

`db:seed` is a deliberate local command. The Nuxt app never seeds on startup.

Local-only owner (development defaults): `owner@local.test` / `changeme`

Production seed requires `STAFF_OWNER_EMAIL` and `STAFF_OWNER_PASSWORD` and refuses those development defaults.

Dashboard: http://localhost:3001/app

## UI

Tailwind CSS v4 (`@tailwindcss/vite`, tokens in `app/assets/css/main.css`). PrimeVue 4 is installed and themed for a later dashboard pass; current pages use native HTML.

## Scripts

```bash
pnpm --dir apps/barbershop dev
pnpm --dir apps/barbershop test
pnpm --dir apps/barbershop lint
pnpm --dir apps/barbershop type-check
pnpm --dir apps/barbershop build
```
