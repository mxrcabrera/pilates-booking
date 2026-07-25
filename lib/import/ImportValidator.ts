import { z } from 'zod'
import { ImportPlan } from './ImportPlanner'

const entityTypeSchema = z.enum(['Alumno', 'Clase', 'Pago', 'unknown'])

const entityPlanSchema = z.object({
  sheet: z.string(),
  entity: entityTypeSchema,
  confidence: z.number().min(0).max(1),
  columnMap: z.record(z.string(), z.string())
})

const importPlanSchema = z.object({
  entities: z.array(entityPlanSchema),
  insertionOrder: z.array(z.enum(['Alumno', 'Clase', 'Pago']))
})

export class ImportValidator {
  public static validate(plan: unknown): ImportPlan {
    console.log('[ImportValidator] Validation started')
    const parsed = importPlanSchema.parse(plan)
    console.log('[ImportValidator] Schema parsed successfully')

    // Ensure we have at least one valid entity to import
    const hasValidEntity = parsed.entities.some(item => item.entity !== 'unknown')
    if (!hasValidEntity) {
      console.log('[ImportValidator] Validation failed - no valid entities')
      throw new Error('No sheets could be recognized as a valid Pilates entity (Alumno, Clase, Pago).')
    }

    console.log('[ImportValidator] Validation succeeded')
    return parsed as ImportPlan
  }
}
