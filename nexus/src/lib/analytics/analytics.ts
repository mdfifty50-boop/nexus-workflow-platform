/**
 * Analytics System
 *
 * Privacy-first analytics tracking with:
 * - Configurable data collection
 * - User identification with hashed IDs (no PII)
 * - Session tracking
 * - Batch event uploads
 * - GDPR compliance helpers
 * - Opt-out support
 * - Supabase integration
 */

import { supabase, isSupabaseConfigured } from '../supabase';
import {
  ANALYTICS_EVENTS,
  CONVERSION_FUNNELS,
  type AnalyticsEventName,
  type EventProperties,
  getEventCategory,
} from './events';

// =============================================================================
// Types and Interfaces
// =============================================================================

export type AnalyticsProvider = 'supabase' | 'mixpanel' | 'amplitude' | 'posthog' | 'custom' | 'console';

export interface PrivacySettings {
  analyticsEnabled: boolean;
  performanceTrackingEnabled: boolean;
  errorTrackingEnabled: boolean;
  sessionRecordingEnabled: boolean;
  personalizedSuggestionsEnabled: boolean;
}

export interface AnalyticsConfig {
  provider: AnalyticsProvider;
  apiKey?: string;
  apiEndpoint?: string;
  debug?: boolean;
  enabled?: boolean;
  batchSize?: number;
  batchIntervalMs?: number;
  privacySettings?: PrivacySettings;
  hashUserIds?: boolean;
  anonymizeIp?: boolean;
  respectDoNotTrack?: boolean;
}

export interface UserIdentity {
  userId: string;
  anonymousId: string;
  hashedId: string;
  isIdentified: boolean;
  traits?: Record<string, unknown>;
}

export interface Session {
  id: string;
  startedAt: string;
  lastActivityAt: string;
  pageViews: number;
  events: number;
  duration: number;
  referrer?: string;
  utmParams?: Record<string, string>;
  isFirstSession?: boolean;
}

export interface AnalyticsEvent {
  id: string;
  eventName: string;
  category: string;
  properties: EventProperties;
  timestamp: string;
  sessionId: string;
  userId?: string;
  anonymousId: string;
  hashedUserId?: string;
  platform: 'web' | 'mobile' | 'api';
  locale: string;
  timezone: string;
  userAgent: string;
  pathname: string;
  referrer?: string;
}

export interface ConversionStep {
  funnelName: string;
  stepNumber: number;
  stepName: string;
  completedAt: string;
  properties?: Record<string, unknown>;
}

// =============================================================================
// Privacy Utilities
// =============================================================================

/**
 * Generate a SHA-256 hash of a string (for user ID anonymization)
 */
async function hashString(str: string): Promise<string> {
  if (!str) return '';
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a unique anonymous ID
 */
function generateAnonymousId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `sess_${timestamp}_${random}`;
}

/**
 * Generate a unique event ID
 */
function generateEventId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `evt_${timestamp}_${random}`;
}

/**
 * Check if Do Not Track is enabled
 */
function isDoNotTrackEnabled(): boolean {
  if (typeof navigator === 'undefined') return false;
  return navigator.doNotTrack === '1' || (window as unknown as { doNotTrack?: string }).doNotTrack === '1';
}

/**
 * Get UTM parameters from URL
 */
function getUtmParams(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const utmParams: Record<string, string> = {};

  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(param => {
    const value = params.get(param);
    if (value) utmParams[param] = value;
  });

  return utmParams;
}

/**
 * Strip PII from event properties
 */
function sanitizeProperties(properties: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ['email', 'password', 'token', 'secret', 'apiKey', 'api_key', 'accessToken', 'access_token', 'phone', 'ssn', 'creditCard', 'credit_card'];
  const sanitized = { ...properties };

  for (const key of Object.keys(sanitized)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    }
  }

  return sanitized;
}

// =============================================================================
// Default Privacy Settings
// =============================================================================

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  analyticsEnabled: true,
  performanceTrackingEnabled: true,
  errorTrackingEnabled: true,
  sessionRecordingEnabled: false,
  personalizedSuggestionsEnabled: true,
};

// =============================================================================
// Storage Keys
// =============================================================================

const STORAGE_KEYS = {
  ANONYMOUS_ID: 'nexus_analytics_anonymous_id',
  SESSION_ID: 'nexus_analytics_session_id',
  SESSION_DATA: 'nexus_analytics_session_data',
  PRIVACY_SETTINGS: 'nexus_analytics_privacy_settings',
  CONSENT_GIVEN: 'nexus_analytics_consent_given',
  CONSENT_TIMESTAMP: 'nexus_analytics_consent_timestamp',
  USER_ID: 'nexus_analytics_user_id',
  PENDING_EVENTS: 'nexus_analytics_pending_events',
  FUNNEL_PROGRESS: 'nexus_analytics_funnel_progress',
};

// =============================================================================
// Analytics Class
// =============================================================================

class Analytics {
  private config: AnalyticsConfig;
  private user: UserIdentity | null = null;
  private session: Session | null = null;
  private eventQueue: AnalyticsEvent[] = [];
  private initialized = false;
  private batchTimer: NodeJS.Timeout | null = null;
  private privacySettings: PrivacySettings = DEFAULT_PRIVACY_SETTINGS;

  constructor(config: AnalyticsConfig) {
    this.config = {
      enabled: true,
      debug: false,
      batchSize: 10,
      batchIntervalMs: 5000,
      hashUserIds: true,
      anonymizeIp: true,
      respectDoNotTrack: true,
      ...config,
    };

    if (config.privacySettings) {
      this.privacySettings = config.privacySettings;
    }
  }

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Check Do Not Track
    if (this.config.respectDoNotTrack && isDoNotTrackEnabled()) {
      this.config.enabled = false;
      this.log('Analytics disabled due to Do Not Track preference');
      return;
    }

    // Load privacy settings from storage
    this.loadPrivacySettings();

    // Check if analytics is enabled
    if (!this.privacySettings.analyticsEnabled) {
      this.config.enabled = false;
      this.log('Analytics disabled by user preference');
      return;
    }

    // Initialize user identity
    await this.initializeUserIdentity();

    // Initialize session
    this.initializeSession();

    // Load pending events from storage
    this.loadPendingEvents();

    // Start batch timer
    this.startBatchTimer();

    // Add visibility change listener for session tracking
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }

    // Add beforeunload listener to flush events
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    }

    this.initialized = true;
    this.log('Analytics initialized');

    // Track session start
    this.trackEvent(ANALYTICS_EVENTS.SESSION_STARTED, {
      isFirstSession: this.session?.isFirstSession,
    });
  }

  private async initializeUserIdentity(): Promise<void> {
    // Get or create anonymous ID
    let anonymousId = localStorage.getItem(STORAGE_KEYS.ANONYMOUS_ID);
    if (!anonymousId) {
      anonymousId = generateAnonymousId();
      localStorage.setItem(STORAGE_KEYS.ANONYMOUS_ID, anonymousId);
    }

    // Get stored user ID if any
    const storedUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    const hashedId = storedUserId ? await hashString(storedUserId) : '';

    this.user = {
      userId: storedUserId || '',
      anonymousId,
      hashedId,
      isIdentified: !!storedUserId,
    };
  }

  private initializeSession(): void {
    const storedSessionData = sessionStorage.getItem(STORAGE_KEYS.SESSION_DATA);
    const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

    if (storedSessionData) {
      const parsedSession = JSON.parse(storedSessionData) as Session;
      const lastActivity = new Date(parsedSession.lastActivityAt).getTime();
      const now = Date.now();

      // Check if session is still valid
      if (now - lastActivity < SESSION_TIMEOUT) {
        this.session = {
          ...parsedSession,
          lastActivityAt: new Date().toISOString(),
        };
        this.saveSession();
        return;
      }
    }

    // Create new session
    const isFirstSession = !localStorage.getItem(STORAGE_KEYS.SESSION_ID);

    this.session = {
      id: generateSessionId(),
      startedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      pageViews: 0,
      events: 0,
      duration: 0,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      utmParams: getUtmParams(),
      isFirstSession,
    };

    localStorage.setItem(STORAGE_KEYS.SESSION_ID, this.session.id);
    this.saveSession();
  }

  private saveSession(): void {
    if (this.session) {
      sessionStorage.setItem(STORAGE_KEYS.SESSION_DATA, JSON.stringify(this.session));
    }
  }

  private updateSessionActivity(): void {
    if (this.session) {
      const now = new Date();
      const startTime = new Date(this.session.startedAt).getTime();
      this.session.lastActivityAt = now.toISOString();
      this.session.duration = Math.floor((now.getTime() - startTime) / 1000);
      this.session.events++;
      this.saveSession();
    }
  }

  // ---------------------------------------------------------------------------
  // Privacy & Consent
  // ---------------------------------------------------------------------------

  private loadPrivacySettings(): void {
    const stored = localStorage.getItem(STORAGE_KEYS.PRIVACY_SETTINGS);
    if (stored) {
      this.privacySettings = { ...DEFAULT_PRIVACY_SETTINGS, ...JSON.parse(stored) };
    }
  }

  updatePrivacySettings(settings: Partial<PrivacySettings>): void {
    this.privacySettings = { ...this.privacySettings, ...settings };
    localStorage.setItem(STORAGE_KEYS.PRIVACY_SETTINGS, JSON.stringify(this.privacySettings));

    if (!settings.analyticsEnabled) {
      this.config.enabled = false;
      this.stopBatchTimer();
      this.eventQueue = [];
    } else if (settings.analyticsEnabled && !this.config.enabled) {
      this.config.enabled = true;
      this.startBatchTimer();
    }

    this.log('Privacy settings updated:', this.privacySettings);
  }

  getPrivacySettings(): PrivacySettings {
    return { ...this.privacySettings };
  }

  /**
   * Record GDPR consent
   */
  recordConsent(consented: boolean, categories?: string[]): void {
    localStorage.setItem(STORAGE_KEYS.CONSENT_GIVEN, consented ? 'true' : 'false');
    localStorage.setItem(STORAGE_KEYS.CONSENT_TIMESTAMP, new Date().toISOString());

    if (!consented) {
      this.optOut();
    } else {
      this.config.enabled = true;
      this.trackEvent('consent_given', {
        categories: categories?.join(','),
        timestamp: new Date().toISOString(),
      });
    }
  }

  hasConsent(): boolean {
    return localStorage.getItem(STORAGE_KEYS.CONSENT_GIVEN) === 'true';
  }

  /**
   * Opt out of all analytics
   */
  optOut(): void {
    this.config.enabled = false;
    this.stopBatchTimer();
    this.eventQueue = [];
    localStorage.removeItem(STORAGE_KEYS.PENDING_EVENTS);
    this.privacySettings.analyticsEnabled = false;
    localStorage.setItem(STORAGE_KEYS.PRIVACY_SETTINGS, JSON.stringify(this.privacySettings));
    this.log('User opted out of analytics');
  }

  /**
   * Opt back in to analytics
   */
  optIn(): void {
    this.privacySettings.analyticsEnabled = true;
    localStorage.setItem(STORAGE_KEYS.PRIVACY_SETTINGS, JSON.stringify(this.privacySettings));
    this.config.enabled = true;
    this.startBatchTimer();
    this.log('User opted in to analytics');
  }

  /**
   * Delete all user data (GDPR right to erasure)
   */
  async deleteUserData(): Promise<void> {
    // Clear local storage
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    // Delete from Supabase if configured
    if (isSupabaseConfigured() && this.user?.hashedId) {
      try {
        await supabase
          .from('analytics_events')
          .delete()
          .eq('hashed_user_id', this.user.hashedId);
        this.log('User data deleted from Supabase');
      } catch (error) {
        console.error('Failed to delete user data from Supabase:', error);
      }
    }

    // Reset user identity
    this.user = null;
    await this.initializeUserIdentity();

    this.log('All user analytics data deleted');
  }

  /**
   * Export user data (GDPR right to data portability)
   */
  async exportUserData(): Promise<Record<string, unknown>> {
    const userData: Record<string, unknown> = {
      anonymousId: this.user?.anonymousId,
      isIdentified: this.user?.isIdentified,
      privacySettings: this.privacySettings,
      session: this.session,
      pendingEvents: this.eventQueue,
      exportedAt: new Date().toISOString(),
    };

    // Get events from Supabase if configured
    if (isSupabaseConfigured() && this.user?.hashedId) {
      try {
        const { data: events } = await supabase
          .from('analytics_events')
          .select('*')
          .eq('hashed_user_id', this.user.hashedId)
          .order('timestamp', { ascending: false })
          .limit(1000);

        userData.historicalEvents = events || [];
      } catch (error) {
        console.error('Failed to export user data from Supabase:', error);
      }
    }

    return userData;
  }

  // ---------------------------------------------------------------------------
  // User Identification
  // ---------------------------------------------------------------------------

  async identify(userId: string, traits?: Record<string, unknown>): Promise<void> {
    if (!this.config.enabled) return;

    const hashedId = this.config.hashUserIds ? await hashString(userId) : userId;

    this.user = {
      userId: this.config.hashUserIds ? '' : userId, // Don't store raw ID if hashing
      anonymousId: this.user?.anonymousId || generateAnonymousId(),
      hashedId,
      isIdentified: true,
      traits: traits ? sanitizeProperties(traits) : undefined,
    };

    localStorage.setItem(STORAGE_KEYS.USER_ID, userId);

    this.trackEvent(ANALYTICS_EVENTS.LOGIN_COMPLETED, {
      method: traits?.loginMethod as string,
    });

    this.log('User identified:', hashedId);
  }

  reset(): void {
    // Track session end before reset
    if (this.session) {
      this.trackEvent(ANALYTICS_EVENTS.SESSION_ENDED, {
        duration: this.session.duration,
        pageViews: this.session.pageViews,
        events: this.session.events,
      });
    }

    // Flush remaining events
    this.flushEvents();

    // Clear user data
    localStorage.removeItem(STORAGE_KEYS.USER_ID);
    this.user = null;

    // Initialize fresh identity
    this.initializeUserIdentity();
    this.initializeSession();

    this.log('Analytics reset');
  }

  // ---------------------------------------------------------------------------
  // Event Tracking
  // ---------------------------------------------------------------------------

  trackEvent(eventName: AnalyticsEventName | string, properties?: Record<string, unknown>): void {
    if (!this.config.enabled || !this.privacySettings.analyticsEnabled) return;

    // Check if this category is enabled
    const category = getEventCategory(eventName as AnalyticsEventName);
    if (category === 'performance' && !this.privacySettings.performanceTrackingEnabled) return;
    if (category === 'error' && !this.privacySettings.errorTrackingEnabled) return;

    const event: AnalyticsEvent = {
      id: generateEventId(),
      eventName,
      category,
      properties: sanitizeProperties(properties || {}),
      timestamp: new Date().toISOString(),
      sessionId: this.session?.id || '',
      userId: this.config.hashUserIds ? undefined : this.user?.userId,
      anonymousId: this.user?.anonymousId || '',
      hashedUserId: this.user?.hashedId,
      platform: 'web',
      locale: typeof navigator !== 'undefined' ? navigator.language : 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      pathname: typeof window !== 'undefined' ? window.location.pathname : '',
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
    };

    this.eventQueue.push(event);
    this.updateSessionActivity();
    this.savePendingEvents();

    this.log('Event tracked:', eventName, properties);

    // Check if batch should be sent
    if (this.eventQueue.length >= (this.config.batchSize || 10)) {
      this.flushEvents();
    }
  }

  trackPageView(path: string, title?: string): void {
    if (!this.config.enabled) return;

    if (this.session) {
      this.session.pageViews++;
      this.saveSession();
    }

    this.trackEvent(ANALYTICS_EVENTS.PAGE_VIEWED, {
      path,
      title: title || (typeof document !== 'undefined' ? document.title : ''),
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
    });
  }

  trackConversion(funnelName: string, stepNumber: number, properties?: Record<string, unknown>): void {
    if (!this.config.enabled) return;

    const funnel = CONVERSION_FUNNELS[funnelName];
    if (!funnel) {
      console.warn(`Unknown funnel: ${funnelName}`);
      return;
    }

    const step = funnel.steps.find(s => s.number === stepNumber);
    if (!step) {
      console.warn(`Unknown step ${stepNumber} in funnel ${funnelName}`);
      return;
    }

    // Save funnel progress
    const progressKey = `${STORAGE_KEYS.FUNNEL_PROGRESS}_${funnelName}`;
    const progress = JSON.parse(localStorage.getItem(progressKey) || '{}');
    progress[stepNumber] = {
      completedAt: new Date().toISOString(),
      properties,
    };
    localStorage.setItem(progressKey, JSON.stringify(progress));

    this.trackEvent(`conversion_${funnelName}_step_${stepNumber}`, {
      funnelName,
      stepNumber,
      stepName: step.name,
      totalSteps: funnel.steps.length,
      completionPercentage: Math.round((stepNumber / funnel.steps.length) * 100),
      ...properties,
    });
  }

  trackError(error: Error, context?: Record<string, unknown>): void {
    if (!this.config.enabled || !this.privacySettings.errorTrackingEnabled) return;

    this.trackEvent(ANALYTICS_EVENTS.OCCURRED, {
      errorMessage: error.message,
      errorStack: error.stack?.substring(0, 500), // Limit stack trace length
      errorName: error.name,
      ...context,
    });
  }

  trackPerformance(metricName: string, value: number, unit: string = 'ms'): void {
    if (!this.config.enabled || !this.privacySettings.performanceTrackingEnabled) return;

    this.trackEvent(ANALYTICS_EVENTS.PAGE_LOAD, {
      metricName,
      metricValue: value,
      unit,
    });
  }

  // ---------------------------------------------------------------------------
  // Batch Processing
  // ---------------------------------------------------------------------------

  private startBatchTimer(): void {
    if (this.batchTimer) return;

    this.batchTimer = setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flushEvents();
      }
    }, this.config.batchIntervalMs || 5000);
  }

  private stopBatchTimer(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }
  }

  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await this.sendEvents(eventsToSend);
      localStorage.removeItem(STORAGE_KEYS.PENDING_EVENTS);
      this.log(`Flushed ${eventsToSend.length} events`);
    } catch (error) {
      // Put events back in queue on failure
      this.eventQueue = [...eventsToSend, ...this.eventQueue];
      this.savePendingEvents();
      console.error('Failed to flush analytics events:', error);
    }
  }

  private async sendEvents(events: AnalyticsEvent[]): Promise<void> {
    if (this.config.provider === 'console') {
      events.forEach(event => console.log('[Analytics]', event));
      return;
    }

    if (this.config.provider === 'supabase' && isSupabaseConfigured()) {
      await this.sendToSupabase(events);
      return;
    }

    if (this.config.provider === 'custom' && this.config.apiEndpoint) {
      await this.sendToCustomEndpoint(events);
      return;
    }

    // Fallback to console in development
    if (this.config.debug) {
      events.forEach(event => console.log('[Analytics]', event));
    }
  }

  private async sendToSupabase(events: AnalyticsEvent[]): Promise<void> {
    const rows = events.map(event => ({
      id: event.id,
      event_name: event.eventName,
      category: event.category,
      properties: event.properties,
      timestamp: event.timestamp,
      session_id: event.sessionId,
      anonymous_id: event.anonymousId,
      hashed_user_id: event.hashedUserId,
      platform: event.platform,
      locale: event.locale,
      timezone: event.timezone,
      user_agent: event.userAgent,
      pathname: event.pathname,
      referrer: event.referrer,
    }));

    const { error } = await supabase.from('analytics_events').insert(rows);

    if (error) {
      throw error;
    }
  }

  private async sendToCustomEndpoint(events: AnalyticsEvent[]): Promise<void> {
    const response = await fetch(this.config.apiEndpoint!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
      },
      body: JSON.stringify({ events }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  private savePendingEvents(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PENDING_EVENTS, JSON.stringify(this.eventQueue));
    } catch (error) {
      // Storage might be full, drop oldest events
      this.eventQueue = this.eventQueue.slice(-50);
      try {
        localStorage.setItem(STORAGE_KEYS.PENDING_EVENTS, JSON.stringify(this.eventQueue));
      } catch {
        // Give up on persistence
      }
    }
  }

  private loadPendingEvents(): void {
    const stored = localStorage.getItem(STORAGE_KEYS.PENDING_EVENTS);
    if (stored) {
      try {
        const events = JSON.parse(stored) as AnalyticsEvent[];
        this.eventQueue = events;
        this.log(`Loaded ${events.length} pending events`);
      } catch {
        localStorage.removeItem(STORAGE_KEYS.PENDING_EVENTS);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Event Handlers
  // ---------------------------------------------------------------------------

  private handleVisibilityChange(): void {
    if (document.hidden) {
      // Save session and flush events when tab becomes hidden
      this.flushEvents();
    } else {
      // Update session activity when tab becomes visible
      this.updateSessionActivity();
    }
  }

  private handleBeforeUnload(): void {
    // Track session end
    if (this.session) {
      this.trackEvent(ANALYTICS_EVENTS.SESSION_ENDED, {
        duration: this.session.duration,
        pageViews: this.session.pageViews,
        events: this.session.events,
      });
    }

    // Use sendBeacon for reliable event delivery
    if (this.eventQueue.length > 0 && navigator.sendBeacon) {
      const data = JSON.stringify({ events: this.eventQueue });
      if (this.config.provider === 'custom' && this.config.apiEndpoint) {
        navigator.sendBeacon(this.config.apiEndpoint, data);
      }
    }

    // Synchronously save pending events as backup
    this.savePendingEvents();
  }

  // ---------------------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------------------

  private log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log('[Analytics]', ...args);
    }
  }

  getConfig(): AnalyticsConfig {
    return { ...this.config };
  }

  getSession(): Session | null {
    return this.session ? { ...this.session } : null;
  }

  getUser(): UserIdentity | null {
    return this.user ? { ...this.user } : null;
  }

  isEnabled(): boolean {
    return this.config.enabled === true;
  }

  isInitialized(): boolean {
    return this.initialized;
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
  if (analyticsInstance) {
    console.warn('Analytics already initialized');
    return analyticsInstance;
  }

  analyticsInstance = new Analytics(config);
  analyticsInstance.initialize();
  return analyticsInstance;
}

/**
 * Get the analytics instance
 */
export function getAnalytics(): Analytics {
  if (!analyticsInstance) {
    // Auto-initialize with sensible defaults
    analyticsInstance = new Analytics({
      provider: isSupabaseConfigured() ? 'supabase' : 'console',
      debug: import.meta.env.DEV,
    });
    analyticsInstance.initialize();
  }
  return analyticsInstance;
}

// =============================================================================
// Convenience Functions
// =============================================================================

export function trackEvent(eventName: AnalyticsEventName | string, properties?: Record<string, unknown>): void {
  getAnalytics().trackEvent(eventName, properties);
}

export function trackPageView(path: string, title?: string): void {
  getAnalytics().trackPageView(path, title);
}

export function identifyUser(userId: string, traits?: Record<string, unknown>): Promise<void> {
  return getAnalytics().identify(userId, traits);
}

export function trackConversion(funnelName: string, stepNumber: number, properties?: Record<string, unknown>): void {
  getAnalytics().trackConversion(funnelName, stepNumber, properties);
}

export function trackError(error: Error, context?: Record<string, unknown>): void {
  getAnalytics().trackError(error, context);
}

export function trackPerformance(metricName: string, value: number, unit?: string): void {
  getAnalytics().trackPerformance(metricName, value, unit);
}

export function resetAnalytics(): void {
  getAnalytics().reset();
}

export function updatePrivacySettings(settings: Partial<PrivacySettings>): void {
  getAnalytics().updatePrivacySettings(settings);
}

export function getPrivacySettings(): PrivacySettings {
  return getAnalytics().getPrivacySettings();
}

export function recordConsent(consented: boolean, categories?: string[]): void {
  getAnalytics().recordConsent(consented, categories);
}

export function hasConsent(): boolean {
  return getAnalytics().hasConsent();
}

export function optOut(): void {
  getAnalytics().optOut();
}

export function optIn(): void {
  getAnalytics().optIn();
}

export function deleteUserData(): Promise<void> {
  return getAnalytics().deleteUserData();
}

export function exportUserData(): Promise<Record<string, unknown>> {
  return getAnalytics().exportUserData();
}

export { ANALYTICS_EVENTS, CONVERSION_FUNNELS };
export type { AnalyticsEventName, EventProperties };
