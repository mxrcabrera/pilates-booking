import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const ahora = new Date()
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
  const mesActual = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`

  // Obtener el profesor
  const profesor = await prisma.user.findFirst()
  if (!profesor) {
    console.log('No hay profesor en la DB')
    return
  }

  console.log('=== SEED COMPLETO: Todos los escenarios ===\n')

  // ========================================
  // 1. ALUMNOS - Diferentes estados
  // ========================================
  console.log('--- ALUMNOS ---')

  // Limpiar datos existentes
  await prisma.pago.deleteMany({})
  await prisma.clase.deleteMany({})
  await prisma.alumno.deleteMany({})

  const alumnosData = [
    // Activos con diferentes packs
    { nombre: 'Ana López', email: 'ana@test.com', telefono: '1111111111', packType: '3x', clasesPorMes: 12, precio: 45000, estaActivo: true, genero: 'F' },
    { nombre: 'Bruno Martínez', email: 'bruno@test.com', telefono: '2222222222', packType: '2x', clasesPorMes: 8, precio: 35000, estaActivo: true, genero: 'M' },
    { nombre: 'Carla Rodríguez', email: 'carla@test.com', telefono: '3333333333', packType: '1x', clasesPorMes: 4, precio: 20000, estaActivo: true, genero: 'F' },
    { nombre: 'Diego Fernández', email: 'diego@test.com', telefono: '4444444444', packType: 'clase', clasesPorMes: null, precio: 5000, estaActivo: true, genero: 'M' },
    { nombre: 'Elena García', email: 'elena@test.com', telefono: '5555555555', packType: '2x', clasesPorMes: 8, precio: 35000, estaActivo: true, genero: 'F' },
    { nombre: 'Federico Ruiz', email: 'fede@test.com', telefono: '6666666666', packType: '3x', clasesPorMes: 12, precio: 45000, estaActivo: true, genero: 'M' },
    { nombre: 'Gabriela Díaz', email: 'gabi@test.com', telefono: '7777777777', packType: '1x', clasesPorMes: 4, precio: 20000, estaActivo: true, genero: 'F' },
    // Inactivos
    { nombre: 'Hugo Pérez', email: 'hugo@test.com', telefono: '8888888888', packType: '2x', clasesPorMes: 8, precio: 35000, estaActivo: false, genero: 'M' },
    { nombre: 'Inés Gómez', email: 'ines@test.com', telefono: '9999999999', packType: '1x', clasesPorMes: 4, precio: 20000, estaActivo: false, genero: 'F' },
  ]

  const alumnos = []
  for (const data of alumnosData) {
    const alumno = await prisma.alumno.create({
      data: {
        ...data,
        profesorId: profesor.id
      }
    })
    alumnos.push(alumno)
    console.log(`✓ ${alumno.nombre} - ${alumno.estaActivo ? 'Activo' : 'Inactivo'} - ${alumno.packType}`)
  }

  // ========================================
  // 2. PAGOS - Diferentes estados de vencimiento
  // ========================================
  console.log('\n--- PAGOS ---')

  const pagosEscenarios = [
    { alumnoIdx: 0, diasVenc: -3, estado: 'pendiente', desc: '3d atraso (badge rojo)' },
    { alumnoIdx: 1, diasVenc: 0, estado: 'pendiente', desc: 'Vence hoy (badge rojo)' },
    { alumnoIdx: 2, diasVenc: 3, estado: 'pendiente', desc: '3d para vencer (badge amarillo)' },
    { alumnoIdx: 3, diasVenc: 7, estado: 'pendiente', desc: '7d para vencer (badge amarillo)' },
    { alumnoIdx: 4, diasVenc: 15, estado: 'pendiente', desc: '15d para vencer (sin badge)' },
    { alumnoIdx: 5, diasVenc: -30, estado: 'pendiente', desc: '30d atraso (badge rojo)' },
    { alumnoIdx: 6, diasVenc: null, estado: 'pagado', desc: 'Ya pagó (sin badge)' },
  ]

  for (const esc of pagosEscenarios) {
    const alumno = alumnos[esc.alumnoIdx]
    const fechaVenc = new Date(hoy)
    if (esc.diasVenc !== null) {
      fechaVenc.setDate(fechaVenc.getDate() + esc.diasVenc)
    }

    await prisma.pago.create({
      data: {
        alumnoId: alumno.id,
        monto: alumno.precio,
        fechaVencimiento: fechaVenc,
        fechaPago: esc.estado === 'pagado' ? new Date() : null,
        estado: esc.estado,
        mesCorrespondiente: mesActual,
        tipoPago: alumno.packType === 'clase' ? 'clase' : 'mensual',
        clasesEsperadas: alumno.clasesPorMes || 1
      }
    })
    console.log(`✓ ${alumno.nombre}: ${esc.desc}`)
  }

  // ========================================
  // 3. CLASES - Diferentes estados y fechas
  // ========================================
  console.log('\n--- CLASES ---')

  // Clases de hoy
  const clasesHoy = [
    { alumnoIdx: 0, hora: '09:00', estado: 'reservada', desc: 'Hoy 09:00 - Reservada' },
    { alumnoIdx: 1, hora: '10:00', estado: 'reservada', desc: 'Hoy 10:00 - Reservada' },
    { alumnoIdx: 2, hora: '11:00', estado: 'completada', desc: 'Hoy 11:00 - Completada' },
    { alumnoIdx: 3, hora: '17:00', estado: 'reservada', desc: 'Hoy 17:00 - Reservada (tarde)' },
  ]

  for (const clase of clasesHoy) {
    const alumno = alumnos[clase.alumnoIdx]
    await prisma.clase.create({
      data: {
        profesorId: profesor.id,
        alumnoId: alumno.id,
        fecha: hoy,
        horaInicio: clase.hora,
        estado: clase.estado
      }
    })
    console.log(`✓ ${alumno.nombre}: ${clase.desc}`)
  }

  // Clases de mañana
  const manana = new Date(hoy)
  manana.setDate(manana.getDate() + 1)

  const clasesManana = [
    { alumnoIdx: 4, hora: '09:00', estado: 'reservada' },
    { alumnoIdx: 5, hora: '10:00', estado: 'reservada' },
  ]

  for (const clase of clasesManana) {
    const alumno = alumnos[clase.alumnoIdx]
    await prisma.clase.create({
      data: {
        profesorId: profesor.id,
        alumnoId: alumno.id,
        fecha: manana,
        horaInicio: clase.hora,
        estado: clase.estado
      }
    })
    console.log(`✓ ${alumno.nombre}: Mañana ${clase.hora} - Reservada`)
  }

  // Clases pasadas (ayer) con diferentes estados
  const ayer = new Date(hoy)
  ayer.setDate(ayer.getDate() - 1)

  const clasesAyer = [
    { alumnoIdx: 0, hora: '09:00', estado: 'completada', desc: 'Ayer - Completada' },
    { alumnoIdx: 1, hora: '10:00', estado: 'ausente', desc: 'Ayer - Ausente' },
    { alumnoIdx: 2, hora: '11:00', estado: 'cancelada', desc: 'Ayer - Cancelada' },
  ]

  for (const clase of clasesAyer) {
    const alumno = alumnos[clase.alumnoIdx]
    await prisma.clase.create({
      data: {
        profesorId: profesor.id,
        alumnoId: alumno.id,
        fecha: ayer,
        horaInicio: clase.hora,
        estado: clase.estado
      }
    })
    console.log(`✓ ${alumno.nombre}: ${clase.desc}`)
  }

  // Clase de prueba
  await prisma.clase.create({
    data: {
      profesorId: profesor.id,
      alumnoId: alumnos[6].id,
      fecha: hoy,
      horaInicio: '18:00',
      estado: 'reservada',
      esClasePrueba: true
    }
  })
  console.log(`✓ ${alumnos[6].nombre}: Hoy 18:00 - Clase de prueba`)

  // ========================================
  // RESUMEN
  // ========================================
  console.log('\n========================================')
  console.log('RESUMEN DE DATOS CREADOS:')
  console.log('========================================')
  console.log(`Alumnos: ${alumnos.length} (${alumnos.filter(a => a.estaActivo).length} activos, ${alumnos.filter(a => !a.estaActivo).length} inactivos)`)

  const pagosCount = await prisma.pago.count()
  const pagosPendientes = await prisma.pago.count({ where: { estado: 'pendiente' } })
  console.log(`Pagos: ${pagosCount} (${pagosPendientes} pendientes)`)

  const clasesCount = await prisma.clase.count()
  console.log(`Clases: ${clasesCount}`)

  console.log('\nESCENARIOS DE BADGE EN ALUMNOS:')
  console.log('- Ana López: 3d atraso (rojo)')
  console.log('- Bruno Martínez: Vence hoy (rojo)')
  console.log('- Carla Rodríguez: 3d para vencer (amarillo)')
  console.log('- Diego Fernández: 7d para vencer (amarillo)')
  console.log('- Elena García: 15d para vencer (sin badge)')
  console.log('- Federico Ruiz: 30d atraso (rojo)')
  console.log('- Gabriela Díaz: Ya pagó (sin badge)')
  console.log('- Hugo Pérez: Inactivo (sin badge)')
  console.log('- Inés Gómez: Inactiva (sin badge)')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
