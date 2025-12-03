import { prisma } from './prisma'

export async function checkPreferencesComplete(userId: string): Promise<{
  isComplete: boolean
  missingFields: string[]
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      _count: {
        select: {
          horariosDisponibles: true,
          packs: true,
          alumnos: true
        }
      }
    }
  })

  if (!user) {
    return { isComplete: false, missingFields: ['user_not_found'] }
  }

  const missingFields: string[] = []

  // Check required: Packs, Horarios, Alumnos
  if (user._count.packs === 0) missingFields.push('Al menos un Pack')
  if (user._count.horariosDisponibles === 0) missingFields.push('Al menos un Horario')
  if (user._count.alumnos === 0) missingFields.push('Al menos un Alumno')

  return {
    isComplete: missingFields.length === 0,
    missingFields
  }
}
