import { test, expect } from '@playwright/test'

test.describe('Configuracion', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/configuracion')
    await expect(page.getByRole('heading', { name: 'Configuración', level: 1 })).toBeVisible({ timeout: 10000 })
  })

  test('should display configuracion page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Configuración', level: 1 })).toBeVisible()
  })

  test('should show horarios section', async ({ page }) => {
    const horariosText = page.getByText(/horarios/i).first()
    await expect(horariosText).toBeVisible({ timeout: 3000 })
  })

  test('should have time inputs for turnos', async ({ page }) => {
    // Should have time inputs
    const timeInputs = page.locator('input[type="time"]')
    const count = await timeInputs.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should have toggle switches', async ({ page }) => {
    // Should have toggle switches for turnos
    const toggles = page.locator('.toggle-switch, input[type="checkbox"]')
    const count = await toggles.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should show packs section', async ({ page }) => {
    const packsText = page.getByText(/pack/i).first()
    await expect(packsText).toBeVisible({ timeout: 3000 })
  })

  test('should have precio input', async ({ page }) => {
    const precioInput = page.locator('input[name*="precio"], input[type="number"]').first()
    const exists = await precioInput.isVisible().catch(() => false)
    expect(exists).toBeTruthy()
  })

  test('should have save button', async ({ page }) => {
    const saveButton = page.getByRole('button', { name: /guardar/i }).first()
    const exists = await saveButton.isVisible().catch(() => false)
    expect(exists).toBeTruthy()
  })
})
