## Important Architecture Constraint — Nitro vs Node.js

I want to clarify one important architectural concern before continuing implementation.

We are currently using Nuxt 4 + Nitro for the HTTP/API layer. I am OK with using Nitro and I do NOT want us to introduce a separate Node.js API process at this stage.

However, I want the architecture to remain easy to migrate to a standalone Node.js API in the future if the application grows significantly.

### Core principle

**Nitro should be treated as the HTTP adapter, not as the application architecture.**

Business/domain logic must NOT become tightly coupled to Nitro/H3/Nuxt APIs.

For example, avoid putting important business logic directly inside:

- `defineEventHandler`
- `H3Event`
- `readBody`
- `getQuery`
- Nitro-specific request/response objects
- Nuxt composables
- Nuxt page components

Instead, keep the architecture conceptually separated:

```
Browser
   ↓
Nuxt UI
   ↓
Nitro API / HTTP Adapter
   ↓
Application / Use Cases
   ↓
Domain
   ↓
Infrastructure / Database
   ↓
PostgreSQL
```

A future migration should ideally be possible like this:

```
Clients
   ↓
┌───────────────────┐
│ HTTP API Adapter  │
│                   │
│ Nitro OR Node.js  │
└─────────┬─────────┘
          ↓
   Application Layer
          ↓
      Domain Layer
          ↓
    Infrastructure
          ↓
      PostgreSQL
```

## Practical rule

If we later have a critical use case such as:

```
reserveAppointment(...)
```

or:

```
checkAvailability(...)
```

the core logic should live in a plain TypeScript application/domain module.

The Nitro endpoint should primarily:

1. Receive the HTTP request.
2. Validate/parse the HTTP input.
3. Call the application use case.
4. Convert the result/error into an HTTP response.

For example, conceptually:

```
server/api/appointments/reserve.post.ts
        ↓
application/appointments/reserveAppointment.ts
        ↓
domain/appointments/...
        ↓
infrastructure/database/...
```

The application/domain layer should be testable without starting Nuxt/Nitro.

### What I do NOT want

Do not create a standalone Express/Fastify/Nest/Node.js server now just for the sake of future scalability.

The current project is still a single real barbershop implementation, so adding a second API server/process would introduce unnecessary complexity.

### What I DO want

Design the boundaries now so that extracting the API later is straightforward.

In particular:

- Keep domain/business rules framework-independent.
- Keep application/use-case logic independent from HTTP.
- Keep database/infrastructure concerns separated from domain logic.
- Keep Nitro-specific code close to the API boundary.
- Do not pass `H3Event` or other Nitro-specific objects deep into the application/domain layer.
- Prefer plain TypeScript input/output types for use cases.
- Business logic should be testable without Nuxt/Nitro.
- Database access can remain infrastructure-specific (Drizzle/PostgreSQL).

This is an architectural constraint for the project going forward.

The goal is:

**Use Nitro now, but don't make the application dependent on Nitro.**

If you believe a proposed implementation would violate this principle, please point it out before implementing it.
