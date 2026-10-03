# Phase 3A — Staff Calendar & Staff Workflow Design

Status: **DESIGN ONLY. Awaiting approval. Do not start Phase 3B.**

This report is grounded in the current `apps/barbershop` code after Phase 2B approval. It does not change schema, APIs, or UI until Phase 3B is explicitly approved.

Legend:

- **Existing (2B)** — already implemented
- **Proposed (3B)** — implement in Phase 3B
- **Deferred** — later than 3B

---

## 1. Scope

**In scope for 3B**

Staff Calendar as the operational day view: see the schedule, add walk-ins that occupy a chair, create/cancel calendar blocks, cancel / complete / no-show appointments, navigate dates, and do this on phone, tablet, and desktop.

**Out of scope (unchanged from the brief)**

Public booking UI, customer accounts, OTP, notifications, payments, loyalty, analytics, multi-tenancy, custom domains, Redis, queues, new API frameworks, scheduling-engine redesign, drag-and-drop, a separate walk-in engine.

---

## 2. Goals

1. Give the floor a single daily picture of who is booked, blocked, or free.
2. Reuse Phase 2B use cases. Nitro stays an HTTP adapter.
3. Mobile-first: a barber can run the day from a phone. Larger screens get the multi-column timeline.
4. Keep the state machine and authorization model small.

---

## 3. Non-goals

- Recreating availability or reservation logic in Vue or Nitro handlers
- A third-party calendar widget
- Realtime / WebSockets
- Per-role RBAC beyond “signed-in staff of this shop”
- Reschedule / reassign as a first-class use case
- Editing staff-specific working hours in the dashboard (schema already supports them; no Hours UI for staff yet — that stays a later config gap)
- Multiple working intervals per weekday

---

## 4. User workflows

All workflows assume a signed-in `staff_user`. `businessId` always comes from the session.

### 4.1 Open today

Land on Calendar (new default after login). Selected date = today in `business.timezone`. One request loads the day.

### 4.2 Scan the day

- **Phone:** one barber column + barber switcher.
- **Tablet/desktop:** Resource Timeline, one column per barber on that date.

### 4.3 Open an appointment

Tap the block → details sheet → Cancel / Complete / No-show (confirmed only).

### 4.4 Add a walk-in that occupies a chair

“Add walk-in” → name (required), phone optional, services, barber or Any Barber, start (Now or a later slot) → `reserveAppointment({ source: 'walk_in' })`.

Quick cuts that do **not** affect later availability are **not entered**. That is a staff decision, not a second engine.

### 4.5 Block time

“Block time” → title, start, end, staff-specific **or** shop-wide → `createCalendarBlock()`. Remove via `cancelCalendarBlock()` (new).

### 4.6 Closed day

Shop has no business-hours row for that weekday: closed banner, no bookable grid. Staff can still open another date.

---

## 5. Calendar UX design

### 5.1 Model

Resource Timeline:

- **X-axis (rows):** local time, 10-minute grid (existing slot invariant).
- **Y-axis (columns):** barbers, `sort_order` then `id`. Count is data-driven. Never hard-code 5.

Appointments are positioned by `start_at`/`end_at` converted to the business timezone. Height = duration. Blocks are a second visual type on the same grid.

### 5.2 Visible hours

Do **not** hard-code 08:00–19:00.

For the selected local date:

1. If there is no business-hours row → closed. No timeline.
2. Otherwise the grid spans the business interval for that weekday, padded 0 minutes (shop open window is enough).
3. Each column shades **effective** hours: business ∩ staff hours when staff hours exist; otherwise business hours. Outside effective hours is a distinct “unavailable” fill, not empty bookable space.

Overnight hours are not in the current one-interval model. Do not invent them.

### 5.3 Time scale and scrolling

- One CSS Grid row = 10 minutes.
- Desktop/tablet row height ≈ 28px. Mobile ≈ 36px (touch).
- Vertical scroll is the timeline body; toolbar (date, barber switcher, actions) stays sticky.
- Horizontal scroll of **barber columns** is **not** used on mobile. On desktop, if columns cannot fit (~≥9), the columns region scrolls horizontally with a sticky time-axis. That is the only justified horizontal scroll: overflow of a dense operational grid on a wide screen, not a mobile pattern.

### 5.4 Appointment sizing

- Position from start offset within the visible window; height from duration.
- **Short (10 min):** one row, still tappable because mobile row height is 36px. Compact card shows name only.
- **Long:** block grows; text can clip with ellipsis; full text is in the details sheet.
- **Spanning closed/unavailable:** still rendered if data exists; visually sit on the grid. Engine already forbids booking outside hours; historical/error data should not crash the layout.

### 5.5 Overlap

Occupying appointments cannot overlap a barber (GiST + transaction). Shop-wide blocks overlay every column.

The UI does **not** implement overlap layout. If corrupt data appears, stack with a warning and still refetch — do not silently hide.

Cancelled and no-show **do not occupy**. They are **omitted from the grid** (they would look like free time collisions). They are not a customer-history feature in 3B.

### 5.6 Empty slots

Empty cells in an effective-hours region are free.

- Tablet/desktop: tap empty cell opens Add with barber + start prefilled (`staff_created` or walk-in chooser).
- Mobile: primary “Add” in the toolbar; empty-cell tap still allowed on the focused barber column.

### 5.7 Shop-wide vs staff blocks

- Staff block: only that column, muted fill, title.
- Shop-wide block: same fill on **every** column plus a one-line banner under the toolbar (“Staff meeting 10:00–11:00”). No fake “Shop” resource column.

### 5.8 Current time

If selected date is today in the business timezone, a horizontal “now” line across the visible columns. If now is outside the visible window, omit the line (do not extend the grid just for it).

### 5.9 Date navigation

Toolbar: Previous day, **Today**, Next day, native `type="date"` (mobile-friendly, no extra date library).

Selected date is client state: `YYYY-MM-DD` in the business timezone. Changing it refetches the calendar endpoint. Deep link: `/app/calendar?date=YYYY-MM-DD`.

### 5.10 Columns as barber count grows

| Active barbers on that date | Desktop / tablet | Mobile |
| --- | --- | --- |
| 1 | One column, full width | Same |
| 2–5 | Equal columns | One focused column + switcher |
| 6–8 | Narrower columns, still no horizontal scroll if viewport ≥ ~1024px | Same switcher |
| 9+ | Horizontal column scroll, sticky time gutter | Same switcher |

**Who appears as a column:** active `staff_member`s **plus** anyone with an occupying appointment or active staff-specific block on that date (so deactivating a barber mid-day does not hide remaining bookings).

---

## 6. Appointment card design

### Compact (on the grid)

Show only:

- Guest name
- Start–end (or start + duration if height is one row)
- Source mark: `W` walk-in, `P` phone, `W` wait — use short labels: Walk-in / Phone / Online / Staff
- Confirmed: no status chrome. Completed: distinct completed styling if still shown (completed remaining occupying **is** shown)

Do **not** put phone, notes, barber name (redundant with column), or full service list on the compact card.

### Details sheet (tap)

- Name, phone, email
- Services (snapshot names + minutes)
- Start / end / duration / timezone (business local)
- Barber
- Source
- Status
- Notes
- Actions for `confirmed` only: Complete, No-show, Cancel
- No “customer profile”, history, or CRM

Click/tap the block opens the sheet. There is no hover-only reveal.

---

## 7. Walk-in workflow

Reuse **existing** `reserveAppointment`. Do not add a WalkIn table or use case.

```
reserveAppointment({
  businessId: session.businessId,
  source: 'walk_in',
  guestName,
  guestPhone?,
  serviceIds,
  staffMemberId?,  // omit = Any Barber
  localDate,
  startLocal,
})
```

Existing staff POST already maps `source: 'online'` → `staff_created`. Walk-in must send `walk_in` explicitly so the card can show it.

**Any Barber:** omit `staffMemberId`. Engine picks `sort_order` then `id`, retries on exclusion. UI then shows the assigned barber.

**Specific barber:** send that id. Column tap prefills it.

**Immediate start:** staff taps “Now”. Client rounds current business-local time **down** to the current 10-minute slot if that start is still ≤ now and the duration still fits; otherwise the **next** 10-minute slot. The 10-minute grid stays. Walk-ins are not allowed to bypass `assertSlotAligned`.

This is **not** a Phase 2B flaw. “Arrive at any time” means staff judgment + rounded slot, not unaligned timestamps.

**Future start:** same form, later `startLocal` on the selected date (or after date change).

**Services:** active services; duration = sum of snapshots (existing). Eligibility is enforced in the engine.

**Name required.** Phone optional for walk-in (existing: phone required only for `online`).

**Conflict:** 409 `SLOT_UNAVAILABLE` / `CALENDAR_BLOCKED` / `OUTSIDE_WORKING_HOURS` → keep the sheet open, show the message, refetch calendar.

Walk-ins that should not occupy a chair: staff does not use this form.

---

## 8. Calendar block workflow

Reuse `createCalendarBlock()`. Title, start, end, optional `staffMemberId` (omit/null = shop-wide). Staff chooses duration. No 15-minute default baked into the domain. UI may offer chips (30 / 60 / 90) **and** custom start/end; chips are presentation only.

**Create:** dialog from toolbar or from an empty-cell long-press/secondary action. Times are instants derived from selected local date + HH:mm in business timezone (same `localToInstant` rules, including DST rejection).

**Edit (3B, new use case `updateCalendarBlock`):** change title and/or times and/or staff vs shop-wide. Same transaction pattern as create: `SELECT business FOR UPDATE`, re-check occupying appointments/blocks **excluding this block id**, then update. Exclusion violations map to `CALENDAR_BLOCKED`.

**Cancel/remove (3B, new use case `cancelCalendarBlock`):** set `cancelledAt` (column already exists). Do not DELETE. Cancelled blocks stop occupying (existing `loadActiveBlocks` filter).

Do not bypass the application layer from the UI.

---

## 9. Appointment status / action model

### Existing (2B)

```
CONFIRMED → CANCELLED     allowed
COMPLETED → CANCELLED     rejected  INVALID_APPOINTMENT
NO_SHOW   → CANCELLED     rejected  INVALID_APPOINTMENT
CANCELLED → CANCELLED     rejected  APPOINTMENT_ALREADY_CANCELLED
```

`completed` occupies; `cancelled` and `no_show` do not.

### Proposed (3B) — keep it minimal

```
CONFIRMED → COMPLETED     new
CONFIRMED → NO_SHOW       new
CONFIRMED → CANCELLED     existing
```

All other transitions stay illegal. No reopen. No COMPLETED ↔ NO_SHOW. No cancel of completed/no-show.

**Why complete/no-show now:** the calendar is how the floor closes the visit. Without these, occupancy never reflects finished or missed chairs in the UI, even though the enum already exists.

**Time gate:** none in 3B. Staff may complete/no-show a future confirmed appointment (mis-tap is reversible only by not doing it; we are not adding undo). Optional “only if start has passed” is deferred.

**Staff cancel** ignores `cancel_notice_hours` (that setting is for later public cancel). Staff can always cancel a confirmed appointment.

New use cases: `completeAppointment`, `markNoShow`. Same load-by-`(id, businessId)` pattern as cancel. Map existing `INVALID_APPOINTMENT` for illegal transitions.

---

## 10. Hours / availability display

Phase 1 model stays:

- One interval per weekday
- Closed day = no row
- Optional staff hours intersected with business hours

**Limitation (document, do not redesign):** a barber cannot have a lunch gap in working hours. Lunch is a **calendar block**, which is the intended 3B tool. Split shifts / multiple intervals per day stay deferred.

Calendar shading uses effective hours per barber. Closed shop days show a closed state, not an empty 08:00–19:00 grid.

There is still **no dashboard editor** for staff-specific hours. Calendar will display them if present in PostgreSQL. Adding that editor is not part of 3B.

---

## 11. Timezone / DST

Existing `date-fns-tz` helpers. No new timezone framework.

| Concept | Rule |
| --- | --- |
| Selected date | `YYYY-MM-DD` in **business** timezone |
| “Today” | `formatLocalDate(now, business.timezone)` |
| Current-time line | `formatLocalHm(now, business.timezone)` on today only |
| API `date` query | that local date string |
| Day query window | `localDayBounds(date, timezone)` → UTC instants, overlap query (`start_at < dayEnd AND end_at > dayStart`) |
| Display | always business local; appointment `timezone` snapshot is shown in details |
| DST spring-forward | `localToInstant` already rejects the gap; block/walk-in forms surface `INVALID_TIME` |
| DST fall-back | existing earlier-instant rule |
| Grid labels | local HH:mm |

The browser’s timezone is irrelevant.

---

## 12. API design

Nitro handlers parse, `requireStaff()`, Zod, map `DomainError`. `businessId` from session only. Never from the body.

### 12.1 One calendar read (recommended)

**`GET /api/staff/calendar?date=YYYY-MM-DD`**

- Use case: `getCalendarDay`
- Auth: signed-in staff
- Input: `date` required, validated as local date
- Output (one payload for one view):

```
{
  date, timezone, now,
  closed: boolean,
  shopHours: { startLocal, endLocal } | null,
  staff: [{ id, name, active, sortOrder, hours: { startLocal, endLocal } | null }],
  appointments: [{
    id, staffMemberId, startAt, endAt, startLocal, endLocal,
    status, source, guestName, guestPhone, guestEmail, notes,
    services: [{ serviceNameSnapshot, durationMinutesSnapshot, priceCentsSnapshot }]
  }],
  blocks: [{ id, staffMemberId, startAt, endAt, startLocal, endLocal, title }]
}
```

Appointments in the payload: occupying statuses only (`confirmed`, `completed`). Blocks: `cancelledAt IS NULL`. Include rows that **overlap** the local day, not only those that start on it.

**Tradeoff vs many small GETs:** one round trip, consistent snapshot, simpler stale handling. Payload is small (one shop, one day). Do **not** add separate list-appointments / list-blocks endpoints in 3B.

### 12.2 Writes

| Action | HTTP | Use case | Concurrency |
| --- | --- | --- | --- |
| Walk-in / staff booking | `POST /api/staff/appointments` **existing** | `reserveAppointment` | existing FOR UPDATE + GiST |
| Cancel appointment | `POST /api/staff/appointments/:id/cancel` **existing** | `cancelAppointment` | row update by id+business |
| Complete | `POST /api/staff/appointments/:id/complete` **new** | `completeAppointment` | same |
| No-show | `POST /api/staff/appointments/:id/no-show` **new** | `markNoShow` | same |
| Create block | `POST /api/staff/blocks` **existing** | `createCalendarBlock` | existing |
| Update block | `PATCH /api/staff/blocks/:id` **new** | `updateCalendarBlock` | FOR UPDATE + occupancy excluding self |
| Cancel block | `POST /api/staff/blocks/:id/cancel` **new** | `cancelCalendarBlock` | set `cancelledAt` |

Walk-in validation: same Zod body as today; `source` must be `walk_in` or `phone` or `staff_created` (staff route already rewrites `online` → `staff_created`).

Public `POST /api/appointments` stays unused by Calendar.

---

## 13. Application / use-case design

Stay in `server/application/scheduling/`. No H3.

| Use case | 3B |
| --- | --- |
| `checkAvailability` | unchanged; Calendar may call it from the walk-in form to disable dead starts, but reservation still re-checks |
| `reserveAppointment` | unchanged |
| `cancelAppointment` | unchanged |
| `createCalendarBlock` | unchanged |
| `getCalendarDay` | **new** read model |
| `completeAppointment` | **new** |
| `markNoShow` | **new** |
| `updateCalendarBlock` | **new** |
| `cancelCalendarBlock` | **new** |

`getCalendarDay` loads business, hours, staff, overlapping occupying appointments + services, active blocks. It does not lock. It does not invent availability slots; the grid is a presentation of hours minus occupancy.

Complete / no-show: load appointment by id + businessId; require `confirmed`; set status + `updatedAt`.

Cancel block: load by id + businessId; if already `cancelledAt`, `CALENDAR_BLOCK_ALREADY_CANCELLED` (or reuse a small DomainError). Set `cancelledAt = now`.

If 3B reveals a 2B bug, document it; do not silently change reservation semantics.

---

## 14. Authorization model

**Existing:** `requireStaff` session cookie. Roles `owner | manager | barber` exist on `staff_user` and are **not** checked. `staff_user.staffMemberId` is optional (owner login is not necessarily a barber).

**3B minimum (recommended):**

1. Every Calendar route: `requireStaff`.
2. `businessId` from session. Ignore any client-supplied business id.
3. `staffMemberId` in bodies is a **resource assignment** (which chair), not an auth claim. Server still verifies the member belongs to that business (existing FKs + application checks).
4. **Any signed-in staff may view and mutate the whole shop calendar** — all columns, all appointments, all blocks.

**Why not “barber can only edit own column” in 3B:** this is one Vancouver shop; the floor covers walk-ins for whoever is free; owners often have no `staffMemberId`; Phase 1 already deferred RBAC. Column-level ACL would block real operation and needs a staff↔barber mapping UI we do not have.

**Deferred:** owner/manager vs barber permission matrix, “own column only”, audit log.

Tests in 3B: unauthenticated 401; appointment/block ids from another business 404 (session business isolation). No role-matrix tests until roles are enforced.

---

## 15. Error / concurrency UX

PostgreSQL remains the authority. The grid is a snapshot.

| Event | HTTP / code | UI |
| --- | --- | --- |
| Two staff take the same slot | 409 `SLOT_UNAVAILABLE` | Message: time no longer available. Refetch. Keep form open if possible |
| Block vs appointment | 409 `CALENDAR_BLOCKED` | Same |
| Outside hours / closed | 409 `OUTSIDE_WORKING_HOURS` | Same |
| Barber inactive / ineligible | 409 `STAFF_INACTIVE` / `STAFF_NOT_ELIGIBLE` | Same |
| Service inactive | 409 `SERVICE_INACTIVE` | Same |
| Appointment already cancelled / not confirmed | 409 `APPOINTMENT_ALREADY_CANCELLED` / `INVALID_APPOINTMENT` | Message. Refetch. Close actions if status changed |
| Not found | 404 | Message. Refetch |
| DST gap | 400 `INVALID_TIME` | Inline field error |

After every successful mutation: refetch `GET /api/staff/calendar`. After 409/404 on a mutation: refetch before allowing retry.

Do not optimistically remove blocks from the grid.

---

## 16. Responsive behavior

**Correct the brief:** the dashboard already uses PrimeVue (`Button`, `Card`, `Message`, `DataTable`, …). It is not “native HTML unused PrimeVue”. The **app shell is desktop-first** (`layouts/app.vue` is a fixed `w-64` sidebar). 3B must make that shell usable on a phone or Calendar is theoretical.

### App shell (3B, required)

- **< ~768px:** top bar (shop name, menu) + slide-down or full-screen nav. Calendar gets almost all vertical space. Touch targets ≥ 44px.
- **≥ 768px:** keep the sidebar.

Same routes and APIs at every breakpoint.

### Staff Calendar

**Mobile (priority 1):** focused **one-barber** timeline. Barber `<select>` (and prev/next barber). Default focused barber: first by `sort_order`, remembered in `sessionStorage` for the session. An “All (list)” toggle: chronological list of occupying appointments for the day (not a squeezed multi-column grid). **No** horizontal multi-column scroll on small screens.

**Tablet:** 2–3 columns if they fit; otherwise same as mobile switcher.

**Desktop:** full Resource Timeline as in §5.

### Touch

No hover-only actions. Details = tap. Date controls and Add/Block are toolbar buttons. Dialogs are full-screen on mobile, modal on desktop.

### Public booking (Phase 4, do not implement)

Preserve: stacked one-column flow, large time-slot buttons, minimal typing, no dependency on the staff Resource Timeline. Calendar APIs are staff-only; public booking will keep `GET /api/availability` + `POST /api/appointments`.

---

## 17. Data fetching / revalidation

- Initial load / date change: `useFetch` / `$fetch` of `GET /api/staff/calendar?date=`
- After walk-in, cancel, complete, no-show, block create/update/cancel: explicit refetch
- Manual refresh control in the toolbar
- `document.visibilitychange` → refetch when the tab becomes visible
- **No WebSockets. No polling in 3B.** One shop, staff in the same room can talk; 409 + refetch is enough
- Do not cache calendar days across dates in a way that can show a stale grid after mutation

---

## 18. Drag / drop decision

**Defer. Not in 3B.**

Reasons: needs a new `rescheduleAppointment` use case (change start and/or barber, duration preserved, occupancy re-check); accidental moves on touch; concurrency already hard with tap+save; mobile-first calendar should not depend on drag.

Reassign/reschedule later = details sheet fields or a later drag layer on desktop only.

---

## 19. UI technology decision

| Choice | Verdict |
| --- | --- |
| FullCalendar / similar | **No.** Resource Timeline + shop-wide blocks + our occupancy model + mobile one-column mode would fight the library. Extra dependency, not justified. |
| PrimeVue Calendar/Scheduler | **No.** Not in the current include list; still a generic scheduler. |
| Custom CSS Grid timeline | **Yes.** Preferred in the brief and fits dynamic columns + 10-minute rows. |
| PrimeVue for chrome | **Yes, selectively.** Keep using Button, Card, Message, InputText, Select/Date as needed. Add **Dialog** (or native `<dialog>`) for sheets. Do not pull the whole PrimeVue catalog. Prefer native `input type="date"` and `<select>` on mobile. |

One Vue presentation layer, one application API. No duplicated scheduling logic.

---

## 20. Proposed file / component structure

Adapt to the **existing** `/app` staff area (not `/staff`).

```
app/layouts/app.vue                          # mobile nav + existing sidebar
app/pages/app/calendar.vue                   # page: date state, fetch, toolbar
app/components/calendar/
  CalendarToolbar.vue
  CalendarBarberSwitcher.vue
  CalendarTimeline.vue                       # CSS Grid
  CalendarTimeAxis.vue
  CalendarBarberColumn.vue
  CalendarAppointmentBlock.vue
  CalendarBusyBlock.vue
  CalendarNowLine.vue
  CalendarClosedState.vue
  CalendarDayList.vue                        # mobile “all barbers” list
  AppointmentDetailSheet.vue
  WalkInForm.vue
  BlockForm.vue

server/application/scheduling/
  get-calendar-day.ts                        # new
  complete-appointment.ts                    # new
  mark-no-show.ts                            # new
  update-calendar-block.ts                   # new
  cancel-calendar-block.ts                   # new
  (existing reserve/cancel/create-block stay)

server/api/staff/calendar.get.ts             # new
server/api/staff/appointments/[id]/complete.post.ts
server/api/staff/appointments/[id]/no-show.post.ts
server/api/staff/blocks/[id].patch.ts
server/api/staff/blocks/[id]/cancel.post.ts
```

Keep domain time/hours/slots/ranges untouched unless a 3B bug is found.

Nav: add **Calendar** as the first item; login may go to `/app/calendar`. Overview remains a config snapshot.

Do not put timeline math in Nitro handlers.

---

## 21. Test strategy

Do not implement in 3A. Required in 3B:

**Application**

- `getCalendarDay` filters by local date / timezone, overlapping visits, occupying statuses only, active blocks only, staff hours intersection, closed day
- Walk-in reserve via existing use case (`source: walk_in`)
- Complete / no-show happy path and illegal transitions
- Cancel still rejects completed/no-show
- Update block occupancy excluding self
- Cancel block stops occupying
- Unauthorized / wrong-business id

**PostgreSQL integration**

- Complete then overlapping reserve is rejected (completed occupies)
- No-show then overlapping reserve is allowed
- Concurrent reserve vs block (already exist; keep)
- Concurrent complete vs cancel: one wins, status consistent
- Update block vs reserve overlap cannot both commit

**UI (lightweight Vue/component tests, not a new e2e stack unless one already exists)**

- Dynamic column count
- Mobile switcher vs desktop columns (breakpoint or prop)
- Date query param
- Closed day state
- Mutation error triggers refetch (mock)

No Playwright/Cypress requirement if the repo has none.

---

## 22. Implementation plan for Phase 3B

1. App shell mobile nav
2. `getCalendarDay` + `GET /api/staff/calendar` + tests
3. Calendar page: toolbar, closed state, desktop timeline, mobile one-column + list
4. Appointment details + existing cancel wired
5. `completeAppointment` / `markNoShow` + APIs + tests + UI
6. Walk-in form → existing POST
7. Block create (existing) + cancel/update use cases + UI
8. Error/refetch/visibility refresh
9. Lint, type-check, PostgreSQL tests, build

Stop if any step requires a scheduling-engine redesign — report instead.

---

## 23. Definition of Done for Phase 3B

- Staff can open Calendar on phone and desktop and see today’s real appointments/blocks
- Barber columns are dynamic
- Walk-in occupying a chair uses `reserveAppointment({ source: 'walk_in' })`
- Confirmed appointments can be completed, marked no-show, or cancelled with the 2B transition rules
- Staff and shop-wide blocks can be created and cancelled through application use cases
- Closed days and staff/business hours are visible
- Times display in business timezone; DST helpers unchanged
- Unauthenticated calendar routes 401; `businessId` is not client-supplied
- No public booking UI, OTP, notifications, payments, Redis, drag-and-drop
- `pnpm --dir apps/barbershop test` (with Postgres), lint, type-check, build pass

---

## 24. Open questions / decisions requiring approval

1. **Auth:** 3B = any signed-in staff can operate every column. Agree?
2. **Post-login landing:** Calendar vs keep Overview as `/app`. Recommendation: Calendar.
3. **Cancelled/no-show on the grid:** omit. Agree?
4. **Walk-in “Now”:** round to 10-minute grid; do not relax `assertSlotAligned`. Agree?
5. **Block edit:** include `updateCalendarBlock` in 3B, or cancel+recreate only?
6. **Complete/no-show time gate:** none in 3B. Agree?
7. **Staff-hours editor:** still out of 3B (display only). Agree?
8. **Polling:** none; refetch on focus + after mutations. Agree?

---

## Phase 2B gaps that 3B should not silently “fix”

These are not engine flaws:

- No complete/no-show use case yet — **add in 3B as specified**
- No calendar read API — **add**
- `calendar_block.cancelledAt` unused by an application function — **add cancel**
- Roles unused — **deferred, with explicit 3B policy**
- Dashboard layout not mobile — **must fix in 3B for Calendar to be usable**
- Brief’s “PrimeVue unused” is outdated — dashboard already uses it

Do not change GiST exclusions, Any Barber, guest fields, or slot interval.
