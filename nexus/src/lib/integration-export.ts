/**
 * Integration Export Utilities
 *
 * Provides functionality for exporting workflows to other automation platform formats.
 * Supports n8n, Zapier, and other common workflow automation formats.
 */

import type { WorkflowNodeExport, WorkflowEdgeExport } from './workflow-io'

/**
 * Export format types
 */
export type ExportFormat = 'n8n' | 'zapier' | 'make' | 'generic'

/**
 * Export options
 */
export interface IntegrationExportOptions {
  format: ExportFormat
  includeCredentials?: boolean
  includeMetadata?: boolean
  prettyPrint?: boolean
  filename?: string
}

/**
 * Export result
 */
export interface IntegrationExportResult {
  success: boolean
  format: ExportFormat
  data?: string
  blob?: Blob
  filename?: string
  error?: string
  warnings?: string[]
}

/**
 * n8n workflow format
 */
interface N8nWorkflow {
  name: string
  nodes: N8nNode[]
  connections: Record<string, N8nConnection>
  active: boolean
  settings: {
    executionOrder: string
    saveDataErrorExecution?: string
    saveDataSuccessExecution?: string
    saveExecutionProgress?: boolean
    saveManualExecutions?: boolean
    timezone?: string
  }
  versionId?: string
  id?: string
  meta?: {
    instanceId?: string
    templateId?: string
    templateCredsSetupCompleted?: boolean
  }
  tags?: string[]
  pinData?: Record<string, unknown>
}

interface N8nNode {
  id: string
  name: string
  type: string
  typeVersion: number
  position: [number, number]
  parameters: Record<string, unknown>
  credentials?: Record<string, { id: string; name: string }>
  disabled?: boolean
  notesInFlow?: boolean
  notes?: string
}

interface N8nConnection {
  main: Array<Array<{ node: string; type: string; index: number }>>
}

/**
 * Zapier Zap format (simplified)
 */
interface ZapierZap {
  name: string
  description: string
  steps: ZapierStep[]
  state: 'on' | 'off' | 'draft'
  folder?: string
  tags?: string[]
}

interface ZapierStep {
  id: string
  position: number
  app: string
  action: string
  params: Record<string, unknown>
  filter?: {
    field: string
    operator: string
    value: unknown
  }
}

/**
 * Make (Integromat) scenario format (simplified)
 */
interface MakeScenario {
  name: string
  description: string
  blueprint: {
    version: number
    flow: MakeModule[]
    scheduling?: {
      interval: number
      unit: 'minutes' | 'hours' | 'days'
    }
  }
  state: 'active' | 'inactive' | 'draft'
}

interface MakeModule {
  id: number
  module: string
  version: number
  parameters: Record<string, unknown>
  mapper?: Record<string, unknown>
  metadata?: {
    designer?: { x: number; y: number }
  }
  routes?: MakeModule[][]
}

/**
 * Generic workflow format (for custom integrations)
 */
interface GenericWorkflow {
  version: string
  format: 'generic'
  exportedAt: string
  workflow: {
    id?: string
    name: string
    description: string
    status: string
    nodes: Array<{
      id: string
      type: string
      name: string
      position: { x: number; y: number }
      config: Record<string, unknown>
      inputs: string[]
      outputs: string[]
    }>
    connections: Array<{
      from: { nodeId: string; port?: string }
      to: { nodeId: string; port?: string }
    }>
    triggers: Array<{
      type: string
      config: Record<string, unknown>
    }>
    metadata: Record<string, unknown>
  }
}

/**
 * Map internal node types to n8n node types
 */
function mapToN8nNodeType(type: string): string {
  const typeMap: Record<string, string> = {
    trigger: 'n8n-nodes-base.manualTrigger',
    agent: 'n8n-nodes-base.function',
    integration: 'n8n-nodes-base.httpRequest',
    condition: 'n8n-nodes-base.if',
    transform: 'n8n-nodes-base.set',
    webhook: 'n8n-nodes-base.webhook',
    schedule: 'n8n-nodes-base.scheduleTrigger',
    email: 'n8n-nodes-base.emailSend',
    database: 'n8n-nodes-base.postgres',
    api: 'n8n-nodes-base.httpRequest'
  }

  return typeMap[type.toLowerCase()] || 'n8n-nodes-base.noOp'
}

/**
 * Map internal node types to Zapier app names
 */
function mapToZapierApp(type: string): string {
  const appMap: Record<string, string> = {
    trigger: 'zapier',
    agent: 'code',
    integration: 'webhooks',
    condition: 'filter',
    transform: 'formatter',
    webhook: 'webhooks',
    schedule: 'schedule',
    email: 'gmail',
    database: 'postgresql',
    api: 'webhooks'
  }

  return appMap[type.toLowerCase()] || 'code'
}

/**
 * Map internal node types to Make module names
 */
function mapToMakeModule(type: string): string {
  const moduleMap: Record<string, string> = {
    trigger: 'builtin:BasicTrigger',
    agent: 'builtin:BasicFeeder',
    integration: 'http:ActionSendRequest',
    condition: 'builtin:BasicRouter',
    transform: 'builtin:BasicAggregator',
    webhook: 'http:CustomWebhook',
    schedule: 'builtin:ScheduleTrigger',
    email: 'google-gmail:gmail:send',
    database: 'postgresql:executeSql',
    api: 'http:ActionSendRequest'
  }

  return moduleMap[type.toLowerCase()] || 'builtin:BasicFeeder'
}

/**
 * Export workflow to n8n format
 */
export function exportToN8n(
  workflow: {
    id?: string
    name: string
    description: string
    nodes: WorkflowNodeExport[]
    edges: WorkflowEdgeExport[]
    settings?: Record<string, unknown>
  },
  options: Partial<IntegrationExportOptions> = {}
): N8nWorkflow {
  // warnings array available for future validation: const warnings: string[] = []

  // Convert nodes
  const n8nNodes: N8nNode[] = workflow.nodes.map((node) => ({
    id: node.id,
    name: node.label || node.id,
    type: mapToN8nNodeType(node.type),
    typeVersion: 1,
    position: [node.position.x, node.position.y],
    parameters: {
      ...(node.config || {}),
      ...(node.data || {})
    }
  }))

  // Convert edges to n8n connections format
  const connections: Record<string, N8nConnection> = {}

  workflow.edges.forEach((edge) => {
    if (!connections[edge.source]) {
      connections[edge.source] = { main: [[]] }
    }

    connections[edge.source].main[0].push({
      node: edge.target,
      type: 'main',
      index: 0
    })
  })

  return {
    name: workflow.name,
    nodes: n8nNodes,
    connections,
    active: false,
    settings: {
      executionOrder: 'v1',
      saveDataErrorExecution: 'all',
      saveDataSuccessExecution: 'all',
      saveExecutionProgress: false,
      saveManualExecutions: false
    },
    ...(workflow.id && { id: workflow.id }),
    ...(options.includeMetadata && {
      meta: {
        templateCredsSetupCompleted: false
      }
    })
  }
}

/**
 * Export workflow to Zapier format
 */
export function exportToZapier(
  workflow: {
    id?: string
    name: string
    description: string
    nodes: WorkflowNodeExport[]
    edges: WorkflowEdgeExport[]
    settings?: Record<string, unknown>
  }
): ZapierZap {
  // Sort nodes by position (left to right, top to bottom)
  const sortedNodes = [...workflow.nodes].sort((a, b) => {
    if (Math.abs(a.position.y - b.position.y) < 50) {
      return a.position.x - b.position.x
    }
    return a.position.y - b.position.y
  })

  // Convert nodes to steps
  const steps: ZapierStep[] = sortedNodes.map((node, index) => ({
    id: node.id,
    position: index + 1,
    app: mapToZapierApp(node.type),
    action: node.type.toLowerCase(),
    params: {
      ...(node.config || {}),
      ...(node.data || {})
    }
  }))

  return {
    name: workflow.name,
    description: workflow.description || '',
    steps,
    state: 'draft'
  }
}

/**
 * Export workflow to Make (Integromat) format
 */
export function exportToMake(
  workflow: {
    id?: string
    name: string
    description: string
    nodes: WorkflowNodeExport[]
    edges: WorkflowEdgeExport[]
    settings?: Record<string, unknown>
  }
): MakeScenario {
  // Convert nodes to modules
  const modules: MakeModule[] = workflow.nodes.map((node, index) => ({
    id: index + 1,
    module: mapToMakeModule(node.type),
    version: 1,
    parameters: {
      ...(node.config || {}),
      ...(node.data || {})
    },
    metadata: {
      designer: { x: node.position.x, y: node.position.y }
    }
  }))

  return {
    name: workflow.name,
    description: workflow.description || '',
    blueprint: {
      version: 1,
      flow: modules
    },
    state: 'draft'
  }
}

/**
 * Export workflow to generic format
 */
export function exportToGeneric(
  workflow: {
    id?: string
    name: string
    description: string
    nodes: WorkflowNodeExport[]
    edges: WorkflowEdgeExport[]
    settings?: Record<string, unknown>
    metadata?: Record<string, unknown>
  }
): GenericWorkflow {
  // Build connection list for each node
  const nodeOutputs = new Map<string, string[]>()
  const nodeInputs = new Map<string, string[]>()

  workflow.edges.forEach((edge) => {
    const outputs = nodeOutputs.get(edge.source) || []
    outputs.push(edge.target)
    nodeOutputs.set(edge.source, outputs)

    const inputs = nodeInputs.get(edge.target) || []
    inputs.push(edge.source)
    nodeInputs.set(edge.target, inputs)
  })

  // Identify triggers (nodes with no inputs)
  const triggers = workflow.nodes
    .filter((node) => {
      const inputs = nodeInputs.get(node.id) || []
      return inputs.length === 0 || node.type.toLowerCase().includes('trigger')
    })
    .map((node) => ({
      type: node.type,
      config: { ...(node.config || {}), ...(node.data || {}) }
    }))

  return {
    version: '1.0.0',
    format: 'generic',
    exportedAt: new Date().toISOString(),
    workflow: {
      ...(workflow.id && { id: workflow.id }),
      name: workflow.name,
      description: workflow.description || '',
      status: 'draft',
      nodes: workflow.nodes.map((node) => ({
        id: node.id,
        type: node.type,
        name: node.label || node.id,
        position: node.position,
        config: { ...(node.config || {}), ...(node.data || {}) },
        inputs: nodeInputs.get(node.id) || [],
        outputs: nodeOutputs.get(node.id) || []
      })),
      connections: workflow.edges.map((edge) => ({
        from: { nodeId: edge.source, port: edge.sourceHandle },
        to: { nodeId: edge.target, port: edge.targetHandle }
      })),
      triggers,
      metadata: workflow.metadata || {}
    }
  }
}

/**
 * Export workflow to specified format
 */
export function exportWorkflowToFormat(
  workflow: {
    id?: string
    name: string
    description: string
    nodes: WorkflowNodeExport[]
    edges: WorkflowEdgeExport[]
    settings?: Record<string, unknown>
    metadata?: Record<string, unknown>
  },
  options: IntegrationExportOptions
): IntegrationExportResult {
  const { format, prettyPrint = true } = options
  const warnings: string[] = []

  try {
    let data: unknown

    switch (format) {
      case 'n8n':
        data = exportToN8n(workflow, options)
        break
      case 'zapier':
        data = exportToZapier(workflow)
        warnings.push('Zapier format is simplified. Manual configuration may be required in Zapier.')
        break
      case 'make':
        data = exportToMake(workflow)
        warnings.push('Make format is simplified. Manual configuration may be required in Make.')
        break
      case 'generic':
      default:
        data = exportToGeneric(workflow)
        break
    }

    const jsonString = prettyPrint
      ? JSON.stringify(data, null, 2)
      : JSON.stringify(data)

    const blob = new Blob([jsonString], { type: 'application/json' })

    const defaultFilename = `${workflow.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${format}.json`

    return {
      success: true,
      format,
      data: jsonString,
      blob,
      filename: options.filename || defaultFilename,
      warnings: warnings.length > 0 ? warnings : undefined
    }
  } catch (e) {
    return {
      success: false,
      format,
      error: e instanceof Error ? e.message : 'Unknown export error'
    }
  }
}

/**
 * Download workflow in specified format
 */
export function downloadWorkflowAsFormat(
  workflow: {
    id?: string
    name: string
    description: string
    nodes: WorkflowNodeExport[]
    edges: WorkflowEdgeExport[]
    settings?: Record<string, unknown>
    metadata?: Record<string, unknown>
  },
  options: IntegrationExportOptions
): IntegrationExportResult {
  const result = exportWorkflowToFormat(workflow, options)

  if (!result.success || !result.blob) {
    return result
  }

  const url = URL.createObjectURL(result.blob)
  const link = document.createElement('a')
  link.href = url
  link.download = result.filename || `workflow-${options.format}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  return result
}

/**
 * Get supported export formats
 */
export function getSupportedFormats(): Array<{
  id: ExportFormat
  name: string
  description: string
  icon: string
}> {
  return [
    {
      id: 'n8n',
      name: 'n8n',
      description: 'Export for n8n workflow automation platform',
      icon: 'workflow'
    },
    {
      id: 'zapier',
      name: 'Zapier',
      description: 'Export for Zapier (simplified format)',
      icon: 'zap'
    },
    {
      id: 'make',
      name: 'Make (Integromat)',
      description: 'Export for Make automation platform',
      icon: 'cog'
    },
    {
      id: 'generic',
      name: 'Generic JSON',
      description: 'Universal format for custom integrations',
      icon: 'file-json'
    }
  ]
}

/**
 * Validate if workflow can be exported to format
 */
export function validateExportCompatibility(
  workflow: {
    nodes: WorkflowNodeExport[]
    edges: WorkflowEdgeExport[]
  },
  format: ExportFormat
): { compatible: boolean; warnings: string[] } {
  const warnings: string[] = []

  // Check for unsupported node types
  const unsupportedTypes = new Set<string>()

  workflow.nodes.forEach((node) => {
    const type = node.type.toLowerCase()

    // Check format-specific compatibility
    switch (format) {
      case 'n8n':
        if (type === 'bmad' || type === 'ai-agent') {
          unsupportedTypes.add(type)
        }
        break
      case 'zapier':
        if (type === 'bmad' || type === 'loop' || type === 'parallel') {
          unsupportedTypes.add(type)
        }
        break
      case 'make':
        if (type === 'bmad') {
          unsupportedTypes.add(type)
        }
        break
    }
  })

  if (unsupportedTypes.size > 0) {
    warnings.push(`Node types not fully supported in ${format}: ${Array.from(unsupportedTypes).join(', ')}`)
  }

  // Check for complex edge patterns
  const nodeConnectionCount = new Map<string, number>()
  workflow.edges.forEach((edge) => {
    nodeConnectionCount.set(edge.source, (nodeConnectionCount.get(edge.source) || 0) + 1)
  })

  const hasMultipleOutputs = Array.from(nodeConnectionCount.values()).some((count) => count > 1)
  if (hasMultipleOutputs && format === 'zapier') {
    warnings.push('Multiple outputs from single node may not translate correctly to Zapier')
  }

  return {
    compatible: true, // Always allow export, just warn
    warnings
  }
}
