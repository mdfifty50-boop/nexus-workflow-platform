import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Button } from './ui/button'
import { ProfessionalAvatar } from './ProfessionalAvatar'
import { WorkflowPreviewModal } from './WorkflowPreviewModal'
import { getSuggestionWorkflow, type SuggestionWorkflow } from '@/lib/workflow-templates'
import { usePersonalization } from '@/contexts/PersonalizationContext'
import { ProactiveSuggestionsService, type ProactiveSuggestion } from '@/services/ProactiveSuggestionsService'
import { useAISuggestions as useBackendAISuggestions, type AISuggestion as BackendAISuggestion } from '@/hooks/useAISuggestions'

// ============================================
// SERVICE INTEGRATION: Backend API + ProactiveSuggestionsService
// Quality-first approach: Backend for high-confidence AI suggestions
// Rule-based fallback for local patterns
// ============================================

// Convert backend API suggestion to local format
function convertFromBackendSuggestion(backend: BackendAISuggestion): AISuggestion {
  const typeMap: Record<string, 'workflow' | 'optimization' | 'integration' | 'tip'> = {
    workflow_optimization: 'optimization',
    new_workflow: 'workflow',
    integration_suggestion: 'integration',
    usage_pattern: 'tip',
    cost_saving: 'tip',
    error_prevention: 'tip',
  }

  const priorityToEffort: Record<string, 'low' | 'medium' | 'high'> = {
    critical: 'low',
    high: 'low',
    medium: 'medium',
    low: 'high',
  }

  return {
    id: backend.id,
    type: typeMap[backend.suggestion_type] || 'tip',
    title: backend.title,
    description: backend.description,
    impact: backend.metadata?.reasoning || `${Math.round(backend.confidence * 100)}% confidence`,
    effort: priorityToEffort[backend.priority] || 'medium',
    priority: backend.priority === 'critical' ? 'high' : backend.priority,
    estimatedTimeSaved: backend.metadata?.estimated_time_saved_minutes
      ? `${Math.round(backend.metadata.estimated_time_saved_minutes / 60)}+ hours/week`
      : undefined,
    agentId: 'nexus',
    action: backend.metadata?.workflow_spec ? {
      label: 'Build Workflow',
      path: '/chat',
    } : {
      label: 'Learn More',
    },
    createdAt: new Date(backend.created_at),
    dismissed: backend.status === 'rejected',
    backendId: backend.id, // Track for feedback
  }
}

// Convert ProactiveSuggestion to AISuggestion format (fallback)
function convertToAISuggestion(proactive: ProactiveSuggestion): AISuggestion {
  // Map actionType to action config
  const actionConfig = {
    deploy_workflow: { label: 'Deploy Workflow', path: '/templates' },
    connect_integration: {
      label: 'Connect Integration',
      path: `/integrations?app=${(proactive.actionPayload?.toolkit as string) || ''}`
    },
    show_info: { label: 'Learn More' },
    ask_question: { label: 'Tell Me More' }
  }

  // Map priority to effort (inverse relationship)
  const priorityToEffort: Record<'high' | 'medium' | 'low', 'low' | 'medium' | 'high'> = {
    high: 'low',
    medium: 'medium',
    low: 'high'
  }

  return {
    id: proactive.id,
    type: proactive.type,
    title: proactive.title,
    description: proactive.description,
    impact: proactive.reason, // Map reason to impact
    effort: priorityToEffort[proactive.priority],
    priority: proactive.priority,
    estimatedTimeSaved: proactive.relevanceScore > 80 ? '3+ hours/week' : '1-2 hours/week',
    agentId: 'nexus', // Default to nexus agent
    action: actionConfig[proactive.actionType],
    createdAt: new Date(),
    dismissed: false
  }
}

export interface AISuggestion {
  id: string
  type: 'workflow' | 'optimization' | 'integration' | 'tip'
  title: string
  description: string
  impact: string
  effort: 'low' | 'medium' | 'high'
  priority?: 'low' | 'medium' | 'high'
  icon?: string
  estimatedTimeSaved?: string
  agentId?: string
  action?: {
    label: string
    path?: string
    onClick?: () => void
  }
  dismissed?: boolean
  createdAt: Date
  backendId?: string // Links to backend API for feedback
}

interface AISuggestionCardProps {
  suggestion: AISuggestion
  onDismiss: () => void
  onAction: () => void
  onGenerateWorkflow: (workflow: SuggestionWorkflow) => void
  connectedIntegrations: string[]
}

function AISuggestionCard({ suggestion, onDismiss, onAction, onGenerateWorkflow, connectedIntegrations }: AISuggestionCardProps) {
  const { term } = usePersonalization()
  const suggestedWorkflow = getSuggestionWorkflow(suggestion.id)
  const hasWorkflow = suggestedWorkflow !== null

  // Check if all required integrations are connected
  const missingIntegrations = suggestedWorkflow?.requiredIntegrations.filter(
    int => !connectedIntegrations.includes(int.toLowerCase())
  ) || []
  const typeConfig = {
    workflow: {
      icon: '⚡',
      color: 'cyan',
      label: 'New Automation',
    },
    optimization: {
      icon: '🚀',
      color: 'purple',
      label: 'Optimization',
    },
    integration: {
      icon: '🔗',
      color: 'emerald',
      label: 'Integration',
    },
    tip: {
      icon: '💡',
      color: 'amber',
      label: 'Pro Tip',
    },
  }

  const config = typeConfig[suggestion.type]
  const effortColors = {
    low: 'text-emerald-400 bg-emerald-500/20',
    medium: 'text-amber-400 bg-amber-500/20',
    high: 'text-red-400 bg-red-500/20',
  }

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 hover:border-slate-600 transition-all group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`
            w-8 h-8 rounded-lg flex items-center justify-center text-lg
            bg-${config.color}-500/20
          `}>
            {config.icon}
          </span>
          <span className={`text-xs font-medium text-${config.color}-400 uppercase`}>
            {config.label}
          </span>
        </div>
        <button
          onClick={onDismiss}
          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-slate-700 text-slate-500 hover:text-white transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="mb-4">
        <h4 className="font-semibold text-white mb-1">{suggestion.title}</h4>
        <p className="text-sm text-slate-400">{suggestion.description}</p>
      </div>

      {/* Agent Attribution */}
      {suggestion.agentId && (
        <div className="flex items-center gap-2 mb-4">
          <ProfessionalAvatar agentId={suggestion.agentId} size={24} />
          <span className="text-xs text-slate-500">Suggested by your AI team</span>
        </div>
      )}

      {/* Impact & Effort */}
      <div className="flex items-center gap-3 mb-4">
        {suggestion.estimatedTimeSaved && (
          <div className="flex items-center gap-1 text-sm">
            <span className="text-emerald-400">⏱️</span>
            <span className="text-slate-300">{suggestion.estimatedTimeSaved}</span>
          </div>
        )}
        <span className={`px-2 py-0.5 rounded text-xs ${effortColors[suggestion.effort]}`}>
          {suggestion.effort} effort
        </span>
      </div>

      {/* Impact Statement */}
      <div className="bg-slate-900/50 rounded-lg p-3 mb-4">
        <p className="text-sm text-cyan-400">{suggestion.impact}</p>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        {/* Generate Workflow Button - Primary action when workflow is available */}
        {hasWorkflow && suggestedWorkflow && (
          <Button
            onClick={() => onGenerateWorkflow(suggestedWorkflow)}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
            size="sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Generate {term('workflow')}
            {missingIntegrations.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-amber-500/30 text-amber-300">
                {missingIntegrations.length} setup needed
              </span>
            )}
          </Button>
        )}

        {/* Secondary action button */}
        {suggestion.action && (
          <Button
            onClick={onAction}
            variant={hasWorkflow ? 'outline' : 'default'}
            className="w-full"
            size="sm"
          >
            {suggestion.action.label}
            <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        )}
      </div>
    </div>
  )
}

interface AISuggestionsPanelProps {
  suggestions: AISuggestion[]
  onDismiss: (id: string) => void
  onAction: (suggestion: AISuggestion) => void
  maxVisible?: number
  className?: string
  connectedIntegrations?: string[]
}

export function AISuggestionsPanel({
  suggestions,
  onDismiss,
  onAction,
  maxVisible = 3,
  className = '',
  connectedIntegrations = ['gmail', 'salesforce', 'slack'], // Default connected for demo
}: AISuggestionsPanelProps) {
  const [expanded, setExpanded] = useState(false)
  const [selectedWorkflow, setSelectedWorkflow] = useState<SuggestionWorkflow | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const activeSuggestions = suggestions.filter(s => !s.dismissed)
  const visibleSuggestions = expanded ? activeSuggestions : activeSuggestions.slice(0, maxVisible)
  const hiddenCount = activeSuggestions.length - maxVisible

  const handleGenerateWorkflow = (workflow: SuggestionWorkflow) => {
    setSelectedWorkflow(workflow)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedWorkflow(null)
  }

  if (activeSuggestions.length === 0) {
    return null
  }

  return (
    <div className={`bg-slate-900/50 rounded-2xl border border-slate-700/50 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
            <span className="text-xl">🤖</span>
          </div>
          <div>
            <h3 className="font-semibold text-white">AI Suggestions</h3>
            <p className="text-xs text-slate-400">
              {activeSuggestions.length} recommendation{activeSuggestions.length !== 1 ? 's' : ''} for you
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
          <span className="text-xs text-cyan-400">Live</span>
        </div>
      </div>

      {/* Suggestions List */}
      <div className="p-4 space-y-4">
        {visibleSuggestions.map(suggestion => (
          <AISuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            onDismiss={() => onDismiss(suggestion.id)}
            onAction={() => onAction(suggestion)}
            onGenerateWorkflow={handleGenerateWorkflow}
            connectedIntegrations={connectedIntegrations}
          />
        ))}
      </div>

      {/* Show More */}
      {hiddenCount > 0 && (
        <div className="p-4 pt-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full py-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            {expanded ? 'Show less' : `Show ${hiddenCount} more suggestion${hiddenCount !== 1 ? 's' : ''}`}
          </button>
        </div>
      )}

      {/* Workflow Preview Modal */}
      {selectedWorkflow && (
        <WorkflowPreviewModal
          workflow={selectedWorkflow}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          connectedIntegrations={connectedIntegrations}
        />
      )}
    </div>
  )
}

// Smart Suggestions Generator Hook
// ENHANCED: Now integrates with backend API for high-quality AI suggestions
// Falls back to ProactiveSuggestionsService for local rule-based suggestions
interface UserContext {
  recentWorkflows: string[]
  connectedIntegrations: string[]
  userGoal: string
  workflowsThisWeek: number
  failedWorkflows: string[]
  peakUsageTime?: string
  region?: string
  businessType?: string
  teamSize?: 'solo' | 'small' | 'medium' | 'enterprise'
}

export function useAISuggestions(context: UserContext) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const lastContextRef = useRef<string | null>(null)
  const initializedRef = useRef(false)

  // Use backend API hook for high-quality AI suggestions
  const {
    suggestions: backendSuggestions,
    loading: backendLoading,
    actOnSuggestion,
    hasSuggestions: hasBackendSuggestions,
  } = useBackendAISuggestions()

  // Memoize the service context to prevent unnecessary recalculations
  const serviceContext = useMemo(() => ({
    connectedIntegrations: context.connectedIntegrations,
    recentWorkflows: context.recentWorkflows,
    region: context.region,
    businessType: context.businessType,
    teamSize: context.teamSize,
    workflowExecutionCount: context.workflowsThisWeek,
    failedWorkflows: context.failedWorkflows
  }), [
    context.connectedIntegrations,
    context.recentWorkflows,
    context.region,
    context.businessType,
    context.teamSize,
    context.workflowsThisWeek,
    context.failedWorkflows
  ])

  useEffect(() => {
    // Prevent infinite loops by checking if context actually changed
    const contextKey = JSON.stringify(context)
    if (lastContextRef.current === contextKey && !hasBackendSuggestions) {
      return // Context hasn't changed and no new backend data, skip update
    }
    lastContextRef.current = contextKey

    // ============================================
    // QUALITY-FIRST: Prefer backend AI suggestions (85%+ confidence)
    // Fall back to local rule-based suggestions
    // ============================================

    // Convert backend suggestions to local format
    const convertedBackendSuggestions = backendSuggestions
      .filter(s => s.status === 'pending' || s.status === 'shown')
      .slice(0, 3)
      .map(convertFromBackendSuggestion)

    // If we have high-quality backend suggestions, use those primarily
    if (convertedBackendSuggestions.length >= 2) {
      // Get a few local suggestions to supplement
      const serviceSuggestions = ProactiveSuggestionsService.getSuggestions(serviceContext, 2)
      const convertedLocal = serviceSuggestions.map(convertToAISuggestion)

      // Dedupe by title similarity
      const backendTitles = new Set(convertedBackendSuggestions.map(s => s.title.toLowerCase()))
      const uniqueLocal = convertedLocal.filter(s => !backendTitles.has(s.title.toLowerCase()))

      setSuggestions([...convertedBackendSuggestions, ...uniqueLocal].slice(0, 6))
      initializedRef.current = true
      return
    }

    // Only generate local suggestions once per unique context if no backend data
    if (initializedRef.current && contextKey === lastContextRef.current && !hasBackendSuggestions) {
      return
    }
    initializedRef.current = true

    // ============================================
    // FALLBACK: Get suggestions from ProactiveSuggestionsService
    // Uses rule-based engine with temporal and regional context
    // ============================================
    const serviceSuggestions = ProactiveSuggestionsService.getSuggestions(serviceContext, 5)
    const convertedSuggestions = serviceSuggestions.map(convertToAISuggestion)

    // Generate additional contextual suggestions based on user behavior
    // These supplement the service suggestions for edge cases
    const localSuggestions: AISuggestion[] = []

    // Suggest based on user goal (if not already covered by service)
    const hasGoalSuggestion = convertedSuggestions.some(s =>
      s.id.includes('salesforce') || s.id.includes('crm')
    )
    if (!hasGoalSuggestion && context.userGoal === 'sales' && !context.connectedIntegrations.includes('salesforce')) {
      localSuggestions.push({
        id: 'connect-salesforce',
        type: 'integration',
        title: 'Connect Salesforce',
        description: 'You\'re focused on sales automation but haven\'t connected your CRM yet.',
        impact: 'Sales teams see 40% improvement in lead response time with CRM automation.',
        effort: 'low',
        estimatedTimeSaved: '5+ hours/week',
        agentId: 'larry',
        action: {
          label: 'Connect Salesforce',
          path: '/integrations',
        },
        createdAt: new Date(),
      })
    }

    // Suggest based on usage patterns
    if (context.workflowsThisWeek > 5 && !context.recentWorkflows.includes('batch-processing')) {
      localSuggestions.push({
        id: 'batch-processing',
        type: 'optimization',
        title: 'Batch Your Workflows',
        description: 'You\'re running many individual workflows. Batching could save tokens and time.',
        impact: 'Batch processing typically reduces costs by 30% and improves speed.',
        effort: 'medium',
        estimatedTimeSaved: '2+ hours/week',
        agentId: 'sam',
        action: {
          label: 'Learn About Batching',
        },
        createdAt: new Date(),
      })
    }

    // Suggest based on failures (supplementary to service)
    const hasFailureSuggestion = convertedSuggestions.some(s => s.id.includes('failed') || s.id.includes('retry'))
    if (!hasFailureSuggestion && context.failedWorkflows.length > 2) {
      localSuggestions.push({
        id: 'error-recovery',
        type: 'tip',
        title: 'Enable Smart Error Recovery',
        description: 'Some of your workflows have failed recently. Auto-recovery can fix most issues.',
        impact: 'AI error recovery resolves 85% of common workflow failures automatically.',
        effort: 'low',
        agentId: 'olivia',
        action: {
          label: 'Enable Auto-Recovery',
        },
        createdAt: new Date(),
      })
    }

    // Suggest new workflows based on patterns
    if (context.recentWorkflows.includes('email') && !context.recentWorkflows.includes('follow-up')) {
      localSuggestions.push({
        id: 'email-followup',
        type: 'workflow',
        title: 'Automated Follow-Up Emails',
        description: 'You\'ve been automating emails. Add automatic follow-ups for better response rates.',
        impact: 'Automated follow-ups increase response rates by 25% on average.',
        effort: 'low',
        estimatedTimeSaved: '3+ hours/week',
        agentId: 'mary',
        action: {
          label: 'Create Follow-Up Workflow',
          path: '/templates?category=email',
        },
        createdAt: new Date(),
      })
    }

    // Meeting suggestion for business users
    if (context.userGoal === 'meetings' || context.userGoal === 'operations') {
      localSuggestions.push({
        id: 'meeting-intelligence',
        type: 'workflow',
        title: 'Meeting Intelligence',
        description: 'Record meetings and automatically extract action items and assignments.',
        impact: 'Users save 2 hours per meeting on note-taking and follow-up.',
        effort: 'low',
        estimatedTimeSaved: '6+ hours/week',
        agentId: 'nexus',
        action: {
          label: 'Set Up Meeting Automation',
          path: '/templates?category=meetings',
        },
        createdAt: new Date(),
      })
    }

    // Merge suggestions: backend first (high quality), then service, then local
    const allSuggestions = [
      ...convertedBackendSuggestions,
      ...convertedSuggestions,
      ...localSuggestions,
    ]

    // Dedupe by id
    const seen = new Set<string>()
    const deduped = allSuggestions.filter(s => {
      if (seen.has(s.id)) return false
      seen.add(s.id)
      return true
    })

    // Limit to top 6 suggestions
    setSuggestions(deduped.slice(0, 6))
  }, [context, serviceContext, backendSuggestions, hasBackendSuggestions])

  const dismissSuggestion = useCallback(async (id: string) => {
    // Find the suggestion to check if it has a backend ID
    const suggestion = suggestions.find(s => s.id === id)

    // Update local state immediately
    setSuggestions(prev =>
      prev.map(s => s.id === id ? { ...s, dismissed: true } : s)
    )

    // If it's a backend suggestion, record the rejection for learning
    if (suggestion?.backendId) {
      await actOnSuggestion(suggestion.backendId, 'rejected')
    }

    // Persist local dismissal
    const dismissed = JSON.parse(localStorage.getItem('nexus_dismissed_suggestions') || '[]')
    localStorage.setItem('nexus_dismissed_suggestions', JSON.stringify([...dismissed, id]))
  }, [suggestions, actOnSuggestion])

  return {
    suggestions,
    dismissSuggestion,
    loading: backendLoading,
    actOnSuggestion, // Expose for implementing suggestions
  }
}

// Inline Suggestion Component (for chat/workflow builder)
interface InlineSuggestionProps {
  text: string
  onClick: () => void
  icon?: string
}

export function InlineSuggestion({ text, onClick, icon = '💡' }: InlineSuggestionProps) {
  return (
    <button
      onClick={onClick}
      className="
        inline-flex items-center gap-2 px-3 py-1.5 rounded-full
        bg-cyan-500/10 border border-cyan-500/30 text-cyan-400
        hover:bg-cyan-500/20 hover:border-cyan-500/50
        transition-all text-sm
      "
    >
      <span>{icon}</span>
      <span>{text}</span>
    </button>
  )
}

// Quick Action Suggestions (floating)
interface QuickActionSuggestionsProps {
  onSelect: (action: string) => void
}

export function QuickActionSuggestions({ onSelect }: QuickActionSuggestionsProps) {
  const actions = [
    { id: 'crm', label: 'Update CRM', icon: '📊' },
    { id: 'email', label: 'Send Email', icon: '📧' },
    { id: 'report', label: 'Generate Report', icon: '📋' },
    { id: 'schedule', label: 'Schedule Meeting', icon: '📅' },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map(action => (
        <button
          key={action.id}
          onClick={() => onSelect(action.id)}
          className="
            flex items-center gap-2 px-4 py-2 rounded-xl
            bg-slate-800/50 border border-slate-700/50
            hover:bg-slate-700/50 hover:border-slate-600
            transition-all text-sm
          "
        >
          <span>{action.icon}</span>
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  )
}
