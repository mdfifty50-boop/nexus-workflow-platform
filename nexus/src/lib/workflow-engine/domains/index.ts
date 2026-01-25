/**
 * Nexus Domain Intelligence Modules
 *
 * Each domain module provides specialized workflow intelligence including:
 * - Pattern detection
 * - Implicit requirement analysis
 * - Tool recommendations
 * - Regional compliance
 * - Clarifying questions
 */

// Finance Domain
export {
  FinanceDomainIntelligence,
  createFinanceIntelligence,
  detectFinanceWorkflow,
  calculateKuwaitEndOfService,
  calculateKuwaitVAT,
  FINANCE_WORKFLOW_PATTERNS,
  FINANCE_KEYWORDS,
  FINANCE_IMPLICIT_REQUIREMENTS,
  FINANCE_TOOL_RECOMMENDATIONS,
  FINANCE_REGIONAL_CONTEXT,
} from './finance-intelligence';

export type {
  FinanceWorkflowPattern,
  FinanceRegionalContext,
  EndOfServiceCalculation,
} from './finance-intelligence';

// HR Domain
export {
  HRDomainIntelligence,
  detectHRPattern,
  getHRImplicitRequirements,
  getHRToolRecommendations,
  getHRClarifyingQuestions,
  analyzeHRRequest,
  calculateKuwaitEOSI,
  HR_WORKFLOW_PATTERNS,
  HR_KEYWORDS,
  HR_IMPLICIT_REQUIREMENTS,
  HR_TOOL_RECOMMENDATIONS,
  HR_REGIONAL_CONTEXT,
} from './hr-intelligence';

export type {
  HRWorkflowPattern,
  HRWorkflowStage,
  HRRegionalRequirement,
  HRToolRecommendation,
} from './hr-intelligence';

// Sales Domain
export {
  SalesDomainIntelligence,
  createSalesIntelligence,
  detectSalesWorkflow,
  analyzeSalesRequest,
  calculateCommission,
  calculateLeadScore,
  getSalesMetrics,
  getAllSalesPatterns,
  getSalesPatternByName,
  SALES_WORKFLOW_PATTERNS,
  SALES_KEYWORDS,
  SALES_IMPLICIT_REQUIREMENTS,
  SALES_TOOL_RECOMMENDATIONS,
  SALES_REGIONAL_CONTEXT,
} from './sales-intelligence';

export type {
  SalesWorkflowPattern,
  SalesRegionalContext,
  CommissionCalculation,
  LeadScore,
  LeadScoreFactor,
  SalesAnalysisResult,
} from './sales-intelligence';

// Marketing Domain
export {
  MarketingDomainIntelligence,
  createMarketingIntelligence,
  detectMarketingWorkflow,
  analyzeMarketingRequest,
  calculateCampaignROI,
  calculateCampaignPerformance,
  getOptimalPostingTime,
  calculateEngagementRate,
  MARKETING_WORKFLOW_PATTERNS,
  MARKETING_KEYWORDS,
  MARKETING_IMPLICIT_REQUIREMENTS,
  MARKETING_TOOL_RECOMMENDATIONS,
  MARKETING_REGIONAL_CONTEXT,
} from './marketing-intelligence';

export type {
  MarketingWorkflowPattern,
  MarketingRegionalContext,
  ROICalculation,
  CampaignPerformance,
  ContentCalendarEntry,
  MarketingAnalysisResult,
} from './marketing-intelligence';

// Operations Domain
export {
  OperationsDomainIntelligence,
  createOperationsIntelligence,
  detectOperationsWorkflow,
  analyzeOperationsRequest,
  calculateReorderPoint,
  calculateInventoryTurnover,
  calculateSupplierScorecard,
  calculateMaintenanceSchedule,
  getOperationsSummary,
  OPERATIONS_WORKFLOW_PATTERNS,
  OPERATIONS_KEYWORDS,
  OPERATIONS_IMPLICIT_REQUIREMENTS,
  OPERATIONS_TOOL_RECOMMENDATIONS,
  OPERATIONS_REGIONAL_CONTEXT,
} from './operations-intelligence';

export type {
  OperationsWorkflowPattern,
  OperationsRegionalContext,
  ReorderCalculation,
  InventoryTurnoverAnalysis,
  SupplierScorecard,
  MaintenanceSchedule,
  OperationsAnalysisResult,
} from './operations-intelligence';

// Legal Domain
export {
  LegalDomainIntelligence,
  createLegalIntelligence,
  detectLegalWorkflow,
  analyzeLegalRequest,
  getContractExpiryAlert,
  calculateStatuteOfLimitations,
  getLegalComplianceRequirements,
  getCourtSystemInfo,
  LEGAL_WORKFLOW_PATTERNS,
  LEGAL_KEYWORDS,
  LEGAL_IMPLICIT_REQUIREMENTS,
  LEGAL_TOOL_RECOMMENDATIONS,
  LEGAL_REGIONAL_CONTEXT,
} from './legal-intelligence';

export type {
  LegalWorkflowPattern,
  LegalRegionalContext,
  ContractExpiryAlert,
  StatuteOfLimitationsResult,
  LegalAnalysisResult,
  LegalRiskAssessment,
  RiskFactor,
} from './legal-intelligence';

// Customer Service Domain
export {
  CustomerServiceDomainIntelligence,
  createCustomerServiceIntelligence,
  detectCustomerServiceWorkflow,
  analyzeCustomerServiceRequest,
  calculateNPS,
  calculateCSAT,
  calculateSLADeadline,
  determinePriority,
  CUSTOMER_SERVICE_WORKFLOW_PATTERNS,
  CUSTOMER_SERVICE_KEYWORDS,
  CUSTOMER_SERVICE_IMPLICIT_REQUIREMENTS,
  CUSTOMER_SERVICE_TOOL_RECOMMENDATIONS,
  CUSTOMER_SERVICE_REGIONAL_CONTEXT,
  DEFAULT_SLA_CONFIGURATIONS,
  TICKET_PRIORITIES,
  ESCALATION_PATHS,
} from './customer-service-intelligence';

export type {
  CustomerServiceWorkflowPattern,
  CustomerServiceRegionalContext,
  SLAConfiguration,
  NPSResult,
  CSATResult,
  CustomerServiceAnalysisResult,
  TicketPriority,
  EscalationPath,
} from './customer-service-intelligence';

// Project Management Domain
export {
  ProjectManagementDomainIntelligence,
  createProjectManagementIntelligence,
  detectProjectManagementWorkflow,
  analyzeProjectManagementRequest,
  calculateSprintMetrics,
  generateProjectHealthScore,
  PROJECT_MANAGEMENT_WORKFLOW_PATTERNS,
  PROJECT_MANAGEMENT_KEYWORDS,
  PROJECT_MANAGEMENT_IMPLICIT_REQUIREMENTS,
  PROJECT_MANAGEMENT_TOOL_RECOMMENDATIONS,
  PROJECT_MANAGEMENT_REGIONAL_CONTEXT,
} from './project-management-intelligence';

export type {
  ProjectManagementWorkflowPattern,
  ProjectManagementRegionalContext,
  BurndownData,
  VelocityData,
  ProjectCompletionEstimate,
  ProjectManagementAnalysisResult,
} from './project-management-intelligence';

// Re-export types from main workflow-intelligence for convenience
export type {
  ImplicitRequirement,
  ClarifyingQuestion,
  ToolRecommendation,
  AlternativeTool,
  WorkflowChainStep,
  QuestionOption,
  RegionalContext,
} from '../workflow-intelligence';
