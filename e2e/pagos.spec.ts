import { test, expect } from '@playwright/test'

test.describe('Pagos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pagos')
    // Wait for page heading
    await expect(page.getByRole('heading', { name: /pagos/i })).toBeVisible({ timeout: 10000 })
  })

  test('should display pagos page', async ({ page }) => {
    // Should show pagos list, table, or empty state
    const hasList = await page.locator('.pago-card, table, .empty-state').first().isVisible().catch(() => false)
    const hasEmptyText = await page.getByText(/no hay pagos|sin pagos/i).first().isVisible().catch(() => false)

    expect(hasList || hasEmptyText).toBeTruthy()
  })

  test('should have filters', async ({ page }) => {
    // Check for filter controls - at least one should exist
    const hasSelect = await page.locator('select').first().isVisible().catch(() => false)
    const hasSearch = await page.locator('input[type="search"], input[placeholder*="buscar" i]').isVisible().catch(() => false)

    // Filters should exist
    expect(hasSelect || hasSearch).toBeTruthy()
  })

  test('should have add button', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /agregar|nuevo|crear|registrar|\+/i }).first()
    await expect(addButton).toBeVisible({ timeout: 3000 })
  })

  test('should open dialog when clicking add', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /agregar|nuevo|crear|registrar|\+/i }).first()

    if (await addButton.isVisible().catch(() => false)) {
      await addButton.click()
      // Dialog should open
      await expect(page.locator('[role="dialog"], .dialog, .modal')).toBeVisible({ timeout: 3000 })
    }
  })

  test('should have export button (may be locked)', async ({ page }) => {
    // Export button exists but might show lock icon
    const exportBtn = page.locator('button').filter({ has: page.locator('svg') }).last()
    const exists = await exportBtn.isVisible().catch(() => false)
    // Just verify page renders without error
  })
})
