/**
 * Auto-OAuth Module - Seamless OAuth Authentication Based on User Email
 *
 * This module provides automatic OAuth connection initiation for users based on their email.
 * When a user's email matches a service domain (e.g., gmail.com, outlook.com), we can
 * automatically suggest and initiate OAuth connections for those services.
 *
 * Key Features:
 * - Email domain matching for workspace apps (Google Workspace, Microsoft 365, Slack)
 * - Automatic connection initiation using Composio's OAuth flow
 * - Connection status caching to avoid repeated checks
 * - Integration with user context and onboarding flow
 *
 * @module AutoOAuth
 */

import { composioClient } from '../../services/ComposioClient'
import { supabase } from '../supabase'

// ============================================================================
// Types
// ============================================================================

export interface AutoOAuthConfig {
  /** User's email address */
  email: string
  /** User ID (Clerk or Supabase) */
  userId: string
  /** Callback URL after OAuth completion */
  callbackUrl?: string
  /** Whether to auto-initiate connections without prompting */
  autoInitiate?: boolean
  /** Services to check (if not provided, all eligible services are checked) */
  services?: string[]
}

export interface ServiceMatch {
  /** Service/toolkit ID (e.g., 'gmail', 'slack') */
  serviceId: string
  /** Display name */
  name: string
  /** Icon/logo URL or emoji */
  icon: string
  /** Why this service was matched */
  matchReason: 'email_domain' | 'workspace_domain' | 'popular_for_role' | 'user_selected'
  /** Confidence score (0-1) */
  confidence: number
  /** Whether the user is already connected */
  isConnected: boolean
  /** OAuth URL if initiation is needed */
  authUrl?: string
  /** Whether this service supports email-based auto-connect */
  supportsAutoConnect: boolean
}

export interface AutoOAuthResult {
  /** Whether the auto-OAuth process was successful */
  success: boolean
  /** Services that matched the user's email */
  matchedServices: ServiceMatch[]
  /** Services that were auto-initiated */
  initiatedServices: string[]
  /** Services that are already connected */
  alreadyConnected: string[]
  /** Any errors that occurred */
  errors: Array<{ service: string; error: string }>
  /** Timestamp of the check */
  checkedAt: string
}

export interface ConnectionStatus {
  serviceId: string
  connected: boolean
  authUrl?: string
  expiresAt?: Date
  lastChecked: Date
  metadata?: Record<string, unknown>
}

// ============================================================================
// Service Domain Mappings
// ============================================================================

/**
 * Maps email domains to their primary services
 * This allows us to suggest relevant OAuth connections based on the user's email
 */
const EMAIL_DOMAIN_SERVICE_MAP: Record<string, {
  serviceId: string
  name: string
  icon: string
  confidence: number
  supportsAutoConnect: boolean
}[]> = {
  // Google domains
  'gmail.com': [
    { serviceId: 'gmail', name: 'Gmail', icon: '📧', confidence: 0.95, supportsAutoConnect: true },
    { serviceId: 'googlecalendar', name: 'Google Calendar', icon: '📅', confidence: 0.85, supportsAutoConnect: true },
    { serviceId: 'googlesheets', name: 'Google Sheets', icon: '📊', confidence: 0.75, supportsAutoConnect: true },
    { serviceId: 'googledrive', name: 'Google Drive', icon: '📁', confidence: 0.75, supportsAutoConnect: true },
  ],
  'googlemail.com': [
    { serviceId: 'gmail', name: 'Gmail', icon: '📧', confidence: 0.95, supportsAutoConnect: true },
    { serviceId: 'googlecalendar', name: 'Google Calendar', icon: '📅', confidence: 0.85, supportsAutoConnect: true },
  ],

  // Microsoft domains
  'outlook.com': [
    { serviceId: 'outlook', name: 'Outlook', icon: '📨', confidence: 0.95, supportsAutoConnect: true },
    { serviceId: 'microsoftcalendar', name: 'Microsoft Calendar', icon: '📅', confidence: 0.85, supportsAutoConnect: true },
    { serviceId: 'onedrive', name: 'OneDrive', icon: '☁️', confidence: 0.75, supportsAutoConnect: true },
  ],
  'hotmail.com': [
    { serviceId: 'outlook', name: 'Outlook', icon: '📨', confidence: 0.90, supportsAutoConnect: true },
  ],
  'live.com': [
    { serviceId: 'outlook', name: 'Outlook', icon: '📨', confidence: 0.90, supportsAutoConnect: true },
  ],
  'msn.com': [
    { serviceId: 'outlook', name: 'Outlook', icon: '📨', confidence: 0.85, supportsAutoConnect: true },
  ],

  // Yahoo
  'yahoo.com': [
    { serviceId: 'yahoo', name: 'Yahoo Mail', icon: '📧', confidence: 0.80, supportsAutoConnect: false },
  ],

  // iCloud
  'icloud.com': [
    { serviceId: 'icloud', name: 'iCloud', icon: '☁️', confidence: 0.85, supportsAutoConnect: false },
  ],
  'me.com': [
    { serviceId: 'icloud', name: 'iCloud', icon: '☁️', confidence: 0.80, supportsAutoConnect: false },
  ],
}

/**
 * Known Google Workspace / Microsoft 365 domain patterns
 * These indicate the user likely has access to the full suite
 */
const WORKSPACE_INDICATORS = {
  google: ['gsuite', 'google', 'gapps'],
  microsoft: ['microsoft', 'office365', 'o365'],
}

/**
 * Services that are universally popular and should be suggested
 * regardless of email domain
 */
const UNIVERSAL_SERVICES = [
  { serviceId: 'slack', name: 'Slack', icon: '💬', confidence: 0.6, supportsAutoConnect: true },
  { serviceId: 'github', name: 'GitHub', icon: '🐙', confidence: 0.5, supportsAutoConnect: true },
  { serviceId: 'notion', name: 'Notion', icon: '📝', confidence: 0.5, supportsAutoConnect: true },
]

// ============================================================================
// Auto-OAuth Manager Class
// ============================================================================

/**
 * AutoOAuthManager - Handles automatic OAuth connection based on user email
 */
class AutoOAuthManager {
  private connectionCache: Map<string, ConnectionStatus> = new Map()
  private cacheTTL = 5 * 60 * 1000 // 5 minutes

  /**
   * Analyze user email and find matching services
   */
  analyzeEmail(email: string): ServiceMatch[] {
    const matches: ServiceMatch[] = []
    const domain = this.extractDomain(email)

    if (!domain) {
      return matches
    }

    // Check for exact domain match
    const domainServices = EMAIL_DOMAIN_SERVICE_MAP[domain]
    if (domainServices) {
      for (const service of domainServices) {
        matches.push({
          ...service,
          matchReason: 'email_domain',
          isConnected: false, // Will be updated when checking connections
        })
      }
    }

    // Check for Google Workspace / Microsoft 365 domains
    // If not gmail/outlook but uses Google/Microsoft MX records, it's likely workspace
    if (!domainServices) {
      const workspaceType = this.detectWorkspaceType(domain)
      if (workspaceType === 'google') {
        matches.push(
          { serviceId: 'gmail', name: 'Gmail (Workspace)', icon: '📧', matchReason: 'workspace_domain', confidence: 0.85, isConnected: false, supportsAutoConnect: true },
          { serviceId: 'googlecalendar', name: 'Google Calendar', icon: '📅', matchReason: 'workspace_domain', confidence: 0.80, isConnected: false, supportsAutoConnect: true },
        )
      } else if (workspaceType === 'microsoft') {
        matches.push(
          { serviceId: 'outlook', name: 'Outlook (Microsoft 365)', icon: '📨', matchReason: 'workspace_domain', confidence: 0.85, isConnected: false, supportsAutoConnect: true },
          { serviceId: 'microsoftcalendar', name: 'Microsoft Calendar', icon: '📅', matchReason: 'workspace_domain', confidence: 0.80, isConnected: false, supportsAutoConnect: true },
        )
      }
    }

    // Add universal services with lower priority
    for (const service of UNIVERSAL_SERVICES) {
      if (!matches.some(m => m.serviceId === service.serviceId)) {
        matches.push({
          ...service,
          matchReason: 'popular_for_role',
          isConnected: false,
        })
      }
    }

    // Sort by confidence
    matches.sort((a, b) => b.confidence - a.confidence)

    return matches
  }

  /**
   * Check connection status for multiple services
   */
  async checkConnections(serviceIds: string[]): Promise<Map<string, ConnectionStatus>> {
    const results = new Map<string, ConnectionStatus>()
    const now = new Date()

    for (const serviceId of serviceIds) {
      // Check cache first
      const cached = this.connectionCache.get(serviceId)
      if (cached && (now.getTime() - cached.lastChecked.getTime()) < this.cacheTTL) {
        results.set(serviceId, cached)
        continue
      }

      // Check actual connection
      try {
        const status = await composioClient.checkConnection(serviceId)
        const connectionStatus: ConnectionStatus = {
          serviceId,
          connected: status.connected,
          authUrl: status.authUrl,
          expiresAt: status.expiresAt,
          lastChecked: now,
        }

        this.connectionCache.set(serviceId, connectionStatus)
        results.set(serviceId, connectionStatus)
      } catch (error) {
        console.error(`[AutoOAuth] Failed to check connection for ${serviceId}:`, error)
        results.set(serviceId, {
          serviceId,
          connected: false,
          lastChecked: now,
        })
      }
    }

    return results
  }

  /**
   * Initiate OAuth connection for a service
   */
  async initiateConnection(
    userId: string,
    serviceId: string,
    callbackUrl?: string
  ): Promise<{ authUrl?: string; error?: string }> {
    console.log(`[AutoOAuth] Initiating connection for ${serviceId} (user: ${userId})`)

    try {
      const result = await composioClient.connectUserApp(userId, serviceId, callbackUrl)

      if (result.authUrl) {
        // Update cache to reflect pending connection
        this.connectionCache.set(serviceId, {
          serviceId,
          connected: false,
          authUrl: result.authUrl,
          lastChecked: new Date(),
          metadata: { pending: true },
        })

        return { authUrl: result.authUrl }
      }

      return { error: result.error || 'Failed to get auth URL' }
    } catch (error) {
      console.error(`[AutoOAuth] Failed to initiate connection for ${serviceId}:`, error)
      return { error: error instanceof Error ? error.message : 'Connection initiation failed' }
    }
  }

  /**
   * Main auto-OAuth flow
   * Analyzes email, checks connections, and optionally initiates OAuth
   */
  async processAutoOAuth(config: AutoOAuthConfig): Promise<AutoOAuthResult> {
    const { email, userId, callbackUrl, autoInitiate = false, services } = config
    const startTime = new Date()

    console.log(`[AutoOAuth] Processing auto-OAuth for ${email}`)

    // Step 1: Analyze email to find matching services
    let matchedServices = this.analyzeEmail(email)

    // Filter to specific services if provided
    if (services && services.length > 0) {
      matchedServices = matchedServices.filter(s => services.includes(s.serviceId))
    }

    if (matchedServices.length === 0) {
      return {
        success: true,
        matchedServices: [],
        initiatedServices: [],
        alreadyConnected: [],
        errors: [],
        checkedAt: startTime.toISOString(),
      }
    }

    // Step 2: Check connection status for all matched services
    const serviceIds = matchedServices.map(s => s.serviceId)
    const connectionStatuses = await this.checkConnections(serviceIds)

    // Update matched services with connection status
    const alreadyConnected: string[] = []
    for (const service of matchedServices) {
      const status = connectionStatuses.get(service.serviceId)
      if (status) {
        service.isConnected = status.connected
        service.authUrl = status.authUrl
        if (status.connected) {
          alreadyConnected.push(service.serviceId)
        }
      }
    }

    // Step 3: Auto-initiate connections if enabled
    const initiatedServices: string[] = []
    const errors: Array<{ service: string; error: string }> = []

    if (autoInitiate) {
      const servicesToConnect = matchedServices.filter(
        s => !s.isConnected && s.supportsAutoConnect && s.confidence >= 0.8
      )

      for (const service of servicesToConnect) {
        const result = await this.initiateConnection(userId, service.serviceId, callbackUrl)
        if (result.authUrl) {
          service.authUrl = result.authUrl
          initiatedServices.push(service.serviceId)
        } else if (result.error) {
          errors.push({ service: service.serviceId, error: result.error })
        }
      }
    }

    // Step 4: Store the result in user profile for future reference
    await this.saveAutoOAuthResult(userId, {
      email,
      matchedServices: matchedServices.map(s => s.serviceId),
      alreadyConnected,
      initiatedServices,
      checkedAt: startTime.toISOString(),
    })

    return {
      success: errors.length === 0,
      matchedServices,
      initiatedServices,
      alreadyConnected,
      errors,
      checkedAt: startTime.toISOString(),
    }
  }

  /**
   * Quick check if user has any auto-OAuth suggestions
   * Returns without initiating any connections
   */
  async getAutoOAuthSuggestions(email: string): Promise<ServiceMatch[]> {
    const matches = this.analyzeEmail(email)
    const serviceIds = matches.map(s => s.serviceId)
    const connectionStatuses = await this.checkConnections(serviceIds)

    for (const match of matches) {
      const status = connectionStatuses.get(match.serviceId)
      if (status) {
        match.isConnected = status.connected
        match.authUrl = status.authUrl
      }
    }

    // Only return services that aren't connected yet
    return matches.filter(s => !s.isConnected)
  }

  /**
   * Save auto-OAuth result to user profile
   */
  private async saveAutoOAuthResult(
    userId: string,
    data: {
      email: string
      matchedServices: string[]
      alreadyConnected: string[]
      initiatedServices: string[]
      checkedAt: string
    }
  ): Promise<void> {
    try {
      // Update user_profiles table with auto_oauth_data
      const { error } = await supabase
        .from('user_profiles')
        .update({
          preferences: {
            auto_oauth: {
              lastCheck: data.checkedAt,
              email: data.email,
              matchedServices: data.matchedServices,
              connectedServices: data.alreadyConnected,
              initiatedServices: data.initiatedServices,
            },
          },
        })
        .eq('clerk_user_id', userId)

      if (error) {
        console.error('[AutoOAuth] Failed to save result to profile:', error)
      }
    } catch (error) {
      console.error('[AutoOAuth] Error saving auto-OAuth result:', error)
    }
  }

  /**
   * Clear connection cache (useful after OAuth callback)
   */
  clearCache(serviceId?: string): void {
    if (serviceId) {
      this.connectionCache.delete(serviceId)
    } else {
      this.connectionCache.clear()
    }
  }

  /**
   * Refresh connection status after OAuth callback
   */
  async handleOAuthCallback(serviceId: string, userId: string): Promise<ConnectionStatus> {
    console.log(`[AutoOAuth] Handling OAuth callback for ${serviceId}`)

    // Clear cache for this service
    this.clearCache(serviceId)

    // Re-check connection
    const statuses = await this.checkConnections([serviceId])
    const status = statuses.get(serviceId)

    if (status?.connected) {
      // Update user profile
      await this.updateUserConnectedService(userId, serviceId)
    }

    return status || {
      serviceId,
      connected: false,
      lastChecked: new Date(),
    }
  }

  /**
   * Update user's connected services in profile
   */
  private async updateUserConnectedService(userId: string, serviceId: string): Promise<void> {
    try {
      // Get current profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('preferences')
        .eq('clerk_user_id', userId)
        .single()

      const currentPreferences = profile?.preferences || {}
      const currentAutoOAuth = currentPreferences.auto_oauth || {}
      const connectedServices = new Set(currentAutoOAuth.connectedServices || [])
      connectedServices.add(serviceId)

      // Update with new connected service
      await supabase
        .from('user_profiles')
        .update({
          preferences: {
            ...currentPreferences,
            auto_oauth: {
              ...currentAutoOAuth,
              connectedServices: Array.from(connectedServices),
              lastConnected: new Date().toISOString(),
            },
          },
        })
        .eq('clerk_user_id', userId)

      console.log(`[AutoOAuth] Updated user profile with connected service: ${serviceId}`)
    } catch (error) {
      console.error('[AutoOAuth] Failed to update user connected service:', error)
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Extract domain from email address
   */
  private extractDomain(email: string): string | null {
    if (!email || !email.includes('@')) {
      return null
    }
    return email.split('@')[1]?.toLowerCase() || null
  }

  /**
   * Detect if a custom domain uses Google Workspace or Microsoft 365
   * This is a heuristic based on common patterns
   */
  private detectWorkspaceType(domain: string): 'google' | 'microsoft' | null {
    const lowerDomain = domain.toLowerCase()

    // Check for obvious indicators in domain name
    for (const indicator of WORKSPACE_INDICATORS.google) {
      if (lowerDomain.includes(indicator)) {
        return 'google'
      }
    }
    for (const indicator of WORKSPACE_INDICATORS.microsoft) {
      if (lowerDomain.includes(indicator)) {
        return 'microsoft'
      }
    }

    // For custom domains, we'd need to check MX records
    // This would require a server-side call, so we return null for now
    // and let the user manually select their email provider
    return null
  }

  /**
   * Get services that should be prioritized for a specific business type/role
   */
  getRoleBasedServices(role: string): ServiceMatch[] {
    const roleServices: Record<string, string[]> = {
      ecommerce: ['shopify', 'stripe', 'gmail', 'slack'],
      crm: ['salesforce', 'hubspot', 'gmail', 'slack'],
      support: ['zendesk', 'intercom', 'slack', 'gmail'],
      developer: ['github', 'slack', 'notion', 'gmail'],
      marketer: ['mailchimp', 'hubspot', 'slack', 'gmail'],
      freelancer: ['gmail', 'googlecalendar', 'slack', 'notion'],
    }

    const services = roleServices[role] || roleServices.freelancer
    return services.map(serviceId => ({
      serviceId,
      name: this.getServiceDisplayName(serviceId),
      icon: this.getServiceIcon(serviceId),
      matchReason: 'popular_for_role' as const,
      confidence: 0.7,
      isConnected: false,
      supportsAutoConnect: true,
    }))
  }

  private getServiceDisplayName(serviceId: string): string {
    const names: Record<string, string> = {
      gmail: 'Gmail',
      outlook: 'Outlook',
      slack: 'Slack',
      github: 'GitHub',
      notion: 'Notion',
      googlecalendar: 'Google Calendar',
      googlesheets: 'Google Sheets',
      googledrive: 'Google Drive',
      shopify: 'Shopify',
      stripe: 'Stripe',
      salesforce: 'Salesforce',
      hubspot: 'HubSpot',
      zendesk: 'Zendesk',
      intercom: 'Intercom',
      mailchimp: 'Mailchimp',
    }
    return names[serviceId] || serviceId
  }

  private getServiceIcon(serviceId: string): string {
    const icons: Record<string, string> = {
      gmail: '📧',
      outlook: '📨',
      slack: '💬',
      github: '🐙',
      notion: '📝',
      googlecalendar: '📅',
      googlesheets: '📊',
      googledrive: '📁',
      shopify: '🛒',
      stripe: '💳',
      salesforce: '☁️',
      hubspot: '🧡',
      zendesk: '🎫',
      intercom: '💬',
      mailchimp: '🐵',
    }
    return icons[serviceId] || '🔗'
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const autoOAuthManager = new AutoOAuthManager()

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Quick function to check if a user's email has auto-OAuth suggestions
 */
export async function getAutoOAuthSuggestions(email: string): Promise<ServiceMatch[]> {
  return autoOAuthManager.getAutoOAuthSuggestions(email)
}

/**
 * Process auto-OAuth for a user during onboarding
 */
export async function processOnboardingAutoOAuth(
  email: string,
  userId: string,
  options?: {
    autoInitiate?: boolean
    callbackUrl?: string
    role?: string
  }
): Promise<AutoOAuthResult> {
  // Get role-based services if role is provided
  let services: string[] | undefined
  if (options?.role) {
    const roleServices = autoOAuthManager.getRoleBasedServices(options.role)
    services = roleServices.map(s => s.serviceId)
  }

  return autoOAuthManager.processAutoOAuth({
    email,
    userId,
    autoInitiate: options?.autoInitiate ?? false,
    callbackUrl: options?.callbackUrl,
    services,
  })
}

/**
 * Handle OAuth callback and update connection status
 */
export async function handleAutoOAuthCallback(
  serviceId: string,
  userId: string
): Promise<ConnectionStatus> {
  return autoOAuthManager.handleOAuthCallback(serviceId, userId)
}

/**
 * Clear the auto-OAuth cache (useful when user explicitly disconnects)
 */
export function clearAutoOAuthCache(serviceId?: string): void {
  autoOAuthManager.clearCache(serviceId)
}
