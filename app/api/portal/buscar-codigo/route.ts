import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const codigo = searchParams.get('codigo')

    if (!codigo) {
      return NextResponse.json({ error: 'Código requerido' }, { status: 400 })
    }

    const profesor = await prisma.user.findFirst({
      where: {
        codigoPortal: codigo.toUpperCase(),
        portalActivo: true,
        role: 'PROFESOR'
      },
      select: {
        slug: true,
        nombre: true
      }
    })

    if (!profesor || !profesor.slug) {
      return NextResponse.json({ error: 'Código no encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      slug: profesor.slug,
      nombre: profesor.nombre
    })
  } catch (error) {
    console.error('Error buscando código:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
