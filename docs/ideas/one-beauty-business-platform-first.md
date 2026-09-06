# Project Context — Crypto Barber Shop / Future Business Platform

## 1. Background

We are currently exploring a product idea around independent local service businesses, initially focusing on barbershops / beauty businesses.

The long-term idea is NOT to build another marketplace where businesses create profiles inside our platform.

Instead, the direction we are exploring is:

> Each business should be able to have its own branded website, booking experience, and business-management system while keeping ownership of its own brand and customer relationship.

The long-term product may eventually become a multi-tenant SaaS platform where each business can have:

- Its own branded website
- Its own custom domain
- Online booking
- Calendar
- Staff management
- Customer management
- Appointment management
- Retention / rebooking capabilities
- Potentially payments and e-commerce later

However, we are NOT implementing the multi-tenant SaaS architecture yet.

We want to first build a real production-quality website for an actual barbershop and use that experience to validate requirements and inform the future architecture.

---

# 2. Current Project

The first real implementation is for:

**Crypto Barber Shop**

The existing website is:

`cryptobarbershop.com` (The website temporarily down because of host problems)

The current website is based on WordPress, and we want to rebuild it using Nuxt 4.

The goal is to reproduce the important existing business behavior while improving the implementation and UX.

This is not intended to be a throwaway demo.

It should be treated as a real production-oriented application.

---

# 3. Important Business Characteristics

The business owner has several barbers working under the business.

Customers can discover the business through multiple channels, including:

**\*\*\*\***- Google Maps

- The physical shop / signage
- Direct visits
- Existing customers
- The business website**\*\*\*\***

The owner specifically prefers having his own branded website rather than simply having a profile inside a marketplace.

Reasons include:

- Full ownership of the brand
- Full control over the website
- Freedom to customize the experience
- Ability to expand the website later
- Potential future e-commerce / product sales
- Avoiding dependency on third-party marketplaces
- Keeping the customer relationship directly with the business

This is an important product insight for the future platform.

---

# 4. Customer Authentication and Booking

There are TWO different customer flows in this system:

1. Guest Booking
2. Customer Account / Authentication

These flows must NOT be confused with each other.

---

## 4.1 Guest Booking — No Registration Required

A customer must be able to make an appointment WITHOUT creating an account.

This is an important business requirement.

A new or occasional customer should be able to:

1. Open the website
2. Click "Book Appointment"
3. Select a service
4. Select a barber/staff member
5. Select a date
6. Select an available time
7. Enter basic contact information
8. Submit the appointment request

For example:

- Name
- Phone
- Email

The customer should NOT be forced to:

- Register
- Create a password
- Login
- Verify an account

before making a booking.

The goal is to keep the booking experience extremely low-friction.

Example:

    Website
       ↓
    Book Appointment
       ↓
    Service
       ↓
    Barber
       ↓
    Date / Time
       ↓
    Name + Phone/Email
       ↓
    Submit Booking Request

This should work for completely new customers.

---

# 4.2 Optional Customer Account

The system ALSO supports customer accounts.

Having an account is OPTIONAL for booking.

Customer accounts are useful for:

- Existing / loyal customers
- Customers who want to receive special offers
- Discount notifications
- Promotions
- Customer-specific benefits
- Viewing or managing their appointments (if implemented)
- Maintaining their customer profile
- Future loyalty / retention features

Therefore:

> A customer does NOT need an account to book, but customers who want additional benefits can create an account.

---

# 4.3 Passwordless Authentication

Customer authentication should be intentionally simple.

Do NOT require traditional:

- Username
- Password
- Complex registration forms

The preferred authentication model is passwordless OTP authentication, similar to the user experience of services such as Digikala or Divar.

The customer should be able to authenticate using either:

- Mobile phone number
- Email address

Example:

    Login / Register
          ↓
    Phone OR Email
          ↓
    Send verification code
          ↓
    Customer receives 6-digit code
          ↓
    Enter 6-digit code
          ↓
    Authenticated
          ↓
    Customer Account

There should be no password.

The same flow should support both:

- New customer registration
- Existing customer login

The system should determine whether the identity already belongs to an existing customer.

---

# 4.4 Progressive Customer Profile

Authentication should require only the minimum information necessary.

For example:

    Phone / Email
          ↓
    6-digit OTP
          ↓
    Account created / authenticated
          ↓
    Basic account available

Additional customer information can be collected later.

For example:

- First name
- Last name
- Birthday (if useful)
- Preferences
- Other profile information

Do NOT make the initial authentication/registration form unnecessarily long.

The principle is:

> Authenticate first with minimal friction; collect additional profile information progressively.

---

# 4.5 Relationship Between Guest Booking and Customer Account

Guest booking and authenticated booking are both supported.

### Guest:

    Customer
       ↓
    No Login
       ↓
    Booking
       ↓
    Contact Information
       ↓
    Appointment

### Authenticated customer:

    Customer
       ↓
    Login with Phone/Email + OTP
       ↓
    Customer Account
       ↓
    Booking
       ↓
    Appointment linked to Customer Account

If an authenticated customer makes a booking, the appointment should be associated with that customer's account.

If a guest makes a booking, the appointment can initially be associated with the provided contact information.

The architecture should leave room for future customer-account matching/linking.

For example, if a guest previously booked using a phone number and later creates an account using the same phone number, the system may eventually be able to associate/link the historical guest appointments with the authenticated customer profile.

This does not necessarily need to be implemented in the first version, but the data model should not make it impossible.

---

# 4.6 Important UX Rule

Do NOT force customers to login simply because authentication exists.

For example, this is NOT desired:

    Book Appointment
          ↓
    "Please login first"
          ↓
    Login/Register
          ↓
    Booking

Instead, the preferred experience is:

    Book Appointment
          ↓
    Continue as Guest
          OR
    Login / Register
          ↓
    Continue Booking

However, the simplest/default path should remain Guest Booking.

Authentication should be an optional value-added feature, not a barrier to booking.

---

# 4.7 Customer Account vs Business Authentication

There are two different authentication domains in the system:

### Customer

Used by customers of the barbershop.

Purpose:

- Optional account
- Promotions
- Discounts
- Customer profile
- Future loyalty / retention features

### Business / Staff

Used by:

- Business owner
- Managers
- Barbers / staff

Purpose:

- Dashboard
- Calendar
- Appointment management
- Staff management
- Availability management
- Customer management
- Business settings

These should be treated as separate concerns.

Do not mix customer authentication/authorization with business/staff access control.

The dashborad system can use the current AdaptiveAuth system because of sensitivity (For this one I want you to give me your opinion by reviewing the current AdaptiveAuth system)

---

# 4.8 Summary

The core rule is:

> Booking does NOT require authentication.

But:

> The platform DOES support optional customer accounts using passwordless OTP authentication.

The intended model is:

    ┌─────────────────────────────────────┐
    │            Customer                 │
    └──────────────────┬──────────────────┘
                       │
              ┌────────┴────────┐
              │                 │
              ▼                 ▼
        Guest Booking      Customer Account
              │                 │
       No registration      Phone / Email
              │                 │
              │              6-digit OTP
              │                 │
              │                 ▼
              │          Authenticated
              │                 │
              └────────┬────────┘
                       ▼
                  Appointment
                       │
                       ▼
                Business Calendar

# 5. Booking Confirmation Model

Booking is not necessarily immediately confirmed.

The business currently works with an approval flow.

Example:

Customer:

```
Selects Friday 10:00
    ↓
Submits booking request
    ↓
Appointment = PENDING
```

Business owner / staff:

```
Reviews request
    ↓
APPROVE
    ↓
Appointment = CONFIRMED
```

After confirmation, the customer should receive an email informing them that their appointment has been confirmed.

If the business rejects/cancels the request, the customer should also be notified appropriately.

---

# 6. Calendar

The calendar is a central part of the system.

There may be multiple barbers/staff members.

Each staff member can have their own availability.

The booking system must prevent conflicting appointments.

Example:

Reza:

Friday 10:00 → BOOKED

That time should no longer be available for another customer for Reza.

The same calendar must also support appointments created manually by the business.

For example:

A customer calls the shop.

The owner answers the phone and says:

"Friday at 10:00 is available."

The owner should be able to open the business dashboard and manually create:

Customer: Reza
Service: Haircut
Staff: Ali
Date: Friday
Time: 10:00

This appointment must immediately affect availability for online booking.

Therefore:

> Online bookings and manually created appointments must use the same underlying appointment/calendar system.

There must be one source of truth for availability.

---

# 7. Cancellation / No-show

The business has real-world issues such as:

- Late cancellations
- Last-minute cancellations
- Customers not showing up

We should not over-engineer a complete solution yet.

However, the domain model and architecture should not prevent us from adding later:

- Cancellation policies
- Cancellation deadlines
- No-show tracking
- Waitlists
- Reminders
- Customer historyDeposits/payments
-

These are future possibilities, not necessarily MVP requirements.

---

# 8. Public Website

The website should contain the typical sections needed by this business.

Potential sections:

- Home
- Services
- Team / Barbers
- Gallery
- About
- Contact
- Location
- Booking

The exact structure should be determined from the existing website and business requirements.

The website should strongly emphasize the business's own brand.

It should NOT feel like a marketplace.

There should be no list of competing businesses.

---

# 9. Future Product Direction

The long-term product we are exploring is conceptually:

```
Business
    |
    +-- Branded Website
    |
    +-- Custom Domain
    |
    +-- Booking
    |
    +-- Calendar
    |
    +-- Staff
    |
    +-- Customers
    |
    +-- Appointments
    |
    +-- Retention / Rebooking
    |
    +-- Payments
    |
    +-- E-commerce (potentially later)
```

A future business might have:

```
sarabeauty.com
```

Another:

```
cryptobarbershop.com
```

Both would use the same underlying platform, but each business would have its own:

- Brand
- Domain
- Content
- Services
- Staff
- Customers
- Calendar
- Settings

This would eventually become a multi-tenant SaaS architecture.

BUT:

## Do not implement multi-tenancy yet unless explicitly requested.

We are intentionally starting with one real business implementation.

---

# 10. Architecture Principles for the Current Project

Even though this is a single-business implementation, avoid unnecessary coupling.

Keep these concepts logically separated:

- Business configuration
- Website content
- Services
- Staff
- Customers
- Appointments
- Availability
- Booking
- Notifications

The architecture should make future extraction into a multi-tenant SaaS possible.

Do not prematurely build:

- Multi-tenant infrastructure
- Custom domain provisioning
- Domain registrar integration
- Complex subscription billing
- Marketplace functionality
- Customer authentication
- Advanced CRM
- AI features

unless explicitly requested.

---

# 11. Important Future Architecture Considerations

While implementing the current project, keep these future requirements in mind.

Eventually we may need:

### Custom domains

Example:

```
cryptobarbershop.com
sarabeauty.com
```

The platform should eventually be able to resolve:

```
incoming domain
    ↓
tenant/business
    ↓
business website
```

We may later use:

```
domain → tenant resolution
```

However, this does NOT need to be implemented now.

---

# 12. Product Philosophy

The product should not force businesses to change how they already work.

If a business receives a phone call, the staff should be able to create an appointment manually.

If a customer books online, it should enter the same calendar.

If a customer comes through Google Maps, they should be able to reach the business website and book.

If the business uses Instagram, the website booking URL can be placed there.

The principle is:

> Different customer acquisition / booking channels should eventually converge into one business calendar and customer-management system.

---

# 13. Important UX Principle

Booking should be extremely simple.

Do not introduce unnecessary:

- Customer accounts
- Passwords
- Login screens
- Complicated onboarding
- Long forms

unless there is a strong business requirement.

The customer should be able to book with minimal friction.

---

# 14. What I want from you as the Coding Agent

Before implementing anything substantial:

1. Inspect the existing project structure.
2. Inspect the current website implementation.
3. Identify the existing functionality that needs to be reproduced.
4. Propose the architecture for the Nuxt implementation.
5. Identify the domain models.
6. Identify the booking/calendar model.
7. Identify important edge cases.
8. Explain how the architecture could evolve toward a multi-tenant SaaS in the future without implementing it now.
9. Identify which decisions should be kept provider-agnostic.
10. Clearly separate:

- MVP requirements
- Nice-to-have features
- Future SaaS requirements

Do not start large-scale implementation until the architecture and domain model have been reviewed.

The goal is to build a real, maintainable first implementation that also teaches us what the eventual SaaS platform should look like.
