# Layout Conventions (vue-app)

## Primary Question

How should routes pick a layout, what presets exist, and where do chrome vs page content belong?

## Short answer

- One shell: **`App.vue` → `AppLayout` → `BaseLayout` → page view** (nested areas insert `RouterViewOutlet` between `AppLayout` and the page).
- Pick layout via **`route.meta.layout`**: a **preset name** (preferred) or an inline **`LayoutConfig`** (exceptions only).
- Product presets: **`auth`**, **`marketing`**, **`app`**, **`admin`**.
- Primary nav is derived from route meta (`showInNav`, `navGroup`, `navOrder`, `title`) via **`buildNavLinks`**.
- Layout owns chrome; views own page content.

## Shell sequence

1. **`App.vue`** waits for auth bootstrap, then mounts `<router-view />` inside **`AppLayout`**.
2. **`AppLayout`** reads **`route.meta.layout`** and calls **`resolveLayout()`**.
3. **`BaseLayout`** renders header / sidebar / main / footer from the resolved **`LayoutConfig`**.
4. Feature **views** fill the main slot (directly, or via **`RouterViewOutlet`** for nested parents).

Do not import layout components from feature views. Do not duplicate header/footer markup in pages.

## Preset catalog

| Preset      | When to use                                                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `auth`      | Login, register, forgot/reset password, verify email — minimal chrome, no primary nav                                                 |
| `marketing` | Public pages (about, contacts, landing, unauthorized). Home uses a documented `createLayoutConfig` hero override on top of marketing. |
| `app`       | Authenticated general app pages (dashboard, profile) — header + nav sidebar                                                           |
| `admin`     | Privileged areas (admin, users) — header + admin/filter sidebar                                                                       |

Default when `meta.layout` is omitted: **`marketing`** (`layouts/index.ts`).

## Choosing `meta.layout`

**Preferred — preset name on a concrete parent path (never bare `/` if Home owns `/`):**

```ts
{
  path: '/dashboard',
  component: RouterViewOutlet,
  meta: { layout: 'app', requiresAuth: true },
  children: [{
    path: '',
    name: 'Dashboard',
    component: () => import('...'),
    meta: {
      showInNav: true,
      navGroup: 'app',
      navOrder: 50,
      title: 'Dashboard',
    },
  }],
}
```

**Allowed — `createLayoutConfig(...)`:** documented one-offs only (Home uses this for the hero gradient header without adding a fifth product preset).

### Why `config.name: 'marketing'`?

Two different “names” exist:

1. **Preset key** in `layoutPresets` (`marketing`, `app`, …) — what routes put in `meta.layout: 'marketing'`.
2. **`config.name`** on the resolved `LayoutConfig` — an id on the config object itself (useful for overrides/debugging).

They usually match. The preset key is what routing cares about; `config.name` is not a second layout system.

## Nested areas

Parents that share chrome own **`meta.layout`** on a **concrete path** (`/dashboard`, `/users`, …). Do **not** register multiple parents at bare `path: '/'` — the first one steals Home and renders an empty `RouterViewOutlet`.

## Navigation meta

| Meta        | Role                                                         |
| ----------- | ------------------------------------------------------------ |
| `showInNav` | Include in primary / sidebar nav                             |
| `navGroup`  | `public` \| `guest` \| `app` \| `admin`                      |
| `navOrder`  | Sort key (public 10–40, app 50–60, admin 65–70, guest 80–90) |
| `title`     | Link label                                                   |

`LayoutNavigation` and `SidebarNavigation` both call **`buildNavLinks`**.

## Ownership boundaries

| Concern                             | Owner               | Location                                             |
| ----------------------------------- | ------------------- | ---------------------------------------------------- |
| Header / footer / sidebar structure | Layout              | `layouts/`                                           |
| Primary nav links                   | Route meta → layout | `features/*/routes.ts`, `layouts/nav-from-routes.ts` |
| Auth / role gating                  | Router guards       | `app/router/`                                        |
| Page copy, forms, feature UI        | Feature view        | `features/*/views/`                                  |

## Anti-patterns

- One preset per route that only differs by header color.
- Importing `BaseLayout` or header components inside feature views.
- Hardcoding path lists in `LayoutNavigation` / `SidebarNavigation`.
- Demo routes or `layouts/examples.ts` in production `src/`.
- Thin re-exports that keep old and new import paths alive.

## Code anchors

- Resolver: `apps/vue-app/src/layouts/index.ts`
- Presets: `apps/vue-app/src/layouts/presets.ts`
- Nav builder: `apps/vue-app/src/layouts/nav-from-routes.ts`
- Types / `RouteMeta`: `apps/vue-app/src/layouts/types.ts`
- Shell: `apps/vue-app/src/App.vue`, `apps/vue-app/src/layouts/AppLayout.vue`
- Feature routes: `apps/vue-app/src/features/*/routes.ts`

## Out of scope for this page

- Target folder tree → [`vue-app-target-structure.md`](./vue-app-target-structure.md)
- Auth guard behavior → [`routing-auth-guards.md`](./routing-auth-guards.md)
- Auth/session orchestration → [`auth-orchestration.md`](./auth-orchestration.md)
