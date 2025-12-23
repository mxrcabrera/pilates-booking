import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const userId = await getCurrentUser()

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nombre: true,
        email: true,
        telefono: true,
        genero: true,
        role: true
      }
    })

    if (!user || user.role !== 'ALUMNO') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        telefono: user.telefono,
        genero: user.genero,
        cumpleanos: null,
        patologias: null
      }
    })
  } catch (error) {
    console.error('Error fetching alumno perfil:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await getCurrentUser()

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true }
    })

    if (!user || user.role !== 'ALUMNO') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const body = await request.json()
    const { nombre, telefono, genero } = body

    if (!nombre || nombre.length < 2) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
    }

    if (!telefono || telefono.length < 8) {
      return NextResponse.json({ error: 'El teléfono es requerido' }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        nombre,
        telefono,
        genero: genero || 'F'
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating alumno perfil:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
