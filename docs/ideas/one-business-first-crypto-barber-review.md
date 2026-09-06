# One Business First — Crypto Barber Shop Review

**Primary question:** Is rebuilding Crypto Barber Shop as a single production site the right first step toward a branded-website SaaS, and how should we actually scope it?

**Date:** 2026-08-26
**Status:** Architecture and product opinion. Do not implement until this is reviewed.
**Companion briefs:** [`one-beauty-business-platform-first.md`](./one-beauty-business-platform-first.md), [`beauty-platform-feasibility-analysis.md`](./beauty-platform-feasibility-analysis.md)

---

## Short answer

1. **Yes: one real business before multi-tenant SaaS.** That is the correct correction to the earlier “Beauty BI platform” idea.
2. **No: this shop does not validate the earlier wedge.** Crypto Barber Shop is a **Vancouver, Canada** barbershop (walk-ins + appointments, five chairs, Booksy/Square/Fresha territory). Treat it as a **learning customer you already have**, not as proof that a salon OS will sell.
3. **Cut customer OTP accounts from v1.** Guest booking is the product. Digikala/Divar-style customer login is a second product. The brief contradicts itself on this (required in §4, forbidden in §10).
4. **Do not mount AdaptiveAuth as the staff dashboard runtime.** Reuse session/CSRF/RBAC _ideas_. Do not reuse the Mongo user model, password+device-trust flow, or a separate auth service for five staff.
5. **Pending approval without a slot hold will double-book.** Either auto-confirm, or `PENDING` that still occupies the chair.
6. **Walk-ins are missing from the brief and present on the live site.** That is the actual barbershop calendar problem. Model it.

---

## 1. Verdict on the scenario

The new brief is directionally right:

| Claim                                                        | Assessment                                                            |
| ------------------------------------------------------------ | --------------------------------------------------------------------- |
| Do not start as a marketplace                                | **Agree.** Keep the customer relationship on the shop’s domain.       |
| Do not implement multi-tenancy yet                           | **Agree.**                                                            |
| Build a real production site, not a demo                     | **Agree**, if scope stays a booking site + staff calendar.            |
| Guest booking with no account                                | **Agree. This is the default path.**                                  |
| Optional customer OTP accounts in the same first version     | **Disagree.** Defer.                                                  |
| Use AdaptiveAuth for the dashboard because it is “sensitive” | **Disagree as a runtime.** Agree as a pattern source.                 |
| Approval flow (`PENDING` → staff confirm)                    | **Dangerous as specified.** Fix the hold semantics or drop it.        |
| Soft separation of domain concepts for later SaaS            | **Agree**, with a hardcoded `business_id`, not tenant infrastructure. |

This is **not** the Iran-first women’s hair salon recommended in the feasibility analysis. It is still a legitimate way to learn the domain **if** we do not pretend Vancouver barber success equals a platform.

---

## 2. What the current business actually is

`cryptobarbershop.com` returned HTTP 500 when checked (26 Aug 2026). The live WordPress site is **[cryptobarbershops.com](https://cryptobarbershops.com/)** (plural).

**Business:** Crypto Barbershop, 1285 Kingsway, Vancouver, BC. Phone +1 604-695-5907.

**What the current site does (reproduce this, not an imagined BI suite):**

| Area    | Current behavior                                                                                                        |
| ------- | ----------------------------------------------------------------------------------------------------------------------- |
| Brand   | Men’s barbershop + crypto payments (Bitcoin/Ethereum) as a story, not a booking flow                                    |
| Hours   | Site copy disagrees (9am–7pm vs 9am–8pm). Confirm with the owner. After-hours cuts +50%.                                |
| Pages   | Home, services/prices, gallery, contact, location, booking                                                              |
| Staff   | Moe, Jamil, Jay, Shams, Asad — booking starts by **choosing a stylist**                                                 |
| Booking | WordPress flow: stylist → service → time (`/cp_app_hour_booking-id10/`)                                                 |
| Policy  | Cancel/reschedule **≥ 2 hours** before, else **50% charge** (stated on the booking page; likely unenforced in software) |
| Mix     | **Appointments and walk-ins**                                                                                           |

Google Maps, signage, and returning customers matter as much as the website. Online booking is one channel into one chair calendar.

**Implication:** v1 is a branded marketing site plus a working multi-barber calendar. Crypto checkout, loyalty, and customer accounts are not why this shop exists today.

---

## 3. Product honesty: learning customer vs GTM

Previous recommendation: Iran-first, 1–8 chair **women’s hair**, book → remind → return. Barbershops were a weak first segment (walk-in heavy, shorter cycles, Booksy-native).

This shop:

- Is in **Canada**, where Square, Booksy, and Fresha work and are sold hard to barbers.
- **Wants a branded site**, which is a real preference (and what Bookwize/white-label tools pitch against marketplace tax).
- Is walk-in + appointment, so a “full book” waitlist engine is the wrong first intelligence feature.

Build this if the owner will use it daily and you can stand next to the chair. That teaches availability, phone bookings, and no-shows.

Do **not** conclude “the SaaS works” because one friendly shop runs your calendar. The next paying tenant is a separate sale, in a market full of $20–50/month incumbents.

If the only goal were “this shop books online,” embedding Square Appointments or Booksy on a Nuxt marketing site would be faster. Build our own calendar **only** because the point is to learn the domain for a later platform.

---

## 4. Contradictions to resolve before coding

### 4.1 Customer authentication

§4 specifies optional phone/email OTP accounts (Digikala/Divar).
§10 says do not prematurely build customer authentication.
§13 says do not introduce customer accounts without a strong business requirement.

**Resolution:** §10 and §13 are right. **No customer accounts in MVP.**

Guest booking already captures name + phone + email. That _is_ the customer record. OTP login adds SMS cost (Canada is not cheap), abuse (OTP bombing), identity merge edge cases, and a second auth domain — for promotions nobody has asked this shop to run in software.

Leave the data model able to attach a `customer_id` later (nullable on appointments). Do not build the login UI.

### 4.2 Pending vs confirmed

§5: submit → `PENDING` → staff approve → email.

If `PENDING` does **not** occupy the slot, two guests can request Friday 10:00 with Reza and both believe they have it.

If `PENDING` **does** occupy the slot, you have built a hold with extra staff labor and a worse guest UX (“we’ll email you”). For a five-chair shop that also takes walk-ins, that labor shows up during the rush.

**Resolution for v1:**

- Default: **auto-confirm** if the slot is free; email both sides.
- Staff can **cancel** (with reason) and notify.
- If the owner insists on approval: create a **short hold** (`PENDING` + exclusion constraint), auto-expire if not acted on (e.g. 15–30 minutes or until end of day — **pick one with the owner**), then release.

Do not ship pending-without-hold.

### 4.3 Walk-ins

The live site advertises walk-ins. The brief never models them. If walk-ins are not on the same calendar, online booking will collide with people already in the chair.

**v1:** staff can mark a chair **busy** (walk-in or block) with a duration. Same appointment table, source = `walk_in` | `phone` | `online`.

### 4.4 Cancellation fee

The site already claims a 2-hour / 50% rule. Enforcement needs payments. **Show the policy on the booking page.** Do not build card-on-file in v1 unless the owner will actually charge people (most small shops will not, without Square).

---

## 5. AdaptiveAuth for the staff dashboard — opinion

The brief asks whether the dashboard can use the current AdaptiveAuth system because of sensitivity.

**Do not use AdaptiveAuth as a live dependency for Crypto Barber Shop.**

### What AdaptiveAuth actually is

Reviewed in this repo (`services/auth-server`, `packages/shared-auth`, `packages/validation`):

| Piece       | Behavior                                                                                                                                 |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Identity    | Mongo/`User`: **email + password required**, default `photo`, default `phone: '+98'`, roles `subscriber \| author \| admin \| suspended` |
| Session     | Cookie access JWT bound to `sid`, refresh rotation, CSRF, idle + absolute timeout                                                        |
| Extra login | **Device-trust OTP after password**, Google login, email verification, forgot password                                                   |
| Frontend    | Vue/Nuxt clients that bootstrap refresh and guard routes                                                                                 |

The OTP that exists today is **not** passwordless customer auth. It is a second factor for an untrusted browser after email/password. Roles are CMS-shaped (`subscriber`/`author`), not `owner`/`manager`/`barber`.

### Why wiring it in is a bad fit

1. **Wrong user shape.** Staff are 5 people with a calendar. They do not need Google login, trusted-device lists, or `subscriber`.
2. **Wrong database.** Appointments want PostgreSQL ranges and exclusion constraints. AdaptiveAuth is Mongoose. You would run **two databases** for one shop.
3. **Wrong boundary.** A separate auth process is justified when many apps share identity. Here there is one Nuxt app. Staff auth should live in the booking API.
4. **Wrong threat model applied to the wrong actor.** Session idle timeout and CSRF are good ideas for a browser dashboard. Copy them. Do not import device-trust and password-reset email templates to get there.
5. **Customer vs staff split is correct** — and AdaptiveAuth cannot be both. Even if staff used it, guests still book unauthenticated. You would still design a second identity for customers later.

### What to reuse

- Cookie session + refresh rotation + CSRF on mutating staff APIs
- Server-side session row (revocation), not “JWT forever”
- `requireRoles(['owner','manager','barber'])`
- Typed errors, correlation IDs
- Nuxt 4 + PrimeVue + layout chrome from `apps/nuxt-app` as a **UI starting point**, not as the product app inside this monorepo

Staff v1 login: **email + password** (or a single owner invite link). Optional TOTP later. Not Google. Not customer OTP.

**Repo:** do not grow AdaptiveAuth into a barbershop. New app (new repo or a clearly isolated workspace). The auth monorepo stays an auth monorepo.

---

## 6. MVP vs later

### MVP (ship this)

- Public site: home, services + prices, team, gallery, about, contact, map, booking
- Guest book: service → barber (or any available) → date/time → name/phone/email
- One calendar for online + phone + walk-in/block
- Overlap prevention per staff (Postgres exclusion)
- Staff dashboard: day/week calendar, create/cancel, working hours
- Email: request received / confirmed / cancelled
- Reminder email ~24h before (SMS later)
- Display 2-hour / 50% policy as copy
- Timezone: `America/Vancouver` stored explicitly

### Nice-to-have (after the shop uses v1 for 2–4 weeks)

- Pending-with-hold if they still want approval
- SMS reminders (Canadian SMS provider; cost vs no-show)
- Customer OTP accounts + appointment history
- Enforce cancel fee (Square/Stripe)
- After-hours +50% as a priced rule, not a footnote
- Simple overdue/rebook list (weak for barbers vs color salons, still useful)

### Future SaaS (do not build)

- Tenant provisioning, custom-domain control plane, subscriptions
- Marketplace, AI, loyalty engine, POS, inventory
- Crypto payments in the booking path (keep as marketing copy until they ask to checkout in BTC)
- AdaptiveAuth as the identity plane

---

## 7. Proposed architecture (single business, SaaS-shaped data)

```text
cryptobarbershops.com  (Nuxt 4)
  public pages + /book
  /app/*  staff only

API (Fastify or Nest, TypeScript)     PostgreSQL
  public: availability, create booking
  staff:  calendar, hours, services, people
  NotificationPort → email (Resend/Postmark/etc.)
```

**Soft tenancy:** every business table has `business_id`. Seed one row. No tenant middleware product, no custom-domain router. Later, domain → `business_id` is a lookup, not a rewrite.

**Do not** put booking state in WordPress, Google Calendar, or AdaptiveAuth Mongo.

### Domain model (minimum)

```text
Business
StaffMember     (barber; working hours, buffers)
Service         (duration, price, after-hours flag later)
Customer        (name, phone, email; no login)
Appointment
  staff_id, service_id
  customer_id nullable
  time range (tstzrange)
  status: confirmed | cancelled | no_show | (optional pending)
  source: online | phone | walk_in | block
  guest_name, guest_phone, guest_email  (always stored; linking later)
SlotHold        (only if pending-with-hold)
StaffUser       (login; role owner | manager | barber)
StaffSession
```

**Availability:** working hours minus appointments minus holds. Unique exclusion on `(staff_id, during)` where `during` is a `tstzrange` and status occupies the chair.

**Guest → account later:** unique on normalized phone/email when an account exists; backfill `customer_id` by match. Do not require it now.

### Booking edge cases (must handle in v1)

- Two tabs, same slot → one wins, the other gets a clear error
- Barber day off / break
- Service duration longer than remaining hours
- Staff creates a phone booking while a guest is on the last step (hold or fail)
- Walk-in overlaps a soon starting online booking
- DST in Vancouver
- Cancel after start time
- Stylist chosen vs “any barber” (if you offer any: assign one staff row, do not leave it unscoped)

### Provider-agnostic ports

| Port       | v1 adapter                         | Do not couple domain to  |
| ---------- | ---------------------------------- | ------------------------ |
| Email      | one transactional provider         | WordPress SMTP           |
| SMS        | none in v1                         | Twilio hardcoded         |
| Payments   | none in v1                         | Stripe/Square/crypto     |
| Calendar   | our DB                             | Google Calendar          |
| Auth staff | our sessions                       | AdaptiveAuth service URL |
| Files      | local or S3-compatible for gallery | WP media library         |

---

## 8. How this becomes multi-tenant later (without doing it now)

1. `business_id` on every row from day one.
2. Public site reads `Business` for name, hours, copy, theme tokens — not hardcoded “Crypto” in appointment code.
3. Custom domain is DNS + one env var today (`PUBLIC_SITE_URL`). Later: `domains` table.
4. Staff users belong to one business. Later: memberships.
5. No shared customer marketplace IDs.

That is enough. Schema-per-tenant, Kafka, and a domain registrar integration are not “leaving the door open.” They are a different product.

---

## 9. Nuxt implementation notes

- **One Nuxt 4 app:** public SSR pages (SEO, Google Maps traffic) + client-heavy `/app` calendar.
- Do not start from `apps/nuxt-app` in this repo as the shop itself; copy layout conventions if useful.
- Booking wizard: stylist-first matches the current WP UX (owner already trained customers that way). Service-first is also fine; pick one and do not ship both.
- Gallery/about: CMS-lite (Markdown or a `content` table) so the owner is not waiting on deploys for copy. Not WordPress.
- Do not force PrimeVue on the public brand site if it fights the barbershop look. Dashboard can use it.

Inspect the live WP booking plugin before coding slot rules: durations, padding, which hours each barber actually works. The marketing pages lie about hours; the plugin config is the source of truth if it still runs.

---

## 10. Recommended sequence (still no large implementation)

1. Sit with the owner for one busy Saturday. Count walk-ins vs bookings vs phone. Confirm hours per barber.
2. Decide: auto-confirm vs pending-with-hold.
3. Export services, prices, staff, and any existing appointments from WP if possible.
4. Implement calendar + guest book + staff UI.
5. Run parallel with WordPress for a week (or take bookings only on the new site on two weekdays).
6. Only then talk OTP, SMS, deposits, or a second business.

**Kill / shrink if:** the owner still wants to run the book in Instagram/WhatsApp, will not put walk-ins on the calendar, or expects crypto checkout and loyalty in week one.

---

## 11. Direct answers to the brief’s architecture list

| Ask               | Answer                                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------------------ |
| Existing project  | AdaptiveAuth monorepo: Vue + Nuxt demo apps + Express/Mongo auth. Unsuitable as the barbershop runtime.            |
| Current website   | WordPress on cryptobarbershops.com; cryptobarbershop.com down. Reproduce pages + stylist-first booking + policies. |
| Architecture      | Nuxt 4 + TS API + PostgreSQL; email port; no AdaptiveAuth process.                                                 |
| Domain models     | Business, Staff, Service, Customer (no login), Appointment, StaffUser.                                             |
| Calendar          | One `tstzrange` per occupying appointment; online/phone/walk-in share it.                                          |
| Edge cases        | Concurrency, walk-ins, DST, duration overflow, pending-without-hold.                                               |
| Future SaaS       | `business_id` now; domains and billing later.                                                                      |
| Provider-agnostic | Email, later SMS/payments; never Google Calendar as source of truth.                                               |
| MVP / later       | §6.                                                                                                                |

---

## Out of scope for this page

- Implementation, migrations, or UI.
- Legal advice on collecting Canadian customer PII (PIPEDA) or charging no-show fees.
- Global beauty-market strategy — see [`beauty-platform-feasibility-analysis.md`](./beauty-platform-feasibility-analysis.md).
