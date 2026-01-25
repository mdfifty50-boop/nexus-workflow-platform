/**
 * Workflow Import/Export Utilities
 *
 * Provides functionality to export workflows as JSON and import workflows from JSON files.
 * Supports validation, versioning, and compatibility checking.
 */

// Workflow export format version
export const WORKFLOW_EXPORT_VERSION = '1.0.0'

// Supported import versions
const SUPPORTED_VERSIONS = ['1.0.0']

/**
 * Workflow export format structure
 */
export interface WorkflowExportData {
  version: string
  exportedAt: string
  workflow: {
    id?: string
    name: string
    description: string
    status?: string
    nodes: WorkflowNodeExport[]
    edges: WorkflowEdgeExport[]
    settings?: Record<string, unknown>
    metadata?: Record<string, unknown>
  }
}

export interface WorkflowNodeExport {
  id: string
  type: string
  label: string
  position: { x: number; y: number }
  data: Record<string, unknown>
  config?: Record<string, unknown>
}

export interface WorkflowEdgeExport {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  label?: string
  data?: Record<string, unknown>
}

/**
 * Validation result for imports
 */
export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Export options
 */
export interface ExportOptions {
  includeMetadata?: boolean
  includePositions?: boolean
  prettyPrint?: boolean
  filename?: string
}

/**
 * Import options
 */
export interface ImportOptions {
  generateNewIds?: boolean
  preservePositions?: boolean
  validateSchema?: boolean
}

/**
 * Validates the structure of imported workflow data
 */
function validateWorkflowData(data: unknown): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!data || typeof data !== 'object') {
    errors.push('Invalid data format: expected an object')
    return { valid: false, errors, warnings }
  }

  const workflowData = data as Record<string, unknown>

  // Check version
  if (!workflowData.version) {
    errors.push('Missing version field')
  } else if (!SUPPORTED_VERSIONS.includes(workflowData.version as string)) {
    warnings.push(`Version ${workflowData.version} may not be fully supported. Supported versions: ${SUPPORTED_VERSIONS.join(', ')}`)
  }

  // Check workflow object
  if (!workflowData.workflow || typeof workflowData.workflow !== 'object') {
    errors.push('Missing or invalid workflow field')
    return { valid: false, errors, warnings }
  }

  const workflow = workflowData.workflow as Record<string, unknown>

  // Required fields
  if (!workflow.name || typeof workflow.name !== 'string') {
    errors.push('Missing or invalid workflow name')
  }

  if (!workflow.description) {
    warnings.push('Workflow description is missing')
  }

  // Validate nodes
  if (!Array.isArray(workflow.nodes)) {
    errors.push('Missing or invalid nodes array')
  } else {
    workflow.nodes.forEach((node: unknown, index: number) => {
      if (!node || typeof node !== 'object') {
        errors.push(`Node at index ${index} is invalid`)
        return
      }
      const n = node as Record<string, unknown>
      if (!n.id) errors.push(`Node at index ${index} missing id`)
      if (!n.type) errors.push(`Node at index ${index} missing type`)
      if (!n.position || typeof n.position !== 'object') {
        warnings.push(`Node at index ${index} missing position`)
      }
    })
  }

  // Validate edges
  if (!Array.isArray(workflow.edges)) {
    errors.push('Missing or invalid edges array')
  } else {
    workflow.edges.forEach((edge: unknown, index: number) => {
      if (!edge || typeof edge !== 'object') {
        errors.push(`Edge at index ${index} is invalid`)
        return
      }
      const e = edge as Record<string, unknown>
      if (!e.source) errors.push(`Edge at index ${index} missing source`)
      if (!e.target) errors.push(`Edge at index ${index} missing target`)
    })
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Generate a unique ID for imported items
 */
function generateId(): string {
  return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Export a workflow to JSON format
 */
export function exportWorkflow(
  workflow: {
    id?: string
    name: string
    description: string
    status?: string
    nodes: WorkflowNodeExport[]
    edges: WorkflowEdgeExport[]
    settings?: Record<string, unknown>
    metadata?: Record<string, unknown>
  },
  options: ExportOptions = {}
): string {
  const {
    includeMetadata = true,
    includePositions = true,
    prettyPrint = true
  } = options

  // Process nodes
  const processedNodes = workflow.nodes.map(node => ({
    id: node.id,
    type: node.type,
    label: node.label,
    position: includePositions ? node.position : { x: 0, y: 0 },
    data: node.data,
    ...(node.config && { config: node.config })
  }))

  // Process edges
  const processedEdges = workflow.edges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    ...(edge.sourceHandle && { sourceHandle: edge.sourceHandle }),
    ...(edge.targetHandle && { targetHandle: edge.targetHandle }),
    ...(edge.label && { label: edge.label }),
    ...(edge.data && { data: edge.data })
  }))

  const exportData: WorkflowExportData = {
    version: WORKFLOW_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    workflow: {
      ...(workflow.id && { id: workflow.id }),
      name: workflow.name,
      description: workflow.description,
      ...(workflow.status && { status: workflow.status }),
      nodes: processedNodes,
      edges: processedEdges,
      ...(workflow.settings && { settings: workflow.settings }),
      ...(includeMetadata && workflow.metadata && { metadata: workflow.metadata })
    }
  }

  return prettyPrint
    ? JSON.stringify(exportData, null, 2)
    : JSON.stringify(exportData)
}

/**
 * Download a workflow as a JSON file
 */
export function downloadWorkflow(
  workflow: {
    id?: string
    name: string
    description: string
    status?: string
    nodes: WorkflowNodeExport[]
    edges: WorkflowEdgeExport[]
    settings?: Record<string, unknown>
    metadata?: Record<string, unknown>
  },
  options: ExportOptions = {}
): void {
  const json = exportWorkflow(workflow, options)
  const filename = options.filename || `${workflow.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-workflow.json`

  const blob = new Blob([json], { type: 'application/json' })
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
 * Import a workflow from JSON string
 */
export function importWorkflow(
  jsonString: string,
  options: ImportOptions = {}
): { workflow: WorkflowExportData['workflow']; validation: ValidationResult } {
  const {
    generateNewIds = false,
    preservePositions = true,
    validateSchema = true
  } = options

  let data: unknown

  try {
    data = JSON.parse(jsonString)
  } catch (e) {
    return {
      workflow: {
        name: '',
        description: '',
        nodes: [],
        edges: []
      },
      validation: {
        valid: false,
        errors: ['Invalid JSON format: ' + (e instanceof Error ? e.message : 'Unknown error')],
        warnings: []
      }
    }
  }

  // Validate if requested
  const validation = validateSchema ? validateWorkflowData(data) : { valid: true, errors: [], warnings: [] }

  if (!validation.valid) {
    return {
      workflow: {
        name: '',
        description: '',
        nodes: [],
        edges: []
      },
      validation
    }
  }

  const importedData = data as WorkflowExportData

  // Create ID mapping for new IDs
  const idMapping = new Map<string, string>()

  // Process nodes
  const processedNodes = importedData.workflow.nodes.map(node => {
    const newId = generateNewIds ? generateId() : node.id
    idMapping.set(node.id, newId)

    return {
      ...node,
      id: newId,
      position: preservePositions ? node.position : { x: 0, y: 0 }
    }
  })

  // Process edges with updated IDs
  const processedEdges = importedData.workflow.edges.map(edge => ({
    ...edge,
    id: generateNewIds ? generateId() : edge.id,
    source: idMapping.get(edge.source) || edge.source,
    target: idMapping.get(edge.target) || edge.target
  }))

  return {
    workflow: {
      ...importedData.workflow,
      nodes: processedNodes,
      edges: processedEdges
    },
    validation
  }
}

/**
 * Import a workflow from a File object
 */
export async function importWorkflowFromFile(
  file: File,
  options: ImportOptions = {}
): Promise<{ workflow: WorkflowExportData['workflow']; validation: ValidationResult }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      const content = event.target?.result
      if (typeof content !== 'string') {
        resolve({
          workflow: {
            name: '',
            description: '',
            nodes: [],
            edges: []
          },
          validation: {
            valid: false,
            errors: ['Failed to read file content'],
            warnings: []
          }
        })
        return
      }

      resolve(importWorkflow(content, options))
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsText(file)
  })
}

/**
 * Create a file input and trigger file selection for import
 */
export function triggerWorkflowImport(
  onImport: (result: { workflow: WorkflowExportData['workflow']; validation: ValidationResult }) => void,
  options: ImportOptions = {}
): void {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'

  input.onchange = async (event) => {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (file) {
      try {
        const result = await importWorkflowFromFile(file, options)
        onImport(result)
      } catch (error) {
        onImport({
          workflow: {
            name: '',
            description: '',
            nodes: [],
            edges: []
          },
          validation: {
            valid: false,
            errors: [error instanceof Error ? error.message : 'Unknown import error'],
            warnings: []
          }
        })
      }
    }
  }

  input.click()
}

/**
 * Export multiple workflows as a single archive
 */
export function exportWorkflowBatch(
  workflows: Array<{
    id?: string
    name: string
    description: string
    status?: string
    nodes: WorkflowNodeExport[]
    edges: WorkflowEdgeExport[]
    settings?: Record<string, unknown>
    metadata?: Record<string, unknown>
  }>,
  options: ExportOptions = {}
): string {
  const { prettyPrint = true } = options

  const batchData = {
    version: WORKFLOW_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    count: workflows.length,
    workflows: workflows.map(wf => ({
      ...(wf.id && { id: wf.id }),
      name: wf.name,
      description: wf.description,
      ...(wf.status && { status: wf.status }),
      nodes: wf.nodes,
      edges: wf.edges,
      ...(wf.settings && { settings: wf.settings }),
      ...(wf.metadata && { metadata: wf.metadata })
    }))
  }

  return prettyPrint
    ? JSON.stringify(batchData, null, 2)
    : JSON.stringify(batchData)
}

/**
 * Download multiple workflows as a single JSON file
 */
export function downloadWorkflowBatch(
  workflows: Array<{
    id?: string
    name: string
    description: string
    status?: string
    nodes: WorkflowNodeExport[]
    edges: WorkflowEdgeExport[]
    settings?: Record<string, unknown>
    metadata?: Record<string, unknown>
  }>,
  filename: string = 'workflows-export.json',
  options: ExportOptions = {}
): void {
  const json = exportWorkflowBatch(workflows, options)

  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}
