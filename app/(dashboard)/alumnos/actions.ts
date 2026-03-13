'use server'

import { revalidatePath } from 'next/cache'
import { getUserContext, getOwnerFilter } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function toggleAlumnoStatus(id: string) {
  const context = await getUserContext()
  if (!context) throw new Error('No autorizado')

  const ownerFilter = getOwnerFilter(context)
  const alumno = await prisma.alumno.findFirst({
    where: { id, ...ownerFilter, deletedAt: null }
  })
  if (!alumno) throw new Error('Alumno no encontrado')

  await prisma.alumno.update({
    where: { id },
    data: { estaActivo: !alumno.estaActivo }
  })

  revalidatePath('/alumnos')
  return { success: true }
}

export async function deleteAlumno(id: string) {
  const context = await getUserContext()
  if (!context) throw new Error('No autorizado')

  const ownerFilter = getOwnerFilter(context)
  const alumno = await prisma.alumno.findFirst({
    where: { id, ...ownerFilter, deletedAt: null }
  })
  if (!alumno) throw new Error('Alumno no encontrado')

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

  revalidatePath('/alumnos')
  return { success: true }
}