/**
 * WhatsApp Business Trigger Service
 *
 * Handles incoming WhatsApp Business messages and triggers workflows based on keywords.
 * Uses AiSensy for legitimate WhatsApp Business API access.
 *
 * Flow:
 * 1. User sends message to their WhatsApp Business number
 * 2. AiSensy receives the message and sends webhook to Nexus
 * 3. This service matches keywords to registered triggers
 * 4. Workflow is executed via WorkflowOrchestrator
 * 5. Response is sent back to user via AiSensy API
 */

import { aiSensyService, IncomingMessage } from './AiSensyService.js'
import { workflowService } from './workflowService.js'
import { workflowOrchestrator, WorkflowDefinition } from './WorkflowOrchestrator.js'

export interface WhatsAppBusinessTrigger {
  id: string
  userId: string
  keyword: string
  workflowId: string
  workflowName: string
  isActive: boolean
  createdAt: Date
  lastTriggered?: Date
  triggerCount: number
  // Template to use for response
  responseTemplate?: string
}

// In-memory storage (replace with database in production)
const triggers: Map<string, WhatsAppBusinessTrigger[]> = new Map()

// Track active sessions for 24h reply window
const activeSessions: Map<string, { lastMessageAt: Date; from: string }> = new Map()

class WhatsAppBusinessTriggerService {
  constructor() {
    // Register message handler with AiSensy service
    aiSensyService.onMessage(this.handleIncomingMessage.bind(this))
    console.log('📱 WhatsApp Business Trigger Service initialized')
  }

  /**
   * Handle incoming WhatsApp Business message
   */
  private async handleIncomingMessage(userId: string, message: IncomingMessage): Promise<void> {
    console.log(`📱 WhatsApp Business: Message for ${userId} from ${message.from}: "${message.body.substring(0, 50)}..."`)

    // Track session for 24h reply window
    const sessionKey = `${userId}:${message.from}`
    activeSessions.set(sessionKey, {
      lastMessageAt: new Date(),
      from: message.from
    })

    // Get triggers for this user
    const userTriggers = triggers.get(userId) || []
    if (userTriggers.length === 0) {
      console.log(`📱 No triggers configured for user ${userId}`)
      return
    }

    // Extract keyword and parameters from message
    const { keyword, params } = this.parseMessage(message.body)

    // Find matching trigger
    const matchingTrigger = userTriggers.find(
      t => t.isActive && t.keyword.toLowerCase() === keyword.toLowerCase()
    )

    if (!matchingTrigger) {
      console.log(`📱 No matching trigger for keyword: ${keyword}`)
      return
    }

    console.log(`📱 Matched trigger: ${matchingTrigger.keyword} → ${matchingTrigger.workflowName}`)

    // Execute workflow
    try {
      // Send acknowledgment (within 24h session window, we can use free-form messages)
      await aiSensyService.sendQuickReply(
        userId,
        message.from,
        `⏳ Running: ${matchingTrigger.workflowName}\n\nI'll send you the results when it's done.`
      )

      await this.executeWorkflow(userId, matchingTrigger, params, message)

      // Update trigger stats
      matchingTrigger.lastTriggered = new Date()
      matchingTrigger.triggerCount++

    } catch (error: any) {
      console.error(`📱 Failed to execute workflow:`, error)

      // Send error message
      await aiSensyService.sendQuickReply(
        userId,
        message.from,
        `❌ Failed to run ${matchingTrigger.workflowName}\n\nError: ${error.message}`
      )
    }
  }

  /**
   * Parse message to extract keyword and parameters
   */
  private parseMessage(body: string): { keyword: string; params: string[] } {
    const trimmed = body.trim()
    const normalized = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed
    const words = normalized.split(/\s+/)

    return {
      keyword: words[0] || '',
      params: words.slice(1)
    }
  }

  /**
   * Execute a workflow based on trigger
   */
  private async executeWorkflow(
    userId: string,
    trigger: WhatsAppBusinessTrigger,
    params: string[],
    originalMessage: IncomingMessage
  ): Promise<void> {
    console.log(`📱 Executing workflow ${trigger.workflowId} for user ${userId}`)

    try {
      // Get workflow from database/storage
      const storedWorkflow = await workflowService.getWorkflowById(trigger.workflowId, userId)

      if (!storedWorkflow) {
        throw new Error(`Workflow not found: ${trigger.workflowId}`)
      }

      // Convert stored workflow to WorkflowDefinition format
      const workflowConfig = storedWorkflow.config || {}
      const workflowSpec = workflowConfig.workflowSpec || workflowConfig

      const workflowDefinition: WorkflowDefinition = {
        id: trigger.workflowId,
        name: trigger.workflowName,
        description: storedWorkflow.description || `WhatsApp-triggered: ${trigger.keyword}`,
        steps: (workflowSpec.steps || []).map((step: any, index: number) => ({
          id: step.id || `step_${index + 1}`,
          name: step.name || `Step ${index + 1}`,
          agent: step.tool || 'default',
          task: step.action || step.type || 'execute',
          tool: step.tool,
          config: step.config || {}
        })),
        requiredIntegrations: workflowSpec.requiredIntegrations || []
      }

      // Prepare inputs from WhatsApp context
      const inputs = {
        source: 'whatsapp_business',
        userId,
        params,
        fromNumber: originalMessage.from,
        fromName: originalMessage.fromName,
        messageBody: originalMessage.body,
        timestamp: originalMessage.timestamp,
        messageType: originalMessage.type
      }

      // Execute the workflow
      const executionState = await workflowOrchestrator.executeWorkflow(
        workflowDefinition,
        inputs,
        { autonomyLevel: 'autonomous' }
      )

      // Send result summary back to WhatsApp
      const successfulSteps = Array.from(executionState.stepResults.values())
        .filter(r => r.status === 'completed').length
      const totalSteps = workflowDefinition.steps.length
      const durationMs = executionState.completedAt
        ? executionState.completedAt.getTime() - executionState.startedAt.getTime()
        : 0

      await aiSensyService.sendQuickReply(
        userId,
        originalMessage.from,
        `📊 *${trigger.workflowName}* completed!\n\n` +
        `✅ Steps: ${successfulSteps}/${totalSteps}\n` +
        `💰 Cost: $${executionState.totalCost.toFixed(4)}\n` +
        `⏱️ Time: ${(durationMs / 1000).toFixed(1)}s\n\n` +
        `Status: ${executionState.status}`
      )
    } catch (error: any) {
      console.error(`📱 Workflow execution failed:`, error)
      throw error
    }
  }

  // ============================================
  // Trigger Management
  // ============================================

  /**
   * Create a new trigger
   */
  createTrigger(
    userId: string,
    keyword: string,
    workflowId: string,
    workflowName: string,
    responseTemplate?: string
  ): WhatsAppBusinessTrigger {
    const trigger: WhatsAppBusinessTrigger = {
      id: `trigger_${Date.now()}`,
      userId,
      keyword: keyword.toLowerCase(),
      workflowId,
      workflowName,
      isActive: true,
      createdAt: new Date(),
      triggerCount: 0,
      responseTemplate
    }

    const userTriggers = triggers.get(userId) || []
    userTriggers.push(trigger)
    triggers.set(userId, userTriggers)

    console.log(`📱 Created WhatsApp Business trigger: ${keyword} → ${workflowName} for user ${userId}`)
    return trigger
  }

  /**
   * Get all triggers for a user
   */
  getTriggers(userId: string): WhatsAppBusinessTrigger[] {
    return triggers.get(userId) || []
  }

  /**
   * Update a trigger
   */
  updateTrigger(
    userId: string,
    triggerId: string,
    updates: Partial<Pick<WhatsAppBusinessTrigger, 'keyword' | 'workflowId' | 'workflowName' | 'isActive' | 'responseTemplate'>>
  ): WhatsAppBusinessTrigger | null {
    const userTriggers = triggers.get(userId) || []
    const triggerIndex = userTriggers.findIndex(t => t.id === triggerId)

    if (triggerIndex === -1) return null

    userTriggers[triggerIndex] = {
      ...userTriggers[triggerIndex],
      ...updates,
      keyword: updates.keyword?.toLowerCase() || userTriggers[triggerIndex].keyword
    }

    triggers.set(userId, userTriggers)
    return userTriggers[triggerIndex]
  }

  /**
   * Delete a trigger
   */
  deleteTrigger(userId: string, triggerId: string): boolean {
    const userTriggers = triggers.get(userId) || []
    const filteredTriggers = userTriggers.filter(t => t.id !== triggerId)

    if (filteredTriggers.length === userTriggers.length) {
      return false
    }

    triggers.set(userId, filteredTriggers)
    return true
  }

  /**
   * Toggle trigger active state
   */
  toggleTrigger(userId: string, triggerId: string): WhatsAppBusinessTrigger | null {
    const userTriggers = triggers.get(userId) || []
    const trigger = userTriggers.find(t => t.id === triggerId)

    if (!trigger) return null

    trigger.isActive = !trigger.isActive
    return trigger
  }

  /**
   * Check if we're in a 24h session window with a contact
   */
  isInSessionWindow(userId: string, contactNumber: string): boolean {
    const sessionKey = `${userId}:${contactNumber}`
    const session = activeSessions.get(sessionKey)

    if (!session) return false

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    return session.lastMessageAt > twentyFourHoursAgo
  }

  /**
   * Get all active sessions for a user
   */
  getActiveSessions(userId: string): Array<{ contactNumber: string; lastMessageAt: Date }> {
    const sessions: Array<{ contactNumber: string; lastMessageAt: Date }> = []
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    for (const [key, session] of activeSessions) {
      if (key.startsWith(`${userId}:`) && session.lastMessageAt > twentyFourHoursAgo) {
        sessions.push({
          contactNumber: session.from,
          lastMessageAt: session.lastMessageAt
        })
      }
    }

    return sessions
  }
}

// Export singleton
export const whatsAppBusinessTriggerService = new WhatsAppBusinessTriggerService()
export default whatsAppBusinessTriggerService
