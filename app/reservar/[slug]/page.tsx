import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { PortalClient } from './portal-client'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ codigo?: string }>
}

export default async function PortalPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { codigo } = await searchParams

  // Verificar autenticación - sin login no se ve NADA
  const session = await auth()
  if (!session?.user) {
    redirect(`/login?callbackUrl=/reservar/${slug}${codigo ? `?codigo=${codigo}` : ''}`)
  }

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
      codigoPortal: true,
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

  // Si el profesor tiene código configurado, verificar
  if (profesor.codigoPortal) {
    const codigoValido = codigo && codigo.toUpperCase() === profesor.codigoPortal.toUpperCase()

    if (!codigoValido) {
      // Usuario logueado pero sin código válido - redirigir a página de código
      redirect(`/alumno/reservar?error=codigo&slug=${slug}`)
    }
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
