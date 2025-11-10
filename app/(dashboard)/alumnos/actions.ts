'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

export async function createAlumna(formData: FormData) {
  const userId = await getCurrentUser()
  if (!userId) throw new Error('No autorizado')

  const nombre = formData.get('nombre') as string
  const email = formData.get('email') as string
  const telefono = formData.get('telefono') as string
  const cumpleanosStr = formData.get('cumpleanos') as string
  const cumpleanos = cumpleanosStr ? new Date(cumpleanosStr + 'T12:00:00.000Z') : null
  const patologias = (formData.get('patologias') as string) || null
  const packType = formData.get('packType') as string
  const clasesPorMes = formData.get('clasesPorMes') ? parseInt(formData.get('clasesPorMes') as string) : null
  const precio = parseFloat(formData.get('precio') as string)

  await prisma.alumna.create({
    data: {
      profesoraId: userId,
      nombre,
      email,
      telefono,
      cumpleanos,
      patologias,
      packType,
      clasesPorMes,
      precio: new Decimal(precio)
    }
  })

  revalidatePath('/alumnos')
  return { success: true }
}

export async function updateAlumna(formData: FormData) {
  const userId = await getCurrentUser()
  if (!userId) throw new Error('No autorizado')

  const id = formData.get('id') as string
  const nombre = formData.get('nombre') as string
  const email = formData.get('email') as string
  const telefono = formData.get('telefono') as string
  const cumpleanosStr = formData.get('cumpleanos') as string
  const cumpleanos = cumpleanosStr ? new Date(cumpleanosStr + 'T12:00:00.000Z') : null
  const patologias = (formData.get('patologias') as string) || null
  const packType = formData.get('packType') as string
  const clasesPorMes = formData.get('clasesPorMes') ? parseInt(formData.get('clasesPorMes') as string) : null
  const precio = parseFloat(formData.get('precio') as string)

  await prisma.alumna.update({
    where: { id },
    data: {
      nombre,
      email,
      telefono,
      cumpleanos,
      patologias,
      packType,
      clasesPorMes,
      precio: new Decimal(precio)
    }
  })

  revalidatePath('/alumnos')
  return { success: true }
}

export async function toggleAlumnaStatus(id: string) {
  const userId = await getCurrentUser()
  if (!userId) throw new Error('No autorizado')

  const alumna = await prisma.alumna.findUnique({
    where: { id }
  })

  if (!alumna) throw new Error('Alumna no encontrada')

  await prisma.alumna.update({
    where: { id },
    data: { estaActiva: !alumna.estaActiva }
  })

  revalidatePath('/alumnos')
  return { success: true }
}

export async function deleteAlumna(id: string) {
  const userId = await getCurrentUser()
  if (!userId) throw new Error('No autorizado')

  await prisma.alumna.delete({
    where: { id }
  })

  revalidatePath('/alumnos')
  return { success: true }
}