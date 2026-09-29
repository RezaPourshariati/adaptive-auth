We are starting Phase 3A of the Barbershop project.

Phase 2B is now APPROVED.

Verification completed successfully:

- 55 tests passed, 1 todo
- 14/14 PostgreSQL integration tests passed against real PostgreSQL 16
- concurrency tests passed for:
  - appointment vs staff-specific calendar block
  - appointment vs shop-wide calendar block
  - Any Barber concurrency
- cancellation transition tests passed
- migration passed
- lint passed
- type-check passed
- production build passed

Phase 3B implementation must NOT start yet.

This phase is DESIGN ONLY.

---

Important product UX principle:

The entire product should follow a Mobile First philosophy.

Public customer-facing flows are expected to be heavily mobile-oriented.

Staff operational tools must also remain usable on mobile, while taking advantage of larger screens on tablet/desktop.

---

PHASE 3A — STAFF CALENDAR & STAFF WORKFLOW DESIGN

Goal:

Design the staff-facing Calendar and the application/API changes required to operate the scheduling system from the Dashboard.

The Calendar is the primary operational interface for the barber shop.

It must allow staff to understand the day's schedule and manage appointments, walk-ins, and blocked time without introducing unnecessary complexity.

---

1. STRICT SCOPE

---

In scope for Phase 3A:

- Staff Calendar UX
- Daily scheduling workflow
- Resource Timeline design
- Dynamic barber columns
- Appointment display
- Appointment details/actions
- Walk-in workflow
- Calendar Block workflow
- Complete / No-show workflow
- Cancellation workflow from Calendar
- Calendar date navigation
- Relevant API/application-layer design
- Required authorization boundaries
- Required tests for Phase 3B
- Responsive behavior for desktop/tablet
- Architecture decisions needed before implementation

Out of scope:

- Public booking UI
- Customer accounts
- OTP
- SMS/email notifications
- Payment/deposit integration
- Loyalty/CRM
- Analytics
- Multi-tenancy
- Custom domains
- Drag-and-drop scheduling unless you determine it is clearly required for the first Calendar version
- Redis
- queues
- microservices
- new API framework
- redesign of the scheduling engine

Do not implement code during this phase.

---

2. EXISTING ARCHITECTURE TO RESPECT

---

Current architecture:

Browser
↓
Nuxt / Nitro HTTP layer
↓
Application / Use Cases
↓
Domain
↓
PostgreSQL

Nitro is the HTTP adapter.

Scheduling business logic must remain in plain TypeScript application/domain code.

Do NOT move scheduling logic into Nitro handlers.

Do NOT introduce Express, Fastify, NestJS, Redis, queues, or another backend framework.

Phase 2B already contains:

- Appointment
- AppointmentService
- CalendarBlock
- checkAvailability()
- reserveAppointment()
- cancelAppointment()
- createCalendarBlock()
- Any Barber resolution
- PostgreSQL overlap protection
- PostgreSQL concurrency protection
- business/staff/service integrity
- timezone/DST handling

The Calendar must consume these capabilities rather than bypassing them.

---

3. CALENDAR MODEL

---

Evaluate and document the Resource Timeline model.

Expected initial direction:

- X-axis = time
- Y-axis / columns = barbers/resources
- one column per active StaffMember
- barber count is dynamic
- no hard-coded five-barber assumption
- appointments are rendered as blocks
- block height corresponds to duration
- current time should be visually distinguishable
- non-working periods should be visually distinguishable
- shop-wide blocks should be represented appropriately
- staff-specific blocks should appear on the relevant barber column

Design the exact layout.

Explain:

- time scale
- minimum/maximum visible hours
- scrolling behavior
- appointment block sizing
- handling very short services
- handling long appointments
- overlapping data behavior
- empty slots
- closed shop days
- staff-specific working hours
- shop-wide blocks
- current-time indicator
- date navigation
- today button
- selected date state

Do not assume the current 08:00–19:00 seed values are permanent.

---

4. APPOINTMENT CARD

---

Design exactly what information an appointment block should display.

Consider:

- customer name
- selected services
- total duration
- start/end time
- barber
- source
- status
- phone
- notes
- relevant visual indicators

Avoid overcrowding.

Define:

- compact/default appointment card
- expanded/details view
- click behavior
- available actions

Do not invent unnecessary customer-management features.

---

5. APPOINTMENT ACTIONS

---

Define the staff workflow for:

- viewing appointment details
- cancelling
- completing
- marking no-show

Important:

Phase 2B currently has only the cancellation use case.

There is no complete/no-show use case yet.

Do NOT implement those in Phase 3A.

Instead, specify the required application use cases and invariants for Phase 3B.

Respect the existing Phase 2B rule:

CONFIRMED → CANCELLED is allowed.

COMPLETED → CANCELLED is not allowed.

NO_SHOW → CANCELLED is not allowed.

CANCELLED → CANCELLED is not allowed.

Define which additional transitions Phase 3B should support and why.

Keep the state machine minimal.

---

6. WALK-IN WORKFLOW

---

Walk-ins are an important real-world workflow.

Do NOT over-engineer them.

Current business requirement:

- walk-ins can arrive at any time
- short/quick walk-ins may be served without affecting the calendar
- longer walk-ins or walk-ins affecting future availability should be entered into Calendar
- staff decides how to handle them
- there is no requirement for a separate walk-in engine

Design a simple staff workflow.

For example, evaluate:

"Add Walk-in"

→ customer information
→ service
→ barber
→ start time
→ duration derived from service
→ reserve immediately

Determine whether walk-in should reuse:

reserveAppointment({
source: WALK_IN
})

It should not create a separate scheduling mechanism unless there is a strong reason.

Explain how the UI should handle:

- Any Barber
- specific barber
- immediate start
- future start
- service selection
- customer phone/name
- conflict detection

---

7. CALENDAR BLOCK WORKFLOW

---

Design the UI for:

- shop-wide block
- staff-specific block

Examples:

- lunch
- private appointment
- maintenance
- training
- personal time
- temporary closure

Do not hard-code a 15-minute block.

Staff chooses duration.

Define:

- create block
- edit block
- cancel/remove block
- title/reason
- start/end
- barber selection
- shop-wide option

Respect Phase 2B's existing concurrency model.

Do not bypass createCalendarBlock().

---

8. HOURS AND CLOSED PERIODS

---

Calendar must correctly reflect:

- business working hours
- staff-specific hours
- closed shop days
- staff unavailable periods

Current Phase 1 model:

- business hours
- optional staff-specific hours
- one interval per day
- closed day represented by no row

Do not expand to multiple intervals/day in this phase unless the design absolutely requires it.

If there is a limitation, document it rather than redesigning the model.

---

9. DATE / TIMEZONE BEHAVIOR

---

Business timezone is already modeled.

Calendar must operate in the business timezone.

Document:

- selected date semantics
- API date parameters
- conversion to/from UTC
- display timezone
- DST behavior
- "today"
- current-time indicator

Do not introduce a custom timezone framework.

---

10. API / APPLICATION LAYER

---

Design the API/application boundary needed by the Calendar.

Identify required operations such as:

- get calendar data for a date
- list appointments
- list calendar blocks
- create walk-in
- cancel appointment
- complete appointment
- mark no-show
- create block
- cancel/remove block

For each operation specify:

- HTTP method
- route
- input
- output
- application use case
- authorization requirement
- important validation
- concurrency requirements

Do not implement them yet.

Important:

Calendar read APIs should provide enough data for one calendar view without forcing excessive HTTP requests.

Consider whether a single date-scoped calendar endpoint should return:

- active staff
- effective working hours
- appointments
- calendar blocks
- business timezone
- selected date

Explain the tradeoff.

---

11. AUTHORIZATION

---

Existing staff roles:

- owner
- manager
- barber

Current Phase 1 review noted that roles exist but are not yet enforced.

Phase 3A must decide the minimum authorization model required for Calendar operations.

Do NOT build a complicated RBAC system.

At minimum consider:

- who can view Calendar
- who can create/edit/cancel blocks
- who can cancel appointments
- who can mark complete/no-show
- whether a barber can modify another barber's schedule

If role enforcement is intentionally deferred, explain exactly why and what minimum enforcement Phase 3B needs.

Never trust barber/staff IDs from the browser without server-side authorization.

---

12. RESPONSIVE DESIGN — MOBILE FIRST

---

The product must be designed Mobile First.

This is especially important for the public customer experience because the majority of customers are expected to interact with the website and booking flow from a mobile phone.

Even though Phase 3 focuses on the Staff Calendar, Phase 3A must establish responsive design principles that will also support the later public booking flow.

Priority:

1. Mobile
2. Tablet
3. Desktop

Do NOT design the desktop experience first and simply shrink it for mobile.

The mobile layout must be intentionally designed.

### Staff Calendar

The Staff Calendar is primarily an operational staff tool, so desktop and tablet may provide a richer multi-column Resource Timeline.

However, the Calendar must remain genuinely usable on mobile.

Do NOT assume that showing all barber columns side-by-side is acceptable on small screens.

For mobile, evaluate and document an intentional UX such as:

- selecting one barber at a time
- a focused barber view
- switching barber through a selector
- compact day/timeline view
- another approach if you identify a better workflow

Do NOT blindly choose horizontal scrolling.

If horizontal scrolling is used, explain why it is preferable and how usability remains acceptable.

### Desktop / Tablet

On larger screens, the preferred direction remains:

- Resource Timeline
- one column per active barber
- dynamic barber count
- appointments rendered as time blocks
- business/staff working hours visible
- shop-wide blocks represented appropriately

The design must handle:

- 1–5 barbers
- 6–8 barbers
- more than 8 barbers

Do not hard-code five barber columns.

Explain how the layout behaves as barber count grows.

### Public Booking:

Although public booking is Phase 4 and must NOT be implemented now, Phase 3A must preserve a Mobile First principle for its future design.

The future booking flow should be designed primarily for:

- mobile phones
- touch interaction
- small screens
- clear time-slot selection
- minimal typing
- accessible controls

Do not let the Staff Calendar architecture force a desktop-first interaction model onto the future public booking flow.

### Touch / Interaction

For mobile and tablet, consider:

- touch target sizes
- tap vs hover interactions
- appointment detail access
- date navigation
- barber switching
- block creation
- action menus
- avoiding hover-only information
- avoiding tiny controls

Do not require hover for any essential functionality.

### Responsive Architecture

Prefer responsive layout and component behavior over separate mobile/desktop implementations.

Use the same underlying scheduling/application APIs and domain model.

The UI may use different presentation patterns at different breakpoints when necessary.

Do not duplicate business logic for mobile and desktop.

### Dependency Decision

Do not introduce a third-party calendar library unless there is a concrete technical reason.

The current preferred direction remains a custom CSS Grid Resource Timeline for desktop/tablet, combined with an intentionally designed mobile presentation.

If you recommend a different calendar technology, provide a specific technical justification.

---

13. UI TECHNOLOGY

---

The current dashboard uses native HTML.

PrimeVue is installed/configured but currently unused.

Do not automatically introduce PrimeVue components.

Evaluate whether the Calendar should:

- remain custom HTML/CSS
- use selected PrimeVue components
- use a calendar library

Make a concrete recommendation based on this project's requirements and current architecture.

Avoid unnecessary dependencies.

---

14. DATA FETCHING / REFRESH

---

Design how Calendar data is refreshed.

Consider:

- initial load
- changing date
- after creating appointment/walk-in
- after cancellation
- after creating/removing block
- after complete/no-show
- manual refresh
- stale data
- concurrent staff changes

Do NOT introduce WebSockets or realtime infrastructure in this phase unless there is a compelling requirement.

Polling/revalidation/manual refresh may be sufficient.

---

15. ERROR / CONCURRENCY UX

---

The database remains the final authority.

Design what happens when:

- two staff members attempt the same slot
- an appointment becomes unavailable while viewing Calendar
- a block conflicts with an appointment
- an appointment was cancelled by another staff member
- a barber becomes inactive
- a service becomes inactive

The UI must not assume that previously fetched Calendar data is still valid.

Define the expected error response and UI behavior.

---

16. WALK-IN VS ONLINE APPOINTMENT

---

Make the distinction clear:

Appointment source:

- ONLINE
- PHONE
- WALK_IN
- STAFF_CREATED

Source is not status.

Do not create a separate WalkIn entity.

---

17. DRAG & DROP

---

Evaluate whether drag-and-drop should be part of Phase 3B.

Do not include it merely because modern calendars commonly have it.

Consider:

- changing barber
- changing start time
- duration preservation
- conflict handling
- accidental moves
- mobile/tablet usability
- concurrency
- auditability
- required new application use case

If deferred, explicitly document it as a future enhancement.

---

18. TEST STRATEGY

---

Define tests required for Phase 3B.

At minimum consider:

Application tests:

- calendar date loading
- appointment filtering
- block filtering
- walk-in reservation
- complete
- no-show
- cancellation
- authorization
- conflict handling

Integration tests:

- real PostgreSQL mutations
- concurrent calendar operations
- block/appointment conflict
- correct business isolation

UI tests:

- calendar renders dynamic barber columns
- appointment blocks render correctly
- date navigation
- create walk-in
- create block
- cancel appointment
- complete/no-show
- error/revalidation behavior

Do not implement tests in Phase 3A.

---

19. ARCHITECTURE / FILE STRUCTURE

---

Propose the Phase 3B application/domain/API/UI structure.

Keep scheduling logic separate from:

- Vue components
- Nitro handlers
- browser state

Do not create a giant Calendar component.

Recommend reasonable component boundaries.

For example, evaluate structures similar to:

app/pages/staff/calendar.vue
app/components/calendar/...
server/application/scheduling/...
server/domain/scheduling/...
server/api/staff/calendar/...

But adapt this to the actual existing repository rather than blindly following the example.

---

20. DESIGN DELIVERABLE

---

At the end of Phase 3A provide a concise but complete design document/report containing:

1. Scope
2. Goals
3. Non-goals
4. User workflows
5. Calendar UX design
6. Appointment card design
7. Walk-in workflow
8. Calendar block workflow
9. Appointment status/action model
10. Hours/availability display
11. Timezone/DST behavior
12. API design
13. Application/use-case design
14. Authorization model
15. Error/concurrency UX
16. Responsive behavior
17. Data fetching/revalidation strategy
18. Drag/drop decision
19. UI technology decision
20. Proposed file/component structure
21. Test strategy
22. Implementation plan for Phase 3B
23. Definition of Done for Phase 3B
24. Open questions / decisions requiring approval

Clearly distinguish:

- existing Phase 2B behavior
- proposed Phase 3 behavior
- future/deferred features

---

21. IMPORTANT ARCHITECTURAL RULES

---

Do not:

- modify Phase 2B scheduling behavior unnecessarily
- redesign the database without a concrete Phase 3 requirement
- add Customer/OTP
- add notifications
- add payments
- add multi-tenancy
- add realtime infrastructure
- add Redis
- add queues
- add a separate walk-in engine
- introduce a new backend framework
- start implementation
- start Phase 3B

If a Phase 3 requirement exposes a real flaw in Phase 2B, document it separately rather than silently changing it.

---

22. STOP CONDITION

---

When the Phase 3A design is complete:

STOP.

Do not write implementation code.

Do not modify schema.

Do not create migrations.

Do not modify APIs.

Do not start Phase 3B.

Return the design report and wait for approval.
