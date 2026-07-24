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

    // Map to frontend expected format for backward compatibility
    const completeResults = {
      alumnos: {
        created: report.details.alumnos?.created || 0,
        updated: report.details.alumnos?.updated || 0,
        errors: report.details.alumnos?.failed || 0,
        errorDetails: report.details.alumnos?.errors || []
      },
      clases: {
        created: report.details.clases?.created || 0,
        errors: report.details.clases?.failed || 0,
        errorDetails: report.details.clases?.errors || []
      },
      pagos: {
        created: report.details.pagos?.created || 0,
        errors: report.details.pagos?.failed || 0,
        errorDetails: report.details.pagos?.errors || []
      }
    }

    return NextResponse.json({
      success: report.success,
      report: completeResults
    })
  } catch (error) {
    console.error('Error importing Excel:', error)
    
    // Return complete report structure even on error for backward compatibility
    const errorReport = {
      alumnos: {
        created: 0,
        updated: 0,
        errors: 0,
        errorDetails: [error instanceof Error ? error.message : 'Failed to import Excel']
      },
      clases: {
        created: 0,
        errors: 0,
        errorDetails: []
      },
      pagos: {
        created: 0,
        errors: 0,
        errorDetails: []
      }
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to import Excel',
        report: errorReport
      },
      { status: 500 }
    )
  }
}
