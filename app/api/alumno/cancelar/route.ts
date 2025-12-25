import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function DELETE(request: NextRequest) {
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
    const claseId = searchParams.get('id')

    if (!claseId) {
      return NextResponse.json({ error: 'ID de clase requerido' }, { status: 400 })
    }

    // Verificar que la clase pertenece al alumno
    const clase = await prisma.clase.findFirst({
      where: {
        id: claseId,
        alumno: {
          userId: userId
        },
        deletedAt: null
      }
    })

    if (!clase) {
      return NextResponse.json({ error: 'Clase no encontrada' }, { status: 404 })
    }

    // Verificar que la clase no sea en el pasado
    const ahora = new Date()
    const fechaClase = new Date(clase.fecha)
    fechaClase.setHours(
      parseInt(clase.horaInicio.split(':')[0]),
      parseInt(clase.horaInicio.split(':')[1])
    )

    if (fechaClase < ahora) {
      return NextResponse.json({ error: 'No se puede cancelar una clase pasada' }, { status: 400 })
    }

    // Cancelar la clase (soft delete o cambiar estado)
    await prisma.clase.update({
      where: { id: claseId },
      data: {
        estado: 'cancelada',
        deletedAt: new Date()
      }
    })

    return NextResponse.json({ success: true, message: 'Clase cancelada correctamente' })
  } catch (error) {
    console.error('Error cancelando clase:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
