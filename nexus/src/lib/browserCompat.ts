/**
 * Browser Compatibility Utilities
 *
 * Provides browser detection, feature detection, and polyfill loading
 * for cross-browser compatibility in Nexus application.
 */

// Browser detection result type
export interface BrowserInfo {
  name: 'chrome' | 'firefox' | 'safari' | 'edge' | 'opera' | 'ie' | 'unknown';
  version: number;
  isIOS: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  engine: 'blink' | 'gecko' | 'webkit' | 'trident' | 'unknown';
}

// Feature support detection result
export interface FeatureSupport {
  backdropFilter: boolean;
  scrollBehavior: boolean;
  cssGap: boolean;
  cssGrid: boolean;
  cssVariables: boolean;
  intersectionObserver: boolean;
  resizeObserver: boolean;
  mutationObserver: boolean;
  webAnimations: boolean;
  touchEvents: boolean;
  pointerEvents: boolean;
  webGL: boolean;
  serviceWorker: boolean;
  indexedDB: boolean;
  localStorage: boolean;
  sessionStorage: boolean;
  fetch: boolean;
  promises: boolean;
  asyncAwait: boolean;
  modules: boolean;
  webComponents: boolean;
  customElements: boolean;
  shadowDOM: boolean;
  cssContainment: boolean;
  contentVisibility: boolean;
  aspectRatio: boolean;
  safeAreaInsets: boolean;
  containerQueries: boolean;
}

/**
 * Detect the current browser and its characteristics
 */
export function detectBrowser(): BrowserInfo {
  const ua = navigator.userAgent;
  const vendor = navigator.vendor || '';

  // Default values
  let name: BrowserInfo['name'] = 'unknown';
  let version = 0;
  let engine: BrowserInfo['engine'] = 'unknown';

  // Detect browser
  if (/Edg\//.test(ua)) {
    name = 'edge';
    version = parseFloat(ua.match(/Edg\/(\d+(\.\d+)?)/)?.[1] || '0');
    engine = 'blink';
  } else if (/OPR\/|Opera/.test(ua)) {
    name = 'opera';
    version = parseFloat(ua.match(/(?:OPR|Opera)\/(\d+(\.\d+)?)/)?.[1] || '0');
    engine = 'blink';
  } else if (/Chrome\//.test(ua) && vendor.includes('Google')) {
    name = 'chrome';
    version = parseFloat(ua.match(/Chrome\/(\d+(\.\d+)?)/)?.[1] || '0');
    engine = 'blink';
  } else if (/Safari\//.test(ua) && vendor.includes('Apple')) {
    name = 'safari';
    version = parseFloat(ua.match(/Version\/(\d+(\.\d+)?)/)?.[1] || '0');
    engine = 'webkit';
  } else if (/Firefox\//.test(ua)) {
    name = 'firefox';
    version = parseFloat(ua.match(/Firefox\/(\d+(\.\d+)?)/)?.[1] || '0');
    engine = 'gecko';
  } else if (/Trident\/|MSIE/.test(ua)) {
    name = 'ie';
    version = parseFloat(ua.match(/(?:MSIE |rv:)(\d+(\.\d+)?)/)?.[1] || '0');
    engine = 'trident';
  }

  // Detect platform
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);
  const isMobile = /Mobile|Android.*Mobile/.test(ua) || (isIOS && !/iPad/.test(ua));
  const isTablet = /iPad|Android(?!.*Mobile)/.test(ua) || (isIOS && window.innerWidth >= 768);
  const isDesktop = !isMobile && !isTablet;

  return {
    name,
    version,
    isIOS,
    isAndroid,
    isMobile,
    isTablet,
    isDesktop,
    engine
  };
}

/**
 * Detect supported features in the current browser
 */
export function detectFeatures(): FeatureSupport {
  // CSS feature detection helper
  const cssSupports = (property: string, value: string): boolean => {
    if (typeof CSS !== 'undefined' && CSS.supports) {
      return CSS.supports(property, value);
    }
    // Fallback for older browsers
    const el = document.createElement('div');
    el.style.cssText = `${property}: ${value}`;
    return el.style.length > 0;
  };

  // Check for backdrop-filter support
  const backdropFilter = cssSupports('backdrop-filter', 'blur(10px)') ||
                         cssSupports('-webkit-backdrop-filter', 'blur(10px)');

  // Check for scroll-behavior support
  const scrollBehavior = cssSupports('scroll-behavior', 'smooth');

  // Check for CSS gap in flexbox
  const cssGap = (() => {
    const el = document.createElement('div');
    el.style.display = 'flex';
    el.style.gap = '1px';
    return el.style.gap === '1px';
  })();

  // Check for CSS Grid
  const cssGrid = cssSupports('display', 'grid');

  // Check for CSS Variables
  const cssVariables = cssSupports('--test', '0');

  // Check for safe-area-inset support
  const safeAreaInsets = cssSupports('padding-top', 'env(safe-area-inset-top)');

  // Check for container queries
  const containerQueries = cssSupports('container-type', 'inline-size');

  // Check for CSS containment
  const cssContainment = cssSupports('contain', 'layout');

  // Check for content-visibility
  const contentVisibility = cssSupports('content-visibility', 'auto');

  // Check for aspect-ratio
  const aspectRatio = cssSupports('aspect-ratio', '1 / 1');

  return {
    backdropFilter,
    scrollBehavior,
    cssGap,
    cssGrid,
    cssVariables,
    intersectionObserver: typeof IntersectionObserver !== 'undefined',
    resizeObserver: typeof ResizeObserver !== 'undefined',
    mutationObserver: typeof MutationObserver !== 'undefined',
    webAnimations: typeof Element !== 'undefined' && 'animate' in Element.prototype,
    touchEvents: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    pointerEvents: 'PointerEvent' in window,
    webGL: (() => {
      try {
        const canvas = document.createElement('canvas');
        return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
      } catch {
        return false;
      }
    })(),
    serviceWorker: 'serviceWorker' in navigator,
    indexedDB: 'indexedDB' in window,
    localStorage: (() => {
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return true;
      } catch {
        return false;
      }
    })(),
    sessionStorage: (() => {
      try {
        sessionStorage.setItem('test', 'test');
        sessionStorage.removeItem('test');
        return true;
      } catch {
        return false;
      }
    })(),
    fetch: typeof fetch !== 'undefined',
    promises: typeof Promise !== 'undefined',
    asyncAwait: (() => {
      try {
        // eslint-disable-next-line no-new-func
        new Function('async () => {}');
        return true;
      } catch {
        return false;
      }
    })(),
    modules: 'noModule' in document.createElement('script'),
    webComponents: 'customElements' in window,
    customElements: 'customElements' in window,
    shadowDOM: 'attachShadow' in Element.prototype,
    cssContainment,
    contentVisibility,
    aspectRatio,
    safeAreaInsets,
    containerQueries
  };
}

/**
 * Apply browser-specific CSS class to document for targeted fixes
 */
export function applyBrowserClasses(): void {
  const browser = detectBrowser();
  const features = detectFeatures();
  const html = document.documentElement;

  // Browser classes
  html.classList.add(`browser-${browser.name}`);
  html.classList.add(`engine-${browser.engine}`);

  // Platform classes
  if (browser.isIOS) html.classList.add('is-ios');
  if (browser.isAndroid) html.classList.add('is-android');
  if (browser.isMobile) html.classList.add('is-mobile');
  if (browser.isTablet) html.classList.add('is-tablet');
  if (browser.isDesktop) html.classList.add('is-desktop');

  // Feature classes (for CSS fallbacks)
  if (!features.backdropFilter) html.classList.add('no-backdrop-filter');
  if (!features.scrollBehavior) html.classList.add('no-scroll-behavior');
  if (!features.cssGap) html.classList.add('no-css-gap');
  if (!features.safeAreaInsets) html.classList.add('no-safe-area');
  if (!features.containerQueries) html.classList.add('no-container-queries');

  // Touch device class
  if (features.touchEvents) html.classList.add('has-touch');
}

/**
 * Load polyfills for missing features
 *
 * Note: Modern browsers (Chrome 80+, Firefox 75+, Safari 13+, Edge 80+) support
 * IntersectionObserver, ResizeObserver, and smooth scroll natively.
 * Polyfills are only logged as warnings for legacy browsers to reduce bundle size.
 */
export async function loadPolyfills(): Promise<void> {
  const features = detectFeatures();

  // Log warnings for missing features in legacy browsers
  // Modern browsers have native support - no polyfills bundled to reduce size
  if (!features.intersectionObserver) {
    console.warn('[BrowserCompat] IntersectionObserver not supported. Consider updating your browser.');
  }

  if (!features.resizeObserver) {
    console.warn('[BrowserCompat] ResizeObserver not supported. Consider updating your browser.');
  }

  if (!features.scrollBehavior) {
    console.warn('[BrowserCompat] Smooth scroll not natively supported. Fallback animation will be used.');
  }
}

/**
 * Smooth scroll with fallback for browsers without native support
 */
export function smoothScrollTo(
  target: HTMLElement | number,
  options?: { behavior?: ScrollBehavior; block?: ScrollLogicalPosition }
): void {
  const features = detectFeatures();

  if (typeof target === 'number') {
    if (features.scrollBehavior) {
      window.scrollTo({ top: target, behavior: 'smooth' });
    } else {
      // Fallback animation
      const startY = window.scrollY;
      const diff = target - startY;
      const duration = 300;
      let start: number | null = null;

      const step = (timestamp: number) => {
        if (!start) start = timestamp;
        const time = timestamp - start;
        const percent = Math.min(time / duration, 1);
        const easePercent = 0.5 - Math.cos(percent * Math.PI) / 2;
        window.scrollTo(0, startY + diff * easePercent);
        if (time < duration) {
          requestAnimationFrame(step);
        }
      };

      requestAnimationFrame(step);
    }
  } else {
    if (features.scrollBehavior) {
      target.scrollIntoView({ behavior: 'smooth', ...options });
    } else {
      // Calculate target position and animate
      const rect = target.getBoundingClientRect();
      const targetY = window.scrollY + rect.top - 100;
      smoothScrollTo(targetY);
    }
  }
}

/**
 * Get CSS vendor prefix for current browser
 */
export function getVendorPrefix(): string {
  const browser = detectBrowser();
  switch (browser.engine) {
    case 'webkit':
      return '-webkit-';
    case 'gecko':
      return '-moz-';
    case 'trident':
      return '-ms-';
    default:
      return '';
  }
}

/**
 * Apply prefixed style property
 */
export function setPrefixedStyle(
  element: HTMLElement,
  property: string,
  value: string
): void {
  const prefix = getVendorPrefix();

  // Apply prefixed version first
  if (prefix) {
    const prefixedProperty = prefix + property;
    element.style.setProperty(prefixedProperty, value);
  }

  // Apply standard property
  element.style.setProperty(property, value);
}

/**
 * Fix for iOS 100vh issue
 */
export function fixIOSViewportHeight(): void {
  const browser = detectBrowser();

  if (browser.isIOS) {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', () => {
      setTimeout(setVH, 100);
    });
  }
}

/**
 * Initialize all browser compatibility fixes
 */
export async function initBrowserCompat(): Promise<{
  browser: BrowserInfo;
  features: FeatureSupport;
}> {
  const browser = detectBrowser();
  const features = detectFeatures();

  // Apply browser classes
  applyBrowserClasses();

  // Fix iOS viewport height
  fixIOSViewportHeight();

  // Load polyfills
  await loadPolyfills();

  // Log browser info in development
  if (import.meta.env.DEV) {
    console.log('[BrowserCompat] Browser:', browser);
    console.log('[BrowserCompat] Features:', features);
  }

  return { browser, features };
}

// Singleton instances for caching
let cachedBrowser: BrowserInfo | null = null;
let cachedFeatures: FeatureSupport | null = null;

/**
 * Get cached browser info (or detect if not cached)
 */
export function getBrowserInfo(): BrowserInfo {
  if (!cachedBrowser) {
    cachedBrowser = detectBrowser();
  }
  return cachedBrowser;
}

/**
 * Get cached feature support (or detect if not cached)
 */
export function getFeatureSupport(): FeatureSupport {
  if (!cachedFeatures) {
    cachedFeatures = detectFeatures();
  }
  return cachedFeatures;
}

/**
 * Check if the current browser is supported
 */
export function isBrowserSupported(): boolean {
  const browser = getBrowserInfo();
  const features = getFeatureSupport();

  // Minimum browser versions
  const minVersions: Record<BrowserInfo['name'], number> = {
    chrome: 80,
    firefox: 75,
    safari: 13,
    edge: 80,
    opera: 67,
    ie: Infinity, // IE is not supported
    unknown: 0
  };

  // Check browser version
  if (browser.version < minVersions[browser.name]) {
    return false;
  }

  // Check critical features
  const criticalFeatures: (keyof FeatureSupport)[] = [
    'cssVariables',
    'cssGrid',
    'fetch',
    'promises'
  ];

  return criticalFeatures.every(feature => features[feature]);
}

/**
 * Get browser support warning message
 */
export function getBrowserWarning(): string | null {
  const browser = getBrowserInfo();

  if (browser.name === 'ie') {
    return 'Internet Explorer is not supported. Please use a modern browser like Chrome, Firefox, Safari, or Edge.';
  }

  if (!isBrowserSupported()) {
    return `Your browser (${browser.name} ${browser.version}) may not support all features. Please update to the latest version for the best experience.`;
  }

  return null;
}

export default {
  detectBrowser,
  detectFeatures,
  applyBrowserClasses,
  loadPolyfills,
  smoothScrollTo,
  getVendorPrefix,
  setPrefixedStyle,
  fixIOSViewportHeight,
  initBrowserCompat,
  getBrowserInfo,
  getFeatureSupport,
  isBrowserSupported,
  getBrowserWarning
};
