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
  if (!user.telefono) missingFields.push('Teléfono')
  if (!user.horarioMananaInicio) missingFields.push('Horario de Mañana (Inicio)')
  if (!user.horarioMananaFin) missingFields.push('Horario de Mañana (Fin)')
  if (!user.horarioTardeInicio) missingFields.push('Horario de Tarde (Inicio)')
  if (!user.horarioTardeFin) missingFields.push('Horario de Tarde (Fin)')
  if (user._count.horariosDisponibles === 0) missingFields.push('Al Menos un Horario Disponible')

  return {
    isComplete: missingFields.length === 0,
    missingFields
  }
}
