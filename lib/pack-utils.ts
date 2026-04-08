import { prisma } from './prisma'
import { startOfMonth, endOfMonth } from 'date-fns'

/**
 * Calcula cuántas clases quedan del pack de un alumno en el mes actual
 */
export async function calcularClasesRestantes(
  alumnoId: string,
  profesorId: string
): Promise<{ restantes: number; total: number; usadas: number }> {
  const alumno = await prisma.alumno.findUnique({
    where: { id: alumnoId },
    select: { packType: true, clasesPorMes: true }
  })

  if (!alumno?.clasesPorMes) {
    return { restantes: 0, total: 0, usadas: 0 }
  }

  const total = alumno.clasesPorMes
  const ahora = new Date()
  const inicioMes = startOfMonth(ahora)
  const finMes = endOfMonth(ahora)

  // Contar clases usadas en el mes actual (presentes o pendientes)
  const clasesUsadas = await prisma.clase.count({
    where: {
      alumnoId,
      profesorId,
      fecha: {
        gte: inicioMes,
        lte: finMes
      },
      estado: {
        in: ['reservada', 'completada']
      },
      deletedAt: null
    }
  })

  const restantes = Math.max(0, total - clasesUsadas)

  return { restantes, total, usadas: clasesUsadas }
}

/**
 * Calcula cuántas clases recuperadas ha tenido un alumno en el mes actual
 * Una clase "recuperada" es cuando el alumno fue marcado como ausente sin cancelar
 */
export async function calcularClasesRecuperadas(
  alumnoId: string,
  profesorId: string
): Promise<{ recuperadas: number; limite: number; puedeRecuperar: boolean }> {
  const ahora = new Date()
  const inicioMes = startOfMonth(ahora)
  const finMes = endOfMonth(ahora)

  // Contar clases marcadas como ausente en el mes actual
  const clasesAusentes = await prisma.clase.count({
    where: {
      alumnoId,
      profesorId,
      fecha: {
        gte: inicioMes,
        lte: finMes
      },
      asistencia: 'ausente',
      deletedAt: null
    }
  })

  const limite = 3
  const puedeRecuperar = clasesAusentes < limite

  return { recuperadas: clasesAusentes, limite, puedeRecuperar }
}

/**
 * Verifica si un alumno puede reservar una nueva clase
 * Considera clases restantes del pack y límite de recuperadas
 */
export async function puedeReservarClase(
  alumnoId: string,
  profesorId: string
): Promise<{ puede: boolean; razon?: string }> {
  const { restantes } = await calcularClasesRestantes(alumnoId, profesorId)

  if (restantes <= 0) {
    return { puede: false, razon: 'No tienes clases restantes en tu pack este mes' }
  }

  const { puedeRecuperar } = await calcularClasesRecuperadas(alumnoId, profesorId)

  if (!puedeRecuperar) {
    return { puede: false, razon: 'Has alcanzado el límite de 3 clases recuperadas por mes' }
  }

  return { puede: true }
}
