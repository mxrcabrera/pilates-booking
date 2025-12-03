import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { Decimal } from '@prisma/client/runtime/library'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const userId = await getCurrentUser()
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const [alumnos, packs] = await Promise.all([
      prisma.alumno.findMany({
        where: { profesorId: userId },
        include: {
          _count: { select: { clases: true, pagos: true } }
        },
        orderBy: { nombre: 'asc' }
      }),
      prisma.pack.findMany({
        where: { profesorId: userId, estaActivo: true },
        orderBy: { clasesPorSemana: 'asc' }
      })
    ])

    const alumnosSerializados = alumnos.map(alumno => ({
      ...alumno,
      precio: alumno.precio.toString(),
      cumpleanos: alumno.cumpleanos ? alumno.cumpleanos.toISOString() : null,
    }))

    const packsSerializados = packs.map(pack => ({
      id: pack.id,
      nombre: pack.nombre,
      clasesPorSemana: pack.clasesPorSemana,
      precio: pack.precio.toString()
    }))

    return NextResponse.json({ alumnos: alumnosSerializados, packs: packsSerializados })
  } catch (error: any) {
    console.error('Alumnos GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUser()
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { action, ...data } = body

    switch (action) {
      case 'create': {
        const { nombre, email, telefono, cumpleanos, patologias, packType, clasesPorMes, precio } = data

        const alumno = await prisma.alumno.create({
          data: {
            profesorId: userId,
            nombre,
            email,
            telefono,
            cumpleanos: cumpleanos ? new Date(cumpleanos + 'T00:00:00') : null,
            patologias: patologias || null,
            packType,
            clasesPorMes: clasesPorMes ? parseInt(clasesPorMes) : null,
            precio: new Decimal(parseFloat(precio))
          },
          include: {
            _count: { select: { clases: true, pagos: true } }
          }
        })

        return NextResponse.json({ success: true, alumno })
      }

      case 'update': {
        const { id, nombre, email, telefono, cumpleanos, patologias, packType, clasesPorMes, precio } = data

        const alumno = await prisma.alumno.update({
          where: { id },
          data: {
            nombre,
            email,
            telefono,
            cumpleanos: cumpleanos ? new Date(cumpleanos + 'T00:00:00') : null,
            patologias: patologias || null,
            packType,
            clasesPorMes: clasesPorMes ? parseInt(clasesPorMes) : null,
            precio: new Decimal(parseFloat(precio))
          },
          include: {
            _count: { select: { clases: true, pagos: true } }
          }
        })

        return NextResponse.json({ success: true, alumno })
      }

      case 'toggleStatus': {
        const { id } = data
        // Usar raw SQL para toggle en una sola query
        const result = await prisma.$executeRaw`
          UPDATE "Alumno"
          SET "estaActivo" = NOT "estaActivo"
          WHERE id = ${id}
        `

        if (result === 0) {
          return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 })
        }

        return NextResponse.json({ success: true })
      }

      case 'delete': {
        const { id } = data
        await prisma.alumno.delete({ where: { id } })
        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Alumnos API error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
