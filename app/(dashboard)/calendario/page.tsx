import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CalendarioClient } from './calendario-client'
import { checkPreferencesComplete } from '@/lib/preferences-guard'
import { PreferencesRequired } from '@/components/preferences-required'

export default async function CalendarioPage() {
  const userId = await getCurrentUser()
  if (!userId) return null

  // Check if preferences are complete
  const preferencesCheck = await checkPreferencesComplete(userId)
  if (!preferencesCheck.isComplete) {
    return <PreferencesRequired missingFields={preferencesCheck.missingFields} />
  }

  const hoy = new Date()

  // Cargar 3 meses (mes anterior, actual, siguiente)
  const inicioRango = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
  const finRango = new Date(hoy.getFullYear(), hoy.getMonth() + 2, 0)

  // Obtener configuración del usuario
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      espacioCompartidoId: true,
      horarioMananaInicio: true,
      horarioMananaFin: true,
      horarioTardeInicio: true,
      horarioTardeFin: true
    }
  })

  // Si tiene espacio compartido, obtener IDs de todos los usuarios en ese espacio
  let profesorIds = [userId]
  if (user?.espacioCompartidoId) {
    const usuariosEnEspacio = await prisma.user.findMany({
      where: { espacioCompartidoId: user.espacioCompartidoId },
      select: { id: true }
    })
    profesorIds = usuariosEnEspacio.map(p => p.id)
  }

  const clases = await prisma.clase.findMany({
    where: {
      profesorId: { in: profesorIds },
      fecha: {
        gte: inicioRango,
        lte: finRango
      }
    },
    select: {
      id: true,
      fecha: true,
      horaInicio: true,
      horaRecurrente: true,
      estado: true,
      esClasePrueba: true,
      esRecurrente: true,
      frecuenciaSemanal: true,
      diasSemana: true,
      profesorId: true,
      alumnoId: true,
      alumno: {
        select: {
          id: true,
          nombre: true
        }
      },
      profesor: {
        select: {
          id: true,
          nombre: true
        }
      }
    },
    orderBy: {
      horaInicio: 'asc'
    }
  })

  const clasesNormalizadas = clases.map(clase => ({
    ...clase,
    fecha: new Date(clase.fecha.getTime() + clase.fecha.getTimezoneOffset() * 60000)
  }))

  const alumnos = await prisma.alumno.findMany({
    where: {
      profesorId: userId,
      estaActivo: true
    },
    select: {
      id: true,
      nombre: true
    },
    orderBy: {
      nombre: 'asc'
    }
  })

  return (
    <CalendarioClient
      clasesIniciales={clasesNormalizadas}
      alumnos={alumnos}
      currentUserId={userId}
      horarioMananaInicio={user?.horarioMananaInicio || '08:00'}
      horarioMananaFin={user?.horarioMananaFin || '14:00'}
      horarioTardeInicio={user?.horarioTardeInicio || '17:00'}
      horarioTardeFin={user?.horarioTardeFin || '22:00'}
    />
  )
}