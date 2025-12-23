import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET /api/portal/[slug]/disponibilidad?fecha=2024-01-15
// Devuelve los horarios disponibles para una fecha específica
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const fechaParam = searchParams.get('fecha')

    if (!fechaParam) {
      return NextResponse.json(
        { error: 'Fecha requerida' },
        { status: 400 }
      )
    }

    // Validar formato de fecha
    const fecha = new Date(fechaParam + 'T00:00:00')
    if (isNaN(fecha.getTime())) {
      return NextResponse.json(
        { error: 'Formato de fecha inválido' },
        { status: 400 }
      )
    }

    // Obtener profesor
    const profesor = await prisma.user.findFirst({
      where: {
        slug,
        portalActivo: true,
        role: 'PROFESOR'
      },
      select: {
        id: true,
        horasAnticipacionMinima: true,
        maxAlumnosPorClase: true,
        horarioMananaInicio: true,
        horarioMananaFin: true,
        turnoMananaActivo: true,
        horarioTardeInicio: true,
        horarioTardeFin: true,
        turnoTardeActivo: true,
        horariosDisponibles: {
          where: {
            deletedAt: null,
            estaActivo: true,
            diaSemana: fecha.getDay()
          },
          select: {
            horaInicio: true,
            horaFin: true,
            esManiana: true
          }
        }
      }
    })

    if (!profesor) {
      return NextResponse.json(
        { error: 'Profesor no encontrado' },
        { status: 404 }
      )
    }

    // Obtener clases existentes para esa fecha
    const clasesExistentes = await prisma.clase.findMany({
      where: {
        profesorId: profesor.id,
        fecha: fecha,
        deletedAt: null,
        estado: { not: 'cancelada' }
      },
      select: {
        horaInicio: true
      }
    })

    // Contar cuántas reservas hay por cada horario
    const reservasPorHora: Record<string, number> = {}
    clasesExistentes.forEach(clase => {
      reservasPorHora[clase.horaInicio] = (reservasPorHora[clase.horaInicio] || 0) + 1
    })

    // Calcular hora mínima permitida (anticipación)
    const ahora = new Date()
    const horaMinima = new Date(ahora.getTime() + profesor.horasAnticipacionMinima * 60 * 60 * 1000)

    // Si la fecha es hoy, filtrar horarios pasados
    const esHoy = fecha.toDateString() === ahora.toDateString()

    // Generar slots disponibles basados en horarios del profesor
    const slotsDisponibles: Array<{
      hora: string
      disponible: boolean
      ocupados: number
      maxAlumnos: number
    }> = []

    // Función para generar slots de un rango horario
    const generarSlots = (horaInicio: string, horaFin: string) => {
      const [hiH, hiM] = horaInicio.split(':').map(Number)
      const [hfH, hfM] = horaFin.split(':').map(Number)

      let current = hiH * 60 + hiM
      const end = hfH * 60 + hfM

      while (current < end) {
        const hora = `${Math.floor(current / 60).toString().padStart(2, '0')}:${(current % 60).toString().padStart(2, '0')}`
        const ocupados = reservasPorHora[hora] || 0

        // Verificar si el horario está dentro de la anticipación mínima
        let disponible = ocupados < profesor.maxAlumnosPorClase

        if (esHoy && disponible) {
          const [h, m] = hora.split(':').map(Number)
          const slotTime = new Date(fecha)
          slotTime.setHours(h, m, 0, 0)
          disponible = slotTime > horaMinima
        }

        // Verificar si la fecha ya pasó
        if (fecha < new Date(ahora.toDateString())) {
          disponible = false
        }

        slotsDisponibles.push({
          hora,
          disponible,
          ocupados,
          maxAlumnos: profesor.maxAlumnosPorClase
        })

        current += 60 // Slots de 1 hora
      }
    }

    // Si hay horarios específicos configurados, usarlos
    if (profesor.horariosDisponibles.length > 0) {
      profesor.horariosDisponibles.forEach(h => {
        generarSlots(h.horaInicio, h.horaFin)
      })
    } else {
      // Usar horarios por defecto del profesor
      if (profesor.turnoMananaActivo) {
        generarSlots(profesor.horarioMananaInicio, profesor.horarioMananaFin)
      }
      if (profesor.turnoTardeActivo) {
        generarSlots(profesor.horarioTardeInicio, profesor.horarioTardeFin)
      }
    }

    // Ordenar por hora
    slotsDisponibles.sort((a, b) => a.hora.localeCompare(b.hora))

    return NextResponse.json({
      fecha: fechaParam,
      diaSemana: fecha.getDay(),
      slots: slotsDisponibles
    })
  } catch (error) {
    console.error('Error fetching disponibilidad:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
