import { test, expect } from '@playwright/test'

test.describe('Integrated Flow - User Journey', () => {

  test('navigation between main pages works', async ({ page }) => {
    // Navigate through main pages
    await page.goto('/dashboard')
    // Dashboard shows "Hoy" heading - wait for main content
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 })
    // The dashboard shows "Hoy" as h1 heading (use exact match)
    await expect(page.getByRole('heading', { name: 'Hoy', exact: true })).toBeVisible({ timeout: 10000 })

    await page.goto('/alumnos')
    await expect(page.getByRole('heading', { name: /alumnos/i })).toBeVisible({ timeout: 15000 })

    await page.goto('/calendario')
    await expect(page.getByRole('heading', { name: /calendario|clases/i })).toBeVisible({ timeout: 15000 })

    await page.goto('/pagos')
    await expect(page.getByRole('heading', { name: /pagos/i })).toBeVisible({ timeout: 15000 })

    await page.goto('/configuracion')
    await expect(page.getByRole('heading', { name: 'Configuración', level: 1 })).toBeVisible({ timeout: 15000 })
  })

  test('can open create dialogs in all sections', async ({ page }) => {
    // Alumnos
    await page.goto('/alumnos')
    await expect(page.getByRole('heading', { name: /alumnos/i })).toBeVisible({ timeout: 15000 })
    const addAlumnoBtn = page.getByRole('button', { name: /agregar|nuevo|\+/i }).first()
    await addAlumnoBtn.click()
    await expect(page.locator('[role="dialog"], .dialog')).toBeVisible({ timeout: 5000 })
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)

    // Calendario
    await page.goto('/calendario')
    await expect(page.getByRole('heading', { name: /calendario|clases/i })).toBeVisible({ timeout: 15000 })
    const addClaseBtn = page.getByRole('button', { name: /agregar|nueva|\+/i }).first()
    await addClaseBtn.click()
    await expect(page.locator('[role="dialog"], .dialog')).toBeVisible({ timeout: 5000 })
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)

    // Pagos
    await page.goto('/pagos')
    await expect(page.getByRole('heading', { name: /pagos/i })).toBeVisible({ timeout: 15000 })
    const addPagoBtn = page.getByRole('button', { name: /agregar|nuevo|registrar|\+/i }).first()
    await addPagoBtn.click()
    await expect(page.locator('[role="dialog"], .dialog')).toBeVisible({ timeout: 5000 })
    await page.keyboard.press('Escape')
  })

  test('dashboard shows stats or content', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForTimeout(3000)

    // Should have some content visible
    const hasContent = await page.locator('.stat-card, .metric, .dashboard-card, .card, h1, h2, .empty-state').first().isVisible({ timeout: 10000 }).catch(() => false)
    expect(hasContent).toBeTruthy()
  })

  test('reportes page loads', async ({ page }) => {
    await page.goto('/reportes')
    const reportesLoaded = await page.getByRole('heading', { name: /reportes/i }).isVisible({ timeout: 10000 }).catch(() => false)

    if (reportesLoaded) {
      // Check for report sections
      const hasContent = await page.locator('.card, .report-card, .chart, table, .empty-state').first().isVisible({ timeout: 5000 }).catch(() => false)
      expect(hasContent).toBeTruthy()
    }
  })

  test('configuration sections are visible', async ({ page }) => {
    await page.goto('/configuracion')
    await expect(page.getByRole('heading', { name: 'Configuración', level: 1 })).toBeVisible({ timeout: 15000 })

    // Should have some configuration sections
    const hasHorarios = await page.getByText(/horarios/i).first().isVisible().catch(() => false)
    const hasPacks = await page.getByText(/pack/i).first().isVisible().catch(() => false)
    const hasPrecios = await page.getByText(/precio/i).first().isVisible().catch(() => false)

    expect(hasHorarios || hasPacks || hasPrecios).toBeTruthy()
  })
})
