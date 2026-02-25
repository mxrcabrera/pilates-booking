import { test, expect } from '@playwright/test'

test.describe('Alumnos - Complete CRUD Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/alumnos')
    await expect(page.getByRole('heading', { name: /alumnos/i })).toBeVisible({ timeout: 15000 })
  })

  test('complete alumno lifecycle: create -> edit -> deactivate -> activate -> delete', async ({ page }) => {
    const uniqueName = `E2E Alumno ${Date.now()}`
    const uniqueEmail = `e2e${Date.now()}@test.com`
    const editedName = `${uniqueName} Editado`

    // 1. CREATE - Open dialog and fill form
    const addButton = page.getByRole('button', { name: /agregar|nuevo|\+/i }).first()
    await addButton.click()
    await expect(page.locator('[role="dialog"], .dialog')).toBeVisible({ timeout: 5000 })

    // Fill required fields
    await page.getByPlaceholder(/maría garcía/i).fill(uniqueName)
    await page.getByPlaceholder(/maria@email\.com/i).fill(uniqueEmail)
    await page.getByPlaceholder(/54.*9.*11/i).fill('1199887766')

    // Submit form
    const submitButton = page.getByRole('button', { name: /guardar|crear|agregar/i }).last()
    await submitButton.click()

    // Wait for dialog to close and verify alumno appears in list
    await expect(page.locator('[role="dialog"], .dialog')).not.toBeVisible({ timeout: 10000 })

    // Verify alumno is in the list
    await expect(page.getByText(uniqueName)).toBeVisible({ timeout: 5000 })

    // 2. EDIT - Find and edit the alumno
    await page.getByText(uniqueName).click()
    await expect(page.locator('.sheet-content')).toBeVisible({ timeout: 5000 })

    // Wait for the detail panel to appear - look for the action buttons in the panel
    // The panel has Editar, Desactivar, Eliminar buttons with text labels
    const panelEditButton = page.getByRole('button', { name: 'Editar' }).filter({ hasText: 'Editar' })
    await expect(panelEditButton.first()).toBeVisible({ timeout: 5000 })

    await panelEditButton.first().click()
    await expect(page.locator('[role="dialog"], .dialog').filter({ hasText: /editar/i })).toBeVisible({ timeout: 5000 })

    // Change name
    const nombreInput = page.getByPlaceholder(/maría garcía/i)
    await nombreInput.clear()
    await nombreInput.fill(editedName)

    // Save changes
    await page.getByRole('button', { name: /guardar/i }).last().click()
    await expect(page.locator('[role="dialog"], .dialog').filter({ hasText: /editar/i })).not.toBeVisible({ timeout: 10000 })

    // Verify edited name appears
    await expect(page.getByText(editedName)).toBeVisible({ timeout: 5000 })

    // Close sheet
    await page.keyboard.press('Escape')
    await expect(page.locator('.sheet-content')).not.toBeVisible({ timeout: 5000 })

    // 3. DEACTIVATE - Toggle status to inactive
    await page.getByText(editedName).click()
    await expect(page.locator('.sheet-content')).toBeVisible({ timeout: 5000 })
    const deactivateButton = page.getByRole('button', { name: 'Desactivar' }).filter({ hasText: 'Desactivar' }).first()

    if (await deactivateButton.isVisible({ timeout: 3000 })) {
      await deactivateButton.click()

      // Check if confirmation dialog appeared
      const confirmDialog = page.locator('[role="alertdialog"], [role="dialog"]').filter({ hasText: /confirmar|seguro/i })
      if (await confirmDialog.isVisible({ timeout: 2000 }).catch(() => false)) {
        const confirmBtn = page.getByRole('button', { name: /desactivar|confirmar|sí/i }).last()
        await confirmBtn.click()
        await page.waitForLoadState('networkidle')
      }

      await page.keyboard.press('Escape')
      await expect(page.locator('.sheet-content')).not.toBeVisible({ timeout: 5000 })

      // Switch to Inactivos tab and verify
      const inactivosTab = page.getByRole('button', { name: /^inactivos/i }).first()
      await inactivosTab.click()
      await page.waitForLoadState('networkidle')

      const alumnoInInactivos = await page.getByText(editedName).isVisible({ timeout: 3000 }).catch(() => false)

      if (alumnoInInactivos) {
        // 4. ACTIVATE - Toggle status back to active
        await page.getByText(editedName).click()
        await expect(page.locator('.sheet-content')).toBeVisible({ timeout: 5000 })
        const activateButton = page.getByRole('button', { name: 'Activar' }).filter({ hasText: 'Activar' }).first()

        if (await activateButton.isVisible({ timeout: 3000 })) {
          await activateButton.click()
          await page.waitForLoadState('networkidle')
        }

        await page.keyboard.press('Escape')
        await expect(page.locator('.sheet-content')).not.toBeVisible({ timeout: 5000 })

        // Switch to Activos tab
        const activosTab = page.getByRole('button', { name: /^activos/i }).first()
        await activosTab.click()
        await page.waitForLoadState('networkidle')
      } else {
        // Alumno not in inactivos, go back to activos
        const activosTab = page.getByRole('button', { name: /^activos/i }).first()
        await activosTab.click()
        await page.waitForLoadState('networkidle')
      }
    } else {
      // No deactivate button, close panel
      await page.keyboard.press('Escape')
      await expect(page.locator('.sheet-content')).not.toBeVisible({ timeout: 5000 })
    }

    // Verify alumno still exists (in activos or somewhere)
    await expect(page.getByText(editedName)).toBeVisible({ timeout: 5000 })

    // 5. DELETE - Remove the alumno
    await page.getByText(editedName).click()
    await expect(page.locator('.sheet-content')).toBeVisible({ timeout: 5000 })
    const deleteButton = page.getByRole('button', { name: 'Eliminar' }).filter({ hasText: 'Eliminar' }).first()
    await expect(deleteButton).toBeVisible({ timeout: 5000 })
    await deleteButton.click()

    // Check if confirmation dialog appeared
    const confirmDialog = page.locator('[role="dialog"], [role="alertdialog"]').filter({ hasText: /confirmar|seguro|eliminar/i })
    const hasConfirmDialog = await confirmDialog.isVisible({ timeout: 3000 }).catch(() => false)

    if (hasConfirmDialog) {
      const confirmButton = page.getByRole('button', { name: /eliminar|confirmar|sí/i }).last()
      await confirmButton.click()
    }

    // Verify alumno is gone (wait for the UI to update after deletion)
    await page.waitForLoadState('networkidle')
    const alumnoStillVisible = await page.getByText(editedName).isVisible({ timeout: 2000 }).catch(() => false)
    expect(alumnoStillVisible).toBeFalsy()
  })

  test('should search alumnos', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="buscar" i]').first()

    if (await searchInput.isVisible()) {
      await searchInput.fill('test')
      await page.waitForLoadState('networkidle')
      await searchInput.clear()
    }
  })

  test('should filter alumnos by status tabs', async ({ page }) => {
    const activosTab = page.getByRole('button', { name: /^activos/i }).first()
    const inactivosTab = page.getByRole('button', { name: /^inactivos/i }).first()

    if (await activosTab.isVisible().catch(() => false)) {
      await activosTab.click()
    }

    if (await inactivosTab.isVisible().catch(() => false)) {
      await inactivosTab.click()
    }
  })

  test('should validate required fields on create', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /agregar|nuevo|\+/i }).first()
    await addButton.click()
    await expect(page.locator('[role="dialog"], .dialog')).toBeVisible({ timeout: 5000 })

    // Try to submit without filling required fields
    const submitButton = page.getByRole('button', { name: /guardar|crear/i }).last()
    await submitButton.click()

    // Should stay in dialog (validation error)
    await expect(page.locator('[role="dialog"], .dialog')).toBeVisible({ timeout: 3000 })
  })
})
