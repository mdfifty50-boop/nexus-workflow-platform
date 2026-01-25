/**
 * CSV Export Utilities
 *
 * Provides functionality for exporting workflow data, execution history, and stats to CSV format.
 */

import type { Workflow, WorkflowExecution, WorkflowNode } from '../types/database'

/**
 * CSV Export options
 */
export interface CSVExportOptions {
  delimiter?: string
  includeHeaders?: boolean
  filename?: string
  dateFormat?: 'iso' | 'locale' | 'unix'
}

/**
 * Workflow data for CSV export
 */
export interface WorkflowCSVData extends Record<string, unknown> {
  id: string
  name: string
  description: string
  type: string
  status: string
  executionCount: number
  lastExecutedAt: string | null
  createdAt: string
  updatedAt: string
  totalTokensUsed: number
  totalCostUsd: number
}

/**
 * Execution history for CSV export
 */
export interface ExecutionCSVData extends Record<string, unknown> {
  id: string
  workflowId: string
  workflowName: string
  status: string
  startedAt: string | null
  completedAt: string | null
  durationMs: number | null
  tokenUsage: number
  costUsd: number
  errorMessage: string | null
}

/**
 * Stats summary for CSV export
 */
export interface StatsCSVData extends Record<string, unknown> {
  metric: string
  value: string | number
  period: string
  timestamp: string
}

/**
 * Escape a value for CSV format
 */
function escapeCSVValue(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  const stringValue = String(value)

  // If value contains delimiter, quotes, or newlines, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }

  return stringValue
}

/**
 * Format date based on options
 */
function formatDate(date: string | null, format: CSVExportOptions['dateFormat'] = 'iso'): string {
  if (!date) return ''

  const d = new Date(date)

  switch (format) {
    case 'unix':
      return String(d.getTime())
    case 'locale':
      return d.toLocaleString()
    case 'iso':
    default:
      return d.toISOString()
  }
}

/**
 * Convert an array of objects to CSV string
 */
function arrayToCSV<T extends Record<string, unknown>>(
  data: T[],
  headers: (keyof T)[],
  options: CSVExportOptions = {}
): string {
  const { delimiter = ',', includeHeaders = true, dateFormat = 'iso' } = options

  const rows: string[] = []

  // Add header row
  if (includeHeaders) {
    rows.push(headers.map(h => escapeCSVValue(String(h))).join(delimiter))
  }

  // Add data rows
  for (const item of data) {
    const values = headers.map(header => {
      const value = item[header]
      // Check if it's a date string
      if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T/)) {
        return escapeCSVValue(formatDate(value, dateFormat))
      }
      return escapeCSVValue(value)
    })
    rows.push(values.join(delimiter))
  }

  return rows.join('\n')
}

/**
 * Download CSV file
 */
function downloadCSV(content: string, filename: string): void {
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8' }) // BOM for Excel compatibility
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

/**
 * Export workflows to CSV
 */
export function exportWorkflowsToCSV(
  workflows: Workflow[],
  options: CSVExportOptions = {}
): string {
  const data: WorkflowCSVData[] = workflows.map(wf => ({
    id: wf.id,
    name: wf.name,
    description: wf.description || '',
    type: wf.workflow_type,
    status: wf.status,
    executionCount: wf.execution_count,
    lastExecutedAt: wf.last_executed_at,
    createdAt: wf.created_at,
    updatedAt: wf.updated_at,
    totalTokensUsed: wf.total_tokens_used,
    totalCostUsd: wf.total_cost_usd
  }))

  const headers: (keyof WorkflowCSVData)[] = [
    'id',
    'name',
    'description',
    'type',
    'status',
    'executionCount',
    'lastExecutedAt',
    'createdAt',
    'updatedAt',
    'totalTokensUsed',
    'totalCostUsd'
  ]

  return arrayToCSV(data, headers, options)
}

/**
 * Download workflows as CSV file
 */
export function downloadWorkflowsCSV(
  workflows: Workflow[],
  options: CSVExportOptions = {}
): void {
  const csv = exportWorkflowsToCSV(workflows, options)
  const filename = options.filename || `workflows-export-${new Date().toISOString().split('T')[0]}.csv`
  downloadCSV(csv, filename)
}

/**
 * Export execution history to CSV
 */
export function exportExecutionsToCSV(
  executions: (WorkflowExecution & { workflowName?: string })[],
  options: CSVExportOptions = {}
): string {
  const data: ExecutionCSVData[] = executions.map(exec => {
    let durationMs: number | null = null
    if (exec.started_at && exec.completed_at) {
      durationMs = new Date(exec.completed_at).getTime() - new Date(exec.started_at).getTime()
    }

    return {
      id: exec.id,
      workflowId: exec.workflow_id,
      workflowName: exec.workflowName || '',
      status: exec.status,
      startedAt: exec.started_at,
      completedAt: exec.completed_at,
      durationMs,
      tokenUsage: exec.token_usage,
      costUsd: exec.cost_usd,
      errorMessage: exec.error_message
    }
  })

  const headers: (keyof ExecutionCSVData)[] = [
    'id',
    'workflowId',
    'workflowName',
    'status',
    'startedAt',
    'completedAt',
    'durationMs',
    'tokenUsage',
    'costUsd',
    'errorMessage'
  ]

  return arrayToCSV(data, headers, options)
}

/**
 * Download execution history as CSV file
 */
export function downloadExecutionsCSV(
  executions: (WorkflowExecution & { workflowName?: string })[],
  options: CSVExportOptions = {}
): void {
  const csv = exportExecutionsToCSV(executions, options)
  const filename = options.filename || `execution-history-${new Date().toISOString().split('T')[0]}.csv`
  downloadCSV(csv, filename)
}

/**
 * Export workflow nodes to CSV (for debugging/analysis)
 */
export function exportNodesToCSV(
  nodes: WorkflowNode[],
  options: CSVExportOptions = {}
): string {
  const data = nodes.map(node => ({
    id: node.id,
    workflowId: node.workflow_id,
    nodeId: node.node_id,
    nodeType: node.node_type,
    label: node.label,
    status: node.status,
    positionX: node.position_x,
    positionY: node.position_y,
    startedAt: node.started_at,
    completedAt: node.completed_at,
    tokensUsed: node.tokens_used,
    costUsd: node.cost_usd
  }))

  const headers = [
    'id',
    'workflowId',
    'nodeId',
    'nodeType',
    'label',
    'status',
    'positionX',
    'positionY',
    'startedAt',
    'completedAt',
    'tokensUsed',
    'costUsd'
  ] as const

  return arrayToCSV(data, [...headers], options)
}

/**
 * Download workflow nodes as CSV file
 */
export function downloadNodesCSV(
  nodes: WorkflowNode[],
  options: CSVExportOptions = {}
): void {
  const csv = exportNodesToCSV(nodes, options)
  const filename = options.filename || `workflow-nodes-${new Date().toISOString().split('T')[0]}.csv`
  downloadCSV(csv, filename)
}

/**
 * Export stats summary to CSV
 */
export function exportStatsToCSV(
  stats: {
    totalWorkflows: number
    activeWorkflows: number
    totalExecutions: number
    successfulExecutions: number
    failedExecutions: number
    totalTokensUsed: number
    totalCostUsd: number
    averageExecutionTime: number
  },
  period: string = 'all-time',
  options: CSVExportOptions = {}
): string {
  const timestamp = new Date().toISOString()

  const data: StatsCSVData[] = [
    { metric: 'Total Workflows', value: stats.totalWorkflows, period, timestamp },
    { metric: 'Active Workflows', value: stats.activeWorkflows, period, timestamp },
    { metric: 'Total Executions', value: stats.totalExecutions, period, timestamp },
    { metric: 'Successful Executions', value: stats.successfulExecutions, period, timestamp },
    { metric: 'Failed Executions', value: stats.failedExecutions, period, timestamp },
    { metric: 'Success Rate (%)', value: stats.totalExecutions > 0
      ? ((stats.successfulExecutions / stats.totalExecutions) * 100).toFixed(2)
      : '0.00', period, timestamp },
    { metric: 'Total Tokens Used', value: stats.totalTokensUsed, period, timestamp },
    { metric: 'Total Cost (USD)', value: stats.totalCostUsd.toFixed(4), period, timestamp },
    { metric: 'Average Execution Time (ms)', value: stats.averageExecutionTime.toFixed(2), period, timestamp }
  ]

  const headers: (keyof StatsCSVData)[] = ['metric', 'value', 'period', 'timestamp']

  return arrayToCSV(data, headers, options)
}

/**
 * Download stats summary as CSV file
 */
export function downloadStatsCSV(
  stats: {
    totalWorkflows: number
    activeWorkflows: number
    totalExecutions: number
    successfulExecutions: number
    failedExecutions: number
    totalTokensUsed: number
    totalCostUsd: number
    averageExecutionTime: number
  },
  period: string = 'all-time',
  options: CSVExportOptions = {}
): void {
  const csv = exportStatsToCSV(stats, period, options)
  const filename = options.filename || `workflow-stats-${period}-${new Date().toISOString().split('T')[0]}.csv`
  downloadCSV(csv, filename)
}

/**
 * Export custom data to CSV (generic function)
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  headers: (keyof T)[],
  options: CSVExportOptions = {}
): string {
  return arrayToCSV(data, headers, options)
}

/**
 * Download custom data as CSV file (generic function)
 */
export function downloadCSVFile<T extends Record<string, unknown>>(
  data: T[],
  headers: (keyof T)[],
  filename: string,
  options: CSVExportOptions = {}
): void {
  const csv = exportToCSV(data, headers, options)
  downloadCSV(csv, filename)
}
