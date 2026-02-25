import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  action: z.literal('login').optional()
})

export const signupSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  rol: z.enum(['profesor', 'alumno'], { message: 'Seleccioná si sos profesor/a o alumno/a' }),
  action: z.literal('signup')
})

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
