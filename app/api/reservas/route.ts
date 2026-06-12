import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserContext } from '@/lib/auth'
import {
  crearReserva,
  cancelarReserva,
  obtenerReservasAlumno,
  obtenerReservasEstudio,
  InsufficientCapacityError,
  ClassNotFoundError,
  DuplicateReservationError,
} from '@/lib/booking-service'
import { validarPlanAlumno } from '@/lib/booking-validation'
import { unauthorized, badRequest, conflict, serverError } from '@/lib/api-utils'
import { z } from 'zod'

export const runtime = 'nodejs'

// Schema para validar creación de reserva
const createReservationSchema = z.object({
  claseId: z.string().min(1, 'Clase ID es requerido'),
})

// Schema para validar cancelación de reserva
const cancelReservationSchema = z.object({
  claseId: z.string().min(1, 'Clase ID es requerido'),
})

/**
 * POST - Crear una reserva
 */
export async function POST(request: NextRequest) {
  try {
    const context = await getUserContext()
    if (!context) {
      return unauthorized()
    }

    const { userId, estudio } = context
    const body = await request.json()
    const parsed = createReservationSchema.safeParse(body)

    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message)
    }

    const { claseId } = parsed.data

    // Si es alumno, usar su propio alumnoId
    // Si es profesor/owner, el body debe incluir alumnoId
    let alumnoId: string

    // Verificar si el usuario es un alumno (buscando en modelo Alumno)
    const alumno = await prisma.alumno.findFirst({
      where: { userId, deletedAt: null },
    })

    if (alumno) {
      // Es un alumno, usar su propio alumnoId
      alumnoId = alumno.id
    } else {
      // Es profesor/owner, el body debe incluir alumnoId
      const { alumnoId: bodyAlumnoId } = body
      if (!bodyAlumnoId) {
        return badRequest('alumnoId es requerido para profesores/owners')
      }
      alumnoId = bodyAlumnoId
    }

    // Determinar estudioId
    const estudioId = estudio?.estudioId || body.estudioId
    if (!estudioId) {
      return badRequest('estudioId es requerido')
    }

    // Validar plan activo del alumno
    const planValido = await validarPlanAlumno(alumnoId, estudioId)
    if (!planValido.activo) {
      return NextResponse.json({ error: planValido.motivo }, { status: 403 })
    }

    // Crear la reserva usando el servicio
    const reserva = await crearReserva(estudioId, alumnoId, claseId)

    return NextResponse.json({
      success: true,
      reserva: {
        id: reserva.id,
        claseId: reserva.id,
        alumnoId: reserva.alumnoId,
        fecha: reserva.fecha,
        horaInicio: reserva.horaInicio,
        estado: reserva.estado,
      },
    })
  } catch (error) {
    if (error instanceof InsufficientCapacityError) {
      return conflict(error.message)
    }
    if (error instanceof ClassNotFoundError) {
      return badRequest(error.message)
    }
    if (error instanceof DuplicateReservationError) {
      return conflict(error.message)
    }
    console.error('Error creating reservation:', error)
    return serverError(error)
  }
}

/**
 * GET - Obtener reservas
 * - Si es alumno: retorna sus propias reservas
 * - Si es profesor/owner: retorna todas las reservas del estudio
 */
export async function GET(request: NextRequest) {
  try {
    const context = await getUserContext()
    if (!context) {
      return unauthorized()
    }

    const { userId, estudio } = context
    const { searchParams } = new URL(request.url)
    const fechaParam = searchParams.get('fecha')

    let reservas

    // Verificar si el usuario es un alumno
    const alumno = await prisma.alumno.findFirst({
      where: { userId, deletedAt: null },
    })

    if (alumno) {
      // Alumno: obtener sus propias reservas
      const estudioId = alumno.estudioId || estudio?.estudioId
      if (!estudioId) {
        return badRequest('No se pudo determinar el estudio')
      }

      reservas = await obtenerReservasAlumno(estudioId, alumno.id)
    } else {
      // Profesor/owner: obtener todas las reservas del estudio
      const estudioId = estudio?.estudioId
      if (!estudioId) {
        return badRequest('No se pudo determinar el estudio')
      }

      const fecha = fechaParam ? new Date(fechaParam) : undefined
      reservas = await obtenerReservasEstudio(estudioId, fecha)
    }

    return NextResponse.json({
      success: true,
      reservas,
    })
  } catch (error) {
    console.error('Error fetching reservations:', error)
    return serverError(error)
  }
}

/**
 * DELETE - Cancelar una reserva
 */
export async function DELETE(request: NextRequest) {
  try {
    const context = await getUserContext()
    if (!context) {
      return unauthorized()
    }

    const { userId, estudio } = context
    const body = await request.json()
    const parsed = cancelReservationSchema.safeParse(body)

    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message)
    }

    const { claseId } = parsed.data

    // Si es alumno, usar su propio alumnoId
    // Si es profesor/owner, el body debe incluir alumnoId
    let alumnoId: string

    // Verificar si el usuario es un alumno
    const alumno = await prisma.alumno.findFirst({
      where: { userId, deletedAt: null },
    })

    if (alumno) {
      // Es un alumno, usar su propio alumnoId
      alumnoId = alumno.id
    } else {
      // Es profesor/owner, el body debe incluir alumnoId
      const { alumnoId: bodyAlumnoId } = body
      if (!bodyAlumnoId) {
        return badRequest('alumnoId es requerido para profesores/owners')
      }
      alumnoId = bodyAlumnoId
    }

    const estudioId = estudio?.estudioId || body.estudioId
    if (!estudioId) {
      return badRequest('estudioId es requerido')
    }

    const reserva = await cancelarReserva(estudioId, alumnoId, claseId)

    return NextResponse.json({
      success: true,
      message: 'Reserva cancelada correctamente',
      reserva: {
        id: reserva.id,
        claseId: reserva.id,
        alumnoId: reserva.alumnoId,
      },
    })
  } catch (error) {
    console.error('Error canceling reservation:', error)
    return serverError(error)
  }
}
