/**
 * IntentResolver.ts
 *
 * Natural language intent resolution service that parses user requests
 * to extract integrations, actions, and parameters.
 *
 * This service is used BEFORE workflow generation to:
 * 1. Detect which integrations the user wants
 * 2. Map natural language verbs to tool actions
 * 3. Extract embedded parameters (emails, phone numbers, etc.)
 * 4. Detect unsupported tools early (before execution fails)
 *
 * @NEXUS-FIX-035: IntentResolver - Natural language to action mapping - DO NOT REMOVE
 */

import { ToolRegistryService } from './ToolRegistry';
import type { SupportResolution, ToolDefinition } from './ToolRegistry';

// ================================
// TYPE DEFINITIONS
// ================================

export interface ResolvedIntent {
  success: boolean;
  rawInput: string;
  integrations: IntegrationIntent[];
  extractedParams: ExtractedParam[];
  unsupportedTools: UnsupportedToolIntent[];
  confidence: number;
  interpretation: string; // Human-readable interpretation
}

export interface IntegrationIntent {
  name: string;
  normalizedName: string;
  action: string;
  actionVerb: string;
  supportLevel: SupportResolution['level'];
  suggestedSlug?: string;
  suggestedTool?: ToolDefinition;
}

export interface ExtractedParam {
  type: 'email' | 'phone' | 'url' | 'date' | 'time' | 'number' | 'channel' | 'path';
  value: string;
  context: string; // What was around it
  forIntegration?: string; // Which integration this likely belongs to
}

export interface UnsupportedToolIntent {
  requested: string;
  alternatives: Array<{ toolkit: string; name: string; confidence: number }>;
  hasAPIKeyOption: boolean;
  apiKeySetup?: {
    displayName: string;
    apiDocsUrl: string;
    steps: string[];
  };
}

// ================================
// PATTERN DEFINITIONS
// ================================

/**
 * Action verb patterns mapped to standardized actions
 */
const ACTION_PATTERNS: Record<string, string[]> = {
  send: ['send', 'deliver', 'mail', 'email', 'message', 'notify', 'alert', 'post', 'share', 'tweet', 'publish'],
  save: ['save', 'store', 'upload', 'backup', 'sync', 'put', 'write', 'export'],
  read: ['read', 'get', 'fetch', 'retrieve', 'download', 'import', 'pull', 'receive'],
  list: ['list', 'show', 'display', 'view', 'browse', 'see', 'find'],
  create: ['create', 'add', 'new', 'make', 'generate', 'build', 'schedule', 'book', 'open'],
  update: ['update', 'edit', 'modify', 'change', 'rename', 'move'],
  delete: ['delete', 'remove', 'trash', 'archive', 'cancel']
};

/**
 * Integration detection patterns
 */
const INTEGRATION_PATTERNS: Record<string, RegExp[]> = {
  gmail: [/\bgmail\b/i, /\bemail\b/i, /\bmail\b/i, /\binbox\b/i],
  slack: [/\bslack\b/i, /\bslack channel\b/i, /\bslack message\b/i],
  whatsapp: [/\bwhatsapp\b/i, /\bwhats\s*app\b/i, /\bwa\b/i],
  discord: [/\bdiscord\b/i],
  telegram: [/\btelegram\b/i, /\btg\b/i],
  dropbox: [/\bdropbox\b/i],
  googledrive: [/\bgoogle\s*drive\b/i, /\bgdrive\b/i, /\bdrive\b/i],
  onedrive: [/\bonedrive\b/i, /\bone\s*drive\b/i],
  googlesheets: [/\bgoogle\s*sheet[s]?\b/i, /\bsheet[s]?\b/i, /\bspreadsheet\b/i],
  notion: [/\bnotion\b/i],
  airtable: [/\bairtable\b/i],
  trello: [/\btrello\b/i],
  asana: [/\basana\b/i],
  linear: [/\blinear\b/i],
  jira: [/\bjira\b/i],
  github: [/\bgithub\b/i, /\bgit\s*hub\b/i],
  gitlab: [/\bgitlab\b/i],
  hubspot: [/\bhubspot\b/i],
  salesforce: [/\bsalesforce\b/i, /\bsfdc\b/i],
  twitter: [/\btwitter\b/i, /\btweet\b/i, /\bx\.com\b/i],
  linkedin: [/\blinkedin\b/i],
  stripe: [/\bstripe\b/i],
  googlecalendar: [/\bgoogle\s*calendar\b/i, /\bcalendar\b/i, /\bgcal\b/i],
  zoom: [/\bzoom\b/i],
  teams: [/\bteams\b/i, /\bmicrosoft\s*teams\b/i],

  // API key / less common integrations
  wave: [/\bwave\b/i, /\bwave\s*accounting\b/i],
  tally: [/\btally\b/i],
  freshbooks: [/\bfreshbooks\b/i],
  quickbooks: [/\bquickbooks\b/i, /\bqb\b/i],
  xero: [/\bxero\b/i],
  zoho_books: [/\bzoho\b/i, /\bzoho\s*books\b/i],
  knet: [/\bknet\b/i],
  sap: [/\bsap\b/i]
};

/**
 * Parameter extraction patterns
 */
const PARAM_PATTERNS: Record<ExtractedParam['type'], RegExp> = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /\+?\d{1,4}[\s-]?\(?\d{1,4}\)?[\s-]?\d{1,4}[\s-]?\d{1,4}/g,
  url: /https?:\/\/[^\s]+/g,
  date: /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g,
  time: /\b\d{1,2}:\d{2}(?:\s*[AaPp][Mm])?\b/g,
  number: /\b\d+\b/g,
  channel: /#[\w-]+/g,
  path: /\/[\w\/-]+/g
};

/**
 * Trigger indicators (these usually start a workflow)
 */
const TRIGGER_INDICATORS = [
  'when', 'whenever', 'every time', 'each time', 'if', 'once',
  'new', 'incoming', 'receive', 'arrives', 'comes in'
];

/**
 * Action indicators (these are what the workflow does)
 */
const ACTION_INDICATORS = [
  'then', 'and', 'also', 'send', 'save', 'notify', 'create',
  'add', 'update', 'post', 'upload', 'forward'
];

// ================================
// SERVICE CLASS
// ================================

export class IntentResolverService {

  /**
   * Parse a user request and resolve intent
   */
  static resolve(input: string): ResolvedIntent {
    const cleanInput = input.trim();

    // Extract integrations
    const integrations = this.extractIntegrations(cleanInput);

    // Extract parameters
    const extractedParams = this.extractParameters(cleanInput);

    // Associate params with integrations
    this.associateParamsWithIntegrations(extractedParams, integrations);

    // Check for unsupported tools
    const unsupportedTools = this.checkUnsupportedTools(integrations);

    // Calculate confidence
    const confidence = this.calculateConfidence(integrations, extractedParams);

    // Generate interpretation
    const interpretation = this.generateInterpretation(integrations, extractedParams);

    return {
      success: integrations.length > 0,
      rawInput: cleanInput,
      integrations,
      extractedParams,
      unsupportedTools,
      confidence,
      interpretation
    };
  }

  /**
   * Extract integrations mentioned in the input
   */
  private static extractIntegrations(input: string): IntegrationIntent[] {
    const intents: IntegrationIntent[] = [];
    const foundIntegrations = new Set<string>();

    for (const [integration, patterns] of Object.entries(INTEGRATION_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(input) && !foundIntegrations.has(integration)) {
          foundIntegrations.add(integration);

          // Determine action from context
          const actionVerb = this.extractActionVerb(input, integration);
          const action = this.mapVerbToAction(actionVerb);

          // Get support level
          const supportResolution = ToolRegistryService.resolveSupportLevel(integration);

          // Try to resolve tool slug
          const toolResolution = ToolRegistryService.resolveToolSlug(integration, action);

          intents.push({
            name: integration,
            normalizedName: ToolRegistryService.normalizeIntegration(integration),
            action,
            actionVerb,
            supportLevel: supportResolution.level,
            suggestedSlug: toolResolution?.slug,
            suggestedTool: toolResolution?.definition
          });
        }
      }
    }

    // Sort by order of appearance in input
    return this.sortByAppearanceOrder(input, intents);
  }

  /**
   * Extract action verb for a specific integration from context
   */
  private static extractActionVerb(input: string, integration: string): string {
    const words = input.toLowerCase().split(/\s+/);

    // Find the integration position
    const integrationPatterns = INTEGRATION_PATTERNS[integration];
    let integrationPos = -1;

    for (let i = 0; i < words.length; i++) {
      for (const pattern of integrationPatterns) {
        if (pattern.test(words[i])) {
          integrationPos = i;
          break;
        }
      }
      if (integrationPos !== -1) break;
    }

    // Look for action verbs before the integration (within 3 words)
    const searchStart = Math.max(0, integrationPos - 3);
    const searchEnd = Math.min(words.length, integrationPos + 3);

    for (let i = searchStart; i < searchEnd; i++) {
      for (const [_action, verbs] of Object.entries(ACTION_PATTERNS)) {
        if (verbs.some(v => words[i].includes(v))) {
          return words[i];
        }
      }
    }

    return 'default';
  }

  /**
   * Map a verb to a standardized action
   */
  private static mapVerbToAction(verb: string): string {
    const lowerVerb = verb.toLowerCase();

    for (const [action, verbs] of Object.entries(ACTION_PATTERNS)) {
      if (verbs.some(v => lowerVerb.includes(v))) {
        return action;
      }
    }

    return 'default';
  }

  /**
   * Extract parameters from input
   */
  private static extractParameters(input: string): ExtractedParam[] {
    const params: ExtractedParam[] = [];

    for (const [type, pattern] of Object.entries(PARAM_PATTERNS)) {
      const matches = input.matchAll(pattern);

      for (const match of matches) {
        // Get surrounding context (10 chars before and after)
        const start = Math.max(0, match.index! - 20);
        const end = Math.min(input.length, match.index! + match[0].length + 20);
        const context = input.substring(start, end);

        params.push({
          type: type as ExtractedParam['type'],
          value: match[0],
          context
        });
      }
    }

    return params;
  }

  /**
   * Associate extracted parameters with their likely integrations
   */
  private static associateParamsWithIntegrations(
    params: ExtractedParam[],
    integrations: IntegrationIntent[]
  ): void {
    for (const param of params) {
      // Email -> gmail, slack (for channel invites)
      if (param.type === 'email') {
        const emailInt = integrations.find(i =>
          i.normalizedName === 'gmail' || i.normalizedName === 'slack'
        );
        if (emailInt) param.forIntegration = emailInt.normalizedName;
      }

      // Phone -> whatsapp, telegram
      if (param.type === 'phone') {
        const phoneInt = integrations.find(i =>
          i.normalizedName === 'whatsapp' || i.normalizedName === 'telegram'
        );
        if (phoneInt) param.forIntegration = phoneInt.normalizedName;
      }

      // Channel -> slack, discord
      if (param.type === 'channel') {
        const channelInt = integrations.find(i =>
          i.normalizedName === 'slack' || i.normalizedName === 'discord'
        );
        if (channelInt) param.forIntegration = channelInt.normalizedName;
      }

      // Path -> dropbox, googledrive, onedrive
      if (param.type === 'path') {
        const storageInt = integrations.find(i =>
          ['dropbox', 'googledrive', 'onedrive'].includes(i.normalizedName)
        );
        if (storageInt) param.forIntegration = storageInt.normalizedName;
      }

      // URL -> could be sheet, page, etc.
      if (param.type === 'url') {
        if (param.value.includes('docs.google.com/spreadsheets')) {
          param.forIntegration = 'googlesheets';
        } else if (param.value.includes('notion.so')) {
          param.forIntegration = 'notion';
        } else if (param.value.includes('trello.com')) {
          param.forIntegration = 'trello';
        }
      }
    }
  }

  /**
   * Check for unsupported tools and get alternatives
   */
  private static checkUnsupportedTools(integrations: IntegrationIntent[]): UnsupportedToolIntent[] {
    const unsupported: UnsupportedToolIntent[] = [];

    for (const intent of integrations) {
      if (intent.supportLevel === 'alternative' || intent.supportLevel === 'unsupported') {
        const resolution = ToolRegistryService.resolveSupportLevel(intent.normalizedName);

        unsupported.push({
          requested: intent.name,
          alternatives: (resolution.alternatives || []).map(a => ({
            toolkit: a.toolkit,
            name: a.name,
            confidence: a.confidence
          })),
          hasAPIKeyOption: resolution.level === 'api_key',
          apiKeySetup: resolution.apiKeyInfo
        });
      }
    }

    return unsupported;
  }

  /**
   * Calculate overall confidence in the interpretation
   */
  private static calculateConfidence(
    integrations: IntegrationIntent[],
    params: ExtractedParam[]
  ): number {
    if (integrations.length === 0) return 0.1;

    let confidence = 0.5;

    // More integrations detected = higher confidence
    if (integrations.length >= 2) confidence += 0.2;

    // All integrations have native support
    if (integrations.every(i => i.supportLevel === 'native')) {
      confidence += 0.15;
    }

    // Actions were detected
    if (integrations.some(i => i.action !== 'default')) {
      confidence += 0.1;
    }

    // Parameters were extracted
    if (params.length > 0) {
      confidence += 0.05;
    }

    return Math.min(confidence, 0.95);
  }

  /**
   * Generate human-readable interpretation
   */
  private static generateInterpretation(
    integrations: IntegrationIntent[],
    params: ExtractedParam[]
  ): string {
    if (integrations.length === 0) {
      return "I couldn't identify which integrations you want to use. Could you tell me more?";
    }

    const parts: string[] = [];

    // Group by trigger vs action
    const triggers = integrations.filter(i =>
      TRIGGER_INDICATORS.some(t => i.actionVerb.includes(t)) || i.action === 'read'
    );
    const actions = integrations.filter(i => !triggers.includes(i));

    if (triggers.length > 0 && actions.length > 0) {
      const triggerNames = triggers.map(t => t.name).join(' and ');
      const actionNames = actions.map(a => a.name).join(' and ');
      parts.push(`When something happens in ${triggerNames}, ${actionNames} will be updated.`);
    } else if (actions.length > 0) {
      for (const action of actions) {
        const paramForThis = params.find(p => p.forIntegration === action.normalizedName);
        if (paramForThis) {
          parts.push(`${action.action} using ${action.name} (${paramForThis.value})`);
        } else {
          parts.push(`${action.action} using ${action.name}`);
        }
      }
    }

    return parts.length > 0 ? parts.join(' → ') : `Use ${integrations[0].name}`;
  }

  /**
   * Sort integrations by their order of appearance in the input
   */
  private static sortByAppearanceOrder(
    input: string,
    integrations: IntegrationIntent[]
  ): IntegrationIntent[] {
    return integrations.sort((a, b) => {
      const posA = this.findIntegrationPosition(input, a.name);
      const posB = this.findIntegrationPosition(input, b.name);
      return posA - posB;
    });
  }

  /**
   * Find position of integration mention in input
   */
  private static findIntegrationPosition(input: string, integration: string): number {
    const patterns = INTEGRATION_PATTERNS[integration] || [];
    let minPos = input.length;

    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match && match.index !== undefined && match.index < minPos) {
        minPos = match.index;
      }
    }

    return minPos;
  }

  /**
   * Check if input is a workflow request vs a simple question
   */
  static isWorkflowRequest(input: string): boolean {
    const lower = input.toLowerCase();

    // Check for action indicators
    const hasAction = Object.values(ACTION_PATTERNS)
      .flat()
      .some(verb => lower.includes(verb));

    // Check for integration mention
    const hasIntegration = Object.values(INTEGRATION_PATTERNS)
      .flat()
      .some(pattern => pattern.test(input));

    // Check for workflow trigger words
    const hasTriggerWord = TRIGGER_INDICATORS.some(t => lower.includes(t));

    return (hasAction && hasIntegration) || hasTriggerWord;
  }

  /**
   * Extract the primary intent (trigger vs action)
   */
  static getPrimaryIntentType(input: string): 'trigger' | 'action' | 'mixed' {
    const lower = input.toLowerCase();

    const hasTrigger = TRIGGER_INDICATORS.some(t => lower.includes(t));
    const hasAction = ACTION_INDICATORS.some(a => lower.includes(a));

    if (hasTrigger && hasAction) return 'mixed';
    if (hasTrigger) return 'trigger';
    return 'action';
  }

  /**
   * Quick check if a specific integration is mentioned
   */
  static mentionsIntegration(input: string, integration: string): boolean {
    const patterns = INTEGRATION_PATTERNS[integration.toLowerCase()];
    if (!patterns) return false;

    return patterns.some(pattern => pattern.test(input));
  }

  /**
   * Get all mentioned integrations without full resolution
   */
  static getMentionedIntegrations(input: string): string[] {
    const mentioned: string[] = [];

    for (const [integration, patterns] of Object.entries(INTEGRATION_PATTERNS)) {
      if (patterns.some(pattern => pattern.test(input))) {
        mentioned.push(integration);
      }
    }

    return mentioned;
  }
}

export default IntentResolverService;
