import '@testing-library/jest-dom'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

// Mock environment variables for tests
process.env.AUTH_SECRET = 'test-secret-at-least-32-characters-long'
process.env.JWT_SECRET = 'test-jwt-secret-at-least-32-characters'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
