import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, verifyPassword, createToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import { rateLimit, getClientIP, rateLimitExceeded } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'
import { RATE_LIMIT_WINDOW_MS } from '@/lib/constants'

export const runtime = 'nodejs'

const LOGIN_LIMIT = 5
const SIGNUP_LIMIT = 3

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const ip = getClientIP(request)
    const isSignup = body.action === 'signup'

    // Rate limiting
    const rateLimitKey = isSignup ? `signup:${ip}` : `login:${ip}`
    const limit = isSignup ? SIGNUP_LIMIT : LOGIN_LIMIT
    const { success, resetIn } = rateLimit(rateLimitKey, limit, RATE_LIMIT_WINDOW_MS)

    if (!success) {
      const { error, status, headers } = rateLimitExceeded(resetIn)
      return NextResponse.json({ error }, { status, headers })
    }
    const { email, password, action, nombre, rol } = body

    // Validaciones básicas
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      )
    }

    if (action === 'signup') {
      if (!rol || (rol !== 'profesor' && rol !== 'alumno')) {
        return NextResponse.json(
          { error: 'Seleccioná si sos profesor/a o alumno/a' },
          { status: 400 }
        )
      }

      if (!nombre || typeof nombre !== 'string' || nombre.trim().length < 2) {
        return NextResponse.json(
          { error: 'El nombre debe tener al menos 2 caracteres' },
          { status: 400 }
        )
      }
      // Verificar si ya existe
      const existente = await prisma.user.findUnique({
        where: { email },
        include: {
          accounts: {
            select: {
              provider: true
            }
          }
        }
      })

      if (existente) {
        const hasGoogleAccount = existente.accounts.some(acc => acc.provider === 'google')
        if (hasGoogleAccount) {
          return NextResponse.json(
            { error: 'Este email ya está registrado con Google. Por favor iniciá sesión con Google.' },
            { status: 400 }
          )
        }
        return NextResponse.json(
          { error: 'El email ya está registrado' },
          { status: 400 }
        )
      }

      // Hashear password y crear usuario
      const hashedPassword = await hashPassword(password)
      const userRole = rol === 'alumno' ? 'ALUMNO' : 'PROFESOR'

      const user = await prisma.user.create({
        data: {
          email,
          nombre,
          password: hashedPassword,
          role: userRole,
        }
      })

      // Crear token con rol y guardar en cookie
      const token = await createToken(user.id, userRole)
      const cookieStore = await cookies()
      cookieStore.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24,
        path: '/',
      })

      // Redirigir según rol
      const redirectTo = userRole === 'ALUMNO' ? '/alumno' : '/dashboard'
      return NextResponse.json({ success: true, redirectTo })
    } else {
      // Login
      const user = await prisma.user.findUnique({
        where: { email }
      })

      if (!user || !user.password) {
        return NextResponse.json(
          { error: 'Credenciales inválidas' },
          { status: 401 }
        )
      }

      const isValid = await verifyPassword(password, user.password)
      if (!isValid) {
        return NextResponse.json(
          { error: 'Credenciales inválidas' },
          { status: 401 }
        )
      }

      // Crear token con rol y guardar en cookie
      const token = await createToken(user.id, user.role)
      const cookieStore = await cookies()
      cookieStore.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24,
        path: '/',
      })

      // Redirigir según rol
      const redirectTo = user.role === 'ALUMNO' ? '/alumno' : '/dashboard'
      return NextResponse.json({ success: true, redirectTo })
    }
  } catch (error) {
    logger.error('Auth login error', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
