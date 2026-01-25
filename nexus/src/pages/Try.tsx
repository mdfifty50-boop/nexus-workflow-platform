import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { VoiceInput } from '@/components/VoiceInput'
import { TryPageSEO } from '@/components/SEOHead'

// =============================================================================
// GUEST WORKFLOW STORAGE
// =============================================================================
// Save guest workflow to localStorage for retrieval after signup
const GUEST_WORKFLOW_KEY = 'nexus_guest_workflow'

interface GuestWorkflow {
  description: string
  createdAt: string
  workflow: WorkflowResult | null
}

function saveGuestWorkflow(data: GuestWorkflow) {
  localStorage.setItem(GUEST_WORKFLOW_KEY, JSON.stringify(data))
}

// =============================================================================
// AI BUILDING OVERLAY - Simplified for Try page
// =============================================================================
type AIBuildingPhase = 'analyzing' | 'planning' | 'building' | 'connecting' | 'ready'

interface AIBuildingStep {
  id: string
  label: string
  type: 'trigger' | 'agent' | 'api' | 'output'
  status: 'pending' | 'building' | 'ready'
}

interface WorkflowResult {
  name: string
  description: string
  steps: AIBuildingStep[]
  connections: { from: string; to: string }[]
}

function AIBuildingOverlay({
  request,
  onComplete,
  onCancel
}: {
  request: string
  onComplete: (workflow: WorkflowResult) => void
  onCancel: () => void
}) {
  const [phase, setPhase] = useState<AIBuildingPhase>('analyzing')
  const [steps, setSteps] = useState<AIBuildingStep[]>([])
  const [analysisText, setAnalysisText] = useState('')
  const hasStartedRef = useRef(false)

  useEffect(() => {
    if (hasStartedRef.current) return
    hasStartedRef.current = true

    const analyzeAndBuild = async () => {
      // Phase 1: Analyzing
      setPhase('analyzing')
      setAnalysisText('Understanding your request...')
      await new Promise(r => setTimeout(r, 800))
      setAnalysisText('Identifying data sources and outputs...')
      await new Promise(r => setTimeout(r, 700))

      // Phase 2: Planning
      setPhase('planning')
      const generatedSteps = parseRequestToSteps(request)
      setSteps(generatedSteps.map(s => ({ ...s, status: 'pending' as const })))
      await new Promise(r => setTimeout(r, 1000))

      // Phase 3: Building nodes
      setPhase('building')
      for (let i = 0; i < generatedSteps.length; i++) {
        setSteps(prev => prev.map((s, idx) =>
          idx === i ? { ...s, status: 'building' } : idx < i ? { ...s, status: 'ready' } : s
        ))
        await new Promise(r => setTimeout(r, 400))
        setSteps(prev => prev.map((s, idx) =>
          idx === i ? { ...s, status: 'ready' } : s
        ))
      }

      // Phase 4: Connecting
      setPhase('connecting')
      const connections = generateConnections(generatedSteps)
      await new Promise(r => setTimeout(r, 600))

      // Phase 5: Ready
      setPhase('ready')
      await new Promise(r => setTimeout(r, 400))

      onComplete({
        name: request.length > 50 ? request.substring(0, 50) + '...' : request,
        description: request,
        steps: generatedSteps.map(s => ({ ...s, status: 'ready' as const })),
        connections
      })
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
          <p className="text-slate-400 max-w-md mx-auto text-sm">"{request}"</p>
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
            <div className="text-5xl animate-spin" style={{ animationDuration: '3s' }}>⚙️</div>
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

        {/* Cancel button (only during building) */}
        {phase !== 'ready' && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// HELPER FUNCTIONS - Parse request and generate workflow structure
// =============================================================================
function parseRequestToSteps(request: string): AIBuildingStep[] {
  const requestLower = request.toLowerCase()
  const steps: AIBuildingStep[] = []
  let stepId = 1

  // Detect trigger type
  if (requestLower.includes('every') || requestLower.includes('weekly') || requestLower.includes('daily') || requestLower.includes('friday') || requestLower.includes('monday') || requestLower.includes('morning')) {
    steps.push({ id: String(stepId++), label: 'Scheduled Trigger', type: 'trigger', status: 'pending' })
  } else if (requestLower.includes('when') || (requestLower.includes('email') && requestLower.includes('receive'))) {
    steps.push({ id: String(stepId++), label: 'Event Trigger', type: 'trigger', status: 'pending' })
  } else {
    steps.push({ id: String(stepId++), label: 'Manual Start', type: 'trigger', status: 'pending' })
  }

  // Detect data sources
  if (requestLower.includes('email') || requestLower.includes('gmail') || requestLower.includes('inbox')) {
    steps.push({ id: String(stepId++), label: 'Fetch Emails', type: 'api', status: 'pending' })
  }
  if (requestLower.includes('calendar') || requestLower.includes('meeting') || requestLower.includes('schedule')) {
    steps.push({ id: String(stepId++), label: 'Calendar Events', type: 'api', status: 'pending' })
  }
  if (requestLower.includes('crm') || requestLower.includes('sales') || requestLower.includes('lead') || requestLower.includes('customer')) {
    steps.push({ id: String(stepId++), label: 'CRM Data', type: 'api', status: 'pending' })
  }
  if (requestLower.includes('spreadsheet') || requestLower.includes('sheet') || requestLower.includes('excel') || requestLower.includes('data')) {
    steps.push({ id: String(stepId++), label: 'Spreadsheet', type: 'api', status: 'pending' })
  }
  if (requestLower.includes('twitter') || requestLower.includes('social') || requestLower.includes('mention')) {
    steps.push({ id: String(stepId++), label: 'Social Monitor', type: 'api', status: 'pending' })
  }
  if (requestLower.includes('invoice') || requestLower.includes('pdf') || requestLower.includes('document')) {
    steps.push({ id: String(stepId++), label: 'Document Parser', type: 'api', status: 'pending' })
  }

  // AI processing steps
  if (requestLower.includes('summary') || requestLower.includes('summarize') || requestLower.includes('analyze') || requestLower.includes('report')) {
    steps.push({ id: String(stepId++), label: 'AI Analysis', type: 'agent', status: 'pending' })
  }
  if (requestLower.includes('write') || requestLower.includes('draft') || requestLower.includes('compose') || requestLower.includes('personalize')) {
    steps.push({ id: String(stepId++), label: 'AI Writer', type: 'agent', status: 'pending' })
  }

  // Always have at least one agent
  if (steps.filter(s => s.type === 'agent').length === 0) {
    steps.push({ id: String(stepId++), label: 'AI Processing', type: 'agent', status: 'pending' })
  }

  // Detect output destinations
  if (requestLower.includes('whatsapp')) {
    steps.push({ id: String(stepId++), label: 'Send WhatsApp', type: 'output', status: 'pending' })
  } else if (requestLower.includes('slack')) {
    steps.push({ id: String(stepId++), label: 'Send to Slack', type: 'output', status: 'pending' })
  } else if (requestLower.includes('text') || requestLower.includes('sms')) {
    steps.push({ id: String(stepId++), label: 'Send SMS', type: 'output', status: 'pending' })
  } else if (requestLower.includes('drive') || requestLower.includes('folder') || requestLower.includes('save')) {
    steps.push({ id: String(stepId++), label: 'Save to Drive', type: 'output', status: 'pending' })
  } else if (requestLower.includes('email') || requestLower.includes('send') || requestLower.includes('notify')) {
    steps.push({ id: String(stepId++), label: 'Send Email', type: 'output', status: 'pending' })
  } else {
    steps.push({ id: String(stepId++), label: 'Deliver Results', type: 'output', status: 'pending' })
  }

  return steps
}

function generateConnections(steps: AIBuildingStep[]): { from: string; to: string }[] {
  const connections: { from: string; to: string }[] = []
  const triggers = steps.filter(s => s.type === 'trigger')
  const dataSources = steps.filter(s => s.type === 'api')
  const agents = steps.filter(s => s.type === 'agent')
  const outputs = steps.filter(s => s.type === 'output')

  // Connect trigger to data sources or agents
  triggers.forEach(trigger => {
    if (dataSources.length > 0) {
      dataSources.forEach(ds => {
        connections.push({ from: trigger.id, to: ds.id })
      })
    } else if (agents.length > 0) {
      connections.push({ from: trigger.id, to: agents[0].id })
    }
  })

  // Connect data sources to agents
  if (dataSources.length > 0 && agents.length > 0) {
    dataSources.forEach(ds => {
      connections.push({ from: ds.id, to: agents[0].id })
    })
  }

  // Chain agents
  for (let i = 0; i < agents.length - 1; i++) {
    connections.push({ from: agents[i].id, to: agents[i + 1].id })
  }

  // Connect last agent to outputs
  if (agents.length > 0 && outputs.length > 0) {
    const lastAgent = agents[agents.length - 1]
    outputs.forEach(output => {
      connections.push({ from: lastAgent.id, to: output.id })
    })
  }

  return connections
}

// =============================================================================
// WORKFLOW PREVIEW COMPONENT
// =============================================================================
function WorkflowPreview({ workflow }: { workflow: WorkflowResult }) {
  return (
    <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
          <span className="text-2xl">✨</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Your Workflow</h3>
          <p className="text-sm text-slate-400">{workflow.steps.length} steps ready to automate</p>
        </div>
      </div>

      {/* Visual workflow representation */}
      <div className="relative">
        {/* Connection lines - simplified visual */}
        <div className="absolute inset-0 pointer-events-none">
          <svg className="w-full h-full" style={{ minHeight: '200px' }}>
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.5" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Steps grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {workflow.steps.map((step, index) => (
            <div
              key={step.id}
              className="relative flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-cyan-500/50 transition-all"
              style={{
                animation: 'fadeInUp 0.4s ease-out forwards',
                animationDelay: `${index * 100}ms`,
                opacity: 0
              }}
            >
              <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">
                {index + 1}
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                step.type === 'trigger' ? 'bg-amber-500/20 text-amber-400' :
                step.type === 'agent' ? 'bg-cyan-500/20 text-cyan-400' :
                step.type === 'api' ? 'bg-purple-500/20 text-purple-400' :
                'bg-emerald-500/20 text-emerald-400'
              }`}>
                {step.type === 'trigger' ? '⚡' :
                 step.type === 'agent' ? '🤖' :
                 step.type === 'api' ? '🔌' : '✅'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{step.label}</div>
                <div className="text-xs text-slate-400 capitalize">{step.type}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

// =============================================================================
// SAMPLE WORKFLOW SUGGESTIONS
// =============================================================================
const WORKFLOW_SUGGESTIONS = [
  "Text me a summary of my unread emails every morning",
  "When someone mentions my company on Twitter, send me a Slack notification",
  "Every Friday at 5pm, create a PDF report of my team's tasks",
  "Automatically save invoice PDFs from Gmail to Google Drive",
  "When a lead fills my form, add to CRM and send welcome email",
]

// =============================================================================
// MAIN TRY PAGE COMPONENT
// =============================================================================
export function Try() {
  const navigate = useNavigate()
  const [workflowDescription, setWorkflowDescription] = useState('')
  const [isBuilding, setIsBuilding] = useState(false)
  const [completedWorkflow, setCompletedWorkflow] = useState<WorkflowResult | null>(null)
  const [isVoiceMode, setIsVoiceMode] = useState(false)
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Rotate placeholder suggestions
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % WORKFLOW_SUGGESTIONS.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const handleSeeTheMagic = () => {
    if (workflowDescription.trim().length < 10) return
    setIsBuilding(true)
  }

  const handleWorkflowComplete = (workflow: WorkflowResult) => {
    setCompletedWorkflow(workflow)
    setIsBuilding(false)

    // Save to localStorage for post-signup retrieval
    saveGuestWorkflow({
      description: workflowDescription,
      createdAt: new Date().toISOString(),
      workflow
    })
  }

  const handleVoiceTranscript = (text: string, _language: string) => {
    setWorkflowDescription(prev => prev + (prev ? ' ' : '') + text)
    setIsVoiceMode(false)
  }

  const handleSignupClick = () => {
    // Save workflow before navigating to signup
    if (completedWorkflow) {
      saveGuestWorkflow({
        description: workflowDescription,
        createdAt: new Date().toISOString(),
        workflow: completedWorkflow
      })
    }
    navigate('/signup')
  }

  const handleTryAnother = () => {
    setWorkflowDescription('')
    setCompletedWorkflow(null)
    textareaRef.current?.focus()
  }

  return (
    <>
      <TryPageSEO />
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
              <span className="text-xl font-bold text-white">N</span>
            </div>
            <span className="text-xl font-bold text-white">Nexus</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm">Sign up free</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-24 pb-12">
        <div className="max-w-3xl w-full">
          {/* Hero Section */}
          {!completedWorkflow && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                  See the magic in
                  <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent"> seconds</span>
                </h1>
                <p className="text-lg text-slate-400 max-w-xl mx-auto">
                  Describe any workflow in plain English and watch Nexus build it instantly.
                  No account needed to try.
                </p>
              </div>

              {/* Value Props */}
              <div className="flex justify-center gap-6 mb-8">
                {[
                  { icon: '⚡', label: 'Build in seconds' },
                  { icon: '🔗', label: '8,500+ integrations' },
                  { icon: '🤖', label: 'AI-powered' },
                ].map((prop, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-400">
                    <span className="text-lg">{prop.icon}</span>
                    <span>{prop.label}</span>
                  </div>
                ))}
              </div>

              {/* Input Section */}
              <div className="relative">
                {/* Main textarea */}
                <div className="relative bg-slate-900/70 rounded-2xl border-2 border-slate-700 focus-within:border-cyan-500/50 transition-all shadow-2xl">
                  <textarea
                    ref={textareaRef}
                    value={workflowDescription}
                    onChange={(e) => setWorkflowDescription(e.target.value)}
                    placeholder={WORKFLOW_SUGGESTIONS[placeholderIndex]}
                    rows={4}
                    className="w-full bg-transparent text-white placeholder:text-slate-500 p-6 pr-16 resize-none focus:outline-none text-lg"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.metaKey && workflowDescription.trim().length >= 10) {
                        handleSeeTheMagic()
                      }
                    }}
                  />

                  {/* Voice input button */}
                  <button
                    onClick={() => setIsVoiceMode(!isVoiceMode)}
                    className={`absolute right-4 top-4 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      isVoiceMode
                        ? 'bg-cyan-500 text-white animate-pulse'
                        : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                    title="Voice input"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </button>

                  {/* Character count */}
                  <div className="absolute bottom-3 right-4 text-xs text-slate-500">
                    {workflowDescription.length > 0 && (
                      <span className={workflowDescription.length < 10 ? 'text-amber-400' : 'text-emerald-400'}>
                        {workflowDescription.length} characters
                      </span>
                    )}
                  </div>
                </div>

                {/* Voice input panel */}
                {isVoiceMode && (
                  <div className="mt-4">
                    <VoiceInput
                      onTranscript={handleVoiceTranscript}
                      onListening={(listening) => !listening && setIsVoiceMode(false)}
                      placeholder="Speak your workflow idea..."
                    />
                  </div>
                )}

                {/* CTA Button */}
                <Button
                  onClick={handleSeeTheMagic}
                  disabled={workflowDescription.trim().length < 10}
                  size="lg"
                  className="w-full mt-4 h-14 text-lg font-semibold disabled:opacity-50"
                >
                  <span className="mr-2">✨</span>
                  See the magic
                  <span className="ml-2 text-sm opacity-75">(⌘ + Enter)</span>
                </Button>

                {/* Quick suggestions */}
                <div className="mt-6">
                  <p className="text-xs text-slate-500 mb-3 text-center">Or try one of these:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {WORKFLOW_SUGGESTIONS.slice(0, 3).map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => setWorkflowDescription(suggestion)}
                        className="px-3 py-1.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 rounded-full text-xs text-slate-300 transition-all"
                      >
                        {suggestion.length > 50 ? suggestion.substring(0, 47) + '...' : suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Completed Workflow Section */}
          {completedWorkflow && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                  <span className="text-3xl">🎉</span>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Your workflow is ready!</h2>
                <p className="text-slate-400">
                  Sign up to activate it and start automating in minutes.
                </p>
              </div>

              {/* Workflow Preview */}
              <WorkflowPreview workflow={completedWorkflow} />

              {/* CTA Section */}
              <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-2xl border border-cyan-500/20 p-6 text-center">
                <h3 className="text-xl font-semibold text-white mb-2">
                  Ready to bring this to life?
                </h3>
                <p className="text-slate-400 mb-6 text-sm">
                  Create your free account to activate this workflow. Your workflow will be waiting for you.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={handleSignupClick}
                    size="lg"
                    className="h-12 px-8 text-base font-semibold"
                  >
                    Create free account
                    <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Button>
                  <Button
                    onClick={handleTryAnother}
                    variant="outline"
                    size="lg"
                    className="h-12 px-8 text-base"
                  >
                    Try another workflow
                  </Button>
                </div>

                {/* Trust signals */}
                <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Free forever plan
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    No credit card required
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Setup in under 2 minutes
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* AI Building Overlay */}
      {isBuilding && (
        <AIBuildingOverlay
          request={workflowDescription}
          onComplete={handleWorkflowComplete}
          onCancel={() => setIsBuilding(false)}
        />
      )}

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-500 border-t border-slate-800">
        <div className="flex justify-center gap-4">
          <Link to="/privacy" className="hover:text-slate-400">Privacy</Link>
          <Link to="/terms" className="hover:text-slate-400">Terms</Link>
          <Link to="/" className="hover:text-slate-400">Home</Link>
        </div>
      </footer>
    </div>
    </>
  )
}

export default Try
