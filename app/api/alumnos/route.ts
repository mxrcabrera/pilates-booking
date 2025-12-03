import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { Decimal } from '@prisma/client/runtime/library'

export const runtime = 'nodejs'

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

        await prisma.alumno.create({
          data: {
            profesorId: userId,
            nombre,
            email,
            telefono,
            cumpleanos: cumpleanos ? new Date(cumpleanos + 'T12:00:00.000Z') : null,
            patologias: patologias || null,
            packType,
            clasesPorMes: clasesPorMes ? parseInt(clasesPorMes) : null,
            precio: new Decimal(parseFloat(precio))
          }
        })

        return NextResponse.json({ success: true })
      }

      case 'update': {
        const { id, nombre, email, telefono, cumpleanos, patologias, packType, clasesPorMes, precio } = data

        await prisma.alumno.update({
          where: { id },
          data: {
            nombre,
            email,
            telefono,
            cumpleanos: cumpleanos ? new Date(cumpleanos + 'T12:00:00.000Z') : null,
            patologias: patologias || null,
            packType,
            clasesPorMes: clasesPorMes ? parseInt(clasesPorMes) : null,
            precio: new Decimal(parseFloat(precio))
          }
        })

        return NextResponse.json({ success: true })
      }

      case 'toggleStatus': {
        const { id } = data
        const alumno = await prisma.alumno.findUnique({ where: { id } })

        if (!alumno) {
          return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 })
        }

        await prisma.alumno.update({
          where: { id },
          data: { estaActivo: !alumno.estaActivo }
        })

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
