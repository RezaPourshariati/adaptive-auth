# Crypto Barber Shop — Plan Acceptance & Phase 0

**Primary question:** Does `start-beauty-platform-2.md` close architecture, and what is Phase 0?

**Date:** 2026-09-05
**Status:** Architecture accepted. Phase 0 is the first implementation.
**Source of truth:** [`start-beauty-platform-2.md`](./start-beauty-platform-2.md)
**Prior proposal:** [`crypto-barber-architecture-proposal.md`](./crypto-barber-architecture-proposal.md)

---

## Short answer

No serious technical contradiction. Follow that document. Do not reopen calendar vs marketplace, auto-confirm, guest booking, PostgreSQL exclusion, AdaptiveAuth-as-reference, or `apps/barbershop`.

Phase 0 is **foundation only**: Nuxt 4 + SSR + TypeScript + workspace scripts + Drizzle/Postgres wiring + health check + tests. No staff, services, calendar, or OTP.

---

## 1. Decisions accepted (do not relitigate)

Everything in §59 of the source-of-truth brief stands. In particular:

- `apps/barbershop`, this git repo, no nested git
- SSR Nuxt 4, PostgreSQL, Drizzle, `business_id`
- `reserveAppointment()` as the only writer (Phase 2)
- Guest book; OTP in Phase 6
- Deposit due/not-configured must not block booking
- Busy blocks optional; staff pick duration
- 10-minute slot grid; no drag-and-drop yet
- Notifications after commit via outbox (Phase 5)

Drizzle is confirmed as the ORM.

---

## 2. Residual notes (not redesigns)

These do not block Phase 0.

**Cancel “previous day” vs `noticeHours = 4`.** Same-day cancel more than 4 hours before the slot is not named. **Assumption until the owner says otherwise:** self-serve cancel when `now < start − noticeHours`. Later than that: show contact instructions. Dashboard can change `noticeHours`.

**Walk-in without a record.** Accepted as staff discretion. Online booking can still land on a chair that is physically occupied. Busy Block is the tool, not a mandate.

**Availability vs deposit.** §35 lists deposit as an availability input. §26 says missing payments must not block booking. **Rule:** deposit never removes a slot. It may later add a badge or a payment step. It does not change `reserveAppointment` overlap logic.

**Hours 08:00–19:00** are seed/config, not code constants. Live WordPress copy still disagrees; the owner’s brief wins until they change it in the dashboard.

**Prices and service list** remain missing. Do not invent them. Phase 1 dashboard captures them.

**Website content** (images, exact menu) still comes from cryptobarbershops.com / the owner. Phase 8.

---

## 3. Phase 0 plan

| In                                                     | Out                                      |
| ------------------------------------------------------ | ---------------------------------------- |
| `apps/barbershop` workspace app                        | Product tables (staff, appointments, …)  |
| Nuxt 4, **SSR on**, port **3001**                      | AdaptiveAuth runtime imports             |
| ESLint + `nuxt typecheck` + Vitest + `nuxt build`      | PrimeVue, calendar UI, OTP               |
| `DATABASE_URL`, Drizzle config, empty product schema   | Redis, queues, SMS                       |
| `GET /api/health` (db: `up` / `down` / `unconfigured`) | Fake business copy (prices, barber bios) |
| Root scripts: `dev:barbershop`, `lint:barbershop`, …   | New git repository                       |

**Definition of done:** app runs; health works without Postgres (`unconfigured`); with `DATABASE_URL`, health can ping; lint, typecheck, unit tests, and production build succeed.

Stop after Phase 0. Phase 1 (business configuration dashboard) needs explicit approval.

---

## Out of scope for this page

- Phase 1+ implementation
- Service prices and barber roster (owner-supplied)
- Multi-tenancy
