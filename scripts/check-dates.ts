import { PrismaClient } from '@prisma/client'

// Copia de la función actualizada
function formatearFechaDia(fecha: Date | string): string {
  if (typeof fecha === 'string') {
    return fecha.split('T')[0]
  }

  const esDeDB = fecha.getUTCHours() === 0 &&
                 fecha.getUTCMinutes() === 0 &&
                 fecha.getUTCSeconds() === 0 &&
                 fecha.getUTCMilliseconds() === 0

  if (esDeDB) {
    const year = fecha.getUTCFullYear()
    const month = String(fecha.getUTCMonth() + 1).padStart(2, '0')
    const day = String(fecha.getUTCDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  } else {
    const year = fecha.getFullYear()
    const month = String(fecha.getMonth() + 1).padStart(2, '0')
    const day = String(fecha.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
}

const prisma = new PrismaClient()

async function main() {
  console.log('=== VERIFICANDO PROBLEMA DE FECHAS ===\n')

  // Simular lo que hace el calendario
  const fechaActual = new Date()
  const inicioSemana = new Date(fechaActual)
  inicioSemana.setDate(fechaActual.getDate() - fechaActual.getDay())

  console.log('Fecha actual local:', fechaActual.toISOString())
  console.log('Fecha actual formateada Argentina:', formatearFechaDia(fechaActual))
  console.log('')

  const diasSemana = Array.from({ length: 7 }, (_, i) => {
    const fecha = new Date(inicioSemana)
    fecha.setDate(inicioSemana.getDate() + i)
    return fecha
  })

  console.log('Días de la semana (como los calcula el calendario):')
  diasSemana.forEach((fecha, i) => {
    const formateado = formatearFechaDia(fecha)
    console.log(`  Día ${i}: ${fecha.toISOString()} -> formateado: ${formateado}`)
  })

  console.log('')

  // Obtener clases de la DB
  const clases = await prisma.clase.findMany({
    orderBy: { fecha: 'desc' },
    take: 10,
    select: {
      id: true,
      fecha: true,
      horaInicio: true,
      alumno: { select: { nombre: true } }
    }
  })

  console.log('Clases en DB (como Date objects de Prisma):')
  clases.forEach(c => {
    const fechaStr = formatearFechaDia(c.fecha)
    console.log(`  ${c.fecha.toISOString()} -> formateado: ${fechaStr} | ${c.horaInicio} | ${c.alumno?.nombre}`)
  })

  console.log('')

  // Verificar matching
  console.log('=== VERIFICANDO MATCHING ===')
  const hoyStr = formatearFechaDia(fechaActual)
  console.log('Hoy formateado:', hoyStr)

  const clasesHoy = clases.filter(c => formatearFechaDia(c.fecha) === hoyStr)
  console.log('Clases que matchean con hoy:', clasesHoy.length)
  clasesHoy.forEach(c => console.log(`  ${c.horaInicio} | ${c.alumno?.nombre}`))

  // Verificar cada día de la semana
  console.log('')
  console.log('=== CLASES POR DÍA DE LA SEMANA ===')
  diasSemana.forEach((fecha) => {
    const fechaStr = formatearFechaDia(fecha)
    const clasesDelDia = clases.filter(c => formatearFechaDia(c.fecha) === fechaStr)
    if (clasesDelDia.length > 0) {
      console.log(`${['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][fecha.getDay()]} ${fecha.getDate()} (${fechaStr}): ${clasesDelDia.length} clases`)
      clasesDelDia.forEach(c => console.log(`    ${c.horaInicio} | ${c.alumno?.nombre}`))
    }
  })

  await prisma.$disconnect()
}

main()
