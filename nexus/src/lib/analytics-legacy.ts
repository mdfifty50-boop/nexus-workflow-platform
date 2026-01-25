/**
 * Analytics Infrastructure
 *
 * Provider-agnostic analytics tracking system that can plug into
 * Mixpanel, Amplitude, PostHog, or any custom analytics provider.
 */

// =============================================================================
// Types and Interfaces
// =============================================================================

export type AnalyticsProvider = 'mixpanel' | 'amplitude' | 'posthog' | 'custom' | 'console';

export interface AnalyticsConfig {
  provider: AnalyticsProvider;
  apiKey?: string;
  apiEndpoint?: string;
  debug?: boolean;
  enabled?: boolean;
  // Provider-specific options
  options?: {
    mixpanel?: {
      token: string;
      trackPageViews?: boolean;
    };
    amplitude?: {
      apiKey: string;
      serverUrl?: string;
    };
    posthog?: {
      apiKey: string;
      apiHost?: string;
    };
    custom?: {
      endpoint: string;
      headers?: Record<string, string>;
    };
  };
}

export interface UserProperties {
  userId: string;
  email?: string;
  name?: string;
  plan?: 'free' | 'pro' | 'enterprise';
  createdAt?: string;
  [key: string]: unknown;
}

export interface EventProperties {
  [key: string]: string | number | boolean | string[] | undefined;
}

export interface PageViewProperties {
  path: string;
  title?: string;
  referrer?: string;
  [key: string]: string | undefined;
}

export interface ConversionProperties {
  funnelName: string;
  stepNumber: number;
  stepName: string;
  value?: number;
  currency?: string;
  [key: string]: string | number | undefined;
}

// =============================================================================
// Event Definitions - All trackable events in the application
// =============================================================================

export const ANALYTICS_EVENTS = {
  // Workflow Events
  WORKFLOW_CREATED: 'workflow_created',
  WORKFLOW_EXECUTED: 'workflow_executed',
  WORKFLOW_SAVED: 'workflow_saved',
  WORKFLOW_DELETED: 'workflow_deleted',
  WORKFLOW_SHARED: 'workflow_shared',
  WORKFLOW_DUPLICATED: 'workflow_duplicated',
  WORKFLOW_EXPORTED: 'workflow_exported',
  WORKFLOW_IMPORTED: 'workflow_imported',

  // Node Events
  NODE_ADDED: 'node_added',
  NODE_REMOVED: 'node_removed',
  NODE_CONFIGURED: 'node_configured',
  NODE_CONNECTED: 'node_connected',

  // User Events
  SIGNUP_STARTED: 'signup_started',
  SIGNUP_COMPLETED: 'signup_completed',
  LOGIN_COMPLETED: 'login_completed',
  LOGOUT_COMPLETED: 'logout_completed',
  PROFILE_UPDATED: 'profile_updated',
  SETTINGS_CHANGED: 'settings_changed',

  // Feature Usage
  VOICE_INPUT_USED: 'voice_input_used',
  VOICE_INPUT_SUCCESS: 'voice_input_success',
  VOICE_INPUT_FAILED: 'voice_input_failed',
  TEMPLATE_VIEWED: 'template_viewed',
  TEMPLATE_SELECTED: 'template_selected',
  TEMPLATE_CUSTOMIZED: 'template_customized',
  AI_SUGGESTION_SHOWN: 'ai_suggestion_shown',
  AI_SUGGESTION_ACCEPTED: 'ai_suggestion_accepted',
  AI_SUGGESTION_DISMISSED: 'ai_suggestion_dismissed',

  // Onboarding Events
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_STEP_COMPLETED: 'onboarding_step_completed',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  ONBOARDING_SKIPPED: 'onboarding_skipped',

  // Engagement Events
  DASHBOARD_VIEWED: 'dashboard_viewed',
  HELP_ACCESSED: 'help_accessed',
  DOCUMENTATION_VIEWED: 'documentation_viewed',
  FEEDBACK_SUBMITTED: 'feedback_submitted',
  SEARCH_PERFORMED: 'search_performed',

  // Integration Events
  INTEGRATION_CONNECTED: 'integration_connected',
  INTEGRATION_DISCONNECTED: 'integration_disconnected',
  INTEGRATION_AUTH_STARTED: 'integration_auth_started',
  INTEGRATION_AUTH_COMPLETED: 'integration_auth_completed',
  INTEGRATION_AUTH_FAILED: 'integration_auth_failed',

  // Achievement Events
  ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
  ACHIEVEMENT_VIEWED: 'achievement_viewed',

  // Error Events
  ERROR_OCCURRED: 'error_occurred',
  API_ERROR: 'api_error',
  VALIDATION_ERROR: 'validation_error',
} as const;

export type AnalyticsEventName = typeof ANALYTICS_EVENTS[keyof typeof ANALYTICS_EVENTS];

// =============================================================================
// Conversion Funnels
// =============================================================================

export const CONVERSION_FUNNELS = {
  SIGNUP: {
    name: 'signup_funnel',
    steps: [
      { number: 1, name: 'landing_page_viewed' },
      { number: 2, name: 'signup_cta_clicked' },
      { number: 3, name: 'signup_form_started' },
      { number: 4, name: 'signup_form_completed' },
      { number: 5, name: 'email_verified' },
      { number: 6, name: 'first_login' },
    ],
  },
  ONBOARDING: {
    name: 'onboarding_funnel',
    steps: [
      { number: 1, name: 'welcome_screen' },
      { number: 2, name: 'use_case_selected' },
      { number: 3, name: 'first_workflow_created' },
      { number: 4, name: 'first_execution' },
      { number: 5, name: 'onboarding_complete' },
    ],
  },
  WORKFLOW_CREATION: {
    name: 'workflow_creation_funnel',
    steps: [
      { number: 1, name: 'editor_opened' },
      { number: 2, name: 'first_node_added' },
      { number: 3, name: 'nodes_connected' },
      { number: 4, name: 'workflow_configured' },
      { number: 5, name: 'workflow_tested' },
      { number: 6, name: 'workflow_activated' },
    ],
  },
  UPGRADE: {
    name: 'upgrade_funnel',
    steps: [
      { number: 1, name: 'pricing_page_viewed' },
      { number: 2, name: 'plan_selected' },
      { number: 3, name: 'checkout_started' },
      { number: 4, name: 'payment_completed' },
      { number: 5, name: 'pro_features_accessed' },
    ],
  },
} as const;

// =============================================================================
// Analytics Provider Adapters
// =============================================================================

interface AnalyticsAdapter {
  initialize(config: AnalyticsConfig): void;
  identify(user: UserProperties): void;
  track(event: string, properties?: EventProperties): void;
  page(properties: PageViewProperties): void;
  reset(): void;
}

// Console adapter for development/debugging
const consoleAdapter: AnalyticsAdapter = {
  initialize(config) {
    console.log('[Analytics] Initialized with config:', config);
  },
  identify(user) {
    console.log('[Analytics] Identify user:', user);
  },
  track(event, properties) {
    console.log('[Analytics] Track event:', event, properties);
  },
  page(properties) {
    console.log('[Analytics] Page view:', properties);
  },
  reset() {
    console.log('[Analytics] Reset/logout');
  },
};

// Mixpanel adapter
const mixpanelAdapter: AnalyticsAdapter = {
  initialize(config) {
    const token = config.options?.mixpanel?.token || config.apiKey;
    if (!token) {
      console.warn('[Analytics] Mixpanel token not provided');
      return;
    }
    // In production, load Mixpanel SDK
    if (typeof window !== 'undefined' && (window as unknown as { mixpanel?: unknown }).mixpanel) {
      (window as unknown as { mixpanel: { init: (token: string) => void } }).mixpanel.init(token);
    }
  },
  identify(user) {
    if (typeof window !== 'undefined' && (window as unknown as { mixpanel?: unknown }).mixpanel) {
      const mp = window as unknown as { mixpanel: { identify: (id: string) => void; people: { set: (props: Record<string, unknown>) => void } } };
      mp.mixpanel.identify(user.userId);
      mp.mixpanel.people.set({
        $email: user.email,
        $name: user.name,
        plan: user.plan,
        ...user,
      });
    }
  },
  track(event, properties) {
    if (typeof window !== 'undefined' && (window as unknown as { mixpanel?: unknown }).mixpanel) {
      (window as unknown as { mixpanel: { track: (e: string, p?: EventProperties) => void } }).mixpanel.track(event, properties);
    }
  },
  page(properties) {
    if (typeof window !== 'undefined' && (window as unknown as { mixpanel?: unknown }).mixpanel) {
      (window as unknown as { mixpanel: { track: (e: string, p: PageViewProperties) => void } }).mixpanel.track('Page View', properties);
    }
  },
  reset() {
    if (typeof window !== 'undefined' && (window as unknown as { mixpanel?: unknown }).mixpanel) {
      (window as unknown as { mixpanel: { reset: () => void } }).mixpanel.reset();
    }
  },
};

// Amplitude adapter
const amplitudeAdapter: AnalyticsAdapter = {
  initialize(config) {
    const apiKey = config.options?.amplitude?.apiKey || config.apiKey;
    if (!apiKey) {
      console.warn('[Analytics] Amplitude API key not provided');
      return;
    }
    // In production, load Amplitude SDK
    if (typeof window !== 'undefined' && (window as unknown as { amplitude?: unknown }).amplitude) {
      (window as unknown as { amplitude: { init: (key: string) => void } }).amplitude.init(apiKey);
    }
  },
  identify(user) {
    if (typeof window !== 'undefined' && (window as unknown as { amplitude?: unknown }).amplitude) {
      const amp = window as unknown as { amplitude: { setUserId: (id: string) => void; setUserProperties: (props: Record<string, unknown>) => void } };
      amp.amplitude.setUserId(user.userId);
      amp.amplitude.setUserProperties({
        email: user.email,
        name: user.name,
        plan: user.plan,
        ...user,
      });
    }
  },
  track(event, properties) {
    if (typeof window !== 'undefined' && (window as unknown as { amplitude?: unknown }).amplitude) {
      (window as unknown as { amplitude: { logEvent: (e: string, p?: EventProperties) => void } }).amplitude.logEvent(event, properties);
    }
  },
  page(properties) {
    if (typeof window !== 'undefined' && (window as unknown as { amplitude?: unknown }).amplitude) {
      (window as unknown as { amplitude: { logEvent: (e: string, p: PageViewProperties) => void } }).amplitude.logEvent('Page View', properties);
    }
  },
  reset() {
    if (typeof window !== 'undefined' && (window as unknown as { amplitude?: unknown }).amplitude) {
      (window as unknown as { amplitude: { setUserId: (id: null) => void; regenerateDeviceId: () => void } }).amplitude.setUserId(null);
      (window as unknown as { amplitude: { regenerateDeviceId: () => void } }).amplitude.regenerateDeviceId();
    }
  },
};

// PostHog adapter
const posthogAdapter: AnalyticsAdapter = {
  initialize(config) {
    const apiKey = config.options?.posthog?.apiKey || config.apiKey;
    const apiHost = config.options?.posthog?.apiHost || 'https://app.posthog.com';
    if (!apiKey) {
      console.warn('[Analytics] PostHog API key not provided');
      return;
    }
    // In production, load PostHog SDK
    if (typeof window !== 'undefined' && (window as unknown as { posthog?: unknown }).posthog) {
      (window as unknown as { posthog: { init: (key: string, opts: { api_host: string }) => void } }).posthog.init(apiKey, { api_host: apiHost });
    }
  },
  identify(user) {
    if (typeof window !== 'undefined' && (window as unknown as { posthog?: unknown }).posthog) {
      (window as unknown as { posthog: { identify: (id: string, props: Record<string, unknown>) => void } }).posthog.identify(user.userId, {
        email: user.email,
        name: user.name,
        plan: user.plan,
        ...user,
      });
    }
  },
  track(event, properties) {
    if (typeof window !== 'undefined' && (window as unknown as { posthog?: unknown }).posthog) {
      (window as unknown as { posthog: { capture: (e: string, p?: EventProperties) => void } }).posthog.capture(event, properties);
    }
  },
  page(properties) {
    if (typeof window !== 'undefined' && (window as unknown as { posthog?: unknown }).posthog) {
      (window as unknown as { posthog: { capture: (e: string, p: PageViewProperties) => void } }).posthog.capture('$pageview', properties);
    }
  },
  reset() {
    if (typeof window !== 'undefined' && (window as unknown as { posthog?: unknown }).posthog) {
      (window as unknown as { posthog: { reset: () => void } }).posthog.reset();
    }
  },
};

// Custom HTTP adapter for self-hosted analytics
const customAdapter: AnalyticsAdapter = {
  initialize(_config) {
    // Custom initialization if needed
  },
  identify(user) {
    sendToCustomEndpoint('identify', user);
  },
  track(event, properties) {
    sendToCustomEndpoint('track', { event, properties, timestamp: new Date().toISOString() });
  },
  page(properties) {
    sendToCustomEndpoint('page', { ...properties, timestamp: new Date().toISOString() });
  },
  reset() {
    sendToCustomEndpoint('reset', {});
  },
};

function sendToCustomEndpoint(type: string, data: unknown): void {
  const config = analyticsInstance?.getConfig();
  const endpoint = config?.options?.custom?.endpoint || config?.apiEndpoint;

  if (!endpoint) {
    console.warn('[Analytics] Custom endpoint not configured');
    return;
  }

  fetch(`${endpoint}/${type}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...config?.options?.custom?.headers,
    },
    body: JSON.stringify(data),
  }).catch((error) => {
    console.error('[Analytics] Failed to send to custom endpoint:', error);
  });
}

// =============================================================================
// Analytics Class
// =============================================================================

class Analytics {
  private config: AnalyticsConfig;
  private adapter: AnalyticsAdapter;
  private currentUser: UserProperties | null = null;
  private eventQueue: Array<{ event: string; properties?: EventProperties }> = [];
  private initialized = false;

  constructor(config: AnalyticsConfig) {
    this.config = {
      enabled: true,
      debug: false,
      ...config,
    };
    this.adapter = this.getAdapter(config.provider);
  }

  private getAdapter(provider: AnalyticsProvider): AnalyticsAdapter {
    switch (provider) {
      case 'mixpanel':
        return mixpanelAdapter;
      case 'amplitude':
        return amplitudeAdapter;
      case 'posthog':
        return posthogAdapter;
      case 'custom':
        return customAdapter;
      case 'console':
      default:
        return consoleAdapter;
    }
  }

  /**
   * Initialize analytics with configuration
   */
  initialize(): void {
    if (this.initialized) return;

    this.adapter.initialize(this.config);
    this.initialized = true;

    // Flush any queued events
    this.eventQueue.forEach(({ event, properties }) => {
      this.adapter.track(event, properties);
    });
    this.eventQueue = [];

    if (this.config.debug) {
      console.log('[Analytics] Initialized with provider:', this.config.provider);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): AnalyticsConfig {
    return this.config;
  }

  /**
   * Identify a user for tracking
   */
  identifyUser(user: UserProperties): void {
    if (!this.config.enabled) return;

    this.currentUser = user;
    this.adapter.identify(user);

    if (this.config.debug) {
      console.log('[Analytics] User identified:', user.userId);
    }
  }

  /**
   * Track a custom event
   */
  trackEvent(event: AnalyticsEventName | string, properties?: EventProperties): void {
    if (!this.config.enabled) return;

    const enrichedProperties = {
      ...properties,
      userId: this.currentUser?.userId,
      timestamp: new Date().toISOString(),
    };

    if (!this.initialized) {
      // Queue events until initialized
      this.eventQueue.push({ event, properties: enrichedProperties });
      return;
    }

    this.adapter.track(event, enrichedProperties);

    if (this.config.debug) {
      console.log('[Analytics] Event tracked:', event, enrichedProperties);
    }
  }

  /**
   * Track a page view
   */
  trackPageView(properties: PageViewProperties): void {
    if (!this.config.enabled) return;

    const enrichedProperties = {
      ...properties,
      userId: this.currentUser?.userId,
    };

    this.adapter.page(enrichedProperties);

    if (this.config.debug) {
      console.log('[Analytics] Page view tracked:', enrichedProperties);
    }
  }

  /**
   * Track a conversion funnel step
   */
  trackConversion(properties: ConversionProperties): void {
    if (!this.config.enabled) return;

    const eventName = `conversion_${properties.funnelName}_step_${properties.stepNumber}`;

    this.trackEvent(eventName, {
      funnel_name: properties.funnelName,
      step_number: properties.stepNumber,
      step_name: properties.stepName,
      value: properties.value,
      currency: properties.currency,
    });

    if (this.config.debug) {
      console.log('[Analytics] Conversion tracked:', properties);
    }
  }

  /**
   * Track funnel progression using predefined funnels
   */
  trackFunnelStep(
    funnel: keyof typeof CONVERSION_FUNNELS,
    stepNumber: number,
    additionalProperties?: EventProperties
  ): void {
    const funnelConfig = CONVERSION_FUNNELS[funnel];
    const step = funnelConfig.steps.find((s) => s.number === stepNumber);

    if (!step) {
      console.warn(`[Analytics] Invalid step ${stepNumber} for funnel ${funnel}`);
      return;
    }

    this.trackConversion({
      funnelName: funnelConfig.name,
      stepNumber: step.number,
      stepName: step.name,
      ...additionalProperties,
    });
  }

  /**
   * Reset analytics state (e.g., on logout)
   */
  reset(): void {
    this.currentUser = null;
    this.adapter.reset();

    if (this.config.debug) {
      console.log('[Analytics] Reset');
    }
  }

  /**
   * Enable or disable analytics
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * Check if user is identified
   */
  isUserIdentified(): boolean {
    return this.currentUser !== null;
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let analyticsInstance: Analytics | null = null;

/**
 * Initialize the analytics singleton
 */
export function initializeAnalytics(config: AnalyticsConfig): Analytics {
  analyticsInstance = new Analytics(config);
  analyticsInstance.initialize();
  return analyticsInstance;
}

/**
 * Get the analytics instance (must be initialized first)
 */
export function getAnalytics(): Analytics {
  if (!analyticsInstance) {
    // Default to console provider in development
    analyticsInstance = new Analytics({
      provider: 'console',
      debug: process.env.NODE_ENV === 'development',
    });
    analyticsInstance.initialize();
  }
  return analyticsInstance;
}

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Track an event (convenience function)
 */
export function trackEvent(event: AnalyticsEventName | string, properties?: EventProperties): void {
  getAnalytics().trackEvent(event, properties);
}

/**
 * Track a page view (convenience function)
 */
export function trackPageView(path: string, title?: string): void {
  getAnalytics().trackPageView({
    path,
    title,
    referrer: typeof document !== 'undefined' ? document.referrer : undefined,
  });
}

/**
 * Identify a user (convenience function)
 */
export function identifyUser(user: UserProperties): void {
  getAnalytics().identifyUser(user);
}

/**
 * Track a conversion step (convenience function)
 */
export function trackConversion(properties: ConversionProperties): void {
  getAnalytics().trackConversion(properties);
}

/**
 * Track a funnel step (convenience function)
 */
export function trackFunnelStep(
  funnel: keyof typeof CONVERSION_FUNNELS,
  stepNumber: number,
  additionalProperties?: EventProperties
): void {
  getAnalytics().trackFunnelStep(funnel, stepNumber, additionalProperties);
}

/**
 * Reset analytics (convenience function)
 */
export function resetAnalytics(): void {
  getAnalytics().reset();
}

// =============================================================================
// React Hook
// =============================================================================

import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * React hook for analytics
 */
export function useAnalytics() {
  const location = useLocation();

  // Track page views on route change
  useEffect(() => {
    trackPageView(location.pathname, document.title);
  }, [location.pathname]);

  const track = useCallback((event: AnalyticsEventName | string, properties?: EventProperties) => {
    trackEvent(event, properties);
  }, []);

  const identify = useCallback((user: UserProperties) => {
    identifyUser(user);
  }, []);

  const trackFunnel = useCallback((
    funnel: keyof typeof CONVERSION_FUNNELS,
    stepNumber: number,
    properties?: EventProperties
  ) => {
    trackFunnelStep(funnel, stepNumber, properties);
  }, []);

  return {
    track,
    identify,
    trackFunnel,
    trackConversion,
    trackPageView,
    reset: resetAnalytics,
    EVENTS: ANALYTICS_EVENTS,
    FUNNELS: CONVERSION_FUNNELS,
  };
}

// =============================================================================
// Default Export
// =============================================================================

export default {
  initialize: initializeAnalytics,
  get: getAnalytics,
  trackEvent,
  trackPageView,
  identifyUser,
  trackConversion,
  trackFunnelStep,
  reset: resetAnalytics,
  EVENTS: ANALYTICS_EVENTS,
  FUNNELS: CONVERSION_FUNNELS,
};
