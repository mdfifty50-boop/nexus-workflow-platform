// Push Notification Service for Nexus Platform
// Handles browser push notification subscriptions and permissions

import type { PushSubscription as PushSubType } from '@/types/notification'

// VAPID public key - in production, this should come from environment variables
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'

// Convert base64 to Uint8Array for push subscription
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

export type PushPermissionState = 'granted' | 'denied' | 'default' | 'unsupported'

export interface PushNotificationService {
  isSupported: boolean
  permissionState: PushPermissionState
  subscription: PushSubscription | null
  requestPermission: () => Promise<PushPermissionState>
  subscribe: () => Promise<PushSubType | null>
  unsubscribe: () => Promise<boolean>
  showNotification: (title: string, options?: NotificationOptions) => Promise<void>
}

class PushNotificationManager implements PushNotificationService {
  isSupported: boolean
  permissionState: PushPermissionState = 'default'
  subscription: PushSubscription | null = null
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null

  constructor() {
    this.isSupported = this.checkSupport()
    if (this.isSupported) {
      this.permissionState = Notification.permission as PushPermissionState
      this.initServiceWorker()
    } else {
      this.permissionState = 'unsupported'
    }
  }

  private checkSupport(): boolean {
    return (
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window
    )
  }

  private async initServiceWorker(): Promise<void> {
    try {
      // Check if service worker is already registered
      const registrations = await navigator.serviceWorker.getRegistrations()
      this.serviceWorkerRegistration = registrations[0] || null

      if (!this.serviceWorkerRegistration) {
        // Register a new service worker for push notifications
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js')
      }

      // Get existing subscription
      if (this.serviceWorkerRegistration) {
        const existingSub = await this.serviceWorkerRegistration.pushManager.getSubscription()
        this.subscription = existingSub
      }
    } catch (error) {
      console.warn('Service worker initialization failed:', error)
    }
  }

  async requestPermission(): Promise<PushPermissionState> {
    if (!this.isSupported) {
      return 'unsupported'
    }

    try {
      const permission = await Notification.requestPermission()
      this.permissionState = permission as PushPermissionState
      return this.permissionState
    } catch (error) {
      console.error('Failed to request notification permission:', error)
      return this.permissionState
    }
  }

  async subscribe(): Promise<PushSubType | null> {
    if (!this.isSupported || !this.serviceWorkerRegistration) {
      console.warn('Push notifications not supported or service worker not registered')
      return null
    }

    if (this.permissionState !== 'granted') {
      const permission = await this.requestPermission()
      if (permission !== 'granted') {
        return null
      }
    }

    try {
      // Unsubscribe from any existing subscription
      const existingSub = await this.serviceWorkerRegistration.pushManager.getSubscription()
      if (existingSub) {
        await existingSub.unsubscribe()
      }

      // Create new subscription
      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      })

      this.subscription = subscription

      // Convert to our internal format for storage
      const p256dhKey = subscription.getKey('p256dh')
      const authKey = subscription.getKey('auth')

      const pushSubData: PushSubType = {
        id: crypto.randomUUID(),
        user_id: '', // Will be set by the caller
        created_at: new Date().toISOString(),
        endpoint: subscription.endpoint,
        p256dh_key: p256dhKey ? btoa(String.fromCharCode(...new Uint8Array(p256dhKey))) : '',
        auth_key: authKey ? btoa(String.fromCharCode(...new Uint8Array(authKey))) : '',
        user_agent: navigator.userAgent,
        is_active: true,
      }

      return pushSubData
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
      return null
    }
  }

  async unsubscribe(): Promise<boolean> {
    if (!this.subscription) {
      return true
    }

    try {
      const success = await this.subscription.unsubscribe()
      if (success) {
        this.subscription = null
      }
      return success
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error)
      return false
    }
  }

  async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (!this.isSupported) {
      console.warn('Notifications not supported')
      return
    }

    if (this.permissionState !== 'granted') {
      console.warn('Notification permission not granted')
      return
    }

    try {
      // Use service worker for better notification handling
      if (this.serviceWorkerRegistration) {
        await this.serviceWorkerRegistration.showNotification(title, {
          icon: '/nexus-icon-192.png',
          badge: '/nexus-badge-72.png',
          requireInteraction: false,
          ...options,
        })
      } else {
        // Fallback to basic notification
        new Notification(title, {
          icon: '/nexus-icon-192.png',
          ...options,
        })
      }
    } catch (error) {
      console.error('Failed to show notification:', error)
    }
  }
}

// Singleton instance
let pushNotificationService: PushNotificationService | null = null

export function getPushNotificationService(): PushNotificationService {
  if (!pushNotificationService) {
    pushNotificationService = new PushNotificationManager()
  }
  return pushNotificationService
}

// React hook for push notifications
export function usePushNotifications() {
  const service = getPushNotificationService()

  return {
    isSupported: service.isSupported,
    permissionState: service.permissionState,
    isSubscribed: !!service.subscription,
    requestPermission: service.requestPermission.bind(service),
    subscribe: service.subscribe.bind(service),
    unsubscribe: service.unsubscribe.bind(service),
    showNotification: service.showNotification.bind(service),
  }
}

// Helper to check if push is currently enabled
export function isPushEnabled(): boolean {
  const service = getPushNotificationService()
  return service.isSupported && service.permissionState === 'granted' && !!service.subscription
}

// Helper to show a local notification (without going through push server)
export async function showLocalNotification(
  title: string,
  body: string,
  options?: Partial<NotificationOptions>
): Promise<void> {
  const service = getPushNotificationService()
  await service.showNotification(title, {
    body,
    tag: crypto.randomUUID(),
    ...options,
  })
}
