import { z } from 'zod'

// Regex para validar formato HH:MM
const horaRegex = /^([01]\d|2[0-3]):[0-5]\d$/

// Regex para validar formato YYYY-MM-DD
const fechaRegex = /^\d{4}-\d{2}-\d{2}$/

export const createClaseSchema = z.object({
  action: z.literal('create'),
  alumnoIds: z.array(z.string().uuid()).default([]),
  horaInicio: z.string().regex(horaRegex, 'Formato de hora inválido (HH:MM)'),
  horaRecurrente: z.string().regex(horaRegex, 'Formato de hora inválido (HH:MM)').optional(),
  esClasePrueba: z.boolean().optional().default(false),
  esRecurrente: z.boolean().optional().default(false),
  diasSemana: z.union([
    z.array(z.number().min(0).max(6)),
    z.string().transform((v, ctx) => {
      try { return JSON.parse(v) as number[] }
      catch { ctx.addIssue({ code: 'custom', message: 'diasSemana JSON inválido' }); return z.NEVER }
    })
  ]).optional().default([]),
  alumnosDias: z.record(z.string(), z.array(z.number().min(0).max(6))).optional(),
  fecha: z.string().regex(fechaRegex, 'Formato de fecha inválido (YYYY-MM-DD)')
})

export const updateClaseSchema = z.object({
  action: z.literal('update'),
  id: z.string().uuid('ID de clase inválido'),
  alumnoId: z.string().uuid('ID de alumno inválido').optional().nullable(),
  horaInicio: z.string().regex(horaRegex, 'Formato de hora inválido (HH:MM)'),
  horaRecurrente: z.string().regex(horaRegex, 'Formato de hora inválido (HH:MM)').optional(),
  estado: z.enum(['reservada', 'completada', 'cancelada']),
  esClasePrueba: z.boolean().optional().default(false),
  esRecurrente: z.boolean().optional().default(false),
  frecuenciaSemanal: z.union([z.string(), z.number()]).optional().nullable().transform(v => {
    if (v === undefined || v === null) return null
    return typeof v === 'string' ? parseInt(v) : v
  }),
  diasSemana: z.union([
    z.array(z.number().min(0).max(6)),
    z.string().transform((v, ctx) => {
      try { return JSON.parse(v) as number[] }
      catch { ctx.addIssue({ code: 'custom', message: 'diasSemana JSON inválido' }); return z.NEVER }
    })
  ]).optional().default([]),
  fecha: z.string().regex(fechaRegex, 'Formato de fecha inválido (YYYY-MM-DD)')
})

export const deleteClaseSchema = z.object({
  action: z.literal('delete'),
  id: z.string().uuid('ID de clase inválido')
})

export const changeStatusSchema = z.object({
  action: z.literal('changeStatus'),
  id: z.string().uuid('ID de clase inválido'),
  estado: z.enum(['reservada', 'completada', 'cancelada'], {
    message: 'Estado no válido'
  })
})

export const changeAsistenciaSchema = z.object({
  action: z.literal('changeAsistencia'),
  id: z.string().uuid('ID de clase inválido'),
  asistencia: z.enum(['pendiente', 'presente', 'ausente'], {
    message: 'Asistencia no válida'
  })
})

export const editSeriesSchema = z.object({
  action: z.literal('editSeries'),
  serieId: z.string().uuid('ID de serie inválido'),
  diasSemana: z.array(z.number().min(0).max(6)).min(1, 'Selecciona al menos un día'),
  horaInicio: z.string().regex(horaRegex, 'Formato de hora inválido (HH:MM)'),
  scope: z.enum(['future', 'all_unattended'], {
    message: 'Scope no válido'
  })
})

export const bulkDeleteClaseSchema = z.object({
  action: z.literal('bulkDelete'),
  ids: z.array(z.string().uuid('ID inválido')).min(1, 'Se requiere al menos un ID').max(100)
})

export const claseActionSchema = z.discriminatedUnion('action', [
  createClaseSchema,
  updateClaseSchema,
  deleteClaseSchema,
  changeStatusSchema,
  changeAsistenciaSchema,
  editSeriesSchema,
  bulkDeleteClaseSchema
])
