/**
 * @jest-environment node
 */
import { POST } from '@/app/api/auth/login/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, hashPassword, createToken } from '@/lib/auth'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}))

jest.mock('@/lib/auth', () => ({
  hashPassword: jest.fn(),
  verifyPassword: jest.fn(),
  createToken: jest.fn(),
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    set: jest.fn(),
  })),
}))

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn(() => ({ success: true, remaining: 5, resetIn: 60000 })),
  getClientIP: jest.fn(() => '127.0.0.1'),
  rateLimitExceeded: jest.fn(),
}))

jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}))

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('validation', () => {
    it('rejects missing email', async () => {
      const res = await POST(makeRequest({ password: 'testtest123' }))
      const data = await res.json()
      expect(res.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('rejects invalid email', async () => {
      const res = await POST(makeRequest({ email: 'not-an-email', password: 'testtest123' }))
      const data = await res.json()
      expect(res.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('rejects short password', async () => {
      const res = await POST(makeRequest({ email: 'test@test.com', password: '123' }))
      const data = await res.json()
      expect(res.status).toBe(400)
      expect(data.error).toBeDefined()
    })
  })

  describe('login', () => {
    it('returns 401 for non-existent user', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const res = await POST(makeRequest({ email: 'no@user.com', password: 'password123' }))
      const data = await res.json()
      expect(res.status).toBe(401)
      expect(data.error).toBeDefined()
    })

    it('returns 401 for wrong password', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1', email: 'test@test.com', password: 'hashed', role: 'PROFESOR',
      })
      ;(verifyPassword as jest.Mock).mockResolvedValue(false)

      const res = await POST(makeRequest({ email: 'test@test.com', password: 'wrongpass123' }))
      const data = await res.json()
      expect(res.status).toBe(401)
      expect(data.error).toBeDefined()
    })

    it('returns success with redirectTo for valid login', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1', email: 'test@test.com', password: 'hashed', role: 'PROFESOR',
      })
      ;(verifyPassword as jest.Mock).mockResolvedValue(true)
      ;(createToken as jest.Mock).mockResolvedValue('fake-token')

      const res = await POST(makeRequest({ email: 'test@test.com', password: 'password123' }))
      const data = await res.json()
      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.redirectTo).toBe('/dashboard')
    })

    it('redirects ALUMNO to /alumno', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1', email: 'alumno@test.com', password: 'hashed', role: 'ALUMNO',
      })
      ;(verifyPassword as jest.Mock).mockResolvedValue(true)
      ;(createToken as jest.Mock).mockResolvedValue('fake-token')

      const res = await POST(makeRequest({ email: 'alumno@test.com', password: 'password123' }))
      const data = await res.json()
      expect(data.redirectTo).toBe('/alumno')
    })
  })

  describe('signup', () => {
    it('rejects signup without rol', async () => {
      const res = await POST(makeRequest({
        action: 'signup', email: 'new@test.com', password: 'password123', nombre: 'Test',
      }))
      const data = await res.json()
      expect(res.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('rejects signup with short nombre', async () => {
      const res = await POST(makeRequest({
        action: 'signup', email: 'new@test.com', password: 'password123', nombre: 'A', rol: 'profesor',
      }))
      const data = await res.json()
      expect(res.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('rejects signup for existing email', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1', email: 'existing@test.com', accounts: [],
      })

      const res = await POST(makeRequest({
        action: 'signup', email: 'existing@test.com', password: 'password123', nombre: 'Test', rol: 'profesor',
      }))
      const data = await res.json()
      expect(res.status).toBe(400)
      expect(data.error).toContain('registrado')
    })

    it('creates user and returns success', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
      ;(hashPassword as jest.Mock).mockResolvedValue('hashed-pw')
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'new-id', email: 'new@test.com', role: 'PROFESOR',
      })
      ;(createToken as jest.Mock).mockResolvedValue('new-token')

      const res = await POST(makeRequest({
        action: 'signup', email: 'new@test.com', password: 'password123', nombre: 'New User', rol: 'profesor',
      }))
      const data = await res.json()
      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.redirectTo).toBe('/dashboard')
    })
  })
})
