# Advanced Authentication Reference Architecture

This document summarizes the authentication approach used in `dev-apps/advanced-authentication` so it can be used as a reference when evolving the AdaptiveAuth project.

## Project Scope

`dev-apps/advanced-authentication` is a separate full-stack application with:

- a Node.js + Express backend (`back-end`)
- a React + Redux frontend (`front-end`)
- a cookie-based JWT authentication model
- supporting flows for verification, reset, role checks, and device login code

---

## Folder Structure (Auth-Relevant)

### Backend

- `dev-apps/advanced-authentication/back-end/server.ts`
  - Express bootstrap, middleware, CORS, cookies, and route mounting.
- `dev-apps/advanced-authentication/back-end/routes/userRoute.ts`
  - Auth and user endpoint definitions.
- `dev-apps/advanced-authentication/back-end/controllers/userController.ts`
  - Core auth flow implementation (register, login, logout, verify, reset, role updates, Google login, login code).
- `dev-apps/advanced-authentication/back-end/middleware/authMiddleware.ts`
  - Route protection and authorization (`protect`, `adminOnly`, `authorOnly`, `verifiedOnly`).
- `dev-apps/advanced-authentication/back-end/models/userModel.ts`
  - User schema and password hashing hook.
- `dev-apps/advanced-authentication/back-end/models/tokenModel.ts`
  - Stored token artifacts for verification/reset/refresh/login-code flows.
- `dev-apps/advanced-authentication/back-end/utils/index.ts`
  - Token generation and hashing helpers.
- `dev-apps/advanced-authentication/back-end/utils/sendEmail.ts`
  - Email delivery utility.
- `dev-apps/advanced-authentication/back-end/views/*.handlebars`
  - Email templates.

### Frontend

- `dev-apps/advanced-authentication/front-end/src/App.tsx`
  - App routes, auth bootstrap behavior, and axios credentials setup.
- `dev-apps/advanced-authentication/front-end/src/redux/features/auth/authSlice.ts`
  - Auth state management and async thunks.
- `dev-apps/advanced-authentication/front-end/src/redux/features/auth/authService.ts`
  - HTTP client methods for auth endpoints.
- `dev-apps/advanced-authentication/front-end/src/customHook/useRedirectLoggedOutUser.ts`
  - Redirect behavior for unauthenticated users.
- `dev-apps/advanced-authentication/front-end/src/components/protect/hiddenLink.tsx`
  - UI-level access gating (`ShowOnLogin`, `ShowOnLogout`, `AdminAuth`).

---

## Authentication Methods and Approach

The project combines several authentication and authorization mechanisms:

1. **JWT Access Token**
   - Short-lived token used for authenticated requests.
   - Delivered via `httpOnly` cookie (`accessToken`).

2. **Refresh Token Flow**
   - Refresh token cookie (`refreshToken`) supports session continuity.
   - Refresh token material is also validated against database state.

3. **Cookie-Based Transport**
   - Frontend sends cookies automatically (`withCredentials`).
   - Avoids storing auth tokens in `localStorage`.

4. **Email Verification**
   - Verification token sent by email and validated before trust elevation.

5. **Password Reset**
   - Forgot/reset flow with hashed reset tokens and expiration.

6. **Step-Up Login Code for New Device**
   - Unknown user-agent triggers login code flow via email.
   - Behaves like a lightweight second factor for new environments.

7. **Role-Based Access Control (RBAC)**
   - Backend middleware enforces role access (`admin`, `author`, etc.).
   - Frontend adds UX-level visibility gating for role-specific actions.

8. **Google Sign-In Path**
   - Supports OAuth token verification via Google APIs.

---

## Backend Authentication Architecture

### 1) Registration

- Endpoint creates user record and hashed password (model hook).
- Access token is issued and set as secure cookie.

### 2) Login

- Credentials are validated.
- If user-agent is recognized:
  - access + refresh cookies are issued.
- If user-agent is new:
  - login code is generated and sent through email pathway.

### 3) Protected Access

- `protect` middleware checks access token first.
- If access token is invalid/expired and refresh cookie exists:
  - refresh token is validated,
  - DB token state is checked,
  - a new access token is minted.

### 4) Authorization

- Role middleware executes after authentication middleware.
- Sensitive routes require explicit role checks.

### 5) Session Exit

- Logout clears auth cookies.

### 6) Recovery and Verification

- Email verification and password reset rely on hashed, expiring DB-backed tokens.

---

## Frontend Authentication Architecture

1. **Redux Toolkit Auth Slice**
   - Central auth state and side effects.
   - Includes thunks for register/login/logout/status/user profile and other auth flows.

2. **Service Layer**
   - API calls are centralized in `authService.ts`.

3. **Session Bootstrap**
   - App startup checks login status and then fetches user details when needed.

4. **Route Protection Strategy**
   - Mostly component-level protection patterns instead of strict router-guard wrappers.
   - Uses redirect hook and conditional components for access control behavior.

5. **Credential Strategy**
   - Cookie-based auth continuity.
   - No dependency on browser token storage for core auth state.

---

## Authentication Level Assessment

Overall, this design is **Intermediate to Advanced** for a demo/reference app.

### Strengths

- Multi-flow authentication (login, refresh, verify, reset, step-up login code).
- HTTP-only cookie usage for token transport.
- Role-based authorization middleware.
- Token hashing and expiring token workflows.
- Device-aware challenge behavior.

### Improvement Opportunities for Production Hardening

- Add explicit CSRF protection for cookie-auth endpoints.
- Apply rate limiting and brute-force protection on login and code verification.
- Ensure refresh-token secret separation and robust token revocation on logout.
- Audit cookie flags and cross-site assumptions per deployment environment.

---

## How to Reuse This in AdaptiveAuth

When adapting ideas into AdaptiveAuth, prioritize this order:

1. **Core auth baseline**: access token + refresh flow + `protect` middleware.
2. **RBAC**: role middleware and protected feature flags in UI.
3. **Account safety**: email verification + reset password.
4. **Step-up security**: new-device login code.
5. **Hardening layer**: CSRF, rate limiting, session revocation strategy, audit logging.

This ordering keeps implementation incremental while preserving security and maintainability.
