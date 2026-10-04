# Phase 4A — Public Guest Booking Design

Status: **DESIGN ONLY. Awaiting approval. Do not start Phase 4B.**

This report answers `docs/ideas/barbershop/Phase4A.md`. It is grounded in the current `apps/barbershop` code after Phase 3B. It does not change schema, APIs, or UI until Phase 4B is explicitly approved.

Legend:

- **Existing (2B/3B)** — already implemented and reused
- **Proposed (4B)** — implement in Phase 4B
- **Deferred** — later than 4B

---

## 1. Executive summary

A guest books on their phone, without an account, and the appointment is confirmed immediately. The public site is a thin client of the Phase 2B scheduling engine: `checkAvailability` decides which times to show, and `reserveAppointment` is the only way a booking is created.

Two public HTTP routes already do this and already resolve the shop as the single `business` row. They are not a second engine. Phase 4B should tighten those adapters and add one read-only catalog, then build a mobile booking page on top. It should not reimplement slots, eligibility, overlap, or Any Barber.

The public UI offers **one service** at a time. The engine still accepts several services; the public request is limited to one so the phone flow stays simple and a client cannot submit a long stack of services. Any Barber stays “omit `staffMemberId`”. The assigned barber is a real staff member, chosen by the existing sort-order then id rule, and is shown only after the booking succeeds.

A shown time is not held. If someone else takes it, `reserveAppointment` returns the existing conflict, the page says that time is gone, reloads times, and asks the guest to pick another. There is no client-side hold, Redis, or approval queue.

Online bookings require a name and phone, which Phase 2B already enforces when `source` is `online`. Email and notes stay optional. The page reads `cancelNoticeHours` and `contactInstructions` from the business row. It does not hard-code “4 hours”, does not take payment, and does not pretend an SMS or email was sent.

## 2. Scope

**In scope for 4B**

- A public, mobile-first booking flow: service, barber or Any Barber, date and time, guest details, review, confirm, success.
- A read-only public catalog (shop, active services, eligible barbers, weekly shop hours, cancellation copy).
- Tightening the existing public availability and reserve adapters so they cannot be used as a staff back door.
- Conflict, closed-day, empty, and error states.
- Tests around the public contract and the guest happy path.

**Preserved**

- `reserveAppointment`, `checkAvailability`, GiST overlap, 10-minute alignment, guest columns, appointment-service snapshots, and staff calendar behavior.

## 3. Explicit non-goals

Customer accounts, OTP, customer login or sessions, CRM, loyalty, email, SMS, any notification call inside the booking transaction, payment providers, deposits collected online, refunds, multi-tenancy, custom domains, billing, Redis, queues, WebSockets, realtime availability, polling, marketplace, reviews, analytics, AI, drag-and-drop, reschedule, reassignment, customer self-service cancellation, a staff-hours editor, and RBAC changes.

Do not add `customer_id` or a Customer entity. Guest columns stay the appointment identity until a later phase links them.

## 4. End-to-end booking flow

```text
Guest opens /book
        │
        ▼
GET /api/booking          shop, services, barbers, hours, policy
        │
        ▼
Choose one active service
        │
        ▼
Choose Any Barber or one active barber who offers that service
        │
        ▼
Choose a shop-local date inside the horizon
        │
        ▼
GET /api/availability     10-minute starts from checkAvailability
        │
        ▼
Choose a returned start time
        │
        ▼
Enter name (required), phone (required), email and notes (optional)
        │
        ▼
Review the server-backed summary
        │
        ▼
Confirm Booking
        │
        ▼
POST /api/appointments    adapter forces source=online, then reserveAppointment
        │
        ├── 200  success state, status confirmed, assigned barber named
        ├── 409  slot/service/barber conflict → reload times, stay in the flow
        └── 400/404/500  field or generic error, no partial appointment
```

There is no “request booking” and no “awaiting approval” state. `reserveAppointment` inserts `status: 'confirmed'`.

The browser renders server slots and server snapshots. It does not decide that a time is free, what a service costs, how long it lasts, or which business id to write.

## 5. Booking state machine

One page, local state. No Pinia. The page does not import server scheduling code.

| State           | Guest sees                    | Primary action                        |
| --------------- | ----------------------------- | ------------------------------------- |
| `loading`       | Shop name skeleton            | none                                  |
| `catalog-error` | Retry                         | Retry                                 |
| `service`       | Active services               | Continue                              |
| `barber`        | Any Barber + eligible barbers | Continue                              |
| `when`          | Date strip + time buttons     | Continue                              |
| `guest`         | Name, phone, email, notes     | Review                                |
| `review`        | Summary + policy              | Confirm booking                       |
| `submitting`    | Disabled confirm              | none                                  |
| `success`       | Confirmed details             | Book another                          |
| `conflict`      | Time taken, times refreshed   | Pick another time (returns to `when`) |

`submitting` is the only state that calls reserve. Back from review returns to guest without a request. Confirm is not the same control as Review.

**What lives in the page**

- Selected service id, barber choice (`any` or a staff id), shop-local date, selected `startLocal`.
- Guest fields.
- Last catalog payload and last availability payload.
- The confirmation DTO after success.

**What is refetched**

- Catalog on first load, on retry, and if a reserve error says the service or barber is no longer valid.
- Availability when the When step is shown, when service, barber, or date changes, after a slot conflict, and when the document becomes visible again while the guest is on When or Review.

**Edits**

- Change service: clear barber if that person does not offer the new service, clear the selected time, keep the date if it is still inside the horizon.
- Change barber: clear the selected time and refetch.
- Change date: clear the selected time and refetch.
- A selected time that disappears from the new payload is cleared. The review step refuses to confirm without a current slot.

**Stale review**

Confirm sends the ids and the shop-local start, not a price. If the service changed duration and the start no longer fits, the existing reserve errors apply and the guest returns to When. If it still fits, the booking succeeds and the success screen shows the **returned** snapshot (name, duration, price, end time), which may differ from the earlier review. The success screen is the authoritative receipt.

## 6. Service selection

Services come from `GET /api/booking`, which reads active rows for the resolved business. Inactive services are omitted. Nothing is hard-coded.

Each card shows name, description when non-empty, duration in minutes, and price formatted from `priceCents` and `currency`. Sort by `sortOrder`, then name.

**One service in the public UI.** Phase 2B already sums duration, requires the barber to offer every selected service, and writes one `appointment_service` snapshot per id, in request order. That capability stays. The public schema accepts `serviceIds` with **length 1**. The staff reserve path is unchanged and can still send several ids.

Reasoning: on a phone, one choice is one duration, one price, and a clear eligibility list. Multi-select makes the guest do arithmetic the server will redo, and it makes “this barber can do the visit” harder to explain. A later phase can relax the public max from 1 to many without a new reservation engine.

Empty catalog: “No services are available to book online right now.” No time step.

## 7. Barber selection

After a service is chosen, the page lists:

- **Any Barber**
- each **active** staff member linked to that service through `staff_service`

Inactive barbers and barbers who do not offer the service are not shown. Names and specialties come from the catalog, not from constants. Order matches `pickBarberOrder`: `sortOrder`, then id. That is the same order Any Barber tries.

If the guest deep-links a barber who cannot do the service, the page drops that choice and stays on the barber step with a short message.

If nobody offers the service, the barber step says so and does not invent a slot list.

## 8. Any Barber behavior

The guest does not pick a person. The client omits `staffMemberId` on both availability and reserve. It never sends a sentinel id, and it never stores “Any Barber” in `staff_member_id`.

`checkAvailability` already unions eligible barbers and **omits** `staffMemberId` on those slots, so the public response does not reveal which chair made a time free. `reserveAppointment` already locks the business, walks candidates in `pickBarberOrder`, locks each staff row, rechecks hours, blocks, and occupying appointments, and retries the next barber on a unique-exclusion conflict (`23P01`). Phase 4B calls that function. It does not reimplement the walk.

Copy on the barber step and on review:

> We’ll assign the first available barber. You’ll see who it is once the booking is confirmed.

The success screen names the real barber from the reservation response. Until then the UI says “Any Barber”, not a guessed name.

## 9. Availability design

The browser paints `AvailabilityResult.slots`. It does not run `generateSlotStarts`.

`checkAvailability` already accounts for business hours, staff hours (shop ∩ staff when staff hours exist), summed duration, eligibility, occupying appointments (`confirmed` and `completed`), staff blocks and shop-wide blocks, the business timezone, DST gaps, and “start is not in the past”. Closed shop days return no slots because there is no business-hours row. Cancelled and no-show visits do not occupy, so they do not remove times. That behavior stays.

**Proposed (4B), additive:** add `closed: boolean` to the availability result. It is true only when that weekday has no business-hours row. Today an empty `slots` array means closed, fully booked, barber off, or no eligible barber. The page needs “Closed” versus “No times left”. This is a field on the existing read model, not a new slot algorithm. When the guest named a barber and that barber is inactive or ineligible, the use case already throws; the page treats that as “choose another barber”, not as a closed shop.

A slot on screen is a hint. Only a successful `reserveAppointment` holds the chair.

## 10. Date and time design

**Timezone source of “today”.** The catalog includes `today` as `YYYY-MM-DD` in the business timezone. The date strip starts there. The browser’s local date is not the minimum.

**Past dates.** Not selectable. The public reserve adapter also rejects a start instant before `now` in the business timezone (see the Phase 2B gap). Staff booking is not given that rule.

**Horizon.** There is no booking-horizon column. Do not add one in Phase 4.

Proposed product rule, pending approval: the public date strip is **21 shop-local days, including today** (`PUBLIC_BOOKING_HORIZON_DAYS = 21` next to the public booking use case). Days outside that window are not requested. This is an application constant so the phone UI and the public adapter share one bound. It is not a second slot interval and not a schema setting. 14 and 28 are the alternatives; 21 is the recommendation because it is about three shop weeks and keeps the strip small.

**Closed days.** If `closed` is true, the day stays on the strip, is not offered as a time list, and reads “Closed”.

**Open with no slots.** “No times left on this day.” The guest can move to another day. That covers a full book, a barber who is off, and a visit that no longer fits before close.

**Today.** Included. `generateSlotStarts` already drops starts before `now`, so a 10:07 request does not return 10:00. If nothing remains, the copy is “No times left today.”

**Navigation.** Previous/next day within the horizon, plus a horizontal day strip (weekday short name + day number). No free-form date that can escape the horizon. Deep link `date` outside the horizon or malformed falls back to today.

**Time presentation.** Only returned `startLocal` values, as buttons, in shop-local `HH:mm`. Group under hour headings (10, 11, 12) so a 10-minute grid does not look like an unbroken wall. Do not use `<input type="time">`; it would allow times the server did not offer. The 10-minute grid stays `SLOT_INTERVAL_MINUTES`. The client does not declare another interval.

Selecting a time stores `localDate` + `startLocal` from that slot. Reserve sends those two fields, not a client-computed UTC instant, so DST conversion stays in `localToInstant`.

## 11. Timezone and DST

Every date, slot, and “today” is interpreted in `business.timezone` (seeded `America/Vancouver`). The page says “Times shown in {timezone}” using the id from the server.

If `Intl` says the phone zone differs from the shop zone, add one line: “These times are the shop’s local time.” Do not convert slots into the phone zone. Two clocks on one button cause wrong bookings.

Spring-forward gaps are already skipped by `generateSlotStarts` and rejected by `localToInstant`. Fall-back keeps the earlier instant, which is the Phase 2B rule. The UI never repairs those cases itself.

Success shows start and end in shop-local time plus the timezone id.

## 12. Guest information

No account, no OTP, no password.

| Field | Required       | Rules                                                  | Mobile input                  | Notes                                                    |
| ----- | -------------- | ------------------------------------------------------ | ----------------------------- | -------------------------------------------------------- |
| Name  | yes            | trim, 1–80 characters (`assertName`)                   | `text`, autocomplete `name`   | Stored in `guest_name`                                   |
| Phone | yes for online | trim, non-empty, max 40                                | `tel`, autocomplete `tel`     | Phase 2B already rejects online bookings without a phone |
| Email | no             | if present, existing email check, max practical length | `email`, autocomplete `email` | Omit the field when blank; do not send `""`              |
| Notes | no             | trim, max 500                                          | `textarea`                    | Visit notes only, not a message thread                   |

Show field errors under the field and a summary on submit for screen readers (`aria-invalid`, `aria-describedby`). Do not add a phone-library or E.164 requirement in this phase; the domain only checks that online phone is non-empty. A stricter phone format would be a domain change and is not required to book.

Normalization is trim only, matching reserve. The client may trim before submit; the server trims again.

## 13. Review and confirmation

Review is a summary, not a second editor. It shows:

- service name, duration, price
- “Any Barber” or the selected barber’s name
- shop-local date, start, and end (start + duration from the last availability payload)
- guest name and phone; email and notes only if provided
- timezone line
- cancellation summary from the catalog
- shop phone

Two different controls:

- **Review** moves from guest details to this screen and does not call reserve.
- **Confirm booking** is the only control that POSTs. It is a sticky footer button on small screens, disabled while `submitting`, with visible text “Confirming…” so a double tap does not fire two requests. The server and the exclusion constraint still decide if two requests race.

The POST body is service id, optional staff id, name, phone, optional email and notes, `localDate`, and `startLocal`. It does not include price, duration, timezone, or business id.

## 14. Reservation and concurrency

Sequence the page must implement:

1. Guest sees a slot from `checkAvailability`.
2. Another guest or the staff calendar takes it.
3. Guest confirms.
4. `reserveAppointment` locks the business row, then the barber, rechecks occupancy and blocks, and either inserts or hits the exclusion constraint.
5. Conflict surfaces as `409` with code `SLOT_UNAVAILABLE` (or `CALENDAR_BLOCKED` / `OUTSIDE_WORKING_HOURS` when that is the real reason).
6. The page says “That time was just taken.” It does not say the whole day failed.
7. It refetches availability and returns to When with the time cleared.
8. The guest picks another returned time. Guest details stay filled in.

No temporary reservation row, no Redis lock, no client mutex that skips the server.

Any Barber may still succeed when the guest’s first-choice chair was taken, because reserve tries the next eligible barber. The success screen then names whoever was actually assigned. If every eligible barber fails, the same conflict path runs.

**HTTP mapping** (existing `throwDomain`, unchanged):

| Code                                                        | HTTP      | Guest-facing meaning                                 |
| ----------------------------------------------------------- | --------- | ---------------------------------------------------- |
| `SLOT_UNAVAILABLE`                                          | 409       | That time was just taken. Pick another.              |
| `CALENDAR_BLOCKED`                                          | 409       | That time is no longer available.                    |
| `OUTSIDE_WORKING_HOURS`                                     | 409       | That time is outside shop hours.                     |
| `SERVICE_INACTIVE` / `SERVICE_NOT_FOUND`                    | 409 / 404 | That service is no longer offered. Back to services. |
| `STAFF_INACTIVE` / `STAFF_NOT_ELIGIBLE` / `STAFF_NOT_FOUND` | 409 / 404 | That barber can’t take this visit. Back to barbers.  |
| `VALIDATION_ERROR` / `INVALID_NAME` / `INVALID_TIME`        | 400       | Fix the form, or the start is not a valid shop time. |
| malformed body                                              | 400       | Check the booking fields.                            |
| unexpected                                                  | 500       | Something went wrong. Try again. No stack trace.     |

`409` after confirm always refetches availability before another confirm. `400` on guest fields stays on the form. `500` stays on review with retry.

## 15. Cancellation policy

The guest cannot cancel online in Phase 4.

Copy uses the business row, not a literal 4:

> To cancel or change this appointment, contact the shop at least {cancelNoticeHours} hours ahead.

Then the shop phone and `contactInstructions` when that text is non-empty. `lateCancelBehavior` stays `contact_shop` in the seed; the page does not branch into fees or automatic cancels. The same block appears on review and on the success screen.

`cancelNoticeHours` is an integer the staff business screen already validates as 0–72. The public page prints that integer.

## 16. Payment and deposit

No payment UI, no provider, no deposit charge, no fake paid state.

`depositPercent` exists (seeded 20) and means nothing until a provider exists. The booking page **does not mention a deposit**. Showing “20% due” without a way to pay would be a false charge. Booking stays allowed. The column remains for a later payments phase.

## 17. API contract proposal

Authentication: none of these three routes use the staff session.

`businessId` is not a parameter.

### `GET /api/booking` — proposed

New read use case `getPublicBookingContext`. No scheduling writes.

Response:

- `shop`: name, phone, email, address lines, city, timezone, `today`, `cancelNoticeHours`, `contactInstructions`
- `services`: id, name, description, durationMinutes, priceCents, currency, sortOrder (active only)
- `barbers`: id, name, specialty, sortOrder, `serviceIds` they offer (active only)
- `hours`: seven weekdays, each `{ weekday, closed, startLocal, endLocal }` for **business** hours
- `horizonDays`: the approved constant

Not included: staff users, password hashes, sessions, appointments, guest data, calendar-block titles, deposit percent.

### `GET /api/availability` — existing, keep

Query: `localDate=YYYY-MM-DD`, `serviceIds` (one uuid on the public client), optional `staffMemberId`.

Calls `checkAvailability` with the resolved business id.

Response: `timezone`, `durationMinutes`, `closed`, `slots[]` of `{ startAt, startLocal }`. When a specific barber was requested, the existing `staffMemberId` on each slot may remain; Any Barber slots stay without it.

Validation: date must match `YYYY-MM-DD`, must not be past in the shop zone, must be inside the horizon. Service ids must be uuids. Unknown query `businessId` is ignored.

### `POST /api/appointments` — existing, tighten

Body:

- `serviceIds`: array of one uuid
- `staffMemberId`: optional uuid
- `guestName`, `guestPhone`, optional `guestEmail`, optional `notes`
- `localDate`, `startLocal`

The adapter **sets `source` to `online` and drops any client `source` or `startAt`**. A public caller must not create `staff_created`, `phone`, or `walk_in`, and must not send a pre-baked instant that skips local-time checks.

Then it calls `reserveAppointment`.

Success body (shaped, not the raw row):

- id, status `confirmed`, source `online`
- staffMemberId, staffName
- localDate, startLocal, endLocal, timezone
- guestName
- services: snapshot name, duration, priceCents, currency
- totalPriceCents, currency

Do not return guest phone, email, or notes in the JSON. The page already has them. Do not add `GET /api/appointments/:id`. A public read-by-id would expose guest PII to anyone who can guess a uuid.

## 18. Business resolution

This is one shop site, not multi-tenancy.

The existing public handlers already do `select id from business limit 1` and pass that id into the use cases. Phase 4B keeps server-side resolution and still refuses a client `businessId`.

**Proposed tightening:** resolve only when the table contains **exactly one** business. Zero rows: `400` “Business is not configured.” More than one: `500` configuration error and do not pick `limit 1`. Today `limit 1` would silently bind the public site to an arbitrary row if a second shop were ever inserted. Failing closed is the single-business rule. It is not a tenant resolver and does not introduce domains.

Staff routes keep taking `businessId` from the staff session only. Public and staff must not share a client-supplied id.

## 19. Security and abuse

**In Phase 4B**

- Zod on every public body and query. Reject extra scheduling authority fields by not reading them.
- Server loads price, duration, eligibility, hours, and business id from PostgreSQL inside the existing use cases.
- Public reserve cannot set source or `startAt`.
- Public reserve rejects past shop-local starts before insert.
- Availability responses contain no guest names, phones, or notes.
- Catalog contains no staff login data.
- Errors are short sentences plus a `code`. No SQL text.
- In-process limit on `POST /api/appointments`: 8 creates per IP per 10 minutes, `429` with “Please wait and try again.” This process has one Node server and no Redis. The limit resets on restart and does not coordinate across instances. That is acceptable here and is not a reason to add Redis.
- Guest notes are stored as text, rendered as text on the staff calendar (already true).

**Later, not Phase 4**

- Shared rate limits, bot scoring, CAPTCHA, WAF rules.
- A public appointment lookup token.
- Stricter phone parsing.
- Hiding staff UUIDs. The guest must send a barber id to choose one; the id is an identifier, not a secret. What must stay private is other people’s visits and staff credentials.

Availability GETs are not throttled in Phase 4 beyond normal server limits. They are cache-free reads. Document them as the first place to add a limit if logs show abuse.

## 20. Mobile-first UX

Design the flow at 390px wide first. Desktop is the same steps in a narrower column (`max-w-lg`), not a multi-column wizard.

- One step on screen. A text step indicator: Service, Barber, Time, Details, Review.
- Primary button full width, at least 44px tall, sticky to the bottom of the viewport on Service through Review.
- Service and barber choices are full-width buttons, not a tiny radio list. Selected state is a border and text, not color alone.
- Time buttons are at least 44px, two columns, hour groups.
- Date strip scrolls horizontally; each day chip is at least 44px.
- No hover-only action. No drag.
- Price and duration sit on the service card in the same type size as the name’s secondary line.
- Loading: the step keeps its heading and replaces the list with “Loading times…” / “Loading services…”.
- Inputs use the types in the guest table so phones show the right keyboard.

Tablet and desktop: same column, more whitespace, date strip can show the full horizon without feeling like a different product. Do not put a staff-style resource timeline on the public site.

## 21. Navigation and state

**Hybrid, one route.**

- Canonical flow: `/book`
- Query: `service`, `barber` (`any` or uuid), `date` (`YYYY-MM-DD`)
- Guest fields, the selected time, review, and success are **not** in the query. A shared URL must not contain a phone number, and refresh must not put PII in history.

`/` stays a short public intro: shop name from the catalog, one line, and **Book an appointment** to `/book`. Keep a text link to the staff dashboard. Replace the current “public booking comes later” copy. Do not make `/` the wizard; the staff link and the booking flow stay distinct.

Back:

- In-page Back moves one step and updates the query.
- Browser Back should move steps because the query changes. Use `router.replace` for corrections (invalid deep link) and `router.push` for intentional step changes so Back is predictable.
- From success, Back must not return to a live Confirm button. After a successful POST, replace the history entry so Back leaves `/book` or opens a clean service step, and ignore a second submit.

Refresh:

- Refresh on Service, Barber, or When restores those choices from the query, then refetches catalog and, if When, availability.
- Refresh on guest or review loses typed details and returns to When with the query intact. Accept that. Do not put the phone in `sessionStorage`.
- Refresh on success: keep the confirmation DTO in `sessionStorage` under a fixed key, with no phone or email. If it is missing, show the service step and do not claim a booking.

Invalid deep link (bad uuid, inactive service, impossible date): ignore the bad part, stay on the earliest valid step, no crash.

## 22. Error, loading, and empty states

| Situation                        | What the guest sees                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------- |
| Catalog loading                  | Step skeleton, no fake services                                                             |
| Catalog network/500              | “We couldn’t load the shop. Try again.” plus Retry                                          |
| No active services               | Empty service step, no continue                                                             |
| No eligible barbers              | Empty barber step for that service                                                          |
| Closed day                       | Day chip “Closed”, no time buttons                                                          |
| No slots                         | “No times left on this day.”                                                                |
| Times loading                    | “Loading times…” and disabled continue                                                      |
| Network failure on times         | Retry on the When step                                                                      |
| Slot conflict                    | “That time was just taken.” Times reload                                                    |
| Service deactivated mid-flow     | Back to services, selection cleared                                                         |
| Barber deactivated or ineligible | Back to barbers                                                                             |
| Shop row missing                 | “Booking is not available right now.”                                                       |
| More than one shop row           | Same generic configuration message, no row picked                                           |
| Guest validation                 | Field errors, stay on details                                                               |
| 429                              | “Please wait a moment and try again.” Stay on review                                        |
| 500 on confirm                   | “We couldn’t complete the booking. Try again.” Stay on review. Do not show a success screen |

Conflicts are recoverable and say so. Generic failures do not look like “time taken”, because those two actions differ: pick another time versus try the same booking again.

## 23. Success state

Heading: **Booking confirmed.**

Show service name, duration, price from the **response snapshots**, assigned barber name (never “Any Barber” after success), shop-local date, start and end, guest name, timezone, cancellation paragraph, shop phone, and contact instructions.

Do not say an email or SMS was sent.

**Reference:** display the first 8 characters of the existing appointment uuid, uppercased, labeled “Reference”. The full uuid is already the primary key. No new column and no confirmation-number sequence. The short form is for reading to the shop; it is not a secret login. Do not offer a link that loads the visit by that reference.

A “Book another” action clears guest fields and the stored confirmation and returns to the service step.

## 24. Accessibility

- Native buttons and inputs. Step changes move focus to the step heading.
- The step indicator is text, and the current step is on the heading, not only a colored dot.
- Time and service choices are real buttons with accessible names that include the time or service and price.
- Errors use `aria-invalid` and an `aria-live="polite"` summary.
- Focus rings stay visible. Touch targets are at least 44px.
- The date strip is a group of buttons, keyboard reachable, not a drag-only scroller.
- No modal is required. If a later polish adds one, it must be a dialog with a name and a close control. Phase 4B can ship without one.
- Color is not the only selected or error signal.

## 25. Testing strategy

No Playwright in this app. Do not add a browser harness in Phase 4B. Follow the Phase 3B split: pure functions in Vitest, real PostgreSQL for reservation, and a manual browser pass for the phone flow.

**Unit**

- Booking state transitions: service change clears an ineligible barber and the time; date change clears the time; conflict returns to When and keeps guest fields.
- Horizon and “today” helpers using a fixed clock, not the machine zone.
- Public request mapping: one service id, omitted staff id for Any Barber, source forced online, blank email omitted.
- Price formatting from cents. The mapper does not accept a client price.

**PostgreSQL integration** (extend the existing scheduling suite; do not replace it)

- Guest online reserve creates `confirmed`, source `online`, snapshot name/duration/price/currency.
- Inactive service, ineligible barber, closed day, calendar block, and a taken slot fail with the existing codes.
- Two concurrent reserves of the same barber and start: one commit, no orphan appointment, the other `SLOT_UNAVAILABLE`.
- Two concurrent Any Barber reserves: both may succeed on different barbers, or one fails if only one eligible barber is free. Assert no overlapping occupying rows for one barber.
- A second business id cannot read or write the first shop’s services through the use case (the public adapter never receives a client business id).
- Past shop-local start is rejected by the public adapter test and is still allowed through the staff use case if that is how staff booking works today.

**HTTP**

- `GET /api/booking` returns active services only and no `businessId` input.
- `POST /api/appointments` ignores `source: staff_created` and `businessId`, and rejects a missing phone.
- Conflict response is 409 with `SLOT_UNAVAILABLE`.
- Malformed body is 400.

**Manual browser pass for 4B**

- Phone width: one service, Any Barber, a time, confirm, success names a real barber.
- Specific barber path.
- Closed day and a full day.
- Two browsers confirm the same slot; the second sees the conflict and can pick another time.
- Refresh on When keeps the query and reloads times. Refresh on success does not show someone else’s data.

## 26. Proposed file structure

Public UI:

- `app/pages/index.vue` — short intro and link to `/book`
- `app/pages/book.vue` — state machine and fetches only
- `app/components/booking/` — service, barber, when, guest, review, success, progress
- `app/utils/booking-types.ts` — client DTO types
- `app/utils/booking-state.ts` — pure transitions, tested without Vue

Application, new read model only:

- `server/application/booking/get-public-booking-context.ts`
- `server/application/booking/public-reservation.ts` — force `online`, reject past starts and out-of-horizon dates, then call `reserveAppointment`

Domain and scheduling stay where they are. The only scheduling edit proposed is the additive `closed` flag inside `checkAvailability`.

Nitro:

- `server/api/booking.get.ts` — new
- `server/api/availability.get.ts` — horizon and date checks, pass through `closed`
- `server/api/appointments.post.ts` — stop trusting source, `startAt`, and implicit `limit 1` if a second business exists
- `server/validation/config.ts` — public body: one service id, no source field

Reuse without modification unless the `closed` flag is approved:

- `checkAvailability`, `reserveAppointment`, `pickBarberOrder`, `generateSlotStarts`, `localToInstant`, occupancy and block overlap, snapshot writes, staff calendar, staff reserve (which may still rewrite `online` to `staff_created`).

Vue must not import `server/domain` or open the database. Components emit choices. `book.vue` calls `$fetch`.

## 27. Phase 4B definition of done

Phase 4B is done when all of the following are true:

1. A guest can open `/book` on a phone, choose one active service, choose Any Barber or a specific eligible barber, choose a shop-local date and a server-returned time, enter name and phone, review, and confirm.
2. The appointment row is `confirmed`, `source` is `online`, `staff_member_id` is a real barber, and `appointment_service` holds the database snapshot.
3. Any Barber never persists a fake staff id, and the success screen shows the assigned name.
4. A conflicting confirm shows a recoverable message, refetches times, and does not leave an extra occupying row.
5. Closed days and empty days are distinguishable.
6. Cancellation text uses `cancelNoticeHours` and contact instructions from the database.
7. No payment, deposit prompt, email, or SMS is shown or sent.
8. Public requests cannot set `businessId` or a non-online source.
9. Past dates and dates outside the approved horizon are rejected on the public adapter.
10. Lint, type-check, unit tests, PostgreSQL integration tests, production build, and the manual phone browser pass have been run, with skips stated honestly.
11. Staff calendar behavior from Phase 3B still passes its existing tests.
12. No Phase 5 notification work has started.

## 28. Open decisions requiring approval

1. **Single public service.** Approve limiting the public body to one service id while leaving `reserveAppointment` multi-service capable.
2. **Horizon of 21 shop-local days**, as a code constant, not a new business setting. Say if you want 14 or 28 instead.
3. **`closed` on availability.** Approve the additive boolean so the page can say “Closed” rather than “No times left”.
4. **Past starts.** Approve rejecting them only on the public online adapter, not inside staff `reserveAppointment`.
5. **Force `source: online`** on `POST /api/appointments` and ignore client `source` and `startAt`.
6. **Exactly one business row** or the public site refuses to book. Approve failing closed instead of `limit 1`.
7. **Short reference** from the existing uuid, no new column, no public GET-by-id.
8. **Do not show deposit percent** until payments exist.
9. **In-process POST limit** of 8 bookings per IP per 10 minutes, without Redis.
10. **Routes:** `/` intro, `/book` wizard, query holds service, barber, and date only.
11. **No Pinia, no Playwright, no customer cancel.**

## 29. Phase 2B dependencies and gaps

These are real. None of them require a new scheduling engine. Do not “fix” them by rewriting overlap, Any Barber, or the slot interval.

| Gap                                                                                                                       | Why Phase 4 cares                                                                                                  | Blocking?                                                               | Smallest fix                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Public `POST /api/appointments` accepts `source` including `staff_created`, `phone`, and `walk_in`, and accepts `startAt` | A guest client could mis-label a visit or bypass local-time conversion                                             | Yes, for a public site                                                  | In the public adapter only: force `online`, require `localDate` + `startLocal`, drop `startAt`        |
| `reserveAppointment` does not reject a start in the past                                                                  | Availability hides past slots, but reserve will still insert one if asked. Staff same-day corrections rely on that | Yes for guests, no for staff                                            | Public adapter compares the shop-local start with `now` and returns 400. Do not change the staff path |
| Empty availability means closed, full, or barber-off                                                                      | The brief asks for a closed-day state                                                                              | No, if we accept a vague empty state. Yes, if “Closed” must be accurate | Add `closed: boolean` inside `checkAvailability` when the business-hours row is missing               |
| Public reserve returns the raw appointment row and no barber name                                                         | Success must name the assigned barber and should not echo phone/email                                              | Yes for the success screen                                              | Shape the adapter response and look up the staff name in that adapter                                 |
| No public catalog                                                                                                         | Staff service and team routes require a session                                                                    | Yes                                                                     | New read use case and `GET /api/booking`                                                              |
| No horizon setting                                                                                                        | An open-ended public calendar is a poor phone UI and an easy availability hammer                                   | No for correctness, yes for the proposed UX                             | Constant in the public booking module after approval. Not a migration                                 |
| `limit 1` business lookup                                                                                                 | A second row would bind the public site arbitrarily                                                                | No while one shop exists                                                | Fail when the count is not 1                                                                          |
| Online phone is non-empty only                                                                                            | Weak numbers can be stored                                                                                         | No                                                                      | Keep the Phase 2B rule                                                                                |
| No rate limiter in the repo                                                                                               | Public POST can be scripted                                                                                        | No for correctness                                                      | Small in-process limit on POST only                                                                   |
| Shop-wide block vs staff block                                                                                            | Unchanged 2B behavior: availability already treats a shop-wide block as busy for each barber via `blocksForBarber` | No                                                                      | Do not change                                                                                         |

No schema migration is proposed.

---

Phase 4A stops here. Phase 4B starts only after these decisions are approved.
