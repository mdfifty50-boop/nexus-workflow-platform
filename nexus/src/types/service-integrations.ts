// Service Integrations Types for Nexus Platform

// ============================================================================
// FOOD DELIVERY SERVICES
// ============================================================================

export type FoodDeliveryProvider = 'talabat' | 'carriage' | 'deliveroo' | 'uber_eats' | 'custom'

export type FoodDeliveryAuthMethod = 'oauth' | 'apiKey' | 'basic_auth' | 'none'

export interface FoodDeliveryService {
  name: FoodDeliveryProvider
  displayName: string
  apiEndpoint?: string
  authMethod: FoodDeliveryAuthMethod
  isActive: boolean
  isConfigured: boolean
  features: {
    orderTracking: boolean
    menuManagement: boolean
    riderManagement: boolean
    paymentProcessing: boolean
    analytics: boolean
  }
}

export interface FoodDeliveryOrder {
  id: string
  service: FoodDeliveryProvider
  orderNumber: string
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'on_way' | 'delivered' | 'cancelled'
  items: FoodDeliveryOrderItem[]
  totalPrice: number
  currency: string
  customer: {
    name: string
    phone: string
    address: string
  }
  driver?: {
    name: string
    phone: string
    location?: {
      latitude: number
      longitude: number
    }
  }
  createdAt: string
  updatedAt: string
  estimatedDeliveryTime?: string
}

export interface FoodDeliveryOrderItem {
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
  specialInstructions?: string
}

// ============================================================================
// TRAVEL & TOURISM SERVICES
// ============================================================================

export type TravelServiceProvider = 'expedia' | 'booking' | 'amadeus' | 'viator' | 'airbnb' | 'custom'

export type TravelServiceType = 'flights' | 'hotels' | 'tours' | 'car_rental' | 'activities'

export interface TravelService {
  name: TravelServiceProvider
  displayName: string
  serviceType: TravelServiceType[]
  apiEndpoint?: string
  authMethod: 'oauth' | 'apiKey' | 'none'
  isActive: boolean
  isConfigured: boolean
}

export interface TravelPackage {
  id: string
  service: TravelServiceProvider
  packageId: string
  name: string
  description: string
  destination: string
  duration: number // in days
  startDate: string
  endDate: string
  price: {
    agencyPrice: number
    currency: string
  }
  inclusions: string[]
  exclusions: string[]
  itinerary: TravelItineraryDay[]
  contact?: {
    agencyName: string
    agencyPhone: string
    agencyEmail: string
  }
}

export interface TravelItineraryDay {
  day: number
  title: string
  description: string
  activities: string[]
  accommodation?: string
  meals: ('breakfast' | 'lunch' | 'dinner')[]
}

// ============================================================================
// DOCUMENT ANALYSIS
// ============================================================================

export type DocumentType = 'travel_package' | 'invoice' | 'receipt' | 'contract' | 'general' | 'pdf' | 'image'

export type DocumentAnalysisProvider = 'openai' | 'google_vision' | 'aws_textract' | 'internal' | 'custom'

export interface DocumentAnalysis {
  id: string
  type: DocumentType
  provider: DocumentAnalysisProvider
  fileName: string
  uploadedAt: string
  analysisStatus: 'pending' | 'processing' | 'completed' | 'failed'
  extractedData: Record<string, any>
  confidence: number // 0-100
  rawText: string
  structuredContent: DocumentStructuredContent
  priceComparison?: PriceComparison
  warnings?: string[]
  errors?: string[]
}

export interface DocumentStructuredContent {
  title?: string
  date?: string
  amount?: number
  currency?: string
  vendor?: {
    name: string
    address?: string
    phone?: string
    email?: string
  }
  lineItems?: DocumentLineItem[]
  metadata: Record<string, any>
}

export interface DocumentLineItem {
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
  category?: string
}

export interface PriceComparison {
  agencyPrice: number
  actualPrice: number
  discount: number
  discountPercentage: number
  currency: string
  source: string
  lastUpdated: string
}

// ============================================================================
// WHATSAPP INTEGRATION
// ============================================================================

export type WhatsAppMessageType = 'text' | 'image' | 'document' | 'audio' | 'video' | 'location' | 'template'

export type WhatsAppMessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed'

export interface WhatsAppIntegration {
  id: string
  phoneNumber: string
  businessAccountId: string
  accessToken: string
  accessTokenEncrypted?: boolean
  webhookUrl: string
  isActive: boolean
  isVerified: boolean
  features: {
    sendMessages: boolean
    receiveMessages: boolean
    mediaSupport: boolean
    templateMessages: boolean
    groupMessaging: boolean
  }
  createdAt: string
  updatedAt: string
}

export interface WhatsAppMessage {
  id: string
  contactId: string
  phoneNumber: string
  messageType: WhatsAppMessageType
  content: WhatsAppMessageContent
  status: WhatsAppMessageStatus
  timestamp: string
  direction: 'inbound' | 'outbound'
  metadata?: Record<string, any>
}

export interface WhatsAppMessageContent {
  text?: string
  mediaUrl?: string
  mediaType?: 'image' | 'document' | 'audio' | 'video'
  templateName?: string
  templateParams?: Record<string, string>
  location?: {
    latitude: number
    longitude: number
    address?: string
  }
}

export interface WhatsAppTemplate {
  id: string
  name: string
  category: 'marketing' | 'notification' | 'utility' | 'authentication'
  language: string
  status: 'pending' | 'approved' | 'rejected' | 'disabled'
  variables: string[]
  exampleContent: string
  createdAt: string
}

export interface WhatsAppContact {
  id: string
  phoneNumber: string
  displayName?: string
  profilePictureUrl?: string
  lastMessageAt?: string
  isGroup: boolean
  groupName?: string
  groupMembers?: WhatsAppContact[]
}

// ============================================================================
// EMAIL INTEGRATION
// ============================================================================

export type EmailProvider = 'gmail' | 'outlook' | 'sendgrid' | 'mailgun' | 'smtp' | 'custom'

export interface EmailIntegration {
  id: string
  provider: EmailProvider
  email: string
  displayName?: string
  accessToken?: string
  refreshToken?: string
  accessTokenEncrypted?: boolean
  isActive: boolean
  isConfigured: boolean
  features: {
    sendEmails: boolean
    receiveEmails: boolean
    draftManagement: boolean
    labelManagement: boolean
    forwarding: boolean
  }
  createdAt: string
  updatedAt: string
}

export interface EmailMessage {
  id: string
  from: string
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  body: string
  bodyHtml?: string
  timestamp: string
  status: 'draft' | 'sent' | 'failed'
  attachments?: EmailAttachment[]
  labels?: string[]
  isRead: boolean
}

export interface EmailAttachment {
  filename: string
  mimeType: string
  size: number
  data?: string // base64 encoded
  url?: string
}

// ============================================================================
// WORKFLOW EXECUTION & INTEGRATION
// ============================================================================

export interface WorkflowExecutionResult {
  id: string
  workflowId: string
  success: boolean
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  service: string
  action: string
  result: any
  error?: string
  userFriendlyMessage: string
  executionTime: number // in milliseconds
  tokensUsed: number
  costUsd: number
  timestamp: string
  metadata?: Record<string, any>
}

export interface ServiceIntegrationConfig {
  serviceId: string
  serviceName: string
  provider: string
  authCredentials: {
    type: 'oauth' | 'apiKey' | 'basic_auth' | 'none'
    credentials: Record<string, string>
    isEncrypted: boolean
  }
  webhookConfiguration?: {
    url: string
    events: string[]
    isActive: boolean
  }
  retryPolicy: {
    maxRetries: number
    retryDelayMs: number
    backoffMultiplier: number
  }
  rateLimit?: {
    requestsPerSecond: number
    requestsPerDay: number
  }
  metadata: Record<string, any>
}

export interface IntegrationAction {
  id: string
  serviceId: string
  actionName: string
  actionType: 'trigger' | 'action' | 'condition'
  parameters: IntegrationParameter[]
  expectedResponse: Record<string, any>
  documentation?: string
  isActive: boolean
}

export interface IntegrationParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'date'
  required: boolean
  description?: string
  defaultValue?: any
  validation?: ParameterValidation
}

export interface ParameterValidation {
  pattern?: string
  minLength?: number
  maxLength?: number
  minValue?: number
  maxValue?: number
  allowedValues?: any[]
}

// ============================================================================
// WEBHOOK & EVENT HANDLING
// ============================================================================

export type WebhookEventType = 'order_created' | 'order_updated' | 'order_delivered' | 'message_received' | 'payment_received' | 'custom'

export interface WebhookEvent {
  id: string
  eventType: WebhookEventType
  service: string
  timestamp: string
  data: Record<string, any>
  isProcessed: boolean
  processedAt?: string
  error?: string
}

export interface WebhookSubscription {
  id: string
  service: string
  eventTypes: WebhookEventType[]
  callbackUrl: string
  headers?: Record<string, string>
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// ============================================================================
// INTEGRATION HEALTH & MONITORING
// ============================================================================

export interface IntegrationHealth {
  serviceId: string
  serviceName: string
  status: 'healthy' | 'degraded' | 'down'
  lastCheckAt: string
  responseTime: number // in milliseconds
  uptime: number // percentage
  errorRate: number // percentage
  successfulRequests: number
  failedRequests: number
  lastError?: {
    message: string
    timestamp: string
    code?: string
  }
}

export interface IntegrationLog {
  id: string
  serviceId: string
  action: string
  status: 'success' | 'failure'
  timestamp: string
  duration: number // in milliseconds
  request: Record<string, any>
  response: Record<string, any>
  error?: string
  userId: string
}

// ============================================================================
// SERVICE DISCOVERY & REGISTRY
// ============================================================================

export interface ServiceRegistry {
  services: RegisteredService[]
  lastUpdated: string
}

export interface RegisteredService {
  id: string
  name: string
  displayName: string
  provider: string
  category: 'food_delivery' | 'travel' | 'communication' | 'document' | 'other'
  icon: string
  documentation: string
  authMethods: FoodDeliveryAuthMethod[]
  features: string[]
  isActive: boolean
  isBeta: boolean
  version: string
}

// ============================================================================
// HELPER TYPES & CONSTANTS
// ============================================================================

export const SUPPORTED_SERVICES = {
  FOOD_DELIVERY: ['talabat', 'carriage', 'deliveroo', 'uber_eats'],
  TRAVEL: ['expedia', 'booking', 'amadeus', 'viator', 'airbnb'],
  COMMUNICATION: ['whatsapp', 'gmail', 'outlook', 'sendgrid'],
  DOCUMENT_ANALYSIS: ['openai', 'google_vision', 'aws_textract'],
} as const

export const AUTH_METHOD_LABELS: Record<FoodDeliveryAuthMethod, string> = {
  oauth: 'OAuth 2.0',
  apiKey: 'API Key',
  basic_auth: 'Basic Authentication',
  none: 'No Authentication',
}

export const SERVICE_CATEGORY_LABELS: Record<string, string> = {
  food_delivery: 'Food Delivery',
  travel: 'Travel & Tourism',
  communication: 'Communication',
  document: 'Document Analysis',
  other: 'Other',
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isFoodDeliveryService(service: any): service is FoodDeliveryService {
  return service && typeof service === 'object' && 'name' in service && 'authMethod' in service
}

export function isWhatsAppMessage(message: any): message is WhatsAppMessage {
  return message && typeof message === 'object' && 'phoneNumber' in message && 'content' in message
}

export function isEmailMessage(message: any): message is EmailMessage {
  return message && typeof message === 'object' && 'from' in message && 'subject' in message
}

export function isTravelPackage(pkg: any): pkg is TravelPackage {
  return pkg && typeof pkg === 'object' && 'destination' in pkg && 'itinerary' in pkg
}

export function isDocumentAnalysis(doc: any): doc is DocumentAnalysis {
  return doc && typeof doc === 'object' && 'type' in doc && 'extractedData' in doc
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

export class IntegrationError extends Error {
  public service: string
  public action: string
  public code: string
  public originalError?: any

  constructor(service: string, action: string, code: string, message: string, originalError?: any) {
    super(message)
    this.service = service
    this.action = action
    this.code = code
    this.originalError = originalError
    this.name = 'IntegrationError'
  }
}

export class AuthenticationError extends IntegrationError {
  constructor(service: string, message: string) {
    super(service, 'authenticate', 'AUTH_FAILED', message)
    this.name = 'AuthenticationError'
  }
}

export class RateLimitError extends IntegrationError {
  constructor(service: string, retryAfter?: number) {
    super(service, 'rate_limit', 'RATE_LIMIT_EXCEEDED', `Rate limit exceeded for ${service}`, { retryAfter })
    this.name = 'RateLimitError'
  }
}

export class ServiceUnavailableError extends IntegrationError {
  constructor(service: string, message?: string) {
    super(service, 'service_check', 'SERVICE_UNAVAILABLE', message || `${service} is currently unavailable`)
    this.name = 'ServiceUnavailableError'
  }
}
