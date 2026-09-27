# Architecture

Nitro is the HTTP adapter. It is not the application.

```
Browser
  → Nuxt UI
  → Nitro route (parse, auth, Zod, HTTP errors)
  → Application use case (plain TypeScript)
  → Domain rules
  → Drizzle / PostgreSQL
```

## Layers

- `server/api/` — HTTP only. Staff `businessId` comes from the session, never from the client body.
- `server/application/scheduling/` — `checkAvailability`, `reserveAppointment`, `cancelAppointment`, `completeAppointment`, `markNoShow`, `createCalendarBlock`, `updateCalendarBlock`, `cancelCalendarBlock`, `getCalendarDay`, `pickBarberOrder`. No H3/`createError`.
- `server/domain/scheduling/` — slot grid, hour intersection, timezone, half-open ranges, error helpers.
- `server/db/` — Drizzle + PostgreSQL.

Do not add Express, Fastify, Nest, Redis, or a second API process.

## Appointment model

An appointment is always assigned to a real `staff_member`. Status is `confirmed | completed | cancelled | no_show`. Source is `online | phone | walk_in | staff_created`. Walk-in is a source, not a status.

Guest contact lives on the appointment (`guest_name`, optional phone/email). There is no `customer_id` yet.

`appointment_service` stores historical snapshots: name, duration, price, currency. Later catalog edits do not change booked visits. `end_at = start_at + sum(duration snapshots)`.

`calendar_block` is not a fake appointment. `staff_member_id` null means shop-wide.

## Availability

`checkAvailability({ businessId, serviceIds, localDate, staffMemberId? })`

1. Load business timezone and active services.
2. Eligible active barbers (all requested services).
3. Weekday in the business timezone.
4. Effective hours = business hours, intersected with staff hours when staff hours exist. No business hours = closed.
5. Subtract occupying appointments (`confirmed`, `completed`) and active blocks.
6. Convert local ranges to instants.
7. Emit 10-minute starts that fit the full duration and are not in the past.

Any Barber returns the union of start times and does not assign a barber.

## Reservation and concurrency

`reserveAppointment` is the only writer for real bookings.

Inside one transaction: lock business, snapshot services, resolve start, lock each candidate barber in `sort_order` then `id` order, re-check eligibility/hours/appointments/blocks, insert appointment + services.

PostgreSQL GiST exclusion on `tstzrange(start_at, end_at, '[)')` is the last line. Occupying statuses only. `23P01` maps to `SLOT_UNAVAILABLE`; Any Barber tries the next candidate.

Cancelled and no-show do not occupy. Adjacent `[10:00,10:40)` and `[10:40,11:20)` do not overlap.

## Any Barber

A preference only. Never persisted. Deterministic order. Concurrent requests take different barbers when more than one is free.

## Timezone

Working hours stay local `time`. Appointments store `timestamptz` plus a timezone snapshot. Local date + time + `business.timezone` become instants via `date-fns-tz`. Spring-forward gaps are rejected. Fall-back uses the earlier instant.

## Business-configurable vs invariants

Configurable: working hours, service duration/price, cancel notice, deposit percent.

Invariants: no overlapping occupying appointments, `end > start`, snapshots, same-business FKs, real barber on every appointment, 10-minute grid (not a dashboard setting).

## Errors

`DomainError` codes such as `SLOT_UNAVAILABLE`, `OUTSIDE_WORKING_HOURS`, `STAFF_NOT_ELIGIBLE`. Nitro maps 404/409/400.

## Tests

Unit tests cover slots, hours, DST, Any Barber order, and the Nitro-free boundary.

Integration tests need PostgreSQL (`DATABASE_URL` or `BARBERSHOP_TEST_DATABASE_URL`) and are skipped when it is unset. They must not be treated as passing without a database.
