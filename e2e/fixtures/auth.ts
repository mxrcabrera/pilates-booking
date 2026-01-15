import { test as base, expect } from '@playwright/test'

// Extend base test with authenticated state
export const test = base.extend<{ authenticatedPage: void }>({
  authenticatedPage: async ({ page }, use) => {
    // Login before each test
    await page.goto('/login')

    // Wait for form to be ready
    await expect(page.getByLabel(/email/i)).toBeVisible({ timeout: 10000 })

    await page.getByLabel(/email/i).fill('demo@pilates.com')
    await page.getByLabel(/contraseña/i).fill('demo123')
    await page.getByRole('button', { name: /iniciar sesión/i }).click()

    // Wait for navigation to complete - either dashboard or any other authenticated route
    await expect(page).toHaveURL(/dashboard|alumnos|calendario|pagos|configuracion|reportes/, { timeout: 20000 })

    await use()
  }
})

export { expect }
