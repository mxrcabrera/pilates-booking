import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserContext, getOwnerFilter } from '@/lib/auth'
import { startOfMonth, endOfMonth, subMonths, format, startOfYear, endOfYear, subYears } from 'date-fns'
import { es } from 'date-fns/locale'
import { getEffectiveFeatures } from '@/lib/plans'
import { unauthorized, serverError } from '@/lib/api-utils'
import { DIAS_SEMANA_COMPLETO, DIAS_SEMANA } from '@/lib/constants'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const context = await getUserContext()
    if (!context) {
      return unauthorized()
    }

    const { userId } = context

    const ownerFilter = getOwnerFilter(context)

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
        where: { ...ownerFilter, estaActivo: true, deletedAt: null }
      }),
      // Alumnos activos mes anterior (aproximación - contamos los que existían)
      prisma.alumno.count({
        where: {
          ...ownerFilter,
          estaActivo: true,
          deletedAt: null,
          createdAt: { lte: fechaFinAnterior }
        }
      }),
      // Pagos del mes actual
      prisma.pago.aggregate({
        where: {
          alumno: ownerFilter,
          estado: 'pagado',
          deletedAt: null,
          fechaPago: { gte: fechaInicio, lte: fechaFin }
        },
        _sum: { monto: true },
        _count: true
      }),
      // Pagos del mes anterior
      prisma.pago.aggregate({
        where: {
          alumno: ownerFilter,
          estado: 'pagado',
          deletedAt: null,
          fechaPago: { gte: fechaInicioAnterior, lte: fechaFinAnterior }
        },
        _sum: { monto: true },
        _count: true
      }),
      // Clases del mes actual
      prisma.clase.findMany({
        where: {
          ...ownerFilter,
          deletedAt: null,
          fecha: { gte: fechaInicio, lte: fechaFin },
          alumnoId: { not: null }
        },
        select: {
          asistencia: true,
          horaInicio: true,
          fecha: true
        },
        take: 5000
      }),
      // Clases del mes anterior
      prisma.clase.count({
        where: {
          ...ownerFilter,
          deletedAt: null,
          fecha: { gte: fechaInicioAnterior, lte: fechaFinAnterior },
          alumnoId: { not: null },
          asistencia: 'presente'
        }
      }),
      // Estado de pagos actual
      prisma.pago.groupBy({
        by: ['estado'],
        where: {
          alumno: ownerFilter,
          deletedAt: null,
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
    const diaPico = diaPicoNum !== undefined ? DIAS_SEMANA_COMPLETO[parseInt(diaPicoNum)] : '-'

    // Ocupación promedio (simplificada)
    const ocupacionPromedio = clasesMes.length > 0 ? Math.round((presentes / clasesMes.length) * 100) : 0

    // ===== DATOS HISTÓRICOS PARA GRÁFICOS (últimos 6 meses) =====
    const historico = await Promise.all(
      Array.from({ length: 6 }, (_, idx) => {
        const i = 5 - idx
        const fecha = subMonths(new Date(), i)
        const inicioMes = startOfMonth(fecha)
        const finMes = endOfMonth(fecha)

        return Promise.all([
          prisma.pago.aggregate({
            where: {
              alumno: ownerFilter,
              estado: 'pagado',
              deletedAt: null,
              fechaPago: { gte: inicioMes, lte: finMes }
            },
            _sum: { monto: true }
          }),
          prisma.clase.count({
            where: {
              ...ownerFilter,
              deletedAt: null,
              fecha: { gte: inicioMes, lte: finMes },
              alumnoId: { not: null },
              asistencia: 'presente'
            }
          }),
          prisma.alumno.count({
            where: {
              ...ownerFilter,
              estaActivo: true,
              deletedAt: null,
              createdAt: { lte: finMes }
            }
          })
        ]).then(([pagosHist, clasesHist, alumnosHist]) => ({
          mes: format(fecha, 'MMM', { locale: es }),
          ingresos: Number(pagosHist._sum.monto || 0),
          clases: clasesHist,
          alumnos: alumnosHist
        }))
      })
    )

    // ===== DISTRIBUCIÓN POR DÍA DE SEMANA =====
    const asistenciaPorDia: Array<{ dia: string; clases: number; asistencia: number }> = []
    for (let d = 1; d <= 6; d++) { // Lun a Sáb (0=Dom, 1=Lun...)
      const clasesDelDia = clasesMes.filter(c => new Date(c.fecha).getDay() === d)
      const presentesDelDia = clasesDelDia.filter(c => c.asistencia === 'presente').length
      asistenciaPorDia.push({
        dia: DIAS_SEMANA[d],
        clases: clasesDelDia.length,
        asistencia: clasesDelDia.length > 0 ? Math.round((presentesDelDia / clasesDelDia.length) * 100) : 0
      })
    }

    // ===== DISTRIBUCIÓN DE PACKS =====
    const alumnosConPack = await prisma.alumno.groupBy({
      by: ['packType'],
      where: {
        ...ownerFilter,
        estaActivo: true,
        deletedAt: null
      },
      _count: true
    })

    const distribucionPacks = alumnosConPack.map(p => ({
      pack: p.packType || 'Sin pack',
      cantidad: p._count
    }))

    // ===== HORARIOS MÁS USADOS =====
    const horariosData = Object.entries(horaCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([hora, cantidad]) => ({ hora, cantidad }))

    // ===== REPORTES AVANZADOS (solo plan ESTUDIO) =====
    let avanzados = undefined
    if (features.reportesAvanzados) {
      const inicioAñoActual = startOfYear(new Date())
      const finAñoActual = endOfYear(new Date())
      const inicioAñoAnterior = startOfYear(subYears(new Date(), 1))
      const finAñoAnterior = endOfYear(subYears(new Date(), 1))

      const [
        ingresosAñoActual,
        ingresosAñoAnterior,
        alumnosHace3Meses,
        topAlumnosData
      ] = await Promise.all([
        // Ingresos este año
        prisma.pago.aggregate({
          where: {
            alumno: ownerFilter,
            estado: 'pagado',
            deletedAt: null,
            fechaPago: { gte: inicioAñoActual, lte: finAñoActual }
          },
          _sum: { monto: true }
        }),
        // Ingresos año anterior
        prisma.pago.aggregate({
          where: {
            alumno: ownerFilter,
            estado: 'pagado',
            deletedAt: null,
            fechaPago: { gte: inicioAñoAnterior, lte: finAñoAnterior }
          },
          _sum: { monto: true }
        }),
        // Alumnos hace 3 meses (para calcular retención)
        prisma.alumno.count({
          where: {
            ...ownerFilter,
            estaActivo: true,
            deletedAt: null,
            createdAt: { lte: subMonths(new Date(), 3) }
          }
        }),
        // Top alumnos por clases
        prisma.alumno.findMany({
          where: {
            ...ownerFilter,
            estaActivo: true,
            deletedAt: null
          },
          select: {
            id: true,
            nombre: true,
            _count: {
              select: {
                clases: {
                  where: {
                    fecha: { gte: fechaInicio, lte: fechaFin },
                    asistencia: 'presente'
                  }
                }
              }
            }
          },
          orderBy: {
            clases: { _count: 'desc' }
          },
          take: 5
        })
      ])

      // Calcular métricas
      const ingresosEsteAño = Number(ingresosAñoActual._sum.monto || 0)
      const ingresosAñoAnt = Number(ingresosAñoAnterior._sum.monto || 0)
      const variacionAnual = ingresosAñoAnt > 0
        ? Math.round(((ingresosEsteAño - ingresosAñoAnt) / ingresosAñoAnt) * 100)
        : 0

      // Proyección: promedio mensual de últimos 3 meses * 12
      const promedioMensual = historico.slice(-3).reduce((sum, h) => sum + h.ingresos, 0) / 3
      const proyeccionIngresos = Math.round(promedioMensual * 12)

      // Ingreso por alumno
      const ingresosPorAlumno = alumnosActivos > 0
        ? Math.round(ingresosMes / alumnosActivos)
        : 0

      // Tasa de retención: alumnos activos que estaban hace 3 meses / total hace 3 meses
      const tasaRetencion = alumnosHace3Meses > 0
        ? Math.round((Math.min(alumnosActivos, alumnosHace3Meses) / alumnosHace3Meses) * 100)
        : 100

      // Top alumnos con cálculo de asistencia
      const topAlumnos = await Promise.all(
        topAlumnosData.map(async (a) => {
          const totalClases = await prisma.clase.count({
            where: {
              alumnoId: a.id,
              deletedAt: null,
              fecha: { gte: fechaInicio, lte: fechaFin }
            }
          })
          const clasesPresente = a._count.clases
          return {
            nombre: a.nombre,
            clases: clasesPresente,
            asistencia: totalClases > 0 ? Math.round((clasesPresente / totalClases) * 100) : 0
          }
        })
      )

      avanzados = {
        proyeccionIngresos,
        ingresosPorAlumno,
        tasaRetencion,
        comparativaAnual: {
          ingresosEsteAño,
          ingresosAñoAnterior: ingresosAñoAnt,
          variacion: variacionAnual
        },
        topAlumnos
      }
    }

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
      },
      // Datos para gráficos
      graficos: {
        historico,
        asistenciaPorDia,
        distribucionPacks,
        horarios: horariosData
      },
      // Reportes avanzados (solo plan ESTUDIO)
      avanzados
    })
  } catch (error) {
    return serverError(error)
  }
}
