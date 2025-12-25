import { z } from 'zod'

export const invitarMiembroSchema = z.object({
  email: z.string().email('Email inválido').transform(val => val.toLowerCase().trim()),
  rol: z.enum(['ADMIN', 'INSTRUCTOR', 'VIEWER'], 'Rol inválido. Debe ser ADMIN, INSTRUCTOR o VIEWER')
})

export const cambiarRolSchema = z.object({
  miembroId: z.string().uuid('ID de miembro inválido'),
  nuevoRol: z.enum(['ADMIN', 'INSTRUCTOR', 'VIEWER'], 'Rol inválido')
})

export type InvitarMiembroInput = z.infer<typeof invitarMiembroSchema>
export type CambiarRolInput = z.infer<typeof cambiarRolSchema>
