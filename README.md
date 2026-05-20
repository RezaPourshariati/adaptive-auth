# AdaptiveAuth

AdaptiveAuth is a full-stack adaptive authentication starter organized as a pnpm monorepo.

## Project structure

- `apps/vue-app` — Vue + Vite SPA
- `apps/nuxt-app` — Nuxt 4 SPA (client-only auth for now)
- `services/auth-server` — Express + TypeScript API
- `packages/config-typescript` — shared TS presets (`base`, `vue-dom`, `node-vite`, `node-service`)
- `packages/eslint-config` — shared ESLint flat configs (`vue`, `node`)
- `packages/shared-types` — API contracts and DTOs (`AuthUser`, payloads, `UserRole`, …)
- `packages/shared-auth` — browser auth HTTP client, refresh, CSRF, `bootstrapSession` (`@adaptive-auth/shared-auth/browser`)
- root — workspace orchestration, shared lint/TS config, CI ([rollout checklist](./docs/monorepo-rollout.md))

## Prerequisites

- Node.js 22+
- pnpm 10+

## Install

```sh
pnpm install
```

## Development

Run the Vue app only:

```sh
pnpm dev
```

Run Vue app and auth server:

```sh
pnpm dev:full
```

Run packages independently:

```sh
pnpm dev:vue-app
pnpm dev:nuxt-app
pnpm dev:auth-server
pnpm dev:stack   # vue + nuxt + API
```

## Quality checks

```sh
pnpm lint
pnpm type-check
pnpm test
pnpm test:e2e
pnpm test:e2e:nuxt-app
```

## Build

Shared libraries must be built before apps (root `build` does this automatically):

```sh
pnpm build:packages
pnpm build:vue-app
pnpm build:auth-server
pnpm build
```

## Environment

- Copy `apps/vue-app/.env.example` → `apps/vue-app/.env`
- Copy `apps/nuxt-app/.env.example` → `apps/nuxt-app/.env`
- Copy `services/auth-server/.env.example` → `services/auth-server/.env` (include `NUXT_PUBLIC_APP_URL` for CORS)

If you had `.env` files under the old `front-end/` or `back-end/` paths, move them to the locations above.
