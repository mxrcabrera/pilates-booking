import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, hashPassword, verifyPassword } from '@/lib/auth'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { getCachedPacks, getCachedHorarios, getCachedProfesorConfig } from '@/lib/server-cache'
import { invalidatePacks, invalidateHorarios, invalidateConfig } from '@/lib/cache-utils'
import { unauthorized, badRequest, notFound, tooManyRequests, serverError } from '@/lib/api-utils'

export const runtime = 'nodejs'

// Rate limit: 20 requests por minuto para POST
const POST_LIMIT = 20
const WINDOW_MS = 60 * 1000

export async function GET() {
  try {
    const userId = await getCurrentUser()
    if (!userId) {
      return unauthorized()
    }

    // Usar cache para datos que cambian poco
    const [profesor, horarios, packs, accounts] = await Promise.all([
      getCachedProfesorConfig(userId),
      getCachedHorarios(userId),
      getCachedPacks(userId),
      prisma.account.findMany({
        where: { userId },
        select: { provider: true }
      })
    ])

    if (!profesor) {
      return notFound('Usuario no encontrado')
    }

    const hasGoogleAccount = accounts.some(account => account.provider === 'google')

    return NextResponse.json({
      profesor: {
        ...profesor,
        hasGoogleAccount
      },
      horarios,
      packs
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

    const userId = await getCurrentUser()
    if (!userId) {
      return unauthorized()
    }

    const body = await request.json()
    const { action, ...data } = body

    switch (action) {
      case 'saveHorario': {
        const { id, diaSemana, horaInicio, horaFin, esManiana } = data

        // Obtener horarios por defecto configurados
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            horarioMananaInicio: true,
            horarioMananaFin: true,
            horarioTardeInicio: true,
            horarioTardeFin: true
          }
        })

        if (!user) {
          return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
        }

        // Validar que los horarios estén dentro del rango configurado
        if (esManiana) {
          if (horaInicio < user.horarioMananaInicio || horaFin > user.horarioMananaFin) {
            return NextResponse.json({
              error: `El horario de mañana debe estar entre ${user.horarioMananaInicio} y ${user.horarioMananaFin}`
            }, { status: 400 })
          }
        } else {
          if (horaInicio < user.horarioTardeInicio || horaFin > user.horarioTardeFin) {
            return NextResponse.json({
              error: `El horario de tarde debe estar entre ${user.horarioTardeInicio} y ${user.horarioTardeFin}`
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
          horario = await prisma.horarioDisponible.update({
            where: { id },
            data: { diaSemana, horaInicio, horaFin, esManiana }
          })
        } else {
          const existente = await prisma.horarioDisponible.findFirst({
            where: { profesorId: userId, diaSemana, esManiana, deletedAt: null }
          })

          if (existente) {
            horario = await prisma.horarioDisponible.update({
              where: { id: existente.id },
              data: { horaInicio, horaFin }
            })
          } else {
            horario = await prisma.horarioDisponible.create({
              data: { profesorId: userId, diaSemana, horaInicio, horaFin, esManiana }
            })
          }
        }

        invalidateHorarios()
        return NextResponse.json({ success: true, horario })
      }

      case 'saveHorariosBatch': {
        const { horarios: horariosData } = data as {
          horarios: Array<{ diaSemana: number; horaInicio: string; horaFin: string; esManiana: boolean }>
        }

        if (!horariosData || !Array.isArray(horariosData) || horariosData.length === 0) {
          return NextResponse.json({ error: 'No hay horarios para crear' }, { status: 400 })
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
              profesorId: userId,
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
            profesorId: userId,
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
        const { id } = data

        // Validar que el horario pertenece al profesor
        const horario = await prisma.horarioDisponible.findFirst({
          where: { id, profesorId: userId, deletedAt: null }
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
        const { id } = data

        // Validar que el horario pertenece al profesor
        const horario = await prisma.horarioDisponible.findFirst({
          where: { id, profesorId: userId, deletedAt: null }
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
        const { id, nombre, clasesPorSemana, precio } = data

        // Validar campos
        if (!nombre?.trim()) {
          return NextResponse.json({ error: 'El nombre del pack es obligatorio' }, { status: 400 })
        }

        const clasesPorSemanaNum = parseInt(clasesPorSemana)
        if (isNaN(clasesPorSemanaNum) || clasesPorSemanaNum < 1) {
          return NextResponse.json({ error: 'Las clases por semana deben ser al menos 1' }, { status: 400 })
        }

        const precioNum = parseFloat(precio)
        if (isNaN(precioNum) || precioNum <= 0) {
          return NextResponse.json({ error: 'El precio debe ser mayor a 0' }, { status: 400 })
        }

        let pack
        if (id) {
          // Validar que el pack pertenece al profesor
          const packExistente = await prisma.pack.findFirst({
            where: { id, profesorId: userId, deletedAt: null }
          })
          if (!packExistente) {
            return NextResponse.json({ error: 'Pack no encontrado' }, { status: 404 })
          }

          pack = await prisma.pack.update({
            where: { id },
            data: { nombre, clasesPorSemana: clasesPorSemanaNum, precio: precioNum }
          })
        } else {
          pack = await prisma.pack.create({
            data: { profesorId: userId, nombre, clasesPorSemana: clasesPorSemanaNum, precio: precioNum }
          })
        }
        invalidatePacks()
        return NextResponse.json({ success: true, pack })
      }

      case 'deletePack': {
        const { id } = data
        const pack = await prisma.pack.findFirst({
          where: { id, profesorId: userId, deletedAt: null }
        })
        if (!pack) {
          return NextResponse.json({ error: 'Pack no encontrado' }, { status: 404 })
        }

        // Verificar si hay alumnos usando este pack
        const alumnosConPack = await prisma.alumno.count({
          where: { packType: id, profesorId: userId, deletedAt: null }
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
        const { nombre, telefono } = data
        await prisma.user.update({
          where: { id: userId },
          data: { nombre, telefono }
        })
        invalidateConfig()
        return NextResponse.json({ success: true })
      }

      case 'changePassword': {
        const { currentPassword, newPassword, confirmPassword } = data

        if (newPassword !== confirmPassword) {
          return NextResponse.json({ error: 'Las contraseñas no coinciden' }, { status: 400 })
        }

        if (newPassword.length < 6) {
          return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
        }

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
        const {
          horasAnticipacionMinima,
          maxAlumnosPorClase,
          horarioMananaInicio,
          horarioMananaFin,
          turnoMananaActivo,
          horarioTardeInicio,
          horarioTardeFin,
          turnoTardeActivo,
          espacioCompartidoId,
          syncGoogleCalendar,
          precioPorClase
        } = data

        // Validar valores numéricos
        if (horasAnticipacionMinima !== undefined && (isNaN(horasAnticipacionMinima) || horasAnticipacionMinima < 0)) {
          return NextResponse.json({ error: 'Las horas de anticipación deben ser 0 o más' }, { status: 400 })
        }

        if (maxAlumnosPorClase !== undefined && (isNaN(maxAlumnosPorClase) || maxAlumnosPorClase < 1)) {
          return NextResponse.json({ error: 'El máximo de alumnos debe ser al menos 1' }, { status: 400 })
        }

        // Validar horarios
        if (horarioMananaInicio && horarioMananaFin && horarioMananaInicio >= horarioMananaFin) {
          return NextResponse.json({ error: 'El horario de mañana: inicio debe ser antes del fin' }, { status: 400 })
        }

        if (horarioTardeInicio && horarioTardeFin && horarioTardeInicio >= horarioTardeFin) {
          return NextResponse.json({ error: 'El horario de tarde: inicio debe ser antes del fin' }, { status: 400 })
        }

        // Validar que mañana y tarde no se solapen
        if (horarioMananaFin && horarioTardeInicio && horarioMananaFin > horarioTardeInicio) {
          return NextResponse.json({ error: 'El horario de mañana no puede solaparse con el de tarde' }, { status: 400 })
        }

        if (precioPorClase !== undefined) {
          const precioNum = parseFloat(precioPorClase)
          if (isNaN(precioNum) || precioNum < 0) {
            return NextResponse.json({ error: 'El precio por clase debe ser 0 o más' }, { status: 400 })
          }
        }

        const espacioNormalizado = espacioCompartidoId?.trim().toLowerCase() || null

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
            espacioCompartidoId: espacioNormalizado,
            syncGoogleCalendar,
            ...(precioPorClase !== undefined && { precioPorClase: parseFloat(precioPorClase) || 0 })
          }
        })
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
