import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import bcrypt from 'bcrypt'
import { auth } from './auth'

// JWT_SECRET es requerido - no usar fallback inseguro
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}
const secret = new TextEncoder().encode(process.env.JWT_SECRET)

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hashedPassword: string) {
  return bcrypt.compare(password, hashedPassword)
}

export async function createToken(userId: string, role: string = 'PROFESOR') {
  return new SignJWT({ userId, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
}

export async function verifyToken(token: string) {
  try {
    const verified = await jwtVerify(token, secret)
    return verified.payload as { userId: string; role?: string }
  } catch {
    return null
  }
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 días
    path: '/',
  })
}

export async function removeAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete('auth-token')
}

export async function getCurrentUser() {
  const result = await getCurrentUserWithRole()
  return result?.userId || null
}

export async function getCurrentUserWithRole(): Promise<{ userId: string; role: string } | null> {
  const cookieStore = await cookies()

  // 1. Primero intentar con JWT personalizado (credentials login)
  const customToken = cookieStore.get('auth-token')?.value
  if (customToken) {
    const payload = await verifyToken(customToken)
    if (payload) {
      return { userId: payload.userId, role: payload.role || 'PROFESOR' }
    }
  }

  // 2. Usar NextAuth auth() para JWT sessions (Google OAuth)
  try {
    const session = await auth()
    if (session?.user?.id) {
      return {
        userId: session.user.id,
        role: (session.user as { role?: string }).role || 'PROFESOR'
      }
    }
  } catch {
    // Ignore errors
  }

  return null
}