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
