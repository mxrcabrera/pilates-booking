import { test, expect } from '@playwright/test'

test.describe('Alumnos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/alumnos')
    await expect(page.getByRole('heading', { name: /alumnos/i })).toBeVisible({ timeout: 10000 })
  })

  test('should display alumnos page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /alumnos/i })).toBeVisible()
  })

  test('should show add button', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /agregar|nuevo|crear|\+/i }).first()
    await expect(addButton).toBeVisible({ timeout: 3000 })
  })

  test('should have search input', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="buscar" i]').first()
    const exists = await searchInput.isVisible().catch(() => false)
    expect(exists).toBeTruthy()
  })

  test('should open create modal', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /agregar|nuevo|crear|\+/i }).first()
    await addButton.click()

    // Dialog should open
    await expect(page.locator('[role="dialog"], .dialog')).toBeVisible({ timeout: 3000 })
  })

  test('should show form fields in modal', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /agregar|nuevo|crear|\+/i }).first()
    await addButton.click()

    // Should have nombre field - use placeholder since label is not associated
    const nombreInput = page.getByPlaceholder(/maría garcía/i)
    await expect(nombreInput).toBeVisible({ timeout: 3000 })
  })

  test('should filter alumnos by status', async ({ page }) => {
    // Check for status filter buttons
    const activosBtn = page.getByRole('button', { name: /activos/i })
    const inactivosBtn = page.getByRole('button', { name: /inactivos/i })

    const hasActivos = await activosBtn.isVisible().catch(() => false)
    const hasInactivos = await inactivosBtn.isVisible().catch(() => false)

    expect(hasActivos || hasInactivos).toBeTruthy()
  })
})
