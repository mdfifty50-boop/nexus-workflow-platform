/**
 * Nexus Sales Domain Intelligence Module
 *
 * Provides comprehensive sales workflow intelligence including:
 * - Lead capture and qualification workflows
 * - Demo scheduling and proposal generation
 * - Contract negotiation and deal closing
 * - Win/loss analysis and account handoff
 * - Upsell identification and renewal reminders
 * - Churn prevention and commission tracking
 *
 * Regional Focus: Kuwait/Gulf with WhatsApp Business as primary communication,
 * KWD currency, and Arabic/English dual-language support.
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

export interface SalesWorkflowPattern {
  name: string;
  description: string;
  layers: ('input' | 'processing' | 'output' | 'notification')[];
  steps: string[];
  implicitNeeds: string[];
  questions: string[];
  salesStageRequirements: string[];
  estimatedROI: string;
}

export interface SalesRegionalContext {
  region: string;
  currency: string;
  currencySymbol: string;
  commonCRMs: string[];
  paymentTerms: string;
  businessHours: string;
  communicationPreference: string;
  contractLanguage: string;
  salesCycle: string;
  typicalDealSize: string;
  preferredChannels: string[];
}

export interface CommissionCalculation {
  dealValue: number;
  commissionRate: number;
  baseCommission: number;
  bonusThreshold?: number;
  bonusAmount?: number;
  totalCommission: number;
  currency: string;
  formula: string;
  notes: string[];
}

export interface LeadScore {
  score: number;
  maxScore: number;
  percentage: number;
  factors: LeadScoreFactor[];
  recommendation: string;
  nextBestAction: string;
}

export interface LeadScoreFactor {
  name: string;
  weight: number;
  score: number;
  maxScore: number;
  reason: string;
}

export interface SalesAnalysisResult {
  pattern: string | null;
  requirements: ImplicitRequirement[];
  tools: ToolRecommendation[];
  questions: ClarifyingQuestion[];
  stageRecommendation: string;
  estimatedConversionRate: string;
}

// ============================================================================
// SALES WORKFLOW PATTERNS
// ============================================================================

export const SALES_WORKFLOW_PATTERNS: Record<string, SalesWorkflowPattern> = {
  // Lead Capture Pattern
  lead_capture: {
    name: 'Lead Capture',
    description: 'Automated lead capture from multiple sources with instant CRM entry and sales notification',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'capture_lead_data',
      'validate_contact_info',
      'enrich_lead_data',
      'assign_lead_score',
      'create_crm_record',
      'notify_sales_rep',
    ],
    implicitNeeds: [
      'Multi-channel lead capture (web forms, social, chat, WhatsApp)',
      'Lead data validation and deduplication',
      'Company and contact enrichment service',
      'Lead scoring algorithm configuration',
      'CRM integration for record creation',
      'Real-time notification to assigned rep',
      'Lead source attribution tracking',
    ],
    questions: [
      'What are your primary lead sources (website, social, referrals)?',
      'What qualifies as a sales-ready lead for your business?',
      'Which CRM system do you use?',
      'How should leads be assigned to sales reps?',
      'Do you need lead scoring based on specific criteria?',
    ],
    salesStageRequirements: [
      'Lead source tracking for ROI analysis',
      'Duplicate detection to prevent CRM pollution',
      'Response time SLA tracking (speed to lead)',
    ],
    estimatedROI: 'Reduces lead response time by 90%, captures 30% more leads',
  },

  // Lead Qualification Pattern
  lead_qualification: {
    name: 'Lead Qualification',
    description: 'Automated lead qualification using BANT, MEDDIC, or custom criteria with routing',
    layers: ['input', 'processing', 'processing', 'output', 'notification'],
    steps: [
      'receive_lead',
      'gather_qualification_data',
      'apply_qualification_criteria',
      'calculate_priority_score',
      'update_lead_status',
      'route_to_appropriate_team',
      'notify_assigned_owner',
    ],
    implicitNeeds: [
      'Qualification framework (BANT, MEDDIC, CHAMP)',
      'Automated qualification questionnaire',
      'Budget and authority verification',
      'Timeline and need assessment',
      'Competitor intelligence gathering',
      'MQL to SQL conversion tracking',
      'Disqualification workflows with nurture routing',
    ],
    questions: [
      'What qualification framework do you use (BANT, MEDDIC, custom)?',
      'What budget threshold qualifies a lead?',
      'How do you verify decision-making authority?',
      'Should unqualified leads enter a nurture sequence?',
      'What triggers immediate escalation to senior sales?',
    ],
    salesStageRequirements: [
      'Clear MQL to SQL criteria documentation',
      'Qualification score transparency',
      'SDR to AE handoff protocol',
    ],
    estimatedROI: 'Increases SQL quality by 40%, reduces sales cycle by 25%',
  },

  // Demo Scheduling Pattern
  demo_scheduling: {
    name: 'Demo Scheduling',
    description: 'Seamless demo booking with calendar sync, timezone handling, and automated reminders',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'receive_demo_request',
      'check_rep_availability',
      'handle_timezone_conversion',
      'create_calendar_event',
      'send_confirmation',
      'send_reminder_sequence',
      'log_in_crm',
    ],
    implicitNeeds: [
      'Calendar integration (Google Calendar, Outlook)',
      'Timezone detection and conversion',
      'Round-robin or rules-based rep assignment',
      'Automated confirmation emails',
      'Pre-demo reminder sequence (24h, 1h)',
      'Demo no-show handling workflow',
      'CRM activity logging',
    ],
    questions: [
      'Which calendar system do reps use?',
      'How should demos be assigned to sales reps?',
      'What is your standard demo duration?',
      'Should reminders be sent via email, SMS, or WhatsApp?',
      'What happens if a prospect no-shows?',
    ],
    salesStageRequirements: [
      'Demo-to-opportunity conversion tracking',
      'Show rate metrics',
      'Average meeting duration analytics',
    ],
    estimatedROI: 'Increases demo show rate by 35%, saves 4 hours/week per rep',
  },

  // Proposal Generation Pattern
  proposal_generation: {
    name: 'Proposal Generation',
    description: 'Automated proposal creation with pricing, terms, and approval workflows',
    layers: ['input', 'processing', 'processing', 'output', 'notification'],
    steps: [
      'gather_deal_requirements',
      'select_proposal_template',
      'calculate_pricing',
      'apply_discounts_rules',
      'generate_proposal_document',
      'route_for_approval',
      'send_to_prospect',
      'track_proposal_views',
    ],
    implicitNeeds: [
      'Proposal template library',
      'Dynamic pricing calculator',
      'Discount approval workflow',
      'CPQ (Configure, Price, Quote) integration',
      'PDF generation with branding',
      'Proposal tracking (opens, views, time spent)',
      'E-signature integration',
      'CRM opportunity update',
    ],
    questions: [
      'Do you have standard proposal templates?',
      'What are your pricing rules and discount thresholds?',
      'Who needs to approve discounts above X%?',
      'Should proposals include e-signature capability?',
      'Do you need proposal engagement tracking?',
    ],
    salesStageRequirements: [
      'Proposal-to-close rate tracking',
      'Average deal size by proposal type',
      'Discount frequency analysis',
    ],
    estimatedROI: 'Reduces proposal creation time by 80%, improves win rate by 15%',
  },

  // Contract Negotiation Pattern
  contract_negotiation: {
    name: 'Contract Negotiation',
    description: 'Structured contract negotiation with redline tracking and approval workflows',
    layers: ['input', 'processing', 'processing', 'output', 'notification'],
    steps: [
      'generate_initial_contract',
      'send_for_customer_review',
      'track_redline_changes',
      'route_to_legal_review',
      'negotiate_terms',
      'get_final_approval',
      'send_for_signature',
      'archive_executed_contract',
    ],
    implicitNeeds: [
      'Contract template library with standard terms',
      'Redline/markup tracking capability',
      'Legal review workflow integration',
      'Version control for contract iterations',
      'Approval routing by deal size/terms',
      'E-signature platform integration',
      'Contract storage and retrieval system',
      'Expiration and renewal tracking',
    ],
    questions: [
      'Do you use standard contract templates?',
      'Which terms require legal review?',
      'Who has authority to approve non-standard terms?',
      'What e-signature platform do you use?',
      'How should executed contracts be stored?',
    ],
    salesStageRequirements: [
      'Negotiation cycle time tracking',
      'Legal review turnaround SLA',
      'Non-standard term frequency analysis',
    ],
    estimatedROI: 'Reduces contract cycle by 50%, ensures compliance 100%',
  },

  // Deal Closing Pattern
  deal_closing: {
    name: 'Deal Closing',
    description: 'End-to-end deal closing automation from signed contract to revenue recognition',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'receive_signed_contract',
      'verify_deal_terms',
      'update_opportunity_status',
      'trigger_invoicing',
      'initiate_onboarding',
      'notify_success_team',
      'update_forecasting',
      'calculate_commission',
    ],
    implicitNeeds: [
      'Contract signature verification',
      'CRM opportunity status update',
      'Billing/invoicing system integration',
      'Customer onboarding trigger',
      'Customer success team notification',
      'Revenue forecasting update',
      'Commission calculation and tracking',
      'Win announcement (internal celebration)',
    ],
    questions: [
      'How is deal closed-won status confirmed?',
      'Should invoicing be triggered automatically?',
      'Who handles customer onboarding?',
      'How should the team be notified of wins?',
      'How are commissions calculated?',
    ],
    salesStageRequirements: [
      'Closed-won to revenue recognition time',
      'Onboarding initiation speed',
      'Commission accuracy verification',
    ],
    estimatedROI: 'Reduces close-to-cash by 60%, eliminates revenue leakage',
  },

  // Win/Loss Analysis Pattern
  win_loss_analysis: {
    name: 'Win/Loss Analysis',
    description: 'Systematic analysis of won and lost deals to improve sales effectiveness',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'trigger_analysis_request',
      'gather_deal_data',
      'conduct_customer_interview',
      'analyze_competitor_factors',
      'identify_patterns',
      'generate_insights_report',
      'distribute_to_stakeholders',
      'update_playbook',
    ],
    implicitNeeds: [
      'Automated analysis trigger (deal closure)',
      'CRM data aggregation',
      'Customer/prospect interview scheduling',
      'Competitor intelligence database',
      'Pattern recognition/AI analysis',
      'Report generation and visualization',
      'Stakeholder notification workflow',
      'Sales playbook update mechanism',
    ],
    questions: [
      'Should analysis be triggered for all deals or above threshold?',
      'Do you conduct customer interviews for lost deals?',
      'What competitor data should be tracked?',
      'Who should receive win/loss reports?',
      'How often should the sales playbook be updated?',
    ],
    salesStageRequirements: [
      'Win rate by competitor',
      'Loss reason categorization',
      'Trend identification over time',
    ],
    estimatedROI: 'Improves win rate by 20% through continuous learning',
  },

  // Account Handoff Pattern
  account_handoff: {
    name: 'Account Handoff',
    description: 'Seamless transition from sales to customer success with complete context transfer',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'trigger_handoff_workflow',
      'compile_deal_context',
      'schedule_handoff_meeting',
      'transfer_account_ownership',
      'create_customer_profile',
      'send_welcome_package',
      'notify_all_stakeholders',
      'track_handoff_completion',
    ],
    implicitNeeds: [
      'Handoff trigger (closed-won status)',
      'Deal history and context compilation',
      'Meeting scheduling automation',
      'CRM ownership transfer',
      'Customer success platform integration',
      'Automated welcome email/materials',
      'Stakeholder notification workflow',
      'Handoff quality tracking',
    ],
    questions: [
      'What information must be transferred to customer success?',
      'Should a handoff meeting be scheduled automatically?',
      'Who should attend the handoff meeting?',
      'What welcome materials should be sent to the customer?',
      'How do you measure successful handoff?',
    ],
    salesStageRequirements: [
      'Handoff completion rate',
      'Time to first value (post-handoff)',
      'Customer satisfaction with transition',
    ],
    estimatedROI: 'Reduces time-to-value by 40%, improves retention by 25%',
  },

  // Upsell Identification Pattern
  upsell_identification: {
    name: 'Upsell Identification',
    description: 'Proactive identification of upsell opportunities based on usage and behavior signals',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'monitor_usage_patterns',
      'analyze_expansion_signals',
      'score_upsell_readiness',
      'identify_relevant_products',
      'create_upsell_opportunity',
      'notify_account_owner',
      'generate_proposal_recommendations',
    ],
    implicitNeeds: [
      'Product usage data integration',
      'Behavioral signal tracking',
      'Upsell readiness scoring model',
      'Product recommendation engine',
      'CRM opportunity creation',
      'Account owner notification',
      'Proposal template selection',
      'Revenue expansion forecasting',
    ],
    questions: [
      'What usage metrics indicate upsell readiness?',
      'What products/tiers are available for upsell?',
      'Who owns upsell conversations (sales or CS)?',
      'Should upsell opportunities be auto-created in CRM?',
      'What is your target expansion revenue percentage?',
    ],
    salesStageRequirements: [
      'Expansion revenue vs new business tracking',
      'Upsell acceptance rate',
      'Average expansion deal size',
    ],
    estimatedROI: 'Identifies 50% more expansion opportunities, 3x ROI vs new acquisition',
  },

  // Renewal Reminder Pattern
  renewal_reminder: {
    name: 'Renewal Reminder',
    description: 'Proactive renewal management with automated reminders and health checks',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'track_contract_expiration',
      'assess_account_health',
      'determine_renewal_strategy',
      'send_internal_alerts',
      'initiate_renewal_conversation',
      'generate_renewal_proposal',
      'track_renewal_progress',
      'update_forecasting',
    ],
    implicitNeeds: [
      'Contract expiration tracking',
      'Account health scoring',
      'Renewal playbook automation',
      'Internal alert system (90/60/30 days)',
      'Customer outreach templates',
      'Renewal proposal generation',
      'Pipeline and forecasting integration',
      'Multi-year discount rules',
    ],
    questions: [
      'How far in advance should renewal process start?',
      'What account health signals should trigger early intervention?',
      'Do you offer multi-year renewal incentives?',
      'Who owns the renewal conversation (sales or CS)?',
      'Should renewal proposals be auto-generated?',
    ],
    salesStageRequirements: [
      'Gross retention rate tracking',
      'Net retention rate (with expansion)',
      'Renewal cycle time analysis',
    ],
    estimatedROI: 'Improves renewal rate by 15%, reduces late renewals by 80%',
  },

  // Churn Prevention Pattern
  churn_prevention: {
    name: 'Churn Prevention',
    description: 'Early churn risk detection with automated intervention workflows',
    layers: ['input', 'processing', 'processing', 'output', 'notification'],
    steps: [
      'monitor_health_signals',
      'calculate_churn_risk_score',
      'identify_risk_factors',
      'trigger_intervention_workflow',
      'assign_save_owner',
      'execute_save_playbook',
      'track_intervention_outcome',
      'update_churn_model',
    ],
    implicitNeeds: [
      'Customer health signal monitoring',
      'Churn prediction model/scoring',
      'Risk factor identification',
      'Automated intervention triggers',
      'Save playbook library',
      'Executive escalation workflow',
      'Outcome tracking and analysis',
      'Model feedback loop for improvement',
    ],
    questions: [
      'What signals indicate churn risk (usage, engagement, support)?',
      'What is your acceptable churn risk threshold?',
      'Who handles at-risk customer interventions?',
      'Do you have a "save" playbook with incentives?',
      'Should executives be notified for high-value at-risk accounts?',
    ],
    salesStageRequirements: [
      'Churn prediction accuracy',
      'Save rate for intervened accounts',
      'Time from risk detection to intervention',
    ],
    estimatedROI: 'Prevents 30% of potential churn, saves 5x vs acquisition cost',
  },

  // Reference Request Pattern
  reference_request: {
    name: 'Reference Request',
    description: 'Automated reference matching and request management for sales cycles',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'receive_reference_request',
      'identify_matching_customers',
      'check_reference_availability',
      'send_reference_request',
      'schedule_reference_call',
      'track_reference_completion',
      'send_thank_you',
      'update_reference_database',
    ],
    implicitNeeds: [
      'Reference customer database',
      'Industry/use case matching algorithm',
      'Reference availability tracking',
      'Automated request workflow',
      'Call scheduling integration',
      'Reference tracking and limits',
      'Thank you/reward workflow',
      'Reference program management',
    ],
    questions: [
      'Do you maintain a reference customer database?',
      'What criteria should match prospect to reference?',
      'How often can a customer be used as reference?',
      'Do you incentivize customers for references?',
      'Should reference calls be scheduled automatically?',
    ],
    salesStageRequirements: [
      'Reference influence on win rate',
      'Average time to provide reference',
      'Reference customer satisfaction',
    ],
    estimatedROI: 'Increases deal velocity by 30%, improves win rate by 15%',
  },

  // Quote Approval Pattern
  quote_approval: {
    name: 'Quote Approval',
    description: 'Streamlined quote approval with dynamic routing and SLA tracking',
    layers: ['input', 'processing', 'processing', 'output', 'notification'],
    steps: [
      'submit_quote_for_approval',
      'validate_quote_details',
      'determine_approval_path',
      'route_to_approvers',
      'track_approval_status',
      'handle_approver_feedback',
      'finalize_approved_quote',
      'notify_requester',
    ],
    implicitNeeds: [
      'Quote submission interface',
      'Pricing validation rules',
      'Dynamic approval routing (by discount, deal size)',
      'Parallel/sequential approver workflow',
      'SLA tracking and escalation',
      'Approver feedback mechanism',
      'Quote version management',
      'Audit trail and compliance',
    ],
    questions: [
      'What discount levels require approval?',
      'Who are the approvers at each level?',
      'What is the expected approval turnaround time?',
      'Should approvals be parallel or sequential?',
      'What happens if approval SLA is missed?',
    ],
    salesStageRequirements: [
      'Average approval cycle time',
      'Approval bottleneck analysis',
      'Discount approval rate by rep',
    ],
    estimatedROI: 'Reduces approval time by 70%, eliminates deal delays',
  },

  // Territory Assignment Pattern
  territory_assignment: {
    name: 'Territory Assignment',
    description: 'Intelligent territory and lead assignment with load balancing',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'receive_new_lead_or_account',
      'determine_territory_rules',
      'check_rep_capacity',
      'apply_assignment_logic',
      'update_ownership',
      'notify_assigned_rep',
      'log_assignment_history',
    ],
    implicitNeeds: [
      'Territory definition rules (geography, industry, size)',
      'Rep capacity and workload tracking',
      'Round-robin or weighted assignment',
      'Override and manual assignment capability',
      'CRM ownership field update',
      'Assignment notification workflow',
      'Historical assignment tracking',
      'Territory change management',
    ],
    questions: [
      'How are territories defined (geography, industry, company size)?',
      'Should leads be round-robin assigned or weighted by performance?',
      'What is the maximum active deals per rep?',
      'Should named accounts bypass normal assignment?',
      'Who can override territory assignments?',
    ],
    salesStageRequirements: [
      'Assignment fairness metrics',
      'Territory coverage gaps',
      'Rep capacity utilization',
    ],
    estimatedROI: 'Optimizes rep utilization by 25%, eliminates orphaned leads',
  },

  // Commission Tracking Pattern
  commission_tracking: {
    name: 'Commission Tracking',
    description: 'Automated commission calculation, tracking, and dispute resolution',
    layers: ['input', 'processing', 'processing', 'output', 'notification'],
    steps: [
      'receive_deal_closure',
      'validate_deal_attribution',
      'apply_commission_rules',
      'calculate_commission_amount',
      'handle_split_scenarios',
      'update_commission_ledger',
      'notify_rep_of_commission',
      'generate_payout_report',
    ],
    implicitNeeds: [
      'Deal closure integration',
      'Attribution and credit rules',
      'Commission plan configuration',
      'Tiered/accelerator calculations',
      'Split commission handling',
      'Commission ledger/tracking',
      'Rep notification system',
      'Payout integration with finance',
      'Dispute resolution workflow',
    ],
    questions: [
      'What is your commission structure (flat, tiered, accelerators)?',
      'How are split deals handled?',
      'When are commissions paid (at booking, payment, go-live)?',
      'How are commission disputes resolved?',
      'Do you have spiffs or bonus incentives?',
    ],
    salesStageRequirements: [
      'Commission accuracy rate',
      'Payout timing compliance',
      'Dispute resolution time',
    ],
    estimatedROI: 'Eliminates commission errors by 95%, reduces disputes by 80%',
  },
};

// ============================================================================
// SALES KEYWORDS FOR PATTERN DETECTION
// ============================================================================

export const SALES_KEYWORDS: Record<string, string[]> = {
  lead_capture: [
    'lead', 'leads', 'capture', 'inbound', 'form', 'landing page',
    'lead gen', 'lead generation', 'new lead', 'website lead',
    'social lead', 'inquiry', 'prospect', 'contact form',
    'عميل محتمل', 'استفسار', 'تواصل'
  ],

  lead_qualification: [
    'qualify', 'qualification', 'qualified', 'mql', 'sql', 'bant',
    'meddic', 'budget', 'authority', 'need', 'timeline',
    'sales ready', 'sales qualified', 'marketing qualified',
    'تأهيل', 'تصنيف العملاء'
  ],

  demo_scheduling: [
    'demo', 'demonstration', 'schedule', 'book', 'meeting',
    'call', 'appointment', 'discovery', 'discovery call',
    'calendar', 'timezone', 'availability',
    'عرض تجريبي', 'موعد', 'حجز'
  ],

  proposal_generation: [
    'proposal', 'quote', 'pricing', 'offer', 'bid',
    'rfp', 'rfi', 'quotation', 'estimate', 'price quote',
    'cpq', 'configure price quote',
    'عرض سعر', 'عرض أسعار', 'اقتراح'
  ],

  contract_negotiation: [
    'contract', 'negotiate', 'negotiation', 'terms', 'agreement',
    'redline', 'markup', 'legal', 'msa', 'nda', 'sla',
    'sign', 'signature', 'execute',
    'عقد', 'تفاوض', 'اتفاقية'
  ],

  deal_closing: [
    'close', 'closing', 'closed', 'won', 'win', 'deal',
    'closed won', 'close deal', 'signature', 'signed',
    'booking', 'revenue', 'new business',
    'إغلاق الصفقة', 'فوز', 'إيرادات'
  ],

  win_loss_analysis: [
    'win loss', 'won lost', 'analysis', 'review', 'lost deal',
    'competitive', 'why lost', 'deal review', 'post mortem',
    'lessons learned', 'feedback',
    'تحليل', 'مراجعة الصفقات'
  ],

  account_handoff: [
    'handoff', 'hand off', 'transition', 'transfer', 'onboarding',
    'customer success', 'implementation', 'kickoff',
    'sales to cs', 'post sale',
    'تسليم', 'انتقال', 'تحويل العميل'
  ],

  upsell_identification: [
    'upsell', 'upselling', 'expansion', 'cross sell', 'cross-sell',
    'upgrade', 'additional', 'expand', 'grow account',
    'net expansion', 'land and expand',
    'توسيع', 'ترقية', 'بيع إضافي'
  ],

  renewal_reminder: [
    'renewal', 'renew', 'expiration', 'expiring', 'contract end',
    'subscription', 'annual', 'anniversary', 'retention',
    'auto renew', 'renewal date',
    'تجديد', 'انتهاء العقد', 'اشتراك'
  ],

  churn_prevention: [
    'churn', 'churning', 'at risk', 'at-risk', 'cancel',
    'cancellation', 'leaving', 'risk', 'health', 'save',
    'retention', 'prevent churn',
    'فقدان العميل', 'إلغاء', 'احتفاظ'
  ],

  reference_request: [
    'reference', 'referral', 'testimonial', 'case study',
    'customer reference', 'reference call', 'advocate',
    'success story', 'recommendation',
    'مرجع', 'توصية', 'شهادة عميل'
  ],

  quote_approval: [
    'quote approval', 'approve quote', 'pricing approval',
    'discount approval', 'special pricing', 'approval workflow',
    'deal desk', 'pricing exception',
    'موافقة على السعر', 'اعتماد العرض'
  ],

  territory_assignment: [
    'territory', 'assign', 'assignment', 'routing', 'distribution',
    'round robin', 'lead routing', 'account assignment',
    'ownership', 'coverage',
    'منطقة', 'توزيع', 'تعيين'
  ],

  commission_tracking: [
    'commission', 'commissions', 'comp', 'compensation',
    'incentive', 'spiff', 'bonus', 'payout', 'earnings',
    'quota', 'attainment', 'accelerator',
    'عمولة', 'حوافز', 'مكافأة'
  ],
};

// ============================================================================
// SALES IMPLICIT REQUIREMENTS
// ============================================================================

export const SALES_IMPLICIT_REQUIREMENTS: Record<string, ImplicitRequirement[]> = {
  lead_capture: [
    {
      category: 'input',
      description: 'Multi-channel lead capture integration',
      reason: 'Leads come from various sources: web forms, social media, chat, WhatsApp',
      priority: 'critical',
      suggestedTools: ['HubSpot Forms', 'Typeform', 'WhatsApp Business API', 'Facebook Lead Ads'],
    },
    {
      category: 'processing',
      description: 'Lead scoring and prioritization',
      reason: 'Not all leads are equal; prioritize based on fit and engagement',
      priority: 'critical',
      suggestedTools: ['HubSpot Lead Scoring', 'Salesforce Einstein', 'Zoho CRM'],
    },
    {
      category: 'processing',
      description: 'Lead deduplication and enrichment',
      reason: 'Prevent duplicate records and enhance lead data automatically',
      priority: 'important',
      suggestedTools: ['Clearbit', 'ZoomInfo', 'Apollo.io', 'LinkedIn Sales Navigator'],
    },
    {
      category: 'output',
      description: 'CRM record creation',
      reason: 'All leads must be captured in CRM for tracking and follow-up',
      priority: 'critical',
      suggestedTools: ['Zoho CRM', 'HubSpot CRM', 'Salesforce', 'Pipedrive'],
    },
    {
      category: 'notification',
      description: 'Real-time sales rep notification',
      reason: 'Speed to lead is critical - immediate notification increases conversion',
      priority: 'critical',
      suggestedTools: ['Slack', 'WhatsApp', 'Email', 'Microsoft Teams'],
    },
    {
      category: 'processing',
      description: 'Lead source attribution tracking',
      reason: 'Track which channels generate the best leads for ROI analysis',
      priority: 'important',
      suggestedTools: ['UTM tracking', 'Google Analytics', 'HubSpot Analytics'],
    },
  ],

  lead_qualification: [
    {
      category: 'input',
      description: 'Qualification data collection mechanism',
      reason: 'Systematic data gathering for qualification assessment',
      priority: 'critical',
      suggestedTools: ['Typeform', 'Calendly + Pre-meeting questions', 'Drift', 'Intercom'],
    },
    {
      category: 'processing',
      description: 'BANT/MEDDIC qualification framework',
      reason: 'Consistent qualification criteria ensures lead quality',
      priority: 'critical',
      suggestedTools: ['HubSpot Playbooks', 'Salesforce Path', 'Gong', 'Chorus'],
    },
    {
      category: 'processing',
      description: 'Budget verification process',
      reason: 'Ensure prospect has budget authority before investing sales time',
      priority: 'important',
      suggestedTools: ['Custom qualification workflow', 'CRM required fields'],
    },
    {
      category: 'output',
      description: 'Lead routing to appropriate team',
      reason: 'Qualified leads go to closers; unqualified go to nurture',
      priority: 'critical',
      suggestedTools: ['Zoho CRM Assignment Rules', 'Salesforce Lead Assignment', 'LeanData'],
    },
    {
      category: 'notification',
      description: 'SDR to AE handoff notification',
      reason: 'Smooth transition with full context preserves momentum',
      priority: 'important',
      suggestedTools: ['Slack', 'CRM Activity Log', 'Email'],
    },
  ],

  demo_scheduling: [
    {
      category: 'input',
      description: 'Calendar integration for availability',
      reason: 'Real-time availability prevents double-booking and scheduling conflicts',
      priority: 'critical',
      suggestedTools: ['Calendly', 'Cal.com', 'Google Calendar API', 'Microsoft Graph'],
    },
    {
      category: 'processing',
      description: 'Timezone detection and handling',
      reason: 'Kuwait business works with global prospects; timezone accuracy is critical',
      priority: 'critical',
      suggestedTools: ['Calendly timezone detection', 'WorldTimeAPI', 'Luxon'],
    },
    {
      category: 'processing',
      description: 'Round-robin or rules-based rep assignment',
      reason: 'Fair distribution of demos among sales team',
      priority: 'important',
      suggestedTools: ['Calendly Round Robin', 'Chilipiper', 'HubSpot Meetings'],
    },
    {
      category: 'output',
      description: 'Calendar event creation with meeting link',
      reason: 'Confirmed meeting on both calendars with video link',
      priority: 'critical',
      suggestedTools: ['Google Calendar', 'Microsoft Outlook', 'Zoom', 'Google Meet'],
    },
    {
      category: 'notification',
      description: 'Confirmation and reminder sequence',
      reason: 'Reminders significantly reduce no-show rates',
      priority: 'important',
      suggestedTools: ['Calendly Reminders', 'WhatsApp Business', 'Email'],
    },
    {
      category: 'output',
      description: 'CRM activity logging',
      reason: 'Track all prospect interactions in one place',
      priority: 'important',
      suggestedTools: ['Zoho CRM', 'HubSpot', 'Salesforce'],
    },
  ],

  proposal_generation: [
    {
      category: 'input',
      description: 'Deal requirements gathering',
      reason: 'Accurate proposal requires clear understanding of customer needs',
      priority: 'critical',
      suggestedTools: ['CRM Opportunity Fields', 'Typeform', 'Discovery Call Notes'],
    },
    {
      category: 'processing',
      description: 'Proposal template library',
      reason: 'Consistent, professional proposals save time and improve win rate',
      priority: 'critical',
      suggestedTools: ['PandaDoc', 'Proposify', 'DocuSign', 'Google Docs Templates'],
    },
    {
      category: 'processing',
      description: 'Dynamic pricing calculation',
      reason: 'Accurate pricing with rules for discounts and custom configurations',
      priority: 'critical',
      suggestedTools: ['Salesforce CPQ', 'HubSpot Quotes', 'DealHub', 'PandaDoc Pricing'],
    },
    {
      category: 'processing',
      description: 'Discount approval workflow',
      reason: 'Protect margins with approval for discounts above threshold',
      priority: 'important',
      suggestedTools: ['Slack Workflows', 'Salesforce Approval Process', 'Custom Workflow'],
    },
    {
      category: 'output',
      description: 'PDF generation with branding',
      reason: 'Professional branded documents increase perceived value',
      priority: 'important',
      suggestedTools: ['PandaDoc', 'Proposify', 'Google Docs to PDF'],
    },
    {
      category: 'notification',
      description: 'Proposal engagement tracking',
      reason: 'Know when and how long prospects view proposals for follow-up timing',
      priority: 'optional',
      suggestedTools: ['PandaDoc Analytics', 'DocSend', 'Proposify Metrics'],
    },
  ],

  contract_negotiation: [
    {
      category: 'input',
      description: 'Contract template library with standard terms',
      reason: 'Start negotiations from approved, legal-reviewed templates',
      priority: 'critical',
      suggestedTools: ['DocuSign CLM', 'PandaDoc', 'Ironclad', 'Juro'],
    },
    {
      category: 'processing',
      description: 'Redline and markup tracking',
      reason: 'Track changes between contract versions for negotiation clarity',
      priority: 'critical',
      suggestedTools: ['Microsoft Word Track Changes', 'Google Docs Suggestions', 'DocuSign CLM'],
    },
    {
      category: 'processing',
      description: 'Legal review workflow',
      reason: 'Non-standard terms require legal approval to manage risk',
      priority: 'critical',
      suggestedTools: ['Ironclad', 'Juro', 'Custom Legal Review Process'],
    },
    {
      category: 'processing',
      description: 'Version control and audit trail',
      reason: 'Maintain complete history of all contract iterations',
      priority: 'important',
      suggestedTools: ['DocuSign CLM', 'Agiloft', 'Google Drive Versioning'],
    },
    {
      category: 'output',
      description: 'E-signature platform integration',
      reason: 'Digital signatures accelerate closing and provide legal validity',
      priority: 'critical',
      suggestedTools: ['DocuSign', 'PandaDoc', 'Adobe Sign', 'HelloSign'],
    },
    {
      category: 'output',
      description: 'Executed contract archive',
      reason: 'Secure storage for compliance and future reference',
      priority: 'important',
      suggestedTools: ['Google Drive', 'SharePoint', 'Box', 'DocuSign Repository'],
    },
  ],

  deal_closing: [
    {
      category: 'input',
      description: 'Signed contract verification',
      reason: 'Confirm all required signatures before processing',
      priority: 'critical',
      suggestedTools: ['DocuSign', 'PandaDoc', 'Adobe Sign'],
    },
    {
      category: 'processing',
      description: 'CRM opportunity status update',
      reason: 'Accurate pipeline tracking and reporting',
      priority: 'critical',
      suggestedTools: ['Zoho CRM', 'HubSpot', 'Salesforce'],
    },
    {
      category: 'output',
      description: 'Billing and invoicing trigger',
      reason: 'Initiate revenue recognition and payment collection',
      priority: 'critical',
      suggestedTools: ['Zoho Invoice', 'QuickBooks', 'Chargebee', 'Stripe'],
    },
    {
      category: 'output',
      description: 'Customer onboarding initiation',
      reason: 'Seamless transition from sale to implementation',
      priority: 'critical',
      suggestedTools: ['Intercom', 'Customer.io', 'Gainsight', 'ChurnZero'],
    },
    {
      category: 'notification',
      description: 'Customer success team notification',
      reason: 'CS team needs to prepare for new customer',
      priority: 'important',
      suggestedTools: ['Slack', 'Email', 'Microsoft Teams'],
    },
    {
      category: 'processing',
      description: 'Commission calculation trigger',
      reason: 'Calculate and record sales rep compensation',
      priority: 'important',
      suggestedTools: ['CaptivateIQ', 'Spiff', 'Xactly', 'Custom Calculation'],
    },
  ],

  win_loss_analysis: [
    {
      category: 'input',
      description: 'Deal closure event trigger',
      reason: 'Automatically initiate analysis for closed deals',
      priority: 'critical',
      suggestedTools: ['CRM Workflow', 'Zapier', 'n8n'],
    },
    {
      category: 'input',
      description: 'CRM deal data aggregation',
      reason: 'Gather all relevant deal information for analysis',
      priority: 'critical',
      suggestedTools: ['Zoho CRM Reports', 'HubSpot Reports', 'Salesforce Reports'],
    },
    {
      category: 'processing',
      description: 'Customer interview scheduling',
      reason: 'Direct feedback from customers improves analysis accuracy',
      priority: 'important',
      suggestedTools: ['Calendly', 'Clozd', 'Primary Intelligence'],
    },
    {
      category: 'processing',
      description: 'Competitor intelligence analysis',
      reason: 'Understand competitive dynamics in won/lost deals',
      priority: 'important',
      suggestedTools: ['Gong', 'Klue', 'Crayon', 'Manual Analysis'],
    },
    {
      category: 'output',
      description: 'Insights report generation',
      reason: 'Actionable insights for sales team improvement',
      priority: 'critical',
      suggestedTools: ['Clozd', 'Google Sheets', 'Power BI', 'Tableau'],
    },
    {
      category: 'notification',
      description: 'Stakeholder distribution',
      reason: 'Share learnings with sales leadership and team',
      priority: 'important',
      suggestedTools: ['Email', 'Slack', 'Notion'],
    },
  ],

  account_handoff: [
    {
      category: 'input',
      description: 'Handoff trigger (closed-won status)',
      reason: 'Automatic initiation ensures no deals fall through cracks',
      priority: 'critical',
      suggestedTools: ['CRM Workflow', 'Zapier', 'n8n'],
    },
    {
      category: 'processing',
      description: 'Deal context compilation',
      reason: 'CS team needs full history to serve customer effectively',
      priority: 'critical',
      suggestedTools: ['CRM Notes', 'Gong Call Recordings', 'Email History'],
    },
    {
      category: 'processing',
      description: 'Handoff meeting scheduling',
      reason: 'Live meeting ensures smooth knowledge transfer',
      priority: 'important',
      suggestedTools: ['Calendly', 'Google Calendar', 'Microsoft Outlook'],
    },
    {
      category: 'output',
      description: 'CRM ownership transfer',
      reason: 'Clear ownership prevents confusion and dropped balls',
      priority: 'critical',
      suggestedTools: ['Zoho CRM', 'HubSpot', 'Salesforce'],
    },
    {
      category: 'output',
      description: 'Welcome package delivery',
      reason: 'Professional onboarding experience improves satisfaction',
      priority: 'important',
      suggestedTools: ['Customer.io', 'Intercom', 'Email Sequences'],
    },
    {
      category: 'notification',
      description: 'All stakeholder notification',
      reason: 'Everyone needs to know the account is officially transitioned',
      priority: 'important',
      suggestedTools: ['Slack', 'Email', 'Microsoft Teams'],
    },
  ],

  upsell_identification: [
    {
      category: 'input',
      description: 'Product usage data integration',
      reason: 'Usage patterns indicate upsell readiness',
      priority: 'critical',
      suggestedTools: ['Mixpanel', 'Amplitude', 'Pendo', 'Gainsight'],
    },
    {
      category: 'processing',
      description: 'Expansion signal analysis',
      reason: 'Identify patterns that precede successful upsells',
      priority: 'critical',
      suggestedTools: ['Gainsight', 'ChurnZero', 'Totango'],
    },
    {
      category: 'processing',
      description: 'Upsell readiness scoring',
      reason: 'Prioritize opportunities most likely to close',
      priority: 'important',
      suggestedTools: ['Custom Scoring Model', 'Gainsight Scorecards'],
    },
    {
      category: 'output',
      description: 'CRM opportunity creation',
      reason: 'Track expansion pipeline separately from new business',
      priority: 'critical',
      suggestedTools: ['Zoho CRM', 'HubSpot', 'Salesforce'],
    },
    {
      category: 'notification',
      description: 'Account owner notification',
      reason: 'Alert owner when expansion opportunity identified',
      priority: 'important',
      suggestedTools: ['Slack', 'Email', 'In-app Notification'],
    },
  ],

  renewal_reminder: [
    {
      category: 'input',
      description: 'Contract expiration tracking',
      reason: 'Know when renewals are due to proactively engage',
      priority: 'critical',
      suggestedTools: ['CRM Custom Fields', 'Chargebee', 'Recurly'],
    },
    {
      category: 'processing',
      description: 'Account health assessment',
      reason: 'Health score informs renewal strategy',
      priority: 'critical',
      suggestedTools: ['Gainsight', 'ChurnZero', 'Totango', 'Custom Health Score'],
    },
    {
      category: 'processing',
      description: 'Renewal strategy determination',
      reason: 'Healthy vs at-risk accounts need different approaches',
      priority: 'important',
      suggestedTools: ['Playbook automation', 'Manual assessment'],
    },
    {
      category: 'notification',
      description: 'Internal renewal alerts (90/60/30 days)',
      reason: 'Multiple touchpoints ensure nothing slips',
      priority: 'critical',
      suggestedTools: ['CRM Workflows', 'Slack', 'Email'],
    },
    {
      category: 'output',
      description: 'Renewal proposal generation',
      reason: 'Professional renewal offers with any price increases/changes',
      priority: 'important',
      suggestedTools: ['PandaDoc', 'HubSpot Quotes', 'Custom Templates'],
    },
  ],

  churn_prevention: [
    {
      category: 'input',
      description: 'Customer health signal monitoring',
      reason: 'Early detection enables intervention before churn',
      priority: 'critical',
      suggestedTools: ['Gainsight', 'ChurnZero', 'Mixpanel', 'Amplitude'],
    },
    {
      category: 'processing',
      description: 'Churn risk score calculation',
      reason: 'Quantify risk level for prioritization',
      priority: 'critical',
      suggestedTools: ['Gainsight', 'ChurnZero', 'Custom ML Model'],
    },
    {
      category: 'processing',
      description: 'Risk factor identification',
      reason: 'Understand why account is at risk to address root cause',
      priority: 'important',
      suggestedTools: ['Health Score Components', 'Support Ticket Analysis'],
    },
    {
      category: 'processing',
      description: 'Save playbook execution',
      reason: 'Standardized intervention improves save rate',
      priority: 'critical',
      suggestedTools: ['Gainsight Playbooks', 'Custom Workflow'],
    },
    {
      category: 'notification',
      description: 'Executive escalation for high-value accounts',
      reason: 'Major accounts warrant executive attention',
      priority: 'important',
      suggestedTools: ['Slack', 'Email', 'PagerDuty'],
    },
  ],

  reference_request: [
    {
      category: 'input',
      description: 'Reference request intake',
      reason: 'Structured intake ensures matching criteria captured',
      priority: 'critical',
      suggestedTools: ['Slack Form', 'Typeform', 'Custom Request Form'],
    },
    {
      category: 'processing',
      description: 'Reference customer matching',
      reason: 'Industry, size, use case match improves effectiveness',
      priority: 'critical',
      suggestedTools: ['ReferenceEdge', 'Custom Database Query'],
    },
    {
      category: 'processing',
      description: 'Reference availability check',
      reason: 'Track usage limits to prevent reference fatigue',
      priority: 'important',
      suggestedTools: ['Reference Database', 'Spreadsheet Tracking'],
    },
    {
      category: 'output',
      description: 'Reference call scheduling',
      reason: 'Easy scheduling increases completion rate',
      priority: 'important',
      suggestedTools: ['Calendly', 'Google Calendar', 'Microsoft Outlook'],
    },
    {
      category: 'notification',
      description: 'Thank you and reward workflow',
      reason: 'Appreciation maintains reference willingness',
      priority: 'optional',
      suggestedTools: ['Email', 'Gift Platform (Sendoso, Postal)'],
    },
  ],

  quote_approval: [
    {
      category: 'input',
      description: 'Quote submission interface',
      reason: 'Structured submission ensures all data captured',
      priority: 'critical',
      suggestedTools: ['CRM Quote Module', 'Slack Workflow', 'Custom Form'],
    },
    {
      category: 'processing',
      description: 'Pricing validation rules',
      reason: 'Automatic validation catches errors before approval',
      priority: 'important',
      suggestedTools: ['CPQ', 'Custom Validation Rules'],
    },
    {
      category: 'processing',
      description: 'Dynamic approval routing',
      reason: 'Different discount levels require different approvers',
      priority: 'critical',
      suggestedTools: ['Salesforce Approval Process', 'HubSpot Workflows', 'Custom Routing'],
    },
    {
      category: 'processing',
      description: 'SLA tracking and escalation',
      reason: 'Prevent deals from stalling in approval queue',
      priority: 'important',
      suggestedTools: ['Workflow Automation', 'Slack Reminders'],
    },
    {
      category: 'notification',
      description: 'Approval status notifications',
      reason: 'Keep requestor informed throughout process',
      priority: 'important',
      suggestedTools: ['Slack', 'Email', 'In-app Notifications'],
    },
  ],

  territory_assignment: [
    {
      category: 'input',
      description: 'New lead/account intake',
      reason: 'All new records need territory assignment',
      priority: 'critical',
      suggestedTools: ['CRM Lead/Account Creation', 'Web Forms', 'API Integration'],
    },
    {
      category: 'processing',
      description: 'Territory rule application',
      reason: 'Consistent rules ensure fair, predictable assignment',
      priority: 'critical',
      suggestedTools: ['LeanData', 'Salesforce Territory Management', 'Custom Rules'],
    },
    {
      category: 'processing',
      description: 'Rep capacity check',
      reason: 'Prevent overloading top performers',
      priority: 'important',
      suggestedTools: ['CRM Dashboard', 'Custom Capacity Tracking'],
    },
    {
      category: 'output',
      description: 'CRM ownership update',
      reason: 'Clear ownership enables accountability',
      priority: 'critical',
      suggestedTools: ['Zoho CRM', 'HubSpot', 'Salesforce'],
    },
    {
      category: 'notification',
      description: 'Assignment notification to rep',
      reason: 'Immediate notification enables fast response',
      priority: 'critical',
      suggestedTools: ['Slack', 'Email', 'Mobile Push'],
    },
  ],

  commission_tracking: [
    {
      category: 'input',
      description: 'Deal closure data integration',
      reason: 'Commission calculation starts with closed deal data',
      priority: 'critical',
      suggestedTools: ['CRM Opportunity Data', 'Contract Value'],
    },
    {
      category: 'processing',
      description: 'Attribution and credit rules',
      reason: 'Clear rules prevent disputes over credit',
      priority: 'critical',
      suggestedTools: ['CaptivateIQ', 'Spiff', 'Xactly', 'Custom Rules'],
    },
    {
      category: 'processing',
      description: 'Commission calculation engine',
      reason: 'Accurate, consistent calculation builds trust',
      priority: 'critical',
      suggestedTools: ['CaptivateIQ', 'Spiff', 'Xactly', 'Spreadsheet'],
    },
    {
      category: 'processing',
      description: 'Split commission handling',
      reason: 'Multi-rep deals need fair split logic',
      priority: 'important',
      suggestedTools: ['Commission Platform', 'Custom Logic'],
    },
    {
      category: 'output',
      description: 'Commission ledger update',
      reason: 'Running record of earned commissions',
      priority: 'critical',
      suggestedTools: ['CaptivateIQ', 'Spiff', 'Spreadsheet'],
    },
    {
      category: 'notification',
      description: 'Rep commission notification',
      reason: 'Transparency on earnings motivates performance',
      priority: 'important',
      suggestedTools: ['Email', 'Slack', 'Commission Portal'],
    },
  ],
};

// ============================================================================
// SALES TOOL RECOMMENDATIONS
// ============================================================================

export const SALES_TOOL_RECOMMENDATIONS: Record<string, ToolRecommendation[]> = {
  // CRM Systems
  crm: [
    {
      toolSlug: 'ZOHO_CRM',
      toolName: 'Zoho CRM',
      score: 95,
      reasons: [
        'Popular in MENA region with Arabic interface',
        'Affordable for SMEs',
        'Comprehensive feature set',
        'WhatsApp integration available',
      ],
      regionalFit: 95,
      alternatives: [
        {
          toolSlug: 'HUBSPOT_CRM',
          toolName: 'HubSpot CRM',
          reason: 'Better marketing automation integration',
          tradeoff: 'Higher cost at scale, limited Arabic support',
        },
        {
          toolSlug: 'SALESFORCE',
          toolName: 'Salesforce',
          reason: 'Enterprise-grade features and ecosystem',
          tradeoff: 'Complex implementation, higher cost',
        },
      ],
    },
    {
      toolSlug: 'HUBSPOT_CRM',
      toolName: 'HubSpot CRM',
      score: 92,
      reasons: [
        'Free tier available for startups',
        'Excellent marketing and sales alignment',
        'Modern, intuitive interface',
        'Strong integration ecosystem',
      ],
      regionalFit: 85,
      alternatives: [],
    },
    {
      toolSlug: 'SALESFORCE',
      toolName: 'Salesforce',
      score: 90,
      reasons: [
        'Industry leader with largest ecosystem',
        'Highly customizable',
        'Enterprise-grade security',
        'Strong MENA presence',
      ],
      regionalFit: 85,
      alternatives: [],
    },
    {
      toolSlug: 'PIPEDRIVE',
      toolName: 'Pipedrive',
      score: 88,
      reasons: [
        'Simple, visual pipeline management',
        'Great for small sales teams',
        'Easy to implement',
        'Mobile-friendly',
      ],
      regionalFit: 80,
      alternatives: [],
    },
  ],

  // Scheduling Tools
  scheduling: [
    {
      toolSlug: 'CALENDLY',
      toolName: 'Calendly',
      score: 96,
      reasons: [
        'Industry-leading scheduling tool',
        'Multiple calendar integrations',
        'Round-robin team scheduling',
        'Timezone auto-detection',
      ],
      regionalFit: 90,
      alternatives: [
        {
          toolSlug: 'CAL_COM',
          toolName: 'Cal.com',
          reason: 'Open-source alternative with similar features',
          tradeoff: 'Smaller ecosystem, less polished',
        },
      ],
    },
    {
      toolSlug: 'CAL_COM',
      toolName: 'Cal.com',
      score: 88,
      reasons: [
        'Open-source and self-hostable',
        'Similar features to Calendly',
        'Lower cost',
        'Privacy-focused',
      ],
      regionalFit: 85,
      alternatives: [],
    },
    {
      toolSlug: 'CHILIPIPER',
      toolName: 'Chilipiper',
      score: 92,
      reasons: [
        'Instant scheduling from forms',
        'Advanced routing rules',
        'CRM integration',
        'Concierge scheduling',
      ],
      regionalFit: 80,
      alternatives: [],
    },
  ],

  // Proposal & Contract Tools
  proposal_contract: [
    {
      toolSlug: 'PANDADOC',
      toolName: 'PandaDoc',
      score: 95,
      reasons: [
        'Proposals and contracts in one platform',
        'Built-in e-signature',
        'Document analytics',
        'CRM integrations',
      ],
      regionalFit: 90,
      alternatives: [
        {
          toolSlug: 'PROPOSIFY',
          toolName: 'Proposify',
          reason: 'Better design templates',
          tradeoff: 'Less robust contract features',
        },
      ],
    },
    {
      toolSlug: 'DOCUSIGN',
      toolName: 'DocuSign',
      score: 94,
      reasons: [
        'Industry-leading e-signature',
        'Strong legal validity globally',
        'Excellent security',
        'Wide integration ecosystem',
      ],
      regionalFit: 90,
      alternatives: [],
    },
    {
      toolSlug: 'PROPOSIFY',
      toolName: 'Proposify',
      score: 88,
      reasons: [
        'Beautiful proposal templates',
        'Content library',
        'Proposal metrics',
        'Team collaboration',
      ],
      regionalFit: 85,
      alternatives: [],
    },
    {
      toolSlug: 'QWILR',
      toolName: 'Qwilr',
      score: 86,
      reasons: [
        'Interactive web-based proposals',
        'Modern design',
        'Engagement tracking',
        'Easy to use',
      ],
      regionalFit: 80,
      alternatives: [],
    },
  ],

  // Call Recording & Intelligence
  call_intelligence: [
    {
      toolSlug: 'GONG',
      toolName: 'Gong',
      score: 96,
      reasons: [
        'Best-in-class conversation intelligence',
        'AI-powered insights',
        'Deal risk analysis',
        'Coaching recommendations',
      ],
      regionalFit: 80,
      alternatives: [
        {
          toolSlug: 'CHORUS',
          toolName: 'Chorus',
          reason: 'Similar features, part of ZoomInfo',
          tradeoff: 'Less mature AI features',
        },
      ],
    },
    {
      toolSlug: 'CHORUS',
      toolName: 'Chorus.ai',
      score: 90,
      reasons: [
        'Conversation intelligence',
        'Integrated with ZoomInfo',
        'Deal analysis',
        'Team coaching',
      ],
      regionalFit: 78,
      alternatives: [],
    },
    {
      toolSlug: 'FIREFLIES',
      toolName: 'Fireflies.ai',
      score: 88,
      reasons: [
        'Affordable meeting transcription',
        'Auto-joins meetings',
        'Arabic language support',
        'AI summaries',
      ],
      regionalFit: 85,
      alternatives: [],
    },
  ],

  // Lead Enrichment
  lead_enrichment: [
    {
      toolSlug: 'APOLLO',
      toolName: 'Apollo.io',
      score: 94,
      reasons: [
        'Large contact database',
        'Email finding and verification',
        'Sequence automation',
        'Affordable pricing',
      ],
      regionalFit: 80,
      alternatives: [],
    },
    {
      toolSlug: 'ZOOMINFO',
      toolName: 'ZoomInfo',
      score: 92,
      reasons: [
        'Largest B2B database',
        'Intent data',
        'Technographic data',
        'Enterprise features',
      ],
      regionalFit: 75,
      alternatives: [],
    },
    {
      toolSlug: 'CLEARBIT',
      toolName: 'Clearbit',
      score: 90,
      reasons: [
        'Real-time enrichment API',
        'Company and person data',
        'HubSpot native integration',
        'Data quality',
      ],
      regionalFit: 75,
      alternatives: [],
    },
    {
      toolSlug: 'LINKEDIN_SALES_NAV',
      toolName: 'LinkedIn Sales Navigator',
      score: 93,
      reasons: [
        'Access to LinkedIn network',
        'InMail capabilities',
        'Lead and account alerts',
        'CRM integrations',
      ],
      regionalFit: 88,
      alternatives: [],
    },
  ],

  // Commission & Incentive
  commission: [
    {
      toolSlug: 'CAPTIVATEIQ',
      toolName: 'CaptivateIQ',
      score: 94,
      reasons: [
        'Flexible commission plans',
        'Real-time visibility',
        'Dispute resolution',
        'Modern interface',
      ],
      regionalFit: 80,
      alternatives: [],
    },
    {
      toolSlug: 'SPIFF',
      toolName: 'Spiff',
      score: 92,
      reasons: [
        'Automated commission tracking',
        'Rep-facing dashboards',
        'Salesforce integration',
        'ASC 606 compliance',
      ],
      regionalFit: 78,
      alternatives: [],
    },
    {
      toolSlug: 'XACTLY',
      toolName: 'Xactly',
      score: 90,
      reasons: [
        'Enterprise commission management',
        'Planning and forecasting',
        'Benchmarking data',
        'Long track record',
      ],
      regionalFit: 75,
      alternatives: [],
    },
  ],

  // Customer Success / Churn Prevention
  customer_success: [
    {
      toolSlug: 'GAINSIGHT',
      toolName: 'Gainsight',
      score: 95,
      reasons: [
        'Leading CS platform',
        'Health scoring',
        'Playbook automation',
        'Customer journey mapping',
      ],
      regionalFit: 80,
      alternatives: [],
    },
    {
      toolSlug: 'CHURNZERO',
      toolName: 'ChurnZero',
      score: 92,
      reasons: [
        'Real-time health scores',
        'In-app engagement',
        'Automated playbooks',
        'SME-friendly',
      ],
      regionalFit: 82,
      alternatives: [],
    },
    {
      toolSlug: 'TOTANGO',
      toolName: 'Totango',
      score: 88,
      reasons: [
        'Customer data platform',
        'Health monitoring',
        'Journey orchestration',
        'Good value',
      ],
      regionalFit: 78,
      alternatives: [],
    },
  ],

  // Communication - Kuwait Focus
  communication_kuwait: [
    {
      toolSlug: 'WHATSAPP_BUSINESS',
      toolName: 'WhatsApp Business API',
      score: 98,
      reasons: [
        'Primary communication channel in Kuwait',
        'Business verified accounts',
        'Automated messaging',
        'High open rates (98%+)',
      ],
      regionalFit: 100,
      alternatives: [],
    },
    {
      toolSlug: 'SLACK',
      toolName: 'Slack',
      score: 90,
      reasons: [
        'Team collaboration',
        'Workflow automation',
        'Integration hub',
        'Real-time communication',
      ],
      regionalFit: 85,
      alternatives: [],
    },
    {
      toolSlug: 'MICROSOFT_TEAMS',
      toolName: 'Microsoft Teams',
      score: 88,
      reasons: [
        'Enterprise collaboration',
        'Office 365 integration',
        'Video conferencing',
        'Common in large Kuwait companies',
      ],
      regionalFit: 85,
      alternatives: [],
    },
  ],
};

// ============================================================================
// KUWAIT / REGIONAL CONTEXT
// ============================================================================

export const SALES_REGIONAL_CONTEXT: Record<string, SalesRegionalContext> = {
  kuwait: {
    region: 'Kuwait',
    currency: 'KWD',
    currencySymbol: 'KWD',
    commonCRMs: ['Zoho CRM', 'HubSpot', 'Salesforce'],
    paymentTerms: 'Net 30-60 common',
    businessHours: '8:00-17:00 Sun-Thu',
    communicationPreference: 'WhatsApp Business primary',
    contractLanguage: 'Arabic and English dual-language common',
    salesCycle: 'Typically 2-6 months for B2B',
    typicalDealSize: 'SME: 1,000-50,000 KWD, Enterprise: 50,000+ KWD',
    preferredChannels: ['WhatsApp', 'Email', 'Phone', 'In-person'],
  },
  uae: {
    region: 'United Arab Emirates',
    currency: 'AED',
    currencySymbol: 'AED',
    commonCRMs: ['Salesforce', 'HubSpot', 'Zoho CRM'],
    paymentTerms: 'Net 30-45 common',
    businessHours: '9:00-18:00 Mon-Fri',
    communicationPreference: 'Email and WhatsApp',
    contractLanguage: 'English primary, Arabic for government',
    salesCycle: 'Typically 1-4 months for B2B',
    typicalDealSize: 'SME: 5,000-200,000 AED, Enterprise: 200,000+ AED',
    preferredChannels: ['Email', 'WhatsApp', 'LinkedIn', 'Phone'],
  },
  saudi: {
    region: 'Saudi Arabia',
    currency: 'SAR',
    currencySymbol: 'SAR',
    commonCRMs: ['Salesforce', 'Microsoft Dynamics', 'Zoho CRM'],
    paymentTerms: 'Net 30-90 (government can be longer)',
    businessHours: '8:00-17:00 Sun-Thu',
    communicationPreference: 'WhatsApp and phone',
    contractLanguage: 'Arabic required for government contracts',
    salesCycle: 'Typically 3-9 months for B2B',
    typicalDealSize: 'SME: 10,000-500,000 SAR, Enterprise: 500,000+ SAR',
    preferredChannels: ['WhatsApp', 'Phone', 'In-person', 'Email'],
  },
};

// ============================================================================
// COMMISSION CALCULATION
// ============================================================================

/**
 * Calculate sales commission based on deal value and rate
 *
 * Supports:
 * - Flat rate commission
 * - Tiered commission with accelerators
 * - Bonus thresholds
 */
export function calculateCommission(
  dealValue: number,
  commissionRate: number,
  options?: {
    currency?: string;
    bonusThreshold?: number;
    bonusRate?: number;
    tierRates?: { threshold: number; rate: number }[];
  }
): CommissionCalculation {
  const currency = options?.currency || 'KWD';
  let baseCommission = 0;
  let bonusAmount = 0;
  let formula = '';
  const notes: string[] = [];

  // Check for tiered commission
  if (options?.tierRates && options.tierRates.length > 0) {
    // Sort tiers by threshold ascending
    const sortedTiers = [...options.tierRates].sort((a, b) => a.threshold - b.threshold);
    let remainingValue = dealValue;
    let previousThreshold = 0;

    for (const tier of sortedTiers) {
      if (remainingValue <= 0) break;

      const tierAmount = Math.min(remainingValue, tier.threshold - previousThreshold);
      const tierCommission = tierAmount * (tier.rate / 100);
      baseCommission += tierCommission;
      remainingValue -= tierAmount;
      previousThreshold = tier.threshold;

      notes.push(`Tier up to ${tier.threshold} ${currency}: ${tierAmount} x ${tier.rate}% = ${tierCommission.toFixed(3)} ${currency}`);
    }

    // Apply remaining at highest tier rate
    if (remainingValue > 0) {
      const highestRate = sortedTiers[sortedTiers.length - 1].rate;
      const additionalCommission = remainingValue * (highestRate / 100);
      baseCommission += additionalCommission;
      notes.push(`Above ${sortedTiers[sortedTiers.length - 1].threshold} ${currency}: ${remainingValue} x ${highestRate}% = ${additionalCommission.toFixed(3)} ${currency}`);
    }

    formula = 'Tiered commission calculation';
  } else {
    // Flat rate commission
    baseCommission = dealValue * (commissionRate / 100);
    formula = `${dealValue} x ${commissionRate}% = ${baseCommission.toFixed(3)} ${currency}`;
  }

  // Check for bonus threshold
  if (options?.bonusThreshold && dealValue >= options.bonusThreshold && options?.bonusRate) {
    bonusAmount = dealValue * (options.bonusRate / 100);
    notes.push(`Bonus threshold met (${options.bonusThreshold} ${currency}): Additional ${options.bonusRate}% = ${bonusAmount.toFixed(3)} ${currency}`);
  }

  const totalCommission = baseCommission + bonusAmount;

  return {
    dealValue,
    commissionRate,
    baseCommission: Math.round(baseCommission * 1000) / 1000,
    bonusThreshold: options?.bonusThreshold,
    bonusAmount: Math.round(bonusAmount * 1000) / 1000,
    totalCommission: Math.round(totalCommission * 1000) / 1000,
    currency,
    formula,
    notes,
  };
}

/**
 * Calculate lead score based on multiple factors
 */
export function calculateLeadScore(factors: {
  companySize?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  budgetConfirmed?: boolean;
  decisionMaker?: boolean;
  timeline?: 'immediate' | 'short' | 'medium' | 'long' | 'unknown';
  engagement?: 'high' | 'medium' | 'low';
  industry?: string;
  targetIndustries?: string[];
}): LeadScore {
  const scoredFactors: LeadScoreFactor[] = [];
  let totalScore = 0;
  const maxScore = 100;

  // Company Size (20 points max)
  const sizeScores: Record<string, number> = {
    enterprise: 20,
    large: 18,
    medium: 15,
    small: 10,
    startup: 5,
  };
  if (factors.companySize) {
    const score = sizeScores[factors.companySize] || 5;
    scoredFactors.push({
      name: 'Company Size',
      weight: 20,
      score,
      maxScore: 20,
      reason: `${factors.companySize} company`,
    });
    totalScore += score;
  }

  // Budget Confirmed (25 points max)
  if (factors.budgetConfirmed !== undefined) {
    const score = factors.budgetConfirmed ? 25 : 5;
    scoredFactors.push({
      name: 'Budget',
      weight: 25,
      score,
      maxScore: 25,
      reason: factors.budgetConfirmed ? 'Budget confirmed' : 'Budget not confirmed',
    });
    totalScore += score;
  }

  // Decision Maker (20 points max)
  if (factors.decisionMaker !== undefined) {
    const score = factors.decisionMaker ? 20 : 5;
    scoredFactors.push({
      name: 'Authority',
      weight: 20,
      score,
      maxScore: 20,
      reason: factors.decisionMaker ? 'Decision maker' : 'Not decision maker',
    });
    totalScore += score;
  }

  // Timeline (20 points max)
  const timelineScores: Record<string, number> = {
    immediate: 20,
    short: 16,
    medium: 12,
    long: 6,
    unknown: 3,
  };
  if (factors.timeline) {
    const score = timelineScores[factors.timeline] || 3;
    scoredFactors.push({
      name: 'Timeline',
      weight: 20,
      score,
      maxScore: 20,
      reason: `${factors.timeline} timeline`,
    });
    totalScore += score;
  }

  // Engagement (15 points max)
  const engagementScores: Record<string, number> = {
    high: 15,
    medium: 10,
    low: 3,
  };
  if (factors.engagement) {
    const score = engagementScores[factors.engagement] || 3;
    scoredFactors.push({
      name: 'Engagement',
      weight: 15,
      score,
      maxScore: 15,
      reason: `${factors.engagement} engagement level`,
    });
    totalScore += score;
  }

  const percentage = Math.round((totalScore / maxScore) * 100);

  let recommendation = '';
  let nextBestAction = '';

  if (percentage >= 80) {
    recommendation = 'Hot Lead - Prioritize immediately';
    nextBestAction = 'Schedule demo call within 24 hours';
  } else if (percentage >= 60) {
    recommendation = 'Warm Lead - Strong potential';
    nextBestAction = 'Send personalized follow-up and qualifying questions';
  } else if (percentage >= 40) {
    recommendation = 'Nurture Lead - Needs development';
    nextBestAction = 'Add to nurture sequence with educational content';
  } else {
    recommendation = 'Cold Lead - Low priority';
    nextBestAction = 'Add to long-term nurture or disqualify';
  }

  return {
    score: totalScore,
    maxScore,
    percentage,
    factors: scoredFactors,
    recommendation,
    nextBestAction,
  };
}

// ============================================================================
// SALES DOMAIN INTELLIGENCE CLASS
// ============================================================================

export class SalesDomainIntelligence {
  private region: string;
  private regionalContext: SalesRegionalContext | null;

  constructor(region: string = 'kuwait') {
    this.region = region.toLowerCase();
    this.regionalContext = SALES_REGIONAL_CONTEXT[this.region] || null;
  }

  /**
   * Detect sales workflow pattern from user request
   */
  detectSalesPattern(request: string): string | null {
    const normalizedRequest = request.toLowerCase();
    let bestMatch: string | null = null;
    let highestScore = 0;

    for (const [pattern, keywords] of Object.entries(SALES_KEYWORDS)) {
      const score = keywords.filter(kw =>
        normalizedRequest.includes(kw.toLowerCase())
      ).length;

      if (score > highestScore) {
        highestScore = score;
        bestMatch = pattern;
      }
    }

    // Require at least 1 keyword match for sales patterns
    return highestScore >= 1 ? bestMatch : null;
  }

  /**
   * Get implicit requirements for a sales pattern
   */
  getImplicitRequirements(pattern: string): ImplicitRequirement[] {
    const requirements = [...(SALES_IMPLICIT_REQUIREMENTS[pattern] || [])];

    // Add regional requirements
    if (this.regionalContext && pattern) {
      const patternDef = SALES_WORKFLOW_PATTERNS[pattern];
      if (patternDef?.salesStageRequirements) {
        patternDef.salesStageRequirements.forEach((req, index) => {
          requirements.push({
            category: 'processing',
            description: req,
            reason: `Sales best practice for ${this.regionalContext!.region}`,
            priority: index === 0 ? 'critical' : 'important',
            suggestedTools: ['CRM', 'Analytics Platform'],
          });
        });
      }
    }

    // Add Kuwait-specific requirements
    if (this.region === 'kuwait') {
      requirements.push({
        category: 'notification',
        description: 'WhatsApp Business integration',
        reason: 'WhatsApp is the primary business communication channel in Kuwait',
        priority: 'critical',
        suggestedTools: ['WhatsApp Business API', 'Twilio', 'MessageBird'],
      });
    }

    return requirements;
  }

  /**
   * Get tool recommendations for a sales pattern
   */
  getToolRecommendations(pattern: string, region?: string): ToolRecommendation[] {
    const effectiveRegion = region || this.region;
    const recommendations: ToolRecommendation[] = [];

    // Map pattern to tool category
    const categoryMapping: Record<string, string[]> = {
      lead_capture: ['crm', 'lead_enrichment', 'communication_kuwait'],
      lead_qualification: ['crm', 'lead_enrichment', 'call_intelligence'],
      demo_scheduling: ['scheduling', 'crm', 'communication_kuwait'],
      proposal_generation: ['proposal_contract', 'crm'],
      contract_negotiation: ['proposal_contract', 'crm'],
      deal_closing: ['proposal_contract', 'crm', 'commission'],
      win_loss_analysis: ['crm', 'call_intelligence'],
      account_handoff: ['crm', 'customer_success', 'communication_kuwait'],
      upsell_identification: ['customer_success', 'crm'],
      renewal_reminder: ['crm', 'customer_success', 'communication_kuwait'],
      churn_prevention: ['customer_success', 'crm'],
      reference_request: ['crm', 'communication_kuwait'],
      quote_approval: ['proposal_contract', 'crm'],
      territory_assignment: ['crm'],
      commission_tracking: ['commission', 'crm'],
    };

    const categories = categoryMapping[pattern] || ['crm'];

    // Get tools from each category
    categories.forEach(category => {
      const categoryTools = SALES_TOOL_RECOMMENDATIONS[category] || [];
      recommendations.push(...categoryTools);
    });

    // Always add Kuwait communication tools if region is Kuwait
    if (effectiveRegion === 'kuwait' && !categories.includes('communication_kuwait')) {
      const kuwaitTools = SALES_TOOL_RECOMMENDATIONS.communication_kuwait || [];
      recommendations.push(...kuwaitTools);
    }

    // Sort by score and regional fit
    return recommendations
      .sort((a, b) => {
        const scoreA = a.score * (effectiveRegion === 'kuwait' ? a.regionalFit / 100 : 1);
        const scoreB = b.score * (effectiveRegion === 'kuwait' ? b.regionalFit / 100 : 1);
        return scoreB - scoreA;
      })
      .slice(0, 12); // Return top 12
  }

  /**
   * Get clarifying questions for a sales pattern
   */
  getClarifyingQuestions(pattern: string): ClarifyingQuestion[] {
    const questions: ClarifyingQuestion[] = [];
    const patternDef = SALES_WORKFLOW_PATTERNS[pattern];
    let questionId = 1;

    if (!patternDef) return questions;

    // Pattern-specific questions from the pattern definition
    patternDef.questions.forEach((questionText, index) => {
      questions.push({
        id: `sales_q${questionId++}`,
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
        id: `sales_q${questionId++}`,
        question: 'Should notifications be sent via WhatsApp?',
        category: 'integration',
        options: [
          { value: 'yes', label: 'Yes', description: 'Send via WhatsApp Business (recommended for Kuwait)', implications: ['Requires WhatsApp Business API integration'] },
          { value: 'no', label: 'No', description: 'Use email/Slack only' },
        ],
        required: false,
        relevanceScore: 90,
      });

      questions.push({
        id: `sales_q${questionId++}`,
        question: 'Do contracts need to be in Arabic and English?',
        category: 'format',
        options: [
          { value: 'dual', label: 'Yes - Dual language', description: 'Both Arabic and English versions', implications: ['Will generate dual-language documents'] },
          { value: 'english', label: 'English only', description: 'English is sufficient' },
          { value: 'arabic', label: 'Arabic only', description: 'Arabic primary' },
        ],
        required: false,
        relevanceScore: 85,
      });

      if (pattern === 'lead_capture' || pattern === 'lead_qualification') {
        questions.push({
          id: `sales_q${questionId++}`,
          question: 'What is your target deal size range?',
          category: 'platform',
          options: [
            { value: 'sme', label: 'SME (1,000-50,000 KWD)', description: 'Small to medium deals' },
            { value: 'enterprise', label: 'Enterprise (50,000+ KWD)', description: 'Large enterprise deals' },
            { value: 'mixed', label: 'Mixed', description: 'Both SME and enterprise' },
          ],
          required: false,
          relevanceScore: 80,
        });
      }
    }

    return questions;
  }

  /**
   * Get the workflow chain for a sales pattern
   */
  getWorkflowChain(pattern: string): WorkflowChainStep[] {
    const patternDef = SALES_WORKFLOW_PATTERNS[pattern];
    if (!patternDef) return [];

    const chain: WorkflowChainStep[] = [];

    patternDef.steps.forEach((stepName, index) => {
      const layer = patternDef.layers[Math.min(index, patternDef.layers.length - 1)];
      const implicitReq = SALES_IMPLICIT_REQUIREMENTS[pattern]?.[index];

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
   * Get regional context for sales operations
   */
  getRegionalContext(): SalesRegionalContext | null {
    return this.regionalContext;
  }

  /**
   * Calculate commission for a deal
   */
  calculateCommission(
    dealValue: number,
    rate: number,
    options?: Parameters<typeof calculateCommission>[2]
  ): CommissionCalculation {
    const currency = this.regionalContext?.currency || 'KWD';
    return calculateCommission(dealValue, rate, { ...options, currency });
  }

  /**
   * Calculate lead score
   */
  calculateLeadScore(factors: Parameters<typeof calculateLeadScore>[0]): LeadScore {
    return calculateLeadScore(factors);
  }

  /**
   * Get sales stage recommendations based on pattern
   */
  getSalesStageRecommendations(pattern: string): string[] {
    const recommendations: string[] = [];
    const patternDef = SALES_WORKFLOW_PATTERNS[pattern];

    if (patternDef) {
      recommendations.push(`Stage: ${patternDef.name}`);
      recommendations.push(`Expected ROI: ${patternDef.estimatedROI}`);
      recommendations.push(...patternDef.salesStageRequirements);
    }

    return recommendations;
  }

  /**
   * Get communication preferences for the current region
   */
  getCommunicationPreferences(): string[] {
    return this.regionalContext?.preferredChannels || ['Email', 'Phone'];
  }

  /**
   * Validate deal value for the region
   */
  validateDealValue(amount: number, dealType: 'sme' | 'enterprise' | 'any'): {
    valid: boolean;
    warning?: string;
  } {
    if (!this.regionalContext) {
      return { valid: true };
    }

    const thresholds = {
      kuwait: { smeMin: 100, smeMax: 50000, enterpriseMin: 50000 },
      uae: { smeMin: 500, smeMax: 200000, enterpriseMin: 200000 },
      saudi: { smeMin: 1000, smeMax: 500000, enterpriseMin: 500000 },
    };

    const regionThreshold = thresholds[this.region as keyof typeof thresholds];
    if (!regionThreshold) {
      return { valid: true };
    }

    if (dealType === 'sme' && amount > regionThreshold.smeMax) {
      return {
        valid: true,
        warning: `Deal value ${amount} ${this.regionalContext.currency} exceeds typical SME range. Consider as enterprise deal.`,
      };
    }

    if (dealType === 'enterprise' && amount < regionThreshold.enterpriseMin) {
      return {
        valid: true,
        warning: `Deal value ${amount} ${this.regionalContext.currency} is below typical enterprise threshold.`,
      };
    }

    if (amount < regionThreshold.smeMin) {
      return {
        valid: false,
        warning: `Deal value ${amount} ${this.regionalContext.currency} is unusually low. Please verify.`,
      };
    }

    return { valid: true };
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private categorizeQuestion(questionText: string): ClarifyingQuestion['category'] {
    const text = questionText.toLowerCase();

    if (text.includes('how often') || text.includes('frequency') || text.includes('when should')) {
      return 'frequency';
    }
    if (text.includes('who') || text.includes('team') || text.includes('rep')) {
      return 'audience';
    }
    if (text.includes('format') || text.includes('template') || text.includes('language')) {
      return 'format';
    }
    if (text.includes('platform') || text.includes('software') || text.includes('crm') || text.includes('system')) {
      return 'platform';
    }
    if (text.includes('region') || text.includes('country') || text.includes('currency')) {
      return 'region';
    }

    return 'integration';
  }

  private generateOptionsForQuestion(questionText: string, _pattern: string): QuestionOption[] {
    const text = questionText.toLowerCase();

    // Lead sources
    if (text.includes('lead source') || text.includes('where do leads')) {
      return [
        { value: 'website', label: 'Website Forms', description: 'Website contact/demo forms' },
        { value: 'social', label: 'Social Media', description: 'LinkedIn, Instagram, etc.' },
        { value: 'referral', label: 'Referrals', description: 'Customer and partner referrals' },
        { value: 'outbound', label: 'Outbound', description: 'Cold outreach campaigns' },
        { value: 'events', label: 'Events', description: 'Trade shows, conferences' },
        { value: 'all', label: 'All Sources', description: 'Multiple lead sources' },
      ];
    }

    // CRM system
    if (text.includes('crm') || text.includes('which crm')) {
      return [
        { value: 'zoho', label: 'Zoho CRM', description: 'Zoho CRM (popular in MENA)' },
        { value: 'hubspot', label: 'HubSpot CRM', description: 'HubSpot CRM' },
        { value: 'salesforce', label: 'Salesforce', description: 'Salesforce CRM' },
        { value: 'pipedrive', label: 'Pipedrive', description: 'Pipedrive CRM' },
        { value: 'other', label: 'Other', description: 'Different CRM system' },
        { value: 'none', label: 'No CRM Yet', description: 'Need CRM recommendation' },
      ];
    }

    // Qualification framework
    if (text.includes('qualification') || text.includes('framework')) {
      return [
        { value: 'bant', label: 'BANT', description: 'Budget, Authority, Need, Timeline' },
        { value: 'meddic', label: 'MEDDIC', description: 'Metrics, Economic Buyer, Decision Criteria, etc.' },
        { value: 'champ', label: 'CHAMP', description: 'Challenges, Authority, Money, Prioritization' },
        { value: 'custom', label: 'Custom', description: 'Custom qualification criteria' },
      ];
    }

    // Assignment method
    if (text.includes('assigned') || text.includes('assignment') || text.includes('routing')) {
      return [
        { value: 'round_robin', label: 'Round Robin', description: 'Rotate equally among reps' },
        { value: 'territory', label: 'Territory Based', description: 'Assign by geography/segment' },
        { value: 'performance', label: 'Performance Based', description: 'Weight by rep performance' },
        { value: 'manual', label: 'Manual', description: 'Manager assigns manually' },
      ];
    }

    // Meeting platform
    if (text.includes('meeting') || text.includes('calendar')) {
      return [
        { value: 'google', label: 'Google Calendar', description: 'Google Workspace' },
        { value: 'outlook', label: 'Microsoft Outlook', description: 'Office 365' },
        { value: 'both', label: 'Both', description: 'Support both platforms' },
      ];
    }

    // Communication channel
    if (text.includes('notification') || text.includes('remind') || text.includes('channel')) {
      return [
        { value: 'whatsapp', label: 'WhatsApp', description: 'WhatsApp Business (recommended for Kuwait)' },
        { value: 'email', label: 'Email', description: 'Email notifications' },
        { value: 'slack', label: 'Slack', description: 'Slack messages' },
        { value: 'sms', label: 'SMS', description: 'Text messages' },
        { value: 'all', label: 'Multiple Channels', description: 'Use multiple notification channels' },
      ];
    }

    // E-signature platform
    if (text.includes('signature') || text.includes('sign')) {
      return [
        { value: 'docusign', label: 'DocuSign', description: 'DocuSign e-signature' },
        { value: 'pandadoc', label: 'PandaDoc', description: 'PandaDoc e-signature' },
        { value: 'adobe', label: 'Adobe Sign', description: 'Adobe Acrobat Sign' },
        { value: 'none', label: 'Not Needed', description: 'Physical signatures only' },
      ];
    }

    // Commission structure
    if (text.includes('commission') || text.includes('comp')) {
      return [
        { value: 'flat', label: 'Flat Rate', description: 'Same percentage for all deals' },
        { value: 'tiered', label: 'Tiered', description: 'Rate increases with quota attainment' },
        { value: 'accelerator', label: 'With Accelerators', description: 'Bonus multipliers above quota' },
        { value: 'custom', label: 'Custom', description: 'Custom commission structure' },
      ];
    }

    // Approval levels
    if (text.includes('approval') || text.includes('approve') || text.includes('discount')) {
      return [
        { value: 'manager', label: 'Manager Only', description: 'Sales manager approval' },
        { value: 'tiered', label: 'Tiered by Amount', description: 'Different approvers by discount %' },
        { value: 'executive', label: 'Executive Required', description: 'Executive approval for all' },
        { value: 'none', label: 'No Approval Needed', description: 'Reps have full authority' },
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
      // Lead Capture
      capture_lead_data: 'Capture lead information from source',
      validate_contact_info: 'Validate contact information',
      enrich_lead_data: 'Enrich lead with company/contact data',
      assign_lead_score: 'Calculate and assign lead score',
      create_crm_record: 'Create lead record in CRM',
      notify_sales_rep: 'Notify assigned sales representative',

      // Lead Qualification
      receive_lead: 'Receive lead for qualification',
      gather_qualification_data: 'Gather qualification information',
      apply_qualification_criteria: 'Apply BANT/MEDDIC qualification criteria',
      calculate_priority_score: 'Calculate lead priority score',
      update_lead_status: 'Update lead status in CRM',
      route_to_appropriate_team: 'Route to appropriate sales team',
      notify_assigned_owner: 'Notify assigned owner',

      // Demo Scheduling
      receive_demo_request: 'Receive demo/meeting request',
      check_rep_availability: 'Check sales rep availability',
      handle_timezone_conversion: 'Handle timezone conversion',
      create_calendar_event: 'Create calendar event with meeting link',
      send_confirmation: 'Send confirmation to prospect',
      send_reminder_sequence: 'Send reminder sequence (24h, 1h before)',
      log_in_crm: 'Log meeting activity in CRM',

      // Proposal Generation
      gather_deal_requirements: 'Gather deal requirements and scope',
      select_proposal_template: 'Select appropriate proposal template',
      calculate_pricing: 'Calculate pricing based on requirements',
      apply_discounts_rules: 'Apply discount rules and approval',
      generate_proposal_document: 'Generate branded proposal document',
      route_for_approval: 'Route for internal approval if needed',
      send_to_prospect: 'Send proposal to prospect',
      track_proposal_views: 'Track proposal opens and engagement',

      // Contract Negotiation
      generate_initial_contract: 'Generate initial contract from template',
      send_for_customer_review: 'Send contract for customer review',
      track_redline_changes: 'Track redline and markup changes',
      route_to_legal_review: 'Route to legal for review if needed',
      negotiate_terms: 'Handle term negotiations',
      get_final_approval: 'Get final internal approval',
      send_for_signature: 'Send for electronic signature',
      archive_executed_contract: 'Archive signed contract',

      // Deal Closing
      receive_signed_contract: 'Receive signed contract',
      verify_deal_terms: 'Verify final deal terms',
      update_opportunity_status: 'Update CRM opportunity to closed-won',
      trigger_invoicing: 'Trigger invoicing/billing',
      initiate_onboarding: 'Initiate customer onboarding',
      notify_success_team: 'Notify customer success team',
      update_forecasting: 'Update revenue forecasting',
      calculate_commission: 'Calculate sales commission',

      // Win/Loss Analysis
      trigger_analysis_request: 'Trigger win/loss analysis workflow',
      gather_deal_data: 'Gather all deal data from CRM',
      conduct_customer_interview: 'Schedule customer/prospect interview',
      analyze_competitor_factors: 'Analyze competitive factors',
      identify_patterns: 'Identify win/loss patterns',
      generate_insights_report: 'Generate insights report',
      distribute_to_stakeholders: 'Distribute to sales leadership',
      update_playbook: 'Update sales playbook with learnings',

      // Account Handoff
      trigger_handoff_workflow: 'Trigger account handoff workflow',
      compile_deal_context: 'Compile complete deal context and history',
      schedule_handoff_meeting: 'Schedule sales-to-CS handoff meeting',
      transfer_account_ownership: 'Transfer account ownership in CRM',
      create_customer_profile: 'Create customer success profile',
      send_welcome_package: 'Send customer welcome package',
      notify_all_stakeholders: 'Notify all stakeholders of transition',
      track_handoff_completion: 'Track and verify handoff completion',

      // Upsell Identification
      monitor_usage_patterns: 'Monitor product usage patterns',
      analyze_expansion_signals: 'Analyze expansion readiness signals',
      score_upsell_readiness: 'Score upsell readiness',
      identify_relevant_products: 'Identify relevant upsell products',
      create_upsell_opportunity: 'Create upsell opportunity in CRM',
      notify_account_owner: 'Notify account owner of opportunity',
      generate_proposal_recommendations: 'Generate upsell proposal recommendations',

      // Renewal Reminder
      track_contract_expiration: 'Track contract expiration dates',
      assess_account_health: 'Assess account health score',
      determine_renewal_strategy: 'Determine renewal approach',
      send_internal_alerts: 'Send internal renewal alerts (90/60/30)',
      initiate_renewal_conversation: 'Initiate renewal conversation',
      generate_renewal_proposal: 'Generate renewal proposal',
      track_renewal_progress: 'Track renewal pipeline progress',

      // Churn Prevention
      monitor_health_signals: 'Monitor customer health signals',
      calculate_churn_risk_score: 'Calculate churn risk score',
      identify_risk_factors: 'Identify specific risk factors',
      trigger_intervention_workflow: 'Trigger intervention workflow',
      assign_save_owner: 'Assign account save owner',
      execute_save_playbook: 'Execute save playbook',
      track_intervention_outcome: 'Track intervention outcome',
      update_churn_model: 'Update churn prediction model',

      // Reference Request
      receive_reference_request: 'Receive reference request from sales',
      identify_matching_customers: 'Identify matching reference customers',
      check_reference_availability: 'Check reference availability/limits',
      send_reference_request: 'Send reference request to customer',
      schedule_reference_call: 'Schedule reference call',
      track_reference_completion: 'Track reference completion',
      send_thank_you: 'Send thank you to reference customer',
      update_reference_database: 'Update reference program database',

      // Quote Approval
      submit_quote_for_approval: 'Submit quote for approval',
      validate_quote_details: 'Validate quote details and pricing',
      determine_approval_path: 'Determine approval routing',
      route_to_approvers: 'Route to appropriate approvers',
      track_approval_status: 'Track approval status and SLA',
      handle_approver_feedback: 'Handle approver feedback/changes',
      finalize_approved_quote: 'Finalize approved quote',
      notify_requester: 'Notify sales rep of approval status',

      // Territory Assignment
      receive_new_lead_or_account: 'Receive new lead or account',
      determine_territory_rules: 'Apply territory assignment rules',
      check_rep_capacity: 'Check rep capacity and workload',
      apply_assignment_logic: 'Apply assignment logic',
      update_ownership: 'Update ownership in CRM',
      notify_assigned_rep: 'Notify assigned representative',
      log_assignment_history: 'Log assignment in history',

      // Commission Tracking
      receive_deal_closure: 'Receive deal closure notification',
      validate_deal_attribution: 'Validate deal attribution and credit',
      apply_commission_rules: 'Apply commission plan rules',
      calculate_commission_amount: 'Calculate commission amount',
      handle_split_scenarios: 'Handle split commission scenarios',
      update_commission_ledger: 'Update commission ledger',
      notify_rep_of_commission: 'Notify rep of earned commission',
      generate_payout_report: 'Generate payout report for finance',
    };

    return mapping[stepName] || stepName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default SalesDomainIntelligence;

// Convenience functions
export function createSalesIntelligence(region: string = 'kuwait'): SalesDomainIntelligence {
  return new SalesDomainIntelligence(region);
}

export function detectSalesWorkflow(request: string, region: string = 'kuwait'): string | null {
  const intelligence = new SalesDomainIntelligence(region);
  return intelligence.detectSalesPattern(request);
}

export function analyzeSalesRequest(request: string, region: string = 'kuwait'): SalesAnalysisResult {
  const intelligence = new SalesDomainIntelligence(region);
  const pattern = intelligence.detectSalesPattern(request);

  return {
    pattern,
    requirements: pattern ? intelligence.getImplicitRequirements(pattern) : [],
    tools: pattern ? intelligence.getToolRecommendations(pattern) : [],
    questions: pattern ? intelligence.getClarifyingQuestions(pattern) : [],
    stageRecommendation: pattern
      ? intelligence.getSalesStageRecommendations(pattern).join('; ')
      : 'No sales pattern detected',
    estimatedConversionRate: pattern
      ? SALES_WORKFLOW_PATTERNS[pattern]?.estimatedROI || 'Unknown'
      : 'N/A',
  };
}

/**
 * Get sales metrics for a specific workflow pattern
 */
export function getSalesMetrics(pattern: string): {
  name: string;
  description: string;
  estimatedROI: string;
  keyMetrics: string[];
} | null {
  const patternDef = SALES_WORKFLOW_PATTERNS[pattern];
  if (!patternDef) return null;

  return {
    name: patternDef.name,
    description: patternDef.description,
    estimatedROI: patternDef.estimatedROI,
    keyMetrics: patternDef.salesStageRequirements,
  };
}

/**
 * Get all available sales workflow patterns
 */
export function getAllSalesPatterns(): string[] {
  return Object.keys(SALES_WORKFLOW_PATTERNS);
}

/**
 * Get sales workflow pattern by name
 */
export function getSalesPatternByName(name: string): SalesWorkflowPattern | null {
  return SALES_WORKFLOW_PATTERNS[name] || null;
}
