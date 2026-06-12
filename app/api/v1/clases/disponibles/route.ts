import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserContext } from '@/lib/auth'
import { unauthorized, badRequest, serverError } from '@/lib/api-utils'

export const runtime = 'nodejs'

/**
 * GET - Obtener clases disponibles para un alumno
 * Retorna clases futuras con información de cupos disponibles
 */
export async function GET(request: NextRequest) {
  try {
    const context = await getUserContext()
    if (!context) {
      return unauthorized()
    }

    const { userId } = context
    const { searchParams } = new URL(request.url)
    const estudioIdParam = searchParams.get('estudioId')

    // Buscar el perfil de alumno
    const alumno = await prisma.alumno.findFirst({
      where: { userId, deletedAt: null },
    })

    if (!alumno) {
      return badRequest('No se encontró el perfil de alumno')
    }

    // Determinar estudioId (del alumno o del parámetro)
    const estudioId = estudioIdParam || alumno.estudioId
    if (!estudioId) {
      return badRequest('No se pudo determinar el estudio')
    }

    // Obtener clases futuras del estudio
    const clases = await prisma.clase.findMany({
      where: {
        estudioId,
        deletedAt: null,
        fecha: { gte: new Date() },
        estado: 'reservada',
      },
      include: {
        profesor: {
          select: { id: true, nombre: true },
        },
      },
      orderBy: [{ fecha: 'asc' }, { horaInicio: 'asc' }],
    })

    // Para cada clase, calcular cupos disponibles
    const clasesConCupos = await Promise.all(
      clases.map(async (clase) => {
        // Contar reservas existentes para esta clase (o serie)
        const whereClause: { deletedAt: Date | null; alumnoId: { not: null }; serieId?: string; id?: string } = {
          deletedAt: null,
          alumnoId: { not: null },
        }

        if (clase.serieId) {
          whereClause.serieId = clase.serieId
        } else {
          whereClause.id = clase.id
        }

        const reservasExistentes = await prisma.clase.count({
          where: whereClause,
        })

        const cuposDisponibles = clase.cuposMaximos - reservasExistentes

        // Verificar si el alumno ya tiene reserva
        const reservaAlumnoWhereClause: { deletedAt: Date | null; alumnoId: string; serieId?: string; id?: string } = {
          deletedAt: null,
          alumnoId: alumno.id,
        }

        if (clase.serieId) {
          reservaAlumnoWhereClause.serieId = clase.serieId
        } else {
          reservaAlumnoWhereClause.id = clase.id
        }

        const reservaAlumno = await prisma.clase.findFirst({
          where: reservaAlumnoWhereClause,
        })

        return {
          id: clase.id,
          fecha: clase.fecha,
          horaInicio: clase.horaInicio,
          profesorId: clase.profesorId,
          profesorNombre: clase.profesor.nombre,
          cuposMaximos: clase.cuposMaximos,
          cuposDisponibles,
          estaReservado: !!reservaAlumno,
        }
      })
    )

    return NextResponse.json({
      success: true,
      clases: clasesConCupos,
    })
  } catch (error) {
    console.error('Error fetching available classes:', error)
    return serverError(error)
  }
}
