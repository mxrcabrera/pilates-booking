import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, hashPassword, verifyPassword } from '@/lib/auth-utils'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const userId = await getCurrentUser()
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        horariosDisponibles: {
          orderBy: [{ diaSemana: 'asc' }, { horaInicio: 'asc' }]
        },
        packs: {
          orderBy: { createdAt: 'desc' }
        },
        accounts: {
          select: { provider: true }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const hasGoogleAccount = user.accounts.some(account => account.provider === 'google')

    return NextResponse.json({
      profesor: {
        id: user.id,
        horasAnticipacionMinima: user.horasAnticipacionMinima,
        maxAlumnosPorClase: user.maxAlumnosPorClase,
        horarioMananaInicio: user.horarioMananaInicio,
        horarioMananaFin: user.horarioMananaFin,
        turnoMananaActivo: user.turnoMananaActivo,
        horarioTardeInicio: user.horarioTardeInicio,
        horarioTardeFin: user.horarioTardeFin,
        turnoTardeActivo: user.turnoTardeActivo,
        espacioCompartidoId: user.espacioCompartidoId,
        syncGoogleCalendar: user.syncGoogleCalendar,
        precioPorClase: user.precioPorClase?.toString() || '0',
        hasGoogleAccount
      },
      horarios: user.horariosDisponibles,
      packs: user.packs.map(pack => ({
        id: pack.id,
        nombre: pack.nombre,
        clasesPorSemana: pack.clasesPorSemana,
        precio: pack.precio.toString()
      }))
    })
  } catch (error: any) {
    console.error('Config GET error:', error)
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
            where: { profesorId: userId, diaSemana, esManiana }
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

        // Construir keys para los horarios a crear/actualizar
        const keysToUpsert = horariosData.map(h => `${h.diaSemana}-${h.esManiana}`)

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

        return NextResponse.json({ success: true, horarios: resultados })
      }

      case 'deleteHorario': {
        const { id } = data
        await prisma.horarioDisponible.delete({ where: { id } })
        return NextResponse.json({ success: true })
      }

      case 'toggleHorario': {
        const { id } = data
        // Usar raw SQL para toggle en una sola query
        const result = await prisma.$executeRaw`
          UPDATE "HorarioDisponible"
          SET "estaActivo" = NOT "estaActivo"
          WHERE id = ${id}
        `
        if (result === 0) {
          return NextResponse.json({ error: 'Horario no encontrado' }, { status: 404 })
        }
        return NextResponse.json({ success: true })
      }

      case 'savePack': {
        const { id, nombre, clasesPorSemana, precio } = data
        let pack

        if (id) {
          pack = await prisma.pack.update({
            where: { id },
            data: { nombre, clasesPorSemana, precio }
          })
        } else {
          pack = await prisma.pack.create({
            data: { profesorId: userId, nombre, clasesPorSemana, precio }
          })
        }
        return NextResponse.json({ success: true, pack })
      }

      case 'deletePack': {
        const { id } = data
        const pack = await prisma.pack.findUnique({ where: { id } })
        if (!pack || pack.profesorId !== userId) {
          return NextResponse.json({ error: 'Pack no encontrado' }, { status: 404 })
        }
        await prisma.pack.delete({ where: { id } })
        return NextResponse.json({ success: true })
      }

      case 'updateProfile': {
        const { nombre, telefono } = data
        await prisma.user.update({
          where: { id: userId },
          data: { nombre, telefono }
        })
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
        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Config error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
