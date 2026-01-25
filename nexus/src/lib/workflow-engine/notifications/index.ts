/**
 * Notification System Exports
 * Nexus E-commerce Workflow Engine
 */

// Types
export type {
  NotificationChannel,
  DeliveryStatusType,
  NotificationPriorityType,
  SupportedLanguage,
  TemplateCategoryType,
  NotificationTemplate,
  NotificationPreferences,
  NotificationPayload,
  DeliveryRecord,
  RateLimitConfig,
  RateLimitState,
  NotificationEvent,
  ChannelProviderConfig,
  BatchNotificationRequest,
  NotificationResult,
} from './notification-types';

// Constants
export {
  NotificationChannels,
  DeliveryStatus,
  NotificationPriority,
  SupportedLanguages,
  TemplateCategory,
} from './notification-types';

// Templates
export {
  templates,
  templateRegistry,
  getTemplate,
  getTemplatesByCategory,
  getTemplatesByChannel,
  renderTemplate,
  validateTemplateVariables,
  orderConfirmationTemplate,
  shippingNotificationTemplate,
  deliveryConfirmationTemplate,
  reviewRequestTemplate,
  abandonedCartTemplate,
  lowStockAlertTemplate,
  orderCancelledTemplate,
  paymentFailedTemplate,
  backInStockTemplate,
} from './notification-templates';

// Service
export { NotificationService, notificationService } from './notification-service';
