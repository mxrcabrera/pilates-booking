import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    const userId = await getCurrentUser()

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nombre: true,
        email: true,
        telefono: true,
        genero: true,
        role: true
      }
    })

    if (!user || user.role !== 'ALUMNO') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    // Buscar perfiles de alumno vinculados
    const alumnos = await prisma.alumno.findMany({
      where: {
        userId: userId,
        deletedAt: null
      },
      include: {
        profesor: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    })

    // Obtener próximas clases
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const clases = await prisma.clase.findMany({
      where: {
        alumno: {
          userId: userId
        },
        fecha: { gte: hoy },
        deletedAt: null,
        estado: { not: 'cancelada' }
      },
      include: {
        profesor: {
          select: {
            nombre: true
          }
        }
      },
      orderBy: [{ fecha: 'asc' }, { horaInicio: 'asc' }],
      take: 10
    })

    // Verificar si el perfil está completo
    const hasProfile = Boolean(user.telefono && user.telefono.length >= 8)
    const hasProfesor = alumnos.length > 0

    // Extraer profesores únicos
    const profesores = alumnos.map(a => ({
      id: a.profesor.id,
      nombre: a.profesor.nombre
    }))

    return NextResponse.json({
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        telefono: user.telefono,
        genero: user.genero
      },
      setupStatus: {
        hasProfile,
        hasProfesor
      },
      profesores,
      proximasClases: clases.map(c => ({
        id: c.id,
        fecha: c.fecha.toISOString().split('T')[0],
        hora: c.horaInicio,
        profesorNombre: c.profesor.nombre
      }))
    })
  } catch (error) {
    logger.error('Error fetching alumno dashboard', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
