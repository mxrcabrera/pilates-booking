import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserContext, getOwnerFilter } from '@/lib/auth'
import { startOfDay } from 'date-fns'
import { getCachedProfesorConfig } from '@/lib/server-cache'
import { logger } from '@/lib/logger'
import { getEffectiveFeatures } from '@/lib/plans'
import { unauthorized } from '@/lib/api-utils'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const context = await getUserContext()
    if (!context) {
      return unauthorized()
    }

    const { userId, estudio } = context
    const ownerFilter = getOwnerFilter(context)

    // Obtener inicio del día local y convertir a UTC
    const ahora = new Date()
    const inicioDelDiaLocal = startOfDay(ahora)
    // Convertir a fecha UTC para la búsqueda (ya que DB guarda en UTC)
    const fechaHoy = new Date(Date.UTC(
      inicioDelDiaLocal.getFullYear(),
      inicioDelDiaLocal.getMonth(),
      inicioDelDiaLocal.getDate()
    ))
    const fechaManana = new Date(Date.UTC(
      inicioDelDiaLocal.getFullYear(),
      inicioDelDiaLocal.getMonth(),
      inicioDelDiaLocal.getDate() + 1
    ))

    // Una sola ronda de queries en paralelo (incluye verificación de rol y datos de setup)
    // Usamos cache para la config del profesor
    const [profesorConfig, userRole, totalAlumnos, clasesHoyRaw, clasesMañanaRaw, pagosVencidos, horariosCount, packsCount] = await Promise.all([
      getCachedProfesorConfig(userId),
      prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, plan: true, trialEndsAt: true }
      }),
      prisma.alumno.count({
        where: {
          ...ownerFilter,
          estaActivo: true,
          deletedAt: null
        }
      }),
      prisma.clase.findMany({
        where: {
          ...ownerFilter,
          fecha: fechaHoy,
          deletedAt: null
        },
        select: {
          id: true,
          horaInicio: true,
          estado: true,
          asistencia: true,
          esClasePrueba: true,
          alumno: {
            select: {
              nombre: true
            }
          }
        },
        orderBy: {
          horaInicio: 'asc'
        }
      }),
      prisma.clase.findMany({
        where: {
          ...ownerFilter,
          fecha: fechaManana,
          deletedAt: null
        },
        select: {
          id: true,
          horaInicio: true,
          estado: true,
          esClasePrueba: true,
          alumno: {
            select: {
              nombre: true
            }
          }
        },
        orderBy: {
          horaInicio: 'asc'
        }
      }),
      prisma.pago.count({
        where: {
          alumno: ownerFilter,
          estado: 'pendiente',
          deletedAt: null,
          fechaVencimiento: {
            lt: new Date()
          }
        }
      }),
      prisma.horarioDisponible.count({
        where: { ...ownerFilter, deletedAt: null }
      }),
      prisma.pack.count({
        where: { ...ownerFilter, deletedAt: null }
      })
    ])

    if (userRole?.role === 'ALUMNO') {
      return NextResponse.json({ redirect: '/alumno/dashboard' })
    }

    const horarioTardeInicio = profesorConfig?.horarioTardeInicio || '17:00'
    const maxAlumnosPorClase = profesorConfig?.maxAlumnosPorClase || 3

    // Normalizar clases para que coincidan con ClaseHoy type
    const clasesHoy = clasesHoyRaw.map(c => ({
      id: c.id,
      horaInicio: c.horaInicio,
      estado: c.estado,
      asistencia: c.asistencia,
      esClasePrueba: c.esClasePrueba,
      alumno: c.alumno
    }))

    // Agrupar clases de mañana por hora para la siguiente clase
    const siguienteClase = clasesMañanaRaw.length > 0 ? {
      hora: clasesMañanaRaw[0].horaInicio,
      cantAlumnos: clasesMañanaRaw.filter(c => c.horaInicio === clasesMañanaRaw[0].horaInicio && c.alumno !== null).length,
      esMañana: true
    } : null

    // Datos para el setup wizard (solo si el usuario es nuevo)
    const setupStatus = {
      hasHorarios: horariosCount > 0,
      hasPacks: packsCount > 0,
      hasAlumnos: totalAlumnos > 0,
      userName: profesorConfig?.nombre || null
    }

    // Calcular features según plan
    const features = userRole ? getEffectiveFeatures(userRole.plan, userRole.trialEndsAt) : null

    return NextResponse.json({
      totalAlumnos,
      clasesHoy,
      pagosVencidos,
      horarioTardeInicio,
      maxAlumnosPorClase,
      siguienteClase,
      setupStatus,
      features: {
        reportesBasicos: features?.reportesBasicos ?? false,
        plan: userRole?.plan || 'FREE'
      }
    })
  } catch (error) {
    logger.error('Dashboard GET error', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
