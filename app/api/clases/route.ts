import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-utils'
import { addWeeks } from 'date-fns'
import { auth } from '@/lib/auth'
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '@/lib/google-calendar'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const userId = await getCurrentUser()
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const hoy = new Date()
    const inicioRango = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
    const finRango = new Date(hoy.getFullYear(), hoy.getMonth() + 2, 0)

    // UNA SOLA query para obtener user + counts para preferences check
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        espacioCompartidoId: true,
        horarioMananaInicio: true,
        horarioMananaFin: true,
        horarioTardeInicio: true,
        horarioTardeFin: true,
        _count: {
          select: {
            horariosDisponibles: true,
            packs: true,
            alumnos: true
          }
        }
      }
    })

    // Check preferences inline (sin query adicional)
    const missingFields: string[] = []
    if (!user || user._count.packs === 0) missingFields.push('Al menos un Pack')
    if (!user || user._count.horariosDisponibles === 0) missingFields.push('Al menos un Horario')
    if (!user || user._count.alumnos === 0) missingFields.push('Al menos un Alumno')

    if (missingFields.length > 0) {
      return NextResponse.json({
        preferencesIncomplete: true,
        missingFields
      })
    }

    // Obtener profesorIds (query condicional solo si tiene espacio compartido)
    let profesorIds = [userId]
    if (user.espacioCompartidoId) {
      const usuariosEnEspacio = await prisma.user.findMany({
        where: { espacioCompartidoId: user.espacioCompartidoId },
        select: { id: true }
      })
      profesorIds = usuariosEnEspacio.map(p => p.id)
    }

    // Queries de datos en paralelo
    const [clases, alumnos] = await Promise.all([
      prisma.clase.findMany({
        where: {
          profesorId: { in: profesorIds },
          fecha: { gte: inicioRango, lte: finRango }
        },
        select: {
          id: true,
          fecha: true,
          horaInicio: true,
          horaRecurrente: true,
          estado: true,
          esClasePrueba: true,
          esRecurrente: true,
          frecuenciaSemanal: true,
          diasSemana: true,
          profesorId: true,
          alumnoId: true,
          alumno: { select: { id: true, nombre: true } },
          profesor: { select: { id: true, nombre: true } }
        },
        orderBy: { horaInicio: 'asc' }
      }),
      prisma.alumno.findMany({
        where: { profesorId: userId, estaActivo: true },
        select: { id: true, nombre: true },
        orderBy: { nombre: 'asc' }
      })
    ])

    const clasesNormalizadas = clases.map(clase => ({
      ...clase,
      fecha: new Date(clase.fecha.getTime() + clase.fecha.getTimezoneOffset() * 60000).toISOString()
    }))

    return NextResponse.json({
      clases: clasesNormalizadas,
      alumnos,
      currentUserId: userId,
      horarioMananaInicio: user.horarioMananaInicio || '08:00',
      horarioMananaFin: user.horarioMananaFin || '14:00',
      horarioTardeInicio: user.horarioTardeInicio || '17:00',
      horarioTardeFin: user.horarioTardeFin || '22:00'
    })
  } catch (error: any) {
    console.error('Clases GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

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
            syncGoogleCalendar: true,
            horarioMananaInicio: true,
            horarioMananaFin: true,
            horarioTardeInicio: true,
            horarioTardeFin: true
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
        fechaHoraClase.setHours(hora, minuto, 0, 0)

        const ahora = new Date()
        const tiempoMinimoAnticipacion = new Date(ahora.getTime() + user.horasAnticipacionMinima * 60 * 60 * 1000)

        if (fechaHoraClase < tiempoMinimoAnticipacion) {
          const horasTexto = user.horasAnticipacionMinima === 1 ? '1 hora' : `${user.horasAnticipacionMinima} horas`
          return NextResponse.json({ error: `Las clases deben reservarse con al menos ${horasTexto} de anticipación` }, { status: 400 })
        }

        // Validar horario contra configuración del profesor
        // Usar el inicio del horario de tarde para determinar si es mañana o tarde
        const horaTardeInicio = parseInt(user.horarioTardeInicio.split(':')[0])
        const horaNum = parseInt(horaInicio.split(':')[0])
        const esManiana = horaNum < horaTardeInicio

        const horarioInicio = esManiana ? user.horarioMananaInicio : user.horarioTardeInicio
        const horarioFin = esManiana ? user.horarioMananaFin : user.horarioTardeFin

        if (horaInicio < horarioInicio || horaInicio > horarioFin) {
          const turno = esManiana ? 'mañana' : 'tarde'
          return NextResponse.json({
            error: `El horario de ${turno} configurado es de ${horarioInicio} a ${horarioFin}`
          }, { status: 400 })
        }

        const diaSemana = fecha.getUTCDay()

        if (diaSemana === 0 || diaSemana === 6) {
          const horaNum = parseInt(horaInicio.split(':')[0])
          const esManiana = horaNum < horaTardeInicio

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

        // Validar cantidad de clases en el mismo horario (una sola query)
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
          },
          include: {
            alumno: { select: { id: true, nombre: true } },
            profesor: { select: { id: true, nombre: true } }
          }
        })

        // Sincronizar con Google Calendar en background (fire-and-forget)
        if (user.syncGoogleCalendar) {
          auth().then(session => {
            if (session && (session as any).accessToken) {
              createCalendarEvent(
                claseCreada.id,
                (session as any).accessToken,
                (session as any).refreshToken
              ).then(eventId => {
                prisma.clase.update({
                  where: { id: claseCreada.id },
                  data: { googleEventId: eventId }
                }).catch(err => console.error('Error guardando eventId:', err))
              }).catch(err => console.error('Error creando evento en Google Calendar:', err))
            }
          }).catch(err => console.error('Error obteniendo sesión:', err))
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

        return NextResponse.json({ success: true, clase: claseCreada })
      }

      case 'update': {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            horasAnticipacionMinima: true,
            maxAlumnosPorClase: true,
            syncGoogleCalendar: true,
            horarioMananaInicio: true,
            horarioMananaFin: true,
            horarioTardeInicio: true,
            horarioTardeFin: true
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
        fechaHoraClase.setHours(hora, minuto, 0, 0)

        const ahora = new Date()
        const tiempoMinimoAnticipacion = new Date(ahora.getTime() + user.horasAnticipacionMinima * 60 * 60 * 1000)

        if (fechaHoraClase < tiempoMinimoAnticipacion) {
          const horasTexto = user.horasAnticipacionMinima === 1 ? '1 hora' : `${user.horasAnticipacionMinima} horas`
          return NextResponse.json({ error: `Las clases deben modificarse con al menos ${horasTexto} de anticipación` }, { status: 400 })
        }

        // Validar horario contra configuración del profesor
        // Usar el inicio del horario de tarde para determinar si es mañana o tarde
        const horaTardeInicio = parseInt(user.horarioTardeInicio.split(':')[0])
        const horaNum = parseInt(horaInicio.split(':')[0])
        const esManiana = horaNum < horaTardeInicio

        const horarioInicio = esManiana ? user.horarioMananaInicio : user.horarioTardeInicio
        const horarioFin = esManiana ? user.horarioMananaFin : user.horarioTardeFin

        if (horaInicio < horarioInicio || horaInicio > horarioFin) {
          const turno = esManiana ? 'mañana' : 'tarde'
          return NextResponse.json({
            error: `El horario de ${turno} configurado es de ${horarioInicio} a ${horarioFin}`
          }, { status: 400 })
        }

        const diaSemana = fecha.getUTCDay()

        if (diaSemana === 0 || diaSemana === 6) {
          const horaNum = parseInt(horaInicio.split(':')[0])
          const esManiana = horaNum < horaTardeInicio

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

        // Validar cantidad de clases en el mismo horario (una sola query)
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
          },
          include: {
            alumno: { select: { id: true, nombre: true } },
            profesor: { select: { id: true, nombre: true } }
          }
        })

        // Sincronizar con Google Calendar en background (fire-and-forget)
        if (user.syncGoogleCalendar && claseActualizada.googleEventId) {
          auth().then(session => {
            if (session && (session as any).accessToken) {
              updateCalendarEvent(
                claseActualizada.id,
                claseActualizada.googleEventId!,
                (session as any).accessToken,
                (session as any).refreshToken
              ).catch(err => console.error('Error actualizando evento en Google Calendar:', err))
            }
          }).catch(err => console.error('Error obteniendo sesión:', err))
        } else if (user.syncGoogleCalendar && !claseActualizada.googleEventId) {
          auth().then(session => {
            if (session && (session as any).accessToken) {
              createCalendarEvent(
                claseActualizada.id,
                (session as any).accessToken,
                (session as any).refreshToken
              ).then(eventId => {
                prisma.clase.update({
                  where: { id: claseActualizada.id },
                  data: { googleEventId: eventId }
                }).catch(err => console.error('Error guardando eventId:', err))
              }).catch(err => console.error('Error creando evento en Google Calendar:', err))
            }
          }).catch(err => console.error('Error obteniendo sesión:', err))
        }

        return NextResponse.json({ success: true, clase: claseActualizada })
      }

      case 'delete': {
        const { id } = data

        // Obtener datos antes de borrar para sync en background
        const [clase, user] = await Promise.all([
          prisma.clase.findUnique({
            where: { id },
            select: { googleEventId: true }
          }),
          prisma.user.findUnique({
            where: { id: userId },
            select: { syncGoogleCalendar: true }
          })
        ])

        await prisma.clase.delete({ where: { id } })

        // Sincronizar con Google Calendar en background (fire-and-forget)
        if (user?.syncGoogleCalendar && clase?.googleEventId) {
          auth().then(session => {
            if (session && (session as any).accessToken) {
              deleteCalendarEvent(
                clase.googleEventId!,
                (session as any).accessToken,
                (session as any).refreshToken
              ).catch(err => console.error('Error eliminando evento de Google Calendar:', err))
            }
          }).catch(err => console.error('Error obteniendo sesión:', err))
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
