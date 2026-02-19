import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserContext, hasPermission } from '@/lib/auth'
import { Decimal } from '@prisma/client/runtime/library'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { getPaginationParams, paginatedResponse } from '@/lib/pagination'
import { alumnoActionSchema } from '@/lib/schemas/alumno.schema'
import { calcularRangoCiclo, calcularPrecioImplicitoPorClase } from '@/lib/alumno-utils'
import { invalidateAlumnos } from '@/lib/cache-utils'
import { hashPassword } from '@/lib/auth'
import { unauthorized, badRequest, notFound, tooManyRequests, serverError, forbidden } from '@/lib/api-utils'
import { getEffectiveMaxAlumnos, getSuggestedUpgrade, PLAN_CONFIGS, getEffectiveFeatures } from '@/lib/plans'
import type { PlanType } from '@prisma/client'

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
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    // Calcular inicio y fin del mes actual
    const now = new Date()
    const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1)
    const finMes = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    // Filtrar por estudioId si existe, sino por profesorId (backwards compatible)
    const ownerFilter = estudio
      ? { estudioId: estudio.estudioId }
      : { profesorId: userId }

    // Construir where con búsqueda opcional
    const where = {
      ...ownerFilter,
      deletedAt: null,
      ...(search && {
        OR: [
          { nombre: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ]
      })
    }

    // Obtener alumnos paginados, total, packs y precio por clase en paralelo
    const [alumnos, total, configData] = await Promise.all([
      prisma.alumno.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              clases: { where: { deletedAt: null } },
              pagos: { where: { deletedAt: null } }
            }
          },
          clases: {
            where: {
              fecha: { gte: inicioMes, lte: finMes },
              estado: { in: ['completada', 'reservada'] },
              deletedAt: null
            },
            select: { id: true }
          },
          pagos: {
            where: { estado: 'pendiente', deletedAt: null },
            orderBy: { fechaVencimiento: 'asc' },
            take: 1,
            select: { fechaVencimiento: true }
          }
        },
        orderBy: { nombre: 'asc' }
      }),
      prisma.alumno.count({ where }),
      // Obtener config del estudio o del usuario
      estudio
        ? prisma.estudio.findUnique({
            where: { id: estudio.estudioId },
            select: {
              precioPorClase: true,
              plan: true,
              trialEndsAt: true,
              packs: {
                where: { deletedAt: null },
                orderBy: { clasesPorSemana: 'asc' }
              }
            }
          })
        : prisma.user.findUnique({
            where: { id: userId },
            select: {
              precioPorClase: true,
              plan: true,
              trialEndsAt: true,
              packs: {
                where: { deletedAt: null },
                orderBy: { clasesPorSemana: 'asc' }
              }
            }
          })
    ])

    const alumnosSerializados = alumnos.map(alumno => ({
      ...alumno,
      userId: alumno.userId ?? null,
      precio: alumno.precio.toString(),
      saldoAFavor: alumno.saldoAFavor.toString(),
      cumpleanos: alumno.cumpleanos ? alumno.cumpleanos.toISOString() : null,
      proximoPagoVencimiento: alumno.pagos[0]?.fechaVencimiento?.toISOString() || null,
      clasesEsteMes: alumno.clases.length,
      clases: undefined,
      pagos: undefined
    }))

    const packsSerializados = configData?.packs.map(pack => ({
      id: pack.id,
      nombre: pack.nombre,
      clasesPorSemana: pack.clasesPorSemana,
      precio: pack.precio.toString()
    })) || []

    const paginatedData = paginatedResponse(alumnosSerializados, total, { page, limit, skip })

    // Calcular info del plan y features
    const plan = (configData?.plan || 'FREE') as PlanType
    const trialEndsAt = configData?.trialEndsAt || null
    const maxAlumnos = getEffectiveMaxAlumnos(plan, trialEndsAt)
    const features = getEffectiveFeatures(plan, trialEndsAt)

    return NextResponse.json({
      ...paginatedData,
      alumnos: alumnosSerializados,
      packs: packsSerializados,
      precioPorClase: configData?.precioPorClase?.toString() || '0',
      planInfo: {
        plan,
        trialEndsAt: trialEndsAt?.toISOString() || null,
        maxAlumnos,
        currentAlumnos: total,
        canAddMore: total < maxAlumnos
      },
      features: {
        prorrateoAutomatico: features?.prorrateoAutomatico ?? false,
        exportarExcel: features?.exportarExcel ?? false,
        plan
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
    const { success } = rateLimit(`alumnos:${ip}`, POST_LIMIT, WINDOW_MS)
    if (!success) {
      return tooManyRequests()
    }

    const context = await getUserContext()
    if (!context) {
      return unauthorized()
    }

    const { userId, estudio } = context

    // Validar con Zod schema
    const body = await request.json()
    const parsed = alumnoActionSchema.safeParse(body)

    if (!parsed.success) {
      return badRequest('Datos inválidos', parsed.error.flatten())
    }

    const { action } = parsed.data

    switch (action) {
      case 'create': {
        // Verificar permiso para crear alumnos
        if (estudio && !hasPermission(estudio.rol, 'create:alumnos')) {
          return forbidden('No tienes permiso para crear alumnos')
        }

        const { nombre, email, telefono, genero, cumpleanos, patologias, packType, precio, consentimientoTutor, diaInicioCiclo } = parsed.data

        // Obtener info del plan (de Estudio o User)
        const planInfo = estudio
          ? await prisma.estudio.findUnique({
              where: { id: estudio.estudioId },
              select: { plan: true, trialEndsAt: true }
            })
          : await prisma.user.findUnique({
              where: { id: userId },
              select: { plan: true, trialEndsAt: true }
            })

        if (!planInfo) {
          return unauthorized()
        }

        const ownerFilter = estudio
          ? { estudioId: estudio.estudioId }
          : { profesorId: userId }

        const maxAlumnos = getEffectiveMaxAlumnos(planInfo.plan, planInfo.trialEndsAt)
        const alumnosActuales = await prisma.alumno.count({
          where: { ...ownerFilter, deletedAt: null }
        })

        if (alumnosActuales >= maxAlumnos) {
          const suggestedPlan = getSuggestedUpgrade(planInfo.plan, 'alumnos')
          return NextResponse.json({
            error: 'Límite de alumnos alcanzado',
            code: 'PLAN_LIMIT_REACHED',
            currentPlan: planInfo.plan,
            maxAlumnos,
            currentAlumnos: alumnosActuales,
            suggestedPlan,
            suggestedPlanName: suggestedPlan ? PLAN_CONFIGS[suggestedPlan].name : null,
            suggestedPlanMaxAlumnos: suggestedPlan ? PLAN_CONFIGS[suggestedPlan].features.maxAlumnos : null
          }, { status: 403 })
        }

        const alumno = await prisma.alumno.create({
          data: {
            profesorId: userId,
            ...(estudio && { estudioId: estudio.estudioId }),
            nombre,
            email,
            telefono,
            genero: genero || 'F',
            cumpleanos: cumpleanos ? new Date(cumpleanos + 'T00:00:00') : null,
            patologias: patologias || null,
            packType,
            precio: new Decimal(precio || 0),
            consentimientoTutor: consentimientoTutor || false,
            diaInicioCiclo: diaInicioCiclo || 1
          },
          include: {
            _count: { select: { clases: true, pagos: true } }
          }
        })

        invalidateAlumnos()
        return NextResponse.json({ success: true, alumno })
      }

      case 'update': {
        // Verificar permiso para editar alumnos
        if (estudio && !hasPermission(estudio.rol, 'edit:alumnos')) {
          return forbidden('No tienes permiso para editar alumnos')
        }

        const { id, nombre, email, telefono, genero, cumpleanos, patologias, packType, precio, consentimientoTutor, diaInicioCiclo } = parsed.data

        // Filtro por estudio o profesor
        const ownerFilter = estudio
          ? { estudioId: estudio.estudioId }
          : { profesorId: userId }

        // Validar que el alumno pertenece al estudio/profesor
        const alumnoExistente = await prisma.alumno.findFirst({
          where: { id, ...ownerFilter, deletedAt: null }
        })
        if (!alumnoExistente) {
          return notFound('Alumno no encontrado')
        }

        // Validar diaInicioCiclo
        const diaCiclo = diaInicioCiclo ?? alumnoExistente.diaInicioCiclo

        // Detectar cambio de pack para calcular prorrateo
        let nuevoSaldoAFavor = alumnoExistente.saldoAFavor
        const packCambio = packType && packType !== alumnoExistente.packType &&
                          alumnoExistente.packType !== 'por_clase' && packType !== 'por_clase'

        if (packCambio) {
          const packAnterior = await prisma.pack.findUnique({
            where: { id: alumnoExistente.packType }
          })

          if (packAnterior) {
            const { inicio, fin } = calcularRangoCiclo(alumnoExistente.diaInicioCiclo)

            const clasesTomadas = await prisma.clase.count({
              where: {
                alumnoId: id,
                fecha: { gte: inicio, lte: fin },
                estado: { in: ['completada', 'reservada'] },
                deletedAt: null
              }
            })

            const precioImplicitoPorClase = calcularPrecioImplicitoPorClase(
              Number(packAnterior.precio),
              packAnterior.clasesPorSemana
            )

            const valorConsumido = clasesTomadas * precioImplicitoPorClase

            const ultimoPago = await prisma.pago.findFirst({
              where: {
                alumnoId: id,
                estado: 'pagado',
                fechaPago: { gte: inicio, lte: fin },
                deletedAt: null
              },
              orderBy: { fechaPago: 'desc' }
            })
            const montoPagado = ultimoPago ? Number(ultimoPago.monto) : 0

            const saldoCalculado = montoPagado - valorConsumido
            nuevoSaldoAFavor = new Decimal(Number(alumnoExistente.saldoAFavor) + saldoCalculado)
          }
        }

        const alumno = await prisma.alumno.update({
          where: { id },
          data: {
            ...(nombre && { nombre }),
            ...(email && { email }),
            ...(telefono && { telefono }),
            ...(genero && { genero }),
            cumpleanos: cumpleanos !== undefined
              ? (cumpleanos ? new Date(cumpleanos + 'T00:00:00') : null)
              : undefined,
            ...(patologias !== undefined && { patologias: patologias || null }),
            ...(packType && { packType }),
            ...(precio !== undefined && { precio: new Decimal(precio) }),
            ...(consentimientoTutor !== undefined && { consentimientoTutor }),
            diaInicioCiclo: diaCiclo,
            saldoAFavor: nuevoSaldoAFavor
          },
          include: {
            _count: { select: { clases: true, pagos: true } }
          }
        })

        invalidateAlumnos()
        return NextResponse.json({
          success: true,
          alumno,
          prorrateoAplicado: packCambio,
          nuevoSaldo: nuevoSaldoAFavor.toString()
        })
      }

      case 'toggleStatus': {
        // Verificar permiso para editar alumnos
        if (estudio && !hasPermission(estudio.rol, 'edit:alumnos')) {
          return forbidden('No tienes permiso para cambiar estado de alumnos')
        }

        const { id } = parsed.data

        // Filtro por estudio o profesor
        const ownerFilter = estudio
          ? { estudioId: estudio.estudioId }
          : { profesorId: userId }

        const alumno = await prisma.alumno.findFirst({
          where: { id, ...ownerFilter, deletedAt: null }
        })

        if (!alumno) {
          return notFound('Alumno no encontrado')
        }

        await prisma.alumno.update({
          where: { id },
          data: { estaActivo: !alumno.estaActivo }
        })

        invalidateAlumnos()
        return NextResponse.json({ success: true })
      }

      case 'delete': {
        // Verificar permiso para eliminar alumnos
        if (estudio && !hasPermission(estudio.rol, 'delete:alumnos')) {
          return forbidden('No tienes permiso para eliminar alumnos')
        }

        const { id } = parsed.data

        // Filtro por estudio o profesor
        const ownerFilter = estudio
          ? { estudioId: estudio.estudioId }
          : { profesorId: userId }

        const alumno = await prisma.alumno.findFirst({
          where: { id, ...ownerFilter, deletedAt: null }
        })
        if (!alumno) {
          return notFound('Alumno no encontrado')
        }

        await prisma.alumno.update({
          where: { id },
          data: { deletedAt: new Date() }
        })
        invalidateAlumnos()
        return NextResponse.json({ success: true })
      }

      case 'resetPassword': {
        if (estudio && !hasPermission(estudio.rol, 'edit:alumnos')) {
          return forbidden('No tienes permiso para resetear contraseñas')
        }

        const { id, newPassword } = parsed.data

        const ownerFilter = estudio
          ? { estudioId: estudio.estudioId }
          : { profesorId: userId }

        const alumno = await prisma.alumno.findFirst({
          where: { id, ...ownerFilter, deletedAt: null },
          select: { id: true, userId: true, nombre: true }
        })

        if (!alumno) {
          return notFound('Alumno no encontrado')
        }

        if (!alumno.userId) {
          return badRequest('Este alumno no tiene cuenta de login')
        }

        const user = await prisma.user.findUnique({
          where: { id: alumno.userId },
          select: { password: true }
        })

        if (!user || !user.password) {
          return badRequest('Este alumno usa Google para iniciar sesión. No se puede resetear la contraseña.')
        }

        const hashedPassword = await hashPassword(newPassword)
        await prisma.user.update({
          where: { id: alumno.userId },
          data: { password: hashedPassword }
        })

        return NextResponse.json({ success: true })
      }

      default:
        return badRequest('Acción no válida')
    }
  } catch (error) {
    return serverError(error)
  }
}
