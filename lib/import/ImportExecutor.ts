import * as xlsx from 'xlsx'
import { prisma } from '@/lib/prisma'
import { ImportPlan } from './ImportPlanner'

export interface RowResult {
  sheetName: string;
  entity: string;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: string[];
}

export type ImportExecutorResults = Record<string, RowResult>

export class ImportExecutor {
  public static async execute(
    fileBuffer: ArrayBuffer,
    plan: ImportPlan,
    context: { profesorId: string; estudioId?: string | null }
  ): Promise<ImportExecutorResults> {
    const workbook = xlsx.read(fileBuffer, { type: 'buffer', cellDates: true })

    const results: ImportExecutorResults = {}
    
    // Initialize results structure
    for (const item of plan.entities) {
      if (item.entity !== 'unknown') {
        results[item.entity] = {
          sheetName: item.sheet,
          entity: item.entity,
          created: 0,
          updated: 0,
          skipped: 0,
          failed: 0,
          errors: []
        }
      }
    }

    // Load existing Alumnos into memory for caching/deduplication
    const emailMap = new Map<string, string>() // email -> id
    const phoneMap = new Map<string, string>() // phone -> id
    const nameMap = new Map<string, string>()   // normalizedName -> id

    const existingAlumnos = await prisma.alumno.findMany({
      where: {
        deletedAt: null,
        OR: [
          context.profesorId ? { profesorId: context.profesorId } : {},
          context.estudioId ? { estudioId: context.estudioId } : {}
        ]
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        telefono: true
      }
    })

    const normalize = (name: string): string => {
      return name
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/\s+/g, ' ')            // Normalize multiple spaces
    }

    existingAlumnos.forEach(al => {
      if (al.email) {
        emailMap.set(al.email.trim().toLowerCase(), al.id)
      }
      if (al.telefono) {
        // Clean phone number from whitespace/dashes for better matching
        const cleanPhone = al.telefono.replace(/[\s-]/g, '')
        if (cleanPhone) phoneMap.set(cleanPhone, al.id)
      }
      if (al.nombre) {
        nameMap.set(normalize(al.nombre), al.id)
      }
    })

    // Process entities in insertion order
    for (const entityName of plan.insertionOrder) {
      const entityPlan = plan.entities.find(e => e.entity === entityName)
      if (!entityPlan) continue

      const sheet = workbook.Sheets[entityPlan.sheet]
      if (!sheet) {
        const res = results[entityName]
        if (res) {
          res.failed++
          res.errors.push(`Sheet "${entityPlan.sheet}" not found in workbook.`)
        }
        continue
      }

      // Convert sheet to json rows
      const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null })
      const columnMap = entityPlan.columnMap
      const res = results[entityName]
      if (!res) continue

      let rowNum = 1 // Track row number for error logging (row 1 is usually header)
      for (const rawRow of rows) {
        rowNum++
        
        // Skip completely empty rows
        const hasValues = Object.values(rawRow).some(v => v !== null && v !== undefined && String(v).trim() !== '')
        if (!hasValues) {
          res.skipped++
          continue
        }

        try {
          // Map rawRow keys using columnMap
          const mappedData: Record<string, unknown> = {}
          for (const [excelCol, schemaField] of Object.entries(columnMap)) {
            // Find key case-insensitively
            const foundKey = Object.keys(rawRow).find(k => k.trim().toLowerCase() === excelCol.trim().toLowerCase())
            if (foundKey) {
              mappedData[schemaField] = rawRow[foundKey]
            }
          }

          if (entityName === 'Alumno') {
            await this.processAlumnoRow(mappedData, context, emailMap, phoneMap, nameMap, normalize, res, rowNum)
          } else if (entityName === 'Clase') {
            await this.processClaseRow(mappedData, context, nameMap, normalize, res, rowNum)
          } else if (entityName === 'Pago') {
            await this.processPagoRow(mappedData, context, nameMap, normalize, res, rowNum)
          }
        } catch (error) {
          res.failed++
          res.errors.push(`Row ${rowNum}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    }

    return results
  }

  private static async processAlumnoRow(
    data: Record<string, unknown>,
    context: { profesorId: string; estudioId?: string | null },
    emailMap: Map<string, string>,
    phoneMap: Map<string, string>,
    nameMap: Map<string, string>,
    normalize: (name: string) => string,
    res: RowResult,
    rowNum: number
  ) {
    const rawNombre = data['nombre'] ? String(data['nombre']).trim() : ''
    if (!rawNombre) {
      throw new Error('Missing student name ("nombre")')
    }

    const email = data['email'] ? String(data['email']).trim().toLowerCase() : ''
    const rawTelefono = data['telefono'] ? String(data['telefono']).trim() : ''
    const cleanTelefono = rawTelefono.replace(/[\s-]/g, '')
    const normalizedName = normalize(rawNombre)

    // Try to match existing student
    let existingId: string | undefined = undefined
    if (email) {
      existingId = emailMap.get(email)
    }
    if (!existingId && cleanTelefono) {
      existingId = phoneMap.get(cleanTelefono)
    }
    if (!existingId) {
      existingId = nameMap.get(normalizedName)
    }

    const cumpleanos = this.parseDate(data['cumpleanos'])
    const patologias = data['patologias'] ? String(data['patologias']).trim() : null
    const packType = data['pack_type'] ? String(data['pack_type']).trim() : 'Fijo'
    const clasesPorMes = this.parseNumber(data['clases_por_mes'])
    const precio = this.parseNumber(data['precio']) || 0

    if (existingId) {
      // Update
      await prisma.alumno.update({
        where: { id: existingId },
        data: {
          email: email || undefined,
          telefono: rawTelefono || undefined,
          cumpleanos,
          patologias,
          packType,
          clasesPorMes,
          precio,
        }
      })

      // Update in-memory maps
      if (email) emailMap.set(email, existingId)
      if (cleanTelefono) phoneMap.set(cleanTelefono, existingId)
      nameMap.set(normalizedName, existingId)

      res.updated++
    } else {
      // Create
      const created = await prisma.alumno.create({
        data: {
          profesorId: context.profesorId || null,
          estudioId: context.estudioId || null,
          nombre: rawNombre,
          email: email || `${normalizedName.replace(/\s+/g, '.')}@noemail.com`,
          telefono: rawTelefono || '0000000000',
          cumpleanos,
          patologias,
          packType,
          clasesPorMes,
          precio,
        }
      })

      // Add to maps
      if (created.email) emailMap.set(created.email.trim().toLowerCase(), created.id)
      if (created.telefono) {
        const cleanT = created.telefono.replace(/[\s-]/g, '')
        if (cleanT) phoneMap.set(cleanT, created.id)
      }
      nameMap.set(normalizedName, created.id)

      res.created++
    }
  }

  private static async processClaseRow(
    data: Record<string, unknown>,
    context: { profesorId: string; estudioId?: string | null },
    nameMap: Map<string, string>,
    normalize: (name: string) => string,
    res: RowResult,
    rowNum: number
  ) {
    const rawAlumnoNombre = data['alumno_nombre'] ? String(data['alumno_nombre']).trim() : ''
    if (!rawAlumnoNombre) {
      throw new Error('Missing student name ("alumno_nombre") in class record')
    }

    const normalizedName = normalize(rawAlumnoNombre)
    const alumnoId = nameMap.get(normalizedName)
    if (!alumnoId) {
      throw new Error(`Student "${rawAlumnoNombre}" not found in current run or database. Ensure Alumnos are imported first or already exist.`)
    }

    const fecha = this.parseDate(data['fecha'])
    if (!fecha) {
      throw new Error('Missing or invalid date ("fecha") for class')
    }

    const horaInicio = data['hora_inicio'] ? String(data['hora_inicio']).trim() : ''
    if (!horaInicio) {
      throw new Error('Missing start time ("hora_inicio") for class')
    }

    // Parse state
    let estado: 'reservada' | 'completada' | 'cancelada' = 'reservada'
    const rawEstado = data['estado'] ? String(data['estado']).trim().toLowerCase() : ''
    if (rawEstado === 'completada' || rawEstado === 'completado') {
      estado = 'completada'
    } else if (rawEstado === 'cancelada' || rawEstado === 'cancelado') {
      estado = 'cancelada'
    }

    await prisma.clase.create({
      data: {
        profesorId: context.profesorId || '',
        estudioId: context.estudioId || null,
        alumnoId,
        fecha,
        horaInicio,
        estado,
      }
    })

    res.created++
  }

  private static async processPagoRow(
    data: Record<string, unknown>,
    context: { profesorId: string; estudioId?: string | null },
    nameMap: Map<string, string>,
    normalize: (name: string) => string,
    res: RowResult,
    rowNum: number
  ) {
    const rawAlumnoNombre = data['alumno_nombre'] ? String(data['alumno_nombre']).trim() : ''
    if (!rawAlumnoNombre) {
      throw new Error('Missing student name ("alumno_nombre") in payment record')
    }

    const normalizedName = normalize(rawAlumnoNombre)
    const alumnoId = nameMap.get(normalizedName)
    if (!alumnoId) {
      throw new Error(`Student "${rawAlumnoNombre}" not found in current run or database. Ensure Alumnos are imported first or already exist.`)
    }

    const monto = this.parseNumber(data['monto'])
    if (monto === null) {
      throw new Error('Missing or invalid amount ("monto") for payment')
    }

    const fechaPago = this.parseDate(data['fecha_pago'])
    const fechaVencimiento = this.parseDate(data['fecha_vencimiento'])
    if (!fechaVencimiento) {
      throw new Error('Missing or invalid due date ("fecha_vencimiento") for payment')
    }

    let estado: 'pendiente' | 'pagado' | 'vencido' = 'pendiente'
    const rawEstado = data['estado'] ? String(data['estado']).trim().toLowerCase() : ''
    if (rawEstado === 'pagado') {
      estado = 'pagado'
    } else if (rawEstado === 'vencido') {
      estado = 'vencido'
    }

    const mesCorrespondiente = data['mes_correspondiente'] ? String(data['mes_correspondiente']).trim() : new Date().toLocaleString('es-ES', { month: 'long' })

    await prisma.pago.create({
      data: {
        alumnoId,
        profesorId: context.profesorId || '',
        estudioId: context.estudioId || null,
        monto,
        fechaPago,
        fechaVencimiento,
        estado,
        mesCorrespondiente,
      }
    })

    res.created++
  }

  private static parseDate(val: unknown): Date | null {
    if (val === undefined || val === null || val === '') return null

    if (val instanceof Date) {
      return val
    }

    // Try numeric Excel date parse
    if (typeof val === 'number') {
      // Excel base date is Dec 30, 1899 due to leap year bug in Lotus 1-2-3
      const excelEpoch = new Date(1899, 11, 30)
      const days = Math.floor(val)
      const milliseconds = Math.round((val - days) * 24 * 60 * 60 * 1000)
      const d = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000 + milliseconds)
      return isNaN(d.getTime()) ? null : d
    }

    const str = String(val).trim()
    if (!str) return null

    // Try native ISO / Date.parse
    const timestamp = Date.parse(str)
    if (!isNaN(timestamp)) {
      return new Date(timestamp)
    }

    // Try parsing DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10)
      const month = parseInt(dmyMatch[2], 10) - 1
      const year = parseInt(dmyMatch[3], 10)
      const d = new Date(year, month, day)
      if (!isNaN(d.getTime())) return d
    }

    // Try parsing YYYY/MM/DD or YYYY-MM-DD
    const ymdMatch = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/)
    if (ymdMatch) {
      const year = parseInt(ymdMatch[1], 10)
      const month = parseInt(ymdMatch[2], 10) - 1
      const day = parseInt(ymdMatch[3], 10)
      const d = new Date(year, month, day)
      if (!isNaN(d.getTime())) return d
    }

    return null
  }

  private static parseNumber(val: unknown): number | null {
    if (val === undefined || val === null || val === '') return null
    if (typeof val === 'number') return val

    const str = String(val).trim()
      .replace(/[$\s]/g, '') // remove currency symbols and spaces
      .replace(/\./g, '')    // remove dots as thousands separators
      .replace(/,/g, '.')    // replace comma with dot for decimals (Spanish style)
    
    const parsed = parseFloat(str)
    return isNaN(parsed) ? null : parsed
  }
}
