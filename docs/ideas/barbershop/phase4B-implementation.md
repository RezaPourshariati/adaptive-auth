Phase 4B — Public Mobile-First Guest Booking Implementation
Context

We are building the apps/barbershop application inside the existing AdaptiveAuth monorepo.

Phase 0, Phase 1, Phase 1.1, Phase 2A/2B, and Phase 3A/3B are complete and approved.

Phase 4A — Public Guest Booking Design — has been reviewed and approved.

Implement Phase 4B only.

Do not start Phase 5 or any later phase.

The existing scheduling architecture from Phase 2B is approved and must remain the single source of truth.

1. Phase 4B Goal

Implement the public, mobile-first, guest booking experience.

A customer must be able to:

Open /book
Select one service
Select a specific barber or Any Barber
Select a date
See available 10-minute time slots
Enter guest information
Review the booking
Confirm the booking
Receive an immediate booking confirmation

No login or customer account is required.

Online bookings are automatically confirmed.

There is no owner/staff approval step.

2. Important Architectural Rule

The existing Phase 2B scheduling engine remains authoritative.

Do not create another booking or availability engine for the public website.

Public booking must reuse:

checkAvailability(...)
reserveAppointment(...)

The public HTTP/Nitro layer is only an adapter.

Architecture must remain:

Browser
↓
Nuxt page/components
↓
Thin Nitro public HTTP adapter
↓
Application/use cases
↓
Scheduling/domain logic
↓
PostgreSQL

The scheduling/application layer must remain framework-independent.

Do not introduce H3/Nitro dependencies into the scheduling use cases.

Do not introduce Express, Fastify, NestJS, Redis, queues, or another API framework.

3. Scope

Implement only:

Public booking
/book
Public booking context/catalog
Service selection
Barber selection
Date selection
Availability
Guest information
Review
Confirmation
Conflict handling
Mobile-first responsive UI
Public API adapters
Required tests
Verification
Do NOT implement
Customer accounts
OTP
Customer sessions
Customer profiles
Customer history
Customer cancellation
Notifications
SMS
Email
Payments
Deposits
Payment provider integration
Loyalty
CRM
Analytics
Multi-tenancy
Custom domains
Billing
Redis
Queues
WebSockets
Live polling
CAPTCHA
WAF integration
Marketplace
Drag/drop calendar
Staff calendar redesign
New scheduling engine

If something appears necessary for a later phase, document it instead of implementing it.

4. Booking Flow

Use this exact conceptual flow:

Service
↓
Barber / Any Barber
↓
Date
↓
Available Time
↓
Guest Information
↓
Review
↓
Confirm
↓
Success

The implementation should use a single /book page rather than multiple public pages.

Query parameters may represent:

service
barber
date

Do NOT put guest PII into the URL.

No phone number, email, name, or notes in query parameters.

5. Service Selection

For the public booking UI:

Allow exactly ONE service per booking.

This is intentional.

The underlying Phase 2B scheduling engine must remain capable of handling multiple services because staff/internal booking may need that capability in the future.

Therefore:

Public UI:
one service

Scheduling engine:
multi-service capable

Do not simplify or redesign the underlying engine to become single-service.

Only active services belonging to the resolved business may be shown.

The following must remain server-authoritative:

service name
service duration
service price
active/inactive state
eligibility
business ownership

Never trust price or duration supplied by the browser.

6. Barber Selection

Show:

Any Barber
Active barbers who are eligible for the selected service

Use the existing deterministic barber ordering.

Do not expose inactive or ineligible barbers.

Any Barber

When the customer selects Any Barber:

do not choose a barber in the browser
do not send a fake barber ID
omit staffMemberId from the reservation request

The existing scheduling engine must resolve the real barber during reservation.

The booking review may continue to say:

Any Barber

After successful reservation, show the actual assigned barber.

Example:

Barber
Any Barber

↓

Confirmation

Barber
Moe

Do not implement a second "Any Barber" algorithm in the public UI.

7. Business Resolution

This is a single-shop application for now.

The client must never provide the business ID as an authoritative value.

Public endpoints must resolve the business on the server.

Use this rule:

Exactly one business

Continue normally.

Zero businesses

Fail closed with an unavailable/configuration response.

More than one business

Fail closed with a configuration error.

Do not use:

LIMIT 1

as the public business-selection strategy.

Do not silently select an arbitrary business.

The authenticated staff side continues using the business ID from the authenticated staff session.

8. Booking Horizon

Use a fixed public booking horizon:

21 shop-local calendar days, including today.

This is a code-level MVP constant.

Do NOT add a database setting for this.

Do NOT add a Dashboard setting for this.

Do NOT make it configurable yet.

The horizon must be calculated in the business timezone.

Dates after the 21-day horizon must not be bookable through the public UI/API.

9. Dates

Use the business timezone.

The public booking UI must:

start from the business-local current date
reject dates before today
allow today through the 21-day horizon
respect business working hours
correctly handle closed days
correctly handle timezone/DST behavior from the existing scheduling implementation

Do not implement a separate timezone system.

Reuse the existing Phase 2B time/date helpers.

10. Availability

Availability must remain server-authoritative.

The availability response must account for the existing scheduling rules, including:

business working hours
staff working hours if applicable
selected service duration
barber eligibility
existing appointments
calendar blocks
shop-wide blocks
barber-specific blocks
cancelled appointments
timezone
DST
past times
current-day availability
Any Barber behavior

Use the existing checkAvailability(...).

Do not duplicate these calculations in Vue.

11. Closed vs No Available Slots

The public availability response must distinguish:

closed

from:

open but no slots available

Use the approved closed: boolean concept.

Example:

closed = true
slots = []

means the business is closed.

Whereas:

closed = false
slots = []

means the business is open but no bookable times remain.

The UI should communicate these states differently.

12. Time Slots

Use the existing 10-minute slot grid.

Do not introduce another slot interval.

Time slots must be generated/validated by the server-side availability engine.

The browser must never decide that a time is available simply because it fits inside working hours.

13. Past Time Protection

The existing staff/internal reservation behavior must not be changed.

For public booking only:

reject dates before today
reject times that are already in the past according to the business timezone

Do not change reserveAppointment() globally just to implement this public requirement.

The public adapter should enforce the public booking rule.

Staff/internal booking behavior must remain unchanged.

14. Guest Information

Guest booking does not require authentication.

Use the existing appointment guest fields.

Required:

Name
Phone

Optional:

Email
Notes

Validation:

Name
trim whitespace
required
1–80 characters
Phone
required for online booking
non-empty after trimming
maximum 40 characters
do not introduce a phone-number library yet
Email
optional
validate if provided
Notes
optional
maximum 500 characters

Do not create a Customer table.

Do not create customer_id.

Do not create OTP.

Do not create customer sessions.

15. Reservation Request

The public browser must send only the information it is allowed to control.

Conceptually:

serviceId
staffMemberId (optional)
guestName
phone
email
notes
localDate
startLocal

The following must NOT be accepted as authoritative browser input:

businessId
source
startAt
price
duration
timezone

Specifically:

businessId

Server-controlled.

source

Server-controlled.

The public endpoint must always create:

source = online

The client must not be able to create:

walk_in
phone
staff_created

through the public endpoint.

startAt

Do not accept it from the public client.

The public API should work with:

localDate
startLocal

and let the server resolve the correct business-local time.

Price

Server-controlled from the selected DB service.

Duration

Server-controlled from the selected DB service.

Eligibility

Server-controlled.

16. Public Reservation Adapter

Reuse:

reserveAppointment(...)

Do not create:

reservePublicAppointment(...)

if that would duplicate the actual scheduling logic.

It is acceptable to create a thin application adapter/use case if needed to map public input into the existing reservation input.

The important rule is:

there must remain exactly one authoritative reservation engine.

The public adapter should force:

source = ONLINE

and resolve the business server-side.

17. Stale Availability / Concurrency

Availability can become stale.

For example:

Customer A sees 10:00 available
Customer B books 10:00
Customer A presses Confirm

The database and reservation engine remain authoritative.

If reservation fails because of a conflict:

Return HTTP:

409 Conflict

The UI must:

Tell the customer the selected time is no longer available.
Keep their guest information.
Refresh availability.
Let them choose another time.

Do not silently book another time.

For Any Barber, the reservation engine may successfully assign another eligible barber if that is how the existing Phase 2B algorithm works.

18. Review Step

Before confirmation show a concise summary:

Service
Barber
Date
Time
Duration
Price
Guest name
Phone
Email (if provided)
Notes (if provided)
Cancellation policy

Price and duration shown to the user must come from the server/catalog.

The browser must not be able to alter them.

The Confirm button is the only action that creates the appointment.

19. Cancellation Policy Display

Read cancellation policy from the existing Business configuration.

Do NOT hard-code:

4 hours

into the public UI.

The initial seeded value is 4 hours, but the dashboard can change it.

Display the configured policy and contact instructions.

Do not implement online cancellation in Phase 4B.

20. Payment / Deposit

Do NOT implement payment or deposit UI.

Even though the Business configuration contains deposit-related data for future phases, Phase 4B must not:

collect deposits
calculate payment amounts
redirect to payment
block booking because payment is unavailable
create payment records

A booking remains possible without a payment provider.

Payment/deposit behavior belongs to a later phase.

21. Confirmation

After successful reservation, show:

confirmation state
service
assigned barber
date
time
duration
price
timezone
cancellation policy
contact instructions
short booking reference

Use:

first 8 characters of appointment UUID

for the short reference.

Example:

Booking #A1B2C3D4

Do NOT expose a public appointment lookup endpoint.

Do NOT implement:

GET /api/appointments/:id

in Phase 4B.

Do not expose unnecessary PII in the confirmation response.

Do not claim that SMS/email was sent because notifications are not implemented yet.

22. Public API

Implement/tighten the public API according to the Phase 4A design.

Expected endpoints:

GET /api/booking
GET /api/availability
POST /api/appointments
GET /api/booking

Create/use the approved read-only application use case:

getPublicBookingContext(...)

It should provide the public booking page with:

business display information needed by booking
active services
active barbers
service eligibility
business timezone
working-hours information needed by the UI
booking horizon
cancellation policy/contact instructions as appropriate

Do not expose internal/private fields unnecessarily.

GET /api/availability

Input should represent:

service
date
optional barber

Resolve the business server-side.

Do not accept arbitrary business IDs.

Return the approved availability shape including:

timezone
duration
closed
slots
relevant barber information if needed

Do not expose customer PII.

POST /api/appointments

Public adapter must:

resolve the business server-side
validate input
force source = online
reject public past date/time
reject dates beyond 21-day horizon
accept only one service
verify service is active
verify barber is active and eligible when explicitly selected
use server-side service price/duration
call the existing reservation engine
map conflicts to HTTP 409
return a safe success DTO

Do not trust arbitrary client fields.

23. Public Rate Limiting

Implement the approved MVP protection:

8 booking creation attempts
per IP
per 10 minutes

This is an in-process limiter.

Do not introduce Redis.

Do not introduce a queue.

Do not implement distributed rate limiting.

Document clearly that this is MVP/in-process protection and not a distributed production-grade abuse system.

The limiter applies to public appointment creation.

24. UI Architecture

Use:

app/pages/book.vue

and booking-specific components under:

app/components/booking/

Use local booking state.

Do NOT introduce Pinia for this flow.

The booking state is page-local and should remain simple.

Possible utility files:

app/utils/booking-types.ts
app/utils/booking-state.ts

Use the exact structure only if it makes sense with the existing codebase.

Do not create abstractions just for the sake of abstraction.

25. Mobile-First UI

Mobile is the primary design target.

Baseline:

390px viewport

The booking flow must genuinely work on a phone.

Requirements:

touch-friendly controls
minimum ~44px touch targets
no hover-only actions
large service buttons/cards
large barber selection controls
horizontal date strip
easy time selection
two-column time grid is acceptable
sticky/full-width primary confirmation action where appropriate
appropriate inputmode
correct mobile input types
clear loading states
clear error states
no desktop-first shrink-to-mobile design

Then support:

tablet
desktop

Do not sacrifice the mobile UX to make desktop easier.

26. Booking State

Use a simple state machine/local state roughly equivalent to:

loading
catalog-error

service
barber
date
time
guest
review
submitting

success
conflict
error

The exact implementation is up to you.

Do not over-engineer this into a global state-management system.

27. Navigation

Use one route:

/book

Optional query parameters:

service
barber
date

Only non-sensitive selection state belongs in the URL.

Do not put:

name
phone
email
notes

into the URL.

Browser Back should behave sensibly when correcting previous choices.

Refreshing the page should not create a booking.

28. Error States

Handle at minimum:

Catalog unavailable

Show a clear temporary/unavailable message.

Business unavailable/misconfigured

Fail closed.

Closed day

Show:

Closed
Open but no availability

Show:

No times available
Selected barber no longer available

Refresh and ask the customer to choose again.

Slot conflict

HTTP 409, refresh availability, preserve guest data.

Validation error

Show field-level or step-level feedback.

Server error

Show a generic user-friendly error.

Do not expose:

stack traces
SQL errors
internal IDs unnecessarily
infrastructure details 29. Security

Public input must be validated with the existing validation approach.

Never trust:

business ID
source
price
duration
barber eligibility
availability
timezone

The server is authoritative.

The public endpoint must not become a way to create internal booking types.

Do not expose internal scheduling data or PII.

Do not add a public appointment lookup endpoint.

30. Tests

Add appropriate tests for the Phase 4B behavior.

At minimum cover:

Public booking rules
one-service public restriction
active service requirement
inactive service rejection
active eligible barber
inactive barber rejection
ineligible barber rejection
Any Barber mapping
forced source=online
client source cannot override server source
business resolution
zero-business failure
multi-business failure
21-day horizon
past date rejection
past time rejection
future date acceptance
closed-day handling
cancellation policy comes from DB configuration
server-authoritative price/duration
guest validation
optional email/notes
conflict mapping to 409
Availability

Verify the public adapter correctly uses the existing availability engine.

Do not duplicate the scheduling algorithm in tests.

Reservation

Verify successful guest reservation through the public adapter creates:

confirmed appointment
online source
correct service snapshot
correct assigned barber
correct time
Security

Verify arbitrary client-provided:

businessId
source
startAt
price
duration

cannot override server-controlled values.

Rate limiting

Verify the approved:

8 attempts / IP / 10 minutes

behavior.

Do not add Playwright in this phase.

Manual browser verification is sufficient for Phase 4B.

Record Playwright/browser automation as future technical debt if useful.

31. Database

Do not create a new Customer table.

Do not modify the Phase 2B scheduling schema unless you discover a genuine blocker.

Do not add unnecessary migrations.

If you believe a schema change is genuinely required:

STOP and report it before making the change.

Do not silently redesign Phase 2B.

32. Preserve Existing Phase 2B/3B Behavior

This is important.

Do not regress:

staff calendar
walk-ins
staff-created appointments
phone appointments
calendar blocks
appointment overlap protection
Any Barber concurrency behavior
cancellation behavior
completion/no-show behavior
business/staff working hours
timezone/DST handling

Public booking is an additional consumer of the existing scheduling system.

It is not a replacement.

33. Code Quality

Follow the existing project conventions.

Keep Nitro handlers thin.

Keep application/use-case logic framework-independent.

Do not introduce unnecessary abstractions.

Do not add dependencies unless clearly justified.

Do not refactor unrelated Phase 1–3 code.

Do not redesign the project architecture.

34. Verification

Before reporting completion, run:

lint
tests
typecheck
production build

Also run the real PostgreSQL integration suite if the Docker/PostgreSQL environment is available.

Perform a manual browser verification of the public booking flow.

At minimum verify:

Open /book
Select service
Select barber
Select date
Select time
Enter guest information
Review
Confirm
Verify successful confirmation
Verify appointment appears in staff Calendar
Verify Any Barber assigns a real barber
Verify a conflicting slot returns a useful 409 flow
Verify closed day
Verify mobile layout at approximately 390px
Verify desktop layout

Do not claim integration verification passed if PostgreSQL was unavailable.

35. Definition of Done

Phase 4B is complete only when:

Public /book exists
Mobile-first booking flow works
Exactly one public service can be selected
Active eligible barbers are shown
Any Barber works through the existing reservation engine
21-day booking horizon is enforced
Past public dates/times are rejected
Closed days are distinguishable from fully-booked days
Availability uses the existing scheduling engine
Guest booking requires no login
Name and phone are required
Email and notes are optional
Public source is always ONLINE
Business is server-resolved
Price/duration are server-authoritative
Reservation is automatically confirmed
Conflict handling uses 409 and refreshes availability
Confirmation displays assigned barber
Short booking reference is shown
No public appointment lookup endpoint exists
Cancellation policy is read from DB
No payment/deposit flow exists
MVP rate limiting is implemented
Tests pass
Lint passes
Typecheck passes
Production build passes
PostgreSQL integration passes if environment is available
Manual browser verification passes
No Phase 5+ features were implemented 36. Stop Conditions

If you discover:

a real Phase 2B scheduling defect,
a database constraint that prevents correct public booking,
a timezone/DST defect,
a concurrency defect,
a schema change that is genuinely required,

do not silently redesign the system.

Stop and report:

The problem
Why it blocks Phase 4B
Evidence/tests
The smallest proposed fix
Whether the fix belongs in Phase 2 or Phase 4

Otherwise continue with Phase 4B.

37. Final Report

When implementation is complete, stop.

Do NOT start Phase 5.

Provide a concise implementation report containing:

1. Status

Whether Phase 4B is complete.

2. Files changed

List the important files.

3. Public API

List the implemented endpoints and their purpose.

4. Booking flow

Explain the implemented user flow.

5. Architecture

Confirm that public booking reuses:

checkAvailability()
reserveAppointment()

and that no second scheduling engine was introduced.

6. Security

Explain:

server-controlled business
server-controlled source
server-controlled price/duration
past-time protection
rate limiting
conflict handling 7. Tests

Report exact results:

tests: X passed / Y skipped / Z todo
lint: pass/fail
typecheck: pass/fail
build: pass/fail
PostgreSQL integration: pass/fail/not available
browser verification: pass/fail 8. Any deviations

Explicitly list anything that differs from this prompt.

9. Technical debt

Only list relevant deferred items, such as Playwright.

10. Phase boundary

Explicitly confirm:

Phase 5 was not started.

Stop after the report and wait for approval.

Important final instruction:
Do not start Phase 5, notifications, customer accounts, OTP, payments, deposits, or any future-phase work even if implementation appears easy or naturally related. Phase 4B ends at successful public guest booking and verification.
