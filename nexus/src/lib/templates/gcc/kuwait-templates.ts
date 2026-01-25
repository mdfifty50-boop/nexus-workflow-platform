/**
 * Kuwait-Specific Workflow Templates
 * Bilingual templates for Kuwait business operations
 */

import type { GCCCurrencyCode } from '../../gcc/gcc-currencies';

// ============================================================================
// TEMPLATE TYPES
// ============================================================================

export interface BilingualText {
  en: string;
  ar: string;
}

export interface InvoiceLineItem {
  description: BilingualText;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unit?: BilingualText;
}

export interface KuwaitInvoiceData {
  // Invoice identification
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;

  // Seller information
  sellerName: BilingualText;
  sellerCRNumber: string;
  sellerAddress: BilingualText;
  sellerPhone: string;
  sellerEmail?: string;

  // Buyer information
  buyerName: BilingualText;
  buyerCRNumber?: string;
  buyerCivilId?: string;
  buyerAddress: BilingualText;
  buyerPhone?: string;

  // Invoice details
  lineItems: InvoiceLineItem[];
  currency: GCCCurrencyCode;
  subtotal: number;
  discount?: number;
  total: number;

  // Payment information
  paymentTerms?: BilingualText;
  bankName?: BilingualText;
  bankAccountNumber?: string;
  iban?: string;

  // Notes
  notes?: BilingualText;
}

// ============================================================================
// KUWAIT INVOICE TEMPLATE
// ============================================================================

/**
 * Generate bilingual Kuwait invoice HTML
 */
export function generateKuwaitInvoiceHTML(data: KuwaitInvoiceData): string {
  const formatDate = (date: Date) => date.toLocaleDateString('en-GB');
  const formatCurrency = (amount: number, currency: GCCCurrencyCode) => {
    const decimals = currency === 'KWD' ? 3 : 2;
    return amount.toFixed(decimals);
  };

  const lineItemsHTML = data.lineItems.map((item, index) => `
    <tr>
      <td style="text-align: center; padding: 8px; border: 1px solid #ddd;">${index + 1}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">
        <div>${item.description.en}</div>
        <div dir="rtl" style="color: #666;">${item.description.ar}</div>
      </td>
      <td style="text-align: center; padding: 8px; border: 1px solid #ddd;">${item.quantity}</td>
      <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">${formatCurrency(item.unitPrice, data.currency)}</td>
      <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">${formatCurrency(item.totalPrice, data.currency)}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice / فاتورة - ${data.invoiceNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
    .invoice-container { max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .bilingual { display: flex; justify-content: space-between; }
    .bilingual .en { text-align: left; }
    .bilingual .ar { text-align: right; direction: rtl; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #f5f5f5; padding: 10px; border: 1px solid #ddd; }
    .totals { width: 300px; margin-left: auto; }
    .totals td { padding: 8px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="header">
      <div class="en">
        <h1>INVOICE</h1>
        <p><strong>Invoice No:</strong> ${data.invoiceNumber}</p>
        <p><strong>Date:</strong> ${formatDate(data.invoiceDate)}</p>
        <p><strong>Due Date:</strong> ${formatDate(data.dueDate)}</p>
      </div>
      <div class="ar" dir="rtl">
        <h1>فاتورة</h1>
        <p><strong>رقم الفاتورة:</strong> ${data.invoiceNumber}</p>
        <p><strong>التاريخ:</strong> ${formatDate(data.invoiceDate)}</p>
        <p><strong>تاريخ الاستحقاق:</strong> ${formatDate(data.dueDate)}</p>
      </div>
    </div>

    <!-- Seller & Buyer Info -->
    <div class="bilingual" style="margin-bottom: 30px;">
      <div class="en" style="width: 48%;">
        <h3>From / Seller</h3>
        <p><strong>${data.sellerName.en}</strong></p>
        <p>CR: ${data.sellerCRNumber}</p>
        <p>${data.sellerAddress.en}</p>
        <p>Tel: ${data.sellerPhone}</p>
        ${data.sellerEmail ? `<p>Email: ${data.sellerEmail}</p>` : ''}
      </div>
      <div class="ar" dir="rtl" style="width: 48%;">
        <h3>من / البائع</h3>
        <p><strong>${data.sellerName.ar}</strong></p>
        <p>س.ت: ${data.sellerCRNumber}</p>
        <p>${data.sellerAddress.ar}</p>
        <p>هاتف: ${data.sellerPhone}</p>
      </div>
    </div>

    <div class="bilingual" style="margin-bottom: 30px;">
      <div class="en" style="width: 48%;">
        <h3>To / Buyer</h3>
        <p><strong>${data.buyerName.en}</strong></p>
        ${data.buyerCRNumber ? `<p>CR: ${data.buyerCRNumber}</p>` : ''}
        ${data.buyerCivilId ? `<p>Civil ID: ${data.buyerCivilId}</p>` : ''}
        <p>${data.buyerAddress.en}</p>
        ${data.buyerPhone ? `<p>Tel: ${data.buyerPhone}</p>` : ''}
      </div>
      <div class="ar" dir="rtl" style="width: 48%;">
        <h3>إلى / المشتري</h3>
        <p><strong>${data.buyerName.ar}</strong></p>
        ${data.buyerCRNumber ? `<p>س.ت: ${data.buyerCRNumber}</p>` : ''}
        ${data.buyerCivilId ? `<p>الرقم المدني: ${data.buyerCivilId}</p>` : ''}
        <p>${data.buyerAddress.ar}</p>
      </div>
    </div>

    <!-- Line Items -->
    <table>
      <thead>
        <tr>
          <th style="width: 50px;"># / م</th>
          <th>Description / الوصف</th>
          <th style="width: 80px;">Qty / الكمية</th>
          <th style="width: 100px;">Unit Price / سعر الوحدة</th>
          <th style="width: 100px;">Total / المجموع</th>
        </tr>
      </thead>
      <tbody>
        ${lineItemsHTML}
      </tbody>
    </table>

    <!-- Totals -->
    <table class="totals">
      <tr>
        <td><strong>Subtotal / المجموع الفرعي:</strong></td>
        <td style="text-align: right;">${formatCurrency(data.subtotal, data.currency)} ${data.currency}</td>
      </tr>
      ${data.discount ? `
      <tr>
        <td><strong>Discount / الخصم:</strong></td>
        <td style="text-align: right;">(${formatCurrency(data.discount, data.currency)}) ${data.currency}</td>
      </tr>
      ` : ''}
      <tr style="background: #f5f5f5;">
        <td><strong>Total / الإجمالي:</strong></td>
        <td style="text-align: right;"><strong>${formatCurrency(data.total, data.currency)} ${data.currency}</strong></td>
      </tr>
    </table>

    <!-- Payment Info -->
    ${data.bankName ? `
    <div class="footer">
      <div class="bilingual">
        <div class="en">
          <h3>Payment Details</h3>
          <p><strong>Bank:</strong> ${data.bankName.en}</p>
          ${data.bankAccountNumber ? `<p><strong>Account:</strong> ${data.bankAccountNumber}</p>` : ''}
          ${data.iban ? `<p><strong>IBAN:</strong> ${data.iban}</p>` : ''}
        </div>
        <div class="ar" dir="rtl">
          <h3>تفاصيل الدفع</h3>
          <p><strong>البنك:</strong> ${data.bankName.ar}</p>
          ${data.bankAccountNumber ? `<p><strong>رقم الحساب:</strong> ${data.bankAccountNumber}</p>` : ''}
          ${data.iban ? `<p><strong>آيبان:</strong> ${data.iban}</p>` : ''}
        </div>
      </div>
    </div>
    ` : ''}

    ${data.notes ? `
    <div style="margin-top: 20px;">
      <div class="bilingual">
        <div class="en"><strong>Notes:</strong> ${data.notes.en}</div>
        <div class="ar" dir="rtl"><strong>ملاحظات:</strong> ${data.notes.ar}</div>
      </div>
    </div>
    ` : ''}
  </div>
</body>
</html>
  `.trim();
}

// ============================================================================
// COMMERCIAL LICENSE RENEWAL WORKFLOW
// ============================================================================

export interface LicenseRenewalStep {
  id: string;
  name: BilingualText;
  description: BilingualText;
  authority: BilingualText;
  estimatedDays: number;
  requiredDocuments: BilingualText[];
  fees?: {
    amount: number;
    currency: GCCCurrencyCode;
    description: BilingualText;
  };
  isOptional?: boolean;
}

export const KuwaitLicenseRenewalWorkflow: LicenseRenewalStep[] = [
  {
    id: 'mosal-clearance',
    name: {
      en: 'MOSAL Labor Clearance',
      ar: 'براءة ذمة الشؤون'
    },
    description: {
      en: 'Obtain labor clearance certificate from Ministry of Social Affairs and Labor',
      ar: 'الحصول على شهادة براءة ذمة من وزارة الشؤون الاجتماعية والعمل'
    },
    authority: {
      en: 'Ministry of Social Affairs and Labor',
      ar: 'وزارة الشؤون الاجتماعية والعمل'
    },
    estimatedDays: 3,
    requiredDocuments: [
      { en: 'Current commercial license', ar: 'الرخصة التجارية الحالية' },
      { en: 'Civil ID of authorized signatory', ar: 'البطاقة المدنية للمفوض بالتوقيع' },
      { en: 'Company authorization letter', ar: 'تفويض من الشركة' },
    ],
    fees: {
      amount: 2,
      currency: 'KWD',
      description: { en: 'Clearance certificate fee', ar: 'رسوم شهادة براءة الذمة' }
    }
  },
  {
    id: 'municipality-renewal',
    name: {
      en: 'Municipality License Renewal',
      ar: 'تجديد رخصة البلدية'
    },
    description: {
      en: 'Renew municipality license and pay associated fees',
      ar: 'تجديد رخصة البلدية ودفع الرسوم المرتبطة'
    },
    authority: {
      en: 'Kuwait Municipality',
      ar: 'بلدية الكويت'
    },
    estimatedDays: 5,
    requiredDocuments: [
      { en: 'MOSAL clearance certificate', ar: 'شهادة براءة ذمة الشؤون' },
      { en: 'Current commercial license', ar: 'الرخصة التجارية الحالية' },
      { en: 'Lease agreement', ar: 'عقد الإيجار' },
      { en: 'Civil ID of authorized signatory', ar: 'البطاقة المدنية للمفوض بالتوقيع' },
    ],
    fees: {
      amount: 50,
      currency: 'KWD',
      description: { en: 'Municipality license fee (varies by activity)', ar: 'رسوم رخصة البلدية (تختلف حسب النشاط)' }
    }
  },
  {
    id: 'chamber-membership',
    name: {
      en: 'Chamber of Commerce Membership Renewal',
      ar: 'تجديد عضوية غرفة التجارة'
    },
    description: {
      en: 'Renew annual Chamber of Commerce membership',
      ar: 'تجديد العضوية السنوية في غرفة التجارة والصناعة'
    },
    authority: {
      en: 'Kuwait Chamber of Commerce & Industry',
      ar: 'غرفة تجارة وصناعة الكويت'
    },
    estimatedDays: 1,
    requiredDocuments: [
      { en: 'Current commercial license', ar: 'الرخصة التجارية الحالية' },
      { en: 'Civil ID of authorized signatory', ar: 'البطاقة المدنية للمفوض بالتوقيع' },
    ],
    fees: {
      amount: 75,
      currency: 'KWD',
      description: { en: 'Annual membership fee', ar: 'رسوم العضوية السنوية' }
    }
  },
  {
    id: 'moc-renewal',
    name: {
      en: 'Ministry of Commerce License Renewal',
      ar: 'تجديد رخصة وزارة التجارة'
    },
    description: {
      en: 'Final step: Renew commercial registration with Ministry of Commerce',
      ar: 'الخطوة الأخيرة: تجديد السجل التجاري في وزارة التجارة'
    },
    authority: {
      en: 'Ministry of Commerce & Industry',
      ar: 'وزارة التجارة والصناعة'
    },
    estimatedDays: 3,
    requiredDocuments: [
      { en: 'Municipality license (renewed)', ar: 'رخصة البلدية (مجددة)' },
      { en: 'Chamber of Commerce membership (renewed)', ar: 'عضوية غرفة التجارة (مجددة)' },
      { en: 'MOSAL clearance certificate', ar: 'شهادة براءة ذمة الشؤون' },
      { en: 'Civil ID of authorized signatory', ar: 'البطاقة المدنية للمفوض بالتوقيع' },
      { en: 'Company authorization letter', ar: 'تفويض من الشركة' },
    ],
    fees: {
      amount: 10,
      currency: 'KWD',
      description: { en: 'Commercial license renewal fee', ar: 'رسوم تجديد الرخصة التجارية' }
    }
  },
];

// ============================================================================
// CIVIL ID VERIFICATION WORKFLOW
// ============================================================================

export interface DocumentVerificationStep {
  id: string;
  name: BilingualText;
  description: BilingualText;
  validationType: 'format' | 'expiry' | 'authenticity' | 'api';
  isRequired: boolean;
}

export const KuwaitCivilIDVerificationWorkflow: DocumentVerificationStep[] = [
  {
    id: 'format-validation',
    name: {
      en: 'Format Validation',
      ar: 'التحقق من الصيغة'
    },
    description: {
      en: 'Verify Civil ID is 12 digits with valid century, date, and check digit',
      ar: 'التحقق من أن الرقم المدني مكون من 12 رقم بصيغة صحيحة'
    },
    validationType: 'format',
    isRequired: true,
  },
  {
    id: 'expiry-check',
    name: {
      en: 'Expiry Date Check',
      ar: 'التحقق من تاريخ الانتهاء'
    },
    description: {
      en: 'Verify Civil ID card has not expired',
      ar: 'التحقق من أن البطاقة المدنية غير منتهية الصلاحية'
    },
    validationType: 'expiry',
    isRequired: true,
  },
  {
    id: 'photo-match',
    name: {
      en: 'Photo Verification',
      ar: 'التحقق من الصورة'
    },
    description: {
      en: 'Verify photo on Civil ID matches the person',
      ar: 'التحقق من مطابقة الصورة على البطاقة المدنية'
    },
    validationType: 'authenticity',
    isRequired: true,
  },
  {
    id: 'paci-verification',
    name: {
      en: 'PACI Verification',
      ar: 'التحقق من الهيئة العامة للمعلومات المدنية'
    },
    description: {
      en: 'Verify Civil ID with PACI database (requires API integration)',
      ar: 'التحقق من الرقم المدني من قاعدة بيانات الهيئة (يتطلب ربط API)'
    },
    validationType: 'api',
    isRequired: false,
  },
];

// ============================================================================
// PACI INTEGRATION PLACEHOLDER
// ============================================================================

/**
 * PACI (Public Authority for Civil Information) Integration
 * This is a placeholder for future PACI API integration
 */
export interface PACIVerificationRequest {
  civilId: string;
  requestType: 'basic' | 'full';
  authorizationToken?: string;
}

export interface PACIVerificationResponse {
  success: boolean;
  data?: {
    civilId: string;
    nameAr: string;
    nameEn: string;
    nationality: string;
    birthDate: string;
    gender: 'M' | 'F';
    cardExpiryDate: string;
    isValid: boolean;
  };
  error?: {
    code: string;
    message: string;
    messageAr: string;
  };
}

/**
 * Placeholder function for PACI verification
 * In production, this would make an API call to PACI services
 */
export async function verifyWithPACI(
  _request: PACIVerificationRequest
): Promise<PACIVerificationResponse> {
  // TODO: Implement actual PACI API integration
  // This requires:
  // 1. PACI API credentials
  // 2. Approved government integration
  // 3. Secure API endpoint access

  return {
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'PACI integration not yet implemented. Contact administrator.',
      messageAr: 'ربط الهيئة العامة للمعلومات المدنية غير مفعل. يرجى التواصل مع المسؤول.'
    }
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate total renewal fees for Kuwait commercial license
 */
export function calculateTotalRenewalFees(): {
  total: number;
  currency: GCCCurrencyCode;
  breakdown: { name: string; amount: number }[];
} {
  const breakdown = KuwaitLicenseRenewalWorkflow
    .filter(step => step.fees)
    .map(step => ({
      name: step.name.en,
      amount: step.fees!.amount,
    }));

  const total = breakdown.reduce((sum, item) => sum + item.amount, 0);

  return {
    total,
    currency: 'KWD',
    breakdown,
  };
}

/**
 * Calculate estimated days for full license renewal
 */
export function calculateTotalRenewalDays(): number {
  return KuwaitLicenseRenewalWorkflow.reduce(
    (total, step) => total + step.estimatedDays,
    0
  );
}

/**
 * Get all required documents for license renewal
 */
export function getAllRenewalDocuments(): BilingualText[] {
  const documentSet = new Map<string, BilingualText>();

  KuwaitLicenseRenewalWorkflow.forEach(step => {
    step.requiredDocuments.forEach(doc => {
      documentSet.set(doc.en, doc);
    });
  });

  return Array.from(documentSet.values());
}
