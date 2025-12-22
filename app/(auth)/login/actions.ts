'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { hashPassword, verifyPassword, createToken, setAuthCookie, removeAuthCookie } from '@/lib/auth'
import { signIn } from '@/lib/auth'
import { getTrialEndDate } from '@/lib/plans'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

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

    // Crear token y guardar en cookie
    const token = await createToken(user.id)
    await setAuthCookie(token)

    revalidatePath('/', 'layout')
  } catch (error) {
    if (error instanceof Error && error.message === 'Credenciales inválidas') {
      throw error
    }
    throw new Error('Error al iniciar sesión')
  }

  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const nombre = formData.get('nombre') as string

  try {
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

    const user = await prisma.user.create({
      data: {
        email,
        nombre,
        password: hashedPassword,
        plan: 'FREE',
        trialEndsAt: getTrialEndDate(),
        planStartedAt: new Date(),
      }
    })

    // Crear token y guardar en cookie
    const token = await createToken(user.id)
    await setAuthCookie(token)

    revalidatePath('/', 'layout')
  } catch (error) {
    if (error instanceof Error && (
      error.message.includes('ya está registrado') ||
      error.message.includes('Google')
    )) {
      throw error
    }
    throw new Error('Error al crear la cuenta')
  }

  redirect('/dashboard')
}

export async function logout() {
  await removeAuthCookie()
  redirect('/login')
}

export async function loginWithGoogle() {
  await signIn('google', { redirectTo: '/dashboard' })
}