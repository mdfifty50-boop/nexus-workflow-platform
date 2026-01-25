/**
 * ParameterResolutionService.ts
 *
 * Smart parameter resolution that translates user-friendly inputs
 * to technical API parameters, and provides intelligent defaults.
 *
 * SAFE: This is a NEW file - does not modify any protected code.
 */

export interface ParameterResolution {
  originalValue: string;
  resolvedValue: string;
  parameterName: string;
  resolutionType: 'exact' | 'fuzzy' | 'default' | 'inferred';
  confidence: number;
  metadata?: Record<string, unknown>;
}

export interface ResolutionContext {
  userEmail?: string;
  timezone?: string;
  region?: string;
  language?: string;
  connectedIntegrations?: string[];
  recentSelections?: Record<string, string>;
}

/**
 * Parameter type definitions for common tools
 */
const PARAMETER_DEFINITIONS: Record<string, {
  displayName: string;
  description: string;
  collectionPrompt: string;
  quickActions?: Array<{ label: string; value: string | 'user_email' | 'auto_detect' }>;
  validators?: Array<(value: string) => boolean>;
  transformers?: Array<(value: string) => string>;
}> = {
  // Email parameters
  to: {
    displayName: 'Recipient',
    description: 'Email address to send to',
    collectionPrompt: 'Who should I send this to?',
    quickActions: [
      { label: 'Send to Myself', value: 'user_email' }
    ],
    validators: [
      (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
    ]
  },
  recipient_email: {
    displayName: 'Recipient Email',
    description: 'Email address of the recipient',
    collectionPrompt: 'Where should I send this email?',
    quickActions: [
      { label: 'Send to Myself', value: 'user_email' }
    ],
    validators: [
      (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
    ]
  },

  // Slack parameters
  channel: {
    displayName: 'Channel',
    description: 'Slack channel name',
    collectionPrompt: 'Which Slack channel?',
    transformers: [
      (v) => v.startsWith('#') ? v.slice(1) : v
    ]
  },
  channel_name: {
    displayName: 'Channel Name',
    description: 'Slack channel (without #)',
    collectionPrompt: 'Which channel should I post to?',
    transformers: [
      (v) => v.startsWith('#') ? v.slice(1) : v
    ]
  },

  // Google Sheets parameters
  spreadsheet_id: {
    displayName: 'Spreadsheet',
    description: 'Google Sheets spreadsheet',
    collectionPrompt: 'Which Google Sheet? (paste URL or name)',
    transformers: [
      (v) => {
        // Extract ID from URL if provided
        const match = v.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        return match ? match[1] : v;
      }
    ]
  },
  sheet_name: {
    displayName: 'Sheet Tab',
    description: 'The tab/sheet within the spreadsheet',
    collectionPrompt: 'Which tab in the spreadsheet?',
    quickActions: [
      { label: 'First Sheet', value: 'Sheet1' }
    ]
  },

  // Google Drive / Dropbox parameters
  folder_id: {
    displayName: 'Folder',
    description: 'Target folder',
    collectionPrompt: 'Which folder should I use?',
    quickActions: [
      { label: 'Root Folder', value: 'root' }
    ]
  },
  path: {
    displayName: 'File Path',
    description: 'Path to the file or folder',
    collectionPrompt: 'What path should I use?',
    quickActions: [
      { label: 'Root', value: '/' }
    ]
  },

  // GitHub parameters
  repo: {
    displayName: 'Repository',
    description: 'GitHub repository',
    collectionPrompt: 'Which repository?',
    transformers: [
      (v) => {
        // Extract repo from GitHub URL
        const match = v.match(/github\.com\/([^\/]+\/[^\/]+)/);
        return match ? match[1] : v;
      }
    ]
  },
  owner: {
    displayName: 'Repository Owner',
    description: 'GitHub username or org',
    collectionPrompt: 'Repository owner (username or organization)?'
  },

  // Common parameters
  title: {
    displayName: 'Title',
    description: 'Title or subject',
    collectionPrompt: 'What should the title be?'
  },
  subject: {
    displayName: 'Subject',
    description: 'Email or message subject',
    collectionPrompt: 'What should the subject line say?'
  },
  body: {
    displayName: 'Message',
    description: 'Message content',
    collectionPrompt: 'What should the message say?'
  },
  message: {
    displayName: 'Message',
    description: 'Message text',
    collectionPrompt: 'What message should I send?'
  },
  text: {
    displayName: 'Text',
    description: 'Text content',
    collectionPrompt: 'What text should I use?'
  }
};

/**
 * Alias mappings for common variations
 */
const PARAMETER_ALIASES: Record<string, string> = {
  email: 'to',
  recipient: 'to',
  send_to: 'to',
  destination: 'to',
  slack_channel: 'channel',
  sheet_id: 'spreadsheet_id',
  sheet: 'spreadsheet_id',
  folder: 'folder_id',
  directory: 'folder_id',
  repository: 'repo',
  content: 'body',
  description: 'body'
};

/**
 * Service for intelligent parameter resolution
 */
export class ParameterResolutionService {
  /**
   * Resolve a parameter value with intelligent defaults and transformations
   */
  static resolve(
    paramName: string,
    value: string | undefined,
    context: ResolutionContext
  ): ParameterResolution | null {
    // Normalize parameter name
    const normalizedName = PARAMETER_ALIASES[paramName.toLowerCase()] || paramName.toLowerCase();
    const definition = PARAMETER_DEFINITIONS[normalizedName];

    if (!value) {
      // Try to infer a default value
      const defaultValue = this.inferDefault(normalizedName, context);
      if (defaultValue) {
        return {
          originalValue: '',
          resolvedValue: defaultValue,
          parameterName: normalizedName,
          resolutionType: 'default',
          confidence: 0.8
        };
      }
      return null;
    }

    // Apply transformers
    let resolvedValue = value;
    if (definition?.transformers) {
      for (const transformer of definition.transformers) {
        resolvedValue = transformer(resolvedValue);
      }
    }

    // Handle special values
    if (value === 'user_email' && context.userEmail) {
      resolvedValue = context.userEmail;
    }

    // Validate if validators exist
    let isValid = true;
    if (definition?.validators) {
      isValid = definition.validators.every(v => v(resolvedValue));
    }

    return {
      originalValue: value,
      resolvedValue,
      parameterName: normalizedName,
      resolutionType: value === resolvedValue ? 'exact' : 'fuzzy',
      confidence: isValid ? 0.95 : 0.5
    };
  }

  /**
   * Infer default value based on context
   */
  private static inferDefault(paramName: string, context: ResolutionContext): string | null {
    switch (paramName) {
      case 'to':
      case 'recipient_email':
        return context.userEmail || null;

      case 'sheet_name':
        return 'Sheet1';

      case 'folder_id':
      case 'path':
        return 'root';

      case 'timezone':
        return context.timezone || 'UTC';

      default:
        return null;
    }
  }

  /**
   * Get user-friendly prompt for collecting a parameter
   */
  static getCollectionPrompt(paramName: string): {
    prompt: string;
    displayName: string;
    quickActions: Array<{ label: string; value: string }>;
  } {
    const normalizedName = PARAMETER_ALIASES[paramName.toLowerCase()] || paramName.toLowerCase();
    const definition = PARAMETER_DEFINITIONS[normalizedName];

    if (definition) {
      return {
        prompt: definition.collectionPrompt,
        displayName: definition.displayName,
        quickActions: definition.quickActions?.map(qa => ({
          label: qa.label,
          value: qa.value === 'user_email' ? '{{user_email}}' : String(qa.value)
        })) || []
      };
    }

    // Generate friendly prompt from parameter name
    const friendlyName = paramName
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .toLowerCase();

    return {
      prompt: `What ${friendlyName} should I use?`,
      displayName: friendlyName.charAt(0).toUpperCase() + friendlyName.slice(1),
      quickActions: []
    };
  }

  /**
   * Map collected parameters to tool-specific parameter names
   * This extends FIX-029 with more comprehensive mappings
   */
  static mapToToolParams(
    toolkit: string,
    collectedParams: Record<string, string>
  ): Record<string, string> {
    const mapped: Record<string, string> = {};

    // Toolkit-specific mappings
    const toolkitMappings: Record<string, Record<string, string[]>> = {
      gmail: {
        to: ['recipient_email', 'email', 'recipient', 'to'],
        subject: ['subject', 'title', 'email_subject'],
        body: ['body', 'message', 'content', 'email_body', 'html_body']
      },
      slack: {
        channel: ['channel', 'channel_name', 'slack_channel', 'channel_id'],
        text: ['message', 'text', 'content', 'body']
      },
      googlesheets: {
        spreadsheet_id: ['spreadsheet_id', 'sheet_id', 'sheet', 'spreadsheet'],
        range: ['range', 'cell_range', 'cells'],
        values: ['values', 'data', 'rows']
      },
      dropbox: {
        path: ['path', 'file_path', 'folder_path', 'destination'],
        file: ['file', 'content', 'data']
      },
      github: {
        owner: ['owner', 'org', 'organization', 'username'],
        repo: ['repo', 'repository', 'project'],
        title: ['title', 'issue_title', 'pr_title'],
        body: ['body', 'description', 'content']
      },
      notion: {
        page_id: ['page_id', 'page', 'parent_id'],
        title: ['title', 'name', 'page_title'],
        content: ['content', 'body', 'text']
      }
    };

    const mappings = toolkitMappings[toolkit.toLowerCase()] || {};

    // First pass: direct mappings
    for (const [key, value] of Object.entries(collectedParams)) {
      const normalizedKey = key.toLowerCase();

      // Check if this is a direct match for any target parameter
      for (const [targetParam, sourceParams] of Object.entries(mappings)) {
        if (sourceParams.includes(normalizedKey)) {
          mapped[targetParam] = value;
          break;
        }
      }

      // If no mapping found, keep original
      if (!Object.values(mappings).flat().includes(normalizedKey)) {
        mapped[key] = value;
      }
    }

    // Apply any necessary transformations
    if (mapped.channel && mapped.channel.startsWith('#')) {
      mapped.channel = mapped.channel.slice(1);
    }

    return mapped;
  }

  /**
   * Validate that all required parameters are present
   */
  static validateRequiredParams(
    _toolkit: string,
    toolSlug: string,
    params: Record<string, string>
  ): { valid: boolean; missing: string[]; suggestions: Record<string, string> } {
    // Common required parameters by tool
    const requiredParams: Record<string, string[]> = {
      GMAIL_SEND_EMAIL: ['to', 'subject', 'body'],
      SLACK_SEND_MESSAGE: ['channel', 'text'],
      GOOGLESHEETS_APPEND_DATA: ['spreadsheet_id', 'values'],
      DROPBOX_UPLOAD_FILE: ['path'],
      GITHUB_CREATE_ISSUE: ['owner', 'repo', 'title']
    };

    const required = requiredParams[toolSlug.toUpperCase()] || [];
    const missing: string[] = [];
    const suggestions: Record<string, string> = {};

    for (const param of required) {
      if (!params[param]) {
        missing.push(param);
        const promptInfo = this.getCollectionPrompt(param);
        suggestions[param] = promptInfo.prompt;
      }
    }

    return {
      valid: missing.length === 0,
      missing,
      suggestions
    };
  }

  /**
   * Smart extraction of values from natural language input
   */
  static extractFromNaturalLanguage(
    input: string,
    expectedParams: string[]
  ): Record<string, string> {
    const extracted: Record<string, string> = {};

    // Email extraction
    if (expectedParams.some(p => ['to', 'email', 'recipient'].includes(p.toLowerCase()))) {
      const emailMatch = input.match(/[^\s@]+@[^\s@]+\.[^\s@]+/);
      if (emailMatch) {
        extracted.to = emailMatch[0];
      }
    }

    // URL extraction for sheets/docs
    if (expectedParams.some(p => ['spreadsheet_id', 'sheet'].includes(p.toLowerCase()))) {
      const sheetMatch = input.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (sheetMatch) {
        extracted.spreadsheet_id = sheetMatch[1];
      }
    }

    // GitHub repo extraction
    if (expectedParams.some(p => ['repo', 'repository'].includes(p.toLowerCase()))) {
      const repoMatch = input.match(/github\.com\/([^\/\s]+)\/([^\/\s]+)/);
      if (repoMatch) {
        extracted.owner = repoMatch[1];
        extracted.repo = repoMatch[2];
      }
    }

    // Slack channel extraction
    if (expectedParams.some(p => ['channel'].includes(p.toLowerCase()))) {
      const channelMatch = input.match(/#([a-z0-9-_]+)/i);
      if (channelMatch) {
        extracted.channel = channelMatch[1];
      }
    }

    return extracted;
  }
}

export default ParameterResolutionService;
