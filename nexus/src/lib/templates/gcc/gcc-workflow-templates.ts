/**
 * Common GCC Workflow Templates
 * Reusable workflow templates for GCC business operations
 */

import type { GCCCountryCode } from '../../gcc/gcc-business-types';

// ============================================================================
// WORKFLOW TEMPLATE TYPES
// ============================================================================

export interface WorkflowStep {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  type: 'manual' | 'automated' | 'approval' | 'notification' | 'integration';
  estimatedDurationMinutes?: number;
  requiredInputs?: WorkflowInput[];
  outputs?: WorkflowOutput[];
  conditions?: WorkflowCondition[];
}

export interface WorkflowInput {
  name: string;
  type: 'string' | 'number' | 'date' | 'file' | 'boolean' | 'currency';
  required: boolean;
  description?: string;
  validation?: string;
}

export interface WorkflowOutput {
  name: string;
  type: 'string' | 'number' | 'date' | 'file' | 'document' | 'notification';
  description?: string;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value: string | number | boolean;
}

export const WorkflowCategory = {
  FINANCE: 'FINANCE',
  COMPLIANCE: 'COMPLIANCE',
  HR: 'HR',
  DOCUMENTATION: 'DOCUMENTATION',
  LEGAL: 'LEGAL',
} as const;

export type WorkflowCategoryType = typeof WorkflowCategory[keyof typeof WorkflowCategory];

export interface WorkflowTemplate {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  category: WorkflowCategoryType;
  applicableCountries: GCCCountryCode[];
  steps: WorkflowStep[];
  estimatedTotalMinutes: number;
  tags: string[];
}

// ============================================================================
// VAT INVOICE GENERATION WORKFLOW
// ============================================================================

export const VATInvoiceGenerationWorkflow: WorkflowTemplate = {
  id: 'gcc-vat-invoice-generation',
  name: 'VAT Invoice Generation',
  nameAr: 'إنشاء فاتورة ضريبية',
  description: 'Generate VAT-compliant invoices for GCC countries with automatic tax calculation',
  descriptionAr: 'إنشاء فواتير متوافقة مع ضريبة القيمة المضافة لدول الخليج مع حساب الضريبة التلقائي',
  category: 'FINANCE',
  applicableCountries: ['AE', 'SA', 'BH', 'OM'],
  estimatedTotalMinutes: 15,
  tags: ['vat', 'invoice', 'tax', 'finance'],
  steps: [
    {
      id: 'collect-seller-info',
      name: 'Collect Seller Information',
      nameAr: 'جمع معلومات البائع',
      description: 'Gather seller company details including VAT registration number',
      descriptionAr: 'جمع تفاصيل شركة البائع بما في ذلك رقم التسجيل الضريبي',
      type: 'manual',
      estimatedDurationMinutes: 2,
      requiredInputs: [
        { name: 'sellerName', type: 'string', required: true, description: 'Company name' },
        { name: 'sellerVATNumber', type: 'string', required: true, description: 'VAT registration number' },
        { name: 'sellerAddress', type: 'string', required: true },
        { name: 'sellerCountry', type: 'string', required: true },
      ],
    },
    {
      id: 'collect-buyer-info',
      name: 'Collect Buyer Information',
      nameAr: 'جمع معلومات المشتري',
      description: 'Gather buyer/customer details',
      descriptionAr: 'جمع تفاصيل المشتري/العميل',
      type: 'manual',
      estimatedDurationMinutes: 2,
      requiredInputs: [
        { name: 'buyerName', type: 'string', required: true },
        { name: 'buyerVATNumber', type: 'string', required: false },
        { name: 'buyerAddress', type: 'string', required: true },
      ],
    },
    {
      id: 'add-line-items',
      name: 'Add Invoice Line Items',
      nameAr: 'إضافة بنود الفاتورة',
      description: 'Add products or services with quantities and prices',
      descriptionAr: 'إضافة المنتجات أو الخدمات مع الكميات والأسعار',
      type: 'manual',
      estimatedDurationMinutes: 5,
      requiredInputs: [
        { name: 'lineItems', type: 'string', required: true, description: 'JSON array of line items' },
        { name: 'currency', type: 'currency', required: true },
      ],
    },
    {
      id: 'calculate-vat',
      name: 'Calculate VAT',
      nameAr: 'حساب ضريبة القيمة المضافة',
      description: 'Automatically calculate VAT based on country rate',
      descriptionAr: 'حساب ضريبة القيمة المضافة تلقائياً بناءً على معدل الدولة',
      type: 'automated',
      estimatedDurationMinutes: 1,
      outputs: [
        { name: 'subtotal', type: 'number' },
        { name: 'vatAmount', type: 'number' },
        { name: 'totalAmount', type: 'number' },
        { name: 'vatRate', type: 'number' },
      ],
    },
    {
      id: 'generate-invoice',
      name: 'Generate Invoice Document',
      nameAr: 'إنشاء مستند الفاتورة',
      description: 'Generate formatted invoice document',
      descriptionAr: 'إنشاء مستند الفاتورة المنسق',
      type: 'automated',
      estimatedDurationMinutes: 2,
      outputs: [
        { name: 'invoicePDF', type: 'file' },
        { name: 'invoiceNumber', type: 'string' },
      ],
    },
    {
      id: 'send-invoice',
      name: 'Send Invoice',
      nameAr: 'إرسال الفاتورة',
      description: 'Send invoice to customer via email',
      descriptionAr: 'إرسال الفاتورة للعميل عبر البريد الإلكتروني',
      type: 'notification',
      estimatedDurationMinutes: 1,
      requiredInputs: [
        { name: 'recipientEmail', type: 'string', required: true },
      ],
    },
    {
      id: 'record-transaction',
      name: 'Record Transaction',
      nameAr: 'تسجيل المعاملة',
      description: 'Record invoice in accounting system for VAT reporting',
      descriptionAr: 'تسجيل الفاتورة في النظام المحاسبي لتقارير الضريبة',
      type: 'integration',
      estimatedDurationMinutes: 2,
    },
  ],
};

// ============================================================================
// DOCUMENT ATTESTATION WORKFLOW
// ============================================================================

export const DocumentAttestationWorkflow: WorkflowTemplate = {
  id: 'gcc-document-attestation',
  name: 'Document Attestation',
  nameAr: 'تصديق المستندات',
  description: 'Process for attesting documents for use in GCC countries',
  descriptionAr: 'عملية تصديق المستندات للاستخدام في دول الخليج',
  category: 'LEGAL',
  applicableCountries: ['KW', 'AE', 'SA', 'BH', 'QA', 'OM'],
  estimatedTotalMinutes: 2880, // 48 hours typical
  tags: ['attestation', 'legal', 'documents', 'authentication'],
  steps: [
    {
      id: 'document-collection',
      name: 'Collect Original Documents',
      nameAr: 'جمع المستندات الأصلية',
      description: 'Gather all original documents requiring attestation',
      descriptionAr: 'جمع جميع المستندات الأصلية التي تتطلب التصديق',
      type: 'manual',
      estimatedDurationMinutes: 30,
      requiredInputs: [
        { name: 'documentType', type: 'string', required: true },
        { name: 'documentFile', type: 'file', required: true },
        { name: 'issuingCountry', type: 'string', required: true },
        { name: 'targetCountry', type: 'string', required: true },
      ],
    },
    {
      id: 'notary-attestation',
      name: 'Notary Public Attestation',
      nameAr: 'تصديق كاتب العدل',
      description: 'Get document attested by notary public in issuing country',
      descriptionAr: 'تصديق المستند من كاتب العدل في بلد الإصدار',
      type: 'manual',
      estimatedDurationMinutes: 120,
      conditions: [
        { field: 'requiresNotary', operator: 'equals', value: true },
      ],
    },
    {
      id: 'mofa-origin',
      name: 'Ministry of Foreign Affairs (Origin)',
      nameAr: 'وزارة الخارجية (بلد الإصدار)',
      description: 'Attestation from Ministry of Foreign Affairs in issuing country',
      descriptionAr: 'تصديق من وزارة الخارجية في بلد الإصدار',
      type: 'manual',
      estimatedDurationMinutes: 480,
    },
    {
      id: 'embassy-attestation',
      name: 'Embassy Attestation',
      nameAr: 'تصديق السفارة',
      description: 'Attestation from target country embassy',
      descriptionAr: 'تصديق من سفارة الدولة المستهدفة',
      type: 'manual',
      estimatedDurationMinutes: 960,
    },
    {
      id: 'mofa-destination',
      name: 'Ministry of Foreign Affairs (Destination)',
      nameAr: 'وزارة الخارجية (الدولة المستهدفة)',
      description: 'Final attestation from MOFA in destination GCC country',
      descriptionAr: 'التصديق النهائي من وزارة الخارجية في دولة الخليج المستهدفة',
      type: 'manual',
      estimatedDurationMinutes: 480,
    },
    {
      id: 'translation',
      name: 'Legal Translation',
      nameAr: 'الترجمة القانونية',
      description: 'Translate document to Arabic if required',
      descriptionAr: 'ترجمة المستند إلى العربية إذا لزم الأمر',
      type: 'manual',
      estimatedDurationMinutes: 240,
      conditions: [
        { field: 'requiresTranslation', operator: 'equals', value: true },
      ],
      outputs: [
        { name: 'translatedDocument', type: 'file' },
      ],
    },
    {
      id: 'final-verification',
      name: 'Final Verification',
      nameAr: 'التحقق النهائي',
      description: 'Verify all attestations are complete and valid',
      descriptionAr: 'التحقق من اكتمال وصلاحية جميع التصديقات',
      type: 'approval',
      estimatedDurationMinutes: 30,
      outputs: [
        { name: 'attestedDocument', type: 'document' },
        { name: 'attestationCertificate', type: 'document' },
      ],
    },
  ],
};

// ============================================================================
// COMMERCIAL REGISTRATION RENEWAL WORKFLOW
// ============================================================================

export const CommercialRegistrationRenewalWorkflow: WorkflowTemplate = {
  id: 'gcc-cr-renewal',
  name: 'Commercial Registration Renewal',
  nameAr: 'تجديد السجل التجاري',
  description: 'Renew commercial registration before expiry',
  descriptionAr: 'تجديد السجل التجاري قبل انتهاء الصلاحية',
  category: 'COMPLIANCE',
  applicableCountries: ['KW', 'AE', 'SA', 'BH', 'QA', 'OM'],
  estimatedTotalMinutes: 1440, // 24 hours
  tags: ['cr', 'renewal', 'compliance', 'registration'],
  steps: [
    {
      id: 'check-expiry',
      name: 'Check Expiry Status',
      nameAr: 'التحقق من حالة الانتهاء',
      description: 'Verify current CR expiry date and renewal eligibility',
      descriptionAr: 'التحقق من تاريخ انتهاء السجل التجاري وأهلية التجديد',
      type: 'automated',
      estimatedDurationMinutes: 5,
      requiredInputs: [
        { name: 'crNumber', type: 'string', required: true },
        { name: 'country', type: 'string', required: true },
      ],
      outputs: [
        { name: 'currentExpiryDate', type: 'date' },
        { name: 'daysUntilExpiry', type: 'number' },
        { name: 'isEligibleForRenewal', type: 'string' },
      ],
    },
    {
      id: 'clear-violations',
      name: 'Clear Outstanding Violations',
      nameAr: 'تسوية المخالفات المعلقة',
      description: 'Pay any outstanding fines or violations',
      descriptionAr: 'دفع أي غرامات أو مخالفات معلقة',
      type: 'manual',
      estimatedDurationMinutes: 120,
      conditions: [
        { field: 'hasViolations', operator: 'equals', value: true },
      ],
    },
    {
      id: 'labor-clearance',
      name: 'Obtain Labor Clearance',
      nameAr: 'الحصول على براءة ذمة العمل',
      description: 'Get clearance from labor/social affairs ministry',
      descriptionAr: 'الحصول على براءة ذمة من وزارة العمل/الشؤون الاجتماعية',
      type: 'manual',
      estimatedDurationMinutes: 240,
    },
    {
      id: 'chamber-renewal',
      name: 'Renew Chamber Membership',
      nameAr: 'تجديد عضوية الغرفة التجارية',
      description: 'Renew Chamber of Commerce membership',
      descriptionAr: 'تجديد عضوية غرفة التجارة والصناعة',
      type: 'manual',
      estimatedDurationMinutes: 60,
      requiredInputs: [
        { name: 'chamberNumber', type: 'string', required: true },
      ],
    },
    {
      id: 'pay-fees',
      name: 'Pay Renewal Fees',
      nameAr: 'دفع رسوم التجديد',
      description: 'Pay all required renewal fees',
      descriptionAr: 'دفع جميع رسوم التجديد المطلوبة',
      type: 'manual',
      estimatedDurationMinutes: 30,
      requiredInputs: [
        { name: 'feeAmount', type: 'currency', required: true },
        { name: 'paymentMethod', type: 'string', required: true },
      ],
      outputs: [
        { name: 'paymentReceipt', type: 'file' },
      ],
    },
    {
      id: 'submit-renewal',
      name: 'Submit Renewal Application',
      nameAr: 'تقديم طلب التجديد',
      description: 'Submit renewal application to Ministry of Commerce',
      descriptionAr: 'تقديم طلب التجديد إلى وزارة التجارة',
      type: 'integration',
      estimatedDurationMinutes: 30,
    },
    {
      id: 'receive-certificate',
      name: 'Receive Renewed Certificate',
      nameAr: 'استلام الشهادة المجددة',
      description: 'Collect renewed CR certificate',
      descriptionAr: 'استلام شهادة السجل التجاري المجددة',
      type: 'manual',
      estimatedDurationMinutes: 480,
      outputs: [
        { name: 'renewedCRCertificate', type: 'document' },
        { name: 'newExpiryDate', type: 'date' },
      ],
    },
  ],
};

// ============================================================================
// EMPLOYEE VISA PROCESSING WORKFLOW
// ============================================================================

export const EmployeeVisaProcessingWorkflow: WorkflowTemplate = {
  id: 'gcc-employee-visa',
  name: 'Employee Visa Processing',
  nameAr: 'معالجة تأشيرة الموظف',
  description: 'Process work visa for new employee in GCC country',
  descriptionAr: 'معالجة تأشيرة العمل للموظف الجديد في دولة خليجية',
  category: 'HR',
  applicableCountries: ['KW', 'AE', 'SA', 'BH', 'QA', 'OM'],
  estimatedTotalMinutes: 10080, // 7 days
  tags: ['visa', 'hr', 'employee', 'immigration'],
  steps: [
    {
      id: 'verify-quota',
      name: 'Verify Visa Quota',
      nameAr: 'التحقق من حصة التأشيرات',
      description: 'Check available visa quota for company',
      descriptionAr: 'التحقق من حصة التأشيرات المتاحة للشركة',
      type: 'automated',
      estimatedDurationMinutes: 15,
      requiredInputs: [
        { name: 'companyId', type: 'string', required: true },
        { name: 'visaType', type: 'string', required: true },
      ],
      outputs: [
        { name: 'availableQuota', type: 'number' },
        { name: 'hasAvailableQuota', type: 'string' },
      ],
    },
    {
      id: 'collect-documents',
      name: 'Collect Employee Documents',
      nameAr: 'جمع مستندات الموظف',
      description: 'Gather required documents from employee',
      descriptionAr: 'جمع المستندات المطلوبة من الموظف',
      type: 'manual',
      estimatedDurationMinutes: 240,
      requiredInputs: [
        { name: 'passport', type: 'file', required: true },
        { name: 'photo', type: 'file', required: true },
        { name: 'educationCertificates', type: 'file', required: true },
        { name: 'employmentContract', type: 'file', required: true },
        { name: 'medicalCertificate', type: 'file', required: false },
      ],
    },
    {
      id: 'document-attestation',
      name: 'Document Attestation',
      nameAr: 'تصديق المستندات',
      description: 'Attest education and employment certificates',
      descriptionAr: 'تصديق شهادات التعليم والعمل',
      type: 'manual',
      estimatedDurationMinutes: 2880,
      conditions: [
        { field: 'requiresAttestation', operator: 'equals', value: true },
      ],
    },
    {
      id: 'medical-examination',
      name: 'Medical Examination',
      nameAr: 'الفحص الطبي',
      description: 'Complete required medical examination',
      descriptionAr: 'إكمال الفحص الطبي المطلوب',
      type: 'manual',
      estimatedDurationMinutes: 480,
      outputs: [
        { name: 'medicalReport', type: 'document' },
        { name: 'medicalStatus', type: 'string' },
      ],
    },
    {
      id: 'submit-visa-application',
      name: 'Submit Visa Application',
      nameAr: 'تقديم طلب التأشيرة',
      description: 'Submit visa application to immigration authority',
      descriptionAr: 'تقديم طلب التأشيرة إلى سلطة الهجرة',
      type: 'integration',
      estimatedDurationMinutes: 60,
      requiredInputs: [
        { name: 'jobTitle', type: 'string', required: true },
        { name: 'salary', type: 'currency', required: true },
        { name: 'contractDuration', type: 'string', required: true },
      ],
    },
    {
      id: 'visa-approval',
      name: 'Await Visa Approval',
      nameAr: 'انتظار موافقة التأشيرة',
      description: 'Wait for visa approval from immigration',
      descriptionAr: 'انتظار موافقة التأشيرة من سلطة الهجرة',
      type: 'approval',
      estimatedDurationMinutes: 4320,
      outputs: [
        { name: 'visaApprovalStatus', type: 'string' },
        { name: 'visaNumber', type: 'string' },
      ],
    },
    {
      id: 'visa-stamping',
      name: 'Visa Stamping',
      nameAr: 'ختم التأشيرة',
      description: 'Complete visa stamping on passport',
      descriptionAr: 'إتمام ختم التأشيرة على جواز السفر',
      type: 'manual',
      estimatedDurationMinutes: 240,
      outputs: [
        { name: 'visaStampedPassport', type: 'document' },
        { name: 'visaValidUntil', type: 'date' },
      ],
    },
    {
      id: 'residency-id',
      name: 'Apply for Residency ID',
      nameAr: 'التقديم على الإقامة',
      description: 'Apply for residency/civil ID after arrival',
      descriptionAr: 'التقديم على بطاقة الإقامة/الهوية المدنية بعد الوصول',
      type: 'manual',
      estimatedDurationMinutes: 960,
      outputs: [
        { name: 'residencyIdNumber', type: 'string' },
        { name: 'residencyCard', type: 'document' },
      ],
    },
  ],
};

// ============================================================================
// TEMPLATE REGISTRY
// ============================================================================

export const GCCWorkflowTemplates: WorkflowTemplate[] = [
  VATInvoiceGenerationWorkflow,
  DocumentAttestationWorkflow,
  CommercialRegistrationRenewalWorkflow,
  EmployeeVisaProcessingWorkflow,
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get workflows applicable to a specific country
 */
export function getWorkflowsForCountry(country: GCCCountryCode): WorkflowTemplate[] {
  return GCCWorkflowTemplates.filter(
    template => template.applicableCountries.includes(country)
  );
}

/**
 * Get workflows by category
 */
export function getWorkflowsByCategory(category: WorkflowCategoryType): WorkflowTemplate[] {
  return GCCWorkflowTemplates.filter(template => template.category === category);
}

/**
 * Search workflows by tag
 */
export function searchWorkflowsByTag(tag: string): WorkflowTemplate[] {
  const lowerTag = tag.toLowerCase();
  return GCCWorkflowTemplates.filter(
    template => template.tags.some(t => t.toLowerCase().includes(lowerTag))
  );
}

/**
 * Get workflow by ID
 */
export function getWorkflowById(id: string): WorkflowTemplate | undefined {
  return GCCWorkflowTemplates.find(template => template.id === id);
}

/**
 * Calculate estimated duration for workflow in hours
 */
export function getWorkflowDurationHours(workflow: WorkflowTemplate): number {
  return Math.ceil(workflow.estimatedTotalMinutes / 60);
}

/**
 * Get required inputs for entire workflow
 */
export function getAllWorkflowInputs(workflow: WorkflowTemplate): WorkflowInput[] {
  const inputMap = new Map<string, WorkflowInput>();

  workflow.steps.forEach(step => {
    step.requiredInputs?.forEach(input => {
      if (!inputMap.has(input.name)) {
        inputMap.set(input.name, input);
      }
    });
  });

  return Array.from(inputMap.values());
}

/**
 * Get all outputs from workflow
 */
export function getAllWorkflowOutputs(workflow: WorkflowTemplate): WorkflowOutput[] {
  const outputMap = new Map<string, WorkflowOutput>();

  workflow.steps.forEach(step => {
    step.outputs?.forEach(output => {
      if (!outputMap.has(output.name)) {
        outputMap.set(output.name, output);
      }
    });
  });

  return Array.from(outputMap.values());
}
