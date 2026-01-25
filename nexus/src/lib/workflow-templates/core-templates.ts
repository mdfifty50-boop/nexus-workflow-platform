/**
 * Core Workflow Templates for Small Business Automation
 *
 * These templates target small businesses replacing $2,500/month automation agencies.
 * Pricing: $79 launch special
 * Supports: English and Arabic
 *
 * All templates use real Composio tool slugs for actual workflow execution.
 */

// ========================================
// Extended Workflow Types for Core Templates
// ========================================

/**
 * Extended node types for core templates
 * Extends the base workflow engine types with integration-specific nodes
 */
export interface CoreWorkflowNode {
  id: string
  type: 'start' | 'end' | 'ai-agent' | 'integration' | 'condition' | 'transform' | 'loop' | 'data-transform' | 'api-call'
  label: string
  config: {
    // Trigger config
    trigger?: string
    source?: string
    event?: string
    interval?: string
    cron?: string
    filter?: Record<string, unknown> | string

    // Integration/Tool config
    tool?: string
    fallback?: string
    parameters?: Record<string, unknown>

    // AI agent config
    prompt?: string
    model?: string

    // Condition config
    conditions?: Array<{
      if?: string
      then?: string
      else?: string
    }>

    // Transform config
    operations?: Array<{
      type: string
      config: Record<string, unknown>
    }>

    // Generic config
    [key: string]: unknown
  }
  position: { x: number; y: number }
}

export interface CoreWorkflowEdge {
  id: string
  source: string
  target: string
  label?: string
}

export interface CoreWorkflowDefinition {
  nodes: CoreWorkflowNode[]
  edges: CoreWorkflowEdge[]
}

// Alias for compatibility
export type WorkflowDefinition = CoreWorkflowDefinition

// ========================================
// Template Types
// ========================================

export interface CoreWorkflowTemplate {
  id: string
  name: {
    en: string
    ar: string
  }
  description: {
    en: string
    ar: string
  }
  category: 'ecommerce' | 'crm' | 'finance' | 'social-media' | 'customer-service' | 'reporting' | 'scheduling' | 'operations'
  icon: string
  tags: string[]

  // Value proposition
  estimatedTimeSavedPerMonth: string
  estimatedMoneySavedPerMonth: string
  replacesAgencyService: string

  // Workflow definition
  definition: WorkflowDefinition

  // Required integrations (Composio toolkit names)
  requiredIntegrations: {
    name: string
    slug: string
    required: boolean
  }[]

  // Tool slugs used (Composio format)
  composioTools: string[]

  // Trigger configuration
  trigger: {
    type: 'webhook' | 'schedule' | 'manual' | 'event'
    config: Record<string, unknown>
  }

  // Example data for preview
  exampleInput: Record<string, unknown>
  expectedOutput: string

  // Metadata
  complexity: 'beginner' | 'intermediate' | 'advanced'
  setupTimeMinutes: number
  isPopular: boolean
  isNew: boolean
}

// ========================================
// Core Templates
// ========================================

export const coreWorkflowTemplates: CoreWorkflowTemplate[] = [
  // ========================================
  // 1. E-commerce Order Processing
  // ========================================
  {
    id: 'ecommerce-order-processing',
    name: {
      en: 'E-commerce Order Processing',
      ar: 'معالجة طلبات التجارة الإلكترونية',
    },
    description: {
      en: 'Automatically process new orders from Shopify/WooCommerce: log to Google Sheets, send confirmation email, notify team on Slack',
      ar: 'معالجة الطلبات الجديدة تلقائياً من Shopify/WooCommerce: تسجيل في جداول Google، إرسال بريد تأكيد، إشعار الفريق على Slack',
    },
    category: 'ecommerce',
    icon: '🛒',
    tags: ['shopify', 'woocommerce', 'orders', 'ecommerce', 'automation'],

    estimatedTimeSavedPerMonth: '40+ hours',
    estimatedMoneySavedPerMonth: '$800',
    replacesAgencyService: 'Order fulfillment automation',

    requiredIntegrations: [
      { name: 'Shopify', slug: 'shopify', required: false },
      { name: 'WooCommerce', slug: 'woocommerce', required: false },
      { name: 'Google Sheets', slug: 'googlesheets', required: true },
      { name: 'Gmail', slug: 'gmail', required: true },
      { name: 'Slack', slug: 'slack', required: true },
    ],

    composioTools: [
      'SHOPIFY_GET_ORDER',
      'WOOCOMMERCE_GET_ORDER',
      'GOOGLESHEETS_APPEND_DATA',
      'GMAIL_SEND_EMAIL',
      'SLACK_SEND_MESSAGE',
    ],

    trigger: {
      type: 'webhook',
      config: {
        source: 'shopify_or_woocommerce',
        event: 'order.created',
      },
    },

    definition: {
      nodes: [
        {
          id: 'start',
          type: 'start',
          label: 'New Order Received',
          config: {
            trigger: 'webhook',
            source: 'ecommerce_platform',
          },
          position: { x: 50, y: 200 },
        },
        {
          id: 'extract-order',
          type: 'transform',
          label: 'Extract Order Details',
          config: {
            operations: [
              { type: 'pick', config: { fields: ['order_id', 'customer_name', 'customer_email', 'items', 'total', 'shipping_address'] } },
            ],
          },
          position: { x: 200, y: 200 },
        },
        {
          id: 'log-to-sheets',
          type: 'integration',
          label: 'Log to Google Sheets',
          config: {
            tool: 'GOOGLESHEETS_APPEND_DATA',
            parameters: {
              spreadsheet_id: '{{config.spreadsheet_id}}',
              range: 'Orders!A:G',
              values: [
                ['{{order.order_id}}', '{{order.customer_name}}', '{{order.customer_email}}', '{{order.items_summary}}', '{{order.total}}', '{{order.shipping_address}}', '{{timestamp}}'],
              ],
            },
          },
          position: { x: 400, y: 100 },
        },
        {
          id: 'send-confirmation',
          type: 'integration',
          label: 'Send Confirmation Email',
          config: {
            tool: 'GMAIL_SEND_EMAIL',
            parameters: {
              to: '{{order.customer_email}}',
              subject: 'Order Confirmation #{{order.order_id}}',
              body: `Dear {{order.customer_name}},

Thank you for your order!

Order Number: {{order.order_id}}
Items: {{order.items_summary}}
Total: {{order.total}}

We'll notify you when your order ships.

Best regards,
{{config.store_name}}`,
            },
          },
          position: { x: 400, y: 200 },
        },
        {
          id: 'notify-slack',
          type: 'integration',
          label: 'Notify Team on Slack',
          config: {
            tool: 'SLACK_SEND_MESSAGE',
            parameters: {
              channel: '{{config.slack_channel}}',
              text: `🛒 *New Order Received!*\n\n*Order:* #{{order.order_id}}\n*Customer:* {{order.customer_name}}\n*Total:* {{order.total}}\n*Items:* {{order.items_summary}}`,
            },
          },
          position: { x: 400, y: 300 },
        },
        {
          id: 'end',
          type: 'end',
          label: 'Order Processed',
          config: {},
          position: { x: 600, y: 200 },
        },
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'extract-order' },
        { id: 'e2', source: 'extract-order', target: 'log-to-sheets' },
        { id: 'e3', source: 'extract-order', target: 'send-confirmation' },
        { id: 'e4', source: 'extract-order', target: 'notify-slack' },
        { id: 'e5', source: 'log-to-sheets', target: 'end' },
        { id: 'e6', source: 'send-confirmation', target: 'end' },
        { id: 'e7', source: 'notify-slack', target: 'end' },
      ],
    },

    exampleInput: {
      order_id: 'ORD-12345',
      customer_name: 'Ahmed Mohammed',
      customer_email: 'ahmed@example.com',
      items: [{ name: 'Wireless Headphones', qty: 1, price: 79.99 }],
      total: '$79.99',
      shipping_address: '123 Main St, Dubai, UAE',
    },
    expectedOutput: 'Order logged to spreadsheet, confirmation email sent, team notified on Slack',

    complexity: 'beginner',
    setupTimeMinutes: 15,
    isPopular: true,
    isNew: false,
  },

  // ========================================
  // 2. Lead Management CRM
  // ========================================
  {
    id: 'lead-management-crm',
    name: {
      en: 'Lead Management CRM',
      ar: 'إدارة العملاء المحتملين',
    },
    description: {
      en: 'Capture leads from forms, add to CRM, send welcome email, and assign to sales rep automatically',
      ar: 'التقاط العملاء المحتملين من النماذج، إضافتهم إلى CRM، إرسال بريد ترحيب، وتعيينهم لمندوب مبيعات تلقائياً',
    },
    category: 'crm',
    icon: '👥',
    tags: ['leads', 'crm', 'sales', 'forms', 'automation'],

    estimatedTimeSavedPerMonth: '30+ hours',
    estimatedMoneySavedPerMonth: '$600',
    replacesAgencyService: 'Lead capture and nurturing automation',

    requiredIntegrations: [
      { name: 'Google Forms', slug: 'googleforms', required: false },
      { name: 'Typeform', slug: 'typeform', required: false },
      { name: 'HubSpot', slug: 'hubspot', required: false },
      { name: 'Salesforce', slug: 'salesforce', required: false },
      { name: 'Google Sheets', slug: 'googlesheets', required: true },
      { name: 'Gmail', slug: 'gmail', required: true },
      { name: 'Slack', slug: 'slack', required: true },
    ],

    composioTools: [
      'GOOGLEFORMS_GET_RESPONSE',
      'TYPEFORM_GET_RESPONSE',
      'HUBSPOT_CREATE_CONTACT',
      'SALESFORCE_CREATE_LEAD',
      'GOOGLESHEETS_APPEND_DATA',
      'GMAIL_SEND_EMAIL',
      'SLACK_SEND_MESSAGE',
    ],

    trigger: {
      type: 'webhook',
      config: {
        source: 'form_submission',
        event: 'response.created',
      },
    },

    definition: {
      nodes: [
        {
          id: 'start',
          type: 'start',
          label: 'New Form Submission',
          config: {
            trigger: 'webhook',
            source: 'form_platform',
          },
          position: { x: 50, y: 200 },
        },
        {
          id: 'extract-lead',
          type: 'transform',
          label: 'Extract Lead Data',
          config: {
            operations: [
              { type: 'pick', config: { fields: ['name', 'email', 'phone', 'company', 'message', 'source'] } },
              { type: 'default', config: { source: 'Website Form' } },
            ],
          },
          position: { x: 200, y: 200 },
        },
        {
          id: 'score-lead',
          type: 'ai-agent',
          label: 'Score & Qualify Lead',
          config: {
            prompt: `Analyze this lead and provide:
1. Lead Score (1-100)
2. Qualification (Hot/Warm/Cold)
3. Recommended sales rep type (Enterprise/SMB/Startup)
4. Priority (High/Medium/Low)

Lead Data: {{lead}}`,
            model: 'claude-3-5-haiku-20241022',
          },
          position: { x: 350, y: 100 },
        },
        {
          id: 'add-to-crm',
          type: 'integration',
          label: 'Add to CRM',
          config: {
            tool: 'HUBSPOT_CREATE_CONTACT',
            fallback: 'GOOGLESHEETS_APPEND_DATA',
            parameters: {
              email: '{{lead.email}}',
              firstname: '{{lead.first_name}}',
              lastname: '{{lead.last_name}}',
              company: '{{lead.company}}',
              phone: '{{lead.phone}}',
              lead_source: '{{lead.source}}',
              lead_score: '{{scoring.score}}',
            },
          },
          position: { x: 500, y: 100 },
        },
        {
          id: 'send-welcome',
          type: 'integration',
          label: 'Send Welcome Email',
          config: {
            tool: 'GMAIL_SEND_EMAIL',
            parameters: {
              to: '{{lead.email}}',
              subject: 'Welcome to {{config.company_name}}!',
              body: `Hi {{lead.first_name}},

Thank you for your interest in {{config.company_name}}!

We received your inquiry and our team will be in touch within 24 hours.

In the meantime, here are some resources that might help:
- Product Overview: {{config.product_link}}
- Pricing: {{config.pricing_link}}
- FAQ: {{config.faq_link}}

Best regards,
The {{config.company_name}} Team`,
            },
          },
          position: { x: 500, y: 200 },
        },
        {
          id: 'assign-rep',
          type: 'condition',
          label: 'Assign to Sales Rep',
          config: {
            conditions: [
              { if: 'scoring.qualification === "Hot"', then: 'enterprise_rep' },
              { if: 'scoring.qualification === "Warm"', then: 'smb_rep' },
              { else: 'nurture_sequence' },
            ],
          },
          position: { x: 500, y: 300 },
        },
        {
          id: 'notify-rep',
          type: 'integration',
          label: 'Notify Assigned Rep',
          config: {
            tool: 'SLACK_SEND_MESSAGE',
            parameters: {
              channel: '{{config.sales_channel}}',
              text: `🎯 *New Lead Assigned!*\n\n*Name:* {{lead.name}}\n*Email:* {{lead.email}}\n*Company:* {{lead.company}}\n*Score:* {{scoring.score}}/100 ({{scoring.qualification}})\n*Priority:* {{scoring.priority}}\n\n<@{{assigned_rep}}> - Please follow up within {{config.sla_hours}} hours.`,
            },
          },
          position: { x: 650, y: 200 },
        },
        {
          id: 'end',
          type: 'end',
          label: 'Lead Processed',
          config: {},
          position: { x: 800, y: 200 },
        },
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'extract-lead' },
        { id: 'e2', source: 'extract-lead', target: 'score-lead' },
        { id: 'e3', source: 'score-lead', target: 'add-to-crm' },
        { id: 'e4', source: 'extract-lead', target: 'send-welcome' },
        { id: 'e5', source: 'score-lead', target: 'assign-rep' },
        { id: 'e6', source: 'assign-rep', target: 'notify-rep' },
        { id: 'e7', source: 'add-to-crm', target: 'end' },
        { id: 'e8', source: 'send-welcome', target: 'end' },
        { id: 'e9', source: 'notify-rep', target: 'end' },
      ],
    },

    exampleInput: {
      name: 'Sarah Al-Rashid',
      email: 'sarah@techcompany.com',
      phone: '+971 50 123 4567',
      company: 'TechCompany LLC',
      message: 'Interested in your enterprise plan for our 50-person team',
      source: 'Website Contact Form',
    },
    expectedOutput: 'Lead scored (85/100 Hot), added to HubSpot, welcome email sent, enterprise rep notified on Slack',

    complexity: 'intermediate',
    setupTimeMinutes: 20,
    isPopular: true,
    isNew: false,
  },

  // ========================================
  // 3. Invoice Automation
  // ========================================
  {
    id: 'invoice-automation',
    name: {
      en: 'Invoice Automation',
      ar: 'أتمتة الفواتير',
    },
    description: {
      en: 'Generate professional invoices from templates, email to clients, and log to accounting spreadsheet',
      ar: 'إنشاء فواتير احترافية من القوالب، إرسالها للعملاء بالبريد الإلكتروني، وتسجيلها في جدول المحاسبة',
    },
    category: 'finance',
    icon: '🧾',
    tags: ['invoices', 'billing', 'accounting', 'finance', 'automation'],

    estimatedTimeSavedPerMonth: '20+ hours',
    estimatedMoneySavedPerMonth: '$400',
    replacesAgencyService: 'Billing and invoicing automation',

    requiredIntegrations: [
      { name: 'Google Sheets', slug: 'googlesheets', required: true },
      { name: 'Google Docs', slug: 'googledocs', required: true },
      { name: 'Gmail', slug: 'gmail', required: true },
      { name: 'Google Drive', slug: 'googledrive', required: true },
    ],

    composioTools: [
      'GOOGLESHEETS_READ_DATA',
      'GOOGLEDOCS_CREATE_DOCUMENT',
      'GOOGLEDOCS_UPDATE_DOCUMENT',
      'GOOGLEDRIVE_EXPORT_PDF',
      'GMAIL_SEND_EMAIL',
      'GOOGLESHEETS_APPEND_DATA',
    ],

    trigger: {
      type: 'manual',
      config: {
        buttonLabel: 'Generate Invoice',
        requiredFields: ['client_id', 'items', 'due_date'],
      },
    },

    definition: {
      nodes: [
        {
          id: 'start',
          type: 'start',
          label: 'Generate Invoice',
          config: {
            trigger: 'manual',
          },
          position: { x: 50, y: 200 },
        },
        {
          id: 'get-client',
          type: 'integration',
          label: 'Get Client Data',
          config: {
            tool: 'GOOGLESHEETS_READ_DATA',
            parameters: {
              spreadsheet_id: '{{config.clients_sheet_id}}',
              range: 'Clients!A:H',
              filter: 'client_id = {{input.client_id}}',
            },
          },
          position: { x: 200, y: 200 },
        },
        {
          id: 'generate-invoice-number',
          type: 'transform',
          label: 'Generate Invoice Number',
          config: {
            operations: [
              { type: 'expression', config: { expression: '"INV-" + Date.now().toString(36).toUpperCase()' } },
            ],
          },
          position: { x: 350, y: 100 },
        },
        {
          id: 'calculate-totals',
          type: 'ai-agent',
          label: 'Calculate Totals',
          config: {
            prompt: `Calculate invoice totals:
Items: {{input.items}}

Provide:
1. Subtotal
2. Tax ({{config.tax_rate}}%)
3. Total
4. Amount in words

Format as JSON.`,
            model: 'claude-3-5-haiku-20241022',
          },
          position: { x: 350, y: 200 },
        },
        {
          id: 'create-invoice-doc',
          type: 'integration',
          label: 'Create Invoice Document',
          config: {
            tool: 'GOOGLEDOCS_CREATE_DOCUMENT',
            parameters: {
              template_id: '{{config.invoice_template_id}}',
              replacements: {
                '{{INVOICE_NUMBER}}': '{{invoice_number}}',
                '{{DATE}}': '{{current_date}}',
                '{{DUE_DATE}}': '{{input.due_date}}',
                '{{CLIENT_NAME}}': '{{client.name}}',
                '{{CLIENT_ADDRESS}}': '{{client.address}}',
                '{{CLIENT_EMAIL}}': '{{client.email}}',
                '{{ITEMS_TABLE}}': '{{items_html}}',
                '{{SUBTOTAL}}': '{{totals.subtotal}}',
                '{{TAX}}': '{{totals.tax}}',
                '{{TOTAL}}': '{{totals.total}}',
                '{{AMOUNT_WORDS}}': '{{totals.amount_words}}',
              },
            },
          },
          position: { x: 500, y: 200 },
        },
        {
          id: 'export-pdf',
          type: 'integration',
          label: 'Export as PDF',
          config: {
            tool: 'GOOGLEDRIVE_EXPORT_PDF',
            parameters: {
              document_id: '{{invoice_doc.id}}',
              folder_id: '{{config.invoices_folder_id}}',
            },
          },
          position: { x: 650, y: 200 },
        },
        {
          id: 'send-invoice',
          type: 'integration',
          label: 'Send Invoice Email',
          config: {
            tool: 'GMAIL_SEND_EMAIL',
            parameters: {
              to: '{{client.email}}',
              subject: 'Invoice {{invoice_number}} from {{config.company_name}}',
              body: `Dear {{client.name}},

Please find attached invoice {{invoice_number}} for {{totals.total}}.

Due Date: {{input.due_date}}

Payment Methods:
{{config.payment_instructions}}

Thank you for your business!

Best regards,
{{config.company_name}}`,
              attachments: ['{{pdf_file.url}}'],
            },
          },
          position: { x: 800, y: 150 },
        },
        {
          id: 'log-invoice',
          type: 'integration',
          label: 'Log to Accounting',
          config: {
            tool: 'GOOGLESHEETS_APPEND_DATA',
            parameters: {
              spreadsheet_id: '{{config.accounting_sheet_id}}',
              range: 'Invoices!A:H',
              values: [
                ['{{invoice_number}}', '{{current_date}}', '{{client.name}}', '{{totals.subtotal}}', '{{totals.tax}}', '{{totals.total}}', '{{input.due_date}}', 'Sent'],
              ],
            },
          },
          position: { x: 800, y: 250 },
        },
        {
          id: 'end',
          type: 'end',
          label: 'Invoice Sent',
          config: {},
          position: { x: 950, y: 200 },
        },
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'get-client' },
        { id: 'e2', source: 'get-client', target: 'generate-invoice-number' },
        { id: 'e3', source: 'get-client', target: 'calculate-totals' },
        { id: 'e4', source: 'generate-invoice-number', target: 'create-invoice-doc' },
        { id: 'e5', source: 'calculate-totals', target: 'create-invoice-doc' },
        { id: 'e6', source: 'create-invoice-doc', target: 'export-pdf' },
        { id: 'e7', source: 'export-pdf', target: 'send-invoice' },
        { id: 'e8', source: 'export-pdf', target: 'log-invoice' },
        { id: 'e9', source: 'send-invoice', target: 'end' },
        { id: 'e10', source: 'log-invoice', target: 'end' },
      ],
    },

    exampleInput: {
      client_id: 'CLT-001',
      items: [
        { description: 'Web Design Services', quantity: 1, rate: 2000 },
        { description: 'Monthly Hosting', quantity: 3, rate: 50 },
      ],
      due_date: '2025-02-15',
    },
    expectedOutput: 'Invoice INV-XXXX generated, PDF created, emailed to client, logged to accounting spreadsheet',

    complexity: 'intermediate',
    setupTimeMinutes: 25,
    isPopular: true,
    isNew: false,
  },

  // ========================================
  // 4. Social Media Mentions Monitoring
  // ========================================
  {
    id: 'social-media-mentions',
    name: {
      en: 'Social Media Mentions Monitor',
      ar: 'مراقبة الإشارات في وسائل التواصل الاجتماعي',
    },
    description: {
      en: 'Monitor brand mentions on Twitter/X and Instagram, analyze sentiment, notify team, and log for response',
      ar: 'مراقبة إشارات العلامة التجارية على تويتر وإنستغرام، تحليل المشاعر، إشعار الفريق، وتسجيل للرد',
    },
    category: 'social-media',
    icon: '📱',
    tags: ['social-media', 'twitter', 'instagram', 'monitoring', 'sentiment'],

    estimatedTimeSavedPerMonth: '25+ hours',
    estimatedMoneySavedPerMonth: '$500',
    replacesAgencyService: 'Social media monitoring and engagement',

    requiredIntegrations: [
      { name: 'Twitter/X', slug: 'twitter', required: true },
      { name: 'Instagram', slug: 'instagram', required: false },
      { name: 'Slack', slug: 'slack', required: true },
      { name: 'Google Sheets', slug: 'googlesheets', required: true },
    ],

    composioTools: [
      'TWITTER_SEARCH_TWEETS',
      'TWITTER_GET_TWEET',
      'INSTAGRAM_GET_MEDIA',
      'SLACK_SEND_MESSAGE',
      'GOOGLESHEETS_APPEND_DATA',
    ],

    trigger: {
      type: 'schedule',
      config: {
        cron: '*/15 * * * *', // Every 15 minutes
        description: 'Check for new mentions every 15 minutes',
      },
    },

    definition: {
      nodes: [
        {
          id: 'start',
          type: 'start',
          label: 'Scheduled Check',
          config: {
            trigger: 'schedule',
            interval: '15 minutes',
          },
          position: { x: 50, y: 200 },
        },
        {
          id: 'search-twitter',
          type: 'integration',
          label: 'Search Twitter Mentions',
          config: {
            tool: 'TWITTER_SEARCH_TWEETS',
            parameters: {
              query: '{{config.brand_keywords}} OR @{{config.twitter_handle}}',
              max_results: 100,
              since_id: '{{state.last_twitter_id}}',
            },
          },
          position: { x: 200, y: 150 },
        },
        {
          id: 'search-instagram',
          type: 'integration',
          label: 'Search Instagram Mentions',
          config: {
            tool: 'INSTAGRAM_GET_MEDIA',
            parameters: {
              hashtag: '{{config.brand_hashtag}}',
              limit: 50,
            },
          },
          position: { x: 200, y: 250 },
        },
        {
          id: 'analyze-sentiment',
          type: 'ai-agent',
          label: 'Analyze Sentiment',
          config: {
            prompt: `Analyze the sentiment and urgency of these social media mentions:

{{mentions}}

For each mention, provide:
1. Sentiment: Positive / Neutral / Negative / Angry
2. Urgency: Low / Medium / High / Critical
3. Category: Praise / Question / Complaint / Support Request / General
4. Suggested Response Type: Thank / Answer / Apologize / Escalate
5. Key Points (1-2 sentences)

Format as JSON array.`,
            model: 'claude-3-5-sonnet-20241022',
          },
          position: { x: 400, y: 200 },
        },
        {
          id: 'filter-urgent',
          type: 'condition',
          label: 'Filter Urgent Mentions',
          config: {
            conditions: [
              { if: 'analysis.urgency === "Critical" || analysis.urgency === "High"', then: 'urgent_notification' },
              { if: 'analysis.sentiment === "Negative" || analysis.sentiment === "Angry"', then: 'urgent_notification' },
              { else: 'standard_log' },
            ],
          },
          position: { x: 550, y: 200 },
        },
        {
          id: 'urgent-notification',
          type: 'integration',
          label: 'Urgent Slack Alert',
          config: {
            tool: 'SLACK_SEND_MESSAGE',
            parameters: {
              channel: '{{config.urgent_channel}}',
              text: `🚨 *URGENT Social Media Mention!*\n\n*Platform:* {{mention.platform}}\n*User:* @{{mention.username}}\n*Sentiment:* {{analysis.sentiment}}\n*Urgency:* {{analysis.urgency}}\n*Category:* {{analysis.category}}\n\n*Content:*\n> {{mention.text}}\n\n*Suggested Response:* {{analysis.suggested_response}}\n\n🔗 <{{mention.url}}|View Original Post>`,
            },
          },
          position: { x: 700, y: 100 },
        },
        {
          id: 'log-mentions',
          type: 'integration',
          label: 'Log All Mentions',
          config: {
            tool: 'GOOGLESHEETS_APPEND_DATA',
            parameters: {
              spreadsheet_id: '{{config.mentions_sheet_id}}',
              range: 'Mentions!A:J',
              values: '{{mentions_rows}}',
            },
          },
          position: { x: 700, y: 200 },
        },
        {
          id: 'daily-summary',
          type: 'condition',
          label: 'Check Daily Summary Time',
          config: {
            conditions: [
              { if: 'current_hour === 18', then: 'send_summary' },
              { else: 'skip_summary' },
            ],
          },
          position: { x: 700, y: 300 },
        },
        {
          id: 'send-summary',
          type: 'integration',
          label: 'Send Daily Summary',
          config: {
            tool: 'SLACK_SEND_MESSAGE',
            parameters: {
              channel: '{{config.summary_channel}}',
              text: `📊 *Daily Social Media Summary*\n\n*Total Mentions:* {{summary.total}}\n*Positive:* {{summary.positive}} 😊\n*Neutral:* {{summary.neutral}} 😐\n*Negative:* {{summary.negative}} 😞\n\n*Top Topics:*\n{{summary.top_topics}}\n\n*Action Required:* {{summary.pending_responses}} mentions need response`,
            },
          },
          position: { x: 850, y: 300 },
        },
        {
          id: 'end',
          type: 'end',
          label: 'Monitoring Complete',
          config: {},
          position: { x: 950, y: 200 },
        },
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'search-twitter' },
        { id: 'e2', source: 'start', target: 'search-instagram' },
        { id: 'e3', source: 'search-twitter', target: 'analyze-sentiment' },
        { id: 'e4', source: 'search-instagram', target: 'analyze-sentiment' },
        { id: 'e5', source: 'analyze-sentiment', target: 'filter-urgent' },
        { id: 'e6', source: 'filter-urgent', target: 'urgent-notification' },
        { id: 'e7', source: 'filter-urgent', target: 'log-mentions' },
        { id: 'e8', source: 'log-mentions', target: 'daily-summary' },
        { id: 'e9', source: 'daily-summary', target: 'send-summary' },
        { id: 'e10', source: 'urgent-notification', target: 'end' },
        { id: 'e11', source: 'send-summary', target: 'end' },
        { id: 'e12', source: 'log-mentions', target: 'end' },
      ],
    },

    exampleInput: {
      brand_keywords: 'NexusApp OR "Nexus Automation"',
      twitter_handle: 'NexusApp',
      brand_hashtag: 'NexusAutomation',
    },
    expectedOutput: '15 mentions found, 2 urgent (negative sentiment) - team notified on Slack, all logged to spreadsheet',

    complexity: 'intermediate',
    setupTimeMinutes: 20,
    isPopular: true,
    isNew: false,
  },

  // ========================================
  // 5. Customer Support Triage
  // ========================================
  {
    id: 'customer-support-triage',
    name: {
      en: 'Customer Support Triage',
      ar: 'فرز دعم العملاء',
    },
    description: {
      en: 'Automatically categorize support emails with AI, route to appropriate team, and send intelligent auto-responses',
      ar: 'تصنيف رسائل الدعم تلقائياً بالذكاء الاصطناعي، توجيهها للفريق المناسب، وإرسال ردود آلية ذكية',
    },
    category: 'customer-service',
    icon: '🎧',
    tags: ['support', 'customer-service', 'email', 'ai', 'triage'],

    estimatedTimeSavedPerMonth: '50+ hours',
    estimatedMoneySavedPerMonth: '$1,000',
    replacesAgencyService: 'Customer support automation and routing',

    requiredIntegrations: [
      { name: 'Gmail', slug: 'gmail', required: true },
      { name: 'Slack', slug: 'slack', required: true },
      { name: 'Google Sheets', slug: 'googlesheets', required: true },
      { name: 'Zendesk', slug: 'zendesk', required: false },
      { name: 'Freshdesk', slug: 'freshdesk', required: false },
    ],

    composioTools: [
      'GMAIL_LIST_MESSAGES',
      'GMAIL_GET_MESSAGE',
      'GMAIL_SEND_EMAIL',
      'GMAIL_ADD_LABEL',
      'SLACK_SEND_MESSAGE',
      'GOOGLESHEETS_APPEND_DATA',
      'ZENDESK_CREATE_TICKET',
    ],

    trigger: {
      type: 'event',
      config: {
        source: 'gmail',
        event: 'message.received',
        filter: { to: 'support@*' },
      },
    },

    definition: {
      nodes: [
        {
          id: 'start',
          type: 'start',
          label: 'New Support Email',
          config: {
            trigger: 'email_received',
            filter: 'to:support@',
          },
          position: { x: 50, y: 200 },
        },
        {
          id: 'get-email',
          type: 'integration',
          label: 'Get Email Content',
          config: {
            tool: 'GMAIL_GET_MESSAGE',
            parameters: {
              message_id: '{{trigger.message_id}}',
              format: 'full',
            },
          },
          position: { x: 200, y: 200 },
        },
        {
          id: 'classify-ticket',
          type: 'ai-agent',
          label: 'AI Classification',
          config: {
            prompt: `Analyze this customer support email and classify it:

From: {{email.from}}
Subject: {{email.subject}}
Body: {{email.body}}

Provide classification in JSON format:
{
  "category": "Technical | Billing | Sales | Account | General | Spam",
  "priority": "Critical | High | Medium | Low",
  "sentiment": "Positive | Neutral | Frustrated | Angry",
  "language": "en | ar | other",
  "requires_human": true/false,
  "department": "Engineering | Finance | Sales | Customer Success | General",
  "issue_summary": "1-2 sentence summary",
  "suggested_response": "Draft response if auto-reply appropriate",
  "tags": ["tag1", "tag2"],
  "estimated_resolution_time": "minutes/hours/days"
}`,
            model: 'claude-3-5-sonnet-20241022',
          },
          position: { x: 350, y: 200 },
        },
        {
          id: 'check-auto-reply',
          type: 'condition',
          label: 'Can Auto-Reply?',
          config: {
            conditions: [
              { if: 'classification.requires_human === false && classification.category !== "Spam"', then: 'send_auto_reply' },
              { if: 'classification.priority === "Critical"', then: 'urgent_escalation' },
              { else: 'standard_routing' },
            ],
          },
          position: { x: 500, y: 200 },
        },
        {
          id: 'send-auto-reply',
          type: 'integration',
          label: 'Send Auto-Reply',
          config: {
            tool: 'GMAIL_SEND_EMAIL',
            parameters: {
              to: '{{email.from}}',
              subject: 'Re: {{email.subject}}',
              body: '{{classification.suggested_response}}\n\n---\nTicket #{{ticket_id}}\nThis is an automated response. A human will review if needed.',
              in_reply_to: '{{email.message_id}}',
            },
          },
          position: { x: 650, y: 100 },
        },
        {
          id: 'urgent-escalation',
          type: 'integration',
          label: 'Urgent Escalation',
          config: {
            tool: 'SLACK_SEND_MESSAGE',
            parameters: {
              channel: '{{config.urgent_support_channel}}',
              text: `🚨 *CRITICAL SUPPORT TICKET*\n\n*From:* {{email.from}}\n*Subject:* {{email.subject}}\n*Priority:* {{classification.priority}}\n*Sentiment:* {{classification.sentiment}}\n\n*Summary:*\n{{classification.issue_summary}}\n\n*Department:* {{classification.department}}\n\n<@{{on_call_rep}}> Please respond immediately.\n\n🔗 <{{email.link}}|View Email>`,
            },
          },
          position: { x: 650, y: 200 },
        },
        {
          id: 'standard-routing',
          type: 'integration',
          label: 'Route to Team',
          config: {
            tool: 'SLACK_SEND_MESSAGE',
            parameters: {
              channel: '{{department_channel}}',
              text: `📧 *New Support Ticket*\n\n*From:* {{email.from}}\n*Subject:* {{email.subject}}\n*Category:* {{classification.category}}\n*Priority:* {{classification.priority}}\n\n*Summary:*\n{{classification.issue_summary}}\n\n*Est. Resolution:* {{classification.estimated_resolution_time}}\n\n🔗 <{{email.link}}|View Email>`,
            },
          },
          position: { x: 650, y: 300 },
        },
        {
          id: 'label-email',
          type: 'integration',
          label: 'Apply Gmail Labels',
          config: {
            tool: 'GMAIL_ADD_LABEL',
            parameters: {
              message_id: '{{email.message_id}}',
              labels: ['Support', '{{classification.category}}', '{{classification.priority}}'],
            },
          },
          position: { x: 800, y: 150 },
        },
        {
          id: 'log-ticket',
          type: 'integration',
          label: 'Log to Tracking Sheet',
          config: {
            tool: 'GOOGLESHEETS_APPEND_DATA',
            parameters: {
              spreadsheet_id: '{{config.support_sheet_id}}',
              range: 'Tickets!A:L',
              values: [
                ['{{ticket_id}}', '{{timestamp}}', '{{email.from}}', '{{email.subject}}', '{{classification.category}}', '{{classification.priority}}', '{{classification.sentiment}}', '{{classification.department}}', '{{classification.issue_summary}}', 'Open', '', ''],
              ],
            },
          },
          position: { x: 800, y: 250 },
        },
        {
          id: 'end',
          type: 'end',
          label: 'Ticket Processed',
          config: {},
          position: { x: 950, y: 200 },
        },
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'get-email' },
        { id: 'e2', source: 'get-email', target: 'classify-ticket' },
        { id: 'e3', source: 'classify-ticket', target: 'check-auto-reply' },
        { id: 'e4', source: 'check-auto-reply', target: 'send-auto-reply' },
        { id: 'e5', source: 'check-auto-reply', target: 'urgent-escalation' },
        { id: 'e6', source: 'check-auto-reply', target: 'standard-routing' },
        { id: 'e7', source: 'send-auto-reply', target: 'label-email' },
        { id: 'e8', source: 'urgent-escalation', target: 'label-email' },
        { id: 'e9', source: 'standard-routing', target: 'label-email' },
        { id: 'e10', source: 'label-email', target: 'log-ticket' },
        { id: 'e11', source: 'log-ticket', target: 'end' },
      ],
    },

    exampleInput: {
      from: 'customer@example.com',
      subject: 'Cannot login to my account - URGENT',
      body: 'I have been trying to login for the past hour but keep getting an error. This is affecting my business!',
    },
    expectedOutput: 'Email classified as Technical/High/Frustrated, escalated to #support-urgent, labeled, logged to tracking sheet',

    complexity: 'advanced',
    setupTimeMinutes: 30,
    isPopular: true,
    isNew: false,
  },

  // ========================================
  // 6. Weekly Report Generator
  // ========================================
  {
    id: 'weekly-report-generator',
    name: {
      en: 'Weekly Report Generator',
      ar: 'مولد التقارير الأسبوعية',
    },
    description: {
      en: 'Automatically aggregate data from multiple sources, generate a professional PDF report, and email to stakeholders every Friday',
      ar: 'تجميع البيانات تلقائياً من مصادر متعددة، إنشاء تقرير PDF احترافي، وإرساله بالبريد الإلكتروني لأصحاب المصلحة كل جمعة',
    },
    category: 'reporting',
    icon: '📊',
    tags: ['reports', 'analytics', 'weekly', 'pdf', 'automation'],

    estimatedTimeSavedPerMonth: '16+ hours',
    estimatedMoneySavedPerMonth: '$320',
    replacesAgencyService: 'Business intelligence and reporting',

    requiredIntegrations: [
      { name: 'Google Sheets', slug: 'googlesheets', required: true },
      { name: 'Google Analytics', slug: 'googleanalytics', required: false },
      { name: 'Google Docs', slug: 'googledocs', required: true },
      { name: 'Gmail', slug: 'gmail', required: true },
      { name: 'Slack', slug: 'slack', required: false },
    ],

    composioTools: [
      'GOOGLESHEETS_READ_DATA',
      'GOOGLEANALYTICS_GET_REPORT',
      'GOOGLEDOCS_CREATE_DOCUMENT',
      'GOOGLEDRIVE_EXPORT_PDF',
      'GMAIL_SEND_EMAIL',
      'SLACK_SEND_MESSAGE',
    ],

    trigger: {
      type: 'schedule',
      config: {
        cron: '0 17 * * 5', // Every Friday at 5 PM
        timezone: 'UTC',
        description: 'Every Friday at 5 PM',
      },
    },

    definition: {
      nodes: [
        {
          id: 'start',
          type: 'start',
          label: 'Friday 5 PM',
          config: {
            trigger: 'schedule',
            cron: '0 17 * * 5',
          },
          position: { x: 50, y: 200 },
        },
        {
          id: 'get-sales-data',
          type: 'integration',
          label: 'Get Sales Data',
          config: {
            tool: 'GOOGLESHEETS_READ_DATA',
            parameters: {
              spreadsheet_id: '{{config.sales_sheet_id}}',
              range: 'Sales!A:G',
              filter: 'date >= {{week_start}} AND date <= {{week_end}}',
            },
          },
          position: { x: 200, y: 100 },
        },
        {
          id: 'get-support-data',
          type: 'integration',
          label: 'Get Support Data',
          config: {
            tool: 'GOOGLESHEETS_READ_DATA',
            parameters: {
              spreadsheet_id: '{{config.support_sheet_id}}',
              range: 'Tickets!A:L',
              filter: 'date >= {{week_start}} AND date <= {{week_end}}',
            },
          },
          position: { x: 200, y: 200 },
        },
        {
          id: 'get-analytics',
          type: 'integration',
          label: 'Get Website Analytics',
          config: {
            tool: 'GOOGLEANALYTICS_GET_REPORT',
            parameters: {
              property_id: '{{config.ga_property_id}}',
              start_date: '{{week_start}}',
              end_date: '{{week_end}}',
              metrics: ['sessions', 'users', 'pageviews', 'bounceRate', 'avgSessionDuration'],
              dimensions: ['source', 'medium'],
            },
          },
          position: { x: 200, y: 300 },
        },
        {
          id: 'analyze-data',
          type: 'ai-agent',
          label: 'AI Analysis',
          config: {
            prompt: `Analyze this week's business data and provide insights:

SALES DATA:
{{sales_data}}

SUPPORT TICKETS:
{{support_data}}

WEBSITE ANALYTICS:
{{analytics_data}}

Generate a comprehensive weekly report including:

1. **Executive Summary** (3-4 bullet points of key insights)

2. **Sales Performance**
   - Total revenue this week vs last week
   - Number of orders
   - Average order value
   - Top selling products
   - Sales trends and anomalies

3. **Customer Support**
   - Total tickets received
   - Average response time
   - Resolution rate
   - Common issues
   - Customer satisfaction indicators

4. **Website Performance**
   - Total visitors
   - Traffic sources
   - Conversion rate
   - Bounce rate changes
   - Top pages

5. **Key Insights & Recommendations**
   - What worked well
   - Areas for improvement
   - Recommended actions for next week

6. **Week-over-Week Comparison Table**

Format as clean HTML suitable for a professional report.`,
            model: 'claude-3-5-sonnet-20241022',
          },
          position: { x: 400, y: 200 },
        },
        {
          id: 'create-report-doc',
          type: 'integration',
          label: 'Create Report Document',
          config: {
            tool: 'GOOGLEDOCS_CREATE_DOCUMENT',
            parameters: {
              title: 'Weekly Business Report - {{week_start}} to {{week_end}}',
              content: '{{analysis.report_html}}',
              template_id: '{{config.report_template_id}}',
            },
          },
          position: { x: 550, y: 200 },
        },
        {
          id: 'export-pdf',
          type: 'integration',
          label: 'Export as PDF',
          config: {
            tool: 'GOOGLEDRIVE_EXPORT_PDF',
            parameters: {
              document_id: '{{report_doc.id}}',
              folder_id: '{{config.reports_folder_id}}',
              filename: 'Weekly_Report_{{week_end}}.pdf',
            },
          },
          position: { x: 700, y: 200 },
        },
        {
          id: 'email-stakeholders',
          type: 'integration',
          label: 'Email Stakeholders',
          config: {
            tool: 'GMAIL_SEND_EMAIL',
            parameters: {
              to: '{{config.stakeholder_emails}}',
              subject: '📊 Weekly Business Report - {{week_end}}',
              body: `Hi Team,

Please find attached this week's business report.

**Quick Highlights:**
{{analysis.executive_summary}}

Full details in the attached PDF.

Best regards,
Nexus Automation`,
              attachments: ['{{pdf_file.url}}'],
            },
          },
          position: { x: 850, y: 150 },
        },
        {
          id: 'notify-slack',
          type: 'integration',
          label: 'Notify on Slack',
          config: {
            tool: 'SLACK_SEND_MESSAGE',
            parameters: {
              channel: '{{config.reports_channel}}',
              text: `📊 *Weekly Report Generated*\n\nReport for {{week_start}} - {{week_end}} is ready!\n\n*Quick Stats:*\n• Revenue: {{analysis.total_revenue}}\n• Orders: {{analysis.total_orders}}\n• Support Tickets: {{analysis.total_tickets}}\n• Website Visitors: {{analysis.total_visitors}}\n\n📎 Report sent to stakeholders.\n🔗 <{{pdf_file.url}}|View Report>`,
            },
          },
          position: { x: 850, y: 250 },
        },
        {
          id: 'end',
          type: 'end',
          label: 'Report Delivered',
          config: {},
          position: { x: 1000, y: 200 },
        },
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'get-sales-data' },
        { id: 'e2', source: 'start', target: 'get-support-data' },
        { id: 'e3', source: 'start', target: 'get-analytics' },
        { id: 'e4', source: 'get-sales-data', target: 'analyze-data' },
        { id: 'e5', source: 'get-support-data', target: 'analyze-data' },
        { id: 'e6', source: 'get-analytics', target: 'analyze-data' },
        { id: 'e7', source: 'analyze-data', target: 'create-report-doc' },
        { id: 'e8', source: 'create-report-doc', target: 'export-pdf' },
        { id: 'e9', source: 'export-pdf', target: 'email-stakeholders' },
        { id: 'e10', source: 'export-pdf', target: 'notify-slack' },
        { id: 'e11', source: 'email-stakeholders', target: 'end' },
        { id: 'e12', source: 'notify-slack', target: 'end' },
      ],
    },

    exampleInput: {
      week_start: '2025-01-06',
      week_end: '2025-01-12',
      stakeholder_emails: 'ceo@company.com, cfo@company.com, ops@company.com',
    },
    expectedOutput: 'AI-analyzed report with sales/support/analytics insights, PDF generated, emailed to 3 stakeholders, Slack notification sent',

    complexity: 'advanced',
    setupTimeMinutes: 35,
    isPopular: true,
    isNew: true,
  },

  // ========================================
  // 7. Appointment Reminders
  // ========================================
  {
    id: 'appointment-reminders',
    name: {
      en: 'Appointment Reminders',
      ar: 'تذكيرات المواعيد',
    },
    description: {
      en: 'Send automated SMS/WhatsApp reminders before appointments with confirmation options',
      ar: 'إرسال تذكيرات آلية عبر الرسائل النصية/واتساب قبل المواعيد مع خيارات التأكيد',
    },
    category: 'scheduling',
    icon: '📅',
    tags: ['appointments', 'reminders', 'sms', 'whatsapp', 'calendar'],

    estimatedTimeSavedPerMonth: '15+ hours',
    estimatedMoneySavedPerMonth: '$300',
    replacesAgencyService: 'Appointment reminder service',

    requiredIntegrations: [
      { name: 'Google Calendar', slug: 'googlecalendar', required: true },
      { name: 'Twilio SMS', slug: 'twilio', required: false },
      { name: 'WhatsApp', slug: 'whatsapp', required: false },
      { name: 'Gmail', slug: 'gmail', required: true },
      { name: 'Google Sheets', slug: 'googlesheets', required: true },
    ],

    composioTools: [
      'GOOGLECALENDAR_LIST_EVENTS',
      'GOOGLECALENDAR_GET_EVENT',
      'TWILIO_SEND_SMS',
      'WHATSAPP_SEND_MESSAGE',
      'GMAIL_SEND_EMAIL',
      'GOOGLESHEETS_APPEND_DATA',
      'GOOGLESHEETS_UPDATE_DATA',
    ],

    trigger: {
      type: 'schedule',
      config: {
        cron: '0 9 * * *', // Every day at 9 AM
        description: 'Check appointments daily at 9 AM',
      },
    },

    definition: {
      nodes: [
        {
          id: 'start',
          type: 'start',
          label: 'Daily 9 AM Check',
          config: {
            trigger: 'schedule',
            cron: '0 9 * * *',
          },
          position: { x: 50, y: 200 },
        },
        {
          id: 'get-appointments',
          type: 'integration',
          label: 'Get Tomorrow\'s Appointments',
          config: {
            tool: 'GOOGLECALENDAR_LIST_EVENTS',
            parameters: {
              calendar_id: '{{config.calendar_id}}',
              time_min: '{{tomorrow_start}}',
              time_max: '{{tomorrow_end}}',
              single_events: true,
              order_by: 'startTime',
            },
          },
          position: { x: 200, y: 200 },
        },
        {
          id: 'filter-reminders',
          type: 'transform',
          label: 'Filter Already Reminded',
          config: {
            operations: [
              { type: 'filter', config: { condition: 'event.reminder_sent !== true' } },
            ],
          },
          position: { x: 350, y: 200 },
        },
        {
          id: 'get-client-preferences',
          type: 'integration',
          label: 'Get Client Preferences',
          config: {
            tool: 'GOOGLESHEETS_READ_DATA',
            parameters: {
              spreadsheet_id: '{{config.clients_sheet_id}}',
              range: 'Clients!A:F',
            },
          },
          position: { x: 500, y: 200 },
        },
        {
          id: 'choose-channel',
          type: 'condition',
          label: 'Choose Reminder Channel',
          config: {
            conditions: [
              { if: 'client.preferred_channel === "whatsapp"', then: 'send_whatsapp' },
              { if: 'client.preferred_channel === "sms"', then: 'send_sms' },
              { else: 'send_email' },
            ],
          },
          position: { x: 650, y: 200 },
        },
        {
          id: 'send-whatsapp',
          type: 'integration',
          label: 'Send WhatsApp Reminder',
          config: {
            tool: 'WHATSAPP_SEND_MESSAGE',
            parameters: {
              to: '{{client.phone}}',
              template: 'appointment_reminder',
              parameters: {
                name: '{{client.name}}',
                service: '{{appointment.service}}',
                date: '{{appointment.date_formatted}}',
                time: '{{appointment.time_formatted}}',
                location: '{{config.business_address}}',
              },
            },
          },
          position: { x: 800, y: 100 },
        },
        {
          id: 'send-sms',
          type: 'integration',
          label: 'Send SMS Reminder',
          config: {
            tool: 'TWILIO_SEND_SMS',
            parameters: {
              to: '{{client.phone}}',
              body: 'Hi {{client.first_name}}! Reminder: Your {{appointment.service}} appointment is tomorrow at {{appointment.time_formatted}}. Reply YES to confirm or RESCHEDULE to change. - {{config.business_name}}',
              from: '{{config.twilio_number}}',
            },
          },
          position: { x: 800, y: 200 },
        },
        {
          id: 'send-email',
          type: 'integration',
          label: 'Send Email Reminder',
          config: {
            tool: 'GMAIL_SEND_EMAIL',
            parameters: {
              to: '{{client.email}}',
              subject: 'Reminder: Your appointment tomorrow at {{appointment.time_formatted}}',
              body: `Hi {{client.name}},

This is a friendly reminder about your upcoming appointment:

📅 **Date:** {{appointment.date_formatted}}
⏰ **Time:** {{appointment.time_formatted}}
📍 **Location:** {{config.business_address}}
🎯 **Service:** {{appointment.service}}

**Please confirm your attendance by replying to this email or clicking below:**
[Confirm Appointment]({{confirm_link}})
[Reschedule]({{reschedule_link}})

If you need to cancel, please let us know at least 24 hours in advance.

See you soon!
{{config.business_name}}`,
            },
          },
          position: { x: 800, y: 300 },
        },
        {
          id: 'log-reminder',
          type: 'integration',
          label: 'Log Reminder Sent',
          config: {
            tool: 'GOOGLESHEETS_APPEND_DATA',
            parameters: {
              spreadsheet_id: '{{config.reminders_log_sheet_id}}',
              range: 'Reminders!A:F',
              values: [
                ['{{timestamp}}', '{{client.name}}', '{{client.contact}}', '{{appointment.date_formatted}} {{appointment.time_formatted}}', '{{channel_used}}', 'Sent'],
              ],
            },
          },
          position: { x: 950, y: 200 },
        },
        {
          id: 'end',
          type: 'end',
          label: 'Reminders Sent',
          config: {},
          position: { x: 1100, y: 200 },
        },
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'get-appointments' },
        { id: 'e2', source: 'get-appointments', target: 'filter-reminders' },
        { id: 'e3', source: 'filter-reminders', target: 'get-client-preferences' },
        { id: 'e4', source: 'get-client-preferences', target: 'choose-channel' },
        { id: 'e5', source: 'choose-channel', target: 'send-whatsapp' },
        { id: 'e6', source: 'choose-channel', target: 'send-sms' },
        { id: 'e7', source: 'choose-channel', target: 'send-email' },
        { id: 'e8', source: 'send-whatsapp', target: 'log-reminder' },
        { id: 'e9', source: 'send-sms', target: 'log-reminder' },
        { id: 'e10', source: 'send-email', target: 'log-reminder' },
        { id: 'e11', source: 'log-reminder', target: 'end' },
      ],
    },

    exampleInput: {
      calendar_id: 'appointments@company.com',
      business_name: 'Wellness Clinic',
      business_address: '123 Health Street, Dubai, UAE',
    },
    expectedOutput: '12 appointments found for tomorrow, reminders sent (5 WhatsApp, 4 SMS, 3 Email), all logged to tracking sheet',

    complexity: 'intermediate',
    setupTimeMinutes: 25,
    isPopular: true,
    isNew: false,
  },

  // ========================================
  // 8. Inventory Low Stock Alerts
  // ========================================
  {
    id: 'inventory-low-stock-alerts',
    name: {
      en: 'Inventory Low Stock Alerts',
      ar: 'تنبيهات انخفاض المخزون',
    },
    description: {
      en: 'Monitor inventory levels and automatically alert when stock is low, with AI-powered reorder suggestions',
      ar: 'مراقبة مستويات المخزون وإرسال تنبيهات تلقائية عند انخفاض المخزون، مع اقتراحات إعادة الطلب بالذكاء الاصطناعي',
    },
    category: 'ecommerce',
    icon: '📦',
    tags: ['inventory', 'stock', 'alerts', 'ecommerce', 'supply-chain'],

    estimatedTimeSavedPerMonth: '10+ hours',
    estimatedMoneySavedPerMonth: '$200 + prevented stockouts',
    replacesAgencyService: 'Inventory management automation',

    requiredIntegrations: [
      { name: 'Google Sheets', slug: 'googlesheets', required: true },
      { name: 'Shopify', slug: 'shopify', required: false },
      { name: 'Slack', slug: 'slack', required: true },
      { name: 'Gmail', slug: 'gmail', required: true },
    ],

    composioTools: [
      'GOOGLESHEETS_READ_DATA',
      'SHOPIFY_LIST_PRODUCTS',
      'SHOPIFY_GET_INVENTORY',
      'SLACK_SEND_MESSAGE',
      'GMAIL_SEND_EMAIL',
      'GOOGLESHEETS_UPDATE_DATA',
    ],

    trigger: {
      type: 'schedule',
      config: {
        cron: '0 8 * * *', // Every day at 8 AM
        description: 'Check inventory daily at 8 AM',
      },
    },

    definition: {
      nodes: [
        {
          id: 'start',
          type: 'start',
          label: 'Daily Inventory Check',
          config: {
            trigger: 'schedule',
            cron: '0 8 * * *',
          },
          position: { x: 50, y: 200 },
        },
        {
          id: 'get-inventory',
          type: 'integration',
          label: 'Get Current Inventory',
          config: {
            tool: 'GOOGLESHEETS_READ_DATA',
            fallback: 'SHOPIFY_GET_INVENTORY',
            parameters: {
              spreadsheet_id: '{{config.inventory_sheet_id}}',
              range: 'Inventory!A:H',
            },
          },
          position: { x: 200, y: 200 },
        },
        {
          id: 'check-levels',
          type: 'transform',
          label: 'Check Stock Levels',
          config: {
            operations: [
              {
                type: 'filter',
                config: {
                  condition: 'item.quantity <= item.reorder_point',
                },
              },
              {
                type: 'map',
                config: {
                  urgency: 'item.quantity <= item.critical_level ? "CRITICAL" : "LOW"',
                },
              },
            ],
          },
          position: { x: 350, y: 200 },
        },
        {
          id: 'ai-analysis',
          type: 'ai-agent',
          label: 'AI Reorder Analysis',
          config: {
            prompt: `Analyze these low stock items and provide reorder recommendations:

LOW STOCK ITEMS:
{{low_stock_items}}

HISTORICAL SALES DATA:
{{sales_velocity}}

For each item, provide:
1. Recommended reorder quantity (based on sales velocity and lead time)
2. Urgency level (CRITICAL / HIGH / MEDIUM)
3. Estimated days until stockout
4. Suggested supplier (if multiple available)
5. Estimated reorder cost

Also provide:
- Total estimated reorder cost
- Priority order (which items to order first)
- Any bundling recommendations to save on shipping

Format as JSON.`,
            model: 'claude-3-5-sonnet-20241022',
          },
          position: { x: 500, y: 200 },
        },
        {
          id: 'check-critical',
          type: 'condition',
          label: 'Check for Critical Items',
          config: {
            conditions: [
              { if: 'analysis.critical_items.length > 0', then: 'urgent_alert' },
              { else: 'standard_alert' },
            ],
          },
          position: { x: 650, y: 200 },
        },
        {
          id: 'urgent-alert',
          type: 'integration',
          label: 'Send Urgent Alert',
          config: {
            tool: 'SLACK_SEND_MESSAGE',
            parameters: {
              channel: '{{config.urgent_channel}}',
              text: '🚨 *CRITICAL INVENTORY ALERT*\n\n{{analysis.critical_items.length}} items are critically low!\n\n{{#each analysis.critical_items}}\n• *{{name}}*: {{quantity}} left ({{days_until_stockout}} days to stockout)\n  Reorder: {{reorder_quantity}} units @ ${{cost}}\n{{/each}}\n\n*Total Urgent Reorder Cost:* ${{analysis.critical_total}}\n\n<@{{inventory_manager}}> Immediate action required!',
            },
          },
          position: { x: 800, y: 100 },
        },
        {
          id: 'standard-alert',
          type: 'integration',
          label: 'Send Standard Alert',
          config: {
            tool: 'SLACK_SEND_MESSAGE',
            parameters: {
              channel: '{{config.inventory_channel}}',
              text: '📦 *Daily Inventory Report*\n\n*Low Stock Items:* {{analysis.low_stock_count}}\n\n{{#each analysis.low_stock_items}}\n• {{name}}: {{quantity}} remaining\n  Suggested reorder: {{reorder_quantity}} units\n{{/each}}\n\n*Estimated Reorder Total:* ${{analysis.total_reorder_cost}}\n\n🔗 <{{spreadsheet_url}}|View Full Inventory>',
            },
          },
          position: { x: 800, y: 200 },
        },
        {
          id: 'email-summary',
          type: 'integration',
          label: 'Email to Purchasing',
          config: {
            tool: 'GMAIL_SEND_EMAIL',
            parameters: {
              to: '{{config.purchasing_email}}',
              subject: '📦 Inventory Reorder Report - {{date}}',
              body: 'Inventory Reorder Report\n\n{{analysis.summary}}\n\nRECOMMENDED ORDERS:\n{{#each analysis.reorder_recommendations}}\n- {{name}}: {{quantity}} units from {{supplier}} = ${{cost}}\n{{/each}}\n\nTOTAL ESTIMATED COST: ${{analysis.total_reorder_cost}}\n\nPlease review and process orders as needed.',
            },
          },
          position: { x: 800, y: 300 },
        },
        {
          id: 'update-log',
          type: 'integration',
          label: 'Log Alert',
          config: {
            tool: 'GOOGLESHEETS_APPEND_DATA',
            parameters: {
              spreadsheet_id: '{{config.alerts_log_sheet_id}}',
              range: 'InventoryAlerts!A:E',
              values: [
                ['{{timestamp}}', '{{analysis.low_stock_count}}', '{{analysis.critical_count}}', '{{analysis.total_reorder_cost}}', 'Sent'],
              ],
            },
          },
          position: { x: 950, y: 200 },
        },
        {
          id: 'end',
          type: 'end',
          label: 'Check Complete',
          config: {},
          position: { x: 1100, y: 200 },
        },
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'get-inventory' },
        { id: 'e2', source: 'get-inventory', target: 'check-levels' },
        { id: 'e3', source: 'check-levels', target: 'ai-analysis' },
        { id: 'e4', source: 'ai-analysis', target: 'check-critical' },
        { id: 'e5', source: 'check-critical', target: 'urgent-alert' },
        { id: 'e6', source: 'check-critical', target: 'standard-alert' },
        { id: 'e7', source: 'urgent-alert', target: 'email-summary' },
        { id: 'e8', source: 'standard-alert', target: 'email-summary' },
        { id: 'e9', source: 'email-summary', target: 'update-log' },
        { id: 'e10', source: 'update-log', target: 'end' },
      ],
    },

    exampleInput: {
      inventory_sheet_id: 'abc123',
      low_stock_threshold: 10,
      critical_threshold: 5,
    },
    expectedOutput: '3 low stock items detected (1 critical), AI suggested reorder of 150 units totaling $450, urgent Slack alert sent, email to purchasing',

    complexity: 'intermediate',
    setupTimeMinutes: 20,
    isPopular: false,
    isNew: true,
  },

  // ========================================
  // 9. New Employee Onboarding
  // ========================================
  {
    id: 'employee-onboarding',
    name: {
      en: 'New Employee Onboarding',
      ar: 'تأهيل الموظفين الجدد',
    },
    description: {
      en: 'Automate the new hire onboarding process: create accounts, send welcome materials, schedule training, and track completion',
      ar: 'أتمتة عملية تأهيل الموظفين الجدد: إنشاء الحسابات، إرسال مواد الترحيب، جدولة التدريب، وتتبع الإنجاز',
    },
    category: 'operations',
    icon: '👋',
    tags: ['hr', 'onboarding', 'employees', 'training', 'automation'],

    estimatedTimeSavedPerMonth: '20+ hours',
    estimatedMoneySavedPerMonth: '$400',
    replacesAgencyService: 'HR onboarding automation',

    requiredIntegrations: [
      { name: 'Google Workspace', slug: 'googleworkspace', required: true },
      { name: 'Google Calendar', slug: 'googlecalendar', required: true },
      { name: 'Gmail', slug: 'gmail', required: true },
      { name: 'Slack', slug: 'slack', required: true },
      { name: 'Google Drive', slug: 'googledrive', required: true },
      { name: 'Google Sheets', slug: 'googlesheets', required: true },
    ],

    composioTools: [
      'GOOGLEWORKSPACE_CREATE_USER',
      'GOOGLEWORKSPACE_ADD_TO_GROUP',
      'GOOGLECALENDAR_CREATE_EVENT',
      'GMAIL_SEND_EMAIL',
      'SLACK_INVITE_USER',
      'SLACK_SEND_MESSAGE',
      'GOOGLEDRIVE_SHARE_FILE',
      'GOOGLESHEETS_APPEND_DATA',
    ],

    trigger: {
      type: 'manual',
      config: {
        buttonLabel: 'Start Onboarding',
        requiredFields: ['employee_name', 'email', 'department', 'start_date', 'manager_email'],
      },
    },

    definition: {
      nodes: [
        {
          id: 'start',
          type: 'start',
          label: 'New Hire Added',
          config: {
            trigger: 'manual',
          },
          position: { x: 50, y: 200 },
        },
        {
          id: 'create-accounts',
          type: 'integration',
          label: 'Create Google Account',
          config: {
            tool: 'GOOGLEWORKSPACE_CREATE_USER',
            parameters: {
              primary_email: '{{input.email}}',
              name: {
                given_name: '{{input.first_name}}',
                family_name: '{{input.last_name}}',
              },
              org_unit_path: '/{{input.department}}',
              password: '{{generated_temp_password}}',
              change_password_at_next_login: true,
            },
          },
          position: { x: 200, y: 100 },
        },
        {
          id: 'add-to-groups',
          type: 'integration',
          label: 'Add to Groups',
          config: {
            tool: 'GOOGLEWORKSPACE_ADD_TO_GROUP',
            parameters: {
              user_email: '{{input.email}}',
              groups: ['all-staff@{{domain}}', '{{input.department}}@{{domain}}'],
            },
          },
          position: { x: 350, y: 100 },
        },
        {
          id: 'invite-slack',
          type: 'integration',
          label: 'Invite to Slack',
          config: {
            tool: 'SLACK_INVITE_USER',
            parameters: {
              email: '{{input.email}}',
              channels: ['general', 'announcements', '{{input.department}}'],
            },
          },
          position: { x: 200, y: 200 },
        },
        {
          id: 'share-onboarding-docs',
          type: 'integration',
          label: 'Share Onboarding Docs',
          config: {
            tool: 'GOOGLEDRIVE_SHARE_FILE',
            parameters: {
              file_id: '{{config.onboarding_folder_id}}',
              email: '{{input.email}}',
              role: 'reader',
              send_notification: true,
            },
          },
          position: { x: 350, y: 200 },
        },
        {
          id: 'schedule-training',
          type: 'integration',
          label: 'Schedule Training Sessions',
          config: {
            tool: 'GOOGLECALENDAR_CREATE_EVENT',
            parameters: {
              calendar_id: '{{input.email}}',
              events: [
                {
                  summary: 'Day 1: Company Orientation',
                  start: '{{input.start_date}}T09:00:00',
                  duration: '2h',
                  attendees: ['{{input.email}}', '{{config.hr_email}}'],
                },
                {
                  summary: 'Day 1: IT Setup & Security Training',
                  start: '{{input.start_date}}T11:00:00',
                  duration: '1h',
                  attendees: ['{{input.email}}', '{{config.it_email}}'],
                },
                {
                  summary: 'Day 1: Meet Your Manager',
                  start: '{{input.start_date}}T14:00:00',
                  duration: '1h',
                  attendees: ['{{input.email}}', '{{input.manager_email}}'],
                },
                {
                  summary: 'Day 2: Department Training',
                  start: '{{start_date_plus_1}}T10:00:00',
                  duration: '3h',
                  attendees: ['{{input.email}}', '{{input.manager_email}}'],
                },
              ],
            },
          },
          position: { x: 500, y: 200 },
        },
        {
          id: 'send-welcome-email',
          type: 'integration',
          label: 'Send Welcome Email',
          config: {
            tool: 'GMAIL_SEND_EMAIL',
            parameters: {
              to: '{{input.email}}',
              cc: '{{input.manager_email}}',
              subject: 'Welcome to {{config.company_name}}! 🎉',
              body: `Dear {{input.first_name}},

Welcome to the {{config.company_name}} team! We're thrilled to have you join us.

**Your First Day: {{input.start_date}}**

Here's what you need to know:

📧 **Email Access**
Your email: {{input.email}}
Temporary password: {{temp_password}}
(You'll be prompted to change this on first login)

💬 **Slack**
You've been invited to our Slack workspace. Check your email for the invitation.

📁 **Onboarding Documents**
We've shared important documents with you in Google Drive. Please review:
- Employee Handbook
- IT Security Policy
- Benefits Overview

📅 **Your First Week Schedule**
- Day 1, 9 AM: Company Orientation
- Day 1, 11 AM: IT Setup & Security Training
- Day 1, 2 PM: Meet Your Manager ({{input.manager_name}})
- Day 2, 10 AM: Department Training

👤 **Your Manager**
{{input.manager_name}} ({{input.manager_email}})

If you have any questions before your start date, don't hesitate to reach out!

Best regards,
The HR Team
{{config.company_name}}`,
            },
          },
          position: { x: 650, y: 100 },
        },
        {
          id: 'notify-manager',
          type: 'integration',
          label: 'Notify Manager',
          config: {
            tool: 'SLACK_SEND_MESSAGE',
            parameters: {
              channel: '{{manager_slack_dm}}',
              text: `👋 *New Team Member Alert!*\n\n*{{input.first_name}} {{input.last_name}}* is joining your team on *{{input.start_date}}*.\n\n*Email:* {{input.email}}\n*Department:* {{input.department}}\n\n✅ Their accounts have been created\n✅ Training sessions are scheduled\n✅ Onboarding docs have been shared\n\nPlease be ready for your 1:1 at 2 PM on their first day.`,
            },
          },
          position: { x: 650, y: 200 },
        },
        {
          id: 'announce-team',
          type: 'integration',
          label: 'Announce to Team',
          config: {
            tool: 'SLACK_SEND_MESSAGE',
            parameters: {
              channel: '{{input.department}}',
              text: `🎉 *New Team Member Joining!*\n\nPlease welcome *{{input.first_name}} {{input.last_name}}* who will be joining us on *{{input.start_date}}*!\n\n{{input.bio}}\n\nLet's give them a warm welcome! 👋`,
            },
          },
          position: { x: 650, y: 300 },
        },
        {
          id: 'log-onboarding',
          type: 'integration',
          label: 'Log to HR Tracker',
          config: {
            tool: 'GOOGLESHEETS_APPEND_DATA',
            parameters: {
              spreadsheet_id: '{{config.hr_sheet_id}}',
              range: 'Onboarding!A:H',
              values: [
                ['{{input.first_name}} {{input.last_name}}', '{{input.email}}', '{{input.department}}', '{{input.start_date}}', '{{input.manager_name}}', '{{timestamp}}', 'In Progress', ''],
              ],
            },
          },
          position: { x: 800, y: 200 },
        },
        {
          id: 'end',
          type: 'end',
          label: 'Onboarding Started',
          config: {},
          position: { x: 950, y: 200 },
        },
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'create-accounts' },
        { id: 'e2', source: 'create-accounts', target: 'add-to-groups' },
        { id: 'e3', source: 'start', target: 'invite-slack' },
        { id: 'e4', source: 'add-to-groups', target: 'share-onboarding-docs' },
        { id: 'e5', source: 'invite-slack', target: 'share-onboarding-docs' },
        { id: 'e6', source: 'share-onboarding-docs', target: 'schedule-training' },
        { id: 'e7', source: 'schedule-training', target: 'send-welcome-email' },
        { id: 'e8', source: 'schedule-training', target: 'notify-manager' },
        { id: 'e9', source: 'schedule-training', target: 'announce-team' },
        { id: 'e10', source: 'send-welcome-email', target: 'log-onboarding' },
        { id: 'e11', source: 'notify-manager', target: 'log-onboarding' },
        { id: 'e12', source: 'announce-team', target: 'log-onboarding' },
        { id: 'e13', source: 'log-onboarding', target: 'end' },
      ],
    },

    exampleInput: {
      first_name: 'Fatima',
      last_name: 'Hassan',
      email: 'fatima.hassan@company.com',
      department: 'Engineering',
      start_date: '2025-02-01',
      manager_email: 'ahmed.khan@company.com',
      manager_name: 'Ahmed Khan',
      bio: 'Fatima joins us as a Senior Software Engineer with 5 years of experience in React and Node.js.',
    },
    expectedOutput: 'Google account created, added to groups, Slack invite sent, 4 training sessions scheduled, welcome email sent, manager notified, team announcement posted, logged to HR tracker',

    complexity: 'advanced',
    setupTimeMinutes: 40,
    isPopular: false,
    isNew: true,
  },

  // ========================================
  // 10. Review Request Automation
  // ========================================
  {
    id: 'review-request-automation',
    name: {
      en: 'Review Request Automation',
      ar: 'أتمتة طلب المراجعات',
    },
    description: {
      en: 'Automatically request reviews from customers after purchase/service, with smart timing and follow-up sequences',
      ar: 'طلب المراجعات تلقائياً من العملاء بعد الشراء/الخدمة، مع توقيت ذكي وتسلسل للمتابعة',
    },
    category: 'ecommerce',
    icon: '⭐',
    tags: ['reviews', 'ratings', 'customer-feedback', 'google', 'automation'],

    estimatedTimeSavedPerMonth: '12+ hours',
    estimatedMoneySavedPerMonth: '$240 + increased reviews',
    replacesAgencyService: 'Review generation automation',

    requiredIntegrations: [
      { name: 'Google Sheets', slug: 'googlesheets', required: true },
      { name: 'Gmail', slug: 'gmail', required: true },
      { name: 'Twilio SMS', slug: 'twilio', required: false },
      { name: 'WhatsApp', slug: 'whatsapp', required: false },
    ],

    composioTools: [
      'GOOGLESHEETS_READ_DATA',
      'GOOGLESHEETS_UPDATE_DATA',
      'GMAIL_SEND_EMAIL',
      'TWILIO_SEND_SMS',
      'WHATSAPP_SEND_MESSAGE',
    ],

    trigger: {
      type: 'schedule',
      config: {
        cron: '0 10 * * *', // Every day at 10 AM
        description: 'Check for customers to request reviews daily',
      },
    },

    definition: {
      nodes: [
        {
          id: 'start',
          type: 'start',
          label: 'Daily Review Check',
          config: {
            trigger: 'schedule',
            cron: '0 10 * * *',
          },
          position: { x: 50, y: 200 },
        },
        {
          id: 'get-customers',
          type: 'integration',
          label: 'Get Eligible Customers',
          config: {
            tool: 'GOOGLESHEETS_READ_DATA',
            parameters: {
              spreadsheet_id: '{{config.customers_sheet_id}}',
              range: 'Orders!A:J',
              filter: 'status = "Delivered" AND review_requested = FALSE AND delivery_date <= {{days_ago_3}}',
            },
          },
          position: { x: 200, y: 200 },
        },
        {
          id: 'filter-already-reviewed',
          type: 'transform',
          label: 'Filter Already Reviewed',
          config: {
            operations: [
              { type: 'filter', config: { condition: 'customer.has_reviewed !== true' } },
              { type: 'map', config: { request_number: 'customer.request_count || 0' } },
            ],
          },
          position: { x: 350, y: 200 },
        },
        {
          id: 'check-request-count',
          type: 'condition',
          label: 'Check Request Count',
          config: {
            conditions: [
              { if: 'customer.request_count === 0', then: 'first_request' },
              { if: 'customer.request_count === 1', then: 'second_request' },
              { if: 'customer.request_count >= 2', then: 'skip_customer' },
            ],
          },
          position: { x: 500, y: 200 },
        },
        {
          id: 'first-request',
          type: 'integration',
          label: 'Send First Request',
          config: {
            tool: 'GMAIL_SEND_EMAIL',
            parameters: {
              to: '{{customer.email}}',
              subject: 'How was your experience with {{config.business_name}}?',
              body: `Hi {{customer.first_name}},

Thank you for choosing {{config.business_name}}! We hope you're enjoying your purchase.

We'd love to hear about your experience. Your feedback helps us improve and helps other customers make informed decisions.

⭐ **Leave a Review** (takes just 30 seconds):
[Leave Google Review]({{config.google_review_link}})

As a thank you, here's a {{config.discount_percent}}% discount code for your next purchase: {{generated_discount_code}}

Thank you for your support!

Best regards,
The {{config.business_name}} Team

P.S. Not satisfied? Reply to this email and we'll make it right!`,
            },
          },
          position: { x: 650, y: 100 },
        },
        {
          id: 'second-request',
          type: 'integration',
          label: 'Send Follow-up Request',
          config: {
            tool: 'GMAIL_SEND_EMAIL',
            parameters: {
              to: '{{customer.email}}',
              subject: 'Quick reminder: Share your thoughts on {{config.business_name}}',
              body: `Hi {{customer.first_name}},

Just a friendly reminder - we'd still love to hear your feedback!

If you have a minute, please share your experience:
[Leave a Quick Review]({{config.google_review_link}})

Your review really helps our small business grow.

Thank you!
{{config.business_name}}`,
            },
          },
          position: { x: 650, y: 200 },
        },
        {
          id: 'update-status',
          type: 'integration',
          label: 'Update Request Status',
          config: {
            tool: 'GOOGLESHEETS_UPDATE_DATA',
            parameters: {
              spreadsheet_id: '{{config.customers_sheet_id}}',
              range: 'Orders!I{{row_number}}:J{{row_number}}',
              values: [[true, '{{new_request_count}}']],
            },
          },
          position: { x: 800, y: 150 },
        },
        {
          id: 'log-requests',
          type: 'integration',
          label: 'Log Review Requests',
          config: {
            tool: 'GOOGLESHEETS_APPEND_DATA',
            parameters: {
              spreadsheet_id: '{{config.review_log_sheet_id}}',
              range: 'ReviewRequests!A:F',
              values: '{{request_log_rows}}',
            },
          },
          position: { x: 800, y: 250 },
        },
        {
          id: 'end',
          type: 'end',
          label: 'Requests Sent',
          config: {},
          position: { x: 950, y: 200 },
        },
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'get-customers' },
        { id: 'e2', source: 'get-customers', target: 'filter-already-reviewed' },
        { id: 'e3', source: 'filter-already-reviewed', target: 'check-request-count' },
        { id: 'e4', source: 'check-request-count', target: 'first-request' },
        { id: 'e5', source: 'check-request-count', target: 'second-request' },
        { id: 'e6', source: 'first-request', target: 'update-status' },
        { id: 'e7', source: 'second-request', target: 'update-status' },
        { id: 'e8', source: 'update-status', target: 'log-requests' },
        { id: 'e9', source: 'log-requests', target: 'end' },
      ],
    },

    exampleInput: {
      business_name: 'Dubai Coffee Roasters',
      google_review_link: 'https://g.page/r/...',
      discount_percent: 10,
      days_after_delivery: 3,
    },
    expectedOutput: '8 customers eligible, 5 first requests sent, 2 follow-ups sent, 1 skipped (already requested twice), all logged to tracking sheet',

    complexity: 'beginner',
    setupTimeMinutes: 15,
    isPopular: true,
    isNew: true,
  },
]

// ========================================
// Helper Functions
// ========================================

export function getCoreTemplateById(id: string): CoreWorkflowTemplate | undefined {
  return coreWorkflowTemplates.find(t => t.id === id)
}

export function getCoreTemplatesByCategory(category: CoreWorkflowTemplate['category']): CoreWorkflowTemplate[] {
  return coreWorkflowTemplates.filter(t => t.category === category)
}

export function getPopularCoreTemplates(): CoreWorkflowTemplate[] {
  return coreWorkflowTemplates.filter(t => t.isPopular)
}

export function getNewCoreTemplates(): CoreWorkflowTemplate[] {
  return coreWorkflowTemplates.filter(t => t.isNew)
}

export function getCoreTemplatesByComplexity(complexity: CoreWorkflowTemplate['complexity']): CoreWorkflowTemplate[] {
  return coreWorkflowTemplates.filter(t => t.complexity === complexity)
}

export function searchCoreTemplates(query: string): CoreWorkflowTemplate[] {
  const lowerQuery = query.toLowerCase()
  return coreWorkflowTemplates.filter(t =>
    t.name.en.toLowerCase().includes(lowerQuery) ||
    t.name.ar.includes(query) ||
    t.description.en.toLowerCase().includes(lowerQuery) ||
    t.description.ar.includes(query) ||
    t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  )
}

export function getCoreTemplatesRequiringIntegration(integrationSlug: string): CoreWorkflowTemplate[] {
  return coreWorkflowTemplates.filter(t =>
    t.requiredIntegrations.some(i => i.slug === integrationSlug)
  )
}

export function getAllCoreTemplateCategories(): CoreWorkflowTemplate['category'][] {
  return Array.from(new Set(coreWorkflowTemplates.map(t => t.category)))
}

export function calculateTotalTimeSaved(): string {
  const totalHours = coreWorkflowTemplates.reduce((sum, t) => {
    const match = t.estimatedTimeSavedPerMonth.match(/(\d+)/)
    return sum + (match ? parseInt(match[1]) : 0)
  }, 0)
  return `${totalHours}+ hours/month`
}

export function calculateTotalMoneySaved(): string {
  const totalDollars = coreWorkflowTemplates.reduce((sum, t) => {
    const match = t.estimatedMoneySavedPerMonth.match(/\$(\d+)/)
    return sum + (match ? parseInt(match[1]) : 0)
  }, 0)
  return `$${totalDollars.toLocaleString()}/month`
}
