import { PrismaClient, UserRole, PlanType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding test database...')

  // Create test user for E2E tests
  const hashedPassword = await bcrypt.hash('demo123', 10)

  const testUser = await prisma.user.upsert({
    where: { email: 'demo@pilates.com' },
    update: {
      password: hashedPassword,
      nombre: 'Demo Profesor',
      role: UserRole.PROFESOR,
      plan: PlanType.PRO,
    },
    create: {
      email: 'demo@pilates.com',
      password: hashedPassword,
      nombre: 'Demo Profesor',
      role: UserRole.PROFESOR,
      plan: PlanType.PRO,
      telefono: '+5491123456789',
    },
  })

  console.log(`Created/updated test user: ${testUser.email}`)

  // Create a secondary test user (alumno role)
  const testAlumnoUser = await prisma.user.upsert({
    where: { email: 'demo2@pilates.com' },
    update: {
      password: hashedPassword,
      nombre: 'Demo Alumno',
      role: UserRole.ALUMNO,
    },
    create: {
      email: 'demo2@pilates.com',
      password: hashedPassword,
      nombre: 'Demo Alumno',
      role: UserRole.ALUMNO,
      telefono: '+5491198765432',
    },
  })

  console.log(`Created/updated test user: ${testAlumnoUser.email}`)

  // Create some test alumnos for the profesor
  const existingAlumnos = await prisma.alumno.findMany({
    where: { profesorId: testUser.id },
  })

  if (existingAlumnos.length === 0) {
    const alumnos = [
      {
        nombre: 'Ana Garcia',
        email: 'ana@test.com',
        telefono: '+5491111111111',
        packType: 'x2',
        precio: 15000,
      },
      {
        nombre: 'Maria Lopez',
        email: 'maria@test.com',
        telefono: '+5491122222222',
        packType: 'x3',
        precio: 20000,
      },
      {
        nombre: 'Laura Martinez',
        email: 'laura@test.com',
        telefono: '+5491133333333',
        packType: 'x4',
        precio: 25000,
      },
    ]

    for (const alumnoData of alumnos) {
      const alumno = await prisma.alumno.create({
        data: {
          ...alumnoData,
          profesorId: testUser.id,
          precio: alumnoData.precio,
        },
      })
      console.log(`Created test alumno: ${alumno.nombre}`)
    }
  }

  // Create some test horarios disponibles
  const existingHorarios = await prisma.horarioDisponible.findMany({
    where: { profesorId: testUser.id },
  })

  if (existingHorarios.length === 0) {
    const horarios = [
      { diaSemana: 1, horaInicio: '09:00', horaFin: '10:00', esManiana: true },
      { diaSemana: 1, horaInicio: '10:00', horaFin: '11:00', esManiana: true },
      { diaSemana: 2, horaInicio: '18:00', horaFin: '19:00', esManiana: false },
      { diaSemana: 3, horaInicio: '09:00', horaFin: '10:00', esManiana: true },
      { diaSemana: 4, horaInicio: '17:00', horaFin: '18:00', esManiana: false },
    ]

    for (const horarioData of horarios) {
      await prisma.horarioDisponible.create({
        data: {
          ...horarioData,
          profesorId: testUser.id,
        },
      })
    }
    console.log('Created test horarios disponibles')
  }

  // Create some test packs
  const existingPacks = await prisma.pack.findMany({
    where: { profesorId: testUser.id },
  })

  if (existingPacks.length === 0) {
    const packs = [
      { nombre: 'Pack x2', clasesPorSemana: 2, precio: 15000 },
      { nombre: 'Pack x3', clasesPorSemana: 3, precio: 20000 },
      { nombre: 'Pack x4', clasesPorSemana: 4, precio: 25000 },
    ]

    for (const packData of packs) {
      await prisma.pack.create({
        data: {
          ...packData,
          profesorId: testUser.id,
        },
      })
    }
    console.log('Created test packs')
  }

  console.log('Test database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
