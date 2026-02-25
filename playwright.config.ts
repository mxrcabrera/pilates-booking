import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'

// Load .env.test for E2E tests
dotenv.config({ path: path.resolve(__dirname, '.env.test') })

const skipDb = process.env.SKIP_DB_TESTS === '1'

const projects = [
  {
    name: 'auth',
    testMatch: /auth\.spec\.ts/,
    use: { ...devices['Desktop Chrome'] },
  },
]

if (!skipDb) {
  projects.unshift({
    name: 'setup',
    testMatch: /global\.setup\.ts/,
  })
  projects.push({
    name: 'authenticated',
    testIgnore: [/auth\.spec\.ts/, /global\.setup\.ts/],
    use: {
      ...devices['Desktop Chrome'],
      storageState: 'e2e/.auth/user.json',
    },
    dependencies: ['setup'],
  })
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 4,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 15000,
  },
  projects,
  webServer: {
    command: 'npx dotenv -e .env.test -- npx next dev --turbopack -p 3001',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
