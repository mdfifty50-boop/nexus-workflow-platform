/**
 * OAuthController.ts
 *
 * Phase 4 of Nexus Architecture Overhaul (partial)
 *
 * PURPOSE: Extract OAuth handling from WorkflowPreviewCard.tsx (God Component)
 * Reduces WorkflowPreviewCard by ~500 lines while preserving all fix behaviors.
 *
 * @NEXUS-FIX-044: OAuth controller extraction
 *
 * PRESERVES:
 * - @NEXUS-FIX-001: Popup blocker bypass (open popup BEFORE async)
 * - @NEXUS-FIX-002: Expired connection detection
 * - @NEXUS-FIX-003: Parallel OAuth
 *
 * KEY FEATURES:
 * 1. Centralized connection state management
 * 2. Popup window lifecycle management
 * 3. Polling with configurable intervals and timeouts
 * 4. OAuth callback message handling
 * 5. Event-based status updates
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Connection status from Rube/Composio
 */
export type ConnectionStatus = 'ACTIVE' | 'PENDING' | 'NOT_CONNECTED' | 'EXPIRED' | 'ERROR';

/**
 * Individual integration connection state
 */
export interface IntegrationConnection {
  toolkit: string;
  name: string;
  status: ConnectionStatus;
  authUrl?: string;
  popup?: Window | null;
  isPolling: boolean;
  lastChecked?: number;
  error?: string;
}

/**
 * OAuth controller configuration
 */
export interface OAuthConfig {
  pollInterval: number;      // ms between connection checks (default: 3000)
  pollTimeout: number;       // ms before giving up (default: 120000)
  maxRetries: number;        // max retries on error (default: 3)
  onStatusChange?: (toolkit: string, status: ConnectionStatus) => void;
  onAllConnected?: () => void;
  onError?: (toolkit: string, error: string) => void;
  onLog?: (message: string) => void;
}

/**
 * Connection check result from Rube
 */
export interface RubeConnectionResult {
  toolkit: string;
  status: ConnectionStatus;
  authUrl?: string;
  userInfo?: Record<string, unknown>;
}

/**
 * Rube client interface (subset of RubeClient)
 */
export interface RubeClientInterface {
  checkConnection(toolkit: string): Promise<{ status: ConnectionStatus }>;
  initiateConnection(toolkits: string[]): Promise<Map<string, { authUrl?: string; status?: ConnectionStatus; error?: string }>>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CONFIG: Required<Pick<OAuthConfig, 'pollInterval' | 'pollTimeout' | 'maxRetries'>> = {
  pollInterval: 3000,
  pollTimeout: 120000,
  maxRetries: 3
};

/**
 * Popup window dimensions
 */
const POPUP_CONFIG = {
  width: 600,
  height: 700,
  features: (width: number, height: number) => {
    const left = Math.round((window.screen.width - width) / 2);
    const top = Math.round((window.screen.height - height) / 2);
    return `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`;
  }
};

/**
 * Loading HTML for popup while fetching OAuth URL
 */
const POPUP_LOADING_HTML = (integrationName: string) => `
  <!DOCTYPE html>
  <html>
    <head>
      <title>Connecting to ${integrationName}...</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          text-align: center;
        }
        .container { max-width: 400px; padding: 40px; }
        h2 { margin-bottom: 20px; font-weight: 500; }
        .spinner {
          width: 50px;
          height: 50px;
          border: 3px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 20px auto;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        p { opacity: 0.9; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Connecting to ${integrationName}</h2>
        <div class="spinner"></div>
        <p>Preparing secure authentication...</p>
        <p style="margin-top: 30px; font-size: 12px; opacity: 0.7;">
          This window will redirect shortly.
        </p>
      </div>
    </body>
  </html>
`;

// ============================================================================
// OAUTH CONTROLLER
// ============================================================================

/**
 * OAuthController - Manages OAuth flows for workflow integrations
 *
 * @NEXUS-FIX-044: Extracted from WorkflowPreviewCard
 *
 * Preserves critical fixes:
 * - @NEXUS-FIX-001: Opens popup SYNCHRONOUSLY before any async call
 * - @NEXUS-FIX-002: Detects expired connections
 * - @NEXUS-FIX-003: Handles parallel OAuth for multiple integrations
 */
export class OAuthController {
  private connections = new Map<string, IntegrationConnection>();
  private pollTimers = new Map<string, number>();
  private config: OAuthConfig;
  private rubeClient: RubeClientInterface;
  private messageHandler: ((event: MessageEvent) => void) | null = null;

  constructor(rubeClient: RubeClientInterface, config: Partial<OAuthConfig> = {}) {
    this.rubeClient = rubeClient;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.setupMessageListener();
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Initialize connections for required integrations
   */
  async initialize(integrations: Array<{ toolkit: string; name: string }>): Promise<void> {
    for (const integration of integrations) {
      this.connections.set(integration.toolkit, {
        toolkit: integration.toolkit,
        name: integration.name,
        status: 'NOT_CONNECTED',
        isPolling: false
      });
    }

    await this.checkAllConnections();
  }

  /**
   * Check connection status for all integrations
   */
  async checkAllConnections(): Promise<Map<string, ConnectionStatus>> {
    const results = new Map<string, ConnectionStatus>();
    const checkPromises: Promise<void>[] = [];

    for (const [toolkit] of this.connections) {
      checkPromises.push(
        this.checkConnection(toolkit).then(status => {
          results.set(toolkit, status);
        })
      );
    }

    await Promise.all(checkPromises);

    // Check if all connected
    const allConnected = Array.from(results.values()).every(s => s === 'ACTIVE');
    if (allConnected) {
      this.config.onAllConnected?.();
    }

    return results;
  }

  /**
   * Check single integration connection
   */
  async checkConnection(toolkit: string): Promise<ConnectionStatus> {
    const conn = this.connections.get(toolkit);
    if (!conn) return 'NOT_CONNECTED';

    try {
      const result = await this.rubeClient.checkConnection(toolkit);
      const status = result.status || 'NOT_CONNECTED';

      this.updateConnection(toolkit, { status, lastChecked: Date.now() });
      this.config.onStatusChange?.(toolkit, status);

      return status;
    } catch (error) {
      this.log(`Error checking ${toolkit}: ${error}`);
      return conn.status;
    }
  }

  /**
   * Connect a single integration
   *
   * @NEXUS-FIX-001: Opens popup BEFORE async call to bypass popup blocker
   */
  async connectSingle(toolkit: string): Promise<boolean> {
    const conn = this.connections.get(toolkit);
    if (!conn) return false;

    if (conn.status === 'ACTIVE') {
      this.log(`${conn.name} already connected`);
      return true;
    }

    this.log(`Connecting to ${conn.name}...`);

    // @NEXUS-FIX-001: Open popup SYNCHRONOUSLY (before async)
    const popup = this.openPopup(conn.name);
    if (!popup) {
      this.config.onError?.(toolkit, 'Popup blocked - please allow popups');
      return false;
    }

    this.updateConnection(toolkit, { popup });

    try {
      // Now make async call to get OAuth URL
      const results = await this.rubeClient.initiateConnection([toolkit]);
      const result = results.get(toolkit);

      if (result?.authUrl) {
        // Navigate popup to OAuth URL
        popup.location.href = result.authUrl;
        this.storeOAuthContext(toolkit, result.authUrl);
        this.startPolling(toolkit);
        return true;
      } else if (result?.status === 'ACTIVE') {
        // Already connected
        popup.close();
        this.updateConnection(toolkit, { status: 'ACTIVE', popup: null });
        this.config.onStatusChange?.(toolkit, 'ACTIVE');
        return true;
      } else {
        popup.close();
        const errorMsg = result?.error || 'Failed to get OAuth URL';
        this.config.onError?.(toolkit, errorMsg);
        return false;
      }
    } catch (error) {
      popup.close();
      const errorMsg = error instanceof Error ? error.message : 'Connection failed';
      this.config.onError?.(toolkit, errorMsg);
      return false;
    }
  }

  /**
   * Connect multiple integrations in parallel
   *
   * @NEXUS-FIX-003: Parallel OAuth with popup blocker bypass
   */
  async connectAll(toolkits?: string[]): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    const toConnect = toolkits
      ? Array.from(this.connections.values()).filter(c => toolkits.includes(c.toolkit))
      : Array.from(this.connections.values());

    const notConnected = toConnect.filter(c => c.status !== 'ACTIVE');

    if (notConnected.length === 0) {
      this.log('All integrations already connected');
      for (const conn of toConnect) {
        results.set(conn.toolkit, true);
      }
      return results;
    }

    this.log(`Connecting ${notConnected.length} integration(s)...`);

    // @NEXUS-FIX-001 & @NEXUS-FIX-003: Open ALL popups SYNCHRONOUSLY first
    const popups = new Map<string, Window | null>();
    for (const conn of notConnected) {
      const popup = this.openPopup(conn.name);
      popups.set(conn.toolkit, popup);
      if (popup) {
        this.updateConnection(conn.toolkit, { popup });
      } else {
        this.log(`Popup blocked for ${conn.name}`);
      }
    }

    try {
      // Get OAuth URLs in parallel
      const toolkitsToConnect = notConnected.map(c => c.toolkit);
      const authResults = await this.rubeClient.initiateConnection(toolkitsToConnect);

      // Process results
      for (const conn of notConnected) {
        const popup = popups.get(conn.toolkit);
        const result = authResults.get(conn.toolkit);

        if (result?.authUrl && popup && !popup.closed) {
          // Navigate to OAuth URL
          popup.location.href = result.authUrl;
          this.storeOAuthContext(conn.toolkit, result.authUrl);
          this.startPolling(conn.toolkit);
          results.set(conn.toolkit, true);
        } else if (result?.status === 'ACTIVE') {
          // Already connected
          if (popup && !popup.closed) popup.close();
          this.updateConnection(conn.toolkit, { status: 'ACTIVE', popup: null });
          this.config.onStatusChange?.(conn.toolkit, 'ACTIVE');
          results.set(conn.toolkit, true);
        } else {
          // Failed
          if (popup && !popup.closed) popup.close();
          const errorMsg = result?.error || 'Failed to initiate connection';
          this.config.onError?.(conn.toolkit, errorMsg);
          results.set(conn.toolkit, false);
        }
      }
    } catch (error) {
      // Close all popups on error
      for (const popup of popups.values()) {
        if (popup && !popup.closed) popup.close();
      }

      const errorMsg = error instanceof Error ? error.message : 'Connection failed';
      for (const conn of notConnected) {
        this.config.onError?.(conn.toolkit, errorMsg);
        results.set(conn.toolkit, false);
      }
    }

    return results;
  }

  /**
   * Get current connection status
   */
  getStatus(toolkit: string): IntegrationConnection | undefined {
    return this.connections.get(toolkit);
  }

  /**
   * Get all connections
   */
  getAllConnections(): Map<string, IntegrationConnection> {
    return new Map(this.connections);
  }

  /**
   * Check if all integrations are connected
   */
  isAllConnected(): boolean {
    return Array.from(this.connections.values()).every(c => c.status === 'ACTIVE');
  }

  /**
   * Get missing (not connected) integrations
   */
  getMissingIntegrations(): IntegrationConnection[] {
    return Array.from(this.connections.values()).filter(c => c.status !== 'ACTIVE');
  }

  /**
   * Cancel polling for a toolkit
   */
  cancelPolling(toolkit: string): void {
    const timerId = this.pollTimers.get(toolkit);
    if (timerId) {
      clearInterval(timerId);
      this.pollTimers.delete(toolkit);
    }
    this.updateConnection(toolkit, { isPolling: false });
  }

  /**
   * Cancel all polling and cleanup
   */
  destroy(): void {
    // Cancel all polling
    for (const toolkit of this.pollTimers.keys()) {
      this.cancelPolling(toolkit);
    }

    // Close any open popups
    for (const conn of this.connections.values()) {
      if (conn.popup && !conn.popup.closed) {
        conn.popup.close();
      }
    }

    // Remove message listener
    if (this.messageHandler) {
      window.removeEventListener('message', this.messageHandler);
      this.messageHandler = null;
    }

    this.connections.clear();
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Open popup window for OAuth
   *
   * @NEXUS-FIX-001: Must be called SYNCHRONOUSLY (not after await)
   */
  private openPopup(integrationName: string): Window | null {
    const popup = window.open(
      'about:blank',
      `oauth_${integrationName.toLowerCase().replace(/\s+/g, '_')}`,
      POPUP_CONFIG.features(POPUP_CONFIG.width, POPUP_CONFIG.height)
    );

    if (popup) {
      // Write loading HTML
      popup.document.write(POPUP_LOADING_HTML(integrationName));
      popup.document.close();
    }

    return popup;
  }

  /**
   * Store OAuth context for callback page
   */
  private storeOAuthContext(toolkit: string, authUrl: string): void {
    sessionStorage.setItem('oauth_pending', JSON.stringify({
      toolkit,
      authUrl,
      timestamp: Date.now()
    }));
  }

  /**
   * Start polling for connection completion
   */
  private startPolling(toolkit: string): void {
    this.updateConnection(toolkit, { isPolling: true });

    const startTime = Date.now();
    let retries = 0;

    const pollFn = async () => {
      // Check timeout
      if (Date.now() - startTime > this.config.pollTimeout) {
        this.cancelPolling(toolkit);
        this.log(`Connection timeout for ${toolkit}`);
        this.config.onError?.(toolkit, 'Connection timed out');
        return;
      }

      try {
        const status = await this.checkConnection(toolkit);

        if (status === 'ACTIVE') {
          this.cancelPolling(toolkit);
          this.log(`${toolkit} connected successfully!`);

          // Close popup if still open
          const conn = this.connections.get(toolkit);
          if (conn?.popup && !conn.popup.closed) {
            conn.popup.close();
          }

          // Check if all connected
          if (this.isAllConnected()) {
            this.config.onAllConnected?.();
          }
        }
      } catch (error) {
        retries++;
        if (retries >= this.config.maxRetries) {
          this.cancelPolling(toolkit);
          this.config.onError?.(toolkit, 'Connection check failed');
        }
      }
    };

    // Initial check
    pollFn();

    // Set up interval
    const timerId = window.setInterval(pollFn, this.config.pollInterval);
    this.pollTimers.set(toolkit, timerId);
  }

  /**
   * Handle OAuth callback messages from popup windows
   */
  private setupMessageListener(): void {
    this.messageHandler = (event: MessageEvent) => {
      // Validate origin (same origin for now)
      if (event.origin !== window.location.origin) return;

      const data = event.data;
      if (!data || typeof data !== 'object') return;

      // Check for OAuth callback message
      if (data.type === 'oauth_callback' || data.type === 'OAUTH_SUCCESS') {
        const { success, provider, toolkit, error } = data;
        const tk = toolkit || provider;

        if (!tk) return;

        this.log(`OAuth callback received for ${tk}: ${success ? 'success' : error}`);

        if (success) {
          this.updateConnection(tk, { status: 'ACTIVE' });
          this.config.onStatusChange?.(tk, 'ACTIVE');
          this.cancelPolling(tk);

          // Close popup
          const conn = this.connections.get(tk);
          if (conn?.popup && !conn.popup.closed) {
            conn.popup.close();
          }

          // Check if all connected
          if (this.isAllConnected()) {
            this.config.onAllConnected?.();
          }
        } else {
          this.updateConnection(tk, { status: 'ERROR', error });
          this.config.onError?.(tk, error || 'OAuth failed');
        }
      }
    };

    window.addEventListener('message', this.messageHandler);
  }

  /**
   * Update connection state
   */
  private updateConnection(toolkit: string, updates: Partial<IntegrationConnection>): void {
    const conn = this.connections.get(toolkit);
    if (conn) {
      this.connections.set(toolkit, { ...conn, ...updates });
    }
  }

  /**
   * Log message if handler provided
   */
  private log(message: string): void {
    console.log(`[OAuthController] ${message}`);
    this.config.onLog?.(message);
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create an OAuthController instance
 *
 * Usage:
 * ```typescript
 * const controller = createOAuthController(rubeClient, {
 *   onStatusChange: (toolkit, status) => updateUI(toolkit, status),
 *   onAllConnected: () => executeWorkflow(),
 *   onError: (toolkit, error) => showError(toolkit, error),
 *   onLog: (msg) => addLog(msg)
 * });
 *
 * await controller.initialize(requiredIntegrations);
 * await controller.connectAll();
 * ```
 */
export function createOAuthController(
  rubeClient: RubeClientInterface,
  config?: Partial<OAuthConfig>
): OAuthController {
  return new OAuthController(rubeClient, config);
}

// ============================================================================
// REACT HOOK (for easy integration)
// ============================================================================

/**
 * Hook return type
 */
export interface UseOAuthResult {
  connections: Map<string, IntegrationConnection>;
  isAllConnected: boolean;
  isPolling: boolean;
  connectAll: () => Promise<void>;
  connectSingle: (toolkit: string) => Promise<boolean>;
  checkConnections: () => Promise<void>;
}

/**
 * React hook for OAuth controller (to be used in components)
 *
 * Example usage in WorkflowPreviewCard:
 * ```tsx
 * const oauth = useOAuthController(rubeClient, requiredIntegrations, {
 *   onAllConnected: () => executeWorkflow()
 * });
 *
 * return (
 *   <div>
 *     {oauth.isAllConnected ? (
 *       <ExecuteButton />
 *     ) : (
 *       <ConnectAllButton onClick={oauth.connectAll} />
 *     )}
 *   </div>
 * );
 * ```
 *
 * Note: This is a placeholder - actual React hook implementation
 * would need to be in a .tsx file with proper React imports
 */
export const createOAuthHookConfig = (config: Partial<OAuthConfig>) => ({
  ...DEFAULT_CONFIG,
  ...config
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a connection status indicates connected
 */
export function isConnected(status: ConnectionStatus): boolean {
  return status === 'ACTIVE';
}

/**
 * Check if a connection needs refresh (expired)
 *
 * @NEXUS-FIX-002: Expired connection detection
 */
export function needsRefresh(status: ConnectionStatus): boolean {
  return status === 'EXPIRED';
}

/**
 * Get user-friendly status message
 */
export function getStatusMessage(status: ConnectionStatus): string {
  switch (status) {
    case 'ACTIVE':
      return 'Connected';
    case 'PENDING':
      return 'Connecting...';
    case 'NOT_CONNECTED':
      return 'Not connected';
    case 'EXPIRED':
      return 'Connection expired - please reconnect';
    case 'ERROR':
      return 'Connection error';
    default:
      return 'Unknown status';
  }
}

/**
 * Get status color class for UI
 */
export function getStatusColor(status: ConnectionStatus): string {
  switch (status) {
    case 'ACTIVE':
      return 'text-green-600 bg-green-50';
    case 'PENDING':
      return 'text-blue-600 bg-blue-50';
    case 'NOT_CONNECTED':
      return 'text-gray-600 bg-gray-50';
    case 'EXPIRED':
      return 'text-amber-600 bg-amber-50';
    case 'ERROR':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}
