import process from 'node:process'
import { expect, test } from '@playwright/test'

const apiRoot = (process.env.PLAYWRIGHT_API_ROOT ?? 'http://localhost:4000').replace(/\/$/, '')

test.describe('auth journey', () => {
  test('register → protected route → refresh → logout', async ({ page }) => {
    const email = `e2e-${Date.now()}@example.com`
    const password = 'e2ePassword12'
    const name = 'E2E User'

    await page.goto('/register')
    await page.getByPlaceholder('Name').fill(name)
    await page.getByPlaceholder('Email').fill(email)
    await page.getByPlaceholder('Password').fill(password)
    await page.getByRole('button', { name: /create account/i }).click()
    // Do not use /\// — that matches any URL with a slash (e.g. still on /register).
    await page.waitForURL(
      url => ['/', '/dashboard'].includes(new URL(url).pathname),
      { timeout: 30_000 },
    )

    await page.goto('/dashboard', { waitUntil: 'networkidle' })
    await expect(
      page.getByRole('main').getByRole('heading', { name: /^dashboard$/i }),
    ).toBeVisible({ timeout: 30_000 })

    const refreshStatus = await page.evaluate(async (root) => {
      const res = await fetch(`${root}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      })
      return res.status
    }, apiRoot)
    expect(refreshStatus).toBe(200)

    await page.goto('/profile', { waitUntil: 'networkidle' })
    await page.getByRole('main').getByRole('button', { name: /^logout$/i }).click()
    await page.waitForURL(/\/login/, { timeout: 15_000 })

    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })
})
