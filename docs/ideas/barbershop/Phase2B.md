# Phase 2B — Scheduling Core Implementation

We have approved the Phase 2A Scheduling Core architecture/design.

Now implement Phase 2B only (Phase 2).

The goal of this phase is to implement the scheduling domain and application layer as production-quality infrastructure, including:

- Appointment
- AppointmentService
- CalendarBlock
- checkAvailability()
- reserveAppointment()
- cancellation support required by the core model
- PostgreSQL concurrency protection
- Any Barber selection
- timezone-aware scheduling
- comprehensive automated tests

Do NOT implement Phase 3 or any later phase.

==================================================

1. # HARD ARCHITECTURAL RULES

The architecture must remain:

Browser / API
↓
Nitro HTTP adapter
↓
Application / Use Cases
↓
Domain scheduling logic
↓
PostgreSQL

Nitro is only the HTTP adapter.

The scheduling application/domain layer MUST NOT import or depend on:

- H3Event
- createError
- H3 request/response objects
- Nitro route handlers
- Nuxt UI/runtime APIs

In particular:

server/application/scheduling/

must be plain TypeScript.

The primary use cases must be implemented as framework-independent functions:

- checkAvailability(input)
- reserveAppointment(input)

They should be callable from tests without creating an HTTP request.

Thin Nitro handlers may adapt HTTP input/output to these use cases.

Do NOT introduce Express, Fastify, NestJS, Redis, queues, microservices, or another API framework.

Do NOT rewrite the Phase 1 CRUD architecture unnecessarily.

# ================================================== 2. PHASE BOUNDARY

Implement ONLY Scheduling Core.

Allowed:

- database schema changes for scheduling
- Drizzle migrations
- scheduling domain utilities
- scheduling application/use cases
- thin scheduling API routes if needed for verification
- unit tests
- PostgreSQL integration tests
- test fixtures/helpers
- documentation required for the architecture

Explicitly NOT allowed:

- Calendar UI
- Resource Timeline UI
- drag/drop
- public booking UI
- customer accounts
- OTP
- customer sessions
- notification system
- SMS
- email
- payment provider
- deposits/payment collection
- CRM
- loyalty
- analytics
- multi-tenancy onboarding
- custom domains
- SaaS billing

Phase 2B must stop after Scheduling Core is implemented and verified.

# ================================================== 3. DATABASE MODEL

Implement the Phase 2A approved schema.

---

## 3.1 Appointment

Create Appointment with:

- id
- business_id
- staff_member_id
- start_at
- end_at
- generated/stored during range if supported by the chosen Drizzle/PostgreSQL implementation
- timezone snapshot
- status
- source
- guest_name
- guest_phone
- guest_email
- notes
- created_at
- updated_at

Business relationship:

- business_id → business.id
- use RESTRICT where appropriate

Staff relationship:

- staff_member_id must belong to the same business

Prefer a composite FK where practical:

(staff_member_id, business_id)
→ staff_member(id, business_id)

Do not allow cross-business appointment/staff relationships.

Checks:

- end_at > start_at
- guest_name is valid/non-empty
- reasonable field lengths

Status values:

- CONFIRMED
- COMPLETED
- CANCELLED
- NO_SHOW

Source values:

- ONLINE
- PHONE
- WALK_IN
- STAFF_CREATED

Important:

WALK_IN is a source, NOT a status.

A walk-in can become a normal appointment if staff decides to put it on the calendar.

---

## 3.2 AppointmentService

Create AppointmentService with:

- id
- appointment_id
- business_id
- service_id
- service_name_snapshot
- duration_minutes_snapshot
- price_cents_snapshot
- currency_snapshot
- sort_order

The appointment must contain at least one service.

The service information stored on the appointment is a HISTORICAL SNAPSHOT.

If the Service is later renamed, repriced, deactivated, or its duration changes:

existing appointments MUST NOT change.

service_id should remain a reference to the original service where appropriate, but historical snapshot fields are authoritative for the appointment history.

Use RESTRICT for service deletion/reference integrity.

Prevent cross-business service relationships.

The appointment duration is:

sum(duration_minutes_snapshot)

and:

end_at = start_at + total duration

Do not allow the caller to independently choose an appointment end time.

---

## 3.3 CalendarBlock

Create CalendarBlock with:

- id
- business_id
- staff_member_id nullable
- start_at
- end_at
- generated/stored during range if appropriate
- title
- cancelled_at nullable
- created_at
- updated_at

Meaning:

staff_member_id = specific barber block

staff_member_id = NULL

means shop-wide block.

Examples:

- lunch
- meeting
- maintenance
- private event
- unavailable period

Do NOT represent blocked time as fake appointments.

Checks:

- end_at > start_at

Blocks must not overlap each other when they apply to the same resource.

Implement appropriate PostgreSQL exclusion constraints/indexes.

# ================================================== 4. POSTGRESQL OVERLAP PROTECTION

PostgreSQL is the final authority for schedule overlap.

Use:

tstzrange(start_at, end_at, '[)')

Half-open intervals are required.

Therefore:

10:00–10:40

and

10:40–11:20

DO NOT overlap.

Cancelled and NO_SHOW appointments must not occupy the barber's schedule.

CONFIRMED and COMPLETED appointments occupy the schedule.

Use PostgreSQL GiST exclusion constraints for appointment overlap.

Use:

btree_gist

if required.

Do not rely only on application-level overlap checks.

Application checks are for user-friendly validation.

Database constraints are the final safety boundary.

Map PostgreSQL overlap violations (for example SQLSTATE 23P01) into a domain/application error such as:

SLOT_UNAVAILABLE

or an equivalent clearly defined scheduling error.

Do not expose raw PostgreSQL errors to clients.

# ================================================== 5. CONCURRENCY

This is a critical requirement.

Two concurrent reservation requests for the same barber/time MUST NOT both succeed.

Implement the Phase 2A strategy:

1. Begin transaction.
2. Lock the relevant business/resource row as appropriate.
3. Determine candidate barber(s).
4. Lock the selected barber row using FOR UPDATE.
5. Re-check:
   - barber active status
   - service eligibility
   - working hours
   - existing appointments
   - calendar blocks
6. Insert appointment.
7. Insert AppointmentService rows.
8. Commit.

PostgreSQL exclusion constraints remain the final protection.

If an exclusion violation occurs because of a race:

- treat it as a slot conflict
- if Any Barber was requested, try the next deterministic candidate
- otherwise return SLOT_UNAVAILABLE

Do not swallow concurrency errors.

Do not use Redis or an in-memory mutex.

The solution must remain correct across multiple application instances.

# ================================================== 6. ANY BARBER

"Any Barber" must NOT be persisted as a fake staff ID.

The final Appointment MUST ALWAYS contain a real staff_member_id.

For Any Barber:

1. Find eligible active barbers.
2. Order deterministically:
   - sort_order ASC
   - id ASC as tie-breaker
3. Try candidates in that order.
4. Re-check availability inside the transaction.
5. If a candidate loses a concurrency race, try the next candidate.
6. Persist the actual selected barber.

The same algorithm must remain safe under concurrent requests.

Do not use random assignment.

Do not create an "ANY" barber record.

# ================================================== 7. AVAILABILITY ENGINE

Implement:

checkAvailability(input)

Input should contain approximately:

- businessId
- serviceIds
- localDate: YYYY-MM-DD
- optional staffMemberId

Return enough information for a future public booking UI, including:

- timezone
- total duration
- available slots
- startAt ISO timestamp
- local display time
- selected staff member where applicable

For a specific barber:

return slots for that barber.

For Any Barber:

return the union of valid start times across eligible barbers.

Do NOT assign/persist a barber during availability lookup.

Assignment happens only during reserveAppointment().

---

## Availability algorithm

1. Load business.
2. Validate services.
3. Ensure services are active.
4. Determine eligible barbers.
5. Determine weekday for the requested localDate in the BUSINESS timezone.
6. Load business working hours.
7. If staff-level hours exist for that barber:
   effective hours = business hours ∩ staff hours
8. If staff-level hours do not exist:
   effective hours = business hours
9. If shop is closed:
   no availability.
10. Load occupying appointments.
11. Load staff-specific calendar blocks.
12. Load shop-wide calendar blocks.
13. Subtract occupied ranges.
14. Convert local working ranges to actual instants using the business timezone.
15. Remove slots that are already in the past.
16. Generate 10-minute aligned start times.
17. A slot is valid only if the FULL service duration fits.
18. Return available starts.

The 10-minute grid is currently fixed.

Do NOT make slot interval configurable in Phase 2B.

Do NOT hard-code 15-minute busy blocks.

Calendar blocks use whatever duration the staff specifies.

# ================================================== 8. WORKING HOURS

Use the existing Phase 1 working-hours model.

Working hours are local wall-clock values.

Business timezone is authoritative for interpreting them.

Initial seeded timezone:

America/Vancouver

Do not hard-code business hours such as 08:00–19:00 into scheduling logic.

Read hours from the database.

Respect:

- closed days
- business hours
- staff-specific hours where present

For now, support the Phase 2A model:

one interval per owner/day.

Do not add multiple intervals per day unless the existing schema makes it necessary.

# ================================================== 9. TIMEZONE / DST

Scheduling must be timezone-aware.

Never treat local booking time as UTC.

For public/staff scheduling input:

local date + local time + business timezone

must resolve to a real instant.

Use a reliable timezone implementation such as:

- date-fns-tz
- Temporal if available and appropriate

Do not write custom timezone/DST conversion logic.

Explicitly handle DST cases.

Spring-forward:

- invalid/nonexistent local times must not generate bookable slots.

Fall-back:

- ambiguous local times must resolve consistently according to the Phase 2A decision.

Appointments themselves should use timestamptz.

Store the business timezone snapshot on the appointment so historical interpretation remains clear if business configuration changes later.

Add automated DST tests.

# ================================================== 10. RESERVE APPOINTMENT

Implement:

reserveAppointment(input)

Input approximately:

- businessId
- serviceIds
- startAt OR local date + local time
- optional staffMemberId
- source
- guestName
- guestPhone
- guestEmail
- notes

For now, guest booking is supported.

Do NOT require a Customer/User entity.

Do NOT create customer_id yet.

Guest phone:

Treat phone as required for ONLINE booking unless the existing approved design clearly requires otherwise.

For staff-created/other sources, follow the source-specific validation model.

Do not implement payment/deposit logic.

---

## Reservation transaction

Inside ONE DB transaction:

1. Load and validate business.
2. Validate services.
3. Validate service ownership.
4. Validate active status.
5. Snapshot service data.
6. Calculate total duration.
7. Calculate end_at.
8. Determine candidate barber(s).
9. Lock barber row.
10. Re-check active/eligibility.
11. Re-check effective working hours.
12. Re-check appointment conflicts.
13. Re-check staff blocks.
14. Re-check shop-wide blocks.
15. Insert Appointment.
16. Insert AppointmentService rows.
17. Commit.

The caller must NOT control end_at independently.

Do not create an appointment first and then attach services outside the transaction.

If AppointmentService insertion fails, the appointment must roll back.

There must never be an orphan appointment without its required service rows.

# ================================================== 11. CANCELLATION CORE

Implement the scheduling-level cancellation use case required by the approved architecture.

Cancellation must:

- update appointment status to CANCELLED
- preserve appointment history
- release the schedule because CANCELLED appointments do not occupy availability

Do not delete appointments.

Do not implement the complete customer-facing cancellation workflow yet.

Do not implement SMS/email.

The configurable cancellation notice hours already exist on Business.

The actual customer-facing policy can be wired into Phase 4/5.

# ================================================== 12. DOMAIN ERROR MODEL

Use a structured domain/application error model.

Do not throw arbitrary strings.

Examples:

- BUSINESS_NOT_FOUND
- SERVICE_NOT_FOUND
- SERVICE_INACTIVE
- STAFF_NOT_FOUND
- STAFF_INACTIVE
- STAFF_NOT_ELIGIBLE
- INVALID_TIME
- OUTSIDE_WORKING_HOURS
- SLOT_UNAVAILABLE
- CALENDAR_BLOCKED
- INVALID_APPOINTMENT
- APPOINTMENT_NOT_FOUND
- APPOINTMENT_ALREADY_CANCELLED
- INVALID_SOURCE
- VALIDATION_ERROR

HTTP mapping belongs ONLY in Nitro adapters.

The application/domain layer should remain framework-independent.

# ================================================== 13. FILE / MODULE STRUCTURE

Use the existing project conventions, but move toward this structure:

server/
├── application/
│ └── scheduling/
│ ├── check-availability.ts
│ ├── reserve-appointment.ts
│ ├── cancel-appointment.ts
│ ├── pick-barber.ts
│ └── types.ts
│
├── domain/
│ └── scheduling/
│ ├── availability.ts
│ ├── hours.ts
│ ├── time.ts
│ ├── errors.ts
│ └── ...
│
├── api/
│ └── ...
│
└── db/
├── schema.ts
└── ...

Exact filenames may differ if the existing project conventions justify it, but keep responsibilities separated.

IMPORTANT:

Do not create a giant scheduling service file.

Do not put SQL-heavy business logic directly inside Nitro route handlers.

# ================================================== 14. API ADAPTER

If API endpoints are implemented in this phase, keep them thin.

For example:

POST /api/appointments
GET /api/availability
POST /api/appointments/:id/cancel

The handlers should only:

- parse HTTP input
- authenticate if required for staff routes
- call application use case
- map domain errors to HTTP responses
- serialize output

They must NOT contain the scheduling algorithm.

No scheduling business rules should live inside H3 handlers.

# ================================================== 15. DATABASE INTEGRITY

Do not rely only on TypeScript validation.

Where practical, enforce important invariants in PostgreSQL:

- end > start
- valid status/source values
- valid appointment ranges
- valid calendar block ranges
- cross-business references
- overlap protection
- required relationships

Use appropriate indexes for:

- business + start_at
- staff + start_at
- business + status + start_at
- calendar blocks
- GiST range/exclusion operations

Do not add indexes blindly.

Each index should support a real query or constraint.

# ================================================== 16. TEST STRATEGY

This phase must have substantially stronger tests than Phase 1.

---

## 16.1 Unit tests

Test pure scheduling logic:

- 10-minute slot generation
- duration fitting
- working-hour intersection
- closed day
- staff-specific hours
- service eligibility
- multiple services
- service duration summation
- snapshot creation
- Any Barber deterministic ordering
- half-open interval behavior
- timezone conversion
- DST spring-forward
- DST fall-back
- domain errors

---

## 16.2 PostgreSQL integration tests

Use a real PostgreSQL database.

Do NOT fake PostgreSQL overlap behavior with mocks.

Test:

1. create appointment successfully
2. appointment service snapshots are correct
3. inactive service rejected
4. inactive barber rejected
5. ineligible barber rejected
6. outside working hours rejected
7. closed day rejected
8. existing appointment blocks availability
9. cancelled appointment does NOT block availability
10. no_show appointment does NOT block availability
11. completed appointment blocks availability
12. staff calendar block blocks availability
13. shop-wide block blocks availability
14. multiple services calculate total duration correctly
15. appointment + AppointmentService rollback is atomic
16. overlapping appointment is rejected by DB
17. adjacent appointments are allowed
18. same-barber concurrent reservation — only one succeeds
19. Any Barber concurrent reservation — requests resolve to different valid barbers when possible
20. Any Barber retry after a concurrency conflict
21. cross-business staff/service relationships are rejected
22. cancelled appointment becomes available again

Tests must verify actual database constraints, not merely application behavior.

---

## 16.3 Test infrastructure

If the project currently has no reliable PostgreSQL test environment:

- add a minimal Docker Compose PostgreSQL test service OR
- document the exact DATABASE_URL required for integration tests

Prefer Docker Compose if it fits the existing project.

Do not introduce a large test infrastructure framework.

Unit tests may run without PostgreSQL.

Integration tests must be clearly marked and must NOT be falsely reported as passed when no database exists.

# ================================================== 17. MIGRATIONS

Create the Drizzle migration(s) for:

- Appointment
- AppointmentService
- CalendarBlock
- required extensions
- indexes
- constraints
- exclusion constraints

Review the generated SQL.

Do not blindly trust generated migrations.

Pay special attention to:

- btree_gist
- tstzrange
- generated columns
- partial exclusion constraints
- composite foreign keys
- cascade/restrict behavior

Ensure migrations are deterministic and safe.

# ================================================== 18. PHASE 1 COMPATIBILITY

Do not break:

- existing Dashboard
- Services CRUD
- Team CRUD
- Working Hours
- Business settings
- Staff authentication
- existing Phase 1 tests

Do not rewrite unrelated code.

If an existing schema choice must change for Scheduling Core, document why and add a migration.

# ================================================== 19. SECURITY

Do not trust businessId supplied by an authenticated staff client.

For staff endpoints:

businessId must come from the authenticated staff user's session/context.

Do not allow one business to access another business's appointments.

Do not expose password hashes/session tokens.

Do not log guest PII unnecessarily.

Do not log raw database errors containing sensitive information.

# ================================================== 20. DOCUMENTATION

Update architecture documentation with the final implemented structure.

Document:

- Nitro as adapter
- application layer
- domain layer
- appointment model
- AppointmentService snapshots
- CalendarBlock
- Any Barber
- availability algorithm
- concurrency strategy
- PostgreSQL overlap protection
- timezone handling
- error model
- test strategy

Clearly distinguish:

Business-configurable values:

- working hours
- service duration
- service price
- cancellation notice
- deposit percentage

Technical invariants:

- no overlapping appointments
- appointment range validity
- service snapshots
- cross-business integrity
- Any Barber resolution
- 10-minute slot grid for now

# ================================================== 21. IMPLEMENTATION DISCIPLINE

Before changing code:

1. Inspect the current Phase 1 schema and application structure.
2. Confirm the existing migration state.
3. Confirm the existing Drizzle setup.
4. Confirm the existing test setup.
5. Do not duplicate existing helpers.
6. Reuse existing validation/domain conventions where appropriate.

Then implement incrementally.

After implementation:

Run:

- lint
- unit tests
- PostgreSQL integration tests
- type-check
- production build

Do not claim integration tests passed if PostgreSQL was unavailable.

# ================================================== 22. DEFINITION OF DONE

Phase 2B is DONE only when:

[ ] Appointment schema implemented
[ ] AppointmentService schema implemented
[ ] CalendarBlock schema implemented
[ ] PostgreSQL overlap protection implemented
[ ] Cross-business integrity protected
[ ] Service snapshots implemented
[ ] checkAvailability() implemented
[ ] reserveAppointment() implemented
[ ] cancelAppointment() implemented
[ ] Any Barber implemented correctly
[ ] Multiple services supported
[ ] Working hours respected
[ ] Staff hours respected
[ ] Shop-wide blocks respected
[ ] Staff-specific blocks respected
[ ] Timezone-aware scheduling implemented
[ ] DST behavior tested
[ ] Concurrency protection implemented
[ ] No scheduling logic in Nitro handlers
[ ] Application layer has no H3/Nitro dependency
[ ] Atomic appointment + service insertion
[ ] Domain error model implemented
[ ] Unit tests implemented
[ ] Real PostgreSQL integration tests implemented
[ ] Existing Phase 1 functionality remains intact
[ ] Lint passes
[ ] Type-check passes
[ ] Tests pass
[ ] Production build passes
[ ] Documentation updated

# ================================================== 23. STOP CONDITION

When Phase 2B is complete:

STOP.

Do NOT continue automatically to Phase 3.

Do NOT build Calendar UI.

Do NOT build Public Booking.

Do NOT build Notifications.

Do NOT build Customer OTP.

Return a concise implementation report containing:

1. What was implemented
2. Final schema/migration changes
3. Application/domain architecture
4. Availability algorithm
5. Reservation/concurrency strategy
6. Any Barber behavior
7. Timezone/DST behavior
8. Tests added
9. Exact verification commands/results
10. Any tests skipped and WHY
11. Any unresolved concerns
12. Confirmation that Phase 3 was NOT started

Then wait for my review and approval.
