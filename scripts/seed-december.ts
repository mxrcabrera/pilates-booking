import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DEMO_EMAIL = 'demo@pilates.com'

async function main() {
  console.log('🔍 Buscando usuario demo...')

  const user = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
    include: {
      alumnos: {
        where: { estaActivo: true }
      },
      horariosDisponibles: {
        where: { estaActivo: true }
      }
    }
  })

  if (!user) {
    console.error('❌ Usuario demo no encontrado')
    process.exit(1)
  }

  console.log(`✅ Usuario encontrado: ${user.nombre}`)
  console.log(`   - Alumnos activos: ${user.alumnos.length}`)

  // Horarios típicos de clases
  const horariosManana = ['09:00', '10:00', '11:00', '12:00', '13:00']
  const horariosTarde = ['17:00', '18:00', '19:00', '20:00', '21:00']

  // Generar fechas desde hoy hasta el 31 de diciembre
  const hoy = new Date()
  const finDiciembre = new Date(2025, 11, 31) // 31 de diciembre 2025

  const fechas: Date[] = []
  const current = new Date(hoy)
  current.setHours(0, 0, 0, 0)

  while (current <= finDiciembre) {
    const diaSemana = current.getDay()
    // Lunes a viernes (1-5) y sábados (6)
    if (diaSemana >= 1 && diaSemana <= 6) {
      fechas.push(new Date(current))
    }
    current.setDate(current.getDate() + 1)
  }

  console.log(`📅 Generando clases para ${fechas.length} días...`)

  // Eliminar clases existentes del usuario en el rango
  const deleted = await prisma.clase.deleteMany({
    where: {
      profesorId: user.id,
      fecha: {
        gte: hoy,
        lte: finDiciembre
      }
    }
  })
  console.log(`🗑️  Eliminadas ${deleted.count} clases existentes`)

  const clasesACrear: any[] = []
  let alumnoIndex = 0

  for (const fecha of fechas) {
    const diaSemana = fecha.getDay()
    const esSabado = diaSemana === 6

    // Menos clases los sábados
    const horariosDelDia = esSabado
      ? horariosManana.slice(0, 3)
      : [...horariosManana, ...horariosTarde]

    // 2-4 clases por día
    const cantidadClases = esSabado
      ? Math.floor(Math.random() * 2) + 2  // 2-3 sábados
      : Math.floor(Math.random() * 3) + 3  // 3-5 entre semana

    const horariosSeleccionados = horariosDelDia
      .sort(() => Math.random() - 0.5)
      .slice(0, cantidadClases)

    for (const hora of horariosSeleccionados) {
      // 1-3 alumnos por clase
      const cantidadAlumnos = Math.min(
        Math.floor(Math.random() * 3) + 1,
        user.alumnos.length
      )

      for (let i = 0; i < cantidadAlumnos; i++) {
        const alumno = user.alumnos[alumnoIndex % user.alumnos.length]
        alumnoIndex++

        // Determinar estado según la fecha
        const esPasado = fecha < hoy
        const esHoy = fecha.toDateString() === hoy.toDateString()

        let estado = 'reservada'
        let asistencia = 'pendiente'

        if (esPasado) {
          estado = 'completada'
          asistencia = Math.random() > 0.1 ? 'presente' : 'ausente' // 90% presentes
        } else if (esHoy) {
          // Algunas clases de hoy ya completadas
          if (Math.random() > 0.5) {
            estado = 'completada'
            asistencia = 'presente'
          }
        }

        clasesACrear.push({
          profesorId: user.id,
          alumnoId: alumno.id,
          fecha: new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())),
          horaInicio: hora,
          estado,
          asistencia,
          esClasePrueba: Math.random() > 0.95, // 5% clases de prueba
          esRecurrente: false
        })
      }
    }
  }

  // Crear en batches
  const batchSize = 100
  let created = 0

  for (let i = 0; i < clasesACrear.length; i += batchSize) {
    const batch = clasesACrear.slice(i, i + batchSize)
    await prisma.clase.createMany({ data: batch })
    created += batch.length
    console.log(`   Creadas ${created}/${clasesACrear.length} clases...`)
  }

  console.log(`\n🎉 ¡Listo! ${clasesACrear.length} clases creadas`)
  console.log(`📅 Desde: ${hoy.toLocaleDateString('es-AR')}`)
  console.log(`📅 Hasta: ${finDiciembre.toLocaleDateString('es-AR')}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
