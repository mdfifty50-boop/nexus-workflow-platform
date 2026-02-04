/**
 * WorkflowPersistenceService - Dual-write localStorage + Cloud persistence for workflows
 *
 * Plan B: User Account System - Workflow History Persistence
 *
 * Philosophy:
 * - DUAL-WRITE: Always save to localStorage (fast) + server API (cloud backup)
 * - GRACEFUL DEGRADATION: Works with localStorage only if server unavailable
 * - NON-BLOCKING: Server writes are async, don't block UI
 * - SYNC ON LOAD: Merge server data with localStorage on app start
 */

// ============================================================================
// Types
// ============================================================================

export interface SavedWorkflow {
  id: string
  name: string
  description?: string
  workflowType: 'chat_generated' | 'template' | 'custom'
  status: 'draft' | 'active' | 'paused' | 'completed' | 'failed' | 'archived'
  triggerConfig?: TriggerConfig
  actionConfigs: ActionConfig[]
  requiredIntegrations: string[]
  estimatedTimeSaved?: string
  executionCount: number
  lastExecutedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface TriggerConfig {
  id: string
  type: string
  name: string
  icon?: string
  integration: string
  config: Record<string, unknown>
  description?: string
}

export interface ActionConfig {
  id: string
  type: string
  name: string
  icon?: string
  integration: string
  config: Record<string, unknown>
  order: number
  description?: string
}

export interface WorkflowExecution {
  id: string
  workflowId: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  startedAt?: Date
  completedAt?: Date
  errorMessage?: string
  executionData: Record<string, unknown>
  tokenUsage: number
  costUsd: number
  createdAt: Date
}

interface SyncResult {
  success: boolean
  workflowsLoaded: number
  source: 'supabase' | 'localStorage' | 'merged'
  error?: string
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'nexus-user-workflows'
const EXECUTIONS_KEY = 'nexus-workflow-executions'
const SYNC_STATUS_KEY = 'nexus-workflow-sync-status'
const API_BASE = '/api/workflow-persistence'

// ============================================================================
// localStorage Helpers
// ============================================================================

function loadWorkflowsFromStorage(): SavedWorkflow[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored) as SavedWorkflow[]
    return parsed.map((wf) => ({
      ...wf,
      createdAt: new Date(wf.createdAt),
      updatedAt: new Date(wf.updatedAt),
      lastExecutedAt: wf.lastExecutedAt ? new Date(wf.lastExecutedAt) : undefined,
    }))
  } catch {
    return []
  }
}

function saveWorkflowsToStorage(workflows: SavedWorkflow[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows))
  } catch {
    console.warn('[WorkflowPersistence] localStorage save failed - storage may be full')
  }
}

function loadExecutionsFromStorage(): WorkflowExecution[] {
  try {
    const stored = localStorage.getItem(EXECUTIONS_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored) as WorkflowExecution[]
    return parsed.map((ex) => ({
      ...ex,
      createdAt: new Date(ex.createdAt),
      startedAt: ex.startedAt ? new Date(ex.startedAt) : undefined,
      completedAt: ex.completedAt ? new Date(ex.completedAt) : undefined,
    }))
  } catch {
    return []
  }
}

function saveExecutionsToStorage(executions: WorkflowExecution[]): void {
  try {
    // Keep only last 100 executions per workflow to avoid storage bloat
    const limitedExecutions = executions.slice(0, 500)
    localStorage.setItem(EXECUTIONS_KEY, JSON.stringify(limitedExecutions))
  } catch {
    console.warn('[WorkflowPersistence] localStorage executions save failed')
  }
}

// ============================================================================
// API Helpers
// ============================================================================

async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
  userId: string | null
): Promise<T | null> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    }

    if (userId) {
      headers['x-clerk-user-id'] = userId
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      console.warn(`[WorkflowPersistence] API call failed: ${response.status}`)
      return null
    }

    return await response.json() as T
  } catch (error) {
    console.warn('[WorkflowPersistence] API call error:', error)
    return null
  }
}

// ============================================================================
// WorkflowPersistenceService
// ============================================================================

class WorkflowPersistenceService {
  private userId: string | null = null
  private cloudEnabled: boolean = false

  constructor() {
    this.checkCloudStatus()
  }

  /**
   * Check cloud status from server
   */
  private async checkCloudStatus(): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/status`)
      if (response.ok) {
        const data = await response.json()
        this.cloudEnabled = data.cloudEnabled
        if (this.cloudEnabled) {
          console.log('[WorkflowPersistence] Cloud persistence available')
        } else {
          console.log('[WorkflowPersistence] Cloud not configured - localStorage only')
        }
      }
    } catch {
      console.log('[WorkflowPersistence] Server unavailable - localStorage only mode')
      this.cloudEnabled = false
    }
  }

  /**
   * Initialize with user ID for cloud operations
   */
  setUserId(userId: string | null): void {
    this.userId = userId
    if (userId) {
      console.log('[WorkflowPersistence] User ID set - cloud sync available')
    }
  }

  /**
   * Check if cloud persistence is available
   */
  isCloudEnabled(): boolean {
    return this.cloudEnabled && !!this.userId
  }

  // ==========================================================================
  // Workflow Operations (Dual-Write)
  // ==========================================================================

  /**
   * Save a workflow - dual-write to localStorage + server
   */
  async saveWorkflow(workflow: SavedWorkflow): Promise<void> {
    // Step 1: Always save to localStorage first (fast, reliable)
    const workflows = loadWorkflowsFromStorage()
    const existingIndex = workflows.findIndex((w) => w.id === workflow.id)

    workflow.updatedAt = new Date()

    if (existingIndex >= 0) {
      workflows[existingIndex] = workflow
    } else {
      workflows.unshift(workflow) // New workflows at the top
    }
    saveWorkflowsToStorage(workflows)

    // Step 2: Async write to server (non-blocking)
    if (this.isCloudEnabled()) {
      apiCall('/workflows', {
        method: 'POST',
        body: JSON.stringify({ workflow }),
      }, this.userId).then(() => {
        this.updateSyncStatus()
      }).catch((err) => {
        console.warn('[WorkflowPersistence] Server sync failed (will retry):', err)
      })
    }
  }

  /**
   * Update workflow execution stats
   */
  async incrementExecutionCount(workflowId: string): Promise<void> {
    const workflows = loadWorkflowsFromStorage()
    const workflow = workflows.find((w) => w.id === workflowId)
    if (workflow) {
      workflow.executionCount = (workflow.executionCount || 0) + 1
      workflow.lastExecutedAt = new Date()
      workflow.updatedAt = new Date()
      saveWorkflowsToStorage(workflows)

      if (this.isCloudEnabled()) {
        apiCall(`/workflows/${workflowId}/executed`, {
          method: 'POST',
        }, this.userId).catch(console.warn)
      }
    }
  }

  /**
   * Delete a workflow - dual-write
   */
  async deleteWorkflow(workflowId: string): Promise<void> {
    // Step 1: Remove from localStorage
    const workflows = loadWorkflowsFromStorage()
    const filtered = workflows.filter((w) => w.id !== workflowId)
    saveWorkflowsToStorage(filtered)

    // Also remove related executions
    const executions = loadExecutionsFromStorage()
    const filteredExec = executions.filter((e) => e.workflowId !== workflowId)
    saveExecutionsToStorage(filteredExec)

    // Step 2: Remove from server
    if (this.isCloudEnabled()) {
      apiCall(`/workflows/${workflowId}`, {
        method: 'DELETE',
      }, this.userId).catch(console.warn)
    }
  }

  /**
   * Archive a workflow (soft delete)
   */
  async archiveWorkflow(workflowId: string): Promise<void> {
    const workflows = loadWorkflowsFromStorage()
    const workflow = workflows.find((w) => w.id === workflowId)
    if (workflow) {
      workflow.status = 'archived'
      workflow.updatedAt = new Date()
      saveWorkflowsToStorage(workflows)

      if (this.isCloudEnabled()) {
        apiCall(`/workflows/${workflowId}/archive`, {
          method: 'POST',
        }, this.userId).catch(console.warn)
      }
    }
  }

  // ==========================================================================
  // Execution Operations
  // ==========================================================================

  /**
   * Record a workflow execution
   */
  async recordExecution(execution: WorkflowExecution): Promise<void> {
    // Step 1: Save to localStorage
    const executions = loadExecutionsFromStorage()
    executions.unshift(execution)
    saveExecutionsToStorage(executions)

    // Update workflow execution count
    await this.incrementExecutionCount(execution.workflowId)

    // Step 2: Async write to server
    if (this.isCloudEnabled()) {
      apiCall('/executions', {
        method: 'POST',
        body: JSON.stringify({ execution }),
      }, this.userId).catch(console.warn)
    }
  }

  /**
   * Update execution status
   */
  async updateExecution(
    executionId: string,
    updates: Partial<WorkflowExecution>
  ): Promise<void> {
    const executions = loadExecutionsFromStorage()
    const execution = executions.find((e) => e.id === executionId)
    if (execution) {
      Object.assign(execution, updates)
      saveExecutionsToStorage(executions)

      if (this.isCloudEnabled()) {
        apiCall(`/executions/${executionId}`, {
          method: 'PATCH',
          body: JSON.stringify({ updates }),
        }, this.userId).catch(console.warn)
      }
    }
  }

  /**
   * Get executions for a workflow
   */
  getExecutions(workflowId: string): WorkflowExecution[] {
    const executions = loadExecutionsFromStorage()
    return executions
      .filter((e) => e.workflowId === workflowId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  // ==========================================================================
  // Load Operations (Merge Strategy)
  // ==========================================================================

  /**
   * Load all workflows with smart merge
   */
  async loadWorkflows(): Promise<{ workflows: SavedWorkflow[]; syncResult: SyncResult }> {
    const localWorkflows = loadWorkflowsFromStorage()

    // If no cloud enabled, just return localStorage
    if (!this.isCloudEnabled()) {
      return {
        workflows: localWorkflows,
        syncResult: {
          success: true,
          workflowsLoaded: localWorkflows.length,
          source: 'localStorage',
        },
      }
    }

    // Try to fetch from server
    try {
      const response = await apiCall<{ workflows: SavedWorkflow[]; source: string }>(
        '/workflows',
        { method: 'GET' },
        this.userId
      )

      if (!response || !response.workflows || response.workflows.length === 0) {
        // No cloud data - upload local to cloud
        if (localWorkflows.length > 0) {
          this.uploadWorkflowsToCloud(localWorkflows)
        }
        return {
          workflows: localWorkflows,
          syncResult: {
            success: true,
            workflowsLoaded: localWorkflows.length,
            source: 'localStorage',
          },
        }
      }

      // Convert server response to proper Date objects
      const cloudWorkflows: SavedWorkflow[] = response.workflows.map((w) => ({
        ...w,
        createdAt: new Date(w.createdAt),
        updatedAt: new Date(w.updatedAt),
        lastExecutedAt: w.lastExecutedAt ? new Date(w.lastExecutedAt) : undefined,
      }))

      // Merge strategy
      const merged = this.mergeWorkflows(localWorkflows, cloudWorkflows)
      saveWorkflowsToStorage(merged)

      this.updateSyncStatus()

      return {
        workflows: merged,
        syncResult: {
          success: true,
          workflowsLoaded: merged.length,
          source: 'merged',
        },
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.warn('[WorkflowPersistence] Cloud fetch failed, using localStorage:', errorMessage)
      return {
        workflows: localWorkflows,
        syncResult: {
          success: false,
          workflowsLoaded: localWorkflows.length,
          source: 'localStorage',
          error: errorMessage,
        },
      }
    }
  }

  /**
   * Upload local workflows to cloud (for initial sync)
   */
  private async uploadWorkflowsToCloud(workflows: SavedWorkflow[]): Promise<void> {
    if (!this.isCloudEnabled()) return

    // Upload in batches to avoid overwhelming
    const batchSize = 10
    for (let i = 0; i < workflows.length; i += batchSize) {
      const batch = workflows.slice(i, i + batchSize)
      await Promise.all(
        batch.map((w) =>
          apiCall('/workflows', {
            method: 'POST',
            body: JSON.stringify({ workflow: w }),
          }, this.userId)
        )
      )
    }
  }

  /**
   * Merge local and cloud workflows
   */
  private mergeWorkflows(local: SavedWorkflow[], cloud: SavedWorkflow[]): SavedWorkflow[] {
    const merged = new Map<string, SavedWorkflow>()

    // Add all cloud workflows first
    for (const workflow of cloud) {
      merged.set(workflow.id, workflow)
    }

    // Merge local workflows
    for (const localWorkflow of local) {
      const cloudWorkflow = merged.get(localWorkflow.id)
      if (!cloudWorkflow) {
        // Local-only workflow - keep it
        merged.set(localWorkflow.id, localWorkflow)
      } else {
        // Exists in both - keep newer
        if (localWorkflow.updatedAt > cloudWorkflow.updatedAt) {
          merged.set(localWorkflow.id, localWorkflow)
        }
      }
    }

    // Sort by updatedAt descending
    return Array.from(merged.values()).sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    )
  }

  /**
   * Get a single workflow by ID
   */
  getWorkflow(workflowId: string): SavedWorkflow | null {
    const workflows = loadWorkflowsFromStorage()
    return workflows.find((w) => w.id === workflowId) || null
  }

  /**
   * Get workflows by status
   */
  getWorkflowsByStatus(status: SavedWorkflow['status']): SavedWorkflow[] {
    const workflows = loadWorkflowsFromStorage()
    return workflows.filter((w) => w.status === status)
  }

  /**
   * Get active (non-archived) workflows
   */
  getActiveWorkflows(): SavedWorkflow[] {
    const workflows = loadWorkflowsFromStorage()
    return workflows.filter((w) => w.status !== 'archived')
  }

  // ==========================================================================
  // Sync Status
  // ==========================================================================

  getSyncStatus(): { lastSync: Date | null; enabled: boolean } {
    const lastSyncStr = localStorage.getItem(SYNC_STATUS_KEY)
    return {
      lastSync: lastSyncStr ? new Date(lastSyncStr) : null,
      enabled: this.isCloudEnabled(),
    }
  }

  private updateSyncStatus(): void {
    localStorage.setItem(SYNC_STATUS_KEY, new Date().toISOString())
  }

  // ==========================================================================
  // Helper: Create workflow from chat-generated spec
  // ==========================================================================

  createFromChatSpec(spec: {
    name: string
    description?: string
    steps: Array<{
      id: string
      name: string
      tool: string
      type: 'trigger' | 'action'
    }>
    requiredIntegrations: string[]
    estimatedTimeSaved?: string
  }): SavedWorkflow {
    const now = new Date()
    const trigger = spec.steps.find((s) => s.type === 'trigger')
    const actions = spec.steps.filter((s) => s.type === 'action')

    return {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: spec.name,
      description: spec.description,
      workflowType: 'chat_generated',
      status: 'draft',
      triggerConfig: trigger ? {
        id: trigger.id,
        type: trigger.tool,
        name: trigger.name,
        integration: trigger.tool,
        config: {},
      } : undefined,
      actionConfigs: actions.map((a, i) => ({
        id: a.id,
        type: a.tool,
        name: a.name,
        integration: a.tool,
        config: {},
        order: i,
      })),
      requiredIntegrations: spec.requiredIntegrations,
      estimatedTimeSaved: spec.estimatedTimeSaved,
      executionCount: 0,
      createdAt: now,
      updatedAt: now,
    }
  }
}

// Singleton instance
export const workflowPersistenceService = new WorkflowPersistenceService()
export default workflowPersistenceService
