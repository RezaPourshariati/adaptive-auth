# Phase 1.1 — Architecture & Data Integrity Cleanup

We have completed Phase 1 of the Barbershop project and reviewed the implementation.

Do NOT start Phase 2 yet.

This phase is a small cleanup/gate before Scheduling Core (Phase 2). The goal is to fix the specific architectural and data-integrity issues identified in the Phase 1 review without unnecessarily rewriting the existing Phase 1 implementation.

Read the existing project structure and current implementation first. Do not assume the review is more accurate than the code: verify each issue against the actual code before changing anything.

## Context

Project:

- `apps/barbershop`
- Nuxt 4 + Nitro
- PostgreSQL + Drizzle
- SSR enabled
- This project currently lives inside the AdaptiveAuth monorepo.
- AdaptiveAuth may be used as a reference for tooling/conventions, but Barbershop must remain runtime-isolated from AdaptiveAuth.
- Do not introduce Express, Fastify, NestJS, Redis, queues, microservices, or other unnecessary infrastructure.

The next major phase will be Scheduling Core.

A critical architectural rule for Phase 2 is:

Browser
→ Nuxt/Nitro HTTP layer
→ Application / Use Cases
→ Domain
→ PostgreSQL

Nitro/H3 must be treated as the HTTP adapter, not as the place where scheduling business logic lives.

The future scheduling use cases must be plain TypeScript and must not depend on:

- H3Event
- event handlers
- `createError`
- Nitro request/response objects
- Nuxt runtime APIs

Examples:

- `reserveAppointment(input)`
- `checkAvailability(input)`

These should be callable independently from HTTP.

Do not implement these scheduling use cases in this phase. Only establish/fix the foundation needed for Phase 2.

---

# Task 1 — Fix Working Hours uniqueness

Review the current `working_hours` schema.

Current design supports:

- business-level working hours
- optional staff-level working hours
- `staff_member_id = NULL` for business-level hours

The current unique constraint uses something equivalent to:

`(business_id, owner_type, staff_member_id, weekday)`

Because PostgreSQL treats NULL values as distinct for normal unique constraints, multiple business-level rows can potentially exist for the same business/day.

Fix this properly.

Requirements:

1. Preserve the existing business-level vs staff-level model.
2. Business-level hours must allow at most one row per:
   - business
   - weekday
3. Staff-level hours must allow at most one row per:
   - business
   - staff member
   - weekday
4. Use a PostgreSQL-appropriate solution such as partial unique indexes if that is the cleanest approach.
5. Do not redesign the entire working-hours model.
6. Add/update migrations correctly.
7. Update tests to verify the constraint behavior.

Also verify that the existing application validation is consistent with the database constraints.

---

# Task 2 — Make replacement writes transactional

Review the current APIs/services that replace collections of records, especially:

- working hours replacement
- staff-service eligibility replacement

If the current implementation deletes existing rows and then inserts the new set without a transaction, fix that.

Requirements:

1. Replacement operations must be atomic.
2. If insertion fails after deletion, the previous valid state must not be lost.
3. Use the existing Drizzle/PostgreSQL setup.
4. Do not introduce a new ORM or infrastructure.
5. Keep the current API behavior intact.
6. Add tests where practical to verify transactional behavior.

Do not over-engineer transaction handling.

---

# Task 3 — Review `staff_service` tenant ownership

Review the current `staff_service` join table.

Current design:

- `staff_member_id`
- `service_id`
- composite primary key
- both foreign keys cascade
- no explicit `business_id`

Determine whether the current design safely guarantees that a staff member can only be associated with a service belonging to the same business.

We need strong tenant/data integrity because multi-tenancy is a future goal, even though full multi-tenancy is NOT being implemented now.

Preferred outcome:

Either:

A. Keep the current schema if the existing foreign-key structure plus application/database guarantees are genuinely sufficient, and document why,

OR

B. Add the necessary `business_id` / database constraint if that is the cleaner and stronger design.

Do not make the change merely for symmetry.

The important requirement is:

A staff member from Business A must never be able to become associated with a service from Business B.

If changing the schema, add the required migration and tests.

---

# Task 4 — Explicitly establish the Nitro architectural boundary

Review the current Phase 1 code structure.

Do not refactor all existing CRUD APIs just for the sake of architecture.

Instead, establish a clear convention/documentation for future scheduling work:

HTTP/Nitro layer:

- parses request
- authenticates/authorizes
- validates transport input
- calls application/use-case functions
- converts application errors to HTTP responses

Application/use-case layer:

- orchestrates business operations
- contains use cases
- does NOT depend on Nitro/H3

Domain:

- business rules/invariants
- pure TypeScript where practical
- does NOT depend on Nitro/H3

Persistence:

- Drizzle/PostgreSQL access

For this phase:

1. Add a short architecture note/documentation if needed.
2. If there is an obvious small example that should be moved to establish the pattern, you may do so.
3. Do NOT rewrite all Phase 1 handlers.
4. Do NOT introduce an unnecessary framework abstraction.
5. Do NOT create an empty "enterprise architecture" layer just for ceremony.

The main goal is to make the boundary explicit before Phase 2.

---

# Task 5 — Production safety of development credentials

Review the current development staff credentials:

`owner@local.test / changeme`

This is acceptable for local development/seeding only.

Ensure:

1. These credentials cannot accidentally become the production/default authentication path.
2. Production startup/deployment does not silently create a known default owner account.
3. If the current seed is intentionally development-only, make that explicit.
4. Production behavior should require deliberate configuration/initialization.
5. Do not remove the ability to seed a local development database conveniently.

Keep the solution simple.

---

# Task 6 — Review obvious Phase 1 leftovers

While reviewing the above, check for obvious low-risk cleanup:

- Is `@adaptive-auth/config-typescript` actually used by `apps/barbershop`?
  - If unused, remove it.
- PrimeVue is currently configured but the dashboard uses native HTML.
  - Do not introduce a UI rewrite.
  - If PrimeVue is genuinely unused, decide whether to remove the unused dependency/configuration now or leave it intentionally documented for the next UI phase.
- Do not spend significant time polishing UI in this phase.

Only make changes that are clearly justified.

---

# Important non-goals

DO NOT implement any of the following in Phase 1.1:

- Appointment
- AppointmentService
- CalendarBlock
- availability engine
- reservation engine
- booking flow
- public booking
- customer accounts
- OTP
- SMS
- email notifications
- notification outbox
- deposits/payment integration
- calendar UI
- walk-in scheduling engine
- multi-tenancy
- custom domains
- billing
- Redis
- background workers
- microservices

Those belong to later phases.

---

# Testing and verification

After implementation:

1. Run lint.
2. Run unit tests.
3. Run type-check.
4. Run production build.
5. Run database/migration checks if the local environment supports PostgreSQL.
6. Add focused tests for:
   - working-hours uniqueness
   - staff/service business isolation
   - transactional replacement behavior where practical
   - development credential safety if testable

If PostgreSQL is unavailable locally, do NOT fake successful DB verification.

Clearly separate:

- tests actually executed
- tests that could not be executed because the environment lacks PostgreSQL/Docker/etc.

---

# Final report

When finished, provide a concise but detailed Phase 1.1 report with:

## 1. Changes made

List every meaningful change.

## 2. Architecture decisions

Explain:

- how working-hours uniqueness was fixed
- how replacement transactions work
- how staff/service business isolation is guaranteed
- how the Nitro boundary is established
- how development credentials are protected

## 3. Files changed

List the important files.

## 4. Tests

Show exact commands run and results.

## 5. Database verification

State whether migrations and real PostgreSQL behavior were actually verified.

## 6. Remaining concerns

List anything intentionally left unresolved.

## 7. Phase 1.1 Definition of Done

Confirm each:

- [ ] Working-hours uniqueness is correct for both business-level and staff-level rows.
- [ ] Collection replacement operations are atomic.
- [ ] Staff/service cross-business associations are prevented.
- [ ] Nitro is explicitly treated as the HTTP adapter.
- [ ] Future scheduling use cases can remain plain TypeScript.
- [ ] Development credentials cannot silently become production credentials.
- [ ] No Phase 2 functionality was implemented.
- [ ] Lint passes.
- [ ] Tests pass.
- [ ] Type-check passes.
- [ ] Production build passes.

## 8. Phase 2 readiness

Give a final verdict:

- READY FOR PHASE 2
  or
- NOT READY FOR PHASE 2

If NOT READY, explain exactly what blocks it.

IMPORTANT:
STOP after this phase.

Do not begin Phase 2 automatically.

Wait for my explicit approval before implementing Scheduling Core.
