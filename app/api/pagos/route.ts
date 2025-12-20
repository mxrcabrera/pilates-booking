import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const alumnoId = searchParams.get('alumnoId')

  try {
    const userId = await getCurrentUser()
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Si se pide pagos de un alumno específico
    if (alumnoId) {
      const alumno = await prisma.alumno.findFirst({
        where: { id: alumnoId, profesorId: userId }
      })

      if (!alumno) {
        return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 })
      }

      const pagosRaw = await prisma.pago.findMany({
        where: { alumnoId },
        orderBy: { fechaVencimiento: 'desc' }
      })

      const pagos = pagosRaw.map(p => ({
        id: p.id,
        monto: p.monto.toString(),
        fechaPago: p.fechaPago?.toISOString() || null,
        fechaVencimiento: p.fechaVencimiento.toISOString(),
        estado: p.estado,
        mesCorrespondiente: p.mesCorrespondiente
      }))

      return NextResponse.json({ pagos })
    }

    // Obtener todos los pagos de los alumnos del profesor
    const pagosRaw = await prisma.pago.findMany({
      where: {
        alumno: {
          profesorId: userId
        }
      },
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
    })

    // Obtener clases completadas por alumno/mes para calcular progreso
    const clasesCompletadasMap = new Map<string, number>()

    for (const pago of pagosRaw) {
      if (pago.tipoPago === 'mensual' && pago.clasesEsperadas) {
        // Parsear el mes del pago (formato "YYYY-MM" o "Mes YYYY")
        let year: number, month: number
        const matchYYYYMM = pago.mesCorrespondiente.match(/^(\d{4})-(\d{2})$/)
        if (matchYYYYMM) {
          year = parseInt(matchYYYYMM[1])
          month = parseInt(matchYYYYMM[2])
        } else {
          // Formato "Mes YYYY" - parsear
          const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                         'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
          const parts = pago.mesCorrespondiente.toLowerCase().split(' ')
          month = meses.indexOf(parts[0]) + 1
          year = parseInt(parts[1])
        }

        if (year && month) {
          const startDate = new Date(year, month - 1, 1)
          const endDate = new Date(year, month, 0) // Último día del mes

          const clasesCount = await prisma.clase.count({
            where: {
              alumnoId: pago.alumnoId,
              fecha: {
                gte: startDate,
                lte: endDate
              },
              estado: 'completada'
            }
          })

          clasesCompletadasMap.set(`${pago.alumnoId}-${pago.mesCorrespondiente}`, clasesCount)
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

    // Obtener alumnos activos para el formulario
    const alumnos = await prisma.alumno.findMany({
      where: {
        profesorId: userId,
        estaActivo: true
      },
      select: {
        id: true,
        nombre: true,
        precio: true,
        packType: true
      },
      orderBy: { nombre: 'asc' }
    })

    const alumnosSerializados = alumnos.map(a => ({
      id: a.id,
      nombre: a.nombre,
      precio: a.precio.toString(),
      packType: a.packType
    }))

    return NextResponse.json({ pagos, alumnos: alumnosSerializados })
  } catch (error: any) {
    console.error('Error fetching pagos:', error)
    return NextResponse.json({ error: 'Error al obtener pagos' }, { status: 500 })
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
      case 'create': {
        const { alumnoId, monto, fechaVencimiento, mesCorrespondiente, tipoPago, clasesEsperadas } = data

        // Verificar que el alumno pertenece al profesor
        const alumno = await prisma.alumno.findFirst({
          where: { id: alumnoId, profesorId: userId }
        })

        if (!alumno) {
          return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 })
        }

        // Si no se especifica tipoPago, determinar basado en packType del alumno
        const finalTipoPago = tipoPago || (alumno.packType === 'clase' ? 'clase' : 'mensual')
        // Si es mensual y no se pasan clasesEsperadas, usar clasesPorMes del alumno
        const finalClasesEsperadas = finalTipoPago === 'mensual'
          ? (clasesEsperadas || alumno.clasesPorMes)
          : null

        const pago = await prisma.pago.create({
          data: {
            alumnoId,
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

        return NextResponse.json({
          pago: {
            ...pago,
            monto: pago.monto.toString(),
            fechaPago: null,
            fechaVencimiento: pago.fechaVencimiento.toISOString(),
            clasesCompletadas: 0
          }
        })
      }

      case 'marcarPagado': {
        const { id } = data

        // Verificar que el pago pertenece a un alumno del profesor
        const pagoExistente = await prisma.pago.findFirst({
          where: {
            id,
            alumno: { profesorId: userId }
          }
        })

        if (!pagoExistente) {
          return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })
        }

        const pago = await prisma.pago.update({
          where: { id },
          data: {
            estado: 'pagado',
            fechaPago: new Date()
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
        const { id } = data

        const pagoExistente = await prisma.pago.findFirst({
          where: {
            id,
            alumno: { profesorId: userId }
          }
        })

        if (!pagoExistente) {
          return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })
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
        const { id } = data

        const pagoExistente = await prisma.pago.findFirst({
          where: {
            id,
            alumno: { profesorId: userId }
          }
        })

        if (!pagoExistente) {
          return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })
        }

        await prisma.pago.delete({
          where: { id }
        })

        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Error en pagos:', error)
    return NextResponse.json({ error: error.message || 'Error al procesar' }, { status: 500 })
  }
}
