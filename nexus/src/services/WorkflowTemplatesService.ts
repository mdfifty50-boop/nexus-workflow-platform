/**
 * WorkflowTemplatesService.ts
 *
 * Pre-built workflow templates that users can deploy in one click.
 * Part of Nexus Product Enhancement.
 *
 * SAFE: This is a NEW file - does not modify any protected code.
 */

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  popularity: number; // 1-100
  estimatedTimeSaved: string;
  requiredIntegrations: string[];
  tags: string[];
  regionRelevance?: string[]; // e.g., ['kuwait', 'gcc', 'global']
  steps: TemplateStep[];
}

export interface TemplateStep {
  id: string;
  name: string;
  tool: string;
  type: 'trigger' | 'action';
  description?: string;
  defaultParams?: Record<string, unknown>;
}

export type TemplateCategory =
  | 'email-automation'
  | 'communication'
  | 'productivity'
  | 'finance'
  | 'hr'
  | 'sales'
  | 'marketing'
  | 'operations'
  | 'customer-support'
  | 'developer-tools'
  | 'social-media';

/**
 * Pre-built workflow templates ready for one-click deployment
 */
export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  // ============================================
  // EMAIL AUTOMATION TEMPLATES
  // ============================================
  {
    id: 'email-to-sheet',
    name: 'Save Emails to Spreadsheet',
    description: 'Automatically log important emails to a Google Sheet for tracking',
    category: 'email-automation',
    popularity: 95,
    estimatedTimeSaved: '3 hours/week',
    requiredIntegrations: ['gmail', 'googlesheets'],
    tags: ['email', 'tracking', 'organization'],
    regionRelevance: ['global'],
    steps: [
      { id: 'step_1', name: 'New Email Arrives', tool: 'gmail', type: 'trigger' },
      { id: 'step_2', name: 'Add to Spreadsheet', tool: 'googlesheets', type: 'action' }
    ]
  },
  {
    id: 'email-to-slack',
    name: 'Email to Slack Notification',
    description: 'Get notified on Slack when you receive important emails',
    category: 'communication',
    popularity: 92,
    estimatedTimeSaved: '2 hours/week',
    requiredIntegrations: ['gmail', 'slack'],
    tags: ['email', 'notification', 'team'],
    regionRelevance: ['global'],
    steps: [
      { id: 'step_1', name: 'Email Received', tool: 'gmail', type: 'trigger' },
      { id: 'step_2', name: 'Send Slack Message', tool: 'slack', type: 'action' }
    ]
  },

  // ============================================
  // COMMUNICATION TEMPLATES
  // ============================================
  {
    id: 'slack-to-notion',
    name: 'Save Slack Messages to Notion',
    description: 'Archive important Slack conversations to your Notion workspace',
    category: 'communication',
    popularity: 88,
    estimatedTimeSaved: '2 hours/week',
    requiredIntegrations: ['slack', 'notion'],
    tags: ['documentation', 'archive', 'team'],
    regionRelevance: ['global'],
    steps: [
      { id: 'step_1', name: 'New Slack Message', tool: 'slack', type: 'trigger' },
      { id: 'step_2', name: 'Add to Notion', tool: 'notion', type: 'action' }
    ]
  },
  {
    id: 'whatsapp-lead-capture',
    name: 'WhatsApp Lead to CRM',
    description: 'Capture leads from WhatsApp messages into your CRM',
    category: 'sales',
    popularity: 90,
    estimatedTimeSaved: '5 hours/week',
    requiredIntegrations: ['whatsapp', 'hubspot'],
    tags: ['leads', 'crm', 'sales'],
    regionRelevance: ['kuwait', 'gcc', 'mena'], // High relevance for WhatsApp-dominant regions
    steps: [
      { id: 'step_1', name: 'WhatsApp Message Received', tool: 'whatsapp', type: 'trigger' },
      { id: 'step_2', name: 'Create Lead in CRM', tool: 'hubspot', type: 'action' }
    ]
  },

  // ============================================
  // PRODUCTIVITY TEMPLATES
  // ============================================
  {
    id: 'calendar-to-slack',
    name: 'Daily Calendar Summary',
    description: 'Get your daily schedule posted to Slack every morning',
    category: 'productivity',
    popularity: 85,
    estimatedTimeSaved: '1 hour/week',
    requiredIntegrations: ['googlecalendar', 'slack'],
    tags: ['schedule', 'planning', 'daily'],
    regionRelevance: ['global'],
    steps: [
      { id: 'step_1', name: 'Get Today\'s Events', tool: 'googlecalendar', type: 'trigger' },
      { id: 'step_2', name: 'Post to Slack', tool: 'slack', type: 'action' }
    ]
  },
  {
    id: 'meeting-notes-to-notion',
    name: 'Meeting Notes to Notion',
    description: 'Automatically save meeting transcripts and notes to Notion',
    category: 'productivity',
    popularity: 82,
    estimatedTimeSaved: '3 hours/week',
    requiredIntegrations: ['zoom', 'notion'],
    tags: ['meetings', 'notes', 'documentation'],
    regionRelevance: ['global'],
    steps: [
      { id: 'step_1', name: 'Meeting Ends', tool: 'zoom', type: 'trigger' },
      { id: 'step_2', name: 'Save to Notion', tool: 'notion', type: 'action' }
    ]
  },

  // ============================================
  // FINANCE TEMPLATES
  // ============================================
  {
    id: 'invoice-tracking',
    name: 'Invoice Tracker',
    description: 'Track invoices and payment status in a spreadsheet',
    category: 'finance',
    popularity: 87,
    estimatedTimeSaved: '4 hours/week',
    requiredIntegrations: ['gmail', 'googlesheets'],
    tags: ['invoices', 'payments', 'accounting'],
    regionRelevance: ['global'],
    steps: [
      { id: 'step_1', name: 'Invoice Email Received', tool: 'gmail', type: 'trigger' },
      { id: 'step_2', name: 'Log to Sheet', tool: 'googlesheets', type: 'action' }
    ]
  },
  {
    id: 'stripe-notification',
    name: 'Payment Alerts',
    description: 'Get notified when you receive payments',
    category: 'finance',
    popularity: 91,
    estimatedTimeSaved: '2 hours/week',
    requiredIntegrations: ['stripe', 'slack'],
    tags: ['payments', 'alerts', 'revenue'],
    regionRelevance: ['global'],
    steps: [
      { id: 'step_1', name: 'Payment Received', tool: 'stripe', type: 'trigger' },
      { id: 'step_2', name: 'Notify on Slack', tool: 'slack', type: 'action' }
    ]
  },

  // ============================================
  // DEVELOPER TOOLS TEMPLATES
  // ============================================
  {
    id: 'github-to-slack',
    name: 'GitHub to Slack Notifications',
    description: 'Get notified about PRs, issues, and commits',
    category: 'developer-tools',
    popularity: 93,
    estimatedTimeSaved: '2 hours/week',
    requiredIntegrations: ['github', 'slack'],
    tags: ['code', 'team', 'notifications'],
    regionRelevance: ['global'],
    steps: [
      { id: 'step_1', name: 'GitHub Event', tool: 'github', type: 'trigger' },
      { id: 'step_2', name: 'Post to Slack', tool: 'slack', type: 'action' }
    ]
  },
  {
    id: 'github-issue-to-sheet',
    name: 'Issue Tracker Sync',
    description: 'Sync GitHub issues to a spreadsheet for reporting',
    category: 'developer-tools',
    popularity: 80,
    estimatedTimeSaved: '3 hours/week',
    requiredIntegrations: ['github', 'googlesheets'],
    tags: ['issues', 'tracking', 'reporting'],
    regionRelevance: ['global'],
    steps: [
      { id: 'step_1', name: 'New Issue Created', tool: 'github', type: 'trigger' },
      { id: 'step_2', name: 'Add to Sheet', tool: 'googlesheets', type: 'action' }
    ]
  },

  // ============================================
  // SOCIAL MEDIA TEMPLATES
  // ============================================
  {
    id: 'social-to-sheet',
    name: 'Social Media Tracker',
    description: 'Track mentions and engagement in a spreadsheet',
    category: 'social-media',
    popularity: 78,
    estimatedTimeSaved: '4 hours/week',
    requiredIntegrations: ['twitter', 'googlesheets'],
    tags: ['social', 'analytics', 'tracking'],
    regionRelevance: ['global'],
    steps: [
      { id: 'step_1', name: 'New Mention', tool: 'twitter', type: 'trigger' },
      { id: 'step_2', name: 'Log to Sheet', tool: 'googlesheets', type: 'action' }
    ]
  },

  // ============================================
  // FILE MANAGEMENT TEMPLATES
  // ============================================
  {
    id: 'email-attachment-to-dropbox',
    name: 'Auto-Save Attachments',
    description: 'Automatically save email attachments to Dropbox',
    category: 'productivity',
    popularity: 86,
    estimatedTimeSaved: '2 hours/week',
    requiredIntegrations: ['gmail', 'dropbox'],
    tags: ['files', 'backup', 'organization'],
    regionRelevance: ['global'],
    steps: [
      { id: 'step_1', name: 'Email with Attachment', tool: 'gmail', type: 'trigger' },
      { id: 'step_2', name: 'Save to Dropbox', tool: 'dropbox', type: 'action' }
    ]
  },
  {
    id: 'drive-backup-to-dropbox',
    name: 'Cross-Cloud Backup',
    description: 'Backup Google Drive files to Dropbox',
    category: 'operations',
    popularity: 75,
    estimatedTimeSaved: '2 hours/week',
    requiredIntegrations: ['googledrive', 'dropbox'],
    tags: ['backup', 'files', 'sync'],
    regionRelevance: ['global'],
    steps: [
      { id: 'step_1', name: 'New File in Drive', tool: 'googledrive', type: 'trigger' },
      { id: 'step_2', name: 'Copy to Dropbox', tool: 'dropbox', type: 'action' }
    ]
  },

  // ============================================
  // BANKING TEMPLATES - By Role Level
  // @NEXUS-FIX-156: Dedicated banking templates from teller to C-suite
  // ============================================

  // --- TELLER / CUSTOMER SERVICE REP ---
  {
    id: 'banking-teller-daily-balancing',
    name: 'Teller Daily Cash Balancing',
    description: 'Automate end-of-day cash drawer balancing with variance alerts to branch manager',
    category: 'operations',
    popularity: 88,
    estimatedTimeSaved: '30 min/day',
    requiredIntegrations: ['googlesheets', 'slack'],
    tags: ['banking', 'teller', 'cash-management', 'daily-ops'],
    regionRelevance: ['global'],
    steps: [
      { id: 'step_1', name: 'Teller Submits End-of-Day Count', tool: 'googlesheets', type: 'trigger' },
      { id: 'step_2', name: 'Calculate Variance', tool: 'googlesheets', type: 'action' },
      { id: 'step_3', name: 'Alert Branch Manager if Over/Short', tool: 'slack', type: 'action' }
    ]
  },
  {
    id: 'banking-teller-ctr-alert',
    name: 'CTR Threshold Alert',
    description: 'Auto-flag transactions over $10,000 for Currency Transaction Report filing',
    category: 'finance',
    popularity: 92,
    estimatedTimeSaved: '1 hour/day',
    requiredIntegrations: ['googlesheets', 'gmail'],
    tags: ['banking', 'teller', 'bsa-aml', 'compliance', 'ctr'],
    regionRelevance: ['global'],
    steps: [
      { id: 'step_1', name: 'Large Transaction Detected', tool: 'googlesheets', type: 'trigger' },
      { id: 'step_2', name: 'Generate CTR Draft', tool: 'googlesheets', type: 'action' },
      { id: 'step_3', name: 'Notify BSA Officer', tool: 'gmail', type: 'action' }
    ]
  },

  // --- PERSONAL BANKER / RELATIONSHIP MANAGER ---
  {
    id: 'banking-cross-sell-pipeline',
    name: 'Customer Cross-Sell Pipeline',
    description: 'Identify cross-sell opportunities when customers open new accounts and track follow-up',
    category: 'sales',
    popularity: 85,
    estimatedTimeSaved: '3 hours/week',
    requiredIntegrations: ['googlesheets', 'gmail', 'slack'],
    tags: ['banking', 'personal-banker', 'cross-sell', 'crm'],
    regionRelevance: ['global'],
    steps: [
      { id: 'step_1', name: 'New Account Opened', tool: 'googlesheets', type: 'trigger' },
      { id: 'step_2', name: 'Identify Product Gaps', tool: 'googlesheets', type: 'action' },
      { id: 'step_3', name: 'Schedule Follow-Up Email', tool: 'gmail', type: 'action' },
      { id: 'step_4', name: 'Track in Pipeline', tool: 'slack', type: 'action' }
    ]
  },
  {
    id: 'banking-customer-onboarding',
    name: 'New Customer Onboarding Flow',
    description: 'Automate welcome sequence, CIP verification follow-up, and product education for new customers',
    category: 'customer-support',
    popularity: 90,
    estimatedTimeSaved: '2 hours/week',
    requiredIntegrations: ['gmail', 'googlesheets'],
    tags: ['banking', 'personal-banker', 'onboarding', 'cip'],
    regionRelevance: ['global'],
    steps: [
      { id: 'step_1', name: 'New Customer Record Created', tool: 'googlesheets', type: 'trigger' },
      { id: 'step_2', name: 'Send Welcome Package Email', tool: 'gmail', type: 'action' },
      { id: 'step_3', name: 'Schedule 30-Day Check-In', tool: 'gmail', type: 'action' }
    ]
  },

  // --- LOAN OFFICER / CREDIT ANALYST ---
  {
    id: 'banking-loan-pipeline-tracker',
    name: 'Loan Pipeline Tracker',
    description: 'Track loan applications from submission through underwriting, approval, and closing with status alerts',
    category: 'operations',
    popularity: 93,
    estimatedTimeSaved: '5 hours/week',
    requiredIntegrations: ['googlesheets', 'slack', 'gmail'],
    tags: ['banking', 'loan-officer', 'lending', 'pipeline'],
    regionRelevance: ['global'],
    steps: [
      { id: 'step_1', name: 'Loan Application Received', tool: 'googlesheets', type: 'trigger' },
      { id: 'step_2', name: 'Assign to Underwriter', tool: 'slack', type: 'action' },
      { id: 'step_3', name: 'Send Applicant Status Update', tool: 'gmail', type: 'action' },
      { id: 'step_4', name: 'Log in Pipeline Dashboard', tool: 'googlesheets', type: 'action' }
    ]
  },
  {
    id: 'banking-adverse-action-notice',
    name: 'Adverse Action Notice Generator',
    description: 'Auto-generate ECOA-compliant adverse action notices when loans are denied with required reasons',
    category: 'finance',
    popularity: 87,
    estimatedTimeSaved: '2 hours/week',
    requiredIntegrations: ['googlesheets', 'gmail'],
    tags: ['banking', 'loan-officer', 'compliance', 'ecoa', 'fair-lending'],
    regionRelevance: ['global'],
    steps: [
      { id: 'step_1', name: 'Loan Decision: Denied', tool: 'googlesheets', type: 'trigger' },
      { id: 'step_2', name: 'Generate Adverse Action Notice', tool: 'googlesheets', type: 'action' },
      { id: 'step_3', name: 'Send to Applicant', tool: 'gmail', type: 'action' }
    ]
  },

  // --- BRANCH MANAGER ---
  {
    id: 'banking-branch-daily-report',
    name: 'Branch Daily Operations Report',
    description: 'Automated daily summary of branch transactions, new accounts, cash position, and staffing to regional manager',
    category: 'operations',
    popularity: 91,
    estimatedTimeSaved: '45 min/day',
    requiredIntegrations: ['googlesheets', 'gmail', 'slack'],
    tags: ['banking', 'branch-manager', 'daily-ops', 'reporting'],
    regionRelevance: ['global'],
    steps: [
      { id: 'step_1', name: 'End of Business Day', tool: 'googlesheets', type: 'trigger' },
      { id: 'step_2', name: 'Aggregate Branch Metrics', tool: 'googlesheets', type: 'action' },
      { id: 'step_3', name: 'Email Report to Regional Manager', tool: 'gmail', type: 'action' },
      { id: 'step_4', name: 'Post Summary to Branch Channel', tool: 'slack', type: 'action' }
    ]
  },
  {
    id: 'banking-branch-staffing-alert',
    name: 'Branch Staffing & Wait Time Alert',
    description: 'Monitor lobby wait times and trigger staffing adjustments when thresholds are exceeded',
    category: 'operations',
    popularity: 78,
    estimatedTimeSaved: '1 hour/week',
    requiredIntegrations: ['googlesheets', 'slack'],
    tags: ['banking', 'branch-manager', 'staffing', 'customer-experience'],
    regionRelevance: ['global'],
    steps: [
      { id: 'step_1', name: 'Wait Time Exceeds Threshold', tool: 'googlesheets', type: 'trigger' },
      { id: 'step_2', name: 'Alert Available Staff', tool: 'slack', type: 'action' }
    ]
  },

  // --- COMPLIANCE OFFICER / BSA ANALYST ---
  {
    id: 'banking-sar-filing-tracker',
    name: 'SAR Filing Pipeline',
    description: 'Track suspicious activity reports from detection through investigation, filing, and follow-up within 30-day deadline',
    category: 'operations',
    popularity: 94,
    estimatedTimeSaved: '4 hours/week',
    requiredIntegrations: ['googlesheets', 'gmail', 'slack'],
    tags: ['banking', 'compliance', 'bsa-aml', 'sar', 'fincen'],
    regionRelevance: ['global'],
    steps: [
      { id: 'step_1', name: 'Suspicious Activity Flagged', tool: 'googlesheets', type: 'trigger' },
      { id: 'step_2', name: 'Create Investigation Case', tool: 'googlesheets', type: 'action' },
      { id: 'step_3', name: 'Assign to BSA Analyst', tool: 'slack', type: 'action' },
      { id: 'step_4', name: 'Track Filing Deadline', tool: 'gmail', type: 'action' }
    ]
  },
  {
    id: 'banking-kyc-refresh-pipeline',
    name: 'KYC Periodic Review Pipeline',
    description: 'Automate customer due diligence refresh cycles based on risk rating (high=annual, medium=biennial)',
    category: 'operations',
    popularity: 89,
    estimatedTimeSaved: '6 hours/week',
    requiredIntegrations: ['googlesheets', 'gmail'],
    tags: ['banking', 'compliance', 'kyc', 'cdd', 'edd', 'due-diligence'],
    regionRelevance: ['global'],
    steps: [
      { id: 'step_1', name: 'KYC Review Due Date Approaching', tool: 'googlesheets', type: 'trigger' },
      { id: 'step_2', name: 'Generate Review Package', tool: 'googlesheets', type: 'action' },
      { id: 'step_3', name: 'Notify Relationship Manager', tool: 'gmail', type: 'action' }
    ]
  },

  // --- RISK ANALYST / CREDIT RISK MANAGER ---
  {
    id: 'banking-credit-quality-monitor',
    name: 'Loan Portfolio Credit Quality Monitor',
    description: 'Daily monitoring of delinquency rates, watch list changes, and early warning indicators with alerts',
    category: 'finance',
    popularity: 86,
    estimatedTimeSaved: '3 hours/week',
    requiredIntegrations: ['googlesheets', 'slack', 'gmail'],
    tags: ['banking', 'risk', 'credit-quality', 'delinquency', 'watchlist'],
    regionRelevance: ['global'],
    steps: [
      { id: 'step_1', name: 'Daily Portfolio Data Refresh', tool: 'googlesheets', type: 'trigger' },
      { id: 'step_2', name: 'Calculate Risk Metrics', tool: 'googlesheets', type: 'action' },
      { id: 'step_3', name: 'Alert Risk Committee on Threshold Breach', tool: 'slack', type: 'action' },
      { id: 'step_4', name: 'Email Watch List Report', tool: 'gmail', type: 'action' }
    ]
  },
  {
    id: 'banking-concentration-risk-alert',
    name: 'Concentration Risk Alert',
    description: 'Monitor loan portfolio concentration by industry, geography, and borrower against policy limits',
    category: 'finance',
    popularity: 82,
    estimatedTimeSaved: '2 hours/week',
    requiredIntegrations: ['googlesheets', 'slack'],
    tags: ['banking', 'risk', 'concentration', 'cre', 'policy-limits'],
    regionRelevance: ['global'],
    steps: [
      { id: 'step_1', name: 'Portfolio Data Updated', tool: 'googlesheets', type: 'trigger' },
      { id: 'step_2', name: 'Check Against Policy Limits', tool: 'googlesheets', type: 'action' },
      { id: 'step_3', name: 'Alert ALCO Committee', tool: 'slack', type: 'action' }
    ]
  },

  // --- TREASURY / INVESTMENT ANALYST ---
  {
    id: 'banking-liquidity-dashboard',
    name: 'Daily Liquidity Position Report',
    description: 'Automated daily cash position, liquidity ratios, and funding gap analysis for treasury desk',
    category: 'finance',
    popularity: 84,
    estimatedTimeSaved: '1 hour/day',
    requiredIntegrations: ['googlesheets', 'gmail'],
    tags: ['banking', 'treasury', 'liquidity', 'alco', 'funding'],
    regionRelevance: ['global'],
    steps: [
      { id: 'step_1', name: 'Market Open / Position Update', tool: 'googlesheets', type: 'trigger' },
      { id: 'step_2', name: 'Calculate Liquidity Ratios', tool: 'googlesheets', type: 'action' },
      { id: 'step_3', name: 'Email ALCO Summary', tool: 'gmail', type: 'action' }
    ]
  },

  // --- WEALTH ADVISOR / PRIVATE BANKING ---
  {
    id: 'banking-wealth-client-review',
    name: 'Client Portfolio Review Scheduler',
    description: 'Schedule quarterly portfolio reviews for wealth management clients with pre-built performance reports',
    category: 'sales',
    popularity: 80,
    estimatedTimeSaved: '3 hours/week',
    requiredIntegrations: ['googlesheets', 'gmail', 'googlecalendar'],
    tags: ['banking', 'wealth', 'private-banking', 'portfolio-review'],
    regionRelevance: ['global'],
    steps: [
      { id: 'step_1', name: 'Quarterly Review Due', tool: 'googlesheets', type: 'trigger' },
      { id: 'step_2', name: 'Generate Performance Report', tool: 'googlesheets', type: 'action' },
      { id: 'step_3', name: 'Schedule Meeting', tool: 'googlecalendar', type: 'action' },
      { id: 'step_4', name: 'Send Report to Client', tool: 'gmail', type: 'action' }
    ]
  },

  // --- VP / DIRECTOR / C-SUITE ---
  {
    id: 'banking-board-report-assembler',
    name: 'Board Report Assembly Pipeline',
    description: 'Aggregate departmental data into standardized board reporting package with financial highlights, risk dashboard, and compliance scorecard',
    category: 'operations',
    popularity: 83,
    estimatedTimeSaved: '8 hours/month',
    requiredIntegrations: ['googlesheets', 'gmail', 'slack'],
    tags: ['banking', 'c-suite', 'board-reporting', 'governance'],
    regionRelevance: ['global'],
    steps: [
      { id: 'step_1', name: 'Board Meeting Date Approaching', tool: 'googlesheets', type: 'trigger' },
      { id: 'step_2', name: 'Collect Department Submissions', tool: 'slack', type: 'action' },
      { id: 'step_3', name: 'Assemble Board Package', tool: 'googlesheets', type: 'action' },
      { id: 'step_4', name: 'Distribute to Board Members', tool: 'gmail', type: 'action' }
    ]
  },
  {
    id: 'banking-regulatory-exam-tracker',
    name: 'Regulatory Exam Readiness Tracker',
    description: 'Track exam preparation tasks, document requests, findings remediation, and management response deadlines',
    category: 'operations',
    popularity: 90,
    estimatedTimeSaved: '10 hours/exam',
    requiredIntegrations: ['googlesheets', 'slack', 'gmail'],
    tags: ['banking', 'c-suite', 'compliance', 'exam', 'occ', 'fdic'],
    regionRelevance: ['global'],
    steps: [
      { id: 'step_1', name: 'Exam Announced / Document Request', tool: 'googlesheets', type: 'trigger' },
      { id: 'step_2', name: 'Assign Action Items to Departments', tool: 'slack', type: 'action' },
      { id: 'step_3', name: 'Track Completion Status', tool: 'googlesheets', type: 'action' },
      { id: 'step_4', name: 'Alert on Overdue Items', tool: 'gmail', type: 'action' }
    ]
  },
  {
    id: 'banking-fraud-alert-escalation',
    name: 'Fraud Alert Escalation Pipeline',
    description: 'Real-time fraud alert triage from detection through investigation and customer notification with SLA tracking',
    category: 'operations',
    popularity: 91,
    estimatedTimeSaved: '4 hours/week',
    requiredIntegrations: ['googlesheets', 'slack', 'gmail'],
    tags: ['banking', 'fraud', 'escalation', 'operations', 'sla'],
    regionRelevance: ['global'],
    steps: [
      { id: 'step_1', name: 'Fraud Alert Triggered', tool: 'googlesheets', type: 'trigger' },
      { id: 'step_2', name: 'Assign to Fraud Analyst', tool: 'slack', type: 'action' },
      { id: 'step_3', name: 'Notify Customer', tool: 'gmail', type: 'action' },
      { id: 'step_4', name: 'Log Resolution', tool: 'googlesheets', type: 'action' }
    ]
  }
];

/**
 * Service for managing workflow templates
 */
export class WorkflowTemplatesService {
  /**
   * Get all templates
   */
  static getAllTemplates(): WorkflowTemplate[] {
    return WORKFLOW_TEMPLATES;
  }

  // @NEXUS-FIX-154: Get templates sorted by industry relevance
  static getByIndustry(industry: string): WorkflowTemplate[] {
    const industryToCategoryMap: Record<string, TemplateCategory[]> = {
      ecommerce: ['sales', 'marketing', 'communication', 'customer-support'],
      saas: ['developer-tools', 'productivity', 'communication', 'customer-support'],
      healthcare: ['hr', 'communication', 'productivity', 'operations'],
      finance: ['finance', 'productivity', 'email-automation', 'operations'],
      // @NEXUS-FIX-156: Banking prioritizes operations, finance, and compliance-related templates
      banking: ['operations', 'finance', 'customer-support', 'sales'],
      consulting: ['productivity', 'communication', 'sales', 'email-automation'],
      agency: ['marketing', 'communication', 'productivity', 'social-media'],
      education: ['productivity', 'communication', 'hr', 'operations'],
      realestate: ['sales', 'communication', 'finance', 'email-automation'],
      retail: ['sales', 'marketing', 'finance', 'customer-support'],
      manufacturing: ['operations', 'productivity', 'communication', 'hr'],
      nonprofit: ['communication', 'productivity', 'email-automation', 'operations'],
    }
    const relevantCategories = industryToCategoryMap[industry] || []
    if (relevantCategories.length === 0) return WORKFLOW_TEMPLATES

    return [...WORKFLOW_TEMPLATES].sort((a, b) => {
      const aRelevant = relevantCategories.includes(a.category) ? 0 : 1
      const bRelevant = relevantCategories.includes(b.category) ? 0 : 1
      return aRelevant - bRelevant || b.popularity - a.popularity
    })
  }

  /**
   * Get templates by category
   */
  static getByCategory(category: TemplateCategory): WorkflowTemplate[] {
    return WORKFLOW_TEMPLATES.filter(t => t.category === category);
  }

  /**
   * Get templates relevant to a region
   */
  static getByRegion(region: string): WorkflowTemplate[] {
    return WORKFLOW_TEMPLATES.filter(
      t => !t.regionRelevance ||
           t.regionRelevance.includes('global') ||
           t.regionRelevance.includes(region.toLowerCase())
    );
  }

  /**
   * Get templates sorted by popularity
   */
  static getPopular(limit: number = 10): WorkflowTemplate[] {
    return [...WORKFLOW_TEMPLATES]
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit);
  }

  /**
   * Search templates by query
   */
  static search(query: string): WorkflowTemplate[] {
    const q = query.toLowerCase();
    return WORKFLOW_TEMPLATES.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.tags.some(tag => tag.includes(q)) ||
      t.requiredIntegrations.some(i => i.includes(q))
    );
  }

  /**
   * Get templates that the user can use (based on their connected integrations)
   */
  static getAvailable(connectedIntegrations: string[]): WorkflowTemplate[] {
    const connected = new Set(connectedIntegrations.map(i => i.toLowerCase()));
    return WORKFLOW_TEMPLATES.filter(t =>
      t.requiredIntegrations.every(req => connected.has(req.toLowerCase()))
    );
  }

  /**
   * Get template by ID
   */
  static getById(id: string): WorkflowTemplate | undefined {
    return WORKFLOW_TEMPLATES.find(t => t.id === id);
  }

  /**
   * Convert template to workflow spec format (for WorkflowPreviewCard)
   */
  static toWorkflowSpec(template: WorkflowTemplate): {
    name: string;
    description: string;
    steps: Array<{
      id: string;
      name: string;
      tool: string;
      type: 'trigger' | 'action';
    }>;
    requiredIntegrations: string[];
    estimatedTimeSaved: string;
  } {
    return {
      name: template.name,
      description: template.description,
      steps: template.steps.map(s => ({
        id: s.id,
        name: s.name,
        tool: s.tool,
        type: s.type
      })),
      requiredIntegrations: template.requiredIntegrations,
      estimatedTimeSaved: template.estimatedTimeSaved
    };
  }

  /**
   * Get suggested templates based on user's business type
   */
  static getSuggestionsForBusiness(businessType: string): WorkflowTemplate[] {
    const typeToCategories: Record<string, TemplateCategory[]> = {
      'ecommerce': ['finance', 'customer-support', 'marketing'],
      'saas': ['developer-tools', 'customer-support', 'sales'],
      'agency': ['productivity', 'communication', 'operations'],
      'consulting': ['productivity', 'communication', 'finance'],
      'retail': ['sales', 'customer-support', 'marketing'],
      'finance': ['finance', 'operations', 'communication'],
      'healthcare': ['operations', 'communication', 'productivity'],
      'education': ['productivity', 'communication', 'operations'],
      'real-estate': ['sales', 'communication', 'operations'],
      'legal': ['productivity', 'operations', 'communication'],
    };

    const categories = typeToCategories[businessType.toLowerCase()] ||
      ['productivity', 'communication', 'email-automation'];

    return WORKFLOW_TEMPLATES
      .filter(t => categories.includes(t.category))
      .sort((a, b) => b.popularity - a.popularity);
  }

  /**
   * Get all available categories
   */
  static getCategories(): { id: TemplateCategory; name: string; count: number }[] {
    const categoryNames: Record<TemplateCategory, string> = {
      'email-automation': 'Email Automation',
      'communication': 'Communication',
      'productivity': 'Productivity',
      'finance': 'Finance & Accounting',
      'hr': 'HR & Recruiting',
      'sales': 'Sales & CRM',
      'marketing': 'Marketing',
      'operations': 'Operations',
      'customer-support': 'Customer Support',
      'developer-tools': 'Developer Tools',
      'social-media': 'Social Media'
    };

    const counts = WORKFLOW_TEMPLATES.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1;
      return acc;
    }, {} as Record<TemplateCategory, number>);

    return Object.entries(categoryNames).map(([id, name]) => ({
      id: id as TemplateCategory,
      name,
      count: counts[id as TemplateCategory] || 0
    }));
  }
}

export default WorkflowTemplatesService;
