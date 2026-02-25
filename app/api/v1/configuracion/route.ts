import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserContext, hasPermission, hashPassword, verifyPassword } from '@/lib/auth'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { getCachedPacks, getCachedHorarios, getCachedProfesorConfig, type OwnerType } from '@/lib/server-cache'
import { invalidatePacks, invalidateHorarios, invalidateConfig } from '@/lib/cache-utils'
import { unauthorized, badRequest, notFound, tooManyRequests, serverError, forbidden } from '@/lib/api-utils'
import { canUseFeature, getSuggestedUpgrade, PLAN_CONFIGS, getEffectiveFeatures } from '@/lib/plans'
import {
  saveHorarioSchema,
  saveHorariosBatchSchema,
  deleteHorarioSchema,
  toggleHorarioSchema,
  savePackSchema,
  deletePackSchema,
  updateProfileSchema,
  changePasswordSchema,
  updatePreferenciasSchema
} from '@/lib/schemas/configuracion.schema'

export const runtime = 'nodejs'

// Rate limit: 20 requests por minuto para POST
const POST_LIMIT = 20
const WINDOW_MS = 60 * 1000

export async function GET() {
  try {
    const context = await getUserContext()
    if (!context) {
      return unauthorized()
    }

    const { userId, estudio } = context

    // Para packs/horarios: usar estudioId si hay estudio, sino profesorId
    const resourceOwnerId = estudio ? estudio.estudioId : userId
    const ownerType: OwnerType = estudio ? 'estudio' : 'profesor'

    // Para config del profesor: siempre usar userId (el User siempre existe)
    const [profesor, horarios, packs, accounts] = await Promise.all([
      getCachedProfesorConfig(userId),
      getCachedHorarios(resourceOwnerId, ownerType),
      getCachedPacks(resourceOwnerId, ownerType),
      prisma.account.findMany({
        where: { userId },
        select: { provider: true }
      })
    ])

    if (!profesor) {
      return notFound('Usuario no encontrado')
    }

    const hasGoogleAccount = accounts.some(account => account.provider === 'google')

    // Calcular features del usuario según plan y trial
    const trialEndsAt = profesor.trialEndsAt ? new Date(profesor.trialEndsAt) : null
    const features = getEffectiveFeatures(profesor.plan, trialEndsAt)

    return NextResponse.json({
      profesor: {
        ...profesor,
        hasGoogleAccount
      },
      horarios,
      packs,
      // Features del plan para bloquear UI
      features: {
        configuracionHorarios: features.configuracionHorarios,
        googleCalendarSync: features.googleCalendarSync,
        plan: profesor.plan
      },
      // Info del estudio para UI
      estudioInfo: estudio ? {
        estudioId: estudio.estudioId,
        rol: estudio.rol
      } : null
    })
  } catch (error) {
    return serverError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIP(request)
    const { success } = rateLimit(`config:${ip}`, POST_LIMIT, WINDOW_MS)
    if (!success) {
      return tooManyRequests()
    }

    const context = await getUserContext()
    if (!context) {
      return unauthorized()
    }

    const { userId, estudio } = context

    // Filtro por estudio o profesor
    const ownerFilter = estudio
      ? { estudioId: estudio.estudioId }
      : { profesorId: userId }

    const body = await request.json()
    const { action, ...data } = body

    switch (action) {
      case 'saveHorario': {
        // Verificar permiso para editar configuración
        if (estudio && !hasPermission(estudio.rol, 'edit:configuracion')) {
          return forbidden('No tienes permiso para modificar horarios')
        }

        const parsedHorario = saveHorarioSchema.safeParse(data)
        if (!parsedHorario.success) {
          return badRequest(parsedHorario.error.issues[0].message)
        }
        const { id, diaSemana, horaInicio, horaFin, esManiana } = parsedHorario.data

        // Obtener horarios por defecto configurados y plan
        const configData = estudio
          ? await prisma.estudio.findUnique({
              where: { id: estudio.estudioId },
              select: {
                horarioMananaInicio: true,
                horarioMananaFin: true,
                horarioTardeInicio: true,
                horarioTardeFin: true,
                plan: true,
                trialEndsAt: true
              }
            })
          : await prisma.user.findUnique({
              where: { id: userId },
              select: {
                horarioMananaInicio: true,
                horarioMananaFin: true,
                horarioTardeInicio: true,
                horarioTardeFin: true,
                plan: true,
                trialEndsAt: true
              }
            })

        if (!configData) {
          return NextResponse.json({ error: 'Usuario/Estudio no encontrado' }, { status: 404 })
        }

        // Verificar que el plan permita configuración de horarios
        if (!canUseFeature('configuracionHorarios', configData.plan, configData.trialEndsAt)) {
          const suggestedPlan = getSuggestedUpgrade(configData.plan, 'feature')
          return NextResponse.json({
            error: 'La configuración de horarios no está disponible en tu plan',
            code: 'FEATURE_NOT_AVAILABLE',
            feature: 'configuracionHorarios',
            currentPlan: configData.plan,
            suggestedPlan,
            suggestedPlanName: suggestedPlan ? PLAN_CONFIGS[suggestedPlan].name : null
          }, { status: 403 })
        }

        // Validar que los horarios estén dentro del rango configurado
        if (esManiana) {
          if (horaInicio < configData.horarioMananaInicio || horaFin > configData.horarioMananaFin) {
            return NextResponse.json({
              error: `El horario de mañana debe estar entre ${configData.horarioMananaInicio} y ${configData.horarioMananaFin}`
            }, { status: 400 })
          }
        } else {
          if (horaInicio < configData.horarioTardeInicio || horaFin > configData.horarioTardeFin) {
            return NextResponse.json({
              error: `El horario de tarde debe estar entre ${configData.horarioTardeInicio} y ${configData.horarioTardeFin}`
            }, { status: 400 })
          }
        }

        // Validar que horaInicio < horaFin
        if (horaInicio >= horaFin) {
          return NextResponse.json({
            error: 'La hora de inicio debe ser anterior a la hora de fin'
          }, { status: 400 })
        }

        let horario
        if (id) {
          // Verificar que el horario pertenece al estudio/profesor
          const horarioExistente = await prisma.horarioDisponible.findFirst({
            where: { id, ...ownerFilter, deletedAt: null }
          })
          if (!horarioExistente) {
            return NextResponse.json({ error: 'Horario no encontrado' }, { status: 404 })
          }
          horario = await prisma.horarioDisponible.update({
            where: { id },
            data: { diaSemana, horaInicio, horaFin, esManiana }
          })
        } else {
          const existente = await prisma.horarioDisponible.findFirst({
            where: { ...ownerFilter, diaSemana, esManiana, deletedAt: null }
          })

          if (existente) {
            horario = await prisma.horarioDisponible.update({
              where: { id: existente.id },
              data: { horaInicio, horaFin }
            })
          } else {
            horario = await prisma.horarioDisponible.create({
              data: {
                profesorId: userId,
                ...(estudio && { estudioId: estudio.estudioId }),
                diaSemana,
                horaInicio,
                horaFin,
                esManiana
              }
            })
          }
        }

        invalidateHorarios()
        return NextResponse.json({ success: true, horario })
      }

      case 'saveHorariosBatch': {
        // Verificar permiso para editar configuración
        if (estudio && !hasPermission(estudio.rol, 'edit:configuracion')) {
          return forbidden('No tienes permiso para modificar horarios')
        }

        const parsedBatch = saveHorariosBatchSchema.safeParse(data)
        if (!parsedBatch.success) {
          return badRequest(parsedBatch.error.issues[0].message)
        }
        const { horarios: horariosData } = parsedBatch.data

        // Verificar que el plan permita configuración de horarios
        const configBatch = estudio
          ? await prisma.estudio.findUnique({
              where: { id: estudio.estudioId },
              select: { plan: true, trialEndsAt: true }
            })
          : await prisma.user.findUnique({
              where: { id: userId },
              select: { plan: true, trialEndsAt: true }
            })

        if (configBatch && !canUseFeature('configuracionHorarios', configBatch.plan, configBatch.trialEndsAt)) {
          const suggestedPlan = getSuggestedUpgrade(configBatch.plan, 'feature')
          return NextResponse.json({
            error: 'La configuración de horarios no está disponible en tu plan',
            code: 'FEATURE_NOT_AVAILABLE',
            feature: 'configuracionHorarios',
            currentPlan: configBatch.plan,
            suggestedPlan,
            suggestedPlanName: suggestedPlan ? PLAN_CONFIGS[suggestedPlan].name : null
          }, { status: 403 })
        }

        // Validar horarios (sin query a DB - usar valores por defecto si no hay config)
        for (const h of horariosData) {
          if (h.horaInicio >= h.horaFin) {
            return NextResponse.json({
              error: 'La hora de inicio debe ser anterior a la hora de fin'
            }, { status: 400 })
          }
        }

        // Una sola transacción: borrar existentes + crear nuevos (bulk operations)
        await prisma.$transaction([
          // Borrar solo los que vamos a reemplazar
          prisma.horarioDisponible.deleteMany({
            where: {
              ...ownerFilter,
              OR: horariosData.map(h => ({
                diaSemana: h.diaSemana,
                esManiana: h.esManiana
              }))
            }
          }),
          // Crear todos de una (single INSERT)
          prisma.horarioDisponible.createMany({
            data: horariosData.map(h => ({
              profesorId: userId,
              ...(estudio && { estudioId: estudio.estudioId }),
              diaSemana: h.diaSemana,
              horaInicio: h.horaInicio,
              horaFin: h.horaFin,
              esManiana: h.esManiana
            }))
          })
        ])

        // Obtener los horarios creados para devolver
        const resultados = await prisma.horarioDisponible.findMany({
          where: {
            ...ownerFilter,
            OR: horariosData.map(h => ({
              diaSemana: h.diaSemana,
              esManiana: h.esManiana
            }))
          }
        })

        invalidateHorarios()
        return NextResponse.json({ success: true, horarios: resultados })
      }

      case 'deleteHorario': {
        // Verificar permiso para editar configuración
        if (estudio && !hasPermission(estudio.rol, 'edit:configuracion')) {
          return forbidden('No tienes permiso para eliminar horarios')
        }

        const parsedDeleteHorario = deleteHorarioSchema.safeParse(data)
        if (!parsedDeleteHorario.success) {
          return badRequest(parsedDeleteHorario.error.issues[0].message)
        }
        const { id } = parsedDeleteHorario.data

        // Validar que el horario pertenece al estudio/profesor
        const horario = await prisma.horarioDisponible.findFirst({
          where: { id, ...ownerFilter, deletedAt: null }
        })
        if (!horario) {
          return NextResponse.json({ error: 'Horario no encontrado' }, { status: 404 })
        }

        // Soft delete: marcar como eliminado en lugar de borrar
        await prisma.horarioDisponible.update({
          where: { id },
          data: { deletedAt: new Date() }
        })
        invalidateHorarios()
        return NextResponse.json({ success: true })
      }

      case 'toggleHorario': {
        // Verificar permiso para editar configuración
        if (estudio && !hasPermission(estudio.rol, 'edit:configuracion')) {
          return forbidden('No tienes permiso para modificar horarios')
        }

        const parsedToggle = toggleHorarioSchema.safeParse(data)
        if (!parsedToggle.success) {
          return badRequest(parsedToggle.error.issues[0].message)
        }
        const { id } = parsedToggle.data

        // Validar que el horario pertenece al estudio/profesor
        const horario = await prisma.horarioDisponible.findFirst({
          where: { id, ...ownerFilter, deletedAt: null }
        })
        if (!horario) {
          return NextResponse.json({ error: 'Horario no encontrado' }, { status: 404 })
        }

        await prisma.horarioDisponible.update({
          where: { id },
          data: { estaActivo: !horario.estaActivo }
        })
        invalidateHorarios()
        return NextResponse.json({ success: true })
      }

      case 'savePack': {
        // Verificar permiso para editar configuración
        if (estudio && !hasPermission(estudio.rol, 'edit:configuracion')) {
          return forbidden('No tienes permiso para modificar packs')
        }

        const parsedPack = savePackSchema.safeParse(data)
        if (!parsedPack.success) {
          return badRequest(parsedPack.error.issues[0].message)
        }
        const { id, nombre, clasesPorSemana, precio } = parsedPack.data

        let pack
        if (id) {
          // Validar que el pack pertenece al estudio/profesor
          const packExistente = await prisma.pack.findFirst({
            where: { id, ...ownerFilter, deletedAt: null }
          })
          if (!packExistente) {
            return NextResponse.json({ error: 'Pack no encontrado' }, { status: 404 })
          }

          pack = await prisma.pack.update({
            where: { id },
            data: { nombre, clasesPorSemana, precio }
          })
        } else {
          pack = await prisma.pack.create({
            data: {
              profesorId: userId,
              ...(estudio && { estudioId: estudio.estudioId }),
              nombre,
              clasesPorSemana,
              precio
            }
          })
        }
        invalidatePacks()
        return NextResponse.json({ success: true, pack })
      }

      case 'deletePack': {
        // Verificar permiso para editar configuración
        if (estudio && !hasPermission(estudio.rol, 'edit:configuracion')) {
          return forbidden('No tienes permiso para eliminar packs')
        }

        const parsedDelete = deletePackSchema.safeParse(data)
        if (!parsedDelete.success) {
          return badRequest(parsedDelete.error.issues[0].message)
        }
        const { id } = parsedDelete.data
        const pack = await prisma.pack.findFirst({
          where: { id, ...ownerFilter, deletedAt: null }
        })
        if (!pack) {
          return NextResponse.json({ error: 'Pack no encontrado' }, { status: 404 })
        }

        // Verificar si hay alumnos usando este pack
        const alumnosConPack = await prisma.alumno.count({
          where: { packType: id, ...ownerFilter, deletedAt: null }
        })
        if (alumnosConPack > 0) {
          return NextResponse.json({
            error: `No podés eliminar este pack porque ${alumnosConPack} alumno${alumnosConPack > 1 ? 's lo usan' : ' lo usa'}. Cambiá su pack primero.`
          }, { status: 400 })
        }

        // Soft delete: marcar como eliminado en lugar de borrar
        await prisma.pack.update({
          where: { id },
          data: { deletedAt: new Date() }
        })
        invalidatePacks()
        return NextResponse.json({ success: true })
      }

      case 'updateProfile': {
        const parsedProfile = updateProfileSchema.safeParse(data)
        if (!parsedProfile.success) {
          return badRequest(parsedProfile.error.issues[0].message)
        }
        const { nombre, telefono } = parsedProfile.data
        await prisma.user.update({
          where: { id: userId },
          data: { nombre, telefono }
        })
        invalidateConfig()
        return NextResponse.json({ success: true })
      }

      case 'changePassword': {
        const parsedPassword = changePasswordSchema.safeParse(data)
        if (!parsedPassword.success) {
          return badRequest(parsedPassword.error.issues[0].message)
        }
        const { currentPassword, newPassword } = parsedPassword.data

        const user = await prisma.user.findUnique({ where: { id: userId } })
        if (!user || !user.password) {
          return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
        }

        const isValid = await verifyPassword(currentPassword, user.password)
        if (!isValid) {
          return NextResponse.json({ error: 'Contraseña actual incorrecta' }, { status: 400 })
        }

        const hashedPassword = await hashPassword(newPassword)
        await prisma.user.update({
          where: { id: userId },
          data: { password: hashedPassword }
        })
        return NextResponse.json({ success: true })
      }

      case 'updatePreferencias': {
        // Verificar permiso para editar configuración
        if (estudio && !hasPermission(estudio.rol, 'edit:configuracion')) {
          return forbidden('No tienes permiso para modificar preferencias')
        }

        const parsedPrefs = updatePreferenciasSchema.safeParse(data)
        if (!parsedPrefs.success) {
          return badRequest(parsedPrefs.error.issues[0].message)
        }
        const {
          horasAnticipacionMinima,
          maxAlumnosPorClase,
          horarioMananaInicio,
          horarioMananaFin,
          turnoMananaActivo,
          horarioTardeInicio,
          horarioTardeFin,
          turnoTardeActivo,
          syncGoogleCalendar,
          precioPorClase
        } = parsedPrefs.data

        // Validar horarios (relaciones entre campos)
        if (horarioMananaInicio && horarioMananaFin && horarioMananaInicio >= horarioMananaFin) {
          return badRequest('El horario de mañana: inicio debe ser antes del fin')
        }

        if (horarioTardeInicio && horarioTardeFin && horarioTardeInicio >= horarioTardeFin) {
          return badRequest('El horario de tarde: inicio debe ser antes del fin')
        }

        // Validar que mañana y tarde no se solapen
        if (horarioMananaFin && horarioTardeInicio && horarioMananaFin > horarioTardeInicio) {
          return badRequest('El horario de mañana no puede solaparse con el de tarde')
        }

        // Actualizar estudio o usuario según contexto
        if (estudio) {
          await prisma.estudio.update({
            where: { id: estudio.estudioId },
            data: {
              horasAnticipacionMinima,
              maxAlumnosPorClase,
              horarioMananaInicio,
              horarioMananaFin,
              turnoMananaActivo,
              horarioTardeInicio,
              horarioTardeFin,
              turnoTardeActivo,
              precioPorClase
            }
          })
        } else {
          await prisma.user.update({
            where: { id: userId },
            data: {
              horasAnticipacionMinima,
              maxAlumnosPorClase,
              horarioMananaInicio,
              horarioMananaFin,
              turnoMananaActivo,
              horarioTardeInicio,
              horarioTardeFin,
              turnoTardeActivo,
              syncGoogleCalendar,
              precioPorClase
            }
          })
        }
        invalidateConfig()
        return NextResponse.json({ success: true })
      }

      default:
        return badRequest('Acción no válida')
    }
  } catch (error) {
    return serverError(error)
  }
}
