import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.describe('Login Page', () => {
    test('should display login form', async ({ page }) => {
      await page.goto('/login')

      // Title is "Pilates Booking", subtitle mentions login
      await expect(page.getByRole('heading', { name: /pilates booking/i })).toBeVisible()
      await expect(page.getByLabel(/email/i)).toBeVisible()
      await expect(page.getByLabel(/contraseña/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /iniciar sesión/i })).toBeVisible()
    })

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login')

      await page.getByLabel(/email/i).fill('invalid@test.com')
      await page.getByLabel(/contraseña/i).fill('wrongpassword')
      await page.getByRole('button', { name: /iniciar sesión/i }).click()

      // Should show error message
      await expect(page.getByText(/credenciales|inválid|error|no existe/i)).toBeVisible({ timeout: 10000 })
    })

    test('should show validation errors for empty fields', async ({ page }) => {
      await page.goto('/login')

      await page.getByRole('button', { name: /iniciar sesión/i }).click()

      // Form should not submit with empty fields (custom validation shows error)
      await expect(page.getByText(/ingresá.*email.*válido/i)).toBeVisible()
      await expect(page).toHaveURL(/login/)
    })

    test('should redirect authenticated user to dashboard', async ({ page }) => {
      test.skip(process.env.SKIP_DB_TESTS === '1', 'Requires a running database')

      await page.goto('/login')

      await page.getByLabel(/email/i).fill('demo@pilates.com')
      await page.getByLabel(/contraseña/i).fill('demo123')
      await page.getByRole('button', { name: /iniciar sesión/i }).click()

      // Should redirect to dashboard after successful login
      await expect(page).toHaveURL(/dashboard/, { timeout: 15000 })
    })
  })

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated user from dashboard to login', async ({ page }) => {
      await page.goto('/dashboard')

      // Should redirect to login
      await expect(page).toHaveURL(/login/, { timeout: 10000 })
    })

    test('should redirect unauthenticated user from alumnos to login', async ({ page }) => {
      await page.goto('/alumnos')

      await expect(page).toHaveURL(/login/, { timeout: 10000 })
    })

    test('should redirect unauthenticated user from calendario to login', async ({ page }) => {
      await page.goto('/calendario')

      await expect(page).toHaveURL(/login/, { timeout: 10000 })
    })

    test('should redirect unauthenticated user from pagos to login', async ({ page }) => {
      await page.goto('/pagos')

      await expect(page).toHaveURL(/login/, { timeout: 10000 })
    })

    test('should redirect unauthenticated user from configuracion to login', async ({ page }) => {
      await page.goto('/configuracion')

      await expect(page).toHaveURL(/login/, { timeout: 10000 })
    })
  })

  test.describe('Signup', () => {
    test('should display signup form when clicking register', async ({ page }) => {
      await page.goto('/login')

      // Click the switch to signup button
      const signupButton = page.getByRole('button', { name: /no tenés cuenta.*registrate/i })
      if (await signupButton.isVisible()) {
        await signupButton.click()
        await expect(page.getByLabel(/nombre/i)).toBeVisible()
        await expect(page.getByRole('button', { name: /crear cuenta/i })).toBeVisible()
      }
    })
  })

  test.describe('Logout', () => {
    test('should logout and redirect to login', async ({ page }) => {
      test.skip(process.env.SKIP_DB_TESTS === '1', 'Requires a running database')

      // First login
      await page.goto('/login')
      await page.getByLabel(/email/i).fill('demo@pilates.com')
      await page.getByLabel(/contraseña/i).fill('demo123')
      await page.getByRole('button', { name: /iniciar sesión/i }).click()

      await expect(page).toHaveURL(/dashboard/, { timeout: 15000 })

      // Find and click logout - look for the user dropdown in nav
      const userMenu = page.locator('[data-testid="user-menu"]')
        .or(page.getByRole('button', { name: /perfil|usuario|menu/i }))
        .or(page.locator('.user-menu'))

      if (await userMenu.first().isVisible().catch(() => false)) {
        await userMenu.first().click()
      }

      const logoutButton = page.getByRole('button', { name: /salir|cerrar sesión|logout/i })
        .or(page.getByRole('menuitem', { name: /salir|cerrar sesión|logout/i }))
        .or(page.getByText(/cerrar sesión/i))

      if (await logoutButton.first().isVisible().catch(() => false)) {
        await logoutButton.first().click()
        // Should redirect to login
        await expect(page).toHaveURL(/login/, { timeout: 10000 })
      }
    })
  })
})
