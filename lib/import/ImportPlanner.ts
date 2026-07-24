import * as xlsx from 'xlsx'

export interface SheetMetadata {
  sheetName: string;
  headers: string[];
  rowCount: number;
  sampleRow?: Record<string, unknown>;
}

export interface ImportPlan {
  entities: {
    sheet: string;
    entity: 'Alumno' | 'Clase' | 'Pago' | 'unknown';
    confidence: number;
    columnMap: Record<string, string>;
  }[];
  insertionOrder: ('Alumno' | 'Clase' | 'Pago')[];
}

export class ImportPlanner {
  private static GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

  public static async getPlan(fileBuffer: ArrayBuffer): Promise<ImportPlan> {
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' })
    const metadata = this.extractMetadata(workbook)

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      throw new Error('Groq API key not configured')
    }

    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'

    const systemPrompt = `You are a data mapping assistant for a Pilates Booking system.
Your job is to analyze the metadata of an uploaded Excel workbook and generate an Import Plan to map its columns to our database schema.

We support three main entities to import:
1. "Alumno" (students):
   - "nombre" (string, required)
   - "email" (string)
   - "telefono" (string)
   - "cumpleanos" (date, YYYY-MM-DD)
   - "patologias" (string)
   - "pack_type" (string)
   - "clases_por_mes" (number)
   - "precio" (number)
2. "Clase" (classes):
   - "fecha" (date, YYYY-MM-DD, required)
   - "hora_inicio" (string, HH:mm, required)
   - "alumno_nombre" (string, required - will be used to look up Alumno's ID)
   - "estado" (string: "reservada" | "completada" | "cancelada")
3. "Pago" (payments):
   - "alumno_nombre" (string, required - will be used to look up Alumno's ID)
   - "monto" (number, required)
   - "fecha_pago" (date, YYYY-MM-DD)
   - "fecha_vencimiento" (date, YYYY-MM-DD, required)
   - "estado" (string: "pendiente" | "pagado" | "vencido")
   - "mes_correspondiente" (string, e.g. "Julio", "August 2026")

You must map the columns from the Excel sheets to these entity fields. 
For each sheet in the workbook, decide which entity it represents ("Alumno", "Clase", "Pago", or "unknown" if it does not fit).
Include a confidence score (number between 0 and 1) for the overall mapping of that sheet.
Map the Excel headers to our entity keys in the "columnMap" object.

Return ONLY a JSON object matching the following structure:
{
  "entities": [
    {
      "sheet": "SheetName",
      "entity": "Alumno" | "Clase" | "Pago" | "unknown",
      "confidence": 0.98,
      "columnMap": {
        "Excel Header 1": "schema_field_name",
        "Excel Header 2": "schema_field_name"
      }
    }
  ],
  "insertionOrder": ["Alumno", "Clase", "Pago"]
}

Do not include any markdown format tags (like \`\`\`json) or extra text. Just the raw JSON.`

    const userPrompt = JSON.stringify({ workbookStructure: metadata })

    const res = await fetch(this.GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1,
      }),
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Groq API error generating plan: ${res.status} ${res.statusText}. Details: ${errorText}`)
    }

    const data = await res.json()
    const content = data?.choices?.[0]?.message?.content ?? ''
    
    // Clean up content just in case the model returns markdown blocks
    const cleanedContent = content.trim().replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()

    try {
      return JSON.parse(cleanedContent) as ImportPlan
    } catch (e) {
      console.error('Failed to parse Groq response:', cleanedContent)
      throw new Error('Failed to parse AI response into Import Plan: ' + (e instanceof Error ? e.message : 'Invalid JSON'))
    }
  }

  private static extractMetadata(workbook: xlsx.WorkBook): SheetMetadata[] {
    const list: SheetMetadata[] = []

    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName]
      
      // Get all rows as arrays to preserve order and extract headers/sample
      const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null })
      const rawRows = xlsx.utils.sheet_to_json<unknown[]>(sheet, { header: 1 })

      const rowCount = rows.length
      const headers: string[] = []
      
      if (rawRows.length > 0) {
        // First row contains the header names
        const firstRow = rawRows[0]
        if (Array.isArray(firstRow)) {
          firstRow.forEach((h, index) => {
            if (h !== undefined && h !== null) {
              headers.push(String(h).trim())
            } else {
              headers.push(`Column_${index + 1}`)
            }
          })
        }
      }

      // Heuristic: Do headers look generic/ambiguous?
      // e.g. single-letter headers (A, B, C) or Column_1, Column_2, or empty list of headers
      const hasGenericHeaders = headers.length === 0 || headers.some(h => {
        const trimmed = h.trim()
        return trimmed.length <= 1 || /^Column_\d+$/i.test(trimmed) || /^__EMPTY/i.test(trimmed)
      })

      let sampleRow: Record<string, unknown> | undefined = undefined
      if (hasGenericHeaders && rows.length > 0) {
        // Find the first row that actually has data (i.e. not all nulls)
        const nonNullRow = rows.find(r => {
          return Object.values(r).some(v => v !== null && v !== undefined && String(v).trim() !== '')
        })
        if (nonNullRow) {
          // Clean the sample row keys to match headers
          sampleRow = {}
          for (const [key, val] of Object.entries(nonNullRow)) {
            if (val !== null && val !== undefined && String(val).trim() !== '') {
              sampleRow[key.trim()] = typeof val === 'string' ? val.trim() : val
            }
          }
        }
      }

      list.push({
        sheetName,
        headers,
        rowCount,
        sampleRow
      })
    })

    return list
  }
}
