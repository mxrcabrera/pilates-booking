import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { startOfDay } from 'date-fns'
import { getErrorMessage } from '@/lib/utils'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const userId = await getCurrentUser()
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

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
    const [user, totalAlumnos, clasesHoyRaw, clasesMañanaRaw, pagosVencidos, horariosCount, packsCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          nombre: true,
          role: true,
          horarioTardeInicio: true,
          maxAlumnosPorClase: true
        }
      }),
      prisma.alumno.count({
        where: {
          profesorId: userId,
          estaActivo: true
        }
      }),
      prisma.clase.findMany({
        where: {
          profesorId: userId,
          fecha: fechaHoy
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
          profesorId: userId,
          fecha: fechaManana
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
          alumno: {
            profesorId: userId
          },
          estado: 'pendiente',
          fechaVencimiento: {
            lt: new Date()
          }
        }
      }),
      prisma.horarioDisponible.count({
        where: { profesorId: userId }
      }),
      prisma.pack.count({
        where: { profesorId: userId }
      })
    ])

    if (user?.role === 'ALUMNO') {
      return NextResponse.json({ redirect: '/alumno/dashboard' })
    }

    const horarioTardeInicio = user?.horarioTardeInicio || '17:00'
    const maxAlumnosPorClase = user?.maxAlumnosPorClase || 3

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
      userName: user?.nombre || null
    }

    return NextResponse.json({
      totalAlumnos,
      clasesHoy,
      pagosVencidos,
      horarioTardeInicio,
      maxAlumnosPorClase,
      siguienteClase,
      setupStatus
    })
  } catch (error) {
    console.error('Dashboard GET error:', error)
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
  }
}
