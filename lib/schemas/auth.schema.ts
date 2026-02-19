import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  action: z.literal('login').optional()
})

export const signupSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  rol: z.enum(['profesor', 'alumno'], { message: 'Seleccioná si sos profesor/a o alumno/a' }),
  action: z.literal('signup')
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido')
})

export const resetPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
  token: z.string().min(1, 'Token requerido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
})

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
