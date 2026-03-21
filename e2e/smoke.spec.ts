import { expect, test } from '@playwright/test'

test('home shows WebGL canvas', async ({ page }) => {
  await page.goto('/')
  await page.waitForSelector('canvas', { timeout: 30_000 })
  await expect(page.locator('canvas')).toHaveCount(1)
})

test('embed shows WebGL canvas', async ({ page }) => {
  await page.goto('/embed')
  await page.waitForSelector('canvas', { timeout: 30_000 })
  await expect(page.locator('canvas')).toHaveCount(1)
})
