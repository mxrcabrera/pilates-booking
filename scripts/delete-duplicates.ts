import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Encontrar duplicados por nombre
  const alumnos = await prisma.alumno.findMany({
    where: { nombre: { contains: 'Test' } },
    orderBy: { createdAt: 'asc' }
  })

  const seen = new Map<string, string>()
  const toDelete: string[] = []

  for (const a of alumnos) {
    if (seen.has(a.nombre)) {
      toDelete.push(a.id)
    } else {
      seen.set(a.nombre, a.id)
    }
  }

  console.log('Duplicados a eliminar:', toDelete.length)

  if (toDelete.length > 0) {
    // Eliminar clases de los duplicados primero
    const clasesDeleted = await prisma.clase.deleteMany({
      where: { alumnoId: { in: toDelete } }
    })
    console.log('Clases eliminadas:', clasesDeleted.count)

    // Eliminar duplicados
    const alumnosDeleted = await prisma.alumno.deleteMany({
      where: { id: { in: toDelete } }
    })
    console.log('Alumnos eliminados:', alumnosDeleted.count)
  }

  // Mostrar alumnos restantes
  const remaining = await prisma.alumno.findMany({
    where: { nombre: { contains: 'Test' } },
    select: { nombre: true, packType: true, clasesPorMes: true }
  })
  console.log('\nAlumnos de test restantes:')
  remaining.forEach(a => console.log(`- ${a.nombre} (${a.packType}, limit: ${a.clasesPorMes})`))
}

main().finally(() => prisma.$disconnect())
