/**
 * BulkImport Component
 *
 * Allows importing multiple workflows from a JSON array file.
 * Provides validation preview before import and progress tracking.
 */

import { useState, useCallback, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Progress } from './ui/progress'
import {
  Upload,
  FileJson,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Trash2,
  Eye,
  Import,
  Loader2
} from 'lucide-react'
import { cn } from '../lib/utils'

/**
 * Single workflow import item
 */
interface ImportWorkflowItem {
  id?: string
  name: string
  description?: string
  workflow_type?: 'BMAD' | 'Simple' | 'Scheduled'
  config?: Record<string, unknown>
  nodes?: Array<{
    id: string
    type: string
    label: string
    position: { x: number; y: number }
    data?: Record<string, unknown>
  }>
  edges?: Array<{
    id: string
    source: string
    target: string
    label?: string
  }>
}

/**
 * Validated workflow with status
 */
interface ValidatedWorkflow {
  index: number
  workflow: ImportWorkflowItem
  valid: boolean
  errors: string[]
  warnings: string[]
  selected: boolean
}

/**
 * Bulk import file format
 */
interface BulkImportFile {
  version?: string
  exportedAt?: string
  workflows: ImportWorkflowItem[]
}

/**
 * Import result for a single workflow
 */
interface ImportResult {
  index: number
  name: string
  success: boolean
  error?: string
  workflowId?: string
}

/**
 * Props for BulkImport component
 */
interface BulkImportProps {
  onImport: (workflows: ImportWorkflowItem[]) => Promise<{ success: boolean; error?: string; id?: string }[]>
  onClose?: () => void
  maxItems?: number
}

/**
 * Validate a single workflow item
 */
function validateWorkflow(workflow: unknown, index: number): ValidatedWorkflow {
  const errors: string[] = []
  const warnings: string[] = []

  if (!workflow || typeof workflow !== 'object') {
    return {
      index,
      workflow: { name: `Invalid Item ${index + 1}` },
      valid: false,
      errors: ['Invalid workflow format: expected an object'],
      warnings: [],
      selected: false
    }
  }

  const wf = workflow as Record<string, unknown>

  // Required: name
  if (!wf.name || typeof wf.name !== 'string') {
    errors.push('Missing or invalid workflow name')
  }

  // Optional but recommended: description
  if (!wf.description) {
    warnings.push('No description provided')
  }

  // Validate workflow_type if present
  if (wf.workflow_type && !['BMAD', 'Simple', 'Scheduled'].includes(wf.workflow_type as string)) {
    warnings.push(`Unknown workflow type: ${wf.workflow_type}`)
  }

  // Validate nodes if present
  if (wf.nodes) {
    if (!Array.isArray(wf.nodes)) {
      errors.push('Nodes must be an array')
    } else {
      wf.nodes.forEach((node: unknown, nodeIndex: number) => {
        if (!node || typeof node !== 'object') {
          errors.push(`Node ${nodeIndex} is invalid`)
          return
        }
        const n = node as Record<string, unknown>
        if (!n.id) warnings.push(`Node ${nodeIndex} missing id`)
        if (!n.type) warnings.push(`Node ${nodeIndex} missing type`)
      })
    }
  }

  // Validate edges if present
  if (wf.edges) {
    if (!Array.isArray(wf.edges)) {
      errors.push('Edges must be an array')
    } else {
      wf.edges.forEach((edge: unknown, edgeIndex: number) => {
        if (!edge || typeof edge !== 'object') {
          errors.push(`Edge ${edgeIndex} is invalid`)
          return
        }
        const e = edge as Record<string, unknown>
        if (!e.source) errors.push(`Edge ${edgeIndex} missing source`)
        if (!e.target) errors.push(`Edge ${edgeIndex} missing target`)
      })
    }
  }

  return {
    index,
    workflow: wf as unknown as ImportWorkflowItem,
    valid: errors.length === 0,
    errors,
    warnings,
    selected: errors.length === 0
  }
}

/**
 * Parse and validate bulk import file
 */
function parseBulkImportFile(content: string): {
  workflows: ValidatedWorkflow[]
  fileInfo: { version?: string; exportedAt?: string }
  parseError?: string
} {
  try {
    const data = JSON.parse(content)

    // Check if it's a batch export format
    if (data.workflows && Array.isArray(data.workflows)) {
      const bulkData = data as BulkImportFile
      return {
        workflows: bulkData.workflows.map((wf, i) => validateWorkflow(wf, i)),
        fileInfo: {
          version: bulkData.version,
          exportedAt: bulkData.exportedAt
        }
      }
    }

    // Check if it's a single workflow export
    if (data.workflow && typeof data.workflow === 'object') {
      return {
        workflows: [validateWorkflow(data.workflow, 0)],
        fileInfo: {
          version: data.version,
          exportedAt: data.exportedAt
        }
      }
    }

    // Check if it's a raw array of workflows
    if (Array.isArray(data)) {
      return {
        workflows: data.map((wf, i) => validateWorkflow(wf, i)),
        fileInfo: {}
      }
    }

    // Single workflow object
    if (data.name) {
      return {
        workflows: [validateWorkflow(data, 0)],
        fileInfo: {}
      }
    }

    return {
      workflows: [],
      fileInfo: {},
      parseError: 'Unrecognized file format'
    }
  } catch (e) {
    return {
      workflows: [],
      fileInfo: {},
      parseError: `Invalid JSON: ${e instanceof Error ? e.message : 'Unknown error'}`
    }
  }
}

export function BulkImport({ onImport, onClose, maxItems = 100 }: BulkImportProps) {
  const [dragOver, setDragOver] = useState(false)
  const [workflows, setWorkflows] = useState<ValidatedWorkflow[]>([])
  const [fileInfo, setFileInfo] = useState<{ version?: string; exportedAt?: string }>({})
  const [parseError, setParseError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importResults, setImportResults] = useState<ImportResult[] | null>(null)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    setParseError(null)
    setImportResults(null)

    if (!file.name.endsWith('.json')) {
      setParseError('Please select a JSON file')
      return
    }

    try {
      const content = await file.text()
      const result = parseBulkImportFile(content)

      if (result.parseError) {
        setParseError(result.parseError)
        return
      }

      if (result.workflows.length === 0) {
        setParseError('No workflows found in file')
        return
      }

      if (result.workflows.length > maxItems) {
        setParseError(`File contains ${result.workflows.length} workflows, maximum allowed is ${maxItems}`)
        return
      }

      setWorkflows(result.workflows)
      setFileInfo(result.fileInfo)
    } catch (e) {
      setParseError(`Failed to read file: ${e instanceof Error ? e.message : 'Unknown error'}`)
    }
  }, [maxItems])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFile(file)
    }
  }, [handleFile])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }, [handleFile])

  const toggleWorkflowSelection = useCallback((index: number) => {
    setWorkflows(prev => prev.map((wf, i) =>
      i === index ? { ...wf, selected: !wf.selected } : wf
    ))
  }, [])

  const selectAll = useCallback(() => {
    setWorkflows(prev => prev.map(wf => ({ ...wf, selected: wf.valid })))
  }, [])

  const deselectAll = useCallback(() => {
    setWorkflows(prev => prev.map(wf => ({ ...wf, selected: false })))
  }, [])

  const removeWorkflow = useCallback((index: number) => {
    setWorkflows(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleImport = useCallback(async () => {
    const selectedWorkflows = workflows.filter(wf => wf.selected && wf.valid)
    if (selectedWorkflows.length === 0) return

    setImporting(true)
    setImportProgress(0)
    setImportResults(null)

    try {
      const results = await onImport(selectedWorkflows.map(wf => wf.workflow))

      const importResults: ImportResult[] = selectedWorkflows.map((wf, i) => ({
        index: wf.index,
        name: wf.workflow.name,
        success: results[i]?.success ?? false,
        error: results[i]?.error,
        workflowId: results[i]?.id
      }))

      setImportResults(importResults)
      setImportProgress(100)
    } catch (e) {
      setParseError(`Import failed: ${e instanceof Error ? e.message : 'Unknown error'}`)
    } finally {
      setImporting(false)
    }
  }, [workflows, onImport])

  const reset = useCallback(() => {
    setWorkflows([])
    setFileInfo({})
    setParseError(null)
    setImportResults(null)
    setImportProgress(0)
    setPreviewIndex(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const selectedCount = workflows.filter(wf => wf.selected).length
  const validCount = workflows.filter(wf => wf.valid).length
  const totalWarnings = workflows.reduce((sum, wf) => sum + wf.warnings.length, 0)

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Import className="h-5 w-5" />
          Bulk Import Workflows
        </CardTitle>
        <CardDescription>
          Import multiple workflows from a JSON file. Supports batch exports and workflow arrays.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Drop Zone */}
        {workflows.length === 0 && !importResults && (
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
              dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
              'cursor-pointer hover:border-primary/50'
            )}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">Drop JSON file here or click to browse</p>
            <p className="text-sm text-muted-foreground">
              Supports batch exports, workflow arrays, or single workflow files
            </p>
          </div>
        )}

        {/* Parse Error */}
        {parseError && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
            <XCircle className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Error</p>
              <p className="text-sm text-muted-foreground">{parseError}</p>
            </div>
          </div>
        )}

        {/* File Info */}
        {workflows.length > 0 && !importResults && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileJson className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">{workflows.length} workflows found</p>
                  <p className="text-sm text-muted-foreground">
                    {validCount} valid, {workflows.length - validCount} with errors
                    {totalWarnings > 0 && `, ${totalWarnings} warnings`}
                    {fileInfo.exportedAt && ` | Exported: ${new Date(fileInfo.exportedAt).toLocaleString()}`}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Select All Valid
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAll}>
                  Deselect All
                </Button>
                <Button variant="ghost" size="sm" onClick={reset}>
                  Clear
                </Button>
              </div>
            </div>

            {/* Workflow List */}
            <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
              {workflows.map((wf, index) => (
                <div
                  key={index}
                  className={cn(
                    'p-3 flex items-center gap-3',
                    !wf.valid && 'bg-destructive/5',
                    wf.selected && wf.valid && 'bg-primary/5'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={wf.selected}
                    disabled={!wf.valid}
                    onChange={() => toggleWorkflowSelection(index)}
                    className="h-4 w-4"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {wf.valid ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                      )}
                      <span className="font-medium truncate">{wf.workflow.name}</span>
                      {wf.workflow.workflow_type && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">
                          {wf.workflow.workflow_type}
                        </span>
                      )}
                      {wf.warnings.length > 0 && (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    {wf.errors.length > 0 && (
                      <p className="text-xs text-destructive mt-1">
                        {wf.errors.join(', ')}
                      </p>
                    )}
                    {wf.workflow.description && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {wf.workflow.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setPreviewIndex(previewIndex === index ? null : index)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeWorkflow(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Preview Panel */}
            {previewIndex !== null && workflows[previewIndex] && (
              <div className="border rounded-lg p-4 bg-muted/30">
                <h4 className="font-medium mb-2">Preview: {workflows[previewIndex].workflow.name}</h4>
                <pre className="text-xs overflow-auto max-h-48 bg-background p-3 rounded">
                  {JSON.stringify(workflows[previewIndex].workflow, null, 2)}
                </pre>
              </div>
            )}

            {/* Import Actions */}
            <div className="flex justify-between items-center pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {selectedCount} of {validCount} valid workflows selected for import
              </p>
              <div className="flex gap-2">
                {onClose && (
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                )}
                <Button
                  onClick={handleImport}
                  disabled={selectedCount === 0 || importing}
                >
                  {importing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Import className="h-4 w-4 mr-2" />
                      Import {selectedCount} Workflow{selectedCount !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Import Progress */}
        {importing && (
          <div className="space-y-2">
            <Progress value={importProgress} />
            <p className="text-sm text-center text-muted-foreground">
              Importing workflows...
            </p>
          </div>
        )}

        {/* Import Results */}
        {importResults && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Import Results</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={reset}>
                  Import More
                </Button>
                {onClose && (
                  <Button size="sm" onClick={onClose}>
                    Done
                  </Button>
                )}
              </div>
            </div>

            <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
              {importResults.map((result, index) => (
                <div key={index} className="p-3 flex items-center gap-3">
                  {result.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{result.name}</p>
                    {result.error && (
                      <p className="text-xs text-destructive">{result.error}</p>
                    )}
                  </div>
                  {result.success && (
                    <span className="text-xs text-muted-foreground">
                      Imported successfully
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="text-center text-sm text-muted-foreground">
              {importResults.filter(r => r.success).length} of {importResults.length} workflows imported successfully
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default BulkImport
