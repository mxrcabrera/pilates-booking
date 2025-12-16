import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const packs = await prisma.pack.findMany()
  console.log('Packs en DB:', JSON.stringify(packs, null, 2))

  const alumnos = await prisma.alumno.findMany({
    select: { nombre: true, packType: true, clasesPorMes: true }
  })
  console.log('\nAlumnos y sus packTypes:')
  alumnos.forEach(a => console.log(`- ${a.nombre}: packType="${a.packType}", clasesPorMes=${a.clasesPorMes}`))
}

main().finally(() => prisma.$disconnect())
