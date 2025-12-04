import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import bcrypt from 'bcrypt'
import { prisma } from './prisma'

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'tu-secreto-super-seguro-cambialo-en-produccion'
)

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hashedPassword: string) {
  return bcrypt.compare(password, hashedPassword)
}

export async function createToken(userId: string) {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
}

export async function verifyToken(token: string) {
  try {
    const verified = await jwtVerify(token, secret)
    return verified.payload as { userId: string }
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

export async function getAuthCookie() {
  const cookieStore = await cookies()
  return cookieStore.get('auth-token')?.value
}

export async function removeAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete('auth-token')
}

// Buscar sesión de NextAuth directamente en la base de datos (más rápido que auth())
async function getSessionFromDB(sessionToken: string) {
  try {
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      select: { userId: true, expires: true }
    })
    if (session && session.expires > new Date()) {
      return session.userId
    }
    return null
  } catch {
    return null
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies()

  // 1. Primero intentar con JWT personalizado (más rápido)
  const customToken = cookieStore.get('auth-token')?.value
  if (customToken) {
    const payload = await verifyToken(customToken)
    if (payload) return payload.userId
  }

  // 2. Buscar session token de NextAuth directamente en DB
  const nextAuthToken = cookieStore.get('authjs.session-token')?.value
    || cookieStore.get('__Secure-authjs.session-token')?.value

  if (nextAuthToken) {
    const userId = await getSessionFromDB(nextAuthToken)
    if (userId) return userId
  }

  return null
}