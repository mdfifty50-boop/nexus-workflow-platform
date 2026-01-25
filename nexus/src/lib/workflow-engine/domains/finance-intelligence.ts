/**
 * Nexus Finance Domain Intelligence Module
 *
 * Provides comprehensive finance workflow intelligence including:
 * - Invoice processing chains
 * - Expense management automation
 * - Payroll processing workflows
 * - Budget management systems
 * - Financial reporting pipelines
 * - Cash flow optimization
 *
 * Regional Focus: Kuwait/Gulf with VAT 5% compliance, KWD currency,
 * and Kuwait Labor Law end-of-service calculations.
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

export interface FinanceWorkflowPattern {
  name: string;
  description: string;
  layers: ('input' | 'processing' | 'output' | 'notification')[];
  steps: string[];
  implicitNeeds: string[];
  questions: string[];
  complianceRequirements: string[];
  estimatedROI: string;
}

export interface FinanceRegionalContext {
  region: string;
  currency: string;
  currencySymbol: string;
  vatRate: number;
  vatImplementedDate: string;
  fiscalYearStart: string;
  fiscalYearEnd: string;
  businessDays: string;
  laborLawReference: string;
  paymentMethods: string[];
  bankingHours: string;
  complianceRequirements: string[];
}

export interface EndOfServiceCalculation {
  yearsOfService: number;
  monthlyBaseSalary: number;
  entitlement: number;
  formula: string;
  notes: string[];
}

// ============================================================================
// FINANCE WORKFLOW PATTERNS
// ============================================================================

export const FINANCE_WORKFLOW_PATTERNS: Record<string, FinanceWorkflowPattern> = {
  // Invoice Processing Pattern
  invoice_processing: {
    name: 'Invoice Processing',
    description: 'End-to-end invoice automation from receipt to payment reconciliation',
    layers: ['input', 'processing', 'processing', 'output', 'notification'],
    steps: [
      'receive_invoice',
      'extract_data',
      'validate_details',
      'route_approval',
      'process_payment',
      'reconcile_accounts',
    ],
    implicitNeeds: [
      'Invoice capture mechanism (email, upload portal, scanner)',
      'OCR/AI data extraction for invoice fields',
      'Vendor master database for validation',
      'Multi-tier approval workflow engine',
      'Payment processing integration (KNET, bank transfer)',
      'Accounting system for journal entries',
      'Audit trail and document storage',
    ],
    questions: [
      'How are invoices typically received (email, mail, portal)?',
      'What is the approval threshold for different management levels?',
      'Which accounting system do you use?',
      'Do you require three-way matching (PO, receipt, invoice)?',
      'What is your standard payment terms?',
    ],
    complianceRequirements: [
      'VAT invoice validation (5% Kuwait)',
      'Supplier TIN verification',
      'Document retention (7 years minimum)',
    ],
    estimatedROI: 'Reduces processing time by 70%, error rate by 90%',
  },

  // Expense Management Pattern
  expense_management: {
    name: 'Expense Management',
    description: 'Employee expense submission, approval, and reimbursement automation',
    layers: ['input', 'processing', 'processing', 'output', 'notification'],
    steps: [
      'submit_expense',
      'categorize_expense',
      'validate_policy',
      'route_approval',
      'process_reimbursement',
      'update_accounting',
    ],
    implicitNeeds: [
      'Mobile receipt capture with OCR',
      'Expense category mapping and GL coding',
      'Company expense policy rules engine',
      'Manager approval workflow',
      'Payroll integration for reimbursement',
      'Real-time budget tracking',
      'Mileage and per diem calculators',
    ],
    questions: [
      'Do employees need mobile receipt capture?',
      'What expense categories do you track?',
      'What are your expense policy limits?',
      'Should reimbursements go through payroll or direct deposit?',
      'Do you need corporate card reconciliation?',
    ],
    complianceRequirements: [
      'Receipt documentation for VAT recovery',
      'Per diem rates per Kuwait regulations',
      'Entertainment expense limits',
    ],
    estimatedROI: 'Reduces expense cycle from 14 days to 3 days',
  },

  // Payroll Processing Pattern
  payroll_processing: {
    name: 'Payroll Processing',
    description: 'Complete payroll cycle from calculation to disbursement and reporting',
    layers: ['input', 'processing', 'processing', 'output', 'notification'],
    steps: [
      'collect_time_data',
      'calculate_gross',
      'apply_deductions',
      'calculate_net',
      'approve_payroll',
      'disburse_payments',
      'generate_pay_stubs',
      'submit_reports',
    ],
    implicitNeeds: [
      'Time and attendance integration',
      'Salary calculation engine (basic, allowances, overtime)',
      'Deduction management (social security, loans, advances)',
      'Tax calculation (if applicable)',
      'End of service indemnity accrual',
      'Bank file generation (WPS format)',
      'Pay stub generation in Arabic/English',
      'Government reporting integration',
    ],
    questions: [
      'How many employees are on payroll?',
      'Do you use time tracking software?',
      'What is your pay cycle (monthly, bi-weekly)?',
      'Do you need multi-currency payroll?',
      'Are there union or collective agreements?',
    ],
    complianceRequirements: [
      'Kuwait Labor Law compliance',
      'PIFSS social security contributions',
      'End of service calculation per Article 51',
      'Wage Protection System (WPS) compliance',
    ],
    estimatedROI: 'Reduces payroll processing time by 80%, eliminates compliance errors',
  },

  // Budget Management Pattern
  budget_management: {
    name: 'Budget Management',
    description: 'Budget planning, allocation, tracking, and variance analysis',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'create_budget',
      'allocate_funds',
      'track_spending',
      'analyze_variance',
      'adjust_forecast',
      'generate_reports',
    ],
    implicitNeeds: [
      'Budget template builder',
      'Department/cost center hierarchy',
      'Actual vs budget comparison engine',
      'Variance threshold alerting',
      'Rolling forecast capability',
      'Multi-dimensional reporting (by department, project, GL)',
      'Currency conversion for multi-currency budgets',
    ],
    questions: [
      'What is your budget cycle (annual, quarterly)?',
      'How granular should budget tracking be?',
      'Do you need department-level budget owners?',
      'Should variances trigger automatic alerts?',
      'Do you use zero-based or incremental budgeting?',
    ],
    complianceRequirements: [
      'Segregation of duties for budget approvals',
      'Audit trail for budget changes',
      'Board approval documentation',
    ],
    estimatedROI: 'Improves budget accuracy by 40%, reduces variance by 25%',
  },

  // Financial Reporting Pattern
  financial_reporting: {
    name: 'Financial Reporting',
    description: 'Automated financial statement generation and distribution',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'collect_data',
      'consolidate_entities',
      'apply_adjustments',
      'generate_statements',
      'review_approve',
      'distribute_reports',
    ],
    implicitNeeds: [
      'Multi-entity data aggregation',
      'Intercompany elimination rules',
      'Currency translation engine',
      'Financial statement templates (P&L, Balance Sheet, Cash Flow)',
      'Management reporting packages',
      'Variance commentary automation',
      'Board presentation generation',
    ],
    questions: [
      'How many legal entities need consolidation?',
      'What reporting standards do you follow (IFRS, local GAAP)?',
      'What is your reporting frequency?',
      'Who needs to receive financial reports?',
      'Do you need management vs statutory reports?',
    ],
    complianceRequirements: [
      'IFRS compliance (Kuwait requirement)',
      'Auditor access and review trails',
      'Board reporting deadlines',
    ],
    estimatedROI: 'Reduces close cycle by 50%, reporting time by 70%',
  },

  // Cash Flow Management Pattern
  cash_flow_management: {
    name: 'Cash Flow Management',
    description: 'Cash flow forecasting, monitoring, and optimization',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'collect_receivables_data',
      'collect_payables_data',
      'generate_forecast',
      'monitor_positions',
      'alert_thresholds',
      'optimize_timing',
    ],
    implicitNeeds: [
      'Bank account integration for real-time balances',
      'Accounts receivable aging analysis',
      'Accounts payable scheduling',
      'Cash forecast modeling (13-week, rolling)',
      'Minimum balance threshold monitoring',
      'Surplus investment recommendations',
      'Short-term borrowing alerts',
    ],
    questions: [
      'How many bank accounts need monitoring?',
      'What is your forecast horizon (weekly, monthly)?',
      'What are your minimum cash balance requirements?',
      'Do you manage intercompany cash pooling?',
      'Should the system recommend payment timing?',
    ],
    complianceRequirements: [
      'Bank reconciliation documentation',
      'Cash handling controls',
      'Treasury policy compliance',
    ],
    estimatedROI: 'Reduces borrowing costs by 15%, improves cash utilization by 20%',
  },

  // Accounts Receivable Pattern
  accounts_receivable: {
    name: 'Accounts Receivable',
    description: 'Invoice generation, collection, and customer payment management',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'generate_invoice',
      'send_invoice',
      'track_payment',
      'send_reminders',
      'apply_payment',
      'reconcile_account',
    ],
    implicitNeeds: [
      'Invoice generation with VAT calculation',
      'Multi-channel delivery (email, WhatsApp, print)',
      'Payment tracking and aging',
      'Automated reminder sequences',
      'Payment gateway integration (KNET, credit cards)',
      'Customer portal for self-service',
      'Credit limit management',
    ],
    questions: [
      'How do customers prefer to receive invoices?',
      'What are your standard payment terms?',
      'Do you offer multiple payment methods?',
      'Should we automate collection reminders?',
      'Do you need customer credit management?',
    ],
    complianceRequirements: [
      'VAT-compliant invoice format',
      'Electronic invoicing readiness',
      'Bad debt write-off policy',
    ],
    estimatedROI: 'Reduces DSO by 20 days, improves collection rate by 15%',
  },

  // Accounts Payable Pattern
  accounts_payable: {
    name: 'Accounts Payable',
    description: 'Vendor payment management and optimization',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'receive_invoice',
      'match_documents',
      'schedule_payment',
      'process_payment',
      'record_transaction',
      'notify_vendor',
    ],
    implicitNeeds: [
      'Invoice data extraction (OCR/AI)',
      'Three-way matching (PO, receipt, invoice)',
      'Payment scheduling optimization',
      'Bank payment file generation',
      'Vendor portal for status updates',
      'Early payment discount tracking',
      'Duplicate payment prevention',
    ],
    questions: [
      'Do you use purchase orders?',
      'What is your approval hierarchy?',
      'Do vendors have early payment discount terms?',
      'What payment methods do you use?',
      'Do you need vendor self-service portal?',
    ],
    complianceRequirements: [
      'Vendor tax documentation',
      'Payment authorization controls',
      'Bank reconciliation requirements',
    ],
    estimatedROI: 'Captures 95% of early payment discounts, reduces processing cost by 60%',
  },
};

// ============================================================================
// FINANCE KEYWORDS FOR PATTERN DETECTION
// ============================================================================

export const FINANCE_KEYWORDS: Record<string, string[]> = {
  invoice_processing: [
    'invoice', 'invoices', 'invoicing', 'bill', 'bills', 'billing',
    'vendor invoice', 'supplier invoice', 'ap invoice', 'purchase invoice',
    'ocr invoice', 'scan invoice', 'process invoice', 'approve invoice',
    'فاتورة', 'فواتير', 'مورد'
  ],

  expense_management: [
    'expense', 'expenses', 'reimbursement', 'reimburse', 'receipt',
    'receipts', 'travel expense', 'business expense', 'employee expense',
    'expense report', 'expense claim', 'mileage', 'per diem',
    'مصاريف', 'مصروفات', 'تعويض'
  ],

  payroll_processing: [
    'payroll', 'salary', 'salaries', 'wages', 'pay', 'payday',
    'pay stub', 'payslip', 'overtime', 'deduction', 'deductions',
    'end of service', 'indemnity', 'gratuity', 'bonus', 'allowance',
    'رواتب', 'راتب', 'مكافأة نهاية الخدمة'
  ],

  budget_management: [
    'budget', 'budgeting', 'forecast', 'forecasting', 'variance',
    'actual vs budget', 'spending', 'allocation', 'cost center',
    'department budget', 'annual budget', 'quarterly budget',
    'ميزانية', 'موازنة', 'تخطيط مالي'
  ],

  financial_reporting: [
    'financial report', 'financial statement', 'p&l', 'profit and loss',
    'balance sheet', 'income statement', 'cash flow statement',
    'monthly close', 'quarterly report', 'annual report', 'consolidation',
    'تقرير مالي', 'قوائم مالية', 'ميزانية عمومية'
  ],

  cash_flow_management: [
    'cash flow', 'cashflow', 'liquidity', 'cash position', 'treasury',
    'working capital', 'receivables', 'payables', 'cash forecast',
    'bank balance', 'cash management',
    'تدفق نقدي', 'سيولة', 'خزينة'
  ],

  accounts_receivable: [
    'accounts receivable', 'ar', 'receivables', 'customer invoice',
    'collection', 'collections', 'aging', 'overdue', 'payment reminder',
    'customer payment', 'credit control',
    'ذمم مدينة', 'تحصيل', 'مستحقات'
  ],

  accounts_payable: [
    'accounts payable', 'ap', 'payables', 'vendor payment',
    'supplier payment', 'payment run', 'payment batch', 'bank transfer',
    'payment schedule',
    'ذمم دائنة', 'مدفوعات'
  ],
};

// ============================================================================
// FINANCE IMPLICIT REQUIREMENTS
// ============================================================================

export const FINANCE_IMPLICIT_REQUIREMENTS: Record<string, ImplicitRequirement[]> = {
  invoice_processing: [
    {
      category: 'input',
      description: 'OCR/AI invoice data extraction',
      reason: 'Automates manual data entry from scanned/emailed invoices',
      priority: 'critical',
      suggestedTools: ['Rossum', 'Kofax', 'ABBYY FlexiCapture', 'Nanonets'],
    },
    {
      category: 'processing',
      description: 'Multi-tier approval workflow',
      reason: 'Different invoice amounts require different approval authorities',
      priority: 'critical',
      suggestedTools: ['Nexus Workflow', 'ServiceNow', 'Kissflow'],
    },
    {
      category: 'processing',
      description: 'Three-way matching engine',
      reason: 'Validates invoice against PO and goods receipt',
      priority: 'important',
      suggestedTools: ['QuickBooks', 'Xero', 'SAP', 'Oracle'],
    },
    {
      category: 'output',
      description: 'Accounting system integration',
      reason: 'Creates journal entries and updates vendor balances',
      priority: 'critical',
      suggestedTools: ['QuickBooks', 'Xero', 'Zoho Books', 'SAP'],
    },
    {
      category: 'notification',
      description: 'Approval notification system',
      reason: 'Alerts approvers and tracks SLA compliance',
      priority: 'important',
      suggestedTools: ['Slack', 'Email', 'WhatsApp', 'Microsoft Teams'],
    },
    {
      category: 'processing',
      description: 'VAT validation (Kuwait 5%)',
      reason: 'Ensures VAT is correctly calculated and supplier TIN is valid',
      priority: 'critical',
      suggestedTools: ['Custom validation rules', 'Tax engine'],
    },
  ],

  expense_management: [
    {
      category: 'input',
      description: 'Mobile receipt capture with OCR',
      reason: 'Employees need to capture receipts on-the-go',
      priority: 'critical',
      suggestedTools: ['Expensify', 'Zoho Expense', 'SAP Concur', 'Rydoo'],
    },
    {
      category: 'processing',
      description: 'Expense category auto-classification',
      reason: 'Maps expenses to correct GL accounts and cost centers',
      priority: 'important',
      suggestedTools: ['Expensify SmartScan', 'AI categorization'],
    },
    {
      category: 'processing',
      description: 'Policy compliance engine',
      reason: 'Enforces company expense policies automatically',
      priority: 'critical',
      suggestedTools: ['Expensify', 'SAP Concur', 'Zoho Expense'],
    },
    {
      category: 'output',
      description: 'Payroll/bank integration for reimbursement',
      reason: 'Enables direct deposit or payroll addition',
      priority: 'important',
      suggestedTools: ['Payroll system', 'Bank integration'],
    },
    {
      category: 'notification',
      description: 'Status tracking for employees',
      reason: 'Employees need visibility into expense status',
      priority: 'optional',
      suggestedTools: ['Mobile app', 'Email notifications'],
    },
  ],

  payroll_processing: [
    {
      category: 'input',
      description: 'Time and attendance data collection',
      reason: 'Feeds hours worked, overtime, and leave into payroll',
      priority: 'critical',
      suggestedTools: ['BambooHR', 'Gusto', 'ADP', 'Zoho People'],
    },
    {
      category: 'processing',
      description: 'Salary calculation engine',
      reason: 'Computes gross pay including allowances and overtime',
      priority: 'critical',
      suggestedTools: ['Gusto', 'ADP', 'Paychex', 'Zoho Payroll'],
    },
    {
      category: 'processing',
      description: 'Tax and deduction calculator',
      reason: 'Applies statutory deductions (PIFSS) and voluntary deductions',
      priority: 'critical',
      suggestedTools: ['Local payroll provider', 'ADP GlobalView'],
    },
    {
      category: 'processing',
      description: 'End of service indemnity accrual',
      reason: 'Kuwait Labor Law requires tracking EOS liability',
      priority: 'critical',
      suggestedTools: ['Kuwait payroll system', 'Custom calculation'],
    },
    {
      category: 'output',
      description: 'WPS bank file generation',
      reason: 'Kuwait requires Wage Protection System format for salary payments',
      priority: 'critical',
      suggestedTools: ['WPS-compliant payroll', 'Bank integration'],
    },
    {
      category: 'output',
      description: 'Bilingual pay stub generation',
      reason: 'Kuwait workforce requires Arabic and English pay stubs',
      priority: 'important',
      suggestedTools: ['PDF generator', 'Payroll system'],
    },
  ],

  budget_management: [
    {
      category: 'input',
      description: 'Budget template builder',
      reason: 'Standardizes budget submission across departments',
      priority: 'important',
      suggestedTools: ['Adaptive Planning', 'Anaplan', 'Google Sheets'],
    },
    {
      category: 'processing',
      description: 'Actual vs budget comparison engine',
      reason: 'Enables variance analysis and trend identification',
      priority: 'critical',
      suggestedTools: ['Power BI', 'Tableau', 'Excel', 'Looker'],
    },
    {
      category: 'processing',
      description: 'Rolling forecast capability',
      reason: 'Updates forecasts based on actuals and trends',
      priority: 'important',
      suggestedTools: ['Adaptive Planning', 'Vena', 'Datarails'],
    },
    {
      category: 'notification',
      description: 'Variance threshold alerting',
      reason: 'Notifies budget owners when spending exceeds thresholds',
      priority: 'important',
      suggestedTools: ['Email', 'Slack', 'Custom alerts'],
    },
  ],

  financial_reporting: [
    {
      category: 'input',
      description: 'Multi-entity data aggregation',
      reason: 'Consolidates data from multiple systems and entities',
      priority: 'critical',
      suggestedTools: ['Workiva', 'BlackLine', 'Oracle EPM'],
    },
    {
      category: 'processing',
      description: 'IFRS-compliant statement generation',
      reason: 'Kuwait requires IFRS-compliant financial statements',
      priority: 'critical',
      suggestedTools: ['Workiva', 'Trintech', 'Accounting system'],
    },
    {
      category: 'processing',
      description: 'Currency translation engine',
      reason: 'Converts multi-currency transactions to KWD',
      priority: 'important',
      suggestedTools: ['ERP system', 'Treasury management'],
    },
    {
      category: 'output',
      description: 'Board presentation package',
      reason: 'Management needs professional report formatting',
      priority: 'important',
      suggestedTools: ['PowerPoint', 'Google Slides', 'Workiva'],
    },
  ],

  cash_flow_management: [
    {
      category: 'input',
      description: 'Real-time bank account integration',
      reason: 'Provides current cash positions across all accounts',
      priority: 'critical',
      suggestedTools: ['Plaid', 'Yodlee', 'Bank API', 'Kyriba'],
    },
    {
      category: 'processing',
      description: '13-week cash forecast model',
      reason: 'Standard treasury planning horizon',
      priority: 'critical',
      suggestedTools: ['Excel', 'Kyriba', 'GTreasury', 'Trovata'],
    },
    {
      category: 'processing',
      description: 'AR aging analysis',
      reason: 'Predicts cash inflows from receivables',
      priority: 'important',
      suggestedTools: ['Accounting system', 'BI tool'],
    },
    {
      category: 'notification',
      description: 'Low balance threshold alerts',
      reason: 'Warns treasury of potential cash shortfalls',
      priority: 'critical',
      suggestedTools: ['Email', 'SMS', 'Mobile alerts'],
    },
  ],

  accounts_receivable: [
    {
      category: 'input',
      description: 'Sales order/contract integration',
      reason: 'Triggers invoice generation from sales data',
      priority: 'important',
      suggestedTools: ['CRM system', 'ERP system'],
    },
    {
      category: 'processing',
      description: 'VAT-compliant invoice generation',
      reason: 'Kuwait requires specific invoice format with VAT details',
      priority: 'critical',
      suggestedTools: ['QuickBooks', 'Xero', 'Zoho Invoice'],
    },
    {
      category: 'processing',
      description: 'Automated collection sequences',
      reason: 'Systematic follow-up on overdue invoices',
      priority: 'important',
      suggestedTools: ['YayPay', 'Tesorio', 'Accounting system'],
    },
    {
      category: 'output',
      description: 'Multi-channel invoice delivery',
      reason: 'Customers prefer different delivery methods',
      priority: 'important',
      suggestedTools: ['Email', 'WhatsApp', 'Customer portal'],
    },
  ],

  accounts_payable: [
    {
      category: 'input',
      description: 'AI-powered invoice capture',
      reason: 'Extracts data from various invoice formats',
      priority: 'critical',
      suggestedTools: ['Rossum', 'ABBYY', 'Kofax', 'Tipalti'],
    },
    {
      category: 'processing',
      description: 'Duplicate payment detection',
      reason: 'Prevents paying the same invoice twice',
      priority: 'critical',
      suggestedTools: ['AP automation tool', 'Audit rules'],
    },
    {
      category: 'processing',
      description: 'Early payment discount optimization',
      reason: 'Captures discounts when cash position allows',
      priority: 'important',
      suggestedTools: ['Taulia', 'C2FO', 'AP automation'],
    },
    {
      category: 'output',
      description: 'Bank payment file generation',
      reason: 'Creates batch payment files for bank processing',
      priority: 'critical',
      suggestedTools: ['Bank integration', 'Treasury system'],
    },
  ],
};

// ============================================================================
// FINANCE TOOL RECOMMENDATIONS
// ============================================================================

export const FINANCE_TOOL_RECOMMENDATIONS: Record<string, ToolRecommendation[]> = {
  // Accounting & ERP
  accounting: [
    {
      toolSlug: 'QUICKBOOKS_ONLINE',
      toolName: 'QuickBooks Online',
      score: 95,
      reasons: [
        'Most popular SME accounting software globally',
        'Multi-currency support including KWD',
        'Strong invoice and expense features',
        'Excellent third-party integrations',
      ],
      regionalFit: 85,
      alternatives: [
        {
          toolSlug: 'XERO',
          toolName: 'Xero',
          reason: 'Better bank reconciliation features',
          tradeoff: 'Less popular in Middle East region',
        },
        {
          toolSlug: 'ZOHO_BOOKS',
          toolName: 'Zoho Books',
          reason: 'More affordable, Arabic interface available',
          tradeoff: 'Smaller ecosystem of integrations',
        },
      ],
    },
    {
      toolSlug: 'XERO',
      toolName: 'Xero',
      score: 90,
      reasons: [
        'Excellent bank reconciliation',
        'Modern, user-friendly interface',
        'Strong multi-currency support',
        'Good API for integrations',
      ],
      regionalFit: 80,
      alternatives: [],
    },
    {
      toolSlug: 'FRESHBOOKS',
      toolName: 'FreshBooks',
      score: 85,
      reasons: [
        'Best for service-based businesses',
        'Time tracking and invoicing combined',
        'Easy to use for non-accountants',
      ],
      regionalFit: 75,
      alternatives: [],
    },
    {
      toolSlug: 'ZOHO_BOOKS',
      toolName: 'Zoho Books',
      score: 88,
      reasons: [
        'Arabic interface available',
        'Affordable for SMEs',
        'Part of comprehensive Zoho ecosystem',
        'VAT-compliant invoicing',
      ],
      regionalFit: 92,
      alternatives: [],
    },
  ],

  // Expense Management
  expense: [
    {
      toolSlug: 'EXPENSIFY',
      toolName: 'Expensify',
      score: 96,
      reasons: [
        'Industry-leading receipt OCR (SmartScan)',
        'Automatic expense categorization',
        'Multi-currency support',
        'Corporate card reconciliation',
      ],
      regionalFit: 85,
      alternatives: [
        {
          toolSlug: 'SAP_CONCUR',
          toolName: 'SAP Concur',
          reason: 'Enterprise-grade with travel integration',
          tradeoff: 'Higher cost and complexity',
        },
      ],
    },
    {
      toolSlug: 'ZOHO_EXPENSE',
      toolName: 'Zoho Expense',
      score: 88,
      reasons: [
        'Affordable pricing',
        'Arabic language support',
        'Integrates with Zoho ecosystem',
        'Good mobile app',
      ],
      regionalFit: 93,
      alternatives: [],
    },
    {
      toolSlug: 'SAP_CONCUR',
      toolName: 'SAP Concur',
      score: 92,
      reasons: [
        'Enterprise-grade expense management',
        'Travel booking integration',
        'Strong compliance controls',
        'Global coverage',
      ],
      regionalFit: 80,
      alternatives: [],
    },
    {
      toolSlug: 'RYDOO',
      toolName: 'Rydoo',
      score: 85,
      reasons: [
        'European compliance focus',
        'Per diem calculations',
        'Mileage tracking',
      ],
      regionalFit: 70,
      alternatives: [],
    },
  ],

  // Payroll
  payroll: [
    {
      toolSlug: 'GUSTO',
      toolName: 'Gusto',
      score: 94,
      reasons: [
        'User-friendly payroll processing',
        'Automatic tax calculations',
        'Benefits administration',
        'Time tracking integration',
      ],
      regionalFit: 60, // US-focused
      alternatives: [
        {
          toolSlug: 'ADP',
          toolName: 'ADP',
          reason: 'Global coverage including Middle East',
          tradeoff: 'Higher cost and complexity',
        },
      ],
    },
    {
      toolSlug: 'ADP',
      toolName: 'ADP',
      score: 92,
      reasons: [
        'Global payroll capabilities',
        'Middle East presence',
        'Compliance expertise',
        'Multi-country support',
      ],
      regionalFit: 85,
      alternatives: [],
    },
    {
      toolSlug: 'ZOHO_PAYROLL',
      toolName: 'Zoho Payroll',
      score: 86,
      reasons: [
        'Affordable for SMEs',
        'Regional compliance features',
        'Arabic interface',
        'End of service calculation',
      ],
      regionalFit: 90,
      alternatives: [],
    },
    {
      toolSlug: 'BAMBOOHR',
      toolName: 'BambooHR',
      score: 88,
      reasons: [
        'HR + Payroll integration',
        'Easy to use interface',
        'Time tracking included',
        'Employee self-service',
      ],
      regionalFit: 75,
      alternatives: [],
    },
  ],

  // Invoice Processing & AP Automation
  invoice_processing: [
    {
      toolSlug: 'ROSSUM',
      toolName: 'Rossum',
      score: 95,
      reasons: [
        'AI-powered invoice extraction',
        'Highest accuracy OCR',
        'Multi-language support',
        'Learns from corrections',
      ],
      regionalFit: 80,
      alternatives: [],
    },
    {
      toolSlug: 'TIPALTI',
      toolName: 'Tipalti',
      score: 93,
      reasons: [
        'End-to-end AP automation',
        'Global payment capabilities',
        'Tax compliance (1099, W-8)',
        'Vendor management',
      ],
      regionalFit: 75,
      alternatives: [],
    },
    {
      toolSlug: 'BILL_COM',
      toolName: 'Bill.com',
      score: 91,
      reasons: [
        'Popular SME AP automation',
        'Bank payment integration',
        'Approval workflows',
        'QuickBooks/Xero integration',
      ],
      regionalFit: 70,
      alternatives: [],
    },
    {
      toolSlug: 'NANONETS',
      toolName: 'Nanonets',
      score: 88,
      reasons: [
        'Affordable AI OCR',
        'Custom field extraction',
        'API-first approach',
        'Quick setup',
      ],
      regionalFit: 85,
      alternatives: [],
    },
  ],

  // Treasury & Cash Management
  treasury: [
    {
      toolSlug: 'KYRIBA',
      toolName: 'Kyriba',
      score: 94,
      reasons: [
        'Enterprise treasury management',
        'Cash forecasting',
        'Bank connectivity',
        'Risk management',
      ],
      regionalFit: 80,
      alternatives: [],
    },
    {
      toolSlug: 'TROVATA',
      toolName: 'Trovata',
      score: 90,
      reasons: [
        'Modern cash management',
        'AI-powered forecasting',
        'Bank API integration',
        'User-friendly interface',
      ],
      regionalFit: 75,
      alternatives: [],
    },
  ],

  // Financial Planning & Analysis
  fpa: [
    {
      toolSlug: 'ADAPTIVE_PLANNING',
      toolName: 'Workday Adaptive Planning',
      score: 95,
      reasons: [
        'Leading FP&A platform',
        'Multi-dimensional modeling',
        'Rolling forecasts',
        'Scenario planning',
      ],
      regionalFit: 80,
      alternatives: [],
    },
    {
      toolSlug: 'DATARAILS',
      toolName: 'Datarails',
      score: 88,
      reasons: [
        'Excel-native FP&A',
        'Automated consolidation',
        'Version control',
        'Collaboration features',
      ],
      regionalFit: 85,
      alternatives: [],
    },
  ],

  // Payment Processing - Kuwait Specific
  payment_kuwait: [
    {
      toolSlug: 'KNET_INTEGRATION',
      toolName: 'KNET Payment Gateway',
      score: 98,
      reasons: [
        'Kuwait national payment network',
        'Mandatory for local transactions',
        'Lowest transaction fees in Kuwait',
        'Highest customer trust',
      ],
      regionalFit: 100,
      alternatives: [
        {
          toolSlug: 'TAP_PAYMENTS',
          toolName: 'Tap Payments',
          reason: 'Modern API, supports multiple payment methods',
          tradeoff: 'Additional fees on top of KNET',
        },
      ],
    },
    {
      toolSlug: 'TAP_PAYMENTS',
      toolName: 'Tap Payments',
      score: 90,
      reasons: [
        'Modern payment API',
        'Supports KNET + cards',
        'Apple Pay, Google Pay',
        'Developer-friendly',
      ],
      regionalFit: 95,
      alternatives: [],
    },
    {
      toolSlug: 'MYFATOORAH',
      toolName: 'MyFatoorah',
      score: 88,
      reasons: [
        'Kuwait-based provider',
        'Arabic interface',
        'Multiple GCC currencies',
        'VAT invoice generation',
      ],
      regionalFit: 95,
      alternatives: [],
    },
  ],
};

// ============================================================================
// KUWAIT / REGIONAL CONTEXT
// ============================================================================

export const FINANCE_REGIONAL_CONTEXT: Record<string, FinanceRegionalContext> = {
  kuwait: {
    region: 'Kuwait',
    currency: 'Kuwaiti Dinar',
    currencySymbol: 'KWD',
    vatRate: 5,
    vatImplementedDate: '2024-01-01',
    fiscalYearStart: 'January 1',
    fiscalYearEnd: 'December 31',
    businessDays: 'Sunday-Thursday',
    laborLawReference: 'Kuwait Labor Law No. 6 of 2010',
    paymentMethods: ['KNET', 'Bank Transfer', 'Credit Card', 'Cash'],
    bankingHours: '8:00 AM - 1:00 PM (Sun-Thu)',
    complianceRequirements: [
      'VAT 5% on goods and services (effective 2024)',
      'PIFSS social security contributions (employer 11.5%, employee 8%)',
      'End of service indemnity per Kuwait Labor Law Article 51',
      'Wage Protection System (WPS) for salary payments',
      'Commercial Registration with Ministry of Commerce',
      'Annual financial statements audit requirement',
      'IFRS compliance for financial reporting',
    ],
  },
  uae: {
    region: 'United Arab Emirates',
    currency: 'UAE Dirham',
    currencySymbol: 'AED',
    vatRate: 5,
    vatImplementedDate: '2018-01-01',
    fiscalYearStart: 'January 1',
    fiscalYearEnd: 'December 31',
    businessDays: 'Monday-Friday',
    laborLawReference: 'UAE Labor Law (Federal Decree-Law No. 33 of 2021)',
    paymentMethods: ['Bank Transfer', 'Credit Card', 'Cash'],
    bankingHours: '8:00 AM - 3:00 PM (Mon-Fri)',
    complianceRequirements: [
      'VAT 5% on goods and services',
      'End of service gratuity per UAE Labor Law',
      'WPS for salary payments',
      'Corporate tax (9% effective 2023)',
    ],
  },
  saudi: {
    region: 'Saudi Arabia',
    currency: 'Saudi Riyal',
    currencySymbol: 'SAR',
    vatRate: 15,
    vatImplementedDate: '2020-07-01',
    fiscalYearStart: 'January 1',
    fiscalYearEnd: 'December 31',
    businessDays: 'Sunday-Thursday',
    laborLawReference: 'Saudi Labor Law (Royal Decree No. M/51)',
    paymentMethods: ['SADAD', 'MADA', 'Bank Transfer', 'Credit Card'],
    bankingHours: '9:00 AM - 4:30 PM (Sun-Thu)',
    complianceRequirements: [
      'VAT 15% on goods and services',
      'GOSI social insurance',
      'End of service per Saudi Labor Law',
      'Zakat on business',
      'E-invoicing (FATOORA) mandatory',
    ],
  },
};

// ============================================================================
// KUWAIT SPECIFIC: END OF SERVICE CALCULATION
// ============================================================================

/**
 * Kuwait Labor Law Article 51 - End of Service Indemnity Calculation
 *
 * For employees with unlimited contracts:
 * - First 5 years: 15 days per year of service
 * - After 5 years: 1 month per year of service
 *
 * Maximum: 1.5 years (18 months) of salary
 */
export function calculateKuwaitEndOfService(
  yearsOfService: number,
  monthlyBaseSalary: number,
  includeAllowances: boolean = false
): EndOfServiceCalculation {
  let entitlement = 0;
  const dailySalary = monthlyBaseSalary / 26; // Kuwait uses 26 working days

  if (yearsOfService <= 5) {
    // First 5 years: 15 days per year
    entitlement = yearsOfService * 15 * dailySalary;
  } else {
    // First 5 years at 15 days + remaining years at 30 days
    const firstFiveYears = 5 * 15 * dailySalary;
    const remainingYears = (yearsOfService - 5) * 30 * dailySalary;
    entitlement = firstFiveYears + remainingYears;
  }

  // Maximum cap: 1.5 years (18 months) of salary
  const maxEntitlement = monthlyBaseSalary * 18;
  entitlement = Math.min(entitlement, maxEntitlement);

  const notes: string[] = [
    'Based on Kuwait Labor Law Article 51',
    'Daily salary calculated as monthly / 26 working days',
    'Maximum entitlement capped at 18 months salary',
  ];

  if (!includeAllowances) {
    notes.push('Calculation based on basic salary only (excludes allowances)');
  }

  return {
    yearsOfService,
    monthlyBaseSalary,
    entitlement: Math.round(entitlement * 1000) / 1000, // Round to 3 decimal places (KWD fils)
    formula: yearsOfService <= 5
      ? `${yearsOfService} years x 15 days x (${monthlyBaseSalary} / 26)`
      : `(5 years x 15 days + ${yearsOfService - 5} years x 30 days) x (${monthlyBaseSalary} / 26)`,
    notes,
  };
}

/**
 * Kuwait VAT Calculation (5%)
 */
export function calculateKuwaitVAT(
  amount: number,
  isInclusive: boolean = false
): { netAmount: number; vatAmount: number; grossAmount: number; vatRate: number } {
  const vatRate = 0.05;

  if (isInclusive) {
    const netAmount = amount / (1 + vatRate);
    const vatAmount = amount - netAmount;
    return {
      netAmount: Math.round(netAmount * 1000) / 1000,
      vatAmount: Math.round(vatAmount * 1000) / 1000,
      grossAmount: amount,
      vatRate: 5,
    };
  } else {
    const vatAmount = amount * vatRate;
    return {
      netAmount: amount,
      vatAmount: Math.round(vatAmount * 1000) / 1000,
      grossAmount: Math.round((amount + vatAmount) * 1000) / 1000,
      vatRate: 5,
    };
  }
}

// ============================================================================
// FINANCE DOMAIN INTELLIGENCE CLASS
// ============================================================================

export class FinanceDomainIntelligence {
  private region: string;
  private regionalContext: FinanceRegionalContext | null;

  constructor(region: string = 'kuwait') {
    this.region = region.toLowerCase();
    this.regionalContext = FINANCE_REGIONAL_CONTEXT[this.region] || null;
  }

  /**
   * Detect finance workflow pattern from user request
   */
  detectFinancePattern(request: string): string | null {
    const normalizedRequest = request.toLowerCase();
    let bestMatch: string | null = null;
    let highestScore = 0;

    for (const [pattern, keywords] of Object.entries(FINANCE_KEYWORDS)) {
      const score = keywords.filter(kw =>
        normalizedRequest.includes(kw.toLowerCase())
      ).length;

      if (score > highestScore) {
        highestScore = score;
        bestMatch = pattern;
      }
    }

    // Require at least 1 keyword match for finance patterns
    return highestScore >= 1 ? bestMatch : null;
  }

  /**
   * Get implicit requirements for a finance pattern
   */
  getImplicitRequirements(pattern: string): ImplicitRequirement[] {
    const requirements = FINANCE_IMPLICIT_REQUIREMENTS[pattern] || [];

    // Add regional compliance requirements
    if (this.regionalContext && pattern) {
      const patternDef = FINANCE_WORKFLOW_PATTERNS[pattern];
      if (patternDef?.complianceRequirements) {
        patternDef.complianceRequirements.forEach((req, index) => {
          requirements.push({
            category: 'processing',
            description: req,
            reason: `Required for ${this.regionalContext!.region} compliance`,
            priority: index === 0 ? 'critical' : 'important',
            suggestedTools: ['Compliance module', 'Local accountant'],
          });
        });
      }
    }

    return requirements;
  }

  /**
   * Get tool recommendations for a finance pattern
   */
  getToolRecommendations(pattern: string, region?: string): ToolRecommendation[] {
    const effectiveRegion = region || this.region;
    const recommendations: ToolRecommendation[] = [];

    // Map pattern to tool category
    const categoryMapping: Record<string, string[]> = {
      invoice_processing: ['invoice_processing', 'accounting'],
      expense_management: ['expense', 'accounting'],
      payroll_processing: ['payroll'],
      budget_management: ['fpa', 'accounting'],
      financial_reporting: ['fpa', 'accounting'],
      cash_flow_management: ['treasury', 'accounting'],
      accounts_receivable: ['accounting', 'payment_kuwait'],
      accounts_payable: ['invoice_processing', 'accounting'],
    };

    const categories = categoryMapping[pattern] || ['accounting'];

    // Get tools from each category
    categories.forEach(category => {
      const categoryTools = FINANCE_TOOL_RECOMMENDATIONS[category] || [];
      recommendations.push(...categoryTools);
    });

    // Add Kuwait-specific payment tools if region is Kuwait
    if (effectiveRegion === 'kuwait' && !categories.includes('payment_kuwait')) {
      const kuwaitPaymentTools = FINANCE_TOOL_RECOMMENDATIONS.payment_kuwait || [];
      recommendations.push(...kuwaitPaymentTools);
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
   * Get clarifying questions for a finance pattern
   */
  getClarifyingQuestions(pattern: string): ClarifyingQuestion[] {
    const questions: ClarifyingQuestion[] = [];
    const patternDef = FINANCE_WORKFLOW_PATTERNS[pattern];
    let questionId = 1;

    if (!patternDef) return questions;

    // Pattern-specific questions from the pattern definition
    patternDef.questions.forEach((questionText, index) => {
      questions.push({
        id: `finance_q${questionId++}`,
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
        id: `finance_q${questionId++}`,
        question: 'Do you need VAT-compliant invoices (5% Kuwait VAT)?',
        category: 'region',
        options: [
          { value: 'yes', label: 'Yes', description: 'Generate VAT-compliant invoices', implications: ['Will include VAT calculation and TIN validation'] },
          { value: 'no', label: 'No', description: 'VAT not applicable' },
        ],
        required: true,
        relevanceScore: 95,
      });

      if (pattern === 'payroll_processing') {
        questions.push({
          id: `finance_q${questionId++}`,
          question: 'Do you need WPS (Wage Protection System) compliant salary files?',
          category: 'region',
          options: [
            { value: 'yes', label: 'Yes', description: 'Generate WPS-compliant bank files', implications: ['Will generate files in Kuwait WPS format'] },
            { value: 'no', label: 'No', description: 'Standard bank transfer format' },
          ],
          required: true,
          relevanceScore: 95,
        });

        questions.push({
          id: `finance_q${questionId++}`,
          question: 'Should end-of-service indemnity be calculated per Kuwait Labor Law?',
          category: 'region',
          options: [
            { value: 'yes', label: 'Yes', description: 'Auto-calculate EOS per Article 51', implications: ['Will track and accrue EOS liability'] },
            { value: 'no', label: 'No', description: 'Manual EOS tracking' },
          ],
          required: true,
          relevanceScore: 90,
        });
      }

      if (pattern === 'accounts_receivable' || pattern === 'invoice_processing') {
        questions.push({
          id: `finance_q${questionId++}`,
          question: 'Which payment methods should customers be able to use?',
          category: 'integration',
          options: [
            { value: 'knet', label: 'KNET', description: 'Kuwait national debit network', implications: ['Requires KNET merchant account'] },
            { value: 'card', label: 'Credit/Debit Cards', description: 'Visa, Mastercard', implications: ['May have higher fees'] },
            { value: 'bank_transfer', label: 'Bank Transfer', description: 'Direct bank payment' },
            { value: 'all', label: 'All Methods', description: 'KNET, cards, and bank transfer' },
          ],
          required: false,
          relevanceScore: 85,
        });
      }
    }

    return questions;
  }

  /**
   * Get the workflow chain for a finance pattern
   */
  getWorkflowChain(pattern: string): WorkflowChainStep[] {
    const patternDef = FINANCE_WORKFLOW_PATTERNS[pattern];
    if (!patternDef) return [];

    const chain: WorkflowChainStep[] = [];

    patternDef.steps.forEach((stepName, index) => {
      const layer = patternDef.layers[Math.min(index, patternDef.layers.length - 1)];
      const implicitReq = FINANCE_IMPLICIT_REQUIREMENTS[pattern]?.[index];

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
   * Get regional context for finance operations
   */
  getRegionalContext(): FinanceRegionalContext | null {
    return this.regionalContext;
  }

  /**
   * Get VAT rate for the current region
   */
  getVATRate(): number {
    return this.regionalContext?.vatRate || 0;
  }

  /**
   * Calculate VAT for an amount
   */
  calculateVAT(amount: number, isInclusive: boolean = false): ReturnType<typeof calculateKuwaitVAT> {
    if (this.region === 'kuwait') {
      return calculateKuwaitVAT(amount, isInclusive);
    }

    // Generic VAT calculation for other regions
    const vatRate = this.getVATRate() / 100;
    if (isInclusive) {
      const netAmount = amount / (1 + vatRate);
      const vatAmount = amount - netAmount;
      return {
        netAmount: Math.round(netAmount * 100) / 100,
        vatAmount: Math.round(vatAmount * 100) / 100,
        grossAmount: amount,
        vatRate: this.getVATRate(),
      };
    } else {
      const vatAmount = amount * vatRate;
      return {
        netAmount: amount,
        vatAmount: Math.round(vatAmount * 100) / 100,
        grossAmount: Math.round((amount + vatAmount) * 100) / 100,
        vatRate: this.getVATRate(),
      };
    }
  }

  /**
   * Calculate end of service for Kuwait employees
   */
  calculateEndOfService(yearsOfService: number, monthlyBaseSalary: number): EndOfServiceCalculation | null {
    if (this.region !== 'kuwait') {
      return null;
    }
    return calculateKuwaitEndOfService(yearsOfService, monthlyBaseSalary);
  }

  /**
   * Get compliance requirements for the current region
   */
  getComplianceRequirements(): string[] {
    return this.regionalContext?.complianceRequirements || [];
  }

  /**
   * Validate if an amount is within reasonable bounds for KWD
   * (KWD is the highest-valued currency, so amounts are typically smaller)
   */
  validateKWDAmount(amount: number, context: 'invoice' | 'expense' | 'salary'): {
    valid: boolean;
    warning?: string;
  } {
    if (this.region !== 'kuwait') {
      return { valid: true };
    }

    const thresholds = {
      invoice: { min: 0.001, max: 10000000, warning: 10000 },
      expense: { min: 0.001, max: 10000, warning: 1000 },
      salary: { min: 100, max: 50000, warning: 10000 },
    };

    const threshold = thresholds[context];

    if (amount < threshold.min || amount > threshold.max) {
      return {
        valid: false,
        warning: `Amount ${amount} KWD seems unusual for ${context}. Expected range: ${threshold.min} - ${threshold.max} KWD`,
      };
    }

    if (amount > threshold.warning) {
      return {
        valid: true,
        warning: `Amount ${amount} KWD is above typical ${context} amount of ${threshold.warning} KWD. Please verify.`,
      };
    }

    return { valid: true };
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private categorizeQuestion(questionText: string): ClarifyingQuestion['category'] {
    const text = questionText.toLowerCase();

    if (text.includes('how often') || text.includes('frequency') || text.includes('cycle')) {
      return 'frequency';
    }
    if (text.includes('who') || text.includes('team') || text.includes('employee')) {
      return 'audience';
    }
    if (text.includes('format') || text.includes('template')) {
      return 'format';
    }
    if (text.includes('platform') || text.includes('software') || text.includes('system')) {
      return 'platform';
    }
    if (text.includes('region') || text.includes('country') || text.includes('vat')) {
      return 'region';
    }

    return 'integration';
  }

  private generateOptionsForQuestion(questionText: string, _pattern: string): QuestionOption[] {
    const text = questionText.toLowerCase();

    // How are invoices received
    if (text.includes('how are invoices') || text.includes('how do you receive')) {
      return [
        { value: 'email', label: 'Email', description: 'Invoices arrive via email' },
        { value: 'upload', label: 'Upload Portal', description: 'Vendors upload to portal' },
        { value: 'mail', label: 'Physical Mail', description: 'Paper invoices scanned' },
        { value: 'all', label: 'All Methods', description: 'Multiple invoice sources' },
      ];
    }

    // Accounting system
    if (text.includes('accounting system') || text.includes('which accounting')) {
      return [
        { value: 'quickbooks', label: 'QuickBooks', description: 'QuickBooks Online' },
        { value: 'xero', label: 'Xero', description: 'Xero accounting' },
        { value: 'zoho', label: 'Zoho Books', description: 'Zoho Books' },
        { value: 'sap', label: 'SAP', description: 'SAP Business One or S/4HANA' },
        { value: 'other', label: 'Other', description: 'Different system' },
      ];
    }

    // Approval threshold
    if (text.includes('approval threshold') || text.includes('approval hierarchy')) {
      return [
        { value: 'single', label: 'Single Approval', description: 'One approver for all' },
        { value: 'tiered', label: 'Tiered Approval', description: 'Different levels by amount' },
        { value: 'department', label: 'Department Based', description: 'Department head approves' },
      ];
    }

    // Pay cycle
    if (text.includes('pay cycle') || text.includes('payroll cycle')) {
      return [
        { value: 'monthly', label: 'Monthly', description: 'Once per month' },
        { value: 'biweekly', label: 'Bi-weekly', description: 'Every two weeks' },
        { value: 'weekly', label: 'Weekly', description: 'Every week' },
      ];
    }

    // Report frequency
    if (text.includes('how often') || text.includes('frequency')) {
      return [
        { value: 'daily', label: 'Daily', description: 'Every business day' },
        { value: 'weekly', label: 'Weekly', description: 'Once per week' },
        { value: 'monthly', label: 'Monthly', description: 'Once per month' },
        { value: 'quarterly', label: 'Quarterly', description: 'Every quarter' },
      ];
    }

    // Default options
    return [
      { value: 'yes', label: 'Yes', description: 'Enable this feature' },
      { value: 'no', label: 'No', description: 'Skip this feature' },
    ];
  }

  private humanizeStepName(stepName: string): string {
    const mapping: Record<string, string> = {
      receive_invoice: 'Receive and capture invoice',
      extract_data: 'Extract invoice data (OCR/AI)',
      validate_details: 'Validate vendor and amount details',
      route_approval: 'Route to appropriate approver',
      process_payment: 'Process payment',
      reconcile_accounts: 'Reconcile with accounting records',
      submit_expense: 'Employee submits expense with receipt',
      categorize_expense: 'Auto-categorize expense',
      validate_policy: 'Validate against expense policy',
      process_reimbursement: 'Process reimbursement',
      update_accounting: 'Update accounting records',
      collect_time_data: 'Collect time and attendance data',
      calculate_gross: 'Calculate gross pay',
      apply_deductions: 'Apply deductions and taxes',
      calculate_net: 'Calculate net pay',
      approve_payroll: 'Approve payroll run',
      disburse_payments: 'Disburse salary payments',
      generate_pay_stubs: 'Generate pay stubs',
      submit_reports: 'Submit regulatory reports',
      create_budget: 'Create budget template',
      allocate_funds: 'Allocate funds to departments',
      track_spending: 'Track actual spending',
      analyze_variance: 'Analyze budget variance',
      adjust_forecast: 'Adjust rolling forecast',
      generate_reports: 'Generate management reports',
      collect_data: 'Collect financial data',
      consolidate_entities: 'Consolidate legal entities',
      apply_adjustments: 'Apply period-end adjustments',
      generate_statements: 'Generate financial statements',
      review_approve: 'Review and approve statements',
      distribute_reports: 'Distribute to stakeholders',
      collect_receivables_data: 'Collect AR aging data',
      collect_payables_data: 'Collect AP schedule data',
      generate_forecast: 'Generate cash flow forecast',
      monitor_positions: 'Monitor cash positions',
      alert_thresholds: 'Alert on threshold breaches',
      optimize_timing: 'Optimize payment timing',
      generate_invoice: 'Generate customer invoice',
      send_invoice: 'Send invoice to customer',
      track_payment: 'Track payment status',
      send_reminders: 'Send payment reminders',
      apply_payment: 'Apply received payment',
      reconcile_account: 'Reconcile customer account',
      match_documents: 'Match PO, receipt, invoice',
      schedule_payment: 'Schedule payment date',
      record_transaction: 'Record payment transaction',
      notify_vendor: 'Notify vendor of payment',
    };

    return mapping[stepName] || stepName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default FinanceDomainIntelligence;

// Convenience functions
export function createFinanceIntelligence(region: string = 'kuwait'): FinanceDomainIntelligence {
  return new FinanceDomainIntelligence(region);
}

export function detectFinanceWorkflow(request: string, region: string = 'kuwait'): {
  pattern: string | null;
  requirements: ImplicitRequirement[];
  tools: ToolRecommendation[];
  questions: ClarifyingQuestion[];
} {
  const intelligence = new FinanceDomainIntelligence(region);
  const pattern = intelligence.detectFinancePattern(request);

  return {
    pattern,
    requirements: pattern ? intelligence.getImplicitRequirements(pattern) : [],
    tools: pattern ? intelligence.getToolRecommendations(pattern) : [],
    questions: pattern ? intelligence.getClarifyingQuestions(pattern) : [],
  };
}
