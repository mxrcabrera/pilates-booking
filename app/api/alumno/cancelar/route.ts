import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'
import { argentinaToUTC } from '@/lib/dates'

const WRITE_LIMIT = 5
const WINDOW_MS = 60 * 1000

export async function DELETE(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIP(request)
    const { success } = rateLimit(`alumno-cancelar:${ip}`, WRITE_LIMIT, WINDOW_MS)
    if (!success) {
      return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 })
    }

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

    // Verify class is in the future
    const ahora = new Date()
    const fechaClase = new Date(clase.fecha)
    const fechaStr = fechaClase.toISOString().split('T')[0]
    const fechaHoraUTC = argentinaToUTC(fechaStr, clase.horaInicio)

    if (fechaHoraUTC < ahora) {
      return NextResponse.json({ error: 'No se puede cancelar una clase pasada' }, { status: 400 })
    }

    // Cancel: mark as cancelled, keep alumnoId for history
    // Capacity is freed because occupied count excludes cancelled classes
    await prisma.clase.update({
      where: { id: claseId },
      data: { estado: 'cancelada' }
    })

    return NextResponse.json({ success: true, message: 'Clase cancelada correctamente' })
  } catch (error) {
    logger.error('Error cancelando clase', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
