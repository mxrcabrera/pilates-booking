'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { hashPassword, verifyPassword, createToken, setAuthCookie, removeAuthCookie } from '@/lib/auth'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Buscar profesora por email
  const profesora = await prisma.profesora.findUnique({
    where: { email }
  })

  if (!profesora) {
    throw new Error('Credenciales inválidas')
  }

  // Verificar password
  const isValid = await verifyPassword(password, profesora.password)
  if (!isValid) {
    throw new Error('Credenciales inválidas')
  }

  // Crear token y guardar en cookie
  const token = await createToken(profesora.id)
  await setAuthCookie(token)

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const nombre = formData.get('nombre') as string

  // Verificar si ya existe
  const existente = await prisma.profesora.findUnique({
    where: { email }
  })

  if (existente) {
    throw new Error('El email ya está registrado')
  }

  // Hashear password y crear profesora
  const hashedPassword = await hashPassword(password)
  
  const profesora = await prisma.profesora.create({
    data: {
      email,
      nombre,
      password: hashedPassword,
    }
  })

  // Crear token y guardar en cookie
  const token = await createToken(profesora.id)
  await setAuthCookie(token)

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logout() {
  await removeAuthCookie()
  redirect('/login')
}