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
      return forbidden('Acceso denegado')
    }

    const alumnos = await prisma.alumno.findMany({
      where: {
        userId: userId,
        deletedAt: null
      },
      select: {
        estudioId: true,
        profesor: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    })

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

    const hasProfile = Boolean(user.telefono && user.telefono.length >= 8)
    const hasProfesor = alumnos.length > 0

    const profesoresFromAlumnos = alumnos
      .filter(a => a.profesor !== null)
      .map(a => ({ id: a.profesor!.id, nombre: a.profesor!.nombre }))

    const estudioIds = [...new Set(
      alumnos.filter(a => a.estudioId).map(a => a.estudioId!)
    )]

    let profesoresFromEstudio: { id: string; nombre: string }[] = []
    if (estudioIds.length > 0) {
      const miembros = await prisma.estudioMiembro.findMany({
        where: {
          estudioId: { in: estudioIds },
          deletedAt: null
        },
        include: {
          user: {
            select: { id: true, nombre: true }
          }
        }
      })
      profesoresFromEstudio = miembros.map(m => ({
        id: m.user.id,
        nombre: m.user.nombre
      }))
    }

    const allProfesores = [...profesoresFromAlumnos, ...profesoresFromEstudio]
    const profesoresMap = new Map(allProfesores.map(p => [p.id, p]))
    const profesores = [...profesoresMap.values()]

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
    return serverError(error)
  }
}
