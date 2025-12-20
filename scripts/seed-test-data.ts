import { PrismaClient } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

const prisma = new PrismaClient()

async function main() {
  // Buscar el primer usuario/profesor disponible
  const profesor = await prisma.user.findFirst()

  if (!profesor) {
    console.log('❌ No hay usuarios en la base de datos.')
    return
  }

  console.log(`✅ Usando profesor: ${profesor.nombre} (${profesor.email})`)
  console.log('─'.repeat(50))

  // ============================================
  // LIMPIAR DATOS ANTERIORES DE PRUEBA
  // ============================================
  console.log('\n🧹 Limpiando datos de prueba anteriores...')

  // Borrar alumnos de prueba (los que tienen "Test" en el nombre)
  await prisma.alumno.deleteMany({
    where: {
      profesorId: profesor.id,
      nombre: { contains: 'Test' }
    }
  })

  // Borrar packs de prueba
  await prisma.pack.deleteMany({
    where: {
      profesorId: profesor.id,
      nombre: { contains: 'Test' }
    }
  })

  // Borrar horarios de prueba (todos del profesor para recrear)
  // No borramos horarios porque pueden ser reales

  console.log('✅ Datos anteriores limpiados')

  // ============================================
  // CREAR PACKS
  // ============================================
  console.log('\n📦 Creando packs...')

  const pack2clases = await prisma.pack.create({
    data: {
      profesorId: profesor.id,
      nombre: 'Pack 2 clases/sem (Test)',
      clasesPorSemana: 2,
      precio: new Decimal(12000)
    }
  })
  console.log(`   ✅ ${pack2clases.nombre} - $${pack2clases.precio}`)

  const pack3clases = await prisma.pack.create({
    data: {
      profesorId: profesor.id,
      nombre: 'Pack 3 clases/sem (Test)',
      clasesPorSemana: 3,
      precio: new Decimal(16000)
    }
  })
  console.log(`   ✅ ${pack3clases.nombre} - $${pack3clases.precio}`)

  const pack5clases = await prisma.pack.create({
    data: {
      profesorId: profesor.id,
      nombre: 'Pack Full (5 clases/sem) (Test)',
      clasesPorSemana: 5,
      precio: new Decimal(22000)
    }
  })
  console.log(`   ✅ ${pack5clases.nombre} - $${pack5clases.precio}`)

  // ============================================
  // CREAR HORARIOS DISPONIBLES
  // ============================================
  console.log('\n🕐 Verificando horarios...')

  const horariosExistentes = await prisma.horarioDisponible.count({
    where: { profesorId: profesor.id }
  })

  if (horariosExistentes === 0) {
    console.log('   Creando horarios de ejemplo...')

    // Lunes a Viernes mañana (08:00 - 12:00)
    for (let dia = 1; dia <= 5; dia++) {
      await prisma.horarioDisponible.create({
        data: {
          profesorId: profesor.id,
          diaSemana: dia,
          horaInicio: '08:00',
          horaFin: '12:00',
          esManiana: true,
          estaActivo: true
        }
      })
    }

    // Lunes a Viernes tarde (17:00 - 21:00)
    for (let dia = 1; dia <= 5; dia++) {
      await prisma.horarioDisponible.create({
        data: {
          profesorId: profesor.id,
          diaSemana: dia,
          horaInicio: '17:00',
          horaFin: '21:00',
          esManiana: false,
          estaActivo: true
        }
      })
    }

    // Sábado mañana
    await prisma.horarioDisponible.create({
      data: {
        profesorId: profesor.id,
        diaSemana: 6,
        horaInicio: '09:00',
        horaFin: '13:00',
        esManiana: true,
        estaActivo: true
      }
    })

    console.log('   ✅ Horarios L-V mañana y tarde + Sáb mañana creados')
  } else {
    console.log(`   ✅ Ya existen ${horariosExistentes} horarios configurados`)
  }

  // ============================================
  // CREAR ALUMNOS CON DIFERENTES CASOS
  // ============================================
  console.log('\n👥 Creando alumnos...')

  const now = new Date()

  // Alumna 1: Pack 2 clases - algunas usadas
  const alumna1 = await prisma.alumno.create({
    data: {
      profesorId: profesor.id,
      nombre: 'María García (Test)',
      email: 'maria.test@example.com',
      telefono: '1155551111',
      genero: 'F',
      packType: 'pack',
      clasesPorMes: 8, // 2 clases/sem * 4
      precio: new Decimal(12000),
      estaActivo: true,
      cumpleanos: new Date(1990, 3, 15),
      patologias: 'Escoliosis leve'
    }
  })
  console.log(`   ✅ ${alumna1.nombre} - Pack 8 clases/mes`)

  // Alumna 2: Pack 3 clases - casi todas usadas
  const alumna2 = await prisma.alumno.create({
    data: {
      profesorId: profesor.id,
      nombre: 'Laura Pérez (Test)',
      email: 'laura.test@example.com',
      telefono: '1155552222',
      genero: 'F',
      packType: 'pack',
      clasesPorMes: 12, // 3 clases/sem * 4
      precio: new Decimal(16000),
      estaActivo: true,
      cumpleanos: new Date(1985, 7, 22),
      patologias: null
    }
  })
  console.log(`   ✅ ${alumna2.nombre} - Pack 12 clases/mes`)

  // Alumna 3: Por clase (sin límite)
  const alumna3 = await prisma.alumno.create({
    data: {
      profesorId: profesor.id,
      nombre: 'Carla Rodríguez (Test)',
      email: 'carla.test@example.com',
      telefono: '1155553333',
      genero: 'F',
      packType: 'por_clase',
      clasesPorMes: null,
      precio: new Decimal(3500),
      estaActivo: true,
      cumpleanos: new Date(1995, 11, 3)
    }
  })
  console.log(`   ✅ ${alumna3.nombre} - Por clase`)

  // Alumna 4: Mensual (sin límite)
  const alumna4 = await prisma.alumno.create({
    data: {
      profesorId: profesor.id,
      nombre: 'Ana López (Test)',
      email: 'ana.test@example.com',
      telefono: '1155554444',
      genero: 'F',
      packType: 'mensual',
      clasesPorMes: null,
      precio: new Decimal(18000),
      estaActivo: true,
      cumpleanos: new Date(1988, 5, 10),
      patologias: 'Hernia de disco L4-L5'
    }
  })
  console.log(`   ✅ ${alumna4.nombre} - Mensual`)

  // Alumna 5: Inactiva
  const alumna5 = await prisma.alumno.create({
    data: {
      profesorId: profesor.id,
      nombre: 'Sofía Martínez (Test)',
      email: 'sofia.test@example.com',
      telefono: '1155555555',
      genero: 'F',
      packType: 'pack',
      clasesPorMes: 8,
      precio: new Decimal(12000),
      estaActivo: false, // INACTIVA
      cumpleanos: new Date(1992, 9, 28)
    }
  })
  console.log(`   ✅ ${alumna5.nombre} - INACTIVA`)

  // Alumno 6: Hombre con consentimiento tutor (menor simulado)
  const alumno6 = await prisma.alumno.create({
    data: {
      profesorId: profesor.id,
      nombre: 'Tomás Fernández (Test)',
      email: 'tomas.test@example.com',
      telefono: '1155556666',
      genero: 'M',
      packType: 'pack',
      clasesPorMes: 8,
      precio: new Decimal(12000),
      estaActivo: true,
      cumpleanos: new Date(2008, 2, 14),
      consentimientoTutor: true
    }
  })
  console.log(`   ✅ ${alumno6.nombre} - Con consentimiento tutor`)

  // ============================================
  // CREAR CLASES
  // ============================================
  console.log('\n📅 Creando clases...')

  // Helper para crear fecha sin problemas de timezone
  const crearFecha = (diasOffset: number) => {
    const fecha = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diasOffset, 12, 0, 0)
    return fecha
  }

  // Clases para María (5 de 8 usadas) - días anteriores a hoy
  for (let i = 0; i < 5; i++) {
    await prisma.clase.create({
      data: {
        profesorId: profesor.id,
        alumnoId: alumna1.id,
        fecha: crearFecha(-10 + i * 2),
        horaInicio: '10:00',
        estado: 'completada'
      }
    })
  }
  console.log(`   ✅ María: 5 clases completadas`)

  // Clases para Laura (11 de 12 usadas - casi llena) - días anteriores
  for (let i = 0; i < 11; i++) {
    await prisma.clase.create({
      data: {
        profesorId: profesor.id,
        alumnoId: alumna2.id,
        fecha: crearFecha(-15 + i),
        horaInicio: i % 2 === 0 ? '09:00' : '18:00',
        estado: 'completada'
      }
    })
  }
  console.log(`   ✅ Laura: 11 clases completadas`)

  // Clases para Carla (por clase - 3 clases) - días anteriores
  for (let i = 0; i < 3; i++) {
    await prisma.clase.create({
      data: {
        profesorId: profesor.id,
        alumnoId: alumna3.id,
        fecha: crearFecha(-12 + i * 4),
        horaInicio: '11:00',
        estado: 'completada'
      }
    })
  }
  console.log(`   ✅ Carla: 3 clases completadas`)

  // Clases para Ana (mensual - muchas clases) - días anteriores
  for (let i = 0; i < 8; i++) {
    await prisma.clase.create({
      data: {
        profesorId: profesor.id,
        alumnoId: alumna4.id,
        fecha: crearFecha(-14 + i * 2),
        horaInicio: '17:00',
        estado: i < 6 ? 'completada' : 'reservada'
      }
    })
  }
  console.log(`   ✅ Ana: 6 completadas + 2 reservadas`)

  // ============================================
  // CLASES PARA HOY Y ESTA SEMANA (visibles en calendario)
  // ============================================

  // HOY 09:00 - 3 alumnas (María, Laura, Ana)
  await prisma.clase.create({
    data: {
      profesorId: profesor.id,
      alumnoId: alumna1.id,
      fecha: crearFecha(0),
      horaInicio: '09:00',
      estado: 'reservada'
    }
  })
  await prisma.clase.create({
    data: {
      profesorId: profesor.id,
      alumnoId: alumna2.id,
      fecha: crearFecha(0),
      horaInicio: '09:00',
      estado: 'reservada'
    }
  })
  await prisma.clase.create({
    data: {
      profesorId: profesor.id,
      alumnoId: alumna4.id,
      fecha: crearFecha(0),
      horaInicio: '09:00',
      estado: 'reservada'
    }
  })

  // HOY 10:00 - 2 alumnas (Carla, María)
  await prisma.clase.create({
    data: {
      profesorId: profesor.id,
      alumnoId: alumna3.id,
      fecha: crearFecha(0),
      horaInicio: '10:00',
      estado: 'reservada'
    }
  })
  await prisma.clase.create({
    data: {
      profesorId: profesor.id,
      alumnoId: alumna1.id,
      fecha: crearFecha(0),
      horaInicio: '10:00',
      estado: 'completada'
    }
  })

  // HOY 18:00 - 4 alumnos (todos los activos)
  await prisma.clase.create({
    data: {
      profesorId: profesor.id,
      alumnoId: alumna1.id,
      fecha: crearFecha(0),
      horaInicio: '18:00',
      estado: 'reservada'
    }
  })
  await prisma.clase.create({
    data: {
      profesorId: profesor.id,
      alumnoId: alumna2.id,
      fecha: crearFecha(0),
      horaInicio: '18:00',
      estado: 'completada'
    }
  })
  await prisma.clase.create({
    data: {
      profesorId: profesor.id,
      alumnoId: alumna3.id,
      fecha: crearFecha(0),
      horaInicio: '18:00',
      estado: 'reservada'
    }
  })
  await prisma.clase.create({
    data: {
      profesorId: profesor.id,
      alumnoId: alumna4.id,
      fecha: crearFecha(0),
      horaInicio: '18:00',
      estado: 'cancelada'
    }
  })
  console.log(`   ✅ HOY: 3 clases a las 09:00, 2 a las 10:00, 4 a las 18:00`)

  // MAÑANA 11:00 - 3 alumnas
  await prisma.clase.create({
    data: {
      profesorId: profesor.id,
      alumnoId: alumna1.id,
      fecha: crearFecha(1),
      horaInicio: '11:00',
      estado: 'reservada'
    }
  })
  await prisma.clase.create({
    data: {
      profesorId: profesor.id,
      alumnoId: alumna2.id,
      fecha: crearFecha(1),
      horaInicio: '11:00',
      estado: 'reservada'
    }
  })
  await prisma.clase.create({
    data: {
      profesorId: profesor.id,
      alumnoId: alumna4.id,
      fecha: crearFecha(1),
      horaInicio: '11:00',
      estado: 'reservada'
    }
  })

  // MAÑANA 17:00 - 2 alumnas
  await prisma.clase.create({
    data: {
      profesorId: profesor.id,
      alumnoId: alumna3.id,
      fecha: crearFecha(1),
      horaInicio: '17:00',
      estado: 'reservada'
    }
  })
  await prisma.clase.create({
    data: {
      profesorId: profesor.id,
      alumnoId: alumno6.id,
      fecha: crearFecha(1),
      horaInicio: '17:00',
      estado: 'reservada'
    }
  })
  console.log(`   ✅ MAÑANA: 3 clases a las 11:00, 2 a las 17:00`)

  // Clases para los próximos 5-7 días - múltiples por horario
  for (let i = 2; i <= 7; i++) {
    // 2-3 clases a las 09:00 cada día
    const alumnosManana = [alumna1, alumna2, alumna3]
    for (let j = 0; j < (i % 2 === 0 ? 3 : 2); j++) {
      await prisma.clase.create({
        data: {
          profesorId: profesor.id,
          alumnoId: alumnosManana[j].id,
          fecha: crearFecha(i),
          horaInicio: '09:00',
          estado: 'reservada'
        }
      })
    }

    // 2 clases a las 18:00 cada día
    await prisma.clase.create({
      data: {
        profesorId: profesor.id,
        alumnoId: alumna4.id,
        fecha: crearFecha(i),
        horaInicio: '18:00',
        estado: 'reservada'
      }
    })
    await prisma.clase.create({
      data: {
        profesorId: profesor.id,
        alumnoId: alumno6.id,
        fecha: crearFecha(i),
        horaInicio: '18:00',
        estado: 'reservada'
      }
    })
  }
  console.log(`   ✅ Próximos 6 días: múltiples clases a las 09:00 y 18:00`)

  // Clase de prueba (sin alumno asignado todavía) - pasado mañana
  await prisma.clase.create({
    data: {
      profesorId: profesor.id,
      alumnoId: null,
      fecha: crearFecha(2),
      horaInicio: '10:00',
      estado: 'reservada',
      esClasePrueba: true
    }
  })
  console.log(`   ✅ 1 clase de prueba (sin alumno)`)

  // Clases canceladas/no asistió - días pasados esta semana
  await prisma.clase.create({
    data: {
      profesorId: profesor.id,
      alumnoId: alumna1.id,
      fecha: crearFecha(-3),
      horaInicio: '09:00',
      estado: 'cancelada'
    }
  })

  await prisma.clase.create({
    data: {
      profesorId: profesor.id,
      alumnoId: alumna2.id,
      fecha: crearFecha(-2),
      horaInicio: '10:00',
      estado: 'ausente'
    }
  })
  console.log(`   ✅ 1 cancelada + 1 ausente`)

  // ============================================
  // CREAR PAGOS
  // ============================================
  console.log('\n💰 Creando pagos...')

  const mesActual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const mesAnterior = now.getMonth() === 0
    ? `${now.getFullYear() - 1}-12`
    : `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`

  // Pago pendiente para María (mes actual)
  await prisma.pago.create({
    data: {
      alumnoId: alumna1.id,
      monto: new Decimal(12000),
      fechaVencimiento: new Date(now.getFullYear(), now.getMonth(), 10),
      estado: 'pendiente',
      mesCorrespondiente: mesActual
    }
  })
  console.log(`   ✅ María: pago PENDIENTE $12.000`)

  // Pago pagado para Laura (mes actual)
  await prisma.pago.create({
    data: {
      alumnoId: alumna2.id,
      monto: new Decimal(16000),
      fechaPago: new Date(now.getFullYear(), now.getMonth(), 5),
      fechaVencimiento: new Date(now.getFullYear(), now.getMonth(), 10),
      estado: 'pagado',
      mesCorrespondiente: mesActual
    }
  })
  console.log(`   ✅ Laura: pago PAGADO $16.000`)

  // Pago vencido para Carla (mes anterior - no pagó)
  const fechaVencida = new Date(now.getFullYear(), now.getMonth() - 1, 10)
  await prisma.pago.create({
    data: {
      alumnoId: alumna3.id,
      monto: new Decimal(10500), // 3 clases * 3500
      fechaVencimiento: fechaVencida,
      estado: 'pendiente', // Vencido pero pendiente
      mesCorrespondiente: mesAnterior
    }
  })
  console.log(`   ✅ Carla: pago VENCIDO $10.500`)

  // Pago pagado para Ana (mes actual)
  await prisma.pago.create({
    data: {
      alumnoId: alumna4.id,
      monto: new Decimal(18000),
      fechaPago: new Date(now.getFullYear(), now.getMonth(), 1),
      fechaVencimiento: new Date(now.getFullYear(), now.getMonth(), 10),
      estado: 'pagado',
      mesCorrespondiente: mesActual
    }
  })
  console.log(`   ✅ Ana: pago PAGADO $18.000`)

  // Pago pendiente para Tomás (mes actual)
  await prisma.pago.create({
    data: {
      alumnoId: alumno6.id,
      monto: new Decimal(12000),
      fechaVencimiento: new Date(now.getFullYear(), now.getMonth(), 15),
      estado: 'pendiente',
      mesCorrespondiente: mesActual
    }
  })
  console.log(`   ✅ Tomás: pago PENDIENTE $12.000`)

  // ============================================
  // RESUMEN FINAL
  // ============================================
  console.log('\n' + '═'.repeat(50))
  console.log('✅ ¡DATOS DE PRUEBA CREADOS EXITOSAMENTE!')
  console.log('═'.repeat(50))

  console.log('\n📦 PACKS:')
  console.log('   • Pack 2 clases/sem - $12.000')
  console.log('   • Pack 3 clases/sem - $16.000')
  console.log('   • Pack Full (5 clases/sem) - $22.000')

  console.log('\n👥 ALUMNOS:')
  console.log('   • María García - Pack 8 clases (5/8 usadas)')
  console.log('   • Laura Pérez - Pack 12 clases (11/12 usadas, casi llena)')
  console.log('   • Carla Rodríguez - Por clase (3 clases)')
  console.log('   • Ana López - Mensual (8 clases)')
  console.log('   • Sofía Martínez - INACTIVA')
  console.log('   • Tomás Fernández - Con consentimiento tutor')

  console.log('\n📅 CLASES:')
  console.log('   • Completadas, reservadas, canceladas, no asistió')
  console.log('   • 1 clase de prueba sin alumno')

  console.log('\n💰 PAGOS:')
  console.log('   • 2 pendientes (María, Tomás)')
  console.log('   • 2 pagados (Laura, Ana)')
  console.log('   • 1 vencido (Carla)')

  console.log('\n🕐 HORARIOS: L-V mañana/tarde + Sáb mañana')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
