/**
 * UserContextService - Auto-inference engine for minimal-click UX
 *
 * Philosophy: Show workflow FIRST, confirm SECOND, ask NEVER (if inferrable)
 *
 * This service maintains user context and provides smart defaults for workflow parameters,
 * eliminating the need for users to manually input information that can be inferred.
 */

export interface UserContext {
  // Identity
  email?: string;
  name?: string;
  timezone?: string;
  locale?: string;

  // Regional (Kuwait-first)
  region?: 'kuwait' | 'gcc' | 'international';
  workWeek?: string[]; // ['Sunday', 'Monday', ...] for Kuwait
  businessHours?: { start: string; end: string };
  currency?: string;
  vatRate?: number;

  // Connected App Context
  gmail?: {
    primaryEmail?: string;
    recentContacts?: Array<{ name: string; email: string }>;
    labels?: string[];
  };
  slack?: {
    workspaceId?: string;
    workspaceName?: string;
    channels?: Array<{ id: string; name: string; isDefault?: boolean }>;
    recentChannels?: string[];
  };
  calendar?: {
    defaultCalendarId?: string;
    workingHours?: { start: string; end: string };
    timezone?: string;
  };
  sheets?: {
    recentSpreadsheets?: Array<{ id: string; name: string }>;
  };

  // Preferences (learned over time)
  preferences?: {
    defaultEmailRecipients?: string[];
    defaultSlackChannel?: string;
    preferredReportTime?: string;
    notificationPreferences?: string[];
  };

  // Conversation Context
  conversationHistory?: {
    mentionedEmails?: string[];
    mentionedChannels?: string[];
    mentionedNames?: string[];
    mentionedDates?: string[];
  };
}

export interface InferredParameters {
  parameter: string;
  value: string;
  confidence: number;
  source: 'user_profile' | 'connected_app' | 'message_context' | 'regional_default' | 'preference';
  alternativeValues?: string[];
  editable: boolean;
}

class UserContextService {
  private context: UserContext = {};
  private readonly STORAGE_KEY = 'nexus_user_context';
  private readonly API_BASE = '/api/user-profile';
  private cloudSyncTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly CLOUD_SYNC_DEBOUNCE_MS = 5000;

  constructor() {
    this.loadFromStorage();
    this.initializeRegionalDefaults();
    this.loadFromCloud();
  }

  /**
   * Initialize with Kuwait regional defaults
   */
  private initializeRegionalDefaults(): void {
    if (!this.context.region) {
      this.context.region = 'kuwait';
      this.context.workWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
      this.context.businessHours = { start: '08:00', end: '17:00' };
      this.context.currency = 'KWD';
      this.context.vatRate = 0.05; // 5% VAT
      this.context.timezone = 'Asia/Kuwait'; // UTC+3
    }
  }

  /**
   * Load context from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.context = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load user context from storage:', e);
    }
  }

  /**
   * Save context to localStorage + debounced cloud sync
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.context));
    } catch (e) {
      console.warn('Failed to save user context to storage:', e);
    }
    this.debouncedCloudSync();
  }

  /**
   * Load context from Supabase (cloud wins for cross-device consistency).
   * Called once in constructor after loadFromStorage().
   */
  private async loadFromCloud(): Promise<void> {
    try {
      const res = await fetch(`${this.API_BASE}/context`, {
        headers: { 'x-clerk-user-id': localStorage.getItem('clerk_user_id') || '' },
      });
      if (!res.ok) return;

      const data = await res.json();
      if (data.source === 'supabase' && data.context) {
        // Cloud wins — merge cloud into local (cloud overwrites shared keys)
        this.context = { ...this.context, ...data.context };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.context));
        console.log('[UserContextService] Restored context from cloud');
      }
    } catch {
      // Graceful degradation — localStorage still works
    }
  }

  /**
   * Debounced sync to Supabase — waits 5 seconds after last write
   * to avoid hammering the API during rapid context updates.
   */
  private debouncedCloudSync(): void {
    if (this.cloudSyncTimer) {
      clearTimeout(this.cloudSyncTimer);
    }
    this.cloudSyncTimer = setTimeout(() => {
      this.syncToCloud();
    }, this.CLOUD_SYNC_DEBOUNCE_MS);
  }

  /**
   * Sync current context to Supabase (fire-and-forget).
   */
  private syncToCloud(): void {
    fetch(`${this.API_BASE}/context`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-clerk-user-id': localStorage.getItem('clerk_user_id') || '',
      },
      body: JSON.stringify({ context: this.context }),
    }).catch((err) => {
      console.warn('[UserContextService] Cloud sync failed (non-blocking):', err);
    });
  }

  /**
   * Update context from connected integration data
   */
  updateFromIntegration(integration: string, data: any): void {
    switch (integration) {
      case 'gmail':
        this.context.gmail = {
          ...this.context.gmail,
          primaryEmail: data.email,
          recentContacts: data.contacts?.slice(0, 20),
          labels: data.labels,
        };
        if (!this.context.email) {
          this.context.email = data.email;
        }
        break;

      case 'slack':
        this.context.slack = {
          ...this.context.slack,
          workspaceId: data.team?.id,
          workspaceName: data.team?.name,
          channels: data.channels?.map((c: any) => ({
            id: c.id,
            name: c.name,
            isDefault: c.is_general || c.name === 'general',
          })),
        };
        break;

      case 'google_calendar':
        this.context.calendar = {
          ...this.context.calendar,
          defaultCalendarId: data.primaryCalendarId,
          timezone: data.timezone,
          workingHours: data.workingHours,
        };
        if (data.timezone) {
          this.context.timezone = data.timezone;
        }
        break;

      case 'google_sheets':
        this.context.sheets = {
          ...this.context.sheets,
          recentSpreadsheets: data.recentFiles?.slice(0, 10),
        };
        break;
    }

    this.saveToStorage();
  }

  /**
   * Extract context from user message
   */
  extractFromMessage(message: string): void {
    const context = this.context.conversationHistory || {
      mentionedEmails: [],
      mentionedChannels: [],
      mentionedNames: [],
      mentionedDates: [],
    };

    // Extract emails
    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
    const emails = message.match(emailRegex) || [];
    context.mentionedEmails = [...new Set([...(context.mentionedEmails || []), ...emails])];

    // Extract Slack channels (#channel-name)
    const channelRegex = /#[\w-]+/g;
    const channels = message.match(channelRegex)?.map(c => c.slice(1)) || [];
    context.mentionedChannels = [...new Set([...(context.mentionedChannels || []), ...channels])];

    // Extract names (capitalized words that might be names)
    const nameRegex = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
    const names = message.match(nameRegex) || [];
    context.mentionedNames = [...new Set([...(context.mentionedNames || []), ...names])];

    // Extract time references
    const timeRefs = [
      /tomorrow/gi,
      /next (monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi,
      /every (monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi,
      /daily/gi,
      /weekly/gi,
      /monthly/gi,
      /at \d{1,2}(:\d{2})?\s*(am|pm)?/gi,
    ];
    timeRefs.forEach(regex => {
      const matches = message.match(regex);
      if (matches) {
        context.mentionedDates = [...new Set([...(context.mentionedDates || []), ...matches])];
      }
    });

    this.context.conversationHistory = context;
    this.saveToStorage();
  }

  /**
   * Infer parameter value with confidence score
   *
   * Returns the best guess for a parameter along with alternatives
   */
  inferParameter(parameterName: string, workflowContext?: any): InferredParameters | null {
    const lowerParam = parameterName.toLowerCase();

    // Email recipient inference
    if (lowerParam.includes('email') || lowerParam.includes('to') || lowerParam.includes('recipient')) {
      return this.inferEmailRecipient(workflowContext);
    }

    // Slack channel inference
    if (lowerParam.includes('channel') || lowerParam.includes('slack')) {
      return this.inferSlackChannel(workflowContext);
    }

    // Time/schedule inference
    if (lowerParam.includes('time') || lowerParam.includes('schedule') || lowerParam.includes('when')) {
      return this.inferScheduleTime(workflowContext);
    }

    // Timezone inference
    if (lowerParam.includes('timezone') || lowerParam.includes('tz')) {
      return {
        parameter: parameterName,
        value: this.context.timezone || 'Asia/Kuwait',
        confidence: 0.95,
        source: 'regional_default',
        editable: true,
      };
    }

    // Calendar inference
    if (lowerParam.includes('calendar')) {
      return {
        parameter: parameterName,
        value: this.context.calendar?.defaultCalendarId || 'primary',
        confidence: 0.85,
        source: 'connected_app',
        editable: true,
      };
    }

    return null;
  }

  private inferEmailRecipient(_workflowContext?: unknown): InferredParameters {
    const alternatives: string[] = [];
    let value = '';
    let confidence = 0;
    let source: InferredParameters['source'] = 'regional_default';

    // Priority 1: Mentioned in conversation
    const mentioned = this.context.conversationHistory?.mentionedEmails;
    if (mentioned && mentioned.length > 0) {
      value = mentioned[mentioned.length - 1]; // Most recent
      alternatives.push(...mentioned.slice(0, -1));
      confidence = 0.9;
      source = 'message_context';
    }
    // Priority 2: User's own email (for self-notifications)
    else if (this.context.email) {
      value = this.context.email;
      confidence = 0.7;
      source = 'user_profile';
    }
    // Priority 3: Recent contacts
    else if (this.context.gmail?.recentContacts?.length) {
      value = this.context.gmail.recentContacts[0].email;
      alternatives.push(...this.context.gmail.recentContacts.slice(1, 5).map(c => c.email));
      confidence = 0.5;
      source = 'connected_app';
    }
    // Priority 4: Preference
    else if (this.context.preferences?.defaultEmailRecipients?.length) {
      value = this.context.preferences.defaultEmailRecipients[0];
      alternatives.push(...this.context.preferences.defaultEmailRecipients.slice(1));
      confidence = 0.8;
      source = 'preference';
    }

    return {
      parameter: 'email_recipient',
      value,
      confidence,
      source,
      alternativeValues: alternatives,
      editable: true,
    };
  }

  private inferSlackChannel(_workflowContext?: unknown): InferredParameters {
    const alternatives: string[] = [];
    let value = '';
    let confidence = 0;
    let source: InferredParameters['source'] = 'regional_default';

    // Priority 1: Mentioned in conversation
    const mentioned = this.context.conversationHistory?.mentionedChannels;
    if (mentioned && mentioned.length > 0) {
      value = mentioned[mentioned.length - 1];
      alternatives.push(...mentioned.slice(0, -1));
      confidence = 0.95;
      source = 'message_context';
    }
    // Priority 2: Default preference
    else if (this.context.preferences?.defaultSlackChannel) {
      value = this.context.preferences.defaultSlackChannel;
      confidence = 0.85;
      source = 'preference';
    }
    // Priority 3: Default/general channel from workspace
    else if (this.context.slack?.channels?.length) {
      const defaultChannel = this.context.slack.channels.find(c => c.isDefault);
      value = defaultChannel?.name || this.context.slack.channels[0].name;
      alternatives.push(...this.context.slack.channels.slice(0, 5).map(c => c.name).filter(n => n !== value));
      confidence = 0.7;
      source = 'connected_app';
    }
    // Priority 4: Hardcoded default
    else {
      value = 'general';
      confidence = 0.5;
      source = 'regional_default';
    }

    return {
      parameter: 'slack_channel',
      value,
      confidence,
      source,
      alternativeValues: alternatives,
      editable: true,
    };
  }

  private inferScheduleTime(_workflowContext?: unknown): InferredParameters {
    const mentioned = this.context.conversationHistory?.mentionedDates;
    let value = '';
    let confidence = 0;
    let source: InferredParameters['source'] = 'regional_default';

    // Priority 1: Mentioned in conversation
    if (mentioned && mentioned.length > 0) {
      value = mentioned[mentioned.length - 1];
      confidence = 0.9;
      source = 'message_context';
    }
    // Priority 2: Business hours default
    else {
      // Default to 9 AM Kuwait time
      value = '09:00';
      confidence = 0.6;
      source = 'regional_default';
    }

    return {
      parameter: 'schedule_time',
      value,
      confidence,
      source,
      editable: true,
    };
  }

  /**
   * Get all inferred parameters for a workflow
   */
  inferAllParameters(requiredParams: string[], workflowContext?: any): Map<string, InferredParameters> {
    const inferred = new Map<string, InferredParameters>();

    for (const param of requiredParams) {
      const inference = this.inferParameter(param, workflowContext);
      if (inference && inference.value) {
        inferred.set(param, inference);
      }
    }

    return inferred;
  }

  /**
   * Update user preferences based on their choices
   */
  learnFromChoice(parameterName: string, chosenValue: string): void {
    const lowerParam = parameterName.toLowerCase();

    if (!this.context.preferences) {
      this.context.preferences = {};
    }

    if (lowerParam.includes('email') || lowerParam.includes('recipient')) {
      const emails = this.context.preferences.defaultEmailRecipients || [];
      // Move chosen to front
      this.context.preferences.defaultEmailRecipients = [
        chosenValue,
        ...emails.filter(e => e !== chosenValue),
      ].slice(0, 10);
    }

    if (lowerParam.includes('channel')) {
      this.context.preferences.defaultSlackChannel = chosenValue;
    }

    if (lowerParam.includes('time')) {
      this.context.preferences.preferredReportTime = chosenValue;
    }

    this.saveToStorage();
  }

  /**
   * Get the full user context for AI prompting
   */
  getContextForAI(): string {
    const parts: string[] = [];

    if (this.context.email) {
      parts.push(`User email: ${this.context.email}`);
    }

    if (this.context.region === 'kuwait') {
      parts.push(`Region: Kuwait (work week: Sun-Thu, timezone: UTC+3, VAT: 5%, currency: KWD)`);
    }

    if (this.context.slack?.workspaceName) {
      parts.push(`Slack workspace: ${this.context.slack.workspaceName}`);
      if (this.context.slack.channels?.length) {
        const channelNames = this.context.slack.channels.slice(0, 5).map(c => `#${c.name}`).join(', ');
        parts.push(`Available channels: ${channelNames}`);
      }
    }

    if (this.context.gmail?.recentContacts?.length) {
      const contacts = this.context.gmail.recentContacts.slice(0, 3)
        .map(c => `${c.name} <${c.email}>`).join(', ');
      parts.push(`Recent contacts: ${contacts}`);
    }

    const mentioned = this.context.conversationHistory;
    if (mentioned) {
      if (mentioned.mentionedEmails?.length) {
        parts.push(`Mentioned emails: ${mentioned.mentionedEmails.join(', ')}`);
      }
      if (mentioned.mentionedChannels?.length) {
        parts.push(`Mentioned channels: #${mentioned.mentionedChannels.join(', #')}`);
      }
    }

    return parts.join('\n');
  }

  /**
   * Clear conversation context (call after workflow execution)
   */
  clearConversationContext(): void {
    this.context.conversationHistory = undefined;
    this.saveToStorage();
  }

  /**
   * Get the raw context object
   */
  getContext(): UserContext {
    return { ...this.context };
  }

  /**
   * Set user profile data
   */
  setUserProfile(profile: { email?: string; name?: string; timezone?: string }): void {
    if (profile.email) this.context.email = profile.email;
    if (profile.name) this.context.name = profile.name;
    if (profile.timezone) this.context.timezone = profile.timezone;
    this.saveToStorage();
  }
}

// Singleton instance
export const userContextService = new UserContextService();
export default userContextService;
