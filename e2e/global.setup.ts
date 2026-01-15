import { test as setup, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const authFile = 'e2e/.auth/user.json'

setup('authenticate', async ({ page }) => {
  // Ensure the .auth directory exists
  const authDir = path.dirname(authFile)
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true })
  }

  // Login as test user
  await page.goto('/login')

  // Wait for form to be ready
  await expect(page.getByLabel(/email/i)).toBeVisible({ timeout: 10000 })

  await page.getByLabel(/email/i).fill('demo@pilates.com')
  await page.getByLabel(/contraseña/i).fill('demo123')
  await page.getByRole('button', { name: /iniciar sesión/i }).click()

  // Wait for dashboard to load
  await expect(page).toHaveURL(/dashboard/, { timeout: 20000 })

  // Save storage state (includes cookies)
  await page.context().storageState({ path: authFile })
})
