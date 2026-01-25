/**
 * Exception Queue Manager - Human-in-the-Loop Decision System
 *
 * Manages exceptions that require human review/approval before proceeding:
 * - Uncertain AI decisions (confidence < 70%)
 * - High-value actions (payments > $100, bulk operations)
 * - Missing information that can't be inferred
 * - Service errors that need human intervention
 *
 * Philosophy: "80% automation, 20% honest about needing human help"
 */

import { supabase, isSupabaseConfigured } from '../supabase'
import { exceptionLogger } from '../monitoring'
import type { ExecutionState, WorkflowStep } from '../../types/workflow-execution'

// ========================================
// Exception Types
// ========================================

export type ExceptionType =
  | 'uncertain_decision'   // AI confidence < 70%
  | 'high_value_action'    // Payments > $100, bulk operations
  | 'missing_information'  // Required info that can't be inferred
  | 'service_error'        // External service failures
  | 'policy_violation'     // Action violates configured policies
  | 'approval_required'    // Action explicitly requires approval
  | 'custom'

export type ExceptionUrgency = 'immediate' | 'today' | 'flexible'

export type ExceptionStatus =
  | 'pending'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'modified'
  | 'expired'
  | 'auto_resolved'

export type DecisionAction = 'approve' | 'reject' | 'modify'

export interface ExceptionContext {
  workflowName?: string
  stepName?: string
  aiConfidence?: number
  actionType?: string
  estimatedValue?: number
  currency?: string
  affectedRecords?: number
  originalInput?: unknown
  aiReasoning?: string
  alternatives?: Array<{
    id: string
    label: string
    labelAr?: string
    description?: string
    descriptionAr?: string
  }>
  requiredFields?: Array<{
    name: string
    type: string
    required: boolean
    placeholder?: string
    placeholderAr?: string
  }>
  serviceError?: {
    service: string
    errorCode: string
    message: string
  }
}

export interface ProposedAction {
  type: string
  payload: unknown
  estimatedImpact: string
  estimatedImpactAr?: string
  reversible: boolean
}

export interface ExceptionDecision {
  action: DecisionAction
  modifiedPayload?: unknown
  reason?: string
  decidedBy: string
  decidedAt: string
}

export interface ExceptionQueueItem {
  id: string
  createdAt: string
  updatedAt: string
  userId: string
  projectId?: string
  workflowId?: string
  executionId?: string
  stepId?: string
  exceptionType: ExceptionType
  urgency: ExceptionUrgency
  status: ExceptionStatus
  title: string
  titleAr?: string
  description: string
  descriptionAr?: string
  context: ExceptionContext
  proposedAction?: ProposedAction
  decision?: ExceptionDecision
  expiresAt?: string
  reviewedAt?: string
  resolvedAt?: string
  tags: string[]
  metadata: Record<string, unknown>
}

export interface CreateExceptionParams {
  userId: string
  projectId?: string
  workflowId?: string
  executionId?: string
  stepId?: string
  exceptionType: ExceptionType
  urgency?: ExceptionUrgency
  title: string
  titleAr?: string
  description: string
  descriptionAr?: string
  context?: ExceptionContext | Record<string, unknown>
  proposedAction?: ProposedAction
  expiresAt?: string
  tags?: string[]
  metadata?: Record<string, unknown>
}

export interface ExceptionStats {
  totalPending: number
  immediateCount: number
  todayCount: number
  flexibleCount: number
  resolvedToday: number
  avgResolutionTimeHours: number | null
}

export interface ExceptionQueueConfig {
  highValueThreshold: number    // USD amount for high-value actions
  confidenceThreshold: number   // Minimum AI confidence (0-1)
  bulkOperationThreshold: number // Number of records for bulk operations
  defaultExpiry: number         // Default expiry in hours
}

// ========================================
// Default Configuration
// ========================================

const DEFAULT_CONFIG: ExceptionQueueConfig = {
  highValueThreshold: 100,      // $100 USD
  confidenceThreshold: 0.7,     // 70% confidence
  bulkOperationThreshold: 50,   // 50+ records
  defaultExpiry: 72,            // 72 hours
}

// ========================================
// Exception Queue Manager Class
// ========================================

export class ExceptionQueueManager {
  private config: ExceptionQueueConfig
  private inMemoryQueue: Map<string, ExceptionQueueItem>
  private listeners: Set<(items: ExceptionQueueItem[]) => void>

  constructor(config: Partial<ExceptionQueueConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.inMemoryQueue = new Map()
    this.listeners = new Set()
    exceptionLogger.info('ExceptionQueueManager initialized', { config: this.config })
  }

  // ========================================
  // Configuration
  // ========================================

  updateConfig(config: Partial<ExceptionQueueConfig>): void {
    this.config = { ...this.config, ...config }
  }

  getConfig(): ExceptionQueueConfig {
    return { ...this.config }
  }

  // ========================================
  // Exception Detection Helpers
  // ========================================

  /**
   * Check if an AI decision should be queued for review
   */
  shouldQueueUncertainDecision(confidence: number): boolean {
    return confidence < this.config.confidenceThreshold
  }

  /**
   * Check if an action is high-value and needs approval
   */
  shouldQueueHighValueAction(valueUsd: number): boolean {
    return valueUsd > this.config.highValueThreshold
  }

  /**
   * Check if an operation is bulk and needs review
   */
  shouldQueueBulkOperation(recordCount: number): boolean {
    return recordCount >= this.config.bulkOperationThreshold
  }

  /**
   * Determine urgency based on context
   */
  determineUrgency(
    exceptionType: ExceptionType,
    context: ExceptionContext
  ): ExceptionUrgency {
    // Immediate for blocking workflow errors
    if (exceptionType === 'service_error' && context.aiConfidence === undefined) {
      return 'immediate'
    }

    // High-value actions need same-day attention
    if (exceptionType === 'high_value_action') {
      const value = context.estimatedValue || 0
      return value > this.config.highValueThreshold * 10 ? 'immediate' : 'today'
    }

    // Uncertain decisions can wait
    if (exceptionType === 'uncertain_decision') {
      return context.aiConfidence && context.aiConfidence < 0.5 ? 'today' : 'flexible'
    }

    // Default to today
    return 'today'
  }

  // ========================================
  // CRUD Operations
  // ========================================

  /**
   * Create a new exception queue item
   */
  async createException(params: CreateExceptionParams): Promise<ExceptionQueueItem> {
    const now = new Date()
    const contextAsExceptionContext = (params.context || {}) as ExceptionContext
    const urgency = params.urgency || this.determineUrgency(params.exceptionType, contextAsExceptionContext)

    // Calculate expiry
    const expiresAt = params.expiresAt ||
      new Date(now.getTime() + this.config.defaultExpiry * 60 * 60 * 1000).toISOString()

    const item: ExceptionQueueItem = {
      id: `exc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      userId: params.userId,
      projectId: params.projectId,
      workflowId: params.workflowId,
      executionId: params.executionId,
      stepId: params.stepId,
      exceptionType: params.exceptionType,
      urgency,
      status: 'pending',
      title: params.title,
      titleAr: params.titleAr,
      description: params.description,
      descriptionAr: params.descriptionAr,
      context: contextAsExceptionContext,
      proposedAction: params.proposedAction,
      expiresAt,
      tags: params.tags || [],
      metadata: params.metadata || {},
    }

    // Try to save to Supabase
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('exception_queue')
          .insert({
            user_id: item.userId,
            project_id: item.projectId,
            workflow_id: item.workflowId,
            execution_id: item.executionId,
            step_id: item.stepId,
            exception_type: item.exceptionType,
            urgency: item.urgency,
            status: item.status,
            title: item.title,
            title_ar: item.titleAr,
            description: item.description,
            description_ar: item.descriptionAr,
            context: item.context,
            proposed_action: item.proposedAction,
            expires_at: item.expiresAt,
            tags: item.tags,
            metadata: item.metadata,
          })
          .select()
          .single()

        if (error) throw error
        if (data) {
          item.id = data.id
          item.createdAt = data.created_at
          item.updatedAt = data.updated_at
        }
      } catch (error) {
        console.warn('[ExceptionQueue] Failed to save to Supabase, using in-memory:', error)
      }
    }

    // Always store in memory for immediate access
    this.inMemoryQueue.set(item.id, item)
    this.notifyListeners()

    // Log exception creation
    exceptionLogger.info('Exception created', {
      exceptionId: item.id,
      exceptionType: item.exceptionType,
      urgency: item.urgency,
      userId: item.userId,
      workflowId: item.workflowId,
      stepId: item.stepId
    })

    return item
  }

  /**
   * Get all pending exceptions for a user
   */
  async getPendingExceptions(userId: string): Promise<ExceptionQueueItem[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('exception_queue')
          .select('*')
          .eq('user_id', userId)
          .in('status', ['pending', 'in_review'])
          .order('urgency', { ascending: true })  // immediate first
          .order('created_at', { ascending: false })

        if (error) throw error
        return (data || []).map(this.mapFromDb)
      } catch (error) {
        console.warn('[ExceptionQueue] Failed to fetch from Supabase:', error)
      }
    }

    // Fall back to in-memory
    return Array.from(this.inMemoryQueue.values())
      .filter(item => item.userId === userId && ['pending', 'in_review'].includes(item.status))
      .sort((a, b) => {
        const urgencyOrder = { immediate: 0, today: 1, flexible: 2 }
        const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
        if (urgencyDiff !== 0) return urgencyDiff
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
  }

  /**
   * Get a single exception by ID
   */
  async getException(id: string): Promise<ExceptionQueueItem | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('exception_queue')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        return data ? this.mapFromDb(data) : null
      } catch (error) {
        console.warn('[ExceptionQueue] Failed to fetch exception:', error)
      }
    }

    return this.inMemoryQueue.get(id) || null
  }

  /**
   * Update exception status to in_review
   */
  async markAsReviewing(id: string): Promise<ExceptionQueueItem | null> {
    const now = new Date().toISOString()

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('exception_queue')
          .update({
            status: 'in_review',
            reviewed_at: now,
          })
          .eq('id', id)
          .select()
          .single()

        if (error) throw error
        if (data) {
          const item = this.mapFromDb(data)
          this.inMemoryQueue.set(id, item)
          this.notifyListeners()
          return item
        }
      } catch (error) {
        console.warn('[ExceptionQueue] Failed to update status:', error)
      }
    }

    // Fall back to in-memory
    const item = this.inMemoryQueue.get(id)
    if (item) {
      item.status = 'in_review'
      item.reviewedAt = now
      item.updatedAt = now
      this.notifyListeners()
      return item
    }

    return null
  }

  /**
   * Approve an exception
   */
  async approveException(
    id: string,
    decidedBy: string,
    reason?: string
  ): Promise<ExceptionQueueItem | null> {
    return this.resolveException(id, {
      action: 'approve',
      decidedBy,
      decidedAt: new Date().toISOString(),
      reason,
    })
  }

  /**
   * Reject an exception
   */
  async rejectException(
    id: string,
    decidedBy: string,
    reason: string
  ): Promise<ExceptionQueueItem | null> {
    return this.resolveException(id, {
      action: 'reject',
      decidedBy,
      decidedAt: new Date().toISOString(),
      reason,
    })
  }

  /**
   * Modify and approve an exception
   */
  async modifyException(
    id: string,
    decidedBy: string,
    modifiedPayload: unknown,
    reason?: string
  ): Promise<ExceptionQueueItem | null> {
    return this.resolveException(id, {
      action: 'modify',
      decidedBy,
      decidedAt: new Date().toISOString(),
      modifiedPayload,
      reason,
    })
  }

  /**
   * Resolve an exception with a decision
   */
  private async resolveException(
    id: string,
    decision: ExceptionDecision
  ): Promise<ExceptionQueueItem | null> {
    const now = new Date().toISOString()
    const statusMap: Record<DecisionAction, ExceptionStatus> = {
      approve: 'approved',
      reject: 'rejected',
      modify: 'modified',
    }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('exception_queue')
          .update({
            status: statusMap[decision.action],
            decision: decision,
            resolved_at: now,
          })
          .eq('id', id)
          .select()
          .single()

        if (error) throw error
        if (data) {
          const item = this.mapFromDb(data)
          this.inMemoryQueue.set(id, item)
          this.notifyListeners()

          // Log exception resolution
          exceptionLogger.info('Exception resolved', {
            exceptionId: id,
            action: decision.action,
            decidedBy: decision.decidedBy,
            newStatus: item.status,
            exceptionType: item.exceptionType
          })

          return item
        }
      } catch (error) {
        exceptionLogger.error('Failed to resolve exception in Supabase', error, { exceptionId: id })
      }
    }

    // Fall back to in-memory
    const item = this.inMemoryQueue.get(id)
    if (item) {
      item.status = statusMap[decision.action]
      item.decision = decision
      item.resolvedAt = now
      item.updatedAt = now
      this.notifyListeners()

      // Log exception resolution
      exceptionLogger.info('Exception resolved', {
        exceptionId: id,
        action: decision.action,
        decidedBy: decision.decidedBy,
        newStatus: item.status,
        exceptionType: item.exceptionType
      })

      return item
    }

    exceptionLogger.warn('Exception not found for resolution', { exceptionId: id })
    return null
  }

  /**
   * Get exception statistics for a user
   */
  async getStats(userId: string): Promise<ExceptionStats> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .rpc('get_exception_stats', { p_user_id: userId })
          .single()

        if (error) throw error
        if (data) {
          const statsData = data as {
            total_pending?: number
            immediate_count?: number
            today_count?: number
            flexible_count?: number
            resolved_today?: number
            avg_resolution_time_hours?: number
          }
          return {
            totalPending: Number(statsData.total_pending) || 0,
            immediateCount: Number(statsData.immediate_count) || 0,
            todayCount: Number(statsData.today_count) || 0,
            flexibleCount: Number(statsData.flexible_count) || 0,
            resolvedToday: Number(statsData.resolved_today) || 0,
            avgResolutionTimeHours: statsData.avg_resolution_time_hours ?? null,
          }
        }
      } catch (error) {
        console.warn('[ExceptionQueue] Failed to get stats:', error)
      }
    }

    // Fall back to in-memory calculation
    const items = Array.from(this.inMemoryQueue.values())
      .filter(item => item.userId === userId)

    const pending = items.filter(item => item.status === 'pending')
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return {
      totalPending: pending.length,
      immediateCount: pending.filter(item => item.urgency === 'immediate').length,
      todayCount: pending.filter(item => item.urgency === 'today').length,
      flexibleCount: pending.filter(item => item.urgency === 'flexible').length,
      resolvedToday: items.filter(
        item => item.resolvedAt && new Date(item.resolvedAt) >= today
      ).length,
      avgResolutionTimeHours: null,
    }
  }

  // ========================================
  // Workflow Integration
  // ========================================

  /**
   * Create an exception from a workflow step
   */
  async createFromWorkflowStep(
    step: WorkflowStep,
    execution: ExecutionState,
    params: {
      userId: string
      projectId?: string
      workflowName: string
      exceptionType: ExceptionType
      title: string
      titleAr?: string
      description: string
      descriptionAr?: string
      aiConfidence?: number
      estimatedValue?: number
      currency?: string
      affectedRecords?: number
      proposedAction?: ProposedAction
    }
  ): Promise<ExceptionQueueItem> {
    const context: ExceptionContext = {
      workflowName: params.workflowName,
      stepName: step.name,
      aiConfidence: params.aiConfidence,
      estimatedValue: params.estimatedValue,
      currency: params.currency,
      affectedRecords: params.affectedRecords,
      originalInput: step.config,
    }

    return this.createException({
      userId: params.userId,
      projectId: params.projectId,
      workflowId: execution.workflowId,
      executionId: execution.executionId,
      stepId: step.id,
      exceptionType: params.exceptionType,
      title: params.title,
      titleAr: params.titleAr,
      description: params.description,
      descriptionAr: params.descriptionAr,
      context,
      proposedAction: params.proposedAction,
    })
  }

  /**
   * Create an exception for uncertain AI decision (positional args)
   */
  async createUncertainDecisionException(
    userId: string,
    workflowName: string,
    stepName: string,
    confidence: number,
    aiReasoning: string,
    alternatives: ExceptionContext['alternatives'],
    proposedAction?: ProposedAction
  ): Promise<ExceptionQueueItem>

  /**
   * Create an exception for uncertain AI decision (object args)
   */
  async createUncertainDecisionException(params: {
    userId: string
    workflowId?: string
    executionId?: string
    stepId?: string
    workflowName: string
    stepName: string
    aiConfidence: number
    aiReasoning: string
    alternatives: Array<{ id: string; label: string; description?: string }>
    proposedAction: { type: string; payload: unknown; estimatedImpact: string; reversible: boolean }
    urgency?: 'immediate' | 'today' | 'flexible'
  }): Promise<ExceptionQueueItem>

  async createUncertainDecisionException(
    userIdOrParams: string | {
      userId: string
      workflowId?: string
      executionId?: string
      stepId?: string
      workflowName: string
      stepName: string
      aiConfidence: number
      aiReasoning: string
      alternatives: Array<{ id: string; label: string; description?: string }>
      proposedAction: { type: string; payload: unknown; estimatedImpact: string; reversible: boolean }
      urgency?: 'immediate' | 'today' | 'flexible'
    },
    workflowName?: string,
    stepName?: string,
    confidence?: number,
    aiReasoning?: string,
    alternatives?: ExceptionContext['alternatives'],
    proposedAction?: ProposedAction
  ): Promise<ExceptionQueueItem> {
    // Handle object-based call
    if (typeof userIdOrParams === 'object') {
      const params = userIdOrParams
      const confidencePercent = Math.round(params.aiConfidence * 100)

      return this.createException({
        userId: params.userId,
        workflowId: params.workflowId,
        executionId: params.executionId,
        stepId: params.stepId,
        exceptionType: 'uncertain_decision',
        urgency: params.urgency,
        title: `AI Decision Needs Review (${confidencePercent}% confidence)`,
        titleAr: `قرار الذكاء الاصطناعي يحتاج مراجعة (${confidencePercent}% ثقة)`,
        description: `The AI is not confident enough to proceed automatically with "${params.stepName}". Please review and confirm the action.`,
        descriptionAr: `الذكاء الاصطناعي غير واثق بما يكفي للمتابعة تلقائياً في "${params.stepName}". يرجى المراجعة وتأكيد الإجراء.`,
        context: {
          workflowName: params.workflowName,
          stepName: params.stepName,
          aiConfidence: params.aiConfidence,
          aiReasoning: params.aiReasoning,
          alternatives: params.alternatives,
        },
        proposedAction: params.proposedAction,
      })
    }

    // Handle positional args call (original)
    const confidencePercent = Math.round(confidence! * 100)

    return this.createException({
      userId: userIdOrParams,
      exceptionType: 'uncertain_decision',
      title: `AI Decision Needs Review (${confidencePercent}% confidence)`,
      titleAr: `قرار الذكاء الاصطناعي يحتاج مراجعة (${confidencePercent}% ثقة)`,
      description: `The AI is not confident enough to proceed automatically with "${stepName}". Please review and confirm the action.`,
      descriptionAr: `الذكاء الاصطناعي غير واثق بما يكفي للمتابعة تلقائياً في "${stepName}". يرجى المراجعة وتأكيد الإجراء.`,
      context: {
        workflowName: workflowName!,
        stepName: stepName!,
        aiConfidence: confidence!,
        aiReasoning: aiReasoning!,
        alternatives,
      },
      proposedAction,
    })
  }

  /**
   * Create an exception for high-value action (positional args)
   */
  async createHighValueException(
    userId: string,
    workflowName: string,
    stepName: string,
    actionType: string,
    valueUsd: number,
    currency?: string,
    proposedAction?: ProposedAction
  ): Promise<ExceptionQueueItem>

  /**
   * Create an exception for high-value action (object args)
   */
  async createHighValueException(params: {
    userId: string
    workflowId?: string
    executionId?: string
    stepId?: string
    workflowName: string
    stepName: string
    actionType: string
    estimatedValue: number
    currency?: string
    affectedRecords?: number
    proposedAction: { type: string; payload: unknown; estimatedImpact: string; reversible: boolean }
    urgency?: 'immediate' | 'today' | 'flexible'
  }): Promise<ExceptionQueueItem>

  async createHighValueException(
    userIdOrParams: string | {
      userId: string
      workflowId?: string
      executionId?: string
      stepId?: string
      workflowName: string
      stepName: string
      actionType: string
      estimatedValue: number
      currency?: string
      affectedRecords?: number
      proposedAction: { type: string; payload: unknown; estimatedImpact: string; reversible: boolean }
      urgency?: 'immediate' | 'today' | 'flexible'
    },
    workflowName?: string,
    stepName?: string,
    actionType?: string,
    valueUsd?: number,
    currency: string = 'USD',
    proposedAction?: ProposedAction
  ): Promise<ExceptionQueueItem> {
    // Handle object-based call
    if (typeof userIdOrParams === 'object') {
      const params = userIdOrParams
      const curr = params.currency || 'USD'
      const formattedValue = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: curr,
      }).format(params.estimatedValue)

      let description = `A ${params.actionType} of ${formattedValue} requires your explicit approval before proceeding.`
      let descriptionAr = `إجراء ${params.actionType} بقيمة ${formattedValue} يتطلب موافقتك الصريحة قبل المتابعة.`

      if (params.affectedRecords && params.affectedRecords > 1) {
        description += ` This affects ${params.affectedRecords} records.`
        descriptionAr += ` يؤثر هذا على ${params.affectedRecords} سجلات.`
      }

      return this.createException({
        userId: params.userId,
        workflowId: params.workflowId,
        executionId: params.executionId,
        stepId: params.stepId,
        exceptionType: 'high_value_action',
        urgency: params.urgency || 'today',
        title: `High-Value Action Requires Approval: ${formattedValue}`,
        titleAr: `إجراء عالي القيمة يتطلب موافقة: ${formattedValue}`,
        description,
        descriptionAr,
        context: {
          workflowName: params.workflowName,
          stepName: params.stepName,
          actionType: params.actionType,
          estimatedValue: params.estimatedValue,
          currency: curr,
          affectedRecords: params.affectedRecords,
        },
        proposedAction: params.proposedAction,
      })
    }

    // Handle positional args call (original)
    const formattedValue = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(valueUsd!)

    return this.createException({
      userId: userIdOrParams,
      exceptionType: 'high_value_action',
      urgency: 'today',
      title: `High-Value Action Requires Approval: ${formattedValue}`,
      titleAr: `إجراء عالي القيمة يتطلب موافقة: ${formattedValue}`,
      description: `A ${actionType} of ${formattedValue} requires your explicit approval before proceeding.`,
      descriptionAr: `إجراء ${actionType} بقيمة ${formattedValue} يتطلب موافقتك الصريحة قبل المتابعة.`,
      context: {
        workflowName: workflowName!,
        stepName: stepName!,
        actionType: actionType!,
        estimatedValue: valueUsd!,
        currency,
      },
      proposedAction,
    })
  }

  /**
   * Create an exception for missing information (positional args)
   */
  async createMissingInfoException(
    userId: string,
    workflowName: string,
    stepName: string,
    requiredFields: ExceptionContext['requiredFields'],
    originalInput?: unknown
  ): Promise<ExceptionQueueItem>

  /**
   * Create an exception for missing information (object args)
   */
  async createMissingInfoException(params: {
    userId: string
    workflowId?: string
    executionId?: string
    stepId?: string
    workflowName: string
    stepName: string
    requiredFields: Array<{ name: string; type: string; required: boolean; description?: string }>
    originalInput?: unknown
    urgency?: 'immediate' | 'today' | 'flexible'
  }): Promise<ExceptionQueueItem>

  async createMissingInfoException(
    userIdOrParams: string | {
      userId: string
      workflowId?: string
      executionId?: string
      stepId?: string
      workflowName: string
      stepName: string
      requiredFields: Array<{ name: string; type: string; required: boolean; description?: string }>
      originalInput?: unknown
      urgency?: 'immediate' | 'today' | 'flexible'
    },
    workflowName?: string,
    stepName?: string,
    requiredFields?: ExceptionContext['requiredFields'],
    originalInput?: unknown
  ): Promise<ExceptionQueueItem> {
    // Handle object-based call
    if (typeof userIdOrParams === 'object') {
      const params = userIdOrParams
      const fieldNames = params.requiredFields?.map(f => f.name).join(', ') || 'information'

      return this.createException({
        userId: params.userId,
        workflowId: params.workflowId,
        executionId: params.executionId,
        stepId: params.stepId,
        exceptionType: 'missing_information',
        urgency: params.urgency || 'today',
        title: `Missing Information Required`,
        titleAr: `معلومات مطلوبة مفقودة`,
        description: `Cannot proceed with "${params.stepName}" without: ${fieldNames}. Please provide the missing information.`,
        descriptionAr: `لا يمكن المتابعة في "${params.stepName}" بدون: ${fieldNames}. يرجى تقديم المعلومات المفقودة.`,
        context: {
          workflowName: params.workflowName,
          stepName: params.stepName,
          requiredFields: params.requiredFields,
          originalInput: params.originalInput,
        },
      })
    }

    // Handle positional args call (original)
    const fieldNames = requiredFields?.map(f => f.name).join(', ') || 'information'

    return this.createException({
      userId: userIdOrParams,
      exceptionType: 'missing_information',
      urgency: 'today',
      title: `Missing Information Required`,
      titleAr: `معلومات مطلوبة مفقودة`,
      description: `Cannot proceed with "${stepName}" without: ${fieldNames}. Please provide the missing information.`,
      descriptionAr: `لا يمكن المتابعة في "${stepName}" بدون: ${fieldNames}. يرجى تقديم المعلومات المفقودة.`,
      context: {
        workflowName: workflowName!,
        stepName: stepName!,
        requiredFields,
        originalInput,
      },
    })
  }

  /**
   * Create an exception for service error (positional args)
   */
  async createServiceErrorException(
    userId: string,
    workflowName: string,
    stepName: string,
    service: string,
    errorCode: string,
    errorMessage: string,
    alternatives?: ExceptionContext['alternatives']
  ): Promise<ExceptionQueueItem>

  /**
   * Create an exception for service error (object args)
   */
  async createServiceErrorException(params: {
    userId: string
    workflowId?: string
    executionId?: string
    stepId?: string
    workflowName: string
    stepName: string
    service: string
    errorCode: string
    errorMessage: string
    retryable: boolean
    alternatives?: Array<{ id: string; label: string; description?: string }>
    urgency?: 'immediate' | 'today' | 'flexible'
  }): Promise<ExceptionQueueItem>

  async createServiceErrorException(
    userIdOrParams: string | {
      userId: string
      workflowId?: string
      executionId?: string
      stepId?: string
      workflowName: string
      stepName: string
      service: string
      errorCode: string
      errorMessage: string
      retryable: boolean
      alternatives?: Array<{ id: string; label: string; description?: string }>
      urgency?: 'immediate' | 'today' | 'flexible'
    },
    workflowName?: string,
    stepName?: string,
    service?: string,
    errorCode?: string,
    errorMessage?: string,
    alternatives?: ExceptionContext['alternatives']
  ): Promise<ExceptionQueueItem> {
    // Handle object-based call
    if (typeof userIdOrParams === 'object') {
      const params = userIdOrParams
      let description = `The ${params.service} service encountered an error: ${params.errorMessage}. Please review and decide how to proceed.`
      let descriptionAr = `واجهت خدمة ${params.service} خطأ: ${params.errorMessage}. يرجى المراجعة وتحديد كيفية المتابعة.`

      if (params.retryable) {
        description += ' This error may be resolved by retrying.'
        descriptionAr += ' قد يتم حل هذا الخطأ بإعادة المحاولة.'
      }

      return this.createException({
        userId: params.userId,
        workflowId: params.workflowId,
        executionId: params.executionId,
        stepId: params.stepId,
        exceptionType: 'service_error',
        urgency: params.urgency || 'immediate',
        title: `Service Error: ${params.service}`,
        titleAr: `خطأ في الخدمة: ${params.service}`,
        description,
        descriptionAr,
        context: {
          workflowName: params.workflowName,
          stepName: params.stepName,
          serviceError: {
            service: params.service,
            errorCode: params.errorCode,
            message: params.errorMessage,
          },
          alternatives: params.alternatives,
        },
      })
    }

    // Handle positional args call (original)
    return this.createException({
      userId: userIdOrParams,
      exceptionType: 'service_error',
      urgency: 'immediate',
      title: `Service Error: ${service}`,
      titleAr: `خطأ في الخدمة: ${service}`,
      description: `The ${service} service encountered an error: ${errorMessage}. Please review and decide how to proceed.`,
      descriptionAr: `واجهت خدمة ${service} خطأ: ${errorMessage}. يرجى المراجعة وتحديد كيفية المتابعة.`,
      context: {
        workflowName: workflowName!,
        stepName: stepName!,
        serviceError: {
          service: service!,
          errorCode: errorCode!,
          message: errorMessage!,
        },
        alternatives,
      },
    })
  }

  // ========================================
  // Subscription
  // ========================================

  /**
   * Subscribe to queue changes
   * @param userId - User ID to filter exceptions for (optional - if not provided, returns all)
   * @param callback - Callback function receiving filtered exceptions
   */
  subscribe(userId: string, callback: (items: ExceptionQueueItem[]) => void): () => void
  subscribe(callback: (items: ExceptionQueueItem[]) => void): () => void
  subscribe(
    userIdOrCallback: string | ((items: ExceptionQueueItem[]) => void),
    maybeCallback?: (items: ExceptionQueueItem[]) => void
  ): () => void {
    const userId = typeof userIdOrCallback === 'string' ? userIdOrCallback : undefined
    const callback = typeof userIdOrCallback === 'function' ? userIdOrCallback : maybeCallback!

    // Create filtered callback
    const filteredCallback = (items: ExceptionQueueItem[]) => {
      const filtered = userId ? items.filter(item => item.userId === userId) : items
      callback(filtered)
    }

    this.listeners.add(filteredCallback)
    return () => {
      this.listeners.delete(filteredCallback)
    }
  }

  /**
   * Get exception statistics for a user (alias for getStats)
   */
  async getExceptionStats(userId: string): Promise<ExceptionStats> {
    return this.getStats(userId)
  }

  private notifyListeners(): void {
    const items = Array.from(this.inMemoryQueue.values())
      .filter(item => ['pending', 'in_review'].includes(item.status))
    this.listeners.forEach(callback => callback(items))
  }

  // ========================================
  // Database Mapping
  // ========================================

  private mapFromDb(data: Record<string, unknown>): ExceptionQueueItem {
    return {
      id: data.id as string,
      createdAt: data.created_at as string,
      updatedAt: data.updated_at as string,
      userId: data.user_id as string,
      projectId: data.project_id as string | undefined,
      workflowId: data.workflow_id as string | undefined,
      executionId: data.execution_id as string | undefined,
      stepId: data.step_id as string | undefined,
      exceptionType: data.exception_type as ExceptionType,
      urgency: data.urgency as ExceptionUrgency,
      status: data.status as ExceptionStatus,
      title: data.title as string,
      titleAr: data.title_ar as string | undefined,
      description: data.description as string,
      descriptionAr: data.description_ar as string | undefined,
      context: (data.context as ExceptionContext) || {},
      proposedAction: data.proposed_action as ProposedAction | undefined,
      decision: data.decision as ExceptionDecision | undefined,
      expiresAt: data.expires_at as string | undefined,
      reviewedAt: data.reviewed_at as string | undefined,
      resolvedAt: data.resolved_at as string | undefined,
      tags: (data.tags as string[]) || [],
      metadata: (data.metadata as Record<string, unknown>) || {},
    }
  }
}

// ========================================
// Singleton Export
// ========================================

export const exceptionQueue = new ExceptionQueueManager()
