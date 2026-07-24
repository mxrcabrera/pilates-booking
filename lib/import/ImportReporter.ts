import { ImportExecutorResults } from './ImportExecutor'

export interface ImportReportSummary {
  success: boolean;
  totalCreated: number;
  totalUpdated: number;
  totalSkipped: number;
  totalFailed: number;
  details: ImportExecutorResults;
}

export class ImportReporter {
  public static generateReport(results: ImportExecutorResults): ImportReportSummary {
    let totalCreated = 0
    let totalUpdated = 0
    let totalSkipped = 0
    let totalFailed = 0

    for (const res of Object.values(results)) {
      totalCreated += res.created
      totalUpdated += res.updated
      totalSkipped += res.skipped
      totalFailed += res.failed
    }

    return {
      success: totalFailed === 0 || totalCreated > 0 || totalUpdated > 0,
      totalCreated,
      totalUpdated,
      totalSkipped,
      totalFailed,
      details: results
    }
  }
}
