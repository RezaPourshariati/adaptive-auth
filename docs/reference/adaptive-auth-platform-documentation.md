# Adaptive Auth — Platform Documentation

> Comprehensive technical documentation of the Adaptive Auth authentication platform.
> Based on implementation analysis performed May 2026.

---

## Table of Contents

1. [Full Feature Inventory](#1-full-feature-inventory)
2. [Architecture Overview](#2-architecture-overview)
3. [Authentication Flows](#3-authentication-flows)
4. [Reusable Infrastructure](#4-reusable-infrastructure)
5. [Engineering Quality Review](#5-engineering-quality-review)
6. [Missing Features / Future Improvements](#6-missing-features--future-improvements)
7. [Portfolio / Product Positioning](#7-portfolio--product-positioning)

---

## 1. Full Feature Inventory

### 1.1 Session-Bound Access Tokens

|                      |                                                                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description**      | Access JWTs carry `{ id, sid }` where `sid` is the MongoDB `_id` of the server-side Session document. Every protected API call validates the token AND looks up the session record.                                   |
| **Problem Solved**   | Prevents "ghost sessions" — if the server revokes a session (e.g., admin suspends user), the access token becomes immediately useless even before JWT expiry. Standard stateless JWTs cannot be individually revoked. |
| **Real-World Value** | Required by any compliance-sensitive system (finance, healthcare, enterprise SaaS) where immediate session termination is non-negotiable.                                                                             |
| **Layer**            | `services/auth-server` — `token.service.ts`, `auth.middleware.ts`, `session.model.ts`                                                                                                                                 |

### 1.2 Server-Side Session Policy (Idle + Absolute Timeout)

|                      |                                                                                                                                                                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description**      | Each session has `lastUsedAt` and `sessionStartedAt` timestamps. The server enforces two independent timeouts: idle (30min default) and absolute (30 days default). A touch-throttle (30s default) prevents excessive DB writes on every request. |
| **Problem Solved**   | Idle timeout protects against unattended browser sessions. Absolute timeout ensures even active sessions eventually expire, limiting damage from token theft. Touch throttling prevents DB write amplification.                                   |
| **Real-World Value** | This is the exact model used by AWS Cognito, Auth0, and Okta session policies. Companies in regulated industries require configurable session limits.                                                                                             |
| **Layer**            | `services/auth-server` — `session-policy.service.ts`, `auth.middleware.ts`, `config/env.ts`                                                                                                                                                       |

### 1.3 Refresh Token Rotation with Hashed Storage

|                      |                                                                                                                                                                                                                                                     |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description**      | On each `/refresh` call, the server generates a new opaque random secret, hashes it with SHA-256, stores only the hash in the Session document, and wraps the raw secret in a signed JWT cookie. The old hash is overwritten (single-use rotation). |
| **Problem Solved**   | If a refresh token is intercepted, it can only be used once — the next legitimate refresh will fail because the hash no longer matches, alerting the system to potential compromise. Hashed storage means DB breaches don't expose usable tokens.   |
| **Real-World Value** | OWASP best practice. Required for OAuth 2.1 compliance. Used by Stripe, GitHub, and all modern identity providers.                                                                                                                                  |
| **Layer**            | `services/auth-server` — `auth-session.service.ts`, `token.service.ts`                                                                                                                                                                              |

### 1.4 Double-Submit CSRF Protection

|                      |                                                                                                                                                                                                                                                                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description**      | On every session creation/rotation, the server sets a non-httpOnly `csrfToken` cookie (random 24-byte hex). The frontend reads this cookie and sends it as an `x-csrf-token` header on all write requests. The server validates cookie === header on POST/PATCH/PUT/DELETE, with explicit exemptions for pre-auth routes. |
| **Problem Solved**   | Prevents cross-site request forgery where a malicious page submits forms using the user's cookies. The attacker cannot read the CSRF cookie from another origin due to SameSite + the same-origin policy.                                                                                                                 |
| **Real-World Value** | Mandatory for any cookie-based auth system serving browser clients. Integration tests prove enforcement.                                                                                                                                                                                                                  |
| **Layer**            | `services/auth-server` — `csrf.middleware.ts`, `auth-cookie.service.ts`; `packages/shared-auth` — `http-client.ts`, `refresh.ts`                                                                                                                                                                                          |

### 1.5 Trusted Device Fingerprinting

|                      |                                                                                                                                                                                                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description**      | On registration, the server records a coarse fingerprint (browser family + OS) from the User-Agent header. On subsequent logins, if the device doesn't match any known fingerprint, the system triggers a login code challenge instead of granting immediate access. |
| **Problem Solved**   | Detects account access from unknown devices — a common signal for credential stuffing attacks or stolen passwords. Adds a second factor without requiring TOTP setup.                                                                                                |
| **Real-World Value** | Same approach used by Google, Apple, and banking apps ("New sign-in from Chrome on Windows"). Reduces account takeover risk significantly.                                                                                                                           |
| **Layer**            | `services/auth-server` — `common/device/trustedDevice.ts`, `features/auth/controller.ts`                                                                                                                                                                             |

### 1.6 Login Code Challenge (Device Verification)

|                      |                                                                                                                                                                                                                                                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Description**      | When a new device is detected: (1) server generates a 6-digit code, (2) encrypts it with Cryptr (AES-256), (3) stores the encrypted version in a `LoginChallenge` document with 1-hour expiry, (4) emails the code to the user. The user submits the code, server decrypts and compares, then registers the device as trusted. |
| **Problem Solved**   | Provides adaptive MFA without forcing all users through TOTP/WebAuthn setup. Low-friction security escalation only when risk is elevated.                                                                                                                                                                                      |
| **Real-World Value** | This is "step-up authentication" — the same pattern Stripe uses for new-device access to dashboards. Reduces support burden vs mandatory MFA while maintaining security.                                                                                                                                                       |
| **Layer**            | `services/auth-server` — `auth/controller.ts` (sendLoginCode, loginWithCode), `auth-token-records.service.ts`, `login-challenge.model.ts`                                                                                                                                                                                      |

### 1.7 Immediate Session Revocation on Suspension

|                      |                                                                                                                                                                                                                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description**      | When an admin changes a user's role to "suspended" via `upgradeUser`, the system immediately calls `revokeAllUserSessions(userId)` which deletes every Session document for that user. Subsequent access attempts fail instantly because the session lookup returns null. |
| **Problem Solved**   | In enterprise/compliance scenarios, when an employee is terminated or a user is banned, their active sessions must be killed immediately — not after token expiry.                                                                                                        |
| **Real-World Value** | Required for SOC 2 compliance, GDPR right-to-restrict-processing, and any platform with admin moderation (marketplaces, social platforms, B2B SaaS).                                                                                                                      |
| **Layer**            | `services/auth-server` — `features/users/controller.ts`, `auth-session.service.ts`                                                                                                                                                                                        |

### 1.8 Structured Auth Telemetry

|                      |                                                                                                                                                                                                                                                                                                                                                            |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description**      | `emitAuthEvent()` outputs structured JSON lines with correlation ID, IP, path, method, timestamp, and event-specific detail. Events include: `auth.refresh_success`, `auth.refresh_failed`, `auth.middleware_denied`, `auth.session_destroyed_idle_or_absolute`, `auth.sessions_revoked`. Configurable via `LOG_AUTH_TELEMETRY` env var, disabled in test. |
| **Problem Solved**   | Security-critical systems need audit trails. When investigating a breach or debugging auth failures, structured events enable filtering by user, session, or correlation ID across distributed logs.                                                                                                                                                       |
| **Real-World Value** | Production-ready for ingestion by Datadog, Honeycomb, CloudWatch, or any log aggregator. This is the foundation for security dashboards and anomaly detection.                                                                                                                                                                                             |
| **Layer**            | `services/auth-server` — `common/observability/auth-events.ts`, `auth.middleware.ts`, `auth/controller.ts`                                                                                                                                                                                                                                                 |

### 1.9 Correlation ID Propagation

|                      |                                                                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description**      | Every request gets a `x-correlation-id` (propagated from incoming header or minted as UUID). Stored on `req.correlationId`, echoed in response headers, and included in all auth telemetry events.                    |
| **Problem Solved**   | In distributed systems, tracing a single user action across services requires a shared identifier. Without it, debugging production issues across frontend → auth-server → future microservices is nearly impossible. |
| **Real-World Value** | Standard practice at companies like Uber, Netflix, and Stripe. Foundation for distributed tracing (OpenTelemetry, Jaeger).                                                                                            |
| **Layer**            | `services/auth-server` — `common/middleware/correlation-id.middleware.ts`                                                                                                                                             |

### 1.10 Distributed-Ready Rate Limiting

|                      |                                                                                                                                                                                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Description**      | Login endpoint is rate-limited to 10 requests per 60 seconds per IP+path. Uses `rate-limiter-flexible` which supports Redis as a backing store. Falls back to in-memory when Redis is unavailable. Startup warning in production if Redis is not configured. |
| **Problem Solved**   | Prevents brute-force password attacks and credential stuffing at the application layer. Redis backing ensures limits work correctly across multiple server instances.                                                                                        |
| **Real-World Value** | Every production auth system needs rate limiting. The Redis-aware implementation with graceful fallback is production-ready for horizontal scaling.                                                                                                          |
| **Layer**            | `services/auth-server` — `common/middleware/rate-limit.middleware.ts`, `config/env.ts`                                                                                                                                                                       |

### 1.11 Cross-Tab Refresh Coordination (Web Locks API)

|                      |                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description**      | The `createRefreshSession()` function in `shared-auth` uses both in-flight promise deduplication AND the browser's Web Locks API to serialize refresh calls across tabs. If Tab A is refreshing, Tab B waits for the lock rather than sending a duplicate refresh request (which would invalidate Tab A's new token due to rotation). |
| **Problem Solved**   | Refresh token rotation + multiple tabs = race condition. Without coordination, Tab B's refresh invalidates Tab A's newly-issued token, causing cascading logouts.                                                                                                                                                                     |
| **Real-World Value** | This is an advanced problem that most auth libraries ignore. Auth0's SPA SDK solves it with a similar approach. This implementation demonstrates deep understanding of browser concurrency.                                                                                                                                           |
| **Layer**            | `packages/shared-auth` — `refresh.ts`                                                                                                                                                                                                                                                                                                 |

### 1.12 Framework-Agnostic Auth Navigation Guard

|                      |                                                                                                                                                                                                                                                                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description**      | `createResolveAuthRedirect()` is a factory that produces a pure function accepting a route and an auth store interface. It handles: lazy bootstrap trigger, `guestOnly` redirect, `requiresAuth` redirect (with session expiry code in query), and role-based access control. The function returns either `true` (allow) or a redirect target. |
| **Problem Solved**   | Both Vue Router and Nuxt middleware need the same auth guard logic. Extracting it as a pure function means it can be unit-tested without a router instance, reused across frameworks, and composed differently per app.                                                                                                                        |
| **Real-World Value** | This is SDK-level thinking — the guard works with any Vue-based framework. It's the pattern used by Firebase Auth, Clerk, and other auth SDKs that support multiple frontend frameworks.                                                                                                                                                       |
| **Layer**            | `packages/shared-auth` — `guard/auth-navigation-guard.ts`                                                                                                                                                                                                                                                                                      |

### 1.13 Session Bootstrap with Graceful Degradation

|                      |                                                                                                                                                                                                                                                 |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description**      | `bootstrapSession()` tries: (1) refresh → getCurrentUser (happy path), (2) on known error code → return expiry reason, (3) fallback to getLoginStatus → getCurrentUser, (4) on total failure → return null silently.                            |
| **Problem Solved**   | On page load, the SPA needs to determine auth state. The refresh cookie may be expired, the server may be down, or the session may have been administratively terminated. Each case needs different UX: silent logout, expiry notice, or retry. |
| **Real-World Value** | Graceful degradation prevents blank screens and cascading errors. The structured expiry codes enable targeted UX messages ("You were inactive too long" vs "Your session was terminated").                                                      |
| **Layer**            | `packages/shared-auth` — `session/bootstrap.ts`                                                                                                                                                                                                 |

### 1.14 Shared Zod Validation (Server + Client)

|                      |                                                                                                                                                                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description**      | The `@adaptive-auth/validation` package defines Zod schemas (`registerBodySchema`, `loginBodySchema`, etc.) used both by the auth-server for request validation and by frontend forms for client-side validation before submission. |
| **Problem Solved**   | Validation logic drift between frontend and backend causes confusing UX (server rejects what the form allowed) or security gaps (client is lenient, server doesn't validate). A single source of truth eliminates both.             |
| **Real-World Value** | This is the "full-stack type safety" pattern promoted by tRPC, Zod, and modern TypeScript monorepos. Companies like Vercel, Linear, and Supabase use this approach.                                                                 |
| **Layer**            | `packages/validation` — `auth.ts`, `parse.ts`                                                                                                                                                                                       |

### 1.15 Typed Error Contract (Server → Client)

|                      |                                                                                                                                                                                                                                                                                                                                                     |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description**      | Server throws typed `AppError` subclasses (`BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`) with optional machine-readable `code` strings (`SESSION_IDLE_EXPIRED`, `SESSION_ABSOLUTE_EXPIRED`, `ACCOUNT_SUSPENDED`). The client SDK wraps these into `AuthApiError` objects with typed `AuthApiErrorCode` discrimination. |
| **Problem Solved**   | Without typed errors, the frontend resorts to string matching on error messages — fragile, untranslatable, and breaks on any wording change. Machine-readable codes enable deterministic UI behavior.                                                                                                                                               |
| **Real-World Value** | Stripe's API is famous for its error code design. This implementation follows the same principle: stable codes for machines, human messages for display.                                                                                                                                                                                            |
| **Layer**            | `services/auth-server` — `common/errors/app-error.ts`; `packages/shared-auth` — `errors.ts`                                                                                                                                                                                                                                                         |

### 1.16 Centralized Config with Startup Validation

|                      |                                                                                                                                                                                                                                                                                                                   |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description**      | All environment variables are parsed once into a typed `config` object with fallback defaults. `assertConfigValid()` runs at startup and throws immediately if required secrets are missing. `warnOnSessionPolicyMisconfiguration()` detects timing conflicts (e.g., refresh lifetime shorter than idle timeout). |
| **Problem Solved**   | Runtime crashes from missing env vars are the #1 cause of deploy failures. Startup validation surfaces misconfigurations immediately rather than waiting for the first user to hit the broken code path.                                                                                                          |
| **Real-World Value** | This is the "fail fast" principle. Production-grade systems (12-factor apps) validate all configuration at boot. The session policy cross-checks show operational maturity.                                                                                                                                       |
| **Layer**            | `services/auth-server` — `config/env.ts`                                                                                                                                                                                                                                                                          |

### 1.17 Email Verification Flow

|                      |                                                                                                                                                                                                                                                      |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description**      | After registration, users receive a verification email with a hashed token link. The token is stored as SHA-256 hash in `EmailVerificationToken` with 1-hour expiry. Verification marks the user as `isVerified: true` and deletes the token record. |
| **Problem Solved**   | Confirms email ownership, reduces spam registrations, and enables "verified-only" route access.                                                                                                                                                      |
| **Real-World Value** | Table stakes for any production auth system. Required by most email service providers to maintain sender reputation.                                                                                                                                 |
| **Layer**            | `services/auth-server` — `auth/controller.ts`, `auth-token-records.service.ts`, `email-verification-token.model.ts`                                                                                                                                  |

### 1.18 Password Reset Flow

|                      |                                                                                                                                                                                                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description**      | User submits email → server generates random token, hashes it, stores in `PasswordResetToken` with 1-hour expiry, emails the raw token as a link. User clicks link → frontend submits token + new password → server validates hash, updates password, deletes token. |
| **Problem Solved**   | Secure self-service password recovery without exposing account existence (404 only on submit, not on email check).                                                                                                                                                   |
| **Real-World Value** | Critical for any consumer-facing application. The hash-only-storage pattern means a DB breach doesn't expose usable reset tokens.                                                                                                                                    |
| **Layer**            | `services/auth-server` — `auth/controller.ts`, `auth-token-records.service.ts`, `password-reset-token.model.ts`                                                                                                                                                      |

### 1.19 Role-Based Access Control (RBAC)

|                      |                                                                                                                                                                                                                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description**      | Four roles: `subscriber`, `author`, `admin`, `suspended`. The `requireRoles()` middleware factory checks `req.user.role` against an allowed list. The frontend navigation guard checks `route.meta.roles` against the store's user role. Admin-only and author-only route groups exist. |
| **Problem Solved**   | Different users need different access levels. Authors can view all users; only admins can suspend/delete. The guard prevents unauthorized navigation on the client while the middleware enforces on the server.                                                                         |
| **Real-World Value** | RBAC is the most common authorization model in enterprise software. The dual-layer enforcement (client + server) prevents both accidental navigation and API abuse.                                                                                                                     |
| **Layer**            | `services/auth-server` — `common/middleware/rbac.middleware.ts`; `packages/shared-auth` — `guard/auth-navigation-guard.ts`                                                                                                                                                              |

### 1.20 Google OAuth2 Login

|                      |                                                                                                                                                                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description**      | Frontend obtains a Google ID token via Google Sign-In, sends it to `/google/callback`. Server verifies the token with Google's library, upserts the user (creates if new, checks suspension if existing), creates a full session with cookies. |
| **Problem Solved**   | Social login reduces registration friction and eliminates password management for users who prefer OAuth.                                                                                                                                      |
| **Real-World Value** | Social login increases conversion rates by 20-40% according to industry studies. Google OAuth is the most widely-used social provider.                                                                                                         |
| **Layer**            | `services/auth-server` — `features/auth/controller.ts` (loginWithGoogle)                                                                                                                                                                       |

---

## 2. Architecture Overview

### 2.1 Overall Architecture Style

**Layered monorepo with shared-nothing service boundaries.**

The system follows a **client-server architecture** where:

- The **auth server** is a standalone Express 5 service with its own database, responsible for all identity and session operations
- **Frontend apps** are thin clients that delegate all auth logic to a shared SDK package
- **Shared packages** define the contract between layers without creating runtime coupling

This is neither a monolith (the auth server is independently deployable) nor a full microservices architecture (there's one service). It's the pragmatic middle ground: a **modular monorepo that can be split into separate deployments when needed**.

### 2.2 Monorepo / Package Organization

```
adaptive-auth/                    (pnpm workspace root)
├── apps/
│   ├── vue-app/                  Consumer: Vue 3 + Vite SPA
│   └── nuxt-app/                 Consumer: Nuxt 4 SPA (SSR-ready structure)
├── services/
│   └── auth-server/              Producer: Express 5 auth API
├── packages/
│   ├── shared-types/             Contract: TypeScript interfaces (DTOs)
│   ├── shared-auth/              SDK: Framework-agnostic auth client
│   ├── validation/               Contract: Zod schemas (shared validation)
│   ├── config-typescript/        Tooling: tsconfig presets
│   └── eslint-config/            Tooling: ESLint presets
└── docs/                         Architecture decisions and flow docs
```

**Dependency direction is strictly top-down:**

- Apps depend on packages
- Auth-server depends on shared-types and validation (for body schemas)
- Packages depend only on each other (shared-auth → shared-types)
- No circular dependencies

### 2.3 Shared Packages and Responsibilities

| Package             | Consumers                   | Responsibility                                      | Design Philosophy                                                          |
| ------------------- | --------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------- |
| `shared-types`      | All                         | TypeScript interfaces for API payloads              | Pure types, zero runtime, defines the "language" between client and server |
| `shared-auth`       | Frontend apps               | HTTP client, refresh logic, route guards, bootstrap | Framework-agnostic SDK that any Vue/Nuxt/React app could consume           |
| `validation`        | Frontend apps + auth-server | Zod schemas for request bodies                      | Single source of truth for "what is a valid request"                       |
| `config-typescript` | All packages/apps           | tsconfig presets (vue-dom, node-service, etc.)      | Prevents tsconfig drift across 8+ packages                                 |
| `eslint-config`     | All packages/apps           | ESLint flat configs (vue, node variants)            | Consistent code style without per-package configuration                    |

### 2.4 Separation of Concerns

**Auth Server internal layers:**

```
Routes (thin: path + middleware + handler reference)
  ↓
Controllers (request parsing, response formatting, orchestration)
  ↓
Services (business logic, stateless, testable)
  ↓
Models (data access, schema definition, indexes)
```

**Cross-cutting concerns are isolated:**

- Errors → `common/errors/` (typed hierarchy + global handler)
- Middleware → `common/middleware/` (CSRF, auth, RBAC, rate-limit, correlation-id)
- Observability → `common/observability/` (structured telemetry)
- Config → `config/` (centralized, validated)
- Device logic → `common/device/` (fingerprint matching)

### 2.5 Client/Server Boundaries

The boundary is clean and deliberate:

**Server owns:**

- Token generation and validation
- Session lifecycle (create, rotate, expire, revoke)
- Password hashing and comparison
- Device trust decisions
- Role enforcement (final authority)
- CSRF token issuance
- Rate limiting

**Client owns:**

- Session bootstrap orchestration (when to call refresh)
- CSRF token forwarding (read cookie, send header)
- Navigation guard decisions (redirect vs allow)
- Loading state management
- Error message presentation
- Multi-tab coordination

**Neither side trusts the other:**

- Server validates every request independently (never trusts client state)
- Client never stores secrets (all tokens are httpOnly cookies managed by the browser)

### 2.6 Browser vs Server Auth Handling

| Concern                  | Browser (SPA)                                  | Server                                    |
| ------------------------ | ---------------------------------------------- | ----------------------------------------- |
| Token storage            | httpOnly cookies (browser manages)             | Session documents in MongoDB              |
| Token rotation           | Transparent (cookie updated by Set-Cookie)     | Explicit (hash new secret, update record) |
| CSRF                     | Read non-httpOnly cookie, send as header       | Validate cookie === header                |
| Session expiry detection | Error codes from API responses                 | Timestamp comparisons on each request     |
| Refresh trigger          | On 401 response (automatic retry) or bootstrap | On POST /refresh (validates + rotates)    |
| Logout                   | Call API, clear local state                    | Delete session record, clear cookies      |

### 2.7 Vue App vs Nuxt App Differences

Both apps implement identical auth functionality with different framework idioms:

| Dimension        | vue-app                                              | nuxt-app                                                       |
| ---------------- | ---------------------------------------------------- | -------------------------------------------------------------- |
| **Routing**      | Explicit `RouteRecordRaw[]` in feature files         | File-based `pages/` directory                                  |
| **Layout**       | Config-driven smart layout system (7 presets, typed) | Nuxt named layouts (2 files)                                   |
| **Auth guard**   | `router.beforeEach` calling shared function          | `defineNuxtRouteMiddleware` calling same shared function       |
| **API clients**  | Module-level singletons in `shared/auth/clients.ts`  | Nuxt plugin provides via `useNuxtApp().$authApi`               |
| **Store access** | Direct imports                                       | Nuxt auto-imports                                              |
| **SSR**          | Not applicable (pure SPA)                            | Disabled now (`ssr: false`), architecture ready for future SSR |
| **CSS**          | Tailwind v4 + SCSS + UnoCSS                          | Tailwind v4 only                                               |

**Why two apps exist:** The vue-app is the original implementation with a sophisticated layout system (the "smart layout" — the project's namesake). The nuxt-app is a migration target that validates the shared packages work across frameworks and prepares for SSR session forwarding in the future.

### 2.8 Why Certain Abstractions Exist

| Abstraction                   | Why It Exists                                                                                                                                                  |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createBrowserAuthClients()`  | One-call setup for any browser app — encapsulates cookie access, CSRF injection, refresh wiring. Prevents each app from hand-rolling HTTP setup.               |
| `createResolveAuthRedirect()` | Auth guard logic is identical between Vue Router and Nuxt middleware. Extracting it means 65 lines of tested code serve both apps with zero duplication.       |
| `bootstrapSession()`          | The bootstrap sequence (refresh → status → user) has subtle error handling for each failure mode. Encoding it once prevents inconsistent behavior across apps. |
| `createRefreshSession()`      | Refresh deduplication + Web Locks is complex. Centralizing it means all consumers get correct multi-tab behavior without understanding the implementation.     |
| `AuthApiError` / codes        | Error codes bridge the server's typed errors to the client's conditional rendering. Without this abstraction, each app would parse error messages differently. |
| `config/env.ts`               | Prevents the "env var typo" class of bugs. Every access goes through one validated object instead of 50+ scattered `process.env.X` calls.                      |

---

## 3. Authentication Flows

### 3.1 Login Flow

```
User submits email + password
  ↓
Frontend: parseLoginBody(body) validates with Zod
  ↓
Frontend: auth.login(credentials) → POST /api/auth/login
  ↓
Server: loginRateLimiter checks IP+path (10 req/60s)
  ↓
Server: requireCsrf skips (login is exempt)
  ↓
Server: loginBodySchema.safeParse(req.body) validates
  ↓
Server: User.findOne({ email }) → 404 if not found
  ↓
Server: bcrypt.compare(password, user.password) → 401 if wrong
  ↓
Server: assertUserNotSuspended(user) → 403 + ACCOUNT_SUSPENDED if suspended
  ↓
Server: trustedDeviceFromRequest(req) → compare with user.userAgent[]
  ↓
[If new device]:
  Server: encrypt(6-digit code) → store LoginChallenge → throw BadRequestError("New browser or device detected.")
  Frontend: catches error → sets pendingLoginCodeEmail → navigates to login-code page
  ↓
[If trusted device]:
  Server: createFreshSessionTokens(user._id)
    → revokeAllUserSessions (single-session-per-user)
    → create Session document (hashed refresh token)
    → generate access JWT with { id, sid }
    → generate refresh JWT wrapping raw secret
  ↓
  Server: setAuthCookies(res, accessToken, refreshToken)
    → Set accessToken (httpOnly, 4h)
    → Set refreshToken (httpOnly, 2 days)
    → Set csrfToken (readable, 4h)
  ↓
  Server: res.status(200).json(user)
  ↓
  Frontend: authStore.setUser(user), isAuthenticated = true
  ↓
  Frontend: router redirects to intended destination
```

### 3.2 Session Handling

**Session Creation:** Every successful auth (register, login, loginWithCode, Google) calls `createFreshSessionTokens()` which:

1. Revokes all existing sessions for the user (single-session enforcement)
2. Generates a random 32-byte refresh secret
3. Creates a Session document with SHA-256 hash of the secret
4. Signs an access JWT with `{ id, sid }` (4h expiry)
5. Wraps the raw refresh secret in a signed refresh JWT (2 days expiry)

**Session Validation (every protected request):**

1. Extract `accessToken` from httpOnly cookie
2. Verify JWT signature and extract `{ id, sid }`
3. Reject if `sid` claim is missing (legacy token detection)
4. Look up Session by `{ _id: sid, userId: id }`
5. If not found → session was revoked → 401
6. Check idle timeout: `lastUsedAt + idleTimeoutMs > now`
7. Check absolute timeout: `sessionStartedAt + absoluteTimeoutMs > now`
8. If expired → delete session, emit telemetry, return 401 with expiry code
9. If `shouldTouchLastUsed()` (30s since last touch) → update `lastUsedAt`
10. Load user, check suspension, attach to `req.user`

**Session Termination:**

- Logout: user-initiated, deletes session + clears cookies
- Idle expiry: server-detected on next request, deletes session
- Absolute expiry: server-detected on next request, deletes session
- Admin suspension: immediate deletion of all user sessions
- New login: previous sessions revoked by `replaceUserSession()`

### 3.3 Token Refresh Flow

```
Trigger: SPA bootstrap OR 401 response on API call
  ↓
Frontend: refreshSession() (deduplicated, Web Locks serialized)
  ↓
Frontend: POST /api/auth/refresh (credentials: include, x-csrf-token header)
  ↓
Server: Extract refreshToken cookie → verify JWT → get { refreshToken: rawSecret, userId }
  ↓
Server: findSessionByRefreshRaw(userId, rawSecret, { requireUnexpiredRolling: true })
  → SHA-256 hash rawSecret → find Session where refreshTokenHash matches AND expiresAt > now
  ↓
Server: getSessionExpiryCode(session) → check idle + absolute
  [If expired]: delete session → throw UnauthorizedError with SESSION_IDLE_EXPIRED or SESSION_ABSOLUTE_EXPIRED
  ↓
Server: User.findById → assertUserNotSuspended
  ↓
Server: rotateExistingSession(session, userId)
  → Generate new random secret
  → Update session: new refreshTokenHash, new timestamps (preserve sessionStartedAt)
  → Return new refresh JWT + sid
  ↓
Server: generateToken(userId, sid) → new access JWT
  ↓
Server: setAuthCookies(res, accessToken, refreshToken) → new cookies + new csrfToken
  ↓
Server: emitAuthEvent('auth.refresh_success') → telemetry
  ↓
Frontend: refresh promise resolves → retry original 401 request
```

### 3.4 Route Guards

**Shared logic (`createResolveAuthRedirect`):**

```
On every navigation (to):
  ↓
If !authStore.authChecked → await authStore.bootstrapAuth()
  ↓
If route.meta.guestOnly && user is authenticated → redirect to home
  ↓
If route.meta.requiresAuth && user is NOT authenticated:
  → Build redirect query: { redirect: to.fullPath }
  → If sessionExpiryCode exists: add { session: code } to query
  → Redirect to login page with query
  ↓
If route.meta.roles exists && user lacks all required roles → redirect to /unauthorized
  ↓
Otherwise → return true (allow navigation)
```

**Vue-app implementation:** `router.beforeEach` calls `resolveAuthRedirect(to, authStore)`.

**Nuxt-app implementation:** `defineNuxtRouteMiddleware` calls the same function, uses `navigateTo()` for redirects.

### 3.5 Middleware Protection

The auth-server uses a layered middleware stack:

```
Request arrives
  ↓ CORS (allow configured origins with credentials)
  ↓ Correlation ID (mint or propagate x-correlation-id)
  ↓ Body parsing (JSON + URL-encoded)
  ↓ Cookie parsing
  ↓ CSRF validation (write methods only, exempt list for public routes)
  ↓ Route-specific middleware:
      protect/requireAuth → JWT + session validation
      requireRoles(['admin']) → role check
      loginRateLimiter → IP-based throttling
  ↓ Controller handler
  ↓ Error middleware (catches all, serializes typed response)
```

### 3.6 Redirect Flows

| Scenario                                              | Redirect Target          | Query Params                                               |
| ----------------------------------------------------- | ------------------------ | ---------------------------------------------------------- |
| Unauthenticated user hits protected route             | `/login`                 | `redirect=/original-path`                                  |
| Session expired (idle)                                | `/login`                 | `redirect=/original-path&session=SESSION_IDLE_EXPIRED`     |
| Session expired (absolute)                            | `/login`                 | `redirect=/original-path&session=SESSION_ABSOLUTE_EXPIRED` |
| Authenticated user hits guest-only route (login page) | `/` (home)               | —                                                          |
| User lacks required role                              | `/unauthorized`          | —                                                          |
| Successful login with redirect query                  | Original `redirect` path | —                                                          |

### 3.7 Auth State Synchronization

**Between browser tabs:** Web Locks API ensures only one tab refreshes at a time. All tabs share the same cookies, so a successful refresh in Tab A makes the new tokens available to Tab B automatically.

**Between store and server:** The `bootstrapAuth()` action is called once per app lifecycle (guarded by `authChecked` flag). It establishes ground truth from the server, then all subsequent state changes flow from API responses.

**Between apps:** Both vue-app and nuxt-app use the same auth server and the same cookie domain. A user logged in via vue-app is also logged in on nuxt-app (shared cookies).

### 3.8 Cross-Client Behavior

The `@adaptive-auth/shared-auth` package provides identical behavior across clients:

- Same HTTP client with CSRF injection
- Same refresh deduplication logic
- Same bootstrap sequence
- Same error handling and code extraction
- Same navigation guard logic

The only difference is how each framework plugs in:

- Vue-app: module-level singletons imported directly
- Nuxt-app: plugin provides clients on `useNuxtApp()`, allowing future SSR awareness

### 3.9 Validation Flow

```
User fills form (e.g., registration)
  ↓
Frontend: parseRegisterBody({ name, email, password })
  → Zod schema validates structure, lengths, email format
  → Returns { ok: true, value } or { ok: false, message }
  ↓
[If invalid]: Show inline error, don't submit
  ↓
[If valid]: auth.register(payload) → POST /api/auth/register
  ↓
Server: registerBodySchema.safeParse(req.body)
  → Same Zod schema validates again (defense in depth)
  → If invalid: throw BadRequestError(firstZodIssueMessage(parsed.error))
  ↓
Server: Proceed with business logic
```

### 3.10 Error Handling

**Server-side error flow:**

```
Service/Controller throws typed error (e.g., new UnauthorizedError('message', 'SESSION_IDLE_EXPIRED'))
  ↓
express-async-handler catches and forwards to error middleware
  ↓
errorHandler middleware:
  → If AppError: use err.statusCode + err.code
  → Else: use res.statusCode or 500
  → Response: { code?, message, stack? (dev only) }
```

**Client-side error flow:**

```
HTTP client receives non-2xx response
  ↓
Parse JSON body → extract { message, code }
  ↓
On 401: check if path is in skipRefreshRetryPaths
  → If not: attempt refreshSession() → retry original request
  → If refresh fails: surface original error
  ↓
Wrap in Error with .code property
  ↓
Auth API wrapper: toAuthApiError(error) → AuthApiError with typed .code
  ↓
Store action: catch → check code → update state (e.g., sessionExpiryCode)
  ↓
Component: reactive display based on store state
```

---

## 4. Reusable Infrastructure

### 4.1 `@adaptive-auth/shared-auth`

**Entry points:**

- `@adaptive-auth/shared-auth` — full SDK (createAuthApi, createUsersApi, createHttpClient, createRefreshSession, bootstrapSession, createResolveAuthRedirect, error types, cookie utilities)
- `@adaptive-auth/shared-auth/browser` — convenience facade (`createBrowserAuthClients()` one-call factory)

**Key abstractions:**

| Export                      | Purpose                                               | Reusability                          |
| --------------------------- | ----------------------------------------------------- | ------------------------------------ |
| `createHttpClient`          | Generic fetch wrapper with CSRF injection + 401 retry | Any API client, not just auth        |
| `createRefreshSession`      | Deduplicated refresh with Web Locks                   | Any token-rotation scheme            |
| `createAuthApi`             | Typed auth endpoint methods                           | Drop-in for any frontend             |
| `createUsersApi`            | Typed user management methods                         | Drop-in for any frontend             |
| `bootstrapSession`          | Session restore sequence                              | Any SPA with cookie auth             |
| `createResolveAuthRedirect` | Pure auth guard factory                               | Any vue-router-based framework       |
| `AuthApiError` + codes      | Typed error discrimination                            | Any client consuming the auth server |
| `getBrowserCookie`          | Document.cookie parser                                | Any browser-based app                |

**Design decisions:**

- No framework dependencies (uses raw `fetch`, accepts `vue-router` as peer dep for types only)
- Factory pattern everywhere (no globals, no singletons — consumers wire their own instances)
- Web Locks with graceful fallback (works without browser support)

### 4.2 `@adaptive-auth/shared-types`

Pure TypeScript interfaces — zero runtime cost, zero dependencies:

- `AuthUser` — user shape returned by all auth endpoints
- `AuthCredentials` — login payload contract
- `RegisterPayload` — registration payload contract
- `ChangePasswordPayload`, `UpdateProfilePayload`, `UpgradeUserPayload` — mutation contracts
- `UserRole` — union type defining all possible roles
- `ApiMessageResponse` — generic `{ message: string }` for non-entity responses

**Why separate from shared-auth:** Types-only packages can be imported by the server without pulling in browser-specific code. The auth-server imports `UserRole` and `UpgradeUserPayload` from here.

### 4.3 `@adaptive-auth/validation`

Zod v4 schemas + parse helpers:

| Schema                     | Used By Server                          | Used By Client                |
| -------------------------- | --------------------------------------- | ----------------------------- |
| `registerBodySchema`       | `controller.ts` → `safeParse(req.body)` | Form validation before submit |
| `loginBodySchema`          | `controller.ts` → `safeParse(req.body)` | Form validation               |
| `changePasswordBodySchema` | Could be added                          | Form validation               |
| `forgotPasswordBodySchema` | Could be added                          | Form validation               |
| `resetPasswordBodySchema`  | Could be added                          | Form validation               |

Parse helpers (`parseLoginBody`, etc.) return discriminated unions: `{ ok: true, value }` or `{ ok: false, message }` — ergonomic for form components.

`firstZodIssueMessage(error)` extracts the first human-readable message from a ZodError — used by the server to return the most relevant validation error.

### 4.4 Auth Clients

The `createBrowserAuthClients({ apiRoot })` factory produces:

```typescript
{
  auth: {
    login, register, logout, getLoginStatus,
    sendLoginCode, loginWithCode,
    forgotPassword, resetPassword,
    sendVerificationEmail, verifyUser, changePassword
  },
  users: {
    getCurrentUser, updateUser, getUsers, deleteUser, upgradeUser
  },
  refreshSession: () => Promise<ApiMessageResponse>
}
```

Each method is fully typed (input → output), handles CSRF automatically, and integrates with the refresh-retry mechanism.

### 4.5 Route Abstractions

**Vue-app pattern:** Feature-scoped route files (`features/auth/routes.ts`, `features/dashboard/routes.ts`) export `RouteRecordRaw[]` arrays. The central router aggregates them. Route meta carries `layout`, `requiresAuth`, `guestOnly`, `roles`.

**Nuxt-app pattern:** File-based routing with `definePageMeta()` for per-page metadata. Same meta keys (`requiresAuth`, `guestOnly`, `roles`, `layout`, `pageTitle`).

**Layout resolution (vue-app):** Routes declare `meta.layout` as either a preset string (`'dashboard'`) or a full `LayoutConfig` object. The `resolveLayout()` function maps this to a concrete component configuration.

### 4.6 Composables / Utilities / Helpers

| Utility                              | Location                                                      | Purpose                                                   |
| ------------------------------------ | ------------------------------------------------------------- | --------------------------------------------------------- |
| `resolveApiRoot()`                   | `apps/vue-app/src/shared/api/env.ts`                          | Resolves API base URL from Vite env                       |
| `useSidebarNav`                      | `apps/nuxt-app/app/composables/`                              | Sidebar navigation state for dashboard layout             |
| `trustedDeviceFromRequest()`         | `services/auth-server/src/common/device/`                     | Extracts {browser, os} from UA string                     |
| `userHasTrustedDevice()`             | Same file                                                     | Checks if current device matches stored fingerprints      |
| `mergeTrustedDevice()`               | Same file                                                     | Adds new device to user's trusted list                    |
| `buildSessionTimestamps()`           | `services/auth-server/src/services/session-policy.service.ts` | Creates consistent timestamp set for new/rotated sessions |
| `shouldTouchLastUsed()`              | Same file                                                     | Throttle check for lastUsedAt updates                     |
| `hashToken()` / `hashRefreshToken()` | `services/auth-server/src/services/token.service.ts`          | SHA-256 hashing for token storage                         |

---

## 5. Engineering Quality Review

### 5.1 What Is Implemented Well

**Session Authority Model** — The `sid` claim in access tokens, validated against a server-side Session document on every request, is a genuinely robust pattern. Combined with idle + absolute timeouts and touch throttling, this is enterprise-grade session management. Not many side projects implement this correctly.

**Shared Auth SDK** — The `@adaptive-auth/shared-auth` package demonstrates SDK-level thinking. The factory pattern, Web Locks integration, framework-agnostic design, and testable pure functions are what you'd find in commercial auth SDKs (Auth0 SPA SDK, Firebase Auth).

**Error Contract** — The typed error hierarchy on the server paired with typed error codes on the client creates a stable, machine-readable API contract. This is the pattern used by Stripe, Twilio, and other API-first companies.

**Monorepo Architecture** — The dependency graph is acyclic and well-organized. Build order is explicit. Shared packages have clear responsibilities and don't leak implementation details.

**Integration Tests** — The auth-server integration tests use MongoMemoryServer + Supertest with proper cookie jar management. They test real HTTP flows including CSRF enforcement, suspension cascades, and session lifecycle. This is closer to contract testing than typical unit tests.

**Config Validation** — Startup validation with cross-checks (session policy timing conflicts) prevents an entire class of production issues. This shows operational awareness.

### 5.2 What Already Looks Senior-Level

- **Web Locks for cross-tab refresh coordination** — Most developers don't even know this API exists, let alone use it for session coordination
- **Refresh token rotation with hashed storage** — Implementing OWASP-recommended token rotation correctly requires understanding the race condition implications
- **Session policy as pure functions** — Making timeout logic stateless and injectable enables unit testing without DB setup
- **Framework-agnostic guard factory** — Extracting route guard logic as a pure function testable without a router instance is an advanced abstraction
- **Immediate session revocation on role change** — The connection between admin action → session deletion → access denial shows end-to-end security thinking
- **Structured telemetry with correlation IDs** — This is observability engineering, not just logging

### 5.3 What Still Looks Intermediate

- **Auth store mixing session + account concerns** — The store handles both login/logout AND profile updates/password changes. Senior pattern: separate `useSessionStore` from `useAccountStore`
- **Route naming inconsistency** — `/me` + `/getUser` (same handler), `/upgradeUser` vs `/:id` (REST vs RPC). Senior pattern: consistent REST conventions
- **Google OAuth placeholder password** — `Date.now() + sub` is predictable. Senior pattern: random bytes or explicit "oauth-only" flag preventing password login
- **Controller size** — 380 lines with 13 handlers is manageable but pushing boundaries. Senior pattern: split into sub-controllers or use-case handlers (login.handler.ts, recovery.handler.ts)
- **Store-to-store coupling** — Logout calling `useUsersStore().clearList()` directly. Senior pattern: event bus or reactive watchers

### 5.4 What Is Overengineered

**Honestly, very little.** The abstractions serve real purposes:

- The shared-auth package exists because two apps consume it (not premature)
- The validation package exists because server + client both validate (not premature)
- The layout system in vue-app (7 presets) is elaborate but is literally the project's core feature

**Minor overengineering:**

- `attachAuthUser` middleware exists but appears unused — soft-attach pattern for future use
- `examples.ts` in layouts defines 6 additional layout configs (e-commerce, blog, docs, etc.) that aren't used by any route — demo/reference material

### 5.5 What Is Missing for Production-Grade Auth Infrastructure

See Section 6 for full details, but critical gaps:

- No multi-session support (single session per user limits enterprise use)
- No account lockout after failed attempts (rate limiting helps but doesn't lock)
- No audit log persistence (telemetry is structured but console-only)
- No token blacklisting / immediate access token invalidation
- No password complexity enforcement beyond length
- CSRF token is random rather than HMAC-bound to session

---

## 6. Missing Features / Future Improvements

### 6.1 Important Missing Auth/Security Features

| Feature                                | Priority | Impact                                                                            | Implementation Effort                                                   |
| -------------------------------------- | -------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Multi-session support                  | High     | Enterprise users need multiple devices simultaneously                             | Medium — remove `revokeAllUserSessions` from login, add session list UI |
| Account lockout after N failures       | High     | Rate limiting alone doesn't block distributed attacks                             | Low — counter per user, reset on success                                |
| TOTP/WebAuthn MFA                      | High     | Required for enterprise, compliance, and high-value accounts                      | High — new models, enrollment flow, verification step                   |
| Password strength enforcement          | Medium   | Beyond min-length: check against breached password lists, entropy                 | Low — integrate `zxcvbn` or HaveIBeenPwned API                          |
| HMAC-bound CSRF tokens                 | Medium   | Current random tokens can't be invalidated independently of session               | Low — HMAC(sessionId, secret) instead of random                         |
| OAuth-only account flag                | Medium   | Prevent password login for social-only accounts                                   | Low — boolean field, check in loginUser                                 |
| Refresh token family / reuse detection | Medium   | Detect stolen refresh tokens when both attacker and user try to use rotated chain | Medium — store token family ID, invalidate family on reuse              |
| Email change with confirmation         | Medium   | Currently no endpoint for email updates                                           | Medium — new verification flow                                          |
| Account deletion (GDPR)                | Medium   | Right to erasure requires full data purge                                         | Medium — cascade delete across collections                              |

### 6.2 Scalability Concerns

| Concern                         | Current State                  | Improvement                                          |
| ------------------------------- | ------------------------------ | ---------------------------------------------------- |
| Single MongoDB instance         | No replica set, no sharding    | Add read replicas for session lookups                |
| Session lookup on every request | DB query per protected request | Redis session cache with TTL matching touch interval |
| Single-server deployment        | No clustering documentation    | Add PM2/cluster mode, or containerize with K8s       |
| No connection pooling docs      | Mongoose defaults              | Document and tune connection pool for high load      |
| Email sending is synchronous    | In-request SMTP calls          | Queue-based email (BullMQ, SQS)                      |
| Single-session-per-user         | Revokes on new login           | Implement session limits (e.g., max 5 concurrent)    |

### 6.3 Observability Improvements

| Improvement                            | Benefit                                                 |
| -------------------------------------- | ------------------------------------------------------- |
| Persistent audit log (DB or external)  | Compliance, forensics, anomaly detection                |
| Request-level logging (Morgan or pino) | Performance monitoring, error rates                     |
| Health check with dependency status    | `/health` should report DB + Redis connectivity         |
| OpenTelemetry integration              | Distributed traces across services                      |
| Metrics (Prometheus/StatsD)            | Login success rate, refresh rate, error rate dashboards |
| Session activity dashboard             | Admin visibility into active sessions per user          |

### 6.4 DX Improvements

| Improvement                          | Benefit                                        |
| ------------------------------------ | ---------------------------------------------- |
| OpenAPI/Swagger spec generation      | Auto-generated API docs, client generation     |
| Docker Compose for local dev         | One-command development environment            |
| Seed scripts for development         | Pre-populated users/roles for testing          |
| Hot-reload for all packages          | Currently requires `build:packages` on changes |
| Storybook for auth components        | Visual testing of login forms, error states    |
| API response type inference from Zod | Eliminate manual DTO interfaces                |

### 6.5 Security Hardening

| Hardening               | Current State                     | Improvement                                          |
| ----------------------- | --------------------------------- | ---------------------------------------------------- |
| Password storage        | bcrypt (good)                     | Argon2id (modern best practice)                      |
| Token entropy           | 32 bytes (good)                   | Document minimum and rationale                       |
| Cookie flags            | httpOnly + Secure + SameSite=None | Consider SameSite=Strict for same-origin deployments |
| CORS                    | Dynamic allow-list                | Add origin validation regex for subdomains           |
| Content Security Policy | Not set                           | Add CSP headers                                      |
| Helmet middleware       | Not used                          | Add for standard security headers                    |
| Input sanitization      | Zod validates structure           | Add XSS sanitization on string fields                |
| Brute-force detection   | Per-IP rate limit                 | Add per-account detection with exponential backoff   |

### 6.6 Multi-Tab / Session Coordination

**Current state:** Web Locks for refresh deduplication — excellent foundation.

**Missing:**

- Broadcast Channel API for cross-tab state sync (logout in Tab A → logout in Tab B)
- Visibility API integration (pause touch-throttle when tab is hidden)
- Storage event listener for cross-tab cookie invalidation detection
- Tab leader election for background refresh scheduling

### 6.7 SSR Considerations

**Current state:** Nuxt app runs as SPA (`ssr: false`). Architecture is SSR-aware (plugin is `.client.ts`, cookie access is abstracted).

**For SSR activation:**

- Server-side cookie forwarding (req.headers.cookie → fetch options)
- Separate SSR auth client that reads cookies from request context
- Hydration mismatch prevention (don't render auth-dependent UI during SSR)
- Session validation on server render (avoid flash of authenticated content for expired sessions)

### 6.8 Testing Gaps

| Gap                                            | Impact                                             | Effort               |
| ---------------------------------------------- | -------------------------------------------------- | -------------------- |
| No unit tests for session-policy.service       | Policy logic is critical and testable in isolation | Low                  |
| No unit tests for auth-session.service         | Session rotation/revocation logic                  | Medium               |
| No tests for idle/absolute timeout enforcement | Race conditions possible                           | Medium               |
| No load/stress testing                         | Unknown behavior at scale                          | Medium               |
| No security scanning (OWASP ZAP, Snyk)         | Undiscovered vulnerabilities                       | Low (CI integration) |
| No nuxt-app unit tests                         | Only e2e coverage                                  | Medium               |
| No tests for trusted device flow               | New-device challenge untested                      | Low                  |
| No tests for Google OAuth flow                 | External dependency mocking needed                 | Medium               |

### 6.9 SDK / Platform Opportunities

| Opportunity                  | Description                                                          |
| ---------------------------- | -------------------------------------------------------------------- |
| `@adaptive-auth/react`       | React hooks wrapping shared-auth (useAuth, useSession, withAuth HOC) |
| `@adaptive-auth/nuxt-module` | Nuxt module auto-configuring middleware, plugin, stores              |
| `@adaptive-auth/admin-ui`    | Pre-built admin panel for user management, session viewing           |
| `@adaptive-auth/webhooks`    | Event webhooks for session creation/destruction/role changes         |
| `@adaptive-auth/cli`         | CLI for token inspection, session management, config validation      |
| Multi-tenant support         | Organization-scoped sessions, per-org policies                       |

---

## 7. Portfolio / Product Positioning

### 7.1 Technical Impressiveness

This project demonstrates competencies that are rare in portfolio projects:

**Security engineering depth:**

- Token rotation with hashed storage (most projects store raw tokens)
- Session-bound access tokens with server-side validation (most use stateless JWT only)
- CSRF enforcement with integration tests proving it works
- Immediate revocation on suspension (most projects just wait for expiry)
- Adaptive MFA via device fingerprinting (most projects skip this entirely)

**Systems design maturity:**

- Cross-tab coordination via Web Locks (advanced browser API)
- Structured telemetry with correlation IDs (production observability)
- Centralized config with startup validation (operational maturity)
- Graceful degradation in session bootstrap (resilience engineering)

**Software architecture skills:**

- Clean monorepo with acyclic dependency graph
- Framework-agnostic SDK extracted from application code
- Shared validation between client and server
- Typed error contracts with machine-readable codes
- Pure-function abstractions testable without infrastructure

**Full-stack integration:**

- Same auth flows work across two different frontend frameworks
- Cookie-based auth with proper browser security (httpOnly, SameSite, Secure)
- E2E tests proving the full stack works together

### 7.2 What Kind of Companies Would Value This Architecture

| Company Type                                           | Why They'd Value This                                          |
| ------------------------------------------------------ | -------------------------------------------------------------- |
| **B2B SaaS** (Notion, Linear, Figma)                   | Session management, RBAC, immediate revocation, admin controls |
| **Fintech** (Stripe, Wise, Revolut)                    | Token security, audit trails, session policies, device trust   |
| **Identity/Auth companies** (Auth0, Clerk, WorkOS)     | SDK design, multi-framework support, refresh coordination      |
| **Enterprise platforms** (Atlassian, Salesforce)       | Multi-session, role escalation, suspension cascades            |
| **Security-conscious startups** (1Password, Bitwarden) | Proper token handling, CSRF, rate limiting, observability      |
| **Platform teams** (any company with internal auth)    | Shared packages, typed contracts, reusable infrastructure      |

### 7.3 What This Resembles

This project sits at the intersection of multiple product categories:

**Auth Infrastructure (Primary)**
Like building the auth layer for a company's platform. Comparable to what platform/identity teams build at companies like Shopify, GitHub, or Vercel internally — but extracted as a reusable, documented system.

**Auth SDK (Secondary)**
The `shared-auth` package is structured like a commercial auth SDK (Auth0 SPA SDK, Firebase Auth, Clerk). It provides typed clients, session management, route protection, and error handling as a consumable library.

**Identity Platform (Aspirational)**
With additional features (multi-tenant, SSO, OAuth provider mode, admin dashboard), this could become a self-hosted identity platform like Keycloak, Ory, or SuperTokens.

**Internal Platform Tooling (Demonstrated Skill)**
The monorepo organization, shared packages, typed contracts, and consistent tooling demonstrate the skills needed to build internal developer platforms at scale.

### 7.4 Evolution Potential

**As Open Source:**

- Positioned as "batteries-included auth for Vue/Nuxt monorepos"
- Differentiator: not just an API (like SuperTokens) but a full-stack reference implementation
- Comparable to: `lucia-auth`, `next-auth`/`auth.js`, but for the Vue ecosystem
- Missing for open-source: multi-tenant, provider-agnostic OAuth, extensibility hooks

**As SaaS:**

- Add multi-tenant organization support
- Add hosted admin dashboard
- Add webhook/event delivery
- Add per-organization session policies
- Comparable to: WorkOS, Clerk, Stytch (all are auth-as-a-service for developers)
- Competitive advantage: Vue/Nuxt-native SDK with deep framework integration

**As Portfolio Piece (Current Best Use):**

- Demonstrates end-to-end ownership from security design to frontend UX
- Shows ability to build infrastructure that other developers consume
- Proves understanding of real-world auth concerns (not just a login form tutorial)
- The dual-framework approach proves the architecture generalizes beyond one app

### 7.5 Comparative Positioning

| Compared To                                 | This Project's Position                                                                                         |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Typical tutorial auth (JWT in localStorage) | Several levels above — proper cookie security, session revocation, CSRF, device trust                           |
| Auth0/Firebase integration project          | More impressive — built the platform itself rather than integrating someone else's                              |
| Basic Express + Passport setup              | Far more complete — session policies, token rotation, SDK extraction, observability                             |
| Production auth at a startup                | Comparable in many areas — missing load testing, account lockout, and multi-session but the foundation is solid |
| Auth platform (Ory, SuperTokens)            | Narrower scope but similar quality in what's implemented — demonstrates the same thinking patterns              |

### 7.6 Summary Statement

> Adaptive Auth is a production-oriented authentication platform built as a pnpm monorepo with a standalone auth service, framework-agnostic SDK, and dual frontend implementations. It implements server-side session authority, refresh token rotation with hashed storage, CSRF protection, adaptive device verification, RBAC, structured telemetry, and cross-tab coordination — making it comparable in architectural sophistication to the auth infrastructure at mid-stage startups. The project demonstrates security engineering depth, systems design maturity, and SDK-level abstraction thinking that positions its author as someone who can own critical infrastructure end-to-end.
