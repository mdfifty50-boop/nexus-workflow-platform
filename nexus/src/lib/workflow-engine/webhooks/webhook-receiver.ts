/**
 * Webhook Receiver - 24/7 Event Listener Infrastructure
 * Loop 18 of Intelligence Architecture Implementation
 *
 * This module handles incoming webhooks from external systems (CRM, HRMS, etc.)
 * and routes them to the appropriate context triggers for automated workflow execution.
 */

// Generate UUID without external dependency
function generateId(): string {
  return 'xxxx-xxxx-xxxx-xxxx'.replace(/x/g, () =>
    Math.floor(Math.random() * 16).toString(16)
  );
}

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Supported webhook source systems
 */
export type WebhookSource =
  | 'salesforce'
  | 'hubspot'
  | 'pipedrive'
  | 'zoho_crm'
  | 'microsoft_dynamics'
  | 'freshsales'
  | 'bamboohr'
  | 'workday'
  | 'personio'
  | 'xero'
  | 'quickbooks'
  | 'sap'
  | 'odoo'
  | 'slack'
  | 'microsoft_teams'
  | 'google_workspace'
  | 'custom'
  | 'composio'
  | 'rube';

/**
 * Webhook event categories
 */
export type WebhookEventCategory =
  | 'crm'
  | 'hrms'
  | 'finance'
  | 'operations'
  | 'communication'
  | 'project_management'
  | 'marketing'
  | 'customer_service';

/**
 * Common CRM event types
 */
export type CRMEventType =
  | 'deal_created'
  | 'deal_updated'
  | 'deal_won'
  | 'deal_lost'
  | 'deal_stage_changed'
  | 'contact_created'
  | 'contact_updated'
  | 'lead_created'
  | 'lead_qualified'
  | 'lead_converted'
  | 'opportunity_created'
  | 'task_completed'
  | 'meeting_scheduled'
  | 'email_opened'
  | 'email_clicked';

/**
 * Common HR event types
 */
export type HREventType =
  | 'employee_hired'
  | 'employee_onboarding_started'
  | 'employee_probation_ended'
  | 'employee_promoted'
  | 'employee_transferred'
  | 'employee_resigned'
  | 'employee_terminated'
  | 'leave_requested'
  | 'leave_approved'
  | 'performance_review_due'
  | 'training_completed'
  | 'contract_expiring';

/**
 * Common Finance event types
 */
export type FinanceEventType =
  | 'invoice_created'
  | 'invoice_sent'
  | 'invoice_paid'
  | 'invoice_overdue'
  | 'payment_received'
  | 'expense_submitted'
  | 'expense_approved'
  | 'budget_exceeded'
  | 'revenue_milestone'
  | 'cash_flow_alert';

/**
 * All event types union
 */
export type WebhookEventType = CRMEventType | HREventType | FinanceEventType | string;

/**
 * Webhook payload structure
 */
export interface WebhookPayload {
  /** Unique event identifier from source system */
  eventId?: string;
  /** Event type from source system */
  eventType: WebhookEventType;
  /** Timestamp of event occurrence */
  timestamp: string | Date;
  /** The entity that was affected */
  entity: {
    type: string;
    id: string;
    name?: string;
    [key: string]: unknown;
  };
  /** Previous state (for update events) */
  previousState?: Record<string, unknown>;
  /** Current/new state */
  currentState: Record<string, unknown>;
  /** User who triggered the event */
  triggeredBy?: {
    userId?: string;
    userName?: string;
    email?: string;
  };
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Incoming webhook request
 */
export interface IncomingWebhook {
  /** Source system */
  source: WebhookSource;
  /** Event category */
  category: WebhookEventCategory;
  /** Raw payload from source */
  payload: WebhookPayload;
  /** Authentication/verification data */
  auth?: {
    signature?: string;
    apiKey?: string;
    token?: string;
  };
  /** Request headers for verification */
  headers?: Record<string, string>;
}

/**
 * Processed webhook event ready for queue
 */
export interface ProcessedWebhookEvent {
  /** Unique identifier for this event */
  id: string;
  /** Source system */
  source: WebhookSource;
  /** Event category */
  category: WebhookEventCategory;
  /** Normalized event type */
  eventType: string;
  /** Normalized entity type for trigger matching */
  entityType: string;
  /** Entity identifier */
  entityId: string;
  /** Normalized payload */
  normalizedPayload: Record<string, unknown>;
  /** Original raw payload */
  rawPayload: WebhookPayload;
  /** When the event was received */
  receivedAt: Date;
  /** When the original event occurred */
  occurredAt: Date;
  /** Processing status */
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
  /** Number of processing attempts */
  attempts: number;
  /** Last error if any */
  lastError?: string;
  /** Tenant/organization ID for multi-tenant */
  tenantId?: string;
  /** Priority level */
  priority: 'immediate' | 'high' | 'normal' | 'low';
  /** Matched trigger IDs */
  matchedTriggers?: string[];
  /** Workflows executed */
  executedWorkflows?: string[];
}

/**
 * Webhook source configuration
 */
export interface WebhookSourceConfig {
  /** Source identifier */
  source: WebhookSource;
  /** Display name */
  displayName: string;
  /** Whether this source is enabled */
  enabled: boolean;
  /** Authentication method */
  authMethod: 'signature' | 'api_key' | 'bearer_token' | 'basic' | 'none';
  /** Secret for signature verification */
  secret?: string;
  /** API key for authentication */
  apiKey?: string;
  /** Signature header name */
  signatureHeader?: string;
  /** Signature algorithm */
  signatureAlgorithm?: 'sha256' | 'sha1' | 'md5';
  /** Event type mapping from source format to normalized format */
  eventTypeMapping: Record<string, string>;
  /** Entity type mapping */
  entityTypeMapping: Record<string, string>;
  /** Field mapping for payload normalization */
  fieldMapping: Record<string, string>;
  /** Rate limits */
  rateLimit?: {
    maxPerMinute: number;
    maxPerHour: number;
  };
}

/**
 * Webhook receiver configuration
 */
export interface WebhookReceiverConfig {
  /** Whether the receiver is enabled */
  enabled: boolean;
  /** Configured sources */
  sources: WebhookSourceConfig[];
  /** Default tenant ID */
  defaultTenantId?: string;
  /** Whether to log raw payloads */
  logRawPayloads: boolean;
  /** Maximum payload size in bytes */
  maxPayloadSize: number;
  /** Whether to validate signatures strictly */
  strictSignatureValidation: boolean;
  /** Retry configuration */
  retry: {
    maxAttempts: number;
    backoffMs: number;
    maxBackoffMs: number;
  };
}

/**
 * Webhook validation result
 */
export interface WebhookValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

/**
 * Default source configurations for popular integrations
 */
export const DEFAULT_SOURCE_CONFIGS: Record<WebhookSource, Partial<WebhookSourceConfig>> = {
  salesforce: {
    displayName: 'Salesforce',
    authMethod: 'signature',
    signatureHeader: 'X-Salesforce-Signature',
    signatureAlgorithm: 'sha256',
    eventTypeMapping: {
      'Opportunity.Won': 'deal_won',
      'Opportunity.Lost': 'deal_lost',
      'Opportunity.Created': 'deal_created',
      'Lead.Created': 'lead_created',
      'Lead.Converted': 'lead_converted',
      'Contact.Created': 'contact_created',
      'Task.Completed': 'task_completed',
    },
    entityTypeMapping: {
      'Opportunity': 'deal',
      'Lead': 'lead',
      'Contact': 'contact',
      'Account': 'company',
      'Task': 'task',
    },
    fieldMapping: {
      'Id': 'id',
      'Name': 'name',
      'Amount': 'value',
      'StageName': 'stage',
      'OwnerId': 'ownerId',
      'CreatedDate': 'createdAt',
    },
  },
  hubspot: {
    displayName: 'HubSpot',
    authMethod: 'signature',
    signatureHeader: 'X-HubSpot-Signature-v3',
    signatureAlgorithm: 'sha256',
    eventTypeMapping: {
      'deal.propertyChange': 'deal_updated',
      'deal.creation': 'deal_created',
      'deal.deletion': 'deal_lost',
      'contact.creation': 'contact_created',
      'contact.propertyChange': 'contact_updated',
    },
    entityTypeMapping: {
      'deal': 'deal',
      'contact': 'contact',
      'company': 'company',
      'ticket': 'ticket',
    },
    fieldMapping: {
      'dealId': 'id',
      'dealname': 'name',
      'amount': 'value',
      'dealstage': 'stage',
      'hubspot_owner_id': 'ownerId',
    },
  },
  pipedrive: {
    displayName: 'Pipedrive',
    authMethod: 'basic',
    eventTypeMapping: {
      'added.deal': 'deal_created',
      'updated.deal': 'deal_updated',
      'deleted.deal': 'deal_lost',
      'added.person': 'contact_created',
      'updated.person': 'contact_updated',
    },
    entityTypeMapping: {
      'deal': 'deal',
      'person': 'contact',
      'organization': 'company',
      'activity': 'task',
    },
    fieldMapping: {
      'id': 'id',
      'title': 'name',
      'value': 'value',
      'stage_id': 'stage',
      'user_id': 'ownerId',
    },
  },
  zoho_crm: {
    displayName: 'Zoho CRM',
    authMethod: 'api_key',
    eventTypeMapping: {
      'Deals.create': 'deal_created',
      'Deals.edit': 'deal_updated',
      'Potentials.Won': 'deal_won',
      'Leads.create': 'lead_created',
      'Contacts.create': 'contact_created',
    },
    entityTypeMapping: {
      'Deals': 'deal',
      'Potentials': 'deal',
      'Leads': 'lead',
      'Contacts': 'contact',
      'Accounts': 'company',
    },
    fieldMapping: {
      'id': 'id',
      'Deal_Name': 'name',
      'Amount': 'value',
      'Stage': 'stage',
      'Owner': 'ownerId',
    },
  },
  microsoft_dynamics: {
    displayName: 'Microsoft Dynamics 365',
    authMethod: 'bearer_token',
    eventTypeMapping: {
      'Create.opportunity': 'deal_created',
      'Update.opportunity': 'deal_updated',
      'Won.opportunity': 'deal_won',
      'Create.lead': 'lead_created',
      'Create.contact': 'contact_created',
    },
    entityTypeMapping: {
      'opportunity': 'deal',
      'lead': 'lead',
      'contact': 'contact',
      'account': 'company',
    },
    fieldMapping: {
      'opportunityid': 'id',
      'name': 'name',
      'estimatedvalue': 'value',
      'salesstagecode': 'stage',
      'ownerid': 'ownerId',
    },
  },
  freshsales: {
    displayName: 'Freshsales',
    authMethod: 'api_key',
    eventTypeMapping: {
      'deal.create': 'deal_created',
      'deal.update': 'deal_updated',
      'deal.won': 'deal_won',
      'deal.lost': 'deal_lost',
      'lead.create': 'lead_created',
      'contact.create': 'contact_created',
    },
    entityTypeMapping: {
      'deal': 'deal',
      'lead': 'lead',
      'contact': 'contact',
      'account': 'company',
    },
    fieldMapping: {
      'id': 'id',
      'name': 'name',
      'amount': 'value',
      'deal_stage_id': 'stage',
      'owner_id': 'ownerId',
    },
  },
  bamboohr: {
    displayName: 'BambooHR',
    authMethod: 'api_key',
    eventTypeMapping: {
      'employee.hired': 'employee_hired',
      'employee.updated': 'employee_onboarding_started',
      'employee.terminated': 'employee_terminated',
      'timeoff.requested': 'leave_requested',
      'timeoff.approved': 'leave_approved',
    },
    entityTypeMapping: {
      'employee': 'employee',
      'timeoff': 'leave_request',
      'job': 'position',
    },
    fieldMapping: {
      'id': 'id',
      'displayName': 'name',
      'workEmail': 'email',
      'department': 'department',
      'hireDate': 'startDate',
    },
  },
  workday: {
    displayName: 'Workday',
    authMethod: 'bearer_token',
    eventTypeMapping: {
      'Worker_Hire': 'employee_hired',
      'Worker_Termination': 'employee_terminated',
      'Worker_Promotion': 'employee_promoted',
      'Worker_Transfer': 'employee_transferred',
      'Leave_Request': 'leave_requested',
    },
    entityTypeMapping: {
      'Worker': 'employee',
      'Position': 'position',
      'Organization': 'department',
    },
    fieldMapping: {
      'Worker_ID': 'id',
      'Legal_Name': 'name',
      'Email_Address': 'email',
      'Department': 'department',
      'Hire_Date': 'startDate',
    },
  },
  personio: {
    displayName: 'Personio',
    authMethod: 'api_key',
    eventTypeMapping: {
      'employee.created': 'employee_hired',
      'employee.updated': 'employee_onboarding_started',
      'employee.deleted': 'employee_terminated',
      'absence.created': 'leave_requested',
      'absence.approved': 'leave_approved',
    },
    entityTypeMapping: {
      'employee': 'employee',
      'absence': 'leave_request',
      'attendance': 'timesheet',
    },
    fieldMapping: {
      'id': 'id',
      'first_name': 'firstName',
      'last_name': 'lastName',
      'email': 'email',
      'department': 'department',
    },
  },
  xero: {
    displayName: 'Xero',
    authMethod: 'signature',
    signatureHeader: 'x-xero-signature',
    signatureAlgorithm: 'sha256',
    eventTypeMapping: {
      'INVOICE.CREATED': 'invoice_created',
      'INVOICE.UPDATED': 'invoice_sent',
      'PAYMENT.CREATED': 'payment_received',
      'INVOICE.OVERDUE': 'invoice_overdue',
    },
    entityTypeMapping: {
      'Invoice': 'invoice',
      'Payment': 'payment',
      'Contact': 'customer',
      'BankTransaction': 'transaction',
    },
    fieldMapping: {
      'InvoiceID': 'id',
      'InvoiceNumber': 'number',
      'Total': 'amount',
      'Status': 'status',
      'DueDate': 'dueDate',
    },
  },
  quickbooks: {
    displayName: 'QuickBooks',
    authMethod: 'signature',
    signatureHeader: 'intuit-signature',
    signatureAlgorithm: 'sha256',
    eventTypeMapping: {
      'Invoice.Create': 'invoice_created',
      'Invoice.Update': 'invoice_sent',
      'Payment.Create': 'payment_received',
      'Bill.Create': 'expense_submitted',
    },
    entityTypeMapping: {
      'Invoice': 'invoice',
      'Payment': 'payment',
      'Customer': 'customer',
      'Bill': 'expense',
    },
    fieldMapping: {
      'Id': 'id',
      'DocNumber': 'number',
      'TotalAmt': 'amount',
      'DueDate': 'dueDate',
    },
  },
  sap: {
    displayName: 'SAP',
    authMethod: 'bearer_token',
    eventTypeMapping: {
      'BAPI_SALESORDER_CREATEFROMDAT2': 'deal_created',
      'INVOICE_CREATE': 'invoice_created',
      'GOODS_RECEIPT': 'inventory_received',
    },
    entityTypeMapping: {
      'SalesOrder': 'deal',
      'Invoice': 'invoice',
      'Material': 'inventory',
      'Vendor': 'supplier',
    },
    fieldMapping: {
      'VBELN': 'id',
      'NETWR': 'amount',
      'WAERK': 'currency',
    },
  },
  odoo: {
    displayName: 'Odoo',
    authMethod: 'api_key',
    eventTypeMapping: {
      'crm.lead.create': 'lead_created',
      'crm.lead.won': 'deal_won',
      'sale.order.confirm': 'deal_created',
      'account.invoice.post': 'invoice_created',
    },
    entityTypeMapping: {
      'crm.lead': 'lead',
      'sale.order': 'deal',
      'account.invoice': 'invoice',
      'res.partner': 'contact',
    },
    fieldMapping: {
      'id': 'id',
      'name': 'name',
      'expected_revenue': 'value',
      'stage_id': 'stage',
      'user_id': 'ownerId',
    },
  },
  slack: {
    displayName: 'Slack',
    authMethod: 'signature',
    signatureHeader: 'X-Slack-Signature',
    signatureAlgorithm: 'sha256',
    eventTypeMapping: {
      'message': 'message_received',
      'app_mention': 'bot_mentioned',
      'reaction_added': 'reaction_added',
      'channel_created': 'channel_created',
    },
    entityTypeMapping: {
      'message': 'message',
      'channel': 'channel',
      'user': 'user',
    },
    fieldMapping: {
      'ts': 'id',
      'text': 'content',
      'user': 'userId',
      'channel': 'channelId',
    },
  },
  microsoft_teams: {
    displayName: 'Microsoft Teams',
    authMethod: 'bearer_token',
    eventTypeMapping: {
      'message': 'message_received',
      'channelCreated': 'channel_created',
      'teamMemberAdded': 'member_added',
    },
    entityTypeMapping: {
      'message': 'message',
      'channel': 'channel',
      'team': 'team',
    },
    fieldMapping: {
      'id': 'id',
      'body.content': 'content',
      'from.user.id': 'userId',
    },
  },
  google_workspace: {
    displayName: 'Google Workspace',
    authMethod: 'bearer_token',
    eventTypeMapping: {
      'calendar.event.created': 'meeting_scheduled',
      'drive.file.created': 'file_created',
      'gmail.message.received': 'email_received',
    },
    entityTypeMapping: {
      'event': 'meeting',
      'file': 'document',
      'message': 'email',
    },
    fieldMapping: {
      'id': 'id',
      'summary': 'title',
      'start.dateTime': 'startTime',
      'end.dateTime': 'endTime',
    },
  },
  custom: {
    displayName: 'Custom Integration',
    authMethod: 'api_key',
    eventTypeMapping: {},
    entityTypeMapping: {},
    fieldMapping: {},
  },
  composio: {
    displayName: 'Composio',
    authMethod: 'api_key',
    eventTypeMapping: {
      'action.executed': 'action_completed',
      'trigger.fired': 'trigger_activated',
      'connection.created': 'connection_established',
    },
    entityTypeMapping: {
      'action': 'action',
      'trigger': 'trigger',
      'connection': 'connection',
    },
    fieldMapping: {
      'id': 'id',
      'name': 'name',
      'status': 'status',
    },
  },
  rube: {
    displayName: 'Rube',
    authMethod: 'api_key',
    eventTypeMapping: {
      'recipe.executed': 'recipe_completed',
      'workflow.triggered': 'workflow_started',
    },
    entityTypeMapping: {
      'recipe': 'recipe',
      'workflow': 'workflow',
    },
    fieldMapping: {
      'recipe_id': 'id',
      'name': 'name',
      'status': 'status',
    },
  },
};

/**
 * Default receiver configuration
 */
export const DEFAULT_RECEIVER_CONFIG: WebhookReceiverConfig = {
  enabled: true,
  sources: [],
  logRawPayloads: true,
  maxPayloadSize: 10 * 1024 * 1024, // 10MB
  strictSignatureValidation: true,
  retry: {
    maxAttempts: 3,
    backoffMs: 1000,
    maxBackoffMs: 30000,
  },
};

// ============================================================================
// WEBHOOK RECEIVER CLASS
// ============================================================================

/**
 * WebhookReceiver - Main class for receiving and processing webhooks
 */
export class WebhookReceiver {
  private config: WebhookReceiverConfig;
  private sourceConfigs: Map<WebhookSource, WebhookSourceConfig>;
  private eventHandlers: Map<string, (event: ProcessedWebhookEvent) => Promise<void>>;
  private receivedEvents: ProcessedWebhookEvent[] = [];

  constructor(config: Partial<WebhookReceiverConfig> = {}) {
    this.config = { ...DEFAULT_RECEIVER_CONFIG, ...config };
    this.sourceConfigs = new Map();
    this.eventHandlers = new Map();
    this.initializeDefaultSources();
  }

  /**
   * Initialize default source configurations
   */
  private initializeDefaultSources(): void {
    Object.entries(DEFAULT_SOURCE_CONFIGS).forEach(([source, config]) => {
      const fullConfig: WebhookSourceConfig = {
        source: source as WebhookSource,
        enabled: false, // Disabled by default until configured
        ...config,
        eventTypeMapping: config.eventTypeMapping || {},
        entityTypeMapping: config.entityTypeMapping || {},
        fieldMapping: config.fieldMapping || {},
      } as WebhookSourceConfig;
      this.sourceConfigs.set(source as WebhookSource, fullConfig);
    });
  }

  /**
   * Enable a webhook source
   */
  enableSource(source: WebhookSource, config?: Partial<WebhookSourceConfig>): void {
    const existing = this.sourceConfigs.get(source);
    if (existing) {
      this.sourceConfigs.set(source, {
        ...existing,
        ...config,
        enabled: true,
      });
    }
  }

  /**
   * Disable a webhook source
   */
  disableSource(source: WebhookSource): void {
    const existing = this.sourceConfigs.get(source);
    if (existing) {
      existing.enabled = false;
    }
  }

  /**
   * Get source configuration
   */
  getSourceConfig(source: WebhookSource): WebhookSourceConfig | undefined {
    return this.sourceConfigs.get(source);
  }

  /**
   * Register an event handler
   */
  onEvent(eventType: string, handler: (event: ProcessedWebhookEvent) => Promise<void>): void {
    this.eventHandlers.set(eventType, handler);
  }

  /**
   * Register a catch-all event handler
   */
  onAnyEvent(handler: (event: ProcessedWebhookEvent) => Promise<void>): void {
    this.eventHandlers.set('*', handler);
  }

  /**
   * Validate incoming webhook
   */
  validateWebhook(webhook: IncomingWebhook): WebhookValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if source is configured
    const sourceConfig = this.sourceConfigs.get(webhook.source);
    if (!sourceConfig) {
      errors.push(`Unknown webhook source: ${webhook.source}`);
      return { valid: false, errors, warnings };
    }

    // Check if source is enabled
    if (!sourceConfig.enabled) {
      errors.push(`Webhook source not enabled: ${webhook.source}`);
      return { valid: false, errors, warnings };
    }

    // Validate payload structure
    if (!webhook.payload) {
      errors.push('Missing payload');
      return { valid: false, errors, warnings };
    }

    if (!webhook.payload.eventType) {
      errors.push('Missing eventType in payload');
    }

    if (!webhook.payload.entity) {
      errors.push('Missing entity in payload');
    } else {
      if (!webhook.payload.entity.type) {
        errors.push('Missing entity.type in payload');
      }
      if (!webhook.payload.entity.id) {
        errors.push('Missing entity.id in payload');
      }
    }

    if (!webhook.payload.currentState) {
      warnings.push('Missing currentState in payload - will use empty object');
    }

    // Validate signature if required
    if (this.config.strictSignatureValidation && sourceConfig.authMethod === 'signature') {
      if (!webhook.auth?.signature) {
        errors.push('Missing signature for signature-authenticated source');
      } else if (!this.verifySignature(webhook, sourceConfig)) {
        errors.push('Invalid signature');
      }
    }

    // Validate API key if required
    if (sourceConfig.authMethod === 'api_key' && !webhook.auth?.apiKey) {
      errors.push('Missing API key for API key-authenticated source');
    }

    // Check payload size
    const payloadSize = JSON.stringify(webhook.payload).length;
    if (payloadSize > this.config.maxPayloadSize) {
      errors.push(`Payload exceeds maximum size: ${payloadSize} > ${this.config.maxPayloadSize}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Verify webhook signature
   */
  private verifySignature(webhook: IncomingWebhook, config: WebhookSourceConfig): boolean {
    // In production, this would use crypto to verify HMAC signatures
    // For now, we'll do a simple check
    if (!config.secret) {
      console.warn(`No secret configured for ${config.source} - skipping signature verification`);
      return true;
    }

    // Placeholder for actual signature verification
    // In production: crypto.createHmac(config.signatureAlgorithm, config.secret)
    //   .update(JSON.stringify(webhook.payload))
    //   .digest('hex') === webhook.auth?.signature

    return webhook.auth?.signature !== undefined;
  }

  /**
   * Normalize event type from source-specific format
   */
  normalizeEventType(source: WebhookSource, eventType: string): string {
    const config = this.sourceConfigs.get(source);
    if (!config) return eventType;

    return config.eventTypeMapping[eventType] || eventType;
  }

  /**
   * Normalize entity type from source-specific format
   */
  normalizeEntityType(source: WebhookSource, entityType: string): string {
    const config = this.sourceConfigs.get(source);
    if (!config) return entityType;

    return config.entityTypeMapping[entityType] || entityType;
  }

  /**
   * Normalize payload fields from source-specific format
   */
  normalizePayload(source: WebhookSource, payload: Record<string, unknown>): Record<string, unknown> {
    const config = this.sourceConfigs.get(source);
    if (!config) return payload;

    const normalized: Record<string, unknown> = {};

    Object.entries(payload).forEach(([key, value]) => {
      const normalizedKey = config.fieldMapping[key] || key;
      normalized[normalizedKey] = value;
    });

    return normalized;
  }

  /**
   * Determine priority based on event type
   */
  determinePriority(eventType: string, _category: WebhookEventCategory): ProcessedWebhookEvent['priority'] {
    // High priority events
    const immediatePriority = ['deal_won', 'employee_hired', 'invoice_overdue', 'payment_received'];
    const highPriority = ['deal_created', 'lead_qualified', 'employee_resigned', 'invoice_created'];
    const lowPriority = ['email_opened', 'email_clicked', 'reaction_added'];

    if (immediatePriority.includes(eventType)) return 'immediate';
    if (highPriority.includes(eventType)) return 'high';
    if (lowPriority.includes(eventType)) return 'low';
    return 'normal';
  }

  /**
   * Process incoming webhook
   */
  async processWebhook(webhook: IncomingWebhook): Promise<ProcessedWebhookEvent> {
    // Validate webhook
    const validation = this.validateWebhook(webhook);
    if (!validation.valid) {
      throw new Error(`Webhook validation failed: ${validation.errors.join(', ')}`);
    }

    // Log warnings
    validation.warnings.forEach(warning => {
      console.warn(`Webhook warning: ${warning}`);
    });

    // Create processed event
    const event: ProcessedWebhookEvent = {
      id: generateId(),
      source: webhook.source,
      category: webhook.category,
      eventType: this.normalizeEventType(webhook.source, webhook.payload.eventType),
      entityType: this.normalizeEntityType(webhook.source, webhook.payload.entity.type),
      entityId: webhook.payload.entity.id,
      normalizedPayload: this.normalizePayload(webhook.source, webhook.payload.currentState),
      rawPayload: webhook.payload,
      receivedAt: new Date(),
      occurredAt: new Date(webhook.payload.timestamp),
      status: 'pending',
      attempts: 0,
      priority: this.determinePriority(
        this.normalizeEventType(webhook.source, webhook.payload.eventType),
        webhook.category
      ),
    };

    // Add to received events
    this.receivedEvents.push(event);

    // Log if enabled
    if (this.config.logRawPayloads) {
      console.log(`[WebhookReceiver] Received event:`, {
        id: event.id,
        source: event.source,
        eventType: event.eventType,
        entityType: event.entityType,
        priority: event.priority,
      });
    }

    // Trigger handlers
    await this.triggerHandlers(event);

    return event;
  }

  /**
   * Trigger event handlers
   */
  private async triggerHandlers(event: ProcessedWebhookEvent): Promise<void> {
    event.status = 'processing';
    event.attempts++;

    try {
      // Trigger specific handler
      const specificHandler = this.eventHandlers.get(event.eventType);
      if (specificHandler) {
        await specificHandler(event);
      }

      // Trigger catch-all handler
      const catchAllHandler = this.eventHandlers.get('*');
      if (catchAllHandler) {
        await catchAllHandler(event);
      }

      event.status = 'completed';
    } catch (error) {
      event.status = 'failed';
      event.lastError = error instanceof Error ? error.message : String(error);

      // Retry if under max attempts
      if (event.attempts < this.config.retry.maxAttempts) {
        const backoff = Math.min(
          this.config.retry.backoffMs * Math.pow(2, event.attempts - 1),
          this.config.retry.maxBackoffMs
        );
        setTimeout(() => this.triggerHandlers(event), backoff);
      }
    }
  }

  /**
   * Get all received events
   */
  getReceivedEvents(): ProcessedWebhookEvent[] {
    return [...this.receivedEvents];
  }

  /**
   * Get events by status
   */
  getEventsByStatus(status: ProcessedWebhookEvent['status']): ProcessedWebhookEvent[] {
    return this.receivedEvents.filter(e => e.status === status);
  }

  /**
   * Get events by source
   */
  getEventsBySource(source: WebhookSource): ProcessedWebhookEvent[] {
    return this.receivedEvents.filter(e => e.source === source);
  }

  /**
   * Get events by event type
   */
  getEventsByType(eventType: string): ProcessedWebhookEvent[] {
    return this.receivedEvents.filter(e => e.eventType === eventType);
  }

  /**
   * Clear processed events
   */
  clearEvents(): void {
    this.receivedEvents = [];
  }

  /**
   * Get statistics
   */
  getStats(): {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    bySource: Record<string, number>;
    byEventType: Record<string, number>;
  } {
    const bySource: Record<string, number> = {};
    const byEventType: Record<string, number> = {};

    this.receivedEvents.forEach(event => {
      bySource[event.source] = (bySource[event.source] || 0) + 1;
      byEventType[event.eventType] = (byEventType[event.eventType] || 0) + 1;
    });

    return {
      total: this.receivedEvents.length,
      pending: this.getEventsByStatus('pending').length,
      processing: this.getEventsByStatus('processing').length,
      completed: this.getEventsByStatus('completed').length,
      failed: this.getEventsByStatus('failed').length,
      bySource,
      byEventType,
    };
  }

  /**
   * Export configuration
   */
  exportConfig(): WebhookReceiverConfig {
    return {
      ...this.config,
      sources: Array.from(this.sourceConfigs.values()).filter(s => s.enabled),
    };
  }
}

// ============================================================================
// SINGLETON & FACTORY
// ============================================================================

/**
 * Create a new webhook receiver
 */
export function createWebhookReceiver(config?: Partial<WebhookReceiverConfig>): WebhookReceiver {
  return new WebhookReceiver(config);
}

/**
 * Default webhook receiver instance
 */
export const webhookReceiver = createWebhookReceiver();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Quick webhook processing
 */
export async function processWebhookQuick(
  source: WebhookSource,
  category: WebhookEventCategory,
  payload: WebhookPayload
): Promise<ProcessedWebhookEvent> {
  return webhookReceiver.processWebhook({ source, category, payload });
}

/**
 * Enable a source on the default receiver
 */
export function enableWebhookSource(source: WebhookSource, config?: Partial<WebhookSourceConfig>): void {
  webhookReceiver.enableSource(source, config);
}

/**
 * Get supported sources
 */
export function getSupportedSources(): WebhookSource[] {
  return Object.keys(DEFAULT_SOURCE_CONFIGS) as WebhookSource[];
}

/**
 * Get source display name
 */
export function getSourceDisplayName(source: WebhookSource): string {
  return DEFAULT_SOURCE_CONFIGS[source]?.displayName || source;
}
