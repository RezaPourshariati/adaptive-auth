# Beauty Platform — Product Discovery & Feasibility Analysis

**Primary question:** Should we build a Beauty Business Intelligence Platform, and if so, what is the first product?

**Date:** 2026-08-18
**Status:** Discovery recommendation. Do not implement yet.
**Companion brief:** [`beauty-platform-idea.md`](./beauty-platform-idea.md)

---

## Short answer

1. **Do not build a “Beauty BI Platform” for the US/UK/EU.** Booking, waitlists, deposits, reminders, and retention CRM are already table stakes. Phorest, Zenoti, Mangomint, Fresha, Vagaro, Square, and Booksy already sell the intelligence layer you hypothesized. The remaining gap is incremental, not a company.
2. **Do not start with AI, consultation vision, or a marketplace.** Those are expensive, weakly paid, and already occupied by specialist tools (OpenChair Style Match, HairGenie, Inspo Hair, Booking Pro AI).
3. **The proposed Phase 1 is the trap.** It is a full salon operating system. That is 12–24 months of undifferentiated work _before_ you reach the features you think are the product.
4. **There is a real adjacent opportunity** if the first market is one where Fresha/Stripe/Twilio barely work: **Iran and similar constrained regions.** Local competitors exist (رخساره, سیسنو, پلنوین, آنتایم, چهره) but the typical workflow is still Instagram DM + phone. A modern booking + WhatsApp/SMS rebooking product can win there. Positioning should be **filled chairs**, not “intelligence.”
5. **Reuse AdaptiveAuth as patterns, not as the product backbone.** Session/RBAC thinking transfers. Mongo/Express identity does not become a salon ledger.

**Recommended first product (if we proceed):** a multi-tenant salon operating layer for **1–8 chair hair salons in Iran**, starting with public booking + calendar + local SMS/Telegram reminders + an overdue-client list with one-tap rebooking. Revenue recovery (last-minute fill) is the second feature, still rule-based. No AI in v1.

---

## 1. Verdict on the current hypothesis

The hypothesis in the brief:

> Instead of building only a booking system, build a multi-tenant SaaS that uses booking data for revenue optimization, retention, consultation intelligence, and automation.

This is directionally right about **where value lives** (filled chairs, returning clients) and directionally wrong about **positioning, sequencing, and competitive reality**.

| Claim in the brief                                             | Assessment                                                                                                                                                  |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Generic booking is not differentiated                          | **Correct.** Do not build “another Fresha” for markets Fresha already owns.                                                                                 |
| Therefore we should be a BI / intelligence platform            | **Incorrect as a go-to-market.** Salon owners buy outcomes (fewer empty chairs), not a category called BI. Incumbents already productized the same screens. |
| Booking data is the foundation for intelligence                | **Correct technically.** That is exactly why incumbents win: they already have the calendar.                                                                |
| Start with a full multi-tenant salon OS, then add intelligence | **Incorrect sequencing for a small team in a saturated market.** Correct sequencing only if you are entering an underserved _operations_ market.            |
| AI will differentiate consultation / inspiration               | **Mostly false.** Rules + structured forms get 80% of the value. Vision/recommendation is a wow feature with weak retention, and specialists already exist. |
| SaaS first, marketplace later                                  | **Correct.** Marketplace is a two-sided liquidity problem. Skip it.                                                                                         |
| Provider-agnostic notifications and payments                   | **Correct and mandatory**, especially from a constrained region.                                                                                            |

**Reframed positioning (if we build):**

> Software that keeps the chair full: online booking that works on Instagram, reminders clients actually receive, and a list of who is overdue for their usual service.

Not: “Beauty Revenue & Client Intelligence Platform.” That name sounds like a dashboard for people who already have Phorest.

---

## 2. Market validation

### 2.1 Market size and structure

Published “salon software” numbers disagree because they mix POS, booking, spa, fitness, and medspa:

- Spa & salon software: about **USD 1.0B in 2025**, ~10.7% CAGR (Mordor / GII).
- Broader salon management software: about **USD 1.2B in 2025**, ~9.6% CAGR (TBRC).
- Other reports range **USD 0.74B–2.9B**. Treat the range as “low-single-digit billions, growing ~10%,” not a precise TAM.

What matters more than TAM:

- **Fragmented supply.** Top-5 share is often cited around ~19% in older salon-software definitions. That sounds like an opening. It is not. The _booking_ layer for independent beauty in the West is dominated by a handful of consumer-facing brands (Fresha claims 130k+ businesses / 450k+ professionals depending on the source).
- **Demand is owner-operators.** Small/individual professionals were ~51% of spa/salon software spend in 2025. They buy on price, phone support, and “does the calendar not double-book.” They do not buy “LTV models.”
- **Medium multi-location is where analytics budgets live.** That is also where Zenoti, Boulevard, and Phorest already sit, with sales teams and onboarding.

**Implication:** a solo engineer can reach owner-operators. Reaching them _in English-speaking markets_ means competing with free/cheap booking plus a marketplace that sends them clients. That is a distribution war, not a feature war.

### 2.2 Competitor map

Features below are “does a serious implementation exist,” not “is it perfect.” Sources: vendor docs, Capterra/G2/Software Advice themes, and salon-industry comparison writeups (2025–2026).

| Capability                         | Fresha                                   | Vagaro                   | Booksy                      | Square Appointments        | Salonkee                | Phorest                                    | Mangomint                   | Zenoti                      |
| ---------------------------------- | ---------------------------------------- | ------------------------ | --------------------------- | -------------------------- | ----------------------- | ------------------------------------------ | --------------------------- | --------------------------- |
| Online booking + calendar          | Yes                                      | Yes                      | Yes                         | Yes                        | Yes                     | Yes                                        | Yes                         | Yes                         |
| CRM / client file                  | Yes                                      | Yes                      | Yes                         | Yes                        | Yes                     | Yes                                        | Yes                         | Yes                         |
| Payments / deposits                | Yes (forced in-house)                    | Yes                      | Yes                         | Yes                        | Yes (add-on)            | Yes                                        | Yes                         | Yes                         |
| No-show / card-on-file             | Yes                                      | Yes                      | Yes                         | Yes (paid tiers)           | Yes                     | Yes                                        | Yes                         | Yes                         |
| Waitlist                           | Automated                                | Yes                      | Yes                         | Auto-fill openings         | Yes                     | Yes                                        | “Intelligent Waitlist”      | Automated                   |
| Reminders SMS/email                | Yes                                      | Yes                      | Yes (SMS caps)              | Yes                        | Yes                     | Strong                                     | Yes                         | Yes                         |
| Retention / lapsed clients         | Weak vs Phorest                          | Campaigns (often add-on) | Basic                       | “Lapsed Booker” automation | Loyalty on higher plans | **Client Reconnect (per-client interval)** | Basic                       | Predictive churn            |
| Analytics                          | Operational                              | Operational              | Basic                       | Operational                | Higher plans            | KPI + Insights AI                          | Clean UX, lighter analytics | Deep, multi-location        |
| Consultation / forms               | Limited                                  | Custom forms             | Basic notes                 | Forms                      | Forms on Business       | Medspa-grade                               | Forms                       | Clinical                    |
| AI                                 | Limited                                  | Limited                  | Limited                     | Limited                    | Limited                 | Insights AI, Front Desk AI                 | Limited                     | Receptionist, Zeenie, churn |
| Marketplace                        | **Core moat** (20% new-client fee)       | Yes, no commission       | **Core moat**               | Square Go                  | Local listing           | Weaker                                     | No                          | No                          |
| Integrations                       | Weak / lock-in                           | Better                   | Mixed                       | Square ecosystem           | Regional                | Strong marketing                           | Modern API                  | Enterprise                  |
| Typical buyer                      | Solo / small, discovery                  | Multi-staff ops          | Solo / barber discovery     | Square POS users           | DACH / Benelux / FR     | Established UK/IE salons                   | Boutique US                 | Chains / medspa             |
| Headline pricing (indicative 2026) | ~$20 solo or ~$15/seat + 20% marketplace | ~$25+/calendar + add-ons | Per staff, features bundled | Free solo → paid Plus      | From ~€49–79/mo         | Quote                                      | Simplified one plan (2026)  | Quote / high                |

**Also in the category (do not ignore):** GlossGenius (US solos), Boulevard (premium), Mindbody (fitness-adjacent), DaySmart, Meevo, Pabau (clinics), OpenChair (AI style match on the storefront).

### 2.3 What users actually complain about

This is more useful than feature checklists. Recurring themes from Reddit, Software Advice, Capterra, Trustpilot, and salon Facebook groups:

**Fresha**

- Marketplace fee charged on clients the salon believes they already had (Google, Instagram, walk-in).
- End of “free forever” (2025) → per-seat subscription + processing + 20% new-client fee. Bill shock.
- Forced payments stack; weak third-party integrations; clients must create a Fresha account.
- Support / billing disputes. Some Middle East owners report aggressive sales and lock-in.

**Booksy**

- Payout holds and payment delays.
- Clients forced into the consumer app.
- Seat cost as the team grows.
- Support during billing issues.

**Vagaro**

- Add-on pricing for features people assumed were included.
- Glitches after updates.
- Marketing depth weaker than Phorest; post-visit review/rebook often needs extra tools.

**Square**

- Fine if you already live in Square. Weak as a beauty-specific CRM. Advanced no-show/waitlist sits behind paid tiers.

**Phorest / Mangomint / Zenoti**

- Price, switching cost, “too much software,” dated UI (Phorest), or overkill for a 3-chair salon (Zenoti).
- Complaints are about **weight and cost**, not “we have no waitlist.”

**Translation:** the painful jobs-to-be-done in saturated markets are **pricing honesty, switching, marketplace tax, support, and integrations** — not the absence of a retention engine. Building a better LTV chart does not address those complaints unless you also replace the calendar they already use.

### 2.4 Iran / constrained-region overlay

The brief says external services can be hard to reach. Given timezone UTC+3:30 and that constraint, **Iran is the realistic home market** unless a foreign entity and payment stack exist.

Global incumbents are structurally weak here:

- Stripe, Adyen, Square, Twilio, and Fresha Payments are not a viable local stack.
- OpenAI / Anthropic / Google APIs are unreliable as production dependencies without a foreign proxy (legal, latency, and outage risk).
- Consumer booking still runs on **Instagram Direct, phone, and card-to-card**.

Local software already exists:

| Product             | What they sell                                                             | Signal                                                |
| ------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------- |
| رخساره (Arayeshkar) | Accounting + CRM + booking; claims long tenure and brand-salon share       | Incumbent for “proper” salons; likely desktop-era DNA |
| سیسنو (Sisno)       | Cloud panel: booking, staff, SMS, loyalty, accounting; claims 1200+ salons | Direct SaaS competitor                                |
| پلنوین (Planovin)   | Cloud CRM + public booking page                                            | Same category                                         |
| آنتایم (Ontime)     | Lightweight booking + SMS for independents                                 | Price/simplicity competitor                           |
| چهره (Chehreh)      | Accounting suite + online booking add-on                                   | Accounting-first, booking second                      |

**This is a real market, not an empty one.** The opening is not “nobody has salon software in Iran.” The opening is: many salons still run Instagram + phone; local products compete on accounting/SMS more than on a modern public booking UX; global products cannot finish the job (payments, deposits, app stores, marketplace).

If the intent is **EU/US customers from day one**, the regional constraint becomes a company-formation and payments problem for _you_, not just for salons. That is a bigger blocker than architecture.

---

## 3. Problem validation (five hypothesized opportunities)

Scoring is 1–10. **Overall** is not an average of hype; it weights willingness-to-pay, competitive gap, and whether a small team can sell it without a full OS.

Legend for **Overall:** 8+ build-first candidate · 6–7 useful later module · ≤5 do not lead with this.

### 3.1 Revenue recovery / empty-slot fill

| Question             | Finding                                                                                                                                                                                                                                                                                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Actual problem       | Last-minute cancel and no-show leave a sold hour empty. Industry no-show rates are repeatedly cited at **10–20%** (some salon blogs say 15–30% without reminders). One missed **~$100** slot/day is on the order of **~$30k/year**. Waitlists that notify within minutes are claimed to recover **40–70%** of _cancellations with notice_; true no-shows are much harder. |
| Who                  | Owners and front desk; worse for high-ticket color and Friday/Saturday peaks.                                                                                                                                                                                                                                                                                             |
| Frequency            | Daily in busy salons; rare in empty ones (and empty salons do not need recovery — they need demand).                                                                                                                                                                                                                                                                      |
| Current solutions    | Notebook waitlist; Instagram story “slot opened”; Fresha/Vagaro/Square/Mangomint waitlists; deposits so the slot is prepaid even if empty.                                                                                                                                                                                                                                |
| Why insufficient     | Most waitlists are FIFO or staff-mediated. Mangomint’s “Intelligent Waitlist” still **alerts the desk** more than it auto-sells the slot. Ranking by accept-probability × customer value is not the default. Speed is the real gap, not ML.                                                                                                                               |
| Would they pay       | Yes, **as part of calendar software**, if it clearly fills slots. Unlikely as a standalone $99 “recovery engine” if they already pay Vagaro.                                                                                                                                                                                                                              |
| ROI demo             | Excellent: recovered appointments × ticket.                                                                                                                                                                                                                                                                                                                               |
| Technical difficulty | Medium-high: need live availability, hold/lock, messaging, double-booking prevention, quiet hours, opt-in.                                                                                                                                                                                                                                                                |
| Defensibility        | Low once incumbents copy auto-offer SMS.                                                                                                                                                                                                                                                                                                                                  |
| AI needed?           | **No.** Rank: service match + stylist + time window + “has waited before” + LTV. Learn accept-rate later from outcomes.                                                                                                                                                                                                                                                   |

**Scores:** Pain 8 · Pay 7 · Gap 3 · ROI 9 · Feasibility 5 · Moat 3 · **Overall 6**

**MVP if we ever build it:** cancel → hold slot 15 minutes → SMS/Telegram the top 3 matching waitlist clients → first accept wins → release hold. No ML.

### 3.2 Client retention intelligence

| Question             | Finding                                                                                                                                                                                                                                                                                                               |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Actual problem       | Clients have a natural interval (color often **6–8 weeks**). They do not pre-book. Industry **rebook-at-checkout ~30–35%**; good salons **>50%**. New clients who do not return in ~30 days often never return. Annual retention often **60–70%**; drifting 1–2 weeks past _their_ interval is the actionable signal. |
| Who                  | Owners who already have a client book. Colorists more than walk-in barbers.                                                                                                                                                                                                                                           |
| Current solutions    | Stylist asks at the chair (still the highest-ROI “feature”). SMS blasts. Phorest Client Reconnect (personal interval). Square Lapsed Booker. Loyalty cards. Instagram.                                                                                                                                                |
| Why insufficient     | Generic “you haven’t visited in 60 days” is what every CRM does. Per-client interval is the upgrade — **and Phorest already ships it.** The remaining gap is UX and markets Phorest does not serve.                                                                                                                   |
| Would they pay       | Yes if it is a button on the daily list, not a dashboard. Owners pay for SMS that brings someone back this week.                                                                                                                                                                                                      |
| ROI demo             | Strong: overdue clients × historical ticket × expected return rate.                                                                                                                                                                                                                                                   |
| Technical difficulty | **Low** once appointment history exists. SQL + rules.                                                                                                                                                                                                                                                                 |
| Defensibility        | Low.                                                                                                                                                                                                                                                                                                                  |
| AI needed?           | **No.** Median days between visits per (client, service family). Flag overdue. Optional logistic regression much later.                                                                                                                                                                                               |

**Scores:** Pain 8 · Pay 7 · Gap 3 · ROI 8 · Feasibility 8 · Moat 3 · **Overall 7**

This is the best _module_. It is not a wedge in the US/UK because Phorest’s marketing is built on it. It _is_ a wedge module in a market where the incumbent is an accounting package plus a blunt SMS blast.

### 3.3 Consultation intelligence

| Question             | Finding                                                                                                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Actual problem       | Color correction, box dye, allergies, time underestimation, “this Instagram hair is 4 hours not 90 minutes.” Misaligned expectations cause refunds, bad reviews, and stylist stress. |
| Who                  | Colorists and correction specialists more than blow-dry bars. Medspas have a _clinical_ version of this (already owned by Pabau/Zenoti/Phorest medspa).                              |
| Current solutions    | Paper forms, WhatsApp photos, Instagram DMs, in-chair consult, generic booking form fields. Booking Pro AI and others now auto-flag allergies on intake.                             |
| Why insufficient     | Intake is unstructured. Duration is guessed. Photos live in the stylist’s phone.                                                                                                     |
| Would they pay       | Color-focused salons might pay a bit more. Most stylists will not change chair-side workflow for an “AI brief.”                                                                      |
| ROI demo             | Weak/fuzzy (fewer corrections, fewer reviews) unless you measure duration overrun.                                                                                                   |
| Technical difficulty | Forms: easy. “AI brief”: medium. “This needs 3 hours”: hard and legally awkward if wrong.                                                                                            |
| Privacy              | Photos of faces/hair, allergy data, possibly minors. Store in-region, minimize retention, do not send to a blocked US API by default.                                                |
| AI needed?           | **Not at first.** Structured form + photo upload + required consult for “correction / box dye / more than X cm off.” Template rules beat a model.                                    |

**Scores:** Pain 6 · Pay 5 · Gap 5 · ROI 4 · Feasibility 4 · Moat 4 · **Overall 4**

Build **structured intake + photos on the booking**, not an AI processing pipeline.

### 3.4 Inspiration → stylist → booking

| Question             | Finding                                                                                                                                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Actual problem       | Client has a screenshot and does not know which menu item to book.                                                                                                                                                 |
| Who                  | New clients; less valuable for regulars who already book “the usual.”                                                                                                                                              |
| Current solutions    | Instagram DM to the salon. OpenChair Style Match already does photo + description → menu services → book, with a confidence threshold that falls back to a consultation. HairGenie / Lumia / Inspo Hair do try-on. |
| Why insufficient     | DMs do not create a structured booking or the right duration.                                                                                                                                                      |
| Would they pay       | Weak as a standalone. Might lift conversion on a booking page slightly.                                                                                                                                            |
| ROI demo             | Poor.                                                                                                                                                                                                              |
| Technical difficulty | High (vision models, bad photos, lighting, hair vs filter).                                                                                                                                                        |
| Defensibility        | Very low.                                                                                                                                                                                                          |
| Marketplace risk     | High if you match across salons. In-salon-only is safer and also less of a product.                                                                                                                                |

**Scores:** Pain 5 · Pay 4 · Gap 4 · ROI 3 · Feasibility 3 · Moat 2 · **Overall 3**

Technically impressive, commercially a feature page. **Reject as a wedge.**

### 3.5 Personalized beauty / AI recommendation

| Question          | Finding                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Actual problem    | “What would suit me?” is real for consumers, not a daily owner KPI.                                                            |
| Current solutions | Stylist, Pinterest, try-on apps, filters.                                                                                      |
| Risk              | One-time wow, then unused. Liability if recommendations ignore hair health. Burns AI budget. Regional model access is fragile. |

**Scores:** Pain 3 · Pay 3 · Gap 2 · ROI 2 · Feasibility 3 · Moat 1 · **Overall 2**

**Reject.** Do not build.

### 3.6 Scoreboard

| Rank | Opportunity                                                | Overall | Lead with this?                                    |
| ---- | ---------------------------------------------------------- | ------- | -------------------------------------------------- |
| —    | **Regional salon OS** (adjacent, not in the original five) | **8**   | **Yes, if Iran-first**                             |
| 1    | Client retention (rule-based overdue + rebook)             | 7       | First _intelligence_ feature, not the company name |
| 2    | Revenue recovery (auto waitlist offer)                     | 6       | Second intelligence feature                        |
| 3    | Consultation intelligence                                  | 4       | Forms + photos only                                |
| 4    | Inspiration → booking                                      | 3       | No                                                 |
| 5    | Personalized AI beauty                                     | 2       | No                                                 |

---

## 4. The best wedge

The brief forbids “all five are promising.” Here is the choice.

### If the customer is a Western salon already on Fresha/Vagaro/Phorest

**Do not enter.** You will spend a year rebuilding a calendar to sell a ranked waitlist they will not migrate for. Overlay-only products die on closed APIs (Fresha lock-in is a known complaint).

### If the customer is an Iranian (or similar) 1–8 chair hair salon still on Instagram + phone

**Attack this one problem first:**

> “I lose hours to Instagram DMs and the phone, then I still have holes in the week because people cancel and regulars forget to come back.”

That is **operations + rebooking**, not BI.

| Field                  | Choice                                                                                                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primary customer       | Owner of a women’s hair salon, 1–8 chairs, Instagram-native, currently taking bookings in DMs/phone. Not MedSpas. Not chains. Not “all beauty.”                                                   |
| Primary pain           | Interrupted service work + empty slots + silent churn of color clients.                                                                                                                           |
| Core value proposition | A public booking link for the Instagram bio, a calendar that does not double-book, reminders on SMS/Telegram, and a daily list: “these 12 clients are past their usual interval — tap to invite.” |
| MVP                    | See §9.                                                                                                                                                                                           |
| Differentiation        | Local payments and messaging; Persian UX; no 20% marketplace tax; faster/modern than accounting-first incumbents; intelligence as **actions**, not charts.                                        |
| Monetization           | Monthly SaaS per salon (or per chair), plus pass-through SMS. Optional deposit via local PSP. No marketplace commission.                                                                          |
| Main competitors       | Instagram, سیسنو, رخساره, پلنوین, آنتایم — **not** Fresha.                                                                                                                                        |
| Biggest business risk  | Salons will not change habits; incumbents already have accountant relationships; SMS cost and delivery; you cannot out-support a local team that visits the salon.                                |
| Biggest technical risk | Messaging + payments + calendar concurrency on infra you can actually run from this region.                                                                                                       |

**Why not revenue recovery first?** Recovery only pays when the book is already full and cancellations are frequent. Many target salons are not sold out. Rebooking grows the book; waitlist fill optimizes a full book. Rebooking is the earlier loop.

**Why not consultation first?** It does not get you the calendar. Without the calendar you cannot prove ROI weekly.

---

## 5. Segment choice

| Segment                               | First target? | Why                                                                                                   |
| ------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------- |
| Women’s hair salons (cut + color)     | **Yes**       | Highest ticket, clearest interval (6–8 weeks), Instagram discovery, painful DMs for color consults.   |
| Independent colorists / chair renters | Strong #2     | Simple tenant (one person), high ticket, care about consult photos — still start with booking+rebook. |
| Barbershops                           | No            | Walk-in heavy, weaker software willingness, shorter cycles, more price-sensitive.                     |
| Nail salons                           | Later         | Excellent retention cadence (3–4 weeks) but lower ticket and crowded with simple booking tools.       |
| Beauty studios (brows, lashes)        | Later         | Same software shape; not the first reference customer.                                                |
| MedSpas / laser                       | **No for v1** | Clinical notes, consent, medical regulation, incumbents (Pabau, Zenoti, Phorest). Liability.          |
| “General beauty”                      | No            | That is how you become a worse Fresha.                                                                |

Hair-first also matches consultation _later_ (color history) without pretending you are a clinic.

---

## 6. Challenge the phase plan

Proposed in the brief: OS → payments/waitlist → intelligence → AI → marketplace.

**Problems:**

1. Phase 1 is already a company-sized surface (profile, services, staff, calendar, booking, CRM).
2. Notifications are listed in Phase 2. **A booking product without reminders is how you _create_ no-shows.** Reminders are MVP.
3. Intelligence is treated as a module you add after “analytics.” The useful version is a **list with a send button**, which can ship as soon as you have 2–3 visits of history.
4. AI and marketplace are optional futures that should not be on the roadmap until 50 paying salons.

**Revised phases**

```text
Phase 0 — Validation (weeks, not a product)
  15 owner interviews + 2 shadow days in a salon
  Price they pay today, message channel they read, cancel rate

Phase 1 — Chair filler (MVP)
  Tenant + staff + services + working hours
  Public booking page
  Calendar with overlap prevention
  Booking confirm + reminder (SMS/Telegram)
  Client list with visit history
  Overdue list + one-tap invite
  Local deposit optional, not required to start

Phase 2 — Slot filler
  Waitlist
  Cancel → offer → first accept
  No-show / late-cancel policy flags (rules)
  Simple day/week revenue report (not a BI suite)

Phase 3 — Intake
  Per-service form + photo upload
  Stylist brief (structured fields, no LLM required)

Phase 4 — Only if pulled by customers
  POS/accounting (or export to رخساره, do not recreate)
  Packages / gift cards
  Multi-location

Never unless strategy changes
  Consumer marketplace
  Hairstyle generator / face analysis
  “Insights GPT”
```

---

## 7. Architecture

Do not over-engineer the MVP. Do not force AdaptiveAuth’s Mongo session store to be the salon database.

### 7.1 Reuse of AdaptiveAuth

| Asset                                             | Reuse?                      | How                                                                                                                                    |
| ------------------------------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Session authority, CSRF, refresh, RBAC thinking   | Yes                         | Reimplement against Postgres tenants/memberships.                                                                                      |
| `@adaptive-auth/shared-auth` Vue/Nuxt client      | Maybe                       | Only if the beauty app stays on the same cookie/JWT pattern. Expect a rewrite of resource names (`User` → `Membership`).               |
| Zod validation package pattern                    | Yes                         | New schemas for booking; keep the idea, not the auth bodies.                                                                           |
| Mongoose `User` / device trust / login challenges | **No**                      | Wrong domain. Device trust is not the salon’s pain.                                                                                    |
| Express auth-server as a runtime dependency       | **No**                      | Beauty API should own identity for tenants, invites, staff PINs, public booking. A separate auth service is extra ops for one product. |
| Vue layout system                                 | Yes                         | Business dashboard chrome.                                                                                                             |
| Nuxt app                                          | **Prefer for public pages** | Salon profile/booking wants SEO and fast first paint. Dashboard can be the same Nuxt app with auth, or Vue SPA. One app is enough.     |

**Do not** start a third product inside the AdaptiveAuth monorepo “because the architecture is ready.” A salon product will dominate the repo and confuse auth work. New repo (or a clearly isolated workspace) when you leave discovery.

### 7.2 NestJS vs Go

For this team: **TypeScript backend.** NestJS if you want structure and DI; a modular Express/Fastify app is also fine given existing skill. Go is better later for a dedicated availability service under heavy lock contention — not year one.

Share types with the frontend (Zod or similar). That is a real advantage vs Go for a small TS team.

### 7.3 MVP architecture

```text
[Instagram bio] → Nuxt public site /s/:slug
                        │
                        ▼
              API (Nest/Fastify) ── PostgreSQL (tenant_id on every row)
                        │
                        ├── object storage (inspiration photos, later)
                        ├── SMS provider (Kavenegar / similar) via NotificationPort
                        ├── Telegram bot (optional, high Iran fit)
                        └── PSP (Zarinpal / IDPay) via PaymentPort

Staff app (same Nuxt, /app)
  calendar | clients | overdue | settings

Jobs: Postgres-backed or Redis+BullMQ
  reminder at T-24h, T-2h
  overdue digest morning
```

**Multi-tenancy:** `tenant_id` on all rows + RLS or strict repository filter. Not schema-per-tenant. Not a database per salon.

**AuthZ:** roles `owner`, `manager`, `staff`. Staff see own calendar by default. Public booking is unauthenticated with rate limits and slot holds.

**Booking concurrency (must be correct in v1):**

1. Client selects slot → create `SlotHold` (2–5 min) with unique constraint on `(staff_id, tstzrange)`.
2. Confirm booking in a transaction: convert hold → appointment or fail.
3. Use PostgreSQL `tstzrange` + GiST exclusion constraint. This is the availability engine. Do not invent a custom calendar math layer beyond working hours, breaks, buffers, and service duration.

**Events:** start with **in-process domain events** + an outbox table. “AppointmentCancelled” fans out to waitlist job. Do not start with Kafka.

**Audit:** `audit_log` for money, policy, and appointment mutations. Correlation ID like AdaptiveAuth is enough.

**AI:** none. If you add a provider later, keep an `AiPort` with a local/OpenAI adapter — but that is Phase 3+ and optional.

### 7.4 Future architecture (only after MVP is paying)

- Redis for hot slot holds and rate limits if Postgres is not enough
- Outbox + worker pool
- Webhooks for third-party POS
- Read models for heavier reports
- Custom domains
- Optional Go availability service
- n8n **only** for salon-specific one-off marketing, never for core booking invariants

---

## 8. Build vs integrate vs n8n

| Capability                       | Decision                    | Why                                                                                                     |
| -------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------- |
| Booking / availability / holds   | **Build**                   | This _is_ the product. Wrong if outsourced (Cal.com is generic and still leaves you without salon CRM). |
| Tenant, RBAC, client file        | **Build**                   | Core.                                                                                                   |
| Calendar sync (Google)           | **Defer / integrate later** | Google is flaky from this region; staff can live in your calendar first.                                |
| Email                            | **Integrate**               | Transactional provider you can actually reach. Not a core differentiator.                               |
| SMS                              | **Integrate** (local)       | Kavenegar-class. Abstract behind `SmsPort`.                                                             |
| Telegram                         | **Integrate**               | Often higher read-rate than email in Iran.                                                              |
| WhatsApp                         | **Evaluate, do not bet v1** | Official API is Meta-dependent and may be a poor regional fit.                                          |
| Payments / deposits              | **Integrate** local PSP     | Never build card processing. Stripe is the wrong default here.                                          |
| Accounting / inventory / payroll | **Don’t build**             | Export CSV; let رخساره-class tools win. Competing on accounting is how you drown.                       |
| Reminders / overdue campaigns    | **Build rules in-app**      | Too central for n8n.                                                                                    |
| One-off owner automations        | **n8n later**               | Optional.                                                                                               |
| Waitlist ranking                 | **Build rules**             | SQL.                                                                                                    |
| Consultation forms               | **Build**                   | Simple.                                                                                                 |
| Vision / LLM briefs              | **Don’t**                   | Until customers pull. Then `AiPort`, preferably a model you can run or legally proxy.                   |
| AdaptiveAuth as live dependency  | **Don’t**                   | Copy patterns.                                                                                          |

Challenge to the brief’s example: it listed payments and SMS as integrate (good) and booking as build (good) but implied a large “automation platform” core. **Keep automations as explicit job types**, not a user-facing workflow builder.

---

## 9. Technical feasibility and regional risk

| Feature                              | Complexity | External deps                | Regional risk                                     | Privacy                                     | MVP?        |
| ------------------------------------ | ---------- | ---------------------------- | ------------------------------------------------- | ------------------------------------------- | ----------- |
| Multi-tenant CRUD + public page      | M          | Hosting, DNS                 | Hosting choice (Liara/Arvan vs foreign VPS + DNS) | Client PII in-country preferred             | Yes         |
| Availability + exclusion constraints | M/H        | None                         | None                                              | Low                                         | Yes         |
| SMS reminders                        | L          | Local SMS gateway            | **Cost, delivery, sender-ID rules**               | Phone numbers                               | Yes         |
| Telegram notify                      | M          | Bot API                      | Usually OK                                        | Phone/chat IDs                              | Should      |
| Deposits                             | M          | Zarinpal/IDPay + redirect UX | PSP outages, settlement                           | Payment PII                                 | Optional v1 |
| Waitlist auto-offer                  | M          | SMS/Telegram                 | Same as messaging                                 | Consent to contact                          | Phase 2     |
| Overdue list                         | L          | Messaging                    | Low                                               | PII                                         | Yes         |
| Google Calendar                      | M          | Google APIs                  | **High (block/VPN)**                              | Calendar data                               | No          |
| Stripe / Adyen                       | —          | —                            | **Blocked**                                       | —                                           | No          |
| OpenAI consultation                  | M          | OpenAI/Anthropic             | **High**                                          | Photos, health-ish data leaving the country | No          |
| Local LLM (Ollama)                   | H          | GPU/host                     | Ops burden for a salon SaaS                       | Better privacy, worse quality               | No          |
| App Store iOS/Android                | H          | Apple/Google                 | **Cafe Bazaar / PWA first**                       | —                                           | PWA         |
| Marketplace                          | VH         | Consumer liquidity           | You become Fresha                                 | —                                           | Never v1    |
| Double-booking under load            | H          | —                            | Need tests, not more infra                        | —                                           | Must solve  |

**Biggest technical risk:** not Nest vs Go. It is **message delivery + payments + running production without a banned default stack**, plus getting availability constraints right.

**Biggest business risk:** building a Western-shaped “intelligence platform” that neither Western salons will switch to nor Iranian salons will understand, while سیسنو already sells booking+SMS+loyalty to 1000+ salons.

---

## 10. Where AI is and is not allowed

| Idea                            | AI vs rules                 | Decision                                                   |
| ------------------------------- | --------------------------- | ---------------------------------------------------------- |
| Overdue vs personal interval    | SQL median/mode             | **Rules**                                                  |
| No-show risk                    | Counts + recency            | **Rules** (deposit if new + high-ticket)                   |
| Waitlist rank                   | Match filters + last accept | **Rules**                                                  |
| Reminder copy                   | Templates                   | **Rules**                                                  |
| Allergy / box-dye flags         | Form fields                 | **Rules**                                                  |
| “This look is balayage + toner” | Vision                      | **Not unless pulled; even then low priority**              |
| Face-shape hairstyle generator  | Vision                      | **No**                                                     |
| Chat “ask your data”            | LLM on SQL                  | Cute; Phorest already doing Insights AI with Google. Skip. |

---

## 11. What to validate before writing significant code

Do this as conversations and observation, not a prototype sprint.

1. **Channel:** For the last 20 bookings, how many came from Instagram DM vs phone vs walk-in vs existing software?
2. **Incumbent:** What do they pay رخساره/سیسنو/nothing? What do they hate?
3. **Cancel math:** Last-minute cancels per week? Do they keep a waitlist? How do they fill (story, call, ignore)?
4. **Rebook:** Do stylists pre-book at the chair? Typical color interval?
5. **Messaging:** Which do clients answer — SMS, Telegram, WhatsApp, Instagram?
6. **Money:** Cash vs card-to-card vs POS? Would they require a deposit for new color clients?
7. **Switch trigger:** What would make them leave Instagram DMs? (24/7 booking, less phone, staff seeing the same calendar)
8. **Willingness to pay:** Quote a number. If they will not pay ~the price of 1–2 missed color services per month, stop.
9. **Your entity:** Can you legally invoice, host PII, and settle PSP payouts in the target market?

**Kill criteria:** 10+ owners say they already have software they will not leave, or they will only use a product if it includes full accounting/inventory on day one, or they will not pay.

**Proceed criteria:** 5+ owners will trial a booking link + reminders, and at least 2 will pay during a manual concierge trial (you run reminders by hand for 2 weeks). That concierge test is cheaper than a calendar engine.

---

## 12. Final recommendation (direct answers)

1. **Should we build in beauty at all?**
   **Yes only as Iran-first (or similar underserved ops market) salon software.**
   **No** as a global Beauty BI / intelligence layer.

2. **First customer segment:** Women’s hair salons, 1–8 chairs, Instagram-led, owner still on the chair.

3. **Target:** Hair salons first. Chair-renter colorists second. Barbers, nails, studios later. MedSpas not in v1.

4. **First product:** Public booking + staff calendar + local reminders + overdue rebook list. Working name should sound like an operations tool, not a BI suite.

5. **Do not build initially:** Marketplace, AI vision, recommendation engine, Insights chat, POS/inventory/payroll, Google Calendar, Stripe, Elasticsearch, n8n as core, AdaptiveAuth as a required runtime, custom-domain vanity, multi-location, MedSpa charting.

6. **Strongest differentiation:** Not algorithms. **Fit to a market global incumbents cannot fully serve**, with a modern booking UX and _actionable_ rebooking (not dashboards). Secondary: ranked last-minute fill once calendars are full.

7. **Biggest business risk:** Switching inertia + local incumbents + selling “intelligence” to people who wanted a quieter phone.

8. **Biggest technical risk:** Payments, SMS/Telegram reliability, and calendar correctness — compounded by regional blocks on the default Western SaaS stack.

9. **MVP contents:**
   Tenant/staff/services/hours · public page · book/cancel/reschedule with policy · exclusion-constraint calendar · client history · confirm + 24h reminder · overdue list + send invite · owner login with roles · SMS/Telegram port · optional local deposit.

10. **Validate before significant code:** Interviews, shadowing, concierge reminders, price, message channel, kill criteria in §11.

---

## 13. Honest closing

The brief’s instincts are good: do not clone booking for its own sake; empty slots and silent churn are where money leaks; keep AI out of the architecture fashion show.

The mistake is wrapping those instincts in a **platform narrative** that Western incumbents already used to upsell, then listing a **Phase 1 that is the entire clone**.

If you want a serious product from this idea, shrink the map: **one country, one salon type, one loop (book → remind → return).** If that loop cannot be sold with a concierge trial, the category is not your next company — and AdaptiveAuth’s architecture is better aimed at a product that actually needs session authority more than a Friday 17:00 slot.

---

## Out of scope for this page

- Implementation, schemas, or UI.
- Company formation / sanctions legal advice (get a human lawyer if you sell across borders).
- AdaptiveAuth product directions (see [`../decisions/product-strategy-analysis.md`](../decisions/product-strategy-analysis.md)).
