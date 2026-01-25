/**
 * E-commerce Notification Templates
 * Multilingual support for English and Arabic
 */

import type { NotificationTemplate, SupportedLanguage } from './notification-types';
import { NotificationChannels, TemplateCategory, SupportedLanguages } from './notification-types';

/**
 * Template variable placeholders:
 * {{customerName}} - Customer's name
 * {{orderNumber}} - Order ID/number
 * {{orderTotal}} - Total order amount
 * {{currency}} - Currency symbol/code
 * {{trackingNumber}} - Shipping tracking number
 * {{trackingUrl}} - URL to track shipment
 * {{deliveryDate}} - Expected/actual delivery date
 * {{productName}} - Product name
 * {{productImage}} - Product image URL
 * {{cartUrl}} - URL to abandoned cart
 * {{reviewUrl}} - URL to leave a review
 * {{stockQuantity}} - Remaining stock count
 * {{storeName}} - Store/brand name
 */

// Order Confirmation Template
export const orderConfirmationTemplate: NotificationTemplate = {
  id: 'order-confirmation',
  name: 'Order Confirmation',
  category: TemplateCategory.ORDER,
  channels: [NotificationChannels.EMAIL, NotificationChannels.SMS, NotificationChannels.WHATSAPP],
  subject: {
    [SupportedLanguages.EN]: 'Order Confirmed - #{{orderNumber}}',
    [SupportedLanguages.AR]: 'تم تأكيد الطلب - #{{orderNumber}}',
  },
  body: {
    [SupportedLanguages.EN]: `Dear {{customerName}},

Thank you for your order! We're excited to confirm that your order #{{orderNumber}} has been received and is being processed.

Order Summary:
- Order Number: {{orderNumber}}
- Total: {{currency}}{{orderTotal}}

We'll send you another notification when your order ships.

Thank you for shopping with {{storeName}}!`,
    [SupportedLanguages.AR]: `عزيزي {{customerName}}،

شكراً لطلبك! يسعدنا أن نؤكد استلام طلبك رقم #{{orderNumber}} وجاري معالجته.

ملخص الطلب:
- رقم الطلب: {{orderNumber}}
- المجموع: {{orderTotal}} {{currency}}

سنرسل لك إشعاراً آخر عند شحن طلبك.

شكراً لتسوقك مع {{storeName}}!`,
  },
  variables: ['customerName', 'orderNumber', 'orderTotal', 'currency', 'storeName'],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  isActive: true,
};

// Shipping Notification Template
export const shippingNotificationTemplate: NotificationTemplate = {
  id: 'shipping-notification',
  name: 'Shipping Notification',
  category: TemplateCategory.SHIPPING,
  channels: [NotificationChannels.EMAIL, NotificationChannels.SMS, NotificationChannels.PUSH, NotificationChannels.WHATSAPP],
  subject: {
    [SupportedLanguages.EN]: 'Your Order Has Shipped - #{{orderNumber}}',
    [SupportedLanguages.AR]: 'تم شحن طلبك - #{{orderNumber}}',
  },
  body: {
    [SupportedLanguages.EN]: `Great news, {{customerName}}!

Your order #{{orderNumber}} is on its way! Here are your tracking details:

Tracking Number: {{trackingNumber}}
Expected Delivery: {{deliveryDate}}

Track your package: {{trackingUrl}}

Thank you for shopping with {{storeName}}!`,
    [SupportedLanguages.AR]: `أخبار رائعة، {{customerName}}!

طلبك رقم #{{orderNumber}} في الطريق إليك! إليك تفاصيل التتبع:

رقم التتبع: {{trackingNumber}}
موعد التسليم المتوقع: {{deliveryDate}}

تتبع طردك: {{trackingUrl}}

شكراً لتسوقك مع {{storeName}}!`,
  },
  variables: ['customerName', 'orderNumber', 'trackingNumber', 'deliveryDate', 'trackingUrl', 'storeName'],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  isActive: true,
};

// Delivery Confirmation Template
export const deliveryConfirmationTemplate: NotificationTemplate = {
  id: 'delivery-confirmation',
  name: 'Delivery Confirmation',
  category: TemplateCategory.SHIPPING,
  channels: [NotificationChannels.EMAIL, NotificationChannels.SMS, NotificationChannels.PUSH, NotificationChannels.WHATSAPP],
  subject: {
    [SupportedLanguages.EN]: 'Your Order Has Been Delivered - #{{orderNumber}}',
    [SupportedLanguages.AR]: 'تم تسليم طلبك - #{{orderNumber}}',
  },
  body: {
    [SupportedLanguages.EN]: `Hello {{customerName}},

Your order #{{orderNumber}} has been delivered!

We hope you love your purchase. If you have any questions or concerns, please don't hesitate to contact us.

We'd love to hear your feedback! Leave a review: {{reviewUrl}}

Thank you for choosing {{storeName}}!`,
    [SupportedLanguages.AR]: `مرحباً {{customerName}}،

تم تسليم طلبك رقم #{{orderNumber}}!

نأمل أن تحب مشترياتك. إذا كان لديك أي أسئلة أو استفسارات، لا تتردد في التواصل معنا.

نود سماع رأيك! اترك تقييماً: {{reviewUrl}}

شكراً لاختيارك {{storeName}}!`,
  },
  variables: ['customerName', 'orderNumber', 'reviewUrl', 'storeName'],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  isActive: true,
};

// Review Request Template
export const reviewRequestTemplate: NotificationTemplate = {
  id: 'review-request',
  name: 'Review Request',
  category: TemplateCategory.MARKETING,
  channels: [NotificationChannels.EMAIL, NotificationChannels.PUSH],
  subject: {
    [SupportedLanguages.EN]: 'How was your purchase? Share your experience!',
    [SupportedLanguages.AR]: 'كيف كانت تجربة الشراء؟ شاركنا رأيك!',
  },
  body: {
    [SupportedLanguages.EN]: `Hi {{customerName}},

We hope you're enjoying your {{productName}}!

Your feedback helps other shoppers make informed decisions and helps us improve our products and services.

It only takes a minute to leave a review: {{reviewUrl}}

Thank you for being a valued {{storeName}} customer!`,
    [SupportedLanguages.AR]: `مرحباً {{customerName}}،

نأمل أنك تستمتع بـ {{productName}}!

رأيك يساعد المتسوقين الآخرين على اتخاذ قرارات مستنيرة ويساعدنا على تحسين منتجاتنا وخدماتنا.

يستغرق ترك تقييم دقيقة واحدة فقط: {{reviewUrl}}

شكراً لكونك عميلاً مميزاً في {{storeName}}!`,
  },
  variables: ['customerName', 'productName', 'reviewUrl', 'storeName'],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  isActive: true,
};

// Abandoned Cart Reminder Template
export const abandonedCartTemplate: NotificationTemplate = {
  id: 'abandoned-cart',
  name: 'Abandoned Cart Reminder',
  category: TemplateCategory.MARKETING,
  channels: [NotificationChannels.EMAIL, NotificationChannels.PUSH, NotificationChannels.WHATSAPP],
  subject: {
    [SupportedLanguages.EN]: 'You left something behind! Complete your purchase',
    [SupportedLanguages.AR]: 'تركت شيئاً خلفك! أكمل عملية الشراء',
  },
  body: {
    [SupportedLanguages.EN]: `Hey {{customerName}},

We noticed you left some great items in your cart! Don't miss out on {{productName}}.

Your cart is saved and waiting for you: {{cartUrl}}

Need help? Our customer support team is here for you.

See you soon,
The {{storeName}} Team`,
    [SupportedLanguages.AR]: `مرحباً {{customerName}}،

لاحظنا أنك تركت بعض المنتجات الرائعة في سلة التسوق! لا تفوت {{productName}}.

سلة التسوق محفوظة وبانتظارك: {{cartUrl}}

تحتاج مساعدة؟ فريق خدمة العملاء لدينا هنا لمساعدتك.

نراك قريباً،
فريق {{storeName}}`,
  },
  variables: ['customerName', 'productName', 'cartUrl', 'storeName'],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  isActive: true,
};

// Low Stock Alert Template (for admins/merchants)
export const lowStockAlertTemplate: NotificationTemplate = {
  id: 'low-stock-alert',
  name: 'Low Stock Alert',
  category: TemplateCategory.ALERT,
  channels: [NotificationChannels.EMAIL, NotificationChannels.SLACK, NotificationChannels.PUSH],
  subject: {
    [SupportedLanguages.EN]: '⚠️ Low Stock Alert: {{productName}}',
    [SupportedLanguages.AR]: '⚠️ تنبيه انخفاض المخزون: {{productName}}',
  },
  body: {
    [SupportedLanguages.EN]: `Low Stock Warning

Product: {{productName}}
Current Stock: {{stockQuantity}} units

This product is running low on inventory. Consider restocking soon to avoid stockouts.

Manage Inventory: {{inventoryUrl}}`,
    [SupportedLanguages.AR]: `تحذير انخفاض المخزون

المنتج: {{productName}}
المخزون الحالي: {{stockQuantity}} وحدة

هذا المنتج على وشك النفاد. يرجى النظر في إعادة التخزين قريباً لتجنب نفاد المخزون.

إدارة المخزون: {{inventoryUrl}}`,
  },
  variables: ['productName', 'stockQuantity', 'inventoryUrl'],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  isActive: true,
};

// Order Cancelled Template
export const orderCancelledTemplate: NotificationTemplate = {
  id: 'order-cancelled',
  name: 'Order Cancelled',
  category: TemplateCategory.ORDER,
  channels: [NotificationChannels.EMAIL, NotificationChannels.SMS],
  subject: {
    [SupportedLanguages.EN]: 'Order Cancelled - #{{orderNumber}}',
    [SupportedLanguages.AR]: 'تم إلغاء الطلب - #{{orderNumber}}',
  },
  body: {
    [SupportedLanguages.EN]: `Dear {{customerName}},

Your order #{{orderNumber}} has been cancelled as requested.

If you paid for this order, a refund of {{currency}}{{orderTotal}} will be processed within 5-7 business days.

If you have any questions, please contact our support team.

{{storeName}}`,
    [SupportedLanguages.AR]: `عزيزي {{customerName}}،

تم إلغاء طلبك رقم #{{orderNumber}} كما طلبت.

إذا كنت قد دفعت لهذا الطلب، سيتم معالجة استرداد مبلغ {{orderTotal}} {{currency}} خلال 5-7 أيام عمل.

إذا كان لديك أي أسئلة، يرجى التواصل مع فريق الدعم لدينا.

{{storeName}}`,
  },
  variables: ['customerName', 'orderNumber', 'orderTotal', 'currency', 'storeName'],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  isActive: true,
};

// Payment Failed Template
export const paymentFailedTemplate: NotificationTemplate = {
  id: 'payment-failed',
  name: 'Payment Failed',
  category: TemplateCategory.TRANSACTIONAL,
  channels: [NotificationChannels.EMAIL, NotificationChannels.SMS],
  subject: {
    [SupportedLanguages.EN]: 'Payment Failed for Order #{{orderNumber}}',
    [SupportedLanguages.AR]: 'فشل الدفع للطلب #{{orderNumber}}',
  },
  body: {
    [SupportedLanguages.EN]: `Dear {{customerName}},

Unfortunately, we were unable to process your payment for order #{{orderNumber}}.

Please update your payment method and try again: {{paymentUrl}}

If you continue to experience issues, please contact our support team.

{{storeName}}`,
    [SupportedLanguages.AR]: `عزيزي {{customerName}}،

للأسف، لم نتمكن من معالجة دفعتك للطلب #{{orderNumber}}.

يرجى تحديث طريقة الدفع والمحاولة مرة أخرى: {{paymentUrl}}

إذا استمرت المشكلة، يرجى التواصل مع فريق الدعم لدينا.

{{storeName}}`,
  },
  variables: ['customerName', 'orderNumber', 'paymentUrl', 'storeName'],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  isActive: true,
};

// Back in Stock Template
export const backInStockTemplate: NotificationTemplate = {
  id: 'back-in-stock',
  name: 'Back in Stock',
  category: TemplateCategory.MARKETING,
  channels: [NotificationChannels.EMAIL, NotificationChannels.PUSH, NotificationChannels.SMS],
  subject: {
    [SupportedLanguages.EN]: '{{productName}} is Back in Stock!',
    [SupportedLanguages.AR]: '{{productName}} عاد للمخزون!',
  },
  body: {
    [SupportedLanguages.EN]: `Great news, {{customerName}}!

{{productName}} that you were waiting for is back in stock!

Get it before it sells out again: {{productUrl}}

{{storeName}}`,
    [SupportedLanguages.AR]: `أخبار رائعة، {{customerName}}!

{{productName}} الذي كنت تنتظره عاد للمخزون!

احصل عليه قبل نفاده مرة أخرى: {{productUrl}}

{{storeName}}`,
  },
  variables: ['customerName', 'productName', 'productUrl', 'storeName'],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  isActive: true,
};

/**
 * All available templates
 */
export const templates: NotificationTemplate[] = [
  orderConfirmationTemplate,
  shippingNotificationTemplate,
  deliveryConfirmationTemplate,
  reviewRequestTemplate,
  abandonedCartTemplate,
  lowStockAlertTemplate,
  orderCancelledTemplate,
  paymentFailedTemplate,
  backInStockTemplate,
];

/**
 * Template registry for quick lookup
 */
export const templateRegistry = new Map<string, NotificationTemplate>(
  templates.map((template) => [template.id, template])
);

/**
 * Get template by ID
 */
export function getTemplate(templateId: string): NotificationTemplate | undefined {
  return templateRegistry.get(templateId);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): NotificationTemplate[] {
  return templates.filter((template) => template.category === category);
}

/**
 * Get templates supporting a specific channel
 */
export function getTemplatesByChannel(channel: string): NotificationTemplate[] {
  return templates.filter((template) => template.channels.includes(channel as any));
}

/**
 * Render template with variables
 */
export function renderTemplate(
  template: NotificationTemplate,
  language: SupportedLanguage,
  variables: Record<string, string | number | boolean>
): { subject: string; body: string } {
  let subject = template.subject[language] || template.subject[SupportedLanguages.EN];
  let body = template.body[language] || template.body[SupportedLanguages.EN];

  // Replace all variables
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    subject = subject.replace(placeholder, String(value));
    body = body.replace(placeholder, String(value));
  }

  return { subject, body };
}

/**
 * Validate that all required variables are provided
 */
export function validateTemplateVariables(
  template: NotificationTemplate,
  variables: Record<string, string | number | boolean>
): { valid: boolean; missing: string[] } {
  const missing = template.variables.filter((v) => !(v in variables));
  return {
    valid: missing.length === 0,
    missing,
  };
}
