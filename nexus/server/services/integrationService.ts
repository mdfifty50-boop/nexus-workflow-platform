import { createClient, SupabaseClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Initialize Supabase with service role for server operations
function getSupabaseAdmin(): SupabaseClient {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  return createClient(supabaseUrl, supabaseServiceKey)
}

// Integration Provider Configuration
export interface IntegrationProvider {
  id: string
  name: string
  category: 'crm' | 'email' | 'calendar' | 'storage' | 'communication'
  icon: string
  color: string
  authType: 'oauth2' | 'api_key' | 'basic'
  scopes?: string[]
  authUrl?: string
  tokenUrl?: string
  clientIdEnvVar?: string
  clientSecretEnvVar?: string
}

// Supported Integration Providers (Stories 6.4, 6.5, 6.6)
export const INTEGRATION_PROVIDERS: Record<string, IntegrationProvider> = {
  // CRM Integrations (Story 6.4)
  salesforce: {
    id: 'salesforce',
    name: 'Salesforce',
    category: 'crm',
    icon: '☁️',
    color: '#00A1E0',
    authType: 'oauth2',
    scopes: ['api', 'refresh_token', 'full'],
    authUrl: 'https://login.salesforce.com/services/oauth2/authorize',
    tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
    clientIdEnvVar: 'SALESFORCE_CLIENT_ID',
    clientSecretEnvVar: 'SALESFORCE_CLIENT_SECRET',
  },
  hubspot: {
    id: 'hubspot',
    name: 'HubSpot',
    category: 'crm',
    icon: '🔶',
    color: '#FF7A59',
    authType: 'oauth2',
    scopes: ['crm.objects.contacts.read', 'crm.objects.contacts.write', 'crm.objects.deals.read'],
    authUrl: 'https://app.hubspot.com/oauth/authorize',
    tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
    clientIdEnvVar: 'HUBSPOT_CLIENT_ID',
    clientSecretEnvVar: 'HUBSPOT_CLIENT_SECRET',
  },
  pipedrive: {
    id: 'pipedrive',
    name: 'Pipedrive',
    category: 'crm',
    icon: '🎯',
    color: '#21A038',
    authType: 'oauth2',
    scopes: ['deals:read', 'deals:write', 'contacts:read', 'contacts:write'],
    authUrl: 'https://oauth.pipedrive.com/oauth/authorize',
    tokenUrl: 'https://oauth.pipedrive.com/oauth/token',
    clientIdEnvVar: 'PIPEDRIVE_CLIENT_ID',
    clientSecretEnvVar: 'PIPEDRIVE_CLIENT_SECRET',
  },

  // Email Integrations (Story 6.5)
  gmail: {
    id: 'gmail',
    name: 'Gmail',
    category: 'email',
    icon: '📧',
    color: '#EA4335',
    authType: 'oauth2',
    scopes: ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/gmail.readonly'],
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    clientIdEnvVar: 'GOOGLE_CLIENT_ID',
    clientSecretEnvVar: 'GOOGLE_CLIENT_SECRET',
  },
  outlook: {
    id: 'outlook',
    name: 'Outlook',
    category: 'email',
    icon: '📬',
    color: '#0078D4',
    authType: 'oauth2',
    scopes: ['Mail.Read', 'Mail.Send', 'offline_access'],
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    clientIdEnvVar: 'MICROSOFT_CLIENT_ID',
    clientSecretEnvVar: 'MICROSOFT_CLIENT_SECRET',
  },

  // Calendar Integrations (Story 6.6)
  google_calendar: {
    id: 'google_calendar',
    name: 'Google Calendar',
    category: 'calendar',
    icon: '📅',
    color: '#4285F4',
    authType: 'oauth2',
    scopes: ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.events'],
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    clientIdEnvVar: 'GOOGLE_CLIENT_ID',
    clientSecretEnvVar: 'GOOGLE_CLIENT_SECRET',
  },
  outlook_calendar: {
    id: 'outlook_calendar',
    name: 'Outlook Calendar',
    category: 'calendar',
    icon: '🗓️',
    color: '#0078D4',
    authType: 'oauth2',
    scopes: ['Calendars.Read', 'Calendars.ReadWrite', 'offline_access'],
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    clientIdEnvVar: 'MICROSOFT_CLIENT_ID',
    clientSecretEnvVar: 'MICROSOFT_CLIENT_SECRET',
  },
}

// Simple encryption for tokens (in production, use proper key management)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'nexus-default-key-change-in-production!'

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    crypto.createHash('sha256').update(ENCRYPTION_KEY).digest(),
    iv
  )
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
}

function decrypt(encryptedText: string): string {
  try {
    const [ivHex, encrypted] = encryptedText.split(':')
    const iv = Buffer.from(ivHex, 'hex')
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      crypto.createHash('sha256').update(ENCRYPTION_KEY).digest(),
      iv
    )
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch {
    return ''
  }
}

// Integration credential interface
export interface IntegrationCredential {
  id: string
  created_at: string
  updated_at: string
  user_id: string
  project_id: string
  provider: string
  access_token_encrypted: string
  refresh_token_encrypted: string | null
  token_expires_at: string | null
  scopes: string[]
  metadata: Record<string, unknown>
  health_status: 'healthy' | 'warning' | 'error' | 'unknown'
  last_health_check: string | null
  usage_count: number
  last_used_at: string | null
}

export const integrationService = {
  /**
   * Generate OAuth authorization URL (Story 6.1)
   */
  generateAuthUrl(
    providerId: string,
    userId: string,
    projectId: string,
    redirectUri: string
  ): { url: string; state: string } | { error: string } {
    const provider = INTEGRATION_PROVIDERS[providerId]
    if (!provider) {
      return { error: `Unknown provider: ${providerId}` }
    }

    if (provider.authType !== 'oauth2') {
      return { error: `Provider ${providerId} does not support OAuth2` }
    }

    const clientId = process.env[provider.clientIdEnvVar || '']
    if (!clientId) {
      return { error: `${provider.name} integration not configured (missing client ID)` }
    }

    // Generate secure state parameter
    const state = Buffer.from(
      JSON.stringify({
        userId,
        projectId,
        providerId,
        timestamp: Date.now(),
        nonce: crypto.randomBytes(16).toString('hex'),
      })
    ).toString('base64url')

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: (provider.scopes || []).join(' '),
      state,
      access_type: 'offline', // For refresh token
      prompt: 'consent', // Force consent to get refresh token
    })

    return {
      url: `${provider.authUrl}?${params.toString()}`,
      state,
    }
  },

  /**
   * Exchange authorization code for tokens (Story 6.1)
   */
  async exchangeCodeForTokens(
    providerId: string,
    code: string,
    redirectUri: string,
    state: string
  ): Promise<{
    success: boolean
    credential?: IntegrationCredential
    error?: string
  }> {
    const provider = INTEGRATION_PROVIDERS[providerId]
    if (!provider) {
      return { success: false, error: `Unknown provider: ${providerId}` }
    }

    const clientId = process.env[provider.clientIdEnvVar || '']
    const clientSecret = process.env[provider.clientSecretEnvVar || '']

    if (!clientId || !clientSecret) {
      return { success: false, error: `${provider.name} integration not configured` }
    }

    try {
      // Decode state
      const stateData = JSON.parse(Buffer.from(state, 'base64url').toString())
      const { userId, projectId } = stateData

      // Exchange code for tokens
      const tokenResponse = await fetch(provider.tokenUrl!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      })

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text()
        return { success: false, error: `Token exchange failed: ${error}` }
      }

      const tokens = await tokenResponse.json() as any

      // Calculate token expiry
      const expiresAt = tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null

      // Store encrypted credentials
      const supabase = getSupabaseAdmin()
      const { data, error } = await supabase
        .from('integration_credentials')
        .upsert(
          {
            user_id: userId,
            project_id: projectId,
            provider: providerId,
            access_token_encrypted: encrypt(tokens.access_token),
            refresh_token_encrypted: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
            token_expires_at: expiresAt,
            scopes: provider.scopes || [],
            metadata: {
              connected_at: new Date().toISOString(),
              token_type: tokens.token_type,
            },
            health_status: 'healthy',
            last_health_check: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,project_id,provider',
          }
        )
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, credential: data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  /**
   * Refresh access token (Story 6.3)
   */
  async refreshToken(credentialId: string): Promise<{
    success: boolean
    error?: string
  }> {
    const supabase = getSupabaseAdmin()

    const { data: credential, error: fetchError } = await supabase
      .from('integration_credentials')
      .select('*')
      .eq('id', credentialId)
      .single()

    if (fetchError || !credential) {
      return { success: false, error: 'Credential not found' }
    }

    if (!credential.refresh_token_encrypted) {
      return { success: false, error: 'No refresh token available' }
    }

    const provider = INTEGRATION_PROVIDERS[credential.provider]
    if (!provider) {
      return { success: false, error: 'Unknown provider' }
    }

    const clientId = process.env[provider.clientIdEnvVar || '']
    const clientSecret = process.env[provider.clientSecretEnvVar || '']

    if (!clientId || !clientSecret) {
      return { success: false, error: 'Integration not configured' }
    }

    try {
      const refreshToken = decrypt(credential.refresh_token_encrypted)

      const tokenResponse = await fetch(provider.tokenUrl!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      })

      if (!tokenResponse.ok) {
        // Mark as error status
        await supabase
          .from('integration_credentials')
          .update({ health_status: 'error', last_health_check: new Date().toISOString() })
          .eq('id', credentialId)
        return { success: false, error: 'Token refresh failed' }
      }

      const tokens = await tokenResponse.json() as any

      const expiresAt = tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null

      await supabase
        .from('integration_credentials')
        .update({
          access_token_encrypted: encrypt(tokens.access_token),
          refresh_token_encrypted: tokens.refresh_token
            ? encrypt(tokens.refresh_token)
            : credential.refresh_token_encrypted,
          token_expires_at: expiresAt,
          health_status: 'healthy',
          last_health_check: new Date().toISOString(),
        })
        .eq('id', credentialId)

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  /**
   * Get decrypted access token for API calls
   */
  async getAccessToken(
    userId: string,
    projectId: string,
    providerId: string
  ): Promise<{ token: string } | { error: string }> {
    const supabase = getSupabaseAdmin()

    const { data: credential, error } = await supabase
      .from('integration_credentials')
      .select('*')
      .eq('user_id', userId)
      .eq('project_id', projectId)
      .eq('provider', providerId)
      .single()

    if (error || !credential) {
      return { error: 'Integration not connected' }
    }

    // Check if token is expired
    if (credential.token_expires_at) {
      const expiresAt = new Date(credential.token_expires_at)
      if (expiresAt < new Date()) {
        // Try to refresh
        const refreshResult = await this.refreshToken(credential.id)
        if (!refreshResult.success) {
          return { error: 'Token expired and refresh failed' }
        }

        // Fetch updated credential
        const { data: updated } = await supabase
          .from('integration_credentials')
          .select('access_token_encrypted')
          .eq('id', credential.id)
          .single()

        if (updated) {
          return { token: decrypt(updated.access_token_encrypted) }
        }
      }
    }

    // Update usage stats
    await supabase
      .from('integration_credentials')
      .update({
        usage_count: (credential.usage_count || 0) + 1,
        last_used_at: new Date().toISOString(),
      })
      .eq('id', credential.id)

    return { token: decrypt(credential.access_token_encrypted) }
  },

  /**
   * Check integration health (Story 6.2)
   */
  async checkHealth(credentialId: string): Promise<{
    status: 'healthy' | 'warning' | 'error'
    message: string
  }> {
    const supabase = getSupabaseAdmin()

    const { data: credential, error } = await supabase
      .from('integration_credentials')
      .select('*')
      .eq('id', credentialId)
      .single()

    if (error || !credential) {
      return { status: 'error', message: 'Credential not found' }
    }

    const provider = INTEGRATION_PROVIDERS[credential.provider]
    if (!provider) {
      return { status: 'error', message: 'Unknown provider' }
    }

    try {
      const token = decrypt(credential.access_token_encrypted)

      // Provider-specific health checks
      let checkUrl = ''
      let headers: Record<string, string> = { Authorization: `Bearer ${token}` }

      switch (credential.provider) {
        case 'hubspot':
          checkUrl = 'https://api.hubapi.com/crm/v3/objects/contacts?limit=1'
          break
        case 'salesforce':
          checkUrl = `${credential.metadata?.instance_url || ''}/services/data/v57.0/sobjects`
          break
        case 'gmail':
        case 'google_calendar':
          checkUrl = 'https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + token
          headers = {}
          break
        case 'outlook':
        case 'outlook_calendar':
          checkUrl = 'https://graph.microsoft.com/v1.0/me'
          break
        default:
          // Generic OAuth2 token validation
          return { status: 'warning', message: 'Health check not implemented for this provider' }
      }

      const response = await fetch(checkUrl, { headers })

      let status: 'healthy' | 'warning' | 'error' = 'healthy'
      let message = 'Connection is working'

      if (!response.ok) {
        if (response.status === 401) {
          // Try refresh
          const refreshResult = await this.refreshToken(credentialId)
          if (refreshResult.success) {
            status = 'warning'
            message = 'Token was refreshed'
          } else {
            status = 'error'
            message = 'Authentication failed - reconnection required'
          }
        } else {
          status = 'warning'
          message = `API returned status ${response.status}`
        }
      }

      // Update health status
      await supabase
        .from('integration_credentials')
        .update({
          health_status: status,
          last_health_check: new Date().toISOString(),
        })
        .eq('id', credentialId)

      return { status, message }
    } catch (error: any) {
      await supabase
        .from('integration_credentials')
        .update({
          health_status: 'error',
          last_health_check: new Date().toISOString(),
        })
        .eq('id', credentialId)

      return { status: 'error', message: error.message }
    }
  },

  /**
   * Get all integrations for a project
   */
  async getProjectIntegrations(
    userId: string,
    projectId: string
  ): Promise<Array<IntegrationCredential & { provider_info: IntegrationProvider }>> {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('integration_credentials')
      .select('*')
      .eq('user_id', userId)
      .eq('project_id', projectId)

    if (error || !data) {
      return []
    }

    return data.map((cred) => ({
      ...cred,
      provider_info: INTEGRATION_PROVIDERS[cred.provider],
    }))
  },

  /**
   * Disconnect integration
   */
  async disconnectIntegration(
    userId: string,
    projectId: string,
    providerId: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabaseAdmin()

    const { error } = await supabase
      .from('integration_credentials')
      .delete()
      .eq('user_id', userId)
      .eq('project_id', projectId)
      .eq('provider', providerId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  },

  /**
   * Get integration usage analytics (Story 6.7)
   */
  async getUsageAnalytics(
    userId: string,
    projectId: string
  ): Promise<{
    totalIntegrations: number
    byCategory: Record<string, number>
    byProvider: Record<string, { usageCount: number; lastUsed: string | null; status: string }>
    healthSummary: { healthy: number; warning: number; error: number }
  }> {
    const integrations = await this.getProjectIntegrations(userId, projectId)

    const byCategory: Record<string, number> = {}
    const byProvider: Record<string, { usageCount: number; lastUsed: string | null; status: string }> = {}
    const healthSummary = { healthy: 0, warning: 0, error: 0 }

    for (const integration of integrations) {
      const category = integration.provider_info?.category || 'other'
      byCategory[category] = (byCategory[category] || 0) + 1

      byProvider[integration.provider] = {
        usageCount: integration.usage_count || 0,
        lastUsed: integration.last_used_at,
        status: integration.health_status || 'unknown',
      }

      if (integration.health_status === 'healthy') healthSummary.healthy++
      else if (integration.health_status === 'warning') healthSummary.warning++
      else healthSummary.error++
    }

    return {
      totalIntegrations: integrations.length,
      byCategory,
      byProvider,
      healthSummary,
    }
  },

  /**
   * Get available providers
   */
  getAvailableProviders(): IntegrationProvider[] {
    return Object.values(INTEGRATION_PROVIDERS)
  },
}
