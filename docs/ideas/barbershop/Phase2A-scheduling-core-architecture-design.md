# Phase 2A — Scheduling Core Architecture & Design

Phase 1 and Phase 1.1 are complete and reviewed.

Do NOT implement Phase 2 yet.

This phase is DESIGN ONLY.

Your job is to inspect the current `apps/barbershop` implementation and produce a concrete architecture/design for the Scheduling Core before any scheduling code is written.

Do not modify application code, schema, migrations, routes, UI, or tests in this phase unless absolutely necessary for a tiny documentation-only change.

At the end, STOP and wait for my explicit approval.

---

# Product Context

The Barbershop application is intended for a real barber shop.

Current business facts:

- 5 barbers currently exist, but the system must NOT hard-code the number 5.
- Barbers can be added, removed, activated, or deactivated.
- Barbers generally offer the same base services.
- Some barbers can have additional specialties/services.
- Current typical business hours are approximately 08:00–19:00.
- Working hours are configurable from the dashboard.
- Customers can choose a specific barber or "Any Barber".
- Online bookings are automatically confirmed. There is no staff approval step.
- Walk-ins are allowed.
- Walk-ins may be short/simple services and do not always need a calendar entry.
- If a walk-in affects the schedule, staff should be able to enter it into the calendar.
- Staff may also create appointments manually.
- Busy Blocks may be used for time that should not be bookable.
- Busy Block duration must NOT be hard-coded to 15 minutes. Staff controls the duration.
- Customer login is NOT required for booking.
- Customer accounts/OTP belong to a later phase.
- SMS and email notifications belong to a later phase.
- Deposits/no-show rules belong to a later phase.
- The initial booking slot interval is 10 minutes.
- Business timezone is currently `America/Vancouver`.
- Scheduling must work with local wall-clock times and the business timezone.

The scheduling engine must support future growth without implementing multi-tenancy yet.

---

# Existing Architecture

Current architecture:

Browser
→ Nuxt/Nitro HTTP layer
→ Application / Use Cases
→ Domain
→ PostgreSQL

Important rule:

Nitro/H3 is the HTTP adapter.

Scheduling business logic must NOT depend on:

- H3Event
- Nitro request/response APIs
- Nuxt runtime APIs
- `createError`
- route handlers

The core scheduling functions should be plain TypeScript.

Examples:

```ts
reserveAppointment(input)
checkAvailability(input)
```

They should be usable without an HTTP request.

Do not introduce Express, Fastify, NestJS, Redis, queues, microservices, or other infrastructure.

Phase 2 Scope

Design the following:

Appointment
AppointmentService
CalendarBlock
Availability engine
Reservation engine
Appointment source/status
Barber selection / Any Barber
Working hours integration
Service eligibility integration
PostgreSQL concurrency protection
Transaction boundaries
Validation and domain invariants
Test strategy

Do NOT implement them yet.

1. Appointment Model

Design the appointment entity.

Consider fields such as:

id
business_id
staff_member_id
customer information/reference
start time
end time
status
source
timestamps

Decide precisely:

which fields are required
which are nullable
which values are enums
which values should be database enums vs text/check constraints
whether customer identity should be represented by a customer_id now or temporarily as booking contact fields

Remember:

Guest booking exists before customer accounts.

Do not prematurely implement the Customer/OTP system.

The appointment model must be able to support a guest customer today and a linked customer account later.

2. AppointmentService

Design appointment_service.

IMPORTANT:

Service data can change later.

For example:

A service may change from:

Haircut — 40 minutes — $40

to:

Haircut — 45 minutes — $45

Existing appointments must NOT suddenly change their historical duration or price.

Therefore determine the correct snapshot fields.

At minimum evaluate:

service_id
service_name_snapshot
duration_minutes_snapshot
price_cents_snapshot
ordering

Explain why each field exists.

Also decide how appointment start/end time should relate to the service snapshot.

3. CalendarBlock

Design a separate calendar_block entity.

Examples:

barber break
maintenance
personal time
manually blocked period
shop closed exception
temporary unavailable time

Do NOT represent blocks as fake appointments.

Determine:

fields
whether block belongs to a barber or the whole business
start/end
reason/title
active/cancelled state if needed

The design must support both:

barber-specific blocks
business-wide blocks

without making the model unnecessarily complex.

4. Appointment Source

Design the appointment source.

Current expected values:

ONLINE
PHONE
WALK_IN
STAFF_CREATED

Explain why source is different from status.

Walk-in is a source, not a status.

5. Appointment Status

Design the appointment status.

Expected lifecycle includes:

CONFIRMED
COMPLETED
CANCELLED
NO_SHOW

Determine whether other statuses are genuinely needed now.

Do NOT add statuses just because they may be useful someday.

Online booking is auto-confirmed.

There is no:

PENDING_APPROVAL

state.

6. Availability Engine

Design:

checkAvailability(input)

It should conceptually perform:

Service
→ eligible barbers
→ working hours
→ existing appointments
→ calendar blocks
→ free intervals
→ 10-minute booking slots

Define the input and output.

Example conceptual input:

{
businessId,
serviceId,
date,
barberId?: string
}

But determine the final shape yourself.

The engine must support:

Specific barber

Customer selects:

Moe

Only Moe's availability is returned.

Any Barber

Customer selects:

Any Barber

The engine must find valid slots across all eligible active barbers.

However:

"Any Barber" must NOT be stored as an appointment with a fake barber ID.

The final appointment must always belong to a real barber.

Explain how this resolution should work.

7. Multiple Services

Think carefully about a booking containing multiple services.

Example:

Haircut + Beard Trim

Determine:

whether Phase 2 should support multiple services immediately
how total duration is calculated
how the barber is selected
whether all services must be offered by the same barber
how availability works when multiple services are combined
how ordering is represented

Do not over-engineer service sequencing.

For the current barber-shop model, prefer a simple and understandable rule unless the existing business requirements require something more complex.

8. Slot Generation

Initial slot interval:

10 minutes

Example:

If a barber is free from:

10:00 → 11:00

and the service duration is 40 minutes:

valid starts are:

10:00
10:10
10:20

not:

10:30

because 10:30 + 40 minutes > 11:00.

Define this clearly.

Do not make the 10-minute interval configurable yet unless there is a strong architectural reason.

9. Working Hours

Integrate with the Phase 1 working-hours model.

Current model supports:

business-level hours
optional staff-level hours

Determine the precedence rule.

For example:

Does staff-specific availability override business hours?
Does it intersect with business hours?
What happens when business is closed but a barber has hours?
What happens when barber has no staff-specific hours?

We need a simple deterministic rule.

Prefer:

# Effective staff availability

business working hours
INTERSECT
staff working hours (when staff-specific hours exist)

unless you find a strong reason to choose another model.

Clearly document the decision.

Also account for:

closed days
multiple intervals per day in the future
timezone
daylight-saving transitions

Do not over-engineer multiple intervals if the current schema cannot support them, but identify whether the current Phase 1 model creates a future limitation.

10. Calendar Blocks

Availability must exclude:

appointments
barber-specific calendar blocks
business-wide calendar blocks

Explain precedence and overlap behavior.

Example:

Business block:

12:00–13:00

means all barbers are unavailable.

Barber block:

Moe 14:00–15:00

means only Moe is unavailable.

11. Reservation Engine

Design:

reserveAppointment(input)

This is the most important part of Phase 2.

The reservation engine must be the central booking path for:

online booking
phone bookings
walk-in bookings
staff-created bookings

The source changes, but the core reservation rules should remain centralized.

Define:

input
validation
availability verification
barber resolution
service snapshot creation
transaction boundaries
appointment creation
conflict handling
output
domain/application errors 12. Concurrency / Double Booking

This is a hard requirement.

Consider:

Two customers select:

Moe
10:00
Haircut (40 min)

at almost exactly the same time.

Both requests may initially see the slot as available.

The database must prevent both from successfully reserving the overlapping time.

Do NOT rely only on:

SELECT existing appointments

followed by:

INSERT appointment

because that is vulnerable to race conditions.

Design a PostgreSQL-level protection strategy.

Strongly consider PostgreSQL range/exclusion constraints or another robust database-level mechanism.

The final design must answer:

How are appointment time ranges represented?
How are overlapping appointments prevented?
Does the constraint apply only to active/confirmed appointments?
What happens with cancelled appointments?
How are calendar blocks handled?
What happens when two Any Barber reservations compete for the same barber?
What error does the application return when the database reports a conflict?

Do not choose a solution just because it is sophisticated.

Choose the simplest robust PostgreSQL-native solution.

13. Transaction Boundary

Define exactly what happens inside the reservation transaction.

For example:

BEGIN
validate business/service/barber
resolve barber if Any Barber
verify availability
insert appointment
insert appointment services
COMMIT

But do not blindly copy this example.

Determine the correct sequence.

The design must make clear where the transaction starts and ends.

14. Any Barber + Concurrency

This deserves special attention.

Suppose:

Moe: 10:00 available
Jamil: 10:00 available
Jay: 10:00 available

Two customers both select:

Any Barber
10:00
Haircut

The engine may initially choose different barbers, or both may attempt the same barber.

Design how Any Barber resolution should behave safely under concurrency.

The final appointment must always have a real staff_member_id.

15. Walk-ins

Keep walk-ins simple.

Current business behavior:

short/simple walk-ins may not need calendar entries
longer walk-ins that affect the schedule should be entered into the calendar
staff decides

Do not build a separate walk-in engine.

The architecture should allow a walk-in appointment to use:

source = WALK_IN

and the same reservation engine.

A walk-in does not need a special appointment status.

16. Busy Blocks

Busy Blocks are optional but should be supported by the scheduling model.

Do NOT hard-code:

15 minutes

Staff should control the duration.

A block is simply:

start → end

and makes that resource unavailable.

17. Validation / Domain Invariants

List all invariants that must be enforced.

Separate:

Business-configurable rules

Examples:

working hours
cancellation notice
deposit percentage
services
service prices
service duration

from:

Technical/domain invariants

Examples:

end > start
active appointment cannot overlap another active appointment for the same barber
appointment must reference an active barber
service must exist
service must be eligible for the barber
appointment service snapshot cannot be empty
business ownership must match
etc.

Technical invariants must NOT become dashboard configuration.

18. Time Model

Review the current time model before proposing the scheduling schema.

The business timezone is currently:

America/Vancouver

Working hours use local wall-clock values.

Design how appointments should store:

start
end
timezone

Consider whether PostgreSQL timestamptz should be used for actual appointment instants while working hours remain local time values.

Explain how date + local working hours become actual instants for availability.

Also consider DST.

Do not implement a complicated timezone abstraction.

19. Database Indexes

Design the indexes required for scheduling queries.

Consider:

business_id
staff_member_id
start/end
status
appointment lookups by date
calendar blocks

Do not blindly add indexes.

For each important index, explain what query it supports.

20. Application Layer Structure

Propose the concrete folder/file structure for Phase 2.

For example:

server/
application/
scheduling/
check-availability.ts
reserve-appointment.ts
types.ts

domain/
scheduling/
...

db/
schema.ts

But do not blindly copy this.

Use the existing project conventions and keep the structure simple.

The goal is:

HTTP
↓
Application Use Case
↓
Domain logic
↓
Persistence

without creating excessive abstractions.

21. Error Model

Design application/domain errors for cases such as:

service not found
service inactive
barber not found
barber inactive
barber not eligible for service
outside working hours
slot unavailable
overlapping appointment
invalid time range
business not found
business closed

Determine which errors should be domain/application errors and how Nitro routes should translate them into HTTP responses later.

Do not use H3 errors inside the use cases.

22. Testing Strategy

Design tests before implementation.

We need tests for:

Availability
service duration
working hours
closed day
barber eligibility
existing appointment
calendar block
business block
staff block
exact boundary cases
10-minute slot generation
Any Barber
multiple services
Reservation
successful reservation
invalid service
inactive barber
ineligible barber
outside working hours
conflicting appointment
Any Barber resolution
service snapshots
transaction rollback
Concurrency

This is especially important.

Design an integration test against real PostgreSQL proving:

Two concurrent reservations for the same barber/time cannot both succeed.

Also design a test for concurrent Any Barber reservations.

Unit tests alone are not sufficient for this behavior.

23. Phase 2 Database Design

Provide the proposed final schema for:

appointment
appointment_service
calendar_block

Include:

columns
types
primary keys
foreign keys
indexes
unique constraints
CHECK constraints
exclusion constraints if selected
cascade/restrict behavior

Explain every important decision.

Do NOT create the migration yet.

24. Phase 2 API Design

Propose the future Nitro endpoints, but do NOT implement them.

For example:

GET /api/availability
POST /api/appointments

Determine whether separate staff endpoints are needed now.

The API should remain thin and call application use cases.

25. Important Architectural Constraint

Do not solve future problems prematurely.

Explicitly DO NOT implement/design detailed architecture for:

customer accounts
OTP
SMS
email
deposits
payment provider
loyalty
CRM
analytics
AI
multi-tenancy
custom domains
SaaS billing

Only ensure the Scheduling Core will not make those future phases difficult.

26. Required Final Deliverable

Do not write code.

Return a design document/report containing:

A. Executive Summary

What architecture you recommend and why.

B. Domain Model

Show relationships:

Business
|
+-- StaffMember
|
+-- Service
|
+-- WorkingHours
|
+-- Appointment
| |
| +-- AppointmentService
|
+-- CalendarBlock

Adjust if needed.

C. Database Schema

Detailed proposed schema.

D. Availability Algorithm

Step-by-step pseudocode.

E. Reservation Algorithm

Step-by-step pseudocode.

F. Concurrency Strategy

Explain exactly how PostgreSQL prevents double booking.

G. Any Barber Strategy

Explain both normal and concurrent cases.

H. Timezone Strategy

Explain local time, timestamptz, business timezone, and DST.

I. Application Architecture

Show folders and dependencies.

J. Error Model

List errors and HTTP mapping.

K. Test Plan

Especially PostgreSQL integration/concurrency tests.

L. Alternatives Rejected

Mention important alternatives considered and why they were rejected.

M. Open Questions

Only list questions that genuinely require a product decision.

Do not invent unnecessary questions.

N. Phase 2 Implementation Plan

Break the eventual implementation into logical steps, for example:

schema/migration
domain rules
availability
reservation
concurrency tests
API
verification

Adjust the sequence if your design requires something different.

O. Definition of Done

Create a concrete checklist for Phase 2 implementation.

Critical Instructions
DESIGN ONLY.
Do NOT modify Phase 1 code.
Do NOT implement Appointment yet.
Do NOT create migrations yet.
Do NOT implement API routes yet.
Do NOT implement availability yet.
Do NOT implement reservation yet.
Do NOT add customer authentication.
Do NOT add SMS/email/payment infrastructure.
Do NOT introduce new infrastructure unnecessarily.
Verify the existing schema and code before making design assumptions.
Keep the design production-oriented but appropriately simple.
Pay special attention to PostgreSQL concurrency and timezone correctness.
Keep Nitro as the HTTP adapter only.
STOP after the design report and wait for my explicit approval.
