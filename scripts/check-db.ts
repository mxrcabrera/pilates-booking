import { PrismaClient } from '@prisma/client'
import { format } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
  const hoy = format(new Date(), 'yyyy-MM-dd')
  console.log('=== HOY ES:', hoy, '===\n')

  console.log('=== COUNTS ===')
  const [users, alumnos, packs, horarios, clases, pagos] = await Promise.all([
    prisma.user.count(),
    prisma.alumno.count(),
    prisma.pack.count(),
    prisma.horarioDisponible.count(),
    prisma.clase.count(),
    prisma.pago.count()
  ])
  console.log('Users:', users)
  console.log('Alumnos:', alumnos)
  console.log('Packs:', packs)
  console.log('Horarios:', horarios)
  console.log('Clases:', clases)
  console.log('Pagos:', pagos)

  console.log('\n=== CLASES DE HOY ===')
  // Usar misma lógica que dashboard API (medianoche UTC)
  const ahora = new Date()
  const fechaHoy = new Date(Date.UTC(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()))
  console.log('Buscando fecha:', fechaHoy.toISOString())
  const clasesHoy = await prisma.clase.findMany({
    where: { fecha: fechaHoy },
    select: {
      id: true,
      horaInicio: true,
      estado: true,
      esClasePrueba: true,
      alumno: { select: { nombre: true } }
    },
    orderBy: { horaInicio: 'asc' }
  })
  console.log('Total clases hoy:', clasesHoy.length)
  clasesHoy.forEach(c => {
    console.log(' -', c.horaInicio, c.estado, c.alumno?.nombre || 'SIN ALUMNO')
  })

  console.log('\n=== TODAS LAS CLASES (primeras 10) ===')
  const todasClases = await prisma.clase.findMany({
    take: 10,
    orderBy: { fecha: 'asc' },
    select: {
      fecha: true,
      horaInicio: true,
      estado: true,
      alumno: { select: { nombre: true } }
    }
  })
  todasClases.forEach(c => {
    console.log(' -', c.fecha.toISOString(), c.horaInicio, c.estado, c.alumno?.nombre || 'SIN ALUMNO')
  })
}

main()
  .finally(() => prisma.$disconnect())
