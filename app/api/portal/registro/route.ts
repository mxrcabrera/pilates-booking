import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { hashPassword } from '@/lib/auth/auth-utils'
import { z } from 'zod'

const registroSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  telefono: z.string().min(8, 'El teléfono debe tener al menos 8 caracteres'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  genero: z.enum(['M', 'F']).default('F'),
  cumpleanos: z.string().optional(),
  patologias: z.string().optional()
})

// POST /api/portal/registro - Crear cuenta de alumno
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validar campos
    const parsed = registroSchema.safeParse(body)
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]
      return NextResponse.json(
        { error: firstError?.message || 'Datos inválidos' },
        { status: 400 }
      )
    }

    const { nombre, email, telefono, password, genero, cumpleanos, patologias } = parsed.data

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ya existe una cuenta con este email' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Crear usuario con rol ALUMNO
    const user = await prisma.user.create({
      data: {
        nombre,
        email,
        telefono,
        password: hashedPassword,
        genero,
        role: 'ALUMNO'
      }
    })

    // Guardar datos adicionales en caché para cuando se vincule con profesor
    // Por ahora los guardamos en el mismo user
    // Los campos cumpleanos y patologias se usarán cuando se cree el Alumno

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email
      },
      // Datos para completar el perfil de alumno cuando reserve
      alumnoData: {
        cumpleanos: cumpleanos || null,
        patologias: patologias || null
      }
    })
  } catch (error) {
    console.error('Error creating alumno account:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
