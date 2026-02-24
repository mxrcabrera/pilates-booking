import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { getNowArgentinaHour } from '@/lib/dates'

const WEEKS_AHEAD = 4
const MS_PER_DAY = 86400000

interface SlotInfo {
  fecha: string
  horaInicio: string
  profesorId: string
  profesorNombre: string
  available: number
  total: number
  isBooked: boolean
}

function generateHourlySlots(horaInicio: string, horaFin: string): string[] {
  const startH = parseInt(horaInicio.split(':')[0])
  const endH = parseInt(horaFin.split(':')[0])
  const hours: string[] = []
  for (let h = startH; h < endH; h++) {
    hours.push(`${String(h).padStart(2, '0')}:00`)
  }
  return hours
}

export async function GET(request: NextRequest) {
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

    // Find alumno by userId only (no profesorId filter)
    const alumno = await prisma.alumno.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true, nombre: true, packType: true, estudioId: true, profesorId: true }
    })

    if (!alumno) {
      return NextResponse.json({ error: 'No estas vinculado a ningun profesor' }, { status: 403 })
    }

    // Determine ownerFilter from alumno record
    const ownerFilter = alumno.estudioId
      ? { estudioId: alumno.estudioId }
      : alumno.profesorId
        ? { profesorId: alumno.profesorId }
        : null

    if (!ownerFilter) {
      return NextResponse.json({ error: 'Alumno sin vinculacion valida' }, { status: 500 })
    }

    let clasesPorSemana: number | null = null
    if (alumno.packType && alumno.packType !== 'por_clase') {
      const pack = await prisma.pack.findFirst({
        where: { id: alumno.packType, deletedAt: null },
        select: { clasesPorSemana: true }
      })
      if (pack) clasesPorSemana = pack.clasesPorSemana
    }

    const config = alumno.estudioId
      ? await prisma.estudio.findUnique({
          where: { id: alumno.estudioId },
          select: { maxAlumnosPorClase: true }
        })
      : await prisma.user.findUnique({
          where: { id: alumno.profesorId! },
          select: { maxAlumnosPorClase: true }
        })

    const maxCapacity = config?.maxAlumnosPorClase ?? 4

    const now = new Date()
    const nowArgHour = getNowArgentinaHour()
    const today = new Date(now)
    today.setUTCHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]
    const endDate = new Date(today.getTime() + WEEKS_AHEAD * 7 * MS_PER_DAY)

    const [horarios, fechasBloqueadas, clasesInRange] = await Promise.all([
      prisma.horarioDisponible.findMany({
        where: { ...ownerFilter, estaActivo: true, deletedAt: null },
        select: { profesorId: true, diaSemana: true, horaInicio: true, horaFin: true }
      }),
      prisma.fechaBloqueada.findMany({
        where: { ...ownerFilter, fecha: { gte: today, lte: endDate } },
        select: { fecha: true }
      }),
      prisma.clase.findMany({
        where: {
          ...ownerFilter,
          fecha: { gte: today, lte: endDate },
          estado: { not: 'cancelada' },
          deletedAt: null
        },
        select: { fecha: true, horaInicio: true, alumnoId: true, profesorId: true }
      })
    ])

    const blockedSet = new Set(
      fechasBloqueadas.map(f => f.fecha.toISOString().split('T')[0])
    )

    // Get unique profesorIds from horarios
    const profesorIds = [...new Set(horarios.map(h => h.profesorId))]
    const profesores = await prisma.user.findMany({
      where: { id: { in: profesorIds } },
      select: { id: true, nombre: true }
    })
    const profesorMap = new Map(profesores.map(p => [p.id, p.nombre]))

    // Index horarios by (day, profesorId) with set of hours per profesor
    const slotsByDayAndProfesor = new Map<string, Set<string>>()
    for (const horario of horarios) {
      const key = `${horario.diaSemana}|${horario.profesorId}`
      if (!slotsByDayAndProfesor.has(key)) {
        slotsByDayAndProfesor.set(key, new Set())
      }
      const hours = generateHourlySlots(horario.horaInicio, horario.horaFin)
      for (const h of hours) {
        slotsByDayAndProfesor.get(key)!.add(h)
      }
    }

    // Index classes by "YYYY-MM-DD|HH:MM|profesorId"
    const classIndex = new Map<string, typeof clasesInRange>()
    for (const clase of clasesInRange) {
      const key = `${clase.fecha.toISOString().split('T')[0]}|${clase.horaInicio}|${clase.profesorId}`
      if (!classIndex.has(key)) classIndex.set(key, [])
      classIndex.get(key)!.push(clase)
    }

    // Generate virtual slots (one per profesor per timeslot)
    const slots: SlotInfo[] = []
    const currentDate = new Date(today)

    while (currentDate <= endDate) {
      const fechaStr = currentDate.toISOString().split('T')[0]
      const dayOfWeek = currentDate.getUTCDay()

      if (!blockedSet.has(fechaStr)) {
        // Iterate over all profesores who have horarios on this day
        for (const profesorId of profesorIds) {
          const key = `${dayOfWeek}|${profesorId}`
          const daySlots = slotsByDayAndProfesor.get(key)

          if (daySlots) {
            const sortedHours = [...daySlots].sort()

            for (const hora of sortedHours) {
              // Skip past slots for today
              if (fechaStr === todayStr) {
                const slotHour = parseInt(hora.split(':')[0])
                if (slotHour <= nowArgHour) continue
              }

              const classKey = `${fechaStr}|${hora}|${profesorId}`
              const clases = classIndex.get(classKey) || []
              const occupied = clases.filter(c => c.alumnoId !== null).length
              const available = maxCapacity - occupied
              const isBooked = clases.some(c => c.alumnoId === alumno.id)

              if (available > 0 || isBooked) {
                slots.push({
                  fecha: fechaStr,
                  horaInicio: hora,
                  profesorId,
                  profesorNombre: profesorMap.get(profesorId) || 'Desconocido',
                  available,
                  total: maxCapacity,
                  isBooked
                })
              }
            }
          }
        }
      }

      currentDate.setUTCDate(currentDate.getUTCDate() + 1)
    }

    return NextResponse.json({
      alumno: { id: alumno.id, nombre: alumno.nombre, clasesPorSemana },
      slots,
      blockedDates: [...blockedSet],
      horarios: horarios.map(h => ({
        diaSemana: h.diaSemana,
        horaInicio: h.horaInicio,
        horaFin: h.horaFin
      }))
    })
  } catch (error) {
    logger.error('Error fetching alumno slots', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}