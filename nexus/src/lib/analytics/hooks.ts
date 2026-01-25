/**
 * Analytics React Hooks
 *
 * Custom hooks for integrating analytics into React components.
 */

import { useEffect, useCallback, useRef, type RefObject } from 'react';
import { useLocation } from 'react-router-dom';
import {
  trackEvent,
  trackPageView,
  trackConversion,
  trackError,
  trackPerformance,
  identifyUser,
  resetAnalytics,
  updatePrivacySettings,
  getPrivacySettings,
  type PrivacySettings,
} from './analytics';
import { ANALYTICS_EVENTS, CONVERSION_FUNNELS, type AnalyticsEventName } from './events';

// =============================================================================
// useAnalytics - Main analytics hook
// =============================================================================

export interface UseAnalyticsReturn {
  track: (event: AnalyticsEventName | string, properties?: Record<string, unknown>) => void;
  trackPageView: (path: string, title?: string) => void;
  trackConversion: (funnelName: string, stepNumber: number, properties?: Record<string, unknown>) => void;
  trackError: (error: Error, context?: Record<string, unknown>) => void;
  trackPerformance: (metricName: string, value: number, unit?: string) => void;
  identify: (userId: string, traits?: Record<string, unknown>) => Promise<void>;
  reset: () => void;
  updatePrivacy: (settings: Partial<PrivacySettings>) => void;
  getPrivacy: () => PrivacySettings;
  EVENTS: typeof ANALYTICS_EVENTS;
  FUNNELS: typeof CONVERSION_FUNNELS;
}

/**
 * Main analytics hook with automatic page view tracking
 */
export function useAnalytics(options?: { autoTrackPageViews?: boolean }): UseAnalyticsReturn {
  const location = useLocation();
  const { autoTrackPageViews = true } = options || {};

  // Track page views on route change
  useEffect(() => {
    if (autoTrackPageViews) {
      trackPageView(location.pathname, document.title);
    }
  }, [location.pathname, autoTrackPageViews]);

  const track = useCallback((event: AnalyticsEventName | string, properties?: Record<string, unknown>) => {
    trackEvent(event, properties);
  }, []);

  const trackPage = useCallback((path: string, title?: string) => {
    trackPageView(path, title);
  }, []);

  const trackFunnel = useCallback((funnelName: string, stepNumber: number, properties?: Record<string, unknown>) => {
    trackConversion(funnelName, stepNumber, properties);
  }, []);

  const trackErr = useCallback((error: Error, context?: Record<string, unknown>) => {
    trackError(error, context);
  }, []);

  const trackPerf = useCallback((metricName: string, value: number, unit?: string) => {
    trackPerformance(metricName, value, unit);
  }, []);

  const identify = useCallback(async (userId: string, traits?: Record<string, unknown>) => {
    await identifyUser(userId, traits);
  }, []);

  const reset = useCallback(() => {
    resetAnalytics();
  }, []);

  const updatePrivacy = useCallback((settings: Partial<PrivacySettings>) => {
    updatePrivacySettings(settings);
  }, []);

  const getPrivacy = useCallback(() => {
    return getPrivacySettings();
  }, []);

  return {
    track,
    trackPageView: trackPage,
    trackConversion: trackFunnel,
    trackError: trackErr,
    trackPerformance: trackPerf,
    identify,
    reset,
    updatePrivacy,
    getPrivacy,
    EVENTS: ANALYTICS_EVENTS,
    FUNNELS: CONVERSION_FUNNELS,
  };
}

// =============================================================================
// useTrackEvent - Simple event tracking hook
// =============================================================================

/**
 * Hook for tracking a single event with dependencies
 */
export function useTrackEvent(
  eventName: AnalyticsEventName | string,
  properties?: Record<string, unknown>,
  deps: unknown[] = []
): void {
  const prevDepsRef = useRef<string>('');

  useEffect(() => {
    const depsKey = JSON.stringify(deps);
    if (depsKey !== prevDepsRef.current) {
      prevDepsRef.current = depsKey;
      trackEvent(eventName, properties);
    }
  }, [eventName, properties, ...deps]);
}

// =============================================================================
// useTrackOnMount - Track event on component mount
// =============================================================================

/**
 * Hook to track an event when component mounts
 */
export function useTrackOnMount(
  eventName: AnalyticsEventName | string,
  properties?: Record<string, unknown>
): void {
  useEffect(() => {
    trackEvent(eventName, properties);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

// =============================================================================
// useTrackOnClick - Track clicks on elements
// =============================================================================

/**
 * Hook that returns a click handler for tracking
 */
export function useTrackOnClick<T extends HTMLElement = HTMLElement>(
  eventName: AnalyticsEventName | string,
  properties?: Record<string, unknown>
): RefObject<T | null> {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleClick = () => {
      trackEvent(eventName, properties);
    };

    element.addEventListener('click', handleClick);
    return () => element.removeEventListener('click', handleClick);
  }, [eventName, properties]);

  return ref;
}

// =============================================================================
// useTrackVisibility - Track when element becomes visible
// =============================================================================

/**
 * Hook to track when an element becomes visible
 */
export function useTrackVisibility<T extends HTMLElement = HTMLElement>(
  eventName: AnalyticsEventName | string,
  properties?: Record<string, unknown>,
  options?: { threshold?: number; once?: boolean }
): RefObject<T | null> {
  const ref = useRef<T | null>(null);
  const hasTrackedRef = useRef(false);
  const { threshold = 0.5, once = true } = options || {};

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (once && hasTrackedRef.current) return;
            hasTrackedRef.current = true;
            trackEvent(eventName, properties);
          }
        });
      },
      { threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [eventName, properties, threshold, once]);

  return ref;
}

// =============================================================================
// useTrackTime - Track time spent on a component/page
// =============================================================================

/**
 * Hook to track time spent on a component
 */
export function useTrackTime(
  eventName: AnalyticsEventName | string,
  additionalProperties?: Record<string, unknown>
): void {
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    startTimeRef.current = Date.now();

    return () => {
      const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
      trackEvent(eventName, {
        ...additionalProperties,
        timeSpentSeconds: timeSpent,
      });
    };
  }, [eventName, additionalProperties]);
}

// =============================================================================
// useTrackForm - Track form interactions
// =============================================================================

interface FormTrackingCallbacks {
  onFieldFocus: (fieldName: string) => void;
  onFieldBlur: (fieldName: string) => void;
  onFieldChange: (fieldName: string, hasValue: boolean) => void;
  onSubmitStart: () => void;
  onSubmitSuccess: () => void;
  onSubmitError: (error: Error) => void;
}

/**
 * Hook to track form interactions
 */
export function useTrackForm(formName: string): FormTrackingCallbacks {
  const startTimeRef = useRef<number>(Date.now());
  const fieldsInteractedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    startTimeRef.current = Date.now();
    fieldsInteractedRef.current = new Set();
  }, [formName]);

  const onFieldFocus = useCallback((fieldName: string) => {
    fieldsInteractedRef.current.add(fieldName);
    trackEvent('form_field_focused', {
      formName,
      fieldName,
    });
  }, [formName]);

  const onFieldBlur = useCallback((fieldName: string) => {
    trackEvent('form_field_blurred', {
      formName,
      fieldName,
    });
  }, [formName]);

  const onFieldChange = useCallback((fieldName: string, hasValue: boolean) => {
    trackEvent('form_field_changed', {
      formName,
      fieldName,
      hasValue,
    });
  }, [formName]);

  const onSubmitStart = useCallback(() => {
    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
    trackEvent('form_submit_started', {
      formName,
      timeSpentSeconds: timeSpent,
      fieldsInteracted: fieldsInteractedRef.current.size,
    });
  }, [formName]);

  const onSubmitSuccess = useCallback(() => {
    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
    trackEvent('form_submit_success', {
      formName,
      timeSpentSeconds: timeSpent,
      fieldsInteracted: fieldsInteractedRef.current.size,
    });
  }, [formName]);

  const onSubmitError = useCallback((error: Error) => {
    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
    trackEvent('form_submit_error', {
      formName,
      timeSpentSeconds: timeSpent,
      errorMessage: error.message,
    });
  }, [formName]);

  return {
    onFieldFocus,
    onFieldBlur,
    onFieldChange,
    onSubmitStart,
    onSubmitSuccess,
    onSubmitError,
  };
}

// =============================================================================
// useTrackScroll - Track scroll depth
// =============================================================================

/**
 * Hook to track scroll depth on a page
 */
export function useTrackScrollDepth(options?: {
  thresholds?: number[];
  eventName?: string;
}): void {
  const { thresholds = [25, 50, 75, 100], eventName = 'scroll_depth_reached' } = options || {};
  const trackedThresholdsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    trackedThresholdsRef.current = new Set();

    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercentage = Math.round((scrollTop / scrollHeight) * 100);

      thresholds.forEach((threshold) => {
        if (scrollPercentage >= threshold && !trackedThresholdsRef.current.has(threshold)) {
          trackedThresholdsRef.current.add(threshold);
          trackEvent(eventName, {
            threshold,
            scrollPercentage,
            pathname: window.location.pathname,
          });
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [thresholds, eventName]);
}

// =============================================================================
// useTrackPerformance - Track Web Vitals
// =============================================================================

/**
 * Hook to track Web Vitals performance metrics
 */
export function useTrackPerformance(): void {
  useEffect(() => {
    // Only run in browser and if PerformanceObserver is available
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    // Track LCP (Largest Contentful Paint)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      trackPerformance('lcp', lastEntry.startTime, 'ms');
    });

    try {
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {
      // LCP not supported
    }

    // Track FID (First Input Delay)
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        const fidEntry = entry as PerformanceEventTiming;
        if (fidEntry.processingStart) {
          trackPerformance('fid', fidEntry.processingStart - entry.startTime, 'ms');
        }
      });
    });

    try {
      fidObserver.observe({ type: 'first-input', buffered: true });
    } catch {
      // FID not supported
    }

    // Track CLS (Cumulative Layout Shift)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        const layoutShiftEntry = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
        if (!layoutShiftEntry.hadRecentInput && layoutShiftEntry.value) {
          clsValue += layoutShiftEntry.value;
        }
      });
    });

    try {
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch {
      // CLS not supported
    }

    // Track navigation timing
    if (performance.timing) {
      const timing = performance.timing;
      const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
      const domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
      const ttfb = timing.responseStart - timing.navigationStart;

      if (pageLoadTime > 0) trackPerformance('page_load', pageLoadTime, 'ms');
      if (domContentLoaded > 0) trackPerformance('dom_content_loaded', domContentLoaded, 'ms');
      if (ttfb > 0) trackPerformance('ttfb', ttfb, 'ms');
    }

    // Send CLS on page hide
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        trackPerformance('cls', clsValue);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      lcpObserver.disconnect();
      fidObserver.disconnect();
      clsObserver.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}

// =============================================================================
// useOnboardingTracking - Track onboarding flow
// =============================================================================

interface OnboardingTrackingReturn {
  startOnboarding: () => void;
  completeStep: (stepNumber: number, stepName: string) => void;
  skipStep: (stepNumber: number, stepName: string) => void;
  completeOnboarding: () => void;
  skipOnboarding: () => void;
}

/**
 * Hook for tracking onboarding flow
 */
export function useOnboardingTracking(): OnboardingTrackingReturn {
  const startTimeRef = useRef<number>(Date.now());

  const startOnboarding = useCallback(() => {
    startTimeRef.current = Date.now();
    trackEvent(ANALYTICS_EVENTS.STARTED);
    trackConversion('ONBOARDING_COMPLETION', 1);
  }, []);

  const completeStep = useCallback((stepNumber: number, stepName: string) => {
    trackEvent(ANALYTICS_EVENTS.STEP_COMPLETED, {
      stepNumber,
      stepName,
      timeSpentSeconds: Math.round((Date.now() - startTimeRef.current) / 1000),
    });
    trackConversion('ONBOARDING_COMPLETION', stepNumber + 1);
  }, []);

  const skipStep = useCallback((stepNumber: number, stepName: string) => {
    trackEvent(ANALYTICS_EVENTS.STEP_SKIPPED, {
      stepNumber,
      stepName,
    });
  }, []);

  const completeOnboarding = useCallback(() => {
    const totalTime = Math.round((Date.now() - startTimeRef.current) / 1000);
    trackEvent(ANALYTICS_EVENTS.COMPLETED, {
      totalTimeSeconds: totalTime,
    });
    trackConversion('ONBOARDING_COMPLETION', 5);
  }, []);

  const skipOnboarding = useCallback(() => {
    trackEvent(ANALYTICS_EVENTS.SKIPPED);
  }, []);

  return {
    startOnboarding,
    completeStep,
    skipStep,
    completeOnboarding,
    skipOnboarding,
  };
}

// =============================================================================
// useWorkflowTracking - Track workflow interactions
// =============================================================================

interface WorkflowTrackingReturn {
  trackCreate: (workflowId: string, workflowName: string, workflowType: string) => void;
  trackExecutionStart: (workflowId: string) => void;
  trackExecutionComplete: (workflowId: string, duration: number, tokensUsed?: number) => void;
  trackExecutionFailed: (workflowId: string, error: string) => void;
  trackNodeAdd: (workflowId: string, nodeType: string) => void;
  trackNodeConnect: (workflowId: string, sourceType: string, targetType: string) => void;
}

/**
 * Hook for tracking workflow interactions
 */
export function useWorkflowTracking(): WorkflowTrackingReturn {
  const trackCreate = useCallback((workflowId: string, workflowName: string, workflowType: string) => {
    trackEvent(ANALYTICS_EVENTS.CREATED, {
      workflowId,
      workflowName,
      workflowType,
    });
    trackConversion('WORKFLOW_CREATION', 1);
  }, []);

  const trackExecutionStart = useCallback((workflowId: string) => {
    trackEvent(ANALYTICS_EVENTS.EXECUTION_STARTED, { workflowId });
    trackConversion('WORKFLOW_CREATION', 4);
  }, []);

  const trackExecutionComplete = useCallback((workflowId: string, duration: number, tokensUsed?: number) => {
    trackEvent(ANALYTICS_EVENTS.EXECUTION_COMPLETED, {
      workflowId,
      executionDuration: duration,
      tokensUsed,
      executionStatus: 'success',
    });
    trackConversion('WORKFLOW_CREATION', 5);
    trackConversion('SIGNUP_TO_FIRST_WORKFLOW', 7);
  }, []);

  const trackExecutionFailed = useCallback((workflowId: string, error: string) => {
    trackEvent(ANALYTICS_EVENTS.EXECUTION_FAILED, {
      workflowId,
      errorMessage: error,
      executionStatus: 'failed',
    });
  }, []);

  const trackNodeAdd = useCallback((workflowId: string, nodeType: string) => {
    trackEvent(ANALYTICS_EVENTS.NODE_ADDED, { workflowId, nodeType });
    trackConversion('WORKFLOW_CREATION', 2);
  }, []);

  const trackNodeConnect = useCallback((workflowId: string, sourceType: string, targetType: string) => {
    trackEvent(ANALYTICS_EVENTS.NODE_CONNECTED, {
      workflowId,
      sourceType,
      targetType,
    });
    trackConversion('WORKFLOW_CREATION', 3);
  }, []);

  return {
    trackCreate,
    trackExecutionStart,
    trackExecutionComplete,
    trackExecutionFailed,
    trackNodeAdd,
    trackNodeConnect,
  };
}

export default useAnalytics;
