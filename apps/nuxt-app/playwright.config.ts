import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { defineConfig } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../..')

/**
 * Expects MongoDB for auth-server (same as vue-app E2E).
 * From repo root you can run `pnpm dev:full` with Nuxt on 3000, or rely on webServer below.
 *
 * Then: `pnpm test:e2e` (from apps/nuxt-app) or `pnpm test:e2e:nuxt-app` from root.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'pnpm dev',
      cwd: __dirname,
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'pnpm dev',
      cwd: path.join(repoRoot, 'services/auth-server'),
      url: 'http://localhost:4000/api/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
})
