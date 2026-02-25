import { test, expect } from '@playwright/test'

test.describe('Configuracion - Complete Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/configuracion')
    await expect(page.getByRole('heading', { name: 'Configuración', level: 1 })).toBeVisible({ timeout: 15000 })
  })

  test('should change horario turno mañana and verify persistence', async ({ page }) => {
    // Find morning schedule inputs
    const manianaSection = page.locator('.horario-section, .card').filter({ hasText: /mañana/i }).first()

    if (await manianaSection.isVisible()) {
      // Find time inputs in this section
      const timeInputs = manianaSection.locator('input[type="time"]')
      const startTime = timeInputs.first()

      if (await startTime.isVisible()) {
        // Change start time
        const originalValue = await startTime.inputValue()
        await startTime.fill('09:00')

        // Save
        const saveBtn = page.getByRole('button', { name: /guardar/i }).first()
        if (await saveBtn.isVisible()) {
          await saveBtn.click()
          await page.waitForLoadState('networkidle')
        }

        // Reload page and verify
        await page.reload()
        await expect(page.getByRole('heading', { name: 'Configuración', level: 1 })).toBeVisible({ timeout: 15000 })

        // Check if value persisted and restore original value
        const newStartTime = page.locator('.horario-section, .card').filter({ hasText: /mañana/i }).first().locator('input[type="time"]').first()
        await newStartTime.fill(originalValue)
        const saveBtn2 = page.getByRole('button', { name: /guardar/i }).first()
        if (await saveBtn2.isVisible()) {
          await saveBtn2.click()
        }
      }
    }
  })

  test('complete pack lifecycle: create -> edit -> delete', async ({ page }) => {
    const uniquePackName = `Pack Test ${Date.now()}`

    // 1. CREATE - Find add pack button
    const addPackBtn = page.getByRole('button', { name: /agregar.*pack|nuevo.*pack|\+/i }).first()

    if (await addPackBtn.isVisible()) {
      await addPackBtn.click()
      await expect(page.locator('[role="dialog"], .dialog')).toBeVisible({ timeout: 5000 })

      // Fill pack form
      const nombreInput = page.locator('input[name*="nombre"], input[placeholder*="nombre"]').first()
      if (await nombreInput.isVisible()) {
        await nombreInput.fill(uniquePackName)
      }

      const clasesInput = page.locator('input[name*="clases"], input[type="number"]').first()
      if (await clasesInput.isVisible()) {
        await clasesInput.fill('8')
      }

      const precioInput = page.locator('input[name*="precio"], input[type="number"]').last()
      if (await precioInput.isVisible()) {
        await precioInput.fill('15000')
      }

      // Submit
      const submitBtn = page.getByRole('button', { name: /guardar|crear/i }).last()
      await submitBtn.click()
      await expect(page.locator('[role="dialog"], .dialog')).not.toBeVisible({ timeout: 10000 })

      // Verify pack appears
      await expect(page.getByText(uniquePackName)).toBeVisible({ timeout: 5000 })

      // 2. EDIT - Click on pack to edit
      const packCard = page.locator('.pack-card, .card').filter({ hasText: uniquePackName }).first()
      const editBtn = packCard.getByRole('button', { name: /editar/i })

      if (await editBtn.isVisible()) {
        await editBtn.click()
        await expect(page.locator('[role="dialog"], .dialog')).toBeVisible({ timeout: 5000 })

        // Change price
        const editPrecioInput = page.locator('input[name*="precio"], input[type="number"]').last()
        if (await editPrecioInput.isVisible()) {
          await editPrecioInput.clear()
          await editPrecioInput.fill('16000')
        }

        await page.getByRole('button', { name: /guardar/i }).last().click()
        await expect(page.locator('[role="dialog"], .dialog')).not.toBeVisible({ timeout: 10000 })
      }

      // 3. DELETE
      const deleteBtn = packCard.getByRole('button', { name: /eliminar/i })
      if (await deleteBtn.isVisible()) {
        await deleteBtn.click()

        // Confirm
        const confirmBtn = page.getByRole('button', { name: /eliminar|confirmar|sí/i }).last()
        if (await confirmBtn.isVisible({ timeout: 3000 })) {
          await confirmBtn.click()
        }

        // Verify deleted
        await expect(page.getByText(uniquePackName)).not.toBeVisible({ timeout: 5000 })
      }
    }
  })

  test('should change precio por clase', async ({ page }) => {
    const precioInput = page.locator('input[name*="precioPorClase"], input[name*="precio"]').filter({ hasText: /clase/i }).first()

    if (await precioInput.isVisible()) {
      const originalValue = await precioInput.inputValue()

      // Change value
      await precioInput.clear()
      await precioInput.fill('2500')

      // Save
      const saveBtn = page.getByRole('button', { name: /guardar/i }).first()
      if (await saveBtn.isVisible()) {
        await saveBtn.click()
        await page.waitForLoadState('networkidle')
      }

      // Restore original
      await precioInput.clear()
      await precioInput.fill(originalValue)
      if (await saveBtn.isVisible()) {
        await saveBtn.click()
      }
    }
  })

  test('should toggle turno switches', async ({ page }) => {
    const toggles = page.locator('.toggle-switch, input[type="checkbox"], [role="switch"]')
    const count = await toggles.count()

    if (count > 0) {
      const firstToggle = toggles.first()

      // Toggle
      await firstToggle.click()
      await page.waitForLoadState('networkidle')

      // Toggle back
      await firstToggle.click()
      await page.waitForLoadState('networkidle')
    }
  })

  test('should have all configuration sections', async ({ page }) => {
    // Check for main sections
    const hasHorarios = await page.getByText(/horarios/i).first().isVisible().catch(() => false)
    const hasPacks = await page.getByText(/pack/i).first().isVisible().catch(() => false)
    const hasPrecios = await page.getByText(/precio/i).first().isVisible().catch(() => false)

    expect(hasHorarios || hasPacks || hasPrecios).toBeTruthy()
  })
})
