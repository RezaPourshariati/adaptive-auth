Phase 2B review pass only. Do not start Phase 3.

The implementation report looks aligned with the approved Phase 2A architecture.

Before we consider Phase 2B finally approved, perform a focused verification/review pass.

Do NOT rewrite working code unnecessarily.

Please inspect the actual schema, migration, application code, and tests and verify the following:

1. AppointmentService cross-business integrity

Confirm that it is impossible for:

- an Appointment from business A to reference an AppointmentService from business B
- an AppointmentService from business A to reference a Service from business B

Prefer database-level composite FK protection where appropriate, not application validation alone.

2. Appointment vs CalendarBlock concurrency

This is critical.

Verify that concurrent operations cannot create:

- an appointment overlapping a staff-specific calendar block
- an appointment overlapping a shop-wide calendar block
- a calendar block overlapping an existing active appointment

The transaction/locking strategy must remain correct across multiple application instances.

If the implementation already guarantees this, add explicit PostgreSQL integration tests proving it.

If not, fix the implementation.

3. Any Barber concurrency

Verify with real PostgreSQL integration tests that concurrent Any Barber reservations:

- never assign the same barber to overlapping appointments
- can use different eligible barbers when multiple barbers are available
- retry the next candidate after a concurrency conflict
- always persist a real staff_member_id

4. Appointment status transitions

Inspect cancelAppointment() and verify that invalid status transitions are rejected.

At minimum, confirm the intended behavior for:

CONFIRMED -> CANCELLED
CONFIRMED -> COMPLETED
CONFIRMED -> NO_SHOW
COMPLETED -> CANCELLED
NO_SHOW -> CANCELLED
CANCELLED -> CONFIRMED

Do not over-engineer this. Add only the invariant actually needed by the scheduling core.

5. Database constraints

Review the actual migration SQL and confirm that important scheduling invariants are enforced at DB level where practical:

- end_at > start_at
- valid appointment status/source
- cross-business relationships
- active appointment overlap
- active block overlap
- required AppointmentService relationship

Pay particular attention to the deferred trigger requiring at least one AppointmentService.

6. Reservation re-check

Verify that reserveAppointment() does not trust a previous availability result.

It must re-check inside the transaction:

- business
- active services
- service eligibility
- staff active status
- working hours
- appointments
- staff blocks
- shop-wide blocks

7. Public API boundary

Review:

GET /api/availability
POST /api/appointments

Confirm that the public routes cannot be used to access another business.

The current single-shop "first business" behavior is acceptable for Phase 2B.

Do not implement multi-tenancy yet.

8. Timezone/DST

Review the actual implementation and tests for:

- America/Vancouver
- spring-forward nonexistent local time
- fall-back ambiguous local time
- conversion of local working hours to instants

Do not change the approved DST behavior unless the implementation contradicts the Phase 2A decision.

9. Test environment

If PostgreSQL/Docker is unavailable in the current environment, do NOT pretend the integration tests passed.

Instead, clearly distinguish:

- unit tests passed
- integration tests skipped
- integration tests not yet verified

If possible, provide the exact minimal commands needed to run them once PostgreSQL is available.

10. Do not expand scope.

Do NOT implement:

- Calendar UI
- public booking UI
- OTP
- customer accounts
- SMS/email
- payments
- deposits
- CRM
- notifications
- multi-tenancy
- SaaS billing

After this focused review/fix pass:

Run:

pnpm --dir apps/barbershop lint
pnpm --dir apps/barbershop test
pnpm --dir apps/barbershop type-check
pnpm --dir apps/barbershop build

If PostgreSQL is available, also run the full integration suite.

Return:

1. Issues found
2. Fixes made
3. Files changed
4. DB/migration changes
5. Concurrency verification
6. Test results
7. Tests still skipped and why
8. Remaining concerns

Do NOT start Phase 3.

Stop and wait for my approval.
