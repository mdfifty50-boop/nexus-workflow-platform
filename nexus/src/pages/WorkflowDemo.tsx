import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation'
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  getBezierPath,
  Handle,
  Position,
  useReactFlow,
  type Node,
  type Edge,
  type EdgeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Button } from '@/components/ui/button'
import { ProfessionalAvatar } from '@/components/ProfessionalAvatar'
import { SmartAIChatbot } from '@/components/SmartAIChatbot'
import { LazyAIMeetingRoom } from '@/components/LazyComponents'
import { ContextualHint } from '@/components/FirstTimeUserGuide'
import { usePersonalization, type PersonaType } from '@/contexts/PersonalizationContext'
import { workflowExecutionService, type ExecutionResult } from '@/services/WorkflowExecutionService'
import { SAMPLE_TEMPLATES, type WorkflowTemplate } from '@/components/TemplatesMarketplace'

// Custom hook for detecting mobile viewport
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile
}

// Mobile Zoom Controls - Floating zoom buttons for mobile
function MobileZoomControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow()

  return (
    <div className="fixed bottom-24 right-4 z-20 flex flex-col gap-2">
      <button
        onClick={() => zoomIn({ duration: 300 })}
        className="w-12 h-12 bg-slate-800/95 backdrop-blur-sm border border-slate-700 rounded-xl flex items-center justify-center text-white hover:bg-slate-700 active:bg-slate-600 transition-colors shadow-lg"
        aria-label="Zoom in"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
        </svg>
      </button>
      <button
        onClick={() => zoomOut({ duration: 300 })}
        className="w-12 h-12 bg-slate-800/95 backdrop-blur-sm border border-slate-700 rounded-xl flex items-center justify-center text-white hover:bg-slate-700 active:bg-slate-600 transition-colors shadow-lg"
        aria-label="Zoom out"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
        </svg>
      </button>
      <button
        onClick={() => fitView({ duration: 300, padding: 0.2 })}
        className="w-12 h-12 bg-slate-800/95 backdrop-blur-sm border border-slate-700 rounded-xl flex items-center justify-center text-white hover:bg-slate-700 active:bg-slate-600 transition-colors shadow-lg"
        aria-label="Fit to view"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      </button>
    </div>
  )
}

// Mobile Welcome Screen - Simple, guided experience for first-time users on mobile
function MobileWelcomeScreen({
  onCreateWithAI,
  onBrowseTemplates,
  onSkipToWorkflow,
  personaDisplayName
}: {
  onCreateWithAI: () => void
  onBrowseTemplates: () => void
  onSkipToWorkflow: () => void
  personaDisplayName: string
}) {
  const [automationIdea, setAutomationIdea] = useState('')
  const navigate = useNavigate()

  const handleSubmit = () => {
    if (automationIdea.trim()) {
      localStorage.setItem('nexus_workflow_demo_prefill', automationIdea.trim())
      onCreateWithAI()
    }
  }

  const quickStarters = [
    { icon: '📧', label: 'Email automation', prompt: 'Automate my email responses' },
    { icon: '📅', label: 'Meeting prep', prompt: 'Prepare me for meetings automatically' },
    { icon: '📊', label: 'Weekly report', prompt: 'Create a weekly summary report' },
    { icon: '🔔', label: 'Smart alerts', prompt: 'Alert me about important updates' },
  ]

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-auto">
      {/* Header - Minimal */}
      <header className="flex-shrink-0 px-4 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={onSkipToWorkflow}
          className="text-xs text-slate-400 hover:text-white transition-colors"
        >
          Skip to examples
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 px-4 pb-8">
        {/* Welcome Message */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            What would you like to automate?
          </h1>
          <p className="text-slate-400 text-sm">
            Describe your task and Nexus will build it for you
          </p>
        </div>

        {/* Input Area - Mobile optimized with larger touch targets */}
        <div className="mb-6">
          <div className="relative">
            <textarea
              value={automationIdea}
              onChange={(e) => setAutomationIdea(e.target.value)}
              placeholder="e.g., Send me a summary of my emails every morning..."
              className="w-full h-28 px-4 py-4 bg-slate-800/50 border-2 border-slate-700 rounded-xl text-white text-base placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 touch-manipulation"
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!automationIdea.trim()}
            className="w-full mt-3 min-h-[48px] bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-base py-4 rounded-xl font-medium hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/25 touch-manipulation active:scale-95 transition-transform"
          >
            Create with AI
          </Button>
        </div>

        {/* Quick Starters - Mobile optimized with larger touch targets */}
        <div className="mb-8">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-3 text-center">Or start with</p>
          <div className="grid grid-cols-2 gap-3">
            {quickStarters.map((starter) => (
              <button
                key={starter.label}
                onClick={() => {
                  setAutomationIdea(starter.prompt)
                }}
                className="flex items-center gap-2 px-4 py-4 min-h-[60px] bg-slate-800/50 border-2 border-slate-700/50 rounded-xl text-left hover:bg-slate-700/50 hover:border-slate-600 active:bg-slate-700 active:scale-95 transition-all touch-manipulation"
              >
                <span className="text-2xl">{starter.icon}</span>
                <span className="text-sm font-medium text-slate-300">{starter.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-slate-800"></div>
          <span className="text-xs text-slate-500">or</span>
          <div className="flex-1 h-px bg-slate-800"></div>
        </div>

        {/* Secondary Actions - Mobile optimized */}
        <div className="space-y-3">
          <button
            onClick={onBrowseTemplates}
            className="w-full flex items-center justify-center gap-3 px-4 py-4 min-h-[52px] bg-slate-800/30 border-2 border-slate-700/50 rounded-xl hover:bg-slate-800/50 hover:border-slate-600 active:bg-slate-800/60 active:scale-95 transition-all touch-manipulation"
          >
            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
            <span className="text-slate-200 font-medium text-base">Browse Templates</span>
          </button>

          <button
            onClick={onSkipToWorkflow}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 min-h-[48px] text-slate-400 hover:text-slate-200 active:text-white transition-colors touch-manipulation"
          >
            <span className="text-sm">View sample {personaDisplayName} workflows</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* What to do next - Guidance */}
        <div className="mt-8 p-4 bg-slate-800/30 border border-slate-700/30 rounded-xl">
          <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            How it works
          </h3>
          <ol className="text-xs text-slate-400 space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-medium">1.</span>
              Describe what you want to automate
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-medium">2.</span>
              Nexus AI creates your workflow
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-medium">3.</span>
              Review and customize as needed
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-medium">4.</span>
              Activate and let it run
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}

// AI Building Overlay - Shows when Nexus is generating a workflow from natural language
type AIBuildingPhase = 'analyzing' | 'planning' | 'building' | 'connecting' | 'ready'

interface AIBuildingStep {
  id: string
  label: string
  type: 'trigger' | 'agent' | 'api' | 'output'
  status: 'pending' | 'building' | 'ready'
  agentId?: string
}

function AIBuildingOverlay({
  request,
  onComplete,
  onCancel
}: {
  request: string
  onComplete: (workflow: { name: string; description: string; nodes: any[]; edges: any[]; errorEdges: string[] }) => void
  onCancel: () => void
}) {
  const [phase, setPhase] = useState<AIBuildingPhase>('analyzing')
  const [steps, setSteps] = useState<AIBuildingStep[]>([])
  const [_connections, setConnections] = useState<{ from: string; to: string; status: 'pending' | 'drawing' | 'done' }[]>([])
  void _connections // Used indirectly via setConnections
  const [analysisText, setAnalysisText] = useState('')
  const hasStartedRef = useRef(false)

  // Analyze the request and generate workflow steps
  useEffect(() => {
    if (hasStartedRef.current) return
    hasStartedRef.current = true

    const analyzeAndBuild = async () => {
      // Phase 1: Analyzing (1.5s)
      setPhase('analyzing')
      setAnalysisText('Understanding your request...')
      await new Promise(r => setTimeout(r, 800))
      setAnalysisText('Identifying data sources and outputs...')
      await new Promise(r => setTimeout(r, 700))

      // Phase 2: Planning (1s)
      setPhase('planning')

      // Parse the request to generate steps
      const generatedSteps = parseRequestToSteps(request)
      setSteps(generatedSteps.map(s => ({ ...s, status: 'pending' as const })))
      await new Promise(r => setTimeout(r, 1000))

      // Phase 3: Building nodes (0.5s per node)
      setPhase('building')
      for (let i = 0; i < generatedSteps.length; i++) {
        setSteps(prev => prev.map((s, idx) =>
          idx === i ? { ...s, status: 'building' } : idx < i ? { ...s, status: 'ready' } : s
        ))
        await new Promise(r => setTimeout(r, 500))
        setSteps(prev => prev.map((s, idx) =>
          idx === i ? { ...s, status: 'ready' } : s
        ))
      }

      // Phase 4: Connecting (0.3s per connection)
      setPhase('connecting')
      const generatedConnections = generateConnections(generatedSteps)
      setConnections(generatedConnections.map(c => ({ ...c, status: 'pending' as const })))

      for (let i = 0; i < generatedConnections.length; i++) {
        setConnections(prev => prev.map((c, idx) =>
          idx === i ? { ...c, status: 'drawing' } : idx < i ? { ...c, status: 'done' } : c
        ))
        await new Promise(r => setTimeout(r, 300))
        setConnections(prev => prev.map((c, idx) =>
          idx === i ? { ...c, status: 'done' } : c
        ))
      }

      // Phase 5: Ready
      setPhase('ready')
      await new Promise(r => setTimeout(r, 500))

      // Convert to workflow format and complete
      const workflow = convertToWorkflowFormat(request, generatedSteps, generatedConnections)
      onComplete(workflow)
    }

    analyzeAndBuild()
  }, [request, onComplete])

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="max-w-2xl w-full mx-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
            <span className="text-4xl">🤖</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {phase === 'ready' ? 'Your Workflow is Ready!' : 'Nexus is Building Your Workflow'}
          </h2>
          <p className="text-slate-400 max-w-md mx-auto">"{request}"</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {(['analyzing', 'planning', 'building', 'connecting', 'ready'] as AIBuildingPhase[]).map((p, i) => (
            <div key={p} className="flex items-center">
              <div className={`w-3 h-3 rounded-full transition-all ${
                phase === p ? 'bg-cyan-500 scale-125 animate-pulse' :
                ['analyzing', 'planning', 'building', 'connecting', 'ready'].indexOf(phase) > i
                  ? 'bg-emerald-500'
                  : 'bg-slate-700'
              }`} />
              {i < 4 && <div className={`w-8 h-0.5 ${
                ['analyzing', 'planning', 'building', 'connecting', 'ready'].indexOf(phase) > i
                  ? 'bg-emerald-500'
                  : 'bg-slate-700'
              }`} />}
            </div>
          ))}
        </div>

        {/* Phase-specific content */}
        {phase === 'analyzing' && (
          <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6 text-center">
            <div className="animate-pulse">
              <div className="text-cyan-400 mb-2">{analysisText}</div>
              <div className="flex justify-center gap-1">
                <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {phase === 'planning' && (
          <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6 text-center">
            <div className="text-cyan-400 mb-4">Planning workflow structure...</div>
            <div className="text-6xl animate-spin-slow">⚙️</div>
          </div>
        )}

        {(phase === 'building' || phase === 'connecting' || phase === 'ready') && steps.length > 0 && (
          <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
            <div className="text-sm text-slate-400 mb-4 text-center">
              {phase === 'building' ? 'Creating workflow nodes...' :
               phase === 'connecting' ? 'Connecting steps...' :
               '✓ All steps configured'}
            </div>
            <div className="space-y-3">
              {steps.map((step) => (
                <div key={step.id} className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                  step.status === 'building' ? 'bg-cyan-500/10 border border-cyan-500/30' :
                  step.status === 'ready' ? 'bg-emerald-500/10 border border-emerald-500/30' :
                  'bg-slate-800/50 border border-transparent'
                }`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    step.type === 'trigger' ? 'bg-amber-500/20 text-amber-400' :
                    step.type === 'agent' ? 'bg-cyan-500/20 text-cyan-400' :
                    step.type === 'api' ? 'bg-purple-500/20 text-purple-400' :
                    'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {step.type === 'trigger' ? '⚡' :
                     step.type === 'agent' ? '🤖' :
                     step.type === 'api' ? '🔌' : '✅'}
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-medium">{step.label}</div>
                    <div className="text-xs text-slate-400">
                      {step.type === 'trigger' ? 'Workflow trigger' :
                       step.type === 'agent' ? 'AI Agent processing' :
                       step.type === 'api' ? 'Integration' : 'Output'}
                    </div>
                  </div>
                  <div className="w-6 h-6 flex items-center justify-center">
                    {step.status === 'building' && (
                      <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                    )}
                    {step.status === 'ready' && (
                      <span className="text-emerald-400">✓</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex justify-center gap-4">
          {phase !== 'ready' && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Helper functions for AI workflow generation
function parseRequestToSteps(request: string): AIBuildingStep[] {
  const requestLower = request.toLowerCase()
  const steps: AIBuildingStep[] = []
  let stepId = 1

  // Detect trigger type
  if (requestLower.includes('every') || requestLower.includes('weekly') || requestLower.includes('daily') || requestLower.includes('friday') || requestLower.includes('monday')) {
    steps.push({ id: String(stepId++), label: 'Scheduled Trigger', type: 'trigger', status: 'pending' })
  } else if (requestLower.includes('when') || requestLower.includes('email') && requestLower.includes('receive')) {
    steps.push({ id: String(stepId++), label: 'Event Trigger', type: 'trigger', status: 'pending' })
  } else {
    steps.push({ id: String(stepId++), label: 'Manual Start', type: 'trigger', status: 'pending' })
  }

  // Detect data sources
  if (requestLower.includes('email') || requestLower.includes('gmail')) {
    steps.push({ id: String(stepId++), label: 'Fetch Emails', type: 'api', status: 'pending' })
  }
  if (requestLower.includes('calendar') || requestLower.includes('meeting')) {
    steps.push({ id: String(stepId++), label: 'Calendar Events', type: 'api', status: 'pending' })
  }
  if (requestLower.includes('task') || requestLower.includes('project') || requestLower.includes('team')) {
    steps.push({ id: String(stepId++), label: 'Task Manager', type: 'api', status: 'pending' })
  }
  if (requestLower.includes('spreadsheet') || requestLower.includes('sheet') || requestLower.includes('data')) {
    steps.push({ id: String(stepId++), label: 'Data Source', type: 'api', status: 'pending' })
  }

  // AI processing step
  if (requestLower.includes('summary') || requestLower.includes('summarize') || requestLower.includes('analyze') || requestLower.includes('report')) {
    steps.push({ id: String(stepId++), label: 'AI Analysis', type: 'agent', agentId: 'larry', status: 'pending' })
  }
  if (requestLower.includes('write') || requestLower.includes('draft') || requestLower.includes('compose')) {
    steps.push({ id: String(stepId++), label: 'AI Content Writer', type: 'agent', agentId: 'mary', status: 'pending' })
  }

  // Always have at least one agent for processing
  if (steps.filter(s => s.type === 'agent').length === 0) {
    steps.push({ id: String(stepId++), label: 'AI Processing', type: 'agent', agentId: 'sam', status: 'pending' })
  }

  // Detect output destination
  if (requestLower.includes('whatsapp')) {
    steps.push({ id: String(stepId++), label: 'Send WhatsApp', type: 'output', status: 'pending' })
  } else if (requestLower.includes('slack')) {
    steps.push({ id: String(stepId++), label: 'Send to Slack', type: 'output', status: 'pending' })
  } else if (requestLower.includes('email') || requestLower.includes('send')) {
    steps.push({ id: String(stepId++), label: 'Send Email', type: 'output', status: 'pending' })
  } else {
    steps.push({ id: String(stepId++), label: 'Save Results', type: 'output', status: 'pending' })
  }

  return steps
}

function generateConnections(steps: AIBuildingStep[]): { from: string; to: string }[] {
  const connections: { from: string; to: string }[] = []

  // Find trigger(s), data sources (APIs), processors (agents), and outputs
  const triggers = steps.filter(s => s.type === 'trigger')
  const dataSources = steps.filter(s => s.type === 'api')
  const agents = steps.filter(s => s.type === 'agent')
  const outputs = steps.filter(s => s.type === 'output')

  // Connect trigger to all data sources (parallel fetch)
  triggers.forEach(trigger => {
    if (dataSources.length > 0) {
      dataSources.forEach(ds => {
        connections.push({ from: trigger.id, to: ds.id })
      })
    } else if (agents.length > 0) {
      // No data sources - connect trigger to first agent
      connections.push({ from: trigger.id, to: agents[0].id })
    }
  })

  // Connect data sources to agents (fan-in to processing)
  if (dataSources.length > 0 && agents.length > 0) {
    // All data sources feed into first agent
    dataSources.forEach(ds => {
      connections.push({ from: ds.id, to: agents[0].id })
    })
  }

  // Chain agents together
  for (let i = 0; i < agents.length - 1; i++) {
    connections.push({ from: agents[i].id, to: agents[i + 1].id })
  }

  // Connect last agent to output(s)
  if (agents.length > 0 && outputs.length > 0) {
    const lastAgent = agents[agents.length - 1]
    outputs.forEach(output => {
      connections.push({ from: lastAgent.id, to: output.id })
    })
  } else if (dataSources.length > 0 && outputs.length > 0) {
    // No agents - connect data sources to outputs
    dataSources.forEach(ds => {
      connections.push({ from: ds.id, to: outputs[0].id })
    })
  }

  return connections
}

// Intelligent layout algorithm that positions nodes based on workflow structure
function calculateIntelligentLayout(
  steps: AIBuildingStep[],
  connections: { from: string; to: string }[]
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>()

  // Configuration
  const HORIZONTAL_SPACING = 220
  const VERTICAL_SPACING = 120
  const START_X = 50
  const CENTER_Y = 200

  // Group steps by type
  const triggers = steps.filter(s => s.type === 'trigger')
  const dataSources = steps.filter(s => s.type === 'api')
  const agents = steps.filter(s => s.type === 'agent')
  const outputs = steps.filter(s => s.type === 'output')

  // Calculate columns based on workflow structure
  let currentX = START_X

  // Column 1: Triggers
  triggers.forEach((step, i) => {
    const totalHeight = triggers.length * VERTICAL_SPACING
    const startY = CENTER_Y - totalHeight / 2 + VERTICAL_SPACING / 2
    positions.set(step.id, { x: currentX, y: startY + i * VERTICAL_SPACING })
  })

  // Column 2: Data Sources (parallel - stacked vertically)
  if (dataSources.length > 0) {
    currentX += HORIZONTAL_SPACING
    const totalHeight = dataSources.length * VERTICAL_SPACING
    const startY = CENTER_Y - totalHeight / 2 + VERTICAL_SPACING / 2
    dataSources.forEach((step, i) => {
      positions.set(step.id, { x: currentX, y: startY + i * VERTICAL_SPACING })
    })
  }

  // Column 3+: Agents (can be chained or parallel based on connections)
  if (agents.length > 0) {
    currentX += HORIZONTAL_SPACING

    // Check if agents are chained or parallel
    const agentConnections = connections.filter(
      c => agents.some(a => a.id === c.from) && agents.some(a => a.id === c.to)
    )

    if (agentConnections.length > 0) {
      // Agents are chained - place them horizontally
      agents.forEach((step, i) => {
        positions.set(step.id, { x: currentX + i * HORIZONTAL_SPACING, y: CENTER_Y })
      })
      currentX += (agents.length - 1) * HORIZONTAL_SPACING
    } else {
      // Agents are parallel - stack vertically
      const totalHeight = agents.length * VERTICAL_SPACING
      const startY = CENTER_Y - totalHeight / 2 + VERTICAL_SPACING / 2
      agents.forEach((step, i) => {
        positions.set(step.id, { x: currentX, y: startY + i * VERTICAL_SPACING })
      })
    }
  }

  // Final Column: Outputs
  if (outputs.length > 0) {
    currentX += HORIZONTAL_SPACING
    const totalHeight = outputs.length * VERTICAL_SPACING
    const startY = CENTER_Y - totalHeight / 2 + VERTICAL_SPACING / 2
    outputs.forEach((step, i) => {
      positions.set(step.id, { x: currentX, y: startY + i * VERTICAL_SPACING })
    })
  }

  return positions
}

function convertToWorkflowFormat(
  request: string,
  steps: AIBuildingStep[],
  connections: { from: string; to: string }[]
): { name: string; description: string; nodes: any[]; edges: any[]; errorEdges: string[] } {
  // Generate workflow name from request
  const name = request.length > 40 ? request.substring(0, 40) + '...' : request

  // Use intelligent layout algorithm
  const positions = calculateIntelligentLayout(steps, connections)

  // Convert steps to nodes with intelligent positions
  const nodes = steps.map((step) => {
    const pos = positions.get(step.id) || { x: 0, y: 200 }
    return {
      id: step.id,
      position: pos,
      data: {
        label: step.label,
        type: step.type,
        agentId: step.agentId,
        status: 'idle' as const
      }
    }
  })

  // Convert connections to edges (using actual connections, not sequential)
  const edges = connections.map((conn) => ({
    id: `e${conn.from}-${conn.to}`,
    source: conn.from,
    target: conn.to
  }))

  return {
    name,
    description: request,
    nodes,
    edges,
    errorEdges: []
  }
}

// Types for workflow states
type NodeStatus = 'idle' | 'running' | 'success' | 'error' | 'fixing'
type EdgeStatus = 'idle' | 'drawing' | 'active' | 'error' | 'fixing' | 'success'

interface WorkflowNodeData {
  label: string
  type: 'trigger' | 'agent' | 'api' | 'output'
  agentId?: string
  status: NodeStatus
}

interface EdgeData {
  status?: EdgeStatus
  progress?: number
  errorMessage?: string
  fixingAgentId?: string
}

// Persona-specific workflow definitions
const PERSONA_WORKFLOWS: Record<string, Record<string, {
  name: string
  description: string
  nodes: { id: string; position: { x: number; y: number }; data: { label: string; type: 'trigger' | 'agent' | 'api' | 'output'; agentId?: string; status: NodeStatus } }[]
  edges: { id: string; source: string; target: string }[]
  errorEdges: string[]
}>> = {
  // HEALTHCARE WORKFLOWS
  doctor: {
    patientIntake: {
      name: 'Patient Intake Automation',
      description: 'Automate patient forms, insurance verification, and pre-visit preparation',
      nodes: [
        { id: '1', position: { x: 0, y: 150 }, data: { label: 'New Patient', type: 'trigger', status: 'idle' as NodeStatus } },
        { id: '2', position: { x: 200, y: 50 }, data: { label: 'EHR System', type: 'api', status: 'idle' as NodeStatus } },
        { id: '3', position: { x: 200, y: 250 }, data: { label: 'Insurance API', type: 'api', status: 'idle' as NodeStatus } },
        { id: '4', position: { x: 400, y: 50 }, data: { label: 'Larry - Scribe', type: 'agent', agentId: 'larry', status: 'idle' as NodeStatus } },
        { id: '5', position: { x: 400, y: 150 }, data: { label: 'Mary - Coordinator', type: 'agent', agentId: 'mary', status: 'idle' as NodeStatus } },
        { id: '6', position: { x: 400, y: 250 }, data: { label: 'Eligibility Check', type: 'api', status: 'idle' as NodeStatus } },
        { id: '7', position: { x: 600, y: 100 }, data: { label: 'Sam - Records', type: 'agent', agentId: 'sam', status: 'idle' as NodeStatus } },
        { id: '8', position: { x: 600, y: 200 }, data: { label: 'Alex - Clinical', type: 'agent', agentId: 'alex', status: 'idle' as NodeStatus } },
        { id: '9', position: { x: 800, y: 50 }, data: { label: 'Lab Orders', type: 'api', status: 'idle' as NodeStatus } },
        { id: '10', position: { x: 800, y: 150 }, data: { label: 'Emma - Care Plan', type: 'agent', agentId: 'emma', status: 'idle' as NodeStatus } },
        { id: '11', position: { x: 800, y: 250 }, data: { label: 'Scheduling', type: 'api', status: 'idle' as NodeStatus } },
        { id: '12', position: { x: 1000, y: 100 }, data: { label: 'Patient Portal', type: 'api', status: 'idle' as NodeStatus } },
        { id: '13', position: { x: 1000, y: 200 }, data: { label: 'Olivia - QA', type: 'agent', agentId: 'olivia', status: 'idle' as NodeStatus } },
        { id: '14', position: { x: 1200, y: 150 }, data: { label: 'Ready for Visit', type: 'output', status: 'idle' as NodeStatus } },
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e1-3', source: '1', target: '3' },
        { id: 'e2-4', source: '2', target: '4' },
        { id: 'e2-5', source: '2', target: '5' },
        { id: 'e3-5', source: '3', target: '5' },
        { id: 'e3-6', source: '3', target: '6' },
        { id: 'e4-7', source: '4', target: '7' },
        { id: 'e5-7', source: '5', target: '7' },
        { id: 'e5-8', source: '5', target: '8' },
        { id: 'e6-8', source: '6', target: '8' },
        { id: 'e7-9', source: '7', target: '9' },
        { id: 'e7-10', source: '7', target: '10' },
        { id: 'e8-10', source: '8', target: '10' },
        { id: 'e8-11', source: '8', target: '11' },
        { id: 'e9-12', source: '9', target: '12' },
        { id: 'e10-12', source: '10', target: '12' },
        { id: 'e10-13', source: '10', target: '13' },
        { id: 'e11-13', source: '11', target: '13' },
        { id: 'e12-14', source: '12', target: '14' },
        { id: 'e13-14', source: '13', target: '14' },
      ],
      errorEdges: ['e3-6', 'e8-10'],
    },
    priorAuth: {
      name: 'Prior Authorization Workflow',
      description: 'Automate prior auth submissions, follow-ups, and appeals',
      nodes: [
        { id: '1', position: { x: 0, y: 150 }, data: { label: 'Auth Request', type: 'trigger', status: 'idle' as NodeStatus } },
        { id: '2', position: { x: 200, y: 100 }, data: { label: 'Larry - Docs', type: 'agent', agentId: 'larry', status: 'idle' as NodeStatus } },
        { id: '3', position: { x: 200, y: 200 }, data: { label: 'Payer Portal', type: 'api', status: 'idle' as NodeStatus } },
        { id: '4', position: { x: 400, y: 50 }, data: { label: 'Clinical Notes', type: 'api', status: 'idle' as NodeStatus } },
        { id: '5', position: { x: 400, y: 150 }, data: { label: 'Mary - Submit', type: 'agent', agentId: 'mary', status: 'idle' as NodeStatus } },
        { id: '6', position: { x: 400, y: 250 }, data: { label: 'Sam - Track', type: 'agent', agentId: 'sam', status: 'idle' as NodeStatus } },
        { id: '7', position: { x: 600, y: 100 }, data: { label: 'Alex - Appeal', type: 'agent', agentId: 'alex', status: 'idle' as NodeStatus } },
        { id: '8', position: { x: 600, y: 200 }, data: { label: 'Fax Gateway', type: 'api', status: 'idle' as NodeStatus } },
        { id: '9', position: { x: 800, y: 50 }, data: { label: 'Emma - Notify', type: 'agent', agentId: 'emma', status: 'idle' as NodeStatus } },
        { id: '10', position: { x: 800, y: 150 }, data: { label: 'Update EHR', type: 'api', status: 'idle' as NodeStatus } },
        { id: '11', position: { x: 800, y: 250 }, data: { label: 'Olivia - Verify', type: 'agent', agentId: 'olivia', status: 'idle' as NodeStatus } },
        { id: '12', position: { x: 1000, y: 150 }, data: { label: 'Approved', type: 'output', status: 'idle' as NodeStatus } },
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e1-3', source: '1', target: '3' },
        { id: 'e2-4', source: '2', target: '4' },
        { id: 'e2-5', source: '2', target: '5' },
        { id: 'e3-5', source: '3', target: '5' },
        { id: 'e3-6', source: '3', target: '6' },
        { id: 'e4-7', source: '4', target: '7' },
        { id: 'e5-7', source: '5', target: '7' },
        { id: 'e6-7', source: '6', target: '7' },
        { id: 'e7-8', source: '7', target: '8' },
        { id: 'e8-9', source: '8', target: '9' },
        { id: 'e8-10', source: '8', target: '10' },
        { id: 'e8-11', source: '8', target: '11' },
        { id: 'e9-12', source: '9', target: '12' },
        { id: 'e10-12', source: '10', target: '12' },
        { id: 'e11-12', source: '11', target: '12' },
      ],
      errorEdges: ['e3-5', 'e7-8'],
    },
  },
  nurse: {
    patientHandoff: {
      name: 'Patient Handoff Automation',
      description: 'Streamline shift changes with automated handoff reports',
      nodes: [
        { id: '1', position: { x: 0, y: 150 }, data: { label: 'Shift Change', type: 'trigger', status: 'idle' as NodeStatus } },
        { id: '2', position: { x: 200, y: 100 }, data: { label: 'Larry - Summary', type: 'agent', agentId: 'larry', status: 'idle' as NodeStatus } },
        { id: '3', position: { x: 200, y: 200 }, data: { label: 'EHR Extract', type: 'api', status: 'idle' as NodeStatus } },
        { id: '4', position: { x: 400, y: 50 }, data: { label: 'Vitals Monitor', type: 'api', status: 'idle' as NodeStatus } },
        { id: '5', position: { x: 400, y: 150 }, data: { label: 'Mary - Prioritize', type: 'agent', agentId: 'mary', status: 'idle' as NodeStatus } },
        { id: '6', position: { x: 400, y: 250 }, data: { label: 'Med Schedule', type: 'api', status: 'idle' as NodeStatus } },
        { id: '7', position: { x: 600, y: 100 }, data: { label: 'Sam - Alerts', type: 'agent', agentId: 'sam', status: 'idle' as NodeStatus } },
        { id: '8', position: { x: 600, y: 200 }, data: { label: 'Task Board', type: 'api', status: 'idle' as NodeStatus } },
        { id: '9', position: { x: 800, y: 150 }, data: { label: 'Handoff Ready', type: 'output', status: 'idle' as NodeStatus } },
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e1-3', source: '1', target: '3' },
        { id: 'e2-5', source: '2', target: '5' },
        { id: 'e3-4', source: '3', target: '4' },
        { id: 'e3-6', source: '3', target: '6' },
        { id: 'e4-7', source: '4', target: '7' },
        { id: 'e5-7', source: '5', target: '7' },
        { id: 'e6-8', source: '6', target: '8' },
        { id: 'e7-9', source: '7', target: '9' },
        { id: 'e8-9', source: '8', target: '9' },
      ],
      errorEdges: ['e3-4'],
    },
    medicationReconciliation: {
      name: 'Medication Reconciliation',
      description: 'Cross-check medications across systems and flag interactions',
      nodes: [
        { id: '1', position: { x: 0, y: 150 }, data: { label: 'Patient Admit', type: 'trigger', status: 'idle' as NodeStatus } },
        { id: '2', position: { x: 200, y: 100 }, data: { label: 'Pharmacy DB', type: 'api', status: 'idle' as NodeStatus } },
        { id: '3', position: { x: 200, y: 200 }, data: { label: 'Home Meds List', type: 'api', status: 'idle' as NodeStatus } },
        { id: '4', position: { x: 400, y: 150 }, data: { label: 'Larry - Compare', type: 'agent', agentId: 'larry', status: 'idle' as NodeStatus } },
        { id: '5', position: { x: 600, y: 100 }, data: { label: 'Drug Interaction', type: 'api', status: 'idle' as NodeStatus } },
        { id: '6', position: { x: 600, y: 200 }, data: { label: 'Alex - Review', type: 'agent', agentId: 'alex', status: 'idle' as NodeStatus } },
        { id: '7', position: { x: 800, y: 150 }, data: { label: 'Reconciled', type: 'output', status: 'idle' as NodeStatus } },
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e1-3', source: '1', target: '3' },
        { id: 'e2-4', source: '2', target: '4' },
        { id: 'e3-4', source: '3', target: '4' },
        { id: 'e4-5', source: '4', target: '5' },
        { id: 'e4-6', source: '4', target: '6' },
        { id: 'e5-7', source: '5', target: '7' },
        { id: 'e6-7', source: '6', target: '7' },
      ],
      errorEdges: ['e4-5'],
    },
  },

  // LEGAL WORKFLOWS
  lawyer: {
    caseIntake: {
      name: 'Case Intake & Conflict Check',
      description: 'Automate new client intake, conflict checking, and retainer generation',
      nodes: [
        { id: '1', position: { x: 0, y: 150 }, data: { label: 'New Client', type: 'trigger', status: 'idle' as NodeStatus } },
        { id: '2', position: { x: 200, y: 50 }, data: { label: 'Clio/PracticePanther', type: 'api', status: 'idle' as NodeStatus } },
        { id: '3', position: { x: 200, y: 250 }, data: { label: 'Conflict DB', type: 'api', status: 'idle' as NodeStatus } },
        { id: '4', position: { x: 400, y: 50 }, data: { label: 'Larry - Research', type: 'agent', agentId: 'larry', status: 'idle' as NodeStatus } },
        { id: '5', position: { x: 400, y: 150 }, data: { label: 'Mary - Intake', type: 'agent', agentId: 'mary', status: 'idle' as NodeStatus } },
        { id: '6', position: { x: 400, y: 250 }, data: { label: 'Court Records', type: 'api', status: 'idle' as NodeStatus } },
        { id: '7', position: { x: 600, y: 100 }, data: { label: 'Sam - Documents', type: 'agent', agentId: 'sam', status: 'idle' as NodeStatus } },
        { id: '8', position: { x: 600, y: 200 }, data: { label: 'Alex - Strategy', type: 'agent', agentId: 'alex', status: 'idle' as NodeStatus } },
        { id: '9', position: { x: 800, y: 50 }, data: { label: 'DocuSign', type: 'api', status: 'idle' as NodeStatus } },
        { id: '10', position: { x: 800, y: 150 }, data: { label: 'Emma - Retainer', type: 'agent', agentId: 'emma', status: 'idle' as NodeStatus } },
        { id: '11', position: { x: 800, y: 250 }, data: { label: 'Billing Setup', type: 'api', status: 'idle' as NodeStatus } },
        { id: '12', position: { x: 1000, y: 100 }, data: { label: 'Client Portal', type: 'api', status: 'idle' as NodeStatus } },
        { id: '13', position: { x: 1000, y: 200 }, data: { label: 'Olivia - Review', type: 'agent', agentId: 'olivia', status: 'idle' as NodeStatus } },
        { id: '14', position: { x: 1200, y: 150 }, data: { label: 'Case Opened', type: 'output', status: 'idle' as NodeStatus } },
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e1-3', source: '1', target: '3' },
        { id: 'e2-4', source: '2', target: '4' },
        { id: 'e2-5', source: '2', target: '5' },
        { id: 'e3-5', source: '3', target: '5' },
        { id: 'e3-6', source: '3', target: '6' },
        { id: 'e4-7', source: '4', target: '7' },
        { id: 'e5-7', source: '5', target: '7' },
        { id: 'e5-8', source: '5', target: '8' },
        { id: 'e6-8', source: '6', target: '8' },
        { id: 'e7-9', source: '7', target: '9' },
        { id: 'e7-10', source: '7', target: '10' },
        { id: 'e8-10', source: '8', target: '10' },
        { id: 'e8-11', source: '8', target: '11' },
        { id: 'e9-12', source: '9', target: '12' },
        { id: 'e10-12', source: '10', target: '12' },
        { id: 'e10-13', source: '10', target: '13' },
        { id: 'e11-13', source: '11', target: '13' },
        { id: 'e12-14', source: '12', target: '14' },
        { id: 'e13-14', source: '13', target: '14' },
      ],
      errorEdges: ['e3-5', 'e8-11'],
    },
    discoveryProcess: {
      name: 'Discovery Document Processing',
      description: 'AI-powered document review, classification, and privilege logging',
      nodes: [
        { id: '1', position: { x: 0, y: 150 }, data: { label: 'Doc Production', type: 'trigger', status: 'idle' as NodeStatus } },
        { id: '2', position: { x: 200, y: 100 }, data: { label: 'Larry - OCR', type: 'agent', agentId: 'larry', status: 'idle' as NodeStatus } },
        { id: '3', position: { x: 200, y: 200 }, data: { label: 'Relativity', type: 'api', status: 'idle' as NodeStatus } },
        { id: '4', position: { x: 400, y: 50 }, data: { label: 'Mary - Classify', type: 'agent', agentId: 'mary', status: 'idle' as NodeStatus } },
        { id: '5', position: { x: 400, y: 150 }, data: { label: 'Sam - Extract', type: 'agent', agentId: 'sam', status: 'idle' as NodeStatus } },
        { id: '6', position: { x: 400, y: 250 }, data: { label: 'Alex - Privilege', type: 'agent', agentId: 'alex', status: 'idle' as NodeStatus } },
        { id: '7', position: { x: 600, y: 100 }, data: { label: 'Emma - Timeline', type: 'agent', agentId: 'emma', status: 'idle' as NodeStatus } },
        { id: '8', position: { x: 600, y: 200 }, data: { label: 'Priv Log Gen', type: 'api', status: 'idle' as NodeStatus } },
        { id: '9', position: { x: 800, y: 100 }, data: { label: 'Case Database', type: 'api', status: 'idle' as NodeStatus } },
        { id: '10', position: { x: 800, y: 200 }, data: { label: 'Olivia - QC', type: 'agent', agentId: 'olivia', status: 'idle' as NodeStatus } },
        { id: '11', position: { x: 1000, y: 150 }, data: { label: 'Review Complete', type: 'output', status: 'idle' as NodeStatus } },
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e1-3', source: '1', target: '3' },
        { id: 'e2-4', source: '2', target: '4' },
        { id: 'e2-5', source: '2', target: '5' },
        { id: 'e3-5', source: '3', target: '5' },
        { id: 'e3-6', source: '3', target: '6' },
        { id: 'e4-7', source: '4', target: '7' },
        { id: 'e5-7', source: '5', target: '7' },
        { id: 'e6-8', source: '6', target: '8' },
        { id: 'e7-9', source: '7', target: '9' },
        { id: 'e8-10', source: '8', target: '10' },
        { id: 'e9-11', source: '9', target: '11' },
        { id: 'e10-11', source: '10', target: '11' },
      ],
      errorEdges: ['e2-5', 'e6-8'],
    },
  },

  // REAL ESTATE WORKFLOWS
  realtor: {
    listingAutomation: {
      name: 'Property Listing Automation',
      description: 'Auto-create listings, syndicate to MLS, and generate marketing materials',
      nodes: [
        { id: '1', position: { x: 0, y: 150 }, data: { label: 'New Property', type: 'trigger', status: 'idle' as NodeStatus } },
        { id: '2', position: { x: 200, y: 50 }, data: { label: 'MLS System', type: 'api', status: 'idle' as NodeStatus } },
        { id: '3', position: { x: 200, y: 250 }, data: { label: 'Photo Upload', type: 'api', status: 'idle' as NodeStatus } },
        { id: '4', position: { x: 400, y: 50 }, data: { label: 'Larry - Analysis', type: 'agent', agentId: 'larry', status: 'idle' as NodeStatus } },
        { id: '5', position: { x: 400, y: 150 }, data: { label: 'Mary - Pricing', type: 'agent', agentId: 'mary', status: 'idle' as NodeStatus } },
        { id: '6', position: { x: 400, y: 250 }, data: { label: 'Emma - Photos', type: 'agent', agentId: 'emma', status: 'idle' as NodeStatus } },
        { id: '7', position: { x: 600, y: 100 }, data: { label: 'Sam - Description', type: 'agent', agentId: 'sam', status: 'idle' as NodeStatus } },
        { id: '8', position: { x: 600, y: 200 }, data: { label: 'Zillow/Redfin', type: 'api', status: 'idle' as NodeStatus } },
        { id: '9', position: { x: 800, y: 50 }, data: { label: 'Facebook Ads', type: 'api', status: 'idle' as NodeStatus } },
        { id: '10', position: { x: 800, y: 150 }, data: { label: 'Flyer Generator', type: 'api', status: 'idle' as NodeStatus } },
        { id: '11', position: { x: 800, y: 250 }, data: { label: 'Virtual Tour', type: 'api', status: 'idle' as NodeStatus } },
        { id: '12', position: { x: 1000, y: 150 }, data: { label: 'Listed!', type: 'output', status: 'idle' as NodeStatus } },
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e1-3', source: '1', target: '3' },
        { id: 'e2-4', source: '2', target: '4' },
        { id: 'e2-5', source: '2', target: '5' },
        { id: 'e3-6', source: '3', target: '6' },
        { id: 'e4-7', source: '4', target: '7' },
        { id: 'e5-7', source: '5', target: '7' },
        { id: 'e6-8', source: '6', target: '8' },
        { id: 'e7-8', source: '7', target: '8' },
        { id: 'e8-9', source: '8', target: '9' },
        { id: 'e8-10', source: '8', target: '10' },
        { id: 'e8-11', source: '8', target: '11' },
        { id: 'e9-12', source: '9', target: '12' },
        { id: 'e10-12', source: '10', target: '12' },
        { id: 'e11-12', source: '11', target: '12' },
      ],
      errorEdges: ['e6-8', 'e8-9'],
    },
    leadNurturing: {
      name: 'Lead Nurturing Pipeline',
      description: 'Automate follow-ups, property matches, and showing scheduling',
      nodes: [
        { id: '1', position: { x: 0, y: 150 }, data: { label: 'New Lead', type: 'trigger', status: 'idle' as NodeStatus } },
        { id: '2', position: { x: 200, y: 100 }, data: { label: 'CRM Import', type: 'api', status: 'idle' as NodeStatus } },
        { id: '3', position: { x: 200, y: 200 }, data: { label: 'Larry - Qualify', type: 'agent', agentId: 'larry', status: 'idle' as NodeStatus } },
        { id: '4', position: { x: 400, y: 100 }, data: { label: 'MLS Search', type: 'api', status: 'idle' as NodeStatus } },
        { id: '5', position: { x: 400, y: 200 }, data: { label: 'Mary - Match', type: 'agent', agentId: 'mary', status: 'idle' as NodeStatus } },
        { id: '6', position: { x: 600, y: 100 }, data: { label: 'Sam - Email', type: 'agent', agentId: 'sam', status: 'idle' as NodeStatus } },
        { id: '7', position: { x: 600, y: 200 }, data: { label: 'Calendly', type: 'api', status: 'idle' as NodeStatus } },
        { id: '8', position: { x: 800, y: 150 }, data: { label: 'Showing Set', type: 'output', status: 'idle' as NodeStatus } },
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e1-3', source: '1', target: '3' },
        { id: 'e2-4', source: '2', target: '4' },
        { id: 'e3-5', source: '3', target: '5' },
        { id: 'e4-5', source: '4', target: '5' },
        { id: 'e5-6', source: '5', target: '6' },
        { id: 'e5-7', source: '5', target: '7' },
        { id: 'e6-8', source: '6', target: '8' },
        { id: 'e7-8', source: '7', target: '8' },
      ],
      errorEdges: ['e4-5'],
    },
  },

  // FINANCE WORKFLOWS
  accountant: {
    invoiceProcessing: {
      name: 'Invoice Processing Automation',
      description: 'Extract, validate, code, and approve invoices automatically',
      nodes: [
        { id: '1', position: { x: 0, y: 150 }, data: { label: 'Invoice Email', type: 'trigger', status: 'idle' as NodeStatus } },
        { id: '2', position: { x: 200, y: 100 }, data: { label: 'Larry - OCR', type: 'agent', agentId: 'larry', status: 'idle' as NodeStatus } },
        { id: '3', position: { x: 200, y: 200 }, data: { label: 'Gmail Extract', type: 'api', status: 'idle' as NodeStatus } },
        { id: '4', position: { x: 400, y: 50 }, data: { label: 'Mary - Validate', type: 'agent', agentId: 'mary', status: 'idle' as NodeStatus } },
        { id: '5', position: { x: 400, y: 150 }, data: { label: 'Sam - Code', type: 'agent', agentId: 'sam', status: 'idle' as NodeStatus } },
        { id: '6', position: { x: 400, y: 250 }, data: { label: 'Vendor DB', type: 'api', status: 'idle' as NodeStatus } },
        { id: '7', position: { x: 600, y: 100 }, data: { label: 'QuickBooks', type: 'api', status: 'idle' as NodeStatus } },
        { id: '8', position: { x: 600, y: 200 }, data: { label: 'Alex - Approve', type: 'agent', agentId: 'alex', status: 'idle' as NodeStatus } },
        { id: '9', position: { x: 800, y: 100 }, data: { label: 'Bill.com', type: 'api', status: 'idle' as NodeStatus } },
        { id: '10', position: { x: 800, y: 200 }, data: { label: 'Olivia - Audit', type: 'agent', agentId: 'olivia', status: 'idle' as NodeStatus } },
        { id: '11', position: { x: 1000, y: 150 }, data: { label: 'Processed', type: 'output', status: 'idle' as NodeStatus } },
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e1-3', source: '1', target: '3' },
        { id: 'e2-4', source: '2', target: '4' },
        { id: 'e3-5', source: '3', target: '5' },
        { id: 'e3-6', source: '3', target: '6' },
        { id: 'e4-5', source: '4', target: '5' },
        { id: 'e5-7', source: '5', target: '7' },
        { id: 'e5-8', source: '5', target: '8' },
        { id: 'e6-7', source: '6', target: '7' },
        { id: 'e7-9', source: '7', target: '9' },
        { id: 'e8-10', source: '8', target: '10' },
        { id: 'e9-11', source: '9', target: '11' },
        { id: 'e10-11', source: '10', target: '11' },
      ],
      errorEdges: ['e2-4', 'e7-9'],
    },
    monthEndClose: {
      name: 'Month-End Close Automation',
      description: 'Automate reconciliations, journal entries, and close checklists',
      nodes: [
        { id: '1', position: { x: 0, y: 150 }, data: { label: 'Month End', type: 'trigger', status: 'idle' as NodeStatus } },
        { id: '2', position: { x: 200, y: 100 }, data: { label: 'Bank Feeds', type: 'api', status: 'idle' as NodeStatus } },
        { id: '3', position: { x: 200, y: 200 }, data: { label: 'Larry - Reconcile', type: 'agent', agentId: 'larry', status: 'idle' as NodeStatus } },
        { id: '4', position: { x: 400, y: 100 }, data: { label: 'Mary - Accruals', type: 'agent', agentId: 'mary', status: 'idle' as NodeStatus } },
        { id: '5', position: { x: 400, y: 200 }, data: { label: 'Sam - Entries', type: 'agent', agentId: 'sam', status: 'idle' as NodeStatus } },
        { id: '6', position: { x: 600, y: 100 }, data: { label: 'GL System', type: 'api', status: 'idle' as NodeStatus } },
        { id: '7', position: { x: 600, y: 200 }, data: { label: 'Olivia - Review', type: 'agent', agentId: 'olivia', status: 'idle' as NodeStatus } },
        { id: '8', position: { x: 800, y: 150 }, data: { label: 'Books Closed', type: 'output', status: 'idle' as NodeStatus } },
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e1-3', source: '1', target: '3' },
        { id: 'e2-4', source: '2', target: '4' },
        { id: 'e3-4', source: '3', target: '4' },
        { id: 'e3-5', source: '3', target: '5' },
        { id: 'e4-6', source: '4', target: '6' },
        { id: 'e5-6', source: '5', target: '6' },
        { id: 'e6-7', source: '6', target: '7' },
        { id: 'e7-8', source: '7', target: '8' },
      ],
      errorEdges: ['e3-5'],
    },
  },

  // EDUCATION WORKFLOWS
  teacher: {
    lessonPlanning: {
      name: 'AI Lesson Planning',
      description: 'Generate lesson plans, worksheets, and assessments aligned to standards',
      nodes: [
        { id: '1', position: { x: 0, y: 150 }, data: { label: 'Unit Topic', type: 'trigger', status: 'idle' as NodeStatus } },
        { id: '2', position: { x: 200, y: 100 }, data: { label: 'Standards DB', type: 'api', status: 'idle' as NodeStatus } },
        { id: '3', position: { x: 200, y: 200 }, data: { label: 'Larry - Research', type: 'agent', agentId: 'larry', status: 'idle' as NodeStatus } },
        { id: '4', position: { x: 400, y: 50 }, data: { label: 'Mary - Plan', type: 'agent', agentId: 'mary', status: 'idle' as NodeStatus } },
        { id: '5', position: { x: 400, y: 150 }, data: { label: 'Sam - Materials', type: 'agent', agentId: 'sam', status: 'idle' as NodeStatus } },
        { id: '6', position: { x: 400, y: 250 }, data: { label: 'Emma - Visuals', type: 'agent', agentId: 'emma', status: 'idle' as NodeStatus } },
        { id: '7', position: { x: 600, y: 100 }, data: { label: 'Google Slides', type: 'api', status: 'idle' as NodeStatus } },
        { id: '8', position: { x: 600, y: 200 }, data: { label: 'Alex - Quiz', type: 'agent', agentId: 'alex', status: 'idle' as NodeStatus } },
        { id: '9', position: { x: 800, y: 100 }, data: { label: 'Google Classroom', type: 'api', status: 'idle' as NodeStatus } },
        { id: '10', position: { x: 800, y: 200 }, data: { label: 'Canvas LMS', type: 'api', status: 'idle' as NodeStatus } },
        { id: '11', position: { x: 1000, y: 150 }, data: { label: 'Lesson Ready', type: 'output', status: 'idle' as NodeStatus } },
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e1-3', source: '1', target: '3' },
        { id: 'e2-4', source: '2', target: '4' },
        { id: 'e3-4', source: '3', target: '4' },
        { id: 'e3-5', source: '3', target: '5' },
        { id: 'e4-5', source: '4', target: '5' },
        { id: 'e4-6', source: '4', target: '6' },
        { id: 'e5-7', source: '5', target: '7' },
        { id: 'e6-7', source: '6', target: '7' },
        { id: 'e5-8', source: '5', target: '8' },
        { id: 'e7-9', source: '7', target: '9' },
        { id: '8-10', source: '8', target: '10' },
        { id: 'e9-11', source: '9', target: '11' },
        { id: 'e10-11', source: '10', target: '11' },
      ],
      errorEdges: ['e3-5', 'e7-9'],
    },
    gradingAssistant: {
      name: 'Grading & Feedback Automation',
      description: 'Auto-grade assignments and generate personalized feedback',
      nodes: [
        { id: '1', position: { x: 0, y: 150 }, data: { label: 'Submissions', type: 'trigger', status: 'idle' as NodeStatus } },
        { id: '2', position: { x: 200, y: 100 }, data: { label: 'LMS Extract', type: 'api', status: 'idle' as NodeStatus } },
        { id: '3', position: { x: 200, y: 200 }, data: { label: 'Larry - Grade', type: 'agent', agentId: 'larry', status: 'idle' as NodeStatus } },
        { id: '4', position: { x: 400, y: 100 }, data: { label: 'Rubric Check', type: 'api', status: 'idle' as NodeStatus } },
        { id: '5', position: { x: 400, y: 200 }, data: { label: 'Sam - Feedback', type: 'agent', agentId: 'sam', status: 'idle' as NodeStatus } },
        { id: '6', position: { x: 600, y: 100 }, data: { label: 'Plagiarism', type: 'api', status: 'idle' as NodeStatus } },
        { id: '7', position: { x: 600, y: 200 }, data: { label: 'Olivia - Review', type: 'agent', agentId: 'olivia', status: 'idle' as NodeStatus } },
        { id: '8', position: { x: 800, y: 150 }, data: { label: 'Grades Posted', type: 'output', status: 'idle' as NodeStatus } },
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e1-3', source: '1', target: '3' },
        { id: 'e2-4', source: '2', target: '4' },
        { id: 'e3-4', source: '3', target: '4' },
        { id: 'e3-5', source: '3', target: '5' },
        { id: 'e4-6', source: '4', target: '6' },
        { id: 'e5-7', source: '5', target: '7' },
        { id: 'e6-7', source: '6', target: '7' },
        { id: 'e7-8', source: '7', target: '8' },
      ],
      errorEdges: ['e4-6'],
    },
  },

  // DEVELOPER WORKFLOWS
  developer: {
    cicdPipeline: {
      name: 'CI/CD Pipeline Automation',
      description: 'Automated testing, code review, and deployment workflows',
      nodes: [
        { id: '1', position: { x: 0, y: 150 }, data: { label: 'Git Push', type: 'trigger', status: 'idle' as NodeStatus } },
        { id: '2', position: { x: 200, y: 50 }, data: { label: 'GitHub Actions', type: 'api', status: 'idle' as NodeStatus } },
        { id: '3', position: { x: 200, y: 250 }, data: { label: 'Larry - Tests', type: 'agent', agentId: 'larry', status: 'idle' as NodeStatus } },
        { id: '4', position: { x: 400, y: 50 }, data: { label: 'Lint/Format', type: 'api', status: 'idle' as NodeStatus } },
        { id: '5', position: { x: 400, y: 150 }, data: { label: 'Sam - Review', type: 'agent', agentId: 'sam', status: 'idle' as NodeStatus } },
        { id: '6', position: { x: 400, y: 250 }, data: { label: 'SonarQube', type: 'api', status: 'idle' as NodeStatus } },
        { id: '7', position: { x: 600, y: 100 }, data: { label: 'Alex - Architect', type: 'agent', agentId: 'alex', status: 'idle' as NodeStatus } },
        { id: '8', position: { x: 600, y: 200 }, data: { label: 'Docker Build', type: 'api', status: 'idle' as NodeStatus } },
        { id: '9', position: { x: 800, y: 50 }, data: { label: 'Staging Deploy', type: 'api', status: 'idle' as NodeStatus } },
        { id: '10', position: { x: 800, y: 150 }, data: { label: 'Olivia - QA', type: 'agent', agentId: 'olivia', status: 'idle' as NodeStatus } },
        { id: '11', position: { x: 800, y: 250 }, data: { label: 'E2E Tests', type: 'api', status: 'idle' as NodeStatus } },
        { id: '12', position: { x: 1000, y: 100 }, data: { label: 'Prod Deploy', type: 'api', status: 'idle' as NodeStatus } },
        { id: '13', position: { x: 1000, y: 200 }, data: { label: 'Slack Notify', type: 'api', status: 'idle' as NodeStatus } },
        { id: '14', position: { x: 1200, y: 150 }, data: { label: 'Deployed!', type: 'output', status: 'idle' as NodeStatus } },
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e1-3', source: '1', target: '3' },
        { id: 'e2-4', source: '2', target: '4' },
        { id: 'e2-5', source: '2', target: '5' },
        { id: 'e3-5', source: '3', target: '5' },
        { id: 'e3-6', source: '3', target: '6' },
        { id: 'e4-7', source: '4', target: '7' },
        { id: 'e5-7', source: '5', target: '7' },
        { id: 'e5-8', source: '5', target: '8' },
        { id: 'e6-8', source: '6', target: '8' },
        { id: 'e7-9', source: '7', target: '9' },
        { id: 'e7-10', source: '7', target: '10' },
        { id: 'e8-10', source: '8', target: '10' },
        { id: 'e8-11', source: '8', target: '11' },
        { id: 'e9-12', source: '9', target: '12' },
        { id: 'e10-12', source: '10', target: '12' },
        { id: 'e10-13', source: '10', target: '13' },
        { id: 'e11-13', source: '11', target: '13' },
        { id: 'e12-14', source: '12', target: '14' },
        { id: 'e13-14', source: '13', target: '14' },
      ],
      errorEdges: ['e3-6', 'e8-11'],
    },
    bugTriage: {
      name: 'Bug Triage & Resolution',
      description: 'Auto-classify bugs, assign priorities, and track resolution',
      nodes: [
        { id: '1', position: { x: 0, y: 150 }, data: { label: 'Bug Report', type: 'trigger', status: 'idle' as NodeStatus } },
        { id: '2', position: { x: 200, y: 100 }, data: { label: 'Jira/Linear', type: 'api', status: 'idle' as NodeStatus } },
        { id: '3', position: { x: 200, y: 200 }, data: { label: 'Larry - Analyze', type: 'agent', agentId: 'larry', status: 'idle' as NodeStatus } },
        { id: '4', position: { x: 400, y: 100 }, data: { label: 'Log Analysis', type: 'api', status: 'idle' as NodeStatus } },
        { id: '5', position: { x: 400, y: 200 }, data: { label: 'Mary - Triage', type: 'agent', agentId: 'mary', status: 'idle' as NodeStatus } },
        { id: '6', position: { x: 600, y: 100 }, data: { label: 'Sam - Fix', type: 'agent', agentId: 'sam', status: 'idle' as NodeStatus } },
        { id: '7', position: { x: 600, y: 200 }, data: { label: 'Olivia - Test', type: 'agent', agentId: 'olivia', status: 'idle' as NodeStatus } },
        { id: '8', position: { x: 800, y: 150 }, data: { label: 'Resolved', type: 'output', status: 'idle' as NodeStatus } },
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e1-3', source: '1', target: '3' },
        { id: 'e2-4', source: '2', target: '4' },
        { id: 'e3-5', source: '3', target: '5' },
        { id: 'e4-5', source: '4', target: '5' },
        { id: 'e5-6', source: '5', target: '6' },
        { id: 'e6-7', source: '6', target: '7' },
        { id: 'e7-8', source: '7', target: '8' },
      ],
      errorEdges: ['e4-5'],
    },
  },

  // CREATIVE WORKFLOWS
  designer: {
    designSystem: {
      name: 'Design System Automation',
      description: 'Auto-generate design tokens, components, and documentation',
      nodes: [
        { id: '1', position: { x: 0, y: 150 }, data: { label: 'Figma Update', type: 'trigger', status: 'idle' as NodeStatus } },
        { id: '2', position: { x: 200, y: 100 }, data: { label: 'Figma API', type: 'api', status: 'idle' as NodeStatus } },
        { id: '3', position: { x: 200, y: 200 }, data: { label: 'Larry - Extract', type: 'agent', agentId: 'larry', status: 'idle' as NodeStatus } },
        { id: '4', position: { x: 400, y: 100 }, data: { label: 'Emma - Tokens', type: 'agent', agentId: 'emma', status: 'idle' as NodeStatus } },
        { id: '5', position: { x: 400, y: 200 }, data: { label: 'Sam - Code', type: 'agent', agentId: 'sam', status: 'idle' as NodeStatus } },
        { id: '6', position: { x: 600, y: 100 }, data: { label: 'Storybook', type: 'api', status: 'idle' as NodeStatus } },
        { id: '7', position: { x: 600, y: 200 }, data: { label: 'Alex - Docs', type: 'agent', agentId: 'alex', status: 'idle' as NodeStatus } },
        { id: '8', position: { x: 800, y: 150 }, data: { label: 'Published', type: 'output', status: 'idle' as NodeStatus } },
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e1-3', source: '1', target: '3' },
        { id: 'e2-4', source: '2', target: '4' },
        { id: 'e3-4', source: '3', target: '4' },
        { id: 'e3-5', source: '3', target: '5' },
        { id: 'e4-6', source: '4', target: '6' },
        { id: 'e5-6', source: '5', target: '6' },
        { id: 'e5-7', source: '5', target: '7' },
        { id: 'e6-8', source: '6', target: '8' },
        { id: 'e7-8', source: '7', target: '8' },
      ],
      errorEdges: ['e3-5'],
    },
    assetPipeline: {
      name: 'Asset Production Pipeline',
      description: 'Automate image optimization, resizing, and delivery',
      nodes: [
        { id: '1', position: { x: 0, y: 150 }, data: { label: 'New Assets', type: 'trigger', status: 'idle' as NodeStatus } },
        { id: '2', position: { x: 200, y: 100 }, data: { label: 'Dropbox/Drive', type: 'api', status: 'idle' as NodeStatus } },
        { id: '3', position: { x: 200, y: 200 }, data: { label: 'Emma - Process', type: 'agent', agentId: 'emma', status: 'idle' as NodeStatus } },
        { id: '4', position: { x: 400, y: 100 }, data: { label: 'ImageOptim', type: 'api', status: 'idle' as NodeStatus } },
        { id: '5', position: { x: 400, y: 200 }, data: { label: 'Cloudinary', type: 'api', status: 'idle' as NodeStatus } },
        { id: '6', position: { x: 600, y: 150 }, data: { label: 'CDN Deploy', type: 'api', status: 'idle' as NodeStatus } },
        { id: '7', position: { x: 800, y: 150 }, data: { label: 'Assets Live', type: 'output', status: 'idle' as NodeStatus } },
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e1-3', source: '1', target: '3' },
        { id: 'e2-4', source: '2', target: '4' },
        { id: 'e3-4', source: '3', target: '4' },
        { id: 'e3-5', source: '3', target: '5' },
        { id: 'e4-6', source: '4', target: '6' },
        { id: 'e5-6', source: '5', target: '6' },
        { id: 'e6-7', source: '6', target: '7' },
      ],
      errorEdges: ['e3-5'],
    },
  },

  // SALES WORKFLOWS
  sales: {
    leadScoring: {
      name: 'AI Lead Scoring Pipeline',
      description: 'Score and prioritize leads based on engagement and fit',
      nodes: [
        { id: '1', position: { x: 0, y: 150 }, data: { label: 'New Lead', type: 'trigger', status: 'idle' as NodeStatus } },
        { id: '2', position: { x: 200, y: 50 }, data: { label: 'Salesforce', type: 'api', status: 'idle' as NodeStatus } },
        { id: '3', position: { x: 200, y: 250 }, data: { label: 'Clearbit', type: 'api', status: 'idle' as NodeStatus } },
        { id: '4', position: { x: 400, y: 50 }, data: { label: 'Larry - Enrich', type: 'agent', agentId: 'larry', status: 'idle' as NodeStatus } },
        { id: '5', position: { x: 400, y: 150 }, data: { label: 'Mary - Score', type: 'agent', agentId: 'mary', status: 'idle' as NodeStatus } },
        { id: '6', position: { x: 400, y: 250 }, data: { label: 'Website Track', type: 'api', status: 'idle' as NodeStatus } },
        { id: '7', position: { x: 600, y: 100 }, data: { label: 'Sam - Segment', type: 'agent', agentId: 'sam', status: 'idle' as NodeStatus } },
        { id: '8', position: { x: 600, y: 200 }, data: { label: 'Alex - Route', type: 'agent', agentId: 'alex', status: 'idle' as NodeStatus } },
        { id: '9', position: { x: 800, y: 100 }, data: { label: 'HubSpot', type: 'api', status: 'idle' as NodeStatus } },
        { id: '10', position: { x: 800, y: 200 }, data: { label: 'Slack Alert', type: 'api', status: 'idle' as NodeStatus } },
        { id: '11', position: { x: 1000, y: 150 }, data: { label: 'Assigned', type: 'output', status: 'idle' as NodeStatus } },
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e1-3', source: '1', target: '3' },
        { id: 'e2-4', source: '2', target: '4' },
        { id: 'e2-5', source: '2', target: '5' },
        { id: 'e3-5', source: '3', target: '5' },
        { id: 'e3-6', source: '3', target: '6' },
        { id: 'e4-7', source: '4', target: '7' },
        { id: 'e5-7', source: '5', target: '7' },
        { id: 'e5-8', source: '5', target: '8' },
        { id: 'e6-8', source: '6', target: '8' },
        { id: 'e7-9', source: '7', target: '9' },
        { id: 'e8-10', source: '8', target: '10' },
        { id: 'e9-11', source: '9', target: '11' },
        { id: 'e10-11', source: '10', target: '11' },
      ],
      errorEdges: ['e3-5', 'e7-9'],
    },
    proposalGeneration: {
      name: 'Proposal Generation Pipeline',
      description: 'Auto-generate proposals from templates and CRM data',
      nodes: [
        { id: '1', position: { x: 0, y: 150 }, data: { label: 'Deal Stage', type: 'trigger', status: 'idle' as NodeStatus } },
        { id: '2', position: { x: 200, y: 100 }, data: { label: 'CRM Data', type: 'api', status: 'idle' as NodeStatus } },
        { id: '3', position: { x: 200, y: 200 }, data: { label: 'Larry - Brief', type: 'agent', agentId: 'larry', status: 'idle' as NodeStatus } },
        { id: '4', position: { x: 400, y: 100 }, data: { label: 'Mary - Pricing', type: 'agent', agentId: 'mary', status: 'idle' as NodeStatus } },
        { id: '5', position: { x: 400, y: 200 }, data: { label: 'Sam - Content', type: 'agent', agentId: 'sam', status: 'idle' as NodeStatus } },
        { id: '6', position: { x: 600, y: 100 }, data: { label: 'Emma - Design', type: 'agent', agentId: 'emma', status: 'idle' as NodeStatus } },
        { id: '7', position: { x: 600, y: 200 }, data: { label: 'PandaDoc', type: 'api', status: 'idle' as NodeStatus } },
        { id: '8', position: { x: 800, y: 150 }, data: { label: 'Sent', type: 'output', status: 'idle' as NodeStatus } },
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e1-3', source: '1', target: '3' },
        { id: 'e2-4', source: '2', target: '4' },
        { id: 'e3-4', source: '3', target: '4' },
        { id: 'e3-5', source: '3', target: '5' },
        { id: 'e4-6', source: '4', target: '6' },
        { id: 'e5-6', source: '5', target: '6' },
        { id: 'e5-7', source: '5', target: '7' },
        { id: 'e6-7', source: '6', target: '7' },
        { id: 'e7-8', source: '7', target: '8' },
      ],
      errorEdges: ['e5-7'],
    },
  },

  // MARKETING WORKFLOWS
  marketer: {
    campaignLaunch: {
      name: 'Campaign Launch Automation',
      description: 'Coordinate multi-channel campaign launches automatically',
      nodes: [
        { id: '1', position: { x: 0, y: 150 }, data: { label: 'Campaign Brief', type: 'trigger', status: 'idle' as NodeStatus } },
        { id: '2', position: { x: 200, y: 100 }, data: { label: 'Mary - Strategy', type: 'agent', agentId: 'mary', status: 'idle' as NodeStatus } },
        { id: '3', position: { x: 200, y: 200 }, data: { label: 'Airtable', type: 'api', status: 'idle' as NodeStatus } },
        { id: '4', position: { x: 400, y: 50 }, data: { label: 'Sam - Copy', type: 'agent', agentId: 'sam', status: 'idle' as NodeStatus } },
        { id: '5', position: { x: 400, y: 150 }, data: { label: 'Emma - Creative', type: 'agent', agentId: 'emma', status: 'idle' as NodeStatus } },
        { id: '6', position: { x: 400, y: 250 }, data: { label: 'Alex - Ads', type: 'agent', agentId: 'alex', status: 'idle' as NodeStatus } },
        { id: '7', position: { x: 600, y: 50 }, data: { label: 'Mailchimp', type: 'api', status: 'idle' as NodeStatus } },
        { id: '8', position: { x: 600, y: 150 }, data: { label: 'Meta Ads', type: 'api', status: 'idle' as NodeStatus } },
        { id: '9', position: { x: 600, y: 250 }, data: { label: 'Google Ads', type: 'api', status: 'idle' as NodeStatus } },
        { id: '10', position: { x: 800, y: 100 }, data: { label: 'Larry - Track', type: 'agent', agentId: 'larry', status: 'idle' as NodeStatus } },
        { id: '11', position: { x: 800, y: 200 }, data: { label: 'Analytics', type: 'api', status: 'idle' as NodeStatus } },
        { id: '12', position: { x: 1000, y: 150 }, data: { label: 'Live!', type: 'output', status: 'idle' as NodeStatus } },
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e1-3', source: '1', target: '3' },
        { id: 'e2-4', source: '2', target: '4' },
        { id: 'e2-5', source: '2', target: '5' },
        { id: 'e3-5', source: '3', target: '5' },
        { id: 'e3-6', source: '3', target: '6' },
        { id: 'e4-7', source: '4', target: '7' },
        { id: 'e5-7', source: '5', target: '7' },
        { id: 'e5-8', source: '5', target: '8' },
        { id: 'e6-8', source: '6', target: '8' },
        { id: 'e6-9', source: '6', target: '9' },
        { id: 'e7-10', source: '7', target: '10' },
        { id: 'e8-10', source: '8', target: '10' },
        { id: 'e9-11', source: '9', target: '11' },
        { id: 'e10-12', source: '10', target: '12' },
        { id: 'e11-12', source: '11', target: '12' },
      ],
      errorEdges: ['e5-8', 'e6-9'],
    },
    contentCalendar: {
      name: 'Content Calendar Automation',
      description: 'Auto-schedule and publish content across platforms',
      nodes: [
        { id: '1', position: { x: 0, y: 150 }, data: { label: 'Content Queue', type: 'trigger', status: 'idle' as NodeStatus } },
        { id: '2', position: { x: 200, y: 100 }, data: { label: 'Notion DB', type: 'api', status: 'idle' as NodeStatus } },
        { id: '3', position: { x: 200, y: 200 }, data: { label: 'Sam - Write', type: 'agent', agentId: 'sam', status: 'idle' as NodeStatus } },
        { id: '4', position: { x: 400, y: 100 }, data: { label: 'Emma - Visual', type: 'agent', agentId: 'emma', status: 'idle' as NodeStatus } },
        { id: '5', position: { x: 400, y: 200 }, data: { label: 'Buffer', type: 'api', status: 'idle' as NodeStatus } },
        { id: '6', position: { x: 600, y: 100 }, data: { label: 'Twitter/X', type: 'api', status: 'idle' as NodeStatus } },
        { id: '7', position: { x: 600, y: 200 }, data: { label: 'LinkedIn', type: 'api', status: 'idle' as NodeStatus } },
        { id: '8', position: { x: 800, y: 150 }, data: { label: 'Posted!', type: 'output', status: 'idle' as NodeStatus } },
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e1-3', source: '1', target: '3' },
        { id: 'e2-4', source: '2', target: '4' },
        { id: 'e3-4', source: '3', target: '4' },
        { id: 'e3-5', source: '3', target: '5' },
        { id: 'e4-5', source: '4', target: '5' },
        { id: 'e5-6', source: '5', target: '6' },
        { id: 'e5-7', source: '5', target: '7' },
        { id: 'e6-8', source: '6', target: '8' },
        { id: 'e7-8', source: '7', target: '8' },
      ],
      errorEdges: ['e5-6'],
    },
  },

  // RECRUITER WORKFLOWS
  recruiter: {
    candidatePipeline: {
      name: 'Candidate Pipeline Automation',
      description: 'Screen resumes, schedule interviews, and track candidates',
      nodes: [
        { id: '1', position: { x: 0, y: 150 }, data: { label: 'New Application', type: 'trigger', status: 'idle' as NodeStatus } },
        { id: '2', position: { x: 200, y: 100 }, data: { label: 'Greenhouse', type: 'api', status: 'idle' as NodeStatus } },
        { id: '3', position: { x: 200, y: 200 }, data: { label: 'Larry - Screen', type: 'agent', agentId: 'larry', status: 'idle' as NodeStatus } },
        { id: '4', position: { x: 400, y: 100 }, data: { label: 'LinkedIn', type: 'api', status: 'idle' as NodeStatus } },
        { id: '5', position: { x: 400, y: 200 }, data: { label: 'Mary - Match', type: 'agent', agentId: 'mary', status: 'idle' as NodeStatus } },
        { id: '6', position: { x: 600, y: 100 }, data: { label: 'Sam - Outreach', type: 'agent', agentId: 'sam', status: 'idle' as NodeStatus } },
        { id: '7', position: { x: 600, y: 200 }, data: { label: 'Calendly', type: 'api', status: 'idle' as NodeStatus } },
        { id: '8', position: { x: 800, y: 100 }, data: { label: 'Zoom', type: 'api', status: 'idle' as NodeStatus } },
        { id: '9', position: { x: 800, y: 200 }, data: { label: 'Olivia - Debrief', type: 'agent', agentId: 'olivia', status: 'idle' as NodeStatus } },
        { id: '10', position: { x: 1000, y: 150 }, data: { label: 'Hired!', type: 'output', status: 'idle' as NodeStatus } },
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e1-3', source: '1', target: '3' },
        { id: 'e2-4', source: '2', target: '4' },
        { id: 'e3-5', source: '3', target: '5' },
        { id: 'e4-5', source: '4', target: '5' },
        { id: 'e5-6', source: '5', target: '6' },
        { id: 'e5-7', source: '5', target: '7' },
        { id: 'e6-8', source: '6', target: '8' },
        { id: 'e7-8', source: '7', target: '8' },
        { id: 'e8-9', source: '8', target: '9' },
        { id: 'e9-10', source: '9', target: '10' },
      ],
      errorEdges: ['e4-5', 'e6-8'],
    },
    interviewFeedback: {
      name: 'Interview Feedback Loop',
      description: 'Collect, summarize, and route interview feedback',
      nodes: [
        { id: '1', position: { x: 0, y: 150 }, data: { label: 'Interview Done', type: 'trigger', status: 'idle' as NodeStatus } },
        { id: '2', position: { x: 200, y: 100 }, data: { label: 'Google Forms', type: 'api', status: 'idle' as NodeStatus } },
        { id: '3', position: { x: 200, y: 200 }, data: { label: 'Larry - Collect', type: 'agent', agentId: 'larry', status: 'idle' as NodeStatus } },
        { id: '4', position: { x: 400, y: 150 }, data: { label: 'Sam - Summary', type: 'agent', agentId: 'sam', status: 'idle' as NodeStatus } },
        { id: '5', position: { x: 600, y: 100 }, data: { label: 'ATS Update', type: 'api', status: 'idle' as NodeStatus } },
        { id: '6', position: { x: 600, y: 200 }, data: { label: 'Slack Notify', type: 'api', status: 'idle' as NodeStatus } },
        { id: '7', position: { x: 800, y: 150 }, data: { label: 'Decision', type: 'output', status: 'idle' as NodeStatus } },
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e1-3', source: '1', target: '3' },
        { id: 'e2-4', source: '2', target: '4' },
        { id: 'e3-4', source: '3', target: '4' },
        { id: 'e4-5', source: '4', target: '5' },
        { id: 'e4-6', source: '4', target: '6' },
        { id: 'e5-7', source: '5', target: '7' },
        { id: 'e6-7', source: '6', target: '7' },
      ],
      errorEdges: ['e2-4'],
    },
  },

  // E-COMMERCE WORKFLOWS
  ecommerce: {
    orderFulfillment: {
      name: 'Order Fulfillment Pipeline',
      description: 'Automate order processing, inventory, and shipping',
      nodes: [
        { id: '1', position: { x: 0, y: 150 }, data: { label: 'New Order', type: 'trigger', status: 'idle' as NodeStatus } },
        { id: '2', position: { x: 200, y: 100 }, data: { label: 'Shopify', type: 'api', status: 'idle' as NodeStatus } },
        { id: '3', position: { x: 200, y: 200 }, data: { label: 'Larry - Validate', type: 'agent', agentId: 'larry', status: 'idle' as NodeStatus } },
        { id: '4', position: { x: 400, y: 100 }, data: { label: 'Inventory', type: 'api', status: 'idle' as NodeStatus } },
        { id: '5', position: { x: 400, y: 200 }, data: { label: 'Mary - Pick', type: 'agent', agentId: 'mary', status: 'idle' as NodeStatus } },
        { id: '6', position: { x: 600, y: 100 }, data: { label: 'ShipStation', type: 'api', status: 'idle' as NodeStatus } },
        { id: '7', position: { x: 600, y: 200 }, data: { label: 'Sam - Track', type: 'agent', agentId: 'sam', status: 'idle' as NodeStatus } },
        { id: '8', position: { x: 800, y: 100 }, data: { label: 'Email Notify', type: 'api', status: 'idle' as NodeStatus } },
        { id: '9', position: { x: 800, y: 200 }, data: { label: 'SMS Notify', type: 'api', status: 'idle' as NodeStatus } },
        { id: '10', position: { x: 1000, y: 150 }, data: { label: 'Delivered!', type: 'output', status: 'idle' as NodeStatus } },
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e1-3', source: '1', target: '3' },
        { id: 'e2-4', source: '2', target: '4' },
        { id: 'e3-5', source: '3', target: '5' },
        { id: 'e4-5', source: '4', target: '5' },
        { id: 'e5-6', source: '5', target: '6' },
        { id: 'e5-7', source: '5', target: '7' },
        { id: 'e6-8', source: '6', target: '8' },
        { id: 'e7-9', source: '7', target: '9' },
        { id: 'e8-10', source: '8', target: '10' },
        { id: 'e9-10', source: '9', target: '10' },
      ],
      errorEdges: ['e4-5', 'e5-6'],
    },
    customerSupport: {
      name: 'Customer Support Automation',
      description: 'AI-powered ticket triage and response generation',
      nodes: [
        { id: '1', position: { x: 0, y: 150 }, data: { label: 'Support Ticket', type: 'trigger', status: 'idle' as NodeStatus } },
        { id: '2', position: { x: 200, y: 100 }, data: { label: 'Zendesk', type: 'api', status: 'idle' as NodeStatus } },
        { id: '3', position: { x: 200, y: 200 }, data: { label: 'Larry - Classify', type: 'agent', agentId: 'larry', status: 'idle' as NodeStatus } },
        { id: '4', position: { x: 400, y: 100 }, data: { label: 'Order Lookup', type: 'api', status: 'idle' as NodeStatus } },
        { id: '5', position: { x: 400, y: 200 }, data: { label: 'Sam - Draft', type: 'agent', agentId: 'sam', status: 'idle' as NodeStatus } },
        { id: '6', position: { x: 600, y: 150 }, data: { label: 'Olivia - Review', type: 'agent', agentId: 'olivia', status: 'idle' as NodeStatus } },
        { id: '7', position: { x: 800, y: 150 }, data: { label: 'Resolved', type: 'output', status: 'idle' as NodeStatus } },
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e1-3', source: '1', target: '3' },
        { id: 'e2-4', source: '2', target: '4' },
        { id: 'e3-5', source: '3', target: '5' },
        { id: 'e4-5', source: '4', target: '5' },
        { id: 'e5-6', source: '5', target: '6' },
        { id: 'e6-7', source: '6', target: '7' },
      ],
      errorEdges: ['e4-5'],
    },
  },
}

// Default workflows for personas without specific workflows
const DEFAULT_WORKFLOWS = {
  salesPipeline: {
    name: 'Sales Pipeline Automation',
    description: 'Lead qualification, CRM sync, and personalized outreach',
    nodes: [
      { id: '1', position: { x: 0, y: 150 }, data: { label: 'New Lead', type: 'trigger', status: 'idle' as NodeStatus } },
      { id: '2', position: { x: 200, y: 50 }, data: { label: 'HubSpot CRM', type: 'api', status: 'idle' as NodeStatus } },
      { id: '3', position: { x: 200, y: 250 }, data: { label: 'Clearbit Enrich', type: 'api', status: 'idle' as NodeStatus } },
      { id: '4', position: { x: 400, y: 50 }, data: { label: 'Larry - Analyst', type: 'agent', agentId: 'larry', status: 'idle' as NodeStatus } },
      { id: '5', position: { x: 400, y: 150 }, data: { label: 'Mary - PM', type: 'agent', agentId: 'mary', status: 'idle' as NodeStatus } },
      { id: '6', position: { x: 400, y: 250 }, data: { label: 'LinkedIn API', type: 'api', status: 'idle' as NodeStatus } },
      { id: '7', position: { x: 600, y: 100 }, data: { label: 'Sam - Developer', type: 'agent', agentId: 'sam', status: 'idle' as NodeStatus } },
      { id: '8', position: { x: 600, y: 200 }, data: { label: 'Alex - Architect', type: 'agent', agentId: 'alex', status: 'idle' as NodeStatus } },
      { id: '9', position: { x: 800, y: 50 }, data: { label: 'Salesforce', type: 'api', status: 'idle' as NodeStatus } },
      { id: '10', position: { x: 800, y: 150 }, data: { label: 'Emma - Designer', type: 'agent', agentId: 'emma', status: 'idle' as NodeStatus } },
      { id: '11', position: { x: 800, y: 250 }, data: { label: 'Calendly', type: 'api', status: 'idle' as NodeStatus } },
      { id: '12', position: { x: 1000, y: 100 }, data: { label: 'SendGrid', type: 'api', status: 'idle' as NodeStatus } },
      { id: '13', position: { x: 1000, y: 200 }, data: { label: 'Olivia - QA', type: 'agent', agentId: 'olivia', status: 'idle' as NodeStatus } },
      { id: '14', position: { x: 1200, y: 150 }, data: { label: 'Complete', type: 'output', status: 'idle' as NodeStatus } },
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2' },
      { id: 'e1-3', source: '1', target: '3' },
      { id: 'e2-4', source: '2', target: '4' },
      { id: 'e2-5', source: '2', target: '5' },
      { id: 'e3-5', source: '3', target: '5' },
      { id: 'e3-6', source: '3', target: '6' },
      { id: 'e4-7', source: '4', target: '7' },
      { id: 'e5-7', source: '5', target: '7' },
      { id: 'e5-8', source: '5', target: '8' },
      { id: 'e6-8', source: '6', target: '8' },
      { id: 'e7-9', source: '7', target: '9' },
      { id: 'e7-10', source: '7', target: '10' },
      { id: 'e8-10', source: '8', target: '10' },
      { id: 'e8-11', source: '8', target: '11' },
      { id: 'e9-12', source: '9', target: '12' },
      { id: 'e10-12', source: '10', target: '12' },
      { id: 'e10-13', source: '10', target: '13' },
      { id: 'e11-13', source: '11', target: '13' },
      { id: 'e12-14', source: '12', target: '14' },
      { id: 'e13-14', source: '13', target: '14' },
    ],
    errorEdges: ['e4-7', 'e8-10'],
  },
  contentPipeline: {
    name: 'Content Production Pipeline',
    description: 'AI-powered content creation with multi-stage review',
    nodes: [
      { id: '1', position: { x: 0, y: 150 }, data: { label: 'Content Brief', type: 'trigger', status: 'idle' as NodeStatus } },
      { id: '2', position: { x: 200, y: 100 }, data: { label: 'Mary - Strategy', type: 'agent', agentId: 'mary', status: 'idle' as NodeStatus } },
      { id: '3', position: { x: 200, y: 200 }, data: { label: 'SEMrush', type: 'api', status: 'idle' as NodeStatus } },
      { id: '4', position: { x: 400, y: 50 }, data: { label: 'Larry - Research', type: 'agent', agentId: 'larry', status: 'idle' as NodeStatus } },
      { id: '5', position: { x: 400, y: 150 }, data: { label: 'Sam - Writer', type: 'agent', agentId: 'sam', status: 'idle' as NodeStatus } },
      { id: '6', position: { x: 400, y: 250 }, data: { label: 'Emma - Graphics', type: 'agent', agentId: 'emma', status: 'idle' as NodeStatus } },
      { id: '7', position: { x: 600, y: 100 }, data: { label: 'Olivia - Review', type: 'agent', agentId: 'olivia', status: 'idle' as NodeStatus } },
      { id: '8', position: { x: 600, y: 200 }, data: { label: 'Grammarly', type: 'api', status: 'idle' as NodeStatus } },
      { id: '9', position: { x: 800, y: 50 }, data: { label: 'WordPress', type: 'api', status: 'idle' as NodeStatus } },
      { id: '10', position: { x: 800, y: 150 }, data: { label: 'Buffer', type: 'api', status: 'idle' as NodeStatus } },
      { id: '11', position: { x: 800, y: 250 }, data: { label: 'Mailchimp', type: 'api', status: 'idle' as NodeStatus } },
      { id: '12', position: { x: 1000, y: 150 }, data: { label: 'Published', type: 'output', status: 'idle' as NodeStatus } },
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2' },
      { id: 'e1-3', source: '1', target: '3' },
      { id: 'e2-4', source: '2', target: '4' },
      { id: 'e2-5', source: '2', target: '5' },
      { id: 'e3-5', source: '3', target: '5' },
      { id: 'e3-6', source: '3', target: '6' },
      { id: 'e4-7', source: '4', target: '7' },
      { id: 'e5-7', source: '5', target: '7' },
      { id: 'e6-7', source: '6', target: '7' },
      { id: 'e7-8', source: '7', target: '8' },
      { id: 'e8-9', source: '8', target: '9' },
      { id: 'e8-10', source: '8', target: '10' },
      { id: 'e8-11', source: '8', target: '11' },
      { id: 'e9-12', source: '9', target: '12' },
      { id: 'e10-12', source: '10', target: '12' },
      { id: 'e11-12', source: '11', target: '12' },
    ],
    errorEdges: ['e5-7', 'e8-10'],
  },
}

// Get workflows for a specific persona
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getWorkflowsForPersona(persona: PersonaType): Record<string, any> {
  // Check if persona has specific workflows
  if (PERSONA_WORKFLOWS[persona]) {
    return PERSONA_WORKFLOWS[persona]
  }

  // Map similar personas to existing workflows
  const personaMapping: Record<string, string> = {
    therapist: 'nurse',
    paralegal: 'lawyer',
    financial_advisor: 'accountant',
    banker: 'accountant',
    property_manager: 'realtor',
    professor: 'teacher',
    consultant: 'sales',
    photographer: 'designer',
    writer: 'marketer',
    engineer: 'developer',
    scientist: 'developer',
    chef: 'ecommerce',
    fitness: 'sales',
    founder: 'sales',
    executive: 'sales',
    manager: 'sales',
    freelancer: 'marketer',
    creator: 'marketer',
    student: 'teacher',
    custom: 'general',
    general: 'general',
  }

  const mappedPersona = personaMapping[persona]
  if (mappedPersona && PERSONA_WORKFLOWS[mappedPersona]) {
    return PERSONA_WORKFLOWS[mappedPersona]
  }

  // Return default workflows
  return DEFAULT_WORKFLOWS
}

// Error messages for simulation
const ERROR_MESSAGES = [
  'API rate limit exceeded',
  'Authentication token expired',
  'Data validation failed',
  'Connection timeout',
  'Schema mismatch detected',
  'Quota limit reached',
]

// Agent assignments for fixing errors
const FIXER_AGENTS = ['larry', 'sam', 'alex', 'olivia']

// Custom animated edge with VISIBLE line drawing effect
function AnimatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  // Safely extract edge data with defaults
  const edgeData = (data || {}) as EdgeData
  const status = edgeData.status || 'idle'
  const progress = edgeData.progress || 0
  const errorMessage = edgeData.errorMessage
  const fixingAgentId = edgeData.fixingAgentId

  // Calculate the actual path length for proper animation
  const pathLength = Math.sqrt(
    Math.pow(targetX - sourceX, 2) + Math.pow(targetY - sourceY, 2)
  ) * 1.5 // Bezier curves are longer than straight lines

  // Calculate point on bezier curve for positioning elements
  const getPointOnCurve = (t: number) => {
    // Simple linear interpolation for approximate position
    const x = sourceX + t * (targetX - sourceX)
    const y = sourceY + t * (targetY - sourceY)
    return { x, y }
  }

  // Position for the drawing head (moving dot at the front of the line)
  const drawingHeadPos = getPointOnCurve(progress / 100)

  // Position for error popup and fixing agent (middle of the line)
  const middlePos = { x: labelX, y: labelY }

  // Get stroke color based on status
  const getStrokeColor = () => {
    switch (status) {
      case 'drawing':
        return '#fbbf24' // Bright yellow while drawing
      case 'active':
        return '#f59e0b' // Amber when active
      case 'error':
        return '#ef4444' // Red for error
      case 'fixing':
        return '#f97316' // Orange while fixing
      case 'success':
        return '#10b981' // Green when complete
      default:
        return '#475569' // Slate gray when idle
    }
  }

  const strokeColor = getStrokeColor()
  const isPulsing = status === 'error' || status === 'fixing'
  const isDrawing = status === 'drawing'
  const isSuccess = status === 'success'

  // Calculate dash offset for drawing animation (line extends from source to target)
  const dashOffset = isDrawing ? pathLength * (1 - progress / 100) : 0

  return (
    <>
      {/* Glow effect for active states */}
      {(isDrawing || isPulsing || isSuccess) && (
        <path
          d={edgePath}
          fill="none"
          stroke={strokeColor}
          strokeWidth={8}
          strokeOpacity={0.3}
          strokeDasharray={isDrawing ? pathLength : undefined}
          strokeDashoffset={dashOffset}
          style={{
            filter: `blur(4px)`,
            transition: isDrawing ? 'none' : 'all 0.3s ease',
          }}
        />
      )}

      {/* Background path - shows the full route in dim color */}
      <path
        id={`${id}-bg`}
        d={edgePath}
        fill="none"
        stroke="#1e293b"
        strokeWidth={3}
        strokeLinecap="round"
      />

      {/* Main animated line that EXTENDS from source to target */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={isDrawing ? 4 : isPulsing ? 4 : isSuccess ? 3 : 2}
        strokeLinecap="round"
        strokeDasharray={isDrawing ? pathLength : undefined}
        strokeDashoffset={dashOffset}
        style={{
          filter: isPulsing ? `drop-shadow(0 0 8px ${strokeColor}) drop-shadow(0 0 16px ${strokeColor})` :
                 isDrawing ? `drop-shadow(0 0 6px ${strokeColor})` : 'none',
          transition: isDrawing ? 'none' : 'all 0.3s ease',
        }}
      />

      {/* Pulsing overlay for error/fixing states */}
      {isPulsing && (
        <path
          d={edgePath}
          fill="none"
          stroke={strokeColor}
          strokeWidth={6}
          strokeLinecap="round"
          strokeOpacity={0.5}
          style={{
            animation: 'pulse 1s ease-in-out infinite',
          }}
        />
      )}

      {/* Moving dot at the HEAD of the drawing line */}
      {isDrawing && progress > 0 && progress < 100 && (
        <g>
          {/* Outer glow */}
          <circle
            cx={drawingHeadPos.x}
            cy={drawingHeadPos.y}
            r={12}
            fill={strokeColor}
            opacity={0.3}
            style={{ filter: 'blur(4px)' }}
          />
          {/* Inner bright dot */}
          <circle
            cx={drawingHeadPos.x}
            cy={drawingHeadPos.y}
            r={6}
            fill={strokeColor}
            style={{ filter: `drop-shadow(0 0 4px ${strokeColor})` }}
          />
          {/* Center white dot */}
          <circle
            cx={drawingHeadPos.x}
            cy={drawingHeadPos.y}
            r={3}
            fill="white"
          />
        </g>
      )}

      {/* Arrow at the end - shows when line reaches destination */}
      {(progress >= 95 || isSuccess) && (
        <>
          <defs>
            <marker
              id={`arrow-${id}`}
              viewBox="0 0 12 12"
              refX="6"
              refY="6"
              markerWidth="8"
              markerHeight="8"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 12 6 L 0 12 L 3 6 Z" fill={strokeColor} />
            </marker>
          </defs>
          <path
            d={edgePath}
            fill="none"
            stroke="transparent"
            strokeWidth={1}
            markerEnd={`url(#arrow-${id})`}
          />
        </>
      )}

      {/* ERROR POPUP - appears when error is detected */}
      {(status === 'error' || status === 'fixing') && errorMessage && (
        <g transform={`translate(${middlePos.x - 90}, ${middlePos.y - 70})`}>
          {/* Popup shadow */}
          <rect
            x="2"
            y="2"
            width="180"
            height="50"
            rx="10"
            fill="black"
            opacity={0.3}
          />
          {/* Popup background */}
          <rect
            x="0"
            y="0"
            width="180"
            height="50"
            rx="10"
            fill="#18181b"
            stroke={status === 'fixing' ? '#f97316' : '#ef4444'}
            strokeWidth="2"
          />
          {/* Pulsing border for fixing state */}
          {status === 'fixing' && (
            <rect
              x="0"
              y="0"
              width="180"
              height="50"
              rx="10"
              fill="none"
              stroke="#f97316"
              strokeWidth="3"
              opacity={0.6}
              style={{ animation: 'pulse 1s ease-in-out infinite' }}
            />
          )}
          {/* Status icon */}
          <circle
            cx="20"
            cy="25"
            r="10"
            fill={status === 'fixing' ? '#f97316' : '#ef4444'}
          />
          <text
            x="20"
            y="30"
            textAnchor="middle"
            fill="white"
            fontSize="14"
            fontWeight="bold"
          >
            {status === 'fixing' ? '!' : '!'}
          </text>
          {/* Text */}
          <text x="40" y="20" fill="white" fontSize="11" fontWeight="bold">
            {status === 'fixing' ? 'FIXING ISSUE...' : 'ERROR DETECTED'}
          </text>
          <text x="40" y="38" fill="#fbbf24" fontSize="10">
            {errorMessage}
          </text>
        </g>
      )}

      {/* FIXING AGENT AVATAR - appears ON THE LINE while fixing */}
      {status === 'fixing' && fixingAgentId && (
        <g transform={`translate(${middlePos.x - 28}, ${middlePos.y - 28})`}>
          {/* Glowing ring around avatar */}
          <circle
            cx="28"
            cy="28"
            r="32"
            fill="none"
            stroke="#f97316"
            strokeWidth="3"
            opacity={0.6}
            style={{ animation: 'pulse 1s ease-in-out infinite' }}
          />
          <circle
            cx="28"
            cy="28"
            r="36"
            fill="none"
            stroke="#f97316"
            strokeWidth="2"
            opacity={0.3}
            style={{ animation: 'pulse 1.5s ease-in-out infinite' }}
          />
          {/* Avatar container */}
          <foreignObject x="0" y="0" width="56" height="56">
            <div className="flex items-center justify-center w-full h-full">
              <div className="rounded-full border-2 border-orange-500 shadow-lg shadow-orange-500/50">
                <ProfessionalAvatar
                  agentId={fixingAgentId}
                  size={52}
                  isActive={true}
                />
              </div>
            </div>
          </foreignObject>
          {/* "Working" label under avatar */}
          <text
            x="28"
            y="70"
            textAnchor="middle"
            fill="#f97316"
            fontSize="10"
            fontWeight="bold"
          >
            WORKING...
          </text>
        </g>
      )}

      {/* SUCCESS CHECKMARK - appears when line is complete and was fixed */}
      {status === 'success' && (
        <g transform={`translate(${middlePos.x - 16}, ${middlePos.y - 16})`}>
          {/* Glow effect */}
          <circle
            cx="16"
            cy="16"
            r="20"
            fill="#10b981"
            opacity={0.3}
            style={{ filter: 'blur(4px)' }}
          />
          {/* Main circle */}
          <circle
            cx="16"
            cy="16"
            r="16"
            fill="#10b981"
            style={{ filter: 'drop-shadow(0 0 6px #10b981)' }}
          />
          {/* Checkmark */}
          <path
            d="M8 16 L14 22 L24 10"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}

      {/* CSS Animation styles */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
          }
        `}
      </style>
    </>
  )
}

// Custom node component with handles for edge connections
function CustomNode({ data }: { data: WorkflowNodeData }) {
  const getNodeStyle = () => {
    const baseStyle = 'px-4 py-3 md:px-4 md:py-3 rounded-xl border-2 min-w-[160px] md:min-w-[160px] min-h-[56px] md:min-h-0 transition-all duration-300 touch-manipulation'

    if (data.status === 'running') {
      return `${baseStyle} bg-amber-900/50 border-amber-500 shadow-lg shadow-amber-500/30 animate-pulse`
    }
    if (data.status === 'success') {
      return `${baseStyle} bg-emerald-900/50 border-emerald-500 shadow-lg shadow-emerald-500/30`
    }
    if (data.status === 'error' || data.status === 'fixing') {
      return `${baseStyle} bg-orange-900/50 border-orange-500 shadow-lg shadow-orange-500/30 animate-pulse`
    }

    // Idle state styling based on node type
    switch (data.type) {
      case 'trigger':
        return `${baseStyle} bg-violet-900/50 border-violet-500`
      case 'agent':
        return `${baseStyle} bg-slate-800 border-cyan-500`
      case 'api':
        return `${baseStyle} bg-slate-800 border-blue-500`
      case 'output':
        // Idle output: muted green border on slate (NOT full green like success)
        return `${baseStyle} bg-slate-800 border-emerald-500/60`
      default:
        return `${baseStyle} bg-slate-800 border-slate-600`
    }
  }

  const getStatusText = () => {
    switch (data.status) {
      case 'running':
        return <div className="text-xs text-amber-400">Processing...</div>
      case 'success':
        return <div className="text-xs text-emerald-400">Complete</div>
      case 'error':
        return <div className="text-xs text-orange-400">Error detected!</div>
      case 'fixing':
        return <div className="text-xs text-orange-400">Agent fixing...</div>
      default:
        return null
    }
  }

  // Get avatar image URL based on agent ID
  const getAvatarUrl = (agentId: string) => {
    // Using UI Avatars for professional corporate look
    const colors: Record<string, string> = {
      larry: '0891b2', // cyan
      mary: 'dc2626',  // red
      alex: '7c3aed',  // purple
      sam: '059669',   // emerald
      emma: 'db2777',  // pink
      olivia: 'ea580c', // orange
      david: '2563eb', // blue
      nexus: '8b5cf6', // violet
    }
    const bgColor = colors[agentId] || '6366f1'
    const name = agentId.charAt(0).toUpperCase() + agentId.slice(1)
    return `https://ui-avatars.com/api/?name=${name}&background=${bgColor}&color=fff&size=128&bold=true&format=svg`
  }

  return (
    <div className={getNodeStyle()}>
      {/* Input Handle - Left side - Larger on mobile for better touch */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-4 !h-4 md:!w-3 md:!h-3 !bg-slate-400 !border-2 !border-slate-600"
      />

      <div className="flex items-center gap-3">
        {data.agentId && (
          <img
            src={getAvatarUrl(data.agentId)}
            alt={data.agentId}
            className={`w-9 h-9 rounded-full border-2 ${
              data.status === 'running' || data.status === 'fixing'
                ? 'border-amber-500 animate-pulse'
                : 'border-cyan-500/50'
            }`}
          />
        )}
        {data.type === 'trigger' && (
          <div className="w-9 h-9 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        )}
        {data.type === 'api' && (
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
            data.status === 'error' || data.status === 'fixing' ? 'bg-orange-500/20' : 'bg-blue-500/20'
          }`}>
            <svg className={`w-5 h-5 ${
              data.status === 'error' || data.status === 'fixing' ? 'text-orange-400' : 'text-blue-400'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {data.type === 'output' && (
          <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
        <div>
          <div className="font-semibold text-white text-sm">{data.label}</div>
          {getStatusText()}
        </div>
      </div>

      {/* Output Handle - Right side - Larger on mobile for better touch */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-4 !h-4 md:!w-3 md:!h-3 !bg-slate-400 !border-2 !border-slate-600"
      />
    </div>
  )
}

const nodeTypes = { custom: CustomNode }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const edgeTypes: any = { animated: AnimatedEdge }

// Workflow type definition
type WorkflowDefinition = {
  name: string
  description: string
  nodes: { id: string; position: { x: number; y: number }; data: { label: string; type: 'trigger' | 'agent' | 'api' | 'output'; agentId?: string; status: NodeStatus } }[]
  edges: { id: string; source: string; target: string }[]
  errorEdges: string[]
  // Confidence and optimization data (from AI-generated workflows)
  confidence?: number
  missingInfo?: string[]
  estimatedTimeSaved?: string
  estimatedCost?: string // e.g., "$0.05/run" or "Free"
  intentAnalysis?: {
    intent: string
    domain: string
    confidence: number
    understanding: string
    extractedInfo: Record<string, string>
    missingInfo: string[]
    suggestedTools: string[]
    complexity: 'simple' | 'medium' | 'complex'
  }
}

// Optimization Chat Panel - Opens when workflow needs more info
function WorkflowOptimizationChat({
  confidence,
  missingInfo,
  onConfidenceUpdate,
  isOpen,
  onToggle
}: {
  confidence: number
  missingInfo: string[]
  onConfidenceUpdate: (newConfidence: number) => void
  isOpen: boolean
  onToggle: () => void
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [currentQuestion, setCurrentQuestion] = useState(0)

  // Convert missingInfo to user-friendly questions
  const getQuestionForMissingInfo = (info: string): string => {
    const questionMap: Record<string, string> = {
      // Original questions
      'target_url': 'What URL or website should this workflow monitor?',
      'notification_channel': 'Where should notifications be sent? (e.g., Slack channel, email)',
      'schedule': 'How often should this run? (e.g., every hour, daily at 9am)',
      'threshold': 'What threshold should trigger an action?',
      'email_recipient': 'Who should receive the emails?',
      'data_source': 'What data source should be used?',
      'output_format': 'What format should the output be in?',
      'filter_criteria': 'What criteria should be used to filter?',
      // Email workflow questions
      'email_account': 'Which email account should this workflow connect to?',
      'reply_tone': 'What tone should auto-replies use? (e.g., professional, friendly, casual)',
      'auto_reply_rules': 'When should auto-replies be sent? (e.g., all emails, only urgent, specific senders)',
      // Notification workflow questions
      'notification_frequency': 'How often should you be notified? (e.g., immediately, hourly digest, daily summary)',
      // Report workflow questions
      'report_schedule': 'When should reports be generated? (e.g., daily at 9am, weekly on Monday)',
      'report_recipients': 'Who should receive these reports? (enter email addresses)',
      // Calendar/meeting workflow questions
      'calendar_account': 'Which calendar should this workflow use?',
      'reminder_timing': 'How far in advance should reminders be sent? (e.g., 15 minutes, 1 hour, 1 day)',
      // CRM/sales workflow questions
      'crm_integration': 'Which CRM system should this connect to? (e.g., Salesforce, HubSpot, Pipedrive)',
      'lead_scoring_criteria': 'What criteria should be used for lead scoring? (e.g., engagement level, company size)'
    }
    return questionMap[info] || `Please provide: ${info.replace(/_/g, ' ')}`
  }

  const handleAnswer = (value: string) => {
    const infoKey = missingInfo[currentQuestion]
    setAnswers(prev => ({ ...prev, [infoKey]: value }))

    // Move to next question or complete
    if (currentQuestion < missingInfo.length - 1) {
      setCurrentQuestion(prev => prev + 1)
    }

    // Increase confidence with each answer
    const progressPerAnswer = (0.95 - confidence) / missingInfo.length
    onConfidenceUpdate(Math.min(0.95, confidence + progressPerAnswer))
  }

  const allAnswered = Object.keys(answers).length >= missingInfo.length

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="absolute bottom-4 right-4 z-20 bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-4 py-2 rounded-xl shadow-lg hover:opacity-90 transition-all flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        {confidence < 0.85 ? 'Optimize Workflow' : 'Chat'}
      </button>
    )
  }

  return (
    <div className="absolute bottom-4 right-4 z-20 w-80 bg-slate-900/95 backdrop-blur-sm rounded-xl border border-slate-700 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 px-4 py-3 border-b border-slate-700 flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-white text-sm">Workflow Optimization</h4>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1.5 bg-slate-700 rounded-full w-24 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  confidence >= 0.85 ? 'bg-emerald-500' : confidence >= 0.7 ? 'bg-amber-500' : 'bg-orange-500'
                }`}
                style={{ width: `${confidence * 100}%` }}
              />
            </div>
            <span className={`text-xs font-medium ${
              confidence >= 0.85 ? 'text-emerald-400' : confidence >= 0.7 ? 'text-amber-400' : 'text-orange-400'
            }`}>
              {Math.round(confidence * 100)}% ready
            </span>
          </div>
        </div>
        <button onClick={onToggle} className="text-slate-400 hover:text-white p-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-4 max-h-64 overflow-y-auto">
        {!allAnswered && missingInfo.length > 0 ? (
          <div className="space-y-3">
            <p className="text-slate-300 text-sm">
              {getQuestionForMissingInfo(missingInfo[currentQuestion])}
            </p>
            <input
              type="text"
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
              placeholder="Type your answer..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value) {
                  handleAnswer(e.currentTarget.value)
                  e.currentTarget.value = ''
                }
              }}
            />
            <p className="text-xs text-slate-500">
              Question {currentQuestion + 1} of {missingInfo.length}
            </p>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-emerald-400 font-medium">Workflow Optimized!</p>
            <p className="text-slate-400 text-sm mt-1">Ready to execute with high confidence</p>
          </div>
        )}
      </div>
    </div>
  )
}

function WorkflowVisualization({ workflow }: { workflow: WorkflowDefinition }) {
  const isMobile = useIsMobile()

  // Optimization panel state
  const [currentConfidence, setCurrentConfidence] = useState(workflow.confidence || 0.85)
  const [showOptimizationChat, setShowOptimizationChat] = useState(
    (workflow.confidence || 0.85) < 0.85 && (workflow.missingInfo?.length || 0) > 0
  )

  const initialNodes: Node[] = workflow.nodes.map(n => ({
    id: n.id,
    type: 'custom',
    position: n.position,
    data: n.data,
  }))

  const initialEdges: Edge[] = workflow.edges.map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: 'animated',
    data: { status: 'idle' as EdgeStatus, progress: 0 },
  }))

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [isRunning, setIsRunning] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [executionLog, setExecutionLog] = useState<string[]>([])

  const addLog = (message: string) => {
    setExecutionLog(prev => [...prev.slice(-9), message])
  }

  // Animate line drawing with progress - SLOW AND VISIBLE
  const animateEdge = useCallback(async (edgeId: string, hasError: boolean = false) => {
    // Start drawing animation - line visibly extends from source to target
    for (let progress = 0; progress <= 100; progress += 2) {
      setEdges(edges => edges.map(e =>
        e.id === edgeId
          ? { ...e, data: { ...e.data, status: 'drawing' as EdgeStatus, progress } }
          : e
      ))
      await new Promise(resolve => setTimeout(resolve, 25)) // ~1.25 seconds total per line
    }

    if (hasError) {
      // Simulate error
      const errorMessage = ERROR_MESSAGES[Math.floor(Math.random() * ERROR_MESSAGES.length)]
      const fixingAgentId = FIXER_AGENTS[Math.floor(Math.random() * FIXER_AGENTS.length)]

      addLog(`ERROR on ${edgeId}: ${errorMessage}`)

      // Show error state - RED pulsing line with error popup
      setEdges(edges => edges.map(e =>
        e.id === edgeId
          ? {
              ...e,
              data: {
                ...e.data,
                status: 'error' as EdgeStatus,
                progress: 100,
                errorMessage,
              }
            }
          : e
      ))

      await new Promise(resolve => setTimeout(resolve, 2500)) // Show error for 2.5 seconds

      // Show fixing agent - ORANGE pulsing line with agent avatar ON THE LINE
      addLog(`Agent ${fixingAgentId.charAt(0).toUpperCase() + fixingAgentId.slice(1)} is fixing the issue...`)

      setEdges(edges => edges.map(e =>
        e.id === edgeId
          ? {
              ...e,
              data: {
                ...e.data,
                status: 'fixing' as EdgeStatus,
                fixingAgentId,
              }
            }
          : e
      ))

      await new Promise(resolve => setTimeout(resolve, 4000)) // Show fixing for 4 seconds so avatar is visible

      addLog(`Issue FIXED! Line turning green...`)
    }

    // Complete - turn green
    setEdges(edges => edges.map(e =>
      e.id === edgeId
        ? {
            ...e,
            data: {
              status: 'success' as EdgeStatus,
              progress: 100,
              errorMessage: undefined,
              fixingAgentId: undefined,
            }
          }
        : e
    ))
  }, [setEdges])

  const runWorkflow = useCallback(async () => {
    if (isRunning) return
    setIsRunning(true)
    setCurrentStep(0)
    setExecutionLog([])
    addLog('Starting workflow execution...')
    addLog('Mode: Real API execution enabled')

    // Reset all nodes and edges
    setNodes(nodes => nodes.map(n => ({
      ...n,
      data: { ...n.data, status: 'idle' as NodeStatus }
    })))
    setEdges(edges => edges.map(e => ({
      ...e,
      data: { status: 'idle' as EdgeStatus, progress: 0 }
    })))

    await new Promise(resolve => setTimeout(resolve, 500))

    // Build execution order based on dependencies
    const nodeOrder = workflow.nodes.map(n => n.id)
    const errorEdgeSet = new Set(workflow.errorEdges || [])
    const executionResults: ExecutionResult[] = []

    for (let i = 0; i < nodeOrder.length; i++) {
      const nodeId = nodeOrder[i]
      const node = workflow.nodes.find(n => n.id === nodeId)
      setCurrentStep(i + 1)

      // Check if this node can execute with real APIs
      const canExecuteReal = node && workflowExecutionService.canExecuteReal(node.data.label)
      const modeLabel = canExecuteReal ? '[REAL API]' : '[SIMULATED]'
      addLog(`${modeLabel} Processing: ${node?.data.label}`)

      // Set current node to running
      setNodes(nodes => nodes.map(n =>
        n.id === nodeId ? { ...n, data: { ...n.data, status: 'running' as NodeStatus } } : n
      ))

      // Find and animate incoming edges
      const incomingEdges = workflow.edges.filter(e => e.target === nodeId)

      for (const edge of incomingEdges) {
        const hasError = errorEdgeSet.has(edge.id)
        await animateEdge(edge.id, hasError)
      }

      // Execute the node using the real execution service
      if (node) {
        try {
          const result = await workflowExecutionService.executeNode(
            { id: node.id, data: { label: node.data.label, type: node.data.type, agentId: node.data.agentId } },
            {},
            {
              onLog: (msg) => addLog(msg),
            }
          )
          executionResults.push(result)

          if (result.success) {
            // Set node to success
            setNodes(nodes => nodes.map(n =>
              n.id === nodeId ? { ...n, data: { ...n.data, status: 'success' as NodeStatus } } : n
            ))
            if (result.toolSlug) {
              addLog(`  Tool: ${result.toolSlug} (${result.executionTimeMs}ms)`)
            }
          } else {
            // Set node to error
            setNodes(nodes => nodes.map(n =>
              n.id === nodeId ? { ...n, data: { ...n.data, status: 'error' as NodeStatus } } : n
            ))
            addLog(`  Error: ${result.error || 'Unknown error'}`)
          }
        } catch {
          // Fallback to success for demo
          setNodes(nodes => nodes.map(n =>
            n.id === nodeId ? { ...n, data: { ...n.data, status: 'success' as NodeStatus } } : n
          ))
          addLog(`  Completed with fallback`)
        }
      }

      await new Promise(resolve => setTimeout(resolve, 200))
    }

    const realExecutions = executionResults.filter(r => !r.isSimulated).length
    const simulatedExecutions = executionResults.filter(r => r.isSimulated).length
    addLog(`Workflow completed! (${realExecutions} real API calls, ${simulatedExecutions} simulated)`)
    setIsRunning(false)
  }, [isRunning, workflow, setNodes, setEdges, animateEdge])

  // Check if workflow is ready to execute
  const isReadyToExecute = currentConfidence >= 0.85
  const estimatedTimeSaved = workflow.estimatedTimeSaved || '~2 hrs/week'
  const estimatedCost = workflow.estimatedCost || null // null means free or not specified

  return (
    <div style={{ width: '100%', height: '100%' }}>
      {/* Control Panel - Mobile optimized positioning */}
      <div className="absolute top-2 sm:top-4 left-2 sm:left-4 z-10 bg-slate-900/95 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-700 max-w-[calc(100%-16px)] sm:max-w-xs touch-manipulation">
        <h2 className="font-bold text-white mb-1 text-sm sm:text-base line-clamp-1">{workflow.name}</h2>
        <p className="text-xs sm:text-sm text-slate-400 mb-2 sm:mb-3 line-clamp-2">{workflow.description}</p>

        {/* Confidence indicator */}
        <div className="mb-2 sm:mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] sm:text-xs text-slate-500">Confidence</span>
            <span className={`text-[10px] sm:text-xs font-medium ${
              isReadyToExecute ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {Math.round(currentConfidence * 100)}%
            </span>
          </div>
          <div className="h-1 sm:h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isReadyToExecute ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${currentConfidence * 100}%` }}
            />
          </div>
        </div>

        <div className="text-[10px] sm:text-xs text-slate-500 mb-2 sm:mb-3">
          Progress: {currentStep}/{workflow.nodes.length} nodes
        </div>

        {/* Execute button with confidence-based styling - Mobile optimized */}
        <div className="relative group">
          <Button
            onClick={runWorkflow}
            disabled={isRunning || !isReadyToExecute}
            size="sm"
            className={`min-h-[48px] sm:min-h-[44px] text-sm sm:text-sm touch-manipulation ${
              isRunning
                ? 'w-full bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : isReadyToExecute
                  ? 'w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600'
                  : 'w-full bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isRunning ? 'Executing...' : isReadyToExecute ? 'Execute' : 'Setup First'}
          </Button>

          {/* Time/money saved tooltip with cost - shows when ready (desktop only) */}
          {isReadyToExecute && !isRunning && (
            <div className="hidden sm:block absolute -top-12 left-1/2 -translate-x-1/2 bg-emerald-500/90 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-center">
              <div className="font-medium">Saves {estimatedTimeSaved}</div>
              {estimatedCost && (
                <div className="text-emerald-200 text-[10px] mt-0.5">
                  Cost: {estimatedCost}
                </div>
              )}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-emerald-500/90" />
            </div>
          )}

          {/* Nudge to complete setup when not ready - clickable to open optimization */}
          {!isReadyToExecute && !isRunning && (
            <button
              onClick={() => setShowOptimizationChat(true)}
              className="w-full text-xs sm:text-xs text-amber-400 mt-2 sm:mt-2 text-center hover:text-amber-300 hover:underline transition-colors cursor-pointer min-h-[40px] sm:min-h-0 touch-manipulation"
            >
              Complete setup →
            </button>
          )}
        </div>
      </div>

      {/* Execution Log */}
      <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-10 bg-slate-900/95 backdrop-blur-sm rounded-lg sm:rounded-xl p-2.5 sm:p-4 border border-slate-700 w-48 sm:w-72">
        <h4 className="text-[10px] sm:text-xs font-semibold text-slate-400 mb-1.5 sm:mb-2 uppercase flex items-center gap-1.5 sm:gap-2">
          <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="hidden sm:inline">Live Execution Log</span>
          <span className="sm:hidden">Exec Log</span>
        </h4>
        <div className="space-y-1 max-h-32 sm:max-h-48 overflow-y-auto">
          {executionLog.length === 0 ? (
            <p className="text-xs text-slate-500 italic">Click Execute to start...</p>
          ) : (
            executionLog.map((log, i) => (
              <p key={i} className={`text-xs ${
                log.includes('Error') ? 'text-orange-400' :
                log.includes('fixing') ? 'text-amber-400' :
                log.includes('fixed') || log.includes('completed') ? 'text-emerald-400' :
                'text-slate-400'
              }`}>
                {log}
              </p>
            ))
          )}
        </div>
      </div>

      {/* Legend - hidden on mobile to save space */}
      <div className="hidden sm:block absolute bottom-4 left-4 z-10 bg-slate-900/95 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
        <h4 className="text-xs font-semibold text-slate-400 mb-2 uppercase">Status Legend</h4>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-amber-500 rounded" />
            <span className="text-slate-400">Drawing / Processing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-orange-500 rounded animate-pulse" />
            <span className="text-slate-400">Error / Fixing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-emerald-500 rounded" />
            <span className="text-slate-400">Complete</span>
          </div>
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        className="bg-slate-950 min-h-[300px]"
        panOnScroll={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        panOnDrag={true}
        selectionOnDrag={false}
        minZoom={0.1}
        maxZoom={4}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        <Controls className="!hidden md:!flex !bg-slate-800 !border-slate-700 !rounded-xl [&>button]:!bg-slate-700 [&>button]:!border-slate-600 [&>button]:!text-white" />
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#334155" />
        {/* Mobile Zoom Controls - Only shown on mobile */}
        {isMobile && <MobileZoomControls />}
      </ReactFlow>

      {/* Optimization Chat Panel - Shows when workflow needs more info */}
      <WorkflowOptimizationChat
        confidence={currentConfidence}
        missingInfo={workflow.missingInfo || []}
        onConfidenceUpdate={setCurrentConfidence}
        isOpen={showOptimizationChat}
        onToggle={() => setShowOptimizationChat(!showOptimizationChat)}
      />
    </div>
  )
}

// Persona display names for the header
const PERSONA_DISPLAY_NAMES: Record<string, string> = {
  doctor: 'Healthcare Provider',
  nurse: 'Nursing Professional',
  therapist: 'Therapy Practice',
  lawyer: 'Legal Practice',
  paralegal: 'Legal Support',
  realtor: 'Real Estate',
  property_manager: 'Property Management',
  accountant: 'Accounting',
  financial_advisor: 'Financial Services',
  banker: 'Banking',
  teacher: 'Education',
  professor: 'Academic',
  developer: 'Software Development',
  engineer: 'Engineering',
  designer: 'Design',
  photographer: 'Photography',
  writer: 'Content Creation',
  sales: 'Sales',
  marketer: 'Marketing',
  recruiter: 'Recruiting',
  hr_manager: 'Human Resources',
  consultant: 'Consulting',
  project_manager: 'Project Management',
  operations: 'Operations',
  executive: 'Executive',
  entrepreneur: 'Entrepreneurship',
  ecommerce: 'E-Commerce',
  restaurant_owner: 'Restaurant',
  scientist: 'Research',
  general: 'Business',
  custom: 'Custom',
}

// Type for AI-generated workflow from localStorage
interface AIGeneratedWorkflow {
  id: string
  name: string
  description: string
  nodes: Array<{
    id: string
    type: string
    tool: string
    toolIcon: string
    name: string
    description: string
    config: Record<string, unknown>
    position: { x: number; y: number }
  }>
  connections: Array<{ from: string; to: string }>
  requiredIntegrations: string[]
  estimatedTimeSaved: string
  estimatedCost?: string // e.g., "$0.05/run" or "Free"
  complexity: string
  // Confidence and optimization data
  confidence?: number
  missingInfo?: string[]
  intentAnalysis?: {
    intent: string
    domain: string
    confidence: number
    understanding: string
    extractedInfo: Record<string, string>
    missingInfo: string[]
    suggestedTools: string[]
    complexity: 'simple' | 'medium' | 'complex'
  }
}

// Convert AI-generated workflow to PERSONA_WORKFLOWS format
function convertAIWorkflowToPersonaFormat(aiWorkflow: AIGeneratedWorkflow) {
  const typeToNodeType: Record<string, 'trigger' | 'agent' | 'api' | 'output'> = {
    trigger: 'trigger',
    action: 'api',
    condition: 'api',
    output: 'output',
    agent: 'agent'
  }

  const nodes = aiWorkflow.nodes.map((node, index) => ({
    id: node.id,
    position: node.position || { x: 200 * index, y: 150 },
    data: {
      label: node.name,
      type: typeToNodeType[node.type] || 'api',
      status: 'idle' as NodeStatus
    }
  }))

  const edges = aiWorkflow.connections.map((conn) => ({
    id: `e${conn.from}-${conn.to}`,
    source: conn.from,
    target: conn.to
  }))

  // Pick 2 random edges for error simulation
  const errorEdges = edges.length > 2
    ? [edges[Math.floor(edges.length / 3)]?.id, edges[Math.floor(edges.length * 2 / 3)]?.id].filter(Boolean)
    : []

  return {
    name: aiWorkflow.name,
    description: aiWorkflow.description,
    nodes,
    edges,
    errorEdges: errorEdges as string[],
    // Preserve confidence data for optimization panel
    confidence: aiWorkflow.confidence,
    missingInfo: aiWorkflow.missingInfo,
    estimatedTimeSaved: aiWorkflow.estimatedTimeSaved,
    estimatedCost: aiWorkflow.estimatedCost,
    intentAnalysis: aiWorkflow.intentAnalysis
  }
}

// Convert a template from TemplatesMarketplace to workflow format
function convertTemplateToWorkflow(template: WorkflowTemplate) {
  const nodes: Array<{
    id: string
    position: { x: number; y: number }
    data: { label: string; type: 'trigger' | 'agent' | 'api' | 'output'; status: NodeStatus; agentId?: string }
  }> = []
  const edges: Array<{ id: string; source: string; target: string }> = []

  let nodeId = 1
  const horizontalSpacing = 200
  const verticalSpacing = 100

  // Add trigger node
  nodes.push({
    id: String(nodeId++),
    position: { x: 0, y: 150 },
    data: { label: template.name.split(' ')[0] + ' Start', type: 'trigger', status: 'idle' as NodeStatus }
  })

  // Add integration nodes (APIs)
  const integrationsPerRow = 2
  template.integrations.forEach((integration, i) => {
    const row = Math.floor(i / integrationsPerRow)
    const col = i % integrationsPerRow
    nodes.push({
      id: String(nodeId++),
      position: { x: horizontalSpacing + col * 150, y: 50 + row * verticalSpacing },
      data: { label: integration, type: 'api', status: 'idle' as NodeStatus }
    })
    // Connect to trigger
    edges.push({ id: `e1-${nodeId - 1}`, source: '1', target: String(nodeId - 1) })
  })

  // Add agent nodes
  const agentNames: Record<string, string> = {
    larry: 'Larry - Analyst',
    sam: 'Sam - Developer',
    mary: 'Mary - PM',
    emma: 'Emma - Designer',
    alex: 'Alex - Architect',
    olivia: 'Olivia - QA',
    david: 'David - DevOps',
    nexus: 'Nexus AI'
  }

  const agentStartId = nodeId
  template.agents.forEach((agent, i) => {
    nodes.push({
      id: String(nodeId++),
      position: { x: horizontalSpacing * 2 + 100, y: 50 + i * verticalSpacing },
      data: {
        label: agentNames[agent] || agent,
        type: 'agent',
        agentId: agent,
        status: 'idle' as NodeStatus
      }
    })
    // Connect from integrations to agents
    const sourceId = 2 + (i % template.integrations.length)
    edges.push({ id: `e${sourceId}-${nodeId - 1}`, source: String(sourceId), target: String(nodeId - 1) })
  })

  // Add output node
  const outputId = nodeId++
  nodes.push({
    id: String(outputId),
    position: { x: horizontalSpacing * 3 + 200, y: 150 },
    data: { label: 'Complete', type: 'output', status: 'idle' as NodeStatus }
  })

  // Connect agents to output
  for (let i = agentStartId; i < outputId; i++) {
    edges.push({ id: `e${i}-${outputId}`, source: String(i), target: String(outputId) })
  }

  // Pick 2 edges for error simulation
  const errorEdges = edges.length > 2
    ? [edges[Math.floor(edges.length / 3)]?.id, edges[Math.floor(edges.length * 2 / 3)]?.id].filter(Boolean) as string[]
    : []

  return {
    name: template.name,
    description: template.description,
    nodes,
    edges,
    errorEdges,
    confidence: 0.95,
    missingInfo: [] as string[],
    estimatedTimeSaved: template.timeSaved || '2-4 hours',
    estimatedCost: '$0.01/run',
    intentAnalysis: undefined
  }
}

export function WorkflowDemo() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { persona, customPersonaLabel } = usePersonalization()
  const isMobile = useIsMobile()

  // State for mobile welcome screen - shown on mobile for first-time visitors
  const [showMobileWelcome, setShowMobileWelcome] = useState(() => {
    // Check if user has seen the workflow demo before
    const hasSeenDemo = localStorage.getItem('nexus_workflow_demo_seen')
    // Also check URL params - if they came with a template or AI workflow, skip welcome
    const urlParams = new URLSearchParams(window.location.search)
    const hasTemplate = urlParams.get('template')
    const hasAISource = urlParams.get('source') === 'ai'
    return !hasSeenDemo && !hasTemplate && !hasAISource
  })

  // State for AI Building Overlay (new Session 2 feature)
  const [showAIBuilding, setShowAIBuilding] = useState(false)
  const [prefillRequest, setPrefillRequest] = useState<string | null>(null)

  // State for AI Meeting Room
  const [showMeetingRoom, setShowMeetingRoom] = useState(false)
  const [meetingRoomMode, setMeetingRoomMode] = useState<'optimization' | 'troubleshooting' | 'brainstorm'>('optimization')
  const [workflowSessionKey, setWorkflowSessionKey] = useState(0) // Increments to reset chat state on new workflow

  // State for mobile FAB (Floating Action Button)
  const [mobileFABOpen, setMobileFABOpen] = useState(false)

  // State for showing first-time guidance hint
  const [showGuidanceHint, setShowGuidanceHint] = useState(() => {
    return localStorage.getItem('nexus_workflow_demo_hint_dismissed') !== 'true'
  })

  // State for AI-generated workflow
  const [aiWorkflow, setAiWorkflow] = useState<ReturnType<typeof convertAIWorkflowToPersonaFormat> | null>(null)

  // Check for prefill from FirstWinBanner or landing page
  useEffect(() => {
    const prefill = localStorage.getItem('nexus_workflow_demo_prefill')
    if (prefill) {
      setPrefillRequest(prefill)
      setShowAIBuilding(true)
      setShowMobileWelcome(false) // Hide welcome screen when building
      localStorage.removeItem('nexus_workflow_demo_prefill')
    }
  }, [])

  // Check for generated workflow from chat (WorkflowPreviewCard)
  useEffect(() => {
    const generatedWorkflow = localStorage.getItem('nexus_generated_workflow')
    if (generatedWorkflow && searchParams.get('source') === 'ai') {
      try {
        const workflowData = JSON.parse(generatedWorkflow)
        // Convert to the format expected by the workflow display
        const convertedWorkflow = {
          id: workflowData.id,
          name: workflowData.name,
          description: workflowData.description,
          nodes: workflowData.nodes.map((node: { id: string; name: string; type: string; integration?: string }, index: number) => ({
            id: node.id,
            type: 'persona',
            position: { x: 250 + (index % 3) * 300, y: 100 + Math.floor(index / 3) * 200 },
            data: {
              label: node.name,
              type: node.type,
              description: `${node.integration || 'Custom'} integration step`,
              status: 'success' as const,
            },
          })),
          edges: workflowData.nodes.slice(0, -1).map((node: { id: string }, index: number) => ({
            id: `edge-${index}`,
            source: node.id,
            target: workflowData.nodes[index + 1].id,
            type: 'animated',
            animated: true,
            style: { stroke: '#10b981' },
          })),
          integrations: workflowData.nodes.map((n: { integration?: string }) => n.integration).filter(Boolean),
          errorEdges: [],
          confidence: 0.85,
          missingInfo: [],
          estimatedTimeSaved: '1-2 hours/week',
          estimatedCost: '$0.01/run',
          intentAnalysis: undefined
        }
        setAiWorkflow(convertedWorkflow)
        setShowMobileWelcome(false)
        localStorage.removeItem('nexus_generated_workflow')
      } catch (error) {
        console.error('[WorkflowDemo] Error parsing generated workflow:', error)
        localStorage.removeItem('nexus_generated_workflow')
      }
    }
  }, [searchParams])

  // Generate missing info questions based on workflow type
  const generateMissingInfoForWorkflow = useCallback((workflowName: string): string[] => {
    const name = workflowName.toLowerCase()

    // Email-related workflows
    if (name.includes('email') || name.includes('mail')) {
      return ['email_account', 'reply_tone', 'auto_reply_rules']
    }
    // Slack/notification workflows
    if (name.includes('slack') || name.includes('notification')) {
      return ['notification_channel', 'notification_frequency']
    }
    // Report workflows
    if (name.includes('report') || name.includes('summary')) {
      return ['report_schedule', 'report_recipients']
    }
    // Meeting workflows
    if (name.includes('meeting') || name.includes('calendar')) {
      return ['calendar_account', 'reminder_timing']
    }
    // CRM/sales workflows
    if (name.includes('crm') || name.includes('sales') || name.includes('lead')) {
      return ['crm_integration', 'lead_scoring_criteria']
    }
    // Default questions for any workflow
    return ['schedule', 'notification_channel']
  }, [])

  // Handle AI Building completion
  const handleAIBuildComplete = useCallback((workflow: { name: string; description: string; nodes: any[]; edges: any[]; errorEdges: string[] }) => {
    setShowAIBuilding(false)
    setPrefillRequest(null)

    // Generate appropriate questions based on workflow type
    const missingInfo = generateMissingInfoForWorkflow(workflow.name)

    // Clear chat state by incrementing session key (forces AIMeetingRoom remount)
    setWorkflowSessionKey(prev => prev + 1)

    // Set the generated workflow as AI workflow with required additional properties
    setAiWorkflow({
      ...workflow,
      confidence: 0.8,
      missingInfo,
      estimatedTimeSaved: '1-2 hours',
      estimatedCost: '$0.02/run',
      intentAnalysis: undefined
    })
  }, [generateMissingInfoForWorkflow])

  // Handle AI Building cancel
  const handleAIBuildCancel = useCallback(() => {
    setShowAIBuilding(false)
    setPrefillRequest(null)
  }, [])

  // Check for AI-generated workflow from localStorage OR template from URL
  useEffect(() => {
    const source = searchParams.get('source')
    const templateId = searchParams.get('template')

    // Handle template parameter - load template from marketplace
    if (templateId) {
      const template = SAMPLE_TEMPLATES.find(t => t.id === templateId)
      if (template) {
        const converted = convertTemplateToWorkflow(template)
        setAiWorkflow(converted)
        return
      }
    }

    // Handle AI source parameter - load from localStorage
    if (source === 'ai') {
      const saved = localStorage.getItem('nexus_pending_workflow')
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as AIGeneratedWorkflow
          const converted = convertAIWorkflowToPersonaFormat(parsed)
          setAiWorkflow(converted)
          // Clear from localStorage after loading
          localStorage.removeItem('nexus_pending_workflow')
        } catch (e) {
          console.error('Failed to parse AI workflow:', e)
        }
      }
    }
  }, [searchParams])

  // Get persona-specific workflows, including AI-generated if available
  const workflows = useMemo(() => {
    const personaWorkflows = getWorkflowsForPersona(persona)
    if (aiWorkflow) {
      return {
        aiGenerated: aiWorkflow,
        ...personaWorkflows
      }
    }
    return personaWorkflows
  }, [persona, aiWorkflow])
  const workflowKeys = useMemo(() => Object.keys(workflows), [workflows])

  // Default to AI workflow if it exists, otherwise first workflow
  const [selectedWorkflowKey, setSelectedWorkflowKey] = useState<string>(
    aiWorkflow ? 'aiGenerated' : (workflowKeys[0] || 'salesPipeline')
  )

  // Update selected workflow when AI workflow loads
  useEffect(() => {
    if (aiWorkflow && !selectedWorkflowKey.startsWith('aiGenerated')) {
      setSelectedWorkflowKey('aiGenerated')
    }
  }, [aiWorkflow, selectedWorkflowKey])

  // Update selected workflow when persona changes
  useMemo(() => {
    if (!workflowKeys.includes(selectedWorkflowKey)) {
      setSelectedWorkflowKey(workflowKeys[0] || 'salesPipeline')
    }
  }, [workflowKeys, selectedWorkflowKey])

  const currentWorkflow = workflows[selectedWorkflowKey] || workflows[workflowKeys[0]]
  const personaDisplayName = persona === 'custom' && customPersonaLabel
    ? customPersonaLabel
    : PERSONA_DISPLAY_NAMES[persona] || 'Business'

  // Handler for skipping mobile welcome to workflow view
  const handleSkipToWorkflow = useCallback(() => {
    setShowMobileWelcome(false)
    localStorage.setItem('nexus_workflow_demo_seen', 'true')
  }, [])

  // Handler for Create with AI from mobile welcome
  const handleCreateWithAI = useCallback(() => {
    setShowMobileWelcome(false)
    localStorage.setItem('nexus_workflow_demo_seen', 'true')
    // The prefill is already set in localStorage by MobileWelcomeScreen
    const prefill = localStorage.getItem('nexus_workflow_demo_prefill')
    if (prefill) {
      setPrefillRequest(prefill)
      setShowAIBuilding(true)
      localStorage.removeItem('nexus_workflow_demo_prefill')
    }
  }, [])

  // Handler for Browse Templates
  const handleBrowseTemplates = useCallback(() => {
    localStorage.setItem('nexus_workflow_demo_seen', 'true')
    navigate('/templates')
  }, [navigate])

  // Swipe navigation handlers for switching between workflow tabs
  const handleSwipeNextWorkflow = useCallback(() => {
    const currentIndex = workflowKeys.indexOf(selectedWorkflowKey)
    if (currentIndex < workflowKeys.length - 1) {
      setSelectedWorkflowKey(workflowKeys[currentIndex + 1])
    }
  }, [workflowKeys, selectedWorkflowKey])

  const handleSwipePrevWorkflow = useCallback(() => {
    const currentIndex = workflowKeys.indexOf(selectedWorkflowKey)
    if (currentIndex > 0) {
      setSelectedWorkflowKey(workflowKeys[currentIndex - 1])
    }
  }, [workflowKeys, selectedWorkflowKey])

  // Set up swipe navigation for mobile workflow switching
  const swipeRef = useSwipeNavigation(
    {
      onSwipeLeft: handleSwipeNextWorkflow,
      onSwipeRight: handleSwipePrevWorkflow,
    },
    {
      threshold: 50,
      enabled: isMobile && !showAIBuilding && !showMeetingRoom,
    }
  )

  // Show mobile welcome screen on mobile for first-time visitors
  if (isMobile && showMobileWelcome && !showAIBuilding) {
    return (
      <MobileWelcomeScreen
        onCreateWithAI={handleCreateWithAI}
        onBrowseTemplates={handleBrowseTemplates}
        onSkipToWorkflow={handleSkipToWorkflow}
        personaDisplayName={personaDisplayName}
      />
    )
  }

  return (
    <div className="h-screen flex flex-col bg-slate-950">
      {/* AI Building Overlay - Shows when creating workflow from natural language */}
      {showAIBuilding && prefillRequest && (
        <AIBuildingOverlay
          request={prefillRequest}
          onComplete={handleAIBuildComplete}
          onCancel={handleAIBuildCancel}
        />
      )}

      {/* Header */}
      <header className="flex-shrink-0 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white flex-shrink-0"
            >
              ← Back
            </button>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-white truncate">
                {personaDisplayName} Workflows
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 line-clamp-1">
                {currentWorkflow?.description || 'AI-powered workflow automation'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-800/50 rounded-xl px-2.5 sm:px-3 py-1 sm:py-1.5">
              <span className="text-xs text-slate-500">Persona:</span>
              <span className="text-xs font-medium text-cyan-400">{personaDisplayName}</span>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs text-slate-500">AI Team:</span>
              <div className="flex -space-x-2">
                {['larry', 'mary', 'sam', 'alex', 'emma', 'olivia'].map((agent) => (
                  <div key={agent} className="border-2 border-slate-900 rounded-full">
                    <ProfessionalAvatar agentId={agent} size={32} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Workflow Tabs - Dynamic based on persona */}
      <div className="flex-shrink-0 border-b border-slate-800 bg-slate-900/50 px-4 sm:px-6 py-2 sm:py-3">
        <div className="flex items-center gap-2 flex-wrap overflow-x-auto">
          <span className="text-xs sm:text-sm text-slate-500 mr-2 sm:mr-4 flex-shrink-0">Your workflows:</span>
          {workflowKeys.map((key) => (
            <button
              key={key}
              onClick={() => setSelectedWorkflowKey(key)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                selectedWorkflowKey === key
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
              }`}
            >
              {workflows[key]?.name || key}
            </button>
          ))}
        </div>
      </div>

      {/* First-time Guidance Hint */}
      {showGuidanceHint && !aiWorkflow && !showAIBuilding && (
        <div className="px-4 sm:px-6 py-2">
          <ContextualHint
            message="Start by clicking 'Create Your Own' to describe what you want to automate in plain English, or explore the sample workflows below."
            actionLabel="Create Your Own"
            variant="action"
            onAction={() => {
              setPrefillRequest('Create a custom workflow')
              setShowAIBuilding(true)
            }}
            onDismiss={() => {
              setShowGuidanceHint(false)
              localStorage.setItem('nexus_workflow_demo_hint_dismissed', 'true')
            }}
          />
        </div>
      )}

      {/* Canvas - with swipe navigation on mobile */}
      <div ref={swipeRef} className="flex-1 relative touch-pan-y">
        {currentWorkflow && (
          <ReactFlowProvider>
            <WorkflowVisualization key={`${persona}-${selectedWorkflowKey}`} workflow={currentWorkflow} />
          </ReactFlowProvider>
        )}

        {/* Mobile swipe indicator */}
        {isMobile && workflowKeys.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 bg-slate-900/80 backdrop-blur-sm rounded-full border border-slate-700/50">
            <span className="text-slate-500 text-xs">
              {workflowKeys.indexOf(selectedWorkflowKey) > 0 && '< '}
              {workflowKeys.indexOf(selectedWorkflowKey) + 1}/{workflowKeys.length}
              {workflowKeys.indexOf(selectedWorkflowKey) < workflowKeys.length - 1 && ' >'}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-slate-800 bg-slate-900/80 px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Mobile: Simplified stats - only show on tap/expand */}
          {isMobile ? (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div>
                  <span className="text-slate-500">Nodes:</span>
                  <span className="ml-1 font-bold text-white">{currentWorkflow?.nodes.length || 0}</span>
                </div>
                <div>
                  <span className="text-slate-500">Connections:</span>
                  <span className="ml-1 font-bold text-white">{currentWorkflow?.edges.length || 0}</span>
                </div>
              </div>
              {/* Single primary action button on mobile */}
              <Button
                size="sm"
                className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600 text-xs"
                onClick={() => {
                  setPrefillRequest('Create a custom workflow')
                  setShowAIBuilding(true)
                }}
              >
                Create
              </Button>
            </div>
          ) : (
            // Desktop: Show all stats and buttons
            <>
              <div className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm flex-wrap">
                <div>
                  <span className="text-slate-500">Nodes:</span>
                  <span className="ml-1 sm:ml-2 font-bold text-white">{currentWorkflow?.nodes.length || 0}</span>
                </div>
                <div>
                  <span className="text-slate-500">Connections:</span>
                  <span className="ml-1 sm:ml-2 font-bold text-white">{currentWorkflow?.edges.length || 0}</span>
                </div>
                <div>
                  <span className="text-slate-500">Error Points:</span>
                  <span className="ml-1 sm:ml-2 font-bold text-orange-400">{currentWorkflow?.errorEdges?.length || 0}</span>
                </div>
                <div className="hidden sm:block border-l border-slate-700 pl-6">
                  <span className="text-slate-500">Available Workflows:</span>
                  <span className="ml-2 font-bold text-cyan-400">{workflowKeys.length}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs sm:text-sm"
                  onClick={() => navigate('/settings')}
                >
                  Change Persona
                </Button>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600 text-xs sm:text-sm"
                  onClick={() => {
                    setPrefillRequest('Create a custom workflow')
                    setShowAIBuilding(true)
                  }}
                >
                  Create Your Own
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* AI Meeting Room - Workflow specific strategy session */}
      {isMobile ? (
        // Mobile: Collapsible FAB (Floating Action Button)
        <>
          {/* Backdrop overlay when FAB is open */}
          {mobileFABOpen && (
            <div
              className="fixed inset-0 bg-black/20 z-30"
              onClick={() => setMobileFABOpen(false)}
            />
          )}

          <div className="fixed bottom-24 left-4 z-40">
            {/* Expanded action buttons */}
            {mobileFABOpen && (
              <div className="absolute bottom-16 left-0 flex flex-col gap-2 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <button
                  onClick={() => {
                    setMeetingRoomMode('optimization');
                    setShowMeetingRoom(true);
                    setMobileFABOpen(false);
                  }}
                  className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all text-sm font-medium whitespace-nowrap active:scale-95"
                >
                  <span>🎯</span>
                  <span>Optimize</span>
                </button>
                <button
                  onClick={() => {
                    setMeetingRoomMode('troubleshooting');
                    setShowMeetingRoom(true);
                    setMobileFABOpen(false);
                  }}
                  className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all text-sm font-medium whitespace-nowrap active:scale-95"
                >
                  <span>🔧</span>
                  <span>Troubleshoot</span>
                </button>
                <button
                  onClick={() => {
                    setMeetingRoomMode('brainstorm');
                    setShowMeetingRoom(true);
                    setMobileFABOpen(false);
                  }}
                  className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all text-sm font-medium whitespace-nowrap active:scale-95"
                >
                  <span>💡</span>
                  <span>Brainstorm</span>
                </button>
              </div>
            )}

            {/* Main FAB button */}
            <button
              onClick={() => setMobileFABOpen(!mobileFABOpen)}
              className="w-14 h-14 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 shadow-lg flex items-center justify-center text-white text-2xl font-light transition-transform active:scale-95"
            >
              <span className={`transition-transform duration-200 ${mobileFABOpen ? 'rotate-45' : ''}`}>+</span>
            </button>
          </div>
        </>
      ) : (
        // Desktop: Show all three buttons as before
        <div className="fixed bottom-20 sm:bottom-24 left-3 sm:left-6 z-40">
          <div className="flex flex-col gap-1.5 sm:gap-2">
            <button
              onClick={() => { setMeetingRoomMode('optimization'); setShowMeetingRoom(true); }}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all text-xs sm:text-sm"
            >
              <span>🎯</span>
              <span className="hidden sm:inline">Optimize Workflow</span>
              <span className="sm:hidden">Optimize</span>
            </button>
            <button
              onClick={() => { setMeetingRoomMode('troubleshooting'); setShowMeetingRoom(true); }}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all text-xs sm:text-sm"
            >
              <span>🔧</span>
              <span>Troubleshoot</span>
            </button>
            <button
              onClick={() => { setMeetingRoomMode('brainstorm'); setShowMeetingRoom(true); }}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all text-xs sm:text-sm"
            >
              <span>💡</span>
              <span>Brainstorm</span>
            </button>
          </div>
        </div>
      )}

      {/* AI Meeting Room Modal (Lazy Loaded - only loads when opened) */}
      <LazyAIMeetingRoom
        key={`meeting-room-${workflowSessionKey}`}
        isOpen={showMeetingRoom}
        onClose={() => setShowMeetingRoom(false)}
        workflowTitle={currentWorkflow?.name}
        workflowContext={currentWorkflow?.description}
        mode={meetingRoomMode}
      />

      {/* Smart AI Chatbot for workflow assistance */}
      <SmartAIChatbot position="bottom-right" />
    </div>
  )
}
