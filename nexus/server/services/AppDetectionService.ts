/**
 * App Detection Service
 *
 * Detects when users mention apps/tools in their messages and
 * enriches the context with tool discovery information.
 *
 * Example: User says "I use Pipeline for my CRM"
 * → Detects "Pipeline" as potential CRM tool
 * → Calls tool discovery to check support level
 * → Adds context about what's available/missing
 */

import { toolDiscoveryService, ToolDiscoveryResult } from './ToolDiscoveryService'
import { composioService } from './ComposioService'

// Common app/tool keywords that might indicate user is mentioning a tool
const APP_PATTERNS = [
  // CRM
  { pattern: /\b(pipeline|pipedrive|salesforce|hubspot|zoho|freshsales|monday|close\.io|copper|insightly)\b/gi, category: 'CRM' },
  // Accounting
  { pattern: /\b(wave|quickbooks|xero|freshbooks|zoho books|sage|netsuite|kashoo)\b/gi, category: 'ACCOUNTING' },
  // ERP
  { pattern: /\b(odoo|sap|oracle|dynamics|netsuite|acumatica|epicor)\b/gi, category: 'ERP' },
  // POS
  { pattern: /\b(square|shopify pos|lightspeed|clover|toast|vend|revel)\b/gi, category: 'POS' },
  // Project Management
  { pattern: /\b(asana|trello|monday|clickup|notion|jira|basecamp|wrike|teamwork)\b/gi, category: 'PROJECT' },
  // Communication
  { pattern: /\b(slack|discord|teams|zoom|google meet|webex|telegram|whatsapp)\b/gi, category: 'COMMUNICATION' },
  // Storage
  { pattern: /\b(dropbox|google drive|onedrive|box|s3|sharepoint)\b/gi, category: 'STORAGE' },
  // Email
  { pattern: /\b(gmail|outlook|sendgrid|mailchimp|mailgun|postmark|ses)\b/gi, category: 'EMAIL' },
  // Calendar
  { pattern: /\b(google calendar|outlook calendar|calendly|cal\.com|doodle)\b/gi, category: 'CALENDAR' },
  // Social
  { pattern: /\b(twitter|x|linkedin|facebook|instagram|buffer|hootsuite)\b/gi, category: 'SOCIAL' },
  // E-commerce
  { pattern: /\b(shopify|woocommerce|magento|bigcommerce|etsy|amazon seller)\b/gi, category: 'ECOMMERCE' },
  // Analytics
  { pattern: /\b(google analytics|mixpanel|amplitude|segment|hotjar|plausible)\b/gi, category: 'ANALYTICS' },
  // HR
  { pattern: /\b(bamboohr|gusto|rippling|workday|zenefits|deel|remote)\b/gi, category: 'HR' },
  // Support
  { pattern: /\b(zendesk|intercom|freshdesk|helpscout|crisp|tawk)\b/gi, category: 'SUPPORT' },
]

// Context phrases that suggest user is asking about using a tool
const USAGE_CONTEXT_PATTERNS = [
  /i use\s+([a-z]+)/gi,
  /we use\s+([a-z]+)/gi,
  /using\s+([a-z]+)/gi,
  /connect(?:ed)? to\s+([a-z]+)/gi,
  /integrate with\s+([a-z]+)/gi,
  /sync with\s+([a-z]+)/gi,
  /from\s+([a-z]+)/gi,
  /to\s+([a-z]+)/gi,
  /in\s+([a-z]+)\s+(?:crm|app|tool|system)/gi,
  /my\s+([a-z]+)\s+(?:account|data|contacts)/gi,
]

// GAP-4: GENERIC_APP_PATTERN — Universal catch-all heuristic for ANY app mention
// Catches apps not in the pre-mapped APP_PATTERNS list above
// Examples: "I use Wafeq for accounting", "my KashFlow account", "connect to Todoist"
const GENERIC_APP_PATTERN = [
  // "I/we use [AppName]" or "using [AppName]"
  /(?:i|we)\s+(?:use|work\s+with|have|manage\s+with|rely\s+on|switched?\s+to)\s+([A-Z][a-zA-Z0-9.]+)/g,
  // "[AppName] app/tool/platform/system/software/service/account"
  /\b([A-Z][a-zA-Z0-9.]{2,})\s+(?:app|tool|platform|system|software|service|account|dashboard|workspace|integration)\b/g,
  // "my [AppName] account/data/contacts"
  /my\s+([A-Z][a-zA-Z0-9.]{2,})\s+(?:account|data|contacts|files|workspace|dashboard|inbox|board|list)\b/g,
  // "connect/integrate/sync [AppName]"
  /(?:connect|integrate|sync|link|hook\s+up|pair)\s+(?:to\s+|with\s+)?([A-Z][a-zA-Z0-9.]{2,})\b/g,
  // "from [AppName] to [AppName]"
  /from\s+([A-Z][a-zA-Z0-9.]{2,})\s+to\s+([A-Z][a-zA-Z0-9.]{2,})/g,
]

// Words that look like app names but aren't (filter false positives)
const GENERIC_APP_BLOCKLIST = new Set([
  'the', 'this', 'that', 'when', 'what', 'which', 'where', 'how', 'who',
  'and', 'but', 'for', 'not', 'can', 'could', 'would', 'should', 'will',
  'every', 'each', 'all', 'any', 'some', 'our', 'your', 'their', 'its',
  'new', 'old', 'first', 'last', 'next', 'best', 'more', 'most', 'other',
  'help', 'make', 'create', 'build', 'send', 'get', 'set', 'add', 'run',
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august',
  'september', 'october', 'november', 'december',
  'yes', 'yeah', 'sure', 'okay', 'thanks', 'please', 'hello', 'hey',
])

export interface DetectedApp {
  name: string
  category: string
  originalMatch: string
}

export interface AppDetectionResult {
  detectedApps: DetectedApp[]
  toolDiscoveryResults: ToolDiscoveryResult[]
  contextEnrichment: string
  hasLimitedSupport: boolean
}

class AppDetectionService {
  /**
   * Detect app mentions in a message
   */
  detectApps(message: string): DetectedApp[] {
    const detected: DetectedApp[] = []
    const seenApps = new Set<string>()

    // Phase 1: Check pre-mapped APP_PATTERNS (known apps)
    for (const { pattern, category } of APP_PATTERNS) {
      let match
      // Reset regex state
      pattern.lastIndex = 0
      while ((match = pattern.exec(message)) !== null) {
        const appName = match[0].toLowerCase()
        if (!seenApps.has(appName)) {
          seenApps.add(appName)
          detected.push({
            name: appName,
            category,
            originalMatch: match[0],
          })
        }
      }
    }

    // Phase 2: GAP-4 — GENERIC_APP_PATTERN catch-all heuristic for unknown apps
    // Detects capitalized app names in usage context that weren't caught by static patterns
    for (const pattern of GENERIC_APP_PATTERN) {
      let match
      pattern.lastIndex = 0
      while ((match = pattern.exec(message)) !== null) {
        // Extract all capture groups (some patterns have 2 groups, e.g. "from X to Y")
        for (let i = 1; i < match.length; i++) {
          if (!match[i]) continue
          const appName = match[i].toLowerCase()
          if (seenApps.has(appName)) continue
          if (GENERIC_APP_BLOCKLIST.has(appName)) continue
          if (appName.length < 3) continue  // Too short to be an app name
          seenApps.add(appName)
          detected.push({
            name: appName,
            category: 'UNKNOWN',
            originalMatch: match[i],
          })
        }
      }
    }

    return detected
  }

  /**
   * Check if message suggests user wants to use/integrate with an app
   */
  hasUsageContext(message: string): boolean {
    for (const pattern of USAGE_CONTEXT_PATTERNS) {
      pattern.lastIndex = 0
      if (pattern.test(message)) {
        return true
      }
    }
    return false
  }

  /**
   * Detect apps and get discovery info for each
   */
  /**
   * @param userId - Should be derived from getUserEntityId(req) at the call site
   * @NEXUS-FIX-022: Multi-tenant identity - callers must pass per-user entity ID
   */
  async detectAndAnalyze(message: string, userId: string = 'default'): Promise<AppDetectionResult> {
    const detectedApps = this.detectApps(message)

    if (detectedApps.length === 0) {
      return {
        detectedApps: [],
        toolDiscoveryResults: [],
        contextEnrichment: '',
        hasLimitedSupport: false,
      }
    }

    // Initialize Composio if needed
    if (!composioService.initialized) {
      const apiKey = process.env.COMPOSIO_API_KEY
      if (apiKey) {
        await composioService.initialize(apiKey)
      }
    }

    // Get discovery results for all detected apps
    const toolDiscoveryResults = await toolDiscoveryService.discoverMultipleTools(
      detectedApps.map((a) => a.name),
      {
        checkConnection: true,
        includeAlternatives: true,
        userId,
      }
    )

    // Build context enrichment string
    const contextEnrichment = this.buildContextEnrichment(detectedApps, toolDiscoveryResults)

    // Check if any apps have limited support
    const hasLimitedSupport = toolDiscoveryResults.some(
      (r) => r.supportLevel === 'partial' || r.supportLevel === 'browser_only' || r.supportLevel === 'none'
    )

    return {
      detectedApps,
      toolDiscoveryResults,
      contextEnrichment,
      hasLimitedSupport,
    }
  }

  /**
   * Build context enrichment string for the AI
   */
  private buildContextEnrichment(apps: DetectedApp[], results: ToolDiscoveryResult[]): string {
    if (results.length === 0) return ''

    const lines: string[] = ['## TOOL AVAILABILITY CONTEXT (AUTO-DETECTED)']

    for (const result of results) {
      const summary = toolDiscoveryService.getToolSummary(result)

      if (result.supportLevel === 'full') {
        lines.push(`\n### ${result.toolName} - FULLY SUPPORTED`)
        lines.push(`Status: ${result.connected ? 'Connected ✓' : 'Available (not connected)'}`)
        lines.push(`Actions: ${result.actionCount} available`)
      } else if (result.supportLevel === 'partial') {
        lines.push(`\n### ${result.toolName} - PARTIAL SUPPORT`)
        lines.push(`Available: ${result.actionCount} actions`)
        if (result.gaps?.missingActions?.length > 0) {
          lines.push(`Missing: ${result.gaps.missingActions.slice(0, 5).join(', ')}`)
        }
        lines.push('IMPORTANT: Inform user about limitations and offer alternatives.')
      } else if (result.supportLevel === 'browser_only') {
        lines.push(`\n### ${result.toolName} - BROWSER AUTOMATION ONLY`)
        lines.push('This tool requires browser automation (slower, less reliable).')
        lines.push('RECOMMEND: Suggest API-based alternatives if available.')
        if (result.alternatives.length > 0) {
          lines.push(`Alternatives: ${result.alternatives.map((a) => a.toolName).join(', ')}`)
        }
      } else {
        // @NEXUS-GENERIC-ORCHESTRATION: Enable dynamic tool discovery
        // Even if tool isn't in static catalog, Rube MCP might support it (500+ tools)
        // Generate workflow anyway and let orchestration layer discover at runtime
        lines.push(`\n### ${result.toolName} - DYNAMIC DISCOVERY`)
        lines.push(`Category: ${result.category}`)
        lines.push('STATUS: Not in static catalog, but may be available via dynamic discovery.')
        lines.push('ACTION: Generate the workflow with this tool. At execution time, Nexus will:')
        lines.push('  1. Search Rube\'s 500+ tools for matching capabilities')
        lines.push('  2. Auto-discover the correct API actions')
        lines.push('  3. Collect any required parameters from the user')
        if (result.alternatives.length > 0) {
          lines.push(`FALLBACK ALTERNATIVES: ${result.alternatives.map((a) => `${a.toolName} (${a.supportLevel})`).join(', ')}`)
        }
        lines.push('IMPORTANT: Generate a workflowSpec with this tool. Do NOT refuse or only suggest alternatives.')
      }
    }

    lines.push('\n## RESPONSE GUIDANCE')
    lines.push('- ALWAYS generate a workflowSpec when user wants a workflow, even for unknown tools')
    lines.push('- Dynamic discovery will find the tool at runtime via RUBE_SEARCH_TOOLS')
    lines.push('- Mention that tool will be discovered dynamically if not in static catalog')
    lines.push('- Only suggest alternatives as fallback if dynamic discovery fails at execution')

    return lines.join('\n')
  }
}

export const appDetectionService = new AppDetectionService()
