import { test, expect } from '@playwright/test'

test.describe('Calendario', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/calendario')
    await expect(page.getByRole('heading', { name: /calendario|clases/i })).toBeVisible({ timeout: 10000 })
  })

  test('should display calendario page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /calendario|clases/i })).toBeVisible()
  })

  test('should have navigation buttons', async ({ page }) => {
    // Should have prev/next buttons with aria-labels we added
    const prevBtn = page.getByRole('button', { name: /anterior/i }).first()
    const nextBtn = page.getByRole('button', { name: /siguiente/i }).first()

    const hasPrev = await prevBtn.isVisible().catch(() => false)
    const hasNext = await nextBtn.isVisible().catch(() => false)

    expect(hasPrev || hasNext).toBeTruthy()
  })

  test('should have add clase button', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /agregar|nueva|crear|\+/i }).first()
    await expect(addButton).toBeVisible({ timeout: 3000 })
  })

  test('should open new clase dialog', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /agregar|nueva|crear|\+/i }).first()
    await addButton.click()

    // Dialog should open
    await expect(page.locator('[role="dialog"], .dialog')).toBeVisible({ timeout: 3000 })
  })

  test('should show tipo de clase options in dialog', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /agregar|nueva|crear|\+/i }).first()
    await addButton.click()

    // Should show prueba/recurrente options
    const pruebaBtn = page.getByRole('button', { name: /prueba/i })
    const recurrenteBtn = page.getByRole('button', { name: /recurrente/i })

    const hasPrueba = await pruebaBtn.isVisible().catch(() => false)
    const hasRecurrente = await recurrenteBtn.isVisible().catch(() => false)

    expect(hasPrueba || hasRecurrente).toBeTruthy()
  })

  test('should navigate to different day/week', async ({ page }) => {
    const nextBtn = page.getByRole('button', { name: /siguiente/i }).first()

    if (await nextBtn.isVisible().catch(() => false)) {
      await nextBtn.click()
      // Page should still be visible (no crash)
      await expect(page.getByRole('heading', { name: /calendario|clases/i })).toBeVisible()
    }
  })
})
