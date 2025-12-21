import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { Decimal } from '@prisma/client/runtime/library'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { getPaginationParams, paginatedResponse } from '@/lib/pagination'
import { alumnoActionSchema } from '@/lib/schemas/alumno.schema'
import { calcularRangoCiclo, calcularPrecioImplicitoPorClase } from '@/lib/alumno-utils'
import { invalidateAlumnos } from '@/lib/cache-utils'
import { unauthorized, badRequest, notFound, tooManyRequests, serverError } from '@/lib/api-utils'

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
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    // Calcular inicio y fin del mes actual
    const now = new Date()
    const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1)
    const finMes = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    // Construir where con búsqueda opcional
    const where = {
      profesorId: userId,
      deletedAt: null,
      ...(search && {
        OR: [
          { nombre: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ]
      })
    }

    // Obtener alumnos paginados, total, packs y precio por clase en paralelo
    const [alumnos, total, user] = await Promise.all([
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
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          precioPorClase: true,
          packs: {
            where: { deletedAt: null },
            orderBy: { clasesPorSemana: 'asc' }
          }
        }
      })
    ])

    const alumnosSerializados = alumnos.map(alumno => ({
      ...alumno,
      precio: alumno.precio.toString(),
      saldoAFavor: alumno.saldoAFavor.toString(),
      cumpleanos: alumno.cumpleanos ? alumno.cumpleanos.toISOString() : null,
      proximoPagoVencimiento: alumno.pagos[0]?.fechaVencimiento?.toISOString() || null,
      clasesEsteMes: alumno.clases.length,
      clases: undefined,
      pagos: undefined
    }))

    const packsSerializados = user?.packs.map(pack => ({
      id: pack.id,
      nombre: pack.nombre,
      clasesPorSemana: pack.clasesPorSemana,
      precio: pack.precio.toString()
    })) || []

    const paginatedData = paginatedResponse(alumnosSerializados, total, { page, limit, skip })

    return NextResponse.json({
      ...paginatedData,
      alumnos: alumnosSerializados,
      packs: packsSerializados,
      precioPorClase: user?.precioPorClase?.toString() || '0'
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

    const userId = await getCurrentUser()
    if (!userId) {
      return unauthorized()
    }

    // Validar con Zod schema
    const body = await request.json()
    const parsed = alumnoActionSchema.safeParse(body)

    if (!parsed.success) {
      return badRequest('Datos inválidos', parsed.error.flatten())
    }

    const { action } = parsed.data

    switch (action) {
      case 'create': {
        const { nombre, email, telefono, genero, cumpleanos, patologias, packType, precio, consentimientoTutor, diaInicioCiclo } = parsed.data

        const alumno = await prisma.alumno.create({
          data: {
            profesorId: userId,
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
        const { id, nombre, email, telefono, genero, cumpleanos, patologias, packType, precio, consentimientoTutor, diaInicioCiclo } = parsed.data

        // Validar que el alumno pertenece al profesor
        const alumnoExistente = await prisma.alumno.findFirst({
          where: { id, profesorId: userId, deletedAt: null }
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
        const { id } = parsed.data

        const alumno = await prisma.alumno.findFirst({
          where: { id, profesorId: userId, deletedAt: null }
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
        const { id } = parsed.data

        const alumno = await prisma.alumno.findFirst({
          where: { id, profesorId: userId, deletedAt: null }
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

      default:
        return badRequest('Acción no válida')
    }
  } catch (error) {
    return serverError(error)
  }
}
