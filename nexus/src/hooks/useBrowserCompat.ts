/**
 * useBrowserCompat Hook
 *
 * React hook for accessing browser detection and feature support
 * information throughout the application.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  getBrowserInfo,
  getFeatureSupport,
  smoothScrollTo,
  getVendorPrefix,
  isBrowserSupported,
  getBrowserWarning,
  type BrowserInfo,
  type FeatureSupport
} from '../lib/browserCompat';

/**
 * Main hook for browser compatibility information
 */
export function useBrowserCompat() {
  const [browser] = useState<BrowserInfo>(() => getBrowserInfo());
  const [features] = useState<FeatureSupport>(() => getFeatureSupport());

  const isSupported = useMemo(() => isBrowserSupported(), []);
  const warning = useMemo(() => getBrowserWarning(), []);
  const vendorPrefix = useMemo(() => getVendorPrefix(), []);

  return {
    browser,
    features,
    isSupported,
    warning,
    vendorPrefix
  };
}

/**
 * Hook for checking if running on iOS
 */
export function useIsIOS(): boolean {
  const { browser } = useBrowserCompat();
  return browser.isIOS;
}

/**
 * Hook for checking if running on Android
 */
export function useIsAndroid(): boolean {
  const { browser } = useBrowserCompat();
  return browser.isAndroid;
}

/**
 * Hook for checking if running on mobile device
 */
export function useIsMobile(): boolean {
  const { browser } = useBrowserCompat();
  return browser.isMobile;
}

/**
 * Hook for checking if running on tablet
 */
export function useIsTablet(): boolean {
  const { browser } = useBrowserCompat();
  return browser.isTablet;
}

/**
 * Hook for checking if running on desktop
 */
export function useIsDesktop(): boolean {
  const { browser } = useBrowserCompat();
  return browser.isDesktop;
}

/**
 * Hook for detecting specific browser
 */
export function useBrowserName(): BrowserInfo['name'] {
  const { browser } = useBrowserCompat();
  return browser.name;
}

/**
 * Hook for checking if a specific feature is supported
 */
export function useFeatureSupport(feature: keyof FeatureSupport): boolean {
  const { features } = useBrowserCompat();
  return features[feature];
}

/**
 * Hook for smooth scrolling with fallback
 */
export function useSmoothScroll() {
  const scrollTo = useCallback((target: HTMLElement | number, options?: {
    behavior?: ScrollBehavior;
    block?: ScrollLogicalPosition;
  }) => {
    smoothScrollTo(target, options);
  }, []);

  const scrollToTop = useCallback(() => {
    smoothScrollTo(0);
  }, []);

  const scrollToElement = useCallback((selector: string, options?: {
    behavior?: ScrollBehavior;
    block?: ScrollLogicalPosition;
  }) => {
    const element = document.querySelector(selector);
    if (element instanceof HTMLElement) {
      smoothScrollTo(element, options);
    }
  }, []);

  return {
    scrollTo,
    scrollToTop,
    scrollToElement
  };
}

/**
 * Hook for detecting viewport size changes (iOS 100vh fix)
 */
export function useViewportHeight(): number {
  const [height, setHeight] = useState<number>(() => window.innerHeight);
  const { browser } = useBrowserCompat();

  useEffect(() => {
    const updateHeight = () => {
      setHeight(window.innerHeight);

      // Update CSS custom property for iOS
      if (browser.isIOS) {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      }
    };

    window.addEventListener('resize', updateHeight);
    window.addEventListener('orientationchange', () => {
      // Delay for orientation change animation
      setTimeout(updateHeight, 100);
    });

    // Initial set
    updateHeight();

    return () => {
      window.removeEventListener('resize', updateHeight);
    };
  }, [browser.isIOS]);

  return height;
}

/**
 * Hook for detecting safe area insets (notched devices)
 */
export function useSafeAreaInsets(): {
  top: number;
  right: number;
  bottom: number;
  left: number;
} {
  const [insets, setInsets] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  });

  useEffect(() => {
    // Get computed safe area insets from CSS
    const computedStyle = getComputedStyle(document.documentElement);

    const getInset = (property: string): number => {
      const value = computedStyle.getPropertyValue(property);
      return parseInt(value, 10) || 0;
    };

    setInsets({
      top: getInset('--safe-area-inset-top') || getInset('env(safe-area-inset-top)'),
      right: getInset('--safe-area-inset-right') || getInset('env(safe-area-inset-right)'),
      bottom: getInset('--safe-area-inset-bottom') || getInset('env(safe-area-inset-bottom)'),
      left: getInset('--safe-area-inset-left') || getInset('env(safe-area-inset-left)')
    });
  }, []);

  return insets;
}

/**
 * Hook for detecting touch capability
 */
export function useHasTouch(): boolean {
  const { features } = useBrowserCompat();
  return features.touchEvents;
}

/**
 * Hook for detecting backdrop-filter support (for glass effects)
 */
export function useBackdropFilterSupport(): boolean {
  const { features } = useBrowserCompat();
  return features.backdropFilter;
}

/**
 * Hook for applying CSS gap fallback classes
 */
export function useFlexGapSupport(): {
  supported: boolean;
  className: string;
} {
  const { features } = useBrowserCompat();

  return {
    supported: features.cssGap,
    className: features.cssGap ? '' : 'no-css-gap'
  };
}

/**
 * Hook for getting platform-specific classes
 */
export function usePlatformClasses(): string {
  const { browser } = useBrowserCompat();

  const classes: string[] = [];

  if (browser.isIOS) classes.push('is-ios');
  if (browser.isAndroid) classes.push('is-android');
  if (browser.isMobile) classes.push('is-mobile');
  if (browser.isTablet) classes.push('is-tablet');
  if (browser.isDesktop) classes.push('is-desktop');
  classes.push(`browser-${browser.name}`);
  classes.push(`engine-${browser.engine}`);

  return classes.join(' ');
}

/**
 * Hook for responsive breakpoint detection
 */
export function useBreakpoint(): 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' {
  const [breakpoint, setBreakpoint] = useState<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'>('md');

  useEffect(() => {
    const getBreakpoint = (): 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' => {
      const width = window.innerWidth;
      if (width < 480) return 'xs';
      if (width < 640) return 'sm';
      if (width < 768) return 'md';
      if (width < 1024) return 'lg';
      if (width < 1280) return 'xl';
      return '2xl';
    };

    const handleResize = () => {
      setBreakpoint(getBreakpoint());
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return breakpoint;
}

/**
 * Hook for media query matching
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);

    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Legacy browsers
      mediaQuery.addListener(handleChange);
    }

    // Initial check
    setMatches(mediaQuery.matches);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [query]);

  return matches;
}

/**
 * Hook for detecting reduced motion preference
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/**
 * Hook for detecting high contrast preference
 */
export function usePrefersHighContrast(): boolean {
  return useMediaQuery('(prefers-contrast: high)');
}

/**
 * Hook for detecting dark mode preference
 */
export function usePrefersDarkMode(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)');
}

// Re-export types
export type { BrowserInfo, FeatureSupport };

// Default export
export default useBrowserCompat;
