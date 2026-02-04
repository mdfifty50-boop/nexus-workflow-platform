/**
 * GenericUXTranslator.ts
 *
 * LAYER 3: UX Translation (KEY INNOVATION)
 *
 * Converts technical parameter names into user-friendly prompts
 * using pattern-based regex rules. Works for ANY tool parameter
 * without hardcoding tool-specific knowledge.
 *
 * Example:
 *   "spreadsheet_id" -> "Which Spreadsheet?"
 *   "to" -> "Who should receive this?"
 *   "body" -> "What should the body say?" (textarea)
 *
 * @NEXUS-GENERIC-ORCHESTRATION
 */

import type {
  UXTranslation,
  UXPattern,
  ToolSchema,
  CollectionQuestion,
  InputType
} from './types';

import { UX_PATTERNS, humanize } from './patterns/UXPatterns';

export class GenericUXTranslator {
  private patterns: UXPattern[];

  constructor(customPatterns?: UXPattern[]) {
    // Allow extending with custom patterns (prepended for higher priority)
    this.patterns = customPatterns
      ? [...customPatterns, ...UX_PATTERNS]
      : UX_PATTERNS;
  }

  /**
   * Translate a single parameter name to user-friendly UX
   *
   * @param paramName - Technical parameter name (e.g., "spreadsheet_id")
   * @param toolkit - Toolkit name for context (e.g., "googlesheets")
   * @returns UX translation with display name, prompt, input type
   */
  translate(paramName: string, toolkit: string): UXTranslation {
    // @NEXUS-FIX-073: Toolkit-specific overrides for WhatsApp - DO NOT REMOVE
    // WhatsApp's 'to' param should be phone, not email (generic pattern matches email)
    const toolkitLower = toolkit?.toLowerCase() || '';
    if (toolkitLower === 'whatsapp' || toolkitLower === 'whatsappweb') {
      if (paramName === 'to' || paramName === 'recipient') {
        return {
          displayName: 'Phone Number',
          prompt: 'What phone number should receive the WhatsApp message?',
          inputType: 'phone',
          placeholder: '+965 xxxx xxxx',
          quickActions: [{ label: 'My Phone', value: '{{user_phone}}' }]
        };
      }
    }

    for (const pattern of this.patterns) {
      const match = paramName.match(pattern.match);
      if (match) {
        return {
          displayName: pattern.displayName(match, paramName),
          prompt: pattern.prompt(match, paramName),
          inputType: pattern.inputType,
          placeholder: pattern.placeholder,
          quickActions: pattern.quickActions,
          autoResolve: pattern.autoResolve?.(match, toolkit)
        };
      }
    }

    // Fallback (should never reach - last pattern catches all)
    return {
      displayName: humanize(paramName),
      prompt: `Enter ${humanize(paramName).toLowerCase()}`,
      inputType: 'text'
    };
  }

  /**
   * Translate all required params from a tool schema
   *
   * @param schema - Tool schema with properties and required fields
   * @returns Array of collection questions ready for the UI
   */
  translateSchema(schema: ToolSchema): CollectionQuestion[] {
    const questions: CollectionQuestion[] = [];

    for (const paramName of schema.required) {
      const paramSchema = schema.properties[paramName];
      const ux = this.translate(paramName, schema.toolkit);

      // Use enum values if available
      let inputType = ux.inputType;
      if (paramSchema?.enum && paramSchema.enum.length > 0) {
        inputType = 'select';
      }

      questions.push({
        id: `${schema.slug}_${paramName}`,
        paramName,
        displayName: ux.displayName,
        prompt: ux.prompt,
        inputType,
        placeholder: ux.placeholder || paramSchema?.description,
        quickActions: ux.quickActions,
        autoResolve: ux.autoResolve,
        answered: false
      });
    }

    return questions;
  }

  /**
   * Translate optional params (for advanced mode)
   */
  translateOptionalParams(schema: ToolSchema): CollectionQuestion[] {
    const questions: CollectionQuestion[] = [];
    const optionalParams = Object.keys(schema.properties)
      .filter(p => !schema.required.includes(p));

    for (const paramName of optionalParams) {
      const paramSchema = schema.properties[paramName];
      const ux = this.translate(paramName, schema.toolkit);

      questions.push({
        id: `${schema.slug}_${paramName}_optional`,
        paramName,
        displayName: ux.displayName,
        prompt: ux.prompt,
        inputType: paramSchema?.enum ? 'select' : ux.inputType,
        placeholder: ux.placeholder || paramSchema?.description,
        quickActions: ux.quickActions,
        autoResolve: ux.autoResolve,
        answered: false
      });
    }

    return questions;
  }

  /**
   * Get human-readable tool name from slug
   */
  humanizeToolSlug(slug: string): string {
    // "GMAIL_SEND_EMAIL" -> "Send Email (Gmail)"
    const parts = slug.split('_');
    const toolkit = parts[0];
    const action = parts.slice(1).join(' ');

    return `${humanize(action)} (${humanize(toolkit)})`;
  }

  /**
   * Get human-readable action from tool slug
   */
  extractAction(slug: string): string {
    // "GMAIL_SEND_EMAIL" -> "Send Email"
    const parts = slug.split('_');
    return humanize(parts.slice(1).join(' '));
  }

  /**
   * Get toolkit name from slug
   */
  extractToolkit(slug: string): string {
    // "GMAIL_SEND_EMAIL" -> "Gmail"
    return humanize(slug.split('_')[0] || '');
  }

  /**
   * Check if a parameter looks like an ID that needs resolution
   */
  needsIdResolution(paramName: string): boolean {
    return /^.+_id$/i.test(paramName);
  }

  /**
   * Get the appropriate input type for a value
   */
  inferInputType(paramName: string, _value?: string): InputType {
    const ux = this.translate(paramName, '');
    return ux.inputType;
  }

  /**
   * Format a value for display (mask sensitive data, etc.)
   */
  formatValueForDisplay(paramName: string, value: string): string {
    // Mask email addresses partially
    if (/email|to|recipient/i.test(paramName) && value.includes('@')) {
      const [local, domain] = value.split('@');
      if (local.length > 3) {
        return `${local.substring(0, 2)}***@${domain}`;
      }
    }

    // Mask phone numbers
    if (/phone/i.test(paramName) && value.length > 6) {
      return value.substring(0, 4) + '****' + value.substring(value.length - 2);
    }

    // Truncate long values
    if (value.length > 50) {
      return value.substring(0, 47) + '...';
    }

    return value;
  }

  /**
   * Validate a value matches expected format for param type
   */
  validateValue(paramName: string, value: string): { valid: boolean; error?: string } {
    if (!value || value.trim() === '') {
      return { valid: false, error: 'This field is required' };
    }

    const ux = this.translate(paramName, '');

    switch (ux.inputType) {
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return { valid: false, error: 'Please enter a valid email address' };
        }
        break;

      case 'phone':
        // Allow various phone formats
        if (!/^\+?[\d\s\-()]{8,}$/.test(value.replace(/\s/g, ''))) {
          return { valid: false, error: 'Please enter a valid phone number with country code' };
        }
        break;

      case 'url':
        // Allow URLs or IDs
        if (value.includes('.') && !value.match(/^https?:\/\//)) {
          return { valid: false, error: 'Please enter a valid URL starting with http:// or https://' };
        }
        break;

      case 'number':
        if (isNaN(Number(value))) {
          return { valid: false, error: 'Please enter a valid number' };
        }
        break;
    }

    return { valid: true };
  }

  /**
   * Get list of registered patterns (for debugging)
   */
  getPatternCount(): number {
    return this.patterns.length;
  }
}

// Singleton instance
let translatorInstance: GenericUXTranslator | null = null;

export function getUXTranslator(): GenericUXTranslator {
  if (!translatorInstance) {
    translatorInstance = new GenericUXTranslator();
  }
  return translatorInstance;
}

// Re-export humanize for convenience
export { humanize };
