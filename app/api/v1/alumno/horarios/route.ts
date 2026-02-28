import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { unauthorized, badRequest, forbidden, serverError } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUser()

    if (!userId) {
      return unauthorized()
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true }
    })

    if (!user || user.role !== 'ALUMNO') {
      return forbidden('Acceso denegado')
    }

    const { searchParams } = new URL(request.url)
    const profesorId = searchParams.get('profesorId')

    if (!profesorId) {
      return badRequest('profesorId requerido')
    }

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
      return forbidden('No estas vinculado a este profesor')
    }

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
    return serverError(error)
  }
}
