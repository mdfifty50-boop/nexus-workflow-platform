/**
 * diagnostic-trees.ts
 *
 * Structured business diagnostic question trees for intelligent problem diagnosis.
 * When users report complaints or problems (detected by IntentResolver),
 * these trees guide systematic diagnosis before suggesting automation.
 *
 * @NEXUS-FIX-175: Diagnostic tree framework - DO NOT REMOVE
 */

export interface DiagnosticQuestion {
  question: string
  options: string[]
  field: string
  followUp?: Record<string, DiagnosticQuestion>
}

export interface DiagnosticTree {
  symptom: RegExp[]
  category: 'growth' | 'operational' | 'financial' | 'technical'
  questions: DiagnosticQuestion[]
  transitionToWorkflow: string
}

export const DIAGNOSTIC_TREES: Record<string, DiagnosticTree[]> = {
  // Generic trees (all industries)
  _generic: [
    {
      symptom: [/sales.*drop|revenue.*declin|losing.*customer|customer.*churn/i],
      category: 'growth',
      questions: [
        { question: 'When did you first notice the decline?', options: ['Last week', 'Last month', 'Last quarter', 'Gradual over time', 'Custom...'], field: 'timeline' },
        {
          question: 'What metrics are you tracking this with?',
          options: ['CRM reports', 'Spreadsheets', 'Accounting software', 'Gut feeling', 'Custom...'],
          field: 'metrics_source',
          followUp: {
            'Gut feeling': { question: 'Would you like me to help set up tracking first?', options: ['Yes, help me track sales', 'No, let\'s focus on the decline', 'Custom...'], field: 'tracking_help' },
          }
        },
        {
          question: 'What changed around the same time?',
          options: ['New competitor', 'Price change', 'Team change', 'Marketing shift', 'Not sure', 'Custom...'],
          field: 'root_cause_hypothesis',
          followUp: {
            'New competitor': { question: 'Do you know which customers switched?', options: ['Yes, specific accounts', 'A general trend', 'Not sure who left', 'Custom...'], field: 'competitor_impact' },
            'Not sure': { question: 'Which area should we investigate first?', options: ['Lead generation', 'Customer retention', 'Pricing strategy', 'Team performance', 'Custom...'], field: 'investigation_area' },
          }
        },
        { question: 'Where in your sales process do leads drop off?', options: ['Awareness/reach', 'Initial contact', 'Follow-up', 'Closing', 'Retention', 'Custom...'], field: 'funnel_stage' },
      ],
      transitionToWorkflow: 'Based on your diagnosis, here are automations that could help address this:',
    },
    {
      symptom: [/too slow|too manual|wasting time|inefficien|bottleneck/i],
      category: 'operational',
      questions: [
        {
          question: 'Which process is the biggest bottleneck?',
          options: ['Email/communication', 'Data entry', 'Reporting', 'Approvals', 'Client onboarding', 'Custom...'],
          field: 'bottleneck_process',
          followUp: {
            'Email/communication': { question: 'What type of emails take the most time?', options: ['Client follow-ups', 'Internal coordination', 'Report distribution', 'Scheduling', 'Custom...'], field: 'email_bottleneck' },
            'Data entry': { question: 'What data are you entering manually?', options: ['Customer info', 'Orders/invoices', 'Time tracking', 'Inventory counts', 'Custom...'], field: 'data_entry_type' },
            'Approvals': { question: 'What needs approval most often?', options: ['Purchases', 'Content/designs', 'Time off', 'Client proposals', 'Custom...'], field: 'approval_type' },
          }
        },
        { question: 'How much time does this take per week?', options: ['1-2 hours', '3-5 hours', '5-10 hours', 'More than 10 hours', 'Custom...'], field: 'time_spent' },
        { question: 'How many people are involved in this process?', options: ['Just me', '2-3 people', '4-10 people', 'Whole team (10+)', 'Custom...'], field: 'team_size' },
        { question: 'What tools are you currently using for this?', options: ['Email only', 'Spreadsheets', 'Project management tool', 'Custom software', 'Paper/manual', 'Custom...'], field: 'current_tools' },
      ],
      transitionToWorkflow: 'I can see the bottleneck. Here\'s an automation to streamline this:',
    },
    {
      symptom: [/too expensive|cost.*overrun|budget|spending|profit.*margin/i],
      category: 'financial',
      questions: [
        { question: 'What area is costing the most?', options: ['Software/subscriptions', 'Staff time', 'Marketing spend', 'Operations', 'External services', 'Custom...'], field: 'cost_area' },
        { question: 'What\'s your current monthly spend on this?', options: ['Under $500', '$500-2,000', '$2,000-5,000', '$5,000-10,000', 'Over $10,000', 'Custom...'], field: 'monthly_spend' },
        { question: 'What would be an acceptable budget?', options: ['Cut by 25%', 'Cut by 50%', 'Stay same but get more value', 'Flexible if ROI is clear', 'Custom...'], field: 'budget_target' },
        { question: 'Are you tracking ROI on current tools?', options: ['Yes, detailed tracking', 'Rough estimates', 'No tracking', 'Not sure what to measure', 'Custom...'], field: 'roi_tracking' },
      ],
      transitionToWorkflow: 'Based on what you\'ve shared, here\'s how automation can reduce costs:',
    },
    {
      symptom: [/not working|broken|error|crash|bug|integration.*fail/i],
      category: 'technical',
      questions: [
        { question: 'What system or tool is having issues?', options: ['CRM', 'Email', 'Website/app', 'Payment system', 'Internal tools', 'Custom...'], field: 'affected_system' },
        { question: 'When did this start happening?', options: ['Today', 'This week', 'After a recent change', 'It\'s intermittent', 'Custom...'], field: 'issue_timeline' },
        { question: 'How is this affecting your business?', options: ['Can\'t process orders', 'Can\'t communicate with clients', 'Data is lost/incorrect', 'Slowing down team', 'Custom...'], field: 'business_impact' },
        { question: 'Have you tried any fixes?', options: ['Restarted/refreshed', 'Contacted support', 'Tried workaround', 'Nothing yet', 'Custom...'], field: 'attempted_fixes' },
      ],
      transitionToWorkflow: 'I understand the issue. Here\'s an automation to prevent this going forward:',
    },
    {
      symptom: [/team.*coordinat|communicat.*problem|misalign|silo/i],
      category: 'operational',
      questions: [
        { question: 'Where does communication break down?', options: ['Between departments', 'With clients', 'Remote vs office', 'Manager to team', 'Custom...'], field: 'comm_breakdown' },
        { question: 'What communication tools does your team use?', options: ['Email only', 'Slack/Teams', 'WhatsApp groups', 'Mix of everything', 'Custom...'], field: 'comm_tools' },
        { question: 'What information gets lost or delayed?', options: ['Task updates', 'Client requests', 'Approvals/decisions', 'Meeting outcomes', 'Custom...'], field: 'info_lost' },
        { question: 'How big is your team?', options: ['2-5 people', '6-15 people', '16-50 people', '50+ people', 'Custom...'], field: 'team_size' },
      ],
      transitionToWorkflow: 'Here\'s an automation to improve your team\'s communication flow:',
    },
  ],

  // E-commerce specific trees
  ecommerce: [
    {
      symptom: [/cart.*abandon|checkout.*drop|order.*cancel/i],
      category: 'growth',
      questions: [
        { question: 'What\'s your current cart abandonment rate?', options: ['Under 50%', '50-70%', '70-85%', 'Over 85%', 'Not sure', 'Custom...'], field: 'abandonment_rate' },
        { question: 'At which step do customers leave?', options: ['Adding to cart', 'Shipping info', 'Payment page', 'After seeing total', 'Custom...'], field: 'drop_off_step' },
        { question: 'Do you send recovery emails?', options: ['Yes, automated', 'Yes, manual', 'No', 'Tried but stopped', 'Custom...'], field: 'recovery_emails' },
        { question: 'What payment methods do you accept?', options: ['Credit card only', 'KNET + card', 'Multiple (KNET, card, Apple Pay)', 'Cash on delivery + digital', 'Custom...'], field: 'payment_methods' },
      ],
      transitionToWorkflow: 'Here\'s an automation to recover abandoned carts:',
    },
  ],

  // SaaS specific trees
  saas: [
    {
      symptom: [/churn|cancel|unsubscrib|downgrad/i],
      category: 'growth',
      questions: [
        { question: 'What\'s your current monthly churn rate?', options: ['Under 3%', '3-5%', '5-10%', 'Over 10%', 'Not sure', 'Custom...'], field: 'churn_rate' },
        { question: 'Do you know why customers are leaving?', options: ['Price sensitivity', 'Missing features', 'Poor onboarding', 'Found alternative', 'Not sure', 'Custom...'], field: 'churn_reason' },
        { question: 'How do you currently track user engagement?', options: ['Analytics dashboard', 'Manual checks', 'Support tickets', 'No tracking', 'Custom...'], field: 'engagement_tracking' },
        { question: 'Do you have a customer success process?', options: ['Dedicated CS team', 'Automated emails', 'Ad-hoc check-ins', 'None', 'Custom...'], field: 'cs_process' },
      ],
      transitionToWorkflow: 'Here\'s an automation to reduce churn:',
    },
  ],

  // Agency/consulting specific trees
  agency: [
    {
      symptom: [/client.*onboard|project.*delay|scope.*creep|deliver/i],
      category: 'operational',
      questions: [
        { question: 'What\'s your average onboarding time per client?', options: ['1-2 days', '1 week', '2-3 weeks', 'Over a month', 'Custom...'], field: 'onboarding_time' },
        { question: 'Where does onboarding typically stall?', options: ['Collecting client info', 'Setting up accounts', 'Kickoff scheduling', 'Contract/payment', 'Custom...'], field: 'onboarding_stall' },
        { question: 'How many clients are you onboarding per month?', options: ['1-3', '4-10', '11-20', 'Over 20', 'Custom...'], field: 'monthly_clients' },
        { question: 'What tools do you use for project management?', options: ['Asana', 'Trello', 'Monday.com', 'ClickUp', 'Spreadsheets', 'Custom...'], field: 'pm_tool' },
      ],
      transitionToWorkflow: 'Here\'s an automation to streamline your client onboarding:',
    },
  ],

  // Healthcare specific trees
  healthcare: [
    {
      symptom: [/appointment.*no.show|patient.*wait|schedul.*chaos/i],
      category: 'operational',
      questions: [
        { question: 'What\'s your no-show rate?', options: ['Under 10%', '10-20%', '20-30%', 'Over 30%', 'Not sure', 'Custom...'], field: 'noshow_rate' },
        { question: 'How do you currently remind patients?', options: ['Phone calls', 'SMS', 'Email', 'WhatsApp', 'No reminders', 'Custom...'], field: 'reminder_method' },
        { question: 'What scheduling system do you use?', options: ['Paper/manual', 'Google Calendar', 'Clinic software', 'Phone-based', 'Custom...'], field: 'scheduling_system' },
        { question: 'How many appointments per day?', options: ['Under 10', '10-25', '25-50', 'Over 50', 'Custom...'], field: 'daily_appointments' },
      ],
      transitionToWorkflow: 'Here\'s an automation to reduce no-shows and streamline scheduling:',
    },
  ],

  // Retail specific trees
  retail: [
    {
      symptom: [/inventory|stock.*out|overstock|shrinkage/i],
      category: 'operational',
      questions: [
        { question: 'How do you currently track inventory?', options: ['POS system', 'Spreadsheets', 'Manual count', 'Inventory software', 'Custom...'], field: 'inventory_tracking' },
        { question: 'How often do you run out of stock?', options: ['Rarely', 'Monthly', 'Weekly', 'Daily', 'Custom...'], field: 'stockout_frequency' },
        { question: 'How many SKUs do you manage?', options: ['Under 100', '100-500', '500-2000', 'Over 2000', 'Custom...'], field: 'sku_count' },
        { question: 'Do you sell through multiple channels?', options: ['Store only', 'Store + online', 'Online only', 'Multiple platforms', 'Custom...'], field: 'sales_channels' },
      ],
      transitionToWorkflow: 'Here\'s an automation to optimize your inventory management:',
    },
  ],

  // Finance specific trees
  finance: [
    {
      symptom: [/cash.*flow|late.*payment|invoice|collect|receiv/i],
      category: 'financial',
      questions: [
        {
          question: 'What\'s your biggest cash flow challenge?',
          options: ['Late client payments', 'Untracked invoices', 'Expense management', 'Forecasting', 'Custom...'],
          field: 'cashflow_challenge',
          followUp: {
            'Late client payments': { question: 'What\'s your average days to collect?', options: ['Under 30 days', '30-60 days', '60-90 days', 'Over 90 days', 'Custom...'], field: 'collection_days' },
            'Untracked invoices': { question: 'How many invoices per month?', options: ['Under 20', '20-50', '50-200', 'Over 200', 'Custom...'], field: 'invoice_volume' },
          }
        },
        { question: 'What accounting software do you use?', options: ['QuickBooks', 'Xero', 'Wave', 'Zoho Books', 'Spreadsheets', 'Custom...'], field: 'accounting_software' },
        { question: 'How do you currently send invoices?', options: ['Email manually', 'Through accounting software', 'Paper invoices', 'Via WhatsApp', 'Custom...'], field: 'invoice_method' },
        { question: 'Do you reconcile accounts regularly?', options: ['Daily', 'Weekly', 'Monthly', 'Rarely', 'Never', 'Custom...'], field: 'reconciliation_frequency' },
      ],
      transitionToWorkflow: 'Here\'s an automation to improve your cash flow management:',
    },
    {
      symptom: [/compliance|regulat|audit|report.*error|filing/i],
      category: 'operational',
      questions: [
        { question: 'What type of compliance is challenging?', options: ['Tax filing', 'Financial reporting', 'Regulatory submissions', 'Internal audits', 'Custom...'], field: 'compliance_type' },
        { question: 'How often are reports due?', options: ['Monthly', 'Quarterly', 'Annually', 'Ad-hoc', 'Custom...'], field: 'report_frequency' },
        { question: 'Where does data come from?', options: ['Multiple systems', 'Spreadsheets', 'Accounting software', 'Manual records', 'Custom...'], field: 'data_sources' },
        { question: 'How many people prepare reports?', options: ['Just me', '2-3 people', 'A department', 'Outsourced', 'Custom...'], field: 'report_team' },
      ],
      transitionToWorkflow: 'Here\'s an automation to streamline your compliance reporting:',
    },
  ],

  // Legal specific trees
  legal: [
    {
      symptom: [/contract|agreement|document.*review|legal.*review|deadline.*miss/i],
      category: 'operational',
      questions: [
        {
          question: 'What\'s your main document challenge?',
          options: ['Contract drafting takes too long', 'Missing renewal deadlines', 'Can\'t find documents', 'Version control chaos', 'Custom...'],
          field: 'document_challenge',
          followUp: {
            'Missing renewal deadlines': { question: 'How many active contracts do you manage?', options: ['Under 50', '50-200', '200-500', 'Over 500', 'Custom...'], field: 'contract_volume' },
            'Can\'t find documents': { question: 'Where are documents currently stored?', options: ['Shared drive', 'Email attachments', 'Physical files', 'Multiple locations', 'Custom...'], field: 'storage_location' },
          }
        },
        { question: 'What tools do you use for document management?', options: ['Google Drive', 'SharePoint', 'Dropbox', 'Dedicated legal software', 'Paper files', 'Custom...'], field: 'doc_management' },
        { question: 'How do you track deadlines?', options: ['Calendar reminders', 'Spreadsheet', 'Memory', 'Legal management software', 'Custom...'], field: 'deadline_tracking' },
        { question: 'How many documents do you process per week?', options: ['Under 10', '10-30', '30-100', 'Over 100', 'Custom...'], field: 'weekly_volume' },
      ],
      transitionToWorkflow: 'Here\'s an automation to streamline your legal document workflow:',
    },
  ],

  // Manufacturing specific trees
  manufacturing: [
    {
      symptom: [/production.*delay|quality.*issue|supply.*chain|defect|downtime/i],
      category: 'operational',
      questions: [
        {
          question: 'What\'s the primary production challenge?',
          options: ['Equipment downtime', 'Quality defects', 'Supply chain delays', 'Scheduling conflicts', 'Custom...'],
          field: 'production_challenge',
          followUp: {
            'Equipment downtime': { question: 'How often does unplanned downtime occur?', options: ['Daily', 'Weekly', 'Monthly', 'Rarely', 'Custom...'], field: 'downtime_frequency' },
            'Quality defects': { question: 'What\'s your current defect rate?', options: ['Under 1%', '1-3%', '3-5%', 'Over 5%', 'Not measured', 'Custom...'], field: 'defect_rate' },
          }
        },
        { question: 'How do you track production?', options: ['ERP system', 'MES software', 'Spreadsheets', 'Paper logs', 'Custom...'], field: 'production_tracking' },
        { question: 'What\'s your team size on the production floor?', options: ['Under 10', '10-50', '50-200', 'Over 200', 'Custom...'], field: 'floor_team_size' },
        { question: 'Do you have preventive maintenance schedules?', options: ['Yes, automated', 'Yes, manual', 'Reactive only', 'No maintenance program', 'Custom...'], field: 'maintenance_approach' },
      ],
      transitionToWorkflow: 'Here\'s an automation to optimize your production workflow:',
    },
    {
      symptom: [/supplier|vendor|procurement|material.*shortage|lead.*time/i],
      category: 'financial',
      questions: [
        { question: 'What\'s your biggest procurement challenge?', options: ['Long lead times', 'Price volatility', 'Supplier reliability', 'Too many manual POs', 'Custom...'], field: 'procurement_challenge' },
        { question: 'How many active suppliers do you manage?', options: ['Under 10', '10-50', '50-100', 'Over 100', 'Custom...'], field: 'supplier_count' },
        { question: 'How do you manage purchase orders?', options: ['ERP system', 'Email', 'Spreadsheets', 'Phone/WhatsApp', 'Custom...'], field: 'po_management' },
        { question: 'Do you have automated reorder points?', options: ['Yes, fully automated', 'Partially', 'No, all manual', 'Custom...'], field: 'reorder_automation' },
      ],
      transitionToWorkflow: 'Here\'s an automation to streamline your supply chain:',
    },
  ],
}

/**
 * Find the best matching diagnostic tree for a given input and industry
 */
export function findDiagnosticTree(
  input: string,
  industry?: string,
  category?: string
): DiagnosticTree | null {
  // Try industry-specific trees first
  if (industry) {
    const industryKey = industry.toLowerCase().replace(/[\s&]+/g, '')
    const industryTrees = DIAGNOSTIC_TREES[industryKey]
    if (industryTrees) {
      for (const tree of industryTrees) {
        if (category && tree.category !== category) continue
        if (tree.symptom.some(p => p.test(input))) return tree
      }
    }
  }

  // Fall back to generic trees
  for (const tree of DIAGNOSTIC_TREES._generic) {
    if (category && tree.category !== category) continue
    if (tree.symptom.some(p => p.test(input))) return tree
  }

  // If category specified but no symptom match, return first tree of that category
  if (category) {
    const genericMatch = DIAGNOSTIC_TREES._generic.find(t => t.category === category)
    if (genericMatch) return genericMatch
  }

  return null
}
