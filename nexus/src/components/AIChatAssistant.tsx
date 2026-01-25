import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { usePersonalization } from '@/contexts/PersonalizationContext'
import { ProfessionalAvatar } from './ProfessionalAvatar'

// Workflow recommendation database - maps keywords to workflows
const WORKFLOW_DATABASE = [
  {
    id: 'email-automation',
    name: 'Email Response Automation',
    keywords: ['email', 'inbox', 'respond', 'reply', 'mail', 'message', 'communication'],
    description: 'Automatically categorize and respond to emails',
    route: '/workflow-demo?template=email-automation',
    personas: ['all']
  },
  {
    id: 'patient-intake',
    name: 'Patient Intake Automation',
    keywords: ['patient', 'intake', 'registration', 'onboarding', 'new patient', 'admission'],
    description: 'Streamline new patient registration process',
    route: '/workflow-demo?template=patient-intake',
    personas: ['doctor', 'nurse', 'therapist', 'healthcare']
  },
  {
    id: 'prescription-refills',
    name: 'Prescription Refill Workflow',
    keywords: ['prescription', 'refill', 'medication', 'rx', 'pharmacy', 'medicine'],
    description: 'Automate prescription renewal requests',
    route: '/workflow-demo?template=prescription-refills',
    personas: ['doctor', 'nurse', 'pharmacist']
  },
  {
    id: 'legal-document-review',
    name: 'Legal Document Review',
    keywords: ['contract', 'legal', 'document', 'review', 'agreement', 'terms', 'clause'],
    description: 'AI-assisted contract and document analysis',
    route: '/workflow-demo?template=legal-document-review',
    personas: ['lawyer', 'paralegal', 'legal']
  },
  {
    id: 'case-intake',
    name: 'Case Intake Automation',
    keywords: ['case', 'client', 'intake', 'matter', 'legal case', 'new client'],
    description: 'Streamline new client onboarding',
    route: '/workflow-demo?template=case-intake',
    personas: ['lawyer', 'paralegal']
  },
  {
    id: 'invoice-processing',
    name: 'Invoice Processing',
    keywords: ['invoice', 'billing', 'payment', 'accounts', 'receivable', 'payable', 'bill'],
    description: 'Automate invoice extraction and processing',
    route: '/workflow-demo?template=invoice-processing',
    personas: ['accountant', 'financial_advisor', 'small_business_owner']
  },
  {
    id: 'expense-reports',
    name: 'Expense Report Automation',
    keywords: ['expense', 'report', 'receipt', 'reimbursement', 'travel', 'spending'],
    description: 'Streamline expense tracking and reporting',
    route: '/workflow-demo?template=expense-reports',
    personas: ['accountant', 'executive', 'small_business_owner']
  },
  {
    id: 'lead-qualification',
    name: 'Lead Qualification Workflow',
    keywords: ['lead', 'prospect', 'qualify', 'sales', 'crm', 'pipeline', 'opportunity'],
    description: 'Automatically score and qualify leads',
    route: '/workflow-demo?template=lead-qualification',
    personas: ['real_estate_agent', 'recruiter', 'marketing_manager', 'sales']
  },
  {
    id: 'social-media-content',
    name: 'Social Media Content Calendar',
    keywords: ['social', 'media', 'content', 'post', 'marketing', 'instagram', 'twitter', 'linkedin'],
    description: 'Generate and schedule social content',
    route: '/workflow-demo?template=social-media-content',
    personas: ['marketing_manager', 'content_creator', 'influencer']
  },
  {
    id: 'code-review',
    name: 'Code Review Automation',
    keywords: ['code', 'review', 'pull request', 'pr', 'github', 'git', 'programming'],
    description: 'Automated code review and suggestions',
    route: '/workflow-demo?template=code-review',
    personas: ['software_developer', 'engineer']
  },
  {
    id: 'candidate-screening',
    name: 'Candidate Screening Workflow',
    keywords: ['candidate', 'resume', 'cv', 'hiring', 'recruit', 'interview', 'job'],
    description: 'Automate resume screening and ranking',
    route: '/workflow-demo?template=candidate-screening',
    personas: ['recruiter', 'hr', 'executive']
  },
  {
    id: 'data-analysis',
    name: 'Data Analysis Pipeline',
    keywords: ['data', 'analysis', 'report', 'analytics', 'insights', 'metrics', 'dashboard'],
    description: 'Automated data processing and insights',
    route: '/workflow-demo?template=data-analysis',
    personas: ['all']
  },
  {
    id: 'customer-support',
    name: 'Customer Support Automation',
    keywords: ['support', 'ticket', 'customer', 'help', 'issue', 'complaint', 'service'],
    description: 'Triage and respond to support tickets',
    route: '/workflow-demo?template=customer-support',
    personas: ['all']
  },
  {
    id: 'meeting-scheduler',
    name: 'Meeting Scheduler',
    keywords: ['meeting', 'calendar', 'schedule', 'appointment', 'book', 'availability'],
    description: 'Automate meeting scheduling and reminders',
    route: '/workflow-demo?template=meeting-scheduler',
    personas: ['all']
  },
  {
    id: 'property-listing',
    name: 'Property Listing Automation',
    keywords: ['property', 'listing', 'real estate', 'house', 'apartment', 'mls'],
    description: 'Automate property listing creation',
    route: '/workflow-demo?template=property-listing',
    personas: ['real_estate_agent']
  },
  {
    id: 'lesson-planning',
    name: 'Lesson Plan Generator',
    keywords: ['lesson', 'plan', 'curriculum', 'teaching', 'education', 'class', 'student'],
    description: 'AI-assisted lesson plan creation',
    route: '/workflow-demo?template=lesson-planning',
    personas: ['teacher', 'educator']
  }
]

// Page-specific quick actions
const PAGE_QUICK_ACTIONS: Record<string, Array<{ label: string; action: string; icon: string }>> = {
  '/dashboard': [
    { label: 'Create new workflow', action: 'navigate:/workflow-demo', icon: '⚡' },
    { label: 'View my templates', action: 'navigate:/templates', icon: '📋' },
    { label: 'Check integrations', action: 'navigate:/integrations', icon: '🔗' }
  ],
  '/templates': [
    { label: 'Find automation for me', action: 'prompt:What task do you want to automate?', icon: '🔍' },
    { label: 'Create custom workflow', action: 'navigate:/workflow-demo', icon: '✨' },
    { label: 'View popular templates', action: 'scroll:popular', icon: '🔥' }
  ],
  '/workflow-demo': [
    { label: 'Execute workflow', action: 'click:execute', icon: '▶️' },
    { label: 'Customize nodes', action: 'prompt:Which part would you like to modify?', icon: '🔧' },
    { label: 'Save as template', action: 'prompt:What would you like to name this template?', icon: '💾' }
  ],
  '/integrations': [
    { label: 'Connect essential tools', action: 'scroll:recommended', icon: '⭐' },
    { label: 'What integrations do I need?', action: 'prompt:Tell me about your work and I\'ll recommend integrations', icon: '🤔' },
    { label: 'Test connections', action: 'click:refresh', icon: '🔄' }
  ],
  '/projects': [
    { label: 'Create new project', action: 'click:create', icon: '➕' },
    { label: 'Find a workflow', action: 'prompt:What are you looking for?', icon: '🔍' }
  ],
  '/settings': [
    { label: 'Change my role', action: 'navigate:/settings?tab=personalization', icon: '👤' },
    { label: 'Update preferences', action: 'scroll:preferences', icon: '⚙️' }
  ]
}

// Persona-specific greetings
const PERSONA_GREETINGS: Record<string, string> = {
  doctor: "Hello Doctor! I'm here to help you automate clinical workflows. What would you like to streamline today?",
  nurse: "Hi there! Ready to help you save time on patient care documentation. What can I assist with?",
  lawyer: "Good day, Counselor. I can help automate legal document review, case management, and more. What do you need?",
  accountant: "Hello! Let me help you automate financial workflows - invoices, reports, reconciliations. What's on your mind?",
  real_estate_agent: "Hi! Ready to help with property listings, client follow-ups, and market analysis. What would you like to automate?",
  marketing_manager: "Hey there! I can help with content calendars, campaign automation, and analytics. What's your goal?",
  software_developer: "Hello! Need help with code reviews, CI/CD, documentation, or deployments? I've got you covered.",
  recruiter: "Hi! Let's streamline your hiring process - from resume screening to interview scheduling. What do you need?",
  teacher: "Hello! I can help with lesson planning, grading, and student communications. How can I assist?",
  executive: "Good day! I can help optimize your workflow with meeting scheduling, report generation, and more. What's your priority?",
  default: "Hi! I'm your AI assistant. Tell me what you'd like to automate, and I'll find the perfect workflow for you."
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  actions?: Array<{ label: string; route: string }>
}

interface AIChatAssistantProps {
  position?: 'bottom-right' | 'bottom-left' | 'side-panel'
  pageContext?: string
}

export function AIChatAssistant({ position = 'bottom-right', pageContext: _pageContext }: AIChatAssistantProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { persona, customPersonaLabel, term } = usePersonalization()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const currentPath = location.pathname

  // Get persona display name
  const personaDisplayName = useMemo(() => {
    if (persona === 'custom' && customPersonaLabel) return customPersonaLabel
    const names: Record<string, string> = {
      doctor: 'Doctor', nurse: 'Nurse', therapist: 'Therapist',
      lawyer: 'Lawyer', paralegal: 'Paralegal', accountant: 'Accountant',
      financial_advisor: 'Financial Advisor', real_estate_agent: 'Real Estate Agent',
      teacher: 'Teacher', recruiter: 'Recruiter', marketing_manager: 'Marketing Manager',
      software_developer: 'Developer', executive: 'Executive',
      small_business_owner: 'Business Owner'
    }
    return names[persona] || 'Professional'
  }, [persona, customPersonaLabel])

  // Get greeting based on persona
  const getGreeting = useCallback(() => {
    return PERSONA_GREETINGS[persona] || PERSONA_GREETINGS.default
  }, [persona])

  // Initialize with greeting when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = getGreeting()
      setMessages([{
        id: 'greeting',
        role: 'assistant',
        content: greeting,
        timestamp: new Date()
      }])
    }
  }, [isOpen, messages.length, getGreeting])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Find matching workflows based on user input
  const findMatchingWorkflows = useCallback((query: string) => {
    const queryLower = query.toLowerCase()
    const matches = WORKFLOW_DATABASE.filter(workflow => {
      // Check if any keyword matches
      const keywordMatch = workflow.keywords.some(kw => queryLower.includes(kw))
      // Check persona compatibility
      const personaMatch = workflow.personas.includes('all') ||
                          workflow.personas.includes(persona) ||
                          workflow.personas.some(p => persona.includes(p))
      return keywordMatch && personaMatch
    })

    // Sort by relevance (number of matching keywords)
    return matches.sort((a, b) => {
      const aScore = a.keywords.filter(kw => queryLower.includes(kw)).length
      const bScore = b.keywords.filter(kw => queryLower.includes(kw)).length
      return bScore - aScore
    }).slice(0, 3)
  }, [persona])

  // Generate AI response
  const generateResponse = useCallback(async (userMessage: string): Promise<Message> => {
    const matchingWorkflows = findMatchingWorkflows(userMessage)

    const workflowTerm = term('workflow')
    let response: string
    let actions: Array<{ label: string; route: string }> = []

    if (matchingWorkflows.length > 0) {
      if (matchingWorkflows.length === 1) {
        const wf = matchingWorkflows[0]
        response = `I found the perfect ${workflowTerm} for you: **${wf.name}**\n\n${wf.description}\n\nWould you like me to take you there?`
        actions = [{ label: `Open ${wf.name}`, route: wf.route }]
      } else {
        response = `I found ${matchingWorkflows.length} ${workflowTerm}s that match your needs:\n\n${matchingWorkflows.map((wf, i) => `${i + 1}. **${wf.name}** - ${wf.description}`).join('\n\n')}\n\nWhich one would you like to explore?`
        actions = matchingWorkflows.map(wf => ({ label: wf.name, route: wf.route }))
      }
    } else {
      // Contextual responses based on keywords
      const lowerMsg = userMessage.toLowerCase()

      if (lowerMsg.includes('help') || lowerMsg.includes('how')) {
        response = `I'm here to help you automate your work! As a ${personaDisplayName}, you can:\n\n• **Browse Templates** - Pre-built automations for your industry\n• **Create Custom Workflows** - Build your own automation\n• **Connect Integrations** - Link your tools\n\nWhat would you like to do?`
        actions = [
          { label: 'Browse Templates', route: '/templates' },
          { label: 'Create Workflow', route: '/workflow-demo' },
          { label: 'View Integrations', route: '/integrations' }
        ]
      } else if (lowerMsg.includes('integrate') || lowerMsg.includes('connect')) {
        response = `Let's get your tools connected! I'll take you to the integrations page where you can see recommended connections for ${personaDisplayName}s.`
        actions = [{ label: 'Go to Integrations', route: '/integrations' }]
      } else if (lowerMsg.includes('template') || lowerMsg.includes('example')) {
        response = `Great! Our template marketplace has curated ${workflowTerm}s specifically for ${personaDisplayName}s. Let me show you!`
        actions = [{ label: 'View Templates', route: '/templates' }]
      } else if (lowerMsg.includes('automate') || lowerMsg.includes('workflow')) {
        response = `I'd love to help you automate that! Could you tell me more specifically what task or process you want to automate? For example:\n\n• "Automate email responses"\n• "Process invoices automatically"\n• "Schedule meetings"\n• "Generate reports"`
      } else {
        response = `I understand you want to "${userMessage}". Let me help you find the right automation. Could you tell me more about:\n\n1. What specific task takes up your time?\n2. What tools do you currently use?\n3. What would success look like?\n\nOr you can browse our templates to get inspired!`
        actions = [
          { label: 'Browse Templates', route: '/templates' },
          { label: 'Build Custom', route: '/workflow-demo' }
        ]
      }
    }

    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      actions
    }
  }, [findMatchingWorkflows, term, personaDisplayName])

  // Handle sending message
  const handleSend = useCallback(async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    // Simulate AI thinking
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700))

    const response = await generateResponse(inputValue)
    setMessages(prev => [...prev, response])
    setIsTyping(false)
  }, [inputValue, generateResponse])

  // Handle quick action
  const handleQuickAction = useCallback((action: string) => {
    if (action.startsWith('navigate:')) {
      navigate(action.replace('navigate:', ''))
      setIsOpen(false)
    } else if (action.startsWith('prompt:')) {
      const prompt = action.replace('prompt:', '')
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: prompt,
        timestamp: new Date()
      }])
    }
  }, [navigate])

  // Handle action button click
  const handleActionClick = useCallback((route: string) => {
    navigate(route)
    setIsOpen(false)
  }, [navigate])

  // Get quick actions for current page
  const quickActions = useMemo(() => {
    return PAGE_QUICK_ACTIONS[currentPath] || PAGE_QUICK_ACTIONS['/dashboard']
  }, [currentPath])

  // Position classes
  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'side-panel': 'fixed right-0 top-14 h-[calc(100vh-3.5rem)]'
  }

  const chatWindowClasses = {
    'bottom-right': 'bottom-20 right-0',
    'bottom-left': 'bottom-20 left-0',
    'side-panel': 'top-0 right-0 h-full rounded-none'
  }

  return (
    <div className={`${positionClasses[position]} z-50`}>
      {/* Chat Window */}
      {isOpen && (
        <div
          className={`absolute ${chatWindowClasses[position]} w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col`}
          style={{ height: position === 'side-panel' ? '100%' : '500px' }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 border-b border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ProfessionalAvatar agentId="larry" size={40} />
                  <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></span>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Nexus AI Assistant</h3>
                  <p className="text-xs text-slate-400">Your automation guide</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 ${
                    message.role === 'user'
                      ? 'bg-cyan-500/20 text-white ml-4'
                      : 'bg-slate-800 text-slate-200 mr-4'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.actions && message.actions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.actions.map((action, i) => (
                        <button
                          key={i}
                          onClick={() => handleActionClick(action.route)}
                          className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-xs font-medium rounded-full hover:opacity-90 transition-opacity"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-slate-800 rounded-2xl p-3 mr-4">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2">
              <p className="text-xs text-slate-500 mb-2">Quick actions:</p>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickAction(action.action)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-full transition-colors flex items-center gap-1"
                  >
                    <span>{action.icon}</span>
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-slate-700 p-4">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isTyping}
                className="p-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      {position !== 'side-panel' && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`group relative w-14 h-14 rounded-full shadow-lg transition-all duration-300 ${
            isOpen
              ? 'bg-slate-800 rotate-0'
              : 'bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:scale-110'
          }`}
        >
          {isOpen ? (
            <svg className="w-6 h-6 text-white mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              {/* Pulse animation */}
              <span className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 animate-ping opacity-20"></span>
            </>
          )}

          {/* Tooltip */}
          {!isOpen && (
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-800 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Chat with AI Assistant
            </span>
          )}
        </button>
      )}
    </div>
  )
}

// Export a provider that can be used in Layout
export function AIChatProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <AIChatAssistant position="bottom-right" />
    </>
  )
}
