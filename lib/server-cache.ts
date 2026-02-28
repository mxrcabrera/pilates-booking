import { unstable_cache } from 'next/cache'
import { prisma } from './prisma'

// Type to distinguish whether we filter by profesor or estudio
type OwnerType = 'profesor' | 'estudio'

// Helper to build filter based on owner type
function buildOwnerFilter(ownerId: string, ownerType: OwnerType) {
  return ownerType === 'estudio'
    ? { estudioId: ownerId }
    : { profesorId: ownerId }
}

// Cache for packs - rarely change
export const getCachedPacks = unstable_cache(
  async (ownerId: string, ownerType: OwnerType = 'profesor') => {
    const packs = await prisma.pack.findMany({
      where: { ...buildOwnerFilter(ownerId, ownerType), deletedAt: null },
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

// Cache for available schedules - rarely change
export const getCachedHorarios = unstable_cache(
  async (ownerId: string, ownerType: OwnerType = 'profesor') => {
    return prisma.horarioDisponible.findMany({
      where: { ...buildOwnerFilter(ownerId, ownerType), deletedAt: null },
      orderBy: [{ diaSemana: 'asc' }, { horaInicio: 'asc' }]
    })
  },
  ['horarios'],
  { revalidate: 3600, tags: ['horarios'] } // 1 hora
)

// Cache for profesor config - rarely changes
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
        trialEndsAt: true
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

// Cache de alumnos activos (with pack info for calendario) - cambia moderadamente
export const getCachedAlumnosSimple = unstable_cache(
  async (ownerId: string, ownerType: OwnerType = 'profesor') => {
    const [alumnos, packs] = await Promise.all([
      prisma.alumno.findMany({
        where: { ...buildOwnerFilter(ownerId, ownerType), estaActivo: true, deletedAt: null },
        select: { id: true, nombre: true, packType: true },
        orderBy: { nombre: 'asc' }
      }),
      prisma.pack.findMany({
        where: { ...buildOwnerFilter(ownerId, ownerType), deletedAt: null },
        select: { id: true, clasesPorSemana: true }
      })
    ])

    const packsMap = new Map(packs.map(p => [p.id, p.clasesPorSemana]))

    return alumnos.map(a => ({
      id: a.id,
      nombre: a.nombre,
      packType: a.packType,
      clasesPorSemana: packsMap.get(a.packType) ?? null
    }))
  },
  ['alumnos-simple'],
  { revalidate: 300, tags: ['alumnos'] } // 5 min
)

// Export type for external usage
export type { OwnerType }
