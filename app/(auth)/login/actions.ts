'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { hashPassword, verifyPassword, createToken, setAuthCookie, removeAuthCookie } from '@/lib/auth'
import { signIn } from '@/lib/auth'
import { getTrialEndDate } from '@/lib/plans'
import { rateLimit } from '@/lib/rate-limit'

const LOGIN_LIMIT = 5
const SIGNUP_LIMIT = 3
const WINDOW_MS = 60 * 1000

async function getIP(): Promise<string> {
  const h = await headers()
  return h.get('x-forwarded-for')?.split(',')[0].trim() || 'localhost'
}

function checkRateLimit(key: string, limit: number) {
  const { success, resetIn } = rateLimit(key, limit, WINDOW_MS)
  if (!success) {
    const retryAfter = Math.ceil(resetIn / 1000)
    throw new Error(`Demasiados intentos. Intenta de nuevo en ${retryAfter} segundos.`)
  }
}

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const ip = await getIP()
  checkRateLimit(`login:${ip}`, LOGIN_LIMIT)

  let redirectTo = '/dashboard'

  try {
    // Buscar usuario por email
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user || !user.password) {
      throw new Error('Credenciales inválidas')
    }

    // Verificar password
    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      throw new Error('Credenciales inválidas')
    }

    // Crear token con rol y guardar en cookie
    const token = await createToken(user.id, user.role)
    await setAuthCookie(token)

    // Redirigir según rol
    redirectTo = user.role === 'ALUMNO' ? '/alumno' : '/dashboard'

    revalidatePath('/', 'layout')
  } catch (error) {
    if (error instanceof Error && error.message === 'Credenciales inválidas') {
      throw error
    }
    throw new Error('Error al iniciar sesión')
  }

  redirect(redirectTo)
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const nombre = formData.get('nombre') as string
  const rol = formData.get('rol') as string

  const ip = await getIP()
  checkRateLimit(`signup:${ip}`, SIGNUP_LIMIT)

  let redirectTo = '/dashboard'

  try {
    // Validar rol
    if (!rol || (rol !== 'profesor' && rol !== 'alumno')) {
      throw new Error('Seleccioná si sos profesor/a o alumno/a')
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
      // Check if user has a Google account
      const hasGoogleAccount = existente.accounts.some(acc => acc.provider === 'google')
      if (hasGoogleAccount) {
        throw new Error('Este email ya está registrado con Google. Por favor iniciá sesión con Google.')
      }
      throw new Error('El email ya está registrado')
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
        plan: 'FREE',
        trialEndsAt: getTrialEndDate(),
        planStartedAt: new Date(),
      }
    })

    // Crear token con rol y guardar en cookie
    const token = await createToken(user.id, userRole)
    await setAuthCookie(token)

    // Redirigir según rol
    redirectTo = userRole === 'ALUMNO' ? '/alumno' : '/dashboard'

    revalidatePath('/', 'layout')
  } catch (error) {
    if (error instanceof Error && (
      error.message.includes('ya está registrado') ||
      error.message.includes('Google') ||
      error.message.includes('Seleccioná')
    )) {
      throw error
    }
    throw new Error('Error al crear la cuenta')
  }

  redirect(redirectTo)
}

export async function logout() {
  await removeAuthCookie()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function loginWithGoogle() {
  await signIn('google', { redirectTo: '/dashboard' })
}