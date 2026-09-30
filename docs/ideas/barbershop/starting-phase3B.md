Phase 3A is APPROVED. You may now start Phase 3B implementation.

I reviewed the full Phase 3A design report and approve the proposed architecture, UX, application boundaries, and implementation scope.

## 1. Approval of the 8 open decisions

Proceed with the following decisions:

1. Authorization
   - YES: Any signed-in staff user may view and operate the entire shop calendar, including every barber column, appointment, and calendar block.
   - Do not add role-based or column-level restrictions in Phase 3B.
   - `businessId` must always come from the authenticated session.
   - `staffMemberId` in request bodies represents the target/booked barber resource, not an authorization identity claim.

2. Post-login landing
   - YES: Make `/app/calendar` the primary post-login staff destination.
   - Calendar should become the first/default staff navigation item.
   - Keep Overview available as a configuration/summary page.

3. Cancelled / no-show appointments
   - YES: Do not render cancelled or no-show appointments on the operational calendar grid.
   - They do not occupy availability.
   - Do not turn the Phase 3B calendar into a customer-history/CRM view.
   - Completed appointments remain visible because they still occupy the chair for the calendar day.

4. Walk-in "Now"
   - YES: Keep the existing 10-minute slot invariant.
   - "Now" must resolve to an aligned 10-minute start.
   - Do NOT relax `assertSlotAligned` or introduce arbitrary walk-in timestamps.
   - Continue using the existing `reserveAppointment({ source: 'walk_in' })` path.

5. Calendar block editing
   - YES: Include `updateCalendarBlock` in Phase 3B.
   - Do not require cancel + recreate as the only editing workflow.
   - The update operation must use the same transactional/concurrency protections described in the Phase 3A design.

6. Complete / no-show time gate
   - YES: No domain/application time gate in Phase 3B.
   - `CONFIRMED -> COMPLETED` and `CONFIRMED -> NO_SHOW` may be performed without checking whether the appointment start time has passed.
   - Do not add an undo/reopen transition.
   - However, the UI MUST use an explicit confirmation step before Complete and No-show actions to reduce accidental state changes.
   - This confirmation is UI behavior only and must not change the domain state machine.

7. Staff-hours editor
   - YES: Keep the staff-specific working-hours editor out of Phase 3B.
   - Calendar must display existing staff-specific hours if present in the database.
   - Do not add new staff-hours configuration UI in this phase.

8. Refresh / realtime
   - YES: No polling, WebSockets, SSE, or other realtime infrastructure in Phase 3B.
   - Refetch the calendar after successful mutations.
   - Refetch after relevant 409/404 mutation failures before retry.
   - Refetch when the document becomes visible again.
   - Provide a manual refresh control.
   - Do not introduce Redis, queues, or realtime infrastructure.

## 2. Four additional clarifications

### Clarification A — Appointment source labels

There is a small inconsistency/typo in the appointment-card source-label description.

Do NOT introduce a `WAIT` source.

The only appointment sources are the existing domain values:

- `ONLINE`
- `PHONE`
- `WALK_IN`
- `STAFF_CREATED`

The UI may display them as:

- Online
- Phone
- Walk-in
- Staff

Use the actual existing enum/source values in the application and API. Do not add or invent another source.

### Clarification B — Complete / No-show confirmation

Keep the approved state machine exactly:

CONFIRMED -> COMPLETED
CONFIRMED -> NO_SHOW
CONFIRMED -> CANCELLED

All other transitions remain illegal.

There is NO time gate in the domain/application layer.

However:

- Complete action must require UI confirmation.
- No-show action must require UI confirmation.
- Confirmation is only a UX safeguard.
- Do not add undo/reopen behavior.
- Do not introduce new status transitions.

### Clarification C — Update Calendar Block

`updateCalendarBlock` is explicitly INCLUDED in Phase 3B.

It should support changing:

- title
- start/end
- staff-specific vs shop-wide assignment

It must preserve the concurrency and occupancy protections from the Phase 3A design:

- transaction
- appropriate business/resource locking
- exclude the block itself when checking its current occupancy
- PostgreSQL constraints remain authoritative

Do not implement this as a UI-only mutation or bypass the application layer.

### Clarification D — Preserve the Phase 2B scheduling architecture

Do not redesign the Phase 2B scheduling engine as part of Phase 3B.

Keep:

- `reserveAppointment`
- `checkAvailability`
- PostgreSQL overlap protection
- GiST exclusion constraints
- Any Barber selection/retry behavior
- 10-minute slot alignment
- existing timezone/DST helpers
- existing guest appointment model
- existing appointment/block concurrency semantics

If implementation reveals a genuine Phase 2B defect, stop and report it rather than silently redesigning scheduling behavior.

## 3. Phase 3B implementation scope

Now proceed with Phase 3B only.

Implement the approved design, including:

1. Mobile-friendly staff app shell/navigation.
2. `getCalendarDay` application use case.
3. `GET /api/staff/calendar?date=YYYY-MM-DD`.
4. Staff Calendar page.
5. Custom CSS Grid Resource Timeline.
6. Dynamic barber columns.
7. Mobile one-barber focused timeline + barber switcher.
8. Mobile "All" chronological appointment list.
9. Desktop/tablet multi-column Resource Timeline.
10. Appointment detail sheet/dialog.
11. Existing appointment cancellation workflow.
12. `completeAppointment`.
13. `markNoShow`.
14. Walk-in workflow using existing `reserveAppointment`.
15. Calendar block creation using existing `createCalendarBlock`.
16. `updateCalendarBlock`.
17. `cancelCalendarBlock`.
18. Closed-day display.
19. Business/staff effective-hours display.
20. Business-timezone/DST-aware rendering.
21. Mutation error handling and refetch behavior.
22. Manual refresh and visibility-based refresh.
23. Required unit/application/integration/UI tests described in the Phase 3A design.

## 4. Explicitly DO NOT implement in Phase 3B

Do not add or start:

- public booking UI
- customer accounts
- OTP
- customer sessions
- SMS/email notifications
- payments/deposits integration
- loyalty/CRM
- analytics
- multi-tenancy
- custom domains
- billing
- Redis
- queues
- WebSockets/realtime infrastructure
- polling
- drag-and-drop rescheduling
- first-class reschedule/reassign workflow
- new backend framework
- separate WalkIn entity or WalkIn engine
- new scheduling engine
- staff-hours editor
- role-based RBAC
- audit logging

Do not expand the scope beyond the approved Phase 3B design.

## 5. Architecture rules

Keep the established architecture:

Browser
→ Nuxt/Vue
→ Nitro HTTP layer
→ Application/use cases
→ Domain
→ PostgreSQL

Important:

- Nitro handlers remain thin.
- No H3/Nitro dependencies inside scheduling application/domain logic.
- No scheduling logic duplicated in Vue components.
- The UI must call application-backed APIs.
- PostgreSQL remains the final concurrency/occupancy authority.
- `businessId` must never be accepted from the client as an authority value.

## 6. Mobile-first requirement

Mobile is the primary UX priority.

Do not simply shrink the desktop Resource Timeline.

On phones:

- one barber focused at a time
- barber switcher
- optional/all-barbers chronological list
- no horizontal multi-barber timeline scrolling
- touch-friendly controls
- no hover-only essential actions
- dialogs/sheets appropriate for small screens
- mobile navigation must make the existing `/app` shell genuinely usable

Desktop/tablet may use the richer multi-column Resource Timeline.

The same application/API/domain logic must serve all breakpoints.

## 7. Verification requirements

Before declaring Phase 3B complete:

- run lint
- run type-check
- run the full test suite
- run PostgreSQL integration tests against real PostgreSQL
- run production build
- verify the important calendar/concurrency workflows
- report exactly what passed and what was skipped
- do not claim integration verification if PostgreSQL was unavailable

Pay particular attention to:

- dynamic barber count
- closed days
- staff-specific hours
- completed/no-show occupancy semantics
- walk-in reservation
- block creation/update/cancellation
- concurrent reservation/block behavior
- business isolation
- timezone/DST behavior
- mobile calendar behavior
- mutation → refetch behavior

## 8. Phase boundary

This approval authorizes implementation of Phase 3B only.

Do not proceed into Phase 4 or any later phase after completing 3B.

When Phase 3B implementation and verification are complete, STOP and provide a concise implementation/verification report, including:

- files/components added or changed
- application/use cases added
- API routes added/changed
- database/schema changes, if any
- tests added
- verification results
- known limitations
- unresolved issues
- confirmation that no Phase 4+ work was started

Start Phase 3B now.
