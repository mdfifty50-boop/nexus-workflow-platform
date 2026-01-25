/**
 * Type definitions for inline chat embed components
 * These embeds display workflow, template, integration, and execution previews
 * within chat messages (similar to ChatGPT's PDF previews)
 */

// Status constants using const object pattern (no enums per TypeScript rules)
export const WORKFLOW_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  PAUSED: 'paused',
  ARCHIVED: 'archived',
} as const

export type WorkflowStatus = typeof WORKFLOW_STATUS[keyof typeof WORKFLOW_STATUS]

export const EXECUTION_STATUS = {
  SUCCESS: 'success',
  FAILED: 'failed',
  RUNNING: 'running',
  CANCELLED: 'cancelled',
} as const

export type ExecutionStatus = typeof EXECUTION_STATUS[keyof typeof EXECUTION_STATUS]

export const CONNECTION_STATUS = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
  PENDING: 'pending',
} as const

export type ConnectionStatus = typeof CONNECTION_STATUS[keyof typeof CONNECTION_STATUS]

export const NODE_TYPE = {
  TRIGGER: 'trigger',
  ACTION: 'action',
  CONDITION: 'condition',
  TRANSFORM: 'transform',
  INTEGRATION: 'integration',
  AGENT: 'agent',
} as const

export type NodeType = typeof NODE_TYPE[keyof typeof NODE_TYPE]

// Node preview for mini workflow diagrams
export interface NodePreview {
  id: string
  type: NodeType | string
  name: string
  icon?: string
  status?: 'pending' | 'running' | 'completed' | 'failed'
}

// Workflow preview data structure
export interface WorkflowPreviewData {
  id: string
  name: string
  description?: string
  status: WorkflowStatus
  nodeCount: number
  lastRun?: Date | string
  successRate?: number
  nodes: NodePreview[]
  createdAt?: Date | string
  updatedAt?: Date | string
  tags?: string[]
}

// Template preview data structure
export interface TemplatePreviewData {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  usageCount: number
  rating?: number
  author?: string
  previewNodes?: NodePreview[]
  estimatedSetupTime?: string
  complexity?: 'simple' | 'medium' | 'complex'
}

// Integration preview data structure
export interface IntegrationPreviewData {
  id: string
  name: string
  icon?: string
  iconUrl?: string
  status: ConnectionStatus
  lastSync?: Date | string
  connectedAt?: Date | string
  accountInfo?: string
  scopes?: string[]
  healthScore?: number
}

// Execution result data structure
export interface ExecutionResultData {
  id: string
  workflowId: string
  workflowName?: string
  status: ExecutionStatus
  startTime: Date | string
  endTime?: Date | string
  duration?: number
  inputData?: unknown
  outputData?: unknown
  error?: string
  errorDetails?: {
    nodeId?: string
    nodeName?: string
    message: string
    stack?: string
  }
  nodesExecuted?: number
  totalNodes?: number
}

// Embed action handlers
export interface EmbedActions<T> {
  onEdit?: (data: T) => void
  onRun?: (data: T) => void
  onDuplicate?: (data: T) => void
  onDelete?: (data: T) => void
  onView?: (data: T) => void
  onClick?: (data: T) => void
  onDoubleClick?: (data: T) => void
}

// Base embed props
export interface BaseEmbedProps {
  className?: string
  isLoading?: boolean
  isError?: boolean
  errorMessage?: string
  expanded?: boolean
  onExpandChange?: (expanded: boolean) => void
}

// Workflow embed props
export interface WorkflowPreviewEmbedProps extends BaseEmbedProps {
  data: WorkflowPreviewData
  actions?: EmbedActions<WorkflowPreviewData>
  showDiagram?: boolean
  compact?: boolean
}

// Template embed props
export interface TemplatePreviewEmbedProps extends BaseEmbedProps {
  data: TemplatePreviewData
  onUseTemplate?: (data: TemplatePreviewData) => void
  onPreview?: (data: TemplatePreviewData) => void
}

// Integration embed props
export interface IntegrationPreviewEmbedProps extends BaseEmbedProps {
  data: IntegrationPreviewData
  onReconnect?: (data: IntegrationPreviewData) => void
  onConfigure?: (data: IntegrationPreviewData) => void
  onRemove?: (data: IntegrationPreviewData) => void
}

// Execution result embed props
export interface ExecutionResultEmbedProps extends BaseEmbedProps {
  data: ExecutionResultData
  onViewFullLog?: (data: ExecutionResultData) => void
  onRetry?: (data: ExecutionResultData) => void
  showDataPreview?: boolean
}

// Mini diagram props
export interface WorkflowDiagramMiniProps {
  nodes: NodePreview[]
  maxVisible?: number
  className?: string
  onNodeClick?: (node: NodePreview) => void
  onExpandClick?: () => void
}

// Container props
export interface EmbedContainerProps {
  children: React.ReactNode
  className?: string
  isLoading?: boolean
  isError?: boolean
  errorMessage?: string
  onClick?: () => void
  onDoubleClick?: () => void
  hoverActions?: React.ReactNode
}
