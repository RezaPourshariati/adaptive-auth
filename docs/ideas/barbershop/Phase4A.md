We are starting Phase 4A: Public Guest Booking Design.

Phase 3B is APPROVED and complete.

Phase 4A is DESIGN ONLY.

Do NOT implement anything.
Do NOT modify code.
Do NOT modify the database schema.
Do NOT create migrations.
Do NOT create API routes.
Do NOT change Phase 2B or Phase 3B behavior.
Do NOT start Phase 4B.
Do NOT add Customer Accounts, OTP, Notifications, Payments, Deposits, CRM, Loyalty, Multi-tenancy, Custom Domains, Redis, Queues, WebSockets, or realtime infrastructure.

After completing the design, STOP and wait for approval.

## 1. PHASE 4 GOAL

Design the public, mobile-first, guest booking flow for the barbershop.

A customer must be able to book an appointment without creating an account or logging in.

The core flow is:

Customer
↓
Choose Service
↓
Choose Barber OR Any Barber
↓
Choose Date
↓
See Available Times
↓
Choose Time
↓
Enter Guest Information
↓
Review
↓
Confirm Booking
↓
Appointment CONFIRMED

Online booking must be automatically confirmed.

There is no staff approval step.

The booking flow must use the existing Phase 2B scheduling/application layer rather than implementing a second scheduling engine.

## 2. EXISTING ARCHITECTURE — MUST BE PRESERVED

The existing architecture is:

Browser
↓
Nuxt / Nitro HTTP Layer
↓
Application / Use Cases
↓
Domain
↓
PostgreSQL

Nitro is the HTTP adapter only.

Business and scheduling logic must remain outside Nitro handlers.

The central reservation path is:

reserveAppointment(...)

Phase 4 must call/reuse this existing reservation use case.

Do NOT create a separate "public booking engine".

Do NOT duplicate availability logic in the public UI or API.

The public booking flow must use the existing:

- checkAvailability(...)
- reserveAppointment(...)
- existing scheduling/domain validation
- PostgreSQL concurrency protection

If a Phase 2B limitation is discovered, document it separately.
Do not silently redesign Phase 2B.

## 3. DESIGN SCOPE

Design the complete Phase 4 public guest booking experience, including:

1. Public booking route/page structure
2. Booking flow/state machine
3. Service selection
4. Barber selection
5. Any Barber behavior
6. Date selection
7. Availability/time-slot selection
8. Guest information form
9. Review/confirmation step
10. Successful booking state
11. Conflict/concurrency behavior
12. Validation and error handling
13. Mobile-first responsive UX
14. Loading/empty/error states
15. Business hours / closed days
16. Existing appointments and Calendar Blocks
17. Cancellation policy messaging
18. Timezone handling
19. API/application boundary
20. Security / abuse considerations
21. Browser navigation/back behavior
22. Refresh/retry behavior
23. Accessibility
24. Test strategy
25. File/component/application structure
26. Definition of Done
27. Open questions / decisions

## 4. GUEST BOOKING — IMPORTANT PRODUCT RULES

Guest booking is allowed.

Login is NOT required.

Customer accounts are NOT part of Phase 4.

OTP is NOT part of Phase 4.

A guest should provide the information required to create an appointment.

The current Appointment model from Phase 2B contains guest fields such as:

- guest_name
- phone
- email
- notes

Respect the existing model and validation.

Do not invent a Customer entity in Phase 4.

Do not add customer_id.

A future Phase 6 may introduce Customer + OTP + account linking.

Phase 4 must remain compatible with that future direction.

## 5. SERVICE SELECTION

Services must come from the database.

Do NOT hard-code the service catalog into the public page.

Only active services should be selectable.

The UI should show useful information such as:

- service name
- description when available
- duration
- price
- currency

Respect the existing service model.

Do not duplicate service pricing/duration as application constants.

## 6. SINGLE VS MULTIPLE SERVICES

The Phase 2B scheduling engine supports multiple services for an appointment.

Design how Phase 4 should expose this.

Decide whether the public booking flow should:

A) support one service initially, or
B) support selecting multiple services.

Do not make the decision based only on implementation convenience.

Evaluate:

- customer UX
- total duration
- barber eligibility
- availability calculation
- appointment_service snapshots
- mobile usability
- future extensibility

If recommending a limited Phase 4 scope, clearly explain how the existing multi-service capability remains compatible with the public API.

Do not modify Phase 2B.

## 7. BARBER SELECTION

The customer must be able to choose:

- Any Barber
- a specific active barber

Only active/bookable staff members should be shown.

Barber eligibility must come from the existing StaffService relationship.

Do not hard-code barber names.

If a selected barber cannot perform the selected service, that barber must not be offered as a valid option.

For "Any Barber":

- the customer does not choose a specific barber
- availability should represent eligible barbers
- the final reservation must resolve to a real barber
- the existing deterministic Any Barber selection/retry behavior from Phase 2B must remain authoritative
- do not persist "Any Barber" as staff_member_id

Explain how the UI should communicate that the system will assign a barber.

## 8. AVAILABILITY

Availability must come from the application/domain scheduling layer.

The browser must NOT calculate authoritative availability.

The UI may render the availability returned by the server.

Availability must account for:

- business working hours
- staff working hours where applicable
- service duration
- selected barber
- barber eligibility
- existing occupying appointments
- Calendar Blocks
- closed days
- business timezone
- DST
- existing booking conflicts

The server/database remain authoritative.

Do not use client-side availability as a reservation guarantee.

## 9. SLOT INTERVAL

The existing scheduling design uses a 10-minute slot grid.

Preserve this behavior.

Do not introduce a different public-booking interval.

Do not hard-code a second slot interval in the frontend.

Explain how the public UI should present available times on mobile.

## 10. DATE SELECTION

Design:

- minimum selectable date
- maximum booking horizon, if any
- closed days
- days with no availability
- timezone interpretation
- past dates
- Today behavior
- date navigation
- browser refresh/deep-link behavior

Do not invent a business rule such as a 30-day or 60-day booking horizon unless you clearly mark it as a proposed configurable business rule.

If the existing system does not yet have a booking horizon setting, document that as an open decision.

Do not add a setting in Phase 4A unless explicitly justified.

## 11. TIMEZONE

The business has a configured timezone.

The booking UI must use the business timezone for:

- date
- available times
- appointment start/end
- "today"
- DST behavior

Do not silently use the customer's browser timezone as the business schedule.

If the customer is physically in another timezone, the UI should still clearly communicate the shop's local timezone.

Use the existing Phase 2B timezone/DST helpers and concepts.

## 12. GUEST INFORMATION

Design the guest information step using the existing appointment fields.

At minimum determine:

- name
- phone
- email
- notes

For each field specify:

- required/optional
- validation
- appropriate mobile input type
- error presentation
- normalization, if any

Do not create an account.

Do not implement OTP.

Do not introduce customer authentication.

## 13. REVIEW STEP

Before final submission, design a clear review screen showing at least:

- service(s)
- duration
- barber or Any Barber
- date
- time
- guest name
- phone/email as appropriate
- total price
- cancellation policy summary
- business timezone where useful

The customer should have an obvious final confirmation action.

Clearly distinguish:

"Review"

from

"Confirm Booking".

The final confirmation must result in the existing reservation use case being called.

## 14. AUTO-CONFIRMATION

Online bookings are automatically confirmed.

There is no:

"Request booking"

or:

"Awaiting approval"

state.

After successful reservation, show a clear success state indicating that the appointment is confirmed.

Do not add notifications in Phase 4.

Email/SMS notifications belong to Phase 5.

If the system currently has no notification capability, do not fake a confirmation email/SMS.

## 15. CONCURRENCY / SLOT CONFLICT

This is critical.

A time slot shown as available is NOT guaranteed until reservation succeeds.

Another customer may reserve it before final confirmation.

Design the UX for:

1. Customer sees available slot
2. Another customer books it
3. Customer submits
4. reserveAppointment rejects due to conflict
5. Server returns appropriate conflict/domain error
6. UI informs customer
7. UI refreshes availability
8. Customer can choose another time

Do not create temporary client-side reservations.

Do not add Redis.

Do not add locks outside the existing PostgreSQL/application architecture.

Do not weaken database concurrency protection.

Explain expected HTTP status/error mapping.

## 16. BOOKING VALIDATION

Design validation for:

- inactive service
- invalid service
- invalid/ineligible barber
- inactive barber
- invalid date
- past date
- outside working hours
- closed day
- unavailable slot
- Calendar Block
- appointment conflict
- malformed guest information
- invalid duration/price assumptions
- business isolation

The server must remain authoritative.

Never trust:

- price
- duration
- barber eligibility
- availability
- business ID

from the browser.

The server must resolve authoritative values from the database.

## 17. PRICE / SNAPSHOT RULE

The public client must not be authoritative for price or duration.

The server should resolve the selected service from the database.

When reservation succeeds, AppointmentService must receive the existing historical snapshot:

- service name
- duration
- price
- currency

Do not trust a client-submitted price.

Explain how the review UI and final reservation stay consistent if service data changes between availability lookup and final submission.

## 18. CANCELLATION POLICY

The business currently has a configurable cancellation notice period.

Initial seeded value is 4 hours.

Phase 4 must clearly communicate the relevant cancellation policy during booking.

Do not implement customer self-service cancellation in Phase 4 unless explicitly required by existing architecture.

That belongs to a later phase if appropriate.

Do not hard-code "4 hours" in the public UI.

Read the configured business value.

If contact instructions exist, design how they may be shown.

## 19. PAYMENT / DEPOSIT

Do NOT implement payment.

Do NOT integrate a payment provider.

Do NOT require a deposit in Phase 4.

Do NOT add payment UI.

Do NOT add fake payment success/failure.

If the existing business has a deposit percentage field, explain how Phase 4 should behave while payment is not configured.

The existing product rule is:

If payment provider is not configured, booking remains allowed.

## 20. NOTIFICATIONS

Do NOT implement email or SMS in Phase 4.

Phase 5 will handle notifications.

Do not add notification calls directly inside the booking transaction.

If the design needs a future hook, document it only.

## 21. API DESIGN

Design thin public Nitro endpoints.

Do not implement them.

Potential capabilities include:

- get active services
- get active/bookable barbers for selected service
- get availability
- reserve appointment

Determine whether these should be separate endpoints or a smaller number of read endpoints.

For each endpoint specify:

- HTTP method
- route
- request shape
- response shape
- validation
- error mapping
- whether authentication is required
- application use case called

Guest booking endpoints must NOT trust a businessId supplied by the client.

For this current single-business implementation, determine how the public API identifies the business without prematurely implementing multi-tenancy.

Do not introduce custom domains or tenant resolution.

## 22. BUSINESS ISOLATION

The application is currently a single-business public website.

Do not implement multi-tenancy.

However, do not design the public API in a way that makes business ownership ambiguous.

If the existing Phase 3B public/staff API uses a known single-business resolution strategy, inspect and preserve that strategy.

Document how businessId is resolved server-side.

Do not accept arbitrary businessId from the browser.

## 23. SECURITY / ABUSE

Design, but do not over-engineer, protection against:

- spam booking attempts
- repeated availability requests
- malformed input
- enumeration of internal IDs
- unauthorized business access
- tampering with price/duration
- excessive reservation attempts

Consider practical MVP protections such as:

- strict Zod validation
- server-side authoritative data
- reasonable request throttling/rate limiting if already available
- generic errors where appropriate

Do NOT introduce Redis or external infrastructure just for Phase 4.

Clearly distinguish required Phase 4 protections from future hardening.

## 24. MOBILE-FIRST UX

This is a hard requirement.

Most real customers are expected to book from phones.

Design Mobile First.

The public booking flow must genuinely work on small screens.

Do not simply shrink a desktop booking page.

Prioritize:

- thumb-friendly controls
- touch targets >= 44px
- clear step progression
- minimal typing
- native date/time controls where useful
- large available-time buttons
- sticky/obvious primary action where appropriate
- readable price/duration
- no hover-only behavior
- clear loading states
- accessible validation
- keyboard accessibility
- screen-reader semantics

Then explain tablet and desktop adaptations.

## 25. BOOKING FLOW / STATE MANAGEMENT

Design the client-side booking state explicitly.

For example:

Service
↓
Barber
↓
Date
↓
Time
↓
Guest Info
↓
Review
↓
Submitting
↓
Success / Conflict / Error

Decide:

- what is kept in client state
- what is refetched from server
- when availability is refetched
- what happens if the user changes service
- what happens if the user changes barber
- what happens if the user changes date
- what happens if availability becomes stale
- what happens on browser Back
- what happens on Refresh

Do not introduce Pinia unless there is a concrete reason.

Prefer simple local/page state where appropriate.

## 26. BROWSER NAVIGATION / DEEP LINKS

Design whether booking steps should be:

- a single page state machine
- separate routes
- route query parameters
- a hybrid

Consider:

- Back button
- Refresh
- sharing a URL
- invalid deep links
- preserving selected values
- mobile usability

Do not over-engineer.

The final design should remain easy to understand and maintain.

## 27. ERROR UX

Design user-facing states for:

- no services
- no eligible barbers
- no availability
- closed day
- network failure
- server error
- slot conflict
- service becoming inactive
- barber becoming unavailable
- business configuration problem

Do not expose stack traces or internal database errors.

The UI should distinguish recoverable conflicts from generic failures.

## 28. SUCCESS STATE

Design the post-booking confirmation page/state.

It should clearly communicate:

- Booking confirmed
- service(s)
- barber
- date
- start/end time
- guest name
- total price
- business timezone where useful
- cancellation policy/contact instructions if useful

Do not claim that SMS/email was sent in Phase 4.

Do not create a fake confirmation number unless the existing architecture already has one.

If recommending an appointment reference, explain whether it requires a schema change or can use the existing appointment ID safely.

## 29. DATA PRIVACY

The public booking flow collects personal information.

Design:

- minimal data collection
- transport/security assumptions
- what should not be exposed in availability responses
- whether guest email/phone should ever be echoed unnecessarily
- generic error messages where appropriate

Do not add a full privacy/legal system in Phase 4.

## 30. ACCESSIBILITY

Design for:

- keyboard navigation
- visible focus
- semantic labels
- screen readers
- accessible error messages
- sufficient touch targets
- date/time selection
- modal/dialog semantics if used

No hover-only essential actions.

## 31. TEST STRATEGY

Design tests at multiple levels.

Application/unit tests should cover:

- service eligibility
- Any Barber
- availability
- date/time handling
- cancellation policy data
- validation
- reservation input mapping
- authoritative price/duration
- conflict/error mapping

Real PostgreSQL integration tests should cover:

- successful guest reservation
- AppointmentService snapshots
- inactive service rejection
- ineligible barber rejection
- unavailable slot
- Calendar Block
- closed day
- business isolation
- same-slot concurrent reservations
- Any Barber concurrent reservations
- rollback behavior
- no orphan Appointment rows

Public API tests should cover:

- successful booking
- malformed input
- invalid service/barber
- conflict response
- no businessId trust from client

Browser/E2E tests should cover the critical happy path and conflict path if the existing testing setup supports it.

Do not require exhaustive UI tests if they would introduce unnecessary infrastructure.

## 32. FILE / ARCHITECTURE DESIGN

Propose a clean structure for Phase 4.

Keep:

- public UI
- application/use cases
- domain logic
- Nitro API adapters

separated.

Do not mix scheduling business rules into Vue components.

Do not put database access directly inside Vue components.

Do not create a second scheduling engine.

Explain which existing Phase 2B/3B modules will be reused.

## 33. OUT OF SCOPE

Explicitly keep these OUT:

- Customer accounts
- OTP
- Login/register
- Customer sessions
- Customer profile
- CRM
- Loyalty
- Email
- SMS
- Notifications
- Payment provider
- Deposits
- Refunds
- Online payment
- Multi-tenancy
- Custom domains
- SaaS billing
- Redis
- WebSockets
- realtime availability
- queues
- marketplace
- reviews
- analytics
- AI
- drag-and-drop calendar
- appointment rescheduling
- appointment reassignment
- customer self-service cancellation unless already required
- staff-hours editor
- role/RBAC redesign

## 34. IMPORTANT ARCHITECTURAL CONSTRAINT

Do NOT redesign Phase 2B just because Phase 4 needs something.

The existing scheduling engine is the authority.

If Phase 4 exposes a genuine missing capability in Phase 2B, report it under:

"Phase 2B dependency / gap"

and explain:

- why Phase 4 needs it
- whether it is blocking
- the smallest possible fix

Do not silently implement the fix.

## 35. REQUIRED DESIGN DELIVERABLE

Your Phase 4A response must contain:

1. Executive summary
2. Scope
3. Explicit non-goals
4. End-to-end booking flow
5. Booking state machine
6. Service selection design
7. Barber selection design
8. Any Barber behavior
9. Availability design
10. Date/time design
11. Timezone/DST design
12. Guest information design
13. Review/confirmation design
14. Reservation/concurrency design
15. Cancellation-policy presentation
16. Payment/deposit behavior
17. API contract proposal
18. Business resolution strategy
19. Security/abuse considerations
20. Mobile-first UX
21. Navigation/state management
22. Error/loading/empty states
23. Success state
24. Accessibility
25. Testing strategy
26. Proposed file structure
27. Phase 4B Definition of Done
28. Open questions / decisions requiring approval
29. Any Phase 2B dependencies or gaps

For every major decision, explain the reasoning.

Do not just list implementation tasks.

## 36. DESIGN ONLY / STOP CONDITION

Again:

Phase 4A = DESIGN ONLY.

Do not write implementation code.

Do not modify files.

Do not create migrations.

Do not implement API routes.

Do not implement UI.

Do not start Phase 4B.

After the design is complete, STOP.

Wait for explicit approval before implementation.
