/**
 * ShipStation Integration Provider
 *
 * Full ShipStation API integration for the Nexus workflow engine.
 * Supports order import/export, label generation, tracking updates, and rate shopping.
 *
 * @see https://www.shipstation.com/docs/api/
 * @module shipstation-provider
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
  TrackingStatus,
  VoidResult,
  ShippingAddress,
  AddressValidationResult,
  Parcel,
  CarrierAccount,
  TrackingWebhookEvent,
} from './shipping-provider';

import {
  ShippingProviderError,
  ShippingAuthError,
  ShippingRateLimitError,
  ShippingNotFoundError,
  normalizeCarrierCode,
} from './shipping-provider';

// ============================================================================
// SHIPSTATION TYPES
// ============================================================================

export interface ShipStationConfig extends ShippingProviderConfig {
  /** ShipStation API key */
  apiKey: string;
  /** ShipStation API secret */
  apiSecret: string;
  /** Partner API key (optional) */
  partnerApiKey?: string;
  /** Base URL override */
  baseUrl?: string;
}

/**
 * ShipStation order
 */
export interface ShipStationOrder {
  orderId?: number;
  orderNumber: string;
  orderKey?: string;
  orderDate: string;
  createDate?: string;
  modifyDate?: string;
  paymentDate?: string;
  shipByDate?: string;
  orderStatus: ShipStationOrderStatus;
  customerId?: number;
  customerUsername?: string;
  customerEmail?: string;
  billTo: ShipStationAddress;
  shipTo: ShipStationAddress;
  items: ShipStationOrderItem[];
  orderTotal: number;
  amountPaid: number;
  taxAmount: number;
  shippingAmount: number;
  customerNotes?: string;
  internalNotes?: string;
  gift: boolean;
  giftMessage?: string;
  paymentMethod?: string;
  requestedShippingService?: string;
  carrierCode?: string;
  serviceCode?: string;
  packageCode?: string;
  confirmation?: string;
  shipDate?: string;
  holdUntilDate?: string;
  weight?: ShipStationWeight;
  dimensions?: ShipStationDimensions;
  insuranceOptions?: ShipStationInsuranceOptions;
  internationalOptions?: ShipStationInternationalOptions;
  advancedOptions?: ShipStationAdvancedOptions;
  tagIds?: number[];
  userId?: string;
  externallyFulfilled?: boolean;
  externallyFulfilledBy?: string;
}

export type ShipStationOrderStatus =
  | 'awaiting_payment'
  | 'awaiting_shipment'
  | 'pending_fulfillment'
  | 'shipped'
  | 'on_hold'
  | 'cancelled';

export interface ShipStationAddress {
  name: string;
  company?: string;
  street1: string;
  street2?: string;
  street3?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  residential?: boolean;
  addressVerified?: string;
}

export interface ShipStationOrderItem {
  orderItemId?: number;
  lineItemKey?: string;
  sku?: string;
  name: string;
  imageUrl?: string;
  weight?: ShipStationWeight;
  quantity: number;
  unitPrice: number;
  taxAmount?: number;
  shippingAmount?: number;
  warehouseLocation?: string;
  options?: Array<{ name: string; value: string }>;
  productId?: number;
  fulfillmentSku?: string;
  adjustment: boolean;
  upc?: string;
}

export interface ShipStationWeight {
  value: number;
  units: 'pounds' | 'ounces' | 'grams';
  WeightUnits?: number; // Legacy field
}

export interface ShipStationDimensions {
  length: number;
  width: number;
  height: number;
  units: 'inches' | 'centimeters';
}

export interface ShipStationInsuranceOptions {
  provider?: 'shipsurance' | 'carrier' | 'provider';
  insureShipment: boolean;
  insuredValue: number;
}

export interface ShipStationInternationalOptions {
  contents?: 'merchandise' | 'documents' | 'gift' | 'returned_goods' | 'sample';
  customsItems?: ShipStationCustomsItem[];
  nonDelivery?: 'return_to_sender' | 'treat_as_abandoned';
}

export interface ShipStationCustomsItem {
  customsItemId?: string;
  description: string;
  quantity: number;
  value: number;
  harmonizedTariffCode?: string;
  countryOfOrigin: string;
}

export interface ShipStationAdvancedOptions {
  warehouseId?: number;
  nonMachinable?: boolean;
  saturdayDelivery?: boolean;
  containsAlcohol?: boolean;
  storeId?: number;
  customField1?: string;
  customField2?: string;
  customField3?: string;
  source?: string;
  mergedOrSplit?: boolean;
  mergedIds?: number[];
  parentId?: number;
  billToParty?: 'my_account' | 'recipient' | 'third_party';
  billToAccount?: string;
  billToPostalCode?: string;
  billToCountryCode?: string;
}

export interface ShipStationShipment {
  shipmentId: number;
  orderId: number;
  orderKey?: string;
  userId?: string;
  orderNumber: string;
  createDate: string;
  shipDate: string;
  shipmentCost: number;
  insuranceCost: number;
  trackingNumber: string;
  isReturnLabel: boolean;
  batchNumber?: string;
  carrierCode: string;
  serviceCode: string;
  packageCode: string;
  confirmation?: string;
  warehouseId?: number;
  voided: boolean;
  voidDate?: string;
  marketplaceNotified: boolean;
  notifyErrorMessage?: string;
  shipTo: ShipStationAddress;
  weight: ShipStationWeight;
  dimensions?: ShipStationDimensions;
  insuranceOptions?: ShipStationInsuranceOptions;
  advancedOptions?: ShipStationAdvancedOptions;
  shipmentItems?: ShipStationShipmentItem[];
  labelData?: string;
  formData?: string;
}

export interface ShipStationShipmentItem {
  orderItemId: number;
  lineItemKey?: string;
  sku?: string;
  name: string;
  imageUrl?: string;
  weight?: ShipStationWeight;
  quantity: number;
  unitPrice?: number;
  warehouseLocation?: string;
  productId?: number;
  fulfillmentSku?: string;
}

export interface ShipStationRate {
  serviceName: string;
  serviceCode: string;
  shipmentCost: number;
  otherCost: number;
}

export interface ShipStationCarrier {
  name: string;
  code: string;
  accountNumber?: string;
  requiresFundedAccount: boolean;
  balance: number;
  nickname?: string;
  shippingProviderId?: number;
  primary?: boolean;
}

export interface ShipStationService {
  carrierCode: string;
  code: string;
  name: string;
  domestic: boolean;
  international: boolean;
}

export interface ShipStationStore {
  storeId: number;
  storeName: string;
  marketplaceId: number;
  marketplaceName: string;
  accountName?: string;
  email?: string;
  integrationUrl?: string;
  active: boolean;
  companyName?: string;
  phone?: string;
  publicEmail?: string;
  website?: string;
  refreshDate?: string;
  lastRefreshAttempt?: string;
  createDate: string;
  modifyDate: string;
  autoRefresh: boolean;
}

export interface ShipStationWebhook {
  webhookId: number;
  name: string;
  event: string;
  hookUrl: string;
  storeId?: number;
  active: boolean;
  webHookLogs?: ShipStationWebhookLog[];
}

export interface ShipStationWebhookLog {
  requestSent: string;
  responseReceived: string;
  statusCode: number;
}

// ============================================================================
// SHIPSTATION PROVIDER IMPLEMENTATION
// ============================================================================

/**
 * ShipStation shipping provider implementation
 */
export class ShipStationProvider implements ShippingProvider {
  readonly providerId = 'shipstation';
  readonly providerName = 'ShipStation';

  readonly capabilities: ProviderCapabilities = {
    carriers: [
      'usps',
      'ups',
      'fedex',
      'dhl',
      'dhl_ecommerce',
      'ups_mail_innovations',
      'globalpost',
      'canada_post',
      'australia_post',
      'royal_mail',
      'ontrac',
      'amazon_buy_shipping',
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
    maxParcelsPerShipment: 1,
  };

  private baseUrl: string;
  private authHeader: string;
  private initialized = false;
  private carriers: ShipStationCarrier[] = [];
  private config: ShipStationConfig;

  constructor(config: ShipStationConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://ssapi.shipstation.com';
    this.authHeader = `Basic ${btoa(`${config.apiKey}:${config.apiSecret}`)}`;
  }

  /**
   * Initialize the provider
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Verify credentials by fetching carriers
      this.carriers = await this.listCarriers();
      this.initialized = true;
      console.log(`[ShipStation] Initialized with ${this.carriers.length} carriers`);
    } catch (error) {
      throw new ShippingAuthError(this.providerId, 'Failed to initialize ShipStation');
    }
  }

  /**
   * Make API request to ShipStation
   */
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      'Authorization': this.authHeader,
      'Content-Type': 'application/json',
    };

    if (this.config.partnerApiKey) {
      headers['x-partner'] = this.config.partnerApiKey;
    }

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

      try {
        const errorJson = JSON.parse(errorBody);
        errorMessage = errorJson.Message || errorJson.message || errorBody;
      } catch {
        errorMessage = errorBody;
      }

      if (response.status === 401) {
        throw new ShippingAuthError(this.providerId, errorMessage);
      }

      if (response.status === 404) {
        throw new ShippingNotFoundError(this.providerId, 'resource', endpoint, errorMessage);
      }

      throw new ShippingProviderError(
        errorMessage,
        `HTTP_${response.status}`,
        this.providerId
      );
    }

    // Handle empty response
    const text = await response.text();
    if (!text) return {} as T;

    return JSON.parse(text) as T;
  }

  // ============================================================================
  // CARRIER METHODS
  // ============================================================================

  /**
   * List available carriers
   */
  async listCarriers(): Promise<ShipStationCarrier[]> {
    return this.request<ShipStationCarrier[]>('GET', '/carriers');
  }

  /**
   * List carrier services
   */
  async listServices(carrierCode: string): Promise<ShipStationService[]> {
    return this.request<ShipStationService[]>('GET', `/carriers/listservices?carrierCode=${carrierCode}`);
  }

  /**
   * List carrier packages
   */
  async listPackages(carrierCode: string): Promise<Array<{ carrierCode: string; code: string; name: string }>> {
    return this.request('GET', `/carriers/listpackages?carrierCode=${carrierCode}`);
  }

  // ============================================================================
  // ORDER METHODS
  // ============================================================================

  /**
   * Get orders from ShipStation
   */
  async getOrders(params: {
    orderStatus?: ShipStationOrderStatus;
    orderNumber?: string;
    orderDateStart?: string;
    orderDateEnd?: string;
    modifyDateStart?: string;
    modifyDateEnd?: string;
    storeId?: number;
    page?: number;
    pageSize?: number;
  } = {}): Promise<{ orders: ShipStationOrder[]; total: number; page: number; pages: number }> {
    const queryParams = new URLSearchParams();

    if (params.orderStatus) queryParams.set('orderStatus', params.orderStatus);
    if (params.orderNumber) queryParams.set('orderNumber', params.orderNumber);
    if (params.orderDateStart) queryParams.set('orderDateStart', params.orderDateStart);
    if (params.orderDateEnd) queryParams.set('orderDateEnd', params.orderDateEnd);
    if (params.modifyDateStart) queryParams.set('modifyDateStart', params.modifyDateStart);
    if (params.modifyDateEnd) queryParams.set('modifyDateEnd', params.modifyDateEnd);
    if (params.storeId) queryParams.set('storeId', params.storeId.toString());
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.pageSize) queryParams.set('pageSize', params.pageSize.toString());

    const query = queryParams.toString();
    return this.request('GET', `/orders${query ? `?${query}` : ''}`);
  }

  /**
   * Get single order by ID
   */
  async getOrder(orderId: number): Promise<ShipStationOrder> {
    return this.request<ShipStationOrder>('GET', `/orders/${orderId}`);
  }

  /**
   * Create or update an order
   */
  async createOrUpdateOrder(order: Partial<ShipStationOrder>): Promise<ShipStationOrder> {
    return this.request<ShipStationOrder>('POST', '/orders/createorder', order);
  }

  /**
   * Create/update multiple orders
   */
  async createOrUpdateOrders(orders: Partial<ShipStationOrder>[]): Promise<{
    hasErrors: boolean;
    results: Array<{
      orderId: number;
      orderNumber: string;
      orderKey: string;
      success: boolean;
      errorMessage?: string;
    }>;
  }> {
    return this.request('POST', '/orders/createorders', orders);
  }

  /**
   * Delete an order
   */
  async deleteOrder(orderId: number): Promise<{ success: boolean; message: string }> {
    return this.request('DELETE', `/orders/${orderId}`);
  }

  /**
   * Hold an order until date
   */
  async holdOrderUntil(orderId: number, holdUntilDate: string): Promise<{ success: boolean; message: string }> {
    return this.request('POST', '/orders/holduntil', { orderId, holdUntilDate });
  }

  /**
   * Restore an order from hold
   */
  async restoreFromHold(orderId: number): Promise<{ success: boolean; message: string }> {
    return this.request('POST', '/orders/restorefromhold', { orderId });
  }

  /**
   * Mark an order as shipped
   */
  async markOrderShipped(params: {
    orderId: number;
    carrierCode: string;
    shipDate?: string;
    trackingNumber?: string;
    notifyCustomer?: boolean;
    notifySalesChannel?: boolean;
  }): Promise<{ orderId: number; orderNumber: string }> {
    return this.request('POST', '/orders/markasshipped', params);
  }

  // ============================================================================
  // RATE SHOPPING
  // ============================================================================

  /**
   * Get shipping rates
   */
  async getRates(request: RateRequest): Promise<ShippingRate[]> {
    const shipStationRequest = {
      carrierCode: request.carriers?.[0],
      serviceCode: request.serviceLevels?.[0],
      packageCode: 'package',
      fromPostalCode: request.fromAddress.postalCode,
      toState: request.toAddress.state,
      toCountry: request.toAddress.country,
      toPostalCode: request.toAddress.postalCode,
      toCity: request.toAddress.city,
      weight: this.convertToShipStationWeight(request.parcels[0]),
      dimensions: this.convertToShipStationDimensions(request.parcels[0]),
      confirmation: request.signatureRequired ? 'signature' : 'none',
      residential: request.toAddress.residential ?? true,
    };

    const rates = await this.request<ShipStationRate[]>('POST', '/shipments/getrates', shipStationRequest);

    return rates.map((rate, index) => this.convertToShippingRate(rate, request.carriers?.[0] || 'usps', index));
  }

  private convertToShipStationWeight(parcel: Parcel): ShipStationWeight {
    let value = parcel.weight;
    let units: 'ounces' | 'pounds' | 'grams' = 'ounces';

    if (parcel.weightUnit === 'lb') {
      units = 'pounds';
    } else if (parcel.weightUnit === 'g') {
      units = 'grams';
    } else if (parcel.weightUnit === 'kg') {
      value = parcel.weight * 1000;
      units = 'grams';
    }

    return { value, units };
  }

  private convertToShipStationDimensions(parcel: Parcel): ShipStationDimensions {
    return {
      length: parcel.length,
      width: parcel.width,
      height: parcel.height,
      units: parcel.distanceUnit === 'cm' ? 'centimeters' : 'inches',
    };
  }

  private convertToShippingRate(rate: ShipStationRate, carrier: string, index: number): ShippingRate {
    return {
      rateId: `ss_rate_${index}_${rate.serviceCode}`,
      providerRateId: rate.serviceCode,
      carrier: normalizeCarrierCode(carrier),
      carrierName: carrier.toUpperCase(),
      serviceLevel: rate.serviceCode,
      serviceLevelName: rate.serviceName,
      amount: rate.shipmentCost + rate.otherCost,
      currency: 'USD',
      breakdown: {
        baseRate: rate.shipmentCost,
        otherSurcharges: rate.otherCost > 0 ? [{ name: 'Other', amount: rate.otherCost }] : undefined,
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
    // First, create or find the order
    const orderData: Partial<ShipStationOrder> = {
      orderNumber: request.orderId || `NEXUS_${Date.now()}`,
      orderDate: new Date().toISOString(),
      orderStatus: 'awaiting_shipment',
      shipTo: this.convertToShipStationAddress(request.toAddress),
      billTo: this.convertToShipStationAddress(request.fromAddress),
      items: [{
        name: 'Shipment',
        quantity: 1,
        unitPrice: 0,
        adjustment: false,
      }],
      orderTotal: 0,
      amountPaid: 0,
      taxAmount: 0,
      shippingAmount: 0,
      gift: false,
      carrierCode: request.carrier,
      serviceCode: request.serviceLevel,
      weight: this.convertToShipStationWeight(request.parcels[0]),
      dimensions: this.convertToShipStationDimensions(request.parcels[0]),
      confirmation: request.signatureRequired
        ? (request.signatureType === 'adult' ? 'adult_signature' : 'signature')
        : 'none',
      advancedOptions: {
        saturdayDelivery: request.saturdayDelivery,
      },
    };

    if (request.insuranceAmount) {
      orderData.insuranceOptions = {
        insureShipment: true,
        insuredValue: request.insuranceAmount,
        provider: 'shipsurance',
      };
    }

    if (request.customs) {
      orderData.internationalOptions = {
        contents: request.customs.contentsType as ShipStationInternationalOptions['contents'],
        nonDelivery: request.customs.nonDeliveryOption === 'return' ? 'return_to_sender' : 'treat_as_abandoned',
        customsItems: request.customs.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          value: item.value,
          harmonizedTariffCode: item.hsCode,
          countryOfOrigin: item.originCountry,
        })),
      };
    }

    const order = await this.createOrUpdateOrder(orderData);

    // Create the label
    const labelResponse = await this.request<{
      shipmentId: number;
      shipmentCost: number;
      insuranceCost: number;
      trackingNumber: string;
      labelData: string;
      formData?: string;
    }>('POST', '/orders/createlabelfororder', {
      orderId: order.orderId,
      carrierCode: request.carrier,
      serviceCode: request.serviceLevel,
      packageCode: 'package',
      confirmation: request.signatureRequired
        ? (request.signatureType === 'adult' ? 'adult_signature' : 'signature')
        : 'none',
      shipDate: request.shipDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
      weight: this.convertToShipStationWeight(request.parcels[0]),
      dimensions: this.convertToShipStationDimensions(request.parcels[0]),
      testLabel: this.config.testMode,
    });

    return {
      labelId: `ss_label_${labelResponse.shipmentId}`,
      providerLabelId: labelResponse.shipmentId.toString(),
      trackingNumber: labelResponse.trackingNumber,
      carrier: request.carrier,
      carrierName: request.carrier.toUpperCase(),
      serviceLevel: request.serviceLevel,
      serviceLevelName: request.serviceLevel,
      labelUrl: '', // ShipStation returns base64 data
      labelBase64: labelResponse.labelData,
      labelFormat: 'pdf',
      trackingUrl: this.getTrackingUrl(request.carrier, labelResponse.trackingNumber),
      cost: labelResponse.shipmentCost,
      currency: 'USD',
      insuranceCost: labelResponse.insuranceCost,
      shipDate: request.shipDate || new Date(),
      fromAddress: request.fromAddress,
      toAddress: request.toAddress,
      parcels: request.parcels,
      createdAt: new Date(),
      status: 'valid',
      customsForms: labelResponse.formData ? [{
        type: 'commercial_invoice',
        url: '',
        base64: labelResponse.formData,
      }] : undefined,
      metadata: request.metadata,
      orderId: request.orderId,
    };
  }

  /**
   * Create multiple labels
   */
  async createLabels(requests: LabelRequest[]): Promise<ShippingLabel[]> {
    const results: ShippingLabel[] = [];

    for (const request of requests) {
      try {
        const label = await this.createLabel(request);
        results.push(label);
      } catch (error) {
        console.error(`[ShipStation] Failed to create label for order ${request.orderId}:`, error);
        // Continue with other labels
      }
    }

    return results;
  }

  private convertToShipStationAddress(address: ShippingAddress): ShipStationAddress {
    return {
      name: address.name,
      company: address.company,
      street1: address.street1,
      street2: address.street2,
      street3: address.street3,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      phone: address.phone,
      residential: address.residential,
    };
  }

  private getTrackingUrl(carrier: string, trackingNumber: string): string {
    const urls: Record<string, string> = {
      usps: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
      ups: `https://www.ups.com/track?tracknum=${trackingNumber}`,
      fedex: `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
      dhl: `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`,
    };

    return urls[normalizeCarrierCode(carrier)] || `https://shipstation.com/track/${trackingNumber}`;
  }

  // ============================================================================
  // TRACKING
  // ============================================================================

  /**
   * Get tracking information
   */
  async track(trackingNumber: string, _carrier?: string): Promise<TrackingInfo> {
    void _carrier // ShipStation doesn't filter by carrier
    // ShipStation doesn't have a direct tracking API - we get it from shipments
    const shipments = await this.request<{
      shipments: ShipStationShipment[];
      total: number;
      page: number;
      pages: number;
    }>('GET', `/shipments?trackingNumber=${trackingNumber}`);

    if (shipments.shipments.length === 0) {
      throw new ShippingNotFoundError(this.providerId, 'tracking', trackingNumber);
    }

    const shipment = shipments.shipments[0];

    // ShipStation provides limited tracking - mainly shipment status
    const status = this.getTrackingStatusFromShipment(shipment);

    return {
      trackingNumber,
      carrier: normalizeCarrierCode(shipment.carrierCode),
      carrierName: shipment.carrierCode.toUpperCase(),
      status,
      statusDescription: this.getStatusDescription(status),
      events: [{
        timestamp: new Date(shipment.shipDate),
        status: 'in_transit',
        description: 'Shipment created',
      }],
      destinationAddress: {
        city: shipment.shipTo.city,
        state: shipment.shipTo.state,
        postalCode: shipment.shipTo.postalCode,
        country: shipment.shipTo.country,
      },
      serviceLevel: shipment.serviceCode,
      trackingUrl: this.getTrackingUrl(shipment.carrierCode, trackingNumber),
      lastUpdated: new Date(shipment.createDate),
    };
  }

  private getTrackingStatusFromShipment(shipment: ShipStationShipment): TrackingStatus {
    if (shipment.voided) return 'cancelled';
    return 'in_transit';
  }

  private getStatusDescription(status: TrackingStatus): string {
    const descriptions: Record<TrackingStatus, string> = {
      unknown: 'Status unknown',
      pre_transit: 'Label created, awaiting carrier pickup',
      in_transit: 'Package in transit',
      out_for_delivery: 'Out for delivery',
      delivered: 'Package delivered',
      available_for_pickup: 'Available for pickup',
      return_to_sender: 'Returning to sender',
      failure: 'Delivery failed',
      cancelled: 'Shipment cancelled',
    };

    return descriptions[status];
  }

  // ============================================================================
  // VOID LABELS
  // ============================================================================

  /**
   * Void a shipping label
   */
  async voidLabel(labelId: string): Promise<VoidResult> {
    const shipmentId = labelId.replace('ss_label_', '');

    try {
      const result = await this.request<{ approved: boolean; message: string }>(
        'POST',
        '/shipments/voidlabel',
        { shipmentId: parseInt(shipmentId) }
      );

      return {
        success: result.approved,
        message: result.message,
        voidedAt: result.approved ? new Date() : undefined,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to void label',
      };
    }
  }

  // ============================================================================
  // ADDRESS VALIDATION
  // ============================================================================

  /**
   * Validate an address
   */
  async validateAddress(address: ShippingAddress): Promise<AddressValidationResult> {
    const ssAddress = this.convertToShipStationAddress(address);

    try {
      const result = await this.request<{
        Address: ShipStationAddress;
        originalAddress: ShipStationAddress;
        valid: boolean;
        messages?: string[];
      }>('POST', '/addresses/validate', ssAddress);

      return {
        isValid: result.valid,
        validatedAddress: result.valid ? this.convertFromShipStationAddress(result.Address) : undefined,
        messages: (result.messages || []).map(msg => ({
          type: result.valid ? 'info' : 'warning',
          code: 'VALIDATION',
          message: msg,
        })),
        classification: {
          isResidential: result.Address?.residential ?? true,
          isCommercial: !result.Address?.residential,
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

  private convertFromShipStationAddress(ssAddress: ShipStationAddress): ShippingAddress {
    return {
      name: ssAddress.name,
      company: ssAddress.company,
      street1: ssAddress.street1,
      street2: ssAddress.street2,
      street3: ssAddress.street3,
      city: ssAddress.city,
      state: ssAddress.state,
      postalCode: ssAddress.postalCode,
      country: ssAddress.country,
      phone: ssAddress.phone,
      residential: ssAddress.residential,
    };
  }

  // ============================================================================
  // CARRIER ACCOUNTS
  // ============================================================================

  /**
   * Get carrier accounts
   */
  async getCarrierAccounts(): Promise<CarrierAccount[]> {
    const carriers = await this.listCarriers();

    return carriers.map(carrier => ({
      accountId: carrier.code,
      carrier: normalizeCarrierCode(carrier.code),
      nickname: carrier.nickname || carrier.name,
      active: true,
      credentials: carrier.accountNumber ? { accountNumber: carrier.accountNumber } : undefined,
    }));
  }

  // ============================================================================
  // WEBHOOKS
  // ============================================================================

  /**
   * Register tracking webhook
   */
  async registerTrackingWebhook(url: string, events?: string[]): Promise<{ webhookId: string }> {
    // ShipStation supports: SHIP_NOTIFY, ORDER_NOTIFY, ITEM_ORDER_NOTIFY, etc.
    const event = events?.[0] || 'SHIP_NOTIFY';

    const result = await this.request<ShipStationWebhook>('POST', '/webhooks/subscribe', {
      target_url: url,
      event,
    });

    return { webhookId: result.webhookId.toString() };
  }

  /**
   * List webhooks
   */
  async listWebhooks(): Promise<ShipStationWebhook[]> {
    const result = await this.request<{ webhooks: ShipStationWebhook[] }>('GET', '/webhooks');
    return result.webhooks;
  }

  /**
   * Unsubscribe from webhook
   */
  async unsubscribeWebhook(webhookId: string): Promise<boolean> {
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
      resource_url?: string;
      resource_type?: string;
    };

    if (!data.resource_url) {
      return null;
    }

    // ShipStation webhooks provide a resource URL to fetch actual data
    // This is a simplified version - in production you'd fetch the resource
    return {
      eventId: `ss_webhook_${Date.now()}`,
      eventType: 'tracking.updated',
      trackingNumber: '', // Would need to fetch from resource_url
      carrier: '',
      status: 'in_transit',
      statusDescription: 'Shipment notification received',
      timestamp: new Date(),
      rawPayload: payload,
    };
  }

  // ============================================================================
  // STORE METHODS
  // ============================================================================

  /**
   * List stores
   */
  async listStores(): Promise<ShipStationStore[]> {
    return this.request<ShipStationStore[]>('GET', '/stores');
  }

  /**
   * Get store by ID
   */
  async getStore(storeId: number): Promise<ShipStationStore> {
    return this.request<ShipStationStore>('GET', `/stores/${storeId}`);
  }

  /**
   * Refresh store data
   */
  async refreshStore(storeId: number, refreshDate?: string): Promise<{ success: boolean; message: string }> {
    return this.request('POST', '/stores/refreshstore', {
      storeId,
      refreshDate: refreshDate || new Date().toISOString(),
    });
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a ShipStation provider instance
 */
export function createShipStationProvider(config: ShipStationConfig): ShipStationProvider {
  return new ShipStationProvider(config);
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default ShipStationProvider;
