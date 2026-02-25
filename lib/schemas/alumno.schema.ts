import { z } from 'zod'

// RFC 5322 simplified email regex
const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

export const createAlumnoSchema = z.object({
  action: z.literal('create'),
  nombre: z.string().min(1, 'El nombre es obligatorio').max(100, 'Nombre muy largo'),
  email: z.string().max(254).regex(emailRegex, 'Email inválido'),
  telefono: z.string().min(1, 'El teléfono es obligatorio'),
  genero: z.enum(['F', 'M', 'O']).optional().default('F'),
  cumpleanos: z.string().optional().nullable(),
  patologias: z.string().max(500).optional().nullable(),
  packType: z.string().min(1, 'El pack es obligatorio'),
  precio: z.union([z.string(), z.number()]).transform(v => typeof v === 'string' ? parseFloat(v) : v),
  consentimientoTutor: z.boolean().optional().default(false),
  diaInicioCiclo: z.union([z.string(), z.number()]).optional().transform(v => {
    if (v === undefined) return 1
    const num = typeof v === 'string' ? parseInt(v) : v
    return Math.min(28, Math.max(1, num))
  })
})

export const updateAlumnoSchema = z.object({
  action: z.literal('update'),
  id: z.string().uuid('ID inválido'),
  nombre: z.string().min(1).max(100).optional(),
  email: z.string().max(254).regex(emailRegex, 'Email inválido').optional(),
  telefono: z.string().min(1).optional(),
  genero: z.enum(['F', 'M', 'O']).optional(),
  cumpleanos: z.string().optional().nullable(),
  patologias: z.string().max(500).optional().nullable(),
  packType: z.string().optional(),
  precio: z.union([z.string(), z.number()]).optional().transform(v => {
    if (v === undefined) return undefined
    return typeof v === 'string' ? parseFloat(v) : v
  }),
  consentimientoTutor: z.boolean().optional(),
  diaInicioCiclo: z.union([z.string(), z.number()]).optional().transform(v => {
    if (v === undefined) return undefined
    const num = typeof v === 'string' ? parseInt(v) : v
    return Math.min(28, Math.max(1, num))
  })
})

export const deleteAlumnoSchema = z.object({
  action: z.literal('delete'),
  id: z.string().uuid('ID inválido')
})

export const toggleStatusSchema = z.object({
  action: z.literal('toggleStatus'),
  id: z.string().uuid('ID inválido')
})

export const resetPasswordSchema = z.object({
  action: z.literal('resetPassword'),
  id: z.string().uuid('ID inválido'),
  newPassword: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres')
})

export const alumnoActionSchema = z.discriminatedUnion('action', [
  createAlumnoSchema,
  updateAlumnoSchema,
  deleteAlumnoSchema,
  toggleStatusSchema,
  resetPasswordSchema
])
