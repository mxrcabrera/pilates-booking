'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { hashPassword, verifyPassword, createToken, setAuthCookie, removeAuthCookie } from '@/lib/auth'
import { signIn } from '@/lib/auth-new'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Buscar usuario por email
  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user) {
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
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const nombre = formData.get('nombre') as string

  // Verificar si ya existe
  const existente = await prisma.user.findUnique({
    where: { email }
  })

  if (existente) {
    throw new Error('El email ya está registrado')
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
  await setAuthCookie(token)

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logout() {
  await removeAuthCookie()
  redirect('/login')
}

export async function loginWithGoogle() {
  await signIn('google', { redirectTo: '/dashboard' })
}