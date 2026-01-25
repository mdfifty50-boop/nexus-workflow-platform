/**
 * PDF Report Generation Utilities
 *
 * Provides functionality for generating PDF reports of workflows.
 * Uses html2canvas-style approach for rendering HTML to images and jsPDF for PDF generation.
 *
 * Note: This is a placeholder implementation that provides the structure and types.
 * For full functionality, install: npm install html2canvas jspdf
 */

import type { Workflow, WorkflowExecution, WorkflowNode } from '../types/database'

/**
 * PDF report configuration options
 */
export interface PDFReportOptions {
  title?: string
  author?: string
  orientation?: 'portrait' | 'landscape'
  pageSize?: 'a4' | 'letter' | 'legal'
  includeNodes?: boolean
  includeExecutionHistory?: boolean
  includeStats?: boolean
  includeCharts?: boolean
  headerLogo?: string
  footerText?: string
  theme?: 'light' | 'dark'
}

/**
 * PDF generation result
 */
export interface PDFGenerationResult {
  success: boolean
  filename?: string
  blob?: Blob
  error?: string
}

/**
 * Report data structure
 */
export interface WorkflowReportData {
  workflow: Workflow
  nodes?: WorkflowNode[]
  executions?: WorkflowExecution[]
  stats?: {
    totalExecutions: number
    successRate: number
    averageDuration: number
    totalTokens: number
    totalCost: number
  }
}

/**
 * Page margins in points
 */
interface PageMargins {
  top: number
  right: number
  bottom: number
  left: number
}

/**
 * Default page margins
 */
export const DEFAULT_MARGINS: PageMargins = {
  top: 40,
  right: 40,
  bottom: 40,
  left: 40
}

/**
 * Format date for PDF display
 */
function formatDate(date: string | null): string {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString()
}

/**
 * Format currency for PDF display
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 4
  }).format(amount)
}

/**
 * Generate HTML content for the PDF report
 */
function generateReportHTML(data: WorkflowReportData, options: PDFReportOptions = {}): string {
  const {
    title = `Workflow Report: ${data.workflow.name}`,
    author = 'Nexus Workflow System',
    includeNodes = true,
    includeExecutionHistory = true,
    includeStats = true,
    theme = 'light'
  } = options

  const bgColor = theme === 'dark' ? '#1a1a2e' : '#ffffff'
  const textColor = theme === 'dark' ? '#ffffff' : '#000000'
  const borderColor = theme === 'dark' ? '#333366' : '#e0e0e0'

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background-color: ${bgColor};
          color: ${textColor};
          margin: 0;
          padding: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid ${borderColor};
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .header p {
          margin: 5px 0 0;
          opacity: 0.7;
        }
        .section {
          margin-bottom: 25px;
        }
        .section-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 1px solid ${borderColor};
        }
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
        }
        .info-item {
          padding: 10px;
          background: ${theme === 'dark' ? '#252545' : '#f5f5f5'};
          border-radius: 6px;
        }
        .info-label {
          font-size: 12px;
          opacity: 0.7;
          margin-bottom: 4px;
        }
        .info-value {
          font-size: 14px;
          font-weight: 500;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
        }
        .stat-card {
          padding: 15px;
          background: ${theme === 'dark' ? '#252545' : '#f5f5f5'};
          border-radius: 8px;
          text-align: center;
        }
        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #6366f1;
        }
        .stat-label {
          font-size: 12px;
          opacity: 0.7;
          margin-top: 4px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        th, td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid ${borderColor};
        }
        th {
          background: ${theme === 'dark' ? '#252545' : '#f5f5f5'};
          font-weight: 600;
        }
        .status-badge {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
        }
        .status-completed { background: #22c55e20; color: #22c55e; }
        .status-running { background: #3b82f620; color: #3b82f6; }
        .status-failed { background: #ef444420; color: #ef4444; }
        .status-pending { background: #f59e0b20; color: #f59e0b; }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid ${borderColor};
          text-align: center;
          font-size: 11px;
          opacity: 0.6;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <p>Generated by ${author} on ${new Date().toLocaleString()}</p>
      </div>

      <div class="section">
        <div class="section-title">Workflow Details</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Name</div>
            <div class="info-value">${data.workflow.name}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Type</div>
            <div class="info-value">${data.workflow.workflow_type}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Status</div>
            <div class="info-value"><span class="status-badge status-${data.workflow.status}">${data.workflow.status}</span></div>
          </div>
          <div class="info-item">
            <div class="info-label">Created</div>
            <div class="info-value">${formatDate(data.workflow.created_at)}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Last Executed</div>
            <div class="info-value">${formatDate(data.workflow.last_executed_at)}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Execution Count</div>
            <div class="info-value">${data.workflow.execution_count}</div>
          </div>
        </div>
        ${data.workflow.description ? `
          <div class="info-item" style="margin-top: 15px;">
            <div class="info-label">Description</div>
            <div class="info-value">${data.workflow.description}</div>
          </div>
        ` : ''}
      </div>
  `

  // Stats section
  if (includeStats && data.stats) {
    html += `
      <div class="section">
        <div class="section-title">Performance Statistics</div>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${data.stats.totalExecutions}</div>
            <div class="stat-label">Total Executions</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${data.stats.successRate.toFixed(1)}%</div>
            <div class="stat-label">Success Rate</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${(data.stats.averageDuration / 1000).toFixed(1)}s</div>
            <div class="stat-label">Avg Duration</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${data.stats.totalTokens.toLocaleString()}</div>
            <div class="stat-label">Total Tokens</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${formatCurrency(data.stats.totalCost)}</div>
            <div class="stat-label">Total Cost</div>
          </div>
        </div>
      </div>
    `
  }

  // Nodes section
  if (includeNodes && data.nodes && data.nodes.length > 0) {
    html += `
      <div class="section">
        <div class="section-title">Workflow Nodes (${data.nodes.length})</div>
        <table>
          <thead>
            <tr>
              <th>Label</th>
              <th>Type</th>
              <th>Status</th>
              <th>Tokens</th>
              <th>Cost</th>
            </tr>
          </thead>
          <tbody>
            ${data.nodes.map(node => `
              <tr>
                <td>${node.label}</td>
                <td>${node.node_type}</td>
                <td><span class="status-badge status-${node.status}">${node.status}</span></td>
                <td>${node.tokens_used.toLocaleString()}</td>
                <td>${formatCurrency(node.cost_usd)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `
  }

  // Execution history section
  if (includeExecutionHistory && data.executions && data.executions.length > 0) {
    html += `
      <div class="section">
        <div class="section-title">Recent Executions (${data.executions.length})</div>
        <table>
          <thead>
            <tr>
              <th>Started</th>
              <th>Completed</th>
              <th>Status</th>
              <th>Tokens</th>
              <th>Cost</th>
            </tr>
          </thead>
          <tbody>
            ${data.executions.slice(0, 10).map(exec => `
              <tr>
                <td>${formatDate(exec.started_at)}</td>
                <td>${formatDate(exec.completed_at)}</td>
                <td><span class="status-badge status-${exec.status}">${exec.status}</span></td>
                <td>${exec.token_usage.toLocaleString()}</td>
                <td>${formatCurrency(exec.cost_usd)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `
  }

  html += `
      <div class="footer">
        ${options.footerText || 'Generated by Nexus Workflow Automation Platform'}
      </div>
    </body>
    </html>
  `

  return html
}

/**
 * Generate PDF report for a workflow (placeholder implementation)
 *
 * For full functionality, install html2canvas and jsPDF:
 * npm install html2canvas jspdf
 *
 * Then implement the actual PDF generation using:
 * - html2canvas to render HTML to canvas
 * - jsPDF to generate PDF from canvas
 */
export async function generateWorkflowPDF(
  data: WorkflowReportData,
  options: PDFReportOptions = {}
): Promise<PDFGenerationResult> {
  try {
    const html = generateReportHTML(data, options)

    // Create a temporary container
    const container = document.createElement('div')
    container.innerHTML = html
    container.style.position = 'absolute'
    container.style.left = '-9999px'
    container.style.width = options.orientation === 'landscape' ? '1024px' : '794px'
    document.body.appendChild(container)

    // Placeholder: In a real implementation, we would use html2canvas + jsPDF
    // For now, we'll create an HTML blob that can be converted or printed as PDF

    const blob = new Blob([html], { type: 'text/html' })
    const filename = options.title
      ? `${options.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.html`
      : `workflow-report-${data.workflow.id}.html`

    // Cleanup
    document.body.removeChild(container)

    return {
      success: true,
      filename,
      blob
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error generating PDF'
    }
  }
}

/**
 * Download workflow report as PDF/HTML
 */
export async function downloadWorkflowReport(
  data: WorkflowReportData,
  options: PDFReportOptions = {}
): Promise<void> {
  const result = await generateWorkflowPDF(data, options)

  if (!result.success || !result.blob) {
    throw new Error(result.error || 'Failed to generate report')
  }

  const url = URL.createObjectURL(result.blob)
  const link = document.createElement('a')
  link.href = url
  link.download = result.filename || 'workflow-report.html'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Open workflow report in print preview (for actual PDF printing)
 */
export function printWorkflowReport(
  data: WorkflowReportData,
  options: PDFReportOptions = {}
): void {
  const html = generateReportHTML(data, options)

  // Open in new window for printing
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.print()
    }
  }
}

/**
 * Generate report preview HTML (for embedding in UI)
 */
export function getReportPreviewHTML(
  data: WorkflowReportData,
  options: PDFReportOptions = {}
): string {
  return generateReportHTML(data, options)
}

/**
 * Export multiple workflows to a combined report
 */
export async function generateBatchReport(
  workflows: WorkflowReportData[],
  options: PDFReportOptions = {}
): Promise<PDFGenerationResult> {
  const reports = workflows.map(wf => generateReportHTML(wf, options))

  const combinedHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${options.title || 'Workflow Batch Report'}</title>
      <style>
        .page-break { page-break-after: always; }
      </style>
    </head>
    <body>
      ${reports.map((html, i) => `
        <div class="report-page ${i < reports.length - 1 ? 'page-break' : ''}">
          ${html}
        </div>
      `).join('')}
    </body>
    </html>
  `

  const blob = new Blob([combinedHTML], { type: 'text/html' })
  const filename = options.title
    ? `${options.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.html`
    : `batch-workflow-report-${new Date().toISOString().split('T')[0]}.html`

  return {
    success: true,
    filename,
    blob
  }
}
