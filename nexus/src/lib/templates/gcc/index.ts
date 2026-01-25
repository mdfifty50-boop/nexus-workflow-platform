/**
 * GCC Templates Module
 * Re-exports all GCC-specific workflow templates
 */

// Kuwait Templates
export {
  generateKuwaitInvoiceHTML,
  KuwaitLicenseRenewalWorkflow,
  KuwaitCivilIDVerificationWorkflow,
  verifyWithPACI,
  calculateTotalRenewalFees,
  calculateTotalRenewalDays,
  getAllRenewalDocuments,
} from './kuwait-templates';

export type {
  BilingualText,
  InvoiceLineItem,
  KuwaitInvoiceData,
  LicenseRenewalStep,
  DocumentVerificationStep,
  PACIVerificationRequest,
  PACIVerificationResponse,
} from './kuwait-templates';

// Common GCC Workflow Templates
export {
  WorkflowCategory,
  VATInvoiceGenerationWorkflow,
  DocumentAttestationWorkflow,
  CommercialRegistrationRenewalWorkflow,
  EmployeeVisaProcessingWorkflow,
  GCCWorkflowTemplates,
  getWorkflowsForCountry,
  getWorkflowsByCategory,
  searchWorkflowsByTag,
  getWorkflowById,
  getWorkflowDurationHours,
  getAllWorkflowInputs,
  getAllWorkflowOutputs,
} from './gcc-workflow-templates';

export type {
  WorkflowStep,
  WorkflowInput,
  WorkflowOutput,
  WorkflowCondition,
  WorkflowTemplate,
  WorkflowCategoryType,
} from './gcc-workflow-templates';
