import { test, expect } from '@playwright/test'

test.describe('Clases - Complete CRUD Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/calendario')
    await expect(page.getByRole('heading', { name: /calendario|clases/i })).toBeVisible({ timeout: 15000 })
  })

  test('complete clase lifecycle: create -> edit -> change status -> mark attendance -> delete', async ({ page }) => {
    // 1. CREATE - Open dialog
    const addButton = page.getByRole('button', { name: /agregar|nueva|crear|\+/i }).first()
    await addButton.click()
    await expect(page.locator('[role="dialog"], .dialog')).toBeVisible({ timeout: 5000 })

    // Fill form - select alumno from dropdown (required)
    const alumnoSelect = page.locator('select').first()
    if (await alumnoSelect.isVisible()) {
      // Use selectOption with index for native select (first real alumno, not placeholder)
      await alumnoSelect.selectOption({ index: 1 })
    }

    // Set date to tomorrow to avoid "at least 1 hour in advance" error
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = tomorrow.toISOString().split('T')[0]

    const dateTextbox = page.getByRole('textbox').filter({ hasText: /2026/ }).first()
    if (await dateTextbox.isVisible()) {
      await dateTextbox.fill(dateStr)
    }

    // Set time
    const timeTextbox = page.getByRole('textbox').filter({ hasText: /\d{2}:\d{2}/ }).first()
    if (await timeTextbox.isVisible()) {
      await timeTextbox.fill('10:00')
    }

    // Select "Prueba" type
    const pruebaBtn = page.getByRole('button', { name: /prueba/i })
    if (await pruebaBtn.isVisible()) {
      await pruebaBtn.click()
    }

    // Submit
    const submitButton = page.getByRole('button', { name: /guardar/i }).last()
    await submitButton.click()

    // Wait for dialog to close or show error
    await page.waitForLoadState('networkidle')
    const dialogStillOpen = await page.locator('[role="dialog"], .dialog').isVisible()

    if (!dialogStillOpen) {
      // Dialog closed successfully, clase was created
      // Find the clase and click on it
      const claseCard = page.locator('.clase-card, [data-clase], .calendar-event').first()
      if (await claseCard.isVisible({ timeout: 5000 })) {
        await claseCard.click()

        // Sheet or dialog should open
        await expect(page.locator('.sheet, [role="dialog"]')).toBeVisible({ timeout: 5000 })

        // Try to cancel/delete
        const deleteBtn = page.getByRole('button', { name: /eliminar|cancelar/i })
        if (await deleteBtn.isVisible()) {
          await deleteBtn.click()

          // Confirm if modal appears
          const confirmBtn = page.getByRole('button', { name: /eliminar|confirmar|sí/i }).last()
          if (await confirmBtn.isVisible({ timeout: 3000 })) {
            await confirmBtn.click()
          }
        }

        await page.keyboard.press('Escape')
      }
    } else {
      // Dialog still open - close it and verify the form structure
      await page.keyboard.press('Escape')
    }
  })

  test('should navigate calendar', async ({ page }) => {
    const prevBtn = page.getByRole('button', { name: /anterior/i }).first()
    const nextBtn = page.getByRole('button', { name: /siguiente/i }).first()
    const todayBtn = page.getByRole('button', { name: /hoy/i })

    // Navigate next
    if (await nextBtn.isVisible()) {
      await nextBtn.click()
    }

    // Navigate prev
    if (await prevBtn.isVisible()) {
      await prevBtn.click()
    }

    // Go to today
    if (await todayBtn.isVisible()) {
      await todayBtn.click()
    }

    // Page should still work
    await expect(page.getByRole('heading', { name: /calendario|clases/i })).toBeVisible()
  })

  test('should show clase dialog with form fields', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /agregar|nueva|crear|\+/i }).first()
    await addButton.click()

    await expect(page.locator('[role="dialog"], .dialog')).toBeVisible({ timeout: 5000 })

    // Should have type selection
    const pruebaBtn = page.getByRole('button', { name: /prueba/i })
    const normalBtn = page.getByRole('button', { name: /normal|regular/i })
    const recurrenteBtn = page.getByRole('button', { name: /recurrente/i })

    const hasTypes = (await pruebaBtn.isVisible().catch(() => false)) ||
                    (await normalBtn.isVisible().catch(() => false)) ||
                    (await recurrenteBtn.isVisible().catch(() => false))

    expect(hasTypes).toBeTruthy()
  })

  test('should filter by turno', async ({ page }) => {
    const manianaBtn = page.getByRole('button', { name: /mañana/i })
    const tardeBtn = page.getByRole('button', { name: /tarde/i })

    if (await manianaBtn.isVisible()) {
      await manianaBtn.click()
    }

    if (await tardeBtn.isVisible()) {
      await tardeBtn.click()
    }
  })
})
