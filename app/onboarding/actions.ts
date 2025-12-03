'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { UserRole } from '@prisma/client'

export async function updateUserRole(role: UserRole) {
  const session = await auth()

  if (!session?.user?.email) {
    throw new Error('No autenticado')
  }

  await prisma.user.update({
    where: { email: session.user.email },
    data: { role }
  })

  // Redirigir según el rol seleccionado
  if (role === 'PROFESOR') {
    redirect('/dashboard')
  } else {
    redirect('/alumno/dashboard')
  }
}
