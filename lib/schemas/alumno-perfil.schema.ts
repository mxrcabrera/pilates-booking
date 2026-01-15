import { z } from 'zod'

export const updateAlumnoPerfilSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  telefono: z.string().min(8, 'El teléfono debe tener al menos 8 caracteres').max(20),
  genero: z.enum(['F', 'M', 'O']).optional().default('F')
})

export type UpdateAlumnoPerfilInput = z.infer<typeof updateAlumnoPerfilSchema>
