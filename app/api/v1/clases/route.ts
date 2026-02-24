import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserContext, hasPermission } from '@/lib/auth'
import { addWeeks } from 'date-fns'
import { calcularRangoCiclo } from '@/lib/alumno-utils'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { getPaginationParams, paginatedResponse } from '@/lib/pagination'
import { getCachedPacks, getCachedAlumnosSimple, type OwnerType } from '@/lib/server-cache'
import { unauthorized, notFound, tooManyRequests, serverError, forbidden, badRequest } from '@/lib/api-utils'
import { canUseFeature, PLAN_CONFIGS, getSuggestedUpgrade, getEffectiveFeatures } from '@/lib/plans'
import { createCalendarEvent, deleteCalendarEvent } from '@/lib/services/google-calendar'
import { notifyClassEvent } from '@/lib/services/notifications'
import { Prisma } from '@prisma/client'
import {
  createClaseSchema,
  updateClaseSchema,
  deleteClaseSchema,
  changeStatusSchema,
  changeAsistenciaSchema,
  editSeriesSchema
} from '@/lib/schemas/clase.schema'

export const runtime = 'nodejs'

// Rate limit: 30 requests por minuto para POST
const POST_LIMIT = 30
const WINDOW_MS = 60 * 1000

export async function GET(request: NextRequest) {
  try {
    const context = await getUserContext()
    if (!context) {
      return unauthorized()
    }

    const { userId, estudio } = context

    const { page, limit, skip } = getPaginationParams(request)

    const hoy = new Date()
    const inicioRango = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
    const finRango = new Date(hoy.getFullYear(), hoy.getMonth() + 2, 0)

    // Filtro por estudio o profesor
    const ownerFilter = estudio
      ? { estudioId: estudio.estudioId }
      : { profesorId: userId }

    // Obtener config del estudio o del usuario
    const configData = estudio
      ? await prisma.estudio.findUnique({
          where: { id: estudio.estudioId },
          select: {
            horarioMananaInicio: true,
            horarioMananaFin: true,
            horarioTardeInicio: true,
            horarioTardeFin: true,
            precioPorClase: true,
            maxAlumnosPorClase: true,
            horasAnticipacionMinima: true,
            plan: true,
            trialEndsAt: true,
            _count: {
              select: {
                horariosDisponibles: true,
                packs: true,
                alumnos: true
              }
            }
          }
        })
      : await prisma.user.findUnique({
          where: { id: userId },
          select: {
            horarioMananaInicio: true,
            horarioMananaFin: true,
            horarioTardeInicio: true,
            horarioTardeFin: true,
            precioPorClase: true,
            maxAlumnosPorClase: true,
            horasAnticipacionMinima: true,
            plan: true,
            trialEndsAt: true,
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
    if (!configData) {
      return notFound('Usuario/Estudio no encontrado')
    }

    const missingFields: string[] = []
    if (configData._count.packs === 0) missingFields.push('Al menos un Pack')
    if (configData._count.horariosDisponibles === 0) missingFields.push('Al menos un Horario')
    if (configData._count.alumnos === 0) missingFields.push('Al menos un Alumno')

    if (missingFields.length > 0) {
      return NextResponse.json({
        preferencesIncomplete: true,
        missingFields
      })
    }

    // Where para clases - filtrar por estudio o profesor
    const clasesWhere = {
      ...ownerFilter,
      fecha: { gte: inicioRango, lte: finRango },
      deletedAt: null
    }

    // Queries de datos en paralelo (usando cache para packs y alumnos)
    const cacheKey = estudio ? estudio.estudioId : userId
    const cacheType: OwnerType = estudio ? 'estudio' : 'profesor'
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
          serieId: true,
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
      getCachedAlumnosSimple(cacheKey, cacheType),
      getCachedPacks(cacheKey, cacheType)
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

    // Calcular features según plan y trial
    const features = getEffectiveFeatures(configData.plan, configData.trialEndsAt)

    return NextResponse.json({
      // Nuevo formato paginado
      ...paginatedData,
      // Compatibilidad con formato anterior
      clases: clasesNormalizadas,
      alumnos,
      packs,
      currentUserId: userId,
      horarioMananaInicio: configData.horarioMananaInicio || '08:00',
      horarioMananaFin: configData.horarioMananaFin || '14:00',
      horarioTardeInicio: configData.horarioTardeInicio || '17:00',
      horarioTardeFin: configData.horarioTardeFin || '22:00',
      precioPorClase: configData.precioPorClase?.toString() || '0',
      maxAlumnosPorClase: configData.maxAlumnosPorClase || 3,
      horasAnticipacionMinima: configData.horasAnticipacionMinima || 1,
      // Features del plan para bloquear UI
      features: {
        clasesRecurrentes: features.clasesRecurrentes,
        listaEspera: features.listaEspera,
        plan: configData.plan
      }
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

    const context = await getUserContext()
    if (!context) {
      return unauthorized()
    }

    const { userId, estudio } = context

    const body = await request.json()
    const { action, ...data } = body

    // Filtro por estudio o profesor
    const ownerFilter = estudio
      ? { estudioId: estudio.estudioId }
      : { profesorId: userId }

    switch (action) {
      case 'create': {
        // Validar con Zod
        const parsed = createClaseSchema.safeParse({ action, ...data })
        if (!parsed.success) {
          return badRequest(parsed.error.issues[0].message)
        }

        // Verificar permiso para crear clases
        if (estudio && !hasPermission(estudio.rol, 'create:clases')) {
          return forbidden('No tienes permiso para crear clases')
        }

        // Obtener config del estudio o del usuario
        const configData = estudio
          ? await prisma.estudio.findUnique({
              where: { id: estudio.estudioId },
              select: {
                horasAnticipacionMinima: true,
                maxAlumnosPorClase: true,
                horarioMananaInicio: true,
                horarioMananaFin: true,
                horarioTardeInicio: true,
                horarioTardeFin: true,
                plan: true,
                trialEndsAt: true,
                syncGoogleCalendar: true
              }
            })
          : await prisma.user.findUnique({
              where: { id: userId },
              select: {
                horasAnticipacionMinima: true,
                maxAlumnosPorClase: true,
                horarioMananaInicio: true,
                horarioMananaFin: true,
                horarioTardeInicio: true,
                horarioTardeFin: true,
                plan: true,
                trialEndsAt: true,
                syncGoogleCalendar: true
              }
            })

        if (!configData) {
          return NextResponse.json({ error: 'Usuario/Estudio no encontrado' }, { status: 404 })
        }

        const {
          alumnoIds,
          horaInicio,
          horaRecurrente: horaRecurrenteInput,
          esClasePrueba,
          esRecurrente,
          alumnosDias,
          fecha: fechaStr
        } = parsed.data

        // Verificar que el plan permita clases recurrentes
        if (esRecurrente && !canUseFeature('clasesRecurrentes', configData.plan, configData.trialEndsAt)) {
          const suggestedPlan = getSuggestedUpgrade(configData.plan, 'feature')
          return NextResponse.json({
            error: 'Las clases recurrentes no están disponibles en tu plan',
            code: 'FEATURE_NOT_AVAILABLE',
            feature: 'clasesRecurrentes',
            currentPlan: configData.plan,
            suggestedPlan,
            suggestedPlanName: suggestedPlan ? PLAN_CONFIGS[suggestedPlan].name : null
          }, { status: 403 })
        }
        const horaRecurrente = horaRecurrenteInput || horaInicio

        // Asegurar que alumnoIds es un array
        const alumnosArray: string[] = Array.isArray(alumnoIds) ? alumnoIds : []

        // Build per-student dias map from alumnosDias or fallback
        const perStudentDias: Record<string, number[]> = alumnosDias || {}

        // Validate per-student dias when recurrent
        if (esRecurrente && alumnosArray.length > 0) {
          const alumnosConPack = await prisma.alumno.findMany({
            where: { id: { in: alumnosArray }, ...ownerFilter, deletedAt: null },
            select: { id: true, nombre: true, packType: true }
          })

          const sinPack = alumnosConPack.filter(a => a.packType === 'por_clase')
          if (sinPack.length > 0) {
            return badRequest(`${sinPack.map(a => a.nombre).join(', ')} no tiene pack asignado`)
          }

          // Fetch pack frequencies for validation
          const packIds = [...new Set(alumnosConPack.map(a => a.packType))]
          const packsData = await prisma.pack.findMany({
            where: { id: { in: packIds }, deletedAt: null },
            select: { id: true, clasesPorSemana: true }
          })
          const packFreqMap = new Map(packsData.map(p => [p.id, p.clasesPorSemana]))

          for (const alumno of alumnosConPack) {
            const dias = perStudentDias[alumno.id]
            const expectedFreq = packFreqMap.get(alumno.packType)
            if (!dias || !expectedFreq) {
              return badRequest(`Faltan los dias de clase para ${alumno.nombre}`)
            }
            if (dias.length !== expectedFreq) {
              return badRequest(`${alumno.nombre} debe tener exactamente ${expectedFreq} dia(s) seleccionado(s)`)
            }
          }
        }

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
        const tiempoMinimoAnticipacion = new Date(ahora.getTime() + configData.horasAnticipacionMinima * 60 * 60 * 1000)

        if (fechaHoraClaseUTC < tiempoMinimoAnticipacion) {
          const horasTexto = configData.horasAnticipacionMinima === 1 ? '1 hora' : `${configData.horasAnticipacionMinima} horas`
          return NextResponse.json({ error: `Las clases deben reservarse con al menos ${horasTexto} de anticipación` }, { status: 400 })
        }

        // Validar horario contra configuración del profesor/estudio
        // Usar el inicio del horario de tarde para determinar si es mañana o tarde
        const horaTardeInicio = parseInt(configData.horarioTardeInicio.split(':')[0])
        const horaNum = parseInt(horaInicio.split(':')[0])
        const esManiana = horaNum < horaTardeInicio

        const horarioInicio = esManiana ? configData.horarioMananaInicio : configData.horarioTardeInicio
        const horarioFin = esManiana ? configData.horarioMananaFin : configData.horarioTardeFin

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
              ...ownerFilter,
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

        // Validate capacity + create classes in a serializable transaction to prevent race conditions
        const clasesCreadas = await prisma.$transaction(async (tx) => {
          const clasesEnMismoHorario = await tx.clase.count({
            where: {
              ...ownerFilter,
              fecha,
              horaInicio,
              alumnoId: { not: null },
              estado: { not: 'cancelada' },
              deletedAt: null
            }
          })

          const espaciosDisponibles = configData.maxAlumnosPorClase - clasesEnMismoHorario
          if (alumnosArray.length > espaciosDisponibles) {
            throw new Error(espaciosDisponibles === 0
              ? `Esta clase ya alcanzó el máximo de ${configData.maxAlumnosPorClase} alumnos`
              : `Solo hay ${espaciosDisponibles} lugar(es) disponible(s) en este horario`)
          }

          if (alumnosArray.length > 0) {
            const alumnosValidos = await tx.alumno.count({
              where: {
                id: { in: alumnosArray },
                ...ownerFilter,
                deletedAt: null
              }
            })
            if (alumnosValidos !== alumnosArray.length) {
              throw new Error('Uno o más alumnos no son válidos')
            }
          }

          const created = []

          if (alumnosArray.length === 0) {
            const claseCreada = await tx.clase.create({
              data: {
                profesorId: userId,
                ...(estudio && { estudioId: estudio.estudioId }),
                alumnoId: null,
                fecha,
                horaInicio,
                horaRecurrente: horaRecurrente !== horaInicio ? horaRecurrente : null,
                esClasePrueba,
                esRecurrente: false,
                estado: 'reservada'
              },
              include: {
                alumno: { select: { id: true, nombre: true } },
                profesor: { select: { id: true, nombre: true } }
              }
            })
            created.push(claseCreada)
            return created
          }

          for (const alumnoId of alumnosArray) {
            const alumnoDias = perStudentDias[alumnoId] || []
            const frecuenciaSemanal = alumnoDias.length > 0 ? alumnoDias.length : null
            const serieId = esRecurrente && alumnoDias.length > 0 ? crypto.randomUUID() : null

            const claseCreada = await tx.clase.create({
              data: {
                profesorId: userId,
                ...(estudio && { estudioId: estudio.estudioId }),
                alumnoId: alumnoId || null,
                fecha,
                horaInicio,
                horaRecurrente: horaRecurrente !== horaInicio ? horaRecurrente : null,
                esClasePrueba,
                esRecurrente,
                frecuenciaSemanal,
                diasSemana: alumnoDias,
                serieId,
                estado: 'reservada'
              },
              include: {
                alumno: { select: { id: true, nombre: true } },
                profesor: { select: { id: true, nombre: true } }
              }
            })
            created.push(claseCreada)
          }

          return created
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }).catch((err: Error) => {
          return err
        })

        if (clasesCreadas instanceof Error) {
          return badRequest(clasesCreadas.message)
        }

        // Side effects outside transaction: calendar events, notifications, recurring classes
        for (const claseCreada of clasesCreadas) {
          if (configData.syncGoogleCalendar && claseCreada.alumno) {
            createCalendarEvent(
              userId,
              claseCreada.id,
              claseCreada.alumno.nombre,
              fecha,
              horaInicio
            ).catch(() => {})
          }

          if (claseCreada.alumno) {
            notifyClassEvent({
              claseId: claseCreada.id,
              tipo: 'CLASE_NUEVA',
              profesorId: userId,
              plan: configData.plan,
              trialEndsAt: configData.trialEndsAt,
            }).catch(() => {})
          }

          if (esRecurrente && claseCreada.alumnoId) {
            const alumnoDias = perStudentDias[claseCreada.alumnoId] || []
            if (alumnoDias.length > 0) {
              const frecuenciaSemanal = alumnoDias.length
              const clasesACrear: Prisma.ClaseCreateManyInput[] = []
              const diaInicialSeleccionado = fecha.getUTCDay()

              for (const diaSeleccionado of alumnoDias) {
                let diasHastaProximoDia = diaSeleccionado - diaInicialSeleccionado
                if (diasHastaProximoDia <= 0) diasHastaProximoDia += 7

                const primeraOcurrencia = new Date(fecha)
                primeraOcurrencia.setUTCDate(fecha.getUTCDate() + diasHastaProximoDia)

                for (let i = 0; i < 8; i++) {
                  const fechaClase = addWeeks(primeraOcurrencia, i)

                  clasesACrear.push({
                    profesorId: userId,
                    ...(estudio && { estudioId: estudio.estudioId }),
                    alumnoId: claseCreada.alumnoId,
                    fecha: fechaClase,
                    horaInicio: horaRecurrente,
                    horaRecurrente: horaRecurrente !== horaInicio ? horaRecurrente : null,
                    esClasePrueba,
                    esRecurrente: true,
                    frecuenciaSemanal,
                    diasSemana: alumnoDias,
                    serieId: claseCreada.serieId,
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
        }

        return NextResponse.json({ success: true, clases: clasesCreadas })
      }

      case 'update': {
        // Validar con Zod
        const parsedUpdate = updateClaseSchema.safeParse({ action, ...data })
        if (!parsedUpdate.success) {
          return badRequest(parsedUpdate.error.issues[0].message)
        }

        // Verificar permiso para editar clases (según rol, INSTRUCTOR solo puede editar sus propias)
        if (estudio && !hasPermission(estudio.rol, 'edit:clases')) {
          return forbidden('No tienes permiso para editar clases')
        }

        // Obtener config del estudio o del usuario
        const updateConfigData = estudio
          ? await prisma.estudio.findUnique({
              where: { id: estudio.estudioId },
              select: {
                horasAnticipacionMinima: true,
                maxAlumnosPorClase: true,
                horarioMananaInicio: true,
                horarioMananaFin: true,
                horarioTardeInicio: true,
                horarioTardeFin: true
              }
            })
          : await prisma.user.findUnique({
              where: { id: userId },
              select: {
                horasAnticipacionMinima: true,
                maxAlumnosPorClase: true,
                horarioMananaInicio: true,
                horarioMananaFin: true,
                horarioTardeInicio: true,
                horarioTardeFin: true
              }
            })

        if (!updateConfigData) {
          return NextResponse.json({ error: 'Usuario/Estudio no encontrado' }, { status: 404 })
        }

        const {
          id,
          alumnoId,
          horaInicio,
          horaRecurrente: horaRecurrenteInput,
          estado,
          esClasePrueba,
          esRecurrente,
          diasSemana: diasSemanaParsed,
          fecha: fechaStr
        } = parsedUpdate.data
        const horaRecurrente = horaRecurrenteInput || horaInicio
        const diasSemana = diasSemanaParsed
        const frecuenciaSemanal = esRecurrente ? diasSemana.length || null : null

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
        const tiempoMinimoAnticipacion = new Date(ahora.getTime() + updateConfigData.horasAnticipacionMinima * 60 * 60 * 1000)

        if (fechaHoraClaseUTC < tiempoMinimoAnticipacion) {
          const horasTexto = updateConfigData.horasAnticipacionMinima === 1 ? '1 hora' : `${updateConfigData.horasAnticipacionMinima} horas`
          return NextResponse.json({ error: `Las clases deben modificarse con al menos ${horasTexto} de anticipación` }, { status: 400 })
        }

        // Validar horario contra configuración del profesor/estudio
        // Usar el inicio del horario de tarde para determinar si es mañana o tarde
        const horaTardeInicio = parseInt(updateConfigData.horarioTardeInicio.split(':')[0])
        const horaNum = parseInt(horaInicio.split(':')[0])
        const esManiana = horaNum < horaTardeInicio

        const horarioInicio = esManiana ? updateConfigData.horarioMananaInicio : updateConfigData.horarioTardeInicio
        const horarioFin = esManiana ? updateConfigData.horarioMananaFin : updateConfigData.horarioTardeFin

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
              ...ownerFilter,
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

        // Validar cantidad de clases en el mismo horario (only count assigned students)
        const clasesEnMismoHorario = await prisma.clase.count({
          where: {
            ...ownerFilter,
            fecha,
            horaInicio,
            alumnoId: { not: null },
            estado: { not: 'cancelada' },
            id: { not: id },
            deletedAt: null
          }
        })

        if (clasesEnMismoHorario >= updateConfigData.maxAlumnosPorClase) {
          return NextResponse.json({ error: `Esta clase ya alcanzó el máximo de ${updateConfigData.maxAlumnosPorClase} alumnos` }, { status: 400 })
        }

        // Validar que la clase pertenece al estudio/profesor
        const claseExistente = await prisma.clase.findFirst({
          where: { id, ...ownerFilter, deletedAt: null }
        })
        if (!claseExistente) {
          return NextResponse.json({ error: 'Clase no encontrada' }, { status: 404 })
        }

        // Si es INSTRUCTOR en un estudio, solo puede editar sus propias clases
        if (estudio && estudio.rol === 'INSTRUCTOR' && claseExistente.profesorId !== userId) {
          return forbidden('Solo puedes editar tus propias clases')
        }

        // Validar que el alumno pertenece al estudio/profesor (si se especifica)
        if (alumnoId) {
          const alumnoValido = await prisma.alumno.findFirst({
            where: { id: alumnoId, ...ownerFilter, deletedAt: null }
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

        return NextResponse.json({ success: true, clase: claseActualizada })
      }

      case 'delete': {
        // Validar con Zod
        const parsedDelete = deleteClaseSchema.safeParse({ action, ...data })
        if (!parsedDelete.success) {
          return badRequest(parsedDelete.error.issues[0].message)
        }

        // Verificar permiso para eliminar clases
        if (estudio && !hasPermission(estudio.rol, 'delete:clases')) {
          return forbidden('No tienes permiso para eliminar clases')
        }

        const { id } = parsedDelete.data

        // Validar que la clase pertenece al estudio/profesor
        const clase = await prisma.clase.findFirst({
          where: { id, ...ownerFilter, deletedAt: null },
          select: { id: true, profesorId: true, googleEventId: true }
        })

        if (!clase) {
          return NextResponse.json({ error: 'Clase no encontrada' }, { status: 404 })
        }

        // Si es INSTRUCTOR, solo puede eliminar sus propias clases
        if (estudio && estudio.rol === 'INSTRUCTOR' && clase.profesorId !== userId) {
          return forbidden('Solo puedes eliminar tus propias clases')
        }

        // Eliminar evento de Google Calendar si existe
        if (clase.googleEventId) {
          deleteCalendarEvent(userId, clase.googleEventId).catch(() => {})
        }

        // Soft delete: marcar como eliminado en lugar de borrar
        await prisma.clase.update({
          where: { id },
          data: { deletedAt: new Date() }
        })

        return NextResponse.json({ success: true })
      }

      case 'changeStatus': {
        // Validar con Zod
        const parsedStatus = changeStatusSchema.safeParse({ action, ...data })
        if (!parsedStatus.success) {
          return badRequest(parsedStatus.error.issues[0].message)
        }

        // Verificar permiso para cambiar estado
        if (estudio && !hasPermission(estudio.rol, 'edit:clases')) {
          return forbidden('No tienes permiso para cambiar el estado de clases')
        }

        const { id: statusId, estado: nuevoEstado } = parsedStatus.data

        // Validar que la clase pertenece al estudio/profesor
        const claseStatus = await prisma.clase.findFirst({
          where: { id: statusId, ...ownerFilter, deletedAt: null }
        })
        if (!claseStatus) {
          return NextResponse.json({ error: 'Clase no encontrada' }, { status: 404 })
        }

        // Si es INSTRUCTOR, solo puede cambiar estado de sus propias clases
        if (estudio && estudio.rol === 'INSTRUCTOR' && claseStatus.profesorId !== userId) {
          return forbidden('Solo puedes cambiar el estado de tus propias clases')
        }

        // Validate state machine transitions
        const VALID_TRANSITIONS: Record<string, string[]> = {
          'reservada': ['completada', 'cancelada'],
          'completada': ['reservada'],
          'cancelada': ['reservada'],
        }

        const allowedTransitions = VALID_TRANSITIONS[claseStatus.estado]
        if (!allowedTransitions || !allowedTransitions.includes(nuevoEstado)) {
          return badRequest(`No se puede cambiar de "${claseStatus.estado}" a "${nuevoEstado}"`)
        }

        await prisma.clase.update({
          where: { id: statusId },
          data: { estado: nuevoEstado }
        })

        return NextResponse.json({ success: true })
      }

      case 'changeAsistencia': {
        // Validar con Zod
        const parsedAsistencia = changeAsistenciaSchema.safeParse({ action, ...data })
        if (!parsedAsistencia.success) {
          return badRequest(parsedAsistencia.error.issues[0].message)
        }

        // Verificar permiso para cambiar asistencia
        if (estudio && !hasPermission(estudio.rol, 'edit:clases')) {
          return forbidden('No tienes permiso para cambiar la asistencia')
        }

        const { id: asistenciaId, asistencia } = parsedAsistencia.data

        // Validar que la clase pertenece al estudio/profesor
        const claseAsistencia = await prisma.clase.findFirst({
          where: { id: asistenciaId, ...ownerFilter, deletedAt: null }
        })
        if (!claseAsistencia) {
          return NextResponse.json({ error: 'Clase no encontrada' }, { status: 404 })
        }

        // Si es INSTRUCTOR, solo puede cambiar asistencia de sus propias clases
        if (estudio && estudio.rol === 'INSTRUCTOR' && claseAsistencia.profesorId !== userId) {
          return forbidden('Solo puedes cambiar la asistencia de tus propias clases')
        }

        // Cannot mark attendance on an unassigned slot
        if (!claseAsistencia.alumnoId) {
          return badRequest('No se puede marcar asistencia en una clase sin alumno asignado')
        }

        // Cuando marcamos asistencia, también completamos la clase
        const estadoAsistencia = asistencia === 'pendiente' ? 'reservada' : 'completada'

        await prisma.clase.update({
          where: { id: asistenciaId },
          data: {
            asistencia,
            estado: estadoAsistencia
          }
        })

        return NextResponse.json({ success: true })
      }

      case 'editSeries': {
        if (estudio && !hasPermission(estudio.rol, 'edit:clases')) {
          return forbidden('No tienes permiso para editar clases')
        }

        const parsedSeries = editSeriesSchema.safeParse({ action, ...body })
        if (!parsedSeries.success) {
          return badRequest(parsedSeries.error.issues[0].message)
        }

        const { serieId, diasSemana: newDias, horaInicio: newHora, scope } = parsedSeries.data
        const today = new Date()
        today.setUTCHours(0, 0, 0, 0)

        // Find all classes in this series
        const seriesFilter: Record<string, unknown> = {
          serieId,
          ...ownerFilter,
          deletedAt: null
        }

        if (scope === 'future') {
          seriesFilter.fecha = { gte: today }
        }

        const seriesClases = await prisma.clase.findMany({
          where: seriesFilter,
          select: { id: true, fecha: true, asistencia: true, horaInicio: true, diasSemana: true },
          orderBy: { fecha: 'asc' }
        })

        if (seriesClases.length === 0) {
          return badRequest('No se encontraron clases en esta serie')
        }

        // Filter out attended classes when scope is all_unattended
        const clasesToUpdate = scope === 'all_unattended'
          ? seriesClases.filter(c => c.asistencia !== 'presente')
          : seriesClases

        if (clasesToUpdate.length === 0) {
          return badRequest('No hay clases para actualizar (todas tienen asistencia)')
        }

        // Determine what changed
        const oldDias = seriesClases[0].diasSemana
        const oldHora = seriesClases[0].horaInicio
        const daysChanged = JSON.stringify([...newDias].sort()) !== JSON.stringify([...oldDias].sort())
        const horaChanged = newHora !== oldHora

        if (!daysChanged && !horaChanged) {
          return NextResponse.json({ success: true, updated: 0 })
        }

        // Simple case: only time changed (no day restructuring needed)
        if (!daysChanged) {
          const result = await prisma.clase.updateMany({
            where: { id: { in: clasesToUpdate.map(c => c.id) } },
            data: {
              horaInicio: newHora,
              horaRecurrente: newHora !== oldHora ? newHora : null
            }
          })
          return NextResponse.json({ success: true, updated: result.count })
        }

        // Days changed: soft-delete old classes and create new ones on the correct days
        const frecuenciaSemanal = newDias.length

        // Get template from first class for shared fields
        const templateClase = await prisma.clase.findFirst({
          where: { serieId, ...ownerFilter, deletedAt: null },
          select: {
            profesorId: true, estudioId: true, alumnoId: true,
            esClasePrueba: true, esRecurrente: true
          }
        })

        if (!templateClase) {
          return badRequest('No se pudo obtener datos de la serie')
        }

        // Soft-delete the classes we're replacing
        await prisma.clase.updateMany({
          where: { id: { in: clasesToUpdate.map(c => c.id) } },
          data: { deletedAt: new Date() }
        })

        // Group old classes by week to maintain the same date range
        const weekStarts = new Set<string>()
        for (const clase of clasesToUpdate) {
          const d = new Date(clase.fecha)
          // Get Monday of that week
          const day = d.getUTCDay()
          const diff = day === 0 ? -6 : 1 - day
          const monday = new Date(d)
          monday.setUTCDate(d.getUTCDate() + diff)
          weekStarts.add(monday.toISOString().split('T')[0])
        }

        // Create new classes for each week on the new days
        const newClases: Prisma.ClaseCreateManyInput[] = []
        for (const weekStart of weekStarts) {
          const monday = new Date(weekStart + 'T00:00:00.000Z')
          for (const dia of newDias) {
            // Calculate date for this day of week (1=Mon, 0=Sun)
            const offset = dia === 0 ? 6 : dia - 1
            const fecha = new Date(monday)
            fecha.setUTCDate(monday.getUTCDate() + offset)

            // Skip past dates when scope is future
            if (scope === 'future' && fecha < today) continue

            newClases.push({
              profesorId: templateClase.profesorId,
              ...(templateClase.estudioId && { estudioId: templateClase.estudioId }),
              alumnoId: templateClase.alumnoId,
              fecha,
              horaInicio: newHora,
              horaRecurrente: newHora,
              esClasePrueba: templateClase.esClasePrueba,
              esRecurrente: true,
              frecuenciaSemanal,
              diasSemana: newDias,
              serieId,
              estado: 'reservada'
            })
          }
        }

        if (newClases.length > 0) {
          await prisma.clase.createMany({ data: newClases, skipDuplicates: true })
        }

        // Also update remaining classes in series (attended ones) to reflect new dias metadata
        if (scope === 'all_unattended') {
          const attendedIds = seriesClases
            .filter(c => c.asistencia === 'presente')
            .map(c => c.id)
          if (attendedIds.length > 0) {
            await prisma.clase.updateMany({
              where: { id: { in: attendedIds } },
              data: { diasSemana: newDias, frecuenciaSemanal, horaInicio: newHora }
            })
          }
        }

        return NextResponse.json({ success: true, updated: newClases.length })
      }

      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
    }
  } catch (error) {
    return serverError(error)
  }
}
