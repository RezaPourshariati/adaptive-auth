# Crypto Barber Shop — Architecture Proposal

**Primary question:** How should we build the Crypto Barber Shop product inside this repo so the calendar is safe, the shop can use it, and we are not building a SaaS platform yet?

**Date:** 2026-09-02
**Status:** Proposal. No large implementation until this is reviewed.
**Answers:** `[start-beauty-platform.md](./start-beauty-platform.md)`
**Earlier reviews:** `[one-business-first-crypto-barber-review.md](./one-business-first-crypto-barber-review.md)`

---

## Short answer

The brief is now the right product shape: **one shop, calendar as the core, auto-confirm, guest booking, PostgreSQL overlap safety, no AdaptiveAuth runtime, no multi-tenant platform.**

Build it as `apps/barbershop` (Nuxt 4 + Nitro + Drizzle + PostgreSQL), isolated at *runtime* from AdaptiveAuth. Do not put a root `crypto-barber-shop/` folder outside the pnpm workspace.

**Still cut from the first milestone:** customer OTP, deposit collection, drag-and-drop calendar, and any SMS vendor until the guest-book → calendar → outcome loop works. Keep the *schema* ready for OTP, no-show counts, and `requires_deposit`.

**Do not copy** `apps/nuxt-app` **as-is.** That app is `ssr: false` and talks to AdaptiveAuth. The public barbershop site needs SSR.

---



## 1. What I agree with

These decisions in `start-beauty-platform.md` are correct. Do not reopen them:


| Decision                                                          | Why                                               |
| ----------------------------------------------------------------- | ------------------------------------------------- |
| One real business, SaaS later                                     | Matches the earlier feasibility cut.              |
| `business_id` on owned rows, no tenant product                    | Cheap and enough.                                 |
| Calendar is the product                                           | Website is one intake channel.                    |
| Dynamic staff, per-service duration, staff↔service                | Do not hard-code five barbers or 40-minute slots. |
| “Any Barber” is a preference; appointment always has a `staff_id` | Correct.                                          |
| Auto-confirm online bookings                                      | Removes the pending-without-hold bug.             |
| Guest booking default                                             | Correct.                                          |
| Walk-in that affects the schedule goes on the same calendar       | Correct.                                          |
| Blocks as `CalendarBlock`, not fake appointments                  | Correct.                                          |
| PostgreSQL + exclusion / range types                              | Correct tool for overlap.                         |
| Notification ports, not a hardcoded Twilio import in domain code  | Correct.                                          |
| No AdaptiveAuth runtime dependency                                | Correct.                                          |
| Stay in this git repo for now                                     | Accepted as a constraint.                         |


---



## 2. Remaining contradictions and unknowns

Do not silently invent shop policy. Confirm with the owner before coding hours, prices, or cancel copy.

### 2.1 Live website vs this brief


| Topic         | Live site (cryptobarbershops.com, Sep 2026)                                          | This brief                                         | Action                                                                                                                                                        |
| ------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hours         | 9:00–19:00 or 9:00–20:00 (pages disagree)                                            | **08:00–19:00**                                    | Owner confirms. Store in DB, never in UI strings.                                                                                                             |
| Cancel policy | ≥ **2 hours** or **50% charge**                                                      | Day-before OK; within **4 hours** contact the shop | Owner confirms. Model as settings.                                                                                                                            |
| After-hours   | +50% on regular price                                                                | Not mentioned                                      | **Assumption until told otherwise:** do not implement after-hours pricing in MVP. Keep a note.                                                                |
| Booking order | Stylist first                                                                        | Service first, then barber / any                   | Either works. **Recommend service → barber / any** because “Any Barber” needs a service to know duration and capability. Stylist-first can be a later toggle. |
| Services      | Fade, Cut, Fade+Beard, Kids Fade, Senior, plus gallery names (scissor, design, etc.) | 40–60 min typical; durations not listed            | **Do not invent prices or minutes.** Seed names after owner supplies a list.                                                                                  |
| Domain        | cryptobarbershops.com                                                                | cryptobarbershop.com                               | DNS is ops. App uses `PUBLIC_SITE_URL`.                                                                                                                       |




### 2.2 Language in §16

> Customer accounts ARE required, but they are OPTIONAL for booking.

Read as: **the platform will have accounts; booking must not require them.** Not: OTP must ship in the first milestone.

§37 success does not mention login. OTP is **phase 1.5**, after a customer can book as guest and appear on the calendar.

### 2.3 Quick walk-ins vs a truthful calendar

§11 says a short walk-in may skip the calendar. That will collide with online booking unless something occupies the chair.

**Proposal (not invented shop policy — an engineering default):** staff get a **“Chair busy”** control that creates a short `CalendarBlock` (default 15 minutes, editable). No customer record. Optional. If they refuse to tap it, online booking can still overlap; that is an operational choice, not a software guarantee.

### 2.4 SMS “not optional” vs no vendor yet

SMS is a product requirement. It is not a reason to block the calendar.

MVP: `NotificationPort` **+ email adapter + SMS adapter.** If SMS credentials are missing, **queue the SMS and show it as failed/pending in staff UI**. Do not pretend it sent. Do not add Redis for this.

Canada: transactional booking SMS is usually fine; promotional “offers” later need CASL consent. Do not send marketing SMS from the booking path.

---



## 3. A. Repository / folder structure

`pnpm-workspace.yaml` only includes `apps/*`, `services/*`, `packages/*`. A root `crypto-barber-shop/` folder would be **outside the workspace**: no `pnpm -r`, no shared TypeScript/ESLint unless we special-case it. That fights the reason we stay in this repo.

**Do this:**

```text
AdaptiveAuth/
├── apps/
│   ├── vue-app/                 # AdaptiveAuth — do not touch for this product
│   ├── nuxt-app/                # AdaptiveAuth — reference only
│   └── barbershop/              # THIS product (Nuxt 4, SSR on)
│       ├── app/                 # routes, layouts, calendar UI
│       ├── server/
│       │   ├── api/             # Nitro HTTP
│       │   ├── db/              # Drizzle schema + client
│       │   ├── domain/          # booking, availability, policy
│       │   └── notifications/
│       ├── drizzle/
│       └── package.json         # @adaptive-auth/barbershop
├── services/auth-server/        # do not import
├── packages/                    # eslint/tsconfig OK to reuse as tooling
└── docs/ideas/
```

**Why not** `services/barbershop-api` **+** `apps/barbershop`**?** One team, one shop, one deploy. Nitro can host the API. Split the service when a second client exists.

**Runtime isolation rule:** `apps/barbershop` must not import `@adaptive-auth/shared-auth`, `@adaptive-auth/shared-types`, or call `auth-server`. Allowed: `@adaptive-auth/eslint-config`, `@adaptive-auth/config-typescript` (tooling only).

Copy patterns (CSRF, session cookies, typed errors) as **local files** under `server/`. Do not symlink AdaptiveAuth identity.

---



## 4. B. Application architecture

```text
Browser
  public  (SSR)     /  /services /team /book ...
  staff   (auth)    /app/calendar /app/staff ...
        │
        ▼
Nuxt 4 + Nitro
  server/api/public/*    guest booking, availability
  server/api/staff/*     calendar mutations, CSRF + staff session
        │
        ▼
domain/
  availability.query
  booking.reserve        ← only writer of occupying appointments
  schedule.occupancy
        │
        ▼
PostgreSQL
  appointments + exclusion
  calendar_blocks + exclusion
  notification_outbox
```


| Layer         | Choice                                                       | Reason                                                       |
| ------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| Public UI     | Nuxt 4, **SSR on**                                           | Google / Maps traffic. Opposite of current `nuxt-app`.       |
| Staff UI      | Same app, `/app`, cookie session                             | One deploy.                                                  |
| API           | Nitro `server/api`                                           | No second Node process yet.                                  |
| Domain        | Plain TS modules, no HTTP types                              | Booking tests without Nuxt.                                  |
| DB access     | **Drizzle**                                                  | SQL we control; `tstzrange` and raw `EXCLUDE` in migrations. |
| Jobs          | Outbox table + request-end drain                             | No Redis/BullMQ until volume hurts.                          |
| Files         | Static `/public` for gallery v1                              | Object storage later.                                        |
| Staff auth    | Email + password, httpOnly cookies, CSRF, server session row | AdaptiveAuth *ideas*, local tables.                          |
| Customer auth | Schema only in milestone 1; OTP in 1.5                       | See §H.                                                      |


Dashboard layout: marketing vs app chrome, similar *idea* to vue-app presets (`marketing` / `app`). Implement locally. PrimeVue is fine **inside** `/app`. Do not force Aura on the public brand site.

---



## 5. C. Domain model

Two people types (do not collapse them):

- `staff_member` — a chair resource (Moe, Jay, …). May have **no login**.
- `staff_user` — someone who uses `/app` (owner, manager, a barber who should log in). Optional `staff_member_id`.

```text
business
  ├── staff_member ── staff_service ── service
  ├── staff_user (login)
  ├── customer (no login required)
  │     └── customer_identity     (phone OTP later)
  ├── appointment ── appointment_service (snapshots)
  ├── calendar_block
  ├── working_hours (business + per staff)
  └── notification_outbox
```

**Occupancy:** anything that makes a chair unbookable is either a **confirmed appointment** or a **calendar block**. Quick walk-in “chair busy” is a block.

**“Any Barber”:** never stored as staff. Resolver writes a real `staff_id`.

---



## 6. D. PostgreSQL schema (core)

Timezone for display and “today”: `America/Vancouver`. Instants in DB are `timestamptz`. Ranges are **half-open** `[start, end)` so 10:00–10:40 and 10:40–11:20 do not overlap.

Requires: `CREATE EXTENSION btree_gist;`

```sql
-- Occupying appointments cannot overlap per staff.
-- Cancelled / no-show / completed do not occupy.
EXCLUDE USING gist (
  staff_member_id WITH =,
  during WITH &&
) WHERE (status = 'confirmed')

-- Blocks cannot overlap each other per staff (optional but useful).
EXCLUDE USING gist (
  staff_member_id WITH =,
  during WITH &&
)
```

Important tables (columns abbreviated):


| Table                 | Role                                                                                                             |
| --------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `business`            | One seeded row. Hours defaults, cancel policy JSON, deposit %, timezone.                                         |
| `staff_member`        | `business_id`, name, `active`, sort_order.                                                                       |
| `staff_user`          | email, password hash, role `owner|manager|barber`, optional `staff_member_id`.                                   |
| `staff_session`       | refresh hash, idle/absolute timestamps (same *policy idea* as AdaptiveAuth).                                     |
| `service`             | duration_minutes, price_cents, active.                                                                           |
| `staff_service`       | capability.                                                                                                      |
| `customer`            | name, phone, email nullable, `no_show_count`, `late_cancel_count`, `requires_deposit`.                           |
| `customer_identity`   | `type` phone/email, unique `(business_id, type, value)`.                                                         |
| `otp_challenge`       | unused until 1.5.                                                                                                |
| `appointment`         | `during tstzrange`, `staff_member_id`, `customer_id` null, `source`, `status`, guest denormalized.               |
| `appointment_service` | service_id, name/duration/price **snapshot**.                                                                    |
| `calendar_block`      | `during`, staff_member_id, reason (`busy_walk_in`, `break`, `day_off`, …).                                       |
| `working_hours`       | `owner_type` business|staff, weekday, local start/end time.                                                      |
| `notification_outbox` | channel, template, payload, status.                                                                              |
| `deposit`             | exists as table, **no provider columns required in MVP** except `required` / `percent` / `status=not_collected`. |


Indexes: `(staff_member_id, during)` gist; `(business_id, start)` for day queries; customer phone.

JSONB: **policy settings only** (cancel rules). Not appointments.

---



## 7. E. Booking concurrency

Frontend availability is a **hint**. The writer is one function: `reserveAppointment`.

```text
BEGIN
  SELECT staff_member WHERE id = :id FOR UPDATE   -- serialize this chair
  re-read service duration + capability
  assert during ⊆ staff working hours (Vancouver local)
  assert no calendar_block && during
  INSERT appointment status=confirmed, during=[start,end)
    -- exclusion constraint rejects overlap with other confirmed rows
  INSERT appointment_service snapshots
  INSERT notification_outbox (email, sms)
COMMIT
then drain outbox (best-effort; retry from table)
```

If `INSERT` hits the exclusion constraint → `409 SLOT_TAKEN`. UI refetches slots.

**Any Barber:** lock and try candidates **one at a time** in deterministic order (see §F). Do not hold `FOR UPDATE` on all barbers at once (lock convoying). If all fail → `409`.

Do not “check then insert” without the lock + constraint. The constraint is the last line of defense if a bug skips the lock.

Two guests, same barber, same `tstzrange`: one commit, one 409. That is the requirement.

---



## 8. F. Availability algorithm

Inputs: `serviceId`, `staffMemberId | ANY`, `localDate`, now.

1. Load service (`durationMinutes`, active).
2. Candidate staff: `active` AND `staff_service` contains service. If a specific barber, that set is size 0 or 1.
3. For each candidate, local working interval that day = business hours ∩ staff hours − weekday-off. Skip if empty.
4. Occupied = confirmed appointments that day ∪ calendar blocks (`during && dayRange`).
5. Free gaps = working interval minus occupied (merge overlaps).
6. Slot starts: from `max(dayStart, now + minNotice)` stepped by **10 minutes** (fits 20/40/60/75). A start is valid iff `[start, start+duration)` ⊆ some free gap.
7. Response: list of start times. For `ANY`, **union** of starts across candidates (a slot appears if **at least one** barber can take it). Do not reveal which barber until reserve, or optionally show “3 barbers available” — **assumption:** hide names on Any to keep UI simple.

**Assignment when Any:** among staff who can take that exact range, pick **fewest confirmed minutes that local day**, then lowest `staff_member.id`. Stable, fair enough, no AI.

**Assumptions (label as such until owner confirms):**


| Assumption                  | Default           | Why it matters                                    |
| --------------------------- | ----------------- | ------------------------------------------------- |
| Slot grid                   | 10 minutes        | 75-minute services still land on clock times.     |
| Buffer between appointments | **0**             | Owner may want 5–10 min cleanup.                  |
| Minimum notice              | **30 minutes**    | Reduces booking a slot already being walked into. |
| Book-ahead window           | **14 days**       | Stops infinite calendars.                         |
| Timezone                    | America/Vancouver | DST.                                              |


---



## 9. G. Calendar architecture (resource timeline)

Staff `/app/calendar` is a **day view**: columns = active `staff_member` (sort_order), rows = time, block height ∝ duration.

**v1 interactions:** click empty gap → create (phone / walk-in / block); click event → detail (complete / no-show / cancel). Source shown by color or label (`online`, `phone`, `walk_in`, `block`).

**Not v1:** drag-reschedule. Same `reserve`/`reschedule` engine later; drag is UI on top of that. Shipping drag before the engine is how we get silent overlaps.

Implementation: **custom CSS grid** for one day. Do not start with FullCalendar Resource Timeline (premium license) or a generic DataTable.

Data: `GET /api/staff/schedule?date=` returns members + appointments + blocks. Mutations go through domain functions, not client-side patching of times.

Inactive barbers: omitted from columns; historical appointments still openable from customer history.

---



## 10. H. Customer authentication (OTP)

**Milestone 1:** guest only. Appointment stores `guest_name`, `guest_phone`, `guest_email`, `customer_id` null. Optionally upsert a `customer` row by phone **without** a session (so history exists for the shop). That is not “an account.”

**Milestone 1.5 (after §37 works):**

```text
POST /api/customer/otp/request  { phone }  → rate-limit, send 6-digit, store hash + expiry
POST /api/customer/otp/verify   { phone, code } → customer_identity verified, customer_session cookie
```

No password. Email identity optional later. Progressive profile.

Guest later + same phone: **do not auto-merge in v1.5** without a rule. Staff “link to customer” is enough. Unique phone per business when verified.

**Never** use customer session for `/app`.

Staff login: email/password (or invite token). Separate cookies (`staff_session` vs `customer_session`), separate CSRF.

---



## 11. I. Appointment lifecycle

Statuses that occupy a chair: `confirmed` **only**.


| Event             | Status / source                 | Occupies chair?                                 |
| ----------------- | ------------------------------- | ----------------------------------------------- |
| Online book       | `confirmed` / `online`          | Yes                                             |
| Phone (staff)     | `confirmed` / `phone`           | Yes                                             |
| Scheduled walk-in | `confirmed` / `walk_in`         | Yes                                             |
| Quick busy        | `calendar_block` `busy_walk_in` | Yes (block)                                     |
| Break / day off   | `calendar_block`                | Yes                                             |
| Customer cancel   | `cancelled`                     | **No** (range kept for history)                 |
| No-show           | `no_show`                       | **No** going forward; history + counters        |
| Done              | `completed`                     | **No** (past; do not leave `confirmed` forever) |


**Close-out:** staff mark completed or no-show. A job can mark `confirmed` + `end_at < now - grace` as still confirmed until staff act — **assumption:** no auto-no-show in MVP; staff tap it. Auto-no-show later.

**Cancel policy (configurable, not scattered strings):**

```text
business.cancellation_policy
  notice_hours
  late_behavior: 'contact_shop' | 'fee_percent' | 'none'
  contact_instructions
```

MVP UX: show policy on `/book`; online cancel allowed only if `now < start - notice_hours`; otherwise “call the shop” + phone number. **Do not collect 50% in software** until a payment provider exists.

**Deposit (design, don’t collect):**

- `customer.requires_deposit` set by staff, or later rule: `no_show_count >= 2` (threshold on business).
- Online book: if `requires_deposit` and no payment provider → **block self-serve** and show “call to book” **or** allow book and flag the appointment `deposit_status=due`. **Owner must choose.** Recommendation: **allow book, badge the calendar, staff collect in shop** until Stripe/Square exists. Do not fake a 20% card charge.

---



## 12. J. Notification architecture

```text
NotificationPort.send({ channel: 'email' | 'sms', to, template, data })
EmailAdapter  → Resend / Postmark / SES  (pick one when keys exist)
SmsAdapter    → Twilio or Canadian SMS   (pick when keys exist)
DevAdapter    → log + outbox row
```

Templates (MVP): `booking_confirmed`, `booking_cancelled`, `reminder_24h`.

**Outbox:** insert in the same transaction as the appointment. After commit, attempt send. Failures stay `pending`/`failed` for retry. Reminder_24h: scheduler query `confirmed` appointments in the next 24–25h window (can be a Nitro periodic task or OS cron hitting an internal route). Still no Redis.

Never call the provider inside the reservation transaction.

---



## 13. K. MVP vs nice-to-have vs future SaaS



### MVP (definition of done = §37 minus login and minus card deposit)

1. App foundation in `apps/barbershop`
2. Postgres + Drizzle + one `business`
3. Staff, services, staff_service, working hours
4. Exclusion-safe `reserve`
5. Public guest book (service → barber|any → slot → contact)
6. Day resource calendar + staff create phone/walk-in/block
7. Email confirmation (SMS when credentials exist)
8. Staff: complete / no-show / cancel
9. Customer row by phone for history; `requires_deposit` flag (manual)
10. Policy text from `business` settings



### Nice-to-have (after the shop uses it)

- Customer OTP
- SMS reminders in production
- 24h reminder job
- Auto rule `no_show_count → requires_deposit`
- Drag reschedule
- Chair-busy default 15 min
- After-hours pricing
- Public site polish / gallery CMS



### Future SaaS / do not build

- Tenants, domains, billing, marketplace, AI, loyalty, POS, AdaptiveAuth wiring, Redis, mobile app, crypto checkout

---



## 14. Adjusted implementation order

The brief’s order is close. Change: **notifications after first reserve**, **OTP after the shop has used the calendar**, **deposit foundation as columns not Stripe**.

1. `apps/barbershop` Nuxt (SSR) + ESLint/tsconfig tooling
2. Postgres + Drizzle + `btree_gist`
3. business / staff_member / service / staff_service / working_hours
4. appointment + calendar_block + exclusion
5. `reserveAppointment` + availability query + tests (two parallel reserves)
6. Staff calendar day view + create/cancel/complete/no-show
7. Public `/book` guest flow
8. Outbox + email (+ SMS adapter stub)
9. Customer upsert-by-phone + history in staff UI
10. OTP
11. Deposit collection provider
12. Marketing page polish

---



## 15. Patterns to copy from AdaptiveAuth (and what not to copy)


| Copy as a local implementation                 | Do not copy                                      |
| ---------------------------------------------- | ------------------------------------------------ |
| Cookie access + refresh, `sid` on access token | Mongo `User`, `subscriber`/`author` roles        |
| CSRF on cookie-authenticated POST              | Google login, device-trust OTP-after-password    |
| Idle + absolute session policy                 | `shared-auth` HTTP client pointed at auth-server |
| Typed errors + Zod at the boundary             | `ssr: false` Nuxt app                            |
| Feature folders, layout chrome vs page         | Default `phone: '+98'`                           |


---



## 16. Challenge summary (for approval)

1. **Folder:** `apps/barbershop`, not repo-root `crypto-barber-shop/`.
2. **OTP:** schema now, feature after guest booking works.
3. **Quick walk-in:** “chair busy” block, or accept overlap.
4. **Hours and cancel rules:** owner must reconcile with the live WordPress copy.
5. **Prices/durations:** owner list; we do not invent them.
6. **Deposit money movement:** not in MVP; flag + calendar badge only.
7. **SMS:** required product-wise; may be pending in outbox on day one.
8. **Drag-and-drop:** after the engine, not before.

If this list is accepted, the next step is still not a full website: **database +** `reserveAppointment` **tests**, then the day calendar, then `/book`.