import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'
import { argentinaToUTC } from '@/lib/dates'
import { Prisma } from '@prisma/client'

const WRITE_LIMIT = 5
const WINDOW_MS = 60 * 1000

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request)
    const { success } = rateLimit(`alumno-reservar:${ip}`, WRITE_LIMIT, WINDOW_MS)
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

    const body = await request.json()
    const { profesorId, fecha: fechaStr, horaInicio } = body

    if (!profesorId || !fechaStr || !horaInicio) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    // Validate date format
    const fecha = new Date(fechaStr + 'T00:00:00.000Z')
    if (isNaN(fecha.getTime())) {
      return NextResponse.json({ error: 'Fecha invalida' }, { status: 400 })
    }

    // Validate time format
    if (!/^\d{2}:\d{2}$/.test(horaInicio)) {
      return NextResponse.json({ error: 'Formato de hora invalido' }, { status: 400 })
    }

    // Must be in the future
    const now = new Date()
    const fechaHoraUTC = argentinaToUTC(fechaStr, horaInicio)

    if (fechaHoraUTC <= now) {
      return NextResponse.json({ error: 'No se puede reservar una clase en el pasado' }, { status: 400 })
    }

    // Get alumno profile (by userId only, profesorId now nullable)
    const alumno = await prisma.alumno.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true, packType: true, estudioId: true, profesorId: true }
    })

    if (!alumno) {
      return NextResponse.json({ error: 'No estas vinculado a ningun profesor' }, { status: 403 })
    }

    // Validate profesorId belongs to the alumno's profesor or studio
    if (alumno.profesorId && alumno.profesorId !== profesorId) {
      return NextResponse.json({ error: 'Profesor no autorizado' }, { status: 403 })
    }
    if (alumno.estudioId && !alumno.profesorId) {
      const isStudioProfesor = await prisma.estudioMiembro.findFirst({
        where: { estudioId: alumno.estudioId, userId: profesorId, deletedAt: null },
        select: { id: true }
      })
      if (!isStudioProfesor) {
        return NextResponse.json({ error: 'Profesor no pertenece a tu estudio' }, { status: 403 })
      }
    }

    // Get pack for weekly limit
    let clasesPorSemana: number | null = null
    if (alumno.packType && alumno.packType !== 'por_clase') {
      const pack = await prisma.pack.findFirst({
        where: { id: alumno.packType, deletedAt: null },
        select: { clasesPorSemana: true }
      })
      if (pack) clasesPorSemana = pack.clasesPorSemana
    }

    // Owner filter (from alumno record, not request)
    const ownerFilter = alumno.estudioId
      ? { estudioId: alumno.estudioId }
      : alumno.profesorId
        ? { profesorId: alumno.profesorId }
        : null

    if (!ownerFilter) {
      return NextResponse.json({ error: 'Alumno sin vinculacion valida' }, { status: 500 })
    }

    // Get profesor/estudio config
    const config = alumno.estudioId
      ? await prisma.estudio.findUnique({
          where: { id: alumno.estudioId },
          select: { maxAlumnosPorClase: true, horasAnticipacionMinima: true }
        })
      : await prisma.user.findUnique({
          where: { id: profesorId },
          select: { maxAlumnosPorClase: true, horasAnticipacionMinima: true }
        })

    const maxCapacity = config?.maxAlumnosPorClase ?? 4
    const horasAnticipacion = config?.horasAnticipacionMinima ?? 1

    // Validate anticipation time
    const minTime = new Date(now.getTime() + horasAnticipacion * 3600000)
    if (fechaHoraUTC < minTime) {
      return NextResponse.json({
        error: `Debes reservar con al menos ${horasAnticipacion} hora(s) de anticipacion`
      }, { status: 400 })
    }

    // Check blocked date
    const isBlocked = await prisma.fechaBloqueada.findFirst({
      where: { ...ownerFilter, fecha }
    })
    if (isBlocked) {
      return NextResponse.json({ error: 'Esta fecha esta bloqueada' }, { status: 400 })
    }

    // Validate slot exists within a HorarioDisponible range AND profesorId matches
    const diaSemana = fecha.getUTCDay()
    const horaNum = parseInt(horaInicio.split(':')[0])
    const horariosDelDia = await prisma.horarioDisponible.findMany({
      where: { ...ownerFilter, diaSemana, estaActivo: true, deletedAt: null },
      select: { profesorId: true, horaInicio: true, horaFin: true }
    })

    const matchingHorario = horariosDelDia.find(h => {
      const start = parseInt(h.horaInicio.split(':')[0])
      const end = parseInt(h.horaFin.split(':')[0])
      return horaNum >= start && horaNum < end && h.profesorId === profesorId
    })

    if (!matchingHorario) {
      return NextResponse.json({ error: 'Este horario no esta disponible' }, { status: 400 })
    }

    // Serializable transaction for concurrency safety
    const result = await prisma.$transaction(async (tx) => {
      const occupied = await tx.clase.count({
        where: {
          ...ownerFilter,
          fecha,
          horaInicio,
          alumnoId: { not: null },
          estado: { not: 'cancelada' },
          deletedAt: null
        }
      })

      if (occupied >= maxCapacity) {
        throw new Error('SLOT_FULL')
      }

      // Check if alumno already booked at this slot
      const alreadyBooked = await tx.clase.findFirst({
        where: {
          ...ownerFilter,
          fecha,
          horaInicio,
          alumnoId: alumno.id,
          estado: { not: 'cancelada' },
          deletedAt: null
        }
      })

      if (alreadyBooked) {
        throw new Error('ALREADY_BOOKED')
      }

      // Check weekly class limit (if pack-based)
      if (clasesPorSemana) {
        const dayOfWeek = fecha.getUTCDay()
        const monday = new Date(fecha)
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
        monday.setUTCDate(fecha.getUTCDate() + diff)
        monday.setUTCHours(0, 0, 0, 0)

        const sunday = new Date(monday)
        sunday.setUTCDate(monday.getUTCDate() + 6)
        sunday.setUTCHours(23, 59, 59, 999)

        const weeklyCount = await tx.clase.count({
          where: {
            ...ownerFilter,
            alumnoId: alumno.id,
            fecha: { gte: monday, lte: sunday },
            estado: { not: 'cancelada' },
            deletedAt: null
          }
        })

        if (weeklyCount >= clasesPorSemana) {
          throw new Error('WEEKLY_LIMIT')
        }
      }

      return tx.clase.create({
        data: {
          profesorId,
          ...(alumno.estudioId && { estudioId: alumno.estudioId }),
          alumnoId: alumno.id,
          fecha,
          horaInicio,
          estado: 'reservada'
        },
        select: { id: true, fecha: true, horaInicio: true }
      })
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    })

    return NextResponse.json({
      success: true,
      clase: {
        id: result.id,
        fecha: result.fecha.toISOString().split('T')[0],
        horaInicio: result.horaInicio
      }
    })
  } catch (error) {
    if (error instanceof Error) {
      const errorMap: Record<string, { message: string; status: number }> = {
        SLOT_FULL: { message: 'Este horario ya esta completo', status: 409 },
        ALREADY_BOOKED: { message: 'Ya tenes una reserva en este horario', status: 409 },
        WEEKLY_LIMIT: { message: 'Ya alcanzaste el limite de clases por semana', status: 409 }
      }

      const mapped = errorMap[error.message]
      if (mapped) {
        return NextResponse.json({ error: mapped.message }, { status: mapped.status })
      }
    }

    logger.error('Error reservando clase', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
