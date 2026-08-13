# Vue App Target Folder Structure

## Primary Question

What should `apps/vue-app/src` look like when the migration to `app/` + `features/` + `shared/` + `layouts/` is finished?

## Short answer

- Keep four top-level source roots: **`app/`**, **`features/`**, **`layouts/`**, **`shared/`**, plus **`assets/`**.
- Delete legacy shims (`src/components/`, `src/plugins/`, `src/services/`, `src/types/` as long-term homes) once imports point at the real owners.
- Features own routes, views, and feature-local API/store; layouts own chrome; shared owns cross-feature UI and utilities.

## Target tree

```text
apps/vue-app/src/
├── main.ts                    # thin entry → app/main
├── App.vue                    # app shell + AppLayout + router-view
├── app/
│   ├── main.ts                # createApp, plugins, router, mount
│   ├── components/
│   │   └── AppBootstrapLoader.vue
│   ├── plugins/
│   │   └── primevue.ts
│   ├── router/
│   │   ├── index.ts           # compose feature routes + beforeEach
│   │   └── auth-navigation-guard.ts
│   └── store/
│       └── index.ts           # Pinia setup
├── features/
│   ├── auth/
│   │   ├── api/
│   │   ├── store/
│   │   ├── views/
│   │   ├── routes.ts
│   │   └── index.ts           # public feature surface
│   ├── public/
│   │   ├── views/
│   │   └── routes.ts
│   ├── dashboard/
│   │   ├── views/
│   │   └── routes.ts
│   ├── profile/
│   │   ├── views/
│   │   └── routes.ts
│   └── users/
│       ├── api/
│       ├── store/
│       ├── views/
│       ├── routes.ts
│       └── index.ts
├── layouts/
│   ├── AppLayout.vue          # meta.layout → resolveLayout
│   ├── BaseLayout.vue         # header / sidebar / main / footer
│   ├── RouterViewOutlet.vue   # nested parent outlet
│   ├── index.ts               # resolveLayout, exports
│   ├── nav-from-routes.ts     # buildNavLinks from route meta
│   ├── presets.ts             # product presets only (auth, marketing, app, admin)
│   ├── types.ts               # LayoutConfig + RouteMeta.layout / nav meta
│   └── components/
│       ├── LayoutHeader.vue
│       ├── LayoutFooter.vue
│       ├── LayoutNavigation.vue
│       ├── LayoutSidebar.vue
│       └── Sidebar*.vue
├── shared/
│   ├── api/                   # shared HTTP client wrappers
│   ├── components/            # cross-feature UI (e.g. feedback/AuthNotice)
│   ├── composables/
│   ├── constants/
│   ├── types/                 # cross-feature types (or import from packages/)
│   └── utils/
└── assets/
    ├── main.css
    └── styles/
        ├── layout/            # chrome SCSS
        ├── pages/             # page-specific SCSS only when needed
        └── ...
```

## What leaves the tree

| Remove / relocate                                | Replacement                                                 |
| ------------------------------------------------ | ----------------------------------------------------------- |
| `src/components/auth/AuthNotice.vue` (re-export) | Import `@/shared/components/feedback/AuthNotice.vue`        |
| `src/plugins/primevue.ts` (re-export)            | Import `@/app/plugins/primevue` only                        |
| `src/services/auth.ts`                           | Feature or package auth API (`features/auth` / shared-auth) |
| `src/types/` as a permanent home                 | `shared/types` and/or `packages/*`                          |
| `layouts/examples.ts`                            | `docs/` or Storybook — not production `src/`                |
| Demo-only routes (e.g. `/test`)                  | Delete or gate behind explicit demo mode                    |

## Import conventions

| Need                             | Import from                                         |
| -------------------------------- | --------------------------------------------------- |
| Bootstrap / router / Pinia setup | `@/app/...`                                         |
| Feature store, API, routes       | `@/features/<name>` or deep `@/features/<name>/...` |
| Layout resolver / types          | `@/layouts`                                         |
| Cross-feature UI / utils         | `@/shared/...`                                      |
| Auth package shared code         | `@adaptive-auth/...` or existing package alias      |

Avoid keeping both old and new paths for the same module once call sites are updated.

## Cleanup order (suggested)

1. **Point imports at canonical paths** (AuthNotice, PrimeVue, auth types/API) and delete shims. ✅
2. **Collapse layout presets** to `auth` / `marketing` / `app` / `admin` and update `features/*/routes.ts`. ✅
3. **Drive nav from route meta** (`showInNav`, `navGroup`, `navOrder`, `title`); slim hardcoded lists in `LayoutNavigation`. ✅
4. **Nest admin/dashboard children** under a parent that owns `meta.layout`. ✅
5. **Move or delete** `layouts/examples.ts` and demo routes. ✅
6. **Restore bootstrap gate** in `App.vue` (loader until `authChecked`). ✅

See [layout-conventions.md](./layout-conventions.md) for the current preset and nav rules.

## Relationship to layouts

This tree does not change the layout _mechanism_ (`meta.layout` → presets → `BaseLayout`). It only places chrome under `layouts/`, pages under `features/`, and shared UI under `shared/` so ownership stays obvious.

## Out of scope for this page

- Preset catalog and layout ownership rules → [`layout-conventions.md`](./layout-conventions.md)
- Auth guards → [`routing-auth-guards.md`](./routing-auth-guards.md)
- Monorepo package layout → [`../reference/monorepo-rollout.md`](../reference/monorepo-rollout.md)
