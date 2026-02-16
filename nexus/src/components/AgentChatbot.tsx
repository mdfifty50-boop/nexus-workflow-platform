import { useState, useRef, useEffect, useMemo } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { apiClient, type NexusAgent } from '@/lib/api-client'
import { composioClient, TOOL_SLUGS } from '@/services/ComposioClient'
import { usePersonalization } from '@/contexts/PersonalizationContext'

// BMADAgent is now NexusAgent - type alias for backward compatibility
type BMADAgent = NexusAgent

interface ImageAttachment {
  file: File
  preview: string
  base64?: string
  mimeType: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  agent?: BMADAgent  // Which BMAD agent sent this message
  images?: Array<{ preview: string; mimeType: string }>  // Attached images
  metadata?: {
    tokensUsed?: number
    costUSD?: number
    action?: string
    result?: any
  }
}

interface WorkflowProposal {
  name: string
  description: string
  type: 'BMAD' | 'Simple' | 'Scheduled'
  complexity: 'simple' | 'medium' | 'complex'
  steps?: Array<{
    type: string
    label: string
    config: Record<string, any>
  }>
  estimatedTokens?: number
  estimatedCostUSD?: number
  integrations?: string[]
}

interface ExecutionPlan {
  tasks: Array<{
    id: string
    name: string
    type: 'agent' | 'integration' | 'transform' | 'condition'
    agentId?: string
    integrationId?: string
    description: string
    dependencies: string[]
    config: Record<string, unknown>
    estimatedTokens: number
  }>
  requiredIntegrations: string[]
  totalEstimatedTokens: number
  totalEstimatedCostUSD: number
  complexity: 'simple' | 'medium' | 'complex'
}

interface PendingWorkflow {
  id: string
  name: string
  status: string
  plan?: ExecutionPlan
}

interface QuickAction {
  id: string
  label: string
  icon: string
  action: string
  description: string
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'send-email',
    label: 'Send Email',
    icon: '📧',
    action: 'email',
    description: 'Send an email to someone',
  },
  {
    id: 'analyze-doc',
    label: 'Analyze Document',
    icon: '📄',
    action: 'analyze',
    description: 'Upload and analyze a document',
  },
  {
    id: 'crm-contact',
    label: 'Add CRM Contact',
    icon: '👤',
    action: 'crm',
    description: 'Create a new contact in HubSpot',
  },
  {
    id: 'automate',
    label: 'Build Automation',
    icon: '⚡',
    action: 'workflow',
    description: 'Create an automated workflow',
  },
]

const SYSTEM_PROMPT = `You are Nexus, an AI workflow assistant that helps users automate business tasks.

Your capabilities (REAL execution via Composio - 500+ app integrations):
1. Send emails (Gmail, Outlook)
2. Manage CRM contacts (HubSpot, Salesforce)
3. Create calendar events (Google Calendar)
4. Send Slack messages
5. Create GitHub issues/PRs
6. Read/write Google Sheets
7. Create automated multi-step workflows
8. Analyze documents, images, and screenshots
9. Discord messages, Notion pages, and more

## MULTI-TURN CLARIFICATION PROTOCOL

When a user's request is vague or incomplete, you MUST ask specific clarifying questions before proceeding. Follow this protocol:

### For CRM automation requests (e.g., "automate my CRM"):
1. "Which CRM are you using? (Salesforce, HubSpot, Pipedrive, or Other)"
2. "What specific task would you like to automate?" with options like:
   - Update contacts
   - Create leads
   - Generate reports
   - Sync data between systems
3. "How often should this run?" (Daily, Weekly, On-demand, Triggered by event)

### For email automation requests:
1. "What type of emails?" (Marketing, Transactional, Follow-ups, Reports)
2. "What triggers the email?" (Schedule, User action, Data change, Manual)
3. "Who are the recipients?" (Single contact, List, Dynamic based on criteria)

### For general workflow requests:
1. "What's the end result you're hoping to achieve?"
2. "What systems or data sources are involved?"
3. "Should this be automatic, scheduled, or manually triggered?"

### IMPORTANT CLARIFICATION RULES:
- Ask ONE clarifying question at a time (don't overwhelm the user)
- Provide clear options when possible (numbered or bulleted)
- After receiving an answer, ask the NEXT relevant question
- Continue until you have enough information to propose a complete workflow
- If the user provides a screenshot/image, analyze it and ask targeted questions about what they want to automate from what you see

## When you have enough information

Once you've gathered sufficient details through clarification, generate a workflow proposal:

WORKFLOW_PROPOSAL:
Name: [descriptive name]
Description: [what it does]
Type: [BMAD/Simple/Scheduled]
Complexity: [simple/medium/complex]

## IMMEDIATE ACTION FORMAT

When the user explicitly wants to execute something NOW (not create a workflow):
ACTION_REQUEST:
type: [email|crm|slack|calendar|github|sheets|workflow|analysis]
data: [JSON object with action details]

For email: { "to": "email@example.com", "subject": "...", "body": "..." }
For CRM: { "action": "createContact", "email": "...", "firstName": "...", "lastName": "..." }
For slack: { "channel": "#general", "text": "Hello team!" }
For calendar: { "title": "Meeting", "startTime": "2024-01-15T10:00:00Z", "endTime": "2024-01-15T11:00:00Z", "attendees": ["email@example.com"] }
For github: { "owner": "username", "repo": "reponame", "title": "Issue title", "body": "Issue description" }
For sheets: { "spreadsheetId": "...", "range": "Sheet1!A1:B10", "action": "read" } or { "spreadsheetId": "...", "range": "Sheet1!A1", "values": [["data"]], "action": "append" }
For workflow: { "name": "...", "description": "...", "steps": [{ "toolSlug": "GMAIL_SEND_EMAIL", "params": {...} }] }

Be conversational, helpful, and proactive. Never execute without confirmation.`

// Default Nexus agent (fallback if API unavailable)
const DEFAULT_AGENT: BMADAgent = {
  id: 'nexus',
  name: 'Nexus',
  title: 'AI Orchestrator',
  avatar: '🤖',
  color: '#14B8A6'
}

export function AgentChatbot({ userId, projectId }: { userId?: string; projectId?: string }) {
  const { getAgentInfo, term, personaInfo } = usePersonalization()
  const [isOpen, setIsOpen] = useState(false)
  const [availableAgents, setAvailableAgents] = useState<BMADAgent[]>([DEFAULT_AGENT])
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null) // null = auto-route
  const [showAgentSelector, setShowAgentSelector] = useState(false)

  // Build personalized welcome message
  const welcomeMessage = useMemo(() => {
    const nexusInfo = getAgentInfo('nexus')
    const larryInfo = getAgentInfo('larry')
    const maryInfo = getAgentInfo('mary')
    const alexInfo = getAgentInfo('alex')
    const samInfo = getAgentInfo('sam')
    const emmaInfo = getAgentInfo('emma')

    return `Hi! I'm **${nexusInfo.name}**, ${nexusInfo.title.toLowerCase()}. I lead your ${term('team')}:

• 👔 **${larryInfo.name}** - ${larryInfo.title}
• 👩‍💼 **${maryInfo.name}** - ${maryInfo.title}
• 🏗️ **${alexInfo.name}** - ${alexInfo.title}
• 💻 **${samInfo.name}** - ${samInfo.title}
• 🎨 **${emmaInfo.name}** - ${emmaInfo.title}

${personaInfo.tagline}

Just describe what you need and I'll route it to the right expert, or pick a specific agent below!`
  }, [getAgentInfo, term, personaInfo])

  const [messages, setMessages] = useState<Message[]>(() => [{
    id: '1',
    role: 'assistant',
    content: welcomeMessage,
    timestamp: new Date(),
    agent: DEFAULT_AGENT,
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [workflowProposal, setWorkflowProposal] = useState<WorkflowProposal | null>(null)
  const [pendingAction, setPendingAction] = useState<{
    type: string
    data: any
    description: string
  } | null>(null)
  const [apiStatus, setApiStatus] = useState<'unknown' | 'connected' | 'error'>('unknown')
  const [attachedImages, setAttachedImages] = useState<ImageAttachment[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Array<{
    projectId: string
    projectName: string
    snippet: string
    date: string
    conversationId: string
  }>>([])
  const [pendingWorkflow, setPendingWorkflow] = useState<PendingWorkflow | null>(null)
  const [isPlanning, setIsPlanning] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Check API status and load agents on mount
  useEffect(() => {
    const initChat = async () => {
      try {
        // Load available agents
        const agentsResponse = await apiClient.getAgents()
        if (agentsResponse.success && agentsResponse.agents) {
          setAvailableAgents(agentsResponse.agents)
        }
        setApiStatus('connected')
      } catch {
        setApiStatus('error')
      }
    }
    if (isOpen) {
      initChat()
    }
  }, [isOpen])

  // Image handling functions
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const result = reader.result as string
        // Remove the data:image/xxx;base64, prefix
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = (error) => reject(error)
    })
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingImage(true)
    try {
      const newAttachments: ImageAttachment[] = []

      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          console.warn('Skipping non-image file:', file.name)
          continue
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          console.warn('File too large:', file.name)
          continue
        }

        const base64 = await fileToBase64(file)
        const preview = URL.createObjectURL(file)

        newAttachments.push({
          file,
          preview,
          base64,
          mimeType: file.type,
        })
      }

      // Limit to 4 images max
      setAttachedImages((prev) => [...prev, ...newAttachments].slice(0, 4))
    } catch (error) {
      console.error('Error processing images:', error)
    } finally {
      setUploadingImage(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeAttachedImage = (index: number) => {
    setAttachedImages((prev) => {
      const newImages = [...prev]
      // Revoke object URL to prevent memory leaks
      URL.revokeObjectURL(newImages[index].preview)
      newImages.splice(index, 1)
      return newImages
    })
  }

  const parseActionRequest = (content: string) => {
    if (content.includes('ACTION_REQUEST:')) {
      const lines = content.split('\n')
      const typeIndex = lines.findIndex((l) => l.startsWith('type:'))
      const dataIndex = lines.findIndex((l) => l.startsWith('data:'))

      if (typeIndex !== -1 && dataIndex !== -1) {
        const type = lines[typeIndex].replace('type:', '').trim()
        const dataStr = lines
          .slice(dataIndex)
          .join('\n')
          .replace('data:', '')
          .trim()

        try {
          const data = JSON.parse(dataStr)
          return { type, data }
        } catch {
          // Try to find JSON in the remaining text
          const jsonMatch = dataStr.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            try {
              return { type, data: JSON.parse(jsonMatch[0]) }
            } catch {
              return null
            }
          }
        }
      }
    }
    return null
  }

  const parseWorkflowProposal = (content: string): WorkflowProposal | null => {
    if (content.includes('WORKFLOW_PROPOSAL:')) {
      const lines = content.split('\n')
      const complexity = (lines.find((l) => l.startsWith('Complexity:'))?.replace('Complexity:', '').trim() as any) || 'medium'

      // Estimate tokens and cost based on complexity
      const complexityEstimates: Record<string, { tokens: number; cost: number; steps: number }> = {
        simple: { tokens: 150, cost: 0.02, steps: 2 },
        medium: { tokens: 350, cost: 0.05, steps: 4 },
        complex: { tokens: 800, cost: 0.12, steps: 7 },
      }
      const estimate = complexityEstimates[complexity] || complexityEstimates.medium

      // Parse integrations if mentioned
      const integrationsLine = lines.find((l) => l.toLowerCase().includes('integrations:'))
      const integrations = integrationsLine
        ? integrationsLine.replace(/integrations:/i, '').trim().split(/[,&]/).map((s) => s.trim()).filter(Boolean)
        : detectIntegrations(content)

      return {
        name: lines.find((l) => l.startsWith('Name:'))?.replace('Name:', '').trim() || 'New Workflow',
        description: lines.find((l) => l.startsWith('Description:'))?.replace('Description:', '').trim() || '',
        type: (lines.find((l) => l.startsWith('Type:'))?.replace('Type:', '').trim() as any) || 'BMAD',
        complexity,
        estimatedTokens: estimate.tokens,
        estimatedCostUSD: estimate.cost,
        integrations,
        steps: Array.from({ length: estimate.steps }, (_, i) => ({
          type: 'step',
          label: `Step ${i + 1}`,
          config: {},
        })),
      }
    }
    return null
  }

  // Helper to detect integrations mentioned in workflow description
  const detectIntegrations = (content: string): string[] => {
    const integrationKeywords: Record<string, string> = {
      salesforce: 'Salesforce',
      hubspot: 'HubSpot',
      pipedrive: 'Pipedrive',
      gmail: 'Gmail',
      outlook: 'Outlook',
      email: 'Email',
      calendar: 'Calendar',
      slack: 'Slack',
      crm: 'CRM',
      spreadsheet: 'Spreadsheet',
      excel: 'Excel',
      google: 'Google',
    }

    const detected: string[] = []
    const lowerContent = content.toLowerCase()

    for (const [keyword, label] of Object.entries(integrationKeywords)) {
      if (lowerContent.includes(keyword) && !detected.includes(label)) {
        detected.push(label)
      }
    }

    return detected.length > 0 ? detected : ['Nexus AI']
  }

  const executeAction = async (type: string, data: any): Promise<{ success: boolean; result: any }> => {
    try {
      // Initialize Composio client if needed
      if (!composioClient.isInitialized) {
        await composioClient.initialize()
      }

      switch (type) {
        case 'email': {
          // Use Composio for REAL email sending via Gmail
          const result = await composioClient.sendEmail({
            to: data.to,
            subject: data.subject,
            body: data.body,
          })
          return {
            success: result.success,
            result: result.success
              ? { data: result.data, isDemoMode: composioClient.isDemoMode }
              : { error: result.error, isDemoMode: composioClient.isDemoMode }
          }
        }

        case 'crm': {
          // Use Composio for REAL CRM operations via HubSpot
          const toolSlug = data.action === 'createContact'
            ? TOOL_SLUGS.hubspot.createContact
            : TOOL_SLUGS.hubspot.searchContacts

          const result = await composioClient.executeTool(toolSlug, {
            email: data.email,
            firstname: data.firstName,
            lastname: data.lastName,
            phone: data.phone,
            company: data.company,
          })
          return {
            success: result.success,
            result: result.success
              ? { data: result.data, isDemoMode: composioClient.isDemoMode }
              : { error: result.error, isDemoMode: composioClient.isDemoMode }
          }
        }

        case 'slack': {
          // Use Composio for REAL Slack messaging
          const result = await composioClient.sendSlackMessage({
            channel: data.channel,
            text: data.text || data.message,
            threadTs: data.threadTs,
          })
          return {
            success: result.success,
            result: result.success
              ? { data: result.data, isDemoMode: composioClient.isDemoMode }
              : { error: result.error, isDemoMode: composioClient.isDemoMode }
          }
        }

        case 'calendar': {
          // Use Composio for REAL calendar event creation
          const result = await composioClient.createCalendarEvent({
            title: data.title || data.summary,
            startTime: data.startTime || data.start,
            endTime: data.endTime || data.end,
            description: data.description,
            attendees: data.attendees,
            location: data.location,
          })
          return {
            success: result.success,
            result: result.success
              ? { data: result.data, isDemoMode: composioClient.isDemoMode }
              : { error: result.error, isDemoMode: composioClient.isDemoMode }
          }
        }

        case 'github': {
          // Use Composio for REAL GitHub operations
          const result = await composioClient.createGitHubIssue({
            owner: data.owner,
            repo: data.repo,
            title: data.title,
            body: data.body,
            labels: data.labels,
          })
          return {
            success: result.success,
            result: result.success
              ? { data: result.data, isDemoMode: composioClient.isDemoMode }
              : { error: result.error, isDemoMode: composioClient.isDemoMode }
          }
        }

        case 'sheets': {
          // Use Composio for REAL Google Sheets operations
          const result = data.action === 'read'
            ? await composioClient.readSpreadsheet({
                spreadsheetId: data.spreadsheetId,
                range: data.range,
              })
            : await composioClient.appendToSpreadsheet({
                spreadsheetId: data.spreadsheetId,
                range: data.range,
                values: data.values,
              })
          return {
            success: result.success,
            result: result.success
              ? { data: result.data, isDemoMode: composioClient.isDemoMode }
              : { error: result.error, isDemoMode: composioClient.isDemoMode }
          }
        }

        case 'workflow': {
          // Execute a full workflow - multiple tools in sequence
          if (data.steps && Array.isArray(data.steps)) {
            const tools = data.steps.map((step: any) => ({
              toolSlug: step.toolSlug,
              params: step.params || {},
            }))
            const batchResult = await composioClient.executeBatch(tools)
            return {
              success: batchResult.success,
              result: {
                results: batchResult.results,
                successCount: batchResult.successCount,
                failureCount: batchResult.failureCount,
                isDemoMode: composioClient.isDemoMode,
              }
            }
          }
          return { success: true, result: { message: 'Workflow created', isDemoMode: composioClient.isDemoMode } }
        }

        default:
          // For any other action type, try to execute it as a generic tool
          if (data.toolSlug) {
            const result = await composioClient.executeTool(data.toolSlug, data.params || data)
            return {
              success: result.success,
              result: result.success
                ? { data: result.data, isDemoMode: composioClient.isDemoMode }
                : { error: result.error, isDemoMode: composioClient.isDemoMode }
            }
          }
          return { success: false, result: { error: `Unknown action type: ${type}` } }
      }
    } catch (error: any) {
      return { success: false, result: { error: error.message, isDemoMode: composioClient.isDemoMode } }
    }
  }

  const handleSend = async () => {
    if ((!input.trim() && attachedImages.length === 0) || loading) return

    // Build user message with images
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input || (attachedImages.length > 0 ? '[Image attached]' : ''),
      timestamp: new Date(),
      images: attachedImages.map((img) => ({
        preview: img.preview,
        mimeType: img.mimeType,
      })),
    }

    // Save images for API call before clearing
    const imagesToSend = attachedImages.map((img) => ({
      type: 'image' as const,
      source: {
        type: 'base64' as const,
        media_type: img.mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
        data: img.base64!,
      },
    }))

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setAttachedImages([])
    setLoading(true)

    try {
      // Detect if this is an executable command (action words like "send", "create", "schedule", etc.)
      const isExecutableCommand = /\b(send|create|schedule|add|update|delete|book|order|call|message|email|post|share|download|upload)\b/i.test(input)

      // If it looks like an action command, try to execute it through the orchestrator
      if (isExecutableCommand && !attachedImages.length) {
        try {
          console.log('[AgentChatbot] Detected executable command, routing to orchestrator')

          const execResult = await apiClient.executeCommand({
            command: input,
            userId: undefined, // TODO: Get from auth context when available
            autoExecute: true,
            skipClarification: false,
          })

          if (execResult.success && execResult.session) {
            // Workflow executed successfully
            const session = execResult.session
            const statusMessage = session.messages.join('\n')

            const executionMessage: Message = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: `✓ Workflow executed!\n\n${statusMessage}\n\nStatus: ${session.status}`,
              timestamp: new Date(),
              agent: DEFAULT_AGENT,
            }

            setMessages((prev) => [...prev, executionMessage])
            setLoading(false)
            return
          }
        } catch (execError) {
          console.log('[AgentChatbot] Orchestrator execution failed, falling back to chat:', execError)
          // Fall through to regular chat if execution fails
        }
      }

      // Build conversation history for Claude
      const conversationMessages = messages
        .slice(-8)
        .concat(userMessage)
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }))

      // Call secure backend API with BMAD agent routing
      const response = await apiClient.chat({
        messages: conversationMessages,
        systemPrompt: selectedAgent ? undefined : SYSTEM_PROMPT, // Use agent personality if selected
        model: 'claude-opus-4-6-20250115',
        maxTokens: 2048,
        agentId: selectedAgent || undefined,
        autoRoute: !selectedAgent, // Auto-route if no specific agent selected
        images: imagesToSend.length > 0 ? imagesToSend : undefined, // Include images if attached
      })

      if (!response.success) {
        throw new Error(response.error || 'Failed to get response')
      }

      let assistantContent = response.output

      // Check for action requests
      const actionRequest = parseActionRequest(assistantContent)
      if (actionRequest) {
        // Clean up the content to show without the raw action format
        assistantContent = assistantContent
          .replace(/ACTION_REQUEST:[\s\S]*$/m, '')
          .trim()

        setPendingAction({
          type: actionRequest.type,
          data: actionRequest.data,
          description: getActionDescription(actionRequest.type, actionRequest.data),
        })
      }

      // Check for workflow proposals
      const proposal = parseWorkflowProposal(assistantContent)
      if (proposal) {
        setWorkflowProposal(proposal)
        // Clean up content
        assistantContent = assistantContent
          .replace(/WORKFLOW_PROPOSAL:[\s\S]*$/m, '')
          .trim()
      }

      // Get responding agent from response or use default
      const respondingAgent = response.agent || DEFAULT_AGENT

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent || response.output,
        timestamp: new Date(),
        agent: respondingAgent,
        metadata: {
          tokensUsed: response.usage?.totalTokens || response.tokensUsed || 0,
          costUSD: calculateCost(response.usage?.totalTokens || response.tokensUsed || 0),
        },
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error: any) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I apologize, I encountered an error: ${error.message}.

${apiStatus === 'error' ? '⚠️ **Backend API not configured.** Please ensure ANTHROPIC_API_KEY is set in your Vercel environment variables.' : 'Please try again.'}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const getActionDescription = (type: string, data: any): string => {
    switch (type) {
      case 'email':
        return `Send email to ${data.to} with subject "${data.subject}"`
      case 'crm':
        return `Create CRM contact for ${data.email}`
      case 'slack':
        return `Send Slack message to ${data.channel}`
      case 'calendar':
        return `Create calendar event "${data.title || data.summary}"`
      case 'github':
        return `Create GitHub issue "${data.title}" in ${data.owner}/${data.repo}`
      case 'sheets':
        return `${data.action === 'read' ? 'Read from' : 'Write to'} Google Sheet`
      case 'workflow':
        return `Execute workflow "${data.name}" with ${data.steps?.length || 0} steps`
      default:
        return `Execute ${type} action via Composio`
    }
  }

  const calculateCost = (tokens: number): number => {
    // Haiku pricing: $1/M input, $5/M output (estimate 50/50 split)
    return Number(((tokens / 1_000_000) * 3).toFixed(6))
  }

  const handleConfirmAction = async () => {
    if (!pendingAction) return

    setLoading(true)
    try {
      const { success, result } = await executeAction(pendingAction.type, pendingAction.data)

      // Check if we're in demo mode
      const isDemoMode = result?.isDemoMode === true
      const demoModeIndicator = isDemoMode ? '\n\n⚠️ **Demo Mode** - Set COMPOSIO_API_KEY for real execution' : ''

      const resultMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: success
          ? `✅ **Action completed ${isDemoMode ? '(Demo)' : 'successfully'}!**\n\n${JSON.stringify(result, null, 2)}${demoModeIndicator}`
          : `❌ **Action failed:** ${result.error || 'Unknown error'}${demoModeIndicator}`,
        timestamp: new Date(),
        metadata: { action: pendingAction.type, result },
      }

      setMessages((prev) => [...prev, resultMessage])
    } catch (error: any) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `❌ **Error executing action:** ${error.message}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setPendingAction(null)
      setLoading(false)
    }
  }

  const handleCreateWorkflow = async () => {
    if (!workflowProposal || !userId) return

    setIsPlanning(true)

    try {
      let targetProjectId = projectId

      // If no project context, create a new project first
      if (!projectId) {
        const projectResponse = await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Clerk-User-Id': userId,
          },
          body: JSON.stringify({
            name: `${workflowProposal.name} Project`,
            description: `Created from AI conversation: ${workflowProposal.description}`,
          }),
        })
        const projectResult = await projectResponse.json()
        if (!projectResult.success) throw new Error(projectResult.error)
        targetProjectId = projectResult.data.id
      }

      // Get the user input from conversation history
      const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')
      const userInput = lastUserMessage?.content || workflowProposal.description

      // Create workflow via API (Story 4.1)
      const createResponse = await fetch('/api/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': userId,
        },
        body: JSON.stringify({
          project_id: targetProjectId,
          name: workflowProposal.name,
          description: workflowProposal.description,
          workflow_type: workflowProposal.type,
          user_input: userInput,
          config: {
            prompt: workflowProposal.description,
            complexity: workflowProposal.complexity,
            steps: workflowProposal.steps || [],
            integrations: workflowProposal.integrations || [],
            estimatedTokens: workflowProposal.estimatedTokens || 0,
            estimatedCostUSD: workflowProposal.estimatedCostUSD || 0,
          },
        }),
      })

      const createResult = await createResponse.json()
      if (!createResult.success) throw new Error(createResult.error)

      const workflow = createResult.data

      // Show planning message
      const planningMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `✅ **Workflow created!** "${workflowProposal.name}"

🔄 **Planning Stage**: The BMAD Director is analyzing your request and generating an execution plan...`,
        timestamp: new Date(),
        agent: DEFAULT_AGENT,
      }
      setMessages((prev) => [...prev, planningMessage])
      setWorkflowProposal(null)

      // Start BMAD planning stage (Story 4.2)
      const planResponse = await fetch(`/api/workflows/${workflow.id}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': userId,
        },
      })

      const planResult = await planResponse.json()

      if (!planResult.success) {
        throw new Error(planResult.error || 'Planning failed')
      }

      // Store pending workflow with plan for approval
      setPendingWorkflow({
        id: workflow.id,
        name: workflow.name,
        status: 'pending_approval',
        plan: planResult.plan,
      })

      // Show execution plan for approval
      const plan = planResult.plan as ExecutionPlan
      const planMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: `📋 **Execution Plan Ready!**

The BMAD Director has analyzed your request and created the following plan:

**Tasks (${plan.tasks.length}):**
${plan.tasks.map((t, i) => `${i + 1}. **${t.name}** - ${t.description}`).join('\n')}

**Required Integrations:** ${plan.requiredIntegrations.join(', ') || 'None'}
**Estimated Tokens:** ${plan.totalEstimatedTokens.toLocaleString()}
**Estimated Cost:** $${plan.totalEstimatedCostUSD.toFixed(4)}
**Complexity:** ${plan.complexity}

Review the plan above and click **Approve & Execute** to proceed, or describe any changes you'd like.`,
        timestamp: new Date(),
        agent: DEFAULT_AGENT,
      }
      setMessages((prev) => [...prev, planMessage])
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ I couldn't complete the planning stage: ${error.message}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
      setPendingWorkflow(null)
    } finally {
      setIsPlanning(false)
    }
  }

  // Approve and execute the pending workflow (Story 4.4)
  const handleApproveWorkflow = async () => {
    if (!pendingWorkflow || !userId) return

    setLoading(true)

    try {
      // Approve the plan (transitions to orchestrating → building)
      const approveResponse = await fetch(`/api/workflows/${pendingWorkflow.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': userId,
        },
      })

      const approveResult = await approveResponse.json()
      if (!approveResult.success) throw new Error(approveResult.error)

      // Execute the workflow
      const executeMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚡ **Executing workflow...** "${pendingWorkflow.name}"

The BMAD agents are now working on your request. This may take a moment.`,
        timestamp: new Date(),
        agent: DEFAULT_AGENT,
      }
      setMessages((prev) => [...prev, executeMessage])

      const executeResponse = await fetch(`/api/workflows/${pendingWorkflow.id}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': userId,
        },
      })

      const executeResult = await executeResponse.json()

      if (!executeResult.success) {
        throw new Error(executeResult.error)
      }

      // Success!
      const successMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: `✅ **Workflow Completed!** "${pendingWorkflow.name}"

All tasks have been executed successfully.

[View Results →](/workflows/${pendingWorkflow.id})

Is there anything else you'd like me to help you with?`,
        timestamp: new Date(),
        agent: DEFAULT_AGENT,
      }
      setMessages((prev) => [...prev, successMessage])
      setPendingWorkflow(null)
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ Execution error: ${error.message}

[View Workflow →](/workflows/${pendingWorkflow.id})

Would you like me to try again or modify the plan?`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleQuickAction = (action: QuickAction) => {
    const prompts: Record<string, string> = {
      email: "I'd like to send an email",
      analyze: "I'd like to analyze a document",
      crm: "I'd like to add a new contact to my CRM",
      workflow: "I'd like to create an automated workflow",
    }
    setInput(prompts[action.action] || action.description)
  }

  // Handle editing a previous message
  const handleEditMessage = (messageId: string) => {
    const messageToEdit = messages.find((m) => m.id === messageId)
    if (!messageToEdit || messageToEdit.role !== 'user') return

    // Set the input to the message content
    setInput(messageToEdit.content === '[Image attached]' ? '' : messageToEdit.content)
    setEditingMessageId(messageId)
  }

  // Cancel edit mode
  const handleCancelEdit = () => {
    setInput('')
    setEditingMessageId(null)
  }

  // Updated handleSend to handle edits
  const handleSendOrEdit = async () => {
    if (editingMessageId) {
      // Editing mode: remove the edited message and all messages after it
      const editIndex = messages.findIndex((m) => m.id === editingMessageId)
      if (editIndex !== -1) {
        setMessages((prev) => prev.slice(0, editIndex))
      }
      setEditingMessageId(null)
    }
    // Proceed with normal send
    await handleSend()
  }

  // Save conversation to localStorage
  const saveConversation = () => {
    if (messages.length <= 1) return // Don't save if only welcome message

    const conversationId = projectId || `global-${Date.now()}`
    const projectName = projectId ? 'Current Project' : 'Global'

    const conversation = {
      id: conversationId,
      projectId: projectId || 'global',
      projectName,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp.toISOString(),
      })),
      lastUpdated: new Date().toISOString(),
    }

    // Get existing conversations
    const existing = localStorage.getItem('nexus_conversations')
    const conversations = existing ? JSON.parse(existing) : []

    // Update or add conversation
    const existingIndex = conversations.findIndex((c: any) => c.id === conversationId)
    if (existingIndex !== -1) {
      conversations[existingIndex] = conversation
    } else {
      conversations.push(conversation)
    }

    // Keep only last 50 conversations
    const trimmed = conversations.slice(-50)
    localStorage.setItem('nexus_conversations', JSON.stringify(trimmed))
  }

  // Auto-save conversation when messages change
  useEffect(() => {
    if (messages.length > 1) {
      saveConversation()
    }
  }, [messages])

  // Search conversations
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const existing = localStorage.getItem('nexus_conversations')
    const conversations = existing ? JSON.parse(existing) : []
    const query = searchQuery.toLowerCase()

    const results = conversations
      .filter((conv: any) =>
        conv.messages.some((m: any) => m.content.toLowerCase().includes(query))
      )
      .map((conv: any) => {
        // Find the message that matches
        const matchingMsg = conv.messages.find((m: any) =>
          m.content.toLowerCase().includes(query)
        )
        return {
          projectId: conv.projectId,
          projectName: conv.projectName,
          snippet: matchingMsg?.content.slice(0, 100) + (matchingMsg?.content.length > 100 ? '...' : ''),
          date: new Date(conv.lastUpdated).toLocaleDateString(),
          conversationId: conv.id,
        }
      })

    setSearchResults(results)
  }

  // Load conversation from search result
  const loadConversation = (conversationId: string) => {
    const existing = localStorage.getItem('nexus_conversations')
    const conversations = existing ? JSON.parse(existing) : []
    const conversation = conversations.find((c: any) => c.id === conversationId)

    if (conversation) {
      setMessages(
        conversation.messages.map((m: any, idx: number) => ({
          id: idx.toString(),
          role: m.role,
          content: m.content,
          timestamp: new Date(m.timestamp),
        }))
      )
    }

    setShowSearchModal(false)
    setSearchQuery('')
    setSearchResults([])
  }

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-full shadow-2xl hover:scale-110 transition-transform z-50 flex items-center justify-center group"
        >
          <svg
            className="w-8 h-8 text-white group-hover:scale-110 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background animate-pulse"></div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[420px] h-[650px] glass rounded-2xl border-2 border-border shadow-2xl flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-border bg-gradient-to-r from-primary/10 to-secondary/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">N</span>
                </div>
                <div>
                  <h3 className="font-bold">Nexus AI</h3>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${apiStatus === 'connected' ? 'bg-green-500' : apiStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                    <p className="text-xs text-muted-foreground">
                      {apiStatus === 'connected' ? 'Ready to help' : apiStatus === 'error' ? 'API not configured' : 'Connecting...'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Search Button */}
                <button
                  onClick={() => setShowSearchModal(true)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1"
                  title="Search Conversations"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Search Modal */}
          {showSearchModal && (
            <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-10 flex flex-col">
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search conversations..."
                    className="flex-1 px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                    autoFocus
                  />
                  <Button size="sm" onClick={handleSearch}>
                    Search
                  </Button>
                  <button
                    onClick={() => {
                      setShowSearchModal(false)
                      setSearchQuery('')
                      setSearchResults([])
                    }}
                    className="p-2 text-muted-foreground hover:text-foreground"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {searchResults.length > 0 ? (
                  <div className="space-y-2">
                    {searchResults.map((result, idx) => (
                      <button
                        key={idx}
                        onClick={() => loadConversation(result.conversationId)}
                        className="w-full text-left p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-primary">{result.projectName}</span>
                          <span className="text-xs text-muted-foreground">{result.date}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{result.snippet}</p>
                      </button>
                    ))}
                  </div>
                ) : searchQuery ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground text-sm">
                      No conversations found matching "{searchQuery}"
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground text-sm">
                      Enter a search term to find conversations
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="p-2 border-b border-border flex gap-2 overflow-x-auto">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action)}
                className="flex items-center gap-1 px-3 py-1.5 bg-secondary/50 hover:bg-secondary rounded-full text-xs font-medium whitespace-nowrap transition-colors"
              >
                <span>{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {/* Agent Avatar (for assistant messages) */}
                {message.role === 'assistant' && message.agent && (
                  <div className="flex-shrink-0 mr-2">
                    {(() => {
                      const agentInfo = getAgentInfo(message.agent.id)
                      return (
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                          style={{ backgroundColor: message.agent.color }}
                          title={`${agentInfo.name} - ${agentInfo.title}`}
                        >
                          {message.agent.avatar}
                        </div>
                      )
                    })()}
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl p-3 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-primary to-secondary text-white'
                      : 'glass border border-border'
                  }`}
                >
                  {/* Agent Name Header */}
                  {message.role === 'assistant' && message.agent && (
                    (() => {
                      const agentInfo = getAgentInfo(message.agent.id)
                      return (
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-xs font-bold"
                            style={{ color: message.agent.color }}
                          >
                            {agentInfo.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {agentInfo.title}
                          </span>
                        </div>
                      )
                    })()
                  )}
                  {/* Display attached images */}
                  {message.images && message.images.length > 0 && (
                    <div className={`grid gap-2 mb-2 ${message.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                      {message.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img.preview}
                          alt={`Attachment ${idx + 1}`}
                          className="rounded-lg max-h-40 w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(img.preview, '_blank')}
                        />
                      ))}
                    </div>
                  )}
                  <div className="text-sm whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none">
                    {message.content.split('**').map((part, i) =>
                      i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <div className="flex items-center gap-2">
                      {message.metadata?.tokensUsed && message.metadata.tokensUsed > 0 && (
                        <p className="text-xs opacity-50">
                          {message.metadata.tokensUsed} tokens
                        </p>
                      )}
                      {/* Edit button for user messages */}
                      {message.role === 'user' && !loading && (
                        <button
                          onClick={() => handleEditMessage(message.id)}
                          className="text-xs opacity-50 hover:opacity-100 transition-opacity"
                          title="Edit message"
                        >
                          ✏️
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex-shrink-0 mr-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm animate-pulse"
                    style={{ backgroundColor: selectedAgent
                      ? availableAgents.find(a => a.id === selectedAgent)?.color || '#14B8A6'
                      : '#14B8A6'
                    }}
                  >
                    {selectedAgent
                      ? availableAgents.find(a => a.id === selectedAgent)?.avatar || '🤖'
                      : '🤖'}
                  </div>
                </div>
                <div className="glass border border-border rounded-2xl p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {selectedAgent
                        ? `${getAgentInfo(selectedAgent).name} is typing`
                        : `${getAgentInfo('nexus').name} is typing`}
                    </span>
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Pending Action Confirmation */}
          {pendingAction && (
            <div className="p-4 border-t border-border bg-yellow-500/10">
              <div className="text-sm mb-2">
                <p className="font-bold">⚠️ Confirm Action</p>
                <p className="text-xs text-muted-foreground">{pendingAction.description}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleConfirmAction} disabled={loading} className="flex-1">
                  ✓ Execute
                </Button>
                <Button size="sm" variant="outline" onClick={() => setPendingAction(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Pending Workflow Approval Card (Story 4.2/4.4) */}
          {pendingWorkflow && pendingWorkflow.plan && !loading && (
            <div className="p-4 border-t border-border bg-gradient-to-r from-green-500/5 to-blue-500/5">
              <div className="bg-card rounded-lg border border-green-500/30 p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-sm flex items-center gap-2">
                      📋 Execution Plan Ready
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {pendingWorkflow.plan.tasks.length} tasks • Est. ${pendingWorkflow.plan.totalEstimatedCostUSD.toFixed(4)}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    pendingWorkflow.plan.complexity === 'simple' ? 'bg-green-500/20 text-green-700' :
                    pendingWorkflow.plan.complexity === 'complex' ? 'bg-orange-500/20 text-orange-700' :
                    'bg-blue-500/20 text-blue-700'
                  }`}>
                    {pendingWorkflow.plan.complexity}
                  </span>
                </div>

                {/* Task Preview */}
                <div className="flex items-center gap-1 overflow-x-auto py-2">
                  {pendingWorkflow.plan.tasks.map((task, idx) => (
                    <div key={task.id} className="flex items-center">
                      <div
                        className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-xs font-medium"
                        title={`${task.name}: ${task.description}`}
                      >
                        {task.type === 'agent' ? '🤖' : task.type === 'integration' ? '🔌' : '⚙️'}
                      </div>
                      {idx < pendingWorkflow.plan!.tasks.length - 1 && (
                        <div className="w-4 h-0.5 bg-border mx-0.5" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={handleApproveWorkflow}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    disabled={loading}
                  >
                    ⚡ Approve & Execute
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setPendingWorkflow(null)
                      setInput('I would like to modify the plan: ')
                    }}
                  >
                    Modify
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPendingWorkflow(null)}
                    className="text-muted-foreground"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Planning Indicator */}
          {isPlanning && (
            <div className="p-4 border-t border-border bg-gradient-to-r from-primary/5 to-secondary/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                  🧠
                </div>
                <div>
                  <p className="text-sm font-medium">BMAD Director is planning...</p>
                  <p className="text-xs text-muted-foreground">Analyzing your request and generating execution plan</p>
                </div>
              </div>
            </div>
          )}

          {/* Workflow Proposal Preview Card */}
          {workflowProposal && userId && !pendingAction && !isPlanning && (
            <div className="p-4 border-t border-border bg-gradient-to-r from-primary/5 to-secondary/5">
              <div className="bg-card rounded-lg border border-border p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-sm flex items-center gap-2">
                      📋 {workflowProposal.name}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {workflowProposal.description}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    workflowProposal.complexity === 'simple' ? 'bg-green-500/20 text-green-700 dark:text-green-400' :
                    workflowProposal.complexity === 'complex' ? 'bg-orange-500/20 text-orange-700 dark:text-orange-400' :
                    'bg-blue-500/20 text-blue-700 dark:text-blue-400'
                  }`}>
                    {workflowProposal.complexity}
                  </span>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-muted/30 rounded-lg p-2">
                    <p className="text-lg font-bold">{workflowProposal.steps?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Steps</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-2">
                    <p className="text-lg font-bold">{workflowProposal.estimatedTokens || 0}</p>
                    <p className="text-xs text-muted-foreground">Tokens</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-2">
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      ${workflowProposal.estimatedCostUSD?.toFixed(2) || '0.00'}
                    </p>
                    <p className="text-xs text-muted-foreground">Est. Cost</p>
                  </div>
                </div>

                {/* Integrations */}
                {workflowProposal.integrations && workflowProposal.integrations.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Integrations:</p>
                    <div className="flex flex-wrap gap-1">
                      {workflowProposal.integrations.map((integration, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 text-xs bg-secondary rounded-full"
                        >
                          {integration}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mini Workflow Preview */}
                {workflowProposal.steps && workflowProposal.steps.length > 0 && (
                  <div className="flex items-center gap-1 overflow-x-auto py-2">
                    {workflowProposal.steps.map((_step, idx) => (
                      <div key={idx} className="flex items-center">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-xs font-medium">
                          {idx + 1}
                        </div>
                        {idx < (workflowProposal.steps?.length || 0) - 1 && (
                          <div className="w-4 h-0.5 bg-border mx-0.5" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={handleCreateWorkflow}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    ✓ Approve & Run
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setWorkflowProposal(null)
                      setInput('I would like to modify: ')
                    }}
                  >
                    Modify Request
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Agent Selector */}
          {showAgentSelector && (
            <div className="p-3 border-t border-border bg-secondary/30">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => { setSelectedAgent(null); setShowAgentSelector(false) }}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                    selectedAgent === null ? 'bg-primary text-white' : 'bg-secondary/50 hover:bg-secondary'
                  }`}
                >
                  <span>🎯</span>
                  <span>Auto</span>
                </button>
                {availableAgents.map((agent) => {
                  const agentInfo = getAgentInfo(agent.id)
                  return (
                    <button
                      key={agent.id}
                      onClick={() => { setSelectedAgent(agent.id); setShowAgentSelector(false) }}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                        selectedAgent === agent.id ? 'text-white' : 'bg-secondary/50 hover:bg-secondary'
                      }`}
                      style={selectedAgent === agent.id ? { backgroundColor: agent.color } : {}}
                      title={agentInfo.title}
                    >
                      <span>{agent.avatar}</span>
                      <span>{agentInfo.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Image Preview Area */}
          {attachedImages.length > 0 && (
            <div className="px-4 pt-3 pb-0 border-t border-border bg-secondary/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-muted-foreground">
                  {attachedImages.length} image{attachedImages.length > 1 ? 's' : ''} attached
                </span>
                <button
                  onClick={() => {
                    attachedImages.forEach((img) => URL.revokeObjectURL(img.preview))
                    setAttachedImages([])
                  }}
                  className="text-xs text-destructive hover:underline"
                >
                  Clear all
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {attachedImages.map((img, idx) => (
                  <div key={idx} className="relative flex-shrink-0">
                    <img
                      src={img.preview}
                      alt={`Preview ${idx + 1}`}
                      className="h-16 w-16 object-cover rounded-lg border border-border"
                    />
                    <button
                      onClick={() => removeAttachedImage(idx)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center text-xs hover:bg-destructive/80"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Edit Mode Banner */}
          {editingMessageId && (
            <div className="px-4 py-2 border-t border-border bg-amber-500/10 flex items-center justify-between">
              <span className="text-xs text-amber-700 dark:text-amber-400">
                ✏️ Editing message - changes will regenerate response
              </span>
              <button
                onClick={handleCancelEdit}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-border">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="flex gap-2">
              {/* Agent Toggle Button */}
              <button
                onClick={() => setShowAgentSelector(!showAgentSelector)}
                className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                title={selectedAgent ? `Speaking with ${getAgentInfo(selectedAgent).name}` : 'Auto-routing enabled'}
              >
                {selectedAgent ? (
                  <span>{availableAgents.find(a => a.id === selectedAgent)?.avatar || '🤖'}</span>
                ) : (
                  <span>🎯</span>
                )}
              </button>

              {/* Image Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || uploadingImage || attachedImages.length >= 4}
                className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={attachedImages.length >= 4 ? 'Maximum 4 images' : 'Attach screenshot or image'}
              >
                {uploadingImage ? (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </button>

              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendOrEdit()}
                placeholder={editingMessageId
                  ? "Edit your message..."
                  : attachedImages.length > 0
                    ? "Add a message about your screenshot..."
                    : selectedAgent
                      ? `Ask ${getAgentInfo(selectedAgent).name}...`
                      : `Ask me anything (auto-routes to best ${term('team').toLowerCase().includes('team') ? 'team member' : 'agent'})...`
                }
                disabled={loading}
                className={`flex-1 ${editingMessageId ? 'border-amber-500' : ''}`}
              />
              <Button
                onClick={handleSendOrEdit}
                disabled={loading || (!input.trim() && attachedImages.length === 0)}
                size="icon"
                className={editingMessageId ? 'bg-amber-600 hover:bg-amber-700' : ''}
              >
                {editingMessageId ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
