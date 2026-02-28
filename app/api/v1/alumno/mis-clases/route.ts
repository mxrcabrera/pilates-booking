import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { unauthorized, forbidden, serverError } from '@/lib/api-utils'

export async function GET() {
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
            nombre: true
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
        profesorNombre: c.profesor.nombre
      }))
    })
  } catch (error) {
    return serverError(error)
  }
}
