/**
 * Nexus Workflow Intelligence Layer
 *
 * CEO DIRECTIVE: "Nexus should intuitively have this kind of smartness to provide
 * intelligent solutions that makes user's business life run surprisingly easy."
 *
 * This module provides:
 * 1. Implicit requirement detection (what's needed but not stated)
 * 2. Smart clarifying questions generation
 * 3. Optimal tool recommendation (best tools, not just available)
 * 4. Regional intelligence (Kuwait/Gulf Arabic focus)
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ImplicitRequirement {
  category: string;
  description: string;
  reason: string;
  priority: 'critical' | 'important' | 'optional';
  suggestedTools: string[];
}

export interface ClarifyingQuestion {
  id: string;
  question: string;
  category: 'language' | 'frequency' | 'audience' | 'format' | 'platform' | 'region' | 'integration';
  options: QuestionOption[];
  required: boolean;
  relevanceScore: number;
}

export interface QuestionOption {
  value: string;
  label: string;
  description?: string;
  implications?: string[];
}

export interface ToolRecommendation {
  toolSlug: string;
  toolName: string;
  score: number;
  reasons: string[];
  regionalFit: number;
  accuracyRating?: string;
  dialectSupport?: string[];
  alternatives: AlternativeTool[];
}

export interface AlternativeTool {
  toolSlug: string;
  toolName: string;
  reason: string;
  tradeoff: string;
}

export interface RegionalContext {
  region: string;
  language: string;
  dialect?: string;
  businessHours: string;
  preferredChannels: string[];
  paymentMethods: string[];
  complianceRequirements: string[];
}

export interface IntelligenceAnalysis {
  surfaceRequest: string;
  implicitRequirements: ImplicitRequirement[];
  clarifyingQuestions: ClarifyingQuestion[];
  recommendedTools: ToolRecommendation[];
  workflowChain: WorkflowChainStep[];
  regionalContext: RegionalContext | null;
  confidenceScore: number;
}

export interface WorkflowChainStep {
  step: number;
  layer: 'input' | 'processing' | 'output' | 'notification';
  description: string;
  requiredCapability: string;
  suggestedTools: string[];
  isResolved: boolean;
}

// ============================================================================
// WORKFLOW CHAIN PATTERNS
// ============================================================================

/**
 * Patterns for detecting complete workflow chains
 * Each pattern defines what layers are typically needed for a request type
 */
const WORKFLOW_CHAIN_PATTERNS: Record<string, {
  layers: ('input' | 'processing' | 'output' | 'notification')[];
  implicitNeeds: string[];
  questions: string[];
}> = {
  // Meeting Documentation Pattern
  meeting_documentation: {
    layers: ['input', 'processing', 'output', 'notification'],
    implicitNeeds: [
      'Meeting recording tool',
      'Speech-to-text transcription',
      'AI summarization',
      'Document storage',
      'Notification delivery'
    ],
    questions: [
      'What meeting platform do you use?',
      'What language are meetings conducted in?',
      'Where should summaries be saved?',
      'Who should receive notifications?',
      'How often should summaries be sent?'
    ]
  },

  // Email Automation Pattern
  email_automation: {
    layers: ['input', 'processing', 'output'],
    implicitNeeds: [
      'Email source/trigger',
      'Content processing/filtering',
      'Response generation or forwarding'
    ],
    questions: [
      'Which email account to monitor?',
      'What type of emails to process?',
      'What action to take on matching emails?',
      'Who should be notified?'
    ]
  },

  // Content Publishing Pattern
  content_publishing: {
    layers: ['input', 'processing', 'output', 'notification'],
    implicitNeeds: [
      'Content source',
      'Content formatting/transformation',
      'Publishing destination',
      'Team notification'
    ],
    questions: [
      'Where is the source content?',
      'What format should the published content be?',
      'Which platforms to publish to?',
      'Should team be notified on publish?'
    ]
  },

  // Data Reporting Pattern
  data_reporting: {
    layers: ['input', 'processing', 'output', 'notification'],
    implicitNeeds: [
      'Data source connection',
      'Data aggregation/analysis',
      'Report generation',
      'Report delivery'
    ],
    questions: [
      'What data sources to pull from?',
      'What metrics/insights are needed?',
      'What format for the report?',
      'Who should receive the report?',
      'How often should reports be generated?'
    ]
  },

  // CRM Lead Pipeline Pattern
  crm_pipeline: {
    layers: ['input', 'processing', 'output', 'notification'],
    implicitNeeds: [
      'Lead capture source',
      'Lead qualification/scoring',
      'CRM entry creation',
      'Follow-up task assignment',
      'Sales team notification'
    ],
    questions: [
      'Where do leads come from?',
      'What qualifies a lead?',
      'Which CRM to use?',
      'Who handles follow-ups?'
    ]
  },

  // Customer Support Pattern
  customer_support: {
    layers: ['input', 'processing', 'output', 'notification'],
    implicitNeeds: [
      'Ticket/message source',
      'Issue categorization',
      'Response generation or routing',
      'Escalation handling',
      'Team notification'
    ],
    questions: [
      'What channels do customers use?',
      'How should issues be categorized?',
      'Should responses be auto-generated?',
      'What triggers escalation?'
    ]
  },

  // Invoice Processing Pattern
  invoice_processing: {
    layers: ['input', 'processing', 'output', 'notification'],
    implicitNeeds: [
      'Invoice source (email, upload)',
      'Data extraction (OCR/AI)',
      'Accounting system entry',
      'Approval workflow',
      'Payment notification'
    ],
    questions: [
      'How are invoices received?',
      'What accounting system to use?',
      'Is approval required before processing?',
      'Who approves high-value invoices?'
    ]
  }
};

// ============================================================================
// LANGUAGE & DIALECT INTELLIGENCE
// ============================================================================

/**
 * Tool recommendations based on language/dialect requirements
 */
const DIALECT_TOOL_RECOMMENDATIONS: Record<string, {
  transcription: ToolRecommendation[];
  textToSpeech: ToolRecommendation[];
  translation: ToolRecommendation[];
}> = {
  'arabic_gulf': {
    transcription: [
      {
        toolSlug: 'ELEVENLABS_SCRIBE',
        toolName: 'ElevenLabs Scribe',
        score: 98,
        reasons: [
          'Explicit Gulf Arabic dialect support',
          '96.9% accuracy (3.1% WER) - industry leading',
          'Handles dialectal variations well'
        ],
        regionalFit: 100,
        accuracyRating: '96.9%',
        dialectSupport: ['Gulf Arabic', 'Kuwaiti', 'Saudi', 'Emirati', 'Qatari'],
        alternatives: []
      },
      {
        toolSlug: 'DEEPGRAM_SPEECH_TO_TEXT',
        toolName: 'Deepgram Speech-to-Text',
        score: 92,
        reasons: [
          'Good Arabic support',
          'Real-time streaming capability',
          'Already integrated via Rube MCP'
        ],
        regionalFit: 85,
        accuracyRating: '~90%',
        dialectSupport: ['Arabic (general)', 'Gulf Arabic'],
        alternatives: [
          {
            toolSlug: 'SPEECHMATICS_TRANSCRIBE',
            toolName: 'Speechmatics',
            reason: 'Enterprise-grade Gulf dialect model',
            tradeoff: 'Higher cost, requires separate integration'
          }
        ]
      },
      {
        toolSlug: 'FIREFLIES_TRANSCRIBE',
        toolName: 'Fireflies.ai',
        score: 88,
        reasons: [
          'Auto-joins meetings (Zoom, Meet, Teams)',
          'Arabic support (100+ languages)',
          'Already integrated via Rube MCP'
        ],
        regionalFit: 80,
        accuracyRating: 'Good',
        dialectSupport: ['Arabic (general)'],
        alternatives: []
      }
    ],
    textToSpeech: [],
    translation: []
  },
  'arabic_msa': {
    transcription: [
      {
        toolSlug: 'DEEPGRAM_SPEECH_TO_TEXT',
        toolName: 'Deepgram Speech-to-Text',
        score: 95,
        reasons: [
          'Excellent Modern Standard Arabic support',
          'High accuracy for formal Arabic'
        ],
        regionalFit: 90,
        accuracyRating: '~95%',
        dialectSupport: ['Arabic MSA'],
        alternatives: []
      }
    ],
    textToSpeech: [],
    translation: []
  },
  'english': {
    transcription: [
      {
        toolSlug: 'FIREFLIES_TRANSCRIBE',
        toolName: 'Fireflies.ai',
        score: 96,
        reasons: [
          'Excellent English accuracy',
          'Auto-joins meetings',
          'Built-in summarization'
        ],
        regionalFit: 100,
        accuracyRating: '~98%',
        dialectSupport: ['English (US)', 'English (UK)', 'English (AU)'],
        alternatives: []
      }
    ],
    textToSpeech: [],
    translation: []
  }
};

// ============================================================================
// REGIONAL INTELLIGENCE - KUWAIT SME FOCUS
// ============================================================================

const KUWAIT_REGIONAL_CONTEXT: RegionalContext = {
  region: 'Kuwait',
  language: 'Arabic',
  dialect: 'Gulf/Kuwaiti',
  businessHours: 'Sunday-Thursday, 8:00-17:00 AST',
  preferredChannels: ['WhatsApp', 'Instagram', 'Email'],
  paymentMethods: ['KNET', 'Credit Card', 'Bank Transfer'],
  complianceRequirements: [
    'Kuwait Commercial Law',
    'MOCI registration',
    'VAT (if applicable)'
  ]
};

// ============================================================================
// KEYWORD PATTERNS FOR DETECTION
// ============================================================================

const WORKFLOW_KEYWORDS: Record<string, string[]> = {
  meeting_documentation: [
    'meeting', 'meetings', 'record', 'document', 'summarize', 'summary',
    'notes', 'minutes', 'transcribe', 'standup', 'standup'
  ],
  email_automation: [
    'email', 'emails', 'inbox', 'send', 'reply', 'forward', 'filter',
    'auto-reply', 'newsletter'
  ],
  content_publishing: [
    'publish', 'post', 'blog', 'article', 'social', 'content',
    'wordpress', 'medium', 'linkedin'
  ],
  data_reporting: [
    'report', 'analytics', 'metrics', 'dashboard', 'data', 'weekly',
    'monthly', 'summary', 'kpi'
  ],
  crm_pipeline: [
    'lead', 'leads', 'crm', 'sales', 'pipeline', 'prospect', 'contact',
    'deal', 'opportunity'
  ],
  customer_support: [
    'support', 'ticket', 'help', 'customer', 'service', 'complaint',
    'inquiry', 'escalate'
  ],
  invoice_processing: [
    'invoice', 'invoices', 'bill', 'payment', 'expense', 'accounting',
    'receipt', 'vendor'
  ]
};

const LANGUAGE_KEYWORDS: Record<string, string[]> = {
  arabic_gulf: [
    'arabic', 'kuwaiti', 'kuwait', 'gulf', 'khaleeji', 'emirati', 'saudi',
    'qatari', 'bahraini', 'عربي', 'كويتي', 'خليجي'
  ],
  arabic_msa: [
    'modern standard', 'formal arabic', 'fusha', 'فصحى'
  ],
  english: [
    'english'
  ],
  french: [
    'french', 'français'
  ],
  hindi: [
    'hindi', 'हिंदी'
  ]
};

// ============================================================================
// MAIN INTELLIGENCE CLASS
// ============================================================================

export class WorkflowIntelligence {
  private regionalContext: RegionalContext | null = null;

  constructor(region?: string) {
    if (region?.toLowerCase() === 'kuwait') {
      this.regionalContext = KUWAIT_REGIONAL_CONTEXT;
    }
  }

  /**
   * Analyze a user request and extract all intelligence layers
   */
  analyzeRequest(userRequest: string): IntelligenceAnalysis {
    const normalizedRequest = userRequest.toLowerCase();

    // Detect workflow pattern
    const detectedPattern = this.detectWorkflowPattern(normalizedRequest);

    // Detect language/dialect requirements
    const languageContext = this.detectLanguageContext(normalizedRequest);

    // Build implicit requirements
    const implicitRequirements = this.extractImplicitRequirements(
      normalizedRequest,
      detectedPattern,
      languageContext
    );

    // Generate clarifying questions
    const clarifyingQuestions = this.generateClarifyingQuestions(
      normalizedRequest,
      detectedPattern,
      languageContext
    );

    // Build workflow chain
    const workflowChain = this.buildWorkflowChain(
      detectedPattern,
      implicitRequirements
    );

    // Get tool recommendations
    const recommendedTools = this.getOptimalToolRecommendations(
      detectedPattern,
      languageContext
    );

    // Calculate confidence
    const confidenceScore = this.calculateConfidenceScore(
      detectedPattern,
      clarifyingQuestions.filter(q => q.required).length
    );

    return {
      surfaceRequest: userRequest,
      implicitRequirements,
      clarifyingQuestions,
      recommendedTools,
      workflowChain,
      regionalContext: this.regionalContext,
      confidenceScore
    };
  }

  /**
   * Detect which workflow pattern matches the user request
   */
  private detectWorkflowPattern(request: string): string | null {
    let bestMatch: string | null = null;
    let highestScore = 0;

    for (const [pattern, keywords] of Object.entries(WORKFLOW_KEYWORDS)) {
      const score = keywords.filter(kw => request.includes(kw)).length;
      if (score > highestScore) {
        highestScore = score;
        bestMatch = pattern;
      }
    }

    return highestScore >= 2 ? bestMatch : null;
  }

  /**
   * Detect language/dialect context from request
   */
  private detectLanguageContext(request: string): string | null {
    for (const [lang, keywords] of Object.entries(LANGUAGE_KEYWORDS)) {
      if (keywords.some(kw => request.includes(kw))) {
        return lang;
      }
    }

    // Default to Gulf Arabic if Kuwait regional context is set
    if (this.regionalContext?.region === 'Kuwait') {
      return 'arabic_gulf';
    }

    return null;
  }

  /**
   * Extract implicit requirements based on pattern and context
   */
  private extractImplicitRequirements(
    _request: string,
    pattern: string | null,
    languageContext: string | null
  ): ImplicitRequirement[] {
    const requirements: ImplicitRequirement[] = [];

    if (pattern && WORKFLOW_CHAIN_PATTERNS[pattern]) {
      const patternDef = WORKFLOW_CHAIN_PATTERNS[pattern];

      patternDef.implicitNeeds.forEach((need, index) => {
        requirements.push({
          category: patternDef.layers[Math.min(index, patternDef.layers.length - 1)],
          description: need,
          reason: `Required for complete ${pattern.replace('_', ' ')} workflow`,
          priority: index < 3 ? 'critical' : 'important',
          suggestedTools: this.getToolsForNeed(need, languageContext)
        });
      });
    }

    // Add language-specific requirements
    if (languageContext === 'arabic_gulf') {
      requirements.push({
        category: 'processing',
        description: 'Gulf Arabic dialect transcription',
        reason: 'Standard transcription tools have poor Gulf dialect accuracy',
        priority: 'critical',
        suggestedTools: ['ElevenLabs Scribe', 'Deepgram', 'Speechmatics']
      });
    }

    return requirements;
  }

  /**
   * Generate smart clarifying questions
   */
  private generateClarifyingQuestions(
    _request: string,
    pattern: string | null,
    languageContext: string | null
  ): ClarifyingQuestion[] {
    const questions: ClarifyingQuestion[] = [];
    let questionId = 1;

    // Language question (if not detected)
    if (!languageContext) {
      questions.push({
        id: `q${questionId++}`,
        question: 'What language/dialect will be used?',
        category: 'language',
        options: [
          { value: 'english', label: 'English', description: 'English (any accent)' },
          { value: 'arabic_gulf', label: 'Arabic (Gulf/Kuwaiti)', description: 'Gulf dialect - Kuwait, Saudi, UAE, etc.', implications: ['Will recommend dialect-optimized tools'] },
          { value: 'arabic_msa', label: 'Arabic (Modern Standard)', description: 'Formal Arabic / Fusha' },
          { value: 'mixed', label: 'Mixed Languages', description: 'Conversations in multiple languages' }
        ],
        required: true,
        relevanceScore: 100
      });
    }

    // Pattern-specific questions
    if (pattern === 'meeting_documentation') {
      questions.push({
        id: `q${questionId++}`,
        question: 'What meeting platform do you use?',
        category: 'platform',
        options: [
          { value: 'google_meet', label: 'Google Meet', description: 'Google Workspace meetings' },
          { value: 'zoom', label: 'Zoom', description: 'Zoom video calls' },
          { value: 'teams', label: 'Microsoft Teams', description: 'MS Teams meetings' },
          { value: 'in_person', label: 'In-Person', description: 'Physical meetings (need mobile recording)' }
        ],
        required: true,
        relevanceScore: 95
      });

      questions.push({
        id: `q${questionId++}`,
        question: 'Where should meeting summaries be saved?',
        category: 'integration',
        options: [
          { value: 'notion', label: 'Notion', description: 'Save to Notion workspace' },
          { value: 'google_docs', label: 'Google Docs', description: 'Save to Google Drive' },
          { value: 'google_sheets', label: 'Google Sheets', description: 'Structured data in spreadsheet' },
          { value: 'email_only', label: 'Email Only', description: 'Just send via email' }
        ],
        required: true,
        relevanceScore: 90
      });

      questions.push({
        id: `q${questionId++}`,
        question: 'How often should summary emails be sent?',
        category: 'frequency',
        options: [
          { value: 'per_meeting', label: 'After Each Meeting', description: 'Immediate summary after each meeting' },
          { value: 'daily', label: 'Daily Digest', description: 'Summary of all meetings each day' },
          { value: 'weekly', label: 'Weekly Summary', description: 'Consolidated weekly report' }
        ],
        required: false,
        relevanceScore: 75
      });
    }

    // Add regional-specific questions if Kuwait context
    if (this.regionalContext?.region === 'Kuwait') {
      questions.push({
        id: `q${questionId++}`,
        question: 'Should WhatsApp notifications be enabled?',
        category: 'integration',
        options: [
          { value: 'yes', label: 'Yes', description: 'Send notifications via WhatsApp (popular in Kuwait)' },
          { value: 'no', label: 'No', description: 'Use email/Slack only' }
        ],
        required: false,
        relevanceScore: 70
      });
    }

    return questions;
  }

  /**
   * Build the complete workflow chain
   */
  private buildWorkflowChain(
    pattern: string | null,
    requirements: ImplicitRequirement[]
  ): WorkflowChainStep[] {
    const chain: WorkflowChainStep[] = [];
    let step = 1;

    if (pattern && WORKFLOW_CHAIN_PATTERNS[pattern]) {
      const layers = WORKFLOW_CHAIN_PATTERNS[pattern].layers;

      layers.forEach(layer => {
        const layerRequirements = requirements.filter(r => r.category === layer);
        layerRequirements.forEach(req => {
          chain.push({
            step: step++,
            layer,
            description: req.description,
            requiredCapability: req.description,
            suggestedTools: req.suggestedTools,
            isResolved: false
          });
        });
      });
    }

    return chain;
  }

  /**
   * Get optimal tool recommendations based on context
   */
  private getOptimalToolRecommendations(
    _pattern: string | null,
    languageContext: string | null
  ): ToolRecommendation[] {
    const recommendations: ToolRecommendation[] = [];

    // Add language-specific transcription tools
    if (languageContext && DIALECT_TOOL_RECOMMENDATIONS[languageContext]) {
      recommendations.push(
        ...DIALECT_TOOL_RECOMMENDATIONS[languageContext].transcription
      );
    }

    // Sort by score
    return recommendations.sort((a, b) => b.score - a.score);
  }

  /**
   * Get suggested tools for a specific need
   */
  private getToolsForNeed(need: string, languageContext: string | null): string[] {
    const needLower = need.toLowerCase();

    if (needLower.includes('transcription') || needLower.includes('speech')) {
      if (languageContext === 'arabic_gulf') {
        return ['ElevenLabs Scribe', 'Deepgram', 'Speechmatics'];
      }
      return ['Fireflies.ai', 'Deepgram', 'Otter.ai'];
    }

    if (needLower.includes('recording')) {
      return ['Fireflies.ai', 'Google Meet Recording', 'Zoom Recording'];
    }

    if (needLower.includes('storage') || needLower.includes('document')) {
      return ['Notion', 'Google Docs', 'Google Sheets', 'Confluence'];
    }

    if (needLower.includes('notification') || needLower.includes('delivery')) {
      return ['Gmail', 'Slack', 'WhatsApp', 'Microsoft Teams'];
    }

    if (needLower.includes('summary') || needLower.includes('summariz')) {
      return ['Claude AI', 'GPT-4', 'Fireflies AI Apps'];
    }

    return [];
  }

  /**
   * Calculate confidence score for the analysis
   */
  private calculateConfidenceScore(
    pattern: string | null,
    requiredQuestionsCount: number
  ): number {
    let score = 50; // Base score

    if (pattern) score += 30; // Pattern detected
    if (this.regionalContext) score += 10; // Regional context available

    // Reduce by unresolved questions
    score -= requiredQuestionsCount * 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Check if a workflow request is complete enough to execute
   */
  isExecutionReady(analysis: IntelligenceAnalysis): {
    ready: boolean;
    missingPieces: string[];
    recommendations: string[];
  } {
    const missingPieces: string[] = [];
    const recommendations: string[] = [];

    // Check for unresolved workflow steps
    const unresolvedSteps = analysis.workflowChain.filter(s => !s.isResolved);
    if (unresolvedSteps.length > 0) {
      missingPieces.push(
        ...unresolvedSteps.map(s => `Step ${s.step}: ${s.description}`)
      );
    }

    // Check for required unanswered questions
    const requiredQuestions = analysis.clarifyingQuestions.filter(q => q.required);
    if (requiredQuestions.length > 0) {
      missingPieces.push(
        ...requiredQuestions.map(q => `Need answer: ${q.question}`)
      );
    }

    // Add proactive recommendations
    if (analysis.confidenceScore < 80) {
      recommendations.push('Consider answering clarifying questions for better results');
    }

    if (analysis.regionalContext?.region === 'Kuwait' &&
        !analysis.recommendedTools.some(t => t.dialectSupport?.includes('Gulf Arabic'))) {
      recommendations.push('For Kuwaiti dialect, recommend using ElevenLabs Scribe or Deepgram');
    }

    return {
      ready: missingPieces.length === 0,
      missingPieces,
      recommendations
    };
  }

  /**
   * Get a human-readable summary of the intelligence analysis
   */
  getSummary(analysis: IntelligenceAnalysis): string {
    const lines: string[] = [];

    lines.push(`## Nexus Intelligence Analysis\n`);
    lines.push(`**Request:** "${analysis.surfaceRequest}"\n`);
    lines.push(`**Confidence:** ${analysis.confidenceScore}%\n`);

    if (analysis.implicitRequirements.length > 0) {
      lines.push(`\n### Implicit Requirements Detected`);
      analysis.implicitRequirements.forEach(req => {
        lines.push(`- **${req.description}** (${req.priority})`);
        lines.push(`  - Reason: ${req.reason}`);
        lines.push(`  - Suggested tools: ${req.suggestedTools.join(', ')}`);
      });
    }

    if (analysis.clarifyingQuestions.length > 0) {
      lines.push(`\n### Smart Questions to Ask`);
      analysis.clarifyingQuestions.forEach(q => {
        const marker = q.required ? '(Required)' : '(Optional)';
        lines.push(`- ${q.question} ${marker}`);
      });
    }

    if (analysis.recommendedTools.length > 0) {
      lines.push(`\n### Optimal Tool Recommendations`);
      analysis.recommendedTools.forEach(tool => {
        lines.push(`- **${tool.toolName}** (Score: ${tool.score})`);
        tool.reasons.forEach(r => lines.push(`  - ${r}`));
        if (tool.dialectSupport) {
          lines.push(`  - Dialect support: ${tool.dialectSupport.join(', ')}`);
        }
      });
    }

    if (analysis.workflowChain.length > 0) {
      lines.push(`\n### Complete Workflow Chain`);
      analysis.workflowChain.forEach(step => {
        const status = step.isResolved ? '✅' : '⏳';
        lines.push(`${status} Step ${step.step} (${step.layer}): ${step.description}`);
      });
    }

    if (analysis.regionalContext) {
      lines.push(`\n### Regional Context: ${analysis.regionalContext.region}`);
      lines.push(`- Language: ${analysis.regionalContext.language} (${analysis.regionalContext.dialect || 'standard'})`);
      lines.push(`- Business hours: ${analysis.regionalContext.businessHours}`);
      lines.push(`- Preferred channels: ${analysis.regionalContext.preferredChannels.join(', ')}`);
    }

    return lines.join('\n');
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default WorkflowIntelligence;

// Convenience function for quick analysis
export function analyzeUserRequest(
  request: string,
  region?: string
): IntelligenceAnalysis {
  const intelligence = new WorkflowIntelligence(region);
  return intelligence.analyzeRequest(request);
}

// Get summary for a request
export function getIntelligenceSummary(
  request: string,
  region?: string
): string {
  const intelligence = new WorkflowIntelligence(region);
  const analysis = intelligence.analyzeRequest(request);
  return intelligence.getSummary(analysis);
}
