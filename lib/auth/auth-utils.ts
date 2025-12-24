import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import bcrypt from 'bcrypt'
import { auth } from './auth'
import { prisma } from '@/lib/prisma'
import type { EstudioRol } from '@prisma/client'

// Tipos para contexto de estudio
export interface EstudioContext {
  estudioId: string
  estudioNombre: string
  estudioSlug: string
  rol: EstudioRol
  plan: string
  trialEndsAt: Date | null
}

export interface UserContext {
  userId: string
  userRole: string // PROFESOR | ALUMNO
  estudio: EstudioContext | null
}

// Permisos por rol
const PERMISSIONS = {
  OWNER: [
    'view:all', 'create:alumnos', 'edit:alumnos', 'delete:alumnos',
    'create:clases', 'edit:clases', 'edit:clases:all', 'delete:clases',
    'create:pagos', 'edit:pagos', 'delete:pagos',
    'edit:configuracion', 'manage:equipo', 'view:billing'
  ],
  ADMIN: [
    'view:all', 'create:alumnos', 'edit:alumnos', 'delete:alumnos',
    'create:clases', 'edit:clases', 'edit:clases:all', 'delete:clases',
    'create:pagos', 'edit:pagos', 'delete:pagos',
    'edit:configuracion', 'manage:equipo'
  ],
  INSTRUCTOR: [
    'view:all', 'create:alumnos', 'edit:alumnos',
    'create:clases', 'edit:clases', // Solo sus propias clases
  ],
  VIEWER: [
    'view:all'
  ]
} as const

type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS][number]

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

/**
 * Obtiene el contexto completo del usuario, incluyendo su estudio y rol
 */
export async function getUserContext(): Promise<UserContext | null> {
  const userWithRole = await getCurrentUserWithRole()
  if (!userWithRole) return null

  // Buscar el estudio del usuario
  const miembro = await prisma.estudioMiembro.findFirst({
    where: { userId: userWithRole.userId },
    include: {
      estudio: {
        select: {
          id: true,
          nombre: true,
          slug: true,
          plan: true,
          trialEndsAt: true
        }
      }
    }
  })

  return {
    userId: userWithRole.userId,
    userRole: userWithRole.role,
    estudio: miembro ? {
      estudioId: miembro.estudio.id,
      estudioNombre: miembro.estudio.nombre,
      estudioSlug: miembro.estudio.slug,
      rol: miembro.rol,
      plan: miembro.estudio.plan,
      trialEndsAt: miembro.estudio.trialEndsAt
    } : null
  }
}

/**
 * Verifica si el usuario tiene un permiso específico
 */
export function hasPermission(rol: EstudioRol, permission: Permission): boolean {
  const permisos = PERMISSIONS[rol]
  return permisos.includes(permission as never)
}

/**
 * Verifica si el usuario puede editar una clase específica
 * INSTRUCTOR solo puede editar sus propias clases
 */
export function canEditClase(rol: EstudioRol, claseProfesorId: string, userId: string): boolean {
  if (rol === 'OWNER' || rol === 'ADMIN') return true
  if (rol === 'INSTRUCTOR') return claseProfesorId === userId
  return false
}

/**
 * Helper para obtener el estudioId del usuario actual
 * Útil para filtrar queries
 */
export async function getCurrentEstudioId(): Promise<string | null> {
  const context = await getUserContext()
  return context?.estudio?.estudioId || null
}