import { prisma } from '@/lib/prisma'

export type CreatePagoData = {
  alumnoId: string
  monto: number
  fechaVencimiento: string
  mesCorrespondiente: string
  tipoPago?: string
  clasesEsperadas?: number | null
}

export class PagoService {
  constructor(private profesorId: string) {}

  async create(data: CreatePagoData) {
    // Verificar que el alumno pertenece al profesor
    const alumno = await prisma.alumno.findFirst({
      where: {
        id: data.alumnoId,
        profesorId: this.profesorId,
        deletedAt: null
      }
    })

    if (!alumno) {
      throw new Error('Alumno no encontrado')
    }

    // Aplicar saldo a favor si existe
    const saldoAnterior = Number(alumno.saldoAFavor) || 0
    const operaciones = [
      prisma.pago.create({
        data: {
          alumnoId: data.alumnoId,
          monto: data.monto,
          fechaVencimiento: new Date(data.fechaVencimiento),
          mesCorrespondiente: data.mesCorrespondiente,
          estado: 'pendiente',
          tipoPago: data.tipoPago || (alumno.packType === 'clase' ? 'clase' : 'mensual'),
          clasesEsperadas: data.tipoPago === 'mensual' || (!data.tipoPago && alumno.packType !== 'clase')
            ? (data.clasesEsperadas || alumno.clasesPorMes)
            : null
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

    // Si tenía saldo a favor, limpiarlo
    if (saldoAnterior !== 0) {
      operaciones.push(
        prisma.alumno.update({
          where: { id: data.alumnoId },
          data: { saldoAFavor: 0 }
        }) as never
      )
    }

    const [pago] = await prisma.$transaction(operaciones)

    return {
      pago: {
        ...pago,
        monto: pago.monto.toString(),
        fechaPago: null,
        fechaVencimiento: pago.fechaVencimiento.toISOString(),
        clasesCompletadas: 0
      },
      saldoAplicado: saldoAnterior
    }
  }

  async marcarPagado(id: string) {
    await this.verificarPropiedad(id)

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

    return { pago }
  }

  async marcarPendiente(id: string) {
    await this.verificarPropiedad(id)

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

    return { pago }
  }

  async softDelete(id: string) {
    await this.verificarPropiedad(id)

    await prisma.pago.update({
      where: { id },
      data: { deletedAt: new Date() }
    })

    return { success: true }
  }

  private async verificarPropiedad(pagoId: string) {
    const pago = await prisma.pago.findFirst({
      where: {
        id: pagoId,
        alumno: { profesorId: this.profesorId },
        deletedAt: null
      }
    })

    if (!pago) {
      throw new Error('Pago no encontrado')
    }

    return pago
  }
}
