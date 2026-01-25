/**
 * ToolChainOptimizerService
 *
 * Intelligent agent that designs optimal chains of tools to achieve workflow goals.
 * Part of Epic 16, Story 16.3: Tool Chain Optimizer Agent
 *
 * Features:
 * - Workflow goal analysis and capability extraction
 * - Multi-chain generation with at least 2 alternatives
 * - Cost, speed, and reliability optimization
 * - Data flow compatibility validation
 * - Learning from successful chain patterns
 */

import { supabase } from '../lib/supabase'
// toolCatalogService reserved for future catalog-based tool selection
// import { toolCatalogService } from './ToolCatalogService'
import { toolDiscoveryService } from './ToolDiscoveryService'
// trustScoreService reserved for future trust-based ranking
// import { trustScoreService } from './TrustScoreService'
import type {
  Tool,
  DiscoveredTool,
  ToolCategory,
  ToolChain,
  ChainStep,
  // ChainMetadata - reserved for future chain metadata
  ChainOptimizationType,
  // ChainEstimate - reserved for future cost estimation
  ChainOptimizationCriteria,
  ChainOptimizationRequest,
  ChainOptimizationResult,
  ChainComparison,
  ChainComparisonRow,
  ChainPattern,
  ChainPatternRow,
  WorkflowAnalysis,
  ExtractedCapability,
  DataFlowCompatibility
} from '../types/tools'
import {
  DEFAULT_OPTIMIZATION_CRITERIA,
  chainPatternFromRow
} from '../types/tools'

// Capability keywords to category mapping
const CAPABILITY_CATEGORIES: Record<string, ToolCategory> = {
  email: 'communication',
  message: 'communication',
  chat: 'communication',
  slack: 'communication',
  notification: 'communication',
  sms: 'communication',

  document: 'productivity',
  spreadsheet: 'productivity',
  calendar: 'productivity',
  task: 'productivity',
  note: 'productivity',
  file: 'storage',

  code: 'development',
  github: 'development',
  deploy: 'development',
  build: 'development',
  test: 'development',

  payment: 'finance',
  invoice: 'finance',
  accounting: 'finance',
  stripe: 'finance',

  crm: 'crm',
  salesforce: 'crm',
  hubspot: 'crm',
  lead: 'crm',
  contact: 'crm',

  campaign: 'marketing',
  ads: 'marketing',
  social: 'social',
  twitter: 'social',
  facebook: 'social',
  linkedin: 'social',

  ai: 'ai',
  ml: 'ai',
  openai: 'ai',
  claude: 'ai',
  llm: 'ai',

  data: 'data',
  database: 'data',
  analytics: 'analytics',
  report: 'analytics',
  dashboard: 'analytics',

  automate: 'automation',
  workflow: 'automation',
  trigger: 'automation',
  schedule: 'automation'
}

// Workflow type patterns
const WORKFLOW_PATTERNS: Record<string, RegExp[]> = {
  'data-pipeline': [/fetch.*send/, /get.*transform.*store/, /extract.*load/],
  'notification': [/notify/, /alert/, /send.*message/, /email.*update/],
  'sync': [/sync/, /copy.*to/, /mirror/, /backup/],
  'report': [/report/, /summarize/, /aggregate.*send/],
  'automation': [/when.*then/, /schedule/, /automate/, /trigger/]
}

export class ToolChainOptimizerService {
  private patternCache: Map<string, ChainPattern[]> = new Map()
  private readonly CACHE_TTL = 30 * 60 * 1000 // 30 minutes
  private cacheTimestamps: Map<string, number> = new Map()

  /**
   * Main entry point: Optimize a tool chain for a workflow goal
   */
  async optimizeChain(request: ChainOptimizationRequest): Promise<ChainOptimizationResult> {
    const startTime = Date.now()

    // Merge criteria with defaults
    const criteria: ChainOptimizationCriteria = {
      ...DEFAULT_OPTIMIZATION_CRITERIA,
      ...request.criteria
    }

    // Step 1: Analyze the workflow goal
    const workflowAnalysis = await this.analyzeWorkflowGoal(request.workflowGoal)

    // Step 2: Find tools for each capability
    const capabilityTools = await this.findToolsForCapabilities(
      workflowAnalysis.extractedCapabilities,
      request.preferredTools,
      request.excludedTools
    )

    // Step 3: Check for existing successful patterns
    const existingPatterns = await this.findMatchingPatterns(
      workflowAnalysis.extractedCapabilities,
      request.userId,
      request.projectId
    )

    // Step 4: Generate multiple chain alternatives
    const chains = await this.generateChains(
      workflowAnalysis,
      capabilityTools,
      existingPatterns,
      criteria,
      request
    )

    // Step 5: Score and rank chains
    const scoredChains = this.scoreChains(chains, criteria)

    // Step 6: Build comparison data
    const comparison = this.buildComparison(scoredChains)

    // Step 7: Prepare result
    const generationTimeMs = Date.now() - startTime

    return {
      recommendedChain: scoredChains[0],
      alternatives: scoredChains.slice(1),
      comparison,
      workflowAnalysis,
      generatedAt: new Date().toISOString(),
      generationTimeMs,
      criteria
    }
  }

  /**
   * Analyze a workflow goal and extract required capabilities
   */
  async analyzeWorkflowGoal(goal: string): Promise<WorkflowAnalysis> {
    const lowerGoal = goal.toLowerCase()

    // Extract capabilities from the goal
    const capabilities = this.extractCapabilities(lowerGoal)

    // Determine workflow type
    const workflowType = this.detectWorkflowType(lowerGoal)

    // Calculate complexity
    const complexityScore = this.calculateComplexity(capabilities, lowerGoal)

    // Generate warnings
    const warnings = this.generateWarnings(capabilities, lowerGoal)

    return {
      originalGoal: goal,
      extractedCapabilities: capabilities,
      workflowType,
      complexityScore,
      estimatedSteps: capabilities.length,
      warnings
    }
  }

  /**
   * Extract capabilities from goal text
   */
  private extractCapabilities(goal: string): ExtractedCapability[] {
    const capabilities: ExtractedCapability[] = []
    const words = goal.split(/\s+/)

    // Common capability patterns
    const patterns: Array<{
      pattern: RegExp
      name: string
      category: ToolCategory
      description: string
    }> = [
      { pattern: /send|email|mail/i, name: 'send_email', category: 'communication', description: 'Send email message' },
      { pattern: /slack|message|chat/i, name: 'send_message', category: 'communication', description: 'Send chat message' },
      { pattern: /notify|alert/i, name: 'notify', category: 'communication', description: 'Send notification' },
      { pattern: /fetch|get|retrieve|pull/i, name: 'data_fetch', category: 'data', description: 'Fetch data from source' },
      { pattern: /transform|convert|process/i, name: 'data_transform', category: 'data', description: 'Transform data format' },
      { pattern: /store|save|write/i, name: 'data_store', category: 'storage', description: 'Store data' },
      { pattern: /spreadsheet|sheet|excel/i, name: 'spreadsheet_op', category: 'productivity', description: 'Spreadsheet operation' },
      { pattern: /calendar|schedule|meeting/i, name: 'calendar_op', category: 'productivity', description: 'Calendar operation' },
      { pattern: /report|summary|aggregate/i, name: 'generate_report', category: 'analytics', description: 'Generate report or summary' },
      { pattern: /shopify|order|commerce/i, name: 'ecommerce_op', category: 'finance', description: 'E-commerce operation' },
      { pattern: /github|code|repository/i, name: 'code_op', category: 'development', description: 'Code/repository operation' },
      { pattern: /ai|analyze|llm|gpt|claude/i, name: 'ai_process', category: 'ai', description: 'AI processing' },
      { pattern: /crm|salesforce|hubspot|lead/i, name: 'crm_op', category: 'crm', description: 'CRM operation' }
    ]

    const foundPatterns = new Set<string>()

    for (const { pattern, name, category, description } of patterns) {
      if (pattern.test(goal) && !foundPatterns.has(name)) {
        foundPatterns.add(name)
        capabilities.push({
          name,
          description,
          category,
          priority: 'required',
          suggestedTools: []
        })
      }
    }

    // If no capabilities found, add a generic one
    if (capabilities.length === 0) {
      // Try to detect category from keywords
      let detectedCategory: ToolCategory = 'automation'
      for (const word of words) {
        const cat = CAPABILITY_CATEGORIES[word]
        if (cat) {
          detectedCategory = cat
          break
        }
      }

      capabilities.push({
        name: 'generic_action',
        description: 'Execute workflow action',
        category: detectedCategory,
        priority: 'required',
        suggestedTools: []
      })
    }

    return capabilities
  }

  /**
   * Detect workflow type from goal
   */
  private detectWorkflowType(goal: string): string {
    for (const [type, patterns] of Object.entries(WORKFLOW_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(goal)) {
          return type
        }
      }
    }
    return 'general'
  }

  /**
   * Calculate workflow complexity (1-10)
   */
  private calculateComplexity(capabilities: ExtractedCapability[], goal: string): number {
    let score = 1

    // More capabilities = more complexity
    score += Math.min(capabilities.length - 1, 4)

    // Long goal descriptions tend to be more complex
    if (goal.length > 100) score += 1
    if (goal.length > 200) score += 1

    // Conditional logic indicators
    if (/if|when|unless|condition/i.test(goal)) score += 1

    // Multiple sources/destinations
    if (/and.*and/i.test(goal)) score += 1

    return Math.min(score, 10)
  }

  /**
   * Generate warnings for the workflow
   */
  private generateWarnings(capabilities: ExtractedCapability[], goal: string): string[] {
    const warnings: string[] = []

    // Check for potentially expensive operations
    if (/all|every|bulk/i.test(goal)) {
      warnings.push('Bulk operations may incur higher costs')
    }

    // Check for external services
    if (capabilities.some(c => c.category === 'ai')) {
      warnings.push('AI operations may have variable latency')
    }

    // Check for potential data sensitivity
    if (/payment|credit|password|secret/i.test(goal)) {
      warnings.push('This workflow may involve sensitive data - ensure proper security')
    }

    return warnings
  }

  /**
   * Find tools for each capability
   */
  private async findToolsForCapabilities(
    capabilities: ExtractedCapability[],
    preferredTools?: string[],
    excludedTools?: string[]
  ): Promise<Map<string, Array<Tool | DiscoveredTool>>> {
    const toolMap = new Map<string, Array<Tool | DiscoveredTool>>()

    for (const capability of capabilities) {
      // Search catalog and discovery service
      const searchResults = await toolDiscoveryService.discoverTools({
        capability: capability.name,
        category: capability.category,
        limit: 10
      })

      // Filter and sort tools
      let tools = searchResults
        .map(r => r.tool)
        .filter(t => !excludedTools?.includes(t.id))

      // Prioritize preferred tools
      if (preferredTools && preferredTools.length > 0) {
        tools.sort((a, b) => {
          const aPreferred = preferredTools.includes(a.id) ? -1 : 0
          const bPreferred = preferredTools.includes(b.id) ? -1 : 0
          return aPreferred - bPreferred
        })
      }

      toolMap.set(capability.name, tools)

      // Update capability with suggested tools
      capability.suggestedTools = tools.slice(0, 3).map(t => t.id)
    }

    return toolMap
  }

  /**
   * Find matching patterns from previous successful chains
   */
  private async findMatchingPatterns(
    capabilities: ExtractedCapability[],
    userId: string,
    projectId?: string
  ): Promise<ChainPattern[]> {
    const signature = this.generateCapabilitySignature(capabilities)

    // Check cache first
    const cacheKey = `${signature}-${userId}-${projectId || ''}`
    const cachedTs = this.cacheTimestamps.get(cacheKey)
    if (cachedTs && Date.now() - cachedTs < this.CACHE_TTL) {
      const cached = this.patternCache.get(cacheKey)
      if (cached) return cached
    }

    try {
      let query = supabase
        .from('tool_chain_patterns')
        .select('*')
        .eq('capability_signature', signature)
        .order('success_count', { ascending: false })
        .limit(5)

      // Prefer user-specific patterns
      if (userId) {
        query = query.or(`user_id.eq.${userId},user_id.is.null`)
      }

      const { data, error } = await query

      if (error) {
        console.error('[ToolChainOptimizer] Pattern search error:', error)
        return []
      }

      const patterns = (data || []).map((row: ChainPatternRow) => chainPatternFromRow(row))

      // Cache results
      this.patternCache.set(cacheKey, patterns)
      this.cacheTimestamps.set(cacheKey, Date.now())

      return patterns
    } catch (err) {
      console.error('[ToolChainOptimizer] Pattern search failed:', err)
      return []
    }
  }

  /**
   * Generate capability signature for pattern matching
   */
  private generateCapabilitySignature(capabilities: ExtractedCapability[]): string {
    const names = capabilities.map(c => c.name).sort()
    return names.join('|')
  }

  /**
   * Generate multiple chain alternatives
   */
  private async generateChains(
    analysis: WorkflowAnalysis,
    capabilityTools: Map<string, Array<Tool | DiscoveredTool>>,
    existingPatterns: ChainPattern[],
    _criteria: ChainOptimizationCriteria,
    request: ChainOptimizationRequest
  ): Promise<ToolChain[]> {
    void existingPatterns
    void _criteria
    const chains: ToolChain[] = []

    // Strategy 1: Generate balanced chain (recommended)
    const balancedChain = this.generateChainWithStrategy(
      analysis,
      capabilityTools,
      'balanced',
      request
    )
    if (balancedChain) chains.push(balancedChain)

    // Strategy 2: Generate cost-optimized chain
    const costChain = this.generateChainWithStrategy(
      analysis,
      capabilityTools,
      'cost_optimized',
      request
    )
    if (costChain && !this.isSameChain(costChain, balancedChain)) {
      chains.push(costChain)
    }

    // Strategy 3: Generate speed-optimized chain
    const speedChain = this.generateChainWithStrategy(
      analysis,
      capabilityTools,
      'speed_optimized',
      request
    )
    if (speedChain && !chains.some(c => this.isSameChain(c, speedChain))) {
      chains.push(speedChain)
    }

    // Strategy 4: Use existing pattern if available
    if (existingPatterns.length > 0) {
      const patternChain = await this.chainFromPattern(
        existingPatterns[0],
        analysis,
        capabilityTools
      )
      if (patternChain && !chains.some(c => this.isSameChain(c, patternChain))) {
        chains.push(patternChain)
      }
    }

    // Ensure minimum 2 alternatives for complex workflows
    if (analysis.complexityScore >= 5 && chains.length < 2) {
      const reliabilityChain = this.generateChainWithStrategy(
        analysis,
        capabilityTools,
        'reliability_optimized',
        request
      )
      if (reliabilityChain) chains.push(reliabilityChain)
    }

    return chains
  }

  /**
   * Generate a chain with a specific optimization strategy
   */
  private generateChainWithStrategy(
    analysis: WorkflowAnalysis,
    capabilityTools: Map<string, Array<Tool | DiscoveredTool>>,
    strategy: ChainOptimizationType,
    request: ChainOptimizationRequest
  ): ToolChain | null {
    const steps: ChainStep[] = []

    for (let i = 0; i < analysis.extractedCapabilities.length; i++) {
      const capability = analysis.extractedCapabilities[i]
      const tools = capabilityTools.get(capability.name) || []

      if (tools.length === 0) {
        console.warn(`[ToolChainOptimizer] No tools found for capability: ${capability.name}`)
        continue
      }

      // Select tool based on strategy
      const selectedTool = this.selectToolForStrategy(tools, strategy)

      if (!selectedTool) continue

      // Calculate estimates
      const estimatedTimeMs = this.estimateToolTime(selectedTool)
      const estimatedCostUsd = this.estimateToolCost(selectedTool)

      // Check data flow compatibility with previous step
      const requiresTransformation = i > 0 && this.needsTransformation(steps[i - 1]?.tool, selectedTool)

      steps.push({
        order: i + 1,
        tool: selectedTool,
        capability: capability.name,
        capabilityDescription: capability.description,
        estimatedTimeMs,
        estimatedCostUsd,
        requiresTransformation,
        transformationNotes: requiresTransformation ? 'Schema transformation may be required' : undefined
      })

      // Check budget/time constraints
      if (request.maxSteps && steps.length >= request.maxSteps) break
    }

    if (steps.length === 0) return null

    // Calculate chain totals
    const { totalTimeMs, totalCostUsd, canParallelize } = this.calculateChainTotals(steps)

    // Check constraints
    if (request.budgetLimitUsd && totalCostUsd > request.budgetLimitUsd) {
      return null
    }
    if (request.timeLimitMs && totalTimeMs > request.timeLimitMs) {
      return null
    }

    // Calculate reliability score
    const reliabilityScore = this.calculateChainReliability(steps)

    // Generate chain name
    const chainName = this.generateChainName(strategy, steps)

    return {
      id: `chain-${strategy}-${Date.now()}`,
      name: chainName,
      description: `${strategy.replace('_', ' ')} chain for: ${analysis.originalGoal.slice(0, 50)}...`,
      steps,
      totalEstimatedTimeMs: totalTimeMs,
      totalEstimatedCostUsd: totalCostUsd,
      reliabilityScore,
      optimizationScore: 0, // Will be calculated during scoring
      canParallelize,
      metadata: {
        generatedAt: new Date().toISOString(),
        optimizationType: strategy,
        complexityLevel: analysis.complexityScore <= 3 ? 'simple' : analysis.complexityScore <= 6 ? 'moderate' : 'complex',
        capabilitiesCovered: steps.map(s => s.capability),
        toolCount: steps.length,
        hasExternalTools: steps.some(s => !s.tool.isApproved),
        requiresApproval: steps.some(s => 'userApprovalRequired' in s.tool && s.tool.userApprovalRequired)
      }
    }
  }

  /**
   * Select tool based on optimization strategy
   */
  private selectToolForStrategy(
    tools: Array<Tool | DiscoveredTool>,
    strategy: ChainOptimizationType
  ): Tool | DiscoveredTool | null {
    if (tools.length === 0) return null

    switch (strategy) {
      case 'cost_optimized':
        // Prefer free/freemium tools, then lowest cost
        return tools.sort((a, b) => {
          const aCost = a.costEstimate?.perCall || 0
          const bCost = b.costEstimate?.perCall || 0
          return aCost - bCost
        })[0]

      case 'speed_optimized':
        // Prefer tools with best reliability (proxy for speed)
        return tools.sort((a, b) => b.reliabilityRating - a.reliabilityRating)[0]

      case 'reliability_optimized':
        // Prefer approved tools with highest reliability
        return tools.sort((a, b) => {
          if (a.isApproved && !b.isApproved) return -1
          if (!a.isApproved && b.isApproved) return 1
          return b.reliabilityRating - a.reliabilityRating
        })[0]

      case 'balanced':
      default:
        // Balance between reliability, approval status, and cost
        return tools.sort((a, b) => {
          const aScore = this.calculateToolBalancedScore(a)
          const bScore = this.calculateToolBalancedScore(b)
          return bScore - aScore
        })[0]
    }
  }

  /**
   * Calculate balanced score for a tool
   */
  private calculateToolBalancedScore(tool: Tool | DiscoveredTool): number {
    let score = 0

    // Reliability (0-40 points)
    score += tool.reliabilityRating * 40

    // Approval status (0-30 points)
    if (tool.isApproved) score += 30

    // Cost efficiency (0-20 points)
    const cost = tool.costEstimate?.perCall || 0
    if (cost === 0) score += 20
    else if (cost < 0.01) score += 15
    else if (cost < 0.1) score += 10

    // Trust score if available (0-10 points)
    if ('trustScore' in tool) {
      score += (tool.trustScore.overall / 100) * 10
    }

    return score
  }

  /**
   * Estimate tool execution time in ms
   */
  private estimateToolTime(tool: Tool | DiscoveredTool): number {
    // Base estimate from reliability (higher reliability = faster)
    const baseTime = 500 + (1 - tool.reliabilityRating) * 2000

    // Adjust for authentication method
    if (tool.authMethod === 'oauth2') return baseTime + 200
    if (tool.authMethod === 'api_key') return baseTime + 100

    return baseTime
  }

  /**
   * Estimate tool cost in USD
   */
  private estimateToolCost(tool: Tool | DiscoveredTool): number {
    if (!tool.costEstimate) return 0

    const baseCost = tool.costEstimate.perCall || 0

    // Add 10% buffer for retries
    return baseCost * 1.1
  }

  /**
   * Check if transformation is needed between two tools
   */
  private needsTransformation(sourceTool: Tool | DiscoveredTool | undefined, targetTool: Tool | DiscoveredTool): boolean {
    if (!sourceTool) return false

    // Compare data formats
    const sourceFormats = new Set(sourceTool.dataFormats)
    const targetFormats = new Set(targetTool.dataFormats)

    // If there's no overlap in formats, transformation is needed
    const hasOverlap = [...sourceFormats].some(f => targetFormats.has(f))

    return !hasOverlap
  }

  /**
   * Calculate chain totals
   */
  private calculateChainTotals(steps: ChainStep[]): {
    totalTimeMs: number
    totalCostUsd: number
    canParallelize: boolean
  } {
    let totalTimeMs = 0
    let totalCostUsd = 0

    for (const step of steps) {
      totalTimeMs += step.estimatedTimeMs
      totalCostUsd += step.estimatedCostUsd
    }

    // Check if any steps can be parallelized (independent data sources)
    // For now, assume sequential execution
    const canParallelize = false

    // Add 10% buffer for cost
    totalCostUsd *= 1.1

    return { totalTimeMs, totalCostUsd, canParallelize }
  }

  /**
   * Calculate chain reliability score (0-100)
   */
  private calculateChainReliability(steps: ChainStep[]): number {
    if (steps.length === 0) return 0

    // Chain reliability is the product of individual reliabilities
    let reliability = 1
    for (const step of steps) {
      reliability *= step.tool.reliabilityRating
    }

    return Math.round(reliability * 100)
  }

  /**
   * Generate a descriptive chain name
   */
  private generateChainName(strategy: ChainOptimizationType, steps: ChainStep[]): string {
    const toolNames = steps.slice(0, 3).map(s => s.tool.name)
    const prefix = {
      balanced: 'Balanced',
      cost_optimized: 'Budget',
      speed_optimized: 'Fast',
      reliability_optimized: 'Reliable'
    }[strategy]

    if (toolNames.length <= 2) {
      return `${prefix}: ${toolNames.join(' → ')}`
    }

    return `${prefix}: ${toolNames[0]} → ... → ${toolNames[toolNames.length - 1]}`
  }

  /**
   * Create a chain from a stored pattern
   */
  private async chainFromPattern(
    pattern: ChainPattern,
    analysis: WorkflowAnalysis,
    capabilityTools: Map<string, Array<Tool | DiscoveredTool>>
  ): Promise<ToolChain | null> {
    const steps: ChainStep[] = []

    for (const patternStep of pattern.chainSteps) {
      // Find the tool from the pattern
      const tools = capabilityTools.get(patternStep.capability) || []
      const matchingTool = tools.find(t => t.id === patternStep.toolId || t.name === patternStep.toolName)

      if (!matchingTool) continue

      steps.push({
        order: patternStep.order,
        tool: matchingTool,
        capability: patternStep.capability,
        estimatedTimeMs: pattern.avgExecutionTimeMs ? pattern.avgExecutionTimeMs / pattern.chainSteps.length : 500,
        estimatedCostUsd: pattern.avgCostUsd ? pattern.avgCostUsd / pattern.chainSteps.length : 0,
        requiresTransformation: false
      })
    }

    if (steps.length === 0) return null

    const { totalTimeMs, totalCostUsd, canParallelize } = this.calculateChainTotals(steps)
    const reliabilityScore = this.calculateChainReliability(steps)

    return {
      id: `chain-pattern-${pattern.id}`,
      name: `Proven: ${steps[0].tool.name} → ${steps[steps.length - 1].tool.name}`,
      description: `Previously successful pattern (${pattern.successCount} successes)`,
      steps,
      totalEstimatedTimeMs: totalTimeMs,
      totalEstimatedCostUsd: totalCostUsd,
      reliabilityScore,
      optimizationScore: 0,
      canParallelize,
      metadata: {
        generatedAt: new Date().toISOString(),
        optimizationType: 'balanced',
        complexityLevel: analysis.complexityScore <= 3 ? 'simple' : analysis.complexityScore <= 6 ? 'moderate' : 'complex',
        capabilitiesCovered: steps.map(s => s.capability),
        toolCount: steps.length,
        hasExternalTools: steps.some(s => !s.tool.isApproved),
        requiresApproval: false
      }
    }
  }

  /**
   * Check if two chains are essentially the same
   */
  private isSameChain(a: ToolChain | null, b: ToolChain | null): boolean {
    if (!a || !b) return false
    if (a.steps.length !== b.steps.length) return false

    return a.steps.every((step, i) => step.tool.id === b.steps[i].tool.id)
  }

  /**
   * Score and rank chains
   */
  private scoreChains(chains: ToolChain[], criteria: ChainOptimizationCriteria): ToolChain[] {
    // Find max values for normalization
    const maxCost = Math.max(...chains.map(c => c.totalEstimatedCostUsd), 0.01)
    const maxTime = Math.max(...chains.map(c => c.totalEstimatedTimeMs), 100)
    const maxSteps = Math.max(...chains.map(c => c.steps.length), 1)

    for (const chain of chains) {
      // Cost score: lower is better (inverted and normalized)
      const costScore = 100 - (chain.totalEstimatedCostUsd / maxCost * 100)

      // Speed score: lower time is better (inverted and normalized)
      const speedScore = 100 - (chain.totalEstimatedTimeMs / maxTime * 100)

      // Reliability score is already 0-100
      const reliabilityScore = chain.reliabilityScore

      // Simplicity score: fewer steps is better
      const simplicityScore = 100 - (chain.steps.length / maxSteps * 100)

      // Calculate weighted score
      chain.optimizationScore = Math.round(
        costScore * criteria.costWeight +
        speedScore * criteria.speedWeight +
        reliabilityScore * criteria.reliabilityWeight +
        simplicityScore * criteria.simplicityWeight
      )
    }

    // Sort by optimization score (highest first)
    return chains.sort((a, b) => b.optimizationScore - a.optimizationScore)
  }

  /**
   * Build comparison data for UI
   */
  private buildComparison(chains: ToolChain[]): ChainComparison {
    const metrics = ['Cost', 'Time', 'Reliability', 'Steps', 'Score']

    const comparisonMatrix: ChainComparisonRow[] = metrics.map(metric => {
      const values = chains.map((chain, index) => {
        let value: string | number
        switch (metric) {
          case 'Cost':
            value = `$${chain.totalEstimatedCostUsd.toFixed(4)}`
            break
          case 'Time':
            value = `${(chain.totalEstimatedTimeMs / 1000).toFixed(1)}s`
            break
          case 'Reliability':
            value = `${chain.reliabilityScore}%`
            break
          case 'Steps':
            value = chain.steps.length
            break
          case 'Score':
            value = chain.optimizationScore
            break
          default:
            value = '-'
        }
        return { chainIndex: index, value, isWinner: false }
      })

      // Mark winner for each metric
      if (values.length > 0) {
        const winnerIndex = metric === 'Cost' || metric === 'Time' || metric === 'Steps'
          ? values.reduce((min, v, i) => {
              const numVal = typeof v.value === 'number' ? v.value : parseFloat(v.value.toString().replace(/[^0-9.]/g, ''))
              const minVal = typeof values[min].value === 'number' ? values[min].value : parseFloat(values[min].value.toString().replace(/[^0-9.]/g, ''))
              return numVal < minVal ? i : min
            }, 0)
          : values.reduce((max, v, i) => {
              const numVal = typeof v.value === 'number' ? v.value : parseFloat(v.value.toString().replace(/[^0-9.]/g, ''))
              const maxVal = typeof values[max].value === 'number' ? values[max].value : parseFloat(values[max].value.toString().replace(/[^0-9.]/g, ''))
              return numVal > maxVal ? i : max
            }, 0)
        values[winnerIndex].isWinner = true
      }

      return { metric, values }
    })

    // Generate trade-off explanations
    const tradeOffExplanations = this.generateTradeOffExplanations(chains)

    return {
      chains,
      recommendedIndex: 0,
      comparisonMatrix,
      tradeOffExplanations
    }
  }

  /**
   * Generate plain-English trade-off explanations
   */
  private generateTradeOffExplanations(chains: ToolChain[]): string[] {
    const explanations: string[] = []

    if (chains.length < 2) {
      explanations.push('Only one viable chain option was found for this workflow.')
      return explanations
    }

    const recommended = chains[0]
    const alternatives = chains.slice(1)

    explanations.push(`The recommended chain uses ${recommended.steps.length} tool${recommended.steps.length > 1 ? 's' : ''} with an estimated cost of $${recommended.totalEstimatedCostUsd.toFixed(4)}.`)

    for (const alt of alternatives) {
      const costDiff = ((alt.totalEstimatedCostUsd - recommended.totalEstimatedCostUsd) / recommended.totalEstimatedCostUsd * 100).toFixed(0)
      const timeDiff = ((alt.totalEstimatedTimeMs - recommended.totalEstimatedTimeMs) / recommended.totalEstimatedTimeMs * 100).toFixed(0)

      if (parseFloat(costDiff) < -10) {
        explanations.push(`"${alt.name}" is ${Math.abs(parseFloat(costDiff))}% cheaper but may be ${Math.abs(parseFloat(timeDiff))}% slower.`)
      } else if (parseFloat(timeDiff) < -10) {
        explanations.push(`"${alt.name}" is ${Math.abs(parseFloat(timeDiff))}% faster but costs ${Math.abs(parseFloat(costDiff))}% more.`)
      } else if (alt.reliabilityScore > recommended.reliabilityScore) {
        explanations.push(`"${alt.name}" has ${alt.reliabilityScore - recommended.reliabilityScore}% higher reliability.`)
      }
    }

    return explanations
  }

  /**
   * Validate data flow compatibility between chain steps
   */
  checkDataFlowCompatibility(
    sourceSchema: Record<string, unknown>,
    targetSchema: Record<string, unknown>
  ): DataFlowCompatibility {
    const sourceFields = Object.keys(sourceSchema)
    const targetFields = Object.keys(targetSchema)

    const missingFields = targetFields.filter(f => !sourceFields.includes(f))
    const typeConflicts: DataFlowCompatibility['typeConflicts'] = []
    const suggestedTransformations: DataFlowCompatibility['suggestedTransformations'] = []

    // Check for type conflicts on overlapping fields
    for (const field of sourceFields) {
      if (targetFields.includes(field)) {
        const sourceType = typeof sourceSchema[field]
        const targetType = typeof targetSchema[field]
        if (sourceType !== targetType) {
          typeConflicts.push({ field, sourceType, targetType })
          suggestedTransformations.push({
            sourceField: field,
            targetField: field,
            transformType: 'type_cast',
            notes: `Convert ${sourceType} to ${targetType}`
          })
        }
      }
    }

    // Suggest direct mappings for missing fields
    for (const field of missingFields) {
      const similarField = sourceFields.find(f =>
        f.toLowerCase().includes(field.toLowerCase()) ||
        field.toLowerCase().includes(f.toLowerCase())
      )
      if (similarField) {
        suggestedTransformations.push({
          sourceField: similarField,
          targetField: field,
          transformType: 'direct',
          notes: `Map ${similarField} to ${field}`
        })
      }
    }

    const isCompatible = missingFields.length === 0 && typeConflicts.length === 0
    const transformationRequired = !isCompatible

    return {
      isCompatible,
      sourceSchema,
      targetSchema,
      missingFields,
      typeConflicts,
      transformationRequired,
      suggestedTransformations
    }
  }

  /**
   * Store a successful chain pattern for future learning
   */
  async storeSuccessfulPattern(
    chain: ToolChain,
    executionTimeMs: number,
    costUsd: number,
    userId: string,
    projectId?: string
  ): Promise<void> {
    const signature = chain.metadata.capabilitiesCovered.sort().join('|')

    try {
      // Check if pattern already exists
      const { data: existing } = await supabase
        .from('tool_chain_patterns')
        .select('*')
        .eq('capability_signature', signature)
        .eq('user_id', userId)
        .single()

      if (existing) {
        // Update existing pattern
        const newSuccessCount = existing.success_count + 1
        const newAvgTime = ((existing.avg_execution_time_ms || 0) * existing.success_count + executionTimeMs) / newSuccessCount
        const newAvgCost = ((existing.avg_cost_usd || 0) * existing.success_count + costUsd) / newSuccessCount

        await supabase
          .from('tool_chain_patterns')
          .update({
            success_count: newSuccessCount,
            avg_execution_time_ms: newAvgTime,
            avg_cost_usd: newAvgCost,
            last_used_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
      } else {
        // Create new pattern
        await supabase
          .from('tool_chain_patterns')
          .insert({
            capability_signature: signature,
            workflow_type: chain.metadata.complexityLevel,
            chain_steps: chain.steps.map(s => ({
              toolId: s.tool.id,
              toolName: s.tool.name,
              capability: s.capability,
              order: s.order
            })),
            success_count: 1,
            failure_count: 0,
            avg_execution_time_ms: executionTimeMs,
            avg_cost_usd: costUsd,
            user_id: userId,
            project_id: projectId || null,
            last_used_at: new Date().toISOString(),
            metadata: {}
          })
      }

      // Invalidate cache
      this.patternCache.clear()
      this.cacheTimestamps.clear()
    } catch (err) {
      console.error('[ToolChainOptimizer] Failed to store pattern:', err)
    }
  }

  /**
   * Record a failed chain execution
   */
  async recordChainFailure(
    chain: ToolChain,
    userId: string
  ): Promise<void> {
    const signature = chain.metadata.capabilitiesCovered.sort().join('|')

    try {
      const { data: existing } = await supabase
        .from('tool_chain_patterns')
        .select('*')
        .eq('capability_signature', signature)
        .eq('user_id', userId)
        .single()

      if (existing) {
        await supabase
          .from('tool_chain_patterns')
          .update({
            failure_count: existing.failure_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
      }
    } catch (err) {
      console.error('[ToolChainOptimizer] Failed to record failure:', err)
    }
  }

  /**
   * Clear the pattern cache
   */
  clearCache(): void {
    this.patternCache.clear()
    this.cacheTimestamps.clear()
  }
}

// Export singleton instance
export const toolChainOptimizerService = new ToolChainOptimizerService()
