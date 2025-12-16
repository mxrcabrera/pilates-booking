import { PrismaClient } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

const prisma = new PrismaClient()

async function main() {
  // Buscar el primer usuario/profesor disponible
  const profesor = await prisma.user.findFirst()

  if (!profesor) {
    console.log('❌ No hay usuarios en la base de datos. Creando uno...')
    return
  }

  console.log(`✅ Usando profesor: ${profesor.nombre} (${profesor.email})`)

  // Crear fecha actual para las clases
  const now = new Date()
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // ============================================
  // CASO 1: Alumna con Pack 8 - algunas clases usadas
  // Debería mostrar: "5/8 clases usadas | 3 restantes"
  // ============================================
  const alumna1 = await prisma.alumno.create({
    data: {
      profesorId: profesor.id,
      nombre: 'María García (Pack 8 - Test)',
      email: 'maria.test@example.com',
      telefono: '1155551111',
      genero: 'F',
      packType: 'pack_8',
      clasesPorMes: 8,
      precio: new Decimal(15000),
      estaActivo: true,
    }
  })
  console.log(`✅ Creada alumna Pack 8: ${alumna1.nombre}`)

  // Crear 5 clases para esta alumna este mes
  for (let i = 0; i < 5; i++) {
    const fecha = new Date(thisMonth)
    fecha.setDate(fecha.getDate() + i * 2 + 1) // Días 1, 3, 5, 7, 9

    await prisma.clase.create({
      data: {
        profesorId: profesor.id,
        alumnoId: alumna1.id,
        fecha: fecha,
        horaInicio: '10:00',
        estado: 'completada',
      }
    })
  }
  console.log(`   → Creadas 5 clases para ${alumna1.nombre}`)

  // ============================================
  // CASO 2: Alumna con Pack 4 - SIN clases disponibles
  // Debería mostrar: "4/4 clases usadas | Sin clases disponibles" (warning)
  // ============================================
  const alumna2 = await prisma.alumno.create({
    data: {
      profesorId: profesor.id,
      nombre: 'Laura Pérez (Pack 4 - Excedida)',
      email: 'laura.test@example.com',
      telefono: '1155552222',
      genero: 'F',
      packType: 'pack_4',
      clasesPorMes: 4,
      precio: new Decimal(8000),
      estaActivo: true,
    }
  })
  console.log(`✅ Creada alumna Pack 4 excedida: ${alumna2.nombre}`)

  // Crear 4 clases (todas usadas)
  for (let i = 0; i < 4; i++) {
    const fecha = new Date(thisMonth)
    fecha.setDate(fecha.getDate() + i * 3 + 2) // Días 2, 5, 8, 11

    await prisma.clase.create({
      data: {
        profesorId: profesor.id,
        alumnoId: alumna2.id,
        fecha: fecha,
        horaInicio: '11:00',
        estado: 'completada',
      }
    })
  }
  console.log(`   → Creadas 4 clases para ${alumna2.nombre}`)

  // ============================================
  // CASO 3: Alumna con Pack 12 - varias clases restantes
  // Debería mostrar: "3/12 clases usadas | 9 restantes"
  // ============================================
  const alumna3 = await prisma.alumno.create({
    data: {
      profesorId: profesor.id,
      nombre: 'Carla Rodríguez (Pack 12 - Test)',
      email: 'carla.test@example.com',
      telefono: '1155553333',
      genero: 'F',
      packType: 'pack_12',
      clasesPorMes: 12,
      precio: new Decimal(20000),
      estaActivo: true,
    }
  })
  console.log(`✅ Creada alumna Pack 12: ${alumna3.nombre}`)

  // Crear 3 clases
  for (let i = 0; i < 3; i++) {
    const fecha = new Date(thisMonth)
    fecha.setDate(fecha.getDate() + i * 4 + 3) // Días 3, 7, 11

    await prisma.clase.create({
      data: {
        profesorId: profesor.id,
        alumnoId: alumna3.id,
        fecha: fecha,
        horaInicio: '09:00',
        estado: 'completada',
      }
    })
  }
  console.log(`   → Creadas 3 clases para ${alumna3.nombre}`)

  // ============================================
  // CASO 4: Alumna Por Clase - sin límite
  // Debería mostrar: "2 clases este mes" (sin indicador de restantes)
  // ============================================
  const alumna4 = await prisma.alumno.create({
    data: {
      profesorId: profesor.id,
      nombre: 'Ana López (Por Clase - Test)',
      email: 'ana.test@example.com',
      telefono: '1155554444',
      genero: 'F',
      packType: 'por_clase',
      clasesPorMes: null, // Sin límite
      precio: new Decimal(3500),
      estaActivo: true,
    }
  })
  console.log(`✅ Creada alumna Por Clase: ${alumna4.nombre}`)

  // Crear 2 clases
  for (let i = 0; i < 2; i++) {
    const fecha = new Date(thisMonth)
    fecha.setDate(fecha.getDate() + i * 5 + 4) // Días 4, 9

    await prisma.clase.create({
      data: {
        profesorId: profesor.id,
        alumnoId: alumna4.id,
        fecha: fecha,
        horaInicio: '17:00',
        estado: 'completada',
      }
    })
  }
  console.log(`   → Creadas 2 clases para ${alumna4.nombre}`)

  // ============================================
  // CASO 5: Alumna Mensual - sin límite estricto
  // Debería mostrar: "6 clases este mes"
  // ============================================
  const alumna5 = await prisma.alumno.create({
    data: {
      profesorId: profesor.id,
      nombre: 'Sofía Martínez (Mensual - Test)',
      email: 'sofia.test@example.com',
      telefono: '1155555555',
      genero: 'F',
      packType: 'mensual',
      clasesPorMes: null, // Mensual sin límite
      precio: new Decimal(18000),
      estaActivo: true,
    }
  })
  console.log(`✅ Creada alumna Mensual: ${alumna5.nombre}`)

  // Crear 6 clases
  for (let i = 0; i < 6; i++) {
    const fecha = new Date(thisMonth)
    fecha.setDate(fecha.getDate() + i * 2 + 1)

    await prisma.clase.create({
      data: {
        profesorId: profesor.id,
        alumnoId: alumna5.id,
        fecha: fecha,
        horaInicio: '18:00',
        estado: 'reservada', // Algunas reservadas
      }
    })
  }
  console.log(`   → Creadas 6 clases para ${alumna5.nombre}`)

  console.log('\n✅ ¡Datos de prueba creados exitosamente!')
  console.log('\nResumen de casos de prueba:')
  console.log('1. María García (Pack 8) - 5/8 usadas, 3 restantes')
  console.log('2. Laura Pérez (Pack 4) - 4/4 usadas, SIN disponibles (warning)')
  console.log('3. Carla Rodríguez (Pack 12) - 3/12 usadas, 9 restantes')
  console.log('4. Ana López (Por Clase) - 2 clases este mes (sin límite)')
  console.log('5. Sofía Martínez (Mensual) - 6 clases este mes (sin límite)')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
