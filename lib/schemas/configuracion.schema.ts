import { z } from 'zod'

const horaSchema = z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)')

export const saveHorarioSchema = z.object({
  id: z.string().uuid().optional(),
  diaSemana: z.number().min(0).max(6),
  horaInicio: horaSchema,
  horaFin: horaSchema,
  esManiana: z.boolean()
}).refine(data => data.horaInicio < data.horaFin, {
  message: 'La hora de inicio debe ser anterior a la hora de fin'
})

export const saveHorariosBatchSchema = z.object({
  horarios: z.array(z.object({
    diaSemana: z.number().min(0).max(6),
    horaInicio: horaSchema,
    horaFin: horaSchema,
    esManiana: z.boolean()
  })).min(1, 'Debe incluir al menos un horario')
})

export const deleteHorarioSchema = z.object({
  id: z.string().uuid('ID de horario inválido')
})

export const toggleHorarioSchema = z.object({
  id: z.string().uuid('ID de horario inválido')
})

export const savePackSchema = z.object({
  id: z.string().uuid().optional(),
  nombre: z.string().min(1, 'El nombre del pack es obligatorio').trim(),
  clasesPorSemana: z.coerce.number().min(1, 'Las clases por semana deben ser al menos 1'),
  precio: z.coerce.number().positive('El precio debe ser mayor a 0')
})

export const deletePackSchema = z.object({
  id: z.string().uuid('ID de pack inválido')
})

export const updateProfileSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').trim(),
  telefono: z.string().optional()
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es obligatoria'),
  newPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
})

export const updatePreferenciasSchema = z.object({
  horasAnticipacionMinima: z.coerce.number().min(0, 'Las horas de anticipación deben ser 0 o más').optional(),
  maxAlumnosPorClase: z.coerce.number().min(1, 'El máximo de alumnos debe ser al menos 1').optional(),
  horarioMananaInicio: horaSchema.optional(),
  horarioMananaFin: horaSchema.optional(),
  turnoMananaActivo: z.boolean().optional(),
  horarioTardeInicio: horaSchema.optional(),
  horarioTardeFin: horaSchema.optional(),
  turnoTardeActivo: z.boolean().optional(),
  syncGoogleCalendar: z.boolean().optional(),
  precioPorClase: z.coerce.number().min(0, 'El precio por clase debe ser 0 o más').optional()
})

export type SaveHorarioInput = z.infer<typeof saveHorarioSchema>
export type SaveHorariosBatchInput = z.infer<typeof saveHorariosBatchSchema>
export type SavePackInput = z.infer<typeof savePackSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type UpdatePreferenciasInput = z.infer<typeof updatePreferenciasSchema>
