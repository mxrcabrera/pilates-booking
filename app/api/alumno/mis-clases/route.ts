import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
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

    // Obtener todas las clases del usuario
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const clases = await prisma.clase.findMany({
      where: {
        alumno: {
          userId: userId
        },
        fecha: { gte: hoy },
        deletedAt: null
      },
      include: {
        profesor: {
          select: {
            nombre: true,
            slug: true
          }
        }
      },
      orderBy: [{ fecha: 'asc' }, { horaInicio: 'asc' }]
    })

    return NextResponse.json({
      clases: clases.map(c => ({
        id: c.id,
        fecha: c.fecha.toISOString().split('T')[0],
        hora: c.horaInicio,
        estado: c.estado,
        profesorNombre: c.profesor.nombre,
        profesorSlug: c.profesor.slug || ''
      }))
    })
  } catch (error) {
    console.error('Error fetching mis clases:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
