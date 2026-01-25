/**
 * WorkflowChatContext - Persistent chat and workflow state across pages
 *
 * This context maintains:
 * - Chat conversation history
 * - Active workflow proposals
 * - Current execution state
 * - Allows continuing conversation on workflow visualization page
 */

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react'
import { apiClient, type NexusAgent } from '@/lib/api-client'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Message interface
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  agent?: NexusAgent
  isTyping?: boolean
  workflowProposal?: WorkflowProposal
}

// Workflow proposal from chat
export interface WorkflowProposal {
  id: string
  name: string
  description: string
  steps: Array<{
    id: string
    agent: string
    task: string
    tool?: string
    config?: Record<string, unknown>
  }>
  requiredIntegrations?: string[]
  estimatedTimeSaved?: string
  createdAt: Date
}

// Workflow execution state
export interface WorkflowExecutionState {
  workflowId: string
  status: 'idle' | 'planning' | 'executing' | 'paused' | 'completed' | 'failed'
  currentStepIndex: number
  stepStatuses: Record<string, 'pending' | 'running' | 'completed' | 'failed'>
  logs: Array<{ time: string; message: string; type: 'info' | 'success' | 'warning' | 'error' }>
  tokensUsed: number
  costUsd: number
  startedAt?: Date
  completedAt?: Date
}

// Context value interface
interface WorkflowChatContextValue {
  // Chat state
  messages: ChatMessage[]
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  clearMessages: () => void

  // Active workflow
  activeWorkflow: WorkflowProposal | null
  setActiveWorkflow: (workflow: WorkflowProposal | null) => void

  // Execution state
  executionState: WorkflowExecutionState | null
  setExecutionState: (state: WorkflowExecutionState | null) => void
  updateStepStatus: (stepId: string, status: 'pending' | 'running' | 'completed' | 'failed') => void
  addExecutionLog: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void

  // Agent state
  currentAgent: NexusAgent | null
  setCurrentAgent: (agent: NexusAgent | null) => void
  agents: NexusAgent[]

  // Send message
  sendMessage: (content: string) => Promise<void>
  isLoading: boolean

  // Navigation state
  shouldNavigateToWorkflow: boolean
  setShouldNavigateToWorkflow: (value: boolean) => void

  // Workflow execution
  executeWorkflow: () => Promise<void>
  isExecuting: boolean
  sseConnected: boolean
}

const WorkflowChatContext = createContext<WorkflowChatContextValue | undefined>(undefined)

// Storage key
const STORAGE_KEY = 'nexus_workflow_chat_state'

// System prompt for workflow creation
const WORKFLOW_SYSTEM_PROMPT = `You are Nexus, an AI workflow orchestrator. Your goal is to help users create automated workflows QUICKLY with MINIMAL questions.

CRITICAL RULES:
1. NEVER ask more than 1 clarifying question at a time
2. If the user gives ANY automation request, immediately propose a workflow
3. Focus on ACTION, not discussion
4. Default to reasonable assumptions rather than asking
5. After proposing a workflow, ask if the user wants to make changes or proceed

When user describes ANY task they want automated, immediately generate a workflow proposal using this EXACT format:

---WORKFLOW_START---
name: [Short descriptive name]
description: [One sentence description]
steps:
- agent: [agent_id]
  task: [brief task description]
  tool: [tool_name if applicable]
- agent: [agent_id]
  task: [brief task description]
  tool: [tool_name if applicable]
integrations: [comma-separated list of required integrations]
---WORKFLOW_END---

Available agents: larry (Business Analyst), mary (Product Manager), alex (Solutions Architect), sam (Senior Developer), emma (UX Designer), david (DevOps), olivia (QA Lead)

Available tools/integrations: gmail, slack, google_calendar, google_sheets, notion, github, jira, hubspot, salesforce, stripe, composio_search (flights/hotels), yelp, playwright (browser automation)

Example user: "I want to automate email follow-ups"
Example response: "I'll create a workflow for automated email follow-ups:

---WORKFLOW_START---
name: Email Follow-up Automation
description: Automatically send follow-up emails based on triggers
steps:
- agent: larry
  task: Define email triggers and recipient criteria
  tool: gmail
- agent: sam
  task: Build email automation logic
  tool: gmail
- agent: olivia
  task: Test email delivery and timing
  tool: gmail
integrations: gmail
---WORKFLOW_END---

Does this workflow look good? I can make changes if you'd like, or we can proceed to execute it."

IMPORTANT: After showing a workflow, ALWAYS ask if the user wants to modify it or proceed.`

// Provider component
export function WorkflowChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowProposal | null>(null)
  const [executionState, setExecutionState] = useState<WorkflowExecutionState | null>(null)
  const [currentAgent, setCurrentAgent] = useState<NexusAgent | null>(null)
  const [agents, setAgents] = useState<NexusAgent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [shouldNavigateToWorkflow, setShouldNavigateToWorkflow] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [sseConnected, setSseConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.messages) {
          setMessages(parsed.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          })))
        }
        if (parsed.activeWorkflow) {
          setActiveWorkflow({
            ...parsed.activeWorkflow,
            createdAt: new Date(parsed.activeWorkflow.createdAt)
          })
        }
        if (parsed.executionState) {
          setExecutionState(parsed.executionState)
        }
      }
    } catch (e) {
      console.error('Failed to load chat state:', e)
    }
  }, [])

  // Save state to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        messages: messages.filter(m => !m.isTyping),
        activeWorkflow,
        executionState
      }))
    } catch (e) {
      console.error('Failed to save chat state:', e)
    }
  }, [messages, activeWorkflow, executionState])

  // Load agents
  useEffect(() => {
    const loadAgents = async () => {
      try {
        const response = await apiClient.getAgents()
        if (response.success && response.agents) {
          setAgents(response.agents)
          setCurrentAgent(response.agents.find(a => a.id === 'nexus') || null)
        }
      } catch (e) {
        console.error('Failed to load agents:', e)
      }
    }
    loadAgents()
  }, [])

  // Add message
  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])
    return newMessage
  }, [])

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([])
    setActiveWorkflow(null)
    setExecutionState(null)
  }, [])

  // Parse workflow from AI response
  const parseWorkflowProposal = (content: string): WorkflowProposal | null => {
    const workflowMatch = content.match(/---WORKFLOW_START---([\s\S]*?)---WORKFLOW_END---/)
    if (!workflowMatch) return null

    const workflowText = workflowMatch[1]
    const nameMatch = workflowText.match(/name:\s*(.+)/)
    const descMatch = workflowText.match(/description:\s*(.+)/)
    const integrationsMatch = workflowText.match(/integrations:\s*(.+)/)
    const stepsMatches = [...workflowText.matchAll(/- agent:\s*(\w+)\s*\n\s*task:\s*(.+?)(?:\n\s*tool:\s*(\w+))?(?=\n|$)/g)]

    if (!nameMatch || stepsMatches.length === 0) return null

    return {
      id: `wf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: nameMatch[1].trim(),
      description: descMatch?.[1]?.trim() || '',
      steps: stepsMatches.map((m, i) => ({
        id: `step_${i}`,
        agent: m[1].trim(),
        task: m[2].trim(),
        tool: m[3]?.trim()
      })),
      requiredIntegrations: integrationsMatch?.[1]?.split(',').map(s => s.trim()) || [],
      createdAt: new Date()
    }
  }

  // Send message and get AI response
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return

    setIsLoading(true)

    // Add user message
    addMessage({
      role: 'user',
      content: content.trim()
    })

    // Add typing indicator
    const typingId = `typing_${Date.now()}`
    setMessages(prev => [...prev, {
      id: typingId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isTyping: true
    }])

    try {
      // Build conversation history
      const conversationMessages = messages
        .filter(m => !m.isTyping)
        .map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        }))
        .concat([{ role: 'user' as const, content }])

      // Call API
      const response = await apiClient.chat({
        messages: conversationMessages,
        systemPrompt: WORKFLOW_SYSTEM_PROMPT,
        model: 'claude-sonnet-4-20250514',
        maxTokens: 2048,
        autoRoute: true
      })

      // Remove typing indicator
      setMessages(prev => prev.filter(m => m.id !== typingId))

      if (response.success) {
        let responseContent = response.output

        // Check for workflow proposal
        const proposal = parseWorkflowProposal(responseContent)
        if (proposal) {
          setActiveWorkflow(proposal)
          // Clean the display content
          responseContent = responseContent.replace(/---WORKFLOW_START---[\s\S]*?---WORKFLOW_END---/, '').trim()
        }

        // Update current agent
        if (response.agent) {
          setCurrentAgent(response.agent)
        }

        // Add assistant message
        addMessage({
          role: 'assistant',
          content: responseContent || "I've prepared a workflow for you. Would you like to proceed or make any changes?",
          agent: response.agent,
          workflowProposal: proposal || undefined
        })
      } else {
        throw new Error(response.error || 'Unknown error')
      }
    } catch (error) {
      // Remove typing indicator
      setMessages(prev => prev.filter(m => m.id !== typingId))

      addMessage({
        role: 'assistant',
        content: `I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`
      })
    } finally {
      setIsLoading(false)
    }
  }, [messages, isLoading, addMessage])

  // Update step status
  const updateStepStatus = useCallback((stepId: string, status: 'pending' | 'running' | 'completed' | 'failed') => {
    setExecutionState(prev => {
      if (!prev) return null
      return {
        ...prev,
        stepStatuses: {
          ...prev.stepStatuses,
          [stepId]: status
        }
      }
    })
  }, [])

  // Add execution log
  const addExecutionLog = useCallback((message: string, type: 'info' | 'success' | 'warning' | 'error') => {
    setExecutionState(prev => {
      if (!prev) return null
      return {
        ...prev,
        logs: [
          ...prev.logs,
          { time: new Date().toLocaleTimeString(), message, type }
        ].slice(-50) // Keep last 50 logs
      }
    })
  }, [])

  // Connect to SSE for workflow updates
  const connectSSE = useCallback((workflowId: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const sseUrl = `${API_URL}/api/sse/workflow/${workflowId}`
    const eventSource = new EventSource(sseUrl)

    eventSource.onopen = () => {
      setSseConnected(true)
      addExecutionLog('Connected to real-time updates', 'info')
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        switch (data.type) {
          case 'step_started':
            updateStepStatus(data.stepId, 'running')
            addExecutionLog(`Step ${data.stepId} started via ${data.data?.provider || 'unknown'}`, 'info')
            break

          case 'step_completed':
            updateStepStatus(data.stepId, 'completed')
            setExecutionState(prev => prev ? {
              ...prev,
              tokensUsed: prev.tokensUsed + (data.data?.tokensUsed || 0),
              costUsd: prev.costUsd + (data.data?.costUsd || 0)
            } : null)
            addExecutionLog(`Step ${data.stepId} completed in ${data.data?.durationMs || 0}ms`, 'success')
            break

          case 'step_failed':
            updateStepStatus(data.stepId, 'failed')
            addExecutionLog(`Step ${data.stepId} failed: ${data.data?.error || 'Unknown error'}`, 'error')
            break

          case 'workflow_completed':
            setExecutionState(prev => prev ? {
              ...prev,
              status: 'completed',
              completedAt: new Date(),
              tokensUsed: data.data?.totalTokens || prev.tokensUsed,
              costUsd: data.data?.totalCost || prev.costUsd
            } : null)
            setIsExecuting(false)
            addExecutionLog('Workflow completed successfully!', 'success')
            // Add completion message to chat
            addMessage({
              role: 'assistant',
              content: `Workflow "${activeWorkflow?.name}" completed successfully! Cost: $${(data.data?.totalCost || 0).toFixed(4)}`
            })
            break

          case 'workflow_failed':
            setExecutionState(prev => prev ? {
              ...prev,
              status: 'failed',
              completedAt: new Date()
            } : null)
            setIsExecuting(false)
            addExecutionLog(`Workflow failed: ${data.data?.error || 'Unknown error'}`, 'error')
            addMessage({
              role: 'assistant',
              content: `Workflow execution failed: ${data.data?.error || 'Unknown error'}. Would you like me to try again or modify the workflow?`
            })
            break
        }
      } catch (err) {
        console.error('SSE parse error:', err)
      }
    }

    eventSource.onerror = () => {
      setSseConnected(false)
      addExecutionLog('Lost connection to updates', 'warning')
    }

    eventSourceRef.current = eventSource
  }, [addExecutionLog, updateStepStatus, addMessage, activeWorkflow])

  // Execute the active workflow
  const executeWorkflow = useCallback(async () => {
    if (!activeWorkflow || isExecuting) return

    setIsExecuting(true)
    addExecutionLog(`Starting workflow: ${activeWorkflow.name}`, 'info')

    // Initialize execution state
    const initialStepStatuses: Record<string, 'pending' | 'running' | 'completed' | 'failed'> = {}
    activeWorkflow.steps.forEach(step => {
      initialStepStatuses[step.id] = 'pending'
    })

    setExecutionState({
      workflowId: activeWorkflow.id,
      status: 'executing',
      currentStepIndex: 0,
      stepStatuses: initialStepStatuses,
      logs: [{ time: new Date().toLocaleTimeString(), message: 'Workflow execution started', type: 'info' }],
      tokensUsed: 0,
      costUsd: 0,
      startedAt: new Date()
    })

    try {
      // Connect to SSE first
      connectSSE(activeWorkflow.id)

      // Call the workflow execution API
      const response = await fetch(`${API_URL}/api/integrations/workflow/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workflow: {
            id: activeWorkflow.id,
            name: activeWorkflow.name,
            description: activeWorkflow.description,
            steps: activeWorkflow.steps.map((step, index) => ({
              id: step.id,
              name: step.task,
              agent: step.agent,
              task: step.task,
              tool: step.tool,
              config: step.config,
              dependencies: index > 0 ? [activeWorkflow.steps[index - 1].id] : []
            })),
            requiredIntegrations: activeWorkflow.requiredIntegrations
          },
          inputs: {},
          options: {
            autonomyLevel: 'autonomous',
            maxCostUsd: 10
          }
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Workflow execution failed')
      }

      addExecutionLog('Workflow execution in progress...', 'info')

    } catch (error) {
      console.error('Workflow execution error:', error)
      setExecutionState(prev => prev ? { ...prev, status: 'failed' } : null)
      setIsExecuting(false)
      addExecutionLog(`Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
      addMessage({
        role: 'assistant',
        content: `I encountered an error executing the workflow: ${error instanceof Error ? error.message : 'Unknown error'}. Would you like me to try again?`
      })
    }
  }, [activeWorkflow, isExecuting, addExecutionLog, connectSSE, addMessage])

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  const value: WorkflowChatContextValue = {
    messages,
    addMessage,
    clearMessages,
    activeWorkflow,
    setActiveWorkflow,
    executionState,
    setExecutionState,
    updateStepStatus,
    addExecutionLog,
    currentAgent,
    setCurrentAgent,
    agents,
    sendMessage,
    isLoading,
    shouldNavigateToWorkflow,
    setShouldNavigateToWorkflow,
    executeWorkflow,
    isExecuting,
    sseConnected
  }

  return (
    <WorkflowChatContext.Provider value={value}>
      {children}
    </WorkflowChatContext.Provider>
  )
}

// Hook to use the context
export function useWorkflowChat() {
  const context = useContext(WorkflowChatContext)
  if (!context) {
    throw new Error('useWorkflowChat must be used within a WorkflowChatProvider')
  }
  return context
}

export default WorkflowChatContext
