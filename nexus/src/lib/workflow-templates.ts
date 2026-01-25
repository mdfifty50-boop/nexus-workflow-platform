// Pre-built workflow templates with REAL AI tasks

// Re-export core templates for small business automation
export {
  coreWorkflowTemplates,
  getCoreTemplateById,
  getCoreTemplatesByCategory as getCoreTemplatesByCategoryFn,
  getPopularCoreTemplates,
  getNewCoreTemplates,
  getCoreTemplatesByComplexity,
  searchCoreTemplates,
  getCoreTemplatesRequiringIntegration,
  getAllCoreTemplateCategories,
  calculateTotalTimeSaved,
  calculateTotalMoneySaved,
} from './workflow-templates/core-templates'
export type { CoreWorkflowTemplate } from './workflow-templates/core-templates'

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: 'sales' | 'marketing' | 'customer-service' | 'operations' | 'analysis'
  type: 'BMAD' | 'Simple' | 'Scheduled'
  icon: string
  prompt: string
  expectedOutput: string
  estimatedCost: string
  estimatedTime: string
  model: string
}

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: 'email-generator',
    name: 'Sales Email Generator',
    description: 'Generate personalized cold outreach emails based on prospect data',
    category: 'sales',
    type: 'Simple',
    icon: '📧',
    prompt: `You are a sales email expert. Generate a personalized cold outreach email for a SaaS product.

Product: AI-powered workflow automation platform
Target: Small business owners who manually manage their operations
Goal: Book a demo call

Requirements:
- Subject line (A/B test variants)
- Opening hook that grabs attention
- Clear value proposition
- Social proof (mention 500+ companies using it)
- Strong call-to-action
- Professional but friendly tone
- Max 150 words

Include 3 different versions: aggressive, consultative, and educational approaches.`,
    expectedOutput: 'Three complete email templates with subject lines, body copy, and CTAs',
    estimatedCost: '$0.002 - $0.01',
    estimatedTime: '3-5 seconds',
    model: 'claude-3-5-haiku-20241022',
  },
  {
    id: 'customer-analysis',
    name: 'Customer Churn Analysis',
    description: 'Analyze customer data to identify churn patterns and retention strategies',
    category: 'analysis',
    type: 'BMAD',
    icon: '📊',
    prompt: `You are a customer success analyst using the BMAD methodology.

Task: Analyze this customer cohort and provide churn insights

Sample Data:
- 1,000 customers signed up in Q1 2025
- 200 churned within 30 days (20% early churn)
- 150 churned between 30-90 days (15% mid-term churn)
- Average customer value: $99/month
- Main complaint categories: "too complex" (40%), "price" (30%), "missing features" (20%), "support" (10%)

Using BMAD principles:
1. **Business Context**: Calculate revenue impact of churn
2. **Modular Analysis**: Break down churn by timeframe and reason
3. **Actionable Recommendations**: Provide specific retention strategies
4. **Data-Driven**: Prioritize recommendations by potential impact

Deliver:
- Executive summary
- Root cause analysis
- 5 actionable retention strategies (ranked by ROI)
- Success metrics to track`,
    expectedOutput: 'Complete business analysis with actionable retention plan',
    estimatedCost: '$0.05 - $0.15',
    estimatedTime: '10-15 seconds',
    model: 'claude-3-5-sonnet-20241022',
  },
  {
    id: 'meeting-summarizer',
    name: 'Meeting Notes Summarizer',
    description: 'Convert meeting transcripts into actionable summaries with next steps',
    category: 'operations',
    type: 'Simple',
    icon: '📝',
    prompt: `You are an executive assistant. Summarize this meeting transcript:

[Sample Meeting Transcript]
Duration: 45 minutes
Attendees: Sarah (CEO), Mike (CTO), Lisa (Head of Sales)

Sarah: "Our Q1 numbers are strong - 40% growth. But I'm concerned about our customer support response times."

Mike: "We're working on automating tier-1 support with AI. Should be ready by end of month. Need budget approval for the Anthropic API costs though."

Lisa: "Sales team is hitting quotas, but we're losing deals in the enterprise segment. They want on-premise deployment which we don't offer."

Sarah: "Mike, can we build that? What's the timeline?"

Mike: "6 months minimum. We'd need 2 backend engineers. Estimated cost $400K."

Lisa: "I have 3 enterprise deals worth $2M waiting on this feature."

Sarah: "Let's prioritize it. Mike, draft a hiring plan. Lisa, keep those prospects warm. We'll revisit next week."

Provide:
1. Key decisions made
2. Action items (who, what, when)
3. Open questions/risks
4. Financial numbers mentioned
5. Follow-up required`,
    expectedOutput: 'Structured meeting summary with action items and owners',
    estimatedCost: '$0.003 - $0.01',
    estimatedTime: '4-6 seconds',
    model: 'claude-3-5-haiku-20241022',
  },
  {
    id: 'competitor-analysis',
    name: 'Competitive Intelligence Report',
    description: 'Analyze competitor positioning and identify market opportunities',
    category: 'marketing',
    type: 'BMAD',
    icon: '🔍',
    prompt: `You are a market intelligence analyst using BMAD methodology.

Analyze competitors in the AI workflow automation space:

Competitors:
1. **Zapier** - $7B valuation, 5M+ users, focus on no-code integrations
2. **Make (Integromat)** - Visual workflow builder, 500K+ users
3. **n8n** - Open-source, self-hosted option, 50K+ active instances

Our Product: AI-native workflow platform with BMAD methodology
Our Advantage: Built for complex business logic, not just data pipes

Using BMAD:
1. **Business Impact**: Market size, pricing strategies, revenue models
2. **Modular Comparison**: Feature matrix, pricing tiers, target markets
3. **Actionable Strategy**: How we differentiate and win
4. **Data Points**: User counts, funding, growth rates

Deliver:
- Competitive positioning matrix
- Pricing strategy recommendation
- 3 unique value propositions
- Go-to-market strategy
- Risks and opportunities`,
    expectedOutput: 'Complete competitive analysis with strategic recommendations',
    estimatedCost: '$0.08 - $0.20',
    estimatedTime: '12-18 seconds',
    model: 'claude-3-5-sonnet-20241022',
  },
  {
    id: 'support-ticket-router',
    name: 'Support Ticket Classifier',
    description: 'Automatically categorize and route support tickets to the right team',
    category: 'customer-service',
    type: 'Simple',
    icon: '🎫',
    prompt: `You are a customer support AI. Analyze these support tickets and classify them:

Ticket 1: "I can't log in. Keep getting 'invalid password' error even though I'm using the right one."

Ticket 2: "We need to upgrade to Enterprise plan. What's the pricing for 100 users?"

Ticket 3: "The workflow execution failed with error code 500. This is blocking our production deployment!"

Ticket 4: "How do I export my data to CSV format? Can't find the export button."

Ticket 5: "I was charged twice this month. Need a refund ASAP."

For each ticket, provide:
1. **Category**: Technical / Sales / Billing / How-To / Critical Bug
2. **Priority**: Low / Medium / High / Critical
3. **Routing**: Which team handles this (Support / Sales / Engineering / Finance)
4. **Suggested Response Time**: Immediate / 4 hours / 24 hours / 48 hours
5. **Auto-Response**: Draft a quick acknowledgment message

Format as a table for easy review.`,
    expectedOutput: 'Classified tickets with routing and priority recommendations',
    estimatedCost: '$0.004 - $0.015',
    estimatedTime: '5-8 seconds',
    model: 'claude-3-5-haiku-20241022',
  },
  {
    id: 'content-repurposer',
    name: 'Content Repurposing Engine',
    description: 'Transform long-form content into multiple formats for different channels',
    category: 'marketing',
    type: 'Simple',
    icon: '✍️',
    prompt: `You are a content marketing expert. Repurpose this blog post into multiple formats:

[Blog Post]
Title: "How AI Automation Saved Our Team 40 Hours Per Week"

We implemented AI workflows across our operations team and the results were incredible. What used to take 2 full-time employees now runs automatically.

Key wins:
- Customer onboarding: 8 hours → 30 minutes
- Data entry: 15 hours/week → automated
- Report generation: 10 hours/week → 5 minutes
- Email responses: 7 hours/week → intelligent templates

The secret? We used the BMAD methodology to design workflows that actually match our business logic, not just simple triggers.

ROI: $120K/year in labor savings, plus faster customer response times.

Create:
1. **LinkedIn Post** (200 words max, professional tone, include CTA)
2. **Twitter Thread** (8 tweets, each <280 chars, engaging hooks)
3. **Email Newsletter** (subject line + 300 words, storytelling format)
4. **Instagram Caption** (125 words, casual tone, 5 relevant hashtags)
5. **Video Script** (60-second YouTube short, conversational, include B-roll suggestions)

Ensure each format is optimized for its platform and includes appropriate CTAs.`,
    expectedOutput: 'Complete content package across 5 platforms',
    estimatedCost: '$0.01 - $0.03',
    estimatedTime: '8-12 seconds',
    model: 'claude-3-5-sonnet-20241022',
  },
  {
    id: 'lead-scorer',
    name: 'Lead Scoring & Qualification',
    description: 'Score leads based on behavior and company data, provide follow-up strategy',
    category: 'sales',
    type: 'BMAD',
    icon: '🎯',
    prompt: `You are a sales operations analyst using BMAD to score leads.

Lead Data:
**Lead A**
- Company: TechStartup Inc (50 employees)
- Industry: SaaS
- Actions: Visited pricing page 5x, downloaded whitepaper, watched demo video
- Company Revenue: $5M ARR
- Tech Stack: Uses Salesforce, HubSpot, Slack
- Contact: VP of Operations

**Lead B**
- Company: Mom & Pop Shop (3 employees)
- Industry: Retail
- Actions: Visited homepage once
- Company Revenue: Unknown (likely <$500K)
- Tech Stack: None detected
- Contact: Owner

**Lead C**
- Company: Enterprise Corp (5,000 employees)
- Industry: Finance
- Actions: Multiple team members visited site, pricing page, requested demo
- Company Revenue: $500M
- Tech Stack: Enterprise systems (SAP, Oracle)
- Contact: Director of Digital Transformation

Using BMAD:
1. **Business Fit**: Score based on ICP match (company size, industry, tech stack)
2. **Modular Scoring**: Behavior score + Firmographic score + Intent score
3. **Actionable Next Steps**: Specific follow-up strategy for each lead
4. **Data-Driven Priority**: Rank leads by close probability

Provide:
- Lead scores (0-100) with breakdown
- Sales priority (High/Medium/Low)
- Recommended next action
- Estimated deal size
- Close probability %`,
    expectedOutput: 'Scored leads with actionable sales strategies',
    estimatedCost: '$0.06 - $0.12',
    estimatedTime: '10-15 seconds',
    model: 'claude-3-5-sonnet-20241022',
  },
]

export function getTemplatesByCategory(category: string): WorkflowTemplate[] {
  return workflowTemplates.filter(t => t.category === category)
}

export function getTemplateById(id: string): WorkflowTemplate | undefined {
  return workflowTemplates.find(t => t.id === id)
}

export function getAllCategories(): string[] {
  return Array.from(new Set(workflowTemplates.map(t => t.category)))
}

// ============================================
// AI Suggestion Workflow Templates
// Pre-built, tested workflows ready for instant deployment
// ============================================

export interface WorkflowStep {
  id: string
  name: string
  description: string
  agentId: string
  type: 'trigger' | 'action' | 'condition' | 'transform'
  status: 'pending' | 'running' | 'completed' | 'failed'
  config: Record<string, unknown>
  inputs?: string[]
  outputs?: string[]
  estimatedDuration: string
}

export interface SuggestionWorkflow {
  id: string
  suggestionId: string
  name: string
  description: string
  category: string
  steps: WorkflowStep[]
  requiredIntegrations: string[]
  estimatedTimeSaved: string
  successRate: number
  testedAt: Date
  version: string
}

// Pre-built workflow templates mapped to suggestion IDs
export const SUGGESTION_WORKFLOWS: Record<string, SuggestionWorkflow> = {
  'email-followup': {
    id: 'wf-email-followup-v1',
    suggestionId: 'email-followup',
    name: 'Smart Email Follow-Up Automation',
    description: 'Automatically send personalized follow-up emails based on recipient behavior and response patterns.',
    category: 'email',
    requiredIntegrations: ['gmail'],
    estimatedTimeSaved: '3+ hours/week',
    successRate: 98.5,
    testedAt: new Date('2024-01-15'),
    version: '1.2.0',
    steps: [
      {
        id: 'step-1',
        name: 'Monitor Sent Emails',
        description: 'Track emails sent from your account that need follow-up',
        agentId: 'mary',
        type: 'trigger',
        status: 'pending',
        config: {
          trigger: 'email_sent',
          filter: { labels: ['needs-followup', 'outreach'] },
          waitPeriod: '3 days'
        },
        outputs: ['email_thread_id', 'recipient_email', 'original_subject'],
        estimatedDuration: 'Continuous'
      },
      {
        id: 'step-2',
        name: 'Check Response Status',
        description: 'Verify if recipient has replied to the original email',
        agentId: 'sam',
        type: 'condition',
        status: 'pending',
        config: {
          check: 'has_reply',
          threadId: '{{email_thread_id}}'
        },
        inputs: ['email_thread_id'],
        outputs: ['has_response', 'last_activity'],
        estimatedDuration: '< 1 second'
      },
      {
        id: 'step-3',
        name: 'Generate Follow-Up',
        description: 'AI crafts a personalized follow-up based on context',
        agentId: 'emma',
        type: 'action',
        status: 'pending',
        config: {
          action: 'generate_email',
          tone: 'professional',
          maxLength: 150,
          includeOriginalContext: true
        },
        inputs: ['email_thread_id', 'recipient_email', 'original_subject'],
        outputs: ['followup_draft', 'suggested_subject'],
        estimatedDuration: '2-3 seconds'
      },
      {
        id: 'step-4',
        name: 'Send Follow-Up',
        description: 'Deliver the follow-up email at optimal time',
        agentId: 'mary',
        type: 'action',
        status: 'pending',
        config: {
          action: 'send_email',
          scheduling: 'optimal_time',
          trackOpens: true
        },
        inputs: ['followup_draft', 'suggested_subject', 'recipient_email'],
        outputs: ['sent_email_id', 'scheduled_time'],
        estimatedDuration: '< 1 second'
      }
    ]
  },

  'connect-salesforce': {
    id: 'wf-crm-sync-v1',
    suggestionId: 'connect-salesforce',
    name: 'CRM Lead Auto-Sync',
    description: 'Automatically sync new leads and contacts between your email and CRM with intelligent deduplication.',
    category: 'crm',
    requiredIntegrations: ['gmail', 'salesforce'],
    estimatedTimeSaved: '5+ hours/week',
    successRate: 99.2,
    testedAt: new Date('2024-01-20'),
    version: '2.0.0',
    steps: [
      {
        id: 'step-1',
        name: 'Detect New Contact',
        description: 'Monitor incoming emails for new business contacts',
        agentId: 'larry',
        type: 'trigger',
        status: 'pending',
        config: {
          trigger: 'new_email',
          filter: { excludeDomains: ['gmail.com', 'yahoo.com', 'hotmail.com'] }
        },
        outputs: ['sender_email', 'sender_name', 'company_domain', 'email_content'],
        estimatedDuration: 'Continuous'
      },
      {
        id: 'step-2',
        name: 'Enrich Contact Data',
        description: 'Gather additional information about the contact and company',
        agentId: 'sam',
        type: 'transform',
        status: 'pending',
        config: {
          action: 'enrich_contact',
          sources: ['clearbit', 'linkedin'],
          fields: ['title', 'company_size', 'industry', 'linkedin_url']
        },
        inputs: ['sender_email', 'company_domain'],
        outputs: ['enriched_contact'],
        estimatedDuration: '3-5 seconds'
      },
      {
        id: 'step-3',
        name: 'Check CRM Duplicate',
        description: 'Verify contact doesn\'t already exist in Salesforce',
        agentId: 'larry',
        type: 'condition',
        status: 'pending',
        config: {
          check: 'crm_duplicate',
          matchFields: ['email', 'company']
        },
        inputs: ['sender_email', 'enriched_contact'],
        outputs: ['is_duplicate', 'existing_record_id'],
        estimatedDuration: '1-2 seconds'
      },
      {
        id: 'step-4',
        name: 'Create/Update CRM Record',
        description: 'Add new lead or update existing contact in Salesforce',
        agentId: 'larry',
        type: 'action',
        status: 'pending',
        config: {
          action: 'upsert_contact',
          objectType: 'Lead',
          assignmentRules: true
        },
        inputs: ['enriched_contact', 'is_duplicate', 'existing_record_id'],
        outputs: ['crm_record_id', 'record_url'],
        estimatedDuration: '1-2 seconds'
      }
    ]
  },

  'batch-processing': {
    id: 'wf-batch-optimizer-v1',
    suggestionId: 'batch-processing',
    name: 'Workflow Batch Optimizer',
    description: 'Consolidate multiple similar workflows into efficient batch operations.',
    category: 'optimization',
    requiredIntegrations: [],
    estimatedTimeSaved: '2+ hours/week',
    successRate: 97.8,
    testedAt: new Date('2024-01-18'),
    version: '1.0.0',
    steps: [
      {
        id: 'step-1',
        name: 'Collect Queue',
        description: 'Gather pending workflow items into a processing queue',
        agentId: 'sam',
        type: 'trigger',
        status: 'pending',
        config: {
          trigger: 'queue_threshold',
          minItems: 5,
          maxWait: '30 minutes'
        },
        outputs: ['queue_items', 'item_count'],
        estimatedDuration: 'Up to 30 min'
      },
      {
        id: 'step-2',
        name: 'Categorize Items',
        description: 'Group similar items for parallel processing',
        agentId: 'sam',
        type: 'transform',
        status: 'pending',
        config: {
          action: 'categorize',
          groupBy: ['type', 'priority', 'destination']
        },
        inputs: ['queue_items'],
        outputs: ['grouped_items', 'group_count'],
        estimatedDuration: '< 1 second'
      },
      {
        id: 'step-3',
        name: 'Parallel Execution',
        description: 'Process each group in parallel for maximum efficiency',
        agentId: 'alex',
        type: 'action',
        status: 'pending',
        config: {
          action: 'parallel_process',
          maxConcurrency: 10,
          retryOnFailure: true
        },
        inputs: ['grouped_items'],
        outputs: ['results', 'failures'],
        estimatedDuration: 'Varies by batch size'
      },
      {
        id: 'step-4',
        name: 'Report Results',
        description: 'Generate summary of batch processing results',
        agentId: 'emma',
        type: 'action',
        status: 'pending',
        config: {
          action: 'generate_report',
          format: 'summary',
          notifyOnFailure: true
        },
        inputs: ['results', 'failures', 'item_count'],
        outputs: ['report_url', 'success_rate'],
        estimatedDuration: '1-2 seconds'
      }
    ]
  },

  'meeting-intelligence': {
    id: 'wf-meeting-intel-v1',
    suggestionId: 'meeting-intelligence',
    name: 'AI Meeting Intelligence',
    description: 'Automatically transcribe meetings, extract action items, and distribute summaries to attendees.',
    category: 'meetings',
    requiredIntegrations: ['calendar', 'zoom'],
    estimatedTimeSaved: '6+ hours/week',
    successRate: 96.5,
    testedAt: new Date('2024-01-22'),
    version: '1.5.0',
    steps: [
      {
        id: 'step-1',
        name: 'Join & Record Meeting',
        description: 'Automatically join scheduled meetings and start recording',
        agentId: 'nexus',
        type: 'trigger',
        status: 'pending',
        config: {
          trigger: 'meeting_start',
          autoJoin: true,
          recordAudio: true,
          recordTranscript: true
        },
        outputs: ['meeting_id', 'recording_url', 'attendees'],
        estimatedDuration: 'Meeting duration'
      },
      {
        id: 'step-2',
        name: 'Transcribe & Analyze',
        description: 'Convert recording to text and identify key moments',
        agentId: 'emma',
        type: 'transform',
        status: 'pending',
        config: {
          action: 'transcribe',
          language: 'auto',
          speakerDiarization: true,
          identifyTopics: true
        },
        inputs: ['recording_url'],
        outputs: ['transcript', 'topics', 'speaker_segments'],
        estimatedDuration: '2-5 minutes'
      },
      {
        id: 'step-3',
        name: 'Extract Action Items',
        description: 'Identify tasks, decisions, and assignments from discussion',
        agentId: 'pat',
        type: 'transform',
        status: 'pending',
        config: {
          action: 'extract_actions',
          categorize: ['task', 'decision', 'question', 'followup'],
          assignOwners: true
        },
        inputs: ['transcript', 'attendees'],
        outputs: ['action_items', 'decisions', 'questions'],
        estimatedDuration: '10-15 seconds'
      },
      {
        id: 'step-4',
        name: 'Generate Summary',
        description: 'Create executive summary with key points and action items',
        agentId: 'emma',
        type: 'action',
        status: 'pending',
        config: {
          action: 'generate_summary',
          format: 'executive_brief',
          maxLength: 500,
          includeActionItems: true
        },
        inputs: ['transcript', 'topics', 'action_items', 'decisions'],
        outputs: ['summary', 'key_points'],
        estimatedDuration: '5-10 seconds'
      },
      {
        id: 'step-5',
        name: 'Distribute & Create Tasks',
        description: 'Email summary to attendees and create tasks in project management',
        agentId: 'mary',
        type: 'action',
        status: 'pending',
        config: {
          action: 'distribute',
          emailSummary: true,
          createTasks: true,
          taskDestination: 'default_project'
        },
        inputs: ['summary', 'action_items', 'attendees'],
        outputs: ['email_sent', 'tasks_created'],
        estimatedDuration: '2-3 seconds'
      }
    ]
  },

  'whatsapp-triggers': {
    id: 'wf-whatsapp-trigger-v1',
    suggestionId: 'whatsapp-triggers',
    name: 'WhatsApp Workflow Triggers',
    description: 'Execute business workflows by sending commands via WhatsApp messages.',
    category: 'messaging',
    requiredIntegrations: ['whatsapp'],
    estimatedTimeSaved: '2+ hours/week',
    successRate: 99.0,
    testedAt: new Date('2024-01-25'),
    version: '1.0.0',
    steps: [
      {
        id: 'step-1',
        name: 'Listen for Commands',
        description: 'Monitor WhatsApp for workflow trigger messages',
        agentId: 'nexus',
        type: 'trigger',
        status: 'pending',
        config: {
          trigger: 'whatsapp_message',
          commandPrefix: '/',
          authorizedNumbers: 'user_defined'
        },
        outputs: ['command', 'parameters', 'sender', 'timestamp'],
        estimatedDuration: 'Continuous'
      },
      {
        id: 'step-2',
        name: 'Parse Command',
        description: 'Interpret the command and extract parameters',
        agentId: 'sam',
        type: 'transform',
        status: 'pending',
        config: {
          action: 'parse_command',
          supportedCommands: ['report', 'status', 'send', 'create', 'update'],
          naturalLanguage: true
        },
        inputs: ['command', 'parameters'],
        outputs: ['action_type', 'action_params', 'confidence'],
        estimatedDuration: '< 1 second'
      },
      {
        id: 'step-3',
        name: 'Execute Workflow',
        description: 'Run the requested workflow with provided parameters',
        agentId: 'alex',
        type: 'action',
        status: 'pending',
        config: {
          action: 'execute_workflow',
          workflowMapping: 'user_defined',
          timeout: 60000
        },
        inputs: ['action_type', 'action_params'],
        outputs: ['result', 'execution_time', 'status'],
        estimatedDuration: 'Varies by workflow'
      },
      {
        id: 'step-4',
        name: 'Send Response',
        description: 'Reply via WhatsApp with execution results',
        agentId: 'nexus',
        type: 'action',
        status: 'pending',
        config: {
          action: 'send_whatsapp',
          formatResponse: true,
          includeTimestamp: true
        },
        inputs: ['result', 'sender', 'execution_time'],
        outputs: ['message_sent', 'delivery_status'],
        estimatedDuration: '1-2 seconds'
      }
    ]
  },

  'error-recovery': {
    id: 'wf-error-recovery-v1',
    suggestionId: 'error-recovery',
    name: 'Smart Error Recovery System',
    description: 'Automatically detect, diagnose, and recover from common workflow failures.',
    category: 'system',
    requiredIntegrations: [],
    estimatedTimeSaved: '4+ hours/week',
    successRate: 85.0,
    testedAt: new Date('2024-01-28'),
    version: '1.1.0',
    steps: [
      {
        id: 'step-1',
        name: 'Monitor Workflows',
        description: 'Watch all running workflows for errors and failures',
        agentId: 'sam',
        type: 'trigger',
        status: 'pending',
        config: {
          trigger: 'workflow_error',
          errorTypes: ['timeout', 'api_error', 'auth_failure', 'data_error'],
          priority: 'high'
        },
        outputs: ['workflow_id', 'error_type', 'error_details', 'context'],
        estimatedDuration: 'Continuous'
      },
      {
        id: 'step-2',
        name: 'Diagnose Issue',
        description: 'Analyze the error and determine recovery strategy',
        agentId: 'sam',
        type: 'transform',
        status: 'pending',
        config: {
          action: 'diagnose',
          checkConnections: true,
          analyzePatterns: true,
          suggestFixes: true
        },
        inputs: ['error_type', 'error_details', 'context'],
        outputs: ['diagnosis', 'recovery_strategy', 'confidence'],
        estimatedDuration: '2-5 seconds'
      },
      {
        id: 'step-3',
        name: 'Auto-Recover',
        description: 'Attempt automatic recovery based on diagnosis',
        agentId: 'alex',
        type: 'condition',
        status: 'pending',
        config: {
          check: 'recovery_possible',
          autoRetry: true,
          maxRetries: 3,
          backoffStrategy: 'exponential'
        },
        inputs: ['workflow_id', 'recovery_strategy', 'confidence'],
        outputs: ['recovery_successful', 'retry_count', 'final_status'],
        estimatedDuration: 'Varies'
      },
      {
        id: 'step-4',
        name: 'Notify & Log',
        description: 'Alert user if manual intervention needed, log all outcomes',
        agentId: 'nexus',
        type: 'action',
        status: 'pending',
        config: {
          action: 'notify_and_log',
          notifyOnFailure: true,
          notifyOnRecovery: false,
          logLevel: 'detailed'
        },
        inputs: ['workflow_id', 'diagnosis', 'recovery_successful', 'final_status'],
        outputs: ['notification_sent', 'log_entry_id'],
        estimatedDuration: '< 1 second'
      }
    ]
  }
}

// Get workflow by suggestion ID
export function getSuggestionWorkflow(suggestionId: string): SuggestionWorkflow | null {
  return SUGGESTION_WORKFLOWS[suggestionId] || null
}

// Check if integrations are connected for a workflow
export function checkWorkflowRequirements(
  workflow: SuggestionWorkflow,
  connectedIntegrations: string[]
): { canRun: boolean; missingIntegrations: string[] } {
  const missing = workflow.requiredIntegrations.filter(
    int => !connectedIntegrations.includes(int.toLowerCase())
  )
  return {
    canRun: missing.length === 0,
    missingIntegrations: missing
  }
}
