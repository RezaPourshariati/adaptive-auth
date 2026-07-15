# Layout Conventions (vue-app)

## Primary Question

How should routes pick a layout, what presets exist, and where do chrome vs page content belong?

## Short answer

- One shell: **`App.vue` → `AppLayout` → `BaseLayout` → page view**.
- Pick layout via **`route.meta.layout`**: a **preset name** (preferred) or an inline **`LayoutConfig`** (exceptions only).
- Keep a small preset set aligned to product areas — not one preset per page color.
- Layout owns chrome (header, nav, sidebar, footer). Views own page content.

## Shell sequence

1. **`App.vue`** wraps the app shell and mounts `<router-view />` inside **`AppLayout`**.
2. **`AppLayout`** reads **`route.meta.layout`** and calls **`resolveLayout()`**.
3. **`BaseLayout`** renders header / sidebar / main / footer from the resolved **`LayoutConfig`**.
4. The feature **view** fills the main slot only.

Do not import layout components from feature views. Do not duplicate header/footer markup in pages.

## Preset catalog (target)

Use these named presets. Prefer a name over an inline config.

| Preset      | When to use                                                                                                    |
| ----------- | -------------------------------------------------------------------------------------------------------------- |
| `auth`      | Login, register, forgot/reset password, verify email — minimal chrome, no marketing nav if possible            |
| `marketing` | Public marketing pages (home, about, contacts, landing) — shared header/footer; page styling stays in the view |
| `app`       | Authenticated general app pages (dashboard, profile) — app chrome + optional sidebar                           |
| `admin`     | Privileged areas (users, admin tools) — app chrome + admin/filter sidebar                                      |

### Migration note (current → target)

Today’s presets (`simple`, `home`, `about`, `contacts`, `landing`, `dashboard`, `admin`) are showcase-oriented. Collapse toward the four product presets above:

| Current                                | Target                                                             |
| -------------------------------------- | ------------------------------------------------------------------ |
| `simple` (auth routes)                 | `auth`                                                             |
| `home`, `about`, `contacts`, `landing` | `marketing` (vary look in the view or via tokens, not new presets) |
| `dashboard`                            | `app`                                                              |
| `admin`                                | `admin`                                                            |
| Inline profile config                  | Prefer `app` + page-level styling, or one documented override      |

## Choosing `meta.layout`

**Preferred — preset name:**

```ts
meta: {
  layout: 'app',
  requiresAuth: true,
}
```

**Allowed — inline `LayoutConfig`:** only when a route needs a one-off chrome difference that will not become a third shared pattern. Prefer documenting why in a comment near the route.

**Default:** if `meta.layout` is omitted, resolution falls back to the default preset (`simple` today; target default should be `marketing` or `app` once migration finishes — keep one explicit default in `layouts/index.ts`).

## Ownership boundaries

| Concern                             | Owner                                        | Location                |
| ----------------------------------- | -------------------------------------------- | ----------------------- |
| Header / footer / sidebar structure | Layout                                       | `layouts/`              |
| Primary nav links                   | Layout (driven by route meta where possible) | `layouts/components/`   |
| Auth / role gating of routes        | Router guards                                | `app/router/`           |
| Page copy, forms, feature UI        | Feature view                                 | `features/*/views/`     |
| Page-specific SCSS                  | Feature or `styles/pages/`                   | not in presets          |
| Layout chrome SCSS                  | Shared layout styles                         | `assets/styles/layout/` |

## Navigation rules

- Prefer deriving nav from route **`meta`** (`showInNav`, `navGroup`, `navOrder`, `title`) instead of hardcoding path lists in **`LayoutNavigation`**.
- Adding a navigable page should not require editing layout components except when introducing a new nav _group_.
- Guest vs authenticated vs role links remain layout chrome, but the _source of truth_ should be the route table.

## Nested areas (target)

For product areas that share chrome (e.g. admin), prefer a parent route that owns **`meta.layout: 'admin'`** and **`children`** pages, instead of repeating the same layout on every leaf.

Flat `meta.layout` on each leaf remains valid for small apps and demos.

## Sidebar content

Sidebar sections currently map string keys (`navigation`, `filters`, `info`) to fixed components. Conventions:

- Stable product sidebars stay in **`layouts/components/`**.
- Feature-specific sidebar panels should not require editing **`LayoutSidebar`** forever — prefer slots or registered widgets as the app grows.
- Do not stuff page forms into the sidebar config unless the sidebar is truly shared chrome.

## Styling hybrid

- **Layout chrome:** utilities in Vue layout components + `assets/styles/layout/`.
- **Page look:** view templates + `assets/styles/pages/` when Sass is needed.
- Do not invent a new preset solely to change a header color; use tokens / view classes / a small override in `LayoutConfig` if truly shared.

## Anti-patterns

- One preset per route that only differs by header color.
- Importing `BaseLayout` or header components inside feature views.
- Hardcoding every new path in `LayoutNavigation` without route meta.
- Leaving demo routes (`/test`) or doc-only layout examples (`layouts/examples.ts`) in the production tree.
- Thin re-exports that keep both old and new import paths alive indefinitely.

## Code anchors

- Resolver: `apps/vue-app/src/layouts/index.ts` (`resolveLayout`)
- Presets: `apps/vue-app/src/layouts/presets.ts`
- Types / `RouteMeta.layout`: `apps/vue-app/src/layouts/types.ts`
- Shell wiring: `apps/vue-app/src/App.vue`, `apps/vue-app/src/layouts/AppLayout.vue`
- Feature routes: `apps/vue-app/src/features/*/routes.ts`

## Out of scope for this page

- Target folder tree and cleanup order → [`vue-app-target-structure.md`](./vue-app-target-structure.md)
- Auth guard behavior → [`routing-auth-guards.md`](./routing-auth-guards.md)
- Auth/session orchestration → [`auth-orchestration.md`](./auth-orchestration.md)
