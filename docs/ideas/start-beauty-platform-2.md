# Crypto Barber Shop — Final Architecture & Implementation Plan

We have now reviewed the initial architecture proposal and clarified the remaining business rules with the business owner.

This document is the current source of truth for the architecture and implementation direction.

You should NOT restart the architecture discussion from scratch unless you discover a serious technical contradiction.

You should use this document together with your previous architecture analysis and the existing AdaptiveAuth repository.

---

# 1. Current Repository Situation

We are currently inside an existing repository:

AdaptiveAuth/

The repository currently contains applications, services, and shared packages.

I have NOT created a separate Git repository for Crypto Barber Shop yet.

Therefore:

## DO NOT create a new Git repository.

## DO NOT initialize Git inside the new project.

For now, create the project inside the existing repository under:

AdaptiveAuth/
└── apps/
└── barbershop/

This location is intentional because the current pnpm workspace already includes `apps/*`.

The project should therefore be a proper workspace application.

The eventual goal is to move/extract this application into its own Git repository once I create one.

Do not make the application runtime-dependent on the AdaptiveAuth project simply because they currently live in the same repository.

Use AdaptiveAuth as:

- architectural reference
- TypeScript reference
- code organization reference
- security reference
- validation reference
- session/authentication pattern reference

Reuse patterns where appropriate, but do NOT blindly copy its architecture.

---

# 2. Product

The application is for a real business:

## Crypto Barber Shop

The current website is a WordPress website.

We are rebuilding the website and operational booking system using:

- Nuxt 4
- Vue
- TypeScript
- PostgreSQL

This is intended to become a real production-oriented application.

It is NOT a throwaway demo.

However, we are intentionally starting with ONE business.

---

# 3. Long-Term Vision

The long-term product may evolve into a SaaS platform for independent barber shops and salons.

The model is NOT:

"One marketplace containing hundreds of salons."

Instead:

Each business can eventually have its own branded website and domain.

For example:

cryptobarbershop.com
anotherbarbershop.com
another-salon.com

Conceptually:

Domain
↓
Business / Tenant
↓
Branded Website
↓
Booking
↓
Calendar
↓
Staff
↓
Customers

But:

## DO NOT IMPLEMENT MULTI-TENANCY NOW.

Do not implement:

- tenant onboarding
- custom domain automation
- DNS management
- domain purchasing
- SaaS billing
- subscriptions
- marketplace
- multi-business administration

We only want the architecture to evolve cleanly toward this future.

Where inexpensive and appropriate, use business ownership boundaries such as:

`business_id`

from the beginning.

---

# 4. Most Important Product Principle

The public website is important.

But the operational heart of this product is:

# Calendar + Appointment Engine

The system should be thought of as:

Customer Channels
├── Website
├── Phone
└── Walk-in
↓
Appointment Engine
↓
Smart Calendar
↓
Staff / Barber Resources

The Calendar is the operational source of truth for scheduled work.

Do not treat the Calendar as a simple CRUD screen.

It should eventually become the primary daily workspace for staff.

---

# 5. Current Business Information

The business currently has approximately:

- 5 barbers
- working hours: 08:00–19:00

IMPORTANT:

## NEVER hard-code the system around 5 barbers.

Five is only the current number.

The business may later have:

- 3 barbers
- 5 barbers
- 7 barbers
- 10 barbers
- etc.

The application must dynamically support:

- adding a barber
- editing a barber
- activating/deactivating a barber
- removing/retiring a barber
- assigning services
- managing availability

The Calendar must dynamically render the active staff resources.

---

# 6. Business Configuration Must Be Configurable

A very important product principle is:

## Business rules that are expected to change should be configurable from the dashboard whenever reasonably practical.

Do not hard-code frequently changing business policies throughout the application.

Examples include:

- working hours
- services
- service duration
- service price
- barber/service relationships
- cancellation policy
- notification settings
- deposit percentage
- potentially other operational settings

However:

## Do NOT make every technical invariant configurable.

For example, these remain system/domain invariants:

- confirmed appointments cannot overlap for the same barber
- an appointment must have a valid time range
- an inactive barber cannot receive new appointments
- a service must have a valid duration

The goal is:

Business-configurable where appropriate

- System-enforced where necessary

  ***

# 7. Working Hours

Current business rule:

08:00 → 19:00

This should be treated as the current business configuration.

However, the Dashboard must allow the business owner/authorized staff to change working hours.

Do not hard-code:

08:00
19:00
throughout the codebase.

Model working hours properly.

The architecture should also allow future staff-specific availability.

For example:

Business:
08:00–19:00

Barber A:
08:00–16:00

Barber B:
10:00–19:00

The system should eventually be able to combine:

business hours
staff hours
days off
exceptions
calendar blocks
appointments

to determine availability.

---

# 8. Services

Services must NOT be hard-coded as immutable application constants.

The business should be able to manage them through a nice Dashboard form.

A Service should support at least:

- name
- description
- duration
- price
- active/inactive
- barber eligibility

The exact initial service list, price and duration should come from the actual business data.

## Do NOT invent business information.

Typical services currently take approximately:

- 40–60 minutes.

But the data model must support different durations.

Examples:

- Haircut → 40 minutes
- Beard → 20 minutes
- Hair + Beard → 60 minutes
- Special Service → 75 minutes

These are examples only.

The actual business data should come from the business.

---

# 9. Barber ↔ Service Relationship

## Do NOT assume every barber can perform every service.

Currently, most barbers offer the same core services, but some may have additional expertise.

Therefore model this relationship explicitly.

For example:

```
StaffMember
↕
StaffService
↕
Service
```

This allows:

- Barber A → Haircut, Beard
- Barber B → Haircut, Beard, Special Style
- Barber C → Haircut

This relationship must be considered by the availability engine.

---

# 10. "Any Barber"

Customers must be able to select:

## Any Barber

Example:

- Service: Haircut
- Barber: Any Barber
- Date: Saturday
- Time: 10:00

The availability engine should find eligible barbers who can perform the service during the requested time range.

If multiple barbers are available, the system can use a deterministic assignment strategy.

The important rule:

**"Any Barber" is a booking preference, not the final appointment resource.**

Before the appointment is confirmed, it must be assigned to an actual barber.

For example:

Booking request:

- `barberPreference = ANY`

Final appointment:

- `staffId = barber_123`

The selected barber must still be revalidated during the final reservation transaction.

---

# 11. Online Booking

Online booking is:

## AUTO-CONFIRMED

There is no manual approval step.

Normal flow:

```
Customer
↓
Service
↓
Barber / Any Barber
↓
Date
↓
Available Time
↓
Customer Information
↓
Confirm
↓
Appointment immediately CONFIRMED
```

## Do NOT implement:

`PENDING → wait for barber approval`

for normal online booking.

---

# 12. Double Booking Prevention

This is a critical requirement.

The frontend availability check is NOT enough.

Example:

Customer A sees:

- 10:00 available

Customer B sees:

- 10:00 available

Both submit almost simultaneously.

Only one must successfully reserve the same barber/time resource.

The final booking operation must be concurrency-safe.

PostgreSQL must be used as the source of truth.

Investigate and implement a robust combination of:

- transactions
- appropriate locking
- time ranges
- exclusion constraints
- indexes
- application-level validation

A strong candidate is:

`tstzrange`

with half-open intervals:

`[start, end)`

and PostgreSQL exclusion constraints for confirmed appointments.

For example, conceptually:

```sql
EXCLUDE USING gist (
    staff_member_id WITH =,
    during WITH &&
)
WHERE (status = 'confirmed')
```

Do not copy this blindly.

Validate the final schema and migration strategy.

---

# 13. One Core Reservation Operation

All real appointment creation paths should eventually converge on one domain-level operation.

Conceptually:

`reserveAppointment()`

Possible callers:

```
Online Booking
↓
reserveAppointment()

Phone Booking
↓
reserveAppointment()

Staff-created Appointment
↓
reserveAppointment()

Scheduled Walk-in
↓
reserveAppointment()
```

The exact implementation is up to you.

But there should NOT be several independent booking implementations with duplicated overlap logic.

The final operation must:

- validate the service
- validate staff eligibility
- resolve Any Barber if necessary
- validate working hours
- validate staff availability
- validate calendar blocks
- re-check conflicts
- create the appointment atomically
- create notification/outbox records where needed
- commit

The database remains the final authority.

---

# 14. Walk-in Customers

Walk-ins should remain simple.

## Do NOT over-engineer this.

There are several real-world situations.

## Situation A — Barber currently has an appointment

Example:

- 10:00–10:40
- Barber A has an existing appointment.

A walk-in customer arrives.

The walk-in customer can wait in the waiting area until the barber becomes available.

There is no need to artificially create a booking conflict.

## Situation B — Barber is currently free

A walk-in customer arrives and a barber has an empty slot.

The barber can decide:

- serve the customer immediately
- create a Walk-in appointment with customer information
- create a short calendar entry
- simply handle the customer without creating a formal record

The system should support staff discretion.

## Do NOT force every walk-in into a complex workflow.

## Situation C — Walk-in affects future schedule

If the walk-in takes enough time that it affects the schedule, staff should be able to create a Calendar appointment.

For example:

- `WALK_IN`
- 10:20–11:00
- Barber B
- Customer: John

This then participates in conflict prevention.

---

# 15. Busy Block

A lightweight:

**Busy Block**

or:

**CalendarBlock**

is useful.

It can represent short periods where a barber is occupied without requiring a full customer appointment.

For example:

- Barber A
- 10:00–10:15
- `BUSY`

This may be useful for quick walk-ins or other operational situations.

However:

## Busy Block must NOT be mandatory for every walk-in.

It is a tool available to staff.

Do not assume a fixed duration such as 15 minutes unless the business confirms that rule.

Staff should be able to choose an appropriate duration where necessary.

---

# 16. Calendar

The Calendar should be designed as a:

## Resource Timeline

Conceptually:

```
             Barber A   Barber B   Barber C   Barber D   ...
08:00           |          |          |          |
                |          |          |          |
08:40       [Appointment]  |     [Appointment]   |
                |          |          |          |
09:20           |      [Appointment]  |          |
```

The number of columns must be dynamic.

If there are:

- 5 active barbers → 5 resources
- 7 active barbers → 7 resources
- 3 active barbers → 3 resources

Inactive staff should not appear as active booking resources.

Appointment blocks must visually represent their real duration.

---

# 17. Calendar Capabilities

The Calendar should eventually allow staff to:

- view daily schedule
- see all active barbers
- see appointment duration
- create appointments
- create walk-in appointments
- create Busy/Calendar blocks
- open appointment details
- cancel appointments
- mark appointments completed
- mark no-show
- see customer details
- see booking source
- see relevant warnings
- reschedule appointments

However:

## Do NOT implement drag-and-drop/resizing as an early requirement.

First make the underlying:

- availability
- reservation
- rescheduling
- overlap prevention

safe and reliable.

Then add advanced Calendar interactions.

---

# 18. Slot Grid

Use:

## 10-minute slot granularity

as the initial engineering decision.

This is intended to provide flexibility for services with different durations.

For example:

- 20 minutes
- 40 minutes
- 50 minutes
- 60 minutes
- 70 minutes

The slot grid is an implementation detail and should not be unnecessarily exposed as a business setting unless there is a strong reason later.

---

# 19. Guest Booking

This is a critical product requirement.

## Booking MUST work without customer login.

Normal customer flow:

```
Website
  ↓
Book Appointment
  ↓
Service
  ↓
Barber / Any Barber
  ↓
Date
  ↓
Time
  ↓
Name
  ↓
Phone
  ↓
Email (if appropriate)
  ↓
Confirm
```

No registration is required.

## Do NOT redirect customers to login merely because customer authentication exists.

---

# 20. Customer Accounts

Customer accounts are required, but **OPTIONAL**.

They are intended primarily for:

- loyal customers
- returning customers
- customers who want discounts
- customers who want offers
- appointment history
- profile information
- future loyalty/retention features

Customer accounts should enhance the experience.

They should NOT become a barrier to booking.

---

# 21. Customer OTP Authentication

Customer authentication should use:

## Passwordless OTP

Preferred flow:

```
Phone number
    ↓
Send 6-digit OTP
    ↓
Verify OTP
    ↓
Authenticated
    ↓
Optional profile completion
```

No password.

Phone number is the primary current requirement.

The architecture may allow email identity later, but do not overcomplicate the initial implementation.

Customer profile information can be completed progressively.

For example:

```
Phone
  ↓
OTP
  ↓
Authenticated
  ↓
Name / Email / Additional Profile
```

---

# 22. Customer vs Customer Account

Do not confuse:

**Customer**

with:

**Authenticated Customer Account**

A person can be a Customer because they booked an appointment, even if they never created an account.

For example:

```
Customer
    ↓
Appointment history
    ↓
Phone number
```

while authentication may be:

```
Customer
    ↓
CustomerIdentity
    ↓
OTP
    ↓
CustomerSession
```

This separation is important.

It allows:

- guest booking
- historical tracking
- later account creation
- future guest-history association

without forcing authentication.

---

# 23. Guest + Authenticated Appointment Model

Both booking modes must converge on the same Appointment domain.

Guest:

- `customerId` = nullable or resolved customer
- contact snapshot = captured

Authenticated:

- `customerId` = authenticated customer

Design the schema so that historical guest appointments can potentially be associated with a customer account later.

Do not build sophisticated identity matching now.

Just avoid making it impossible.

---

# 24. Customer Attendance / Reliability

The business wants to track customer behavior.

Important outcomes include:

- completed / attended
- cancelled
- late cancellation
- no-show

The system should retain appointment outcome history.

This will later allow the business to identify:

- reliable customers
- loyal customers
- no-show customers
- customers with repeated late cancellations

## Do NOT build a complicated AI reputation score.

Start with explicit business data.

---

# 25. Deposit Rule

Business rule:

Customers with problematic attendance/no-show behavior may be required to pay:

## 20% deposit

The system should support a rule such as:

- `requiresDeposit = true`
- `depositPercentage = 20`

The exact rule that determines when `requiresDeposit` becomes true should be configurable or clearly isolated.

## Do NOT hard-code this logic in multiple places.

---

# 26. Important Payment Behavior

If a deposit is required but:

**No payment provider is configured yet**

the customer should still be allowed to book.

## Do NOT block booking simply because payment infrastructure has not been configured.

For example:

- `requiresDeposit = true`
- `paymentProviderConfigured = false`

may result in:

- Appointment = `CONFIRMED`
- Deposit = `DUE` / `NOT_CONFIGURED`

The exact status model should be proposed.

The system should make it easy to introduce a real payment provider later.

## Do NOT implement a full payment infrastructure until an actual provider is selected.

---

# 27. Cancellation Policy

Current business rule from the owner:

**Cancellation by the previous day**

No issue.

**Cancellation within 4 hours**

The customer should contact the shop and explain the reason.

This is currently handled manually through SMS/reminders.

The new system should improve this workflow.

IMPORTANT:

## Do NOT hard-code 4 hours throughout the codebase.

The Dashboard should allow authorized staff to configure:

- cancellation notice period
- late cancellation behavior
- customer instructions
- contact information
- potentially future policy extensions

For example:

```
Cancellation Policy
    noticeHours
    lateCancellationBehavior
    contactInstructions
```

The current initial value should reflect the owner's rule:

`noticeHours = 4`

unless the business later changes it.

---

# 28. Notifications

The system requires:

- SMS

and

- Email

Notifications should support at least:

- booking confirmation
- appointment reminder
- cancellation-related messages
- appointment changes
- potentially deposit-related messages

Use a provider abstraction.

Conceptually:

```
NotificationService
    ├── EmailProvider
    └── SmsProvider
```

Do not tightly couple the domain logic to one provider.

---

# 29. Notification Outbox

Appointment transactions should NOT directly depend on external SMS/email providers.

Prefer:

```
BEGIN
    create appointment
    create notification outbox records
COMMIT

        ↓

background processing

        ↓

send SMS / Email
```

If an external provider is unavailable, the appointment itself should not fail simply because a notification provider timed out.

The exact job-processing infrastructure can be introduced at the appropriate phase.

---

# 30. Staff Authentication

Separate:

**StaffMember**

from:

**StaffUser**

A `StaffMember` represents a barber/resource in the business.

A `StaffUser` represents someone who can authenticate into the Dashboard.

Not every `StaffMember` must necessarily have a login account.

For example:

```
StaffMember
    John
```

could exist without:

`StaffUser`

The owner/manager may have a `StaffUser` account and manage multiple staff members.

Do not couple the Calendar resource model directly to authentication.

---

# 31. Database

Use:

## PostgreSQL

Do not use MongoDB for this project unless a strong technical reason is discovered.

The domain has strong relationships:

```
Business
↓
Staff
↓
Services
↓
Customers
↓
Appointments
↓
Payments / Deposits
↓
Notifications
```

PostgreSQL is also important for:

- transactions
- constraints
- relationships
- indexing
- time-range overlap
- concurrency protection
- future multi-tenant boundaries

Use JSONB only where genuinely useful.

Do not turn relational domain data into arbitrary JSON.

---

# 32. Suggested Domain Model

This is a starting point and should be refined.

Potential entities:

## Business

- `id`
- `name`
- contact information
- location
- settings
- working hours
- cancellation policy

## StaffMember

- `id`
- `businessId`
- `name`
- `active`
- profile information

## StaffService

- `staffId`
- `serviceId`

## Service

- `id`
- `businessId`
- `name`
- `description`
- `durationMinutes`
- `price`
- `active`

## Customer

- `id`
- `businessId`
- `name`
- `phone`
- `email`
- `createdAt`
- `updatedAt`

## CustomerIdentity

Potentially:

- `customerId`
- `type`
- `value`
- `verifiedAt`

## CustomerSession

For authenticated customer sessions.

## StaffUser

For Dashboard authentication.

## StaffSession

For Dashboard authentication/session management.

## Appointment

Potential fields:

- `id`
- `businessId`
- `customerId`
- `staffId`
- `source`
- `status`
- `startAt`
- `endAt`
- `notes`
- cancellation information
- attendance/outcome information
- deposit information
- `createdAt`
- `updatedAt`

## AppointmentService

Should support storing historical snapshots where appropriate.

For example:

- `serviceId`
- `serviceNameSnapshot`
- `durationSnapshot`
- `priceSnapshot`

The reason is that changing a Service later should not rewrite historical appointment information.

## WorkingHours

Business/staff availability.

## CalendarBlock

For:

- unavailable periods
- breaks
- days off
- maintenance
- Busy periods
- quick walk-in occupancy

## Notification

- `appointmentId`
- `customerId`
- `channel`
- `type`
- `status`
- `sentAt`
- failure information

## Deposit / Payment

Keep this provider-agnostic initially.

---

# 33. Appointment Sources

Consider:

- `ONLINE`
- `PHONE`
- `WALK_IN`
- `STAFF_CREATED`

The exact enum/model can be refined.

The purpose is to know where an appointment originated.

Do not create separate appointment systems for each source.

---

# 34. Appointment Status

Potential statuses:

- `CONFIRMED`
- `COMPLETED`
- `CANCELLED`
- `NO_SHOW`

Do not use `WALK_IN` as a status if it is more correctly represented as:

`source = WALK_IN`

Likewise, blocked time should usually be a `CalendarBlock` rather than a fake appointment.

Refine this based on domain analysis.

---

# 35. Availability Engine

The availability engine must consider:

- Business working hours
- Staff working hours
- Staff active state
- Staff service eligibility
- Existing appointments
- Calendar blocks
- Service duration
- Requested barber
- Any Barber
- Current date/time
- Cancellation/rescheduling rules
- Deposit requirements where relevant

Conceptually:

```
Service
   ↓
Candidate Staff
   ↓
Working Hours
   ↓
Existing Appointments
   ↓
Calendar Blocks
   ↓
Free Ranges
   ↓
10-minute slot grid
   ↓
Available Slots
```

For Any Barber:

```
Find all eligible staff
        ↓
Find staff with the requested free range
        ↓
Return available options
        ↓
At reservation time assign one real staff member
```

The final reservation must always re-check availability.

---

# 36. Any Barber Assignment Strategy

For MVP, use a simple deterministic assignment strategy.

## Do NOT build AI or complex optimization.

A possible strategy:

- choose among eligible available barbers
- use a deterministic tie-breaker
- optionally prefer the barber with lower scheduled workload

The strategy should be isolated so it can evolve later.

Do not spread assignment logic across controllers/UI.

---

# 37. Calendar Data Model

The Calendar should derive its display from domain data.

## Do NOT make the Calendar itself the source of truth.

The source of truth should be:

- Appointment
- CalendarBlock
- WorkingHours
- Staff availability

The Calendar is a visualization and operational interface over those domain models.

---

# 38. Dashboard Configuration

The Dashboard should eventually provide clean forms for managing:

## Business

- business information
- working hours
- cancellation policy
- notification settings

## Staff / Barbers

- add barber
- edit barber
- activate/deactivate
- services
- specialties
- availability

## Services

- add service
- edit service
- duration
- price
- description
- active/inactive
- barber eligibility

These forms should be user-friendly and visually polished.

Do not expose raw database fields.

---

# 39. Public Website

The public website should preserve the business's own identity.

It must NOT feel like a marketplace.

Potential pages:

- Home
- Services
- Barbers / Team
- Gallery
- About
- Contact
- Location
- Booking

Before implementing content:

Inspect the current website/project and extract actual:

- services
- prices
- barbers
- business information
- branding
- images
- contact information
- booking behavior

## Do NOT invent production business information.

If information is missing, explicitly identify it as missing.

---

# 40. Nuxt Architecture

Use:

## Nuxt 4

with:

- SSR enabled
- TypeScript
- Nitro server/API
- clean server/domain boundaries

Do not use the existing AdaptiveAuth nuxt-app configuration blindly.

The existing application is an architectural reference, not necessarily the correct configuration for this project.

The public website should benefit from SSR/SEO.

---

# 41. Security

Inspect AdaptiveAuth and reuse appropriate security ideas.

Relevant concepts may include:

- secure sessions
- CSRF protection
- refresh/session rotation where appropriate
- RBAC
- validation
- typed errors
- correlation/request IDs
- secure cookies
- rate limiting
- OTP abuse prevention

However:

Do not force AdaptiveAuth's exact implementation into this application.

Build authentication appropriate to this product.

Customer authentication and Staff authentication should remain separate security boundaries.

---

# 42. Business Configuration vs System Invariants

Use this principle throughout the project.

## Business-configurable

Examples:

- working hours
- services
- prices
- service duration
- barber/service relationships
- cancellation notice period
- cancellation behavior
- deposit percentage
- notification preferences

## System invariant

Examples:

- confirmed appointments cannot overlap for the same barber
- invalid time ranges are rejected
- inactive barber cannot receive a new appointment
- appointment must reference valid business data
- database integrity constraints cannot be disabled from the Dashboard

Do not turn technical safety constraints into business settings.

---

# 43. Implementation MUST Be Phase-Based

## Do NOT implement the entire application in one giant change.

Work in explicit phases.

Each phase must have:

- Scope
- Architecture decisions
- Implementation
- Tests
- Verification
- Definition of Done
- Short summary of what changed
- Any unresolved questions

Do not move to the next phase until the current phase is stable.

If you discover a major architecture problem during a phase:

## STOP.

Explain it before making a large redesign.

---

# 44. Phase 0 — Foundation

## Goal

Create the application foundation.

## Tasks

- create `apps/barbershop`
- configure Nuxt 4
- SSR
- TypeScript
- workspace integration
- environment configuration
- PostgreSQL connection
- Drizzle ORM/schema foundation if confirmed appropriate
- migration setup
- basic project structure
- testing foundation
- lint/typecheck/build integration
- basic documentation

## Do NOT build the entire product.

## Definition of Done

- application runs
- database connection works
- migration workflow works
- typecheck works
- lint works
- test runner works
- production build works
- project boundaries are clean

---

# 45. Phase 1 — Business Configuration

## Goal

Create the domain foundation required for the business.

## Implement

- Business
- StaffMember
- StaffUser foundation where appropriate
- Service
- StaffService
- WorkingHours
- basic Business Settings

## Dashboard capabilities

- manage barbers
- activate/deactivate barbers
- manage services
- manage service durations
- manage service prices
- assign services to barbers
- configure business working hours

## Do NOT build the complete Calendar yet.

## Definition of Done

A business administrator can configure the core business data through the Dashboard.

---

# 46. Phase 2 — Scheduling Core

This is one of the most important phases.

## Implement

- Appointment
- AppointmentService
- CalendarBlock
- appointment source
- appointment statuses
- availability engine
- reservation engine
- PostgreSQL overlap protection
- concurrency-safe booking

Implement and test:

`reserveAppointment()`

This phase should prove that:

- a valid appointment can be created
- invalid appointments are rejected
- conflicts are rejected
- Any Barber resolves correctly
- service eligibility works
- working hours work
- CalendarBlock works
- simultaneous booking attempts cannot double-book a barber

This phase must include automated tests.

---

# 47. Phase 3 — Staff Calendar

Build the operational Calendar.

Initial target:

## Daily Resource Timeline

## Features

- dynamic barber columns
- time axis
- appointment blocks
- duration visualization
- source indicator
- status indicator
- customer information
- create appointment
- create Walk-in appointment
- create CalendarBlock / Busy Block
- cancel
- complete
- mark no-show

Do not prioritize:

- drag & drop
- complex week views
- advanced analytics

until the core daily calendar is stable.

---

# 48. Phase 4 — Public Guest Booking

## Implement

```
Service
  ↓
Barber / Any Barber
  ↓
Date
  ↓
Available Time
  ↓
Customer Information
  ↓
Confirm
```

No login required.

Online booking must be:

**Auto-confirmed.**

The booking endpoint must call the real reservation engine and perform final availability validation.

Do not trust the slot list shown in the browser.

---

# 49. Phase 5 — Notifications

## Implement

- Notification model
- outbox
- Email abstraction
- SMS abstraction
- booking confirmation
- reminder foundation
- retry/failure handling

If provider credentials are not yet configured:

Do not break booking.

The system should be able to operate with notification providers disabled or mocked appropriately.

---

# 50. Phase 6 — Customer Accounts / OTP

Now implement:

- Customer identity
- OTP generation
- OTP verification
- customer sessions
- rate limiting
- account/profile
- progressive profile completion
- appointment history

Remember:

Guest Booking remains fully supported.

Customer login is optional.

## Do NOT turn booking into an authenticated-only workflow.

---

# 51. Phase 7 — Reliability / Deposit

## Implement

- appointment outcomes
- completed
- no-show
- cancellation timing
- late cancellation
- customer reliability data
- `requiresDeposit`
- configurable deposit percentage
- deposit status

If payment provider is not configured:

Customer must still be allowed to book.

Represent the deposit as pending/due/not-configured as appropriate.

---

# 52. Phase 8 — Public Website Polish

Build/refine:

- Home
- Services
- Team
- Gallery
- About
- Contact
- Location
- Booking

Focus on:

- real business content
- responsive UX
- accessibility
- SEO
- performance
- visual quality
- clear booking CTA

The website should feel like the actual Crypto Barber Shop brand.

It should NOT feel like a generic SaaS demo.

---

# 53. Future Phases — DO NOT IMPLEMENT NOW

Potential future work:

- multi-tenancy
- custom domains
- tenant onboarding
- subscriptions
- billing
- payment provider
- advanced loyalty
- customer segmentation
- retention intelligence
- advanced CRM
- analytics
- AI features
- mobile application
- advanced calendar interactions
- sophisticated staff scheduling

Keep the architecture capable of evolving toward these features, but do not build them prematurely.

---

# 54. Testing Strategy

Testing is especially important for the booking domain.

At minimum, test:

## Availability

- staff available
- staff unavailable
- outside working hours
- service not supported by barber
- existing appointment
- CalendarBlock
- Any Barber

## Reservation

- successful reservation
- conflicting reservation
- simultaneous reservation
- inactive staff
- invalid service
- invalid time range

## Cancellation

- allowed cancellation
- late cancellation
- policy changes

## Walk-in

- scheduled walk-in
- Busy Block
- conflict handling

## Customer

- guest booking
- OTP
- invalid OTP
- expired OTP
- customer history

The concurrency tests are particularly important.

---

# 55. Architecture Quality Rules

## Avoid

- premature abstractions
- unnecessary dependencies
- duplicated booking logic
- hard-coded business rules
- direct database manipulation from random UI code
- business logic buried in Vue components
- tightly coupled notification providers
- unnecessary microservices
- unnecessary Redis
- unnecessary queues before they are needed

## Prefer

- clear domain boundaries
- explicit services/use cases
- strong database constraints
- typed APIs
- reusable validation
- testable business logic
- simple infrastructure
- understandable code

---

# 56. Important: Do Not Over-Engineer

This is a real business application, but it is also the first version.

We want:

```
Production-quality core
+
Simple architecture
+
Clear boundaries
+
Future extensibility
```

We do NOT want:

```
Huge SaaS architecture
+
Multiple services
+
Multiple infrastructure systems
+
Complex abstractions
```

before the barber shop can actually use the system.

---

# 57. Initial Development Rule

Before each Phase:

- Explain what you are going to build.
- Show the relevant architecture.
- Identify important decisions.
- Identify assumptions.
- Implement only that Phase.
- Run tests/typecheck/lint/build where applicable.
- Report the result.
- Wait for approval before moving to the next major Phase.

Do not silently proceed through all phases.

---

# 58. Current Phase to Start With

Start with:

## PHASE 0 — FOUNDATION

But before making substantial code changes:

- Inspect the current AdaptiveAuth repository.
- Inspect:
  - `package.json`
  - `pnpm-workspace.yaml`
  - `tsconfig`
  - existing Nuxt app
  - shared packages
  - relevant auth/security code
- Confirm the proposed `apps/barbershop` location.
- Inspect the current Crypto Barber Shop website/project if available.
- Identify reusable conventions.
- Produce a concise Phase 0 implementation plan.
- Then implement Phase 0.

## Do NOT start Phase 1 until Phase 0 is complete and verified.

---

# 59. Final Source of Truth

The most important business and architecture decisions are:

- Nuxt 4
- SSR
- PostgreSQL
- project temporarily lives at `apps/barbershop`
- no new Git repository yet
- one real business initially
- future SaaS evolution
- `business_id` where appropriate
- dynamic number of barbers
- configurable business hours
- configurable services
- configurable service duration
- configurable prices
- configurable cancellation policy
- currently 08:00–19:00
- currently cancellation within 4 hours requires contacting the shop
- online bookings are auto-confirmed
- Guest Booking requires no login
- customer accounts are optional
- customer accounts use passwordless OTP
- Any Barber is supported
- final appointments always have a real assigned barber
- walk-ins remain operationally flexible
- Busy Blocks are available but not mandatory
- 10-minute slot grid
- Calendar is a Resource Timeline
- Calendar is the operational heart of the product
- appointment overlap must be prevented at the database level
- `reserveAppointment()` should be the central reservation operation
- SMS and Email are both required notification channels
- notification sending should be decoupled from appointment transactions
- no-show/late cancellation tracking is required
- problematic customers may require a 20% deposit
- missing payment provider must NOT prevent booking
- `StaffMember` and `StaffUser` are separate concepts
- AdaptiveAuth is a reference, not a runtime dependency
- implementation must be Phase-based
- no premature multi-tenancy or SaaS infrastructure

If you believe any of these decisions creates a serious technical problem, explain the issue before changing the design.

Otherwise, follow these decisions and begin with Phase 0.
