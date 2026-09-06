# Crypto Barber Shop — Product & Architecture Brief

## 1. IMPORTANT: Current Repository / Development Location

We are currently working inside an existing repository called `AdaptiveAuth`.

The current repository has a monorepo-oriented structure similar to:

AdaptiveAuth/
├── apps/
│ ├── vue-app/ # current Vue SPA
│ ├── nuxt-app/ # Nuxt 4 app
│ ├── admin-web/ # optional future app
│ └── mobile/ # optional future app
├── services/
│ └── auth-server/ # Express API / auth backend
├── packages/
│ ├── shared-auth/
│ ├── shared-types/
│ ├── validation/
│ └── eslint-config/
├── docs/
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── turbo.json

I have NOT created a separate Git repository for the Crypto Barber Shop project yet.

### Therefore:

DO NOT create or initialize a new Git repository.

DO NOT create a separate repository.

For now, create the new project as a dedicated folder inside the root of the existing `AdaptiveAuth` repository.

For example:

AdaptiveAuth/
├── apps/
├── packages/
├── services/
├── ...
└── crypto-barber-shop/
└── ...

The exact folder name can be chosen appropriately, but keep the project clearly isolated from the existing AdaptiveAuth applications.

The purpose of doing this temporarily is:

1. I can work on the new project immediately.
2. You can inspect and learn from the existing AdaptiveAuth architecture.
3. You can reuse useful engineering patterns from the existing codebase where appropriate.
4. We can later move/extract the Crypto Barber Shop project into its own Git repository once I create one.

Do NOT couple the new application to AdaptiveAuth at runtime just because both currently live in the same repository.

The existing AdaptiveAuth project should be treated primarily as:

- an architectural reference
- a code-quality reference
- a security-pattern reference
- a TypeScript/monorepo reference

Reuse ideas and patterns where they make sense, but do not blindly copy architecture or dependencies.

Before writing substantial code, inspect the existing repository structure and relevant packages so you understand the conventions already used.

---

# 2. Project

We are rebuilding the website and booking system for a real barber shop:

**Crypto Barber Shop**

The existing business currently has a WordPress website.

The goal is to rebuild it using:

- Nuxt 4
- TypeScript
- PostgreSQL

This is NOT intended to be a throwaway demo or toy project.

It should be designed as a real production-oriented application.

However, we are intentionally starting with ONE real business.

We do NOT want to implement the complete multi-tenant SaaS platform yet.

The architecture should be designed intelligently so that it can evolve into a multi-tenant SaaS later.

---

# 3. Long-Term Product Vision

The long-term idea is NOT a marketplace where many salons/barbershops appear inside one central website.

Instead, each business should eventually have its own branded website.

For example:

cryptobarbershop.com
anotherbarbershop.com
another-salon.com

All of those websites could eventually run on the same underlying SaaS infrastructure.

Conceptually:

Incoming Domain
↓
Business / Tenant
↓
Business Website
↓
Booking / Calendar / Customers / Staff
↓
Shared SaaS Infrastructure

However:

## DO NOT IMPLEMENT MULTI-TENANCY YET.

Do not build:

- domain provisioning
- DNS automation
- custom-domain infrastructure
- tenant billing
- subscription management
- marketplace functionality
- tenant onboarding platform

Those are future concerns.

Instead, build the actual Crypto Barber Shop product properly.

Nevertheless, keep the domain model and architecture reasonably "SaaS-shaped" where this is inexpensive and useful.

For example, business-owned domain entities should be able to evolve toward:

Business
↓
Staff
↓
Services
↓
Customers
↓
Appointments

A `business_id` / equivalent ownership boundary should be considered from the beginning where appropriate, even though there is currently only one business.

---

# 4. Critical Product Principle

The website is important, but the most important operational part of this product is:

## THE CALENDAR / APPOINTMENT ENGINE

The Calendar should NOT be treated as a secondary admin feature.

It is the operational heart of the application.

Think of the system as:

Customer Channels
├── Website
├── Phone
└── Walk-in
↓
Appointment Engine
↓
Smart Calendar
↓
Barber Resources

The website is one channel.

The Calendar is the source of truth for scheduled work.

---

# 5. Current Business Information

The business currently has approximately:

- 5 barbers
- Opening/working hours: 08:00 AM – 07:00 PM

IMPORTANT:

## DO NOT hard-code the system around exactly 5 barbers.

Five is the CURRENT number.

The business may have:

- 3 barbers
- 5 barbers
- 7 barbers
- 10 barbers
- etc.

in the future.

The system must support dynamically adding, removing, activating, deactivating, and managing barbers/staff.

For example:

StaffMember

- id
- name
- active
- services
- working hours / availability
- specialties
- etc.

The Calendar should dynamically render however many active barbers/resources exist.

---

# 6. Barber / Staff Model

Currently, most barbers provide the same core services.

However, some barbers may have additional expertise or special services.

Therefore:

DO NOT assume:

Every barber = every service

Instead, support a relationship such as:

StaffMember
↕
StaffService
↕
Service

This allows:

Barber A → Haircut, Beard, Hair Styling
Barber B → Haircut, Beard
Barber C → Haircut, Beard, Special Style

The system should be able to determine whether a barber is qualified/available for a particular service.

---

# 7. Services

Typical services currently take approximately:

40 minutes → 60 minutes

But DO NOT hard-code appointment slots to one fixed duration.

Service duration should belong to the service.

Example:

Haircut → 40 min
Beard → 20 min
Hair + Beard → 60 min
Special Style → 75 min

The exact current services should be discovered from the existing business website / project context before implementation.

The data model should support different durations.

---

# 8. "Any Barber" Requirement

Customers must be able to choose:

## Any Barber

Example:

Service:
Haircut

Barber:
Any Barber

Date:
Saturday

The availability engine should determine which eligible barber(s) can perform the service at that time.

If multiple barbers are available, the system can select an appropriate barber according to a deterministic strategy.

IMPORTANT:

Once an appointment is confirmed, it must have a real assigned barber.

"Any Barber" should be a booking preference/input, not a permanent appointment resource.

For example:

Booking request:
barberPreference = ANY

After availability resolution:

Appointment:
barberId = barber_123

---

# 9. Online Booking

Online bookings are:

## AUTO-CONFIRMED.

There is NO manual approval step.

The customer:

1. Selects service
2. Selects barber or Any Barber
3. Selects date
4. Selects available time
5. Enters contact information
6. Confirms booking

The appointment is immediately confirmed if the slot is still available.

DO NOT implement:

PENDING → wait for barber approval

for normal online bookings.

---

# 10. Critical Booking Concurrency Requirement

This is a real booking system.

The application must prevent double booking.

For example:

Customer A sees:

10:00 AM available

Customer B sees:

10:00 AM available

Both submit at almost exactly the same time.

The system must guarantee that both cannot successfully reserve the same barber/time resource.

This must be handled at the database/application level.

Do NOT rely only on frontend availability checks.

The final booking operation must be protected by transaction/concurrency-safe logic.

PostgreSQL is intentionally chosen for this project partly because it can provide strong database-level guarantees for this type of problem.

Investigate and propose an appropriate PostgreSQL strategy such as:

- transactions
- row locking where appropriate
- exclusion constraints
- time-range modeling
- `tstzrange`
- unique/exclusion constraints
- or another robust approach

Before implementation, explain the chosen strategy.

---

# 11. Walk-in Customers

Walk-ins are different from online appointments.

A walk-in can happen at any time.

The business owner explained:

### Short / quick walk-in

If the customer needs a short and quick service and will finish quickly, staff may NOT need to enter a formal appointment into the calendar.

This should remain operationally lightweight.

### Longer walk-in

If the walk-in requires enough time/services that it affects the schedule, staff should enter it into the Calendar.

Therefore, the system must support both situations.

Do NOT force every walk-in to become a full customer account.

Do NOT force every quick walk-in to create a formal appointment.

But the system should provide a convenient way for staff to create a calendar entry when the walk-in affects the schedule.

---

# 12. Unified Calendar

The Calendar should represent the operational truth.

It should be possible for staff to see scheduled work originating from:

- Online bookings
- Phone bookings
- Walk-ins that affect the schedule
- Staff-created appointments
- Calendar blocks / unavailable periods

Consider an appointment source such as:

ONLINE
PHONE
WALK_IN
STAFF_CREATED

And potentially calendar blocks as a separate concept/entity.

---

# 13. Calendar UI

The preferred mental model is a:

## Resource Timeline

Conceptually:

                 BARBER A    BARBER B    BARBER C    BARBER D    ...

08:00 | | | |
| | | |
08:40 [Appointment] | [Appointment] |
| | | |
09:20 ... ... ... ...

The number of barber columns must be dynamic.

If there are 5 active barbers, show 5.

If there are 7 active barbers, show 7.

If one barber is inactive, they should not appear as an active booking resource.

Appointment blocks should visually reflect their duration.

For example:

40-minute appointment = shorter block
60-minute appointment = taller block

The Calendar should allow staff to:

- view daily schedule
- see each barber
- see appointment duration
- create appointments
- create walk-in schedule entries
- create blocked/unavailable periods
- open appointment details
- potentially move/reschedule appointments
- clearly identify booking source
- see customer information
- see appointment status

Any drag/move functionality must still respect availability and concurrency rules.

---

# 14. Calendar UX Is a Major Feature

Do not build a generic CRUD table and call it a calendar.

The calendar should feel like an actual operational tool for a barber shop.

The staff member should be able to look at the screen and immediately understand:

- Which barbers are working
- Who is busy
- Who is free
- Which customer is coming
- What service is being performed
- How long it will take
- Where gaps exist
- Which appointments came from online booking
- Which appointments were created manually
- Which customers are no-shows/cancellations

The Calendar should eventually become the main daily dashboard for staff.

---

# 15. Customer Booking WITHOUT Login

This is extremely important.

## Customers MUST be able to book without creating an account.

The normal booking flow should NOT force authentication.

Example:

Website
↓
Book Appointment
↓
Select Service
↓
Select Barber / Any Barber
↓
Select Date
↓
Select Time
↓
Enter:

- Name
- Phone
- Email (if appropriate)
  ↓
  Confirm Booking

No account required.

Do NOT redirect customers to login just because customer authentication exists.

---

# 16. Optional Customer Account

Customer accounts ARE required, but they are OPTIONAL for booking.

The account is mainly intended for:

- loyal customers
- returning customers
- customers who want offers
- customers who want discounts
- appointment history
- profile information
- future loyalty/retention features

The business specifically wants to be able to distinguish reliable/loyal customers and potentially provide benefits.

But account creation should NOT become a barrier to normal booking.

---

# 17. Customer Authentication

Customer authentication should be:

## Passwordless OTP

Preferred flow:

Enter phone number
↓
Send 6-digit OTP
↓
Verify OTP
↓
Authenticated customer

There should be NO password requirement.

Phone number is the primary current requirement.

The architecture may support email identity as well if useful, but do not overcomplicate the MVP.

Profile information can be collected progressively.

For example:

Step 1:
Phone number

Step 2:
OTP

Step 3:
Authenticated

Step 4:
Optional profile completion:

- Name
- Email
- Other useful information

Customer authentication and staff/business authentication are separate concerns.

Do NOT use the customer account as the mechanism for securing the admin/staff dashboard.

---

# 18. Guest Booking + Authenticated Booking

Both flows must eventually converge on the same Appointment system.

Guest:

Customer provides:

- name
- phone
- email

Appointment:
customer information captured
customer account may be null

Authenticated customer:

Customer logs in via OTP.

Appointment:
customerId = authenticated customer

The data model should make it possible to later associate historical guest bookings with a customer account when we can confidently identify the same customer.

Do NOT require this advanced matching system for the first implementation, but do not design the schema in a way that makes it impossible later.

---

# 19. Customer Reliability / No-show System

This is a REAL business requirement.

The business wants to track customer behavior.

Important states include:

- completed / attended
- cancelled
- no-show
- potentially late cancellation

The business owner wants customers who are punctual/on-time to be trackable.

Customers who repeatedly fail to show up should also be trackable.

A future/customer policy is:

If a customer has a no-show / problematic booking history,
their next booking may require a:

## 20% deposit

This is not just a future theoretical feature.

It is a real business rule we need to design for.

However, do NOT build an unnecessarily complicated customer scoring/AI/reputation system.

Start with explicit, understandable data:

appointment outcome
attendance/no-show
cancellation timing
deposit requirement

For example, the system could eventually determine:

requiresDeposit = true

based on configurable business rules.

---

# 20. Cancellation Policy

Current business rule:

### Cancellation by the day before:

No issue.

### Cancellation within 4 hours:

The customer should contact the shop and explain the reason.

Currently, this is handled through SMS/reminders and manual communication.

The new system should improve this process.

IMPORTANT:

Do not blindly hard-code business policy into UI strings everywhere.

Model the policy so it can evolve.

For example:

- cancellation policy
- minimum cancellation notice
- late cancellation behavior
- contact instructions

The exact UX and policy enforcement should be proposed before implementation.

---

# 21. SMS + Email

The business requires both:

## SMS

and

## Email

for customer communication.

Important notification scenarios may include:

- booking confirmation
- appointment reminder
- cancellation information
- changes/rescheduling
- potentially deposit-related messages

SMS is NOT optional.

Email is also required where appropriate.

Do not unnecessarily lock the application to one specific SMS provider yet.

Prefer an abstraction such as:

NotificationService
├── EmailProvider
└── SmsProvider

This allows providers to be changed later.

If actual provider integration is not yet configured, design the interface and implementation boundary cleanly.

---

# 22. Staff / Business Dashboard

There should be a separate staff/admin experience.

At minimum, staff should eventually be able to manage:

## Calendar

- appointments
- walk-ins
- availability
- blocked periods

## Staff

- add barber
- deactivate barber
- edit barber
- services they provide
- specialties

## Services

- create/edit service
- duration
- price
- active/inactive

## Customers

- customer details
- appointment history
- attendance history
- cancellation/no-show history
- deposit requirement

## Business Settings

- business information
- working hours
- cancellation policy
- notification settings

---

# 23. Working Hours

Current business hours:

08:00 → 19:00

But DO NOT hard-code this permanently.

Working hours should be represented as configurable business/staff availability.

The system should eventually support:

Business working hours

- Barber-specific availability
- Days off
- Exceptions
- Calendar blocks

Availability should be calculated from these constraints.

---

# 24. PostgreSQL

Use:

## PostgreSQL

Do not use MongoDB for this project unless there is a very strong architectural reason discovered during investigation.

The domain is highly relational:

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
Appointment Services
↓
Payments / Deposits
↓
Notifications

More importantly, appointment booking has concurrency and time-overlap requirements.

PostgreSQL should be used as the source of truth.

Consider PostgreSQL features such as:

- transactions
- foreign keys
- constraints
- indexes
- `tstzrange`
- exclusion constraints
- JSONB where flexibility is genuinely useful

Do not turn everything into JSON just for flexibility.

---

# 25. Suggested Domain Model

This is a starting point, NOT a final schema.

Investigate and refine it.

Potential entities:

### Business

- id
- name
- contact information
- location
- settings
- working hours

### StaffMember

- id
- businessId
- name
- active
- profile information

### StaffService

- staffId
- serviceId

### Service

- id
- businessId
- name
- description
- durationMinutes
- price
- active

### Customer

- id
- businessId
- name
- email
- phone
- createdAt

### CustomerIdentity

Potentially:

- customerId
- type
- value
- verifiedAt

### CustomerSession

For authenticated customer sessions.

### Appointment

Potential fields:

- id
- businessId
- customerId nullable
- staffId
- source
- status
- startAt
- endAt
- notes
- cancellation information
- attendance/outcome information
- createdAt
- updatedAt

### AppointmentService

- appointmentId
- serviceId
- duration
- price snapshot

IMPORTANT:

Consider storing service information as a snapshot where appropriate so historical appointments are not corrupted when a service later changes price/name/duration.

### WorkingHours

Business/staff availability.

### CalendarBlock

For:

- breaks
- days off
- maintenance
- private events
- unavailable periods

### Notification

- appointmentId
- customerId
- channel
- type
- status
- sentAt
- failure information

### Deposit / Payment

Design the model to support:

- deposit required
- deposit percentage
- deposit amount
- payment status
- provider reference

Do not overbuild the payment system if there is no provider yet.

---

# 26. Appointment Status / Lifecycle

Investigate a clean lifecycle.

Possible statuses:

- CONFIRMED
- COMPLETED
- CANCELLED
- NO_SHOW

Walk-in should generally be represented through source/type rather than necessarily being a completely separate appointment status.

Likewise, BLOCKED time is probably better represented as a CalendarBlock rather than pretending it is a customer appointment.

Do not blindly implement this list; analyze the domain and propose the cleanest model.

---

# 27. Important Calendar Logic

Availability must consider:

1. Business working hours
2. Staff working hours
3. Staff active/inactive state
4. Staff service capability
5. Existing appointments
6. Calendar blocks
7. Service duration
8. Requested barber
9. Any Barber
10. Current date/time
11. Cancellation/rescheduling rules
12. Potential future deposit requirements

Example:

Customer requests:

Haircut
Any Barber
Saturday
10:00

The availability engine must determine:

Which active staff members:

- work on Saturday
- can provide Haircut
- are available from 10:00 to 10:40

Only those staff members should be candidates.

---

# 28. Booking Architecture

Please explicitly design the booking flow before implementation.

Something conceptually like:

Booking Request
↓
Validate Service
↓
Calculate Duration
↓
Resolve Barber
↓
Check Business/Staff Availability
↓
Attempt Atomic Reservation
↓
Create Confirmed Appointment
↓
Commit Transaction
↓
Send Confirmation Notification

The exact architecture is up to you.

The important requirement is:

## Availability shown to the user is NOT the final guarantee.

The final booking operation must revalidate availability atomically.

---

# 29. Website

The public website should preserve the business's own brand.

It should NOT look like a marketplace.

Potential sections:

- Home
- Services
- Barbers / Team
- Gallery
- About
- Contact
- Location
- Booking

The exact information should be extracted from the current website/business content where available.

Do not invent business information.

Before implementing the public website, inspect the existing website/project and identify:

- existing pages
- services
- barbers
- business information
- images
- contact details
- booking behavior
- branding
- useful content

---

# 30. Architecture Relationship to AdaptiveAuth

The existing AdaptiveAuth project contains authentication/security patterns that may be useful.

You should inspect it and identify reusable concepts such as:

- session management
- CSRF protection
- refresh/session rotation
- RBAC
- typed errors
- validation
- shared types
- API conventions
- TypeScript conventions
- project organization

However:

## DO NOT make Crypto Barber Shop depend on AdaptiveAuth just because it is available.

The Crypto Barber Shop application should have a clean boundary.

If a package is genuinely reusable and stable, we may later extract/use it.

Otherwise, implement what this project actually needs.

Avoid creating unnecessary coupling between unrelated applications.

---

# 31. Technology Direction

Initial direction:

Frontend / Full-stack:

- Nuxt 4
- Vue
- TypeScript

Database:

- PostgreSQL

Potential later infrastructure:

- Redis
- background jobs
- object storage
- SMS provider
- email provider
- payment provider

But do not add infrastructure merely because it might be useful someday.

Every dependency should have a reason.

---

# 32. Future Multi-Tenant Evolution

Keep the following future possibility in mind:

Today:

Crypto Barber Shop
↓
One business
↓
One deployment

Future:

SaaS
├── Business A
├── Business B
├── Business C
└── Business D

Each business could eventually have:

- its own domain
- its own branding
- its own services
- its own staff
- its own customers
- its own calendar
- its own settings

But this is NOT part of the current implementation.

The current architecture should make this evolution possible without forcing us to build the SaaS platform now.

---

# 33. Things NOT to Build Yet

Unless explicitly requested, do NOT spend time implementing:

- multi-tenant onboarding
- custom domain automation
- DNS management
- domain purchasing
- subscription billing
- SaaS billing
- marketplace
- AI features
- advanced CRM
- advanced analytics
- complicated loyalty algorithms
- marketing automation
- mobile application
- complex payment infrastructure
- multi-business administration
- white-label infrastructure

These are potential future features.

Focus on making the actual Crypto Barber Shop product excellent.

---

# 34. Important Product Philosophy

The application should optimize for:

### Real business usability

not:

### Architectural complexity for its own sake.

Avoid both extremes:

BAD:
A quick demo that cannot safely handle real bookings.

Also, BAD:
A giant SaaS architecture that takes months before the actual barber shop can use it.

We want:

Production-quality core

- Simple current scope
- Good future evolution path

  ***

# 35. Before Coding — Required Analysis

DO NOT immediately start generating lots of code.

First inspect:

1. Existing AdaptiveAuth repository
2. Existing package structure
3. Existing coding conventions
4. Existing Nuxt application
5. Existing shared packages
6. Existing authentication/security patterns
7. Existing Crypto Barber Shop website/project if available

Then produce an architecture proposal.

The proposal should include:

## A. Repository / folder structure

Show exactly where the new application should live inside AdaptiveAuth.

For example:

AdaptiveAuth/
├── apps/
├── packages/
├── services/
├── crypto-barber-shop/
│ ├── ...
│ └── ...
└── ...

Explain why.

## B. Application architecture

Explain:

- frontend
- server/API
- database
- authentication
- domain layer
- booking engine
- calendar
- notifications

## C. Domain model

Provide the proposed entities and relationships.

## D. PostgreSQL schema

Provide the important tables, relationships, indexes, and constraints.

Especially explain the appointment-overlap strategy.

## E. Booking concurrency

Explain exactly how the system prevents double booking when two customers book simultaneously.

## F. Availability algorithm

Explain how available slots are calculated.

Include:

- service duration
- barber capability
- working hours
- existing appointments
- blocks
- Any Barber

## G. Calendar architecture

Explain how the Resource Timeline should work.

## H. Customer authentication

Explain the OTP flow.

Remember:

Guest booking remains possible without authentication.

## I. Appointment lifecycle

Explain:

Online booking
Phone booking
Walk-in
Cancellation
Completion
No-show
Deposit requirement

## J. Notification architecture

Explain Email + SMS abstraction.

## K. MVP vs Future

Clearly separate:

MVP
Nice-to-have
Future SaaS

---

# 36. First Implementation Priority

After the architecture proposal is approved, prioritize the core operational flow.

Recommended order:

1. Project foundation
2. PostgreSQL/database setup
3. Business/staff/service domain
4. Working hours / availability model
5. Appointment model
6. Concurrency-safe booking engine
7. Calendar
8. Public booking flow
9. Staff dashboard
10. Customer OTP account
11. Notifications
12. Customer attendance/no-show tracking
13. Deposit requirement foundation
14. Public website polish

The exact order may be adjusted if your architecture analysis shows a better dependency order.

---

# 37. Definition of Success

The first real milestone should allow the business to do something like:

A customer opens the website.

Chooses:

Haircut
→ Any Barber
→ Saturday
→ 10:00 AM

The system knows:

- which barbers can perform the service
- who is available
- how long the appointment takes
- whether the slot is actually available

The customer confirms.

The appointment is immediately confirmed.

The appointment appears on the staff Calendar under the assigned barber.

The customer receives confirmation/reminder through appropriate channels.

A staff member can also create a phone/walk-in appointment in the same Calendar.

The system prevents conflicting appointments.

The business can later mark the appointment:

Completed
or
No-show
or
Cancelled

That data can then influence future booking/deposit requirements.

If we can make this flow reliable and pleasant, we have built the foundation of the product.

---

# 38. Final Instruction

Treat this as a real product architecture task.

Do not rush into implementation.

First understand the existing AdaptiveAuth repository and the current business requirements.

Then propose a clean architecture.

Challenge assumptions where necessary.

If you identify contradictions or missing business rules, explicitly point them out.

Do not silently invent business behavior.

When something is unknown, label it as an assumption and explain why it matters.

The most important concepts are:

1. Real production-oriented application
2. PostgreSQL
3. Calendar as the operational core
4. Concurrency-safe booking
5. Dynamic number of barbers/staff
6. Service-specific durations
7. Any Barber
8. Auto-confirmed online bookings
9. Guest booking without login
10. Optional passwordless OTP customer accounts
11. Walk-in support
12. SMS + Email notifications
13. No-show / cancellation tracking
14. 20% deposit rule for problematic customers
15. One real business now
16. Future multi-tenant SaaS later
17. No premature SaaS infrastructure
18. Clean separation from AdaptiveAuth
19. Start inside the current AdaptiveAuth repository until a separate Git repository is created

Start with the analysis and architecture proposal.

Do not make large implementation changes until the architecture has been reviewed.
