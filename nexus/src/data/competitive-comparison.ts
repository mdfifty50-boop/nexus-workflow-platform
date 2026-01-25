/**
 * Competitive Comparison Data for Nexus
 *
 * This file contains comparison data between Nexus and competitors
 * (Zapier, ChatGPT, n8n) to highlight key differentiators.
 *
 * Key differentiators:
 * 1. "Results, not conversations" - Nexus executes tasks, doesn't just chat
 * 2. Token efficiency - 70-90% fewer tokens than ChatGPT conversations
 * 3. Execution speed - Parallel multi-agent execution vs sequential
 */

// ============================================
// COMPETITOR PROFILES
// ============================================

export interface Competitor {
  id: string
  name: string
  logo: string // Emoji for now, can be replaced with actual logos
  tagline: string
  type: 'automation' | 'ai-assistant' | 'hybrid'
  strengths: string[]
  weaknesses: string[]
}

export const competitors: Competitor[] = [
  {
    id: 'zapier',
    name: 'Zapier',
    logo: '⚡',
    tagline: 'Easy automation platform',
    type: 'automation',
    strengths: [
      'Wide app ecosystem (6000+ apps)',
      'Easy to use interface',
      'Established market presence',
    ],
    weaknesses: [
      'No AI reasoning capabilities',
      'Rigid trigger-action workflows only',
      'Cannot handle complex multi-step logic',
      'No natural language understanding',
    ],
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    logo: '🤖',
    tagline: 'AI conversational assistant',
    type: 'ai-assistant',
    strengths: [
      'Advanced reasoning',
      'Natural language understanding',
      'General knowledge base',
    ],
    weaknesses: [
      'Conversations, not executions',
      'No persistent workflows',
      'Cannot connect to business apps',
      'Token-expensive interactions',
      'Must re-explain context each time',
    ],
  },
  {
    id: 'n8n',
    name: 'n8n',
    logo: '🔧',
    tagline: 'Developer-focused workflow automation',
    type: 'automation',
    strengths: [
      'Self-hosted option',
      'Developer flexibility',
      'Open source core',
    ],
    weaknesses: [
      'Requires technical knowledge',
      'Complex setup and maintenance',
      'No AI-driven optimization',
      'Manual workflow creation only',
    ],
  },
]

// ============================================
// NEXUS ADVANTAGES
// ============================================

export interface NexusAdvantage {
  id: string
  title: string
  shortTitle: string // For badges/chips
  description: string
  icon: string
  metric?: {
    value: string
    label: string
    comparison?: string
  }
  vsCompetitors: {
    competitorId: string
    comparison: string
  }[]
}

export const nexusAdvantages: NexusAdvantage[] = [
  {
    id: 'results-not-conversations',
    title: 'Results, Not Conversations',
    shortTitle: 'Execution-First',
    description: 'While ChatGPT talks about what could be done, Nexus actually does it. Multi-agent workflows execute tasks end-to-end without back-and-forth.',
    icon: '🎯',
    metric: {
      value: '100%',
      label: 'Task Completion',
      comparison: 'vs 0% auto-execution in ChatGPT',
    },
    vsCompetitors: [
      { competitorId: 'chatgpt', comparison: 'ChatGPT discusses tasks; Nexus executes them automatically' },
      { competitorId: 'zapier', comparison: 'Zapier needs predefined triggers; Nexus understands intent' },
      { competitorId: 'n8n', comparison: 'n8n requires manual setup; Nexus builds workflows from plain English' },
    ],
  },
  {
    id: 'token-efficiency',
    title: 'Token-Efficient AI',
    shortTitle: 'Save 70-90%',
    description: 'Purpose-built agents share context efficiently. No re-explaining your business to AI every session. Your workflows remember everything.',
    icon: '💰',
    metric: {
      value: '70-90%',
      label: 'Token Savings',
      comparison: 'vs ChatGPT conversations',
    },
    vsCompetitors: [
      { competitorId: 'chatgpt', comparison: 'ChatGPT: ~4000 tokens/task average. Nexus: ~500 tokens/task' },
      { competitorId: 'zapier', comparison: 'Zapier uses no AI. Nexus AI costs less than manual API setup time' },
      { competitorId: 'n8n', comparison: 'n8n has no AI. Nexus AI understanding saves development hours' },
    ],
  },
  {
    id: 'execution-speed',
    title: 'Parallel Multi-Agent',
    shortTitle: 'Faster',
    description: 'Multiple specialized agents work simultaneously. While ChatGPT processes sequentially, Nexus orchestrates parallel execution.',
    icon: '⚡',
    metric: {
      value: '5-10x',
      label: 'Faster Execution',
      comparison: 'vs sequential processing',
    },
    vsCompetitors: [
      { competitorId: 'chatgpt', comparison: 'Sequential chat vs parallel agent execution' },
      { competitorId: 'zapier', comparison: 'Zapier: one trigger chain. Nexus: multiple simultaneous agents' },
      { competitorId: 'n8n', comparison: 'n8n: manual parallel setup. Nexus: automatic orchestration' },
    ],
  },
  {
    id: 'persistent-memory',
    title: 'Persistent Business Memory',
    shortTitle: 'Remembers Context',
    description: 'Your workflows, preferences, and business context persist across sessions. No more "As I mentioned before..."',
    icon: '🧠',
    vsCompetitors: [
      { competitorId: 'chatgpt', comparison: 'ChatGPT forgets between sessions; Nexus remembers your business' },
      { competitorId: 'zapier', comparison: 'Zapier has no context; Nexus understands your workflows holistically' },
      { competitorId: 'n8n', comparison: 'n8n stores data but cannot reason about it' },
    ],
  },
  {
    id: 'no-code-ai',
    title: 'Natural Language to Automation',
    shortTitle: 'No Code',
    description: 'Describe what you want in plain English. Nexus builds the workflow, connects the apps, and starts executing.',
    icon: '✨',
    vsCompetitors: [
      { competitorId: 'chatgpt', comparison: 'ChatGPT gives instructions; Nexus implements them' },
      { competitorId: 'zapier', comparison: 'Zapier: drag-drop builder. Nexus: just describe and done' },
      { competitorId: 'n8n', comparison: 'n8n: JSON/code required. Nexus: natural language' },
    ],
  },
]

// ============================================
// TOKEN SAVINGS CALCULATOR
// ============================================

export interface TokenSavingsEstimate {
  taskType: string
  chatGptTokens: number
  nexusTokens: number
  savingsPercent: number
  monthlyCostChatGpt: number // Based on $0.03/1K tokens (GPT-4 pricing)
  monthlyCostNexus: number
}

export const tokenSavingsEstimates: TokenSavingsEstimate[] = [
  {
    taskType: 'Email Triage & Response',
    chatGptTokens: 5000,
    nexusTokens: 600,
    savingsPercent: 88,
    monthlyCostChatGpt: 150, // 100 emails/day * 30 days * 5000 tokens
    monthlyCostNexus: 18,
  },
  {
    taskType: 'CRM Data Updates',
    chatGptTokens: 3500,
    nexusTokens: 400,
    savingsPercent: 89,
    monthlyCostChatGpt: 52.50,
    monthlyCostNexus: 6,
  },
  {
    taskType: 'Meeting Summarization',
    chatGptTokens: 8000,
    nexusTokens: 1200,
    savingsPercent: 85,
    monthlyCostChatGpt: 48,
    monthlyCostNexus: 7.20,
  },
  {
    taskType: 'Document Processing',
    chatGptTokens: 10000,
    nexusTokens: 1500,
    savingsPercent: 85,
    monthlyCostChatGpt: 30,
    monthlyCostNexus: 4.50,
  },
  {
    taskType: 'Report Generation',
    chatGptTokens: 6000,
    nexusTokens: 800,
    savingsPercent: 87,
    monthlyCostChatGpt: 36,
    monthlyCostNexus: 4.80,
  },
]

// Calculate average savings
export const averageTokenSavings = Math.round(
  tokenSavingsEstimates.reduce((sum, est) => sum + est.savingsPercent, 0) / tokenSavingsEstimates.length
)

// ============================================
// EXECUTION TIME COMPARISONS
// ============================================

export interface ExecutionTimeComparison {
  taskType: string
  description: string
  chatGptTime: string
  chatGptDetails: string
  zapierTime: string
  zapierDetails: string
  n8nTime: string
  n8nDetails: string
  nexusTime: string
  nexusDetails: string
}

export const executionTimeComparisons: ExecutionTimeComparison[] = [
  {
    taskType: 'Lead Follow-up Email',
    description: 'Send personalized follow-up emails based on CRM data',
    chatGptTime: '5-10 min',
    chatGptDetails: 'Manual copy-paste from CRM to ChatGPT, then to email',
    zapierTime: '30 sec',
    zapierDetails: 'Automated but template-only, no personalization',
    n8nTime: '1-2 min',
    n8nDetails: 'Requires pre-built workflow, limited AI personalization',
    nexusTime: '15 sec',
    nexusDetails: 'AI-personalized, fully automated, context-aware',
  },
  {
    taskType: 'Daily Sales Report',
    description: 'Aggregate data from multiple sources into summary report',
    chatGptTime: '15-20 min',
    chatGptDetails: 'Manual data gathering, pasting into chat, formatting output',
    zapierTime: '2-3 min',
    zapierDetails: 'Scheduled but rigid format, no AI analysis',
    n8nTime: '1-2 min',
    n8nDetails: 'Technical setup required, basic aggregation',
    nexusTime: '30 sec',
    nexusDetails: 'Multi-agent parallel data gathering with AI insights',
  },
  {
    taskType: 'Customer Query Resolution',
    description: 'Understand customer issue and take appropriate action',
    chatGptTime: '3-5 min',
    chatGptDetails: 'Good understanding but requires manual action execution',
    zapierTime: 'N/A',
    zapierDetails: 'Cannot understand complex queries',
    n8nTime: 'N/A',
    n8nDetails: 'Cannot understand complex queries',
    nexusTime: '20 sec',
    nexusDetails: 'AI understands AND executes resolution steps',
  },
]

// ============================================
// FEATURE COMPARISON MATRIX
// ============================================

export interface FeatureComparison {
  feature: string
  category: 'ai' | 'automation' | 'integration' | 'ux'
  nexus: 'full' | 'partial' | 'none' | 'planned'
  zapier: 'full' | 'partial' | 'none'
  chatgpt: 'full' | 'partial' | 'none'
  n8n: 'full' | 'partial' | 'none'
}

export const featureComparison: FeatureComparison[] = [
  // AI Capabilities
  { feature: 'Natural Language Understanding', category: 'ai', nexus: 'full', zapier: 'none', chatgpt: 'full', n8n: 'none' },
  { feature: 'Multi-Agent Orchestration', category: 'ai', nexus: 'full', zapier: 'none', chatgpt: 'none', n8n: 'none' },
  { feature: 'Context Persistence', category: 'ai', nexus: 'full', zapier: 'partial', chatgpt: 'partial', n8n: 'partial' },
  { feature: 'AI-Driven Optimization', category: 'ai', nexus: 'full', zapier: 'none', chatgpt: 'partial', n8n: 'none' },

  // Automation Capabilities
  { feature: 'Automated Workflow Execution', category: 'automation', nexus: 'full', zapier: 'full', chatgpt: 'none', n8n: 'full' },
  { feature: 'Scheduled Tasks', category: 'automation', nexus: 'full', zapier: 'full', chatgpt: 'none', n8n: 'full' },
  { feature: 'Parallel Processing', category: 'automation', nexus: 'full', zapier: 'partial', chatgpt: 'none', n8n: 'partial' },
  { feature: 'Error Recovery', category: 'automation', nexus: 'full', zapier: 'partial', chatgpt: 'none', n8n: 'partial' },

  // Integration
  { feature: '500+ App Integrations', category: 'integration', nexus: 'full', zapier: 'full', chatgpt: 'partial', n8n: 'full' },
  { feature: 'OAuth Connections', category: 'integration', nexus: 'full', zapier: 'full', chatgpt: 'partial', n8n: 'full' },
  { feature: 'Custom API Calls', category: 'integration', nexus: 'full', zapier: 'partial', chatgpt: 'none', n8n: 'full' },

  // UX
  { feature: 'No-Code Setup', category: 'ux', nexus: 'full', zapier: 'full', chatgpt: 'full', n8n: 'partial' },
  { feature: 'Voice Input', category: 'ux', nexus: 'full', zapier: 'none', chatgpt: 'partial', n8n: 'none' },
  { feature: 'Persona Customization', category: 'ux', nexus: 'full', zapier: 'none', chatgpt: 'partial', n8n: 'none' },
]

// ============================================
// USAGE STATS FOR DYNAMIC DISPLAYS
// ============================================

export interface CompetitiveStats {
  totalTokensSaved: number
  totalTimeSavedMinutes: number
  avgCostSavingsPercent: number
  avgSpeedMultiplier: number
}

// Calculate cumulative savings based on user's actual usage
export function calculateCompetitiveStats(
  workflowsCompleted: number,
  tasksAutomated: number
): CompetitiveStats {
  // Average tokens saved per workflow (Nexus vs ChatGPT conversation approach)
  const tokensPerWorkflowSaved = 3500 // Conservative estimate
  const tokensPerTaskSaved = 500

  // Time saved calculations
  const minutesPerWorkflowSaved = 8 // vs ChatGPT back-and-forth
  const minutesPerTaskSaved = 2

  return {
    totalTokensSaved: (workflowsCompleted * tokensPerWorkflowSaved) + (tasksAutomated * tokensPerTaskSaved),
    totalTimeSavedMinutes: (workflowsCompleted * minutesPerWorkflowSaved) + (tasksAutomated * minutesPerTaskSaved),
    avgCostSavingsPercent: averageTokenSavings, // ~87%
    avgSpeedMultiplier: 7.5, // Nexus is ~7.5x faster on average
  }
}

// Convert token savings to dollar amount
export function tokensToDollars(tokens: number): number {
  // Based on GPT-4 pricing: ~$0.03 per 1K tokens (average of input/output)
  return (tokens / 1000) * 0.03
}

// ============================================
// MESSAGING & COPY
// ============================================

export const competitiveMessaging = {
  tagline: 'Results, Not Conversations',
  subTagline: 'AI that executes, not just chats',

  badges: {
    tokenSavings: {
      label: 'Save 70-90% on AI Costs',
      tooltip: 'Compared to ChatGPT conversation-based workflows',
    },
    executionSpeed: {
      label: '5-10x Faster Execution',
      tooltip: 'Parallel multi-agent processing vs sequential chat',
    },
    resultsFirst: {
      label: 'Execution-First AI',
      tooltip: 'Nexus does the work. ChatGPT talks about it.',
    },
  },

  comparisons: {
    vsZapier: 'Zapier automates triggers. Nexus understands intent.',
    vsChatGpt: 'ChatGPT converses. Nexus executes.',
    vsN8n: 'n8n requires dev skills. Nexus speaks plain English.',
  },

  ctaOptions: [
    'See the Difference',
    'Start Executing',
    'Try Real Automation',
    'Stop Chatting, Start Doing',
  ],
}
