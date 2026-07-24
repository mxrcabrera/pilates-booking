import { NextRequest, NextResponse } from 'next/server'
import { getUserContext } from '@/lib/auth'
import { unauthorized } from '@/lib/api-utils'
import { ImportPlanner } from '@/lib/import/ImportPlanner'
import { ImportValidator } from '@/lib/import/ImportValidator'
import { ImportExecutor } from '@/lib/import/ImportExecutor'
import { ImportReporter } from '@/lib/import/ImportReporter'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const context = await getUserContext()
    if (!context) {
      return unauthorized()
    }

    const profesorId = context.userId
    const estudioId = context.estudio?.estudioId ?? null

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    const buffer = await file.arrayBuffer()

    // 1. Get mapping plan using AI planner (metadata-only)
    const plan = await ImportPlanner.getPlan(buffer)

    // 2. Validate mapping plan using Zod
    const validatedPlan = ImportValidator.validate(plan)

    // 3. Execute local mapping & database import (row-by-row)
    const results = await ImportExecutor.execute(buffer, validatedPlan, {
      profesorId,
      estudioId
    })

    // 4. Format and return detailed report
    const report = ImportReporter.generateReport(results)

    return NextResponse.json({
      success: report.success,
      report
    })
  } catch (error) {
    console.error('Error importing Excel:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to import Excel' },
      { status: 500 }
    )
  }
}
