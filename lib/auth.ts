import { SignJWT, jwtVerify, decodeJwt } from 'jose'
import { cookies } from 'next/headers'
import bcrypt from 'bcrypt'

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'tu-secreto-super-seguro-cambialo-en-produccion'
)

const authSecret = new TextEncoder().encode(
  process.env.AUTH_SECRET || ''
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

// Verificar token de NextAuth directamente (sin llamar a auth())
async function verifyNextAuthToken(token: string) {
  try {
    // NextAuth usa un formato de JWT específico con AUTH_SECRET
    const verified = await jwtVerify(token, authSecret, {
      algorithms: ['HS256'],
    })
    return verified.payload.sub || null
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

  // 2. Intentar con el session token de NextAuth (sin llamar auth())
  const nextAuthToken = cookieStore.get('authjs.session-token')?.value
    || cookieStore.get('__Secure-authjs.session-token')?.value

  if (nextAuthToken && authSecret.length > 0) {
    const userId = await verifyNextAuthToken(nextAuthToken)
    if (userId) return userId
  }

  // 3. Fallback: usar auth() de NextAuth (más lento)
  const { auth } = await import('./auth-new')
  const session = await auth()

  if (session?.user?.id) {
    return session.user.id
  }

  return null
}