/**
 * Shipping Provider Integration - Base Types and Interfaces
 *
 * Defines the common interface for all shipping provider integrations in Nexus.
 * Supports multi-carrier rate shopping, label generation, tracking, and address validation.
 *
 * @module shipping-provider
 */

// ============================================================================
// ADDRESS TYPES
// ============================================================================

/**
 * Standardized address format for shipping
 */
export interface ShippingAddress {
  /** Contact name */
  name: string;
  /** Company name (optional) */
  company?: string;
  /** Street address line 1 */
  street1: string;
  /** Street address line 2 (optional) */
  street2?: string;
  /** Street address line 3 (optional) */
  street3?: string;
  /** City */
  city: string;
  /** State/Province code (e.g., 'CA', 'ON') */
  state: string;
  /** Postal/ZIP code */
  postalCode: string;
  /** ISO 3166-1 alpha-2 country code (e.g., 'US', 'CA') */
  country: string;
  /** Phone number */
  phone?: string;
  /** Email address */
  email?: string;
  /** Whether this is a residential address */
  residential?: boolean;
}

/**
 * Address validation result
 */
export interface AddressValidationResult {
  /** Whether the address is valid */
  isValid: boolean;
  /** Validated/corrected address (if valid) */
  validatedAddress?: ShippingAddress;
  /** List of suggested addresses */
  suggestions?: ShippingAddress[];
  /** Validation messages */
  messages: AddressValidationMessage[];
  /** Address classification */
  classification?: {
    isResidential: boolean;
    isCommercial: boolean;
    isPOBox: boolean;
    isAPO: boolean;
  };
}

/**
 * Address validation message
 */
export interface AddressValidationMessage {
  /** Message type */
  type: 'error' | 'warning' | 'info';
  /** Message code */
  code: string;
  /** Human-readable message */
  message: string;
  /** Field this message applies to (if specific) */
  field?: keyof ShippingAddress;
}

// ============================================================================
// PARCEL TYPES
// ============================================================================

/**
 * Package/parcel dimensions and weight
 */
export interface Parcel {
  /** Length in inches (or cm if metric) */
  length: number;
  /** Width in inches (or cm if metric) */
  width: number;
  /** Height in inches (or cm if metric) */
  height: number;
  /** Weight in ounces (or grams if metric) */
  weight: number;
  /** Distance unit */
  distanceUnit?: 'in' | 'cm';
  /** Weight unit */
  weightUnit?: 'oz' | 'lb' | 'g' | 'kg';
  /** Predefined package type (carrier-specific) */
  predefinedPackage?: string;
}

/**
 * Customs declaration for international shipments
 */
export interface CustomsDeclaration {
  /** Customs items */
  items: CustomsItem[];
  /** Contents type */
  contentsType: 'merchandise' | 'gift' | 'sample' | 'documents' | 'return' | 'other';
  /** Contents description */
  contentsDescription?: string;
  /** Non-delivery option */
  nonDeliveryOption: 'return' | 'abandon';
  /** Exporter reference */
  exporterReference?: string;
  /** Importer reference */
  importerReference?: string;
  /** EORI number (EU) */
  eoriNumber?: string;
  /** Incoterm */
  incoterm?: 'DDP' | 'DDU' | 'DAP' | 'EXW' | 'FCA';
  /** Certificate number */
  certificate?: string;
  /** Invoice number */
  invoiceNumber?: string;
}

/**
 * Individual customs item
 */
export interface CustomsItem {
  /** Item description */
  description: string;
  /** Quantity */
  quantity: number;
  /** Net weight per item (ounces) */
  netWeight: number;
  /** Value per item (USD) */
  value: number;
  /** HS tariff code */
  hsCode?: string;
  /** Country of origin (ISO 2-letter code) */
  originCountry: string;
  /** SKU or product ID */
  sku?: string;
  /** Item category */
  category?: string;
}

// ============================================================================
// SHIPPING RATE TYPES
// ============================================================================

/**
 * Shipping rate request
 */
export interface RateRequest {
  /** Sender address */
  fromAddress: ShippingAddress;
  /** Recipient address */
  toAddress: ShippingAddress;
  /** Parcel(s) to ship */
  parcels: Parcel[];
  /** Ship date (default: today) */
  shipDate?: Date;
  /** Customs declaration (for international) */
  customs?: CustomsDeclaration;
  /** Carrier accounts to query (empty = all) */
  carriers?: string[];
  /** Service levels to query (empty = all) */
  serviceLevels?: string[];
  /** Insurance amount (USD) */
  insuranceAmount?: number;
  /** Require signature */
  signatureRequired?: boolean;
  /** Signature type */
  signatureType?: 'standard' | 'adult' | 'direct';
  /** Saturday delivery */
  saturdayDelivery?: boolean;
  /** Reference fields */
  reference1?: string;
  reference2?: string;
}

/**
 * Individual shipping rate
 */
export interface ShippingRate {
  /** Unique rate ID */
  rateId: string;
  /** Provider-specific rate ID */
  providerRateId: string;
  /** Carrier code (e.g., 'usps', 'ups', 'fedex') */
  carrier: string;
  /** Carrier display name */
  carrierName: string;
  /** Service level code */
  serviceLevel: string;
  /** Service level display name */
  serviceLevelName: string;
  /** Total rate amount */
  amount: number;
  /** Currency code */
  currency: string;
  /** Estimated transit days */
  transitDays?: number;
  /** Estimated delivery date */
  estimatedDeliveryDate?: Date;
  /** Whether delivery date is guaranteed */
  deliveryGuaranteed?: boolean;
  /** Rate breakdown */
  breakdown?: RateBreakdown;
  /** Additional rate attributes */
  attributes?: RateAttributes;
  /** Whether this is a return label rate */
  isReturn?: boolean;
  /** Zone */
  zone?: string;
}

/**
 * Rate cost breakdown
 */
export interface RateBreakdown {
  /** Base shipping cost */
  baseRate: number;
  /** Fuel surcharge */
  fuelSurcharge?: number;
  /** Residential surcharge */
  residentialSurcharge?: number;
  /** Delivery area surcharge */
  deliveryAreaSurcharge?: number;
  /** Signature surcharge */
  signatureSurcharge?: number;
  /** Insurance cost */
  insurance?: number;
  /** Saturday delivery surcharge */
  saturdayDelivery?: number;
  /** Other surcharges */
  otherSurcharges?: Array<{
    name: string;
    amount: number;
  }>;
}

/**
 * Additional rate attributes
 */
export interface RateAttributes {
  /** Delivery commitment */
  deliveryCommitment?: string;
  /** Whether rate includes tracking */
  trackingIncluded?: boolean;
  /** Whether rate includes insurance */
  insuranceIncluded?: boolean;
  /** Maximum insurance value */
  maxInsuranceValue?: number;
  /** Carrier service code */
  carrierServiceCode?: string;
  /** Packaging type */
  packagingType?: string;
}

// ============================================================================
// SHIPPING LABEL TYPES
// ============================================================================

/**
 * Label creation request
 */
export interface LabelRequest {
  /** Rate ID from rate shopping (optional - uses cheapest if not provided) */
  rateId?: string;
  /** Sender address */
  fromAddress: ShippingAddress;
  /** Recipient address */
  toAddress: ShippingAddress;
  /** Return address (optional - defaults to fromAddress) */
  returnAddress?: ShippingAddress;
  /** Parcel(s) to ship */
  parcels: Parcel[];
  /** Carrier code */
  carrier: string;
  /** Service level code */
  serviceLevel: string;
  /** Ship date */
  shipDate?: Date;
  /** Customs declaration (for international) */
  customs?: CustomsDeclaration;
  /** Label format */
  labelFormat?: 'pdf' | 'png' | 'zpl' | 'epl';
  /** Label size */
  labelSize?: '4x6' | '4x8' | 'letter';
  /** Insurance amount (USD) */
  insuranceAmount?: number;
  /** Signature required */
  signatureRequired?: boolean;
  /** Signature type */
  signatureType?: 'standard' | 'adult' | 'direct';
  /** Saturday delivery */
  saturdayDelivery?: boolean;
  /** Reference fields */
  reference1?: string;
  reference2?: string;
  /** Metadata */
  metadata?: Record<string, string>;
  /** Order ID for linking */
  orderId?: string;
  /** Whether to send shipment notification to recipient */
  notifyRecipient?: boolean;
}

/**
 * Created shipping label
 */
export interface ShippingLabel {
  /** Unique label ID */
  labelId: string;
  /** Provider-specific label ID */
  providerLabelId: string;
  /** Tracking number */
  trackingNumber: string;
  /** Carrier code */
  carrier: string;
  /** Carrier display name */
  carrierName: string;
  /** Service level code */
  serviceLevel: string;
  /** Service level display name */
  serviceLevelName: string;
  /** Label URL (download link) */
  labelUrl: string;
  /** Label URL expiration */
  labelUrlExpiration?: Date;
  /** Base64 encoded label (if available) */
  labelBase64?: string;
  /** Label format */
  labelFormat: 'pdf' | 'png' | 'zpl' | 'epl';
  /** Tracking URL */
  trackingUrl?: string;
  /** Label cost */
  cost: number;
  /** Currency */
  currency: string;
  /** Insurance cost (if purchased) */
  insuranceCost?: number;
  /** Ship date */
  shipDate: Date;
  /** Estimated delivery date */
  estimatedDeliveryDate?: Date;
  /** From address */
  fromAddress: ShippingAddress;
  /** To address */
  toAddress: ShippingAddress;
  /** Parcel(s) */
  parcels: Parcel[];
  /** Created timestamp */
  createdAt: Date;
  /** Label status */
  status: 'pending' | 'valid' | 'voided' | 'refunded' | 'error';
  /** Customs forms (for international) */
  customsForms?: CustomsForm[];
  /** Metadata */
  metadata?: Record<string, string>;
  /** Order ID (if linked) */
  orderId?: string;
}

/**
 * Customs form
 */
export interface CustomsForm {
  /** Form type */
  type: 'cn22' | 'cn23' | 'commercial_invoice' | 'proforma_invoice';
  /** Form URL */
  url: string;
  /** Form URL expiration */
  urlExpiration?: Date;
  /** Base64 encoded form */
  base64?: string;
}

/**
 * Label void result
 */
export interface VoidResult {
  /** Whether void was successful */
  success: boolean;
  /** Refund amount (if applicable) */
  refundAmount?: number;
  /** Refund currency */
  refundCurrency?: string;
  /** Message */
  message?: string;
  /** Void timestamp */
  voidedAt?: Date;
}

// ============================================================================
// TRACKING TYPES
// ============================================================================

/**
 * Tracking information
 */
export interface TrackingInfo {
  /** Tracking number */
  trackingNumber: string;
  /** Carrier code */
  carrier: string;
  /** Carrier display name */
  carrierName: string;
  /** Current status */
  status: TrackingStatus;
  /** Status description */
  statusDescription: string;
  /** Estimated delivery date */
  estimatedDeliveryDate?: Date;
  /** Actual delivery date (if delivered) */
  actualDeliveryDate?: Date;
  /** Tracking events */
  events: TrackingEvent[];
  /** Origin address */
  originAddress?: Partial<ShippingAddress>;
  /** Destination address */
  destinationAddress?: Partial<ShippingAddress>;
  /** Signed by (if delivered) */
  signedBy?: string;
  /** Service level */
  serviceLevel?: string;
  /** Weight */
  weight?: {
    value: number;
    unit: string;
  };
  /** Tracking URL */
  trackingUrl?: string;
  /** Last updated */
  lastUpdated: Date;
}

/**
 * Tracking status
 */
export type TrackingStatus =
  | 'unknown'
  | 'pre_transit'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'available_for_pickup'
  | 'return_to_sender'
  | 'failure'
  | 'cancelled';

/**
 * Individual tracking event
 */
export interface TrackingEvent {
  /** Event timestamp */
  timestamp: Date;
  /** Event status */
  status: TrackingStatus;
  /** Event description */
  description: string;
  /** Location */
  location?: {
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  /** Raw event code from carrier */
  eventCode?: string;
}

// ============================================================================
// WEBHOOK TYPES
// ============================================================================

/**
 * Tracking webhook event
 */
export interface TrackingWebhookEvent {
  /** Event ID */
  eventId: string;
  /** Event type */
  eventType: 'tracking.updated' | 'tracking.delivered' | 'tracking.failed';
  /** Tracking number */
  trackingNumber: string;
  /** Carrier code */
  carrier: string;
  /** Label ID (if known) */
  labelId?: string;
  /** Order ID (if linked) */
  orderId?: string;
  /** Current tracking status */
  status: TrackingStatus;
  /** Status description */
  statusDescription: string;
  /** Latest tracking event */
  latestEvent?: TrackingEvent;
  /** Full tracking info */
  trackingInfo?: TrackingInfo;
  /** Timestamp */
  timestamp: Date;
  /** Raw webhook payload */
  rawPayload?: unknown;
}

// ============================================================================
// PROVIDER INTERFACE
// ============================================================================

/**
 * Base configuration for shipping providers
 */
export interface ShippingProviderConfig {
  /** API key or token */
  apiKey: string;
  /** API secret (if required) */
  apiSecret?: string;
  /** Whether to use sandbox/test mode */
  testMode?: boolean;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Webhook secret for verification */
  webhookSecret?: string;
  /** Default label format */
  defaultLabelFormat?: 'pdf' | 'png' | 'zpl' | 'epl';
  /** Default label size */
  defaultLabelSize?: '4x6' | '4x8' | 'letter';
}

/**
 * Carrier account for multi-carrier providers
 */
export interface CarrierAccount {
  /** Account ID */
  accountId: string;
  /** Carrier code */
  carrier: string;
  /** Account nickname */
  nickname?: string;
  /** Whether account is active */
  active: boolean;
  /** Account credentials (provider-specific) */
  credentials?: Record<string, string>;
}

/**
 * Shipping provider capabilities
 */
export interface ProviderCapabilities {
  /** Supported carriers */
  carriers: string[];
  /** Supports rate shopping */
  rateComparison: boolean;
  /** Supports address validation */
  addressValidation: boolean;
  /** Supports insurance */
  insurance: boolean;
  /** Supports international shipping */
  international: boolean;
  /** Supports return labels */
  returnLabels: boolean;
  /** Supports batch label creation */
  batchLabels: boolean;
  /** Supports tracking webhooks */
  trackingWebhooks: boolean;
  /** Supports customs forms */
  customsForms: boolean;
  /** Supported label formats */
  labelFormats: Array<'pdf' | 'png' | 'zpl' | 'epl'>;
  /** Maximum parcels per shipment */
  maxParcelsPerShipment: number;
}

/**
 * Base shipping provider interface
 *
 * All shipping provider implementations must implement this interface.
 */
export interface ShippingProvider {
  /** Provider ID */
  readonly providerId: string;

  /** Provider display name */
  readonly providerName: string;

  /** Provider capabilities */
  readonly capabilities: ProviderCapabilities;

  /**
   * Initialize the provider
   */
  initialize(): Promise<void>;

  /**
   * Get shipping rates
   */
  getRates(request: RateRequest): Promise<ShippingRate[]>;

  /**
   * Create a shipping label
   */
  createLabel(request: LabelRequest): Promise<ShippingLabel>;

  /**
   * Create multiple labels (batch)
   */
  createLabels?(requests: LabelRequest[]): Promise<ShippingLabel[]>;

  /**
   * Get tracking information
   */
  track(trackingNumber: string, carrier?: string): Promise<TrackingInfo>;

  /**
   * Track multiple shipments
   */
  trackMultiple?(trackingNumbers: Array<{ trackingNumber: string; carrier?: string }>): Promise<TrackingInfo[]>;

  /**
   * Void a shipping label
   */
  voidLabel(labelId: string): Promise<VoidResult>;

  /**
   * Validate an address
   */
  validateAddress?(address: ShippingAddress): Promise<AddressValidationResult>;

  /**
   * Create a return label
   */
  createReturnLabel?(originalLabelId: string, returnAddress?: ShippingAddress): Promise<ShippingLabel>;

  /**
   * Get carrier accounts
   */
  getCarrierAccounts?(): Promise<CarrierAccount[]>;

  /**
   * Add a carrier account
   */
  addCarrierAccount?(account: Partial<CarrierAccount>): Promise<CarrierAccount>;

  /**
   * Remove a carrier account
   */
  removeCarrierAccount?(accountId: string): Promise<boolean>;

  /**
   * Register tracking webhook
   */
  registerTrackingWebhook?(url: string, events?: string[]): Promise<{ webhookId: string }>;

  /**
   * Parse incoming tracking webhook
   */
  parseTrackingWebhook?(payload: unknown, headers?: Record<string, string>): TrackingWebhookEvent | null;

  /**
   * Get label by ID
   */
  getLabel?(labelId: string): Promise<ShippingLabel | null>;

  /**
   * Get labels for an order
   */
  getLabelsForOrder?(orderId: string): Promise<ShippingLabel[]>;
}

// ============================================================================
// ERROR CLASSES
// ============================================================================

/**
 * Base shipping provider error
 */
export class ShippingProviderError extends Error {
  readonly code: string
  readonly provider: string
  readonly details?: unknown

  constructor(
    message: string,
    code: string,
    provider: string,
    details?: unknown
  ) {
    super(message);
    this.name = 'ShippingProviderError';
    this.code = code
    this.provider = provider
    this.details = details
  }
}

/**
 * Authentication error
 */
export class ShippingAuthError extends ShippingProviderError {
  constructor(provider: string, message?: string) {
    super(
      message || 'Authentication failed',
      'AUTH_ERROR',
      provider
    );
    this.name = 'ShippingAuthError';
  }
}

/**
 * Rate limit error
 */
export class ShippingRateLimitError extends ShippingProviderError {
  readonly retryAfter?: number

  constructor(
    provider: string,
    retryAfter?: number,
    message?: string
  ) {
    super(
      message || 'Rate limit exceeded',
      'RATE_LIMIT',
      provider,
      { retryAfter }
    );
    this.name = 'ShippingRateLimitError';
    this.retryAfter = retryAfter
  }
}

/**
 * Validation error
 */
export class ShippingValidationError extends ShippingProviderError {
  readonly validationErrors: Array<{ field?: string; message: string }>

  constructor(
    provider: string,
    validationErrors: Array<{ field?: string; message: string }>,
    message?: string
  ) {
    super(
      message || 'Validation failed',
      'VALIDATION_ERROR',
      provider,
      { validationErrors }
    );
    this.name = 'ShippingValidationError';
    this.validationErrors = validationErrors
  }
}

/**
 * Not found error
 */
export class ShippingNotFoundError extends ShippingProviderError {
  readonly resourceType: string
  readonly resourceId: string

  constructor(
    provider: string,
    resourceType: string,
    resourceId: string,
    message?: string
  ) {
    super(
      message || `${resourceType} not found: ${resourceId}`,
      'NOT_FOUND',
      provider,
      { resourceType, resourceId }
    );
    this.name = 'ShippingNotFoundError';
    this.resourceType = resourceType
    this.resourceId = resourceId
  }
}

/**
 * Carrier error
 */
export class ShippingCarrierError extends ShippingProviderError {
  readonly carrier: string
  readonly carrierCode?: string

  constructor(
    provider: string,
    carrier: string,
    message: string,
    carrierCode?: string
  ) {
    super(
      message,
      'CARRIER_ERROR',
      provider,
      { carrier, carrierCode }
    );
    this.name = 'ShippingCarrierError';
    this.carrier = carrier
    this.carrierCode = carrierCode
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Normalize carrier code to standard format
 */
export function normalizeCarrierCode(carrier: string): string {
  const normalized = carrier.toLowerCase().replace(/[^a-z0-9]/g, '');

  const carrierMap: Record<string, string> = {
    'usps': 'usps',
    'uspostalservice': 'usps',
    'unitedstatespostalservice': 'usps',
    'ups': 'ups',
    'unitedparcelservice': 'ups',
    'fedex': 'fedex',
    'federalexpress': 'fedex',
    'dhl': 'dhl',
    'dhlexpress': 'dhl',
    'dhlecommerce': 'dhl_ecommerce',
    'ontrac': 'ontrac',
    'lasership': 'lasership',
    'canadapost': 'canada_post',
    'purolator': 'purolator',
    'australiapost': 'australia_post',
    'royalmail': 'royal_mail',
    'deutschepost': 'deutsche_post',
    'dpd': 'dpd',
    'gls': 'gls',
    'hermes': 'hermes',
    'aramex': 'aramex',
  };

  return carrierMap[normalized] || normalized;
}

/**
 * Normalize tracking status from carrier-specific status
 */
export function normalizeTrackingStatus(status: string, _carrier?: string): TrackingStatus {
  void _carrier // Reserved for carrier-specific status mapping
  const normalized = status.toLowerCase();

  // Delivered statuses
  if (
    normalized.includes('delivered') ||
    normalized.includes('complete') ||
    normalized === 'dlvd' ||
    normalized === 'd'
  ) {
    return 'delivered';
  }

  // Out for delivery
  if (
    normalized.includes('out for delivery') ||
    normalized.includes('with driver') ||
    normalized.includes('on vehicle') ||
    normalized === 'ofd'
  ) {
    return 'out_for_delivery';
  }

  // In transit
  if (
    normalized.includes('in transit') ||
    normalized.includes('in_transit') ||
    normalized.includes('departed') ||
    normalized.includes('arrived') ||
    normalized.includes('processed') ||
    normalized.includes('transit') ||
    normalized === 'it'
  ) {
    return 'in_transit';
  }

  // Pre-transit
  if (
    normalized.includes('pre') ||
    normalized.includes('label created') ||
    normalized.includes('shipment information') ||
    normalized.includes('electronic notification') ||
    normalized === 'unknown' ||
    normalized === 'pre_transit'
  ) {
    return 'pre_transit';
  }

  // Available for pickup
  if (
    normalized.includes('pickup') ||
    normalized.includes('ready for') ||
    normalized.includes('available') ||
    normalized.includes('held at')
  ) {
    return 'available_for_pickup';
  }

  // Return to sender
  if (
    normalized.includes('return') ||
    normalized.includes('undeliverable') ||
    normalized.includes('refused') ||
    normalized.includes('rts')
  ) {
    return 'return_to_sender';
  }

  // Failure
  if (
    normalized.includes('fail') ||
    normalized.includes('exception') ||
    normalized.includes('unable') ||
    normalized.includes('error')
  ) {
    return 'failure';
  }

  // Cancelled
  if (
    normalized.includes('cancel') ||
    normalized.includes('void')
  ) {
    return 'cancelled';
  }

  return 'unknown';
}

/**
 * Calculate dimensional weight
 */
export function calculateDimWeight(
  parcel: Parcel,
  dimFactor: number = 139
): number {
  const length = parcel.distanceUnit === 'cm' ? parcel.length / 2.54 : parcel.length;
  const width = parcel.distanceUnit === 'cm' ? parcel.width / 2.54 : parcel.width;
  const height = parcel.distanceUnit === 'cm' ? parcel.height / 2.54 : parcel.height;

  const dimWeight = (length * width * height) / dimFactor;
  return Math.ceil(dimWeight * 16); // Convert to ounces
}

/**
 * Get billable weight (max of actual and dimensional)
 */
export function getBillableWeight(parcel: Parcel, dimFactor: number = 139): number {
  const actualWeight = convertWeight(parcel.weight, parcel.weightUnit || 'oz', 'oz');
  const dimWeight = calculateDimWeight(parcel, dimFactor);
  return Math.max(actualWeight, dimWeight);
}

/**
 * Convert weight between units
 */
export function convertWeight(
  value: number,
  fromUnit: 'oz' | 'lb' | 'g' | 'kg',
  toUnit: 'oz' | 'lb' | 'g' | 'kg'
): number {
  // Convert to grams first
  let grams: number;
  switch (fromUnit) {
    case 'oz':
      grams = value * 28.3495;
      break;
    case 'lb':
      grams = value * 453.592;
      break;
    case 'g':
      grams = value;
      break;
    case 'kg':
      grams = value * 1000;
      break;
    default:
      grams = value;
  }

  // Convert from grams to target unit
  switch (toUnit) {
    case 'oz':
      return grams / 28.3495;
    case 'lb':
      return grams / 453.592;
    case 'g':
      return grams;
    case 'kg':
      return grams / 1000;
    default:
      return grams;
  }
}

/**
 * Format address for display
 */
export function formatAddress(address: ShippingAddress): string {
  const lines: string[] = [];

  if (address.name) lines.push(address.name);
  if (address.company) lines.push(address.company);
  if (address.street1) lines.push(address.street1);
  if (address.street2) lines.push(address.street2);
  if (address.street3) lines.push(address.street3);

  const cityStateZip = [
    address.city,
    address.state,
    address.postalCode,
  ].filter(Boolean).join(', ');

  if (cityStateZip) lines.push(cityStateZip);
  if (address.country && address.country !== 'US') {
    lines.push(address.country);
  }

  return lines.join('\n');
}

/**
 * Check if address is international (relative to US)
 */
export function isInternationalAddress(address: ShippingAddress, originCountry: string = 'US'): boolean {
  return address.country.toUpperCase() !== originCountry.toUpperCase();
}
