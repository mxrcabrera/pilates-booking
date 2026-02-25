'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

export async function createAlumno(formData: FormData) {
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

  try {
    await prisma.alumno.create({
      data: {
        profesorId: userId,
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
  } catch {
    throw new Error('Error al crear alumno')
  }

  revalidatePath('/alumnos')
  return { success: true }
}

export async function updateAlumno(formData: FormData) {
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

  const alumno = await prisma.alumno.findFirst({
    where: { id, profesorId: userId, deletedAt: null }
  })
  if (!alumno) throw new Error('Alumno no encontrado')

  try {
    await prisma.alumno.update({
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
  } catch {
    throw new Error('Error al actualizar alumno')
  }

  revalidatePath('/alumnos')
  return { success: true }
}

export async function toggleAlumnoStatus(id: string) {
  const userId = await getCurrentUser()
  if (!userId) throw new Error('No autorizado')

  const alumno = await prisma.alumno.findFirst({
    where: { id, profesorId: userId, deletedAt: null }
  })
  if (!alumno) throw new Error('Alumno no encontrado')

  try {
    await prisma.alumno.update({
      where: { id },
      data: { estaActivo: !alumno.estaActivo }
    })
  } catch {
    throw new Error('Error al cambiar estado')
  }

  revalidatePath('/alumnos')
  return { success: true }
}

export async function deleteAlumno(id: string) {
  const userId = await getCurrentUser()
  if (!userId) throw new Error('No autorizado')

  const alumno = await prisma.alumno.findFirst({
    where: { id, profesorId: userId, deletedAt: null }
  })
  if (!alumno) throw new Error('Alumno no encontrado')

  try {
    const now = new Date()
    await prisma.$transaction([
      prisma.alumno.update({
        where: { id },
        data: { deletedAt: now }
      }),
      prisma.pago.updateMany({
        where: { alumnoId: id, estado: 'pendiente', deletedAt: null },
        data: { deletedAt: now }
      }),
      prisma.clase.updateMany({
        where: { alumnoId: id, estado: 'reservada', fecha: { gte: now }, deletedAt: null },
        data: { estado: 'cancelada' }
      }),
    ])
  } catch {
    throw new Error('Error al eliminar alumno')
  }

  revalidatePath('/alumnos')
  return { success: true }
}