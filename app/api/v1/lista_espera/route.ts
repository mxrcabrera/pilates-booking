import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserContext, getOwnerFilter } from '@/lib/auth'
import { unauthorized, serverError } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    const context = await getUserContext()
    if (!context) {
      return unauthorized()
    }

    const { userId: _userId, estudio: _estudio } = context
    const ownerFilter = getOwnerFilter(context)

    const { searchParams } = new URL(request.url)
    const fecha = searchParams.get('fecha')

    const where: { fecha?: Date; profesorId?: string; estudioId?: string } = { ...ownerFilter }
    if (fecha) {
      where.fecha = new Date(fecha)
    }

    const listaEspera = await prisma.listaEspera.findMany({
      where,
      include: {
        alumno: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        }
      },
      orderBy: [
        { fecha: 'asc' },
        { horaInicio: 'asc' },
        { posicion: 'asc' }
      ]
    })

    return NextResponse.json({ listaEspera })
  } catch (error) {
    return serverError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await getUserContext()
    if (!context) {
      return unauthorized()
    }

    const { userId, estudio } = context
    const ownerFilter = getOwnerFilter(context)

    const body = await request.json()
    const { alumnoId, fecha, horaInicio } = body

    // Verificar que el alumno existe y pertenece al estudio/profesor
    const alumno = await prisma.alumno.findFirst({
      where: { id: alumnoId, ...ownerFilter, deletedAt: null }
    })

    if (!alumno) {
      return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 })
    }

    // Calcular posición (máxima posición actual + 1)
    const ultimaPosicion = await prisma.listaEspera.findFirst({
      where: {
        ...ownerFilter,
        fecha: new Date(fecha),
        horaInicio
      },
      orderBy: { posicion: 'desc' }
    })

    const posicion = (ultimaPosicion?.posicion || 0) + 1

    // Crear entrada en lista de espera
    const entrada = await prisma.listaEspera.create({
      data: {
        alumnoId,
        profesorId: userId,
        ...(estudio && { estudioId: estudio.estudioId }),
        fecha: new Date(fecha),
        horaInicio,
        posicion,
        estado: 'esperando',
        expiraEn: new Date(Date.now() + 24 * 60 * 60 * 1000) // Expira en 24 horas
      },
      include: {
        alumno: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({ entrada }, { status: 201 })
  } catch (error) {
    return serverError(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const context = await getUserContext()
    if (!context) {
      return unauthorized()
    }

    const { userId: _userId, estudio: _estudio } = context
    const ownerFilter = getOwnerFilter(context)

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID es requerido' }, { status: 400 })
    }

    // Verificar que la entrada existe y pertenece al usuario
    const entrada = await prisma.listaEspera.findFirst({
      where: { id, ...ownerFilter }
    })

    if (!entrada) {
      return NextResponse.json({ error: 'Entrada no encontrada' }, { status: 404 })
    }

    // Eliminar entrada
    await prisma.listaEspera.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return serverError(error)
  }
}
