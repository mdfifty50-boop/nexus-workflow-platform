// Advanced Multi-Agent Workflow Templates
import type { WorkflowDefinition } from './workflow-engine'

export interface AdvancedWorkflowTemplate {
  id: string
  name: string
  description: string
  category: 'multi-agent' | 'data-pipeline' | 'conditional' | 'iterative'
  icon: string
  definition: WorkflowDefinition
  exampleInput: any
  expectedOutput: string
  estimatedCost: string
  estimatedTime: string
}

export const advancedWorkflowTemplates: AdvancedWorkflowTemplate[] = [
  {
    id: 'content-creation-pipeline',
    name: 'Multi-Agent Content Creation Pipeline',
    description: 'Research → Draft → Review → Publish - 4 AI agents working together',
    category: 'multi-agent',
    icon: '🏭',
    definition: {
      nodes: [
        {
          id: 'start',
          type: 'start',
          label: 'Start',
          config: {},
          position: { x: 50, y: 200 },
        },
        {
          id: 'researcher',
          type: 'ai-agent',
          label: 'Research Agent',
          config: {
            prompt: 'You are a research agent. Research the following topic thoroughly and provide key facts, statistics, and insights:\n\nTopic: {{input}}\n\nProvide:\n- 5 key facts\n- 3 compelling statistics\n- 2 expert quotes (can be hypothetical)\n- 3 related subtopics',
            model: 'claude-3-5-haiku-20241022',
          },
          position: { x: 250, y: 200 },
        },
        {
          id: 'writer',
          type: 'ai-agent',
          label: 'Writing Agent',
          config: {
            prompt: 'You are a professional writer. Using the research provided, write a compelling 500-word article:\n\nResearch: {{input}}\n\nRequirements:\n- Engaging headline\n- Strong opening hook\n- Well-structured body (3 paragraphs)\n- Compelling conclusion\n- SEO-friendly',
            model: 'claude-3-5-sonnet-20241022',
          },
          position: { x: 450, y: 200 },
        },
        {
          id: 'editor',
          type: 'ai-agent',
          label: 'Editor Agent',
          config: {
            prompt: 'You are a professional editor. Review and improve this article:\n\nArticle: {{input}}\n\nTasks:\n- Fix grammar and spelling\n- Improve clarity and flow\n- Enhance word choice\n- Add subheadings\n- Fact-check claims',
            model: 'claude-3-5-sonnet-20241022',
          },
          position: { x: 650, y: 200 },
        },
        {
          id: 'seo-optimizer',
          type: 'ai-agent',
          label: 'SEO Optimizer',
          config: {
            prompt: 'You are an SEO specialist. Optimize this article for search engines:\n\nArticle: {{input}}\n\nProvide:\n- Meta title (60 chars)\n- Meta description (155 chars)\n- 5 target keywords\n- Internal link suggestions\n- Featured snippet optimization',
            model: 'claude-3-5-haiku-20241022',
          },
          position: { x: 850, y: 200 },
        },
        {
          id: 'end',
          type: 'end',
          label: 'End',
          config: {},
          position: { x: 1050, y: 200 },
        },
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'researcher' },
        { id: 'e2', source: 'researcher', target: 'writer' },
        { id: 'e3', source: 'writer', target: 'editor' },
        { id: 'e4', source: 'editor', target: 'seo-optimizer' },
        { id: 'e5', source: 'seo-optimizer', target: 'end' },
      ],
    },
    exampleInput: 'AI in Healthcare',
    expectedOutput: 'Fully researched, written, edited, and SEO-optimized article',
    estimatedCost: '$0.15 - $0.30',
    estimatedTime: '30-60 seconds',
  },
  {
    id: 'customer-support-automation',
    name: 'Intelligent Customer Support Workflow',
    description: 'Classify → Route → Generate Response → Sentiment Analysis',
    category: 'multi-agent',
    icon: '🎧',
    definition: {
      nodes: [
        {
          id: 'start',
          type: 'start',
          label: 'Start',
          config: {},
          position: { x: 50, y: 200 },
        },
        {
          id: 'classifier',
          type: 'ai-agent',
          label: 'Ticket Classifier',
          config: {
            prompt: 'Classify this support ticket:\n\n{{input}}\n\nProvide:\n- Category (Technical/Billing/Sales/General)\n- Priority (Low/Medium/High/Urgent)\n- Sentiment (Positive/Neutral/Negative/Angry)\n- Key issue summary (1 sentence)',
            model: 'claude-3-5-haiku-20241022',
          },
          position: { x: 250, y: 200 },
        },
        {
          id: 'response-generator',
          type: 'ai-agent',
          label: 'Response Generator',
          config: {
            prompt: 'Generate a professional customer support response:\n\nTicket Classification: {{input}}\n\nRequirements:\n- Empathetic tone\n- Address the specific issue\n- Provide actionable solution\n- Include next steps\n- Professional sign-off',
            model: 'claude-3-5-sonnet-20241022',
          },
          position: { x: 450, y: 200 },
        },
        {
          id: 'qa-checker',
          type: 'ai-agent',
          label: 'Quality Checker',
          config: {
            prompt: 'Review this customer support response for quality:\n\n{{input}}\n\nCheck:\n- Professionalism\n- Accuracy\n- Completeness\n- Tone appropriateness\n- Grammar\n\nProvide: APPROVED or NEEDS_REVISION with specific feedback',
            model: 'claude-3-5-haiku-20241022',
          },
          position: { x: 650, y: 200 },
        },
        {
          id: 'end',
          type: 'end',
          label: 'End',
          config: {},
          position: { x: 850, y: 200 },
        },
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'classifier' },
        { id: 'e2', source: 'classifier', target: 'response-generator' },
        { id: 'e3', source: 'response-generator', target: 'qa-checker' },
        { id: 'e4', source: 'qa-checker', target: 'end' },
      ],
    },
    exampleInput: 'Customer message: I\'ve been charged twice for my subscription this month! This is unacceptable!',
    expectedOutput: 'Classified ticket + professional response + quality review',
    estimatedCost: '$0.08 - $0.15',
    estimatedTime: '20-40 seconds',
  },
  {
    id: 'sales-lead-processor',
    name: 'Sales Lead Processing Pipeline',
    description: 'Qualify → Research → Personalize → Schedule - Complete lead workflow',
    category: 'multi-agent',
    icon: '💼',
    definition: {
      nodes: [
        {
          id: 'start',
          type: 'start',
          label: 'Start',
          config: {},
          position: { x: 50, y: 200 },
        },
        {
          id: 'qualifier',
          type: 'ai-agent',
          label: 'Lead Qualifier',
          config: {
            prompt: 'Qualify this sales lead:\n\n{{input}}\n\nAnalyze:\n- Budget indicators\n- Authority level\n- Need urgency\n- Timeline\n\nProvide BANT score (1-100) and qualification status (Hot/Warm/Cold/Unqualified)',
            model: 'claude-3-5-haiku-20241022',
          },
          position: { x: 250, y: 200 },
        },
        {
          id: 'researcher',
          type: 'ai-agent',
          label: 'Company Researcher',
          config: {
            prompt: 'Research this company based on lead info:\n\n{{input}}\n\nProvide:\n- Company size estimate\n- Industry challenges\n- Potential pain points\n- Competitive landscape\n- Decision-maker likely concerns',
            model: 'claude-3-5-sonnet-20241022',
          },
          position: { x: 450, y: 200 },
        },
        {
          id: 'personalizer',
          type: 'ai-agent',
          label: 'Outreach Personalizer',
          config: {
            prompt: 'Create personalized sales outreach:\n\n{{input}}\n\nGenerate:\n- Subject line (3 variants)\n- Email body (consultative approach)\n- Value proposition tailored to their industry\n- Call-to-action\n- Follow-up sequence (3 emails)',
            model: 'claude-3-5-sonnet-20241022',
          },
          position: { x: 650, y: 200 },
        },
        {
          id: 'end',
          type: 'end',
          label: 'End',
          config: {},
          position: { x: 850, y: 200 },
        },
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'qualifier' },
        { id: 'e2', source: 'qualifier', target: 'researcher' },
        { id: 'e3', source: 'researcher', target: 'personalizer' },
        { id: 'e4', source: 'personalizer', target: 'end' },
      ],
    },
    exampleInput: 'Lead: John Smith, VP of Operations at TechCorp (500 employees), interested in automation solutions, budget $50K',
    expectedOutput: 'Qualified lead + company research + personalized outreach sequence',
    estimatedCost: '$0.10 - $0.20',
    estimatedTime: '25-45 seconds',
  },
  {
    id: 'data-analysis-pipeline',
    name: 'Automated Data Analysis Pipeline',
    description: 'Clean → Analyze → Visualize → Report - Full data workflow',
    category: 'data-pipeline',
    icon: '📊',
    definition: {
      nodes: [
        {
          id: 'start',
          type: 'start',
          label: 'Start',
          config: {},
          position: { x: 50, y: 200 },
        },
        {
          id: 'cleaner',
          type: 'ai-agent',
          label: 'Data Cleaner',
          config: {
            prompt: 'Clean and structure this data:\n\n{{input}}\n\nTasks:\n- Identify data types\n- Flag anomalies\n- Suggest data cleaning steps\n- Structure in tabular format\n- Note missing values',
            model: 'claude-3-5-haiku-20241022',
          },
          position: { x: 250, y: 200 },
        },
        {
          id: 'analyzer',
          type: 'ai-agent',
          label: 'Data Analyzer',
          config: {
            prompt: 'Analyze this cleaned data:\n\n{{input}}\n\nProvide:\n- Descriptive statistics\n- Key trends and patterns\n- Correlations\n- Outliers\n- 3 key insights',
            model: 'claude-3-5-sonnet-20241022',
          },
          position: { x: 450, y: 200 },
        },
        {
          id: 'visualizer',
          type: 'ai-agent',
          label: 'Visualization Designer',
          config: {
            prompt: 'Design visualizations for this analysis:\n\n{{input}}\n\nSuggest:\n- 3 chart types (with data)\n- Dashboard layout\n- Color scheme\n- Key metrics to highlight\n- Interactive elements',
            model: 'claude-3-5-haiku-20241022',
          },
          position: { x: 650, y: 200 },
        },
        {
          id: 'reporter',
          type: 'ai-agent',
          label: 'Report Generator',
          config: {
            prompt: 'Generate executive summary report:\n\n{{input}}\n\nInclude:\n- Executive summary (3 bullets)\n- Key findings\n- Recommendations\n- Next steps\n- Appendix with methodology',
            model: 'claude-3-5-sonnet-20241022',
          },
          position: { x: 850, y: 200 },
        },
        {
          id: 'end',
          type: 'end',
          label: 'End',
          config: {},
          position: { x: 1050, y: 200 },
        },
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'cleaner' },
        { id: 'e2', source: 'cleaner', target: 'analyzer' },
        { id: 'e3', source: 'analyzer', target: 'visualizer' },
        { id: 'e4', source: 'visualizer', target: 'reporter' },
        { id: 'e5', source: 'reporter', target: 'end' },
      ],
    },
    exampleInput: 'Sales data: Q1-Q4 revenue, customer counts, product performance',
    expectedOutput: 'Complete analysis report with visualizations and insights',
    estimatedCost: '$0.12 - $0.25',
    estimatedTime: '35-60 seconds',
  },
]

export function getAdvancedTemplateById(id: string): AdvancedWorkflowTemplate | undefined {
  return advancedWorkflowTemplates.find(t => t.id === id)
}

export function getAdvancedTemplatesByCategory(category: string): AdvancedWorkflowTemplate[] {
  return advancedWorkflowTemplates.filter(t => t.category === category)
}
