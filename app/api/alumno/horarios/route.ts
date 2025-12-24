import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

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

    // Verificar que el alumno está vinculado a este profesor
    const alumnoVinculado = await prisma.alumno.findFirst({
      where: {
        userId: userId,
        profesorId: profesorId,
        deletedAt: null
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
    console.error('Error fetching horarios:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
