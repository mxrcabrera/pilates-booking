import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { addWeeks } from 'date-fns'
import { auth } from '@/lib/auth-new'
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '@/lib/google-calendar'

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
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            horasAnticipacionMinima: true,
            maxAlumnosPorClase: true,
            syncGoogleCalendar: true
          }
        })

        if (!user) {
          return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
        }

        const { alumnoId, horaInicio, horaRecurrente: horaRecurrenteInput, esClasePrueba, esRecurrente, frecuenciaSemanal: frecuenciaSemanalStr, diasSemana: diasSemanaStr, fecha: fechaStr } = data
        const horaRecurrente = horaRecurrenteInput || horaInicio
        const frecuenciaSemanal = esRecurrente ? parseInt(frecuenciaSemanalStr) : null
        const diasSemana = diasSemanaStr ? (typeof diasSemanaStr === 'string' ? JSON.parse(diasSemanaStr) : diasSemanaStr) : []

        const fecha = new Date(fechaStr + 'T12:00:00.000Z')

        // Validar que la clase sea al menos X horas en el futuro
        const [hora, minuto] = horaInicio.split(':').map(Number)
        const fechaHoraClase = new Date(fecha)
        fechaHoraClase.setUTCHours(hora - 3, minuto, 0, 0)

        const ahora = new Date()
        const tiempoMinimoAnticipacion = new Date(ahora.getTime() + user.horasAnticipacionMinima * 60 * 60 * 1000)

        if (fechaHoraClase < tiempoMinimoAnticipacion) {
          const horasTexto = user.horasAnticipacionMinima === 1 ? '1 hora' : `${user.horasAnticipacionMinima} horas`
          return NextResponse.json({ error: `Las clases deben reservarse con al menos ${horasTexto} de anticipación` }, { status: 400 })
        }

        const diaSemana = fecha.getUTCDay()

        if (diaSemana === 0 || diaSemana === 6) {
          const horaNum = parseInt(horaInicio.split(':')[0])
          const esManiana = horaNum < 12

          const horarioDisponible = await prisma.horarioDisponible.findFirst({
            where: {
              profesorId: userId,
              diaSemana,
              esManiana,
              estaActivo: true
            }
          })

          if (!horarioDisponible) {
            const nombreDia = diaSemana === 6 ? 'sábados' : 'domingos'
            const turno = esManiana ? 'mañana' : 'tarde'
            return NextResponse.json({ error: `No trabajás los ${nombreDia} por la ${turno}` }, { status: 400 })
          }

          if (horaInicio < horarioDisponible.horaInicio || horaInicio > horarioDisponible.horaFin) {
            const nombreDia = diaSemana === 6 ? 'sábado' : 'domingo'
            const turno = esManiana ? 'mañana' : 'tarde'
            return NextResponse.json({ error: `Tu horario de ${nombreDia} ${turno} es de ${horarioDisponible.horaInicio} a ${horarioDisponible.horaFin}` }, { status: 400 })
          }
        }

        const claseExistente = await prisma.clase.findFirst({
          where: {
            profesorId: userId,
            fecha,
            horaInicio,
            estado: { not: 'cancelada' }
          }
        })

        if (claseExistente) {
          return NextResponse.json({ error: 'Ya tenés una clase reservada en ese horario' }, { status: 400 })
        }

        const clasesEnMismoHorario = await prisma.clase.count({
          where: {
            profesorId: userId,
            fecha,
            horaInicio,
            estado: { not: 'cancelada' }
          }
        })

        if (clasesEnMismoHorario >= user.maxAlumnosPorClase) {
          return NextResponse.json({ error: `Esta clase ya alcanzó el máximo de ${user.maxAlumnosPorClase} alumnos` }, { status: 400 })
        }

        const claseCreada = await prisma.clase.create({
          data: {
            profesorId: userId,
            alumnoId: alumnoId || null,
            fecha,
            horaInicio,
            horaRecurrente: horaRecurrente !== horaInicio ? horaRecurrente : null,
            esClasePrueba,
            esRecurrente,
            frecuenciaSemanal,
            diasSemana,
            estado: 'reservada'
          }
        })

        // Sincronizar con Google Calendar si está activado
        if (user.syncGoogleCalendar) {
          try {
            const session = await auth()
            if (session && (session as any).accessToken) {
              const eventId = await createCalendarEvent(
                claseCreada.id,
                (session as any).accessToken,
                (session as any).refreshToken
              )

              await prisma.clase.update({
                where: { id: claseCreada.id },
                data: { googleEventId: eventId }
              })
            }
          } catch (error) {
            console.error('Error al sincronizar con Google Calendar:', error)
          }
        }

        // Crear clases recurrentes
        if (esRecurrente && diasSemana.length > 0) {
          const clasesACrear: any[] = []
          const diaInicialSeleccionado = fecha.getUTCDay()

          for (const diaSeleccionado of diasSemana) {
            let diasHastaProximoDia = diaSeleccionado - diaInicialSeleccionado
            if (diasHastaProximoDia <= 0) diasHastaProximoDia += 7

            const primeraOcurrencia = new Date(fecha)
            primeraOcurrencia.setUTCDate(fecha.getUTCDate() + diasHastaProximoDia)

            for (let i = 0; i < 8; i++) {
              const fechaClase = addWeeks(primeraOcurrencia, i)

              clasesACrear.push({
                profesorId: userId,
                alumnoId: alumnoId || null,
                fecha: fechaClase,
                horaInicio: horaRecurrente,
                horaRecurrente: horaRecurrente !== horaInicio ? horaRecurrente : null,
                esClasePrueba,
                esRecurrente: true,
                frecuenciaSemanal,
                diasSemana,
                estado: 'reservada'
              })
            }
          }

          if (clasesACrear.length > 0) {
            await prisma.clase.createMany({
              data: clasesACrear,
              skipDuplicates: true
            })
          }
        }

        return NextResponse.json({ success: true })
      }

      case 'update': {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            horasAnticipacionMinima: true,
            maxAlumnosPorClase: true,
            syncGoogleCalendar: true
          }
        })

        if (!user) {
          return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
        }

        const { id, alumnoId, horaInicio, horaRecurrente: horaRecurrenteInput, estado, esClasePrueba, esRecurrente, frecuenciaSemanal: frecuenciaSemanalStr, diasSemana: diasSemanaStr, fecha: fechaStr } = data
        const horaRecurrente = horaRecurrenteInput || horaInicio
        const frecuenciaSemanal = esRecurrente ? parseInt(frecuenciaSemanalStr) : null
        const diasSemana = diasSemanaStr ? (typeof diasSemanaStr === 'string' ? JSON.parse(diasSemanaStr) : diasSemanaStr) : []

        const fecha = new Date(fechaStr + 'T12:00:00.000Z')

        // Validar que la clase sea al menos X horas en el futuro
        const [hora, minuto] = horaInicio.split(':').map(Number)
        const fechaHoraClase = new Date(fecha)
        fechaHoraClase.setUTCHours(hora - 3, minuto, 0, 0)

        const ahora = new Date()
        const tiempoMinimoAnticipacion = new Date(ahora.getTime() + user.horasAnticipacionMinima * 60 * 60 * 1000)

        if (fechaHoraClase < tiempoMinimoAnticipacion) {
          const horasTexto = user.horasAnticipacionMinima === 1 ? '1 hora' : `${user.horasAnticipacionMinima} horas`
          return NextResponse.json({ error: `Las clases deben modificarse con al menos ${horasTexto} de anticipación` }, { status: 400 })
        }

        const diaSemana = fecha.getUTCDay()

        if (diaSemana === 0 || diaSemana === 6) {
          const horaNum = parseInt(horaInicio.split(':')[0])
          const esManiana = horaNum < 12

          const horarioDisponible = await prisma.horarioDisponible.findFirst({
            where: {
              profesorId: userId,
              diaSemana,
              esManiana,
              estaActivo: true
            }
          })

          if (!horarioDisponible) {
            const nombreDia = diaSemana === 6 ? 'sábados' : 'domingos'
            const turno = esManiana ? 'mañana' : 'tarde'
            return NextResponse.json({ error: `No trabajás los ${nombreDia} por la ${turno}` }, { status: 400 })
          }

          if (horaInicio < horarioDisponible.horaInicio || horaInicio > horarioDisponible.horaFin) {
            const nombreDia = diaSemana === 6 ? 'sábado' : 'domingo'
            const turno = esManiana ? 'mañana' : 'tarde'
            return NextResponse.json({ error: `Tu horario de ${nombreDia} ${turno} es de ${horarioDisponible.horaInicio} a ${horarioDisponible.horaFin}` }, { status: 400 })
          }
        }

        const claseExistente = await prisma.clase.findFirst({
          where: {
            profesorId: userId,
            fecha,
            horaInicio,
            estado: { not: 'cancelada' },
            id: { not: id }
          }
        })

        if (claseExistente) {
          return NextResponse.json({ error: 'Ya tenés otra clase reservada en ese horario' }, { status: 400 })
        }

        const clasesEnMismoHorario = await prisma.clase.count({
          where: {
            profesorId: userId,
            fecha,
            horaInicio,
            estado: { not: 'cancelada' },
            id: { not: id }
          }
        })

        if (clasesEnMismoHorario >= user.maxAlumnosPorClase) {
          return NextResponse.json({ error: `Esta clase ya alcanzó el máximo de ${user.maxAlumnosPorClase} alumnos` }, { status: 400 })
        }

        const claseActualizada = await prisma.clase.update({
          where: { id },
          data: {
            alumnoId: alumnoId || null,
            fecha,
            horaInicio,
            horaRecurrente: horaRecurrente !== horaInicio ? horaRecurrente : null,
            estado,
            esClasePrueba,
            esRecurrente,
            frecuenciaSemanal,
            diasSemana
          }
        })

        // Sincronizar con Google Calendar
        if (user.syncGoogleCalendar && claseActualizada.googleEventId) {
          try {
            const session = await auth()
            if (session && (session as any).accessToken) {
              await updateCalendarEvent(
                claseActualizada.id,
                claseActualizada.googleEventId,
                (session as any).accessToken,
                (session as any).refreshToken
              )
            }
          } catch (error) {
            console.error('Error al actualizar en Google Calendar:', error)
          }
        } else if (user.syncGoogleCalendar && !claseActualizada.googleEventId) {
          try {
            const session = await auth()
            if (session && (session as any).accessToken) {
              const eventId = await createCalendarEvent(
                claseActualizada.id,
                (session as any).accessToken,
                (session as any).refreshToken
              )
              await prisma.clase.update({
                where: { id: claseActualizada.id },
                data: { googleEventId: eventId }
              })
            }
          } catch (error) {
            console.error('Error al crear evento en Google Calendar:', error)
          }
        }

        return NextResponse.json({ success: true })
      }

      case 'delete': {
        const { id } = data

        const clase = await prisma.clase.findUnique({
          where: { id },
          select: { googleEventId: true }
        })

        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { syncGoogleCalendar: true }
        })

        await prisma.clase.delete({ where: { id } })

        if (user?.syncGoogleCalendar && clase?.googleEventId) {
          try {
            const session = await auth()
            if (session && (session as any).accessToken) {
              await deleteCalendarEvent(
                clase.googleEventId,
                (session as any).accessToken,
                (session as any).refreshToken
              )
            }
          } catch (error) {
            console.error('Error al eliminar de Google Calendar:', error)
          }
        }

        return NextResponse.json({ success: true })
      }

      case 'changeStatus': {
        const { id, estado } = data

        await prisma.clase.update({
          where: { id },
          data: { estado }
        })

        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Clases API error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
