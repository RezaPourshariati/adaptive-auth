# Routing and Auth Guards

## Primary Question

How does Vue Router decide who can see which route, when does it run `bootstrapAuth`, and how are login redirect + session-expiry hints passed in the URL?

## Short answer

- **`beforeEach`** waits for **`bootstrapAuth()`** once (until `authChecked` is true).
- Routes use **`meta.guestOnly`**, **`meta.requiresAuth`**, and **`meta.roles`** for redirects.
- Unauthenticated access to a protected route sends users to **`Login`** with **`redirect=<original path>`** and optional **`session=<SESSION_*_CODE>`**.
- **`LoginView`** sanitizes **`redirect`** (internal paths only) and clears **`session`** from the query after read to avoid stale bookmarks.

## Guard sequence

Logic lives in **`createResolveAuthRedirect`** (`packages/shared-auth/src/guard/auth-navigation-guard.ts`). Each app binds route names or paths in a thin wrapper (`apps/vue-app/src/app/router/auth-navigation-guard.ts`, `apps/nuxt-app/app/utils/auth-navigation-guard.ts`) and invokes it from **`router.beforeEach`** or Nuxt global middleware.

1. Resolve Pinia **`auth`** store.
2. If **`!authChecked`** → **`await bootstrapAuth()`** (refresh-first session restore).
3. **`guestOnly`** + authenticated → redirect **`Home`**.
4. **`requiresAuth`** + not authenticated → **`Login`** with **`redirect`** + optional **`session`** from store.
5. **`meta.roles`** present → require **`hasRole`**; else **`Unauthorized`**.

## Code anchors

### Global guard

```ts
// apps/vue-app/src/app/router/index.ts
router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  const resolved = await resolveAuthRedirect(to, authStore)
  if (resolved === true)
    return
  return resolved
})
```

### Pure redirect resolver (unit-tested)

```ts
// packages/shared-auth — apps pass named or path-based targets
export const resolveAuthRedirect = createResolveAuthRedirect({
  home: { name: 'Home' },
  login: { name: 'Login' },
  unauthorized: { name: 'Unauthorized' },
})
```

### Pinia + in-memory router (integration)

`packages/shared-auth/tests/auth-navigation-guard.test.ts` unit-tests the resolver. `apps/vue-app/tests/router-integration.test.ts` builds a small **`createMemoryHistory`** router with the same **`beforeEach` → `resolveAuthRedirect`** wiring as production.

### Safe post-login redirect + session UX

```ts
// front-end/src/features/auth/views/LoginView.vue
const redirectTo = computed(() => {
  const redirect = route.query.redirect
  if (typeof redirect !== 'string')
    return '/'
  return redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/'
})

onMounted(async () => {
  if (!route.query.session)
    return
  const nextQuery = { ...route.query }
  delete nextQuery.session
  await router.replace({ query: nextQuery })
})
```

## Route meta contract

| Meta           | Meaning                                                         |
| -------------- | --------------------------------------------------------------- |
| `guestOnly`    | Logged-in users are redirected away (e.g. login/register).      |
| `requiresAuth` | Anonymous users are sent to login with `redirect`.              |
| `roles`        | User must have one of the listed roles or see **Unauthorized**. |

## Trade-offs

- **Chosen:** declarative meta on routes keeps authorization visible next to route definitions.
- **Cost:** complex rules still belong in dedicated composables or docs if meta grows.

## Out of scope for this page

- API **`401`** retry and **`refreshSession`** — see [`auth-orchestration.md`](./auth-orchestration.md).
- Backend **`protect`** — see [`../backend/access-validation-middleware.md`](../backend/access-validation-middleware.md).
- End-to-end auth architecture — see [`../architecture/auth-and-session-architecture.md`](../architecture/auth-and-session-architecture.md).

## Evolution paths (meaningful only)

1. **Named route capabilities** instead of role strings if roles proliferate.
2. **Central permission matrix** if meta duplication becomes painful.
3. **Cross-tab auth broadcast** if login/logout must sync all tabs instantly.
