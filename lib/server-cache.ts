import { unstable_cache } from 'next/cache'
import { prisma } from './prisma'

// Cache de packs - cambian muy poco
export const getCachedPacks = unstable_cache(
  async (profesorId: string) => {
    const packs = await prisma.pack.findMany({
      where: { profesorId, deletedAt: null },
      orderBy: { clasesPorSemana: 'asc' }
    })
    return packs.map(p => ({
      id: p.id,
      nombre: p.nombre,
      clasesPorSemana: p.clasesPorSemana,
      precio: p.precio.toString()
    }))
  },
  ['packs'],
  { revalidate: 3600, tags: ['packs'] } // 1 hora
)

// Cache de horarios disponibles - cambian poco
export const getCachedHorarios = unstable_cache(
  async (profesorId: string) => {
    return prisma.horarioDisponible.findMany({
      where: { profesorId, deletedAt: null },
      orderBy: [{ diaSemana: 'asc' }, { horaInicio: 'asc' }]
    })
  },
  ['horarios'],
  { revalidate: 3600, tags: ['horarios'] } // 1 hora
)

// Cache de configuración del profesor - cambia poco
export const getCachedProfesorConfig = unstable_cache(
  async (profesorId: string) => {
    const user = await prisma.user.findUnique({
      where: { id: profesorId },
      select: {
        id: true,
        nombre: true,
        email: true,
        telefono: true,
        horasAnticipacionMinima: true,
        maxAlumnosPorClase: true,
        horarioMananaInicio: true,
        horarioMananaFin: true,
        turnoMananaActivo: true,
        horarioTardeInicio: true,
        horarioTardeFin: true,
        turnoTardeActivo: true,
        syncGoogleCalendar: true,
        precioPorClase: true,
        plan: true,
        trialEndsAt: true,
        slug: true,
        portalActivo: true,
        portalDescripcion: true
      }
    })
    if (!user) return null
    return {
      ...user,
      precioPorClase: user.precioPorClase.toString(),
      trialEndsAt: user.trialEndsAt?.toISOString() || null
    }
  },
  ['profesor-config'],
  { revalidate: 1800, tags: ['config'] } // 30 min
)

// Cache de alumnos activos (para selects) - cambia moderadamente
export const getCachedAlumnosSimple = unstable_cache(
  async (profesorId: string) => {
    return prisma.alumno.findMany({
      where: { profesorId, estaActivo: true, deletedAt: null },
      select: { id: true, nombre: true },
      orderBy: { nombre: 'asc' }
    })
  },
  ['alumnos-simple'],
  { revalidate: 300, tags: ['alumnos'] } // 5 min
)
