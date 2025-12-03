import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, hashPassword, verifyPassword } from '@/lib/auth'

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

      case 'deleteHorario': {
        const { id } = data
        await prisma.horarioDisponible.delete({ where: { id } })
        return NextResponse.json({ success: true })
      }

      case 'toggleHorario': {
        const { id } = data
        const horario = await prisma.horarioDisponible.findUnique({ where: { id } })
        if (!horario) {
          return NextResponse.json({ error: 'Horario no encontrado' }, { status: 404 })
        }
        await prisma.horarioDisponible.update({
          where: { id },
          data: { estaActivo: !horario.estaActivo }
        })
        return NextResponse.json({ success: true })
      }

      case 'savePack': {
        const { id, nombre, clasesPorSemana, precio, estaActivo } = data
        let pack

        if (id) {
          pack = await prisma.pack.update({
            where: { id },
            data: { nombre, clasesPorSemana, precio, estaActivo }
          })
        } else {
          pack = await prisma.pack.create({
            data: { profesorId: userId, nombre, clasesPorSemana, precio, estaActivo: true }
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

      case 'togglePack': {
        const { id } = data
        const pack = await prisma.pack.findUnique({ where: { id } })
        if (!pack) {
          return NextResponse.json({ error: 'Pack no encontrado' }, { status: 404 })
        }
        await prisma.pack.update({
          where: { id },
          data: { estaActivo: !pack.estaActivo }
        })
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
          horarioTardeInicio,
          horarioTardeFin,
          espacioCompartidoId,
          syncGoogleCalendar
        } = data

        const espacioNormalizado = espacioCompartidoId?.trim().toLowerCase() || null

        await prisma.user.update({
          where: { id: userId },
          data: {
            horasAnticipacionMinima,
            maxAlumnosPorClase,
            horarioMananaInicio,
            horarioMananaFin,
            horarioTardeInicio,
            horarioTardeFin,
            espacioCompartidoId: espacioNormalizado,
            syncGoogleCalendar
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
