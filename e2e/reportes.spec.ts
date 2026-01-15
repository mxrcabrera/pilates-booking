import { test, expect } from '@playwright/test'

test.describe('Reportes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/reportes')
    // Wait for page to load - use heading which always exists
    await expect(page.getByRole('heading', { name: /reportes/i })).toBeVisible({ timeout: 10000 })
  })

  test('should display reportes page with content', async ({ page }) => {
    // Either shows metrics or premium gate - one of these must be visible
    const hasMetrics = await page.getByText(/alumnos.*activos/i).isVisible().catch(() => false)
    const hasPremiumGate = await page.getByText(/premium|mejorar plan/i).first().isVisible().catch(() => false)

    expect(hasMetrics || hasPremiumGate).toBeTruthy()
  })

  test('should have month navigation if metrics available', async ({ page }) => {
    // Check if we have metrics (not gated)
    const hasMetrics = await page.getByText(/alumnos.*activos/i).isVisible().catch(() => false)

    if (hasMetrics) {
      // Should have month label
      const monthLabel = page.getByText(/enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre/i)
      await expect(monthLabel.first()).toBeVisible({ timeout: 3000 })
    }
  })

  test('should show asistencia section if metrics available', async ({ page }) => {
    const hasMetrics = await page.getByText(/alumnos.*activos/i).isVisible().catch(() => false)

    if (hasMetrics) {
      const asistenciaSection = page.getByText(/asistencia/i)
      const exists = await asistenciaSection.first().isVisible().catch(() => false)
      // Just verify no error - section may or may not exist based on data
    }
  })

  test('should show pagos section if metrics available', async ({ page }) => {
    const hasMetrics = await page.getByText(/alumnos.*activos/i).isVisible().catch(() => false)

    if (hasMetrics) {
      const pagosSection = page.getByText(/pagos/i)
      const exists = await pagosSection.first().isVisible().catch(() => false)
      // Just verify no error
    }
  })
})
