'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hashPassword, verifyPassword } from '@/lib/auth'

export async function updateProfile(formData: FormData) {
  const userId = await getCurrentUser()
  if (!userId) throw new Error('No autorizado')

  const nombre = formData.get('nombre') as string
  const telefono = formData.get('telefono') as string

  await prisma.profesora.update({
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

  if (newPassword.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres')
  }

  const profesora = await prisma.profesora.findUnique({
    where: { id: userId }
  })

  if (!profesora) throw new Error('Usuario no encontrado')

  const isValid = await verifyPassword(currentPassword, profesora.password)
  if (!isValid) throw new Error('Contraseña actual incorrecta')

  const hashedPassword = await hashPassword(newPassword)

  await prisma.profesora.update({
    where: { id: userId },
    data: { password: hashedPassword }
  })

  revalidatePath('/configuracion')
  return { success: true }
}

export async function saveHorario(formData: FormData) {
  const userId = await getCurrentUser()
  if (!userId) throw new Error('No autorizado')

  const id = formData.get('id') as string | null
  const diaSemana = parseInt(formData.get('diaSemana') as string)
  const horaInicio = formData.get('horaInicio') as string
  const horaFin = formData.get('horaFin') as string
  const esManiana = formData.get('esManiana') === 'true'

  if (id) {
    // Actualizar
    await prisma.horarioDisponible.update({
      where: { id },
      data: { diaSemana, horaInicio, horaFin, esManiana }
    })
  } else {
    // Crear
    await prisma.horarioDisponible.create({
      data: {
        profesoraId: userId,
        diaSemana,
        horaInicio,
        horaFin,
        esManiana
      }
    })
  }

  revalidatePath('/configuracion')
  return { success: true }
}

export async function deleteHorario(id: string) {
  const userId = await getCurrentUser()
  if (!userId) throw new Error('No autorizado')

  await prisma.horarioDisponible.delete({
    where: { id }
  })

  revalidatePath('/configuracion')
  return { success: true }
}

export async function toggleHorario(id: string) {
  const userId = await getCurrentUser()
  if (!userId) throw new Error('No autorizado')

  const horario = await prisma.horarioDisponible.findUnique({
    where: { id }
  })

  if (!horario) throw new Error('Horario no encontrado')

  await prisma.horarioDisponible.update({
    where: { id },
    data: { estaActivo: !horario.estaActivo }
  })

  revalidatePath('/configuracion')
  return { success: true }
}