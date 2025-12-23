import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const profesor = await prisma.user.findFirst({
      where: {
        slug,
        portalActivo: true,
        role: 'PROFESOR'
      },
      select: {
        id: true,
        nombre: true,
        slug: true,
        portalDescripcion: true
      }
    })

    if (!profesor) {
      return NextResponse.json({ error: 'Profesor no encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      profesor: {
        id: profesor.id,
        nombre: profesor.nombre,
        slug: profesor.slug,
        descripcion: profesor.portalDescripcion
      }
    })
  } catch (error) {
    console.error('Error fetching profesor info:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
