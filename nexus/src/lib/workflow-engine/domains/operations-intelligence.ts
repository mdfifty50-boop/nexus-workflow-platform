/**
 * Nexus Operations Domain Intelligence Module
 *
 * Provides comprehensive operations workflow intelligence including:
 * - Purchase requisition and procurement
 * - Inventory management and reordering
 * - Supplier onboarding and evaluation
 * - Quality inspection and compliance
 * - Shipping and logistics coordination
 * - Returns processing and RMA management
 * - Maintenance and facilities management
 * - Asset tracking and lifecycle management
 * - Incident reporting and resolution
 * - SLA monitoring and capacity planning
 *
 * Regional Focus: Kuwait/Gulf with local logistics providers,
 * customs clearance, and regional compliance requirements.
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

export interface OperationsWorkflowPattern {
  name: string;
  description: string;
  layers: ('input' | 'processing' | 'output' | 'notification')[];
  steps: string[];
  implicitNeeds: string[];
  questions: string[];
  complianceRequirements: string[];
  estimatedROI: string;
}

export interface OperationsRegionalContext {
  region: string;
  customsClearance: string;
  importRegulations: string;
  preferredLogistics: string[];
  workweek: string;
  holidays: string;
  portAccess: string;
  freeTradeZones: string;
  warehousingStandards: string[];
  localSupplierNetwork: string[];
}

export interface ReorderCalculation {
  averageDailyUsage: number;
  leadTimeDays: number;
  safetyStock: number;
  reorderPoint: number;
  economicOrderQuantity: number;
  formula: string;
  notes: string[];
}

export interface InventoryTurnoverAnalysis {
  cogs: number;
  averageInventory: number;
  turnoverRatio: number;
  daysInventoryOutstanding: number;
  interpretation: string;
  recommendations: string[];
}

export interface SupplierScorecard {
  supplierId: string;
  qualityScore: number;
  deliveryScore: number;
  priceScore: number;
  serviceScore: number;
  overallScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export interface MaintenanceSchedule {
  assetId: string;
  maintenanceType: 'preventive' | 'predictive' | 'corrective';
  frequency: string;
  lastPerformed: Date | null;
  nextDue: Date;
  estimatedDowntime: string;
  cost: number;
}

// ============================================================================
// OPERATIONS WORKFLOW PATTERNS
// ============================================================================

export const OPERATIONS_WORKFLOW_PATTERNS: Record<string, OperationsWorkflowPattern> = {
  // Purchase Requisition Pattern
  purchase_requisition: {
    name: 'Purchase Requisition',
    description: 'End-to-end purchase request automation from submission to PO generation',
    layers: ['input', 'processing', 'processing', 'output', 'notification'],
    steps: [
      'submit_requisition',
      'validate_budget',
      'compare_vendors',
      'route_approval',
      'generate_po',
      'notify_stakeholders',
    ],
    implicitNeeds: [
      'Requisition form/portal for request submission',
      'Budget checking against department allocations',
      'Vendor comparison and selection engine',
      'Multi-tier approval workflow based on amount',
      'Purchase order generation and distribution',
      'Audit trail and document storage',
      'Notification system for approvals and status updates',
    ],
    questions: [
      'What is your approval hierarchy for different purchase amounts?',
      'Do you have a preferred vendor list?',
      'What budget thresholds trigger additional approvals?',
      'Should POs be automatically sent to vendors upon approval?',
      'Do you require three-way matching (PO, receipt, invoice)?',
    ],
    complianceRequirements: [
      'KDIPA procurement regulations for government contracts',
      'Vendor registration and commercial license verification',
      'Import permit requirements for restricted goods',
    ],
    estimatedROI: 'Reduces procurement cycle by 60%, ensures compliance 100%',
  },

  // Inventory Reorder Pattern
  inventory_reorder: {
    name: 'Inventory Reorder',
    description: 'Automated inventory monitoring and replenishment workflow',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'monitor_stock_levels',
      'calculate_reorder_point',
      'generate_requisition',
      'select_vendor',
      'create_purchase_order',
      'notify_warehouse',
    ],
    implicitNeeds: [
      'Real-time inventory level monitoring',
      'Reorder point calculation engine (safety stock + lead time)',
      'Automatic requisition generation',
      'Vendor selection based on price/availability',
      'PO creation and submission',
      'Warehouse receiving preparation',
      'Lead time tracking and adjustment',
    ],
    questions: [
      'What inventory management system do you use?',
      'How do you calculate safety stock levels?',
      'What is the typical lead time from your suppliers?',
      'Do you use ABC analysis for inventory classification?',
      'Should low-stock alerts go to multiple stakeholders?',
    ],
    complianceRequirements: [
      'FIFO/LIFO compliance for perishable goods',
      'Batch tracking for recalls',
      'Temperature monitoring for cold chain items',
    ],
    estimatedROI: 'Reduces stockouts by 85%, excess inventory by 40%',
  },

  // Supplier Onboarding Pattern
  supplier_onboarding: {
    name: 'Supplier Onboarding',
    description: 'Comprehensive supplier registration and qualification process',
    layers: ['input', 'processing', 'processing', 'output', 'notification'],
    steps: [
      'collect_supplier_info',
      'verify_documents',
      'conduct_risk_assessment',
      'perform_due_diligence',
      'approve_supplier',
      'setup_master_data',
      'notify_procurement',
    ],
    implicitNeeds: [
      'Supplier registration portal/form',
      'Document collection and verification (CR, tax, insurance)',
      'Risk assessment scoring system',
      'Due diligence checks (financial, legal, compliance)',
      'Approval workflow for new suppliers',
      'ERP/vendor master data integration',
      'Onboarding communication sequence',
    ],
    questions: [
      'What documents do you require from suppliers?',
      'Do you perform credit checks on new vendors?',
      'What risk factors are most important to assess?',
      'How long should the onboarding process take?',
      'Do suppliers need to sign specific terms and conditions?',
    ],
    complianceRequirements: [
      'Kuwait Chamber of Commerce membership verification',
      'Commercial Registration (CR) validation',
      'Tax registration number verification',
      'Insurance certificate requirements',
    ],
    estimatedROI: 'Reduces onboarding time by 70%, improves vendor quality by 50%',
  },

  // Quality Inspection Pattern
  quality_inspection: {
    name: 'Quality Inspection',
    description: 'Automated quality control inspection and reporting workflow',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'receive_shipment',
      'generate_inspection_checklist',
      'perform_inspection',
      'record_findings',
      'categorize_defects',
      'route_disposition',
      'generate_report',
    ],
    implicitNeeds: [
      'Shipment receipt trigger from warehouse',
      'Dynamic checklist generation based on product type',
      'Mobile inspection interface',
      'Defect logging with photos/evidence',
      'Defect categorization and severity scoring',
      'Accept/reject/rework decision routing',
      'Quality report generation and distribution',
    ],
    questions: [
      'What are your acceptance quality levels (AQL)?',
      'Do you use sampling inspection or 100% inspection?',
      'What defect categories do you track?',
      'Should rejected shipments trigger automatic returns?',
      'Who needs to approve quality exceptions?',
    ],
    complianceRequirements: [
      'KSQC (Kuwait Standards and Quality Control) requirements',
      'Industry-specific certifications (ISO, HACCP, etc.)',
      'Traceability requirements for regulated products',
    ],
    estimatedROI: 'Reduces quality escapes by 90%, inspection time by 50%',
  },

  // Shipping Coordination Pattern
  shipping_coordination: {
    name: 'Shipping Coordination',
    description: 'End-to-end shipment management from booking to delivery',
    layers: ['input', 'processing', 'processing', 'output', 'notification'],
    steps: [
      'receive_shipping_request',
      'select_carrier',
      'prepare_documentation',
      'book_shipment',
      'track_shipment',
      'clear_customs',
      'confirm_delivery',
    ],
    implicitNeeds: [
      'Shipping request capture from sales/warehouse',
      'Carrier selection and rate comparison',
      'Documentation preparation (packing list, commercial invoice)',
      'Shipment booking and label generation',
      'Real-time tracking integration',
      'Customs clearance coordination',
      'Delivery confirmation and POD collection',
    ],
    questions: [
      'What carriers do you typically use?',
      'Do you ship internationally or domestically?',
      'What documentation is required for your shipments?',
      'Do you need customs brokerage services?',
      'Should customers receive automated tracking updates?',
    ],
    complianceRequirements: [
      'Kuwait Customs Authority (KCA) documentation',
      'GCC customs union regulations',
      'Dangerous goods shipping certifications',
      'Country of origin documentation',
    ],
    estimatedROI: 'Reduces shipping errors by 75%, transit time by 20%',
  },

  // Returns Processing Pattern
  returns_processing: {
    name: 'Returns Processing',
    description: 'Customer returns and RMA management workflow',
    layers: ['input', 'processing', 'processing', 'output', 'notification'],
    steps: [
      'receive_return_request',
      'validate_return_policy',
      'generate_rma',
      'receive_returned_item',
      'inspect_condition',
      'process_disposition',
      'issue_refund_credit',
      'update_inventory',
    ],
    implicitNeeds: [
      'Return request portal/API',
      'Policy validation engine',
      'RMA number generation and tracking',
      'Return shipping label generation',
      'Receiving and inspection workflow',
      'Disposition decision (restock, refurbish, scrap)',
      'Refund/credit processing integration',
      'Inventory adjustment automation',
    ],
    questions: [
      'What is your return policy timeframe?',
      'Do you charge restocking fees?',
      'Should return labels be prepaid or customer-paid?',
      'How do you handle defective vs. changed-mind returns?',
      'What system handles refunds?',
    ],
    complianceRequirements: [
      'Kuwait Consumer Protection Law requirements',
      'E-commerce return regulations',
      'Warranty obligation tracking',
    ],
    estimatedROI: 'Reduces return processing time by 65%, improves customer satisfaction by 40%',
  },

  // Maintenance Request Pattern
  maintenance_request: {
    name: 'Maintenance Request',
    description: 'Facility and equipment maintenance request management',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'submit_request',
      'categorize_issue',
      'assign_technician',
      'schedule_work',
      'perform_maintenance',
      'verify_completion',
      'update_asset_records',
    ],
    implicitNeeds: [
      'Maintenance request portal/app',
      'Issue categorization and priority scoring',
      'Technician assignment based on skills/availability',
      'Scheduling and calendar integration',
      'Work order generation',
      'Completion verification and sign-off',
      'Asset maintenance history tracking',
    ],
    questions: [
      'Do you have in-house technicians or use contractors?',
      'What asset/equipment types need maintenance?',
      'How do you prioritize maintenance requests?',
      'Do you need preventive maintenance scheduling?',
      'Should requesters receive status updates?',
    ],
    complianceRequirements: [
      'Kuwait Municipality building maintenance standards',
      'Fire safety equipment inspection requirements',
      'Environmental compliance for HVAC systems',
    ],
    estimatedROI: 'Reduces equipment downtime by 45%, maintenance costs by 30%',
  },

  // Facility Booking Pattern
  facility_booking: {
    name: 'Facility Booking',
    description: 'Meeting room and facility reservation management',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'check_availability',
      'submit_booking',
      'validate_requirements',
      'confirm_booking',
      'setup_facilities',
      'send_reminders',
      'collect_feedback',
    ],
    implicitNeeds: [
      'Real-time availability calendar',
      'Booking form with requirements capture',
      'Capacity and equipment validation',
      'Confirmation and calendar integration',
      'Facility setup coordination',
      'Automated reminder system',
      'Post-event feedback collection',
    ],
    questions: [
      'What types of facilities need booking management?',
      'Do different facilities have different approval requirements?',
      'Should bookings integrate with calendar systems?',
      'Do you need catering or AV equipment coordination?',
      'How far in advance can bookings be made?',
    ],
    complianceRequirements: [
      'Occupancy limits per Kuwait safety regulations',
      'Accessibility requirements',
      'COVID-era spacing requirements if applicable',
    ],
    estimatedROI: 'Improves facility utilization by 35%, reduces double-bookings to zero',
  },

  // Asset Tracking Pattern
  asset_tracking: {
    name: 'Asset Tracking',
    description: 'Fixed asset lifecycle management and tracking',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'register_asset',
      'assign_location',
      'track_movements',
      'schedule_maintenance',
      'calculate_depreciation',
      'audit_assets',
      'dispose_asset',
    ],
    implicitNeeds: [
      'Asset registration with barcoding/RFID',
      'Location assignment and tracking',
      'Movement history logging',
      'Preventive maintenance scheduling',
      'Depreciation calculation engine',
      'Periodic audit workflow',
      'Disposal documentation and processing',
    ],
    questions: [
      'What types of assets do you need to track?',
      'Do you use barcode or RFID tags?',
      'What depreciation method do you use?',
      'How often do you conduct asset audits?',
      'Do you need integration with accounting for depreciation?',
    ],
    complianceRequirements: [
      'IFRS fixed asset accounting standards',
      'Tax depreciation schedules per Kuwait tax law',
      'Insurance coverage documentation',
    ],
    estimatedROI: 'Reduces asset loss by 80%, improves audit accuracy by 95%',
  },

  // Incident Reporting Pattern
  incident_reporting: {
    name: 'Incident Reporting',
    description: 'Workplace incident capture, investigation, and resolution',
    layers: ['input', 'processing', 'processing', 'output', 'notification'],
    steps: [
      'capture_incident',
      'classify_severity',
      'assign_investigator',
      'investigate_root_cause',
      'implement_corrective_action',
      'monitor_effectiveness',
      'close_incident',
    ],
    implicitNeeds: [
      'Incident reporting form/app',
      'Severity classification matrix',
      'Investigator assignment workflow',
      'Root cause analysis templates',
      'Corrective action tracking',
      'Effectiveness monitoring',
      'Regulatory reporting integration',
    ],
    questions: [
      'What types of incidents need tracking (safety, quality, security)?',
      'Who should be immediately notified of critical incidents?',
      'Do you need to report incidents to regulatory bodies?',
      'What root cause analysis methodology do you use?',
      'How long should corrective actions be monitored?',
    ],
    complianceRequirements: [
      'Kuwait Labor Law workplace safety requirements',
      'OSHA equivalent reporting standards',
      'Environmental incident reporting to EPA',
    ],
    estimatedROI: 'Reduces incident recurrence by 60%, improves response time by 75%',
  },

  // SLA Monitoring Pattern
  sla_monitoring: {
    name: 'SLA Monitoring',
    description: 'Service level agreement tracking and alerting',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'define_sla_metrics',
      'collect_performance_data',
      'calculate_compliance',
      'generate_dashboards',
      'alert_on_breach',
      'escalate_issues',
      'report_to_stakeholders',
    ],
    implicitNeeds: [
      'SLA definition and threshold configuration',
      'Automated data collection from source systems',
      'Real-time compliance calculation',
      'Dashboard visualization',
      'Threshold breach alerting',
      'Escalation workflow',
      'Periodic reporting generation',
    ],
    questions: [
      'What SLA metrics are most critical to track?',
      'What systems contain the performance data?',
      'What are the threshold levels for alerts?',
      'Who should receive breach notifications?',
      'How often should SLA reports be generated?',
    ],
    complianceRequirements: [
      'Contract compliance documentation',
      'Audit trail for SLA calculations',
      'Penalty/credit calculation accuracy',
    ],
    estimatedROI: 'Improves SLA compliance by 40%, reduces penalties by 70%',
  },

  // Capacity Planning Pattern
  capacity_planning: {
    name: 'Capacity Planning',
    description: 'Resource and capacity forecasting and optimization',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'collect_demand_data',
      'forecast_demand',
      'analyze_capacity',
      'identify_gaps',
      'generate_recommendations',
      'create_action_plan',
      'monitor_execution',
    ],
    implicitNeeds: [
      'Historical demand data collection',
      'Demand forecasting algorithms',
      'Current capacity assessment',
      'Gap analysis engine',
      'Recommendation generation',
      'Action plan creation and tracking',
      'Execution monitoring',
    ],
    questions: [
      'What resources need capacity planning (people, equipment, space)?',
      'How far ahead do you need to forecast?',
      'What historical data is available for forecasting?',
      'How quickly can capacity be adjusted?',
      'Who approves capacity changes?',
    ],
    complianceRequirements: [
      'Budget approval requirements for capacity increases',
      'Lead time requirements for procurement',
      'Labor law requirements for workforce changes',
    ],
    estimatedROI: 'Improves resource utilization by 25%, reduces capacity-related delays by 50%',
  },

  // Process Improvement Pattern
  process_improvement: {
    name: 'Process Improvement',
    description: 'Continuous improvement initiative management',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'capture_improvement_idea',
      'evaluate_feasibility',
      'prioritize_initiative',
      'assign_project_team',
      'implement_change',
      'measure_results',
      'standardize_improvement',
    ],
    implicitNeeds: [
      'Idea submission portal',
      'Feasibility assessment framework',
      'Prioritization matrix',
      'Project assignment workflow',
      'Implementation tracking',
      'Results measurement',
      'Standard operating procedure updates',
    ],
    questions: [
      'How do employees submit improvement ideas?',
      'What criteria are used to evaluate ideas?',
      'Who approves improvement initiatives?',
      'How do you measure improvement success?',
      'Do you use a specific methodology (Lean, Six Sigma)?',
    ],
    complianceRequirements: [
      'Change management documentation',
      'Quality management system updates',
      'Training requirements for new processes',
    ],
    estimatedROI: 'Generates 20% cost savings annually, improves employee engagement by 35%',
  },

  // Vendor Evaluation Pattern
  vendor_evaluation: {
    name: 'Vendor Evaluation',
    description: 'Supplier performance assessment and rating system',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'collect_performance_data',
      'calculate_metrics',
      'generate_scorecard',
      'compare_vendors',
      'identify_risks',
      'create_action_plans',
      'communicate_results',
    ],
    implicitNeeds: [
      'Performance data collection (quality, delivery, price)',
      'Metric calculation engine',
      'Scorecard generation',
      'Vendor comparison analysis',
      'Risk identification and flagging',
      'Improvement action planning',
      'Vendor communication workflow',
    ],
    questions: [
      'What metrics do you use to evaluate vendors?',
      'How often do you conduct vendor reviews?',
      'What scoring system do you use?',
      'Do poor-performing vendors face consequences?',
      'Should vendors receive their scorecards?',
    ],
    complianceRequirements: [
      'Vendor audit documentation',
      'Performance-based contract compliance',
      'Supplier diversity tracking',
    ],
    estimatedROI: 'Improves vendor quality by 30%, reduces supply chain risk by 45%',
  },

  // Cost Optimization Pattern
  cost_optimization: {
    name: 'Cost Optimization',
    description: 'Operations cost analysis and reduction initiatives',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'collect_cost_data',
      'categorize_expenses',
      'analyze_trends',
      'identify_opportunities',
      'generate_recommendations',
      'implement_savings',
      'track_results',
    ],
    implicitNeeds: [
      'Cost data extraction from multiple sources',
      'Expense categorization and allocation',
      'Trend analysis and benchmarking',
      'Opportunity identification algorithms',
      'Recommendation generation',
      'Savings implementation tracking',
      'Results reporting',
    ],
    questions: [
      'What cost categories are highest priority?',
      'Do you have industry benchmarks for comparison?',
      'What approval is needed for cost-saving initiatives?',
      'How do you track realized savings?',
      'Should savings be allocated back to departments?',
    ],
    complianceRequirements: [
      'Cost allocation methodology documentation',
      'Savings verification and audit trail',
      'Budget variance reporting',
    ],
    estimatedROI: 'Achieves 10-15% cost reduction, improves margin by 5-8%',
  },
};

// ============================================================================
// OPERATIONS KEYWORDS FOR PATTERN DETECTION
// ============================================================================

export const OPERATIONS_KEYWORDS: Record<string, string[]> = {
  purchase_requisition: [
    'requisition', 'purchase request', 'pr', 'procurement', 'buy',
    'purchase order', 'po', 'procurement request', 'buying', 'sourcing',
    'vendor selection', 'supplier', 'طلب شراء', 'أمر شراء', 'مشتريات'
  ],

  inventory_reorder: [
    'inventory', 'stock', 'reorder', 'replenishment', 'stockout',
    'safety stock', 'warehouse', 'sku', 'replenish', 'stock level',
    'out of stock', 'low stock', 'مخزون', 'مستودع', 'إعادة الطلب'
  ],

  supplier_onboarding: [
    'supplier onboarding', 'vendor registration', 'new supplier',
    'vendor onboarding', 'supplier registration', 'new vendor',
    'vendor qualification', 'supplier qualification', 'تسجيل مورد', 'مورد جديد'
  ],

  quality_inspection: [
    'quality', 'inspection', 'qc', 'quality control', 'defect',
    'quality check', 'incoming inspection', 'sampling', 'aql',
    'quality assurance', 'qa', 'جودة', 'فحص', 'رقابة الجودة'
  ],

  shipping_coordination: [
    'shipping', 'shipment', 'logistics', 'delivery', 'freight',
    'carrier', 'transport', 'courier', 'tracking', 'customs',
    'clearance', 'شحن', 'توصيل', 'نقل', 'جمارك'
  ],

  returns_processing: [
    'return', 'returns', 'rma', 'return merchandise', 'refund',
    'exchange', 'defective', 'warranty', 'return authorization',
    'إرجاع', 'استرجاع', 'مرتجع'
  ],

  maintenance_request: [
    'maintenance', 'repair', 'fix', 'broken', 'malfunction',
    'work order', 'facilities', 'hvac', 'plumbing', 'electrical',
    'preventive maintenance', 'صيانة', 'إصلاح', 'تصليح'
  ],

  facility_booking: [
    'booking', 'reservation', 'meeting room', 'conference room',
    'facility', 'room booking', 'space reservation', 'calendar',
    'حجز', 'قاعة اجتماعات', 'غرفة'
  ],

  asset_tracking: [
    'asset', 'assets', 'equipment', 'fixed asset', 'barcode',
    'rfid', 'asset tag', 'depreciation', 'inventory asset',
    'أصول', 'معدات', 'أصول ثابتة'
  ],

  incident_reporting: [
    'incident', 'accident', 'safety', 'hazard', 'injury',
    'near miss', 'unsafe', 'report incident', 'safety incident',
    'حادث', 'سلامة', 'تقرير حادث'
  ],

  sla_monitoring: [
    'sla', 'service level', 'kpi', 'performance', 'metrics',
    'dashboard', 'compliance', 'threshold', 'breach',
    'مستوى الخدمة', 'أداء', 'مؤشرات'
  ],

  capacity_planning: [
    'capacity', 'forecast', 'planning', 'resource', 'demand',
    'capacity planning', 'workload', 'utilization', 'headcount',
    'سعة', 'تخطيط', 'موارد'
  ],

  process_improvement: [
    'improvement', 'kaizen', 'lean', 'six sigma', 'continuous improvement',
    'process improvement', 'efficiency', 'optimize', 'streamline',
    'تحسين', 'تطوير', 'كفاءة'
  ],

  vendor_evaluation: [
    'vendor evaluation', 'supplier evaluation', 'vendor scorecard',
    'supplier scorecard', 'vendor rating', 'supplier rating',
    'vendor performance', 'supplier performance', 'تقييم المورد', 'أداء المورد'
  ],

  cost_optimization: [
    'cost', 'saving', 'optimization', 'reduce cost', 'cost reduction',
    'expense', 'budget', 'efficiency', 'cost saving',
    'تكلفة', 'توفير', 'تخفيض التكاليف'
  ],
};

// ============================================================================
// OPERATIONS IMPLICIT REQUIREMENTS
// ============================================================================

export const OPERATIONS_IMPLICIT_REQUIREMENTS: Record<string, ImplicitRequirement[]> = {
  purchase_requisition: [
    {
      category: 'input',
      description: 'Purchase requisition submission portal',
      reason: 'Standardizes request capture with required fields',
      priority: 'critical',
      suggestedTools: ['SAP Ariba', 'Coupa', 'Procurify', 'Zoho Inventory'],
    },
    {
      category: 'processing',
      description: 'Budget availability check',
      reason: 'Ensures purchases are within approved budget allocations',
      priority: 'critical',
      suggestedTools: ['ERP Integration', 'Budget Module', 'Adaptive Planning'],
    },
    {
      category: 'processing',
      description: 'Vendor comparison and selection',
      reason: 'Ensures best value through competitive comparison',
      priority: 'important',
      suggestedTools: ['SAP Ariba', 'Scout RFP', 'Coupa'],
    },
    {
      category: 'processing',
      description: 'Multi-tier approval workflow',
      reason: 'Different amounts require different approval authorities',
      priority: 'critical',
      suggestedTools: ['ServiceNow', 'Kissflow', 'Nexus Workflow'],
    },
    {
      category: 'output',
      description: 'Purchase order generation',
      reason: 'Creates formal commitment to vendor',
      priority: 'critical',
      suggestedTools: ['SAP', 'Oracle', 'NetSuite', 'Zoho Inventory'],
    },
    {
      category: 'notification',
      description: 'Stakeholder notifications',
      reason: 'Keeps requester and approvers informed of status',
      priority: 'important',
      suggestedTools: ['Email', 'Slack', 'Microsoft Teams'],
    },
  ],

  inventory_reorder: [
    {
      category: 'input',
      description: 'Real-time inventory level monitoring',
      reason: 'Enables proactive reordering before stockouts',
      priority: 'critical',
      suggestedTools: ['Zoho Inventory', 'Cin7', 'TradeGecko', 'Fishbowl'],
    },
    {
      category: 'processing',
      description: 'Reorder point calculation engine',
      reason: 'Automatically determines when to reorder based on usage and lead time',
      priority: 'critical',
      suggestedTools: ['Inventory Planner', 'EazyStock', 'NetStock'],
    },
    {
      category: 'processing',
      description: 'Safety stock optimization',
      reason: 'Balances stock availability with holding costs',
      priority: 'important',
      suggestedTools: ['Lokad', 'Blue Yonder', 'Llamasoft'],
    },
    {
      category: 'output',
      description: 'Automatic purchase requisition generation',
      reason: 'Triggers procurement without manual intervention',
      priority: 'important',
      suggestedTools: ['ERP Integration', 'Procurement Module'],
    },
    {
      category: 'notification',
      description: 'Low stock alerts',
      reason: 'Notifies warehouse and procurement of critical levels',
      priority: 'important',
      suggestedTools: ['Email', 'SMS', 'WhatsApp', 'Slack'],
    },
  ],

  supplier_onboarding: [
    {
      category: 'input',
      description: 'Supplier registration portal',
      reason: 'Collects all required information in standardized format',
      priority: 'critical',
      suggestedTools: ['SAP Ariba', 'Coupa', 'JAGGAER', 'Ivalua'],
    },
    {
      category: 'processing',
      description: 'Document verification system',
      reason: 'Validates commercial registration, tax ID, insurance',
      priority: 'critical',
      suggestedTools: ['DocuSign', 'Adobe Sign', 'Custom Verification'],
    },
    {
      category: 'processing',
      description: 'Risk assessment scoring',
      reason: 'Evaluates supplier financial and operational risk',
      priority: 'important',
      suggestedTools: ['Dun & Bradstreet', 'RapidRatings', 'Supplier.io'],
    },
    {
      category: 'processing',
      description: 'Due diligence workflow',
      reason: 'Ensures compliance with company and regulatory requirements',
      priority: 'important',
      suggestedTools: ['Refinitiv', 'LexisNexis', 'IntegrityNext'],
    },
    {
      category: 'output',
      description: 'Vendor master data creation',
      reason: 'Establishes supplier in procurement system',
      priority: 'critical',
      suggestedTools: ['SAP MDG', 'Oracle Supplier Hub', 'Stibo Systems'],
    },
    {
      category: 'notification',
      description: 'Onboarding status communications',
      reason: 'Keeps supplier informed of application status',
      priority: 'optional',
      suggestedTools: ['Email', 'Supplier Portal'],
    },
  ],

  quality_inspection: [
    {
      category: 'input',
      description: 'Shipment receipt notification',
      reason: 'Triggers inspection process upon goods arrival',
      priority: 'critical',
      suggestedTools: ['WMS Integration', 'ERP', 'Receiving Module'],
    },
    {
      category: 'processing',
      description: 'Dynamic checklist generation',
      reason: 'Creates inspection criteria based on product type and history',
      priority: 'important',
      suggestedTools: ['Qualio', 'ETQ Reliance', 'MasterControl'],
    },
    {
      category: 'processing',
      description: 'Mobile inspection interface',
      reason: 'Enables inspectors to record findings with photos/evidence',
      priority: 'important',
      suggestedTools: ['iAuditor', 'Inspection Manager', 'GoCanvas'],
    },
    {
      category: 'processing',
      description: 'Defect categorization and scoring',
      reason: 'Standardizes defect classification for analysis',
      priority: 'critical',
      suggestedTools: ['QMS System', 'Sparta Systems', 'Veeva QMS'],
    },
    {
      category: 'output',
      description: 'Quality report generation',
      reason: 'Documents inspection results for compliance and supplier feedback',
      priority: 'important',
      suggestedTools: ['Power BI', 'Tableau', 'QMS Reporting'],
    },
    {
      category: 'notification',
      description: 'Quality alert notifications',
      reason: 'Alerts stakeholders of quality issues requiring action',
      priority: 'critical',
      suggestedTools: ['Email', 'SMS', 'Slack'],
    },
  ],

  shipping_coordination: [
    {
      category: 'input',
      description: 'Shipping request capture',
      reason: 'Collects shipment requirements from sales/warehouse',
      priority: 'critical',
      suggestedTools: ['ShipStation', 'ShipBob', 'Shippo'],
    },
    {
      category: 'processing',
      description: 'Carrier selection and rate comparison',
      reason: 'Optimizes shipping cost and service level',
      priority: 'important',
      suggestedTools: ['Freightview', 'Flexport', 'Shippo'],
    },
    {
      category: 'processing',
      description: 'Documentation preparation',
      reason: 'Generates required shipping documents (packing list, invoice)',
      priority: 'critical',
      suggestedTools: ['Descartes', 'Integration Point', 'Amber Road'],
    },
    {
      category: 'processing',
      description: 'Customs clearance coordination',
      reason: 'Ensures smooth import/export processing',
      priority: 'critical',
      suggestedTools: ['Local Customs Broker', 'TradeWindow', 'Descartes'],
    },
    {
      category: 'output',
      description: 'Tracking number and status updates',
      reason: 'Provides shipment visibility to all stakeholders',
      priority: 'important',
      suggestedTools: ['AfterShip', 'Tracktor', 'Parcel Monitor'],
    },
    {
      category: 'notification',
      description: 'Delivery notifications',
      reason: 'Confirms successful delivery to recipient',
      priority: 'optional',
      suggestedTools: ['SMS', 'Email', 'WhatsApp'],
    },
  ],

  returns_processing: [
    {
      category: 'input',
      description: 'Return request portal',
      reason: 'Provides customer-facing return initiation',
      priority: 'critical',
      suggestedTools: ['Loop Returns', 'Returnly', 'Happy Returns'],
    },
    {
      category: 'processing',
      description: 'Return policy validation',
      reason: 'Ensures return meets policy criteria (timeframe, condition)',
      priority: 'critical',
      suggestedTools: ['Returns Policy Engine', 'Custom Rules'],
    },
    {
      category: 'processing',
      description: 'RMA number generation',
      reason: 'Creates trackable return authorization',
      priority: 'important',
      suggestedTools: ['OMS Integration', 'ERP', 'Returns Module'],
    },
    {
      category: 'processing',
      description: 'Condition inspection workflow',
      reason: 'Determines disposition based on item condition',
      priority: 'important',
      suggestedTools: ['Mobile Inspection', 'Warehouse Module'],
    },
    {
      category: 'output',
      description: 'Refund/credit processing',
      reason: 'Issues customer compensation as appropriate',
      priority: 'critical',
      suggestedTools: ['Payment Gateway', 'ERP', 'Store Credit System'],
    },
    {
      category: 'notification',
      description: 'Return status updates',
      reason: 'Keeps customer informed throughout process',
      priority: 'important',
      suggestedTools: ['Email', 'SMS', 'Customer Portal'],
    },
  ],

  maintenance_request: [
    {
      category: 'input',
      description: 'Maintenance request submission',
      reason: 'Captures maintenance needs from facility users',
      priority: 'critical',
      suggestedTools: ['UpKeep', 'Fiix', 'Hippo CMMS', 'eMaint'],
    },
    {
      category: 'processing',
      description: 'Issue categorization and prioritization',
      reason: 'Ensures critical issues are addressed first',
      priority: 'important',
      suggestedTools: ['CMMS System', 'ServiceNow', 'FMX'],
    },
    {
      category: 'processing',
      description: 'Technician assignment',
      reason: 'Matches skills to issue type',
      priority: 'critical',
      suggestedTools: ['Resource Scheduling', 'CMMS Assignment'],
    },
    {
      category: 'processing',
      description: 'Work order generation',
      reason: 'Documents work to be performed',
      priority: 'important',
      suggestedTools: ['UpKeep', 'Fiix', 'Maintenance Connection'],
    },
    {
      category: 'output',
      description: 'Asset maintenance history update',
      reason: 'Maintains equipment service records',
      priority: 'important',
      suggestedTools: ['Asset Management System', 'CMMS'],
    },
    {
      category: 'notification',
      description: 'Completion notification',
      reason: 'Informs requester of completed work',
      priority: 'optional',
      suggestedTools: ['Email', 'Mobile App', 'SMS'],
    },
  ],

  facility_booking: [
    {
      category: 'input',
      description: 'Real-time availability calendar',
      reason: 'Shows open slots for facility booking',
      priority: 'critical',
      suggestedTools: ['Robin', 'Skedda', 'Teem', 'Envoy Rooms'],
    },
    {
      category: 'processing',
      description: 'Booking validation',
      reason: 'Checks capacity, equipment, and policy compliance',
      priority: 'important',
      suggestedTools: ['Room Booking System', 'Custom Rules Engine'],
    },
    {
      category: 'processing',
      description: 'Calendar integration',
      reason: 'Syncs bookings with attendee calendars',
      priority: 'important',
      suggestedTools: ['Google Calendar', 'Outlook', 'Exchange'],
    },
    {
      category: 'output',
      description: 'Booking confirmation',
      reason: 'Provides confirmed reservation details',
      priority: 'critical',
      suggestedTools: ['Email', 'Calendar Invite'],
    },
    {
      category: 'notification',
      description: 'Reminder notifications',
      reason: 'Reminds attendees of upcoming bookings',
      priority: 'optional',
      suggestedTools: ['Email', 'SMS', 'Mobile Push'],
    },
  ],

  asset_tracking: [
    {
      category: 'input',
      description: 'Asset registration system',
      reason: 'Captures asset details upon acquisition',
      priority: 'critical',
      suggestedTools: ['Asset Panda', 'EZOfficeInventory', 'Sortly', 'UpKeep'],
    },
    {
      category: 'processing',
      description: 'Barcode/RFID scanning',
      reason: 'Enables quick asset identification and tracking',
      priority: 'important',
      suggestedTools: ['Zebra', 'Honeywell', 'Mobile Device Scanner'],
    },
    {
      category: 'processing',
      description: 'Location tracking',
      reason: 'Maintains current and historical location data',
      priority: 'important',
      suggestedTools: ['Asset Panda', 'Wasp Barcode', 'IntelliTrack'],
    },
    {
      category: 'processing',
      description: 'Depreciation calculation',
      reason: 'Computes asset value for financial reporting',
      priority: 'important',
      suggestedTools: ['Fixed Asset Module', 'ERP Integration'],
    },
    {
      category: 'output',
      description: 'Asset audit reports',
      reason: 'Supports periodic physical verification',
      priority: 'important',
      suggestedTools: ['Reporting Module', 'Power BI', 'Excel'],
    },
    {
      category: 'notification',
      description: 'Maintenance due alerts',
      reason: 'Triggers preventive maintenance scheduling',
      priority: 'optional',
      suggestedTools: ['CMMS Integration', 'Email Alerts'],
    },
  ],

  incident_reporting: [
    {
      category: 'input',
      description: 'Incident capture form/app',
      reason: 'Enables quick incident documentation',
      priority: 'critical',
      suggestedTools: ['1st Reporting', 'iAuditor', 'SafetyCulture', 'Donesafe'],
    },
    {
      category: 'processing',
      description: 'Severity classification',
      reason: 'Prioritizes response based on incident severity',
      priority: 'critical',
      suggestedTools: ['Incident Management System', 'Custom Matrix'],
    },
    {
      category: 'processing',
      description: 'Root cause analysis workflow',
      reason: 'Identifies underlying causes to prevent recurrence',
      priority: 'important',
      suggestedTools: ['5 Whys Template', 'Fishbone Diagram', 'TapRoot'],
    },
    {
      category: 'processing',
      description: 'Corrective action tracking',
      reason: 'Ensures remediation is completed',
      priority: 'important',
      suggestedTools: ['CAPA Management', 'Action Tracking Module'],
    },
    {
      category: 'output',
      description: 'Incident reports',
      reason: 'Documents incident for compliance and learning',
      priority: 'critical',
      suggestedTools: ['Reporting System', 'EHS Software'],
    },
    {
      category: 'notification',
      description: 'Escalation notifications',
      reason: 'Alerts management of serious incidents immediately',
      priority: 'critical',
      suggestedTools: ['SMS', 'Phone Call', 'Email'],
    },
  ],

  sla_monitoring: [
    {
      category: 'input',
      description: 'Performance data collection',
      reason: 'Gathers metrics from operational systems',
      priority: 'critical',
      suggestedTools: ['API Integration', 'Database Connection', 'ETL Tools'],
    },
    {
      category: 'processing',
      description: 'SLA compliance calculation',
      reason: 'Computes actual vs. target performance',
      priority: 'critical',
      suggestedTools: ['Custom Analytics', 'Power BI', 'Datadog'],
    },
    {
      category: 'processing',
      description: 'Threshold monitoring',
      reason: 'Detects approaching or breached thresholds',
      priority: 'important',
      suggestedTools: ['Monitoring Platform', 'Alerting System'],
    },
    {
      category: 'output',
      description: 'Dashboard visualization',
      reason: 'Provides real-time SLA status visibility',
      priority: 'important',
      suggestedTools: ['Power BI', 'Tableau', 'Looker', 'Grafana'],
    },
    {
      category: 'notification',
      description: 'Breach alerts',
      reason: 'Immediately notifies stakeholders of SLA violations',
      priority: 'critical',
      suggestedTools: ['PagerDuty', 'Opsgenie', 'Email', 'SMS'],
    },
  ],

  capacity_planning: [
    {
      category: 'input',
      description: 'Historical demand data collection',
      reason: 'Provides basis for forecasting',
      priority: 'critical',
      suggestedTools: ['Data Warehouse', 'ERP Reports', 'Excel'],
    },
    {
      category: 'processing',
      description: 'Demand forecasting engine',
      reason: 'Predicts future resource requirements',
      priority: 'critical',
      suggestedTools: ['Anaplan', 'Kinaxis', 'SAP IBP', 'Blue Yonder'],
    },
    {
      category: 'processing',
      description: 'Capacity gap analysis',
      reason: 'Identifies shortfalls between demand and capacity',
      priority: 'important',
      suggestedTools: ['Planning Module', 'Custom Analysis'],
    },
    {
      category: 'output',
      description: 'Capacity plan documentation',
      reason: 'Documents planned capacity changes',
      priority: 'important',
      suggestedTools: ['Excel', 'Planning Software', 'PowerPoint'],
    },
    {
      category: 'notification',
      description: 'Capacity alerts',
      reason: 'Warns of upcoming capacity constraints',
      priority: 'optional',
      suggestedTools: ['Email', 'Dashboard Alerts'],
    },
  ],

  process_improvement: [
    {
      category: 'input',
      description: 'Idea submission portal',
      reason: 'Captures improvement suggestions from employees',
      priority: 'important',
      suggestedTools: ['IdeaScale', 'Spigit', 'Brightidea', 'Simple Form'],
    },
    {
      category: 'processing',
      description: 'Feasibility assessment',
      reason: 'Evaluates technical and financial viability',
      priority: 'important',
      suggestedTools: ['Custom Assessment Framework', 'Excel'],
    },
    {
      category: 'processing',
      description: 'Prioritization matrix',
      reason: 'Ranks initiatives by impact and effort',
      priority: 'important',
      suggestedTools: ['Prioritization Tool', 'Excel Matrix'],
    },
    {
      category: 'processing',
      description: 'Project tracking',
      reason: 'Monitors implementation progress',
      priority: 'important',
      suggestedTools: ['Asana', 'Monday.com', 'Jira', 'Trello'],
    },
    {
      category: 'output',
      description: 'Results measurement',
      reason: 'Quantifies improvement benefits',
      priority: 'critical',
      suggestedTools: ['Analytics Platform', 'Excel', 'Power BI'],
    },
    {
      category: 'notification',
      description: 'Recognition notifications',
      reason: 'Acknowledges contributors of successful improvements',
      priority: 'optional',
      suggestedTools: ['Email', 'Recognition Platform'],
    },
  ],

  vendor_evaluation: [
    {
      category: 'input',
      description: 'Performance data collection',
      reason: 'Gathers quality, delivery, and cost metrics',
      priority: 'critical',
      suggestedTools: ['ERP Reports', 'QMS Data', 'Receiving Data'],
    },
    {
      category: 'processing',
      description: 'Scorecard calculation',
      reason: 'Computes weighted performance scores',
      priority: 'critical',
      suggestedTools: ['Custom Scoring Engine', 'Excel', 'Supplier.io'],
    },
    {
      category: 'processing',
      description: 'Risk assessment',
      reason: 'Identifies at-risk supplier relationships',
      priority: 'important',
      suggestedTools: ['Risk Assessment Tool', 'Dun & Bradstreet'],
    },
    {
      category: 'output',
      description: 'Vendor scorecard reports',
      reason: 'Documents supplier performance for review',
      priority: 'important',
      suggestedTools: ['Power BI', 'Excel', 'Supplier Portal'],
    },
    {
      category: 'notification',
      description: 'Performance alerts',
      reason: 'Notifies procurement of poor-performing vendors',
      priority: 'important',
      suggestedTools: ['Email', 'Dashboard Alerts'],
    },
  ],

  cost_optimization: [
    {
      category: 'input',
      description: 'Cost data extraction',
      reason: 'Collects expense data from multiple sources',
      priority: 'critical',
      suggestedTools: ['ERP Integration', 'Data Warehouse', 'AP System'],
    },
    {
      category: 'processing',
      description: 'Expense categorization',
      reason: 'Groups costs for analysis',
      priority: 'important',
      suggestedTools: ['Spend Analysis Tool', 'Custom Categorization'],
    },
    {
      category: 'processing',
      description: 'Benchmarking analysis',
      reason: 'Compares costs to industry standards',
      priority: 'important',
      suggestedTools: ['APQC Benchmarking', 'Industry Reports'],
    },
    {
      category: 'processing',
      description: 'Opportunity identification',
      reason: 'Finds areas for cost reduction',
      priority: 'critical',
      suggestedTools: ['Analytics Platform', 'Spend Analytics'],
    },
    {
      category: 'output',
      description: 'Savings tracking reports',
      reason: 'Documents realized cost savings',
      priority: 'important',
      suggestedTools: ['Power BI', 'Excel', 'Custom Dashboard'],
    },
    {
      category: 'notification',
      description: 'Savings milestone alerts',
      reason: 'Celebrates achievement of savings targets',
      priority: 'optional',
      suggestedTools: ['Email', 'Dashboard'],
    },
  ],
};

// ============================================================================
// OPERATIONS TOOL RECOMMENDATIONS
// ============================================================================

export const OPERATIONS_TOOL_RECOMMENDATIONS: Record<string, ToolRecommendation[]> = {
  // Inventory Management
  inventory: [
    {
      toolSlug: 'ZOHO_INVENTORY',
      toolName: 'Zoho Inventory',
      score: 94,
      reasons: [
        'Arabic interface available',
        'Multi-warehouse support',
        'Integrated with Zoho ecosystem',
        'Affordable for SMEs',
      ],
      regionalFit: 95,
      alternatives: [
        {
          toolSlug: 'TRADEGECKO',
          toolName: 'TradeGecko (QuickBooks Commerce)',
          reason: 'Strong B2B features',
          tradeoff: 'Higher cost',
        },
      ],
    },
    {
      toolSlug: 'CIN7',
      toolName: 'Cin7',
      score: 92,
      reasons: [
        'Multi-channel inventory management',
        'Built-in warehouse management',
        'Strong integration ecosystem',
        'EDI capabilities',
      ],
      regionalFit: 85,
      alternatives: [],
    },
    {
      toolSlug: 'FISHBOWL',
      toolName: 'Fishbowl Inventory',
      score: 88,
      reasons: [
        'QuickBooks integration',
        'Manufacturing features',
        'Barcode scanning',
        'Asset tracking',
      ],
      regionalFit: 80,
      alternatives: [],
    },
    {
      toolSlug: 'BRIGHTPEARL',
      toolName: 'Brightpearl',
      score: 86,
      reasons: [
        'Retail-focused inventory',
        'Omnichannel support',
        'Financial integration',
        'Demand forecasting',
      ],
      regionalFit: 75,
      alternatives: [],
    },
  ],

  // Procurement
  procurement: [
    {
      toolSlug: 'SAP_ARIBA',
      toolName: 'SAP Ariba',
      score: 96,
      reasons: [
        'Enterprise-grade procurement',
        'Large supplier network',
        'Strong compliance features',
        'Regional presence in GCC',
      ],
      regionalFit: 90,
      alternatives: [
        {
          toolSlug: 'COUPA',
          toolName: 'Coupa',
          reason: 'Better user experience',
          tradeoff: 'Smaller regional presence',
        },
      ],
    },
    {
      toolSlug: 'COUPA',
      toolName: 'Coupa',
      score: 94,
      reasons: [
        'Intuitive user interface',
        'Strong spend analytics',
        'Supplier management',
        'AI-powered insights',
      ],
      regionalFit: 85,
      alternatives: [],
    },
    {
      toolSlug: 'PROCURIFY',
      toolName: 'Procurify',
      score: 90,
      reasons: [
        'Easy to use for SMEs',
        'Mobile-friendly',
        'Quick implementation',
        'Affordable pricing',
      ],
      regionalFit: 85,
      alternatives: [],
    },
    {
      toolSlug: 'JAGGAER',
      toolName: 'JAGGAER',
      score: 88,
      reasons: [
        'Comprehensive procurement suite',
        'Strong supplier management',
        'Contract management',
        'Analytics',
      ],
      regionalFit: 80,
      alternatives: [],
    },
  ],

  // Logistics & Shipping - Kuwait/GCC Focus
  logistics: [
    {
      toolSlug: 'ARAMEX_INTEGRATION',
      toolName: 'Aramex',
      score: 98,
      reasons: [
        'Dominant regional presence in GCC',
        'Arabic support',
        'Local warehousing options',
        'Cash on delivery support',
        'Kuwait office and network',
      ],
      regionalFit: 100,
      alternatives: [],
    },
    {
      toolSlug: 'DHL_INTEGRATION',
      toolName: 'DHL Express',
      score: 95,
      reasons: [
        'Global network with strong GCC presence',
        'Excellent tracking',
        'Customs clearance expertise',
        'Time-definite delivery',
      ],
      regionalFit: 95,
      alternatives: [],
    },
    {
      toolSlug: 'FEDEX_INTEGRATION',
      toolName: 'FedEx',
      score: 92,
      reasons: [
        'Reliable international shipping',
        'Strong tracking capabilities',
        'Customs brokerage services',
        'Kuwait presence',
      ],
      regionalFit: 90,
      alternatives: [],
    },
    {
      toolSlug: 'AGILITY_LOGISTICS',
      toolName: 'Agility',
      score: 96,
      reasons: [
        'Kuwait-headquartered company',
        'Strong local expertise',
        'Warehousing and logistics',
        'Regional knowledge',
      ],
      regionalFit: 100,
      alternatives: [],
    },
    {
      toolSlug: 'SHIPSTATION',
      toolName: 'ShipStation',
      score: 85,
      reasons: [
        'Multi-carrier management',
        'E-commerce integration',
        'Shipping automation',
        'Rate comparison',
      ],
      regionalFit: 75,
      alternatives: [],
    },
  ],

  // Quality Management
  quality: [
    {
      toolSlug: 'QUALIO',
      toolName: 'Qualio',
      score: 92,
      reasons: [
        'Modern QMS platform',
        'Document control',
        'CAPA management',
        'Easy to use',
      ],
      regionalFit: 80,
      alternatives: [],
    },
    {
      toolSlug: 'SPARTA_SYSTEMS',
      toolName: 'Sparta Systems (Honeywell)',
      score: 94,
      reasons: [
        'Enterprise QMS',
        'Regulatory compliance',
        'Complete quality suite',
        'Industry-leading',
      ],
      regionalFit: 85,
      alternatives: [],
    },
    {
      toolSlug: 'ETQ_RELIANCE',
      toolName: 'ETQ Reliance',
      score: 90,
      reasons: [
        'Flexible QMS platform',
        'Strong analytics',
        'Configurable workflows',
        'Compliance focused',
      ],
      regionalFit: 80,
      alternatives: [],
    },
    {
      toolSlug: 'MASTERCONTROL',
      toolName: 'MasterControl',
      score: 88,
      reasons: [
        'Life sciences focus',
        'Document control',
        'Training management',
        'Audit management',
      ],
      regionalFit: 75,
      alternatives: [],
    },
    {
      toolSlug: 'IAUDITOR',
      toolName: 'iAuditor (SafetyCulture)',
      score: 86,
      reasons: [
        'Mobile inspection',
        'Easy checklist creation',
        'Photo documentation',
        'Affordable',
      ],
      regionalFit: 85,
      alternatives: [],
    },
  ],

  // Asset Management
  asset_management: [
    {
      toolSlug: 'ASSET_PANDA',
      toolName: 'Asset Panda',
      score: 92,
      reasons: [
        'Flexible asset tracking',
        'Mobile scanning',
        'Custom fields',
        'Audit trails',
      ],
      regionalFit: 85,
      alternatives: [],
    },
    {
      toolSlug: 'EZOFFICE_INVENTORY',
      toolName: 'EZOfficeInventory',
      score: 90,
      reasons: [
        'IT asset focus',
        'Barcode/RFID support',
        'Reservation system',
        'Affordable',
      ],
      regionalFit: 85,
      alternatives: [],
    },
    {
      toolSlug: 'SORTLY',
      toolName: 'Sortly',
      score: 88,
      reasons: [
        'Visual inventory',
        'QR code support',
        'Easy to use',
        'Small business friendly',
      ],
      regionalFit: 80,
      alternatives: [],
    },
    {
      toolSlug: 'UPKEEP_ASSETS',
      toolName: 'UpKeep',
      score: 91,
      reasons: [
        'Combined CMMS and asset tracking',
        'Mobile-first design',
        'Work order management',
        'Preventive maintenance',
      ],
      regionalFit: 85,
      alternatives: [],
    },
  ],

  // CMMS / Maintenance
  maintenance: [
    {
      toolSlug: 'UPKEEP',
      toolName: 'UpKeep',
      score: 94,
      reasons: [
        'Mobile-first CMMS',
        'Easy work order management',
        'Asset tracking built-in',
        'Affordable for SMEs',
      ],
      regionalFit: 85,
      alternatives: [],
    },
    {
      toolSlug: 'FIIX',
      toolName: 'Fiix',
      score: 92,
      reasons: [
        'Cloud-based CMMS',
        'AI-powered maintenance',
        'Strong analytics',
        'Scalable',
      ],
      regionalFit: 80,
      alternatives: [],
    },
    {
      toolSlug: 'HIPPO_CMMS',
      toolName: 'Hippo CMMS',
      score: 88,
      reasons: [
        'User-friendly interface',
        'Preventive maintenance',
        'Vendor management',
        'Good support',
      ],
      regionalFit: 80,
      alternatives: [],
    },
    {
      toolSlug: 'EMAINT',
      toolName: 'eMaint',
      score: 90,
      reasons: [
        'Highly configurable',
        'Strong reporting',
        'Mobile capabilities',
        'Enterprise features',
      ],
      regionalFit: 80,
      alternatives: [],
    },
  ],

  // Room/Facility Booking
  facility_booking: [
    {
      toolSlug: 'ROBIN',
      toolName: 'Robin',
      score: 92,
      reasons: [
        'Desk and room booking',
        'Calendar integration',
        'Visitor management',
        'Analytics',
      ],
      regionalFit: 80,
      alternatives: [],
    },
    {
      toolSlug: 'SKEDDA',
      toolName: 'Skedda',
      score: 90,
      reasons: [
        'Easy space scheduling',
        'Self-service booking',
        'Payment integration',
        'Affordable',
      ],
      regionalFit: 85,
      alternatives: [],
    },
    {
      toolSlug: 'TEEM',
      toolName: 'Teem (iOFFICE)',
      score: 88,
      reasons: [
        'Room scheduling',
        'Visitor management',
        'Space analytics',
        'Enterprise focus',
      ],
      regionalFit: 75,
      alternatives: [],
    },
    {
      toolSlug: 'ENVOY_ROOMS',
      toolName: 'Envoy Rooms',
      score: 86,
      reasons: [
        'Simple room booking',
        'Slack integration',
        'Display signage',
        'Analytics',
      ],
      regionalFit: 75,
      alternatives: [],
    },
  ],

  // EHS / Incident Management
  incident_management: [
    {
      toolSlug: 'SAFETYCULTUREINSPECTION',
      toolName: 'SafetyCulture',
      score: 92,
      reasons: [
        'Incident reporting',
        'Mobile inspections',
        'Action tracking',
        'Easy to use',
      ],
      regionalFit: 85,
      alternatives: [],
    },
    {
      toolSlug: 'DONESAFE',
      toolName: 'Donesafe',
      score: 90,
      reasons: [
        'EHS management platform',
        'Incident tracking',
        'Risk management',
        'Compliance',
      ],
      regionalFit: 80,
      alternatives: [],
    },
    {
      toolSlug: 'INTELEX',
      toolName: 'Intelex',
      score: 88,
      reasons: [
        'Comprehensive EHS',
        'Incident management',
        'Quality management',
        'Enterprise',
      ],
      regionalFit: 75,
      alternatives: [],
    },
  ],
};

// ============================================================================
// KUWAIT / REGIONAL CONTEXT
// ============================================================================

export const OPERATIONS_REGIONAL_CONTEXT: Record<string, OperationsRegionalContext> = {
  kuwait: {
    region: 'Kuwait',
    customsClearance: 'Kuwait Customs Authority (KCA)',
    importRegulations: 'KDIPA (Kuwait Direct Investment Promotion Authority) requirements',
    preferredLogistics: ['Aramex', 'DHL', 'Agility', 'FedEx'],
    workweek: 'Sunday-Thursday',
    holidays: 'Islamic calendar (Eid Al-Fitr, Eid Al-Adha) + National Day (Feb 25) + Liberation Day (Feb 26)',
    portAccess: 'Shuwaikh Port, Kuwait Port Authority (KPA)',
    freeTradeZones: 'Shuwaikh Free Trade Zone, Kuwait Free Trade Zone',
    warehousingStandards: [
      'Temperature-controlled storage for perishables',
      'Hazmat storage certifications',
      'Fire safety compliance (Kuwait Fire Department)',
    ],
    localSupplierNetwork: [
      'Kuwait Chamber of Commerce and Industry',
      'Union of Consumer Co-operative Societies',
    ],
  },
  uae: {
    region: 'United Arab Emirates',
    customsClearance: 'Federal Customs Authority',
    importRegulations: 'UAE Customs requirements, ESMA certification',
    preferredLogistics: ['Aramex', 'DHL', 'FedEx', 'Emirates Post'],
    workweek: 'Monday-Friday',
    holidays: 'Islamic calendar + UAE National Day (Dec 2)',
    portAccess: 'Jebel Ali Port, Port Rashid, Khalifa Port',
    freeTradeZones: 'JAFZA, DAFZA, DMCC, Sharjah Airport Free Zone',
    warehousingStandards: [
      'ESMA storage requirements',
      'Dubai Municipality compliance',
    ],
    localSupplierNetwork: [
      'Dubai Chamber of Commerce',
      'Abu Dhabi Chamber of Commerce',
    ],
  },
  saudi: {
    region: 'Saudi Arabia',
    customsClearance: 'Saudi Customs (Zakat, Tax and Customs Authority)',
    importRegulations: 'SASO standards, SFDA for food/drugs',
    preferredLogistics: ['Aramex', 'SMSA', 'DHL', 'FedEx'],
    workweek: 'Sunday-Thursday',
    holidays: 'Islamic calendar + Saudi National Day (Sep 23)',
    portAccess: 'Jeddah Islamic Port, King Abdulaziz Port (Dammam)',
    freeTradeZones: 'King Abdullah Economic City, Jazan Economic City',
    warehousingStandards: [
      'SASO compliance',
      'SFDA storage requirements for regulated products',
    ],
    localSupplierNetwork: [
      'Saudi Chamber of Commerce',
      'Council of Saudi Chambers',
    ],
  },
};

// ============================================================================
// OPERATIONS CALCULATION UTILITIES
// ============================================================================

/**
 * Calculate reorder point for inventory items
 *
 * Reorder Point = (Average Daily Usage x Lead Time in Days) + Safety Stock
 *
 * Also calculates Economic Order Quantity (EOQ) using the Wilson formula:
 * EOQ = sqrt((2 x Annual Demand x Order Cost) / Holding Cost per Unit)
 */
export function calculateReorderPoint(
  averageDailyUsage: number,
  leadTimeDays: number,
  safetyStock: number,
  annualDemand?: number,
  orderCost?: number,
  holdingCostPerUnit?: number
): ReorderCalculation {
  const reorderPoint = (averageDailyUsage * leadTimeDays) + safetyStock;

  // Calculate EOQ if all parameters provided
  let economicOrderQuantity = 0;
  if (annualDemand && orderCost && holdingCostPerUnit) {
    economicOrderQuantity = Math.sqrt(
      (2 * annualDemand * orderCost) / holdingCostPerUnit
    );
  }

  const notes: string[] = [
    `Based on average daily usage of ${averageDailyUsage} units`,
    `Lead time assumption: ${leadTimeDays} days`,
    `Safety stock buffer: ${safetyStock} units`,
  ];

  if (economicOrderQuantity > 0) {
    notes.push(`EOQ calculated using Wilson formula`);
    notes.push(`Consider ordering ${Math.round(economicOrderQuantity)} units at a time`);
  }

  return {
    averageDailyUsage,
    leadTimeDays,
    safetyStock,
    reorderPoint: Math.round(reorderPoint),
    economicOrderQuantity: Math.round(economicOrderQuantity),
    formula: `(${averageDailyUsage} x ${leadTimeDays}) + ${safetyStock} = ${Math.round(reorderPoint)}`,
    notes,
  };
}

/**
 * Calculate inventory turnover ratio and days inventory outstanding
 *
 * Inventory Turnover = Cost of Goods Sold / Average Inventory
 * Days Inventory Outstanding = 365 / Inventory Turnover
 */
export function calculateInventoryTurnover(
  cogs: number,
  averageInventory: number
): InventoryTurnoverAnalysis {
  const turnoverRatio = averageInventory > 0 ? cogs / averageInventory : 0;
  const daysInventoryOutstanding = turnoverRatio > 0 ? 365 / turnoverRatio : 0;

  let interpretation = '';
  const recommendations: string[] = [];

  if (turnoverRatio < 2) {
    interpretation = 'Low turnover - inventory may be overstocked or slow-moving';
    recommendations.push('Review slow-moving items for potential markdown or discontinuation');
    recommendations.push('Consider reducing safety stock levels');
    recommendations.push('Analyze demand forecasting accuracy');
  } else if (turnoverRatio >= 2 && turnoverRatio < 6) {
    interpretation = 'Moderate turnover - generally healthy for most industries';
    recommendations.push('Continue monitoring for optimization opportunities');
    recommendations.push('Review top-selling items for potential stock increases');
  } else if (turnoverRatio >= 6 && turnoverRatio < 12) {
    interpretation = 'Good turnover - efficient inventory management';
    recommendations.push('Maintain current inventory policies');
    recommendations.push('Consider just-in-time ordering where feasible');
  } else {
    interpretation = 'High turnover - risk of stockouts, may indicate understocking';
    recommendations.push('Increase safety stock for critical items');
    recommendations.push('Review lead times and reorder points');
    recommendations.push('Consider more frequent smaller orders');
  }

  return {
    cogs,
    averageInventory,
    turnoverRatio: Math.round(turnoverRatio * 100) / 100,
    daysInventoryOutstanding: Math.round(daysInventoryOutstanding),
    interpretation,
    recommendations,
  };
}

/**
 * Calculate supplier scorecard based on weighted criteria
 */
export function calculateSupplierScorecard(
  supplierId: string,
  qualityScore: number,
  deliveryScore: number,
  priceScore: number,
  serviceScore: number,
  weights: { quality: number; delivery: number; price: number; service: number } = {
    quality: 0.35,
    delivery: 0.30,
    price: 0.20,
    service: 0.15,
  }
): SupplierScorecard {
  const overallScore =
    qualityScore * weights.quality +
    deliveryScore * weights.delivery +
    priceScore * weights.price +
    serviceScore * weights.service;

  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  const recommendations: string[] = [];

  if (overallScore < 60) {
    riskLevel = 'high';
    recommendations.push('Consider alternative suppliers');
    recommendations.push('Implement corrective action plan');
    recommendations.push('Increase inspection frequency');
  } else if (overallScore >= 60 && overallScore < 80) {
    riskLevel = 'medium';
    recommendations.push('Monitor performance closely');
    recommendations.push('Schedule quarterly business review');
  } else {
    riskLevel = 'low';
    recommendations.push('Maintain current relationship');
    recommendations.push('Consider for preferred supplier status');
  }

  if (qualityScore < 70) {
    recommendations.push('Quality improvement needed - consider audit');
  }
  if (deliveryScore < 70) {
    recommendations.push('Delivery performance needs improvement');
  }
  if (priceScore < 70) {
    recommendations.push('Review pricing competitiveness');
  }
  if (serviceScore < 70) {
    recommendations.push('Service level discussions recommended');
  }

  return {
    supplierId,
    qualityScore,
    deliveryScore,
    priceScore,
    serviceScore,
    overallScore: Math.round(overallScore * 10) / 10,
    riskLevel,
    recommendations,
  };
}

/**
 * Calculate next maintenance schedule based on frequency
 */
export function calculateMaintenanceSchedule(
  assetId: string,
  maintenanceType: 'preventive' | 'predictive' | 'corrective',
  frequencyDays: number,
  lastPerformed: Date | null,
  estimatedDowntimeHours: number,
  estimatedCost: number
): MaintenanceSchedule {
  let nextDue: Date;

  if (lastPerformed) {
    nextDue = new Date(lastPerformed);
    nextDue.setDate(nextDue.getDate() + frequencyDays);
  } else {
    // If never performed, schedule immediately
    nextDue = new Date();
  }

  // Adjust for Kuwait business days (Sunday-Thursday)
  const dayOfWeek = nextDue.getDay();
  if (dayOfWeek === 5) {
    // Friday
    nextDue.setDate(nextDue.getDate() + 2);
  } else if (dayOfWeek === 6) {
    // Saturday
    nextDue.setDate(nextDue.getDate() + 1);
  }

  let frequencyString: string;
  if (frequencyDays === 1) {
    frequencyString = 'Daily';
  } else if (frequencyDays === 7) {
    frequencyString = 'Weekly';
  } else if (frequencyDays === 30) {
    frequencyString = 'Monthly';
  } else if (frequencyDays === 90) {
    frequencyString = 'Quarterly';
  } else if (frequencyDays === 180) {
    frequencyString = 'Semi-annually';
  } else if (frequencyDays === 365) {
    frequencyString = 'Annually';
  } else {
    frequencyString = `Every ${frequencyDays} days`;
  }

  return {
    assetId,
    maintenanceType,
    frequency: frequencyString,
    lastPerformed,
    nextDue,
    estimatedDowntime: `${estimatedDowntimeHours} hours`,
    cost: estimatedCost,
  };
}

// ============================================================================
// OPERATIONS DOMAIN INTELLIGENCE CLASS
// ============================================================================

export class OperationsDomainIntelligence {
  private region: string;
  private regionalContext: OperationsRegionalContext | null;

  constructor(region: string = 'kuwait') {
    this.region = region.toLowerCase();
    this.regionalContext = OPERATIONS_REGIONAL_CONTEXT[this.region] || null;
  }

  /**
   * Detect operations workflow pattern from user request
   */
  detectOperationsPattern(request: string): string | null {
    const normalizedRequest = request.toLowerCase();
    let bestMatch: string | null = null;
    let highestScore = 0;

    for (const [pattern, keywords] of Object.entries(OPERATIONS_KEYWORDS)) {
      const score = keywords.filter(kw =>
        normalizedRequest.includes(kw.toLowerCase())
      ).length;

      if (score > highestScore) {
        highestScore = score;
        bestMatch = pattern;
      }
    }

    // Require at least 1 keyword match for operations patterns
    return highestScore >= 1 ? bestMatch : null;
  }

  /**
   * Get implicit requirements for an operations pattern
   */
  getImplicitRequirements(pattern: string): ImplicitRequirement[] {
    const requirements = [...(OPERATIONS_IMPLICIT_REQUIREMENTS[pattern] || [])];

    // Add regional compliance requirements
    if (this.regionalContext && pattern) {
      const patternDef = OPERATIONS_WORKFLOW_PATTERNS[pattern];
      if (patternDef?.complianceRequirements) {
        patternDef.complianceRequirements.forEach((req, index) => {
          requirements.push({
            category: 'processing',
            description: req,
            reason: `Required for ${this.regionalContext!.region} compliance`,
            priority: index === 0 ? 'critical' : 'important',
            suggestedTools: ['Compliance module', 'Local consultant'],
          });
        });
      }
    }

    return requirements;
  }

  /**
   * Get tool recommendations for an operations pattern
   */
  getToolRecommendations(pattern: string, region?: string): ToolRecommendation[] {
    const effectiveRegion = region || this.region;
    const recommendations: ToolRecommendation[] = [];

    // Map pattern to tool category
    const categoryMapping: Record<string, string[]> = {
      purchase_requisition: ['procurement', 'inventory'],
      inventory_reorder: ['inventory', 'procurement'],
      supplier_onboarding: ['procurement'],
      quality_inspection: ['quality'],
      shipping_coordination: ['logistics'],
      returns_processing: ['logistics', 'inventory'],
      maintenance_request: ['maintenance', 'asset_management'],
      facility_booking: ['facility_booking'],
      asset_tracking: ['asset_management', 'maintenance'],
      incident_reporting: ['incident_management', 'quality'],
      sla_monitoring: ['quality'],
      capacity_planning: ['inventory', 'procurement'],
      process_improvement: ['quality'],
      vendor_evaluation: ['procurement', 'quality'],
      cost_optimization: ['procurement', 'inventory'],
    };

    const categories = categoryMapping[pattern] || ['inventory'];

    // Get tools from each category
    categories.forEach(category => {
      const categoryTools = OPERATIONS_TOOL_RECOMMENDATIONS[category] || [];
      recommendations.push(...categoryTools);
    });

    // Add Kuwait-specific logistics tools if relevant
    if (effectiveRegion === 'kuwait' && !categories.includes('logistics')) {
      const kuwaitLogisticsTools = OPERATIONS_TOOL_RECOMMENDATIONS.logistics || [];
      // Add top 2 logistics providers for regional relevance
      recommendations.push(...kuwaitLogisticsTools.slice(0, 2));
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
   * Get clarifying questions for an operations pattern
   */
  getClarifyingQuestions(pattern: string): ClarifyingQuestion[] {
    const questions: ClarifyingQuestion[] = [];
    const patternDef = OPERATIONS_WORKFLOW_PATTERNS[pattern];
    let questionId = 1;

    if (!patternDef) return questions;

    // Pattern-specific questions from the pattern definition
    patternDef.questions.forEach((questionText, index) => {
      questions.push({
        id: `ops_q${questionId++}`,
        question: questionText,
        category: this.categorizeQuestion(questionText),
        options: this.generateOptionsForQuestion(questionText, pattern),
        required: index < 3, // First 3 questions are required
        relevanceScore: 100 - (index * 10),
      });
    });

    // Add regional-specific questions for Kuwait
    if (this.region === 'kuwait') {
      if (pattern === 'shipping_coordination') {
        questions.push({
          id: `ops_q${questionId++}`,
          question: 'Which preferred logistics provider do you want to use?',
          category: 'platform',
          options: [
            { value: 'aramex', label: 'Aramex', description: 'Regional leader with COD support', implications: ['Kuwait office available'] },
            { value: 'dhl', label: 'DHL Express', description: 'Global network, customs expertise' },
            { value: 'agility', label: 'Agility', description: 'Kuwait-headquartered, local expertise' },
            { value: 'fedex', label: 'FedEx', description: 'Reliable international shipping' },
            { value: 'compare', label: 'Compare All', description: 'Get quotes from multiple carriers' },
          ],
          required: true,
          relevanceScore: 95,
        });

        questions.push({
          id: `ops_q${questionId++}`,
          question: 'Do you need customs clearance assistance?',
          category: 'integration',
          options: [
            { value: 'yes', label: 'Yes', description: 'Carrier handles customs documentation', implications: ['Requires customs broker integration'] },
            { value: 'no', label: 'No', description: 'We handle customs in-house' },
            { value: 'sometimes', label: 'Sometimes', description: 'Only for international shipments' },
          ],
          required: true,
          relevanceScore: 90,
        });
      }

      if (pattern === 'supplier_onboarding') {
        questions.push({
          id: `ops_q${questionId++}`,
          question: 'Do suppliers need Kuwait Commercial Registration verification?',
          category: 'region',
          options: [
            { value: 'yes', label: 'Yes', description: 'Verify CR and Chamber of Commerce membership', implications: ['Will validate against Kuwait CoC records'] },
            { value: 'no', label: 'No', description: 'International suppliers without Kuwait CR' },
          ],
          required: true,
          relevanceScore: 95,
        });
      }

      if (pattern === 'inventory_reorder' || pattern === 'shipping_coordination') {
        questions.push({
          id: `ops_q${questionId++}`,
          question: 'Do you use free trade zone warehousing?',
          category: 'region',
          options: [
            { value: 'shuwaikh', label: 'Shuwaikh FTZ', description: 'Shuwaikh Free Trade Zone' },
            { value: 'other', label: 'Other FTZ', description: 'Different free zone' },
            { value: 'no', label: 'No', description: 'Standard warehousing only' },
          ],
          required: false,
          relevanceScore: 80,
        });
      }

      if (pattern === 'maintenance_request' || pattern === 'facility_booking') {
        questions.push({
          id: `ops_q${questionId++}`,
          question: 'Should scheduling respect Kuwait business hours (Sun-Thu)?',
          category: 'region',
          options: [
            { value: 'yes', label: 'Yes', description: 'Schedule only Sunday-Thursday', implications: ['Will exclude Friday/Saturday'] },
            { value: 'no', label: 'No', description: 'Include weekends as needed' },
          ],
          required: false,
          relevanceScore: 75,
        });
      }
    }

    return questions;
  }

  /**
   * Get the workflow chain for an operations pattern
   */
  getWorkflowChain(pattern: string): WorkflowChainStep[] {
    const patternDef = OPERATIONS_WORKFLOW_PATTERNS[pattern];
    if (!patternDef) return [];

    const chain: WorkflowChainStep[] = [];

    patternDef.steps.forEach((stepName, index) => {
      const layer = patternDef.layers[Math.min(index, patternDef.layers.length - 1)];
      const implicitReq = OPERATIONS_IMPLICIT_REQUIREMENTS[pattern]?.[index];

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
   * Get regional context for operations
   */
  getRegionalContext(): OperationsRegionalContext | null {
    return this.regionalContext;
  }

  /**
   * Get preferred logistics providers for the region
   */
  getPreferredLogistics(): string[] {
    return this.regionalContext?.preferredLogistics || [];
  }

  /**
   * Get customs clearance authority for the region
   */
  getCustomsAuthority(): string | null {
    return this.regionalContext?.customsClearance || null;
  }

  /**
   * Calculate reorder point for an inventory item
   */
  calculateReorderPoint(
    averageDailyUsage: number,
    leadTimeDays: number,
    safetyStock: number,
    annualDemand?: number,
    orderCost?: number,
    holdingCostPerUnit?: number
  ): ReorderCalculation {
    return calculateReorderPoint(
      averageDailyUsage,
      leadTimeDays,
      safetyStock,
      annualDemand,
      orderCost,
      holdingCostPerUnit
    );
  }

  /**
   * Calculate inventory turnover ratio
   */
  calculateInventoryTurnover(cogs: number, averageInventory: number): InventoryTurnoverAnalysis {
    return calculateInventoryTurnover(cogs, averageInventory);
  }

  /**
   * Calculate supplier scorecard
   */
  calculateSupplierScore(
    supplierId: string,
    qualityScore: number,
    deliveryScore: number,
    priceScore: number,
    serviceScore: number
  ): SupplierScorecard {
    return calculateSupplierScorecard(
      supplierId,
      qualityScore,
      deliveryScore,
      priceScore,
      serviceScore
    );
  }

  /**
   * Calculate maintenance schedule
   */
  calculateMaintenanceSchedule(
    assetId: string,
    maintenanceType: 'preventive' | 'predictive' | 'corrective',
    frequencyDays: number,
    lastPerformed: Date | null,
    estimatedDowntimeHours: number,
    estimatedCost: number
  ): MaintenanceSchedule {
    return calculateMaintenanceSchedule(
      assetId,
      maintenanceType,
      frequencyDays,
      lastPerformed,
      estimatedDowntimeHours,
      estimatedCost
    );
  }

  /**
   * Get compliance requirements for the current region
   */
  getComplianceRequirements(pattern: string): string[] {
    const patternDef = OPERATIONS_WORKFLOW_PATTERNS[pattern];
    return patternDef?.complianceRequirements || [];
  }

  /**
   * Check if a date falls on a Kuwait business day
   */
  isKuwaitBusinessDay(date: Date): boolean {
    const dayOfWeek = date.getDay();
    // Kuwait business week: Sunday (0) - Thursday (4)
    return dayOfWeek >= 0 && dayOfWeek <= 4;
  }

  /**
   * Get next Kuwait business day from a given date
   */
  getNextKuwaitBusinessDay(date: Date): Date {
    const result = new Date(date);
    while (!this.isKuwaitBusinessDay(result)) {
      result.setDate(result.getDate() + 1);
    }
    return result;
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
    if (text.includes('platform') || text.includes('software') || text.includes('system') || text.includes('carrier')) {
      return 'platform';
    }
    if (text.includes('region') || text.includes('country') || text.includes('kuwait') || text.includes('customs')) {
      return 'region';
    }

    return 'integration';
  }

  private generateOptionsForQuestion(questionText: string, _pattern: string): QuestionOption[] {
    const text = questionText.toLowerCase();

    // Approval hierarchy
    if (text.includes('approval hierarchy') || text.includes('approval threshold')) {
      return [
        { value: 'single', label: 'Single Approval', description: 'One approver for all amounts' },
        { value: 'tiered', label: 'Tiered Approval', description: 'Different levels by amount' },
        { value: 'manager_only', label: 'Manager Only', description: 'Direct manager approves' },
        { value: 'skip_small', label: 'Auto-approve Small', description: 'Small amounts skip approval' },
      ];
    }

    // Inventory system
    if (text.includes('inventory management') || text.includes('what inventory')) {
      return [
        { value: 'zoho', label: 'Zoho Inventory', description: 'Zoho Inventory system' },
        { value: 'cin7', label: 'Cin7', description: 'Cin7 inventory platform' },
        { value: 'sap', label: 'SAP', description: 'SAP ERP inventory' },
        { value: 'excel', label: 'Excel/Sheets', description: 'Spreadsheet tracking' },
        { value: 'other', label: 'Other', description: 'Different system' },
      ];
    }

    // Carrier selection
    if (text.includes('carrier') || text.includes('logistics')) {
      return [
        { value: 'aramex', label: 'Aramex', description: 'Regional leader' },
        { value: 'dhl', label: 'DHL', description: 'Global express' },
        { value: 'fedex', label: 'FedEx', description: 'International shipping' },
        { value: 'agility', label: 'Agility', description: 'Kuwait-based logistics' },
        { value: 'multiple', label: 'Multiple Carriers', description: 'Compare and select' },
      ];
    }

    // Safety stock calculation
    if (text.includes('safety stock')) {
      return [
        { value: 'fixed', label: 'Fixed Quantity', description: 'Static safety stock level' },
        { value: 'percentage', label: 'Percentage of Demand', description: 'Based on average usage' },
        { value: 'service_level', label: 'Service Level Based', description: 'Statistical calculation' },
        { value: 'manual', label: 'Manual Review', description: 'Human judgment' },
      ];
    }

    // Inspection type
    if (text.includes('inspection') || text.includes('sampling')) {
      return [
        { value: '100_percent', label: '100% Inspection', description: 'Inspect every item' },
        { value: 'sampling', label: 'Sampling Inspection', description: 'Random sample per AQL' },
        { value: 'critical_only', label: 'Critical Items Only', description: 'Focus on high-risk items' },
        { value: 'skip', label: 'Skip-lot Inspection', description: 'Based on supplier history' },
      ];
    }

    // Maintenance type
    if (text.includes('technician') || text.includes('contractor')) {
      return [
        { value: 'inhouse', label: 'In-house Team', description: 'Internal technicians' },
        { value: 'contractor', label: 'External Contractor', description: 'Third-party service' },
        { value: 'mixed', label: 'Mixed', description: 'Both internal and external' },
      ];
    }

    // Frequency questions
    if (text.includes('how often') || text.includes('frequency')) {
      return [
        { value: 'daily', label: 'Daily', description: 'Every business day' },
        { value: 'weekly', label: 'Weekly', description: 'Once per week' },
        { value: 'monthly', label: 'Monthly', description: 'Once per month' },
        { value: 'quarterly', label: 'Quarterly', description: 'Every quarter' },
        { value: 'annually', label: 'Annually', description: 'Once per year' },
      ];
    }

    // Documents required
    if (text.includes('documents') || text.includes('documentation')) {
      return [
        { value: 'cr', label: 'Commercial Registration', description: 'Kuwait CR document' },
        { value: 'tax', label: 'Tax Registration', description: 'Tax ID certificate' },
        { value: 'insurance', label: 'Insurance Certificate', description: 'Liability coverage' },
        { value: 'bank', label: 'Bank Details', description: 'Payment information' },
        { value: 'all', label: 'All Standard Docs', description: 'Complete documentation package' },
      ];
    }

    // Return policy
    if (text.includes('return policy') || text.includes('timeframe')) {
      return [
        { value: '7_days', label: '7 Days', description: 'One week return window' },
        { value: '14_days', label: '14 Days', description: 'Two week return window' },
        { value: '30_days', label: '30 Days', description: 'One month return window' },
        { value: 'no_returns', label: 'No Returns', description: 'Final sale' },
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
      // Purchase Requisition
      submit_requisition: 'Submit purchase requisition',
      validate_budget: 'Validate budget availability',
      compare_vendors: 'Compare vendor quotes',
      route_approval: 'Route for approval',
      generate_po: 'Generate purchase order',
      notify_stakeholders: 'Notify stakeholders',

      // Inventory Reorder
      monitor_stock_levels: 'Monitor inventory levels',
      calculate_reorder_point: 'Calculate reorder point',
      generate_requisition: 'Generate replenishment requisition',
      select_vendor: 'Select vendor',
      create_purchase_order: 'Create purchase order',
      notify_warehouse: 'Notify warehouse',

      // Supplier Onboarding
      collect_supplier_info: 'Collect supplier information',
      verify_documents: 'Verify submitted documents',
      conduct_risk_assessment: 'Conduct risk assessment',
      perform_due_diligence: 'Perform due diligence',
      approve_supplier: 'Approve supplier',
      setup_master_data: 'Setup vendor master data',
      notify_procurement: 'Notify procurement team',

      // Quality Inspection
      receive_shipment: 'Receive shipment notification',
      generate_inspection_checklist: 'Generate inspection checklist',
      perform_inspection: 'Perform quality inspection',
      record_findings: 'Record inspection findings',
      categorize_defects: 'Categorize defects',
      route_disposition: 'Route for disposition decision',
      generate_report: 'Generate quality report',

      // Shipping Coordination
      receive_shipping_request: 'Receive shipping request',
      select_carrier: 'Select carrier',
      prepare_documentation: 'Prepare shipping documents',
      book_shipment: 'Book shipment',
      track_shipment: 'Track shipment',
      clear_customs: 'Clear customs',
      confirm_delivery: 'Confirm delivery',

      // Returns Processing
      receive_return_request: 'Receive return request',
      validate_return_policy: 'Validate return policy',
      generate_rma: 'Generate RMA number',
      receive_returned_item: 'Receive returned item',
      inspect_condition: 'Inspect item condition',
      process_disposition: 'Process disposition',
      issue_refund_credit: 'Issue refund/credit',
      update_inventory: 'Update inventory',

      // Maintenance Request
      submit_request: 'Submit maintenance request',
      categorize_issue: 'Categorize issue',
      assign_technician: 'Assign technician',
      schedule_work: 'Schedule work',
      perform_maintenance: 'Perform maintenance',
      verify_completion: 'Verify completion',
      update_asset_records: 'Update asset records',

      // Facility Booking
      check_availability: 'Check availability',
      submit_booking: 'Submit booking request',
      validate_requirements: 'Validate requirements',
      confirm_booking: 'Confirm booking',
      setup_facilities: 'Setup facilities',
      send_reminders: 'Send reminders',
      collect_feedback: 'Collect feedback',

      // Asset Tracking
      register_asset: 'Register asset',
      assign_location: 'Assign location',
      track_movements: 'Track movements',
      schedule_maintenance: 'Schedule maintenance',
      calculate_depreciation: 'Calculate depreciation',
      audit_assets: 'Audit assets',
      dispose_asset: 'Dispose asset',

      // Incident Reporting
      capture_incident: 'Capture incident details',
      classify_severity: 'Classify severity',
      assign_investigator: 'Assign investigator',
      investigate_root_cause: 'Investigate root cause',
      implement_corrective_action: 'Implement corrective action',
      monitor_effectiveness: 'Monitor effectiveness',
      close_incident: 'Close incident',

      // SLA Monitoring
      define_sla_metrics: 'Define SLA metrics',
      collect_performance_data: 'Collect performance data',
      calculate_compliance: 'Calculate compliance',
      generate_dashboards: 'Generate dashboards',
      alert_on_breach: 'Alert on breach',
      escalate_issues: 'Escalate issues',
      report_to_stakeholders: 'Report to stakeholders',

      // Capacity Planning
      collect_demand_data: 'Collect demand data',
      forecast_demand: 'Forecast demand',
      analyze_capacity: 'Analyze capacity',
      identify_gaps: 'Identify gaps',
      generate_recommendations: 'Generate recommendations',
      create_action_plan: 'Create action plan',
      monitor_execution: 'Monitor execution',

      // Process Improvement
      capture_improvement_idea: 'Capture improvement idea',
      evaluate_feasibility: 'Evaluate feasibility',
      prioritize_initiative: 'Prioritize initiative',
      assign_project_team: 'Assign project team',
      implement_change: 'Implement change',
      measure_results: 'Measure results',
      standardize_improvement: 'Standardize improvement',

      // Vendor Evaluation (prefixed to avoid duplicates)
      vendor_collect_performance_data: 'Collect vendor performance data',
      calculate_metrics: 'Calculate metrics',
      generate_scorecard: 'Generate scorecard',
      vendor_compare_vendors: 'Compare vendor scores',
      identify_risks: 'Identify risks',
      create_action_plans: 'Create action plans',
      communicate_results: 'Communicate results',

      // Cost Optimization (prefixed to avoid duplicates)
      collect_cost_data: 'Collect cost data',
      categorize_expenses: 'Categorize expenses',
      analyze_trends: 'Analyze trends',
      identify_opportunities: 'Identify opportunities',
      cost_generate_recommendations: 'Generate cost recommendations',
      implement_savings: 'Implement savings',
      track_results: 'Track results',
    };

    return mapping[stepName] || stepName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}

// ============================================================================
// EXPORTS & CONVENIENCE FUNCTIONS
// ============================================================================

export default OperationsDomainIntelligence;

/**
 * Create a new Operations Intelligence instance
 */
export function createOperationsIntelligence(region: string = 'kuwait'): OperationsDomainIntelligence {
  return new OperationsDomainIntelligence(region);
}

/**
 * Detect operations workflow pattern from a request string
 */
export function detectOperationsWorkflow(request: string): string | null {
  const intelligence = new OperationsDomainIntelligence();
  return intelligence.detectOperationsPattern(request);
}

/**
 * Full analysis result type
 */
export interface OperationsAnalysisResult {
  pattern: string | null;
  requirements: ImplicitRequirement[];
  tools: ToolRecommendation[];
  questions: ClarifyingQuestion[];
  workflowChain: WorkflowChainStep[];
  regionalContext: OperationsRegionalContext | null;
}

/**
 * Analyze an operations request and return full analysis
 */
export function analyzeOperationsRequest(
  request: string,
  region: string = 'kuwait'
): OperationsAnalysisResult {
  const intelligence = new OperationsDomainIntelligence(region);
  const pattern = intelligence.detectOperationsPattern(request);

  return {
    pattern,
    requirements: pattern ? intelligence.getImplicitRequirements(pattern) : [],
    tools: pattern ? intelligence.getToolRecommendations(pattern) : [],
    questions: pattern ? intelligence.getClarifyingQuestions(pattern) : [],
    workflowChain: pattern ? intelligence.getWorkflowChain(pattern) : [],
    regionalContext: intelligence.getRegionalContext(),
  };
}

/**
 * Get a human-readable summary of an operations analysis
 */
export function getOperationsSummary(
  request: string,
  region: string = 'kuwait'
): string {
  const analysis = analyzeOperationsRequest(request, region);
  const lines: string[] = [];

  lines.push(`## Operations Intelligence Analysis\n`);
  lines.push(`**Request:** "${request}"\n`);
  lines.push(`**Detected Pattern:** ${analysis.pattern || 'None detected'}\n`);

  if (analysis.requirements.length > 0) {
    lines.push(`\n### Implicit Requirements Detected`);
    analysis.requirements.forEach(req => {
      lines.push(`- **${req.description}** (${req.priority})`);
      lines.push(`  - Reason: ${req.reason}`);
      lines.push(`  - Suggested tools: ${req.suggestedTools.join(', ')}`);
    });
  }

  if (analysis.questions.length > 0) {
    lines.push(`\n### Clarifying Questions`);
    analysis.questions.forEach(q => {
      const marker = q.required ? '(Required)' : '(Optional)';
      lines.push(`- ${q.question} ${marker}`);
    });
  }

  if (analysis.tools.length > 0) {
    lines.push(`\n### Recommended Tools`);
    analysis.tools.slice(0, 5).forEach(tool => {
      lines.push(`- **${tool.toolName}** (Score: ${tool.score}, Regional Fit: ${tool.regionalFit}%)`);
      tool.reasons.slice(0, 2).forEach(r => lines.push(`  - ${r}`));
    });
  }

  if (analysis.workflowChain.length > 0) {
    lines.push(`\n### Workflow Chain`);
    analysis.workflowChain.forEach(step => {
      const status = step.isResolved ? 'DONE' : 'PENDING';
      lines.push(`${step.step}. [${step.layer.toUpperCase()}] ${step.description} - ${status}`);
    });
  }

  if (analysis.regionalContext) {
    lines.push(`\n### Regional Context: ${analysis.regionalContext.region}`);
    lines.push(`- Work Week: ${analysis.regionalContext.workweek}`);
    lines.push(`- Customs: ${analysis.regionalContext.customsClearance}`);
    lines.push(`- Preferred Logistics: ${analysis.regionalContext.preferredLogistics.join(', ')}`);
    lines.push(`- Port Access: ${analysis.regionalContext.portAccess}`);
  }

  return lines.join('\n');
}
