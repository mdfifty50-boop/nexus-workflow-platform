import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from './ui/button'
import { apiClient, type NexusAgent } from '@/lib/api-client'
import { SendIcon, AttachIcon, WorkflowIcon, SparklesIcon, ArrowRightIcon } from './icons/AgentAvatars'
import { ProfessionalAvatar } from './ProfessionalAvatar'
import { usePersonalization } from '@/contexts/PersonalizationContext'

// BMADAgent is now NexusAgent - type alias for backward compatibility
type BMADAgent = NexusAgent

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  agent?: BMADAgent
  isTyping?: boolean
}

// Streamlined system prompt - minimal questions, quick to workflow
const SYSTEM_PROMPT = `You are Nexus, an AI workflow orchestrator. Your goal is to help users create automated workflows QUICKLY with MINIMAL questions.

CRITICAL RULES:
1. NEVER ask more than 1 clarifying question at a time
2. If the user gives ANY automation request, immediately propose a workflow
3. Focus on ACTION, not discussion
4. Default to reasonable assumptions rather than asking

When user describes ANY task they want automated:
1. Immediately generate a workflow proposal using this EXACT format:

---WORKFLOW_START---
name: [Short descriptive name]
description: [One sentence description]
steps:
- agent: [agent_id]
  task: [brief task description]
- agent: [agent_id]
  task: [brief task description]
---WORKFLOW_END---

Available agents: larry (Business Analyst), mary (Product Manager), alex (Solutions Architect), sam (Senior Developer), emma (UX Designer), david (DevOps), olivia (QA Lead)

Example user: "I want to automate email follow-ups"
Example response: "I'll create a workflow for automated email follow-ups:

---WORKFLOW_START---
name: Email Follow-up Automation
description: Automatically send follow-up emails based on triggers
steps:
- agent: larry
  task: Define email triggers and recipient criteria
- agent: sam
  task: Build email automation logic
- agent: olivia
  task: Test email delivery and timing
---WORKFLOW_END---

Ready to build this? Click 'Create Workflow' to start."

Be concise. Be direct. Move to workflow visualization FAST.`

export function ChatInterface({ userId: _userId, onNavigate }: { userId?: string; onNavigate?: (path: string) => void }) {
  const navigate = useNavigate()
  const { getAgentInfo, term, personaInfo } = usePersonalization()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [agents, setAgents] = useState<BMADAgent[]>([])
  const [currentAgent, setCurrentAgent] = useState<BMADAgent | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768)
  const [workflowProposal, setWorkflowProposal] = useState<{
    name: string
    description: string
    steps: Array<{ agent: string; task: string }>
  } | null>(null)
  const [showWorkflowPreview, setShowWorkflowPreview] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load agents on mount
  useEffect(() => {
    const loadAgents = async () => {
      try {
        const response = await apiClient.getAgents()
        if (response.success && response.agents) {
          setAgents(response.agents)
          setCurrentAgent(response.agents.find(a => a.id === 'nexus') || null)
        }
      } catch (error) {
        console.error('Failed to load agents:', error)
      }
    }
    loadAgents()
  }, [])

  // Parse workflow from response
  const parseWorkflow = (content: string) => {
    const workflowMatch = content.match(/---WORKFLOW_START---([\s\S]*?)---WORKFLOW_END---/)
    if (workflowMatch) {
      const workflowText = workflowMatch[1]
      const nameMatch = workflowText.match(/name:\s*(.+)/)
      const descMatch = workflowText.match(/description:\s*(.+)/)
      const stepsMatches = [...workflowText.matchAll(/- agent:\s*(\w+)\s*\n\s*task:\s*(.+)/g)]

      if (nameMatch && stepsMatches.length > 0) {
        return {
          name: nameMatch[1].trim(),
          description: descMatch?.[1]?.trim() || '',
          steps: stepsMatches.map(m => ({
            agent: m[1].trim(),
            task: m[2].trim()
          }))
        }
      }
    }
    return null
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    // Add typing indicator
    const typingId = (Date.now() + 1).toString()
    setMessages(prev => [...prev, {
      id: typingId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isTyping: true
    }])

    try {
      const conversationMessages = messages
        .filter(m => !m.isTyping)
        .concat(userMessage)
        .map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        }))

      const response = await apiClient.chat({
        messages: conversationMessages,
        systemPrompt: SYSTEM_PROMPT,
        model: 'claude-sonnet-4-20250514',
        maxTokens: 2048,
        autoRoute: true
      })

      // Remove typing indicator
      setMessages(prev => prev.filter(m => m.id !== typingId))

      if (response.success) {
        let content = response.output

        // Check for workflow proposal
        const workflow = parseWorkflow(content)
        if (workflow) {
          setWorkflowProposal(workflow)
          // Clean content
          content = content.replace(/---WORKFLOW_START---[\s\S]*?---WORKFLOW_END---/, '').trim()
        }

        // Update current agent based on response
        if (response.agent) {
          setCurrentAgent(response.agent)
        }

        const assistantMessage: Message = {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: content || "I've prepared a workflow for you. Click 'Create Workflow' to visualize and run it.",
          timestamp: new Date(),
          agent: response.agent
        }

        setMessages(prev => [...prev, assistantMessage])
      }
    } catch (error: any) {
      // Remove typing indicator
      setMessages(prev => prev.filter(m => !m.isTyping))

      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: `I encountered an error: ${error.message}. Please try again.`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleCreateWorkflow = () => {
    if (!workflowProposal) return
    // Navigate to workflow builder with the proposal
    setShowWorkflowPreview(true)
  }

  const quickActions = [
    { label: 'Automate email responses', icon: '📧' },
    { label: 'Generate weekly reports', icon: '📊' },
    { label: 'Process customer feedback', icon: '💬' },
    { label: 'Sync CRM data', icon: '🔄' }
  ]

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - overlay on mobile, side panel on desktop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside className={`
        fixed md:relative z-50 md:z-auto h-full
        ${sidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:translate-x-0'}
        border-r border-border bg-card transition-all duration-300 overflow-hidden flex flex-col
      `}>
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <span className="font-bold text-xl">Nexus</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <button
            onClick={() => { setMessages([]); setWorkflowProposal(null) }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 hover:border-primary/40 transition-all mb-4"
          >
            <SparklesIcon size={20} />
            <span className="font-medium">New Chat</span>
          </button>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">{term('team')}</h3>
            {agents.map(agent => {
              const agentInfo = getAgentInfo(agent.id)
              return (
                <button
                  key={agent.id}
                  onClick={() => setCurrentAgent(agent)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                    currentAgent?.id === agent.id
                      ? 'bg-primary/10 border border-primary/30'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <ProfessionalAvatar agentId={agent.id} size={32} />
                  <div className="text-left">
                    <p className="text-sm font-medium">{agentInfo.name}</p>
                    <p className="text-xs text-muted-foreground">{agentInfo.title}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="p-4 border-t border-border space-y-2">
          <a
            href="/workflow-demo"
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 hover:border-cyan-500/50 transition-all text-sm group"
          >
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            <span className="font-medium text-cyan-400 group-hover:text-cyan-300">Workflow Demo</span>
            <span className="ml-auto text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full">NEW</span>
          </a>
          <button
            onClick={() => onNavigate ? onNavigate('/integrations') : navigate('/integrations')}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-muted/50 transition-colors text-sm"
          >
            <WorkflowIcon size={18} />
            <span>Integrations</span>
          </button>
          <button
            onClick={() => onNavigate ? onNavigate('/templates') : navigate('/templates')}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-muted/50 transition-colors text-sm"
          >
            <SparklesIcon size={18} />
            <span>Templates</span>
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-border flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            {currentAgent && (
              (() => {
                const agentInfo = getAgentInfo(currentAgent.id)
                return (
                  <div className="flex items-center gap-3">
                    <ProfessionalAvatar agentId={currentAgent.id} size={36} />
                    <div>
                      <p className="font-medium">{agentInfo.name}</p>
                      <p className="text-xs text-muted-foreground">{agentInfo.title}</p>
                    </div>
                  </div>
                )
              })()
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate ? onNavigate('/profile') : navigate('/profile')}
              className="px-4 py-2 text-sm rounded-lg hover:bg-muted/50 transition-colors"
            >
              Settings
            </button>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            // Welcome State
            <div className="h-full flex flex-col items-center justify-center p-8">
              <div className="max-w-2xl w-full text-center space-y-8">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold">
                    What would you like to <span className="gradient-text">automate</span>?
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    {personaInfo.tagline}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {quickActions.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(action.label)}
                      className="p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
                    >
                      <span className="text-2xl mb-2 block">{action.icon}</span>
                      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                        {action.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Messages List
            <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0">
                      <ProfessionalAvatar agentId={message.agent?.id || 'nexus'} size={40} />
                    </div>
                  )}

                  <div className={`flex-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                    {message.role === 'assistant' && message.agent && (
                      <p className="text-sm font-medium mb-1" style={{ color: message.agent.color }}>
                        {getAgentInfo(message.agent.id).name}
                      </p>
                    )}

                    <div
                      className={`inline-block rounded-2xl px-4 py-3 max-w-[85%] ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/50'
                      }`}
                    >
                      {message.isTyping ? (
                        <div className="flex gap-1.5">
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                          {message.content}
                        </div>
                      )}
                    </div>
                  </div>

                  {message.role === 'user' && (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex-shrink-0 flex items-center justify-center">
                      <span className="text-white font-medium">U</span>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Workflow Proposal Card */}
        {workflowProposal && (
          <div className="border-t border-border bg-gradient-to-r from-primary/5 to-secondary/5 p-4">
            <div className="max-w-3xl mx-auto">
              <div className="bg-card rounded-xl border border-primary/30 p-4 shadow-lg">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{workflowProposal.name}</h3>
                    <p className="text-sm text-muted-foreground">{workflowProposal.description}</p>
                  </div>
                  <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                    {workflowProposal.steps.length} steps
                  </span>
                </div>

                {/* Workflow Steps Preview */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4">
                  {workflowProposal.steps.map((step, i) => (
                    <div key={i} className="flex items-center">
                      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg whitespace-nowrap">
                        <ProfessionalAvatar agentId={step.agent} size={24} />
                        <span className="text-xs font-medium">{step.task}</span>
                      </div>
                      {i < workflowProposal.steps.length - 1 && (
                        <ArrowRightIcon size={16} className="text-muted-foreground mx-1" />
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleCreateWorkflow} className="flex-1">
                    <WorkflowIcon size={18} className="mr-2" />
                    Create Workflow
                  </Button>
                  <Button variant="outline" onClick={() => setWorkflowProposal(null)}>
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-border p-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-end gap-3 bg-muted/30 rounded-2xl border border-border focus-within:border-primary/50 transition-colors p-2">
              <button
                className="p-2 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                title="Attach file"
              >
                <AttachIcon size={20} />
              </button>

              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Describe what you want to automate..."
                rows={1}
                className="flex-1 bg-transparent border-none outline-none resize-none text-sm py-2 max-h-32"
                style={{ minHeight: '24px' }}
              />

              <Button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                size="icon"
                className="rounded-xl"
              >
                <SendIcon size={18} />
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground mt-2">
              {getAgentInfo('nexus').name} uses AI to help you build automated {term('workflow')}
            </p>
          </div>
        </div>
      </main>

      {/* Workflow Preview Modal */}
      {showWorkflowPreview && workflowProposal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{workflowProposal.name}</h2>
                  <p className="text-muted-foreground">{workflowProposal.description}</p>
                </div>
                <button
                  onClick={() => setShowWorkflowPreview(false)}
                  className="p-2 rounded-lg hover:bg-muted/50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 200px)' }}>
              {/* Workflow Visualization */}
              <div className="relative">
                {workflowProposal.steps.map((step, i) => (
                  <div key={i} className="flex items-start mb-8 last:mb-0">
                    {/* Connector Line */}
                    {i < workflowProposal.steps.length - 1 && (
                      <div className="absolute left-8 top-16 w-0.5 h-16 bg-gradient-to-b from-primary to-secondary" style={{ top: `${i * 96 + 64}px` }} />
                    )}

                    {/* Step Number */}
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                      {i + 1}
                    </div>

                    {/* Step Content */}
                    <div className="ml-6 flex-1 bg-muted/30 rounded-xl p-4 border border-border">
                      {(() => {
                        const agentInfo = getAgentInfo(step.agent)
                        return (
                          <>
                            <div className="flex items-center gap-3 mb-2">
                              <ProfessionalAvatar agentId={step.agent} size={32} />
                              <div>
                                <p className="font-medium capitalize">{agentInfo.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {agentInfo.title}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm">{step.task}</p>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-border flex gap-4">
              <Button className="flex-1" size="lg">
                <SparklesIcon size={20} className="mr-2" />
                Execute Workflow
              </Button>
              <Button variant="outline" size="lg" onClick={() => setShowWorkflowPreview(false)}>
                Edit Steps
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
