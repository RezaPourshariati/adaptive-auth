import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { defineConfig } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../..')
const isCi = !!process.env.CI

/**
 * End-to-end tests expect the API and SPA to be reachable.
 * Start them first, e.g. from repo root: `pnpm dev:full` (MongoDB must be running for the API).
 *
 * Then: `pnpm test:e2e`
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: isCi,
  retries: isCi ? 1 : 0,
  workers: 1,
  timeout: isCi ? 90_000 : 30_000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173',
    trace: 'on-first-retry',
    actionTimeout: isCi ? 60_000 : 30_000,
  },
  webServer: [
    {
      command: isCi ? 'pnpm preview --port 5173' : 'pnpm dev',
      cwd: __dirname,
      url: 'http://localhost:5173',
      reuseExistingServer: !isCi,
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
