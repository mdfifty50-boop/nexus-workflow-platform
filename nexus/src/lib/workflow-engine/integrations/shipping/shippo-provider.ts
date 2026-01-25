/**
 * Shippo Integration Provider
 *
 * Full Shippo API integration for the Nexus workflow engine.
 * Supports multi-carrier rate comparison, label creation, tracking webhooks, and address validation.
 *
 * @see https://docs.goshippo.com/
 * @module shippo-provider
 */

import type {
  ShippingProvider,
  ShippingProviderConfig,
  ProviderCapabilities,
  RateRequest,
  ShippingRate,
  LabelRequest,
  ShippingLabel,
  TrackingInfo,
  TrackingEvent,
  TrackingStatus,
  VoidResult,
  ShippingAddress,
  AddressValidationResult,
  Parcel,
  CarrierAccount,
  TrackingWebhookEvent,
  CustomsDeclaration,
} from './shipping-provider';

import {
  ShippingProviderError,
  ShippingAuthError,
  ShippingRateLimitError,
  ShippingValidationError,
  ShippingNotFoundError,
  normalizeCarrierCode,
} from './shipping-provider';

// ============================================================================
// SHIPPO TYPES
// ============================================================================

export interface ShippoConfig extends ShippingProviderConfig {
  /** Shippo API token */
  apiKey: string;
  /** API version (default: '2018-02-08') */
  apiVersion?: string;
  /** Base URL override */
  baseUrl?: string;
}

/**
 * Shippo Address object
 */
export interface ShippoAddress {
  object_id?: string;
  object_created?: string;
  object_updated?: string;
  object_owner?: string;
  is_complete?: boolean;
  validation_results?: ShippoValidationResults;
  name: string;
  company?: string;
  street1: string;
  street2?: string;
  street3?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  email?: string;
  is_residential?: boolean;
  metadata?: string;
}

export interface ShippoValidationResults {
  is_valid: boolean;
  messages?: ShippoValidationMessage[];
}

export interface ShippoValidationMessage {
  source: string;
  code: string;
  type: 'address_warning' | 'address_error' | 'address_correction';
  text: string;
}

/**
 * Shippo Parcel object
 */
export interface ShippoParcel {
  object_id?: string;
  object_created?: string;
  object_updated?: string;
  object_owner?: string;
  template?: string;
  length: string | number;
  width: string | number;
  height: string | number;
  distance_unit: 'in' | 'cm' | 'ft' | 'm' | 'mm' | 'yd';
  weight: string | number;
  mass_unit: 'g' | 'oz' | 'lb' | 'kg';
  metadata?: string;
  extra?: {
    COD?: {
      amount: string;
      currency: string;
      payment_method: 'CASH' | 'SECURED_FUNDS' | 'ANY';
    };
    insurance?: {
      amount: string;
      currency: string;
      provider: string;
      content?: string;
    };
  };
}

/**
 * Shippo Shipment object
 */
export interface ShippoShipment {
  object_id?: string;
  object_created?: string;
  object_updated?: string;
  object_owner?: string;
  object_state?: 'VALID' | 'INVALID' | 'INCOMPLETE';
  status?: 'SUCCESS' | 'ERROR' | 'QUEUED';
  address_from: ShippoAddress | string;
  address_to: ShippoAddress | string;
  address_return?: ShippoAddress | string;
  parcels: Array<ShippoParcel | string>;
  shipment_date?: string;
  extra?: ShippoShipmentExtra;
  customs_declaration?: ShippoCustomsDeclaration | string;
  rates?: ShippoRate[];
  messages?: Array<{ source: string; code: string; text: string }>;
  metadata?: string;
  test?: boolean;
  /** Whether to process asynchronously */
  async?: boolean;
}

export interface ShippoShipmentExtra {
  signature_confirmation?: 'STANDARD' | 'ADULT' | 'CERTIFIED' | 'INDIRECT';
  saturday_delivery?: boolean;
  bypass_address_validation?: boolean;
  request_retail_rates?: boolean;
  carrier_hubs?: string[];
  insurance?: {
    amount: string;
    currency: string;
    provider?: string;
    content?: string;
  };
  reference_1?: string;
  reference_2?: string;
  is_return?: boolean;
}

/**
 * Shippo Rate object
 */
export interface ShippoRate {
  object_id: string;
  object_created: string;
  object_owner: string;
  shipment: string;
  attributes?: string[];
  amount: string;
  currency: string;
  amount_local: string;
  currency_local: string;
  provider: string;
  provider_image_75: string;
  provider_image_200: string;
  servicelevel: {
    name: string;
    token: string;
    terms?: string;
  };
  estimated_days?: number;
  arrives_by?: string;
  duration_terms?: string;
  messages?: Array<{ source: string; code: string; text: string }>;
  carrier_account: string;
  zone?: string;
  included_insurance_price?: string;
}

/**
 * Shippo Transaction (Label) object
 */
export interface ShippoTransaction {
  object_id: string;
  object_created: string;
  object_updated: string;
  object_owner: string;
  object_state: 'VALID' | 'INVALID' | 'INCOMPLETE';
  status: 'SUCCESS' | 'ERROR' | 'QUEUED' | 'REFUND_PENDING' | 'REFUND_SUCCESS' | 'REFUND_ERROR';
  rate: ShippoRate | string;
  label_url?: string;
  commercial_invoice_url?: string;
  qr_code_url?: string;
  tracking_number?: string;
  tracking_status?: ShippoTrackingStatus;
  tracking_url_provider?: string;
  eta?: string;
  test: boolean;
  messages?: Array<{ source: string; code: string; text: string }>;
  metadata?: string;
  label_file_type?: 'PNG' | 'PDF' | 'PDF_4x6' | 'ZPLII' | 'PNG_2.3x7.5';
  parcel?: string;
}

/**
 * Shippo Tracking Status object
 */
export interface ShippoTrackingStatus {
  object_id: string;
  object_created: string;
  object_updated: string;
  carrier: string;
  tracking_number: string;
  address_from?: Partial<ShippoAddress>;
  address_to?: Partial<ShippoAddress>;
  transaction?: string;
  original_eta?: string;
  eta?: string;
  servicelevel?: {
    token: string;
    name: string;
  };
  tracking_status?: {
    status: ShippoTrackingStatusCode;
    substatus?: string;
    status_details?: string;
    status_date?: string;
    object_created: string;
    object_updated: string;
    object_id: string;
    location?: {
      city?: string;
      state?: string;
      zip?: string;
      country?: string;
    };
  };
  tracking_history?: Array<{
    status: ShippoTrackingStatusCode;
    substatus?: string;
    status_details?: string;
    status_date?: string;
    object_created: string;
    object_updated: string;
    object_id: string;
    location?: {
      city?: string;
      state?: string;
      zip?: string;
      country?: string;
    };
  }>;
  metadata?: string;
  test?: boolean;
}

export type ShippoTrackingStatusCode =
  | 'UNKNOWN'
  | 'PRE_TRANSIT'
  | 'TRANSIT'
  | 'DELIVERED'
  | 'RETURNED'
  | 'FAILURE';

/**
 * Shippo Customs Declaration object
 */
export interface ShippoCustomsDeclaration {
  object_id?: string;
  object_created?: string;
  object_updated?: string;
  object_owner?: string;
  object_state?: 'VALID' | 'INVALID' | 'INCOMPLETE';
  certify: boolean;
  certify_signer: string;
  contents_type: 'DOCUMENTS' | 'GIFT' | 'SAMPLE' | 'MERCHANDISE' | 'HUMANITARIAN_DONATION' | 'RETURN_MERCHANDISE' | 'OTHER';
  contents_explanation?: string;
  non_delivery_option: 'ABANDON' | 'RETURN';
  exporter_reference?: string;
  importer_reference?: string;
  b13a_filing_option?: 'FILED_ELECTRONICALLY' | 'SUMMARY_REPORTING' | 'NOT_REQUIRED';
  b13a_number?: string;
  invoice?: string;
  license?: string;
  certificate?: string;
  notes?: string;
  eel_pfc?: 'NOEEI_30_37_a' | 'NOEEI_30_37_h' | 'NOEEI_30_36' | 'AES_ITN';
  aes_itn?: string;
  incoterm?: 'DDP' | 'DDU' | 'CPT' | 'CIP';
  items: ShippoCustomsItem[];
  metadata?: string;
  test?: boolean;
}

export interface ShippoCustomsItem {
  object_id?: string;
  description: string;
  quantity: number;
  net_weight: string | number;
  mass_unit: 'g' | 'oz' | 'lb' | 'kg';
  value_amount: string | number;
  value_currency: string;
  tariff_number?: string;
  origin_country: string;
  sku_code?: string;
  eccn_ear99?: string;
  metadata?: string;
}

/**
 * Shippo Carrier Account object
 */
export interface ShippoCarrierAccount {
  object_id: string;
  object_created: string;
  object_updated: string;
  object_owner: string;
  carrier: string;
  account_id: string;
  parameters?: Record<string, unknown>;
  test: boolean;
  active: boolean;
  is_shippo_account?: boolean;
  metadata?: string;
}

/**
 * Shippo Webhook object
 */
export interface ShippoWebhook {
  object_id: string;
  object_created: string;
  object_updated: string;
  object_owner: string;
  url: string;
  event: 'all' | 'batch_created' | 'batch_purchased' | 'track_updated' | 'transaction_created' | 'transaction_updated';
  is_test: boolean;
  active: boolean;
}

/**
 * Shippo Refund object
 */
export interface ShippoRefund {
  object_id: string;
  object_created: string;
  object_updated: string;
  object_owner: string;
  status: 'QUEUED' | 'PENDING' | 'SUCCESS' | 'ERROR';
  transaction: string;
}

// ============================================================================
// SHIPPO PROVIDER IMPLEMENTATION
// ============================================================================

/**
 * Shippo shipping provider implementation
 */
export class ShippoProvider implements ShippingProvider {
  readonly providerId = 'shippo';
  readonly providerName = 'Shippo';

  readonly capabilities: ProviderCapabilities = {
    carriers: [
      'usps',
      'ups',
      'fedex',
      'dhl_express',
      'dhl_ecommerce',
      'canada_post',
      'purolator',
      'australia_post',
      'royal_mail',
      'deutsche_post',
      'gls',
      'dpd',
      'aramex',
      'ontrac',
      'lasership',
      'sendle',
    ],
    rateComparison: true,
    addressValidation: true,
    insurance: true,
    international: true,
    returnLabels: true,
    batchLabels: true,
    trackingWebhooks: true,
    customsForms: true,
    labelFormats: ['pdf', 'png', 'zpl'],
    maxParcelsPerShipment: 10,
  };

  private baseUrl: string;
  private apiVersion: string;
  private initialized = false;
  private config: ShippoConfig;

  constructor(config: ShippoConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://api.goshippo.com';
    this.apiVersion = config.apiVersion || '2018-02-08';
  }

  /**
   * Initialize the provider
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Verify credentials by fetching carrier accounts
      await this.getCarrierAccounts();
      this.initialized = true;
      console.log('[Shippo] Provider initialized successfully');
    } catch (error) {
      throw new ShippingAuthError(this.providerId, 'Failed to initialize Shippo');
    }
  }

  /**
   * Make API request to Shippo
   */
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      'Authorization': `ShippoToken ${this.config.apiKey}`,
      'Content-Type': 'application/json',
      'Shippo-API-Version': this.apiVersion,
    };

    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      signal: AbortSignal.timeout(this.config.timeout || 30000),
    });

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
      throw new ShippingRateLimitError(this.providerId, retryAfter);
    }

    // Handle errors
    if (!response.ok) {
      const errorBody = await response.text();
      let errorMessage: string;
      let errorDetails: unknown;

      try {
        const errorJson = JSON.parse(errorBody);
        errorMessage = errorJson.detail || errorJson.message || JSON.stringify(errorJson);
        errorDetails = errorJson;
      } catch {
        errorMessage = errorBody;
      }

      if (response.status === 401) {
        throw new ShippingAuthError(this.providerId, errorMessage);
      }

      if (response.status === 404) {
        throw new ShippingNotFoundError(this.providerId, 'resource', endpoint, errorMessage);
      }

      if (response.status === 400) {
        throw new ShippingValidationError(
          this.providerId,
          [{ message: errorMessage }],
          errorMessage
        );
      }

      throw new ShippingProviderError(
        errorMessage,
        `HTTP_${response.status}`,
        this.providerId,
        errorDetails
      );
    }

    const text = await response.text();
    if (!text) return {} as T;

    return JSON.parse(text) as T;
  }

  // ============================================================================
  // ADDRESS VALIDATION
  // ============================================================================

  /**
   * Validate an address
   */
  async validateAddress(address: ShippingAddress): Promise<AddressValidationResult> {
    const shippoAddress = this.convertToShippoAddress(address);
    shippoAddress.validate = true;

    try {
      const result = await this.request<ShippoAddress & { validate?: boolean }>(
        'POST',
        '/addresses',
        shippoAddress
      );

      const validationResults = result.validation_results;
      const isValid = validationResults?.is_valid ?? result.is_complete ?? false;

      return {
        isValid,
        validatedAddress: isValid ? this.convertFromShippoAddress(result) : undefined,
        messages: (validationResults?.messages || []).map(msg => ({
          type: msg.type === 'address_error' ? 'error' : msg.type === 'address_warning' ? 'warning' : 'info',
          code: msg.code,
          message: msg.text,
        })),
        classification: {
          isResidential: result.is_residential ?? true,
          isCommercial: !result.is_residential,
          isPOBox: address.street1.toLowerCase().includes('po box'),
          isAPO: address.street1.toLowerCase().includes('apo') || address.street1.toLowerCase().includes('fpo'),
        },
      };
    } catch (error) {
      return {
        isValid: false,
        messages: [{
          type: 'error',
          code: 'VALIDATION_FAILED',
          message: error instanceof Error ? error.message : 'Address validation failed',
        }],
      };
    }
  }

  private convertToShippoAddress(address: ShippingAddress): ShippoAddress & { validate?: boolean } {
    return {
      name: address.name,
      company: address.company,
      street1: address.street1,
      street2: address.street2,
      street3: address.street3,
      city: address.city,
      state: address.state,
      zip: address.postalCode,
      country: address.country,
      phone: address.phone,
      email: address.email,
      is_residential: address.residential,
    };
  }

  private convertFromShippoAddress(shippoAddress: ShippoAddress): ShippingAddress {
    return {
      name: shippoAddress.name,
      company: shippoAddress.company,
      street1: shippoAddress.street1,
      street2: shippoAddress.street2,
      street3: shippoAddress.street3,
      city: shippoAddress.city,
      state: shippoAddress.state,
      postalCode: shippoAddress.zip,
      country: shippoAddress.country,
      phone: shippoAddress.phone,
      email: shippoAddress.email,
      residential: shippoAddress.is_residential,
    };
  }

  // ============================================================================
  // RATE SHOPPING
  // ============================================================================

  /**
   * Get shipping rates
   */
  async getRates(request: RateRequest): Promise<ShippingRate[]> {
    // Create addresses
    const addressFrom = this.convertToShippoAddress(request.fromAddress);
    const addressTo = this.convertToShippoAddress(request.toAddress);

    // Create parcels
    const parcels = request.parcels.map(p => this.convertToShippoParcel(p));

    // Build shipment request
    const shipmentData: Partial<ShippoShipment> = {
      address_from: addressFrom,
      address_to: addressTo,
      parcels,
      shipment_date: request.shipDate?.toISOString() || new Date().toISOString(),
      async: false,
      test: this.config.testMode,
    };

    // Add extra options
    const extra: ShippoShipmentExtra = {};

    if (request.signatureRequired) {
      extra.signature_confirmation = request.signatureType === 'adult' ? 'ADULT' : 'STANDARD';
    }

    if (request.saturdayDelivery) {
      extra.saturday_delivery = true;
    }

    if (request.insuranceAmount) {
      extra.insurance = {
        amount: request.insuranceAmount.toString(),
        currency: 'USD',
      };
    }

    if (request.reference1) extra.reference_1 = request.reference1;
    if (request.reference2) extra.reference_2 = request.reference2;

    if (Object.keys(extra).length > 0) {
      shipmentData.extra = extra;
    }

    // Add customs if international
    if (request.customs) {
      shipmentData.customs_declaration = this.convertToShippoCustomsDeclaration(request.customs);
    }

    // Create shipment (which returns rates)
    const shipment = await this.request<ShippoShipment>('POST', '/shipments', shipmentData);

    if (!shipment.rates || shipment.rates.length === 0) {
      console.warn('[Shippo] No rates returned for shipment');
      return [];
    }

    // Filter by requested carriers/services if specified
    let rates = shipment.rates;

    if (request.carriers?.length) {
      const carrierSet = new Set(request.carriers.map(c => c.toLowerCase()));
      rates = rates.filter(r => carrierSet.has(r.provider.toLowerCase()));
    }

    if (request.serviceLevels?.length) {
      const serviceSet = new Set(request.serviceLevels.map(s => s.toLowerCase()));
      rates = rates.filter(r => serviceSet.has(r.servicelevel.token.toLowerCase()));
    }

    return rates.map(rate => this.convertToShippingRate(rate));
  }

  private convertToShippoParcel(parcel: Parcel): ShippoParcel {
    return {
      length: parcel.length.toString(),
      width: parcel.width.toString(),
      height: parcel.height.toString(),
      distance_unit: parcel.distanceUnit === 'cm' ? 'cm' : 'in',
      weight: parcel.weight.toString(),
      mass_unit: parcel.weightUnit || 'oz',
    };
  }

  private convertToShippoCustomsDeclaration(customs: CustomsDeclaration): ShippoCustomsDeclaration {
    const contentsTypeMap: Record<string, ShippoCustomsDeclaration['contents_type']> = {
      merchandise: 'MERCHANDISE',
      gift: 'GIFT',
      sample: 'SAMPLE',
      documents: 'DOCUMENTS',
      return: 'RETURN_MERCHANDISE',
      other: 'OTHER',
    };

    return {
      certify: true,
      certify_signer: 'Shipper',
      contents_type: contentsTypeMap[customs.contentsType] || 'MERCHANDISE',
      contents_explanation: customs.contentsDescription,
      non_delivery_option: customs.nonDeliveryOption === 'return' ? 'RETURN' : 'ABANDON',
      exporter_reference: customs.exporterReference,
      importer_reference: customs.importerReference,
      incoterm: customs.incoterm as ShippoCustomsDeclaration['incoterm'],
      items: customs.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        net_weight: item.netWeight.toString(),
        mass_unit: 'oz' as const,
        value_amount: item.value.toString(),
        value_currency: 'USD',
        tariff_number: item.hsCode,
        origin_country: item.originCountry,
        sku_code: item.sku,
      })),
    };
  }

  private convertToShippingRate(rate: ShippoRate): ShippingRate {
    return {
      rateId: rate.object_id,
      providerRateId: rate.object_id,
      carrier: normalizeCarrierCode(rate.provider),
      carrierName: rate.provider,
      serviceLevel: rate.servicelevel.token,
      serviceLevelName: rate.servicelevel.name,
      amount: parseFloat(rate.amount),
      currency: rate.currency,
      transitDays: rate.estimated_days,
      estimatedDeliveryDate: rate.arrives_by ? new Date(rate.arrives_by) : undefined,
      zone: rate.zone,
      attributes: {
        deliveryCommitment: rate.duration_terms,
        trackingIncluded: true,
        insuranceIncluded: !!rate.included_insurance_price,
        carrierServiceCode: rate.servicelevel.token,
      },
    };
  }

  // ============================================================================
  // LABEL CREATION
  // ============================================================================

  /**
   * Create a shipping label
   */
  async createLabel(request: LabelRequest): Promise<ShippingLabel> {
    // If we have a rate ID, use it directly
    if (request.rateId) {
      return this.createLabelFromRate(request.rateId, request);
    }

    // Otherwise, get rates first and use the matching one
    const rates = await this.getRates({
      fromAddress: request.fromAddress,
      toAddress: request.toAddress,
      parcels: request.parcels,
      carriers: [request.carrier],
      serviceLevels: [request.serviceLevel],
      customs: request.customs,
      insuranceAmount: request.insuranceAmount,
      signatureRequired: request.signatureRequired,
      signatureType: request.signatureType,
      saturdayDelivery: request.saturdayDelivery,
    });

    if (rates.length === 0) {
      throw new ShippingProviderError(
        'No matching rate found for the specified carrier and service',
        'NO_RATE',
        this.providerId
      );
    }

    return this.createLabelFromRate(rates[0].rateId, request);
  }

  private async createLabelFromRate(rateId: string, request: LabelRequest): Promise<ShippingLabel> {
    const labelFileTypeMap: Record<string, ShippoTransaction['label_file_type']> = {
      pdf: 'PDF',
      png: 'PNG',
      zpl: 'ZPLII',
    };

    const transactionData = {
      rate: rateId,
      label_file_type: labelFileTypeMap[request.labelFormat || 'pdf'] || 'PDF',
      metadata: request.metadata ? JSON.stringify(request.metadata) : undefined,
      async: false,
    };

    const transaction = await this.request<ShippoTransaction>('POST', '/transactions', transactionData);

    if (transaction.status === 'ERROR' || !transaction.tracking_number || !transaction.label_url) {
      const errorMessages = transaction.messages?.map(m => m.text).join('; ') || 'Failed to create label';
      throw new ShippingProviderError(errorMessages, 'LABEL_ERROR', this.providerId, transaction);
    }

    // Get rate details if needed
    let rate: ShippoRate | null = null;
    if (typeof transaction.rate === 'string') {
      rate = await this.request<ShippoRate>('GET', `/rates/${transaction.rate}`);
    } else {
      rate = transaction.rate;
    }

    return {
      labelId: transaction.object_id,
      providerLabelId: transaction.object_id,
      trackingNumber: transaction.tracking_number,
      carrier: normalizeCarrierCode(rate?.provider || request.carrier),
      carrierName: rate?.provider || request.carrier,
      serviceLevel: rate?.servicelevel.token || request.serviceLevel,
      serviceLevelName: rate?.servicelevel.name || request.serviceLevel,
      labelUrl: transaction.label_url,
      labelFormat: request.labelFormat || 'pdf',
      trackingUrl: transaction.tracking_url_provider,
      cost: rate ? parseFloat(rate.amount) : 0,
      currency: rate?.currency || 'USD',
      shipDate: request.shipDate || new Date(),
      estimatedDeliveryDate: transaction.eta ? new Date(transaction.eta) : undefined,
      fromAddress: request.fromAddress,
      toAddress: request.toAddress,
      parcels: request.parcels,
      createdAt: new Date(transaction.object_created),
      status: 'valid',
      customsForms: transaction.commercial_invoice_url
        ? [{
            type: 'commercial_invoice',
            url: transaction.commercial_invoice_url,
          }]
        : undefined,
      metadata: request.metadata,
      orderId: request.orderId,
    };
  }

  /**
   * Create multiple labels in batch
   */
  async createLabels(requests: LabelRequest[]): Promise<ShippingLabel[]> {
    const results: ShippingLabel[] = [];

    // Shippo doesn't have a batch API for individual label creation
    // Process sequentially with rate limiting awareness
    for (const request of requests) {
      try {
        const label = await this.createLabel(request);
        results.push(label);
      } catch (error) {
        console.error(`[Shippo] Failed to create label for order ${request.orderId}:`, error);

        if (error instanceof ShippingRateLimitError) {
          // Wait and retry
          await new Promise(resolve => setTimeout(resolve, (error.retryAfter || 60) * 1000));
          try {
            const label = await this.createLabel(request);
            results.push(label);
          } catch {
            // Continue with other labels
          }
        }
      }
    }

    return results;
  }

  // ============================================================================
  // TRACKING
  // ============================================================================

  /**
   * Get tracking information
   */
  async track(trackingNumber: string, carrier?: string): Promise<TrackingInfo> {
    const endpoint = carrier
      ? `/tracks/${carrier}/${trackingNumber}`
      : `/tracks/${trackingNumber}`;

    // First, register the tracking number if not already registered
    if (carrier) {
      try {
        await this.request('POST', '/tracks', {
          carrier,
          tracking_number: trackingNumber,
        });
      } catch (error) {
        // Ignore if already registered
        if (!(error instanceof ShippingValidationError)) {
          console.warn('[Shippo] Could not register tracking:', error);
        }
      }
    }

    const tracking = await this.request<ShippoTrackingStatus>('GET', endpoint);

    return this.convertToTrackingInfo(tracking);
  }

  /**
   * Track multiple shipments
   */
  async trackMultiple(
    trackingNumbers: Array<{ trackingNumber: string; carrier?: string }>
  ): Promise<TrackingInfo[]> {
    const results: TrackingInfo[] = [];

    for (const { trackingNumber, carrier } of trackingNumbers) {
      try {
        const info = await this.track(trackingNumber, carrier);
        results.push(info);
      } catch (error) {
        console.error(`[Shippo] Failed to track ${trackingNumber}:`, error);
      }
    }

    return results;
  }

  private convertToTrackingInfo(tracking: ShippoTrackingStatus): TrackingInfo {
    const statusMap: Record<ShippoTrackingStatusCode, TrackingStatus> = {
      UNKNOWN: 'unknown',
      PRE_TRANSIT: 'pre_transit',
      TRANSIT: 'in_transit',
      DELIVERED: 'delivered',
      RETURNED: 'return_to_sender',
      FAILURE: 'failure',
    };

    const currentStatus = tracking.tracking_status;
    const status = currentStatus?.status ? statusMap[currentStatus.status] : 'unknown';

    const events: TrackingEvent[] = (tracking.tracking_history || []).map(event => ({
      timestamp: new Date(event.status_date || event.object_created),
      status: statusMap[event.status] || 'unknown',
      description: event.status_details || event.status,
      location: event.location ? {
        city: event.location.city,
        state: event.location.state,
        postalCode: event.location.zip,
        country: event.location.country,
      } : undefined,
      eventCode: event.substatus,
    }));

    // Sort events by timestamp descending
    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return {
      trackingNumber: tracking.tracking_number,
      carrier: normalizeCarrierCode(tracking.carrier),
      carrierName: tracking.carrier,
      status,
      statusDescription: currentStatus?.status_details || currentStatus?.status || 'Unknown',
      estimatedDeliveryDate: tracking.eta ? new Date(tracking.eta) : undefined,
      actualDeliveryDate: status === 'delivered' && currentStatus?.status_date
        ? new Date(currentStatus.status_date)
        : undefined,
      events,
      originAddress: tracking.address_from ? {
        city: tracking.address_from.city,
        state: tracking.address_from.state,
        postalCode: tracking.address_from.zip,
        country: tracking.address_from.country,
      } : undefined,
      destinationAddress: tracking.address_to ? {
        city: tracking.address_to.city,
        state: tracking.address_to.state,
        postalCode: tracking.address_to.zip,
        country: tracking.address_to.country,
      } : undefined,
      serviceLevel: tracking.servicelevel?.name,
      trackingUrl: `https://track.goshippo.com/${tracking.carrier}/${tracking.tracking_number}`,
      lastUpdated: new Date(tracking.object_updated),
    };
  }

  // ============================================================================
  // VOID / REFUND
  // ============================================================================

  /**
   * Void/refund a shipping label
   */
  async voidLabel(labelId: string): Promise<VoidResult> {
    try {
      const refund = await this.request<ShippoRefund>('POST', '/refunds', {
        transaction: labelId,
        async: false,
      });

      const success = refund.status === 'SUCCESS' || refund.status === 'PENDING';

      return {
        success,
        message: `Refund ${refund.status.toLowerCase()}`,
        voidedAt: success ? new Date() : undefined,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to void label',
      };
    }
  }

  // ============================================================================
  // RETURN LABELS
  // ============================================================================

  /**
   * Create a return label
   */
  async createReturnLabel(originalLabelId: string, returnAddress?: ShippingAddress): Promise<ShippingLabel> {
    // Get original transaction
    const original = await this.request<ShippoTransaction>('GET', `/transactions/${originalLabelId}`);

    // Get rate details
    let rate: ShippoRate;
    if (typeof original.rate === 'string') {
      rate = await this.request<ShippoRate>('GET', `/rates/${original.rate}`);
    } else {
      rate = original.rate;
    }

    // Get shipment details
    const shipment = await this.request<ShippoShipment>('GET', `/shipments/${rate.shipment}`);

    // Swap from/to addresses
    const fromAddress = typeof shipment.address_to === 'string'
      ? await this.request<ShippoAddress>('GET', `/addresses/${shipment.address_to}`)
      : shipment.address_to;

    const toAddress = returnAddress
      ? this.convertToShippoAddress(returnAddress)
      : (typeof shipment.address_from === 'string'
        ? await this.request<ShippoAddress>('GET', `/addresses/${shipment.address_from}`)
        : shipment.address_from);

    // Create return shipment
    const returnShipment = await this.request<ShippoShipment>('POST', '/shipments', {
      address_from: fromAddress,
      address_to: toAddress,
      parcels: shipment.parcels,
      extra: {
        is_return: true,
      },
      async: false,
      test: this.config.testMode,
    });

    if (!returnShipment.rates || returnShipment.rates.length === 0) {
      throw new ShippingProviderError('No return rates available', 'NO_RATES', this.providerId);
    }

    // Find matching rate or use first available
    const matchingRate = returnShipment.rates.find(
      r => r.provider.toLowerCase() === rate.provider.toLowerCase() &&
           r.servicelevel.token === rate.servicelevel.token
    ) || returnShipment.rates[0];

    // Create label with return rate
    const returnLabel = await this.createLabelFromRate(matchingRate.object_id, {
      fromAddress: this.convertFromShippoAddress(fromAddress),
      toAddress: returnAddress || this.convertFromShippoAddress(toAddress),
      parcels: [], // Will be fetched from rate
      carrier: matchingRate.provider,
      serviceLevel: matchingRate.servicelevel.token,
    });

    return {
      ...returnLabel,
      isReturn: true,
    } as ShippingLabel & { isReturn: boolean };
  }

  // ============================================================================
  // CARRIER ACCOUNTS
  // ============================================================================

  /**
   * Get carrier accounts
   */
  async getCarrierAccounts(): Promise<CarrierAccount[]> {
    const response = await this.request<{ results: ShippoCarrierAccount[] }>('GET', '/carrier_accounts');

    return response.results.map(account => ({
      accountId: account.object_id,
      carrier: normalizeCarrierCode(account.carrier),
      nickname: account.metadata,
      active: account.active,
    }));
  }

  /**
   * Add a carrier account
   */
  async addCarrierAccount(account: Partial<CarrierAccount>): Promise<CarrierAccount> {
    const response = await this.request<ShippoCarrierAccount>('POST', '/carrier_accounts', {
      carrier: account.carrier,
      account_id: account.accountId,
      parameters: account.credentials,
      test: this.config.testMode,
      active: account.active ?? true,
    });

    return {
      accountId: response.object_id,
      carrier: normalizeCarrierCode(response.carrier),
      active: response.active,
    };
  }

  /**
   * Remove a carrier account
   */
  async removeCarrierAccount(accountId: string): Promise<boolean> {
    try {
      await this.request('DELETE', `/carrier_accounts/${accountId}`);
      return true;
    } catch {
      return false;
    }
  }

  // ============================================================================
  // WEBHOOKS
  // ============================================================================

  /**
   * Register tracking webhook
   */
  async registerTrackingWebhook(url: string, events?: string[]): Promise<{ webhookId: string }> {
    const eventType = events?.[0] || 'track_updated';

    const webhook = await this.request<ShippoWebhook>('POST', '/webhooks', {
      url,
      event: eventType,
      is_test: this.config.testMode,
    });

    return { webhookId: webhook.object_id };
  }

  /**
   * List webhooks
   */
  async listWebhooks(): Promise<ShippoWebhook[]> {
    const response = await this.request<{ results: ShippoWebhook[] }>('GET', '/webhooks');
    return response.results;
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(webhookId: string): Promise<boolean> {
    try {
      await this.request('DELETE', `/webhooks/${webhookId}`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Parse tracking webhook payload
   */
  parseTrackingWebhook(payload: unknown, _headers?: Record<string, string>): TrackingWebhookEvent | null {
    void _headers // Reserved for signature verification
    const data = payload as {
      event?: string;
      data?: ShippoTrackingStatus;
      test?: boolean;
    };

    if (!data.event || !data.data) {
      return null;
    }

    const tracking = data.data;
    const statusMap: Record<ShippoTrackingStatusCode, TrackingStatus> = {
      UNKNOWN: 'unknown',
      PRE_TRANSIT: 'pre_transit',
      TRANSIT: 'in_transit',
      DELIVERED: 'delivered',
      RETURNED: 'return_to_sender',
      FAILURE: 'failure',
    };

    const status = tracking.tracking_status?.status
      ? statusMap[tracking.tracking_status.status]
      : 'unknown';

    let eventType: TrackingWebhookEvent['eventType'] = 'tracking.updated';
    if (status === 'delivered') {
      eventType = 'tracking.delivered';
    } else if (status === 'failure' || status === 'return_to_sender') {
      eventType = 'tracking.failed';
    }

    return {
      eventId: `shippo_${data.event}_${Date.now()}`,
      eventType,
      trackingNumber: tracking.tracking_number,
      carrier: normalizeCarrierCode(tracking.carrier),
      labelId: tracking.transaction || undefined,
      status,
      statusDescription: tracking.tracking_status?.status_details || status,
      latestEvent: tracking.tracking_status ? {
        timestamp: new Date(tracking.tracking_status.status_date || tracking.tracking_status.object_created),
        status,
        description: tracking.tracking_status.status_details || tracking.tracking_status.status,
        location: tracking.tracking_status.location ? {
          city: tracking.tracking_status.location.city,
          state: tracking.tracking_status.location.state,
          postalCode: tracking.tracking_status.location.zip,
          country: tracking.tracking_status.location.country,
        } : undefined,
      } : undefined,
      timestamp: new Date(),
      rawPayload: payload,
    };
  }

  // ============================================================================
  // LABEL RETRIEVAL
  // ============================================================================

  /**
   * Get label by ID
   */
  async getLabel(labelId: string): Promise<ShippingLabel | null> {
    try {
      const transaction = await this.request<ShippoTransaction>('GET', `/transactions/${labelId}`);

      if (!transaction.tracking_number || !transaction.label_url) {
        return null;
      }

      let rate: ShippoRate | null = null;
      if (typeof transaction.rate === 'string') {
        rate = await this.request<ShippoRate>('GET', `/rates/${transaction.rate}`);
      } else {
        rate = transaction.rate;
      }

      return {
        labelId: transaction.object_id,
        providerLabelId: transaction.object_id,
        trackingNumber: transaction.tracking_number,
        carrier: normalizeCarrierCode(rate?.provider || ''),
        carrierName: rate?.provider || '',
        serviceLevel: rate?.servicelevel.token || '',
        serviceLevelName: rate?.servicelevel.name || '',
        labelUrl: transaction.label_url,
        labelFormat: this.getLabelFormatFromType(transaction.label_file_type),
        trackingUrl: transaction.tracking_url_provider,
        cost: rate ? parseFloat(rate.amount) : 0,
        currency: rate?.currency || 'USD',
        shipDate: new Date(transaction.object_created),
        estimatedDeliveryDate: transaction.eta ? new Date(transaction.eta) : undefined,
        fromAddress: { name: '', street1: '', city: '', state: '', postalCode: '', country: '' },
        toAddress: { name: '', street1: '', city: '', state: '', postalCode: '', country: '' },
        parcels: [],
        createdAt: new Date(transaction.object_created),
        status: this.getLabelStatus(transaction),
        metadata: transaction.metadata ? JSON.parse(transaction.metadata) : undefined,
      };
    } catch {
      return null;
    }
  }

  private getLabelFormatFromType(type?: string): 'pdf' | 'png' | 'zpl' | 'epl' {
    switch (type) {
      case 'PNG':
      case 'PNG_2.3x7.5':
        return 'png';
      case 'ZPLII':
        return 'zpl';
      default:
        return 'pdf';
    }
  }

  private getLabelStatus(transaction: ShippoTransaction): ShippingLabel['status'] {
    switch (transaction.status) {
      case 'SUCCESS':
        return 'valid';
      case 'ERROR':
        return 'error';
      case 'REFUND_SUCCESS':
        return 'refunded';
      case 'REFUND_PENDING':
        return 'voided';
      default:
        return 'pending';
    }
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a Shippo provider instance
 */
export function createShippoProvider(config: ShippoConfig): ShippoProvider {
  return new ShippoProvider(config);
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default ShippoProvider;
