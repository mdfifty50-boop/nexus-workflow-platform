/**
 * Workflow Schema Validation
 *
 * Validates workflow JSON structure before save/execute to catch malformed workflows early.
 * Provides detailed error messages for debugging.
 */

// =============================================================================
// TYPES
// =============================================================================

export interface WorkflowValidationError {
  path: string
  message: string
  code: WorkflowErrorCode
}

export type WorkflowErrorCode =
  | 'MISSING_FIELD'
  | 'INVALID_TYPE'
  | 'INVALID_VALUE'
  | 'INVALID_NODE'
  | 'INVALID_EDGE'
  | 'DUPLICATE_ID'
  | 'ORPHAN_NODE'
  | 'CIRCULAR_REFERENCE'
  | 'INVALID_CONNECTION'
  | 'MISSING_REQUIRED'
  | 'SCHEMA_MISMATCH'

export interface WorkflowValidationResult {
  valid: boolean
  errors: WorkflowValidationError[]
  warnings: WorkflowValidationError[]
}

export interface WorkflowSchema {
  id?: string
  name: string
  description?: string
  version?: string
  nodes: WorkflowNodeSchema[]
  edges: WorkflowEdgeSchema[]
  config?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

export interface WorkflowNodeSchema {
  id: string
  type: string
  label?: string
  position?: { x: number; y: number }
  config?: Record<string, unknown>
  inputs?: WorkflowPortSchema[]
  outputs?: WorkflowPortSchema[]
}

export interface WorkflowPortSchema {
  id: string
  name: string
  type?: string
  required?: boolean
}

export interface WorkflowEdgeSchema {
  id: string
  source: string
  target: string
  sourcePort?: string
  targetPort?: string
  label?: string
  config?: Record<string, unknown>
}

// =============================================================================
// VALIDATOR CLASS
// =============================================================================

export class WorkflowValidator {
  private errors: WorkflowValidationError[] = []
  private warnings: WorkflowValidationError[] = []
  private nodeIds = new Set<string>()
  private edgeIds = new Set<string>()

  /**
   * Validates a workflow schema
   */
  validate(workflow: unknown): WorkflowValidationResult {
    this.reset()

    // Basic structure validation
    if (!this.isObject(workflow)) {
      this.addError('', 'Workflow must be an object', 'INVALID_TYPE')
      return this.getResult()
    }

    const w = workflow as Record<string, unknown>

    // Validate required fields
    this.validateRequiredFields(w)

    // Validate nodes array
    if (w.nodes !== undefined) {
      this.validateNodes(w.nodes)
    }

    // Validate edges array
    if (w.edges !== undefined) {
      this.validateEdges(w.edges, this.nodeIds)
    }

    // Validate config object
    if (w.config !== undefined && !this.isObject(w.config)) {
      this.addError('config', 'Config must be an object', 'INVALID_TYPE')
    }

    // Validate metadata object
    if (w.metadata !== undefined && !this.isObject(w.metadata)) {
      this.addError('metadata', 'Metadata must be an object', 'INVALID_TYPE')
    }

    // Check for orphan nodes (nodes not connected to any edge)
    this.checkOrphanNodes(w)

    // Check for circular references in edges
    if (Array.isArray(w.edges) && w.edges.length > 0) {
      this.checkCircularReferences(w.edges as WorkflowEdgeSchema[])
    }

    return this.getResult()
  }

  /**
   * Validates workflow before execution (stricter checks)
   */
  validateForExecution(workflow: unknown): WorkflowValidationResult {
    // First run standard validation
    const result = this.validate(workflow)

    if (!result.valid) {
      return result
    }

    const w = workflow as WorkflowSchema

    // Check that workflow has at least one node
    if (!w.nodes || w.nodes.length === 0) {
      this.addError('nodes', 'Workflow must have at least one node to execute', 'MISSING_REQUIRED')
    }

    // Check for trigger node (entry point)
    if (w.nodes && !w.nodes.some(n => n.type === 'trigger' || n.type === 'start')) {
      this.addWarning('nodes', 'Workflow has no trigger/start node - execution may not start automatically', 'MISSING_FIELD')
    }

    // Validate that all required ports are connected
    this.validateRequiredConnections(w)

    return this.getResult()
  }

  /**
   * Quick validation check (returns boolean only)
   */
  isValid(workflow: unknown): boolean {
    return this.validate(workflow).valid
  }

  // ===========================================================================
  // PRIVATE METHODS
  // ===========================================================================

  private reset(): void {
    this.errors = []
    this.warnings = []
    this.nodeIds = new Set()
    this.edgeIds = new Set()
  }

  private getResult(): WorkflowValidationResult {
    return {
      valid: this.errors.length === 0,
      errors: [...this.errors],
      warnings: [...this.warnings]
    }
  }

  private addError(path: string, message: string, code: WorkflowErrorCode): void {
    this.errors.push({ path, message, code })
  }

  private addWarning(path: string, message: string, code: WorkflowErrorCode): void {
    this.warnings.push({ path, message, code })
  }

  private isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
  }

  private validateRequiredFields(workflow: Record<string, unknown>): void {
    // Name is required
    if (typeof workflow.name !== 'string' || !workflow.name.trim()) {
      this.addError('name', 'Workflow name is required', 'MISSING_FIELD')
    } else if (workflow.name.length > 100) {
      this.addError('name', 'Workflow name must be 100 characters or less', 'INVALID_VALUE')
    }

    // Nodes array is required
    if (workflow.nodes === undefined) {
      this.addError('nodes', 'Nodes array is required', 'MISSING_FIELD')
    } else if (!Array.isArray(workflow.nodes)) {
      this.addError('nodes', 'Nodes must be an array', 'INVALID_TYPE')
    }

    // Edges array is required (can be empty)
    if (workflow.edges === undefined) {
      this.addError('edges', 'Edges array is required', 'MISSING_FIELD')
    } else if (!Array.isArray(workflow.edges)) {
      this.addError('edges', 'Edges must be an array', 'INVALID_TYPE')
    }

    // Version should be a string if present
    if (workflow.version !== undefined && typeof workflow.version !== 'string') {
      this.addWarning('version', 'Version should be a string', 'INVALID_TYPE')
    }
  }

  private validateNodes(nodes: unknown): void {
    if (!Array.isArray(nodes)) {
      return // Already reported in validateRequiredFields
    }

    nodes.forEach((node, index) => {
      const path = `nodes[${index}]`

      if (!this.isObject(node)) {
        this.addError(path, 'Node must be an object', 'INVALID_NODE')
        return
      }

      const n = node as Record<string, unknown>

      // Validate node id
      if (typeof n.id !== 'string' || !n.id.trim()) {
        this.addError(`${path}.id`, 'Node id is required', 'MISSING_FIELD')
      } else {
        if (this.nodeIds.has(n.id)) {
          this.addError(`${path}.id`, `Duplicate node id: ${n.id}`, 'DUPLICATE_ID')
        }
        this.nodeIds.add(n.id)
      }

      // Validate node type
      if (typeof n.type !== 'string' || !n.type.trim()) {
        this.addError(`${path}.type`, 'Node type is required', 'MISSING_FIELD')
      }

      // Validate position if present
      if (n.position !== undefined) {
        if (!this.isObject(n.position)) {
          this.addError(`${path}.position`, 'Position must be an object', 'INVALID_TYPE')
        } else {
          const pos = n.position as Record<string, unknown>
          if (typeof pos.x !== 'number') {
            this.addError(`${path}.position.x`, 'Position x must be a number', 'INVALID_TYPE')
          }
          if (typeof pos.y !== 'number') {
            this.addError(`${path}.position.y`, 'Position y must be a number', 'INVALID_TYPE')
          }
        }
      }

      // Validate config if present
      if (n.config !== undefined && !this.isObject(n.config)) {
        this.addError(`${path}.config`, 'Config must be an object', 'INVALID_TYPE')
      }

      // Validate inputs/outputs if present
      if (n.inputs !== undefined) {
        this.validatePorts(n.inputs, `${path}.inputs`)
      }
      if (n.outputs !== undefined) {
        this.validatePorts(n.outputs, `${path}.outputs`)
      }
    })
  }

  private validatePorts(ports: unknown, basePath: string): void {
    if (!Array.isArray(ports)) {
      this.addError(basePath, 'Ports must be an array', 'INVALID_TYPE')
      return
    }

    ports.forEach((port, index) => {
      const path = `${basePath}[${index}]`

      if (!this.isObject(port)) {
        this.addError(path, 'Port must be an object', 'INVALID_TYPE')
        return
      }

      const p = port as Record<string, unknown>

      if (typeof p.id !== 'string' || !p.id.trim()) {
        this.addError(`${path}.id`, 'Port id is required', 'MISSING_FIELD')
      }

      if (typeof p.name !== 'string' || !p.name.trim()) {
        this.addError(`${path}.name`, 'Port name is required', 'MISSING_FIELD')
      }
    })
  }

  private validateEdges(edges: unknown, validNodeIds: Set<string>): void {
    if (!Array.isArray(edges)) {
      return // Already reported in validateRequiredFields
    }

    edges.forEach((edge, index) => {
      const path = `edges[${index}]`

      if (!this.isObject(edge)) {
        this.addError(path, 'Edge must be an object', 'INVALID_EDGE')
        return
      }

      const e = edge as Record<string, unknown>

      // Validate edge id
      if (typeof e.id !== 'string' || !e.id.trim()) {
        this.addError(`${path}.id`, 'Edge id is required', 'MISSING_FIELD')
      } else {
        if (this.edgeIds.has(e.id)) {
          this.addError(`${path}.id`, `Duplicate edge id: ${e.id}`, 'DUPLICATE_ID')
        }
        this.edgeIds.add(e.id)
      }

      // Validate source
      if (typeof e.source !== 'string' || !e.source.trim()) {
        this.addError(`${path}.source`, 'Edge source is required', 'MISSING_FIELD')
      } else if (!validNodeIds.has(e.source)) {
        this.addError(`${path}.source`, `Source node not found: ${e.source}`, 'INVALID_CONNECTION')
      }

      // Validate target
      if (typeof e.target !== 'string' || !e.target.trim()) {
        this.addError(`${path}.target`, 'Edge target is required', 'MISSING_FIELD')
      } else if (!validNodeIds.has(e.target)) {
        this.addError(`${path}.target`, `Target node not found: ${e.target}`, 'INVALID_CONNECTION')
      }

      // Self-loop check
      if (e.source === e.target) {
        this.addWarning(path, 'Edge connects node to itself (self-loop)', 'INVALID_CONNECTION')
      }

      // Validate config if present
      if (e.config !== undefined && !this.isObject(e.config)) {
        this.addError(`${path}.config`, 'Config must be an object', 'INVALID_TYPE')
      }
    })
  }

  private checkOrphanNodes(workflow: Record<string, unknown>): void {
    if (!Array.isArray(workflow.nodes) || !Array.isArray(workflow.edges)) {
      return
    }

    const connectedNodes = new Set<string>()

    for (const edge of workflow.edges as Array<Record<string, unknown>>) {
      if (typeof edge.source === 'string') connectedNodes.add(edge.source)
      if (typeof edge.target === 'string') connectedNodes.add(edge.target)
    }

    for (const node of workflow.nodes as Array<Record<string, unknown>>) {
      if (typeof node.id === 'string' && !connectedNodes.has(node.id)) {
        // Orphan nodes are warnings, not errors (single-node workflows are valid)
        if ((workflow.nodes as unknown[]).length > 1) {
          this.addWarning(`nodes`, `Node "${node.id}" is not connected to any edge`, 'ORPHAN_NODE')
        }
      }
    }
  }

  private checkCircularReferences(edges: WorkflowEdgeSchema[]): void {
    // Build adjacency list
    const graph = new Map<string, string[]>()

    for (const edge of edges) {
      if (!graph.has(edge.source)) {
        graph.set(edge.source, [])
      }
      graph.get(edge.source)!.push(edge.target)
    }

    // DFS to detect cycles
    const visited = new Set<string>()
    const recursionStack = new Set<string>()

    const hasCycle = (node: string, path: string[]): boolean => {
      visited.add(node)
      recursionStack.add(node)

      const neighbors = graph.get(node) || []
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (hasCycle(neighbor, [...path, node])) {
            return true
          }
        } else if (recursionStack.has(neighbor)) {
          // Found a cycle
          const cyclePath = [...path, node, neighbor].join(' -> ')
          this.addWarning('edges', `Circular reference detected: ${cyclePath}`, 'CIRCULAR_REFERENCE')
          return true
        }
      }

      recursionStack.delete(node)
      return false
    }

    for (const node of graph.keys()) {
      if (!visited.has(node)) {
        hasCycle(node, [])
      }
    }
  }

  private validateRequiredConnections(workflow: WorkflowSchema): void {
    // Build a map of connected target ports
    const connectedTargetPorts = new Map<string, Set<string>>()

    for (const edge of workflow.edges) {
      if (!connectedTargetPorts.has(edge.target)) {
        connectedTargetPorts.set(edge.target, new Set())
      }
      if (edge.targetPort) {
        connectedTargetPorts.get(edge.target)!.add(edge.targetPort)
      }
    }

    // Check each node's required inputs
    for (const node of workflow.nodes) {
      if (!node.inputs) continue

      for (const input of node.inputs) {
        if (input.required) {
          const nodeConnections = connectedTargetPorts.get(node.id)
          if (!nodeConnections || !nodeConnections.has(input.id)) {
            this.addError(
              `nodes.${node.id}.inputs.${input.id}`,
              `Required input "${input.name}" is not connected`,
              'MISSING_REQUIRED'
            )
          }
        }
      }
    }
  }
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

const defaultValidator = new WorkflowValidator()

/**
 * Validates a workflow schema
 */
export function validateWorkflow(workflow: unknown): WorkflowValidationResult {
  return defaultValidator.validate(workflow)
}

/**
 * Validates a workflow for execution (stricter checks)
 */
export function validateWorkflowForExecution(workflow: unknown): WorkflowValidationResult {
  return defaultValidator.validateForExecution(workflow)
}

/**
 * Quick validation check
 */
export function isValidWorkflow(workflow: unknown): boolean {
  return defaultValidator.isValid(workflow)
}

/**
 * Formats validation errors for display
 */
export function formatValidationErrors(result: WorkflowValidationResult): string {
  const lines: string[] = []

  if (result.errors.length > 0) {
    lines.push('Errors:')
    for (const error of result.errors) {
      const location = error.path ? `[${error.path}] ` : ''
      lines.push(`  - ${location}${error.message}`)
    }
  }

  if (result.warnings.length > 0) {
    lines.push('Warnings:')
    for (const warning of result.warnings) {
      const location = warning.path ? `[${warning.path}] ` : ''
      lines.push(`  - ${location}${warning.message}`)
    }
  }

  return lines.join('\n')
}
