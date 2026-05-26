# Architecture Review v2 — Adaptive Auth Monorepo

Full review after restructure from single-folder Express + Vue SPA into pnpm monorepo with shared packages, dedicated auth service, and dual frontend apps.

| Metric              | Value |
| ------------------- | ----- |
| **Overall Grade**   | A-    |
| **Previous Grade**  | B     |
| **Issues Resolved** | 8/8   |
| **Remaining Risks** | 4     |

> **Major Improvements Since Last Review**
>
> Emodels by concern, bouvery high-priority issue from the previous review has been addressed. The project moved to a proper monorepo, split token nd access tokens to session IDs, enforced CSRF end-to-end, introduced typed errors, centralized config, added structured observability, and created real test infrastructure.

---

## Previous Issues — Resolution Status

| Previous Finding                                | Status   | How It Was Resolved                                                                                                                                          |
| ----------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Token model multiplexed unrelated lifecycles    | Resolved | Split into 4 dedicated models: Session, LoginChallenge, EmailVerificationToken, PasswordResetToken                                                           |
| Auth controller too large / mixed concerns      | Resolved | Extracted auth-session.service, auth-cookie.service, auth-token-records.service, user-policy.service, session-policy.service                                 |
| Access token not bound to session ID            | Resolved | Access JWT now carries { id, sid }; middleware validates sid against Session collection                                                                      |
| CSRF partially implemented, not enforced        | Resolved | requireCsrf mounted on /api/auth and /api/users in app.ts; cookie issued by auth-cookie.service; integration tests verify enforcement                        |
| Inconsistent auth errors (generic Error throws) | Resolved | Typed error hierarchy: AppError, BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError with deterministic status codes                           |
| Config scattered as raw process.env             | Resolved | Centralized config/env.ts with typed config object, startup validation (assertConfigValid), and misconfiguration warnings                                    |
| In-memory rate limiter only                     | Resolved | rate-limiter-flexible with Redis support; startup warning if REDIS_URL missing in production                                                                 |
| No automated tests                              | Resolved | Vitest + supertest + mongodb-memory-server integration tests; unit tests in shared-auth and validation packages; Playwright e2e specs for both frontend apps |

---

## Current Architecture Map

### Monorepo Structure

| Package                          | Type    | Purpose                                                                                     |
| -------------------------------- | ------- | ------------------------------------------------------------------------------------------- |
| @adaptive-auth/auth-server       | Service | Express 5 auth API: session management, identity, device trust, email verification          |
| @adaptive-auth/vue-app           | App     | Vue 3 + Vite + PrimeVue SPA with feature-first module organization and smart layout system  |
| @adaptive-auth/nuxt-app          | App     | Nuxt 4 + PrimeVue app with file-based routing, client-only auth (SSR deferred)              |
| @adaptive-auth/shared-types      | Package | Framework-agnostic TypeScript DTOs and API contracts                                        |
| @adaptive-auth/shared-auth       | Package | Framework-agnostic auth HTTP client, refresh orchestration, route guards, session bootstrap |
| @adaptive-auth/validation        | Package | Zod schemas for API bodies shared between frontend forms and server-side validation         |
| @adaptive-auth/config-typescript | Package | Shared tsconfig base                                                                        |
| @adaptive-auth/eslint-config     | Package | Shared ESLint configuration                                                                 |

### Auth Server — Service Layer Decomposition

| Service                    | Responsibility                                                 | Lines |
| -------------------------- | -------------------------------------------------------------- | ----- |
| auth-session.service       | Session CRUD, rotation, revocation, fresh token issuance       | ~76   |
| auth-cookie.service        | HTTP cookie setting/clearing with CSRF token issuance          | ~48   |
| auth-token-records.service | Login challenge, email verification, password reset token CRUD | ~60   |
| token.service              | JWT generation (access + refresh), token hashing               | ~32   |
| session-policy.service     | Idle/absolute timeout, touch interval, timestamp builder       | ~57   |
| user-policy.service        | Suspension enforcement (reusable assertion)                    | ~10   |

### Auth Server — Middleware Stack

| Middleware                | Mounted At            | Purpose                                                        |
| ------------------------- | --------------------- | -------------------------------------------------------------- |
| CORS                      | Global                | Dynamic origin allow-list from config                          |
| correlationIdMiddleware   | Global                | x-correlation-id propagation for log tracing                   |
| express.json / urlencoded | Global                | Body parsing                                                   |
| cookieParser              | Global                | Cookie parsing                                                 |
| requireCsrf               | /api/auth, /api/users | Double-submit CSRF with path exemptions for public auth routes |
| protect / requireAuth     | Per-route             | JWT + session-bound access verification with idle touch        |
| requireRoles              | Per-route             | Role-based access control                                      |
| loginRateLimiter          | /api/auth/login       | IP+path rate limiting (Redis or in-memory)                     |

### Data Models (Separated by Concern)

| Model                  | Collection                | Indexes                             | Purpose                                              |
| ---------------------- | ------------------------- | ----------------------------------- | ---------------------------------------------------- |
| Session                | sessions                  | userId, refreshTokenHash, expiresAt | Active refresh sessions with rolling/absolute expiry |
| LoginChallenge         | login_challenges          | userId, expiresAt                   | Encrypted login codes for device verification flow   |
| EmailVerificationToken | email_verification_tokens | userId, tokenHash, expiresAt        | Email verification links                             |
| PasswordResetToken     | password_reset_tokens     | userId, tokenHash, expiresAt        | Password reset links                                 |
| User                   | users                     | email                               | User identity, credentials, roles, trusted devices   |

---

## Strengths

- Clean monorepo boundaries
- Session-bound access tokens
- CSRF enforced end-to-end
- Typed error hierarchy
- Centralized config with validation
- Structured auth telemetry
- Integration + e2e test infrastructure
- Shared auth client (framework-agnostic)
- Refresh deduplication + Web Locks
- Dual-app code sharing via packages

### Monorepo Design

The pnpm workspace with apps/services/packages split is textbook clean. Shared packages (shared-types, shared-auth, validation) prevent type drift between frontend apps and the auth server. The build pipeline (build:packages first, then apps) respects the dependency graph.

### Session Authority Model

Access tokens now carry a `sid` claim bound to a specific Session document. The auth middleware validates both `userId` AND session `_id`, checks idle/absolute expiry, and touches `lastUsedAt` with throttling. This is genuine server-side session authority — not just "any active session for the user."

### Shared Auth Package

The `@adaptive-auth/shared-auth` package is particularly well-designed: framework-agnostic HTTP client with CSRF header injection, refresh deduplication using Web Locks API, session bootstrap sequence, and a pure-function auth navigation guard that can be unit-tested without mounting a router.

---

## Remaining Issues

### [Medium] Auth store still mixes session and account concerns (vue-app)

The vue-app auth store (~220 lines) handles session operations (login, register, bootstrap, logout) AND account operations (updateUser, sendVerificationEmail, changePassword, forgotPassword, resetPassword, verifyUser). The Nuxt app store has the same pattern.

**Recommendation:** Extract account/profile actions into a separate store or composable. Session concerns (bootstrapAuth, login, register, logout, sessionExpiryCode) stay; account concerns (updateUser, changePassword, verifyUser, etc.) move out.

### [Medium] Nuxt app users store imports from vue-app auth store

The Nuxt auth store logout action calls `useUsersStore().clearList()` directly. This creates a tight coupling between stores and means the users store must be available at logout time.

**Recommendation:** Use a Pinia event/subscription pattern or simply let the users store react to auth state changes via a watcher, keeping stores independent.

### [Low] Route namespace overlap on users routes

Users routes include both `/me` and `/getUser` (identical handlers), and `/getUsers` alongside RESTful patterns. The naming conventions mix REST style (`/users/:id`) with RPC style (`/upgradeUser`, `/sendAutomatedEmail`).

**Recommendation:** Standardize on REST conventions: `/me`, `GET /users`, `GET /users/:id`, `PATCH /users/:id`, `DELETE /users/:id`, `PATCH /users/:id/role`.

### [Low] Google login generates insecure placeholder password

`loginWithGoogle` creates new users with `password = Date.now() + sub`. While bcrypt hashes this before storage, the plaintext value is predictable (timestamp + Google sub ID). If a user later tries password-based login, the account is technically accessible with a guessable credential.

**Recommendation:** Use `crypto.randomBytes(32)` for the placeholder password, or better, flag the user as "oauth-only" and skip password-based login for such accounts.

---

## Test Coverage Map

| Location                    | Type        | Coverage Area                                                                                     |
| --------------------------- | ----------- | ------------------------------------------------------------------------------------------------- |
| services/auth-server/tests/ | Integration | Register, login, refresh, logout, CSRF enforcement, suspended user, session revocation (11 tests) |
| packages/shared-auth/tests/ | Unit        | HTTP client retry logic, auth navigation guard (guest/auth/role redirects)                        |
| packages/validation/tests/  | Unit        | Zod schema validation for auth bodies                                                             |
| apps/vue-app/tests/         | Unit        | Auth API client behavior, router integration with auth guards                                     |
| apps/vue-app/e2e/           | E2E         | Playwright auth journey (register/login/protected routes)                                         |
| apps/nuxt-app/e2e/          | E2E         | Playwright auth journey for Nuxt app                                                              |

---

## Architecture Verdict

This is a well-structured, production-oriented monorepo with strong separation of concerns. The auth/session security model is sound and properly enforced at runtime. The remaining issues are organizational polish (store boundaries, route naming) rather than architectural risks. The codebase has moved from "good intent, moderate drift" to "strong architecture with minor cleanup opportunities."
