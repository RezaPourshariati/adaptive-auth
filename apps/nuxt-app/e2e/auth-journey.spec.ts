/// <reference types="node" />
import { expect, test } from '@playwright/test'

const apiRoot = (process.env.PLAYWRIGHT_API_ROOT ?? 'http://localhost:4000').replace(/\/$/, '')

test.describe('auth journey (nuxt)', () => {
  test('register → protected route → refresh → logout', async ({ page }) => {
    const email = `e2e-nuxt-${Date.now()}@example.com`
    const password = 'e2ePassword12'
    const name = 'E2E Nuxt User'

    await page.goto('/register')
    const createAccount = page.getByRole('button', { name: /create account/i })
    await expect(createAccount).toBeVisible({ timeout: 60_000 })
    await page.getByPlaceholder('Name').fill(name)
    await page.getByPlaceholder('Email').fill(email)
    await page.getByPlaceholder('Password').fill(password)
    await createAccount.click()
    await page.waitForURL(/\/dashboard/, { timeout: 30_000 })

    await expect(
      page.getByRole('banner').getByRole('heading', { name: /^dashboard$/i }),
    ).toBeVisible({ timeout: 30_000 })

    await page.goto('/profile')
    await expect(
      page.getByRole('banner').getByRole('heading', { name: /^profile$/i }),
    ).toBeVisible()

    const refreshStatus = await page.evaluate(async (root) => {
      const res = await fetch(`${root}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      })
      return res.status
    }, apiRoot)
    expect(refreshStatus).toBe(200)

    await page.getByRole('main').getByRole('button', { name: /^logout$/i }).click()
    await page.waitForURL(/\/login/, { timeout: 15_000 })

    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })
})
