import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('=== USUARIOS ===')
  const users = await prisma.user.findMany({ select: { id: true, email: true, nombre: true } })
  console.log(users)

  console.log('\n=== ALUMNOS ===')
  const alumnos = await prisma.alumno.findMany({
    select: { id: true, nombre: true, profesorId: true, packType: true, clasesPorMes: true, estaActivo: true }
  })
  console.log(alumnos)

  console.log('\n=== CLASES ===')
  const clases = await prisma.clase.count()
  console.log('Total clases:', clases)
}

main()
  .finally(() => prisma.$disconnect())
