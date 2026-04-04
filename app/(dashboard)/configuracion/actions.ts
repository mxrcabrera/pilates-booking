'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser, hashPassword, verifyPassword } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updatePreferenciasSchema } from '@/lib/schemas/configuracion.schema'

export async function updateProfile(formData: FormData) {
  const userId = await getCurrentUser()
  if (!userId) throw new Error('No autorizado')

  const nombre = formData.get('nombre') as string
  const telefono = formData.get('telefono') as string

  await prisma.user.update({
    where: { id: userId },
    data: { nombre, telefono }
  })

  revalidatePath('/configuracion')
  return { success: true }
}

export async function changePassword(formData: FormData) {
  const userId = await getCurrentUser()
  if (!userId) throw new Error('No autorizado')

  const currentPassword = formData.get('currentPassword') as string
  const newPassword = formData.get('newPassword') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (newPassword !== confirmPassword) {
    throw new Error('Las contraseñas no coinciden')
  }

  if (newPassword.length < 8) {
    throw new Error('La contraseña debe tener al menos 8 caracteres')
  }

  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!user || !user.password) throw new Error('Usuario no encontrado')

  const isValid = await verifyPassword(currentPassword, user.password)
  if (!isValid) throw new Error('Contraseña actual incorrecta')

  const hashedPassword = await hashPassword(newPassword)

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  })

  revalidatePath('/configuracion')
  return { success: true }
}

export async function updatePreferencias(formData: FormData) {
  const userId = await getCurrentUser()
  if (!userId) throw new Error('No autorizado')

  const raw: Record<string, unknown> = {}

  const stringFields = [
    'horarioMananaInicio', 'horarioMananaFin',
    'horarioTardeInicio', 'horarioTardeFin'
  ] as const
  for (const field of stringFields) {
    const val = formData.get(field) as string | null
    if (val) raw[field] = val
  }

  const numberFields = [
    'horasAnticipacionMinima', 'maxAlumnosPorClase', 'precioPorClase'
  ] as const
  for (const field of numberFields) {
    const val = formData.get(field) as string | null
    if (val) raw[field] = val
  }

  const boolFields = [
    'turnoMananaActivo', 'turnoTardeActivo', 'syncGoogleCalendar'
  ] as const
  for (const field of boolFields) {
    if (formData.has(field)) {
      raw[field] = formData.get(field) === 'on'
    }
  }

  if (Object.keys(raw).length === 0) {
    throw new Error('No hay datos para actualizar')
  }

  const parsed = updatePreferenciasSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message)
  }

  await prisma.user.update({
    where: { id: userId },
    data: parsed.data
  })

  revalidatePath('/configuracion')
  revalidatePath('/calendario')
  revalidatePath('/alumnos')
  return { success: true }
}

export async function updateAvatar(avatarUrl: string | null) {
  const userId = await getCurrentUser()
  if (!userId) throw new Error('No autorizado')

  await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl }
  })

  revalidatePath('/perfil')
  revalidatePath('/dashboard')
  revalidatePath('/alumno')
  return { success: true }
}

interface BuddyUrlsUpdate {
  buddyGreetingUrl?: string | null
  buddyCelebrateUrl?: string | null
  buddyZenUrl?: string | null
}

export async function updateBuddyUrls(urls: BuddyUrlsUpdate) {
  const userId = await getCurrentUser()
  if (!userId) throw new Error('No autorizado')

  await prisma.user.update({
    where: { id: userId },
    data: urls
  })

  revalidatePath('/perfil')
  revalidatePath('/dashboard')
  return { success: true }
}