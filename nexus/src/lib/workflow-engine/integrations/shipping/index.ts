/**
 * Shipping Provider Integrations
 *
 * Unified shipping integration for multi-carrier rate shopping, label generation,
 * tracking, and address validation.
 *
 * Supported Providers:
 * - ShipStation: Full-featured shipping platform with order management
 * - Shippo: Multi-carrier API with excellent rate shopping
 *
 * @module shipping
 */

// ============================================================================
// BASE TYPES AND INTERFACES
// ============================================================================

export {
  // Address Types
  type ShippingAddress,
  type AddressValidationResult,
  type AddressValidationMessage,

  // Parcel Types
  type Parcel,
  type CustomsDeclaration,
  type CustomsItem,

  // Rate Types
  type RateRequest,
  type ShippingRate,
  type RateBreakdown,
  type RateAttributes,

  // Label Types
  type LabelRequest,
  type ShippingLabel,
  type CustomsForm,
  type VoidResult,

  // Tracking Types
  type TrackingInfo,
  type TrackingStatus,
  type TrackingEvent,
  type TrackingWebhookEvent,

  // Provider Types
  type ShippingProvider,
  type ShippingProviderConfig,
  type ProviderCapabilities,
  type CarrierAccount,

  // Error Classes
  ShippingProviderError,
  ShippingAuthError,
  ShippingRateLimitError,
  ShippingValidationError,
  ShippingNotFoundError,
  ShippingCarrierError,

  // Helper Functions
  normalizeCarrierCode,
  normalizeTrackingStatus,
  calculateDimWeight,
  getBillableWeight,
  convertWeight,
  formatAddress,
  isInternationalAddress,
} from './shipping-provider';

// ============================================================================
// SHIPSTATION INTEGRATION
// ============================================================================

export {
  // Provider
  ShipStationProvider,
  createShipStationProvider,

  // Config Type
  type ShipStationConfig,

  // ShipStation-Specific Types
  type ShipStationOrder,
  type ShipStationOrderStatus,
  type ShipStationAddress,
  type ShipStationOrderItem,
  type ShipStationWeight,
  type ShipStationDimensions,
  type ShipStationInsuranceOptions,
  type ShipStationInternationalOptions,
  type ShipStationCustomsItem,
  type ShipStationAdvancedOptions,
  type ShipStationShipment,
  type ShipStationShipmentItem,
  type ShipStationRate,
  type ShipStationCarrier,
  type ShipStationService,
  type ShipStationStore,
  type ShipStationWebhook,
  type ShipStationWebhookLog,
} from './shipstation-provider';

// ============================================================================
// SHIPPO INTEGRATION
// ============================================================================

export {
  // Provider
  ShippoProvider,
  createShippoProvider,

  // Config Type
  type ShippoConfig,

  // Shippo-Specific Types
  type ShippoAddress,
  type ShippoValidationResults,
  type ShippoValidationMessage,
  type ShippoParcel,
  type ShippoShipment,
  type ShippoShipmentExtra,
  type ShippoRate,
  type ShippoTransaction,
  type ShippoTrackingStatus,
  type ShippoTrackingStatusCode,
  type ShippoCustomsDeclaration,
  type ShippoCustomsItem,
  type ShippoCarrierAccount,
  type ShippoWebhook,
  type ShippoRefund,
} from './shippo-provider';

// ============================================================================
// SHIPPING MANAGER
// ============================================================================

import type {
  ShippingProvider,
  RateRequest,
  ShippingRate,
  LabelRequest,
  ShippingLabel,
  TrackingInfo,
  VoidResult,
  ShippingAddress,
  AddressValidationResult,
  CarrierAccount,
} from './shipping-provider';

import { ShipStationProvider, type ShipStationConfig } from './shipstation-provider';
import { ShippoProvider, type ShippoConfig } from './shippo-provider';

/**
 * Supported shipping providers
 */
export type ShippingProviderType = 'shipstation' | 'shippo';

/**
 * Combined config for any provider
 */
export type AnyShippingProviderConfig =
  | ({ provider: 'shipstation' } & ShipStationConfig)
  | ({ provider: 'shippo' } & ShippoConfig);

/**
 * Rate comparison result
 */
export interface RateComparisonResult {
  /** All rates from all providers, sorted by price */
  rates: Array<ShippingRate & { provider: string }>;
  /** Cheapest rate */
  cheapest: (ShippingRate & { provider: string }) | null;
  /** Fastest rate */
  fastest: (ShippingRate & { provider: string }) | null;
  /** Best value (price/transit ratio) */
  bestValue: (ShippingRate & { provider: string }) | null;
  /** Errors by provider */
  errors: Record<string, string>;
}

/**
 * Shipping Manager - Unified interface for multiple shipping providers
 */
export class ShippingManager {
  private providers: Map<string, ShippingProvider> = new Map();

  /**
   * Register a shipping provider
   */
  registerProvider(id: string, provider: ShippingProvider): void {
    this.providers.set(id, provider);
    console.log(`[ShippingManager] Registered provider: ${id} (${provider.providerName})`);
  }

  /**
   * Create and register a provider from config
   */
  async addProvider(id: string, config: AnyShippingProviderConfig): Promise<ShippingProvider> {
    let provider: ShippingProvider;

    switch (config.provider) {
      case 'shipstation':
        provider = new ShipStationProvider(config);
        break;
      case 'shippo':
        provider = new ShippoProvider(config);
        break;
      default:
        throw new Error(`Unknown provider type: ${(config as { provider: string }).provider}`);
    }

    await provider.initialize();
    this.registerProvider(id, provider);
    return provider;
  }

  /**
   * Get a registered provider
   */
  getProvider(id: string): ShippingProvider | undefined {
    return this.providers.get(id);
  }

  /**
   * Get all registered providers
   */
  getAllProviders(): Map<string, ShippingProvider> {
    return new Map(this.providers);
  }

  /**
   * Remove a provider
   */
  removeProvider(id: string): boolean {
    return this.providers.delete(id);
  }

  /**
   * Compare rates across all registered providers
   */
  async compareRates(request: RateRequest): Promise<RateComparisonResult> {
    const allRates: Array<ShippingRate & { provider: string }> = [];
    const errors: Record<string, string> = {};

    // Fetch rates from all providers in parallel
    const ratePromises = Array.from(this.providers.entries()).map(async ([id, provider]) => {
      try {
        const rates = await provider.getRates(request);
        return rates.map(rate => ({ ...rate, provider: id }));
      } catch (error) {
        errors[id] = error instanceof Error ? error.message : 'Unknown error';
        return [];
      }
    });

    const results = await Promise.all(ratePromises);
    results.forEach(rates => allRates.push(...rates));

    // Sort by price
    allRates.sort((a, b) => a.amount - b.amount);

    // Find cheapest
    const cheapest = allRates[0] || null;

    // Find fastest (lowest transit days)
    const ratesWithTransit = allRates.filter(r => r.transitDays !== undefined);
    ratesWithTransit.sort((a, b) => (a.transitDays || 999) - (b.transitDays || 999));
    const fastest = ratesWithTransit[0] || null;

    // Find best value (price per transit day)
    const ratesWithValue = allRates
      .filter(r => r.transitDays && r.transitDays > 0)
      .map(r => ({
        ...r,
        valueScore: r.amount / (r.transitDays || 1),
      }))
      .sort((a, b) => a.valueScore - b.valueScore);
    const bestValue = ratesWithValue[0] || cheapest;

    return {
      rates: allRates,
      cheapest,
      fastest,
      bestValue,
      errors,
    };
  }

  /**
   * Create a label using the specified provider
   */
  async createLabel(providerId: string, request: LabelRequest): Promise<ShippingLabel> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider not found: ${providerId}`);
    }
    return provider.createLabel(request);
  }

  /**
   * Create a label using the cheapest rate across all providers
   */
  async createCheapestLabel(request: LabelRequest & { rateRequest: RateRequest }): Promise<ShippingLabel> {
    const comparison = await this.compareRates(request.rateRequest);

    if (!comparison.cheapest) {
      throw new Error('No rates available from any provider');
    }

    const provider = this.providers.get(comparison.cheapest.provider);
    if (!provider) {
      throw new Error(`Provider not found: ${comparison.cheapest.provider}`);
    }

    return provider.createLabel({
      ...request,
      rateId: comparison.cheapest.rateId,
      carrier: comparison.cheapest.carrier,
      serviceLevel: comparison.cheapest.serviceLevel,
    });
  }

  /**
   * Track a shipment
   */
  async track(
    trackingNumber: string,
    options?: { providerId?: string; carrier?: string }
  ): Promise<TrackingInfo> {
    // If provider specified, use it directly
    if (options?.providerId) {
      const provider = this.providers.get(options.providerId);
      if (!provider) {
        throw new Error(`Provider not found: ${options.providerId}`);
      }
      return provider.track(trackingNumber, options.carrier);
    }

    // Otherwise try all providers
    const errors: string[] = [];

    for (const [id, provider] of Array.from(this.providers.entries())) {
      try {
        return await provider.track(trackingNumber, options?.carrier);
      } catch (error) {
        errors.push(`${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    throw new Error(`Could not track shipment. Errors: ${errors.join('; ')}`);
  }

  /**
   * Void a label
   */
  async voidLabel(providerId: string, labelId: string): Promise<VoidResult> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider not found: ${providerId}`);
    }
    return provider.voidLabel(labelId);
  }

  /**
   * Validate an address using all providers
   */
  async validateAddress(address: ShippingAddress): Promise<{
    results: Record<string, AddressValidationResult>;
    isValid: boolean;
    bestValidation: AddressValidationResult | null;
  }> {
    const results: Record<string, AddressValidationResult> = {};
    let validCount = 0;
    let bestValidation: AddressValidationResult | null = null;

    for (const [id, provider] of Array.from(this.providers.entries())) {
      if (provider.validateAddress) {
        try {
          const result = await provider.validateAddress(address);
          results[id] = result;

          if (result.isValid) {
            validCount++;
            if (!bestValidation || (result.validatedAddress && !bestValidation.validatedAddress)) {
              bestValidation = result;
            }
          }
        } catch (error) {
          results[id] = {
            isValid: false,
            messages: [{
              type: 'error',
              code: 'VALIDATION_ERROR',
              message: error instanceof Error ? error.message : 'Validation failed',
            }],
          };
        }
      }
    }

    return {
      results,
      isValid: validCount > 0,
      bestValidation,
    };
  }

  /**
   * Get carrier accounts from all providers
   */
  async getAllCarrierAccounts(): Promise<Record<string, CarrierAccount[]>> {
    const accounts: Record<string, CarrierAccount[]> = {};

    for (const [id, provider] of Array.from(this.providers.entries())) {
      if (provider.getCarrierAccounts) {
        try {
          accounts[id] = await provider.getCarrierAccounts();
        } catch (error) {
          console.error(`[ShippingManager] Failed to get carrier accounts from ${id}:`, error);
          accounts[id] = [];
        }
      }
    }

    return accounts;
  }
}

/**
 * Default shipping manager instance
 */
export const shippingManager = new ShippingManager();

// ============================================================================
// QUICK SETUP HELPERS
// ============================================================================

/**
 * Quick setup for ShipStation
 */
export async function setupShipStation(
  manager: ShippingManager,
  config: ShipStationConfig,
  id: string = 'shipstation'
): Promise<ShipStationProvider> {
  const provider = new ShipStationProvider(config);
  await provider.initialize();
  manager.registerProvider(id, provider);
  return provider;
}

/**
 * Quick setup for Shippo
 */
export async function setupShippo(
  manager: ShippingManager,
  config: ShippoConfig,
  id: string = 'shippo'
): Promise<ShippoProvider> {
  const provider = new ShippoProvider(config);
  await provider.initialize();
  manager.registerProvider(id, provider);
  return provider;
}

// ============================================================================
// INTEGRATION METADATA
// ============================================================================

/**
 * Shipping integration metadata for registry
 */
export const SHIPPING_INTEGRATIONS = [
  {
    id: 'shipstation',
    name: 'ShipStation',
    description: 'Complete shipping platform with order management, multi-carrier support, and automation',
    features: [
      'Multi-carrier rate shopping',
      'Order import/export',
      'Batch label generation',
      'Tracking updates',
      'Store integrations',
      'Automation rules',
    ],
    carriers: [
      'USPS', 'UPS', 'FedEx', 'DHL', 'DHL eCommerce',
      'Canada Post', 'Australia Post', 'Royal Mail', 'OnTrac',
    ],
    pricing: 'From $9.99/month',
    documentationUrl: 'https://www.shipstation.com/docs/api/',
  },
  {
    id: 'shippo',
    name: 'Shippo',
    description: 'Multi-carrier shipping API with excellent rate comparison and address validation',
    features: [
      'Multi-carrier rate comparison',
      'Discounted USPS rates',
      'Address validation',
      'Tracking webhooks',
      'Return labels',
      'Customs forms',
    ],
    carriers: [
      'USPS', 'UPS', 'FedEx', 'DHL Express', 'DHL eCommerce',
      'Canada Post', 'Purolator', 'Australia Post', 'Royal Mail',
      'Deutsche Post', 'DPD', 'GLS', 'OnTrac', 'LaserShip',
    ],
    pricing: 'Pay per label (no monthly fee)',
    documentationUrl: 'https://docs.goshippo.com/',
  },
];

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  ShippingManager,
  shippingManager,
  ShipStationProvider,
  ShippoProvider,
  setupShipStation,
  setupShippo,
  SHIPPING_INTEGRATIONS,
};
