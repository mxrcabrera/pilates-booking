import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUser()

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true }
    })

    if (!user || user.role !== 'ALUMNO') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const profesorId = searchParams.get('profesorId')

    if (!profesorId) {
      return NextResponse.json({ error: 'profesorId requerido' }, { status: 400 })
    }

    // Verify the alumno is linked to this profesor (directly or via studio)
    const alumnoVinculado = await prisma.alumno.findFirst({
      where: {
        userId: userId,
        deletedAt: null,
        OR: [
          { profesorId: profesorId },
          {
            estudioId: { not: null },
            estudio: {
              miembros: {
                some: { userId: profesorId, deletedAt: null }
              }
            }
          }
        ]
      }
    })

    if (!alumnoVinculado) {
      return NextResponse.json({ error: 'No estás vinculado a este profesor' }, { status: 403 })
    }

    // Obtener horarios disponibles del profesor
    const horarios = await prisma.horarioDisponible.findMany({
      where: {
        profesorId: profesorId,
        estaActivo: true,
        deletedAt: null
      },
      orderBy: [{ diaSemana: 'asc' }, { horaInicio: 'asc' }]
    })

    return NextResponse.json({
      horarios: horarios.map(h => ({
        id: h.id,
        diaSemana: h.diaSemana,
        horaInicio: h.horaInicio,
        horaFin: h.horaFin
      }))
    })
  } catch (error) {
    logger.error('Error fetching horarios', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
