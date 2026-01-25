export interface User {
  id: string
  created_at: string
  updated_at: string
  email: string
  full_name: string | null
  avatar_url: string | null
  preferred_language: string
  timezone: string
  metadata: Record<string, unknown>
}

export interface Project {
  id: string
  created_at: string
  updated_at: string
  owner_id: string
  name: string
  description: string | null
  settings: Record<string, unknown>
  is_archived: boolean
}

export interface ProjectMember {
  id: string
  created_at: string
  project_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
}

export type WorkflowStatus =
  | 'draft'
  | 'active'
  | 'paused'
  | 'planning'
  | 'pending_approval'
  | 'orchestrating'
  | 'building'
  | 'reviewing'
  | 'completed'
  | 'failed'
  | 'cancelled'

export interface Workflow {
  id: string
  created_at: string
  updated_at: string
  project_id: string
  name: string
  description: string | null
  workflow_type: 'BMAD' | 'Simple' | 'Scheduled'
  status: WorkflowStatus
  config: Record<string, unknown>
  execution_count: number
  last_executed_at: string | null
  // BMAD orchestration fields
  user_input: string | null
  orchestration_framework: 'bmad' | 'simple' | null
  orchestration_version: string | null
  total_tokens_used: number
  total_cost_usd: number
  created_by: string
  completed_at: string | null
  result_summary: Record<string, unknown> | null
  error_message: string | null
}

export interface WorkflowExecution {
  id: string
  created_at: string
  updated_at: string
  workflow_id: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  started_at: string | null
  completed_at: string | null
  error_message: string | null
  execution_data: Record<string, unknown>
  token_usage: number
  cost_usd: number
}

// Workflow state checkpointing (Story 4.3)
export interface WorkflowState {
  id: string
  created_at: string
  workflow_id: string
  version: number
  checkpoint_name: string
  state_snapshot: Record<string, unknown>
  tokens_used_in_step: number
  cost_usd_in_step: number
}

// Workflow node for visualization (Epic 5)
export interface WorkflowNode {
  id: string
  created_at: string
  workflow_id: string
  node_id: string
  node_type: 'agent' | 'integration' | 'condition' | 'transform' | 'trigger'
  label: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  position_x: number
  position_y: number
  config: Record<string, unknown>
  output: Record<string, unknown> | null
  started_at: string | null
  completed_at: string | null
  tokens_used: number
  cost_usd: number
}

export interface IntegrationCredential {
  id: string
  created_at: string
  updated_at: string
  user_id: string
  project_id: string
  provider: string
  access_token_encrypted: string
  refresh_token_encrypted: string
  token_expires_at: string
  scopes: string[]
  metadata: Record<string, unknown>
}
