/** Shared domain types for ServSync (jobs, runs, mapping). */

/** One mapped column: a Notion property name → a spreadsheet column letter. */
export type Mapping = {
  /** Notion property name, e.g. "Name", "Status", "Due". */
  from: string
  /** Target column letter, e.g. "A". Assigned by position. */
  to: string
}

export type NotionSource = {
  type: 'notion'
  /** Notion database id (the long id from the database URL). */
  dbId: string
  /** Optional pre-resolved data source id (2025-09 Notion API). */
  dataSourceId?: string
}

export type SheetsTarget = {
  type: 'sheets'
  /** Google Sheet id from the sheet URL. */
  sheetId: string
  /** A1 range incl. tab name, e.g. "Sheet1!A1:C". */
  range: string
}

export type Job = {
  tenantId: string
  jobId: string
  name: string
  source: NotionSource
  target: SheetsTarget
  mapping: Mapping[]
  nextDueAt?: string
}

export type RunStatus = 'RUNNING' | 'SUCCEEDED' | 'FAILED'

export type Run = {
  jobId: string
  runId: string
  status: RunStatus
  stats?: { pulled?: number; transformed?: number; pushed?: number }
  startedAt?: string
  endedAt?: string
  executionArn?: string
  failure?: { error?: string; cause?: string }
}

/**
 * Input passed to the Step Functions execution (by both the API "Run now"
 * route and the scheduler). `runId` is always set so the RUNNING run row can
 * be created up front and later marked SUCCEEDED/FAILED.
 */
export type SyncInput = {
  tenantId: string
  jobId: string
  runId: string
  target: SheetsTarget
  startedAt: string
}
