/**
 * Nexus Customer Service Domain Intelligence Module
 *
 * Provides comprehensive customer service workflow intelligence including:
 * - Ticket creation and routing
 * - Escalation management
 * - Knowledge base automation
 * - Customer feedback collection
 * - NPS and CSAT analysis
 * - Complaint resolution workflows
 * - Account management automation
 *
 * Regional Focus: Kuwait/Gulf with Arabic language support,
 * WhatsApp/Instagram preference, and cultural considerations.
 */

import type {
  ImplicitRequirement,
  ClarifyingQuestion,
  ToolRecommendation,
  WorkflowChainStep,
  QuestionOption,
} from '../workflow-intelligence';

// ============================================================================
// TYPES
// ============================================================================

export interface CustomerServiceWorkflowPattern {
  name: string;
  description: string;
  layers: ('input' | 'processing' | 'output' | 'notification')[];
  steps: string[];
  implicitNeeds: string[];
  questions: string[];
  slaRequirements: string[];
  estimatedROI: string;
}

export interface CustomerServiceRegionalContext {
  region: string;
  preferredChannels: string[];
  responseExpectation: string;
  languageSupport: string[];
  peakHours: string;
  culturalNotes: string[];
  businessDays: string;
  holidays: string[];
}

export interface SLAConfiguration {
  priority: 'critical' | 'high' | 'medium' | 'low';
  responseTimeMinutes: number;
  resolutionTimeHours: number;
  escalationThresholdMinutes: number;
  notificationIntervalMinutes: number;
}

export interface NPSResult {
  score: number;
  category: 'promoter' | 'passive' | 'detractor';
  promoters: number;
  passives: number;
  detractors: number;
  totalResponses: number;
  recommendation: string;
}

export interface CSATResult {
  score: number;
  percentage: number;
  satisfiedCount: number;
  totalResponses: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface CustomerServiceAnalysisResult {
  pattern: string | null;
  requirements: ImplicitRequirement[];
  tools: ToolRecommendation[];
  questions: ClarifyingQuestion[];
  slaConfig: SLAConfiguration | null;
  regionalContext: CustomerServiceRegionalContext | null;
}

export interface TicketPriority {
  level: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  indicators: string[];
  autoEscalateMinutes: number;
}

export interface EscalationPath {
  level: number;
  role: string;
  timeToEscalateMinutes: number;
  notificationChannels: string[];
  authority: string[];
}

// ============================================================================
// CUSTOMER SERVICE WORKFLOW PATTERNS
// ============================================================================

export const CUSTOMER_SERVICE_WORKFLOW_PATTERNS: Record<string, CustomerServiceWorkflowPattern> = {
  // Ticket Creation Pattern
  ticket_creation: {
    name: 'Ticket Creation',
    description: 'Automated ticket creation from multiple channels with smart categorization',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'receive_request',
      'extract_details',
      'categorize_issue',
      'assign_priority',
      'create_ticket',
      'assign_agent',
      'notify_customer',
      'notify_agent',
    ],
    implicitNeeds: [
      'Multi-channel intake (WhatsApp, email, phone, social)',
      'AI-powered issue categorization',
      'Priority assignment rules engine',
      'Ticket numbering and tracking system',
      'Agent availability and skill matching',
      'Customer acknowledgment automation',
      'Agent notification with context',
      'SLA timer initiation',
    ],
    questions: [
      'What channels do customers use to contact support?',
      'How should tickets be categorized?',
      'What determines ticket priority?',
      'Should customers receive automatic acknowledgment?',
      'How should agents be assigned to tickets?',
    ],
    slaRequirements: [
      'First response within SLA target',
      'Auto-escalation on SLA breach',
      'Customer notification on status change',
    ],
    estimatedROI: 'Reduces ticket creation time by 80%, improves categorization accuracy by 90%',
  },

  // Ticket Routing Pattern
  ticket_routing: {
    name: 'Ticket Routing',
    description: 'Intelligent ticket routing based on skills, availability, and workload',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'analyze_ticket',
      'identify_skills_needed',
      'check_agent_availability',
      'evaluate_workload',
      'select_best_agent',
      'route_ticket',
      'notify_agent',
      'update_queue',
    ],
    implicitNeeds: [
      'Skill-based routing engine',
      'Real-time agent availability tracking',
      'Workload balancing algorithm',
      'Queue management system',
      'Routing rules configuration',
      'Fallback routing logic',
      'Agent notification system',
      'Routing analytics dashboard',
    ],
    questions: [
      'What agent skills need to be tracked?',
      'How should workload be balanced?',
      'What happens when no agent is available?',
      'Should VIP customers have priority routing?',
      'Do you need language-based routing?',
    ],
    slaRequirements: [
      'Route within 2 minutes of creation',
      'Skill match minimum threshold',
      'Maximum queue wait time',
    ],
    estimatedROI: 'Reduces resolution time by 40%, improves first-contact resolution by 25%',
  },

  // Escalation Workflow Pattern
  escalation_workflow: {
    name: 'Escalation Workflow',
    description: 'Automated escalation based on SLA breaches, customer sentiment, or complexity',
    layers: ['input', 'processing', 'processing', 'output', 'notification'],
    steps: [
      'monitor_ticket',
      'detect_escalation_trigger',
      'determine_escalation_level',
      'identify_escalation_target',
      'escalate_ticket',
      'notify_manager',
      'notify_customer',
      'track_escalation',
    ],
    implicitNeeds: [
      'SLA monitoring engine',
      'Sentiment analysis integration',
      'Escalation matrix configuration',
      'Manager notification system',
      'Escalation reason documentation',
      'Timeline tracking',
      'Resolution deadline enforcement',
      'Escalation metrics reporting',
    ],
    questions: [
      'What triggers should cause escalation?',
      'How many escalation levels do you have?',
      'Who should be notified on escalation?',
      'Should customers be informed of escalations?',
      'What authority does each level have?',
    ],
    slaRequirements: [
      'Escalate within defined timeframes',
      'Manager acknowledgment required',
      'Resolution deadline tracking',
    ],
    estimatedROI: 'Reduces escalation resolution time by 50%, prevents SLA breaches by 70%',
  },

  // Knowledge Base Update Pattern
  knowledge_base_update: {
    name: 'Knowledge Base Update',
    description: 'Automated knowledge base maintenance from resolved tickets and feedback',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'identify_resolution',
      'analyze_pattern',
      'extract_knowledge',
      'format_article',
      'review_content',
      'publish_article',
      'link_to_tickets',
      'notify_team',
    ],
    implicitNeeds: [
      'Resolution pattern detection',
      'AI-powered content extraction',
      'Article formatting templates',
      'Review workflow system',
      'Knowledge base CMS',
      'Search optimization',
      'Article analytics tracking',
      'Version control for articles',
    ],
    questions: [
      'What knowledge base platform do you use?',
      'Who should review new articles?',
      'How should articles be categorized?',
      'Do you need multilingual articles?',
      'Should articles auto-update from new resolutions?',
    ],
    slaRequirements: [
      'Article creation within 48 hours of pattern detection',
      'Review completion within 24 hours',
      'Monthly knowledge base audit',
    ],
    estimatedROI: 'Reduces repeat tickets by 35%, improves self-service by 60%',
  },

  // Customer Feedback Pattern
  customer_feedback: {
    name: 'Customer Feedback',
    description: 'Post-interaction feedback collection and analysis',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'detect_interaction_end',
      'determine_survey_type',
      'send_survey',
      'collect_response',
      'analyze_sentiment',
      'categorize_feedback',
      'trigger_follow_up',
      'update_metrics',
    ],
    implicitNeeds: [
      'Interaction completion detection',
      'Survey template management',
      'Multi-channel survey delivery',
      'Response collection system',
      'Sentiment analysis engine',
      'Feedback categorization AI',
      'Follow-up automation',
      'Feedback dashboard',
    ],
    questions: [
      'When should feedback be requested?',
      'What survey type do you prefer (CSAT, NPS, CES)?',
      'Which channels for survey delivery?',
      'How should negative feedback be handled?',
      'Should feedback affect agent metrics?',
    ],
    slaRequirements: [
      'Survey sent within 1 hour of resolution',
      'Negative feedback follow-up within 4 hours',
      'Weekly feedback analysis report',
    ],
    estimatedROI: 'Increases response rates by 40%, improves service quality by 25%',
  },

  // NPS Survey Pattern
  nps_survey: {
    name: 'NPS Survey',
    description: 'Net Promoter Score collection and analysis workflow',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'identify_survey_target',
      'schedule_survey',
      'send_nps_survey',
      'collect_score',
      'collect_feedback',
      'analyze_response',
      'segment_customer',
      'trigger_action',
      'update_dashboard',
    ],
    implicitNeeds: [
      'Customer segmentation for targeting',
      'Survey scheduling system',
      'Multi-channel NPS delivery',
      'Score calculation engine',
      'Verbatim feedback analysis',
      'Customer segment tracking',
      'Promoter/detractor action triggers',
      'NPS trend analytics',
    ],
    questions: [
      'How often should NPS be measured?',
      'Which customer segments to survey?',
      'What follow-up actions for detractors?',
      'Should promoters be asked for referrals?',
      'Do you need industry benchmarking?',
    ],
    slaRequirements: [
      'Detractor outreach within 24 hours',
      'Monthly NPS report generation',
      'Quarterly trend analysis',
    ],
    estimatedROI: 'Improves NPS score by 15 points, reduces churn by 20%',
  },

  // Complaint Resolution Pattern
  complaint_resolution: {
    name: 'Complaint Resolution',
    description: 'Structured complaint handling with resolution tracking',
    layers: ['input', 'processing', 'processing', 'output', 'notification'],
    steps: [
      'receive_complaint',
      'acknowledge_receipt',
      'investigate_issue',
      'determine_resolution',
      'approve_resolution',
      'implement_resolution',
      'notify_customer',
      'follow_up',
      'close_complaint',
    ],
    implicitNeeds: [
      'Complaint intake system',
      'Automatic acknowledgment',
      'Investigation workflow',
      'Resolution option database',
      'Approval workflow engine',
      'Compensation management',
      'Customer communication templates',
      'Follow-up scheduling',
      'Complaint analytics',
    ],
    questions: [
      'What compensation options are available?',
      'Who approves different resolution types?',
      'What is the target resolution time?',
      'Should customers receive progress updates?',
      'Do you need complaint categorization?',
    ],
    slaRequirements: [
      'Acknowledge within 1 hour',
      'Investigation start within 4 hours',
      'Resolution within 48 hours',
    ],
    estimatedROI: 'Reduces complaint resolution time by 60%, improves satisfaction by 35%',
  },

  // Refund Processing Pattern
  refund_processing: {
    name: 'Refund Processing',
    description: 'Automated refund request handling with policy compliance',
    layers: ['input', 'processing', 'processing', 'output', 'notification'],
    steps: [
      'receive_refund_request',
      'validate_eligibility',
      'check_policy',
      'calculate_refund',
      'route_approval',
      'process_refund',
      'update_systems',
      'notify_customer',
      'update_analytics',
    ],
    implicitNeeds: [
      'Refund request intake',
      'Order/transaction validation',
      'Refund policy rules engine',
      'Refund calculation system',
      'Multi-tier approval workflow',
      'Payment reversal integration',
      'Accounting system update',
      'Customer notification system',
      'Refund analytics dashboard',
    ],
    questions: [
      'What is your refund policy?',
      'What approval thresholds exist?',
      'Which payment methods need reversal?',
      'Should partial refunds be allowed?',
      'Do you offer store credit alternatives?',
    ],
    slaRequirements: [
      'Eligibility check within 2 hours',
      'Approval within 24 hours',
      'Refund processed within 5 business days',
    ],
    estimatedROI: 'Reduces refund processing time by 70%, improves accuracy by 95%',
  },

  // Account Recovery Pattern
  account_recovery: {
    name: 'Account Recovery',
    description: 'Secure account recovery workflow with identity verification',
    layers: ['input', 'processing', 'processing', 'output', 'notification'],
    steps: [
      'receive_recovery_request',
      'verify_identity',
      'check_security_questions',
      'send_verification_code',
      'validate_code',
      'reset_credentials',
      'notify_customer',
      'log_security_event',
    ],
    implicitNeeds: [
      'Multi-channel request intake',
      'Identity verification system',
      'Security question management',
      'OTP/2FA delivery system',
      'Code validation engine',
      'Credential reset workflow',
      'Security notification system',
      'Audit logging',
    ],
    questions: [
      'What identity verification methods to use?',
      'How should OTP be delivered?',
      'What security questions are required?',
      'Should suspicious attempts be flagged?',
      'Do you need fraud detection integration?',
    ],
    slaRequirements: [
      'Initial response within 5 minutes',
      'Identity verification within 15 minutes',
      'Recovery completion within 30 minutes',
    ],
    estimatedROI: 'Reduces recovery time by 80%, prevents 95% of unauthorized access',
  },

  // Feature Request Pattern
  feature_request: {
    name: 'Feature Request',
    description: 'Feature request collection, analysis, and roadmap integration',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'receive_request',
      'categorize_request',
      'check_existing_requests',
      'assess_feasibility',
      'prioritize_request',
      'add_to_backlog',
      'notify_customer',
      'track_progress',
    ],
    implicitNeeds: [
      'Feature request portal',
      'Request categorization system',
      'Duplicate detection',
      'Feasibility assessment workflow',
      'Prioritization framework',
      'Product backlog integration',
      'Customer communication system',
      'Request voting/upvote system',
    ],
    questions: [
      'How should features be categorized?',
      'What prioritization criteria to use?',
      'Should customers vote on features?',
      'Who assesses feasibility?',
      'Do you want roadmap visibility?',
    ],
    slaRequirements: [
      'Acknowledgment within 24 hours',
      'Feasibility assessment within 1 week',
      'Status update monthly',
    ],
    estimatedROI: 'Increases feature adoption by 40%, improves product-market fit by 30%',
  },

  // Bug Report Pattern
  bug_report: {
    name: 'Bug Report',
    description: 'Bug report intake and engineering handoff workflow',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'receive_bug_report',
      'validate_report',
      'reproduce_issue',
      'assess_severity',
      'create_engineering_ticket',
      'assign_developer',
      'notify_customer',
      'track_resolution',
      'close_report',
    ],
    implicitNeeds: [
      'Bug report form/portal',
      'Report validation workflow',
      'Reproduction environment',
      'Severity assessment criteria',
      'Issue tracker integration',
      'Developer assignment system',
      'Customer status updates',
      'Resolution tracking',
    ],
    questions: [
      'What information is needed in bug reports?',
      'How should severity be determined?',
      'Which issue tracker do you use?',
      'Should customers see resolution progress?',
      'Do you need environment details?',
    ],
    slaRequirements: [
      'Acknowledgment within 4 hours',
      'Severity assessment within 24 hours',
      'Critical bugs fixed within 48 hours',
    ],
    estimatedROI: 'Reduces bug resolution time by 50%, improves report quality by 70%',
  },

  // Onboarding Support Pattern
  onboarding_support: {
    name: 'Onboarding Support',
    description: 'New customer onboarding assistance workflow',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'detect_new_customer',
      'assign_onboarding_specialist',
      'send_welcome_message',
      'schedule_onboarding_call',
      'conduct_onboarding',
      'provide_resources',
      'track_progress',
      'collect_feedback',
      'transition_to_support',
    ],
    implicitNeeds: [
      'New customer detection',
      'Specialist assignment system',
      'Welcome message automation',
      'Calendar scheduling integration',
      'Onboarding checklist management',
      'Resource library access',
      'Progress tracking dashboard',
      'Feedback collection system',
    ],
    questions: [
      'What triggers the onboarding process?',
      'What resources do new customers need?',
      'Should onboarding calls be scheduled?',
      'How long is the onboarding period?',
      'What defines successful onboarding?',
    ],
    slaRequirements: [
      'Welcome within 1 hour of signup',
      'First contact within 24 hours',
      'Onboarding completion within 14 days',
    ],
    estimatedROI: 'Improves activation rate by 50%, reduces time-to-value by 60%',
  },

  // Training Request Pattern
  training_request: {
    name: 'Training Request',
    description: 'Customer training request handling and scheduling',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'receive_training_request',
      'assess_needs',
      'recommend_training',
      'schedule_session',
      'send_calendar_invite',
      'prepare_materials',
      'conduct_training',
      'collect_feedback',
      'provide_resources',
    ],
    implicitNeeds: [
      'Training request form',
      'Needs assessment questionnaire',
      'Training catalog system',
      'Scheduling system',
      'Calendar integration',
      'Material preparation workflow',
      'Training delivery platform',
      'Post-training survey',
      'Resource sharing system',
    ],
    questions: [
      'What training topics are available?',
      'How should training be delivered (live, recorded)?',
      'What scheduling tools do you use?',
      'Should there be prerequisites?',
      'Do you offer certification?',
    ],
    slaRequirements: [
      'Response within 24 hours',
      'Session scheduled within 1 week',
      'Materials provided 24 hours before',
    ],
    estimatedROI: 'Increases product adoption by 45%, reduces support tickets by 30%',
  },

  // Account Cancellation Pattern
  account_cancellation: {
    name: 'Account Cancellation',
    description: 'Account cancellation with retention workflow',
    layers: ['input', 'processing', 'processing', 'output', 'notification'],
    steps: [
      'receive_cancellation_request',
      'verify_account',
      'collect_cancellation_reason',
      'trigger_retention_offer',
      'process_decision',
      'handle_cancellation',
      'process_final_billing',
      'notify_customer',
      'schedule_exit_survey',
    ],
    implicitNeeds: [
      'Cancellation request handling',
      'Account verification',
      'Reason collection system',
      'Retention offer engine',
      'Decision processing workflow',
      'Account deactivation system',
      'Final billing processing',
      'Exit communication templates',
      'Exit survey system',
    ],
    questions: [
      'What retention offers are available?',
      'Is there a cancellation cooling-off period?',
      'How should final billing be handled?',
      'Should data be retained after cancellation?',
      'What exit survey questions to ask?',
    ],
    slaRequirements: [
      'Response within 2 hours',
      'Retention offer within 24 hours',
      'Cancellation processed within 48 hours',
    ],
    estimatedROI: 'Saves 20% of cancellation requests, improves exit feedback by 60%',
  },

  // Win Back Campaign Pattern
  win_back_campaign: {
    name: 'Win Back Campaign',
    description: 'Automated win-back workflow for churned customers',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'identify_churned_customer',
      'analyze_churn_reason',
      'segment_customer',
      'select_campaign',
      'personalize_offer',
      'send_outreach',
      'track_response',
      'process_return',
      'update_analytics',
    ],
    implicitNeeds: [
      'Churn detection system',
      'Churn reason analysis',
      'Customer segmentation engine',
      'Campaign management system',
      'Offer personalization engine',
      'Multi-channel outreach',
      'Response tracking',
      'Return processing workflow',
      'Win-back analytics',
    ],
    questions: [
      'How long after churn to start win-back?',
      'What offers are available for win-back?',
      'Which channels for outreach?',
      'How many touchpoints in the campaign?',
      'What defines a successful win-back?',
    ],
    slaRequirements: [
      'Win-back campaign start within 30 days of churn',
      'Response to interest within 4 hours',
      'Return processing within 24 hours',
    ],
    estimatedROI: 'Recovers 15% of churned customers, reduces CAC by 40%',
  },
};

// ============================================================================
// CUSTOMER SERVICE KEYWORDS FOR PATTERN DETECTION
// ============================================================================

export const CUSTOMER_SERVICE_KEYWORDS: Record<string, string[]> = {
  ticket_creation: [
    'ticket', 'tickets', 'create ticket', 'new ticket', 'support ticket',
    'open ticket', 'submit ticket', 'raise ticket', 'log ticket',
    'تذكرة', 'تذاكر', 'فتح تذكرة'
  ],

  ticket_routing: [
    'route', 'routing', 'assign', 'assignment', 'distribute', 'queue',
    'agent assignment', 'workload', 'skill-based', 'round robin',
    'توزيع', 'توجيه', 'تعيين'
  ],

  escalation_workflow: [
    'escalate', 'escalation', 'urgent', 'priority', 'manager',
    'supervisor', 'breach', 'sla breach', 'overdue', 'critical',
    'تصعيد', 'مستعجل', 'طوارئ'
  ],

  knowledge_base_update: [
    'knowledge base', 'kb', 'faq', 'article', 'documentation',
    'help center', 'self-service', 'how-to', 'guide',
    'قاعدة المعرفة', 'الأسئلة الشائعة', 'مقالة'
  ],

  customer_feedback: [
    'feedback', 'survey', 'satisfaction', 'experience', 'opinion',
    'rating', 'review', 'sentiment', 'voice of customer',
    'ملاحظات', 'استبيان', 'رضا العملاء'
  ],

  nps_survey: [
    'nps', 'net promoter', 'promoter score', 'would you recommend',
    'likelihood to recommend', 'loyalty score',
    'مؤشر صافي الترويج', 'توصية'
  ],

  complaint_resolution: [
    'complaint', 'complaints', 'complain', 'grievance', 'issue',
    'problem', 'resolve complaint', 'handle complaint', 'dissatisfied',
    'شكوى', 'شكاوى', 'مشكلة'
  ],

  refund_processing: [
    'refund', 'refunds', 'money back', 'return', 'reimburse',
    'reimbursement', 'credit', 'reversal', 'chargeback',
    'استرداد', 'إرجاع', 'رد المبلغ'
  ],

  account_recovery: [
    'account recovery', 'forgot password', 'reset password', 'locked out',
    'cant login', 'access', 'recover account', 'unlock account',
    'استعادة الحساب', 'نسيت كلمة المرور', 'إعادة تعيين'
  ],

  feature_request: [
    'feature request', 'new feature', 'suggestion', 'enhancement',
    'improvement', 'wishlist', 'roadmap', 'request feature',
    'طلب ميزة', 'اقتراح', 'تحسين'
  ],

  bug_report: [
    'bug', 'bugs', 'error', 'issue', 'defect', 'broken',
    'not working', 'crash', 'glitch', 'malfunction',
    'خطأ', 'عطل', 'مشكلة تقنية'
  ],

  onboarding_support: [
    'onboarding', 'getting started', 'new customer', 'setup',
    'welcome', 'first steps', 'tutorial', 'orientation',
    'تأهيل', 'البدء', 'عميل جديد'
  ],

  training_request: [
    'training', 'train', 'learn', 'education', 'workshop',
    'webinar', 'demo', 'demonstration', 'how to use',
    'تدريب', 'تعليم', 'ورشة عمل'
  ],

  account_cancellation: [
    'cancel', 'cancellation', 'close account', 'terminate',
    'unsubscribe', 'end subscription', 'stop service',
    'إلغاء', 'إنهاء الاشتراك', 'إغلاق الحساب'
  ],

  win_back_campaign: [
    'win back', 'winback', 'churned', 'former customer', 'lapsed',
    'inactive', 'return offer', 're-engage', 'reactivate',
    'استعادة العميل', 'عميل سابق', 'إعادة التفعيل'
  ],
};

// ============================================================================
// CUSTOMER SERVICE IMPLICIT REQUIREMENTS
// ============================================================================

export const CUSTOMER_SERVICE_IMPLICIT_REQUIREMENTS: Record<string, ImplicitRequirement[]> = {
  ticket_creation: [
    {
      category: 'input',
      description: 'Multi-channel ticket intake (WhatsApp, email, web, phone)',
      reason: 'Customers contact support through various channels',
      priority: 'critical',
      suggestedTools: ['Zendesk', 'Freshdesk', 'Intercom', 'HubSpot Service Hub'],
    },
    {
      category: 'processing',
      description: 'AI-powered issue categorization',
      reason: 'Automatic categorization improves routing accuracy',
      priority: 'important',
      suggestedTools: ['Zendesk AI', 'Freshdesk Freddy', 'MonkeyLearn', 'Custom NLP'],
    },
    {
      category: 'processing',
      description: 'Priority assignment rules engine',
      reason: 'Different issues require different urgency levels',
      priority: 'critical',
      suggestedTools: ['Ticketing system rules', 'Custom logic', 'SLA engine'],
    },
    {
      category: 'processing',
      description: 'SLA timer initiation',
      reason: 'Track response and resolution time commitments',
      priority: 'critical',
      suggestedTools: ['Zendesk SLA', 'Freshdesk SLA', 'Custom SLA tracker'],
    },
    {
      category: 'output',
      description: 'Agent skill-based assignment',
      reason: 'Match tickets to agents with relevant expertise',
      priority: 'important',
      suggestedTools: ['Zendesk Routing', 'Freshdesk Assignment', 'Custom routing'],
    },
    {
      category: 'notification',
      description: 'Customer acknowledgment automation',
      reason: 'Customers expect confirmation their request was received',
      priority: 'critical',
      suggestedTools: ['Email automation', 'WhatsApp Business API', 'SMS gateway'],
    },
  ],

  ticket_routing: [
    {
      category: 'input',
      description: 'Real-time agent availability tracking',
      reason: 'Route only to available agents for faster response',
      priority: 'critical',
      suggestedTools: ['Zendesk Agent Status', 'Freshdesk', 'Custom presence API'],
    },
    {
      category: 'processing',
      description: 'Skill-based routing engine',
      reason: 'Match ticket requirements to agent capabilities',
      priority: 'critical',
      suggestedTools: ['Zendesk Skills', 'Freshdesk Skills', 'Custom skill matrix'],
    },
    {
      category: 'processing',
      description: 'Workload balancing algorithm',
      reason: 'Distribute tickets fairly and prevent agent burnout',
      priority: 'important',
      suggestedTools: ['Round robin', 'Load balancer', 'Custom algorithm'],
    },
    {
      category: 'processing',
      description: 'Language-based routing (Arabic/English)',
      reason: 'Kuwait market requires bilingual support',
      priority: 'important',
      suggestedTools: ['Language detection', 'Agent language skills', 'Custom routing'],
    },
    {
      category: 'notification',
      description: 'Agent assignment notification',
      reason: 'Agents need immediate awareness of new assignments',
      priority: 'critical',
      suggestedTools: ['Desktop notifications', 'Mobile push', 'Slack/Teams'],
    },
  ],

  escalation_workflow: [
    {
      category: 'input',
      description: 'SLA breach monitoring',
      reason: 'Auto-detect when tickets exceed SLA targets',
      priority: 'critical',
      suggestedTools: ['SLA monitoring', 'Alert system', 'Custom triggers'],
    },
    {
      category: 'processing',
      description: 'Sentiment analysis for escalation triggers',
      reason: 'Detect frustrated customers before they escalate manually',
      priority: 'important',
      suggestedTools: ['MonkeyLearn', 'Google NLP', 'Custom sentiment model'],
    },
    {
      category: 'processing',
      description: 'Multi-tier escalation matrix',
      reason: 'Different issues require different escalation paths',
      priority: 'critical',
      suggestedTools: ['Escalation rules', 'Custom matrix', 'Workflow engine'],
    },
    {
      category: 'processing',
      description: 'Timeline tracking and documentation',
      reason: 'Complete audit trail for escalated issues',
      priority: 'important',
      suggestedTools: ['Ticket history', 'Activity log', 'Time tracking'],
    },
    {
      category: 'notification',
      description: 'Manager notification with context',
      reason: 'Managers need full context for quick decision making',
      priority: 'critical',
      suggestedTools: ['Email with summary', 'Slack alerts', 'Mobile push'],
    },
    {
      category: 'notification',
      description: 'Customer status update',
      reason: 'Keep customers informed during escalation',
      priority: 'important',
      suggestedTools: ['Email templates', 'WhatsApp updates', 'SMS'],
    },
  ],

  knowledge_base_update: [
    {
      category: 'input',
      description: 'Resolution pattern detection',
      reason: 'Identify common issues that need KB articles',
      priority: 'important',
      suggestedTools: ['Analytics', 'AI pattern detection', 'Manual tagging'],
    },
    {
      category: 'processing',
      description: 'AI-powered content extraction',
      reason: 'Convert ticket resolutions to KB article drafts',
      priority: 'important',
      suggestedTools: ['GPT-4', 'Claude', 'Custom AI', 'Jasper'],
    },
    {
      category: 'processing',
      description: 'Article review workflow',
      reason: 'Quality control before publishing',
      priority: 'critical',
      suggestedTools: ['Workflow approval', 'Editorial calendar', 'Review system'],
    },
    {
      category: 'processing',
      description: 'Multilingual article support (Arabic/English)',
      reason: 'Kuwait market requires bilingual content',
      priority: 'important',
      suggestedTools: ['Translation API', 'Human translation', 'DeepL'],
    },
    {
      category: 'output',
      description: 'SEO-optimized publishing',
      reason: 'Help customers find articles via search',
      priority: 'optional',
      suggestedTools: ['SEO tools', 'Schema markup', 'Search optimization'],
    },
  ],

  customer_feedback: [
    {
      category: 'input',
      description: 'Interaction completion detection',
      reason: 'Trigger surveys at the right moment',
      priority: 'critical',
      suggestedTools: ['Ticket status triggers', 'Chat end detection', 'Custom hooks'],
    },
    {
      category: 'processing',
      description: 'Multi-channel survey delivery',
      reason: 'Reach customers on their preferred channel',
      priority: 'important',
      suggestedTools: ['Typeform', 'SurveyMonkey', 'Delighted', 'Custom surveys'],
    },
    {
      category: 'processing',
      description: 'Sentiment analysis of verbatim feedback',
      reason: 'Extract insights from open-ended responses',
      priority: 'important',
      suggestedTools: ['MonkeyLearn', 'Google NLP', 'IBM Watson', 'Custom NLP'],
    },
    {
      category: 'output',
      description: 'Feedback analytics dashboard',
      reason: 'Visualize trends and identify improvement areas',
      priority: 'important',
      suggestedTools: ['Power BI', 'Tableau', 'Looker', 'Custom dashboard'],
    },
    {
      category: 'notification',
      description: 'Negative feedback alerting',
      reason: 'Immediate action on dissatisfied customers',
      priority: 'critical',
      suggestedTools: ['Alert system', 'Slack/Teams', 'Email notifications'],
    },
  ],

  nps_survey: [
    {
      category: 'input',
      description: 'Customer segmentation for targeting',
      reason: 'Send NPS to the right customers at the right time',
      priority: 'important',
      suggestedTools: ['CRM segmentation', 'Customer data platform', 'Custom rules'],
    },
    {
      category: 'processing',
      description: 'NPS score calculation engine',
      reason: 'Calculate NPS from survey responses',
      priority: 'critical',
      suggestedTools: ['Delighted', 'Promoter.io', 'Custom calculation'],
    },
    {
      category: 'processing',
      description: 'Verbatim feedback analysis',
      reason: 'Understand reasons behind scores',
      priority: 'important',
      suggestedTools: ['AI analysis', 'Manual review', 'Sentiment analysis'],
    },
    {
      category: 'output',
      description: 'NPS trend tracking dashboard',
      reason: 'Monitor NPS changes over time',
      priority: 'important',
      suggestedTools: ['Analytics dashboard', 'BI tools', 'Custom reporting'],
    },
    {
      category: 'notification',
      description: 'Detractor follow-up automation',
      reason: 'Immediate outreach to unhappy customers',
      priority: 'critical',
      suggestedTools: ['Workflow automation', 'Task creation', 'Alert system'],
    },
  ],

  complaint_resolution: [
    {
      category: 'input',
      description: 'Complaint intake with severity assessment',
      reason: 'Triage complaints based on severity',
      priority: 'critical',
      suggestedTools: ['Complaint form', 'AI categorization', 'Manual triage'],
    },
    {
      category: 'processing',
      description: 'Investigation workflow management',
      reason: 'Structured approach to complaint investigation',
      priority: 'critical',
      suggestedTools: ['Workflow engine', 'Task management', 'SLA tracking'],
    },
    {
      category: 'processing',
      description: 'Resolution option database',
      reason: 'Consistent resolution offerings',
      priority: 'important',
      suggestedTools: ['Resolution library', 'Policy engine', 'Approval matrix'],
    },
    {
      category: 'processing',
      description: 'Compensation approval workflow',
      reason: 'Appropriate authorization for compensation',
      priority: 'important',
      suggestedTools: ['Approval system', 'Spending limits', 'Manager routing'],
    },
    {
      category: 'notification',
      description: 'Customer progress updates',
      reason: 'Keep customers informed during resolution',
      priority: 'important',
      suggestedTools: ['Email automation', 'WhatsApp updates', 'Portal status'],
    },
  ],

  refund_processing: [
    {
      category: 'input',
      description: 'Refund eligibility validation',
      reason: 'Check if request meets refund policy',
      priority: 'critical',
      suggestedTools: ['Policy rules engine', 'Order validation', 'Custom logic'],
    },
    {
      category: 'processing',
      description: 'Refund policy rules engine',
      reason: 'Automatic policy compliance checking',
      priority: 'critical',
      suggestedTools: ['Business rules engine', 'Custom validation', 'Policy system'],
    },
    {
      category: 'processing',
      description: 'Multi-tier approval workflow',
      reason: 'Appropriate authorization based on amount',
      priority: 'important',
      suggestedTools: ['Approval workflow', 'Spending authority', 'Routing rules'],
    },
    {
      category: 'processing',
      description: 'Payment reversal integration (KNET, cards)',
      reason: 'Process refunds through payment gateways',
      priority: 'critical',
      suggestedTools: ['KNET integration', 'Tap Payments', 'Payment gateway API'],
    },
    {
      category: 'output',
      description: 'Accounting system update',
      reason: 'Record refunds properly in financials',
      priority: 'important',
      suggestedTools: ['QuickBooks', 'Xero', 'Zoho Books', 'ERP integration'],
    },
  ],

  account_recovery: [
    {
      category: 'input',
      description: 'Multi-factor identity verification',
      reason: 'Secure verification before account access',
      priority: 'critical',
      suggestedTools: ['Auth0', 'Okta', 'Custom verification', 'Twilio Verify'],
    },
    {
      category: 'processing',
      description: 'OTP delivery system (SMS, WhatsApp)',
      reason: 'Deliver verification codes securely',
      priority: 'critical',
      suggestedTools: ['Twilio', 'MessageBird', 'WhatsApp Business API'],
    },
    {
      category: 'processing',
      description: 'Security question validation',
      reason: 'Additional verification layer',
      priority: 'important',
      suggestedTools: ['Identity system', 'Custom questions', 'Security vault'],
    },
    {
      category: 'processing',
      description: 'Fraud detection integration',
      reason: 'Prevent unauthorized account access',
      priority: 'important',
      suggestedTools: ['Sift', 'Signifyd', 'Custom fraud rules', 'IP checking'],
    },
    {
      category: 'notification',
      description: 'Security event logging and alerting',
      reason: 'Audit trail and suspicious activity alerts',
      priority: 'critical',
      suggestedTools: ['Security logs', 'SIEM integration', 'Alert system'],
    },
  ],

  feature_request: [
    {
      category: 'input',
      description: 'Feature request portal/form',
      reason: 'Structured collection of feature ideas',
      priority: 'important',
      suggestedTools: ['Canny', 'ProductBoard', 'UserVoice', 'Custom form'],
    },
    {
      category: 'processing',
      description: 'Duplicate request detection',
      reason: 'Consolidate similar requests',
      priority: 'important',
      suggestedTools: ['AI matching', 'Manual review', 'Search system'],
    },
    {
      category: 'processing',
      description: 'Prioritization framework',
      reason: 'Evaluate and prioritize requests consistently',
      priority: 'critical',
      suggestedTools: ['RICE scoring', 'Custom framework', 'Voting system'],
    },
    {
      category: 'output',
      description: 'Product backlog integration',
      reason: 'Connect approved features to development',
      priority: 'important',
      suggestedTools: ['Jira', 'Linear', 'Asana', 'Monday.com'],
    },
    {
      category: 'notification',
      description: 'Customer status updates',
      reason: 'Keep requesters informed of progress',
      priority: 'optional',
      suggestedTools: ['Email automation', 'Portal updates', 'Changelog'],
    },
  ],

  bug_report: [
    {
      category: 'input',
      description: 'Structured bug report form',
      reason: 'Collect necessary technical information',
      priority: 'critical',
      suggestedTools: ['BugHerd', 'Usersnap', 'Custom form', 'Zendesk'],
    },
    {
      category: 'processing',
      description: 'Bug severity assessment',
      reason: 'Prioritize based on impact',
      priority: 'critical',
      suggestedTools: ['Severity matrix', 'Impact analysis', 'Custom rules'],
    },
    {
      category: 'processing',
      description: 'Engineering issue tracker integration',
      reason: 'Hand off to development team',
      priority: 'critical',
      suggestedTools: ['Jira', 'Linear', 'GitHub Issues', 'GitLab'],
    },
    {
      category: 'output',
      description: 'Customer resolution notification',
      reason: 'Close the loop with customers',
      priority: 'important',
      suggestedTools: ['Email automation', 'Release notes', 'Changelog'],
    },
  ],

  onboarding_support: [
    {
      category: 'input',
      description: 'New customer detection trigger',
      reason: 'Start onboarding process automatically',
      priority: 'critical',
      suggestedTools: ['CRM trigger', 'Signup webhook', 'Custom detection'],
    },
    {
      category: 'processing',
      description: 'Onboarding checklist management',
      reason: 'Track completion of onboarding steps',
      priority: 'important',
      suggestedTools: ['Intercom', 'Userpilot', 'Custom checklist', 'Notion'],
    },
    {
      category: 'processing',
      description: 'Calendar scheduling for onboarding calls',
      reason: 'Schedule customer success calls',
      priority: 'important',
      suggestedTools: ['Calendly', 'Cal.com', 'HubSpot Meetings', 'Google Calendar'],
    },
    {
      category: 'output',
      description: 'Resource library access',
      reason: 'Provide self-service learning materials',
      priority: 'important',
      suggestedTools: ['Knowledge base', 'Video library', 'Documentation'],
    },
    {
      category: 'notification',
      description: 'Progress milestone notifications',
      reason: 'Celebrate achievements and maintain engagement',
      priority: 'optional',
      suggestedTools: ['In-app messages', 'Email automation', 'Push notifications'],
    },
  ],

  training_request: [
    {
      category: 'input',
      description: 'Training needs assessment',
      reason: 'Understand customer training requirements',
      priority: 'important',
      suggestedTools: ['Assessment form', 'Questionnaire', 'Discovery call'],
    },
    {
      category: 'processing',
      description: 'Training session scheduling',
      reason: 'Book sessions based on availability',
      priority: 'critical',
      suggestedTools: ['Calendly', 'Cal.com', 'HubSpot Meetings'],
    },
    {
      category: 'processing',
      description: 'Training material preparation',
      reason: 'Prepare relevant content for session',
      priority: 'important',
      suggestedTools: ['Learning management system', 'Notion', 'Google Slides'],
    },
    {
      category: 'output',
      description: 'Training delivery platform',
      reason: 'Conduct live or recorded training',
      priority: 'critical',
      suggestedTools: ['Zoom', 'Google Meet', 'Loom', 'Training LMS'],
    },
    {
      category: 'notification',
      description: 'Post-training resource sharing',
      reason: 'Provide materials for reference',
      priority: 'important',
      suggestedTools: ['Email', 'Resource portal', 'Documentation'],
    },
  ],

  account_cancellation: [
    {
      category: 'input',
      description: 'Cancellation reason collection',
      reason: 'Understand why customers leave',
      priority: 'critical',
      suggestedTools: ['Exit survey', 'Cancellation form', 'Interview'],
    },
    {
      category: 'processing',
      description: 'Retention offer engine',
      reason: 'Present relevant offers to save the customer',
      priority: 'critical',
      suggestedTools: ['Offer rules', 'Discount engine', 'Custom offers'],
    },
    {
      category: 'processing',
      description: 'Final billing and proration',
      reason: 'Handle billing correctly on cancellation',
      priority: 'important',
      suggestedTools: ['Billing system', 'Stripe', 'Custom proration'],
    },
    {
      category: 'processing',
      description: 'Data retention/deletion handling',
      reason: 'Comply with data policies on cancellation',
      priority: 'important',
      suggestedTools: ['Data management', 'GDPR tools', 'Custom scripts'],
    },
    {
      category: 'notification',
      description: 'Exit survey and confirmation',
      reason: 'Final feedback and confirmation',
      priority: 'important',
      suggestedTools: ['Exit survey', 'Email confirmation', 'Portal status'],
    },
  ],

  win_back_campaign: [
    {
      category: 'input',
      description: 'Churn detection and analysis',
      reason: 'Identify churned customers and reasons',
      priority: 'critical',
      suggestedTools: ['ChurnZero', 'Baremetrics', 'Custom detection'],
    },
    {
      category: 'processing',
      description: 'Customer segmentation for personalization',
      reason: 'Tailor win-back offers to customer segments',
      priority: 'important',
      suggestedTools: ['CRM segmentation', 'Customer data platform'],
    },
    {
      category: 'processing',
      description: 'Offer personalization engine',
      reason: 'Create compelling offers based on history',
      priority: 'critical',
      suggestedTools: ['Marketing automation', 'AI recommendations'],
    },
    {
      category: 'output',
      description: 'Multi-channel campaign delivery',
      reason: 'Reach customers where they engage',
      priority: 'important',
      suggestedTools: ['Email marketing', 'SMS', 'WhatsApp Business API'],
    },
    {
      category: 'notification',
      description: 'Response tracking and follow-up',
      reason: 'Track engagement and follow up promptly',
      priority: 'important',
      suggestedTools: ['CRM tracking', 'Task automation', 'Alerts'],
    },
  ],
};

// ============================================================================
// CUSTOMER SERVICE TOOL RECOMMENDATIONS
// ============================================================================

export const CUSTOMER_SERVICE_TOOL_RECOMMENDATIONS: Record<string, ToolRecommendation[]> = {
  // Ticketing Systems
  ticketing: [
    {
      toolSlug: 'ZENDESK',
      toolName: 'Zendesk',
      score: 95,
      reasons: [
        'Industry-leading ticketing platform',
        'Excellent multi-channel support',
        'Strong Arabic language support',
        'Comprehensive reporting and analytics',
      ],
      regionalFit: 90,
      alternatives: [
        {
          toolSlug: 'FRESHDESK',
          toolName: 'Freshdesk',
          reason: 'More affordable for SMEs',
          tradeoff: 'Less advanced features',
        },
      ],
    },
    {
      toolSlug: 'FRESHDESK',
      toolName: 'Freshdesk',
      score: 92,
      reasons: [
        'Excellent value for SMEs',
        'Arabic interface available',
        'Freddy AI for automation',
        'Good WhatsApp integration',
      ],
      regionalFit: 93,
      alternatives: [],
    },
    {
      toolSlug: 'INTERCOM',
      toolName: 'Intercom',
      score: 90,
      reasons: [
        'Best-in-class live chat',
        'Product tours and onboarding',
        'AI-powered automation',
        'Modern user experience',
      ],
      regionalFit: 85,
      alternatives: [],
    },
    {
      toolSlug: 'HUBSPOT_SERVICE_HUB',
      toolName: 'HubSpot Service Hub',
      score: 88,
      reasons: [
        'Free tier available',
        'Integrated with HubSpot CRM',
        'Knowledge base included',
        'Customer portal',
      ],
      regionalFit: 85,
      alternatives: [],
    },
  ],

  // Live Chat
  live_chat: [
    {
      toolSlug: 'INTERCOM',
      toolName: 'Intercom',
      score: 95,
      reasons: [
        'Best live chat experience',
        'AI-powered chatbots',
        'Product tours',
        'Customer data platform',
      ],
      regionalFit: 85,
      alternatives: [],
    },
    {
      toolSlug: 'CRISP',
      toolName: 'Crisp',
      score: 88,
      reasons: [
        'Affordable pricing',
        'Good WhatsApp integration',
        'Multi-channel inbox',
        'Co-browsing feature',
      ],
      regionalFit: 85,
      alternatives: [],
    },
    {
      toolSlug: 'TIDIO',
      toolName: 'Tidio',
      score: 85,
      reasons: [
        'Easy setup',
        'Visual chatbot builder',
        'Good free tier',
        'Email marketing included',
      ],
      regionalFit: 80,
      alternatives: [],
    },
    {
      toolSlug: 'WHATSAPP_BUSINESS_API',
      toolName: 'WhatsApp Business API',
      score: 98,
      reasons: [
        'Most popular channel in Kuwait/GCC',
        'High engagement rates',
        'Rich media support',
        'Official business presence',
      ],
      regionalFit: 100,
      alternatives: [
        {
          toolSlug: 'RESPOND_IO',
          toolName: 'Respond.io',
          reason: 'Unified inbox for WhatsApp + other channels',
          tradeoff: 'Additional cost on top of WhatsApp API',
        },
      ],
    },
  ],

  // Knowledge Base
  knowledge_base: [
    {
      toolSlug: 'NOTION',
      toolName: 'Notion',
      score: 90,
      reasons: [
        'Flexible and modern',
        'Collaborative editing',
        'Easy to maintain',
        'Public pages for KB',
      ],
      regionalFit: 85,
      alternatives: [],
    },
    {
      toolSlug: 'CONFLUENCE',
      toolName: 'Confluence',
      score: 88,
      reasons: [
        'Enterprise-grade',
        'Good for large teams',
        'Version control',
        'Jira integration',
      ],
      regionalFit: 80,
      alternatives: [],
    },
    {
      toolSlug: 'HELPDOCS',
      toolName: 'HelpDocs',
      score: 85,
      reasons: [
        'Purpose-built for help centers',
        'SEO optimized',
        'Multi-language support',
        'Clean interface',
      ],
      regionalFit: 85,
      alternatives: [],
    },
    {
      toolSlug: 'DOCUMENT360',
      toolName: 'Document360',
      score: 87,
      reasons: [
        'Advanced knowledge base features',
        'AI-powered search',
        'Analytics included',
        'RTL language support',
      ],
      regionalFit: 90,
      alternatives: [],
    },
  ],

  // Surveys
  surveys: [
    {
      toolSlug: 'TYPEFORM',
      toolName: 'Typeform',
      score: 92,
      reasons: [
        'Beautiful survey design',
        'High completion rates',
        'Conversational format',
        'Good integrations',
      ],
      regionalFit: 85,
      alternatives: [],
    },
    {
      toolSlug: 'SURVEYMONKEY',
      toolName: 'SurveyMonkey',
      score: 90,
      reasons: [
        'Industry standard',
        'Robust analytics',
        'Many question types',
        'Arabic support',
      ],
      regionalFit: 88,
      alternatives: [],
    },
    {
      toolSlug: 'DELIGHTED',
      toolName: 'Delighted',
      score: 95,
      reasons: [
        'Purpose-built for NPS/CSAT',
        'One-click surveys',
        'High response rates',
        'Real-time analytics',
      ],
      regionalFit: 85,
      alternatives: [],
    },
    {
      toolSlug: 'NICEREPLY',
      toolName: 'Nicereply',
      score: 88,
      reasons: [
        'In-email surveys',
        'Zendesk integration',
        'CSAT and NPS',
        'Ticket rating',
      ],
      regionalFit: 85,
      alternatives: [],
    },
  ],

  // Analytics
  analytics: [
    {
      toolSlug: 'MIXPANEL',
      toolName: 'Mixpanel',
      score: 90,
      reasons: [
        'Product analytics',
        'User behavior tracking',
        'Funnel analysis',
        'Retention metrics',
      ],
      regionalFit: 85,
      alternatives: [],
    },
    {
      toolSlug: 'AMPLITUDE',
      toolName: 'Amplitude',
      score: 92,
      reasons: [
        'Advanced analytics',
        'Customer journey mapping',
        'Cohort analysis',
        'AI insights',
      ],
      regionalFit: 85,
      alternatives: [],
    },
    {
      toolSlug: 'GOOGLE_ANALYTICS',
      toolName: 'Google Analytics',
      score: 85,
      reasons: [
        'Free and powerful',
        'Website analytics',
        'Integration ecosystem',
        'Real-time data',
      ],
      regionalFit: 90,
      alternatives: [],
    },
    {
      toolSlug: 'HOTJAR',
      toolName: 'Hotjar',
      score: 88,
      reasons: [
        'Session recordings',
        'Heatmaps',
        'User feedback',
        'Form analytics',
      ],
      regionalFit: 85,
      alternatives: [],
    },
  ],

  // AI and Automation
  ai_automation: [
    {
      toolSlug: 'ZENDESK_AI',
      toolName: 'Zendesk AI',
      score: 90,
      reasons: [
        'Native Zendesk integration',
        'Intent detection',
        'Auto-routing',
        'Suggested responses',
      ],
      regionalFit: 85,
      alternatives: [],
    },
    {
      toolSlug: 'FORETHOUGHT',
      toolName: 'Forethought',
      score: 88,
      reasons: [
        'AI-powered support',
        'Ticket classification',
        'Answer suggestions',
        'Workflow automation',
      ],
      regionalFit: 80,
      alternatives: [],
    },
    {
      toolSlug: 'ADA',
      toolName: 'Ada',
      score: 87,
      reasons: [
        'Conversational AI',
        'No-code chatbot builder',
        'Multi-language support',
        'Handoff to agents',
      ],
      regionalFit: 80,
      alternatives: [],
    },
  ],

  // Kuwait-Specific Communication
  kuwait_communication: [
    {
      toolSlug: 'WHATSAPP_BUSINESS_API',
      toolName: 'WhatsApp Business API',
      score: 98,
      reasons: [
        'Most used communication app in Kuwait',
        'Rich media messaging',
        'Business verified account',
        'Catalog and payment features',
      ],
      regionalFit: 100,
      alternatives: [],
    },
    {
      toolSlug: 'RESPOND_IO',
      toolName: 'Respond.io',
      score: 90,
      reasons: [
        'Omnichannel inbox',
        'WhatsApp + Instagram DM',
        'Team collaboration',
        'Automation workflows',
      ],
      regionalFit: 95,
      alternatives: [],
    },
    {
      toolSlug: 'UNIFONIC',
      toolName: 'Unifonic',
      score: 92,
      reasons: [
        'Middle East focused',
        'WhatsApp Business solution',
        'SMS and voice',
        'Arabic-first platform',
      ],
      regionalFit: 98,
      alternatives: [],
    },
    {
      toolSlug: 'INSTAGRAM_MESSAGING',
      toolName: 'Instagram Messaging API',
      score: 88,
      reasons: [
        'Popular in Kuwait for business',
        'Visual commerce integration',
        'Story replies automation',
        'DM management',
      ],
      regionalFit: 95,
      alternatives: [],
    },
  ],
};

// ============================================================================
// KUWAIT / REGIONAL CONTEXT
// ============================================================================

export const CUSTOMER_SERVICE_REGIONAL_CONTEXT: Record<string, CustomerServiceRegionalContext> = {
  kuwait: {
    region: 'Kuwait',
    preferredChannels: ['WhatsApp', 'Phone', 'Instagram DM', 'Email'],
    responseExpectation: 'Within 2-4 hours during business hours',
    languageSupport: ['Arabic (Gulf dialect)', 'English'],
    peakHours: '10am-1pm, 5pm-9pm',
    culturalNotes: [
      'Personal touch highly valued - address customers by name',
      'Formal greeting important (Marhaba, Assalamu Alaikum)',
      'Patience with explanation expected',
      'Family recommendations carry significant weight',
      'Ramadan hours differ (typically late evening)',
      'Weekend is Friday-Saturday',
      'WhatsApp preferred over email for quick queries',
      'Visual content (photos, videos) appreciated',
    ],
    businessDays: 'Sunday-Thursday',
    holidays: [
      'National Day (February 25)',
      'Liberation Day (February 26)',
      'Eid Al-Fitr (varies)',
      'Eid Al-Adha (varies)',
      'Islamic New Year (varies)',
      'Prophet Birthday (varies)',
    ],
  },
  uae: {
    region: 'United Arab Emirates',
    preferredChannels: ['WhatsApp', 'Email', 'Live Chat', 'Phone'],
    responseExpectation: 'Within 1-2 hours during business hours',
    languageSupport: ['Arabic', 'English', 'Hindi', 'Urdu'],
    peakHours: '9am-12pm, 4pm-8pm',
    culturalNotes: [
      'Multicultural workforce - multiple language support important',
      'High expectations for service quality',
      'Dubai known for fast response expectations',
      'Professional tone appreciated',
    ],
    businessDays: 'Monday-Friday',
    holidays: [
      'UAE National Day (December 2)',
      'Eid Al-Fitr (varies)',
      'Eid Al-Adha (varies)',
    ],
  },
  saudi: {
    region: 'Saudi Arabia',
    preferredChannels: ['WhatsApp', 'Phone', 'Twitter', 'Email'],
    responseExpectation: 'Within 2-4 hours during business hours',
    languageSupport: ['Arabic (Saudi dialect)', 'English'],
    peakHours: '9am-12pm, 5pm-10pm',
    culturalNotes: [
      'Twitter very active for customer service',
      'Formal Arabic appreciated',
      'Vision 2030 driving digital transformation',
      'Prayer times affect response expectations',
    ],
    businessDays: 'Sunday-Thursday',
    holidays: [
      'Saudi National Day (September 23)',
      'Founding Day (February 22)',
      'Eid Al-Fitr (varies)',
      'Eid Al-Adha (varies)',
    ],
  },
};

// ============================================================================
// SLA CONFIGURATIONS
// ============================================================================

export const DEFAULT_SLA_CONFIGURATIONS: Record<string, SLAConfiguration> = {
  critical: {
    priority: 'critical',
    responseTimeMinutes: 15,
    resolutionTimeHours: 4,
    escalationThresholdMinutes: 30,
    notificationIntervalMinutes: 15,
  },
  high: {
    priority: 'high',
    responseTimeMinutes: 60,
    resolutionTimeHours: 8,
    escalationThresholdMinutes: 120,
    notificationIntervalMinutes: 60,
  },
  medium: {
    priority: 'medium',
    responseTimeMinutes: 240,
    resolutionTimeHours: 24,
    escalationThresholdMinutes: 480,
    notificationIntervalMinutes: 240,
  },
  low: {
    priority: 'low',
    responseTimeMinutes: 480,
    resolutionTimeHours: 72,
    escalationThresholdMinutes: 1440,
    notificationIntervalMinutes: 480,
  },
};

// ============================================================================
// PRIORITY DEFINITIONS
// ============================================================================

export const TICKET_PRIORITIES: Record<string, TicketPriority> = {
  critical: {
    level: 'critical',
    description: 'Business-stopping issue affecting multiple customers',
    indicators: [
      'System down or unavailable',
      'Data loss or security breach',
      'Payment processing failure',
      'Multiple customers affected simultaneously',
      'Legal or compliance risk',
    ],
    autoEscalateMinutes: 30,
  },
  high: {
    level: 'high',
    description: 'Significant issue affecting customer operations',
    indicators: [
      'Core feature not working',
      'Single customer severely impacted',
      'Revenue-affecting issue',
      'VIP customer complaint',
      'Potential churn risk',
    ],
    autoEscalateMinutes: 120,
  },
  medium: {
    level: 'medium',
    description: 'Standard issue with workaround available',
    indicators: [
      'Feature partially working',
      'Minor inconvenience',
      'Information request',
      'General inquiry',
      'Training or how-to question',
    ],
    autoEscalateMinutes: 480,
  },
  low: {
    level: 'low',
    description: 'Minor issue or enhancement request',
    indicators: [
      'Cosmetic issues',
      'Feature requests',
      'General feedback',
      'Documentation updates',
      'Nice-to-have improvements',
    ],
    autoEscalateMinutes: 1440,
  },
};

// ============================================================================
// ESCALATION PATH DEFINITIONS
// ============================================================================

export const ESCALATION_PATHS: EscalationPath[] = [
  {
    level: 1,
    role: 'Senior Support Agent',
    timeToEscalateMinutes: 60,
    notificationChannels: ['email', 'slack'],
    authority: ['Extend SLA', 'Offer discount up to 10%', 'Priority queue'],
  },
  {
    level: 2,
    role: 'Team Lead',
    timeToEscalateMinutes: 120,
    notificationChannels: ['email', 'slack', 'sms'],
    authority: ['Full refund up to $100', 'Service credit', 'Escalate to engineering'],
  },
  {
    level: 3,
    role: 'Support Manager',
    timeToEscalateMinutes: 240,
    notificationChannels: ['email', 'slack', 'sms', 'phone'],
    authority: ['Full refund any amount', 'Contract modification', 'Direct customer call'],
  },
  {
    level: 4,
    role: 'Director of Customer Success',
    timeToEscalateMinutes: 480,
    notificationChannels: ['email', 'phone', 'executive_alert'],
    authority: ['Executive decision', 'Legal involvement', 'Public statement'],
  },
];

// ============================================================================
// CUSTOMER SERVICE DOMAIN INTELLIGENCE CLASS
// ============================================================================

export class CustomerServiceDomainIntelligence {
  private region: string;
  private regionalContext: CustomerServiceRegionalContext | null;

  constructor(region: string = 'kuwait') {
    this.region = region.toLowerCase();
    this.regionalContext = CUSTOMER_SERVICE_REGIONAL_CONTEXT[this.region] || null;
  }

  /**
   * Detect customer service workflow pattern from user request
   */
  detectCustomerServicePattern(request: string): string | null {
    const normalizedRequest = request.toLowerCase();
    let bestMatch: string | null = null;
    let highestScore = 0;

    for (const [pattern, keywords] of Object.entries(CUSTOMER_SERVICE_KEYWORDS)) {
      const score = keywords.filter(kw =>
        normalizedRequest.includes(kw.toLowerCase())
      ).length;

      if (score > highestScore) {
        highestScore = score;
        bestMatch = pattern;
      }
    }

    // Require at least 1 keyword match for customer service patterns
    return highestScore >= 1 ? bestMatch : null;
  }

  /**
   * Get implicit requirements for a customer service pattern
   */
  getImplicitRequirements(pattern: string): ImplicitRequirement[] {
    const requirements = CUSTOMER_SERVICE_IMPLICIT_REQUIREMENTS[pattern] || [];

    // Add regional requirements
    if (this.regionalContext && pattern) {
      // Add WhatsApp requirement for Kuwait
      if (this.region === 'kuwait' && !requirements.some(r => r.description.includes('WhatsApp'))) {
        requirements.push({
          category: 'notification',
          description: 'WhatsApp Business API integration',
          reason: 'WhatsApp is the primary communication channel in Kuwait',
          priority: 'critical',
          suggestedTools: ['WhatsApp Business API', 'Respond.io', 'Unifonic'],
        });
      }

      // Add Arabic language support
      if (this.region === 'kuwait') {
        requirements.push({
          category: 'processing',
          description: 'Arabic language support (Gulf dialect)',
          reason: 'Bilingual support required for Kuwait market',
          priority: 'critical',
          suggestedTools: ['Multilingual ticketing', 'Arabic NLP', 'Translation service'],
        });
      }
    }

    return requirements;
  }

  /**
   * Get tool recommendations for a customer service pattern
   */
  getToolRecommendations(pattern: string, region?: string): ToolRecommendation[] {
    const effectiveRegion = region || this.region;
    const recommendations: ToolRecommendation[] = [];

    // Map pattern to tool category
    const categoryMapping: Record<string, string[]> = {
      ticket_creation: ['ticketing', 'kuwait_communication'],
      ticket_routing: ['ticketing', 'ai_automation'],
      escalation_workflow: ['ticketing', 'analytics'],
      knowledge_base_update: ['knowledge_base', 'ai_automation'],
      customer_feedback: ['surveys', 'analytics'],
      nps_survey: ['surveys', 'analytics'],
      complaint_resolution: ['ticketing', 'kuwait_communication'],
      refund_processing: ['ticketing'],
      account_recovery: ['ticketing', 'ai_automation'],
      feature_request: ['ticketing', 'analytics'],
      bug_report: ['ticketing'],
      onboarding_support: ['live_chat', 'knowledge_base'],
      training_request: ['live_chat', 'knowledge_base'],
      account_cancellation: ['ticketing', 'surveys'],
      win_back_campaign: ['surveys', 'analytics', 'kuwait_communication'],
    };

    const categories = categoryMapping[pattern] || ['ticketing'];

    // Get tools from each category
    categories.forEach(category => {
      const categoryTools = CUSTOMER_SERVICE_TOOL_RECOMMENDATIONS[category] || [];
      recommendations.push(...categoryTools);
    });

    // Add Kuwait-specific communication tools
    if (effectiveRegion === 'kuwait' && !categories.includes('kuwait_communication')) {
      const kuwaitTools = CUSTOMER_SERVICE_TOOL_RECOMMENDATIONS.kuwait_communication || [];
      recommendations.push(...kuwaitTools);
    }

    // Sort by score and regional fit
    return recommendations
      .sort((a, b) => {
        const scoreA = a.score * (effectiveRegion === 'kuwait' ? a.regionalFit / 100 : 1);
        const scoreB = b.score * (effectiveRegion === 'kuwait' ? b.regionalFit / 100 : 1);
        return scoreB - scoreA;
      })
      .slice(0, 10); // Return top 10
  }

  /**
   * Get clarifying questions for a customer service pattern
   */
  getClarifyingQuestions(pattern: string): ClarifyingQuestion[] {
    const questions: ClarifyingQuestion[] = [];
    const patternDef = CUSTOMER_SERVICE_WORKFLOW_PATTERNS[pattern];
    let questionId = 1;

    if (!patternDef) return questions;

    // Pattern-specific questions from the pattern definition
    patternDef.questions.forEach((questionText, index) => {
      questions.push({
        id: `cs_q${questionId++}`,
        question: questionText,
        category: this.categorizeQuestion(questionText),
        options: this.generateOptionsForQuestion(questionText, pattern),
        required: index < 3, // First 3 questions are required
        relevanceScore: 100 - (index * 10),
      });
    });

    // Add regional-specific questions for Kuwait
    if (this.region === 'kuwait') {
      questions.push({
        id: `cs_q${questionId++}`,
        question: 'Should WhatsApp be the primary customer communication channel?',
        category: 'platform',
        options: [
          { value: 'yes', label: 'Yes', description: 'WhatsApp as primary channel (recommended for Kuwait)', implications: ['WhatsApp Business API integration required'] },
          { value: 'secondary', label: 'Secondary', description: 'WhatsApp as secondary to email' },
          { value: 'no', label: 'No', description: 'Email and other channels only' },
        ],
        required: true,
        relevanceScore: 95,
      });

      questions.push({
        id: `cs_q${questionId++}`,
        question: 'Do you need Arabic language support for customer communications?',
        category: 'language',
        options: [
          { value: 'bilingual', label: 'Bilingual (Arabic + English)', description: 'Support in both languages', implications: ['Multilingual agent assignment', 'Arabic templates needed'] },
          { value: 'arabic_only', label: 'Arabic Only', description: 'Arabic as primary language' },
          { value: 'english_only', label: 'English Only', description: 'English communications only' },
        ],
        required: true,
        relevanceScore: 95,
      });

      if (pattern === 'ticket_creation' || pattern === 'complaint_resolution') {
        questions.push({
          id: `cs_q${questionId++}`,
          question: 'What is your target first response time?',
          category: 'frequency',
          options: [
            { value: '1h', label: 'Within 1 hour', description: 'Premium response time', implications: ['Requires dedicated team coverage'] },
            { value: '2h', label: 'Within 2 hours', description: 'Standard for Kuwait market' },
            { value: '4h', label: 'Within 4 hours', description: 'Acceptable for most cases' },
            { value: '24h', label: 'Within 24 hours', description: 'Standard business response' },
          ],
          required: true,
          relevanceScore: 90,
        });
      }

      if (pattern === 'nps_survey' || pattern === 'customer_feedback') {
        questions.push({
          id: `cs_q${questionId++}`,
          question: 'Should feedback collection respect local cultural norms?',
          category: 'region',
          options: [
            { value: 'yes', label: 'Yes', description: 'Use culturally appropriate survey timing and language', implications: ['Avoid surveys during prayer times', 'Use formal Arabic greetings'] },
            { value: 'standard', label: 'Standard Approach', description: 'Generic survey approach' },
          ],
          required: false,
          relevanceScore: 80,
        });
      }
    }

    return questions;
  }

  /**
   * Calculate SLA deadline based on priority and creation time
   */
  calculateSLADeadline(priority: string, createdAt: Date): Date {
    const slaConfig = DEFAULT_SLA_CONFIGURATIONS[priority] || DEFAULT_SLA_CONFIGURATIONS.medium;
    const deadline = new Date(createdAt);
    deadline.setHours(deadline.getHours() + slaConfig.resolutionTimeHours);
    return deadline;
  }

  /**
   * Calculate first response deadline
   */
  calculateFirstResponseDeadline(priority: string, createdAt: Date): Date {
    const slaConfig = DEFAULT_SLA_CONFIGURATIONS[priority] || DEFAULT_SLA_CONFIGURATIONS.medium;
    const deadline = new Date(createdAt);
    deadline.setMinutes(deadline.getMinutes() + slaConfig.responseTimeMinutes);
    return deadline;
  }

  /**
   * Calculate NPS score from responses
   */
  calculateNPSScore(responses: number[]): NPSResult {
    if (responses.length === 0) {
      return {
        score: 0,
        category: 'detractor',
        promoters: 0,
        passives: 0,
        detractors: 0,
        totalResponses: 0,
        recommendation: 'No responses collected yet',
      };
    }

    let promoters = 0;
    let passives = 0;
    let detractors = 0;

    responses.forEach(score => {
      if (score >= 9) {
        promoters++;
      } else if (score >= 7) {
        passives++;
      } else {
        detractors++;
      }
    });

    const totalResponses = responses.length;
    const npsScore = Math.round(((promoters - detractors) / totalResponses) * 100);

    let category: 'promoter' | 'passive' | 'detractor';
    let recommendation: string;

    if (npsScore >= 50) {
      category = 'promoter';
      recommendation = 'Excellent! Focus on leveraging promoters for referrals and testimonials.';
    } else if (npsScore >= 0) {
      category = 'passive';
      recommendation = 'Good but room for improvement. Focus on converting passives to promoters.';
    } else {
      category = 'detractor';
      recommendation = 'Needs attention. Prioritize reaching out to detractors to understand and address concerns.';
    }

    return {
      score: npsScore,
      category,
      promoters,
      passives,
      detractors,
      totalResponses,
      recommendation,
    };
  }

  /**
   * Calculate CSAT score from responses (typically 1-5 scale)
   */
  calculateCSAT(responses: number[]): CSATResult {
    if (responses.length === 0) {
      return {
        score: 0,
        percentage: 0,
        satisfiedCount: 0,
        totalResponses: 0,
        trend: 'stable',
      };
    }

    // Count satisfied responses (4 or 5 on a 5-point scale)
    const satisfiedCount = responses.filter(score => score >= 4).length;
    const totalResponses = responses.length;
    const percentage = Math.round((satisfiedCount / totalResponses) * 100);

    // Average score
    const avgScore = responses.reduce((sum, score) => sum + score, 0) / totalResponses;
    const score = Math.round(avgScore * 100) / 100;

    // Trend would need historical data - defaulting to stable
    const trend: 'improving' | 'stable' | 'declining' = 'stable';

    return {
      score,
      percentage,
      satisfiedCount,
      totalResponses,
      trend,
    };
  }

  /**
   * Calculate Customer Effort Score (CES)
   */
  calculateCES(responses: number[]): number {
    if (responses.length === 0) return 0;
    const sum = responses.reduce((acc, score) => acc + score, 0);
    return Math.round((sum / responses.length) * 100) / 100;
  }

  /**
   * Get the workflow chain for a customer service pattern
   */
  getWorkflowChain(pattern: string): WorkflowChainStep[] {
    const patternDef = CUSTOMER_SERVICE_WORKFLOW_PATTERNS[pattern];
    if (!patternDef) return [];

    const chain: WorkflowChainStep[] = [];

    patternDef.steps.forEach((stepName, index) => {
      const layer = patternDef.layers[Math.min(index, patternDef.layers.length - 1)];
      const implicitReqs = CUSTOMER_SERVICE_IMPLICIT_REQUIREMENTS[pattern] || [];
      const implicitReq = implicitReqs[index];

      chain.push({
        step: index + 1,
        layer,
        description: this.humanizeStepName(stepName),
        requiredCapability: implicitReq?.description || stepName,
        suggestedTools: implicitReq?.suggestedTools || [],
        isResolved: false,
      });
    });

    return chain;
  }

  /**
   * Get regional context for customer service operations
   */
  getRegionalContext(): CustomerServiceRegionalContext | null {
    return this.regionalContext;
  }

  /**
   * Get SLA configuration for a priority level
   */
  getSLAConfiguration(priority: string): SLAConfiguration | null {
    return DEFAULT_SLA_CONFIGURATIONS[priority] || null;
  }

  /**
   * Get ticket priority definition
   */
  getTicketPriority(level: string): TicketPriority | null {
    return TICKET_PRIORITIES[level] || null;
  }

  /**
   * Get escalation path
   */
  getEscalationPath(level: number): EscalationPath | null {
    return ESCALATION_PATHS.find(p => p.level === level) || null;
  }

  /**
   * Determine ticket priority based on indicators
   */
  determinePriority(issueDescription: string): string {
    const description = issueDescription.toLowerCase();

    // Check for critical indicators
    for (const indicator of TICKET_PRIORITIES.critical.indicators) {
      if (description.includes(indicator.toLowerCase())) {
        return 'critical';
      }
    }

    // Check for high priority indicators
    for (const indicator of TICKET_PRIORITIES.high.indicators) {
      if (description.includes(indicator.toLowerCase())) {
        return 'high';
      }
    }

    // Check for medium priority indicators
    for (const indicator of TICKET_PRIORITIES.medium.indicators) {
      if (description.includes(indicator.toLowerCase())) {
        return 'medium';
      }
    }

    // Default to medium
    return 'medium';
  }

  /**
   * Check if within business hours for the region
   */
  isWithinBusinessHours(date: Date = new Date()): boolean {
    if (!this.regionalContext) return true;

    const day = date.getDay();
    const hour = date.getHours();

    // Kuwait business days: Sunday (0) to Thursday (4)
    if (this.region === 'kuwait') {
      const isBusinessDay = day >= 0 && day <= 4;
      const isBusinessHour = hour >= 8 && hour < 17;
      return isBusinessDay && isBusinessHour;
    }

    // UAE business days: Monday (1) to Friday (5)
    if (this.region === 'uae') {
      const isBusinessDay = day >= 1 && day <= 5;
      const isBusinessHour = hour >= 9 && hour < 18;
      return isBusinessDay && isBusinessHour;
    }

    // Saudi business days: Sunday (0) to Thursday (4)
    if (this.region === 'saudi') {
      const isBusinessDay = day >= 0 && day <= 4;
      const isBusinessHour = hour >= 9 && hour < 17;
      return isBusinessDay && isBusinessHour;
    }

    return true;
  }

  /**
   * Get expected response time message based on current time
   */
  getExpectedResponseMessage(): string {
    if (!this.regionalContext) {
      return 'We will respond as soon as possible.';
    }

    if (this.isWithinBusinessHours()) {
      return this.regionalContext.responseExpectation;
    }

    return `We are currently outside business hours. We will respond ${this.regionalContext.responseExpectation} on the next business day.`;
  }

  /**
   * Generate greeting based on regional context
   */
  generateGreeting(customerName?: string): string {
    if (this.region === 'kuwait' || this.region === 'saudi') {
      const greeting = customerName
        ? `Marhaba ${customerName}, thank you for contacting us.`
        : 'Marhaba, thank you for contacting us.';
      return greeting;
    }

    return customerName
      ? `Hello ${customerName}, thank you for contacting us.`
      : 'Hello, thank you for contacting us.';
  }

  /**
   * Generate Arabic greeting
   */
  generateArabicGreeting(customerName?: string): string {
    if (customerName) {
      return `مرحباً ${customerName}، شكراً لتواصلك معنا.`;
    }
    return 'مرحباً، شكراً لتواصلك معنا.';
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private categorizeQuestion(questionText: string): ClarifyingQuestion['category'] {
    const text = questionText.toLowerCase();

    if (text.includes('how often') || text.includes('frequency') || text.includes('time')) {
      return 'frequency';
    }
    if (text.includes('who') || text.includes('team') || text.includes('customer')) {
      return 'audience';
    }
    if (text.includes('format') || text.includes('template')) {
      return 'format';
    }
    if (text.includes('platform') || text.includes('software') || text.includes('system') || text.includes('channel')) {
      return 'platform';
    }
    if (text.includes('region') || text.includes('language') || text.includes('arabic')) {
      return 'language';
    }

    return 'integration';
  }

  private generateOptionsForQuestion(questionText: string, _pattern: string): QuestionOption[] {
    const text = questionText.toLowerCase();

    // Channels question
    if (text.includes('channel') || text.includes('contact support')) {
      return [
        { value: 'whatsapp', label: 'WhatsApp', description: 'WhatsApp Business messaging' },
        { value: 'email', label: 'Email', description: 'Traditional email support' },
        { value: 'phone', label: 'Phone', description: 'Voice support' },
        { value: 'instagram', label: 'Instagram DM', description: 'Instagram direct messages' },
        { value: 'live_chat', label: 'Live Chat', description: 'Website live chat' },
        { value: 'all', label: 'All Channels', description: 'Omnichannel support' },
      ];
    }

    // Categorization question
    if (text.includes('categoriz') || text.includes('categor')) {
      return [
        { value: 'ai', label: 'AI-Powered', description: 'Automatic categorization using AI' },
        { value: 'manual', label: 'Manual', description: 'Agent manually categorizes' },
        { value: 'hybrid', label: 'Hybrid', description: 'AI suggests, agent confirms' },
      ];
    }

    // Priority question
    if (text.includes('priority') || text.includes('urgent')) {
      return [
        { value: 'automatic', label: 'Automatic', description: 'Based on keywords and customer type' },
        { value: 'manual', label: 'Manual', description: 'Agent assigns priority' },
        { value: 'customer', label: 'Customer Choice', description: 'Customer selects urgency' },
      ];
    }

    // Agent assignment question
    if (text.includes('assign') || text.includes('agent')) {
      return [
        { value: 'skill_based', label: 'Skill-Based', description: 'Match to agent skills' },
        { value: 'round_robin', label: 'Round Robin', description: 'Distribute evenly' },
        { value: 'load_balanced', label: 'Load Balanced', description: 'Based on current workload' },
        { value: 'manual', label: 'Manual', description: 'Manager assigns' },
      ];
    }

    // Escalation triggers
    if (text.includes('trigger') || text.includes('escalat')) {
      return [
        { value: 'sla_breach', label: 'SLA Breach', description: 'When SLA is about to be breached' },
        { value: 'sentiment', label: 'Negative Sentiment', description: 'When customer seems frustrated' },
        { value: 'complexity', label: 'Complexity', description: 'When issue is too complex' },
        { value: 'request', label: 'Customer Request', description: 'When customer requests escalation' },
        { value: 'all', label: 'All Above', description: 'All escalation triggers' },
      ];
    }

    // Knowledge base platform
    if (text.includes('knowledge base') || text.includes('platform')) {
      return [
        { value: 'notion', label: 'Notion', description: 'Modern, flexible wiki' },
        { value: 'confluence', label: 'Confluence', description: 'Enterprise wiki' },
        { value: 'zendesk', label: 'Zendesk Guide', description: 'Built into Zendesk' },
        { value: 'freshdesk', label: 'Freshdesk KB', description: 'Built into Freshdesk' },
        { value: 'custom', label: 'Custom Solution', description: 'Custom-built knowledge base' },
      ];
    }

    // Survey type
    if (text.includes('survey') || text.includes('feedback')) {
      return [
        { value: 'csat', label: 'CSAT', description: 'Customer Satisfaction Score' },
        { value: 'nps', label: 'NPS', description: 'Net Promoter Score' },
        { value: 'ces', label: 'CES', description: 'Customer Effort Score' },
        { value: 'custom', label: 'Custom Survey', description: 'Custom questions' },
      ];
    }

    // Approval thresholds
    if (text.includes('approv') || text.includes('threshold')) {
      return [
        { value: 'single', label: 'Single Approval', description: 'One approver for all' },
        { value: 'tiered', label: 'Tiered', description: 'Different levels by amount' },
        { value: 'auto', label: 'Auto-Approve', description: 'Auto-approve under threshold' },
      ];
    }

    // Issue tracker
    if (text.includes('issue tracker') || text.includes('bug tracking')) {
      return [
        { value: 'jira', label: 'Jira', description: 'Atlassian Jira' },
        { value: 'linear', label: 'Linear', description: 'Modern issue tracking' },
        { value: 'github', label: 'GitHub Issues', description: 'GitHub native issues' },
        { value: 'gitlab', label: 'GitLab Issues', description: 'GitLab native issues' },
      ];
    }

    // Default yes/no options
    return [
      { value: 'yes', label: 'Yes', description: 'Enable this feature' },
      { value: 'no', label: 'No', description: 'Skip this feature' },
    ];
  }

  private humanizeStepName(stepName: string): string {
    const mapping: Record<string, string> = {
      // Ticket Creation
      receive_request: 'Receive customer request',
      extract_details: 'Extract ticket details',
      categorize_issue: 'Categorize the issue',
      assign_priority: 'Assign priority level',
      create_ticket: 'Create support ticket',
      assign_agent: 'Assign to support agent',
      notify_customer: 'Notify customer',
      notify_agent: 'Notify assigned agent',

      // Ticket Routing
      analyze_ticket: 'Analyze ticket requirements',
      identify_skills_needed: 'Identify required skills',
      check_agent_availability: 'Check agent availability',
      evaluate_workload: 'Evaluate agent workload',
      select_best_agent: 'Select best-matched agent',
      route_ticket: 'Route ticket to agent',
      update_queue: 'Update queue status',

      // Escalation
      monitor_ticket: 'Monitor ticket status',
      detect_escalation_trigger: 'Detect escalation trigger',
      determine_escalation_level: 'Determine escalation level',
      identify_escalation_target: 'Identify escalation target',
      escalate_ticket: 'Escalate the ticket',
      notify_manager: 'Notify manager',
      track_escalation: 'Track escalation progress',

      // Knowledge Base
      identify_resolution: 'Identify resolution pattern',
      analyze_pattern: 'Analyze common patterns',
      extract_knowledge: 'Extract knowledge content',
      format_article: 'Format KB article',
      review_content: 'Review article content',
      publish_article: 'Publish to knowledge base',
      link_to_tickets: 'Link to related tickets',
      notify_team: 'Notify team of new article',

      // Customer Feedback
      detect_interaction_end: 'Detect interaction completion',
      determine_survey_type: 'Determine survey type',
      send_survey: 'Send feedback survey',
      collect_response: 'Collect survey response',
      analyze_sentiment: 'Analyze customer sentiment',
      categorize_feedback: 'Categorize feedback',
      trigger_follow_up: 'Trigger follow-up action',
      update_metrics: 'Update feedback metrics',

      // NPS Survey
      identify_survey_target: 'Identify survey target',
      schedule_survey: 'Schedule NPS survey',
      send_nps_survey: 'Send NPS survey',
      collect_score: 'Collect NPS score',
      collect_feedback: 'Collect verbatim feedback',
      analyze_response: 'Analyze survey response',
      segment_customer: 'Segment customer',
      trigger_action: 'Trigger follow-up action',
      update_dashboard: 'Update NPS dashboard',

      // Complaint Resolution
      receive_complaint: 'Receive customer complaint',
      acknowledge_receipt: 'Acknowledge complaint receipt',
      investigate_issue: 'Investigate the issue',
      determine_resolution: 'Determine resolution',
      approve_resolution: 'Approve resolution',
      implement_resolution: 'Implement resolution',
      follow_up: 'Follow up with customer',
      close_complaint: 'Close complaint',

      // Refund Processing
      receive_refund_request: 'Receive refund request',
      validate_eligibility: 'Validate refund eligibility',
      check_policy: 'Check refund policy',
      calculate_refund: 'Calculate refund amount',
      route_approval: 'Route for approval',
      process_refund: 'Process the refund',
      update_systems: 'Update systems',
      update_analytics: 'Update analytics',

      // Account Recovery
      receive_recovery_request: 'Receive recovery request',
      verify_identity: 'Verify customer identity',
      check_security_questions: 'Check security questions',
      send_verification_code: 'Send verification code',
      validate_code: 'Validate verification code',
      reset_credentials: 'Reset credentials',
      log_security_event: 'Log security event',

      // Feature Request
      receive_request_fr: 'Receive feature request',
      categorize_request: 'Categorize request',
      check_existing_requests: 'Check for duplicates',
      assess_feasibility: 'Assess feasibility',
      prioritize_request: 'Prioritize request',
      add_to_backlog: 'Add to product backlog',
      track_progress: 'Track request progress',

      // Bug Report
      receive_bug_report: 'Receive bug report',
      validate_report: 'Validate bug report',
      reproduce_issue: 'Reproduce the issue',
      assess_severity: 'Assess severity',
      create_engineering_ticket: 'Create engineering ticket',
      assign_developer: 'Assign to developer',
      track_resolution: 'Track resolution',
      close_report: 'Close bug report',

      // Onboarding Support
      detect_new_customer: 'Detect new customer',
      assign_onboarding_specialist: 'Assign onboarding specialist',
      send_welcome_message: 'Send welcome message',
      schedule_onboarding_call: 'Schedule onboarding call',
      conduct_onboarding: 'Conduct onboarding',
      provide_resources: 'Provide resources',
      transition_to_support: 'Transition to support',

      // Training Request
      receive_training_request: 'Receive training request',
      assess_needs: 'Assess training needs',
      recommend_training: 'Recommend training',
      schedule_session: 'Schedule training session',
      send_calendar_invite: 'Send calendar invite',
      prepare_materials: 'Prepare training materials',
      conduct_training: 'Conduct training',
      provide_resources_tr: 'Provide post-training resources',

      // Account Cancellation
      receive_cancellation_request: 'Receive cancellation request',
      verify_account: 'Verify account',
      collect_cancellation_reason: 'Collect cancellation reason',
      trigger_retention_offer: 'Trigger retention offer',
      process_decision: 'Process customer decision',
      handle_cancellation: 'Handle cancellation',
      process_final_billing: 'Process final billing',
      schedule_exit_survey: 'Schedule exit survey',

      // Win Back Campaign
      identify_churned_customer: 'Identify churned customer',
      analyze_churn_reason: 'Analyze churn reason',
      select_campaign: 'Select win-back campaign',
      personalize_offer: 'Personalize offer',
      send_outreach: 'Send outreach',
      track_response: 'Track response',
      process_return: 'Process customer return',
    };

    return mapping[stepName] || stepName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default CustomerServiceDomainIntelligence;

// Convenience functions
export function createCustomerServiceIntelligence(region: string = 'kuwait'): CustomerServiceDomainIntelligence {
  return new CustomerServiceDomainIntelligence(region);
}

export function detectCustomerServiceWorkflow(request: string, region: string = 'kuwait'): string | null {
  const intelligence = new CustomerServiceDomainIntelligence(region);
  return intelligence.detectCustomerServicePattern(request);
}

export function analyzeCustomerServiceRequest(
  request: string,
  region: string = 'kuwait'
): CustomerServiceAnalysisResult {
  const intelligence = new CustomerServiceDomainIntelligence(region);
  const pattern = intelligence.detectCustomerServicePattern(request);

  return {
    pattern,
    requirements: pattern ? intelligence.getImplicitRequirements(pattern) : [],
    tools: pattern ? intelligence.getToolRecommendations(pattern) : [],
    questions: pattern ? intelligence.getClarifyingQuestions(pattern) : [],
    slaConfig: pattern ? intelligence.getSLAConfiguration('medium') : null,
    regionalContext: intelligence.getRegionalContext(),
  };
}

// NPS calculation helper
export function calculateNPS(responses: number[]): NPSResult {
  const intelligence = new CustomerServiceDomainIntelligence();
  return intelligence.calculateNPSScore(responses);
}

// CSAT calculation helper
export function calculateCSAT(responses: number[]): CSATResult {
  const intelligence = new CustomerServiceDomainIntelligence();
  return intelligence.calculateCSAT(responses);
}

// SLA deadline calculation helper
export function calculateSLADeadline(priority: string, createdAt: Date): Date {
  const intelligence = new CustomerServiceDomainIntelligence();
  return intelligence.calculateSLADeadline(priority, createdAt);
}

// Priority determination helper
export function determinePriority(issueDescription: string): string {
  const intelligence = new CustomerServiceDomainIntelligence();
  return intelligence.determinePriority(issueDescription);
}
