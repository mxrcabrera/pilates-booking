import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { argentinaToUTC } from '@/lib/dates'
import { unauthorized, badRequest, notFound, forbidden, tooManyRequests, serverError } from '@/lib/api-utils'
import { RATE_LIMIT_WINDOW_MS } from '@/lib/constants'

const WRITE_LIMIT = 5

export async function DELETE(request: NextRequest) {
  try {
    const ip = getClientIP(request)
    const { success } = rateLimit(`alumno-cancelar:${ip}`, WRITE_LIMIT, RATE_LIMIT_WINDOW_MS)
    if (!success) {
      return tooManyRequests()
    }

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

    const { searchParams } = new URL(request.url)
    const claseId = searchParams.get('id')

    if (!claseId) {
      return badRequest('ID de clase requerido')
    }

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
      return notFound('Clase no encontrada')
    }

    const ahora = new Date()
    const fechaClase = new Date(clase.fecha)
    const fechaStr = fechaClase.toISOString().split('T')[0]
    const fechaHoraUTC = argentinaToUTC(fechaStr, clase.horaInicio)

    if (fechaHoraUTC < ahora) {
      return badRequest('No se puede cancelar una clase pasada')
    }

    // Cancel: mark as cancelled, keep alumnoId for history
    // Capacity is freed because occupied count excludes cancelled classes
    await prisma.clase.update({
      where: { id: claseId },
      data: { estado: 'cancelada' }
    })

    return NextResponse.json({ success: true, message: 'Clase cancelada correctamente' })
  } catch (error) {
    return serverError(error)
  }
}
