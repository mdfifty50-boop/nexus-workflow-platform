/**
 * NexusAIService - Real Claude AI integration for Nexus
 *
 * This service calls the backend /api/chat route which uses real Claude AI.
 * Claude handles natural conversation, while we use pattern detection to
 * determine when to generate workflows.
 *
 * HYBRID APPROACH:
 * - Claude AI = Natural conversation, understanding, and reasoning
 * - Template system = Reliable workflow structure generation
 *
 * Updated: Trigger HMR refresh
 */

import { EMBEDDED_TOOLS, type GeneratedWorkflow } from './SmartWorkflowEngine'

// Message format for Claude API
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// Missing info item for confidence-based execution
export interface MissingInfoItem {
  question: string
  options: string[]
  field: string
}

// Custom integration info for unsupported apps
export interface CustomIntegrationInfo {
  appName: string
  displayName: string
  apiDocsUrl: string
  apiKeyUrl?: string
  steps: string[]
  keyHint: string
  category?: string
}

// Clarifying question for pre-generation phase
export interface ClarifyingQuestion {
  question: string
  options: string[]
  field: string
}

// Response from the AI service
export interface NexusAIResponse {
  text: string
  shouldGenerateWorkflow: boolean
  workflowSpec?: WorkflowSpec
  suggestedQuestions?: string[]
  intent?: string  // 'greeting' | 'clarifying' | 'workflow' | 'question'
  confidence?: number
  assumptions?: string[]  // What defaults were assumed
  missingInfo?: MissingInfoItem[]  // Questions to increase confidence (post-generation)
  clarifyingQuestions?: ClarifyingQuestion[]  // Questions to ask BEFORE generating (pre-generation)
  refiningWorkflowId?: string  // If set, update existing workflow instead of creating new
  customIntegrations?: CustomIntegrationInfo[]  // Unsupported apps that can use API keys
}

// Workflow specification extracted from Claude's response
export interface WorkflowSpec {
  name: string
  description: string
  steps: WorkflowStep[]
  requiredIntegrations: string[]
  estimatedTimeSaved: string
}

export interface WorkflowStep {
  id: string
  name: string
  description: string
  tool: string
  type: 'trigger' | 'action' | 'condition' | 'ai'
  config?: Record<string, any>
}

class NexusAIService {
  private conversationHistory: ChatMessage[] = []

  /**
   * Send a message to Claude and get a response
   */
  async chat(userMessage: string, _context?: { persona?: string }): Promise<NexusAIResponse> {
    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage
    })

    // Keep history manageable (last 10 messages)
    if (this.conversationHistory.length > 10) {
      this.conversationHistory = this.conversationHistory.slice(-10)
    }

    try {
      console.log('[NexusAIService] Calling Claude AI via /api/chat...')

      // Call the backend chat API via Vite proxy (which uses real Claude)
      // Using relative URL so Vite proxy handles it properly
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: this.conversationHistory,
          agentId: 'nexus', // Use the Nexus agent personality
          model: 'claude-sonnet-4-20250514',
          maxTokens: 4096
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'API call failed')
      }

      // Parse Claude's response
      const aiResponse = this.parseResponse(result.output)

      // Add custom integrations from the API response (detected unsupported apps)
      if (result.customIntegrations && result.customIntegrations.length > 0) {
        aiResponse.customIntegrations = result.customIntegrations
        console.log('[NexusAIService] Custom integrations available:', result.customIntegrations.map((c: CustomIntegrationInfo) => c.displayName))
      }

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: aiResponse.text
      })

      return aiResponse

    } catch (error) {
      console.error('[NexusAIService] Error calling Claude:', error)

      // Fallback response
      return {
        text: "I'm having trouble connecting right now. Let me try a simpler approach - what would you like to automate today?",
        shouldGenerateWorkflow: false,
        intent: 'error',
        confidence: 0
      }
    }
  }

  /**
   * Parse Claude's JSON response into our format
   * CRITICAL: This must NEVER return raw JSON as text - always extract the message field
   */
  private parseResponse(output: string): NexusAIResponse {
    try {
      // Try to extract JSON from the response
      const jsonMatch = output.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])

        // CRITICAL: Extract clean message, NEVER return raw JSON to user
        const cleanMessage = parsed.message ||
                            parsed.text ||
                            parsed.response ||
                            parsed.content ||
                            "I understand. How can I help you with workflow automation?"

        return {
          text: cleanMessage,
          shouldGenerateWorkflow: parsed.shouldGenerateWorkflow || false,
          workflowSpec: parsed.workflowSpec,
          suggestedQuestions: parsed.suggestedQuestions,
          intent: parsed.intent,
          confidence: parsed.confidence,
          assumptions: parsed.assumptions,
          missingInfo: parsed.missingInfo,
          clarifyingQuestions: parsed.clarifyingQuestions,  // CRITICAL: Extract for two-phase workflow generation
          refiningWorkflowId: parsed.refiningWorkflowId,    // For workflow refinement mode
          customIntegrations: parsed.customIntegrations
        }
      }
    } catch (e) {
      console.warn('[NexusAIService] Failed to parse JSON response, using raw text')
    }

    // If JSON parsing fails but output looks like JSON, try to extract message anyway
    if (output.trim().startsWith('{')) {
      console.warn('[NexusAIService] Output looks like JSON but parsing failed, attempting recovery')
      // Try regex extraction of message field
      const messageMatch = output.match(/"message"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/i)
      if (messageMatch) {
        // Unescape the JSON string
        const extractedMessage = messageMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n')
        return {
          text: extractedMessage,
          shouldGenerateWorkflow: false,
          intent: 'recovered'
        }
      }
      // Fallback: Remove all JSON structure characters to get something readable
      return {
        text: "I'm here to help you automate workflows. What would you like to create?",
        shouldGenerateWorkflow: false,
        intent: 'fallback'
      }
    }

    // If it's plain text, return as-is
    return {
      text: output,
      shouldGenerateWorkflow: false
    }
  }

  /**
   * Convert workflow spec to GeneratedWorkflow format
   */
  specToWorkflow(spec: WorkflowSpec): GeneratedWorkflow {
    const nodes = spec.steps.map((step, index) => ({
      id: step.id || `node_${index + 1}`,
      type: step.type || 'action',
      tool: step.tool,
      name: step.name,
      description: step.description,
      toolIcon: EMBEDDED_TOOLS.find(t => t.id === step.tool)?.icon || '⚡',
      config: step.config || {},
      position: { x: 100, y: 100 + (index * 120) }
    }))

    // Create connections between sequential nodes
    const connections = nodes.slice(0, -1).map((node, index) => ({
      from: node.id,
      to: nodes[index + 1].id
    }))

    return {
      id: `workflow-${Date.now()}`,
      name: spec.name,
      description: spec.description,
      nodes,
      connections,
      requiredIntegrations: spec.requiredIntegrations,
      estimatedTimeSaved: spec.estimatedTimeSaved,
      complexity: nodes.length <= 3 ? 'simple' : nodes.length <= 6 ? 'medium' : 'complex'
    }
  }

  /**
   * Clear conversation history (for new chat)
   */
  clearHistory() {
    this.conversationHistory = []
  }

  /**
   * Get current conversation history
   */
  getHistory(): ChatMessage[] {
    return [...this.conversationHistory]
  }
}

// Export singleton instance
export const nexusAIService = new NexusAIService()
export default nexusAIService
