import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'
import { invalidateAlumnos } from '@/lib/cache-utils'
import { calcularRangoCiclo, calcularPrecioImplicitoPorClase } from '@/lib/alumno-utils'

export type CreateAlumnoData = {
  nombre: string
  email: string
  telefono: string
  genero?: string
  cumpleanos?: string | null
  patologias?: string | null
  packType: string
  precio: number
  consentimientoTutor?: boolean
  diaInicioCiclo?: number
}

export type UpdateAlumnoData = Partial<CreateAlumnoData>

export class AlumnoService {
  constructor(private profesorId: string) {}

  async create(data: CreateAlumnoData) {
    const diaCiclo = data.diaInicioCiclo
      ? Math.min(28, Math.max(1, data.diaInicioCiclo))
      : 1

    const alumno = await prisma.alumno.create({
      data: {
        profesorId: this.profesorId,
        nombre: data.nombre,
        email: data.email,
        telefono: data.telefono,
        genero: data.genero || 'F',
        cumpleanos: data.cumpleanos ? new Date(data.cumpleanos + 'T00:00:00') : null,
        patologias: data.patologias || null,
        packType: data.packType,
        precio: new Decimal(data.precio || 0),
        consentimientoTutor: data.consentimientoTutor || false,
        diaInicioCiclo: diaCiclo
      },
      include: {
        _count: { select: { clases: true, pagos: true } }
      }
    })

    invalidateAlumnos()
    return alumno
  }

  async update(id: string, data: UpdateAlumnoData) {
    const existing = await prisma.alumno.findFirst({
      where: { id, profesorId: this.profesorId, deletedAt: null }
    })

    if (!existing) {
      throw new Error('Alumno no encontrado')
    }

    // Detectar cambio de pack para calcular prorrateo
    let nuevoSaldoAFavor = existing.saldoAFavor
    const packCambio = data.packType &&
      data.packType !== existing.packType &&
      existing.packType !== 'por_clase' &&
      data.packType !== 'por_clase'

    if (packCambio) {
      const packAnterior = await prisma.pack.findUnique({
        where: { id: existing.packType }
      })

      if (packAnterior) {
        const { inicio, fin } = calcularRangoCiclo(existing.diaInicioCiclo)

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
        nuevoSaldoAFavor = new Decimal(Number(existing.saldoAFavor) + saldoCalculado)
      }
    }

    const diaCiclo = data.diaInicioCiclo
      ? Math.min(28, Math.max(1, data.diaInicioCiclo))
      : existing.diaInicioCiclo

    const alumno = await prisma.alumno.update({
      where: { id },
      data: {
        ...(data.nombre && { nombre: data.nombre }),
        ...(data.email && { email: data.email }),
        ...(data.telefono && { telefono: data.telefono }),
        ...(data.genero && { genero: data.genero }),
        cumpleanos: data.cumpleanos !== undefined
          ? (data.cumpleanos ? new Date(data.cumpleanos + 'T00:00:00') : null)
          : undefined,
        ...(data.patologias !== undefined && { patologias: data.patologias || null }),
        ...(data.packType && { packType: data.packType }),
        ...(data.precio !== undefined && { precio: new Decimal(data.precio) }),
        ...(data.consentimientoTutor !== undefined && { consentimientoTutor: data.consentimientoTutor }),
        diaInicioCiclo: diaCiclo,
        saldoAFavor: nuevoSaldoAFavor
      },
      include: {
        _count: { select: { clases: true, pagos: true } }
      }
    })

    invalidateAlumnos()
    return { alumno, prorrateoAplicado: packCambio, nuevoSaldo: nuevoSaldoAFavor.toString() }
  }

  async softDelete(id: string) {
    const existing = await prisma.alumno.findFirst({
      where: { id, profesorId: this.profesorId, deletedAt: null }
    })

    if (!existing) {
      throw new Error('Alumno no encontrado')
    }

    await prisma.alumno.update({
      where: { id },
      data: { deletedAt: new Date() }
    })

    invalidateAlumnos()
    return { success: true }
  }

  async toggleStatus(id: string) {
    const existing = await prisma.alumno.findFirst({
      where: { id, profesorId: this.profesorId, deletedAt: null }
    })

    if (!existing) {
      throw new Error('Alumno no encontrado')
    }

    await prisma.alumno.update({
      where: { id },
      data: { estaActivo: !existing.estaActivo }
    })

    invalidateAlumnos()
    return { success: true }
  }
}
