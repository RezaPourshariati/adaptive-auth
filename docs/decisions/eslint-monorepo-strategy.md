# ESLint Strategy for Monorepo Packages

This document explains ESLint strategy options for this repository and provides best practices for deciding between:

- a **single root ESLint config** (current setup), and
- **root + per-package ESLint configs** (optional future setup).

Current repository structure:

- `front-end/`
- `back-end/`
- root orchestration (`package.json`, `pnpm-workspace.yaml`, CI workflows)

---

## Current Recommended Baseline

Use **one shared root ESLint config** and run package-scoped scripts from root:

- `pnpm lint:front-end`
- `pnpm lint:back-end`
- `pnpm lint`

Why this is a good default:

1. Single source of truth.
2. Lower maintenance overhead.
3. Less rule drift between packages.
4. Simple CI and branch protection setup.

---

## When Per-Package ESLint Configs Are Worth It

Adopt per-package ESLint configs if one or more of these are true:

1. Front-end and back-end need significantly different linting philosophies.
2. Different teams own each package and need local autonomy.
3. Packages should be runnable in isolation without root tooling assumptions.
4. Backend needs advanced Node-only rules that conflict with Vue/browser conventions.
5. Front-end needs plugin/rule stacks not relevant to backend and vice versa.

If these are not true yet, keep the root-only model.

---

## Decision Matrix

- **Root-only config (shared)**
  - Best for: small-to-medium teams, unified coding standards.
  - Pros: simpler, consistent, fewer files to maintain.
  - Cons: less flexibility for package-specific divergence.

- **Root + per-package configs**
  - Best for: larger teams, diverging standards, independent package ownership.
  - Pros: package-level flexibility and autonomy.
  - Cons: more complexity, possible config drift, extra CI maintenance.

---

## Best Practices (Regardless of Model)

1. Keep CI package-scoped and explicit.
   - Example: run front-end and back-end lint as separate jobs.
2. Keep lint scripts deterministic and non-interactive.
3. Use the same Node and pnpm versions in local and CI.
4. Keep rule customizations minimal and justified.
5. Avoid style-only churn in large legacy files unless intentional.
6. Document rule exceptions and package-specific overrides.

---

## If We Add Per-Package Configs Later

Use this structure:

- `eslint.config.mjs` at root (shared base)
- `front-end/eslint.config.mjs` (extends shared + front-end overrides)
- `back-end/eslint.config.mjs` (extends shared + back-end overrides)

Recommended migration path:

1. Keep root config as base and export reusable pieces.
2. Create package-level configs with only minimal overrides.
3. Update scripts:
   - root `lint:front-end` should run with front-end config
   - root `lint:back-end` should run with back-end config
4. Keep root `lint` as orchestrator only.
5. Update CI required checks names if job names change.
6. Validate no rule drift by comparing common files/rules after migration.

---

## Repository-Specific Recommendation

For this repository **today**:

- Keep the current **root-only ESLint config** model.
- Continue package-scoped lint scripts from root.
- Revisit per-package configs only when clear, concrete divergence appears.

This preserves clarity and velocity while still supporting future growth.
