import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAInstallState {
  isInstallable: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  isIOS: boolean;
  platform: 'ios' | 'android' | 'desktop' | 'unknown';
}

interface UsePWAInstallReturn extends PWAInstallState {
  install: () => Promise<boolean>;
  dismiss: () => void;
}

/**
 * Hook to manage PWA installation
 *
 * Features:
 * - Detects if app is installable (A2HS prompt available)
 * - Detects if app is already installed (standalone mode)
 * - Provides install function to trigger native prompt
 * - Platform detection for iOS-specific instructions
 *
 * @example
 * ```tsx
 * const { isInstallable, isInstalled, install, platform } = usePWAInstall();
 *
 * if (isInstallable && !isInstalled) {
 *   return <button onClick={install}>Install App</button>;
 * }
 * ```
 */
export function usePWAInstall(): UsePWAInstallReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Detect platform
  const getDevicePlatform = useCallback((): 'ios' | 'android' | 'desktop' | 'unknown' => {
    if (typeof navigator === 'undefined') return 'unknown';

    const userAgent = navigator.userAgent.toLowerCase();

    if (/iphone|ipad|ipod/.test(userAgent)) {
      return 'ios';
    }
    if (/android/.test(userAgent)) {
      return 'android';
    }
    if (/windows|macintosh|linux/.test(userAgent)) {
      return 'desktop';
    }
    return 'unknown';
  }, []);

  // Check if running in standalone mode (installed)
  const isStandalone = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;

    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://') ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches
    );
  }, []);

  const platform = getDevicePlatform();
  const isIOS = platform === 'ios';
  const standalone = isStandalone();

  useEffect(() => {
    // Check if already installed
    if (standalone) {
      setIsInstalled(true);
      return;
    }

    // Check localStorage for dismissed state
    const wasDismissed = localStorage.getItem('pwa-install-dismissed');
    if (wasDismissed) {
      const dismissedDate = new Date(wasDismissed);
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      // Reset dismissed state after 7 days
      if (daysSinceDismissed >= 7) {
        localStorage.removeItem('pwa-install-dismissed');
      } else {
        setDismissed(true);
      }
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for custom event from index.html
    const handlePWAInstallAvailable = (e: CustomEvent<BeforeInstallPromptEvent>) => {
      setDeferredPrompt(e.detail);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-install-available', handlePWAInstallAvailable as EventListener);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('pwa-installed', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-install-available', handlePWAInstallAvailable as EventListener);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('pwa-installed', handleAppInstalled);
    };
  }, [standalone]);

  const install = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      // For iOS, we can't trigger install programmatically
      // Return false to indicate manual instructions are needed
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;

      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        return true;
      }

      return false;
    } catch (error) {
      console.error('[PWA] Install failed:', error);
      return false;
    }
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  }, []);

  return {
    isInstallable: !dismissed && (!!deferredPrompt || (isIOS && !standalone)),
    isInstalled: isInstalled || standalone,
    isStandalone: standalone,
    isIOS,
    platform,
    install,
    dismiss,
  };
}

/**
 * Hook to detect online/offline status
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Hook to manage service worker updates
 */
export function useServiceWorkerUpdate(): {
  updateAvailable: boolean;
  update: () => void;
} {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.ready.then((reg) => {
      setRegistration(reg);

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
            }
          });
        }
      });
    });
  }, []);

  const update = useCallback(() => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, [registration]);

  return { updateAvailable, update };
}

export default usePWAInstall;
