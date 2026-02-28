'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { UserRole } from '@prisma/client'
import { MS_PER_HOUR } from '@/lib/constants'

const ONBOARDING_WINDOW_MS = MS_PER_HOUR

export async function updateUserRole(role: UserRole) {
  const session = await auth()

  if (!session?.user?.email) {
    throw new Error('No autenticado')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { createdAt: true }
  })
  if (!user) throw new Error('Usuario no encontrado')

  const timeSinceCreation = Date.now() - user.createdAt.getTime()
  if (timeSinceCreation > ONBOARDING_WINDOW_MS) {
    throw new Error('El rol solo se puede seleccionar durante el registro inicial')
  }

  try {
    await prisma.user.update({
      where: { email: session.user.email },
      data: { role }
    })
  } catch {
    throw new Error('Error al guardar el rol')
  }

  // Redirigir según el rol seleccionado
  if (role === 'PROFESOR') {
    redirect('/dashboard')
  } else {
    redirect('/alumno')
  }
}
