# Documentation Index

This knowledge base is organized around architecture concepts, flows, decisions, and behavior — not file-by-file walkthroughs.

## How we write docs (“one page = one question”)

Each substantive page should:

1. **`## Primary Question`** — one sentence the reader came to answer.
2. **`## Short answer`** — a few bullets (current behavior only).
3. **Body** — behavior, code anchors, trade-offs, scope.
4. **`## Out of scope for this page`** — links to the page that owns adjacent topics (avoid sprawl).

Split the page when it answers more than one primary question. Reference pages may use a lighter pattern but still state what question they answer.

## Start Here

- [`architecture/auth-and-session-architecture.md`](./architecture/auth-and-session-architecture.md) — end-to-end auth/session model and boundaries.
- [`decisions/adr-001-explicit-refresh-authority.md`](./decisions/adr-001-explicit-refresh-authority.md) — why refresh authority is explicit and centralized.

## Architecture

- [`architecture/auth-and-session-architecture.md`](./architecture/auth-and-session-architecture.md)

## Security and Session Policy

- [`security/session-policy.md`](./security/session-policy.md)
- [`security/token-model-and-cookie-strategy.md`](./security/token-model-and-cookie-strategy.md)

## Frontend Orchestration

- [`frontend/auth-orchestration.md`](./frontend/auth-orchestration.md)
- [`frontend/routing-auth-guards.md`](./frontend/routing-auth-guards.md)
- [`frontend/layout-conventions.md`](./frontend/layout-conventions.md) — how vue-app picks layouts and owns chrome vs pages
- [`frontend/vue-app-target-structure.md`](./frontend/vue-app-target-structure.md) — target `app/` + `features/` + `layouts/` + `shared/` tree and cleanup order

## Backend Session Handling

- [`backend/access-validation-middleware.md`](./backend/access-validation-middleware.md)

## Request and Session Flows

- [`flows/refresh-flow.md`](./flows/refresh-flow.md)
- [`flows/idle-timeout-and-absolute-timeout-flow.md`](./flows/idle-timeout-and-absolute-timeout-flow.md)

## Architecture Decisions / Trade-offs

- [`decisions/adr-001-explicit-refresh-authority.md`](./decisions/adr-001-explicit-refresh-authority.md)
- [`decisions/architecture-review-v2.md`](./decisions/architecture-review-v2.md) — graded review after monorepo restructure
- [`decisions/product-strategy-analysis.md`](./decisions/product-strategy-analysis.md) — product directions from architecture DNA
- [`decisions/eslint-monorepo-strategy.md`](./decisions/eslint-monorepo-strategy.md) — ESLint strategy for monorepo packages
- [`decisions/discussion.md`](./decisions/discussion.md) — architecture direction review

## Reference

- [`reference/error-codes-and-meanings.md`](./reference/error-codes-and-meanings.md)
- [`reference/config-matrix.md`](./reference/config-matrix.md)
- [`reference/monorepo-rollout.md`](./reference/monorepo-rollout.md) — phased monorepo / canvas-aligned rollout checklist
- [`reference/adaptive-auth-platform-documentation.md`](./reference/adaptive-auth-platform-documentation.md) — comprehensive platform documentation

## Legacy / Prior Notes

These are older documents and may not fully reflect the current architecture:

- [`legacy/advanced-authentication-architecture.md`](./legacy/advanced-authentication-architecture.md)
- [`legacy/HYBRID-ARCHITECTURE.md`](./legacy/HYBRID-ARCHITECTURE.md)
