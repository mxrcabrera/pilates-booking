import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { PortalClient } from './portal-client'

type Props = {
  params: Promise<{ slug: string }>
}

export default async function PortalPage({ params }: Props) {
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
    notFound()
  }

  return (
    <PortalClient
      profesor={{
        id: profesor.id,
        nombre: profesor.nombre,
        slug: profesor.slug!,
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
      }}
    />
  )
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params

  const profesor = await prisma.user.findFirst({
    where: { slug, portalActivo: true },
    select: { nombre: true }
  })

  if (!profesor) {
    return { title: 'Portal no encontrado' }
  }

  return {
    title: `Reservar con ${profesor.nombre}`,
    description: `Reservá tu clase de pilates con ${profesor.nombre}`
  }
}
