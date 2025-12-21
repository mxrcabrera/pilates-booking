import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { addWeeks } from 'date-fns'
import { auth } from '@/lib/auth'
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '@/lib/google-calendar'
import { calcularRangoCiclo } from '@/lib/alumno-utils'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { getPaginationParams, paginatedResponse } from '@/lib/pagination'
import { getCachedPacks, getCachedAlumnosSimple } from '@/lib/server-cache'
import { unauthorized, notFound, tooManyRequests, serverError } from '@/lib/api-utils'
import { logger } from '@/lib/logger'

// Google Calendar API responses don't have proper TypeScript types
/* eslint-disable @typescript-eslint/no-explicit-any */

export const runtime = 'nodejs'

// Rate limit: 30 requests por minuto para POST
const POST_LIMIT = 30
const WINDOW_MS = 60 * 1000

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUser()
    if (!userId) {
      return unauthorized()
    }

    const { page, limit, skip } = getPaginationParams(request)

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
        precioPorClase: true,
        maxAlumnosPorClase: true,
        horasAnticipacionMinima: true,
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
    if (!user) {
      return notFound('Usuario no encontrado')
    }

    const missingFields: string[] = []
    if (user._count.packs === 0) missingFields.push('Al menos un Pack')
    if (user._count.horariosDisponibles === 0) missingFields.push('Al menos un Horario')
    if (user._count.alumnos === 0) missingFields.push('Al menos un Alumno')

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

    // Where para clases
    const clasesWhere = {
      profesorId: { in: profesorIds },
      fecha: { gte: inicioRango, lte: finRango },
      deletedAt: null
    }

    // Queries de datos en paralelo (usando cache para packs y alumnos)
    const [clases, total, alumnos, packs] = await Promise.all([
      prisma.clase.findMany({
        where: clasesWhere,
        skip,
        take: limit,
        select: {
          id: true,
          fecha: true,
          horaInicio: true,
          horaRecurrente: true,
          estado: true,
          asistencia: true,
          esClasePrueba: true,
          esRecurrente: true,
          frecuenciaSemanal: true,
          diasSemana: true,
          profesorId: true,
          alumnoId: true,
          alumno: {
            select: {
              id: true,
              nombre: true,
              clasesPorMes: true,
              diaInicioCiclo: true
            }
          },
          profesor: { select: { id: true, nombre: true } }
        },
        orderBy: [{ fecha: 'asc' }, { horaInicio: 'asc' }]
      }),
      prisma.clase.count({ where: clasesWhere }),
      getCachedAlumnosSimple(userId),
      getCachedPacks(userId)
    ])

    // Calcular clases usadas por alumno usando su ciclo de facturación personalizado
    const now = new Date()

    // Agrupar clases por alumno con su día de ciclo
    const alumnosCiclos = new Map<string, number>()
    clases.forEach(clase => {
      if (clase.alumnoId && clase.alumno?.diaInicioCiclo) {
        alumnosCiclos.set(clase.alumnoId, clase.alumno.diaInicioCiclo)
      }
    })

    const clasesUsadasPorAlumno: Record<string, number> = {}
    clases.forEach(clase => {
      if (clase.alumnoId && (clase.estado === 'completada' || clase.estado === 'reservada')) {
        const diaInicioCiclo = alumnosCiclos.get(clase.alumnoId) || 1
        const { inicio, fin } = calcularRangoCiclo(diaInicioCiclo, now)

        if (clase.fecha >= inicio && clase.fecha <= fin) {
          clasesUsadasPorAlumno[clase.alumnoId] = (clasesUsadasPorAlumno[clase.alumnoId] || 0) + 1
        }
      }
    })

    const clasesNormalizadas = clases.map(clase => ({
      ...clase,
      fecha: clase.fecha.toISOString(),
      clasesUsadasEsteMes: clase.alumnoId ? clasesUsadasPorAlumno[clase.alumnoId] || 0 : 0
    }))

    const paginatedData = paginatedResponse(clasesNormalizadas, total, { page, limit, skip })

    return NextResponse.json({
      // Nuevo formato paginado
      ...paginatedData,
      // Compatibilidad con formato anterior
      clases: clasesNormalizadas,
      alumnos,
      packs,
      currentUserId: userId,
      horarioMananaInicio: user.horarioMananaInicio || '08:00',
      horarioMananaFin: user.horarioMananaFin || '14:00',
      horarioTardeInicio: user.horarioTardeInicio || '17:00',
      horarioTardeFin: user.horarioTardeFin || '22:00',
      precioPorClase: user.precioPorClase?.toString() || '0',
      maxAlumnosPorClase: user.maxAlumnosPorClase || 3,
      horasAnticipacionMinima: user.horasAnticipacionMinima || 1
    })
  } catch (error) {
    return serverError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIP(request)
    const { success } = rateLimit(`clases:${ip}`, POST_LIMIT, WINDOW_MS)
    if (!success) {
      return tooManyRequests()
    }

    const userId = await getCurrentUser()
    if (!userId) {
      return unauthorized()
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

        const { alumnoIds, horaInicio, horaRecurrente: horaRecurrenteInput, esClasePrueba, esRecurrente, frecuenciaSemanal: frecuenciaSemanalStr, diasSemana: diasSemanaStr, fecha: fechaStr } = data
        const horaRecurrente = horaRecurrenteInput || horaInicio
        const frecuenciaSemanal = esRecurrente ? parseInt(frecuenciaSemanalStr) : null
        const diasSemana = diasSemanaStr ? (typeof diasSemanaStr === 'string' ? JSON.parse(diasSemanaStr) : diasSemanaStr) : []

        // Asegurar que alumnoIds es un array
        const alumnosArray: string[] = Array.isArray(alumnoIds) ? alumnoIds : []

        const fecha = new Date(fechaStr + 'T00:00:00.000Z')

        // Validar que la clase sea al menos X horas en el futuro
        // Usar UTC para evitar problemas de timezone
        const [hora, minuto] = horaInicio.split(':').map(Number)
        const fechaHoraClaseUTC = new Date(Date.UTC(
          fecha.getUTCFullYear(),
          fecha.getUTCMonth(),
          fecha.getUTCDate(),
          hora - 3, // Argentina es UTC-3
          minuto
        ))

        const ahora = new Date()
        const tiempoMinimoAnticipacion = new Date(ahora.getTime() + user.horasAnticipacionMinima * 60 * 60 * 1000)

        if (fechaHoraClaseUTC < tiempoMinimoAnticipacion) {
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
              estaActivo: true,
              deletedAt: null
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

        // Validar cantidad de clases en el mismo horario
        const clasesEnMismoHorario = await prisma.clase.count({
          where: {
            profesorId: userId,
            fecha,
            horaInicio,
            estado: { not: 'cancelada' },
            deletedAt: null
          }
        })

        const espaciosDisponibles = user.maxAlumnosPorClase - clasesEnMismoHorario
        if (alumnosArray.length > espaciosDisponibles) {
          return NextResponse.json({
            error: espaciosDisponibles === 0
              ? `Esta clase ya alcanzó el máximo de ${user.maxAlumnosPorClase} alumnos`
              : `Solo hay ${espaciosDisponibles} lugar(es) disponible(s) en este horario`
          }, { status: 400 })
        }

        // Validar que todos los alumnos pertenecen al profesor
        if (alumnosArray.length > 0) {
          const alumnosValidos = await prisma.alumno.count({
            where: {
              id: { in: alumnosArray },
              profesorId: userId,
              deletedAt: null
            }
          })
          if (alumnosValidos !== alumnosArray.length) {
            return NextResponse.json({ error: 'Uno o más alumnos no son válidos' }, { status: 400 })
          }
        }

        // Crear una clase por cada alumno seleccionado
        const clasesCreadas = []
        for (const alumnoId of alumnosArray) {
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
          clasesCreadas.push(claseCreada)

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
                  }).catch(err => logger.error('Error guardando eventId', err))
                }).catch(err => logger.error('Error creando evento en Google Calendar', err))
              }
            }).catch(err => logger.error('Error obteniendo sesión', err))
          }

          // Crear clases recurrentes para este alumno
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
        }

        return NextResponse.json({ success: true, clases: clasesCreadas })
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

        const fecha = new Date(fechaStr + 'T00:00:00.000Z')

        // Validar que la clase sea al menos X horas en el futuro
        // Usar UTC para evitar problemas de timezone
        const [hora, minuto] = horaInicio.split(':').map(Number)
        const fechaHoraClaseUTC = new Date(Date.UTC(
          fecha.getUTCFullYear(),
          fecha.getUTCMonth(),
          fecha.getUTCDate(),
          hora - 3, // Argentina es UTC-3
          minuto
        ))

        const ahora = new Date()
        const tiempoMinimoAnticipacion = new Date(ahora.getTime() + user.horasAnticipacionMinima * 60 * 60 * 1000)

        if (fechaHoraClaseUTC < tiempoMinimoAnticipacion) {
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
              estaActivo: true,
              deletedAt: null
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
            id: { not: id },
            deletedAt: null
          }
        })

        if (clasesEnMismoHorario >= user.maxAlumnosPorClase) {
          return NextResponse.json({ error: `Esta clase ya alcanzó el máximo de ${user.maxAlumnosPorClase} alumnos` }, { status: 400 })
        }

        // Validar que la clase pertenece al profesor
        const claseExistente = await prisma.clase.findFirst({
          where: { id, profesorId: userId, deletedAt: null }
        })
        if (!claseExistente) {
          return NextResponse.json({ error: 'Clase no encontrada' }, { status: 404 })
        }

        // Validar que el alumno pertenece al profesor (si se especifica)
        if (alumnoId) {
          const alumnoValido = await prisma.alumno.findFirst({
            where: { id: alumnoId, profesorId: userId, deletedAt: null }
          })
          if (!alumnoValido) {
            return NextResponse.json({ error: 'Alumno no válido' }, { status: 400 })
          }
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
              ).catch(err => logger.error('Error actualizando evento en Google Calendar', err))
            }
          }).catch(err => logger.error('Error obteniendo sesión', err))
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
                }).catch(err => logger.error('Error guardando eventId', err))
              }).catch(err => logger.error('Error creando evento en Google Calendar', err))
            }
          }).catch(err => logger.error('Error obteniendo sesión', err))
        }

        return NextResponse.json({ success: true, clase: claseActualizada })
      }

      case 'delete': {
        const { id } = data

        // Validar que la clase pertenece al profesor y obtener datos para sync
        const [clase, user] = await Promise.all([
          prisma.clase.findFirst({
            where: { id, profesorId: userId, deletedAt: null },
            select: { id: true, googleEventId: true }
          }),
          prisma.user.findUnique({
            where: { id: userId },
            select: { syncGoogleCalendar: true }
          })
        ])

        if (!clase) {
          return NextResponse.json({ error: 'Clase no encontrada' }, { status: 404 })
        }

        // Soft delete: marcar como eliminado en lugar de borrar
        await prisma.clase.update({
          where: { id },
          data: { deletedAt: new Date() }
        })

        // Sincronizar con Google Calendar en background (fire-and-forget)
        if (user?.syncGoogleCalendar && clase?.googleEventId) {
          auth().then(session => {
            if (session && (session as any).accessToken) {
              deleteCalendarEvent(
                clase.googleEventId!,
                (session as any).accessToken,
                (session as any).refreshToken
              ).catch(err => logger.error('Error eliminando evento de Google Calendar', err))
            }
          }).catch(err => logger.error('Error obteniendo sesión', err))
        }

        return NextResponse.json({ success: true })
      }

      case 'changeStatus': {
        const { id, estado } = data

        // Validar que la clase pertenece al profesor
        const clase = await prisma.clase.findFirst({
          where: { id, profesorId: userId, deletedAt: null }
        })
        if (!clase) {
          return NextResponse.json({ error: 'Clase no encontrada' }, { status: 404 })
        }

        // Validar estado válido
        const estadosValidos = ['reservada', 'completada', 'cancelada']
        if (!estadosValidos.includes(estado)) {
          return NextResponse.json({ error: 'Estado no válido' }, { status: 400 })
        }

        await prisma.clase.update({
          where: { id },
          data: { estado }
        })

        return NextResponse.json({ success: true })
      }

      case 'changeAsistencia': {
        const { id, asistencia } = data

        // Validar que la clase pertenece al profesor
        const clase = await prisma.clase.findFirst({
          where: { id, profesorId: userId, deletedAt: null }
        })
        if (!clase) {
          return NextResponse.json({ error: 'Clase no encontrada' }, { status: 404 })
        }

        // Validar asistencia válida
        const asistenciasValidas = ['pendiente', 'presente', 'ausente']
        if (!asistenciasValidas.includes(asistencia)) {
          return NextResponse.json({ error: 'Asistencia no válida' }, { status: 400 })
        }

        // Cuando marcamos asistencia, también completamos la clase
        const nuevoEstado = asistencia === 'pendiente' ? 'reservada' : 'completada'

        await prisma.clase.update({
          where: { id },
          data: {
            asistencia,
            estado: nuevoEstado
          }
        })

        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
    }
  } catch (error) {
    return serverError(error)
  }
}
