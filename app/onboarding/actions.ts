'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { UserRole } from '@prisma/client'

export async function updateUserRole(role: UserRole) {
  const session = await auth()

  if (!session?.user?.email) {
    throw new Error('No autenticado')
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
