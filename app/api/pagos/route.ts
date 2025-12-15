import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-utils'

export async function GET() {
  try {
    const userId = await getCurrentUser()
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
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

    const pagos = pagosRaw.map(p => ({
      ...p,
      monto: p.monto.toString(),
      fechaPago: p.fechaPago?.toISOString() || null,
      fechaVencimiento: p.fechaVencimiento.toISOString()
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
        const { alumnoId, monto, fechaVencimiento, mesCorrespondiente } = data

        // Verificar que el alumno pertenece al profesor
        const alumno = await prisma.alumno.findFirst({
          where: { id: alumnoId, profesorId: userId }
        })

        if (!alumno) {
          return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 })
        }

        const pago = await prisma.pago.create({
          data: {
            alumnoId,
            monto,
            fechaVencimiento: new Date(fechaVencimiento),
            mesCorrespondiente,
            estado: 'pendiente'
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
