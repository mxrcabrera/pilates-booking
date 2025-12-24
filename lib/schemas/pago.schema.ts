import { z } from 'zod'

export const createPagoSchema = z.object({
  action: z.literal('create'),
  alumnoId: z.string().uuid('ID de alumno inválido'),
  profesorId: z.string().uuid('ID de profesor inválido').optional(),
  monto: z.union([z.string(), z.number()]).transform(v => {
    const num = typeof v === 'string' ? parseFloat(v) : v
    if (isNaN(num) || num <= 0) throw new Error('El monto debe ser mayor a 0')
    return num
  }),
  fechaVencimiento: z.string().min(1, 'La fecha de vencimiento es obligatoria'),
  mesCorrespondiente: z.string().min(1, 'El mes correspondiente es obligatorio'),
  tipoPago: z.enum(['mensual', 'clase']).optional(),
  clasesEsperadas: z.union([z.string(), z.number()]).optional().nullable().transform(v => {
    if (v === undefined || v === null) return null
    return typeof v === 'string' ? parseInt(v) : v
  })
})

export const marcarPagadoSchema = z.object({
  action: z.literal('marcarPagado'),
  id: z.string().uuid('ID de pago inválido')
})

export const marcarPendienteSchema = z.object({
  action: z.literal('marcarPendiente'),
  id: z.string().uuid('ID de pago inválido')
})

export const deletePagoSchema = z.object({
  action: z.literal('delete'),
  id: z.string().uuid('ID de pago inválido')
})

export const pagoActionSchema = z.discriminatedUnion('action', [
  createPagoSchema,
  marcarPagadoSchema,
  marcarPendienteSchema,
  deletePagoSchema
])
