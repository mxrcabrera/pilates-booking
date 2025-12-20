/**
 * Funciones comunes para server actions
 * Centralizan patrones repetidos de autenticación y manejo de errores
 */

import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Verifica que el usuario esté autenticado y retorna su ID
 * @throws Error si no está autenticado
 */
export async function requireAuth(): Promise<string> {
  const userId = await getCurrentUser()
  if (!userId) {
    throw new Error('No autorizado')
  }
  return userId
}

/**
 * Verifica que un recurso pertenezca al usuario autenticado
 * @throws Error si el recurso no existe o no pertenece al usuario
 */
export async function requireOwnership<T>(
  findFn: () => Promise<T | null>,
  entityName: string
): Promise<T> {
  const entity = await findFn()
  if (!entity) {
    throw new Error(`${entityName} no encontrado`)
  }
  return entity
}

/**
 * Helper para verificar que un alumno pertenece al profesor
 */
export async function requireAlumnoOwnership(alumnoId: string, profesorId: string) {
  return requireOwnership(
    () => prisma.alumno.findFirst({ where: { id: alumnoId, profesorId } }),
    'Alumno'
  )
}

/**
 * Helper para verificar que una clase pertenece al profesor
 */
export async function requireClaseOwnership(claseId: string, profesorId: string) {
  return requireOwnership(
    () => prisma.clase.findFirst({ where: { id: claseId, profesorId } }),
    'Clase'
  )
}

/**
 * Helper para verificar que un horario pertenece al profesor
 */
export async function requireHorarioOwnership(horarioId: string, profesorId: string) {
  return requireOwnership(
    () => prisma.horarioDisponible.findFirst({ where: { id: horarioId, profesorId } }),
    'Horario'
  )
}

/**
 * Helper para verificar que un pack pertenece al profesor
 */
export async function requirePackOwnership(packId: string, profesorId: string) {
  return requireOwnership(
    () => prisma.pack.findFirst({ where: { id: packId, profesorId } }),
    'Pack'
  )
}

/**
 * Obtiene la configuración del usuario actual
 * @throws Error si el usuario no existe
 */
export async function getUserConfig(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      horasAnticipacionMinima: true,
      maxAlumnosPorClase: true,
      horarioMananaInicio: true,
      horarioMananaFin: true,
      horarioTardeInicio: true,
      horarioTardeFin: true,
      syncGoogleCalendar: true,
      precioPorClase: true
    }
  })

  if (!user) {
    throw new Error('Usuario no encontrado')
  }

  return user
}
