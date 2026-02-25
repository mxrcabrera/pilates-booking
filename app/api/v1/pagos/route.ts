import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserContext, hasPermission } from '@/lib/auth'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { getPaginationParams, paginatedResponse } from '@/lib/pagination'
import { pagoActionSchema } from '@/lib/schemas/pago.schema'
import { unauthorized, badRequest, notFound, tooManyRequests, serverError, forbidden } from '@/lib/api-utils'
import { getEffectiveFeatures } from '@/lib/plans'
import type { PagoEstado } from '@prisma/client'

export const runtime = 'nodejs'

// Rate limit: 20 requests por minuto para POST
const POST_LIMIT = 20
const WINDOW_MS = 60 * 1000

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const alumnoId = searchParams.get('alumnoId')
  const estado = searchParams.get('estado') as PagoEstado | null

  try {
    const context = await getUserContext()
    if (!context) {
      return unauthorized()
    }

    const { userId, estudio } = context

    // Filtro por estudio o profesor
    const ownerFilter = estudio
      ? { estudioId: estudio.estudioId }
      : { profesorId: userId }

    const { page, limit, skip } = getPaginationParams(request)

    // Si se pide pagos de un alumno específico
    if (alumnoId) {
      const alumno = await prisma.alumno.findFirst({
        where: { id: alumnoId, ...ownerFilter, deletedAt: null }
      })

      if (!alumno) {
        return notFound('Alumno no encontrado')
      }

      const whereAlumno = {
        alumnoId,
        deletedAt: null,
        ...(estado && { estado })
      }

      const [pagosRaw, total] = await Promise.all([
        prisma.pago.findMany({
          where: whereAlumno,
          skip,
          take: limit,
          orderBy: { fechaVencimiento: 'desc' }
        }),
        prisma.pago.count({ where: whereAlumno })
      ])

      const pagos = pagosRaw.map(p => ({
        id: p.id,
        monto: p.monto.toString(),
        fechaPago: p.fechaPago?.toISOString() || null,
        fechaVencimiento: p.fechaVencimiento.toISOString(),
        estado: p.estado,
        mesCorrespondiente: p.mesCorrespondiente,
        profesorId: p.profesorId
      }))

      const paginatedData = paginatedResponse(pagos, total, { page, limit, skip })

      return NextResponse.json({
        ...paginatedData,
        pagos
      })
    }

    // Construir where para todos los pagos - filtrar por estudio o profesor
    const where = {
      alumno: {
        ...ownerFilter,
        deletedAt: null
      },
      deletedAt: null,
      ...(estado && { estado })
    }

    // Obtener pagos paginados y total
    const [pagosRaw, total] = await Promise.all([
      prisma.pago.findMany({
        where,
        skip,
        take: limit,
        include: {
          alumno: {
            select: {
              id: true,
              nombre: true,
              email: true
            }
          }
        },
        orderBy: { fechaVencimiento: 'desc' }
      }),
      prisma.pago.count({ where })
    ])

    // Obtener clases completadas por alumno/mes para calcular progreso
    const clasesCompletadasMap = new Map<string, number>()
    const pagosMensuales = pagosRaw.filter(p => p.tipoPago === 'mensual' && p.clasesEsperadas)

    if (pagosMensuales.length > 0) {
      const alumnoIds = [...new Set(pagosMensuales.map(p => p.alumnoId))]

      let minDate: Date | null = null
      let maxDate: Date | null = null

      const mesesNombres = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                            'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

      for (const pago of pagosMensuales) {
        let year: number, month: number
        const matchYYYYMM = pago.mesCorrespondiente.match(/^(\d{4})-(\d{2})$/)
        if (matchYYYYMM) {
          year = parseInt(matchYYYYMM[1])
          month = parseInt(matchYYYYMM[2])
        } else {
          const parts = pago.mesCorrespondiente.toLowerCase().split(' ')
          month = mesesNombres.indexOf(parts[0]) + 1
          year = parseInt(parts[1])
        }

        if (year && month) {
          const startDate = new Date(year, month - 1, 1)
          const endDate = new Date(year, month, 0)
          if (!minDate || startDate < minDate) minDate = startDate
          if (!maxDate || endDate > maxDate) maxDate = endDate
        }
      }

      if (minDate && maxDate) {
        const clasesCompletadas = await prisma.clase.findMany({
          where: {
            alumnoId: { in: alumnoIds },
            fecha: { gte: minDate, lte: maxDate },
            estado: 'completada',
            deletedAt: null
          },
          select: {
            alumnoId: true,
            fecha: true
          }
        })

        for (const clase of clasesCompletadas) {
          const year = clase.fecha.getFullYear()
          const month = clase.fecha.getMonth() + 1
          const mesKey1 = `${year}-${month.toString().padStart(2, '0')}`
          const mesKey2 = `${mesesNombres[month - 1]} ${year}`

          for (const pago of pagosMensuales) {
            if (pago.alumnoId === clase.alumnoId) {
              const key = `${pago.alumnoId}-${pago.mesCorrespondiente}`
              if (pago.mesCorrespondiente === mesKey1 || pago.mesCorrespondiente.toLowerCase() === mesKey2) {
                clasesCompletadasMap.set(key, (clasesCompletadasMap.get(key) || 0) + 1)
              }
            }
          }
        }
      }
    }

    const pagos = pagosRaw.map(p => ({
      ...p,
      monto: p.monto.toString(),
      fechaPago: p.fechaPago?.toISOString() || null,
      fechaVencimiento: p.fechaVencimiento.toISOString(),
      clasesCompletadas: clasesCompletadasMap.get(`${p.alumnoId}-${p.mesCorrespondiente}`) || 0
    }))

    // Obtener config (estudio o usuario) para features y alumnos activos para el formulario
    const [configData, alumnos] = await Promise.all([
      estudio
        ? prisma.estudio.findUnique({
            where: { id: estudio.estudioId },
            select: { plan: true, trialEndsAt: true }
          })
        : prisma.user.findUnique({
            where: { id: userId },
            select: { plan: true, trialEndsAt: true }
          }),
      prisma.alumno.findMany({
        where: {
          ...ownerFilter,
          estaActivo: true,
          deletedAt: null
        },
        select: {
          id: true,
          nombre: true,
          precio: true,
          packType: true,
          diaInicioCiclo: true,
          saldoAFavor: true
        },
        orderBy: { nombre: 'asc' }
      })
    ])

    const features = configData ? getEffectiveFeatures(configData.plan, configData.trialEndsAt) : null

    const alumnosSerializados = alumnos.map(a => ({
      id: a.id,
      nombre: a.nombre,
      precio: a.precio.toString(),
      packType: a.packType,
      diaInicioCiclo: a.diaInicioCiclo,
      saldoAFavor: a.saldoAFavor.toString()
    }))

    const paginatedData = paginatedResponse(pagos, total, { page, limit, skip })

    return NextResponse.json({
      ...paginatedData,
      pagos,
      alumnos: alumnosSerializados,
      features: {
        exportarExcel: features?.exportarExcel ?? false,
        plan: configData?.plan || 'FREE'
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
    const { success } = rateLimit(`pagos:${ip}`, POST_LIMIT, WINDOW_MS)
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

    // Validar con Zod schema
    const body = await request.json()
    const parsed = pagoActionSchema.safeParse(body)

    if (!parsed.success) {
      return badRequest('Datos inválidos', parsed.error.flatten())
    }

    const { action } = parsed.data

    switch (action) {
      case 'create': {
        // Verificar permiso para crear pagos
        if (estudio && !hasPermission(estudio.rol, 'create:pagos')) {
          return forbidden('No tienes permiso para registrar pagos')
        }

        const { alumnoId, monto, fechaVencimiento, mesCorrespondiente: mesRaw, tipoPago, clasesEsperadas } = parsed.data

        // Normalize mesCorrespondiente to YYYY-MM format
        const mesesNombres = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                              'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
        let mesCorrespondiente = mesRaw
        const matchYYYYMM = mesRaw.match(/^(\d{4})-(\d{2})$/)
        if (!matchYYYYMM) {
          const parts = mesRaw.toLowerCase().split(' ')
          const monthIdx = mesesNombres.indexOf(parts[0])
          const year = parseInt(parts[1])
          if (monthIdx >= 0 && year) {
            mesCorrespondiente = `${year}-${(monthIdx + 1).toString().padStart(2, '0')}`
          }
        }

        // Verificar que el alumno pertenece al estudio/profesor
        const alumno = await prisma.alumno.findFirst({
          where: { id: alumnoId, ...ownerFilter, deletedAt: null }
        })

        if (!alumno) {
          return notFound('Alumno no encontrado')
        }

        // Advertir si el alumno está inactivo
        if (!alumno.estaActivo) {
          return badRequest('Este alumno está inactivo. Activalo antes de crear un pago.')
        }

        // Si no se especifica tipoPago, determinar basado en packType del alumno
        const finalTipoPago = tipoPago || (alumno.packType === 'clase' ? 'clase' : 'mensual')
        const finalClasesEsperadas = finalTipoPago === 'mensual'
          ? (clasesEsperadas || alumno.clasesPorMes)
          : null

        // Si el alumno tiene saldo a favor, limpiar el saldo al crear el pago
        const saldoAnterior = Number(alumno.saldoAFavor) || 0

        const operaciones = [
          prisma.pago.create({
            data: {
              alumnoId,
              profesorId: userId,
              ...(estudio && { estudioId: estudio.estudioId }),
              monto,
              fechaVencimiento: new Date(fechaVencimiento),
              mesCorrespondiente,
              estado: 'pendiente',
              tipoPago: finalTipoPago,
              clasesEsperadas: finalClasesEsperadas
            },
            include: {
              alumno: {
                select: {
                  id: true,
                  nombre: true,
                  email: true
                }
              }
            }
          })
        ]

        if (saldoAnterior !== 0) {
          operaciones.push(
            prisma.alumno.update({
              where: { id: alumnoId },
              data: { saldoAFavor: 0 }
            }) as never
          )
        }

        const [pago] = await prisma.$transaction(operaciones)

        return NextResponse.json({
          pago: {
            ...pago,
            monto: pago.monto.toString(),
            fechaPago: null,
            fechaVencimiento: pago.fechaVencimiento.toISOString(),
            clasesCompletadas: 0
          },
          saldoAplicado: saldoAnterior
        }, { status: 201 })
      }

      case 'marcarPagado': {
        // Verificar permiso para marcar pagos
        if (estudio && !hasPermission(estudio.rol, 'edit:pagos')) {
          return forbidden('No tienes permiso para marcar pagos')
        }

        const { id } = parsed.data

        const pagoExistente = await prisma.pago.findFirst({
          where: {
            id,
            alumno: ownerFilter,
            deletedAt: null
          }
        })

        if (!pagoExistente) {
          return notFound('Pago no encontrado')
        }

        const pago = await prisma.pago.update({
          where: { id },
          data: {
            estado: 'pagado',
            fechaPago: new Date(),
            profesorId: pagoExistente.profesorId || userId
          },
          include: {
            alumno: {
              select: {
                id: true,
                nombre: true,
                email: true
              }
            }
          }
        })

        return NextResponse.json({ pago })
      }

      case 'marcarPendiente': {
        // Verificar permiso para marcar pagos
        if (estudio && !hasPermission(estudio.rol, 'edit:pagos')) {
          return forbidden('No tienes permiso para marcar pagos')
        }

        const { id } = parsed.data

        const pagoExistente = await prisma.pago.findFirst({
          where: {
            id,
            alumno: ownerFilter,
            deletedAt: null
          }
        })

        if (!pagoExistente) {
          return notFound('Pago no encontrado')
        }

        const pago = await prisma.pago.update({
          where: { id },
          data: {
            estado: 'pendiente',
            fechaPago: null
          },
          include: {
            alumno: {
              select: {
                id: true,
                nombre: true,
                email: true
              }
            }
          }
        })

        return NextResponse.json({ pago })
      }

      case 'delete': {
        // Verificar permiso para eliminar pagos
        if (estudio && !hasPermission(estudio.rol, 'delete:pagos')) {
          return forbidden('No tienes permiso para eliminar pagos')
        }

        const { id } = parsed.data

        const pagoExistente = await prisma.pago.findFirst({
          where: {
            id,
            alumno: ownerFilter,
            deletedAt: null
          }
        })

        if (!pagoExistente) {
          return notFound('Pago no encontrado')
        }

        await prisma.pago.update({
          where: { id },
          data: { deletedAt: new Date() }
        })

        return NextResponse.json({ success: true })
      }

      case 'bulkDelete': {
        if (estudio && !hasPermission(estudio.rol, 'delete:pagos')) {
          return forbidden('No tienes permiso para eliminar pagos')
        }

        const { ids } = parsed.data

        const validPagos = await prisma.pago.findMany({
          where: { id: { in: ids }, alumno: ownerFilter, deletedAt: null },
          select: { id: true }
        })
        const validIds = validPagos.map(p => p.id)

        if (validIds.length > 0) {
          await prisma.pago.updateMany({
            where: { id: { in: validIds } },
            data: { deletedAt: new Date() }
          })
        }

        return NextResponse.json({ success: true, deleted: validIds.length })
      }

      default:
        return badRequest('Acción no válida')
    }
  } catch (error) {
    return serverError(error)
  }
}
