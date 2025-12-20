import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, verifyPassword, createToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import { getErrorMessage } from '@/lib/utils'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, action, nombre } = body

    if (action === 'signup') {
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

      const user = await prisma.user.create({
        data: {
          email,
          nombre,
          password: hashedPassword,
        }
      })

      // Crear token y guardar en cookie
      const token = await createToken(user.id)
      const cookieStore = await cookies()
      cookieStore.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      })

      return NextResponse.json({ success: true, redirectTo: '/dashboard' })
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

      // Crear token y guardar en cookie
      const token = await createToken(user.id)
      const cookieStore = await cookies()
      cookieStore.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      })

      return NextResponse.json({ success: true, redirectTo: '/dashboard' })
    }
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
