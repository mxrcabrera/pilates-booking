import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET /api/portal/[slug] - Obtener info pública del profesor
export async function GET(
  _request: Request,
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
        portalDescripcion: true,
        horarioMananaInicio: true,
        horarioMananaFin: true,
        turnoMananaActivo: true,
        horarioTardeInicio: true,
        horarioTardeFin: true,
        turnoTardeActivo: true,
        horasAnticipacionMinima: true,
        maxAlumnosPorClase: true,
        precioPorClase: true,
        packs: {
          where: { deletedAt: null },
          select: {
            id: true,
            nombre: true,
            clasesPorSemana: true,
            precio: true
          },
          orderBy: { clasesPorSemana: 'asc' }
        },
        horariosDisponibles: {
          where: {
            deletedAt: null,
            estaActivo: true
          },
          select: {
            id: true,
            diaSemana: true,
            horaInicio: true,
            horaFin: true,
            esManiana: true
          },
          orderBy: [{ diaSemana: 'asc' }, { horaInicio: 'asc' }]
        }
      }
    })

    if (!profesor) {
      return NextResponse.json(
        { error: 'Profesor no encontrado o portal no activo' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: profesor.id,
      nombre: profesor.nombre,
      slug: profesor.slug,
      descripcion: profesor.portalDescripcion,
      config: {
        horasAnticipacionMinima: profesor.horasAnticipacionMinima,
        maxAlumnosPorClase: profesor.maxAlumnosPorClase,
        precioPorClase: profesor.precioPorClase.toString(),
        horarioMananaInicio: profesor.horarioMananaInicio,
        horarioMananaFin: profesor.horarioMananaFin,
        turnoMananaActivo: profesor.turnoMananaActivo,
        horarioTardeInicio: profesor.horarioTardeInicio,
        horarioTardeFin: profesor.horarioTardeFin,
        turnoTardeActivo: profesor.turnoTardeActivo
      },
      packs: profesor.packs.map(p => ({
        id: p.id,
        nombre: p.nombre,
        clasesPorSemana: p.clasesPorSemana,
        precio: p.precio.toString()
      })),
      horarios: profesor.horariosDisponibles
    })
  } catch (error) {
    console.error('Error fetching profesor portal:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
