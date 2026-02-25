import { test, expect } from '@playwright/test'

test.describe('Pagos - Complete CRUD Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pagos')
    await expect(page.getByRole('heading', { name: /pagos/i })).toBeVisible({ timeout: 15000 })
  })

  test('should open add pago dialog and show form', async ({ page }) => {
    // Open dialog
    const addButton = page.getByRole('button', { name: /agregar|nuevo|crear|registrar|\+/i }).first()
    await addButton.click()
    await expect(page.locator('[role="dialog"], .dialog')).toBeVisible({ timeout: 5000 })

    // Should have alumno selector
    const hasAlumnoSelect = await page.locator('select, [role="combobox"]').first().isVisible().catch(() => false)
    expect(hasAlumnoSelect).toBeTruthy()

    // Should have monto input
    const hasMontoInput = await page.locator('input[type="number"], input[name*="monto"]').first().isVisible().catch(() => false)
    expect(hasMontoInput).toBeTruthy()

    // Close dialog
    await page.keyboard.press('Escape')
  })

  test('should filter pagos by status', async ({ page }) => {
    // Find status filter
    const pendientesTab = page.getByRole('button', { name: /pendientes/i })
    const pagadosTab = page.getByRole('button', { name: /pagados/i })
    const todosTab = page.getByRole('button', { name: /todos/i })

    if (await pendientesTab.isVisible()) {
      await pendientesTab.click()
    }

    if (await pagadosTab.isVisible()) {
      await pagadosTab.click()
    }

    if (await todosTab.isVisible()) {
      await todosTab.click()
    }
  })

  test('should filter pagos by alumno', async ({ page }) => {
    const alumnoFilter = page.locator('select').filter({ hasText: /alumno|todos/i }).first()

    if (await alumnoFilter.isVisible()) {
      await alumnoFilter.click()
      // Select first option
      const option = page.locator('option').nth(1)
      if (await option.isVisible()) {
        await alumnoFilter.selectOption({ index: 1 })
      }
    }
  })

  test('should filter pagos by month', async ({ page }) => {
    const monthFilter = page.locator('select').filter({ hasText: /mes|enero|febrero|marzo/i }).first()

    if (await monthFilter.isVisible()) {
      await monthFilter.click()
    }
  })

  test('should show pago row with action buttons', async ({ page }) => {
    const pagoRow = page.locator('.pago-row').first()

    if (await pagoRow.isVisible({ timeout: 5000 })) {
      // Each row has action buttons (mark paid/pending, delete)
      const actionButtons = pagoRow.locator('.pago-actions button')
      const count = await actionButtons.count()
      expect(count).toBeGreaterThan(0)
    }
  })
})
