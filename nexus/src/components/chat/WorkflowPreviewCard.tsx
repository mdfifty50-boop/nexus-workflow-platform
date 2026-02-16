/**
 * WorkflowPreviewCard Component
 *
 * Mini n8n-style workflow visualization with REAL execution via Composio/Rube.
 * Features:
 * - Smart authentication flow (one integration at a time)
 * - Real API execution with live status updates
 * - Friendly, engaging UX that guides users through setup
 * - Mobile-responsive layouts (vertical on mobile, horizontal on desktop)
 *
 * REFACTORED: Types, constants, utilities, and sub-components extracted to:
 * - wpc-types.ts - TypeScript interfaces and types
 * - wpc-constants.ts - TOOL_SLUGS, ACTION_KEYWORDS, statusColors, etc.
 * - wpc-tool-utils.ts - validateToolSlug, getFallbackTools, mapNodeToToolSlug, etc.
 * - wpc-helpers.ts - mapCollectedParamsToToolParams, validation, orchestration helpers
 * - wpc-MiniNode.tsx - MiniNodeHorizontal, MiniNodeVertical components
 * - wpc-NodeTooltip.tsx - NodeTooltip component
 * - wpc-AuthPrompt.tsx - AuthPrompt, ParallelAuthPrompt components
 */

import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Zap,
  Link2,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Pencil,
  FlaskConical,
  Rocket,
} from 'lucide-react'
import { NodeEditPanel } from './NodeEditPanel'
import {
  getIntegrationInfo,
  getRequiredIntegrations,
  type IntegrationInfo,
} from '@/services/IntegrationAuthService'
import { rubeClient } from '@/services/RubeClient'
import { PreFlightService, type PreFlightResult, type PreFlightQuestion } from '@/services/PreFlightService'
// @NEXUS-FIX-039: WorkflowIntelligenceService integration for enhanced error handling - DO NOT REMOVE
import { WorkflowIntelligenceService } from '@/services/WorkflowIntelligenceService'
// @NEXUS-FIX-041: VerifiedExecutor for execution with verification - DO NOT REMOVE
import { VerifiedExecutorService, type VerifiedResult } from '@/services/VerifiedExecutor'
// @NEXUS-FIX-042: UnifiedToolRegistry - Single source of truth for tools - DO NOT REMOVE
// NOTE: Now used in wpc-helpers.ts; kept here for marker preservation
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { UnifiedToolRegistryService as _UnifiedToolRegistryService, type ToolContract as _ToolContract } from '@/services/UnifiedToolRegistry'
// @NEXUS-FIX-043: ParamResolutionPipeline - Complete param resolution - DO NOT REMOVE
// NOTE: Now used in wpc-helpers.ts; kept here for marker preservation
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ParamResolutionPipeline as _ParamResolutionPipeline, type ResolvedParams as _ResolvedParams } from '@/services/ParamResolutionPipeline'
// @NEXUS-FIX-044: OAuthController - OAuth flow management - DO NOT REMOVE
// NOTE: ConnectionStatus imported for future integration when OAuthController is wired up
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { ConnectionStatus as _ConnectionStatus } from '@/services/OAuthController'
// @NEXUS-FIX-037 & FIX-038: UI components for unsupported tools and parameter collection
// NOTE: These imports are for Phase 3 integration - uncomment when UI integration is complete
// import { UnsupportedToolCard } from './UnsupportedToolCard'
// import { ParameterCollectionPanel, type MissingParam, type CollectedParam } from './ParameterCollectionPanel'

// @NEXUS-WHATSAPP: WhatsApp connection prompt for workflows with WhatsApp nodes
import { WhatsAppConnectionPrompt } from './WhatsAppConnectionPrompt'

// @NEXUS-GENERIC-ORCHESTRATION: 5-Layer Generic Orchestration System
// Enables Nexus to work with ANY of Rube's 500+ tools without hardcoding
import {
  getSchemaResolver,
  createCollector,  // @NEXUS-FIX-064: Import for schema-driven question regeneration
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getUXTranslator as _getUXTranslator,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  type DiscoveredTool as _DiscoveredTool,
} from '@/services/orchestration'
// Persistent user memory tracking
import { userMemoryService } from '@/services/UserMemoryService'
// Cross-conversation entity learning (Finding #2)
import { userContextService } from '@/services/UserContextService'

// ============================================================================
// Extracted modules - types, constants, utilities, and sub-components
// ============================================================================

// Types
import type {
  NodeStatus,
  CardPhase,
  WorkflowNode,
  MissingInfoItem,
  WorkflowPreviewCardProps,
  AuthState,
  ParallelAuthState,
  OrchestrationResult,
  WorkflowValidation,
} from './wpc-types'

// Constants
import { getIcon } from './wpc-constants'

// Tool utilities
import {
  isParamSemanticallycollected,
  getCanonicalParamName,
  getFallbackTools,
  validateToolSlug,
  isToolNotFoundError,
  mapNodeToToolSlug,
  getDefaultParams,
  validateRequiredParams,
  extractIdFromUrl,
} from './wpc-tool-utils'

// Helpers (orchestration, validation, param mapping)
import {
  USE_GENERIC_ORCHESTRATION,
  USE_ORCHESTRATION_FIRST,
  resolveToolViaOrchestration,
  isToolkitKnown,
  mapCollectedParamsToToolParams,
  _resolveToolSlugWithRegistry,
  inferActionFromNodeName,
  _resolveParamsWithPipeline,
  _getEnhancedMissingParams,
  validateWorkflowBeforeExecution,
  getParamFixSuggestion,
  getTriggerSampleFields,
} from './wpc-helpers'

// Sub-components
import { MiniNodeHorizontal } from './wpc-MiniNode'
import { AuthPrompt } from './wpc-AuthPrompt'
import { ParallelAuthPrompt } from './wpc-AuthPrompt'

// ============================================================================
// Missing Info Section with Custom Input Support
// ============================================================================

// @NEXUS-FIX-108: Accept collectedParams to check already-answered questions from Quick Setup - DO NOT REMOVE
function MissingInfoSection({
  missingInfo,
  onSelect,
  collectedParams = {}
}: {
  missingInfo: MissingInfoItem[]
  onSelect?: (field: string, value: string) => void
  collectedParams?: Record<string, string>
}) {
  // ONE STEP AT A TIME: Track answered fields to show next unanswered
  // Track which fields have custom input expanded
  const [showCustomInput, setShowCustomInput] = React.useState(false)
  // Track custom input value
  const [customValue, setCustomValue] = React.useState('')
  // Track answered fields (local state for answers given within this component)
  const [localAnsweredFields, setLocalAnsweredFields] = React.useState<Set<string>>(new Set())

  // @NEXUS-FIX-105: Deduplicate missingInfo questions semantically - DO NOT REMOVE
  // @NEXUS-FIX-108: Also check collectedParams from Quick Setup - DO NOT REMOVE
  // Get remaining unanswered questions with semantic deduplication
  const seenCanonicalFields = new Set<string>()
  const unansweredQuestions = missingInfo.filter(item => {
    // Check if answered locally (within this component)
    if (localAnsweredFields.has(item.field)) return false

    // FIX-108: Check if already collected via Quick Setup using canonical name matching
    const canonicalField = getCanonicalParamName(item.field)

    // Check if any collected param matches this canonical field
    for (const [key, value] of Object.entries(collectedParams)) {
      if (value && value !== '') {
        const collectedCanonical = getCanonicalParamName(key)
        if (collectedCanonical === canonicalField || key === item.field) {
          console.log(`[FIX-108] Skipping missingInfo "${item.field}" - already collected as "${key}": ${value}`)
          return false
        }
      }
    }

    // FIX-105: Check for semantic duplicates within missingInfo
    if (seenCanonicalFields.has(canonicalField)) {
      console.log(`[FIX-105] Deduplicating missingInfo: ${item.field} → canonical: ${canonicalField}`)
      return false
    }
    seenCanonicalFields.add(canonicalField)
    return true
  })

  // Get current question (first unanswered)
  const currentQuestion = unansweredQuestions[0]

  // Check if an option is a "custom" type option
  const isCustomOption = (option: string): boolean => {
    const lower = option.toLowerCase()
    return lower.includes('custom') || lower.includes('other') || lower.includes('specify')
  }

  const handleOptionClick = (field: string, option: string) => {
    if (isCustomOption(option)) {
      setShowCustomInput(true)
    } else {
      // Learn from user's selection for future suggestions (Finding #2)
      userContextService.learnFromChoice(field, option)
      // Submit and move to next question
      onSelect?.(field, option)
      setLocalAnsweredFields(prev => new Set(prev).add(field))
      setShowCustomInput(false)
      setCustomValue('')
    }
  }

  const handleCustomSubmit = (field: string) => {
    const value = customValue.trim()
    if (value) {
      // Learn from user's custom value for future suggestions (Finding #2)
      userContextService.learnFromChoice(field, value)
      onSelect?.(field, value)
      setLocalAnsweredFields(prev => new Set(prev).add(field))
      setShowCustomInput(false)
      setCustomValue('')
    }
  }

  const handleCustomCancel = () => {
    setShowCustomInput(false)
    setCustomValue('')
  }

  // All questions answered
  if (!currentQuestion) {
    return null
  }

  // FIX-108: Progress based on answered vs total questions (clamped to 0-100%)
  const progressPercent = missingInfo.length > 0 ? Math.min(100, Math.round(((missingInfo.length - unansweredQuestions.length) / missingInfo.length) * 100)) : 0
  const remaining = unansweredQuestions.length

  // @NEXUS-UX-002: Parameter collection with VIP hospitality - DO NOT REMOVE
  return (
    <div className="px-4 pb-3">
      <div className="p-4 rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 space-y-4">
        {/* @NEXUS-UX-002: Friendly header */}
        <div className="flex items-center gap-2 text-xs text-cyan-400">
          <span>🎯 Quick Question</span>
          {missingInfo.length > 1 && (
            <span className="text-slate-500">• {remaining} {remaining === 1 ? 'question' : 'questions'} to go</span>
          )}
        </div>

        {/* Progress indicator - friendly, not overwhelming */}
        {missingInfo.length > 1 && (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 whitespace-nowrap">
              {remaining === 1 ? '🎉 Last one!' : `${progressPercent}% done`}
            </span>
          </div>
        )}

        {/* Current question - one at a time */}
        <div className="space-y-3">
          <p className="text-sm text-white font-medium">
            {currentQuestion.question}
          </p>

          {/* Show custom input if expanded */}
          {showCustomInput ? (
            <div className="space-y-3">
              <input
                type="text"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCustomSubmit(currentQuestion.field)
                  if (e.key === 'Escape') handleCustomCancel()
                }}
                placeholder="Type your answer..."
                className="w-full px-4 py-3 text-sm rounded-lg bg-slate-800 text-white border border-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 placeholder-slate-500"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleCustomSubmit(currentQuestion.field)}
                  disabled={!customValue.trim()}
                  className={cn(
                    "flex-1 px-4 py-2.5 text-sm rounded-lg font-medium transition-all",
                    customValue.trim()
                      ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-lg hover:shadow-cyan-500/25"
                      : "bg-slate-700 text-slate-400 cursor-not-allowed"
                  )}
                >
                  Continue →
                </button>
                <button
                  onClick={handleCustomCancel}
                  className="px-4 py-2.5 text-sm rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-700 transition-all"
                >
                  Back
                </button>
              </div>
            </div>
          ) : (
            /* Show option buttons - clean, one question at a time */
            <div className="flex flex-wrap gap-2">
              {currentQuestion.options.map((option, optIdx) => (
                <button
                  key={optIdx}
                  onClick={() => handleOptionClick(currentQuestion.field, option)}
                  className={cn(
                    "px-4 py-2.5 text-sm rounded-lg border transition-all font-medium",
                    isCustomOption(option)
                      ? "bg-purple-500/20 text-purple-300 border-purple-500/50 hover:bg-purple-500/30 hover:border-purple-400"
                      : "bg-slate-700/50 text-white border-slate-600 hover:bg-slate-600 hover:border-cyan-500/50"
                  )}
                >
                  {option}
                </button>
              ))}
              {/* Always add a "Type my own" option if none exists */}
              {!currentQuestion.options.some(isCustomOption) && (
                <button
                  onClick={() => setShowCustomInput(true)}
                  className="px-4 py-2.5 text-sm rounded-lg bg-transparent text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/10 hover:border-cyan-500/50 transition-all"
                >
                  Type my own...
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Trigger Sample Data Collection
// ============================================================================


/**
 * Component for collecting trigger sample data
 */
function TriggerSampleDataPrompt({
  node,
  toolkit,
  onSubmit,
  onCancel,
}: {
  node: { id: string; name: string }
  toolkit: string
  onSubmit: (nodeId: string, data: Record<string, string>) => void
  onCancel: () => void
}) {
  const fields = getTriggerSampleFields(node.name, toolkit)
  const [values, setValues] = React.useState<Record<string, string>>({})

  const handleSubmit = () => {
    // Only submit non-empty values
    const filledValues: Record<string, string> = {}
    for (const field of fields) {
      if (values[field.field]?.trim()) {
        filledValues[field.field] = values[field.field].trim()
      }
    }
    onSubmit(node.id, filledValues)
  }

  const hasAnyValue = Object.values(values).some(v => v?.trim())

  // @NEXUS-UX-002: Sample data prompt with friendly UX - DO NOT REMOVE
  return (
    <div className="px-4 pb-4">
      <div className="p-4 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 space-y-4">
        {/* @NEXUS-UX-002: Friendly header with celebration vibe */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-white">🎯 Let's Test It!</h4>
            <p className="text-xs text-slate-400 mt-1">
              I'll simulate what happens when "{node.name}" triggers. Fill in some sample data or skip to use defaults.
            </p>
          </div>
        </div>

        {/* @NEXUS-UX-002: Quick fill example buttons */}
        <div className="flex flex-wrap gap-2">
          <span className="text-[10px] text-slate-500 w-full mb-1">Quick fill with example:</span>
          {fields.slice(0, 1).map((_field) => (
            <button
              key="prefill"
              onClick={() => {
                const prefillValues: Record<string, string> = {}
                fields.forEach(f => {
                  prefillValues[f.field] = f.placeholder
                })
                setValues(prefillValues)
              }}
              className="px-3 py-1.5 text-xs rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all"
            >
              ✨ Use Example Data
            </button>
          ))}
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-xs rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-700 transition-all"
          >
            ⏭️ Skip (Use Defaults)
          </button>
        </div>

        {/* Input fields - now with smarter placeholders */}
        <div className="space-y-3">
          {fields.map((field) => (
            <div key={field.field}>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {field.label}
              </label>
              {field.field === 'body' || field.field === 'message' || field.field === 'data' ? (
                <textarea
                  value={values[field.field] || ''}
                  onChange={(e) => setValues(prev => ({ ...prev, [field.field]: e.target.value }))}
                  placeholder={field.placeholder}
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-slate-800 text-white border border-slate-600 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 placeholder-slate-500 resize-none"
                />
              ) : (
                <input
                  type="text"
                  value={values[field.field] || ''}
                  onChange={(e) => setValues(prev => ({ ...prev, [field.field]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-slate-800 text-white border border-slate-600 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 placeholder-slate-500"
                />
              )}
            </div>
          ))}
        </div>

        {/* @NEXUS-UX-002: Action buttons - more prominent Skip option */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleSubmit}
            disabled={!hasAnyValue}
            className={cn(
              "flex-1 px-4 py-2.5 text-sm rounded-lg font-medium transition-all",
              hasAnyValue
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg hover:shadow-amber-500/25"
                : "bg-slate-700 text-slate-400 cursor-not-allowed"
            )}
          >
            🚀 Test With This Data
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2.5 text-sm rounded-lg bg-green-500/20 text-green-300 border border-green-500/40 hover:bg-green-500/30 transition-all font-medium"
          >
            ✓ Skip & Continue
          </button>
        </div>

        <p className="text-[10px] text-slate-500 text-center">
          💡 Tip: Skipping uses smart defaults. You can always customize later!
        </p>
      </div>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function WorkflowPreviewCard({
  workflow,
  className,
  autoExecute = false,
  onExecutionComplete,
  onMissingInfoSelect,
  onNodeRemove,
  onNodeAdd,
}: WorkflowPreviewCardProps): React.ReactElement {
  const navigate = useNavigate()

  // Phase and execution state
  const [phase, setPhase] = React.useState<CardPhase>('ready')
  const [_executionLog, setExecutionLog] = React.useState<string[]>([])

  // Pre-execution validation state
  const [_workflowValidation, setWorkflowValidation] = React.useState<WorkflowValidation | null>(null)

  // Trigger sample data for beta testing
  // Key = node id, Value = sample data object
  const [triggerSampleData, setTriggerSampleData] = React.useState<Record<string, Record<string, string>>>({})
  const [showTriggerDataPrompt, setShowTriggerDataPrompt] = React.useState(false)
  const [currentTriggerNode, setCurrentTriggerNode] = React.useState<string | null>(null)

  // @NEXUS-FIX-030: Track pending input value for error recovery - DO NOT REMOVE
  // Bug: User enters value in input field, clicks Retry, but value was never submitted
  // Fix: Track pending input and submit it when Retry is clicked
  const pendingErrorInputRef = React.useRef<{ field: string; value: string } | null>(null)

  // @NEXUS-FIX-033: Pre-flight validation system - DO NOT REMOVE
  // Validates ALL required params BEFORE execution to eliminate crash-and-retry loops
  const [preFlightResult, setPreFlightResult] = React.useState<PreFlightResult | null>(null)
  const [_preFlightAnswers, setPreFlightAnswers] = React.useState<Record<string, string>>({})
  // @NEXUS-FIX-040: Removed answeredQuestionIds state - no longer needed
  // PreFlightService.check() already filters out answered questions via collectedParams
  // The questions array length directly indicates remaining questions
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0)
  const [preFlightInputValue, setPreFlightInputValue] = React.useState('')
  const [preFlightError, setPreFlightError] = React.useState<string | null>(null)
  const [showPreFlight, setShowPreFlight] = React.useState(true) // Show pre-flight by default
  // Local copy of collected params - initialized from workflow.collectedParams, updated during pre-flight
  const [collectedParams, setCollectedParams] = React.useState<Record<string, string>>(
    () => workflow.collectedParams || {}
  )

  // @NEXUS-FIX-068: Sync parent's collectedParams to local state - DO NOT REMOVE
  // Problem: Quick Questions answers update workflow.collectedParams in parent (ChatContainer),
  // but local collectedParams state is only initialized at mount.
  // This causes Quick Setup to re-ask the same questions that were already answered.
  // Solution: Sync new params from parent when they change.
  React.useEffect(() => {
    if (workflow.collectedParams) {
      setCollectedParams(prev => {
        // Check if parent has params that local doesn't have yet
        const parentParams = workflow.collectedParams || {}
        const hasNewParams = Object.keys(parentParams).some(
          key => prev[key] === undefined && parentParams[key] !== undefined && parentParams[key] !== ''
        )
        if (hasNewParams) {
          console.log('[FIX-068] Syncing parent collectedParams to local:', {
            parent: parentParams,
            local: prev,
            merged: { ...parentParams, ...prev }
          })
          // Merge: parent params first, local takes precedence (ongoing session edits)
          return { ...parentParams, ...prev }
        }
        return prev
      })
    }
  }, [workflow.collectedParams])

  // @NEXUS-FIX-055: Store orchestration results for unknown toolkits - DO NOT REMOVE
  // When pre-flight discovers unknown toolkits, it calls orchestration to get required params.
  // Those params are converted to PreFlightQuestions and merged into the pre-flight result.
  // This map stores the orchestration results keyed by node ID for use during execution.
  const [orchestrationResults, setOrchestrationResults] = React.useState<Map<string, OrchestrationResult>>(new Map())
  const [isLoadingOrchestration, setIsLoadingOrchestration] = React.useState(false)

  // Node state
  const [nodes, setNodes] = React.useState<WorkflowNode[]>(() =>
    workflow.nodes.map((n) => ({
      id: n.id,
      name: n.name,
      type: (n.type as 'trigger' | 'action' | 'output') || 'action',
      integration: n.integration,
      status: 'idle' as NodeStatus,
    }))
  )

  // @NEXUS-FIX-121: Track which node is selected for detail panel (outside scroll overflow) - DO NOT REMOVE
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null)
  const handleNodeSelect = React.useCallback((nodeId: string) => {
    setSelectedNodeId(prev => prev === nodeId ? null : nodeId)
  }, [])
  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) ?? null : null

  // Run validation on mount and when workflow changes
  React.useEffect(() => {
    const validation = validateWorkflowBeforeExecution(workflow.nodes)
    setWorkflowValidation(validation)

    // Log validation results for debugging
    console.log('[WorkflowPreviewCard] Validation result:', validation)

    if (!validation.isValid) {
      console.warn('[WorkflowPreviewCard] Workflow has validation issues:', validation.blockers)
    }
  }, [workflow.nodes])

  // Auth state (legacy - sequential)
  const [authState, setAuthState] = React.useState<AuthState>({
    currentIntegration: null,
    connectedIntegrations: new Set(),
    pendingIntegrations: [],
    redirectUrl: null,
    isChecking: false,
    isPolling: false,
    pollAttempts: 0,
  })

  // Parallel auth state (new - minimal clicks)
  const [parallelAuthState, setParallelAuthState] = React.useState<ParallelAuthState>({})
  const [isParallelMode, _setIsParallelMode] = React.useState(true) // Default to parallel mode for minimal clicks

  // @NEXUS-WHATSAPP: WhatsApp connection state - DO NOT REMOVE
  // WhatsApp uses whatsapp-web.js (QR/pairing code), not Composio OAuth
  const [whatsAppState, setWhatsAppState] = React.useState<{
    needed: boolean
    connected: boolean
    showPrompt: boolean
  }>({ needed: false, connected: false, showPrompt: false })

  // Node editing panel state (minimal state - main state in ChatContainer)
  const [showEditPanel, setShowEditPanel] = React.useState(false)

  // Flag to trigger auto-execution after all integrations connect
  const shouldAutoExecuteRef = React.useRef(false)

  // @NEXUS-FIX-023: Ref to always get latest executeWorkflow (fixes stale closure in setTimeout) - DO NOT REMOVE
  const executeWorkflowRef = React.useRef<() => Promise<void>>(() => Promise.resolve())

  // Execution mode: beta (user's account) vs production (client's account)
  const [executionMode, setExecutionMode] = React.useState<'beta' | 'production'>('beta')

  // Get required integrations
  const requiredIntegrations = React.useMemo(
    () => getRequiredIntegrations(workflow.nodes),
    [workflow.nodes]
  )

  // @NEXUS-WHATSAPP: Detect if workflow needs WhatsApp Web (personal) vs WhatsApp Business API
  // WhatsApp Web uses QR code/pairing code via whatsapp-web.js
  // WhatsApp Business uses Composio OAuth (API key flow)
  const { whatsAppIntegrations, oauthIntegrations } = React.useMemo(() => {
    const whatsApp: IntegrationInfo[] = []
    const oauth: IntegrationInfo[] = []

    for (const integration of requiredIntegrations) {
      const toolkitLower = integration.toolkit.toLowerCase().replace(/[^a-z]/g, '') // normalize
      // Only personal WhatsApp (exact 'whatsapp') uses WhatsApp Web (QR/pairing)
      // WhatsApp Business (whatsappbusiness, whatsapp-business) uses Composio OAuth
      if (toolkitLower === 'whatsapp') {
        whatsApp.push(integration)
      } else {
        oauth.push(integration)
      }
    }

    return { whatsAppIntegrations: whatsApp, oauthIntegrations: oauth }
  }, [requiredIntegrations])

  // Add log message (defined before useEffect that uses it)
  const addLog = React.useCallback((message: string) => {
    setExecutionLog((prev: string[]) => [...prev.slice(-9), `[${new Date().toLocaleTimeString()}] ${message}`])
  }, [])

  // @NEXUS-WHATSAPP: Check WhatsApp connection status using whatsapp-web.js API
  const checkWhatsAppStatus = React.useCallback(async () => {
    if (whatsAppIntegrations.length === 0) {
      setWhatsAppState({ needed: false, connected: true, showPrompt: false })
      return true
    }

    setWhatsAppState(prev => ({ ...prev, needed: true }))
    addLog('Checking WhatsApp connection...')

    try {
      // Use the new whatsapp-web.js API endpoint
      const response = await fetch('/api/whatsapp-web/sessions', {
        headers: {
          'x-user-id': localStorage.getItem('nexus_user_id') || 'anonymous'
        }
      })
      const data = await response.json()

      // Check for an active/ready session
      if (data.success && data.sessions && data.sessions.length > 0) {
        const activeSession = data.sessions.find((s: { state: string }) => s.state === 'ready')
        if (activeSession) {
          setWhatsAppState({ needed: true, connected: true, showPrompt: false })
          addLog('✓ WhatsApp connected')
          return true
        }
      }

      // No active session - show connection prompt
      setWhatsAppState({ needed: true, connected: false, showPrompt: true })
      addLog('WhatsApp connection required')
      return false
    } catch (error) {
      console.error('WhatsApp status check failed:', error)
      setWhatsAppState({ needed: true, connected: false, showPrompt: true })
      return false
    }
  }, [whatsAppIntegrations.length, addLog])

  // @NEXUS-WHATSAPP: Handle WhatsApp connection completion
  const handleWhatsAppConnected = React.useCallback(() => {
    setWhatsAppState({ needed: true, connected: true, showPrompt: false })
    addLog('✓ WhatsApp connected successfully!')
    // If all OAuth integrations are also connected, proceed to ready
    if (authState.pendingIntegrations.length === 0) {
      setPhase('ready')
    }
  }, [addLog, authState.pendingIntegrations.length])

  // @NEXUS-FIX-033 & @NEXUS-FIX-055 & @NEXUS-FIX-074: Run pre-flight check with orchestration support - DO NOT REMOVE
  // This checks ALL required params BEFORE execution, eliminating the loop problem.
  // For unknown toolkits (not in TOOL_SLUGS), it also discovers required params via orchestration.
  // FIX-074: Now uses backend /api/preflight/check with REAL Composio schema fetching
  React.useEffect(() => {
    // Async IIFE for pre-flight check
    const runPreFlightCheck = async () => {
      // Convert workflow nodes to the format PreFlightService expects
      const preFlightNodes = workflow.nodes.map(n => ({
        id: n.id,
        name: n.name,
        type: (n.type as 'trigger' | 'action') || 'action',
        tool: (n as { tool?: string }).tool,
        integration: n.integration,
        params: (n as { config?: Record<string, unknown> }).config
      }))

      // Get list of connected integrations from authState
      const connectedList = Array.from(authState.connectedIntegrations)

      // @NEXUS-FIX-074: Use async backend check with REAL schema fetching - DO NOT REMOVE
      // This calls /api/preflight/check which fetches schemas from Composio SDK
      // Falls back to local static check if backend unavailable
      let result: PreFlightResult
      try {
        result = await PreFlightService.checkAsync(preFlightNodes, collectedParams, connectedList)
        console.log('[WorkflowPreviewCard] Pre-flight check (FIX-074 backend):', {
          ready: result.ready,
          questionsCount: result.questions.length,
          questions: result.questions.map(q => q.paramName),
          connections: result.connections
        })
      } catch (error) {
        console.warn('[WorkflowPreviewCard] Backend pre-flight failed, using static fallback:', error)
        result = PreFlightService.check(preFlightNodes, collectedParams, connectedList)
        console.log('[WorkflowPreviewCard] Pre-flight check (static fallback):', {
          ready: result.ready,
          questionsCount: result.questions.length,
          questions: result.questions.map(q => q.paramName),
          connections: result.connections
        })
      }

      // @NEXUS-FIX-055 & @NEXUS-FIX-059: Discover params via orchestration - DO NOT REMOVE
    // FIX-055: For unknown toolkits, discover params via orchestration
    // FIX-059: When USE_ORCHESTRATION_FIRST is enabled, ALL toolkits go through orchestration
    //          Static TOOL_REQUIREMENTS becomes a fallback (used only if API fails)
    const nodesToOrchestrate = workflow.nodes.filter(n => {
      const integration = n.integration?.toLowerCase().replace(/\s+/g, '').replace(/-/g, '') || ''
      const nodeType = (n.type as string) || 'action'
      // @NEXUS-FIX-058: Include triggers in orchestration discovery - DO NOT REMOVE
      // Some triggers need params (webhook filters, schedule patterns, etc.)
      // The orchestration API will return 0 questions for triggers that don't need params

      // @NEXUS-FIX-059: Orchestration-first approach - DO NOT REMOVE
      // When USE_ORCHESTRATION_FIRST is true, include KNOWN toolkits in orchestration
      const isKnown = integration && isToolkitKnown(integration)
      const isUnknown = integration && !isKnown

      // Determine if this node should go through orchestration
      const shouldOrchestrate = USE_ORCHESTRATION_FIRST
        ? integration  // All nodes with an integration
        : isUnknown    // Only unknown toolkits (legacy behavior)

      if (shouldOrchestrate && isKnown) {
        console.log(`[ORCHESTRATION-FIRST] Using orchestration for known toolkit: ${integration}`)
      }

      console.log(`[ORCHESTRATION-DISCOVERY] Checking node: ${n.name} (type: ${nodeType}, integration: ${integration}, orchestrate: ${!!shouldOrchestrate})`)

      // Check if we already have questions for this node in static pre-flight
      const hasQuestions = result.questions.some(q => q.nodeId === n.id)
      // @NEXUS-FIX-055: Skip if already processed by orchestration (prevents re-render loop)
      const alreadyProcessed = orchestrationResults.has(n.id)

      // @NEXUS-FIX-059: For orchestration-first, skip nodes that already have static questions
      // Those will be used as fallback if orchestration fails
      return shouldOrchestrate && !alreadyProcessed && (USE_ORCHESTRATION_FIRST ? true : !hasQuestions)
    })

    if (nodesToOrchestrate.length > 0 && USE_GENERIC_ORCHESTRATION) {
      // @NEXUS-FIX-059: Log whether we're using orchestration-first approach
      if (USE_ORCHESTRATION_FIRST) {
        const knownToolkits = nodesToOrchestrate
          .map(n => n.integration?.toLowerCase().replace(/\s+/g, '').replace(/-/g, '') || '')
          .filter(i => isToolkitKnown(i))
        if (knownToolkits.length > 0) {
          console.log('[ORCHESTRATION-FIRST] Processing known toolkits via orchestration:', knownToolkits)
        }
      }
      console.log('[WorkflowPreviewCard] Discovering params via orchestration:',
        nodesToOrchestrate.map(n => n.integration))

      setIsLoadingOrchestration(true)

      // Discover params for toolkits asynchronously
      const discoverToolkits = async () => {
        const newOrchResults = new Map(orchestrationResults)
        const orchestrationQuestions: PreFlightQuestion[] = []
        // @NEXUS-FIX-059: Track nodes where orchestration failed (for static fallback)
        const orchestrationFailedNodes: string[] = []

        for (const node of nodesToOrchestrate) {
          const integration = node.integration || ''
          const integrationLower = integration.toLowerCase().replace(/\s+/g, '').replace(/-/g, '')
          const isKnown = isToolkitKnown(integrationLower)

          if (USE_ORCHESTRATION_FIRST && isKnown) {
            console.log(`[ORCHESTRATION-FIRST] Discovering params for KNOWN toolkit: ${node.name} (${integration})`)
          } else {
            console.log(`[ORCHESTRATION-PREFLIGHT] Discovering params for ${node.name} (${integration})...`)
          }

          const orchResult = await resolveToolViaOrchestration(node.name, integration)

          // @NEXUS-FIX-063: Use legacy TOOL_SLUGS for KNOWN toolkits - DO NOT REMOVE
          // Problem: Rube semantic search returns wrong tools (e.g., CALENDAR_CREATE instead of GOOGLECALENDAR_EVENTS_LIST)
          // Solution: For known toolkits, override orchestration slug with correct legacy mapping
          // Keep sessionId from orchestration for schema fetching (FIX-062)
          if (orchResult && isKnown) {
            const legacySlug = mapNodeToToolSlug(node.name, integration)
            if (legacySlug && legacySlug !== orchResult.slug) {
              console.log(`[ORCHESTRATION-FIRST] FIX-063: Overriding orchestration slug ${orchResult.slug} with legacy slug ${legacySlug}`)
              orchResult.slug = legacySlug
              orchResult.source = 'legacy'

              // @NEXUS-FIX-064: Re-fetch schema and regenerate questions for legacy tool - DO NOT REMOVE
              // Problem: When FIX-063 overrides the slug, questions are still from the WRONG tool's schema
              // Example: CALENDAR_CREATE schema doesn't require start_datetime, but GOOGLECALENDAR_CREATE_EVENT does
              // Solution: After slug override, fetch the CORRECT schema and regenerate questions
              // This ensures pre-flight collects ALL required params for the actual tool we'll execute
              try {
                console.log(`[ORCHESTRATION-FIRST] FIX-064: Re-fetching schema for legacy slug: ${legacySlug}`)
                const schemaResolver = getSchemaResolver()
                const legacySchema = await schemaResolver.getSchema(legacySlug, orchResult.sessionId)

                if (legacySchema && legacySchema.required && legacySchema.required.length > 0) {
                  // Create new collector with correct schema to generate questions
                  const legacyCollector = createCollector(legacySchema)
                  const legacyQuestions = legacyCollector.getAllQuestions()

                  console.log(`[ORCHESTRATION-FIRST] FIX-064: Regenerated ${legacyQuestions.length} questions from legacy schema:`,
                    legacyQuestions.map(q => q.paramName))
                  console.log(`[ORCHESTRATION-FIRST] FIX-064: Required params for ${legacySlug}:`, legacySchema.required)

                  // Replace questions with correct ones from legacy schema
                  orchResult.questions = legacyQuestions
                } else {
                  console.log(`[ORCHESTRATION-FIRST] FIX-064: No required params in legacy schema for ${legacySlug}`)
                }
              } catch (schemaError) {
                console.warn(`[ORCHESTRATION-FIRST] FIX-064: Failed to re-fetch schema for ${legacySlug}:`, schemaError)
                // Keep original questions as fallback
              }
            }
          }

          // @NEXUS-FIX-055 & @NEXUS-FIX-059: Always mark node as processed to prevent infinite re-render loop
          // Even if no tools/questions found, we must track that we TRIED to discover this node
          // Otherwise the useEffect dependency on orchestrationResults will trigger again
          const emptyResult: OrchestrationResult = {
            slug: '',
            toolkit: integration,
            action: '',
            displayName: node.name,
            questions: [],
            sessionId: '',
            source: 'orchestration'
          }

          if (orchResult) {
            newOrchResults.set(node.id, orchResult)
          } else {
            // @NEXUS-FIX-059: Orchestration failed - mark for static fallback
            // @NEXUS-FIX-064-EXT: BUT if it's a known toolkit, try to fetch schema directly - DO NOT REMOVE
            // This handles the case where Rube returns 0 tools but we know the legacy slug
            // Example: "Create Calendar Event" fails orchestration, but GOOGLECALENDAR_CREATE_EVENT is known
            if (USE_ORCHESTRATION_FIRST && isKnown) {
              const legacySlug = mapNodeToToolSlug(node.name, integration)
              if (legacySlug) {
                console.log(`[ORCHESTRATION-FIRST] FIX-064-EXT: Orchestration failed but toolkit known. Trying legacy slug: ${legacySlug}`)
                try {
                  const schemaResolver = getSchemaResolver()
                  // Use a temporary session ID for direct schema fetch (schema is cached anyway)
                  const tempSessionId = emptyResult.sessionId || `fallback_${Date.now()}`
                  const legacySchema = await schemaResolver.getSchema(legacySlug, tempSessionId)

                  if (legacySchema && legacySchema.required && legacySchema.required.length > 0) {
                    console.log(`[ORCHESTRATION-FIRST] FIX-064-EXT: Found schema for ${legacySlug} with required:`, legacySchema.required)
                    const legacyCollector = createCollector(legacySchema)
                    const legacyQuestions = legacyCollector.getAllQuestions()

                    // Create a proper result with the schema-derived questions
                    // @NEXUS-FIX-064-EXT: source='legacy' since questions derived from legacy slug schema
                    const schemaResult: OrchestrationResult = {
                      slug: legacySlug,
                      toolkit: integration,
                      action: legacySlug.split('_').slice(1).join('_').toLowerCase(),
                      displayName: node.name,
                      questions: legacyQuestions,
                      sessionId: tempSessionId,
                      source: 'legacy'  // From legacy slug schema (FIX-064-EXT)
                    }
                    newOrchResults.set(node.id, schemaResult)
                    console.log(`[ORCHESTRATION-FIRST] FIX-064-EXT: Generated ${legacyQuestions.length} questions from schema:`,
                      legacyQuestions.map(q => q.paramName))
                    // Don't add to orchestrationFailedNodes - we have questions now!
                  } else {
                    console.log(`[ORCHESTRATION-FIRST] FIX-064-EXT: Schema found but no required params for ${legacySlug}`)
                    newOrchResults.set(node.id, emptyResult)
                    orchestrationFailedNodes.push(node.id)
                  }
                } catch (schemaError) {
                  console.warn(`[ORCHESTRATION-FIRST] FIX-064-EXT: Failed to fetch schema for ${legacySlug}:`, schemaError)
                  newOrchResults.set(node.id, emptyResult)
                  orchestrationFailedNodes.push(node.id)
                }
              } else {
                newOrchResults.set(node.id, emptyResult)
                orchestrationFailedNodes.push(node.id)
                console.log(`[ORCHESTRATION-FIRST] Orchestration failed for ${node.name} - no legacy mapping, using static fallback`)
              }
            } else {
              newOrchResults.set(node.id, emptyResult)
              console.log(`[ORCHESTRATION-FIRST] Orchestration failed for ${node.name} - will use static fallback`)
            }
          }

          // @NEXUS-FIX-064-EXT: Read from newOrchResults to include schema-fallback questions - DO NOT REMOVE
          // The original orchResult may be null when orchestration failed, but FIX-064-EXT may have
          // added schema-derived questions to newOrchResults for known toolkits
          const finalResult = newOrchResults.get(node.id)
          if (finalResult && finalResult.questions.length > 0) {
            console.log(`[ORCHESTRATION-PREFLIGHT] Found ${finalResult.questions.length} questions for ${node.name} (source: ${finalResult.source || 'orchestration'}):`,
              finalResult.questions.map(q => q.paramName))

            // Convert orchestration questions to PreFlightQuestion format
            for (const q of finalResult.questions) {
              // @NEXUS-FIX-103: Use semantic check for already collected params - DO NOT REMOVE
              // Previous bug: exact match only - "message" and "text" were treated as different params
              // Fix: Use isParamSemanticallycollected to check aliases
              const isAlreadyCollected = isParamSemanticallycollected(q.paramName, collectedParams)
              if (isAlreadyCollected || q.answered) {
                console.log(`[ORCHESTRATION-PREFLIGHT] FIX-100: Skipping ${q.paramName} - semantically already collected`)
                continue
              }

              orchestrationQuestions.push({
                id: `${node.id}_${q.paramName}`,
                nodeId: node.id,
                nodeName: node.name,
                integration: integration.toLowerCase(),
                paramName: q.paramName,
                displayName: q.displayName,
                prompt: q.prompt,
                quickActions: q.quickActions || [],
                inputType: (q.inputType || 'text') as 'text' | 'phone' | 'email' | 'url' | 'select' | 'textarea',
                placeholder: q.placeholder || `Enter ${q.displayName.toLowerCase()}...`,
                required: true
              })
            }
          }
        }

        setOrchestrationResults(newOrchResults)

        // @NEXUS-FIX-059: Merge orchestration questions with static fallback questions
        // For orchestration-first: use orchestration questions where available, static where failed
        // Filter static questions to only include nodes where orchestration failed (fallback)
        // @NEXUS-FIX-071: Only mark node as "succeeded" if orchestration returned actual questions - DO NOT REMOVE
        // Previous bug: Nodes with 0 orchestration questions (triggers, tools with no required params) were
        // marked as "succeeded", filtering out ALL static questions and causing Quick Setup to disappear.
        // Fix: Only treat orchestration as "succeeded" if it found questions. Nodes with 0 questions
        // fall back to static questions (AI-inferred from missingInfo).
        const orchestrationSucceededNodeIds = new Set(
          Array.from(newOrchResults.entries())
            .filter(([, orchResult]) => orchResult.questions.length > 0) // FIX-071: Only count nodes with actual questions
            .filter(([nodeId]) => !orchestrationFailedNodes.includes(nodeId))
            .map(([nodeId]) => nodeId)
        )

        // Keep static questions only for nodes where orchestration failed
        const staticFallbackQuestions = USE_ORCHESTRATION_FIRST
          ? result.questions.filter(q => !orchestrationSucceededNodeIds.has(q.nodeId))
          : result.questions

        // @NEXUS-FIX-103: Deduplicate questions by semantic param name - DO NOT REMOVE
        // Previous bug: "message" from static and "text" from orchestration both showed (5 duplicates!)
        // Fix: Group by canonical param name and keep only first occurrence per node
        const rawQuestions = [...staticFallbackQuestions, ...orchestrationQuestions]
        const seenCanonicalParams = new Map<string, Set<string>>() // nodeId -> Set of canonical param names

        // @NEXUS-FIX-106: Cross-node deduplication for semantic equivalents - DO NOT REMOVE
        // Previous bug: Gmail asks "body", Dropbox asks "content", Slack asks "text" - all 3 showed!
        // Fix: For certain semantic groups, only ask ONCE across ALL nodes (answer applies to all)
        const CROSS_NODE_SEMANTIC_GROUPS = new Set(['text', 'to', 'subject', 'name']) // Canonical names that should only be asked once globally
        const seenGlobalCanonicalParams = new Set<string>() // Track cross-node seen params

        const allQuestions = rawQuestions.filter(q => {
          const canonicalName = getCanonicalParamName(q.paramName)
          const nodeKey = q.nodeId

          // @NEXUS-FIX-106: Cross-node deduplication for semantic groups
          if (CROSS_NODE_SEMANTIC_GROUPS.has(canonicalName)) {
            if (seenGlobalCanonicalParams.has(canonicalName)) {
              console.log(`[FIX-106] Cross-node deduplication: ${q.paramName} (canonical: ${canonicalName}) already asked for another node`)
              return false
            }
            seenGlobalCanonicalParams.add(canonicalName)
            // Continue to also add to per-node tracking (for logging)
          }

          // Get or create the set of seen params for this node
          if (!seenCanonicalParams.has(nodeKey)) {
            seenCanonicalParams.set(nodeKey, new Set())
          }
          const nodeSeenParams = seenCanonicalParams.get(nodeKey)!

          // If we've already seen this canonical param for this node, skip it
          if (nodeSeenParams.has(canonicalName)) {
            console.log(`[FIX-100] Deduplicating question: ${q.paramName} (canonical: ${canonicalName}) for node ${q.nodeName}`)
            return false
          }

          // Mark as seen and include
          nodeSeenParams.add(canonicalName)
          return true
        })

        if (allQuestions.length > 0 || orchestrationQuestions.length > 0 || staticFallbackQuestions.length > 0) {
          const mergedResult: PreFlightResult = {
            ...result,
            ready: allQuestions.length === 0, // Ready only if no questions
            questions: allQuestions,
            summary: {
              ...result.summary,
              totalQuestions: allQuestions.length
            }
          }

          console.log('[WorkflowPreviewCard] Pre-flight check (with orchestration):', {
            ready: mergedResult.ready,
            questionsCount: mergedResult.questions.length,
            questions: mergedResult.questions.map(q => q.paramName),
            addedViaOrchestration: orchestrationQuestions.map(q => q.paramName),
            staticFallback: staticFallbackQuestions.map(q => q.paramName),
            orchestrationFailedNodes: orchestrationFailedNodes
          })

          setPreFlightResult(mergedResult)
          if (allQuestions.length > 0) {
            setShowPreFlight(true) // Show pre-flight UI since we have questions
          } else {
            setShowPreFlight(false)
          }
        } else {
          // @NEXUS-FIX-056 & @NEXUS-FIX-059: Orchestration found no questions and no fallback - ready
          setPreFlightResult({
            ...result,
            ready: result.connections.every(c => c.connected),
            questions: []
          })
          setShowPreFlight(false)
        }

        setIsLoadingOrchestration(false)
      }

      discoverToolkits()
      // @NEXUS-FIX-056 & @NEXUS-FIX-059: Don't set static result here - orchestration callback will set merged result
      // The async callback in discoverToolkits() calls setPreFlightResult(mergedResult)
      // If we also call setPreFlightResult(result) below, it creates a race condition where
      // the static result (0 questions) overwrites the merged result (with orchestration questions)
      return
    }

    // @NEXUS-FIX-056 & @NEXUS-FIX-059: If orchestration already completed and set merged result, don't overwrite
    // This handles the second useEffect run triggered by orchestrationResults dependency change
    // After orchestration sets merged result with questions, useEffect re-runs due to dependency change
    // On that re-run, nodesToOrchestrate is empty (all marked as processed), so we reach here
    // But we must NOT overwrite the merged result - orchestration already set the correct result
    // EXCEPT: Allow update when all orchestration questions have been answered (to enable execution button)
    if (orchestrationResults.size > 0) {
      // @NEXUS-FIX-069: Check DISPLAYED questions, not RAW orchestration questions - DO NOT REMOVE
      // Problem: Previous code built allOrchestrationQuestions from RAW orchestrationResults.questions,
      // which includes params that were filtered out at lines 3262-3266 (already collected).
      // This caused allAnswered to fail because those params might be in collectedParams under
      // different keys (e.g., from Quick Questions/missingInfo which uses AI-determined field names).
      // Solution: Check against preFlightResult.questions (what's actually shown in Quick Setup).
      // If all DISPLAYED questions are answered, we're done.
      const displayedQuestions = preFlightResult?.questions || []
      const displayedParamNames = displayedQuestions.map(q => q.paramName)

      console.log('[FIX-069] Checking displayed questions:', {
        displayedCount: displayedParamNames.length,
        displayedParams: displayedParamNames,
        collectedParamsKeys: Object.keys(collectedParams)
      })

      // @NEXUS-FIX-066: Fix pre-flight questions disappearing when orchestration has no required params
      // Previously, allOrchestrationQuestions.length === 0 was treated as "all answered", wiping all questions.
      // This caused questions to appear for 2-3 seconds then disappear when triggers had no required params.
      // Fix: Only treat as "all answered" if orchestration actually HAD questions AND they're all answered.
      // If orchestration has 0 questions (like triggers), fall through to use static result with AI questions.

      if (displayedParamNames.length > 0) {
        // @NEXUS-FIX-057 & @NEXUS-FIX-069: Validate non-empty param values for DISPLAYED questions only
        const allAnswered = displayedParamNames.every(paramName =>
          collectedParams[paramName] !== undefined && collectedParams[paramName] !== '')

        console.log('[FIX-069] allAnswered check:', {
          allAnswered,
          missingParams: displayedParamNames.filter(p => !collectedParams[p] || collectedParams[p] === '')
        })

        if (allAnswered) {
          // All orchestration questions answered - update preFlightResult to reflect completion
          // This will set questions.length to 0, enabling the execution button
          console.log('[WorkflowPreviewCard] All orchestration questions answered - updating pre-flight result')
          setPreFlightResult({
            ...result,
            ready: result.connections.length === 0, // Ready if no connections needed
            questions: [], // All questions answered
          })
          setShowPreFlight(false)
          return
        }

        // Orchestration has unanswered questions - preserve orchestration result
        console.log('[WorkflowPreviewCard] Preserving orchestration pre-flight result (skipping static overwrite)')
        return
      }

      // @NEXUS-FIX-066: Orchestration found tools but NO required params (like triggers)
      // Fall through to use static result which may have AI-generated questions (missingInfo)
      console.log('[WorkflowPreviewCard] FIX-066: Orchestration has tools but no required params - using static result')
    }

      // No orchestration needed - set static result
      setPreFlightResult(result)

      // If no questions needed, hide pre-flight UI
      if (result.questions.length === 0) {
        setShowPreFlight(false)
      }
    } // End of runPreFlightCheck async function

    // @NEXUS-FIX-074: Execute async pre-flight check - DO NOT REMOVE
    runPreFlightCheck()
  }, [workflow.nodes, collectedParams, authState.connectedIntegrations, orchestrationResults])

  // @NEXUS-FIX-054: Reset question index when questions array changes - DO NOT REMOVE
  // After pre-flight re-runs, the questions array shrinks (answered questions filtered out).
  // If currentQuestionIndex exceeds new array bounds, questions[index] returns undefined,
  // causing currentPreFlightQuestion to be null and Quick Setup panel to disappear.
  // This effect resets the index to 0 whenever questions change, ensuring valid access.
  React.useEffect(() => {
    if (preFlightResult && preFlightResult.questions.length > 0) {
      // Always show the first unanswered question (index 0 in the filtered array)
      if (currentQuestionIndex >= preFlightResult.questions.length) {
        console.log('[WorkflowPreviewCard] Resetting question index to 0 (was out of bounds)')
        setCurrentQuestionIndex(0)
      }
    }
  }, [preFlightResult?.questions.length, currentQuestionIndex])

  // @NEXUS-FIX-033: Pre-flight question handlers - DO NOT REMOVE
  // Handle answering a pre-flight question
  const handlePreFlightAnswer = React.useCallback((questionId: string, paramName: string, value: string) => {
    // Validate the answer
    const question = preFlightResult?.questions.find(q => q.id === questionId)
    if (question) {
      const validation = PreFlightService.validateAnswer(question, value)
      if (!validation.valid) {
        setPreFlightError(validation.error || 'Invalid value')
        return
      }
    }

    // @NEXUS-FIX-118: Extract IDs from URLs before storing - DO NOT REMOVE
    // Users often paste full URLs (Google Sheets, Notion, GitHub) but APIs need just the ID
    const extractedValue = extractIdFromUrl(paramName, value)
    if (extractedValue !== value) {
      console.log(`[FIX-118] URL extraction: ${paramName} URL → ID: ${extractedValue}`)
    }

    console.log('[WorkflowPreviewCard] Pre-flight answer:', { questionId, paramName, value: extractedValue })

    // Store the answer (with extracted ID, not raw URL)
    setPreFlightAnswers(prev => ({ ...prev, [paramName]: extractedValue }))

    // @NEXUS-FIX-040: Removed setAnsweredQuestionIds - collectedParams handles tracking
    // The pre-flight check re-runs on collectedParams change, filtering answered questions

    // Also store in collectedParams for execution
    setCollectedParams(prev => ({ ...prev, [paramName]: extractedValue }))

    // Learn from user's parameter choice for future suggestions (Finding #2)
    userContextService.learnFromChoice(paramName, extractedValue)

    // Also notify parent (for ChatContainer to track)
    onMissingInfoSelect?.(paramName, value)

    // Clear input and error
    setPreFlightInputValue('')
    setPreFlightError(null)

    // Move to next question
    if (preFlightResult) {
      const nextIndex = currentQuestionIndex + 1
      if (nextIndex < preFlightResult.questions.length) {
        setCurrentQuestionIndex(nextIndex)
      } else {
        // All questions answered - hide pre-flight UI
        setShowPreFlight(false)
        console.log('[WorkflowPreviewCard] Pre-flight complete! All questions answered.')
      }
    }
  }, [preFlightResult, currentQuestionIndex, onMissingInfoSelect])

  // Get current pre-flight question
  const currentPreFlightQuestion = React.useMemo(() => {
    if (!preFlightResult || preFlightResult.questions.length === 0) return null
    return preFlightResult.questions[currentQuestionIndex] || null
  }, [preFlightResult, currentQuestionIndex])

  // Check if pre-flight is complete (all questions answered)
  // @NEXUS-FIX-040: Fixed race condition in isPreFlightComplete - DO NOT REMOVE
  // The questions array from PreFlightService only contains UNANSWERED questions
  // After each answer, collectedParams updates, triggering re-run that filters out answered questions
  // So if questions.length === 0, ALL required params have been collected
  // Previous bug: compared answeredQuestionIds.size with stale preFlightResult.questions.length
  const isPreFlightComplete = React.useMemo(() => {
    if (!preFlightResult) return true // No pre-flight needed
    // questions array only contains unanswered questions - if empty, all answered
    return preFlightResult.questions.length === 0
  }, [preFlightResult])

  // @NEXUS-FIX-118: Execution Dry-Run Validation Gate - DO NOT REMOVE
  // Problem: Pre-flight checks integration-level params (e.g., "googlesheets" needs "spreadsheet_id")
  // but execution checks tool-slug-level params (e.g., "GOOGLESHEETS_BATCH_UPDATE" needs "spreadsheet_id").
  // These can drift out of sync, causing execution failures even after pre-flight passes.
  // Solution: When all pre-flight questions are answered, do a "dry-run" that mirrors
  // execution's param resolution — same tool slug, same defaults, same merge — and validate.
  // If any params are still missing, add them as new questions BEFORE execution starts.
  const dryRunCompletedRef = React.useRef<string | null>(null)

  React.useEffect(() => {
    // Only run when pre-flight questions are all answered
    if (!preFlightResult || preFlightResult.questions.length > 0) return
    if (phase !== 'ready') return

    // Create a fingerprint of current collected params to avoid re-running
    const paramsFingerprint = JSON.stringify(collectedParams)
    if (dryRunCompletedRef.current === paramsFingerprint) return
    dryRunCompletedRef.current = paramsFingerprint

    console.log('[FIX-118] Running execution dry-run validation...')

    const missingQuestions: PreFlightQuestion[] = []

    for (const rawNode of workflow.nodes) {
      // Construct a proper WorkflowNode with status field for getDefaultParams compatibility
      const node: WorkflowNode = {
        id: rawNode.id,
        name: rawNode.name,
        type: (rawNode.type as 'trigger' | 'action' | 'output') || 'action',
        integration: rawNode.integration,
        status: 'idle',
        config: (rawNode as Record<string, unknown>).config as Record<string, unknown> | undefined,
        description: (rawNode as Record<string, unknown>).description as string | undefined,
      }
      const integrationInfo = getIntegrationInfo(node.integration || node.name)

      // Skip trigger, AI, internal nodes — same logic as executeWorkflow
      const isTriggerNode = node.type === 'trigger' ||
        node.name.toLowerCase().includes('monitor') ||
        node.name.toLowerCase().includes('watch') ||
        node.name.toLowerCase().includes('listen') ||
        node.name.toLowerCase().includes('receive')

      if (isTriggerNode) continue

      const hasRealIntegration = integrationInfo.toolkit !== 'ai' &&
        integrationInfo.toolkit !== 'nexus' &&
        integrationInfo.toolkit !== 'unknown' &&
        integrationInfo.toolkit !== 'default' &&
        node.integration?.toLowerCase() !== 'ai' &&
        node.integration?.toLowerCase() !== 'nexus'

      if (!hasRealIntegration) continue // AI/internal node

      // Resolve tool slug — same as execution
      const toolkitLower = integrationInfo.toolkit.toLowerCase().replace(/\s+/g, '').replace(/-/g, '')
      let toolSlug: string | null = null

      const storedOrchResult = orchestrationResults.get(node.id)
      if (storedOrchResult?.slug) {
        toolSlug = storedOrchResult.slug
        if (isToolkitKnown(toolkitLower)) {
          const legacySlug = mapNodeToToolSlug(node.name, integrationInfo.toolkit)
          if (legacySlug) toolSlug = legacySlug
        }
      } else if (isToolkitKnown(toolkitLower)) {
        toolSlug = mapNodeToToolSlug(node.name, integrationInfo.toolkit)
      }

      if (!toolSlug) continue // Can't validate without a tool slug

      // Get params — same merge as execution
      // @NEXUS-FIX-118: Provide synthetic flow data for dry-run - DO NOT REMOVE
      // Problem: Params like SLACK_SEND_MESSAGE.text depend on trigger data flowing from previous nodes.
      // In dry-run there's no actual execution, so flowData is empty and these params show as "missing".
      // Solution: Provide synthetic previous results so getDefaultParams can generate flow-dependent defaults.
      // This prevents false "missing param" questions for params that WILL be available at execution time.
      const nodeIdx = workflow.nodes.findIndex(n => n.id === rawNode.id)
      const syntheticPreviousResults = workflow.nodes.slice(0, nodeIdx).map(prevRawNode => ({
        node: {
          id: prevRawNode.id,
          name: prevRawNode.name,
          type: (prevRawNode.type as 'trigger' | 'action' | 'output') || 'action',
          integration: prevRawNode.integration,
          status: 'success' as NodeStatus,
        },
        result: prevRawNode.type === 'trigger' ? {
          type: 'trigger_sample_data',
          data: {
            from: 'trigger@example.com',
            subject: 'Workflow Trigger Event',
            body: 'Data from workflow trigger step',
            sender_name: 'Nexus Workflow',
            message: 'Trigger data flowing to next step',
          }
        } : {
          type: 'action_result',
          id: `prev_${prevRawNode.id}`,
          text: 'Result from previous step',
          message: 'Data from previous action',
        }
      }))

      const defaultParams = getDefaultParams(toolSlug, node, syntheticPreviousResults, {
        name: workflow.name,
        description: workflow.description,
      })
      const collectedToolParams = mapCollectedParamsToToolParams(
        collectedParams as Record<string, string>,
        integrationInfo.toolkit,
        toolSlug
      )
      const mergedParams = { ...defaultParams, ...collectedToolParams }

      // Validate — same as execution
      const missing = validateRequiredParams(toolSlug, mergedParams)

      if (missing.length > 0) {
        console.log(`[FIX-118] Dry-run found missing params for ${node.name} (${toolSlug}):`, missing)
        for (const paramName of missing) {
          // Don't re-ask params that are already in collected
          const isAlreadyCollected = Object.keys(collectedParams).some(k =>
            k === paramName || k.endsWith(`.${paramName}`)
          )
          if (isAlreadyCollected) continue

          const friendlyPrompt = getParamFixSuggestion(paramName, integrationInfo.toolkit)
          missingQuestions.push({
            id: `dryrun_${node.id}_${paramName}`,
            nodeId: node.id,
            nodeName: node.name,
            integration: integrationInfo.toolkit.toLowerCase(),
            paramName,
            displayName: paramName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            prompt: friendlyPrompt || `What ${paramName.replace(/_/g, ' ')} should I use for ${node.name}?`,
            quickActions: [],
            inputType: 'text',
            placeholder: `Enter ${paramName.replace(/_/g, ' ')}...`,
            required: true
          })
        }
      }
    }

    if (missingQuestions.length > 0) {
      console.log(`[FIX-118] Dry-run validation found ${missingQuestions.length} additional params needed:`,
        missingQuestions.map(q => `${q.nodeName}:${q.paramName}`))

      // Reset dry-run fingerprint so it can re-check after user answers these
      dryRunCompletedRef.current = null

      // Add missing questions to pre-flight result
      setPreFlightResult(prev => prev ? {
        ...prev,
        ready: false,
        questions: missingQuestions,
        summary: { ...prev.summary, totalQuestions: missingQuestions.length }
      } : null)
      setShowPreFlight(true)
      setCurrentQuestionIndex(0)
    } else {
      console.log('[FIX-118] Dry-run validation passed — all nodes have required params!')
    }
  }, [preFlightResult, collectedParams, phase, workflow, orchestrationResults])
  // @NEXUS-FIX-118-END

  // Listen for OAuth callback messages from popup windows
  React.useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      // Only accept messages from our own origin
      if (event.origin !== window.location.origin) return

      const { type, success, provider, error } = event.data || {}

      if (type === 'oauth_callback') {
        console.log('[WorkflowPreviewCard] Received OAuth callback message:', { success, provider, error })

        if (success && provider) {
          // OAuth succeeded - update connected integrations
          setAuthState((prev) => {
            const newConnected = new Set(prev.connectedIntegrations)
            newConnected.add(provider)

            // Find remaining integrations
            const remaining = prev.pendingIntegrations.filter((i) => i.toolkit !== provider && i.id !== provider)

            if (remaining.length === 0) {
              // All integrations connected!
              shouldAutoExecuteRef.current = true
              setPhase('ready')
              return {
                ...prev,
                currentIntegration: null,
                connectedIntegrations: newConnected,
                pendingIntegrations: [],
                redirectUrl: null,
                isPolling: false,
                pollAttempts: 0,
              }
            } else {
              // Move to next integration
              return {
                ...prev,
                currentIntegration: remaining[0],
                connectedIntegrations: newConnected,
                pendingIntegrations: remaining,
                redirectUrl: null,
                isPolling: false,
                pollAttempts: 0,
              }
            }
          })

          addLog(`✓ ${provider} connected via OAuth!`)
        } else if (error) {
          console.error('[WorkflowPreviewCard] OAuth error:', error)
          addLog(`OAuth error: ${error}`)
          setAuthState((prev) => ({ ...prev, isPolling: false }))
        }
      }
    }

    window.addEventListener('message', handleOAuthMessage)
    return () => window.removeEventListener('message', handleOAuthMessage)
  }, [addLog])

  // Check connections via Composio API
  // @NEXUS-WHATSAPP: Now handles WhatsApp separately from OAuth integrations
  const checkConnections = React.useCallback(async () => {
    setPhase('checking')
    setAuthState((prev) => ({ ...prev, isChecking: true }))
    addLog('Checking integration connections...')

    try {
      // @NEXUS-WHATSAPP: Check WhatsApp first (uses different flow than OAuth)
      const whatsAppConnected = await checkWhatsAppStatus()
      if (whatsAppIntegrations.length > 0 && !whatsAppConnected) {
        // WhatsApp needs connection - show prompt and wait
        setPhase('needs_auth')
        setAuthState((prev) => ({ ...prev, isChecking: false }))
        return false
      }

      // Get toolkits needed (excluding WhatsApp - handled separately)
      const toolkits = oauthIntegrations.map((i) => i.toolkit)
      console.log('[WorkflowPreviewCard] Checking OAuth connections for toolkits:', toolkits)

      // Check each toolkit connection via Rube MCP API
      const connected = new Set<string>()
      const pending: IntegrationInfo[] = []

      for (const integration of oauthIntegrations) {
        try {
          const status = await rubeClient.checkConnection(integration.toolkit)
          if (status.connected) {
            connected.add(integration.id)
            addLog(`✓ ${integration.name} connected`)
          } else {
            pending.push(integration)
          }
        } catch {
          // If check fails, assume not connected
          pending.push(integration)
        }
      }

      // NOTE: Removed localStorage fallback - Composio is the authoritative source
      // for connection status. Local cache was causing stale connections to be
      // used when Composio reports the connection doesn't exist.
      // The cache is now only updated AFTER successful Composio OAuth completion.

      // Filter out connected ones from pending
      const stillPending = pending.filter((i) => !connected.has(i.id))

      if (stillPending.length === 0) {
        // All connected - ready to execute!
        addLog('All integrations connected!')
        setAuthState({
          currentIntegration: null,
          connectedIntegrations: connected,
          pendingIntegrations: [],
          redirectUrl: null,
          isChecking: false,
          isPolling: false,
          pollAttempts: 0,
        })
        setPhase('ready')
        return true
      } else {
        // Need to connect some integrations
        const nextIntegration = stillPending[0]
        addLog(`Need to connect ${stillPending.length} integration${stillPending.length > 1 ? 's' : ''}: ${stillPending.map(i => i.name).join(', ')}`)

        // Initialize parallel auth state for all pending integrations
        const initialParallelState: ParallelAuthState = {}
        stillPending.forEach((integration) => {
          initialParallelState[integration.id] = {
            status: 'pending',
            pollAttempts: 0,
          }
        })
        setParallelAuthState(initialParallelState)

        setAuthState({
          currentIntegration: nextIntegration,
          connectedIntegrations: connected,
          pendingIntegrations: stillPending,
          redirectUrl: null,
          isChecking: false,
          isPolling: false,
          pollAttempts: 0,
        })
        setPhase('needs_auth')
        return false
      }
    } catch (error) {
      console.error('[WorkflowPreviewCard] Error checking connections:', error)
      addLog('Error checking connections')
      setPhase('error')
      return false
    }
  }, [oauthIntegrations, whatsAppIntegrations, checkWhatsAppStatus, addLog])

  // @NEXUS-FIX-045: Auto-check connections on mount - DO NOT REMOVE
  // This fixes the bug where WorkflowPreviewCard shows 0/X connections even though
  // the Integrations page confirms connections exist. The connectedIntegrations Set
  // starts empty and was never populated on mount - only when user clicked Execute.
  // Now we auto-check as soon as the component has required integrations.
  const checkedIntegrationsKeyRef = React.useRef<string | null>(null)
  React.useEffect(() => {
    // Skip if no integrations needed
    if (requiredIntegrations.length === 0) {
      return
    }

    // Create a key from the current integrations to track what we've checked
    const integrationsKey = requiredIntegrations.map(i => i.toolkit).sort().join(',')

    // Only check once per unique set of integrations
    if (checkedIntegrationsKeyRef.current === integrationsKey) {
      return
    }
    checkedIntegrationsKeyRef.current = integrationsKey

    // Check connections after a short delay to ensure component is fully mounted
    const timer = setTimeout(() => {
      console.log('[WorkflowPreviewCard] FIX-045: Auto-checking connections for:',
        requiredIntegrations.map(i => i.toolkit))
      checkConnections()
    }, 300)

    return () => clearTimeout(timer)
  }, [requiredIntegrations, checkConnections])

  // Handle connect button click - get real OAuth URL from Rube MCP
  const handleConnect = React.useCallback(async () => {
    if (!authState.currentIntegration) return

    setAuthState((prev) => ({ ...prev, isChecking: true }))
    addLog(`Getting OAuth link for ${authState.currentIntegration.name}...`)

    try {
      const toolkit = authState.currentIntegration.toolkit
      const integration = authState.currentIntegration

      // Get real OAuth URL from Rube MCP
      const results = await rubeClient.initiateConnection([toolkit])
      const result = results[toolkit]

      if (result && result.authUrl) {
        // Got real OAuth URL - show it to user
        const authUrl = result.authUrl // Capture for type safety
        addLog(`Opening ${integration.name} authentication...`)
        setAuthState((prev) => ({
          ...prev,
          redirectUrl: authUrl,
          isChecking: false,
          isPolling: true,
          pollAttempts: 0,
        }))

        // Store OAuth context for callback page
        sessionStorage.setItem('oauth_provider', toolkit)
        sessionStorage.setItem('oauth_return_url', window.location.pathname + window.location.search)

        // Open OAuth URL in new tab
        window.open(result.authUrl, '_blank', 'noopener,noreferrer')

        // Start polling for connection status (check every 3 seconds for 2 minutes)
        let attempts = 0
        const maxAttempts = 40
        const pollInterval = setInterval(async () => {
          attempts++

          // Update poll attempts for UI feedback
          setAuthState((prev) => ({
            ...prev,
            pollAttempts: attempts,
          }))

          if (attempts >= maxAttempts) {
            clearInterval(pollInterval)
            addLog(`${integration.name} authentication timed out`)
            setAuthState((prev) => ({
              ...prev,
              isPolling: false,
              pollAttempts: 0,
            }))
            return
          }

          try {
            const status = await rubeClient.checkConnection(toolkit)
            if (status.connected) {
              clearInterval(pollInterval)

              // Mark as connected
              const newConnected = new Set(authState.connectedIntegrations)
              newConnected.add(integration.id)

              // Save to localStorage
              localStorage.setItem('nexus_connected_integrations', JSON.stringify([...newConnected]))

              addLog(`✓ ${integration.name} connected!`)

              // Check if more integrations needed
              const remaining = authState.pendingIntegrations.filter((i) => i.id !== integration.id)

              if (remaining.length === 0) {
                // All integrations connected - trigger auto-execution
                shouldAutoExecuteRef.current = true
                setAuthState({
                  currentIntegration: null,
                  connectedIntegrations: newConnected,
                  pendingIntegrations: [],
                  redirectUrl: null,
                  isChecking: false,
                  isPolling: false,
                  pollAttempts: 0,
                })
                setPhase('ready')
              } else {
                setAuthState({
                  currentIntegration: remaining[0],
                  connectedIntegrations: newConnected,
                  pendingIntegrations: remaining,
                  redirectUrl: null,
                  isChecking: false,
                  isPolling: false,
                  pollAttempts: 0,
                })
              }
            }
          } catch {
            // Continue polling on error
          }
        }, 3000)
      } else if (result && result.connected) {
        // Already connected - move to next integration
        addLog(`✓ ${integration.name} already connected!`)
        const newConnected = new Set(authState.connectedIntegrations)
        newConnected.add(integration.id)
        localStorage.setItem('nexus_connected_integrations', JSON.stringify([...newConnected]))

        const remaining = authState.pendingIntegrations.filter((i) => i.id !== integration.id)
        if (remaining.length === 0) {
          shouldAutoExecuteRef.current = true
          setAuthState({
            currentIntegration: null,
            connectedIntegrations: newConnected,
            pendingIntegrations: [],
            redirectUrl: null,
            isChecking: false,
            isPolling: false,
            pollAttempts: 0,
          })
          setPhase('ready')
        } else {
          setAuthState({
            currentIntegration: remaining[0],
            connectedIntegrations: newConnected,
            pendingIntegrations: remaining,
            redirectUrl: null,
            isChecking: false,
            isPolling: false,
            pollAttempts: 0,
          })
        }
      } else {
        // Handle error gracefully - fall back to demo mode
        addLog(`OAuth init failed: No auth URL returned`)

        // For demo mode, simulate connection after short delay
        setAuthState((prev) => ({
          ...prev,
          isPolling: true,
          pollAttempts: 0,
        }))

        setTimeout(() => {
          const newConnected = new Set(authState.connectedIntegrations)
          newConnected.add(integration.id)
          localStorage.setItem('nexus_connected_integrations', JSON.stringify([...newConnected]))
          addLog(`✓ ${integration.name} connected (demo mode)`)

          const remaining = authState.pendingIntegrations.filter((i) => i.id !== integration.id)
          if (remaining.length === 0) {
            // All integrations connected - trigger auto-execution
            shouldAutoExecuteRef.current = true
            setAuthState({
              currentIntegration: null,
              connectedIntegrations: newConnected,
              pendingIntegrations: [],
              redirectUrl: null,
              isChecking: false,
              isPolling: false,
              pollAttempts: 0,
            })
            setPhase('ready')
          } else {
            setAuthState({
              currentIntegration: remaining[0],
              connectedIntegrations: newConnected,
              pendingIntegrations: remaining,
              redirectUrl: null,
              isChecking: false,
              isPolling: false,
              pollAttempts: 0,
            })
          }
        }, 1500)
      }
    } catch (error) {
      console.error('[WorkflowPreviewCard] Error connecting:', error)
      addLog(`Error connecting to ${authState.currentIntegration.name}`)
      setAuthState((prev) => ({ ...prev, isChecking: false }))
    }
  }, [authState, addLog])

  // Handle Connect All - PARALLEL OAuth for minimal clicks
  // CRITICAL FIX (Jan 21, 2026): Open popup windows SYNCHRONOUSLY before async calls
  // Browsers block window.open() if called after async operations (not direct user action)
  // @NEXUS-FIX-001 & @NEXUS-FIX-003: Parallel OAuth with popup blocker bypass - DO NOT MODIFY
  const handleConnectAll = React.useCallback(async () => {
    const pendingIntegrations = authState.pendingIntegrations
    if (pendingIntegrations.length === 0) return

    addLog(`Connecting all ${pendingIntegrations.length} integrations in parallel...`)
    setAuthState((prev) => ({ ...prev, isChecking: true }))

    // CRITICAL: Open popup windows IMMEDIATELY (synchronously) to avoid browser popup blocker
    // We open them with a loading page first, then navigate to OAuth URLs after we get them
    const popupWindows: Map<string, Window | null> = new Map()
    for (const integration of pendingIntegrations) {
      // Open popup synchronously - this is allowed because it's direct user action
      const popup = window.open(
        'about:blank',
        `oauth_${integration.toolkit}`,
        'width=600,height=700,left=200,top=100'
      )
      if (popup) {
        // Show loading state in popup while we fetch OAuth URLs
        popup.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Connecting ${integration.name}...</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
              }
              .loader {
                text-align: center;
              }
              .spinner {
                width: 50px;
                height: 50px;
                border: 4px solid rgba(6, 182, 212, 0.3);
                border-top-color: #06b6d4;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 20px;
              }
              @keyframes spin { to { transform: rotate(360deg); } }
            </style>
          </head>
          <body>
            <div class="loader">
              <div class="spinner"></div>
              <h2>Connecting to ${integration.name}...</h2>
              <p style="color: #94a3b8;">Preparing authorization...</p>
            </div>
          </body>
          </html>
        `)
        popupWindows.set(integration.toolkit, popup)
        addLog(`Opened ${integration.name} authorization window...`)
      } else {
        addLog(`⚠ Popup blocked for ${integration.name} - please allow popups`)
      }
    }

    // Initialize parallel state for all pending integrations
    const initialParallelState: ParallelAuthState = {}
    pendingIntegrations.forEach((integration) => {
      initialParallelState[integration.id] = {
        status: 'connecting',
        pollAttempts: 0,
      }
    })
    setParallelAuthState(initialParallelState)

    // Get OAuth URLs for all integrations in parallel
    const toolkits = pendingIntegrations.map((i) => i.toolkit)

    try {
      const results = await rubeClient.initiateConnection(toolkits)

      // Navigate popup windows to OAuth URLs and start polling
      const pollIntervals: NodeJS.Timeout[] = []

      for (const integration of pendingIntegrations) {
        const result = results[integration.toolkit]
        const popup = popupWindows.get(integration.toolkit)

        if (result?.authUrl && popup && !popup.closed) {
          // Navigate existing popup to OAuth URL
          popup.location.href = result.authUrl
          addLog(`Redirecting ${integration.name} to authorization...`)

          // Update state with auth URL
          setParallelAuthState((prev) => ({
            ...prev,
            [integration.id]: {
              status: 'polling',
              authUrl: result.authUrl,
              pollAttempts: 0,
            },
          }))

          // Start polling for this integration
          let attempts = 0
          const maxAttempts = 40
          const pollInterval = setInterval(async () => {
            attempts++

            // Update poll attempts
            setParallelAuthState((prev) => ({
              ...prev,
              [integration.id]: {
                ...prev[integration.id],
                pollAttempts: attempts,
              },
            }))

            if (attempts >= maxAttempts) {
              clearInterval(pollInterval)
              addLog(`${integration.name} authorization timed out`)
              setParallelAuthState((prev) => ({
                ...prev,
                [integration.id]: {
                  ...prev[integration.id],
                  status: 'error',
                  error: 'Timed out',
                },
              }))
              return
            }

            try {
              const status = await rubeClient.checkConnection(integration.toolkit)
              if (status.connected) {
                clearInterval(pollInterval)
                addLog(`✓ ${integration.name} connected!`)

                // Update parallel state
                setParallelAuthState((prev) => ({
                  ...prev,
                  [integration.id]: {
                    ...prev[integration.id],
                    status: 'connected',
                  },
                }))

                // Update main auth state
                setAuthState((prev) => {
                  const newConnected = new Set(prev.connectedIntegrations)
                  newConnected.add(integration.id)
                  localStorage.setItem('nexus_connected_integrations', JSON.stringify([...newConnected]))

                  const remaining = prev.pendingIntegrations.filter((i) => i.id !== integration.id)

                  if (remaining.length === 0) {
                    // All connected! Trigger auto-execution
                    shouldAutoExecuteRef.current = true
                    setPhase('ready')
                    return {
                      ...prev,
                      currentIntegration: null,
                      connectedIntegrations: newConnected,
                      pendingIntegrations: [],
                      isChecking: false,
                    }
                  }

                  return {
                    ...prev,
                    connectedIntegrations: newConnected,
                    pendingIntegrations: remaining,
                  }
                })
              }
            } catch {
              // Continue polling on error
            }
          }, 3000)

          pollIntervals.push(pollInterval)
        } else if (result?.connected) {
          // Already connected - close the popup we opened
          const popup = popupWindows.get(integration.toolkit)
          if (popup && !popup.closed) {
            popup.close()
          }
          addLog(`✓ ${integration.name} already connected!`)
          setParallelAuthState((prev) => ({
            ...prev,
            [integration.id]: {
              status: 'connected',
              pollAttempts: 0,
            },
          }))

          setAuthState((prev) => {
            const newConnected = new Set(prev.connectedIntegrations)
            newConnected.add(integration.id)
            localStorage.setItem('nexus_connected_integrations', JSON.stringify([...newConnected]))

            const remaining = prev.pendingIntegrations.filter((i) => i.id !== integration.id)

            if (remaining.length === 0) {
              shouldAutoExecuteRef.current = true
              setPhase('ready')
              return {
                ...prev,
                currentIntegration: null,
                connectedIntegrations: newConnected,
                pendingIntegrations: [],
                isChecking: false,
              }
            }

            return {
              ...prev,
              connectedIntegrations: newConnected,
              pendingIntegrations: remaining,
            }
          })
        } else {
          // Close any popup that was opened but we couldn't get auth URL for
          const popup = popupWindows.get(integration.toolkit)
          if (popup && !popup.closed) {
            popup.close()
          }

          // Handle error - fall back to demo mode for this integration
          addLog(`${integration.name}: Simulating connection (demo mode)`)
          setParallelAuthState((prev) => ({
            ...prev,
            [integration.id]: {
              status: 'polling',
              pollAttempts: 0,
            },
          }))

          // Simulate connection after delay
          setTimeout(() => {
            setParallelAuthState((prev) => ({
              ...prev,
              [integration.id]: {
                status: 'connected',
                pollAttempts: 0,
              },
            }))

            setAuthState((prev) => {
              const newConnected = new Set(prev.connectedIntegrations)
              newConnected.add(integration.id)
              localStorage.setItem('nexus_connected_integrations', JSON.stringify([...newConnected]))

              const remaining = prev.pendingIntegrations.filter((i) => i.id !== integration.id)

              if (remaining.length === 0) {
                shouldAutoExecuteRef.current = true
                setPhase('ready')
                return {
                  ...prev,
                  currentIntegration: null,
                  connectedIntegrations: newConnected,
                  pendingIntegrations: [],
                  isChecking: false,
                }
              }

              return {
                ...prev,
                connectedIntegrations: newConnected,
                pendingIntegrations: remaining,
              }
            })

            addLog(`✓ ${integration.name} connected (demo mode)`)
          }, 1500 + Math.random() * 1500) // Stagger demo connections
        }
      }

      setAuthState((prev) => ({ ...prev, isChecking: false }))
    } catch (error) {
      console.error('[WorkflowPreviewCard] Error in parallel connect:', error)
      addLog('Error getting connection links')
      setAuthState((prev) => ({ ...prev, isChecking: false }))
    }
  }, [authState.pendingIntegrations, addLog])

  // Handle single integration connect (for use within ParallelAuthPrompt)
  const handleConnectSingle = React.useCallback(async (integration: IntegrationInfo) => {
    // Directly initiate OAuth for this integration
    setAuthState((prev) => ({ ...prev, isChecking: true }))
    addLog(`Getting OAuth link for ${integration.name}...`)

    try {
      const toolkit = integration.toolkit

      // Get real OAuth URL from Rube MCP
      const results = await rubeClient.initiateConnection([toolkit])
      const result = results[toolkit]

      if (result && result.authUrl) {
        addLog(`Opening ${integration.name} authentication...`)

        // Update state with this integration as current
        setAuthState((prev) => ({
          ...prev,
          currentIntegration: integration,
          redirectUrl: result.authUrl || null,
          isChecking: false,
          isPolling: true,
          pollAttempts: 0,
        }))

        // Store OAuth context for callback page
        sessionStorage.setItem('oauth_provider', toolkit)
        sessionStorage.setItem('oauth_return_url', window.location.pathname + window.location.search)

        // Open OAuth URL in new tab
        window.open(result.authUrl, '_blank', 'noopener,noreferrer')

        // Start polling for connection status
        let attempts = 0
        const maxAttempts = 40
        const pollInterval = setInterval(async () => {
          attempts++
          setAuthState((prev) => ({ ...prev, pollAttempts: attempts }))

          if (attempts >= maxAttempts) {
            clearInterval(pollInterval)
            addLog(`${integration.name} authentication timed out`)
            setAuthState((prev) => ({ ...prev, isPolling: false, pollAttempts: 0 }))
            return
          }

          try {
            const status = await rubeClient.checkConnection(toolkit)
            if (status.connected) {
              clearInterval(pollInterval)
              const newConnected = new Set(authState.connectedIntegrations)
              newConnected.add(integration.id)
              localStorage.setItem('nexus_connected_integrations', JSON.stringify([...newConnected]))
              addLog(`✓ ${integration.name} connected!`)

              const remaining = authState.pendingIntegrations.filter((i) => i.id !== integration.id)
              if (remaining.length === 0) {
                shouldAutoExecuteRef.current = true
                setAuthState({
                  currentIntegration: null,
                  connectedIntegrations: newConnected,
                  pendingIntegrations: [],
                  redirectUrl: null,
                  isChecking: false,
                  isPolling: false,
                  pollAttempts: 0,
                })
                setPhase('ready')
              } else {
                setAuthState((prev) => ({
                  ...prev,
                  connectedIntegrations: newConnected,
                  pendingIntegrations: remaining,
                  isPolling: false,
                  pollAttempts: 0,
                }))
              }
            }
          } catch {
            // Continue polling on error
          }
        }, 3000)
      } else if (result && result.connected) {
        addLog(`✓ ${integration.name} already connected!`)
        const newConnected = new Set(authState.connectedIntegrations)
        newConnected.add(integration.id)
        localStorage.setItem('nexus_connected_integrations', JSON.stringify([...newConnected]))

        const remaining = authState.pendingIntegrations.filter((i) => i.id !== integration.id)
        if (remaining.length === 0) {
          shouldAutoExecuteRef.current = true
          setAuthState({
            currentIntegration: null,
            connectedIntegrations: newConnected,
            pendingIntegrations: [],
            redirectUrl: null,
            isChecking: false,
            isPolling: false,
            pollAttempts: 0,
          })
          setPhase('ready')
        } else {
          setAuthState((prev) => ({
            ...prev,
            connectedIntegrations: newConnected,
            pendingIntegrations: remaining,
            isChecking: false,
          }))
        }
      } else {
        addLog(`OAuth init failed: No auth URL returned - using demo mode`)
        setAuthState((prev) => ({ ...prev, isChecking: false }))
      }
    } catch (error) {
      console.error('[WorkflowPreviewCard] Error connecting:', error)
      addLog(`Error connecting to ${integration.name}`)
      setAuthState((prev) => ({ ...prev, isChecking: false }))
    }
  }, [authState, addLog])

  // @NEXUS-FIX-111: Track retry counts per node to prevent infinite retries - DO NOT REMOVE
  const nodeRetryCounts = React.useRef<Map<string, number>>(new Map())

  // Execute workflow with REAL API calls via Composio
  const executeWorkflow = React.useCallback(async () => {
    // Reset retry counts for fresh execution
    nodeRetryCounts.current.clear()
    // First check if we need authentication
    if (phase === 'ready' && requiredIntegrations.length > 0) {
      const allConnected = await checkConnections()
      if (!allConnected) {
        return // Will show auth prompt
      }
    }

    setPhase('executing')
    addLog('Starting workflow execution...')

    // Rube MCP is already initialized via backend - no client init needed

    // Reset all nodes to pending
    setNodes((prev) => prev.map((n) => ({ ...n, status: 'pending' as NodeStatus })))

    // Execute each node
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]

      // Set current node to connecting
      setNodes((prev) =>
        prev.map((n, idx) => ({
          ...n,
          status: idx === i ? 'connecting' : idx < i ? 'success' : 'pending',
        }))
      )

      addLog(`Executing: ${node.name}...`)

      try {
        // Get integration info for this node
        const integrationInfo = getIntegrationInfo(node.integration || node.name)
        // Note: execution time is now tracked by VerifiedExecutor (@NEXUS-FIX-041)

        // HANDLE DIFFERENT NODE TYPES:
        // 1. Trigger nodes (webhooks) - These are EVENT LISTENERS, not runtime executions
        //    In production: Configured once in Composio to send webhooks to our endpoint
        //    In beta test: Mark as "configured" - actual events come from the connected service
        // 2. AI nodes - Internal processing, no external API call needed
        // 3. Action nodes - These ARE runtime executions (send email, create task, etc.)

        const isTriggerNode = node.type === 'trigger' ||
          node.name.toLowerCase().includes('monitor') ||
          node.name.toLowerCase().includes('watch') ||
          node.name.toLowerCase().includes('listen') ||
          node.name.toLowerCase().includes('receive') ||
          node.name.toLowerCase().includes('capture') ||
          node.name.toLowerCase().includes('incoming')

        // @NEXUS-FIX-110: Tightened AI/Internal node classification - DO NOT REMOVE
        // Problem: Keywords like 'extract', 'analyze', 'generate', 'process' caused REAL
        // action nodes (e.g., "Extract Email Attachments", "Generate Invoice", "Process Payment")
        // to be skipped as "AI processing" when they are actually real API calls.
        // Solution: ONLY classify as AI/internal when the integration is EXPLICITLY 'ai' or 'nexus'.
        // Nodes with real integrations (gmail, slack, etc.) should ALWAYS go through execution.
        const hasRealIntegration = integrationInfo.toolkit !== 'ai' &&
          integrationInfo.toolkit !== 'nexus' &&
          integrationInfo.toolkit !== 'unknown' &&
          integrationInfo.toolkit !== 'default' &&
          node.integration?.toLowerCase() !== 'ai' &&
          node.integration?.toLowerCase() !== 'nexus'

        const isAINode = !hasRealIntegration && (
          integrationInfo.toolkit === 'ai' ||
          node.integration?.toLowerCase() === 'ai'
        )

        // Detect internal/output nodes that don't need external API calls
        // These are Nexus-internal steps like "Display Results", "Show Summary", etc.
        // CRITICAL: Only treat as internal if the node does NOT have a real integration
        const nodeNameLower = node.name.toLowerCase()
        const hasOutputPattern = nodeNameLower.includes('display') ||
          nodeNameLower.includes('show output') ||
          nodeNameLower.includes('show result') ||
          nodeNameLower.includes('show summary') ||
          nodeNameLower.includes('present result') ||
          nodeNameLower.includes('format output') ||
          nodeNameLower.includes('notify user') ||
          nodeNameLower.includes('workflow complete')

        const isInternalNode = !hasRealIntegration && (
          integrationInfo.toolkit === 'nexus' ||
          node.integration?.toLowerCase() === 'nexus' ||
          node.type === 'output' ||
          // For unknown/default toolkit, only treat as internal if it has output patterns
          ((integrationInfo.toolkit === 'unknown' || integrationInfo.toolkit === 'default') && hasOutputPattern)
        )
        // @NEXUS-FIX-110-END

        // Handle trigger nodes - they need sample data for beta testing
        if (isTriggerNode) {
          // Check if we have sample data for this trigger
          const sampleData = triggerSampleData[node.id]

          if (!sampleData || Object.keys(sampleData).length === 0) {
            // No sample data provided - prompt the user
            addLog(`⏸️ ${node.name} - Needs sample data for beta test`)

            // Show the sample data prompt
            setCurrentTriggerNode(node.id)
            setShowTriggerDataPrompt(true)

            // Pause execution and set node to "waiting" status
            setNodes((prev) =>
              prev.map((n, idx) => ({
                ...n,
                status: idx === i ? 'connecting' : idx < i ? 'success' : 'pending',
              }))
            )

            // Set phase to indicate we're waiting for input
            setPhase('ready')

            // Don't continue - we need to wait for user input
            // The workflow will be retried after sample data is provided
            return
          }

          // Check if this was skipped (user clicked "Skip" button)
          const wasSkipped = sampleData._skipped === 'true'

          if (wasSkipped) {
            addLog(`⚡ ${node.name} - Skipped (no sample data provided)`)
            setNodes((prev) =>
              prev.map((n, idx) => ({
                ...n,
                status: idx <= i ? 'success' : 'pending',
                result: idx === i ? {
                  type: 'trigger_skipped',
                  data: {},
                  message: 'Trigger skipped (no sample data)',
                  note: 'In production, this would receive real events from the webhook'
                } : n.result,
              }))
            )
          } else {
            // We have real sample data - use it!
            addLog(`⚡ ${node.name} - Using sample data: ${JSON.stringify(sampleData).substring(0, 50)}...`)

            // Mark trigger as complete with the sample data as its "result"
            // This data will flow to subsequent nodes
            setNodes((prev) =>
              prev.map((n, idx) => ({
                ...n,
                status: idx <= i ? 'success' : 'pending',
                result: idx === i ? {
                  type: 'trigger_sample_data',
                  data: sampleData,
                  message: 'Sample data received (beta test)',
                  note: 'In production, this would be real event data from the webhook'
                } : n.result,
              }))
            )
          }
          continue // Move to next node
        }

        // Handle AI processing nodes - internal processing, no external API
        if (isAINode) {
          addLog(`🤖 ${node.name} - AI processing step`)

          // Simulate AI processing (in production, this would use Claude/OpenAI)
          await new Promise(resolve => setTimeout(resolve, 500)) // Brief delay for UX

          setNodes((prev) =>
            prev.map((n, idx) => ({
              ...n,
              status: idx <= i ? 'success' : 'pending',
              result: idx === i ? {
                type: 'ai_processing',
                message: 'AI analysis complete',
                note: 'Internal processing step - no external API required'
              } : n.result,
            }))
          )
          continue // Move to next node
        }

        // Handle internal/output nodes - no external API needed
        // These are steps like "Display Results", "Show Summary" that present data within Nexus
        if (isInternalNode) {
          addLog(`📊 ${node.name} - Internal Nexus step`)

          // Brief delay for UX consistency
          await new Promise(resolve => setTimeout(resolve, 300))

          // Collect results from previous nodes to display
          const previousResults = nodes.slice(0, i).map(n => n.result).filter(Boolean)

          setNodes((prev) =>
            prev.map((n, idx) => ({
              ...n,
              status: idx <= i ? 'success' : 'pending',
              result: idx === i ? {
                type: 'internal_output',
                message: `${node.name} complete`,
                note: 'Internal Nexus step - displays workflow results',
                previousData: previousResults.length > 0 ? previousResults : 'No data from previous steps'
              } : n.result,
            }))
          )
          continue // Move to next node
        }

        // For ACTION nodes - these require actual API execution
        // Map node name to Composio tool slug
        // @NEXUS-FIX-062: Orchestration-First Execution Path - DO NOT REMOVE
        // Problem: Even with USE_ORCHESTRATION_FIRST=true, execution still used legacy path for known toolkits
        // Solution: Check orchestration results FIRST (for all toolkits), then fall back to legacy
        const toolkitLower = integrationInfo.toolkit.toLowerCase().replace(/\s+/g, '').replace(/-/g, '')
        let toolSlug: string | null = null

        // @NEXUS-FIX-062: Check for pre-discovered orchestration result FIRST (for ALL toolkits)
        const storedOrchResult = orchestrationResults.get(node.id)
        if (storedOrchResult && storedOrchResult.slug) {
          // We have a valid orchestration result from pre-flight - use it!
          toolSlug = storedOrchResult.slug
          const isKnown = isToolkitKnown(toolkitLower)

          // @NEXUS-FIX-063: Override orchestration slug with legacy for KNOWN toolkits during EXECUTION - DO NOT REMOVE
          // Problem: Pre-flight stores orchestration slug (e.g., CALENDAR_CREATE) but this is often wrong
          // Solution: For known toolkits, always use legacy TOOL_SLUGS mapping which has correct tool names
          // This mirrors the pre-flight FIX-063 logic but applies it during execution phase
          if (isKnown) {
            const legacySlug = mapNodeToToolSlug(node.name, integrationInfo.toolkit)
            if (legacySlug && legacySlug !== toolSlug) {
              console.log(`[ORCHESTRATION-FIRST] FIX-063: Overriding execution slug ${toolSlug} with legacy slug ${legacySlug}`)
              toolSlug = legacySlug
            }
          }

          if (USE_ORCHESTRATION_FIRST && isKnown) {
            console.log(`[ORCHESTRATION-FIRST] Using tool for KNOWN toolkit ${toolkitLower}: ${toolSlug}`)
          } else {
            console.log(`[ORCHESTRATION] Using pre-discovered tool for ${node.id}: ${toolSlug}`)
          }
        } else if (isToolkitKnown(toolkitLower)) {
          // KNOWN TOOLKIT with no orchestration result: Use legacy fast path
          toolSlug = mapNodeToToolSlug(node.name, integrationInfo.toolkit)
          console.log(`[LEGACY] Using legacy path for known toolkit ${toolkitLower}: ${toolSlug}`)
        } else if (USE_GENERIC_ORCHESTRATION) {
          // UNKNOWN TOOLKIT with no orchestration result: Try orchestration now
          addLog(`🔍 ${node.name} - Unknown toolkit "${integrationInfo.toolkit}", discovering via orchestration...`)
          console.log(`[ORCHESTRATION] Unknown toolkit "${integrationInfo.toolkit}" - trying orchestration first`)
          const orchResult = await resolveToolViaOrchestration(node.name, integrationInfo.toolkit)
          if (orchResult) {
            toolSlug = orchResult.slug
            addLog(`✅ Discovered: ${orchResult.displayName} (${orchResult.slug})`)
            console.log(`[ORCHESTRATION] Session: ${orchResult.sessionId}, Questions: ${orchResult.questions.length}`)
            // Store result for schema validation later
            setOrchestrationResults(prev => {
              const updated = new Map(prev)
              updated.set(node.id, orchResult)
              return updated
            })
          } else {
            // Orchestration failed - fall back to dynamic construction
            console.log(`[ORCHESTRATION] Discovery failed for "${integrationInfo.toolkit}", using dynamic construction fallback`)
            toolSlug = mapNodeToToolSlug(node.name, integrationInfo.toolkit)
          }
        } else {
          // Orchestration disabled - use legacy dynamic construction
          toolSlug = mapNodeToToolSlug(node.name, integrationInfo.toolkit)
        }

        // @NEXUS-FIX-019: Pre-execution tool validation - DO NOT REMOVE
        if (toolSlug) {
          const validation = validateToolSlug(toolSlug, integrationInfo.toolkit)
          if (!validation.valid && validation.suggestion) {
            addLog(`⚠️ Validation: ${validation.reason}`)
          }
        }

        if (!toolSlug) {
          // NO tool mapping - this is an error, not something to simulate
          throw new Error(
            `No tool mapping for "${node.name}" (toolkit: ${integrationInfo.toolkit}). ` +
            `This integration is not yet supported. Please check that ${integrationInfo.name} ` +
            `is correctly configured and has the required API access.`
          )
        }

        // @NEXUS-FIX-043: Resolve params via ParamResolutionPipeline with legacy fallback - DO NOT REMOVE
        // @NEXUS-FIX-113: Pass previous node results for data flow between steps - DO NOT REMOVE
        // @NEXUS-FIX-029: Merge collected params from user answers (handled inside pipeline) - DO NOT REMOVE
        const previousNodeResults = nodes.slice(0, i).map(n => ({ node: n, result: n.result }))
        const pipelineResult = await _resolveParamsWithPipeline(
          toolSlug,
          integrationInfo.toolkit,
          node,
          workflow.collectedParams as Record<string, string> | undefined,
          { name: workflow.name, description: workflow.description },
          previousNodeResults
        )
        const params = pipelineResult.params
        console.log(`[WorkflowPreviewCard] Final params via ${pipelineResult.source}:`, params)

        // @NEXUS-FIX-062: Dynamic schema-based parameter validation - DO NOT REMOVE
        // Problem: Hardcoded validateRequiredParams() only knows ~30 tools out of 500+
        // Solution: Fetch actual required params from Composio schema dynamically
        // When pipeline resolved params, also cross-check against Composio schema
        let missingParams: string[] = []
        const storedOrch = orchestrationResults.get(node.id)
        if (storedOrch?.sessionId) {
          // We have a sessionId from orchestration - use dynamic schema
          try {
            const schemaResolver = getSchemaResolver()
            const schema = await schemaResolver.getSchema(toolSlug, storedOrch.sessionId)
            console.log(`[WorkflowPreviewCard] FIX-062: Got schema for ${toolSlug}, required: ${schema.required?.join(', ') || 'none'}`)

            // Check which required params are missing
            const requiredFromSchema = schema.required || []
            missingParams = requiredFromSchema.filter(param => {
              const value = params[param]
              return value === undefined || value === null || value === ''
            })
          } catch (schemaError) {
            console.warn(`[WorkflowPreviewCard] FIX-062: Schema fetch failed, using fallback validation`, schemaError)
            missingParams = validateRequiredParams(toolSlug, params)
          }
        } else if (pipelineResult.source === 'pipeline' && pipelineResult.resolved) {
          // Pipeline resolved - use its own missing params detection
          missingParams = pipelineResult.resolved.missingRequired
        } else {
          // No sessionId and no pipeline - fall back to hardcoded validation
          missingParams = validateRequiredParams(toolSlug, params)
        }

        // @NEXUS-FIX-021: User-friendly missing parameter messages - DO NOT REMOVE
        // @NEXUS-FIX-031: Include raw param name for correct collection key - DO NOT REMOVE
        // @NEXUS-FIX-043: Use enhanced missing params from pipeline when available - DO NOT REMOVE
        // Problem: UI was using integration name (e.g., 'whatsapp') as collection key for ALL params
        //          This caused second param to overwrite first (both mapped to 'to')
        // Solution: Include [param:XXX] in error so UI can use actual param name as key
        if (missingParams.length > 0) {
          // Use enhanced prompts from pipeline if available, otherwise fall back to legacy
          const enhancedMissing = _getEnhancedMissingParams(
            pipelineResult.resolved,
            integrationInfo.toolkit,
            missingParams
          )
          const friendlyPrompts = enhancedMissing.map(p => p.prompt)
          // @NEXUS-FIX-031: Include first missing param name for UI to use as collection key
          throw new Error(
            `Missing Information: ${node.name} [param:${missingParams[0]}]\n\n` +
            `💡 I need more details to complete this step. Please tell me:\n` +
            friendlyPrompts.map(p => `• ${p}`).join('\n')
          )
        }

        // @NEXUS-FIX-115: Pre-execution connection validation - DO NOT REMOVE
        // Problem: Expired OAuth tokens caused execution failures mid-workflow
        // Solution: Check connection status before executing and warn early
        try {
          const connStatus = await rubeClient.checkConnection(integrationInfo.toolkit)
          if (!connStatus.connected) {
            addLog(`⚠️ ${integrationInfo.name} connection may be expired — attempting execution anyway...`)
            console.warn(`[FIX-115] ${integrationInfo.toolkit} not connected before execution. Will attempt anyway.`)
          }
        } catch (connCheckErr) {
          // Non-blocking — don't fail the workflow just because connection check failed
          console.warn(`[FIX-115] Connection pre-check failed for ${integrationInfo.toolkit}:`, connCheckErr)
        }
        // @NEXUS-FIX-115-END

        // @NEXUS-FIX-041: Execute with VERIFICATION via VerifiedExecutor - DO NOT REMOVE
        // This replaces direct rubeClient.executeTool() to fix silent failures
        const verifiedResult: VerifiedResult = await VerifiedExecutorService.execute(
          toolSlug,
          params,
          {
            nodeId: node.id,
            nodeName: node.name,
            toolkit: integrationInfo.toolkit,
            action: node.type,
            workflowName: workflow.name,
          }
        )

        const executionTime = verifiedResult.executionTimeMs

        if (verifiedResult.success && verifiedResult.verified) {
          // VERIFIED SUCCESS - action actually happened!
          const proofSummary = verifiedResult.proof
            ? VerifiedExecutorService.formatProofForDisplay(verifiedResult.proof)
            : 'Completed'
          addLog(`✓ ${node.name}: ${proofSummary} (${executionTime}ms)`)

          // Update node with result and proof
          const rawData = (verifiedResult.rawResponse as Record<string, unknown>) || {}
          setNodes((prev) =>
            prev.map((n, idx) => ({
              ...n,
              status: idx <= i ? 'success' : 'pending',
              result: idx === i ? {
                ...rawData,
                _verified: true,
                _proof: verifiedResult.proof,
              } : n.result,
            }))
          )
        } else if (verifiedResult.success && !verifiedResult.verified) {
          // API succeeded but couldn't verify - warn user
          addLog(`⚠️ ${node.name}: Completed but unverified (${executionTime}ms)`)
          console.warn('[WorkflowPreviewCard] Unverified result:', verifiedResult)

          // Still mark as success but with warning
          const rawDataUnverified = (verifiedResult.rawResponse as Record<string, unknown>) || {}
          setNodes((prev) =>
            prev.map((n, idx) => ({
              ...n,
              status: idx <= i ? 'success' : 'pending',
              result: idx === i ? {
                ...rawDataUnverified,
                _verified: false,
                _warning: verifiedResult.error?.message || 'Could not verify action',
              } : n.result,
            }))
          )
        } else {
          // Execution failed - throw with user-friendly error
          const errorMsg = verifiedResult.error?.message || 'Execution failed'
          throw new Error(errorMsg)
        }
      } catch (error) {
        console.error(`[WorkflowPreviewCard] Error executing ${node.name}:`, error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        // @NEXUS-FIX-039: Enhanced error classification for user-friendly messages - DO NOT REMOVE
        const catchIntegrationInfo = getIntegrationInfo(node.integration || node.name)
        const errorAnalysis = WorkflowIntelligenceService.classifyError(error as Error, {
          nodeId: node.id,
          toolkit: catchIntegrationInfo.toolkit,
          nodeName: node.name,
        })
        const friendlyMsg = errorAnalysis.friendlyMessage

        // @NEXUS-FIX-111: Auto-retry for recoverable errors - DO NOT REMOVE
        // Problem: Transient errors (rate limits, network, timeouts) killed the entire workflow
        // Solution: Classify the error and retry recoverable ones with exponential backoff
        const retryableCategories = ['rate_limited', 'network_error', 'timeout', 'service_unavailable']
        const errorCategory = errorAnalysis.classification?.category || 'unknown'
        const isRetryable = retryableCategories.includes(errorCategory)
        const maxRetries = errorCategory === 'rate_limited' ? 3 : 2
        const nodeRetryKey = `retry_${node.id}`
        const currentRetry = (nodeRetryCounts.current.get(nodeRetryKey) || 0)

        if (isRetryable && currentRetry < maxRetries) {
          // Increment retry count
          nodeRetryCounts.current.set(nodeRetryKey, currentRetry + 1)
          const backoffMs = Math.min(2000 * Math.pow(2, currentRetry), 15000)
          addLog(`⏳ ${node.name}: ${friendlyMsg} — Retrying in ${Math.round(backoffMs / 1000)}s (attempt ${currentRetry + 1}/${maxRetries})...`)

          // Set node to connecting status during retry wait
          setNodes((prev) =>
            prev.map((n, idx) => ({
              ...n,
              status: idx === i ? 'connecting' : idx < i ? 'success' : 'pending',
            }))
          )

          // Wait then retry this node by decrementing i
          await new Promise(resolve => setTimeout(resolve, backoffMs))
          i-- // Will be incremented by for loop, net effect: retry same node
          continue
        }
        // @NEXUS-FIX-111-END

        // @NEXUS-FIX-020: Tool-not-found detection with fallback suggestions - DO NOT REMOVE
        if (isToolNotFoundError(error as Error)) {
          // Re-compute tool slug in catch block since try-block variables are out of scope
          const catchToolSlug = mapNodeToToolSlug(node.name, catchIntegrationInfo.toolkit)
          const fallbacks = getFallbackTools(catchIntegrationInfo.toolkit, catchToolSlug || '', node.name)
          if (fallbacks.length > 0) {
            addLog(`⚠️ Tool not found: ${catchToolSlug}. Try: ${fallbacks.join(', ')}`)
          } else {
            addLog(`✗ ${node.name}: ${friendlyMsg}`)
          }
        } else {
          // Use friendly message from ErrorClassifier
          addLog(`✗ ${node.name}: ${friendlyMsg}`)
        }

        // @NEXUS-FIX-112: Continue-on-error for non-critical nodes - DO NOT REMOVE
        // Problem: Any node failure killed the entire workflow, even for non-critical steps
        // Solution: Notification/output/non-critical nodes show warning but don't stop execution
        const catchNodeNameLower = node.name.toLowerCase()
        const isNonCriticalNode = catchNodeNameLower.includes('notify') ||
          catchNodeNameLower.includes('alert') ||
          catchNodeNameLower.includes('log') ||
          catchNodeNameLower.includes('notification') ||
          node.type === 'output' ||
          (i === nodes.length - 1 && catchNodeNameLower.includes('summary'))

        if (isNonCriticalNode && !errorMessage.includes('Missing Information')) {
          addLog(`⚠️ ${node.name}: Skipped (non-critical) — ${friendlyMsg}`)
          setNodes((prev) =>
            prev.map((n, idx) => ({
              ...n,
              status: idx === i ? 'success' : idx < i ? 'success' : 'pending',
              result: idx === i ? {
                _skipped: true,
                _warning: friendlyMsg,
                _error: errorMessage,
              } : n.result,
            }))
          )
          continue // Skip this node and continue workflow
        }
        // @NEXUS-FIX-112-END

        // Execution genuinely failed — show the error to the user
        setNodes((prev) =>
          prev.map((n, idx) => ({
            ...n,
            status: idx === i ? 'error' : idx < i ? 'success' : 'pending',
            error: idx === i ? errorMessage : undefined,
          }))
        )

        setPhase('error')
        userMemoryService.recordEvent('workflow_executed', { success: false, name: workflow.name })
        onExecutionComplete?.(false)
        return
      }
    }

    // All done!
    addLog('Workflow completed successfully!')
    setPhase('complete')
    userMemoryService.recordEvent('workflow_executed', {
      success: true,
      name: workflow.name,
      integrations: requiredIntegrations.map(i => i.toolkit),
    })
    onExecutionComplete?.(true)
  // @NEXUS-FIX-023: Added triggerSampleData to dependencies to fix stale closure bug - DO NOT REMOVE
  }, [phase, requiredIntegrations.length, nodes, checkConnections, addLog, onExecutionComplete, triggerSampleData])

  // @NEXUS-FIX-023: Keep ref updated with latest executeWorkflow (for use in setTimeout) - DO NOT REMOVE
  React.useEffect(() => {
    executeWorkflowRef.current = executeWorkflow
  }, [executeWorkflow])

  // Auto-execute on mount if requested
  React.useEffect(() => {
    if (autoExecute) {
      const timer = setTimeout(executeWorkflow, 500)
      return () => clearTimeout(timer)
    }
  }, [autoExecute, executeWorkflow])

  // Auto-execute after all integrations connect (user completed OAuth)
  React.useEffect(() => {
    if (phase === 'ready' && shouldAutoExecuteRef.current) {
      shouldAutoExecuteRef.current = false
      addLog('All integrations connected - auto-executing workflow...')
      // Small delay to let user see the success state
      const timer = setTimeout(() => {
        executeWorkflow()
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [phase, executeWorkflow, addLog])

  // @NEXUS-FIX-026 & @NEXUS-FIX-094: Auto-retry after user provides missing parameter - DO NOT REMOVE
  // When collectedParams changes while in error state, reset and retry execution
  // @NEXUS-FIX-094: Fixed bug where setPhase('ready') triggered re-render which canceled the timeout
  // Solution: Use a separate ref flag to decouple state reset from execution trigger
  const prevCollectedParamsRef = React.useRef<string | null>(null)
  const pendingAutoRetryRef = React.useRef<boolean>(false)

  // Phase 1: Detect param change while in error state, set flag and reset state
  React.useEffect(() => {
    const currentParamsKey = workflow.collectedParams
      ? JSON.stringify(workflow.collectedParams)
      : null

    // Only trigger retry if:
    // 1. We have new collected params
    // 2. They're different from before
    // 3. We're currently in error state
    if (
      currentParamsKey &&
      currentParamsKey !== prevCollectedParamsRef.current &&
      phase === 'error'
    ) {
      console.log('[FIX-094] Collected params changed in error state, scheduling retry:', workflow.collectedParams)
      addLog('Got your answer! Retrying workflow...')

      // Set flag BEFORE state change - this survives the re-render
      pendingAutoRetryRef.current = true

      // Reset workflow state (this triggers re-render)
      setPhase('ready')
      setNodes((prev) => prev.map((n) => ({ ...n, status: 'idle' as NodeStatus, error: undefined })))
      setExecutionLog([])

      prevCollectedParamsRef.current = currentParamsKey
    } else {
      // Update ref without triggering retry (for initial mount or non-error states)
      prevCollectedParamsRef.current = currentParamsKey
    }
  }, [workflow.collectedParams, phase, addLog])

  // Phase 2: Execute when phase becomes 'ready' AND we have a pending retry
  // @NEXUS-FIX-094: Separate effect that doesn't get canceled by state changes
  React.useEffect(() => {
    if (phase === 'ready' && pendingAutoRetryRef.current) {
      // Clear the flag first to prevent double execution
      pendingAutoRetryRef.current = false

      console.log('[FIX-094] Executing auto-retry now that phase is ready')

      // Small delay to allow React to settle
      const timer = setTimeout(() => {
        executeWorkflowRef.current()
      }, 300)

      return () => clearTimeout(timer)
    }
  }, [phase])

  // Open full workflow visualization
  const openFullView = React.useCallback(() => {
    const workflowData = {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      nodes: workflow.nodes,
      generatedAt: Date.now(),
    }
    localStorage.setItem('nexus_generated_workflow', JSON.stringify(workflowData))
    navigate('/workflow-demo?source=ai')
  }, [navigate, workflow])

  // Reset workflow
  const resetWorkflow = React.useCallback(() => {
    setPhase('ready')
    setNodes((prev) => prev.map((n) => ({ ...n, status: 'idle' as NodeStatus })))
    setExecutionLog([])
  }, [])

  // Calculate progress
  const completedNodes = nodes.filter((n) => n.status === 'success').length
  const progress = (completedNodes / nodes.length) * 100
  const isExecuting = phase === 'executing'
  const isComplete = phase === 'complete'
  const hasError = phase === 'error'

  // @NEXUS-FIX-047: Check if ALL nodes were verified, not just successful - DO NOT REMOVE
  // This prevents showing "Beta Test Passed!" when delivery couldn't be confirmed
  const allVerified = React.useMemo(() => {
    if (!isComplete) return true // Only matters when complete
    return nodes.every((n) => {
      // Check if node result has _verified flag
      const result = n.result as Record<string, unknown> | undefined
      // If no result, consider verified (trigger nodes might not have results)
      if (!result) return true
      // If _verified is explicitly false, it's unverified
      return result._verified !== false
    })
  }, [isComplete, nodes])

  // Count unverified nodes for display
  const unverifiedCount = React.useMemo(() => {
    if (!isComplete) return 0
    return nodes.filter((n) => {
      const result = n.result as Record<string, unknown> | undefined
      return result?._verified === false
    }).length
  }, [isComplete, nodes])
  const needsAuth = phase === 'needs_auth'
  const isChecking = phase === 'checking'

  return (
    <div
      className={cn(
        'relative rounded-xl border-2 overflow-hidden transition-all duration-300',
        'bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800',
        isComplete
          ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/20'
          : hasError
          ? 'border-red-500/50 shadow-lg shadow-red-500/20'
          : needsAuth
          ? 'border-purple-500/50 shadow-lg shadow-purple-500/20'
          : isExecuting
          ? 'border-amber-500/50 shadow-lg shadow-amber-500/20'
          : 'border-slate-700 hover:border-slate-600',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              isComplete
                ? 'bg-emerald-500/20'
                : hasError
                ? 'bg-red-500/20'
                : needsAuth
                ? 'bg-purple-500/20'
                : 'bg-gradient-to-br from-purple-500/20 to-cyan-500/20'
            )}
          >
            {isComplete ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : hasError ? (
              <AlertCircle className="w-5 h-5 text-red-400" />
            ) : needsAuth ? (
              <Link2 className="w-5 h-5 text-purple-400" />
            ) : (
              <Zap className="w-5 h-5 text-cyan-400" />
            )}
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm">{workflow.name}</h4>
            <p className="text-xs text-slate-400">{nodes.length} steps</p>
          </div>
        </div>

        <button
          onClick={openFullView}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          title="Open full visualization"
        >
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>

      {/* @NEXUS-WHATSAPP: WhatsApp Connection Prompt (when WhatsApp needs connection) */}
      {whatsAppState.needed && whatsAppState.showPrompt && !whatsAppState.connected && (
        <div className="px-4 pb-4">
          <WhatsAppConnectionPrompt
            onConnected={handleWhatsAppConnected}
            onSkip={() => setWhatsAppState(prev => ({ ...prev, showPrompt: false }))}
          />
        </div>
      )}

      {/* Auth Prompt (when needs authentication) - only show if WhatsApp is already connected */}
      {needsAuth && authState.pendingIntegrations.length > 0 && isParallelMode && (whatsAppState.connected || !whatsAppState.needed) && (
        <ParallelAuthPrompt
          integrations={authState.pendingIntegrations}
          parallelState={parallelAuthState}
          onConnectAll={handleConnectAll}
          onConnectSingle={handleConnectSingle}
          isLoading={authState.isChecking}
          connectedCount={authState.connectedIntegrations.size}
        />
      )}

      {/* Legacy sequential auth (fallback) - only show if WhatsApp is already connected */}
      {needsAuth && authState.currentIntegration && !isParallelMode && (whatsAppState.connected || !whatsAppState.needed) && (
        <AuthPrompt
          integration={authState.currentIntegration}
          redirectUrl={authState.redirectUrl}
          onConnect={handleConnect}
          onSkip={() => setPhase('ready')}
          connectedCount={authState.connectedIntegrations.size}
          totalCount={oauthIntegrations.length}
          isLoading={authState.isChecking}
          isPolling={authState.isPolling}
          pollAttempts={authState.pollAttempts}
        />
      )}

      {/* Workflow visualization (when not in auth mode) */}
      {!needsAuth && (
        <>
          <div className="px-2 sm:px-4 py-3 sm:py-4">
            {/* @NEXUS-FIX-103: Unified horizontal scroll for all screen sizes - IDENTICAL mobile/desktop experience - DO NOT REMOVE */}
            <div className="flex items-center overflow-x-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700 pb-2 snap-x snap-mandatory touch-pan-x">
              {nodes.map((node, index) => (
                <MiniNodeHorizontal
                  key={node.id}
                  node={node}
                  isLast={index === nodes.length - 1}
                  onRemove={onNodeRemove ? (id) => {
                    onNodeRemove(id)
                    setNodes(prev => prev.filter(n => n.id !== id))
                  } : undefined}
                  canEdit={phase === 'ready' && !!onNodeRemove}
                  onSelect={handleNodeSelect}
                  isSelected={selectedNodeId === node.id}
                />
              ))}
            </div>

            {/* @NEXUS-FIX-121: Selected node detail panel - renders OUTSIDE scroll overflow so it's always visible - DO NOT REMOVE */}
            {selectedNode && (
              <div className="mt-2 mx-1 p-3 rounded-lg bg-slate-800/90 border border-slate-600 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <span className="text-xl flex-shrink-0 mt-0.5">{getIcon(selectedNode.integration)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white leading-snug">{selectedNode.name}</p>
                      {selectedNode.integration && (
                        <p className="text-xs text-cyan-400 mt-0.5 capitalize">{selectedNode.integration}</p>
                      )}
                      {selectedNode.description && (
                        <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{selectedNode.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-slate-400">
                          {selectedNode.type === 'trigger' ? '⚡ Trigger' : selectedNode.type === 'output' ? '📤 Output' : '⚙️ Action'}
                        </span>
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded-full',
                          selectedNode.status === 'success' && 'bg-emerald-500/20 text-emerald-400',
                          selectedNode.status === 'connecting' && 'bg-amber-500/20 text-amber-400',
                          selectedNode.status === 'error' && 'bg-red-500/20 text-red-400',
                          selectedNode.status === 'idle' && 'bg-slate-600/50 text-slate-400',
                          selectedNode.status === 'pending' && 'bg-blue-500/20 text-blue-400'
                        )}>
                          {selectedNode.status === 'idle' ? 'Waiting' : selectedNode.status === 'pending' ? 'Pending' : selectedNode.status === 'connecting' ? 'Running...' : selectedNode.status === 'success' ? 'Complete' : 'Failed'}
                        </span>
                      </div>
                      {selectedNode.error && (
                        <p className="text-xs text-red-400 bg-red-500/10 p-2 rounded-lg mt-2">{selectedNode.error}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedNodeId(null)}
                    className="text-slate-400 hover:text-white transition-colors p-1 -mt-1 -mr-1 flex-shrink-0"
                    aria-label="Close node details"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M11 3L3 11M3 3l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="px-4 pb-3">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>
                {isComplete
                  ? 'Workflow completed!'
                  : hasError
                  ? 'Execution failed'
                  : isExecuting
                  ? 'Executing...'
                  : isChecking
                  ? 'Checking connections...'
                  : 'Ready to execute'}
              </span>
              <span>
                {completedNodes}/{nodes.length}
              </span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all duration-500 rounded-full',
                  isComplete
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : hasError
                    ? 'bg-gradient-to-r from-red-500 to-red-400'
                    : 'bg-gradient-to-r from-amber-500 to-amber-400'
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Assumptions display (what defaults were used) */}
          {workflow.assumptions && workflow.assumptions.length > 0 && !isComplete && !hasError && (
            <div className="px-4 pb-3">
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 space-y-2">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-blue-300 mb-1">Smart defaults applied:</p>
                    <ul className="space-y-1">
                      {workflow.assumptions.map((assumption, idx) => (
                        <li key={idx} className="text-xs text-blue-200/80">• {assumption}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Missing info questions (need answers before execution) */}
          {/* @NEXUS-FIX-104: Hide MissingInfoSection when Quick Setup has questions to prevent duplicates - DO NOT REMOVE */}
          {/* @NEXUS-FIX-108: Pass collectedParams so MissingInfoSection can skip already-answered questions - DO NOT REMOVE */}
          {workflow.missingInfo && workflow.missingInfo.length > 0 && !isComplete && !hasError && !isExecuting &&
           !(preFlightResult && preFlightResult.questions && preFlightResult.questions.length > 0) && (
            <MissingInfoSection
              missingInfo={workflow.missingInfo}
              onSelect={onMissingInfoSelect}
              collectedParams={collectedParams}
            />
          )}

          {/* Trigger sample data prompt (for beta testing triggers) */}
          {showTriggerDataPrompt && currentTriggerNode && (() => {
            const triggerNode = nodes.find(n => n.id === currentTriggerNode)
            if (!triggerNode) return null
            const integrationInfo = getIntegrationInfo(triggerNode.integration || triggerNode.name)
            return (
              <TriggerSampleDataPrompt
                node={triggerNode}
                toolkit={integrationInfo.toolkit}
                onSubmit={(nodeId, data) => {
                  // Save the sample data
                  setTriggerSampleData(prev => ({
                    ...prev,
                    [nodeId]: data
                  }))
                  // Hide the prompt
                  setShowTriggerDataPrompt(false)
                  setCurrentTriggerNode(null)
                  // @NEXUS-FIX-023: Use ref to get latest executeWorkflow (fixes stale closure) - DO NOT REMOVE
                  // Resume execution - it will pick up from where it left off
                  // Use a small delay to let state settle
                  setTimeout(() => {
                    executeWorkflowRef.current()
                  }, 100)
                }}
                onCancel={() => {
                  // User chose to skip - provide empty sample data to continue
                  setTriggerSampleData(prev => ({
                    ...prev,
                    [currentTriggerNode]: { _skipped: 'true' }
                  }))
                  setShowTriggerDataPrompt(false)
                  setCurrentTriggerNode(null)
                  // @NEXUS-FIX-023: Use ref to get latest executeWorkflow (fixes stale closure) - DO NOT REMOVE
                  // Resume execution
                  setTimeout(() => {
                    executeWorkflowRef.current()
                  }, 100)
                }}
              />
            )
          })()}

          {/* Confidence indicator */}
          {workflow.confidence !== undefined && workflow.confidence < 0.85 && !isComplete && !hasError && (
            <div className="px-4 pb-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Confidence:</span>
                <span className={cn(
                  'font-medium',
                  workflow.confidence >= 0.85 ? 'text-emerald-400' :
                  workflow.confidence >= 0.70 ? 'text-amber-400' : 'text-red-400'
                )}>
                  {Math.round(workflow.confidence * 100)}%
                </span>
              </div>
              <div className="h-1 bg-slate-800 rounded-full overflow-hidden mt-1">
                <div
                  className={cn(
                    'h-full transition-all duration-300 rounded-full',
                    workflow.confidence >= 0.85 ? 'bg-emerald-500' :
                    workflow.confidence >= 0.70 ? 'bg-amber-500' : 'bg-red-500'
                  )}
                  style={{ width: `${workflow.confidence * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Execution mode toggle (Beta vs Production) */}
          {!isComplete && !hasError && !isExecuting && !isChecking && (
            <div className="px-4 pb-3">
              <div className="flex items-center gap-2 p-1 bg-slate-800 rounded-lg">
                <button
                  onClick={() => setExecutionMode('beta')}
                  className={cn(
                    'flex-1 py-2 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1.5',
                    executionMode === 'beta'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-slate-400 hover:text-slate-300'
                  )}
                >
                  <FlaskConical className="w-3.5 h-3.5" /> Beta Test
                  <span className="text-[10px] opacity-70">(Your Account)</span>
                </button>
                <button
                  onClick={() => setExecutionMode('production')}
                  className={cn(
                    'flex-1 py-2 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1.5',
                    executionMode === 'production'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-300'
                  )}
                >
                  <Rocket className="w-3.5 h-3.5" /> Production
                  <span className="text-[10px] opacity-70">(Client)</span>
                </button>
              </div>
              {executionMode === 'beta' && (
                <p className="text-[10px] text-amber-400/80 mt-1.5 text-center">
                  Test with YOUR connected accounts before deploying to clients
                </p>
              )}
              {executionMode === 'production' && (
                <p className="text-[10px] text-emerald-400/80 mt-1.5 text-center">
                  Execute using client's connected accounts
                </p>
              )}
            </div>
          )}

          {/* NOTE: Removed validation blockers - intent-driven approach
              The AI intelligently determines tools at execution time
              User describes WHAT they want, Nexus figures out HOW */}

          {/* @NEXUS-FIX-055: Orchestration discovery loading indicator - DO NOT REMOVE */}
          {isLoadingOrchestration && !hasError && phase !== 'complete' && (
            <div className="px-4 pb-4">
              <div className="bg-gradient-to-br from-purple-500/10 to-cyan-500/10 rounded-xl border border-purple-500/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-purple-300">
                    Discovering required fields for new integration...
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* @NEXUS-FIX-033: Pre-flight sequential questions - DO NOT REMOVE
              Shows questions one-by-one BEFORE execution to collect all params upfront */}
          {showPreFlight && !isLoadingOrchestration && preFlightResult && preFlightResult.questions.length > 0 && currentPreFlightQuestion && !hasError && phase !== 'complete' && (
            <div className="px-4 pb-4">
              <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl border border-cyan-500/20 p-4">
                {/* Progress indicator */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-medium text-cyan-300">
                      Quick Setup
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {currentQuestionIndex + 1} of {preFlightResult.questions.length}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-1 bg-slate-700 rounded-full mb-4 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                    style={{ width: `${((currentQuestionIndex) / preFlightResult.questions.length) * 100}%` }}
                  />
                </div>

                {/* Current question */}
                <div className="space-y-3">
                  {/* Question context */}
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="px-2 py-0.5 bg-slate-700/50 rounded text-slate-300">
                      {currentPreFlightQuestion.nodeName}
                    </span>
                    <ArrowRight className="w-3 h-3" />
                    <span>{currentPreFlightQuestion.displayName}</span>
                  </div>

                  {/* The question */}
                  <p className="text-sm text-slate-200 font-medium">
                    💡 {currentPreFlightQuestion.prompt}
                  </p>

                  {/* Quick action buttons */}
                  {currentPreFlightQuestion.quickActions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {currentPreFlightQuestion.quickActions.map((action, idx) => (
                        <button
                          key={idx}
                          onClick={() => handlePreFlightAnswer(
                            currentPreFlightQuestion.id,
                            currentPreFlightQuestion.paramName,
                            action.value
                          )}
                          className="px-3 py-1.5 text-xs bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-lg transition-colors border border-slate-600/50 hover:border-slate-500/50"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Input field */}
                  <div className="flex gap-2">
                    <input
                      type={currentPreFlightQuestion.inputType === 'email' ? 'email' : currentPreFlightQuestion.inputType === 'phone' ? 'tel' : 'text'}
                      value={preFlightInputValue}
                      onChange={(e) => {
                        setPreFlightInputValue(e.target.value)
                        setPreFlightError(null)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && preFlightInputValue.trim()) {
                          handlePreFlightAnswer(
                            currentPreFlightQuestion.id,
                            currentPreFlightQuestion.paramName,
                            preFlightInputValue.trim()
                          )
                        }
                      }}
                      placeholder={currentPreFlightQuestion.placeholder}
                      className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/25"
                    />
                    <button
                      onClick={() => {
                        if (preFlightInputValue.trim()) {
                          handlePreFlightAnswer(
                            currentPreFlightQuestion.id,
                            currentPreFlightQuestion.paramName,
                            preFlightInputValue.trim()
                          )
                        }
                      }}
                      disabled={!preFlightInputValue.trim()}
                      className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Next
                    </button>
                  </div>

                  {/* Error message */}
                  {preFlightError && (
                    <p className="text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {preFlightError}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Pre-flight complete indicator */}
          {isPreFlightComplete && preFlightResult && preFlightResult.questions.length > 0 && !hasError && phase !== 'complete' && (
            <div className="px-4 pb-2">
              <div className="flex items-center gap-2 text-xs text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>All information collected - ready to execute!</span>
              </div>
            </div>
          )}

          {/* @NEXUS-FIX-061: Collected Information Section - DO NOT REMOVE
              Shows user's answers inline in the workflow card instead of as chat messages.
              This keeps the workflow card at the end of the chat thread. */}
          {Object.keys(collectedParams).filter(k => !k.startsWith('_')).length > 0 && !hasError && phase !== 'complete' && (
            <div className="px-4 pb-3">
              <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-medium text-slate-300">Collected Information</span>
                </div>
                <div className="space-y-1.5">
                  {Object.entries(collectedParams)
                    .filter(([key]) => !key.startsWith('_')) // Filter out internal keys like _lastUpdated, _retryRequested
                    .map(([key, value]) => {
                      // Move 6.16b: Extract param name from nodeId.paramName format for display
                      const displayKey = key.includes('.') ? key.split('.').pop() || key : key
                      return (
                        <div key={key} className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 capitalize">{displayKey.replace(/_/g, ' ')}:</span>
                          <span className="text-slate-200 font-medium truncate max-w-[180px]" title={value}>
                            {value}
                          </span>
                        </div>
                      )
                    })}
                </div>
              </div>
            </div>
          )}

          {/* Execute button - ALWAYS show when workflow is not complete/errored
              INTENT-DRIVEN: User can always execute, AI figures out details at runtime
              @NEXUS-FIX-033: Now blocked until pre-flight is complete */}
          {phase !== 'complete' && phase !== 'error' && (
            <div className="px-4 pb-4">
              <button
                onClick={executeWorkflow}
                disabled={isExecuting || isChecking || !isPreFlightComplete}
                className={cn(
                  'w-full py-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2',
                  isExecuting || isChecking
                    ? 'bg-amber-500/20 text-amber-400 cursor-not-allowed'
                    : executionMode === 'beta'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg hover:shadow-amber-500/25 active:scale-[0.98]'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-lg hover:shadow-cyan-500/25 active:scale-[0.98]'
                )}
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {executionMode === 'beta' ? 'Running beta test...' : 'Executing workflow...'}
                  </>
                ) : isChecking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Checking connections...
                  </>
                ) : (
                  <>
                    {executionMode === 'beta' ? <FlaskConical className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {executionMode === 'beta' ? 'Run Beta Test' : 'Execute Now'}
                  </>
                )}
              </button>
            </div>
          )}

          {/* Edit Workflow Button - Only show in ready phase when edit callbacks provided */}
          {phase === 'ready' && onNodeRemove && (
            <div className="px-4 pb-2 flex justify-end">
              <button
                onClick={() => setShowEditPanel(true)}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-2 py-1 hover:bg-slate-700/50 rounded transition-colors"
              >
                <Pencil className="w-3 h-3" />
                Edit Workflow
              </button>
            </div>
          )}

          {/* Node Edit Panel */}
          {showEditPanel && (
            <NodeEditPanel
              nodes={nodes}
              workflowName={workflow.name}
              onRemoveNode={(id) => {
                onNodeRemove?.(id)
                setNodes(prev => prev.filter(n => n.id !== id))
              }}
              onAddNode={(integration, actionType) => {
                if (onNodeAdd) {
                  onNodeAdd(integration, actionType)
                  // Also update local state for immediate feedback
                  const newNode = {
                    id: `step_${Date.now()}`,
                    name: `${integration.charAt(0).toUpperCase() + integration.slice(1)} Action`,
                    type: 'action' as const,
                    integration: integration.toLowerCase(),
                    status: 'idle' as const,
                  }
                  setNodes(prev => [...prev, newNode])
                }
              }}
              onClose={() => setShowEditPanel(false)}
              disabled={phase !== 'ready'}
            />
          )}

          {/* NOTE: Removed low confidence blocker - intent-driven system handles everything
              User can always execute, AI determines optimal approach at runtime */}

          {/* Error details and retry button */}
          {hasError && (
            <div className="px-4 pb-4 space-y-3">
              {/* Error explanation with contextual guidance */}
              {(() => {
                const failedNode = nodes.find(n => n.status === 'error')
                const errorMsg = failedNode?.error || 'Unknown error'
                const errorLower = errorMsg.toLowerCase()

                // @NEXUS-FIX-031: Extract actual param name from error for correct collection key - DO NOT REMOVE
                // Error format: "Missing Information: Step Name [param:to]"
                // This ensures each param is stored under its own key, not the integration name
                const paramMatch = errorMsg.match(/\[param:(\w+)\]/)
                const missingParamName = paramMatch ? paramMatch[1] : null
                // Move 6.16b: Use nodeId.paramName format for task-specific param storage
                // This prevents param collisions across multiple nodes with same param name
                const collectionKey = failedNode?.id && missingParamName
                  ? `${failedNode.id}.${missingParamName}`
                  : missingParamName || failedNode?.integration || 'value'

                // @NEXUS-UX-001: Actionable error buttons - DO NOT REMOVE (VIP Hospitality)
                // Generate helpful guidance based on error type with CLICKABLE actions
                interface ErrorGuidance {
                  title: string
                  guidance: string
                  action?: string
                  actionLabel?: string
                  // UX Hospitality: Actual clickable buttons instead of just text
                  buttons?: Array<{
                    label: string
                    value: string
                    icon?: string
                    primary?: boolean
                  }>
                  inputPrompt?: string // For inline input when needed
                }

                const getErrorGuidance = (): ErrorGuidance => {
                  // @NEXUS-UX-001: Missing parameters with buttons - DO NOT REMOVE
                  if (errorLower.includes('missing') && errorLower.includes('parameter')) {
                    const params = errorMsg.match(/: ([^.]+)/)?.[1] || 'required information'
                    return {
                      title: 'Quick Question!',
                      guidance: `I just need a little more info about: ${params}`,
                      buttons: [
                        { label: '💬 Let Me Explain', value: `I\'ll provide the ${params}`, primary: true },
                        { label: '🔍 Help Me Find It', value: `help me find the ${params}`, primary: false },
                      ],
                      inputPrompt: `Enter ${params}...`,
                    }
                  }

                  // @NEXUS-UX-001: Google Sheets with clickable buttons - DO NOT REMOVE
                  if (errorLower.includes('spreadsheet') || errorLower.includes('googlesheets')) {
                    return {
                      title: 'Google Sheets Setup Needed',
                      guidance: 'Which Google Sheet should I use?',
                      buttons: [
                        { label: '📝 Create New Sheet', value: 'create a new Google Sheet for me', primary: true },
                        { label: '📋 Use Existing Sheet', value: 'I want to use an existing sheet', primary: false },
                      ],
                      inputPrompt: 'Or paste a Google Sheet URL here...',
                    }
                  }

                  // @NEXUS-UX-001: Slack channel with clickable buttons - DO NOT REMOVE
                  if (errorLower.includes('channel') && (errorLower.includes('slack') || failedNode?.integration?.toLowerCase().includes('slack'))) {
                    return {
                      title: 'Slack Channel Needed',
                      guidance: 'Where should I send this message?',
                      buttons: [
                        { label: '#general', value: '#general', primary: false },
                        { label: '#team', value: '#team', primary: false },
                        { label: '#alerts', value: '#alerts', primary: false },
                        { label: '#random', value: '#random', primary: false },
                      ],
                      inputPrompt: 'Or type a channel name...',
                    }
                  }

                  // @NEXUS-UX-001: WhatsApp with clickable buttons - DO NOT REMOVE
                  // @NEXUS-FIX-032: Dynamic prompt based on actual missing param - DO NOT REMOVE
                  // Problem: Always showed "Who should receive?" even when asking for message content
                  // Solution: Check missingParamName to show appropriate prompt for 'to' vs 'message'
                  if (errorLower.includes('whatsapp') || errorLower.includes('phone') || (failedNode?.integration?.toLowerCase().includes('whatsapp'))) {
                    // Determine if we're asking for phone number (to) or message content
                    const isAskingForMessage = missingParamName === 'message' || missingParamName === 'body' || missingParamName === 'text'
                    // Phone check handled via !isAskingForMessage in else branch

                    if (isAskingForMessage) {
                      return {
                        title: 'Message Content Needed',
                        guidance: 'What message should I send?',
                        buttons: [
                          { label: '📝 Type Message', value: 'I\'ll type the message', primary: true },
                          { label: '📋 Use Template', value: 'Show me message templates', primary: false },
                        ],
                        inputPrompt: 'Type your message here...',
                      }
                    }

                    // Default: asking for phone number
                    return {
                      title: 'WhatsApp Recipient Needed',
                      guidance: 'Who should receive this message?',
                      buttons: [
                        { label: '📱 Enter Phone Number', value: 'I\'ll provide a phone number', primary: true },
                        { label: '👥 Use Contact List', value: 'Show me my contacts', primary: false },
                      ],
                      inputPrompt: 'Enter phone with country code (e.g., +965 xxxx xxxx)...',
                    }
                  }

                  // @NEXUS-UX-001: Email recipient with clickable buttons - DO NOT REMOVE
                  if (errorLower.includes('email') || errorLower.includes('recipient') || errorLower.includes('gmail') || errorLower.includes('outlook')) {
                    return {
                      title: 'Email Recipient Needed',
                      guidance: 'Who should receive this email?',
                      buttons: [
                        { label: '✉️ Enter Email', value: 'I\'ll provide an email address', primary: true },
                        { label: '👤 Send to Myself', value: 'Send to my email address', primary: false },
                      ],
                      inputPrompt: 'Enter email address...',
                    }
                  }

                  // @NEXUS-UX-001: Authentication errors with reconnect button - DO NOT REMOVE
                  if (errorLower.includes('auth') || errorLower.includes('401') || errorLower.includes('403') || errorLower.includes('token') || errorLower.includes('credential')) {
                    return {
                      title: 'Connection Expired',
                      guidance: 'Your account needs to be reconnected.',
                      buttons: [
                        { label: '🔄 Reconnect Now', value: 'reconnect my account', primary: true },
                        { label: '❓ Get Help', value: 'help me fix this connection issue', primary: false },
                      ],
                    }
                  }

                  // @NEXUS-UX-001: Rate limiting with timed retry - DO NOT REMOVE
                  if (errorLower.includes('rate') || errorLower.includes('limit') || errorLower.includes('429') || errorLower.includes('too many')) {
                    return {
                      title: 'Taking a Quick Breather',
                      guidance: 'The service is busy. This usually resolves in a moment.',
                      buttons: [
                        { label: '⏱️ Retry in 30 Seconds', value: 'retry after waiting', primary: true },
                        { label: '📅 Schedule for Later', value: 'schedule this workflow for later', primary: false },
                      ],
                    }
                  }

                  // @NEXUS-UX-001: Not found with helpful suggestions - DO NOT REMOVE
                  if (errorLower.includes('not found') || errorLower.includes('404') || errorLower.includes('does not exist')) {
                    return {
                      title: 'Hmm, Can\'t Find That',
                      guidance: 'The item I looked for doesn\'t exist yet.',
                      buttons: [
                        { label: '➕ Create It', value: 'create this resource for me', primary: true },
                        { label: '🔍 Search Again', value: 'search for a different resource', primary: false },
                        { label: '📝 Enter Manually', value: 'let me provide the correct name', primary: false },
                      ],
                    }
                  }

                  // @NEXUS-UX-001: Network issues with retry - DO NOT REMOVE
                  if (errorLower.includes('network') || errorLower.includes('timeout') || errorLower.includes('connection') || errorLower.includes('econnrefused')) {
                    return {
                      title: 'Connection Hiccup',
                      guidance: 'There was a network blip. Usually just temporary!',
                      buttons: [
                        { label: '🔄 Try Again', value: 'retry now', primary: true },
                        { label: '🔌 Check Connection', value: 'check my internet connection', primary: false },
                      ],
                    }
                  }

                  // @NEXUS-UX-001: Permission issues with guidance - DO NOT REMOVE
                  if (errorLower.includes('permission') || errorLower.includes('access denied') || errorLower.includes('forbidden')) {
                    return {
                      title: 'Permission Needed',
                      guidance: 'You need additional access to do this.',
                      buttons: [
                        { label: '🔐 Grant Permission', value: 'grant permission for this action', primary: true },
                        { label: '🔄 Try Different Account', value: 'use a different account', primary: false },
                        { label: '❓ Why?', value: 'explain what permissions are needed', primary: false },
                      ],
                    }
                  }

                  // @NEXUS-UX-001: Tool not supported - DO NOT REMOVE
                  if (errorLower.includes('no tool mapping') || errorLower.includes('not yet supported')) {
                    return {
                      title: 'Coming Soon!',
                      guidance: 'This integration is still being set up.',
                      buttons: [
                        { label: '🔔 Notify When Ready', value: 'notify me when this is available', primary: true },
                        { label: '🔄 Try Alternative', value: 'suggest an alternative approach', primary: false },
                        { label: '💬 Contact Support', value: 'contact support about this', primary: false },
                      ],
                    }
                  }

                  // @NEXUS-UX-001: Server errors with friendly message - DO NOT REMOVE
                  if (errorLower.includes('500') || errorLower.includes('server error') || errorLower.includes('internal')) {
                    return {
                      title: 'Service Taking a Nap',
                      guidance: 'The external service had a hiccup. Usually fixes itself quickly!',
                      buttons: [
                        { label: '🔄 Retry Now', value: 'retry the workflow', primary: true },
                        { label: '📋 Save & Retry Later', value: 'save this workflow and try again later', primary: false },
                      ],
                    }
                  }

                  // @NEXUS-FIX-117: Additional Composio-specific error patterns - DO NOT REMOVE
                  // Problem: Many Composio errors fell through to generic "Oops!" message
                  // Solution: Catch entity errors, SDK errors, connection errors specifically

                  // Composio entity/connection errors
                  if (errorLower.includes('entity') || errorLower.includes('no active connection') || errorLower.includes('connection not found') || errorLower.includes('no connected account')) {
                    return {
                      title: 'Account Not Connected',
                      guidance: 'This service needs to be connected before it can run.',
                      buttons: [
                        { label: '🔗 Connect Now', value: 'connect this service', primary: true },
                        { label: '🔄 Try Again', value: 'retry the workflow', primary: false },
                      ],
                    }
                  }

                  // Invalid/missing parameters from Composio
                  if (errorLower.includes('invalid') || errorLower.includes('required field') || errorLower.includes('missing required') || errorLower.includes('validation failed') || errorLower.includes('missing information')) {
                    return {
                      title: 'One More Thing Needed',
                      guidance: 'I need a bit more information to complete this step.',
                      buttons: [
                        { label: '💬 Provide Details', value: 'I will provide the missing details', primary: true },
                        { label: '🔍 Help Me', value: 'help me figure out what is needed', primary: false },
                      ],
                      inputPrompt: 'Enter the required information...',
                    }
                  }

                  // Quota/billing errors
                  if (errorLower.includes('quota') || errorLower.includes('billing') || errorLower.includes('plan') || errorLower.includes('upgrade') || errorLower.includes('subscription')) {
                    return {
                      title: 'Service Limit Reached',
                      guidance: 'This service has a usage limit that was reached.',
                      buttons: [
                        { label: '📊 Check Usage', value: 'check my service usage', primary: true },
                        { label: '🔄 Try Again Later', value: 'retry later', primary: false },
                      ],
                    }
                  }

                  // Composio SDK errors
                  if (errorLower.includes('composio') || errorLower.includes('sdk') || errorLower.includes('api key')) {
                    return {
                      title: 'Service Configuration',
                      guidance: 'The integration service needs to be configured.',
                      buttons: [
                        { label: '🔧 Configure', value: 'configure the integration', primary: true },
                        { label: '🔄 Try Again', value: 'retry the workflow', primary: false },
                      ],
                    }
                  }

                  // @NEXUS-FIX-117: Improved default - never say "Oops!" - DO NOT REMOVE
                  return {
                    title: 'Almost There!',
                    guidance: 'This step needs a small adjustment. Let me help you fix it.',
                    buttons: [
                      { label: '🔄 Try Again', value: 'retry the workflow', primary: true },
                      { label: '💬 Help Me Fix It', value: 'help me troubleshoot this step', primary: false },
                      { label: '⏭️ Skip This Step', value: 'skip this step and continue', primary: false },
                    ],
                  }
                  // @NEXUS-FIX-117-END
                }

                // @NEXUS-UX-001: Extract buttons for actionable error recovery - DO NOT REMOVE
                const { title, guidance, action, buttons, inputPrompt } = getErrorGuidance()

                // @NEXUS-FIX-028: Use friendly cyan/blue colors for "Missing Information" prompts - DO NOT REMOVE
                // Problem: Red colors made input prompts look like critical errors
                // Solution: Detect "Missing Information" and use cyan (needs input) instead of red (actual error)
                const isMissingInfo = errorMsg.toLowerCase().includes('missing information') ||
                                       errorMsg.toLowerCase().includes('need more details') ||
                                       errorMsg.toLowerCase().includes('please tell me')


                // Friendly cyan/blue for info prompts (asking for input), red for actual errors
                // @NEXUS-FIX-028: Using inline styles for reliable color application
                const colorScheme = isMissingInfo
                  ? {
                      bgStyle: { backgroundColor: 'rgba(6, 182, 212, 0.15)' }, // cyan-500 at 15%
                      borderStyle: { borderColor: 'rgba(6, 182, 212, 0.3)' }, // cyan-500 at 30%
                      icon: 'text-cyan-400',
                      title: 'text-cyan-300',
                      text: 'text-cyan-400/80'
                    }
                  : {
                      bgStyle: { backgroundColor: 'rgba(239, 68, 68, 0.15)' }, // red-500 at 15%
                      borderStyle: { borderColor: 'rgba(239, 68, 68, 0.3)' }, // red-500 at 30%
                      icon: 'text-red-400',
                      title: 'text-red-300',
                      text: 'text-red-400/80'
                    }

                return (
                  <div
                    className="p-3 rounded-lg border space-y-2"
                    style={{ ...colorScheme.bgStyle, ...colorScheme.borderStyle }}
                  >
                    <div className="flex items-start gap-2">
                      <AlertCircle className={`w-5 h-5 ${colorScheme.icon} flex-shrink-0 mt-0.5`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${colorScheme.title}`}>
                          {title}: {failedNode?.name || 'Unknown step'}
                        </p>
                        {/* @NEXUS-FIX-028: Show full error message without truncation - DO NOT REMOVE */}
                        <p className={`text-xs ${colorScheme.text} mt-1 break-words`}>
                          {errorMsg}
                        </p>
                      </div>
                    </div>
                    <div className="pt-2 border-t space-y-1.5" style={colorScheme.borderStyle}>
                      <p className="text-xs text-slate-300">
                        💡 {guidance}
                      </p>

                      {/* @NEXUS-UX-001: Render clickable action buttons - VIP Hospitality */}
                      {buttons && buttons.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {buttons.map((btn, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                userContextService.learnFromChoice(collectionKey, btn.value)
                                onMissingInfoSelect?.(collectionKey, btn.value)
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                btn.primary
                                  ? 'bg-cyan-500/30 text-cyan-300 hover:bg-cyan-500/40 border border-cyan-500/40'
                                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 border border-slate-600/40'
                              }`}
                            >
                              {btn.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* @NEXUS-UX-001: Optional input field for custom values */}
                      {/* @NEXUS-FIX-030: Track pending input for Retry button - DO NOT REMOVE */}
                      {inputPrompt && (
                        <div className="mt-2">
                          <input
                            type="text"
                            placeholder={inputPrompt}
                            className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-800/50 border border-slate-600/40 text-slate-300 placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none"
                            onChange={(e) => {
                              // @NEXUS-FIX-030: Track value so Retry button can submit it
                              // @NEXUS-FIX-031: Use actual param name as key, not integration name
                              const value = e.target.value.trim()
                              if (value) {
                                pendingErrorInputRef.current = {
                                  field: collectionKey,
                                  value
                                }
                              } else {
                                pendingErrorInputRef.current = null
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const value = (e.target as HTMLInputElement).value
                                if (value.trim()) {
                                  // @NEXUS-FIX-031: Use actual param name as key
                                  userContextService.learnFromChoice(collectionKey, value.trim())
                                  onMissingInfoSelect?.(collectionKey, value.trim())
                                  pendingErrorInputRef.current = null // Clear after submit
                                }
                              }
                            }}
                          />
                        </div>
                      )}

                      {/* Fallback text action if no buttons */}
                      {action && !buttons && (
                        <p className="text-xs text-cyan-400/80 font-medium">
                          👉 {action}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })()}

              {/* @NEXUS-FIX-030: Submit pending input before retry - DO NOT REMOVE */}
              <button
                onClick={() => {
                  // Submit any pending input value before resetting
                  if (pendingErrorInputRef.current) {
                    const { field, value } = pendingErrorInputRef.current
                    console.log(`[WorkflowPreviewCard] Submitting pending input: ${field}=${value}`)
                    onMissingInfoSelect?.(field, value)
                    pendingErrorInputRef.current = null
                    // Don't reset immediately - let the auto-retry mechanism handle it
                    // The useEffect watching collectedParams will trigger the retry
                  } else {
                    // No pending input, just reset
                    resetWorkflow()
                  }
                }}
                className="w-full py-2.5 rounded-lg font-medium text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retry Execution
              </button>
            </div>
          )}

          {/* @NEXUS-UX-006: Success message with celebration and next steps - DO NOT REMOVE */}
          {isComplete && (
            <div className="px-4 pb-4 space-y-3">
              {executionMode === 'beta' ? (
                <>
                  {/* @NEXUS-UX-006: Beta success celebration - DO NOT REMOVE */}
                  {/* @NEXUS-FIX-047: Show warning state when verification failed - DO NOT REMOVE */}
                  <div className={cn(
                    "p-4 rounded-lg space-y-3",
                    allVerified
                      ? "bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30"
                      : "bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border border-yellow-500/30"
                  )}>
                    <div className="text-center pb-2">
                      <span className="text-3xl">{allVerified ? '🎉' : '⚠️'}</span>
                      <h3 className={cn(
                        "text-lg font-medium mt-2",
                        allVerified ? "text-amber-300" : "text-yellow-300"
                      )}>
                        {allVerified ? 'Beta Test Passed!' : 'Test Completed with Warnings'}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        {allVerified
                          ? 'Everything worked perfectly with your account'
                          : `${unverifiedCount} step${unverifiedCount > 1 ? 's' : ''} completed but couldn't be verified`
                        }
                      </p>
                    </div>
                    <div className="space-y-1.5 text-xs text-slate-300 bg-slate-800/30 rounded-lg p-3">
                      {nodes.map((node, i) => {
                        const nodeResult = node.result as Record<string, unknown> | undefined
                        const isNodeVerified = nodeResult?._verified !== false
                        const warningMsg = nodeResult?._warning as string | undefined
                        return (
                          <div key={node.id} className="flex items-center gap-2">
                            <span className={isNodeVerified ? "text-emerald-400" : "text-yellow-400"}>
                              {isNodeVerified ? '✓' : '⚠️'}
                            </span>
                            <span>{i + 1}. {node.name}</span>
                            <span className={cn(
                              "truncate max-w-[100px]",
                              isNodeVerified ? "text-slate-500" : "text-yellow-500/70"
                            )}>
                              {!isNodeVerified && warningMsg
                                ? `• ${warningMsg}`
                                : typeof node.result === 'object'
                                  ? '• Success'
                                  : node.result !== undefined && node.result !== null
                                    ? `• ${String(node.result as string | number | boolean)}`
                                    : ''
                              }
                            </span>
                          </div>
                        )
                      })}
                    </div>
                    {/* @NEXUS-FIX-047: Guidance for unverified results - DO NOT REMOVE */}
                    {!allVerified && (
                      <div className="text-xs text-yellow-400/80 bg-yellow-500/10 rounded-lg p-3 flex items-start gap-2">
                        <span className="shrink-0">💡</span>
                        <span>
                          Some steps completed but we couldn't confirm delivery.
                          Please check your connected apps to verify the actions took place.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* @NEXUS-UX-006: Clear next step actions - DO NOT REMOVE */}
                  <div className="space-y-2">
                    <p className="text-xs text-slate-400 text-center">What's next?</p>
                    <button
                      onClick={() => {
                        setExecutionMode('production')
                        resetWorkflow()
                      }}
                      className="w-full py-3 rounded-lg font-medium text-sm bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
                    >
                      <Zap className="w-4 h-4" />
                      🚀 Deploy to Production
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={resetWorkflow}
                        className="flex-1 py-2 rounded-lg text-xs bg-slate-700/50 text-slate-300 hover:bg-slate-700 transition-all"
                      >
                        🔄 Run Again
                      </button>
                      <button
                        onClick={() => navigate('/workflows')}
                        className="flex-1 py-2 rounded-lg text-xs bg-slate-700/50 text-slate-300 hover:bg-slate-700 transition-all"
                      >
                        📋 View All Workflows
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* @NEXUS-UX-006: Production success celebration - DO NOT REMOVE */}
                  <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 space-y-3">
                    <div className="text-center pb-2">
                      <span className="text-3xl">🚀</span>
                      <h3 className="text-lg font-medium text-emerald-300 mt-2">Workflow Complete!</h3>
                      <p className="text-xs text-slate-400 mt-1">Your automation ran successfully</p>
                    </div>
                    <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
                      <span>✓ {nodes.length} steps completed</span>
                      <span>•</span>
                      <span>⚡ Production mode</span>
                    </div>
                  </div>

                  {/* @NEXUS-UX-006: Next actions for production - DO NOT REMOVE */}
                  <div className="flex gap-2">
                    <button
                      onClick={resetWorkflow}
                      className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition-all flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Run Again
                    </button>
                    <button
                      onClick={() => navigate('/workflows')}
                      className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-slate-700/50 text-slate-300 hover:bg-slate-700 transition-all"
                    >
                      📋 My Workflows
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 text-center">
                    💡 Want this to run automatically? Ask me to set up a schedule!
                  </p>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default WorkflowPreviewCard

// ============================================================================
// @NEXUS-FIX-042/043: Exported helper functions for new architecture integration
// These are prepared for Phase 5 when executeWorkflow is refactored to use new services
// Export allows:
// 1. Testing the new services independently
// 2. Gradual migration without breaking existing code
// 3. Validation that new services produce correct results
// ============================================================================
export const NewArchitectureHelpers = {
  resolveToolSlugWithRegistry: _resolveToolSlugWithRegistry,
  resolveParamsWithPipeline: _resolveParamsWithPipeline,
  getEnhancedMissingParams: _getEnhancedMissingParams,
  inferActionFromNodeName,
}
