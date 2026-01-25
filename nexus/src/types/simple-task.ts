/**
 * Simple Tasks Type Definitions
 *
 * Simple tasks are one-step actions that don't require complex workflows.
 * Examples: food ordering, ride requests, quick messages, reminder setting.
 */

// ============================================================================
// Simple Task Types
// ============================================================================

export type SimpleTaskType =
  | 'food-order'
  | 'ride-request'
  | 'quick-message'
  | 'reminder'
  | 'calendar-event'
  | 'note-creation'
  | 'email-quick-send'
  | 'payment-request'
  | 'quick-search'
  | 'translation'

export type SimpleTaskStatus =
  | 'pending'           // Awaiting user confirmation
  | 'confirmed'         // User confirmed, processing
  | 'executing'         // Action in progress
  | 'completed'         // Successfully completed
  | 'cancelled'         // User cancelled
  | 'failed'           // Execution failed

// ============================================================================
// Base Simple Task
// ============================================================================

export interface SimpleTaskBase {
  id: string
  type: SimpleTaskType
  status: SimpleTaskStatus
  originalInput: string
  createdAt: string
  updatedAt: string
  executedAt?: string
  completedAt?: string
  error?: string
  userId?: string
}

// ============================================================================
// Task-Specific Interfaces
// ============================================================================

export interface FoodOrderTask extends SimpleTaskBase {
  type: 'food-order'
  details: {
    restaurant: {
      id?: string
      name: string
      cuisine?: string
      rating?: number
      estimatedDeliveryTime?: string
    }
    items: Array<{
      name: string
      quantity: number
      price: number
      notes?: string
    }>
    deliveryAddress: {
      street: string
      city: string
      coordinates?: {
        latitude: number
        longitude: number
      }
    }
    totalPrice: number
    currency: string
    specialInstructions?: string
    paymentMethod?: string
  }
  confirmation?: {
    orderId?: string
    estimatedDelivery?: string
    trackingUrl?: string
  }
}

export interface RideRequestTask extends SimpleTaskBase {
  type: 'ride-request'
  details: {
    pickup: {
      address: string
      coordinates?: {
        latitude: number
        longitude: number
      }
    }
    destination: {
      address: string
      coordinates?: {
        latitude: number
        longitude: number
      }
    }
    rideType: 'economy' | 'comfort' | 'premium'
    estimatedPrice?: number
    estimatedTime?: string
    notes?: string
  }
  confirmation?: {
    rideId?: string
    driverName?: string
    vehicleInfo?: string
    eta?: string
  }
}

export interface QuickMessageTask extends SimpleTaskBase {
  type: 'quick-message'
  details: {
    recipient: {
      name?: string
      contact: string
      type: 'phone' | 'email' | 'whatsapp'
    }
    message: string
    scheduled?: string
    priority?: 'normal' | 'high' | 'urgent'
  }
  confirmation?: {
    messageId?: string
    sentAt?: string
    deliveryStatus?: string
  }
}

export interface ReminderTask extends SimpleTaskBase {
  type: 'reminder'
  details: {
    title: string
    description?: string
    scheduledFor: string
    repeatPattern?: 'once' | 'daily' | 'weekly' | 'monthly'
    notificationChannels: Array<'app' | 'email' | 'sms'>
  }
  confirmation?: {
    reminderId?: string
    nextTrigger?: string
  }
}

export interface CalendarEventTask extends SimpleTaskBase {
  type: 'calendar-event'
  details: {
    title: string
    description?: string
    startTime: string
    endTime: string
    location?: string
    attendees?: string[]
    reminder?: number // minutes before
  }
  confirmation?: {
    eventId?: string
    calendarLink?: string
  }
}

export interface NoteCreationTask extends SimpleTaskBase {
  type: 'note-creation'
  details: {
    title: string
    content: string
    tags?: string[]
    folder?: string
  }
  confirmation?: {
    noteId?: string
    noteUrl?: string
  }
}

export interface EmailQuickSendTask extends SimpleTaskBase {
  type: 'email-quick-send'
  details: {
    to: string
    subject: string
    body: string
    cc?: string[]
    attachments?: Array<{
      name: string
      url: string
    }>
  }
  confirmation?: {
    emailId?: string
    sentAt?: string
  }
}

export interface PaymentRequestTask extends SimpleTaskBase {
  type: 'payment-request'
  details: {
    amount: number
    currency: string
    recipient?: string
    description: string
    paymentMethod: string
  }
  confirmation?: {
    transactionId?: string
    status?: string
  }
}

export interface QuickSearchTask extends SimpleTaskBase {
  type: 'quick-search'
  details: {
    query: string
    searchType: 'web' | 'documents' | 'emails' | 'contacts'
    filters?: Record<string, unknown>
  }
  confirmation?: {
    resultCount?: number
    results?: unknown[]
  }
}

export interface TranslationTask extends SimpleTaskBase {
  type: 'translation'
  details: {
    text: string
    sourceLang?: string
    targetLang: string
  }
  confirmation?: {
    translatedText?: string
    detectedLang?: string
  }
}

// ============================================================================
// Union Type for All Simple Tasks
// ============================================================================

export type SimpleTask =
  | FoodOrderTask
  | RideRequestTask
  | QuickMessageTask
  | ReminderTask
  | CalendarEventTask
  | NoteCreationTask
  | EmailQuickSendTask
  | PaymentRequestTask
  | QuickSearchTask
  | TranslationTask

// ============================================================================
// User Confirmation Interface
// ============================================================================

export interface SimpleTaskConfirmation {
  taskId: string
  taskType: SimpleTaskType
  summary: {
    title: string
    description: string
    keyDetails: Array<{
      label: string
      value: string
    }>
  }
  estimatedCost?: {
    amount: number
    currency: string
  }
  estimatedTime?: string
  warnings?: string[]
  requiresAuth?: boolean
  authService?: string
}

// ============================================================================
// Parsing Result
// ============================================================================

export interface SimpleTaskParseResult {
  isSimpleTask: boolean
  taskType?: SimpleTaskType
  confidence: number
  task?: SimpleTask
  requiresClarification: boolean
  clarificationQuestions?: Array<{
    field: string
    question: string
    options?: string[]
  }>
}

// ============================================================================
// Execution Result
// ============================================================================

export interface SimpleTaskExecutionResult {
  success: boolean
  taskId: string
  status: SimpleTaskStatus
  result?: unknown
  error?: string
  userMessage: string
  tokensUsed?: number
  costUsd?: number
  executionTimeMs: number
}

// ============================================================================
// Task Template Configuration
// ============================================================================

export interface SimpleTaskTemplate {
  type: SimpleTaskType
  name: string
  description: string
  icon: string
  category: 'action' | 'communication' | 'organization' | 'information'
  requiredIntegrations: string[]
  requiredFields: string[]
  optionalFields: string[]
  examples: string[]
  estimatedTime: string
}

// ============================================================================
// Constants & Defaults
// ============================================================================

export const SIMPLE_TASK_TEMPLATES: Record<SimpleTaskType, SimpleTaskTemplate> = {
  'food-order': {
    type: 'food-order',
    name: 'Food Order',
    description: 'Order food from restaurants near you',
    icon: '🍔',
    category: 'action',
    requiredIntegrations: ['talabat', 'carriage', 'deliveroo'],
    requiredFields: ['restaurant', 'items', 'deliveryAddress'],
    optionalFields: ['specialInstructions', 'paymentMethod'],
    examples: [
      'Order a healthy meal to my home',
      'Get me pizza from the nearest restaurant',
      'Order chicken biryani for delivery',
    ],
    estimatedTime: '30-45 minutes',
  },
  'ride-request': {
    type: 'ride-request',
    name: 'Ride Request',
    description: 'Book a ride to your destination',
    icon: '🚗',
    category: 'action',
    requiredIntegrations: ['uber', 'careem', 'lyft'],
    requiredFields: ['pickup', 'destination'],
    optionalFields: ['rideType', 'notes'],
    examples: [
      'Book me a ride home',
      'Get a taxi to the airport',
      'Request an Uber to downtown',
    ],
    estimatedTime: '5-10 minutes',
  },
  'quick-message': {
    type: 'quick-message',
    name: 'Quick Message',
    description: 'Send a message via SMS, email, or WhatsApp',
    icon: '💬',
    category: 'communication',
    requiredIntegrations: ['whatsapp', 'sms', 'email'],
    requiredFields: ['recipient', 'message'],
    optionalFields: ['scheduled', 'priority'],
    examples: [
      'Text John that I\'ll be late',
      'Send an email to the team',
      'WhatsApp mom happy birthday',
    ],
    estimatedTime: 'Instant',
  },
  'reminder': {
    type: 'reminder',
    name: 'Reminder',
    description: 'Set a reminder for later',
    icon: '⏰',
    category: 'organization',
    requiredIntegrations: [],
    requiredFields: ['title', 'scheduledFor'],
    optionalFields: ['description', 'repeatPattern'],
    examples: [
      'Remind me to call Sarah tomorrow at 3pm',
      'Set a daily reminder to drink water',
      'Remind me about the meeting in 30 minutes',
    ],
    estimatedTime: 'Instant',
  },
  'calendar-event': {
    type: 'calendar-event',
    name: 'Calendar Event',
    description: 'Add an event to your calendar',
    icon: '📅',
    category: 'organization',
    requiredIntegrations: ['google_calendar', 'outlook'],
    requiredFields: ['title', 'startTime', 'endTime'],
    optionalFields: ['location', 'attendees', 'reminder'],
    examples: [
      'Add team meeting tomorrow at 10am',
      'Schedule lunch with Alex next Friday',
      'Create a calendar event for the conference',
    ],
    estimatedTime: 'Instant',
  },
  'note-creation': {
    type: 'note-creation',
    name: 'Quick Note',
    description: 'Create a note or memo',
    icon: '📝',
    category: 'organization',
    requiredIntegrations: [],
    requiredFields: ['title', 'content'],
    optionalFields: ['tags', 'folder'],
    examples: [
      'Note: meeting highlights from today',
      'Create a grocery list note',
      'Save this idea for later',
    ],
    estimatedTime: 'Instant',
  },
  'email-quick-send': {
    type: 'email-quick-send',
    name: 'Quick Email',
    description: 'Send an email quickly',
    icon: '✉️',
    category: 'communication',
    requiredIntegrations: ['gmail', 'outlook', 'sendgrid'],
    requiredFields: ['to', 'subject', 'body'],
    optionalFields: ['cc', 'attachments'],
    examples: [
      'Email the report to my boss',
      'Send a thank you email to the team',
      'Quick email to confirm the appointment',
    ],
    estimatedTime: 'Instant',
  },
  'payment-request': {
    type: 'payment-request',
    name: 'Payment Request',
    description: 'Request or send a payment',
    icon: '💳',
    category: 'action',
    requiredIntegrations: ['stripe', 'paypal'],
    requiredFields: ['amount', 'currency', 'description', 'paymentMethod'],
    optionalFields: ['recipient'],
    examples: [
      'Send $50 to John for dinner',
      'Request payment for the invoice',
      'Pay my utility bill',
    ],
    estimatedTime: '1-2 minutes',
  },
  'quick-search': {
    type: 'quick-search',
    name: 'Quick Search',
    description: 'Search for information quickly',
    icon: '🔍',
    category: 'information',
    requiredIntegrations: [],
    requiredFields: ['query', 'searchType'],
    optionalFields: ['filters'],
    examples: [
      'Search my emails for the contract',
      'Find documents about the project',
      'Look up contact info for Sarah',
    ],
    estimatedTime: 'Instant',
  },
  'translation': {
    type: 'translation',
    name: 'Translation',
    description: 'Translate text to another language',
    icon: '🌐',
    category: 'information',
    requiredIntegrations: [],
    requiredFields: ['text', 'targetLang'],
    optionalFields: ['sourceLang'],
    examples: [
      'Translate this to Spanish',
      'What does this mean in French?',
      'Convert this text to Arabic',
    ],
    estimatedTime: 'Instant',
  },
}

// ============================================================================
// Type Guards
// ============================================================================

export function isFoodOrderTask(task: SimpleTask): task is FoodOrderTask {
  return task.type === 'food-order'
}

export function isRideRequestTask(task: SimpleTask): task is RideRequestTask {
  return task.type === 'ride-request'
}

export function isQuickMessageTask(task: SimpleTask): task is QuickMessageTask {
  return task.type === 'quick-message'
}

export function isReminderTask(task: SimpleTask): task is ReminderTask {
  return task.type === 'reminder'
}

export function isCalendarEventTask(task: SimpleTask): task is CalendarEventTask {
  return task.type === 'calendar-event'
}
