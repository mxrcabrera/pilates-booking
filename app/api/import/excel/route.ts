import { NextRequest, NextResponse } from 'next/server'
import { getUserContext } from '@/lib/auth'
import { unauthorized } from '@/lib/api-utils'
import { ImportPlanner } from '@/lib/import/ImportPlanner'
import { ImportValidator } from '@/lib/import/ImportValidator'
import { ImportExecutor } from '@/lib/import/ImportExecutor'
import { ImportReporter } from '@/lib/import/ImportReporter'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  console.log('[API Route] Request received')
  try {
    const context = await getUserContext()
    if (!context) {
      console.log('[API Route] Unauthorized - no context')
      return unauthorized()
    }

    const profesorId = context.userId
    const estudioId = context.estudio?.estudioId ?? null
    console.log('[API Route] Context obtained - profesorId:', profesorId, 'estudioId:', estudioId)

    const formData = await request.formData()
    console.log('[API Route] Multipart parsed')
    const file = formData.get('file') as File

    if (!file) {
      console.log('[API Route] No file provided')
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    console.log('[API Route] File read:', file.name)
    const buffer = await file.arrayBuffer()

    // 1. Get mapping plan using AI planner (metadata-only)
    console.log('[API Route] Planner started')
    const plan = await ImportPlanner.getPlan(buffer)
    console.log('[API Route] Planner finished')

    // 2. Validate mapping plan using Zod
    console.log('[API Route] Validator started')
    const validatedPlan = ImportValidator.validate(plan)
    console.log('[API Route] Validator finished')

    // 3. Execute local mapping & database import (row-by-row)
    console.log('[API Route] Executor started')
    const results = await ImportExecutor.execute(buffer, validatedPlan, {
      profesorId,
      estudioId
    })
    console.log('[API Route] Executor finished')

    // 4. Format and return detailed report
    console.log('[API Route] Reporter started')
    const report = ImportReporter.generateReport(results)
    console.log('[API Route] Reporter finished')

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

    console.log('[API Route] Response returned')
    return NextResponse.json({
      success: report.success,
      report: completeResults
    })
  } catch (error) {
    console.error('[API Route] Error:', error)
    
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
