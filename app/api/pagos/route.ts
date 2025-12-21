import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { getErrorMessage } from '@/lib/utils'

export const runtime = 'nodejs'

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
    // Optimizado: una sola query en lugar de N queries
    const clasesCompletadasMap = new Map<string, number>()

    // Recolectar todos los alumnoIds y rangos de fechas necesarios
    const pagosMensuales = pagosRaw.filter(p => p.tipoPago === 'mensual' && p.clasesEsperadas)

    if (pagosMensuales.length > 0) {
      const alumnoIds = [...new Set(pagosMensuales.map(p => p.alumnoId))]

      // Encontrar el rango de fechas más amplio
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
        // Una sola query para todas las clases completadas
        const clasesCompletadas = await prisma.clase.findMany({
          where: {
            alumnoId: { in: alumnoIds },
            fecha: { gte: minDate, lte: maxDate },
            estado: 'completada'
          },
          select: {
            alumnoId: true,
            fecha: true
          }
        })

        // Agrupar por alumno y mes
        for (const clase of clasesCompletadas) {
          const year = clase.fecha.getFullYear()
          const month = clase.fecha.getMonth() + 1
          const mesKey1 = `${year}-${month.toString().padStart(2, '0')}`
          const mesKey2 = `${mesesNombres[month - 1]} ${year}`

          // Incrementar contadores para ambos formatos de mes
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
        packType: true,
        diaInicioCiclo: true,
        saldoAFavor: true
      },
      orderBy: { nombre: 'asc' }
    })

    const alumnosSerializados = alumnos.map(a => ({
      id: a.id,
      nombre: a.nombre,
      precio: a.precio.toString(),
      packType: a.packType,
      diaInicioCiclo: a.diaInicioCiclo,
      saldoAFavor: a.saldoAFavor.toString()
    }))

    return NextResponse.json({ pagos, alumnos: alumnosSerializados })
  } catch (error) {
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

        // Validar campos obligatorios
        if (!alumnoId) {
          return NextResponse.json({ error: 'El alumno es obligatorio' }, { status: 400 })
        }
        if (!mesCorrespondiente?.trim()) {
          return NextResponse.json({ error: 'El mes correspondiente es obligatorio' }, { status: 400 })
        }

        // Validar monto
        const montoNum = parseFloat(monto)
        if (isNaN(montoNum) || montoNum <= 0) {
          return NextResponse.json({ error: 'El monto debe ser mayor a 0' }, { status: 400 })
        }

        // Validar que la fecha de vencimiento no sea en el pasado
        const fechaVenc = new Date(fechaVencimiento)
        const hoy = new Date()
        hoy.setHours(0, 0, 0, 0)
        if (fechaVenc < hoy) {
          return NextResponse.json({ error: 'La fecha de vencimiento no puede ser en el pasado' }, { status: 400 })
        }

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

        // Si el alumno tiene saldo a favor, limpiar el saldo al crear el pago
        const saldoAnterior = Number(alumno.saldoAFavor) || 0
        const operaciones = [
          prisma.pago.create({
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
        ]

        // Si tenía saldo a favor (positivo), limpiarlo
        // El saldo ya fue aplicado en el cálculo del monto en el frontend
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
  } catch (error) {
    console.error('Error en pagos:', error)
    return NextResponse.json({ error: getErrorMessage(error) || 'Error al procesar' }, { status: 500 })
  }
}
