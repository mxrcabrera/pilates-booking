import { prisma } from './prisma'

export async function checkPreferencesComplete(userId: string): Promise<{
  isComplete: boolean
  missingFields: string[]
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      telefono: true,
      horasAnticipacionMinima: true,
      maxAlumnosPorClase: true,
      horarioMananaInicio: true,
      horarioMananaFin: true,
      horarioTardeInicio: true,
      horarioTardeFin: true,
      _count: {
        select: {
          horariosDisponibles: true
        }
      }
    }
  })

  if (!user) {
    return { isComplete: false, missingFields: ['user_not_found'] }
  }

  const missingFields: string[] = []

  // Check required fields
  if (!user.telefono) missingFields.push('teléfono')
  if (!user.horarioMananaInicio) missingFields.push('horario de mañana (inicio)')
  if (!user.horarioMananaFin) missingFields.push('horario de mañana (fin)')
  if (!user.horarioTardeInicio) missingFields.push('horario de tarde (inicio)')
  if (!user.horarioTardeFin) missingFields.push('horario de tarde (fin)')
  if (user._count.horariosDisponibles === 0) missingFields.push('al menos un horario disponible')

  return {
    isComplete: missingFields.length === 0,
    missingFields
  }
}
