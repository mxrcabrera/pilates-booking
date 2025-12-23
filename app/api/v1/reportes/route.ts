import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { getErrorMessage } from '@/lib/utils'
import { logger } from '@/lib/logger'
import { getEffectiveFeatures } from '@/lib/plans'

export const runtime = 'nodejs'

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export async function GET(request: Request) {
  try {
    const userId = await getCurrentUser()
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permisos del plan
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, trialEndsAt: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const features = getEffectiveFeatures(user.plan, user.trialEndsAt)
    if (!features.reportesBasicos) {
      return NextResponse.json({ canAccess: false })
    }

    // Parsear query params
    const { searchParams } = new URL(request.url)
    const mes = parseInt(searchParams.get('mes') || String(new Date().getMonth()))
    const año = parseInt(searchParams.get('año') || String(new Date().getFullYear()))

    const fechaInicio = startOfMonth(new Date(año, mes))
    const fechaFin = endOfMonth(new Date(año, mes))
    const fechaInicioAnterior = startOfMonth(subMonths(fechaInicio, 1))
    const fechaFinAnterior = endOfMonth(subMonths(fechaInicio, 1))

    // Obtener datos en paralelo
    const [
      alumnosActivos,
      alumnosActivosAnterior,
      pagosMes,
      pagosMesAnterior,
      clasesMes,
      clasesMesAnterior,
      pagosEstado
    ] = await Promise.all([
      // Alumnos activos actuales
      prisma.alumno.count({
        where: { profesorId: userId, estaActivo: true }
      }),
      // Alumnos activos mes anterior (aproximación - contamos los que existían)
      prisma.alumno.count({
        where: {
          profesorId: userId,
          estaActivo: true,
          creadoEn: { lte: fechaFinAnterior }
        }
      }),
      // Pagos del mes actual
      prisma.pago.aggregate({
        where: {
          alumno: { profesorId: userId },
          estado: 'pagado',
          fechaPago: { gte: fechaInicio, lte: fechaFin }
        },
        _sum: { monto: true },
        _count: true
      }),
      // Pagos del mes anterior
      prisma.pago.aggregate({
        where: {
          alumno: { profesorId: userId },
          estado: 'pagado',
          fechaPago: { gte: fechaInicioAnterior, lte: fechaFinAnterior }
        },
        _sum: { monto: true },
        _count: true
      }),
      // Clases del mes actual
      prisma.clase.findMany({
        where: {
          profesorId: userId,
          fecha: { gte: fechaInicio, lte: fechaFin },
          alumnoId: { not: null }
        },
        select: {
          asistencia: true,
          horaInicio: true,
          fecha: true
        }
      }),
      // Clases del mes anterior
      prisma.clase.count({
        where: {
          profesorId: userId,
          fecha: { gte: fechaInicioAnterior, lte: fechaFinAnterior },
          alumnoId: { not: null },
          asistencia: 'presente'
        }
      }),
      // Estado de pagos actual
      prisma.pago.groupBy({
        by: ['estado'],
        where: {
          alumno: { profesorId: userId },
          fechaVencimiento: { gte: fechaInicio, lte: fechaFin }
        },
        _count: true
      })
    ])

    // Calcular métricas
    const ingresosMes = Number(pagosMes._sum.monto || 0)
    const ingresosMesAnterior = Number(pagosMesAnterior._sum.monto || 0)
    const clasesDictadas = clasesMes.filter(c => c.asistencia === 'presente').length
    const presentes = clasesMes.filter(c => c.asistencia === 'presente').length
    const ausentes = clasesMes.filter(c => c.asistencia === 'ausente').length

    // Trends
    const alumnosTrend = alumnosActivosAnterior > 0
      ? ((alumnosActivos - alumnosActivosAnterior) / alumnosActivosAnterior) * 100
      : 0
    const ingresosTrend = ingresosMesAnterior > 0
      ? ((ingresosMes - ingresosMesAnterior) / ingresosMesAnterior) * 100
      : 0
    const clasesTrend = clasesMesAnterior > 0
      ? ((clasesDictadas - clasesMesAnterior) / clasesMesAnterior) * 100
      : 0

    // Tasa de asistencia
    const totalClasesConAsistencia = presentes + ausentes
    const tasaAsistencia = totalClasesConAsistencia > 0
      ? Math.round((presentes / totalClasesConAsistencia) * 100)
      : 0

    // Pagos por estado
    const pagosMap = Object.fromEntries(pagosEstado.map(p => [p.estado, p._count]))

    // Ocupación y patrones
    const horaCount: Record<string, number> = {}
    const diaCount: Record<number, number> = {}

    for (const clase of clasesMes) {
      const hora = clase.horaInicio.slice(0, 5)
      horaCount[hora] = (horaCount[hora] || 0) + 1
      const dia = new Date(clase.fecha).getDay()
      diaCount[dia] = (diaCount[dia] || 0) + 1
    }

    const horasPico = Object.entries(horaCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'
    const diaPicoNum = Object.entries(diaCount).sort((a, b) => b[1] - a[1])[0]?.[0]
    const diaPico = diaPicoNum !== undefined ? DIAS_SEMANA[parseInt(diaPicoNum)] : '-'

    // Ocupación promedio (simplificada)
    const ocupacionPromedio = clasesMes.length > 0 ? Math.round((presentes / clasesMes.length) * 100) : 0

    return NextResponse.json({
      canAccess: true,
      metricas: {
        alumnosActivos,
        alumnosTrend,
        ingresosMes,
        ingresosTrend,
        clasesDictadas,
        clasesTrend
      },
      asistencia: {
        presentes,
        ausentes,
        tasaAsistencia
      },
      pagos: {
        pagados: pagosMap['pagado'] || 0,
        pendientes: pagosMap['pendiente'] || 0,
        vencidos: pagosMap['vencido'] || 0
      },
      ocupacion: {
        promedio: ocupacionPromedio,
        horasPico,
        diaPico
      }
    })
  } catch (error) {
    logger.error('Reportes GET error', error)
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
  }
}
