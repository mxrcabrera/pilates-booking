import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as xlsx from 'xlsx'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.1-8b-instant'

const SYSTEM_PROMPT = `You are a data extraction assistant for a Pilates Booking system. Your task is to extract structured data from Excel files and convert it to JSON format.

The Excel file may contain the following types of data:
- Alumnos (students): nombre, email, telefono, cumpleanos, patologias, pack_type, clases_por_mes, precio
- Clases (classes): fecha, hora_inicio, alumno_nombre, estado
- Pagos (payments): alumno_nombre, monto, fecha_pago, fecha_vencimiento, estado, mes_correspondiente

Extract the data and return it as a JSON object with the following structure:
{
  "alumnos": [
    {
      "nombre": "string",
      "email": "string",
      "telefono": "string",
      "cumpleanos": "YYYY-MM-DD",
      "patologias": "string",
      "pack_type": "string",
      "clases_por_mes": number,
      "precio": number
    }
  ],
  "clases": [
    {
      "fecha": "YYYY-MM-DD",
      "hora_inicio": "HH:mm",
      "alumno_nombre": "string",
      "estado": "reservada|completada|cancelada"
    }
  ],
  "pagos": [
    {
      "alumno_nombre": "string",
      "monto": number,
      "fecha_pago": "YYYY-MM-DD",
      "fecha_vencimiento": "YYYY-MM-DD",
      "estado": "pendiente|pagado|vencido",
      "mes_correspondiente": "string"
    }
  ]
}

Return ONLY the JSON object, no additional text or explanation.`

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Read Excel file
    const buffer = await file.arrayBuffer()
    const workbook = xlsx.read(buffer, { type: 'buffer' })
    
    // Convert all sheets to JSON
    const sheets: Record<string, unknown[]> = {}
    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName]
      sheets[sheetName] = xlsx.utils.sheet_to_json(sheet)
    })

    // Use Groq to extract structured data
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Groq API key not configured' },
        { status: 503 }
      )
    }

    const groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: JSON.stringify(sheets) },
        ],
        max_tokens: 4000,
        temperature: 0.3,
      }),
    })

    if (!groqRes.ok) {
      return NextResponse.json(
        { error: 'Failed to process Excel with AI' },
        { status: 503 }
      )
    }

    const groqData = await groqRes.json()
    const extractedDataText = groqData?.choices?.[0]?.message?.content ?? ''

    // Parse JSON response
    let extractedData
    try {
      extractedData = JSON.parse(extractedDataText)
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      )
    }

    // Insert data into database
    const results = {
      alumnos: { created: 0, errors: 0 },
      clases: { created: 0, errors: 0 },
      pagos: { created: 0, errors: 0 },
    }

    // Insert alumnos
    if (extractedData.alumnos && Array.isArray(extractedData.alumnos)) {
      for (const alumno of extractedData.alumnos) {
        try {
          await prisma.alumno.create({
            data: {
              nombre: alumno.nombre,
              email: alumno.email,
              telefono: alumno.telefono,
              cumpleanos: alumno.cumpleanos ? new Date(alumno.cumpleanos) : null,
              patologias: alumno.patologias,
              packType: alumno.pack_type,
              clasesPorMes: alumno.clases_por_mes,
              precio: alumno.precio,
            },
          })
          results.alumnos.created++
        } catch (error) {
          console.error('Error creating alumno:', error)
          results.alumnos.errors++
        }
      }
    }

    // Insert clases
    if (extractedData.clases && Array.isArray(extractedData.clases)) {
      for (const clase of extractedData.clases) {
        try {
          // Find alumno by nombre
          const alumno = await prisma.alumno.findFirst({
            where: { nombre: clase.alumno_nombre },
          })

          if (!alumno) {
            results.clases.errors++
            continue
          }

          await prisma.clase.create({
            data: {
              fecha: new Date(clase.fecha),
              horaInicio: clase.hora_inicio,
              alumnoId: alumno.id,
              estado: clase.estado,
              profesorId: request.headers.get('x-user-id') || '',
            },
          })
          results.clases.created++
        } catch (error) {
          console.error('Error creating clase:', error)
          results.clases.errors++
        }
      }
    }

    // Insert pagos
    if (extractedData.pagos && Array.isArray(extractedData.pagos)) {
      for (const pago of extractedData.pagos) {
        try {
          // Find alumno by nombre
          const alumno = await prisma.alumno.findFirst({
            where: { nombre: pago.alumno_nombre },
          })

          if (!alumno) {
            results.pagos.errors++
            continue
          }

          await prisma.pago.create({
            data: {
              alumnoId: alumno.id,
              monto: pago.monto,
              fechaPago: pago.fecha_pago ? new Date(pago.fecha_pago) : null,
              fechaVencimiento: new Date(pago.fecha_vencimiento),
              estado: pago.estado,
              mesCorrespondiente: pago.mes_correspondiente,
              profesorId: request.headers.get('x-user-id') || '',
            },
          })
          results.pagos.created++
        } catch (error) {
          console.error('Error creating pago:', error)
          results.pagos.errors++
        }
      }
    }

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error('Error importing Excel:', error)
    return NextResponse.json(
      { error: 'Failed to import Excel' },
      { status: 500 }
    )
  }
}
