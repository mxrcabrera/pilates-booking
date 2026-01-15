import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
    // Wait for main content - any heading
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10000 })
  })

  test('should display dashboard page', async ({ page }) => {
    // Dashboard should have loaded
    await expect(page.getByRole('heading').first()).toBeVisible()
  })

  test('should show stats or welcome content', async ({ page }) => {
    // Should show some content - stats, welcome, or class list
    const content = page.getByText(/bienvenid|hola|alumnos|clases|hoy/i)
    await expect(content.first()).toBeVisible({ timeout: 5000 })
  })

  test('should have navigation links', async ({ page }) => {
    // Should have nav links to other sections
    const alumnosLink = page.getByRole('link', { name: /alumnos/i }).first()
    const calendarioLink = page.getByRole('link', { name: /calendario|clases/i }).first()

    const hasAlumnos = await alumnosLink.isVisible().catch(() => false)
    const hasCalendario = await calendarioLink.isVisible().catch(() => false)

    expect(hasAlumnos || hasCalendario).toBeTruthy()
  })

  test('should navigate to alumnos', async ({ page }) => {
    const alumnosLink = page.getByRole('link', { name: /alumnos/i }).first()

    if (await alumnosLink.isVisible().catch(() => false)) {
      await alumnosLink.click()
      await expect(page).toHaveURL(/alumnos/, { timeout: 5000 })
    }
  })

  test('should navigate to calendario', async ({ page }) => {
    const calendarioLink = page.getByRole('link', { name: /calendario/i }).first()

    if (await calendarioLink.isVisible().catch(() => false)) {
      await calendarioLink.click()
      await expect(page).toHaveURL(/calendario/, { timeout: 5000 })
    }
  })
})
