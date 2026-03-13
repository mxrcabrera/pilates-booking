'use server'

import { getCurrentUserWithRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { UserRole } from '@prisma/client'
import { MS_PER_HOUR } from '@/lib/constants'

const ONBOARDING_WINDOW_MS = MS_PER_HOUR

export async function updateUserRole(role: UserRole) {
  const currentUser = await getCurrentUserWithRole()

  if (!currentUser) {
    throw new Error('No autenticado')
  }

  const user = await prisma.user.findUnique({
    where: { id: currentUser.userId },
    select: { createdAt: true }
  })
  if (!user) throw new Error('Usuario no encontrado')

  const timeSinceCreation = Date.now() - user.createdAt.getTime()
  if (timeSinceCreation > ONBOARDING_WINDOW_MS) {
    throw new Error('El rol solo se puede seleccionar durante el registro inicial')
  }

  await prisma.user.update({
    where: { id: currentUser.userId },
    data: { role }
  })

  if (role === 'PROFESOR') {
    redirect('/dashboard')
  } else {
    redirect('/alumno')
  }
}
