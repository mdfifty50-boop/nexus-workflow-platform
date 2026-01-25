/**
 * Workflow Generator - Intent to Executable Workflow
 *
 * Transforms parsed intents into executable workflow definitions with
 * proper step ordering, error handling, and service integration.
 *
 * Examples:
 * - FoodDeliveryIntent -> [SearchRestaurants, FilterByPrefs, ShowOptions, PlaceOrder, TrackDelivery]
 * - DocumentAnalysisIntent -> [UploadDoc, ExtractText, AnalyzeContent, GenerateSummary]
 */

import { apiClient } from '../api-client'
import type {
  ParsedIntent,
  GeneratedWorkflow,
  WorkflowStep,
  WorkflowStepConfig,
  IntegrationRequirement,
  ContextRequirement,
  RetryPolicy,
} from '../../types/workflow-execution'
import { serviceIntegrations } from './service-integrations'
import { contextManager, type UserContext } from './context-manager'
import { workflowLogger } from '../monitoring'

// ========================================
// Workflow Templates
// ========================================

interface WorkflowTemplate {
  category: string
  action: string
  name: string
  description: string
  steps: WorkflowStepTemplate[]
  requiredIntegrations: string[]
  requiredContext: ContextRequirement[]
}

interface WorkflowStepTemplate {
  id: string
  type: WorkflowStep['type']
  name: string
  description: string
  config: Partial<WorkflowStepConfig>
  dependsOn: string[]
  optional?: boolean
  condition?: string  // When to include this step
}

/**
 * Predefined workflow templates for common use cases
 */
const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  // ========================================
  // Food Delivery Workflows
  // ========================================
  {
    category: 'food_delivery',
    action: 'order',
    name: 'Food Delivery Order',
    description: 'Order food from a delivery service',
    requiredIntegrations: ['talabat', 'carriage', 'deliveroo'],
    requiredContext: [
      { key: 'defaultAddress', type: 'address', description: 'Delivery address', required: true, available: false },
      { key: 'defaultPayment', type: 'payment', description: 'Payment method', required: true, available: false },
    ],
    steps: [
      {
        id: 'analyze_request',
        type: 'ai_reasoning',
        name: 'Analyze Food Request',
        description: 'Understand what the user wants to order',
        config: {
          prompt: `Analyze the food order request and extract:
1. Cuisine type or specific dish
2. Dietary requirements or preferences
3. Budget constraints
4. Any specific restaurant mentioned
5. Delivery time preference

Return a JSON object with these fields: {cuisine, dish, dietary, budget, restaurant, deliveryTime}`,
          model: 'claude-3-5-haiku-20241022',
        },
        dependsOn: [],
      },
      {
        id: 'search_restaurants',
        type: 'api_call',
        name: 'Search Restaurants',
        description: 'Find restaurants matching criteria',
        config: {
          service: 'food_delivery',
          endpoint: '/restaurants/search',
          method: 'POST',
        },
        dependsOn: ['analyze_request'],
      },
      {
        id: 'filter_options',
        type: 'ai_reasoning',
        name: 'Filter and Rank Options',
        description: 'Apply user preferences and rank options',
        config: {
          prompt: `Given the restaurant search results and user preferences:
1. Filter out options that don't match dietary requirements
2. Sort by: delivery time, rating, price (based on priority)
3. Return top 3-5 recommendations with reasoning

Output format: {recommendations: [{name, cuisine, rating, deliveryTime, priceRange, reason}]}`,
        },
        dependsOn: ['search_restaurants'],
      },
      {
        id: 'show_options',
        type: 'user_confirmation',
        name: 'Present Options',
        description: 'Show options to user for selection',
        config: {
          message: 'Here are the best options based on your preferences:',
          autoApproveAfter: 0,  // Must wait for user
        },
        dependsOn: ['filter_options'],
      },
      {
        id: 'get_menu',
        type: 'api_call',
        name: 'Get Restaurant Menu',
        description: 'Fetch menu from selected restaurant',
        config: {
          service: 'food_delivery',
          endpoint: '/restaurants/{restaurantId}/menu',
          method: 'GET',
        },
        dependsOn: ['show_options'],
      },
      {
        id: 'suggest_items',
        type: 'ai_reasoning',
        name: 'Suggest Menu Items',
        description: 'AI suggests best items based on preferences',
        config: {
          prompt: `Based on the menu and user's original request:
1. Identify items that match what they asked for
2. Consider dietary restrictions
3. Balance the order (main + sides if appropriate)
4. Stay within budget

Output: {suggestedItems: [{id, name, price, reason}], totalEstimate: number}`,
        },
        dependsOn: ['get_menu'],
        optional: true,
      },
      {
        id: 'confirm_order',
        type: 'user_confirmation',
        name: 'Confirm Order',
        description: 'Final confirmation before placing order',
        config: {
          message: 'Please confirm your order:',
          autoApproveAfter: 60000,  // Auto-approve after 60 seconds
        },
        dependsOn: ['suggest_items'],
      },
      {
        id: 'place_order',
        type: 'api_call',
        name: 'Place Order',
        description: 'Submit the order to delivery service',
        config: {
          service: 'food_delivery',
          endpoint: '/orders',
          method: 'POST',
        },
        dependsOn: ['confirm_order'],
      },
      {
        id: 'notify_success',
        type: 'notification',
        name: 'Order Confirmation',
        description: 'Notify user of successful order',
        config: {
          notificationType: 'success',
          channels: ['app'],
        },
        dependsOn: ['place_order'],
      },
    ],
  },

  // ========================================
  // Document Analysis Workflows
  // ========================================
  {
    category: 'document_analysis',
    action: 'analyze',
    name: 'Document Analysis',
    description: 'Analyze and extract information from documents',
    requiredIntegrations: [],
    requiredContext: [],
    steps: [
      {
        id: 'receive_document',
        type: 'data_transform',
        name: 'Receive Document',
        description: 'Accept and validate the document',
        config: {
          transformOperations: [
            { type: 'pick', config: { fields: ['documentUrl', 'documentType', 'fileName'] } },
          ],
        },
        dependsOn: [],
      },
      {
        id: 'extract_text',
        type: 'ai_reasoning',
        name: 'Extract Document Content',
        description: 'Extract text and structure from document',
        config: {
          prompt: `Analyze this document and extract:
1. All text content with structure preserved
2. Any tables or structured data
3. Key entities (names, dates, amounts, locations)
4. Document type and purpose

Output as JSON: {text, tables: [{headers, rows}], entities: [{type, value}], documentType, summary}`,
          model: 'claude-sonnet-4-20250514',
        },
        dependsOn: ['receive_document'],
      },
      {
        id: 'analyze_content',
        type: 'ai_reasoning',
        name: 'Deep Analysis',
        description: 'Perform detailed analysis based on document type',
        config: {
          prompt: `Perform detailed analysis of this document:

For Travel Packages:
- Extract all prices and compare value
- List all included services
- Note any hidden fees or conditions
- Compare with typical market rates

For Contracts:
- Identify key terms and obligations
- Flag potential concerns
- Summarize rights and responsibilities

For Invoices/Receipts:
- Verify calculations
- Categorize expenses
- Flag any discrepancies

Output: {analysis, keyFindings: [], recommendations: [], warnings: []}`,
        },
        dependsOn: ['extract_text'],
      },
      {
        id: 'generate_summary',
        type: 'ai_reasoning',
        name: 'Generate Summary',
        description: 'Create human-readable summary',
        config: {
          prompt: `Create a concise, actionable summary of this document:
1. One-paragraph overview
2. Key points (bullet list)
3. Important numbers/dates
4. Recommended actions
5. Any concerns or warnings

Make it easy to understand and act upon.`,
        },
        dependsOn: ['analyze_content'],
      },
      {
        id: 'present_results',
        type: 'notification',
        name: 'Present Analysis',
        description: 'Show analysis results to user',
        config: {
          notificationType: 'info',
          channels: ['app'],
        },
        dependsOn: ['generate_summary'],
      },
    ],
  },

  // Travel Package Comparison (extends document_analysis)
  {
    category: 'document_analysis',
    action: 'compare',
    name: 'Travel Package Comparison',
    description: 'Compare multiple travel packages and recommend the best option',
    requiredIntegrations: [],
    requiredContext: [
      { key: 'travelPreferences', type: 'preference', description: 'User travel preferences', required: false, available: false },
    ],
    steps: [
      {
        id: 'receive_documents',
        type: 'data_transform',
        name: 'Receive Documents',
        description: 'Accept multiple documents for comparison',
        config: {},
        dependsOn: [],
      },
      {
        id: 'extract_all',
        type: 'parallel',
        name: 'Extract All Packages',
        description: 'Extract details from each package in parallel',
        config: {},
        dependsOn: ['receive_documents'],
      },
      {
        id: 'normalize_data',
        type: 'ai_reasoning',
        name: 'Normalize Package Data',
        description: 'Standardize data format for comparison',
        config: {
          prompt: `Normalize the travel package data into a standard format:
{
  packages: [{
    name: string,
    totalPrice: { amount: number, currency: string, perPerson: boolean },
    duration: { nights: number, days: number },
    destinations: string[],
    accommodation: { name: string, rating: number, type: string },
    flights: { included: boolean, airline: string, class: string },
    meals: { breakfast: boolean, lunch: boolean, dinner: boolean },
    activities: string[],
    inclusions: string[],
    exclusions: string[],
    cancellation: string,
    validity: { from: string, to: string }
  }]
}`,
        },
        dependsOn: ['extract_all'],
      },
      {
        id: 'compare_packages',
        type: 'ai_reasoning',
        name: 'Compare Packages',
        description: 'Deep comparison across multiple criteria',
        config: {
          prompt: `Compare the travel packages across these criteria:
1. Value for Money (price per day, included services)
2. Accommodation Quality (star rating, location, amenities)
3. Flight Convenience (airline reputation, layovers, timing)
4. Activity Coverage (variety, uniqueness)
5. Flexibility (cancellation, changes)
6. Hidden Costs (what's NOT included)

Score each package 1-10 on each criterion.
Calculate weighted overall score.
Identify best value, most luxurious, most flexible options.

Output: {comparison: [{package, scores, pros, cons}], rankings, recommendation}`,
        },
        dependsOn: ['normalize_data'],
      },
      {
        id: 'generate_recommendation',
        type: 'ai_reasoning',
        name: 'Generate Recommendation',
        description: 'Create final recommendation with reasoning',
        config: {
          prompt: `Based on the comparison, generate a clear recommendation:
1. Best Overall Choice with reasoning
2. Best Budget Option
3. Best Premium Option
4. Quick comparison table
5. Key things to watch out for
6. Questions to ask the provider

Make it actionable and easy to decide.`,
        },
        dependsOn: ['compare_packages'],
      },
      {
        id: 'present_comparison',
        type: 'notification',
        name: 'Present Comparison',
        description: 'Show comparison results to user',
        config: {
          notificationType: 'info',
          channels: ['app'],
        },
        dependsOn: ['generate_recommendation'],
      },
    ],
  },

  // ========================================
  // Communication Workflows
  // ========================================
  {
    category: 'communication',
    action: 'send',
    name: 'Send Message',
    description: 'Send a message via the appropriate channel',
    requiredIntegrations: ['whatsapp', 'email', 'sms'],
    requiredContext: [
      { key: 'contacts', type: 'custom', description: 'Contact list', required: false, available: false },
    ],
    steps: [
      {
        id: 'analyze_message',
        type: 'ai_reasoning',
        name: 'Analyze Message Intent',
        description: 'Understand what and to whom to send',
        config: {
          prompt: `Analyze the message request:
1. Who is the recipient? (name, contact info if provided)
2. What type of message? (formal/informal, urgent/casual)
3. What is the core content?
4. What channel is best? (email for formal, WhatsApp for casual)
5. Any attachments or special formatting needed?

Output: {recipient, messageType, content, channel, formality, urgency}`,
        },
        dependsOn: [],
      },
      {
        id: 'compose_message',
        type: 'ai_reasoning',
        name: 'Compose Message',
        description: 'Draft the message content',
        config: {
          prompt: `Compose the message with appropriate tone and formatting:
1. Match the requested formality level
2. Include all necessary information
3. Keep it concise but complete
4. Add appropriate greeting and sign-off
5. Suggest subject line if email

Output: {subject, body, signature}`,
        },
        dependsOn: ['analyze_message'],
      },
      {
        id: 'confirm_message',
        type: 'user_confirmation',
        name: 'Confirm Message',
        description: 'Review and approve message before sending',
        config: {
          message: 'Please review the message before sending:',
          autoApproveAfter: 0,
        },
        dependsOn: ['compose_message'],
      },
      {
        id: 'send_message',
        type: 'api_call',
        name: 'Send Message',
        description: 'Send via the chosen channel',
        config: {
          service: 'communication',
          method: 'POST',
        },
        dependsOn: ['confirm_message'],
      },
      {
        id: 'confirm_sent',
        type: 'notification',
        name: 'Delivery Confirmation',
        description: 'Confirm message was sent',
        config: {
          notificationType: 'success',
          channels: ['app'],
        },
        dependsOn: ['send_message'],
      },
    ],
  },
]

// ========================================
// Workflow Generator Class
// ========================================

export class WorkflowGenerator {
  private userContext: UserContext | null = null

  /**
   * Load user context for personalized workflow generation
   */
  async loadUserContext(userId: string): Promise<void> {
    this.userContext = await contextManager.loadContext(userId)
  }

  /**
   * Generate executable workflow from parsed intent
   */
  async generate(intent: ParsedIntent, options?: {
    userId?: string
    useAIGeneration?: boolean
    simplify?: boolean
  }): Promise<GeneratedWorkflow> {
    const { userId, useAIGeneration = true, simplify = false } = options || {}
    const generationStart = Date.now()

    workflowLogger.info('Workflow generation started', {
      category: intent.category,
      action: intent.action,
      confidence: intent.confidence,
      userId,
      useAIGeneration,
      simplify,
      rawInputLength: intent.rawInput?.length || 0
    })

    // Load user context
    if (userId) {
      await this.loadUserContext(userId)
      workflowLogger.debug('User context loaded', { userId })
    }

    // Step 1: Find matching template
    const template = this.findBestTemplate(intent)

    // Step 2: Generate workflow steps
    let steps: WorkflowStep[]
    if (template) {
      workflowLogger.info('Using template for workflow generation', {
        templateName: template.name,
        templateCategory: template.category,
        templateAction: template.action
      })
      steps = this.generateFromTemplate(template, intent)
    } else if (useAIGeneration) {
      workflowLogger.info('Using AI generation for workflow (no template match)', {
        category: intent.category,
        action: intent.action
      })
      steps = await this.generateWithAI(intent)
    } else {
      workflowLogger.info('Using basic workflow generation', {
        category: intent.category
      })
      steps = this.generateBasicWorkflow(intent)
    }

    // Step 3: Simplify if requested (fewer confirmation steps, auto-approve)
    if (simplify) {
      steps = this.simplifyWorkflow(steps)
    }

    // Step 4: Map API calls to Composio tool slugs for execution
    steps = this.mapToComposioTools(steps)

    // Step 5: Determine required integrations
    const requiredIntegrations = this.determineIntegrations(intent, steps)

    // Step 6: Determine context requirements
    const requiredContext = this.determineContextRequirements(intent, steps)

    // Step 7: Identify required OAuth scopes
    const requiredOAuthScopes = this.identifyOAuthScopes(steps)

    // Step 8: Validate executability
    const executionReadiness = this.validateExecutability(steps, requiredIntegrations, requiredContext)

    // Step 9: Estimate execution metrics
    const { estimatedDuration, estimatedCost } = this.estimateMetrics(steps)

    // Step 10: Inject context into steps
    steps = this.injectContext(steps, intent)

    const workflow: GeneratedWorkflow = {
      id: `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: this.generateWorkflowName(intent),
      description: this.generateWorkflowDescription(intent),
      intent,
      steps,
      startStepId: steps[0]?.id || '',
      requiredIntegrations,
      requiredContext,
      requiredOAuthScopes,
      executionReadiness,
      estimatedDuration,
      estimatedCost,
      status: executionReadiness.isExecutable ? 'ready' : 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const generationDuration = Date.now() - generationStart
    workflowLogger.timing('Workflow generation completed', generationDuration, {
      workflowId: workflow.id,
      workflowName: workflow.name,
      stepCount: steps.length,
      status: workflow.status,
      integrationCount: requiredIntegrations.length,
      contextRequirements: requiredContext.length,
      oauthScopesCount: Object.keys(requiredOAuthScopes).length,
      isExecutable: executionReadiness.isExecutable,
      missingRequirements: executionReadiness.missingRequirements.length,
      warnings: executionReadiness.warnings.length,
      estimatedDuration,
      estimatedCost
    })

    // Log execution readiness details if not executable
    if (!executionReadiness.isExecutable) {
      workflowLogger.warn('Workflow not executable - missing requirements', {
        workflowId: workflow.id,
        missingRequirements: executionReadiness.missingRequirements,
        warnings: executionReadiness.warnings
      })
    } else if (executionReadiness.warnings.length > 0) {
      workflowLogger.warn('Workflow has warnings', {
        workflowId: workflow.id,
        warnings: executionReadiness.warnings
      })
    }

    return workflow
  }

  /**
   * Find the best matching template for an intent
   */
  private findBestTemplate(intent: ParsedIntent): WorkflowTemplate | null {
    // Exact match on category and action
    let template = WORKFLOW_TEMPLATES.find(
      t => t.category === intent.category && t.action === intent.action
    )

    if (template) return template

    // Fallback to category-only match
    template = WORKFLOW_TEMPLATES.find(t => t.category === intent.category)

    return template || null
  }

  /**
   * Generate workflow steps from a template
   */
  private generateFromTemplate(template: WorkflowTemplate, intent: ParsedIntent): WorkflowStep[] {
    const steps: WorkflowStep[] = []

    for (const stepTemplate of template.steps) {
      // Check if step should be included based on condition
      if (stepTemplate.condition && !this.evaluateCondition(stepTemplate.condition, intent)) {
        continue
      }

      const step: WorkflowStep = {
        id: stepTemplate.id,
        type: stepTemplate.type,
        name: stepTemplate.name,
        description: stepTemplate.description,
        config: this.buildStepConfig(stepTemplate.config, intent),
        dependsOn: stepTemplate.dependsOn,
        timeout: this.getStepTimeout(stepTemplate.type),
        retryPolicy: this.getRetryPolicy(stepTemplate.type),
      }

      steps.push(step)
    }

    return steps
  }

  /**
   * Generate workflow using AI for custom intents
   */
  private async generateWithAI(intent: ParsedIntent): Promise<WorkflowStep[]> {
    const systemPrompt = `You are a workflow designer for an automation platform. Generate a workflow to fulfill the user's intent.

Available step types:
- ai_reasoning: Use AI to analyze, decide, or generate content
- api_call: Call external APIs (food delivery, communication, etc.)
- user_confirmation: Ask user to confirm or choose
- data_transform: Transform or process data
- condition: Branch based on conditions
- parallel: Run multiple steps at once
- notification: Notify user of progress/completion
- wait: Wait for time or external event

User Context:
${this.userContext ? JSON.stringify({
  addresses: this.userContext.addresses.map(a => a.label),
  preferences: this.userContext.preferences,
}, null, 2) : 'Not available'}

Intent to fulfill:
${JSON.stringify(intent, null, 2)}

Generate a workflow as a JSON array of steps:
[{
  "id": "unique_step_id",
  "type": "step_type",
  "name": "Human readable name",
  "description": "What this step does",
  "config": { step-specific configuration },
  "dependsOn": ["ids of steps this depends on"]
}]

Keep the workflow practical and efficient. Include user confirmations for important decisions.`

    const aiGenerationStart = Date.now()
    try {
      workflowLogger.debug('Calling AI for workflow generation', {
        model: 'claude-sonnet-4-20250514',
        maxTokens: 2000,
        rawInput: intent.rawInput?.substring(0, 100)
      })

      const response = await apiClient.chat({
        messages: [
          {
            role: 'user',
            content: `Create a workflow for: "${intent.rawInput}"`,
          },
        ],
        systemPrompt,
        model: 'claude-sonnet-4-20250514',
        maxTokens: 2000,
      })

      if (response.success && response.output) {
        const jsonMatch = response.output.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          const steps = parsed.map((s: Partial<WorkflowStep>) => ({
            ...s,
            timeout: this.getStepTimeout(s.type || 'ai_reasoning'),
            retryPolicy: this.getRetryPolicy(s.type || 'ai_reasoning'),
          }))

          workflowLogger.timing('AI workflow generation succeeded', Date.now() - aiGenerationStart, {
            stepsGenerated: steps.length,
            category: intent.category
          })

          return steps
        }
      }

      workflowLogger.warn('AI generation returned empty or invalid response', {
        success: response.success,
        hasOutput: !!response.output,
        durationMs: Date.now() - aiGenerationStart
      })
    } catch (error) {
      workflowLogger.error('AI workflow generation failed', {
        error: error instanceof Error ? error.message : String(error),
        category: intent.category,
        action: intent.action,
        durationMs: Date.now() - aiGenerationStart
      })
    }

    // Fallback to basic workflow
    workflowLogger.info('Falling back to basic workflow generation')
    return this.generateBasicWorkflow(intent)
  }

  /**
   * Generate a basic workflow for unknown intents
   */
  private generateBasicWorkflow(intent: ParsedIntent): WorkflowStep[] {
    return [
      {
        id: 'analyze',
        type: 'ai_reasoning',
        name: 'Analyze Request',
        description: 'Understand and process the user request',
        config: {
          prompt: `Analyze this request and determine the best course of action:
"${intent.rawInput}"

Consider:
1. What is the user trying to accomplish?
2. What information do we have?
3. What information do we need?
4. What actions should be taken?

Provide a structured plan.`,
          model: 'claude-sonnet-4-20250514',
        },
        dependsOn: [],
        timeout: 30000,
        retryPolicy: this.getRetryPolicy('ai_reasoning'),
      },
      {
        id: 'confirm_plan',
        type: 'user_confirmation',
        name: 'Confirm Plan',
        description: 'Confirm the proposed plan with user',
        config: {
          message: 'Here is my understanding and plan. Does this look right?',
          autoApproveAfter: 0,
        },
        dependsOn: ['analyze'],
      },
      {
        id: 'execute',
        type: 'ai_reasoning',
        name: 'Execute Plan',
        description: 'Execute the confirmed plan',
        config: {
          prompt: 'Execute the confirmed plan and provide results.',
        },
        dependsOn: ['confirm_plan'],
        timeout: 60000,
        retryPolicy: this.getRetryPolicy('ai_reasoning'),
      },
      {
        id: 'notify',
        type: 'notification',
        name: 'Complete',
        description: 'Notify user of completion',
        config: {
          notificationType: 'success',
          channels: ['app'],
        },
        dependsOn: ['execute'],
      },
    ]
  }

  /**
   * Simplify workflow by reducing confirmation steps
   */
  private simplifyWorkflow(steps: WorkflowStep[]): WorkflowStep[] {
    return steps.map(step => {
      if (step.type === 'user_confirmation') {
        // Auto-approve non-critical confirmations
        return {
          ...step,
          config: {
            ...step.config,
            autoApproveAfter: step.config.autoApproveAfter === 0 ? 30000 : step.config.autoApproveAfter,
          },
        }
      }
      return step
    })
  }

  /**
   * Build step configuration with context
   */
  private buildStepConfig(templateConfig: Partial<WorkflowStepConfig>, intent: ParsedIntent): WorkflowStepConfig {
    const config = { ...templateConfig } as WorkflowStepConfig

    // Inject intent entities into prompts
    if (config.prompt) {
      config.prompt = this.injectEntitiesIntoPrompt(config.prompt, intent)
    }

    // Build API payloads from entities
    if (config.service) {
      config.payload = this.buildPayloadFromEntities(intent)
    }

    return config
  }

  /**
   * Inject entities into AI prompts
   */
  private injectEntitiesIntoPrompt(prompt: string, intent: ParsedIntent): string {
    let enrichedPrompt = prompt

    // Add entity context
    if (intent.entities.length > 0) {
      enrichedPrompt += '\n\nExtracted information from user request:\n'
      for (const entity of intent.entities) {
        enrichedPrompt += `- ${entity.type}: ${entity.normalized || entity.value}\n`
      }
    }

    // Add constraints
    if (intent.constraints.length > 0) {
      enrichedPrompt += '\n\nUser constraints:\n'
      for (const constraint of intent.constraints) {
        enrichedPrompt += `- ${constraint.field} ${constraint.operator} ${constraint.value} (${constraint.priority})\n`
      }
    }

    // Add preferences
    if (intent.preferences.length > 0) {
      enrichedPrompt += '\n\nUser preferences:\n'
      for (const pref of intent.preferences) {
        enrichedPrompt += `- ${pref.key}: ${JSON.stringify(pref.value)}\n`
      }
    }

    return enrichedPrompt
  }

  /**
   * Build API payload from intent entities
   */
  private buildPayloadFromEntities(intent: ParsedIntent): Record<string, unknown> {
    const payload: Record<string, unknown> = {}

    for (const entity of intent.entities) {
      payload[entity.type] = entity.normalized || entity.value
    }

    // Add location details from context
    if (this.userContext) {
      const locationEntity = intent.entities.find(e => e.type === 'location')
      if (locationEntity) {
        const address = this.userContext.addresses.find(
          a => a.label.toLowerCase() === locationEntity.value.toLowerCase() ||
               a.fullAddress === locationEntity.normalized
        )
        if (address) {
          payload.deliveryAddress = address
        }
      }

      // Add default payment
      const defaultPayment = this.userContext.paymentMethods.find(p => p.isDefault)
      if (defaultPayment) {
        payload.paymentMethodId = defaultPayment.id
      }
    }

    return payload
  }

  /**
   * Inject context into workflow steps
   */
  private injectContext(steps: WorkflowStep[], _intent: ParsedIntent): WorkflowStep[] {
    return steps.map(step => {
      const enhancedConfig = { ...step.config }

      // Add context to AI reasoning steps
      if (step.type === 'ai_reasoning' && enhancedConfig.prompt) {
        enhancedConfig.contextKeys = ['userPreferences', 'recentOrders', 'savedAddresses']
      }

      return { ...step, config: enhancedConfig }
    })
  }

  /**
   * Identify required OAuth scopes for workflow execution
   */
  private identifyOAuthScopes(steps: WorkflowStep[]): Record<string, string[]> {
    const scopes: Record<string, string[]> = {}

    // OAuth scope requirements by service
    const scopeMap: Record<string, Record<string, string[]>> = {
      gmail: {
        send: ['https://www.googleapis.com/auth/gmail.send'],
        read: ['https://www.googleapis.com/auth/gmail.readonly'],
        modify: ['https://www.googleapis.com/auth/gmail.modify'],
      },
      googlecalendar: {
        create: ['https://www.googleapis.com/auth/calendar.events'],
        read: ['https://www.googleapis.com/auth/calendar.readonly'],
        modify: ['https://www.googleapis.com/auth/calendar.events'],
      },
      googlesheets: {
        read: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        write: ['https://www.googleapis.com/auth/spreadsheets'],
      },
      slack: {
        send: ['chat:write'],
        read: ['channels:read', 'groups:read'],
      },
      github: {
        read: ['repo'],
        write: ['repo'],
      },
    }

    for (const step of steps) {
      if (step.type === 'api_call' && step.config.service) {
        const service = step.config.service
        const serviceScopes = scopeMap[service]

        if (serviceScopes) {
          // Determine which scopes are needed based on the endpoint/method
          let requiredScopes: string[] = []

          if (step.config.method === 'POST' || step.config.method === 'PUT') {
            requiredScopes = serviceScopes.write || serviceScopes.create || serviceScopes.send || []
          } else if (step.config.method === 'GET') {
            requiredScopes = serviceScopes.read || []
          } else {
            // Default to all available scopes if method unclear
            requiredScopes = Object.values(serviceScopes).flat()
          }

          if (!scopes[service]) {
            scopes[service] = []
          }

          // Merge unique scopes
          for (const scope of requiredScopes) {
            if (!scopes[service].includes(scope)) {
              scopes[service].push(scope)
            }
          }
        }
      }

      // Check for Composio tool usage
      if (step.config.composioTool || step.config.tool) {
        const toolSlug = (step.config.composioTool || step.config.tool || '').toUpperCase()

        // Extract service from tool slug (e.g., GMAIL_SEND_EMAIL -> gmail)
        const serviceName = toolSlug.split('_')[0]?.toLowerCase()

        if (serviceName && scopeMap[serviceName]) {
          if (!scopes[serviceName]) {
            scopes[serviceName] = []
          }

          // Add all scopes for this service (Composio handles the specifics)
          const serviceScopes = Object.values(scopeMap[serviceName]).flat()
          for (const scope of serviceScopes) {
            if (!scopes[serviceName].includes(scope)) {
              scopes[serviceName].push(scope)
            }
          }
        }
      }
    }

    return scopes
  }

  /**
   * Validate workflow executability
   */
  private validateExecutability(
    steps: WorkflowStep[],
    requiredIntegrations: IntegrationRequirement[],
    requiredContext: ContextRequirement[]
  ): { isExecutable: boolean; missingRequirements: string[]; warnings: string[] } {
    const missingRequirements: string[] = []
    const warnings: string[] = []

    // Check all required integrations are connected
    for (const integration of requiredIntegrations) {
      if (integration.required && !integration.connected) {
        missingRequirements.push(`Service not connected: ${integration.service}`)
      }
    }

    // Check all required context is available
    for (const ctx of requiredContext) {
      if (ctx.required && !ctx.available) {
        missingRequirements.push(`Missing required context: ${ctx.key} (${ctx.description})`)
      }
    }

    // Validate each step has required configuration
    for (const step of steps) {
      // API call steps must have service and endpoint
      if (step.type === 'api_call') {
        if (!step.config.service && !step.config.composioTool && !step.config.tool) {
          missingRequirements.push(`Step "${step.name}" missing service/tool configuration`)
        }
        if (!step.config.endpoint && !step.config.composioTool && !step.config.tool) {
          missingRequirements.push(`Step "${step.name}" missing endpoint/tool configuration`)
        }
      }

      // AI reasoning steps must have prompt
      if (step.type === 'ai_reasoning') {
        if (!step.config.prompt) {
          missingRequirements.push(`Step "${step.name}" missing AI prompt`)
        }
      }

      // User confirmation steps must have message
      if (step.type === 'user_confirmation') {
        if (!step.config.message) {
          warnings.push(`Step "${step.name}" has no confirmation message`)
        }
      }

      // Check for circular dependencies
      if (step.dependsOn.includes(step.id)) {
        missingRequirements.push(`Step "${step.name}" has circular dependency on itself`)
      }
    }

    // Validate step dependency graph is acyclic
    const hasCycle = this.detectCycles(steps)
    if (hasCycle) {
      missingRequirements.push('Workflow contains circular dependencies between steps')
    }

    // Check for orphaned steps (no path from start)
    const reachableSteps = this.findReachableSteps(steps)
    const orphanedSteps = steps.filter(s => !reachableSteps.has(s.id))
    if (orphanedSteps.length > 0) {
      warnings.push(`${orphanedSteps.length} step(s) are not reachable from workflow start`)
    }

    return {
      isExecutable: missingRequirements.length === 0,
      missingRequirements,
      warnings,
    }
  }

  /**
   * Detect cycles in step dependency graph
   */
  private detectCycles(steps: WorkflowStep[]): boolean {
    const visited = new Set<string>()
    const recursionStack = new Set<string>()
    const stepMap = new Map(steps.map(s => [s.id, s]))

    const hasCycleFrom = (stepId: string): boolean => {
      if (recursionStack.has(stepId)) return true
      if (visited.has(stepId)) return false

      visited.add(stepId)
      recursionStack.add(stepId)

      const step = stepMap.get(stepId)
      if (step) {
        for (const depId of step.dependsOn) {
          if (hasCycleFrom(depId)) return true
        }
      }

      recursionStack.delete(stepId)
      return false
    }

    for (const step of steps) {
      if (hasCycleFrom(step.id)) return true
    }

    return false
  }

  /**
   * Find all steps reachable from the start step
   */
  private findReachableSteps(steps: WorkflowStep[]): Set<string> {
    if (steps.length === 0) return new Set()

    const reachable = new Set<string>()
    const queue: string[] = [steps[0].id] // Start from first step

    while (queue.length > 0) {
      const currentId = queue.shift()!
      if (reachable.has(currentId)) continue

      reachable.add(currentId)

      // Find all steps that depend on this one (forward direction)
      for (const step of steps) {
        if (step.dependsOn.includes(currentId) && !reachable.has(step.id)) {
          queue.push(step.id)
        }
      }
    }

    return reachable
  }

  /**
   * Map service actions to Composio tool slugs for execution
   */
  private mapToComposioTools(steps: WorkflowStep[]): WorkflowStep[] {
    return steps.map(step => {
      if (step.type !== 'api_call' || step.config.composioTool || step.config.tool) {
        return step // Already has Composio tool or not an API call
      }

      const service = step.config.service
      const endpoint = step.config.endpoint
      const method = step.config.method

      // Mapping of service + endpoint patterns to Composio tool slugs
      const toolMapping: Record<string, Record<string, string>> = {
        gmail: {
          '/send': 'GMAIL_SEND_EMAIL',
          '/messages': method === 'GET' ? 'GMAIL_LIST_EMAILS' : 'GMAIL_SEND_EMAIL',
        },
        googlecalendar: {
          '/events': method === 'POST' ? 'GOOGLECALENDAR_CREATE_EVENT' : 'GOOGLECALENDAR_LIST_EVENTS',
        },
        googlesheets: {
          '/append': 'GOOGLESHEETS_BATCH_UPDATE',
          '/values': method === 'GET' ? 'GOOGLESHEETS_GET_VALUES' : 'GOOGLESHEETS_BATCH_UPDATE',
        },
        slack: {
          '/chat.postMessage': 'SLACK_SEND_MESSAGE',
          '/conversations.list': 'SLACK_LIST_CHANNELS',
        },
        github: {
          '/repos': 'GITHUB_GET_A_REPOSITORY',
          '/issues': method === 'POST' ? 'GITHUB_CREATE_ISSUE' : 'GITHUB_LIST_REPOSITORY_ISSUES',
        },
      }

      if (service && endpoint && toolMapping[service]) {
        const serviceMapping = toolMapping[service]
        for (const [pattern, toolSlug] of Object.entries(serviceMapping)) {
          if (endpoint.includes(pattern)) {
            // Add Composio tool slug to config
            step.config.composioTool = toolSlug
            step.config.toolkit = service
            workflowLogger.debug('Mapped API call to Composio tool', {
              stepId: step.id,
              service,
              endpoint,
              tool: toolSlug,
            })
            break
          }
        }
      }

      return step
    })
  }

  /**
   * Determine required integrations
   */
  private determineIntegrations(intent: ParsedIntent, steps: WorkflowStep[]): IntegrationRequirement[] {
    const integrations: IntegrationRequirement[] = []

    // Category-based integrations
    const categoryIntegrations: Record<string, string[]> = {
      food_delivery: ['talabat', 'carriage', 'deliveroo'],
      communication: ['whatsapp', 'email', 'sms'],
      travel: ['booking', 'expedia', 'skyscanner'],
      shopping: ['amazon', 'noon'],
    }

    const required = categoryIntegrations[intent.category] || []

    for (const service of required) {
      const integration = serviceIntegrations.getIntegration(service)
      integrations.push({
        service,
        reason: `Required for ${intent.category}`,
        required: true,
        connected: integration?.connected || false,
        setupUrl: integration?.docsUrl,
      })
    }

    // Step-based integrations
    for (const step of steps) {
      if (step.type === 'api_call' && step.config.service) {
        const existing = integrations.find(i => i.service === step.config.service)
        if (!existing) {
          const integration = serviceIntegrations.getIntegration(step.config.service!)
          integrations.push({
            service: step.config.service!,
            reason: `Required for step: ${step.name}`,
            required: true,
            connected: integration?.connected || false,
          })
        }
      }
    }

    return integrations
  }

  /**
   * Determine context requirements
   */
  private determineContextRequirements(intent: ParsedIntent, _steps: WorkflowStep[]): ContextRequirement[] {
    const requirements: ContextRequirement[] = []

    // Check if location is needed
    if (intent.category === 'food_delivery' || intent.category === 'travel') {
      const hasLocation = intent.entities.some(e => e.type === 'location' && e.confidence > 0.8)
      const hasDefaultAddress = this.userContext?.addresses.some(a => a.isDefault) || false

      requirements.push({
        key: 'deliveryAddress',
        type: 'address',
        description: 'Delivery or destination address',
        required: true,
        available: hasLocation || hasDefaultAddress,
      })
    }

    // Check if payment is needed
    if (['food_delivery', 'shopping', 'travel'].includes(intent.category)) {
      const hasPayment = this.userContext?.paymentMethods.some(p => p.isDefault) || false

      requirements.push({
        key: 'paymentMethod',
        type: 'payment',
        description: 'Payment method for the order',
        required: true,
        available: hasPayment,
      })
    }

    return requirements
  }

  /**
   * Estimate workflow execution metrics
   */
  private estimateMetrics(steps: WorkflowStep[]): { estimatedDuration: number; estimatedCost: number } {
    let duration = 0
    let cost = 0

    for (const step of steps) {
      switch (step.type) {
        case 'ai_reasoning':
          duration += 5000  // 5 seconds average
          cost += 0.002     // ~$0.002 per AI call
          break
        case 'api_call':
          duration += 2000  // 2 seconds average
          break
        case 'user_confirmation':
          duration += step.config.autoApproveAfter || 30000  // Wait time
          break
        case 'notification':
          duration += 500
          break
        default:
          duration += 1000
      }
    }

    return { estimatedDuration: duration, estimatedCost: cost }
  }

  /**
   * Get default timeout for step type
   */
  private getStepTimeout(type: WorkflowStep['type']): number {
    const timeouts: Record<string, number> = {
      ai_reasoning: 60000,
      api_call: 30000,
      user_confirmation: 300000,  // 5 minutes
      data_transform: 10000,
      notification: 5000,
      condition: 1000,
      parallel: 120000,
      loop: 300000,
      wait: 600000,
    }
    return timeouts[type] || 30000
  }

  /**
   * Get retry policy for step type
   */
  private getRetryPolicy(type: WorkflowStep['type']): RetryPolicy {
    const policies: Record<string, RetryPolicy> = {
      ai_reasoning: {
        maxRetries: 2,
        delayMs: 2000,
        exponentialBackoff: true,
        retryOn: ['network', 'timeout', 'server_error'],
      },
      api_call: {
        maxRetries: 3,
        delayMs: 1000,
        exponentialBackoff: true,
        retryOn: ['network', 'timeout', 'server_error', 'rate_limit'],
      },
      notification: {
        maxRetries: 1,
        delayMs: 1000,
        exponentialBackoff: false,
        retryOn: ['network'],
      },
    }
    return policies[type] || {
      maxRetries: 1,
      delayMs: 1000,
      exponentialBackoff: false,
      retryOn: ['network', 'timeout'],
    }
  }

  /**
   * Evaluate a condition string
   */
  private evaluateCondition(_condition: string, _intent: ParsedIntent): boolean {
    // Simple condition evaluation - can be expanded
    return true
  }

  /**
   * Generate a human-readable workflow name
   */
  private generateWorkflowName(intent: ParsedIntent): string {
    const actionNames: Record<string, string> = {
      order: 'Order',
      analyze: 'Analyze',
      compare: 'Compare',
      send: 'Send',
      book: 'Book',
      search: 'Search',
    }

    const action = actionNames[intent.action] || 'Execute'
    const category = intent.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

    return `${action} - ${category}`
  }

  /**
   * Generate workflow description
   */
  private generateWorkflowDescription(intent: ParsedIntent): string {
    const mainEntity = intent.entities.find(e => e.type === 'product' || e.type === 'location')
    const value = mainEntity ? `: "${mainEntity.value}"` : ''

    return `Automated workflow to ${intent.action} ${intent.category.replace(/_/g, ' ')}${value}`
  }
}

// Export singleton instance
export const workflowGenerator = new WorkflowGenerator()
