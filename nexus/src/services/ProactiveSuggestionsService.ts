/**
 * ProactiveSuggestionsService.ts
 *
 * Intelligent proactive suggestions that anticipate user needs
 * and offer relevant automations before being asked.
 *
 * SAFE: This is a NEW file - does not modify any protected code.
 */

export interface ProactiveSuggestion {
  id: string;
  type: 'workflow' | 'integration' | 'optimization' | 'tip';
  title: string;
  description: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  relevanceScore: number; // 0-100
  actionType: 'deploy_workflow' | 'connect_integration' | 'show_info' | 'ask_question';
  actionPayload?: Record<string, unknown>;
  expiresAt?: Date;
}

export interface UserContext {
  connectedIntegrations: string[];
  recentWorkflows: string[];
  region?: string;
  businessType?: string;
  teamSize?: 'solo' | 'small' | 'medium' | 'enterprise';
  lastActive?: Date;
  workflowExecutionCount?: number;
  failedWorkflows?: string[];
}

export interface TemporalContext {
  dayOfWeek: string;
  hour: number;
  isWorkDay: boolean;
  isStartOfWeek: boolean;
  isEndOfWeek: boolean;
  isStartOfMonth: boolean;
  isEndOfMonth: boolean;
}

/**
 * Suggestion rules engine
 */
const SUGGESTION_RULES: Array<{
  id: string;
  name: string;
  condition: (user: UserContext, time: TemporalContext) => boolean;
  generate: (user: UserContext, time: TemporalContext) => ProactiveSuggestion;
}> = [
  // ====================
  // TEMPORAL SUGGESTIONS
  // ====================
  {
    id: 'monday_planning',
    name: 'Monday Planning',
    condition: (_, time) => time.isStartOfWeek && time.hour >= 8 && time.hour < 12,
    generate: () => ({
      id: 'monday_planning',
      type: 'workflow',
      title: 'Weekly Planning Automation',
      description: 'Get your week organized with automated calendar summaries and task reminders',
      reason: "It's the start of your work week - perfect time for planning",
      priority: 'high',
      relevanceScore: 85,
      actionType: 'deploy_workflow',
      actionPayload: {
        templateId: 'weekly-planning',
        steps: [
          { tool: 'googlecalendar', action: 'get_week_events' },
          { tool: 'slack', action: 'send_summary' }
        ]
      }
    })
  },
  {
    id: 'friday_report',
    name: 'Friday Report',
    condition: (user, time) =>
      time.isEndOfWeek &&
      time.hour >= 14 &&
      user.connectedIntegrations.includes('googlesheets'),
    generate: () => ({
      id: 'friday_report',
      type: 'workflow',
      title: 'Weekly Report Generator',
      description: 'Automatically compile and send your weekly activity report',
      reason: "End of work week - time to summarize what you've accomplished",
      priority: 'medium',
      relevanceScore: 75,
      actionType: 'deploy_workflow',
      actionPayload: {
        templateId: 'weekly-report'
      }
    })
  },
  {
    id: 'month_end_finance',
    name: 'Month End Finance',
    condition: (user, time) =>
      time.isEndOfMonth &&
      (user.connectedIntegrations.includes('stripe') ||
       user.connectedIntegrations.includes('quickbooks')),
    generate: () => ({
      id: 'month_end_finance',
      type: 'workflow',
      title: 'Monthly Financial Summary',
      description: 'Generate your monthly revenue and expense report',
      reason: "End of month approaching - time for financial reconciliation",
      priority: 'high',
      relevanceScore: 90,
      actionType: 'deploy_workflow',
      actionPayload: {
        templateId: 'monthly-finance'
      }
    })
  },

  // ==========================
  // INTEGRATION SUGGESTIONS
  // ==========================
  {
    id: 'suggest_slack',
    name: 'Suggest Slack',
    condition: (user) =>
      user.connectedIntegrations.includes('gmail') &&
      !user.connectedIntegrations.includes('slack') &&
      (user.teamSize === 'small' || user.teamSize === 'medium'),
    generate: () => ({
      id: 'suggest_slack',
      type: 'integration',
      title: 'Add Slack for Team Notifications',
      description: 'Get notified on Slack when important emails arrive',
      reason: 'You have Gmail connected - Slack pairs perfectly for team alerts',
      priority: 'medium',
      relevanceScore: 80,
      actionType: 'connect_integration',
      actionPayload: {
        toolkit: 'slack'
      }
    })
  },
  {
    id: 'suggest_whatsapp_gcc',
    name: 'Suggest WhatsApp for GCC',
    condition: (user) =>
      ['kuwait', 'uae', 'saudi', 'qatar', 'bahrain', 'oman'].includes(
        user.region?.toLowerCase() || ''
      ) &&
      !user.connectedIntegrations.includes('whatsapp'),
    generate: (user) => ({
      id: 'suggest_whatsapp_gcc',
      type: 'integration',
      title: 'Connect WhatsApp Business',
      description: 'Automate customer communication on the most popular messaging platform',
      reason: `WhatsApp is the primary business communication tool in ${user.region}`,
      priority: 'high',
      relevanceScore: 95,
      actionType: 'connect_integration',
      actionPayload: {
        toolkit: 'whatsapp'
      }
    })
  },
  {
    id: 'suggest_googlesheets',
    name: 'Suggest Google Sheets',
    condition: (user) =>
      !user.connectedIntegrations.includes('googlesheets') &&
      (user.connectedIntegrations.includes('gmail') ||
       user.connectedIntegrations.includes('slack')),
    generate: () => ({
      id: 'suggest_googlesheets',
      type: 'integration',
      title: 'Connect Google Sheets',
      description: 'Log and track data from your automations in spreadsheets',
      reason: 'Spreadsheets are essential for tracking and reporting',
      priority: 'medium',
      relevanceScore: 70,
      actionType: 'connect_integration',
      actionPayload: {
        toolkit: 'googlesheets'
      }
    })
  },

  // ==========================
  // OPTIMIZATION SUGGESTIONS
  // ==========================
  {
    id: 'failed_workflow_retry',
    name: 'Failed Workflow Retry',
    condition: (user) =>
      (user.failedWorkflows?.length || 0) > 0,
    generate: (user) => ({
      id: 'failed_workflow_retry',
      type: 'optimization',
      title: 'Retry Failed Workflows',
      description: `You have ${user.failedWorkflows?.length} workflow(s) that failed recently`,
      reason: 'Some workflows encountered issues - let me help fix them',
      priority: 'high',
      relevanceScore: 88,
      actionType: 'show_info',
      actionPayload: {
        workflows: user.failedWorkflows
      }
    })
  },
  {
    id: 'workflow_optimization',
    name: 'Workflow Optimization',
    condition: (user) =>
      (user.workflowExecutionCount || 0) > 50,
    generate: () => ({
      id: 'workflow_optimization',
      type: 'optimization',
      title: 'Optimize Your Workflows',
      description: "You've run many workflows - let's analyze for improvements",
      reason: 'High usage suggests opportunities for optimization',
      priority: 'low',
      relevanceScore: 60,
      actionType: 'show_info'
    })
  },

  // ==========================
  // ONBOARDING SUGGESTIONS
  // ==========================
  {
    id: 'first_workflow',
    name: 'First Workflow',
    condition: (user) =>
      user.recentWorkflows.length === 0 &&
      user.connectedIntegrations.length >= 2,
    generate: () => ({
      id: 'first_workflow',
      type: 'workflow',
      title: 'Create Your First Workflow',
      description: "You've connected integrations - let's put them to work!",
      reason: 'Ready to automate - you have multiple integrations connected',
      priority: 'high',
      relevanceScore: 100,
      actionType: 'ask_question',
      actionPayload: {
        question: 'What would you like to automate first?'
      }
    })
  },
  {
    id: 'need_more_integrations',
    name: 'Need More Integrations',
    condition: (user) =>
      user.connectedIntegrations.length < 2,
    generate: () => ({
      id: 'need_more_integrations',
      type: 'tip',
      title: 'Connect More Apps',
      description: 'Workflows work best with at least 2 connected integrations',
      reason: 'More connections = more automation possibilities',
      priority: 'medium',
      relevanceScore: 85,
      actionType: 'show_info'
    })
  },

  // ==========================
  // BUSINESS TYPE SUGGESTIONS
  // ==========================
  {
    id: 'ecommerce_stripe',
    name: 'E-commerce Stripe Alert',
    condition: (user) =>
      user.businessType === 'ecommerce' &&
      user.connectedIntegrations.includes('stripe') &&
      !user.recentWorkflows.includes('payment-alerts'),
    generate: () => ({
      id: 'ecommerce_stripe',
      type: 'workflow',
      title: 'Payment Notification System',
      description: 'Get instant alerts for successful payments and failed transactions',
      reason: 'Essential for e-commerce - never miss a payment event',
      priority: 'high',
      relevanceScore: 92,
      actionType: 'deploy_workflow',
      actionPayload: {
        templateId: 'stripe-notification'
      }
    })
  },
  {
    id: 'developer_github',
    name: 'Developer GitHub Integration',
    condition: (user) =>
      user.businessType === 'saas' &&
      user.connectedIntegrations.includes('github') &&
      user.connectedIntegrations.includes('slack'),
    generate: () => ({
      id: 'developer_github',
      type: 'workflow',
      title: 'GitHub to Slack Notifications',
      description: 'Keep your team updated on PRs, issues, and deployments',
      reason: 'Perfect for SaaS teams - stay synced on code changes',
      priority: 'high',
      relevanceScore: 90,
      actionType: 'deploy_workflow',
      actionPayload: {
        templateId: 'github-to-slack'
      }
    })
  }
];

/**
 * Service for generating proactive suggestions
 */
export class ProactiveSuggestionsService {
  /**
   * Get all relevant suggestions for a user
   */
  static getSuggestions(
    userContext: UserContext,
    limit: number = 5
  ): ProactiveSuggestion[] {
    const temporalContext = this.getTemporalContext(userContext.region);
    const suggestions: ProactiveSuggestion[] = [];

    // Evaluate all rules
    for (const rule of SUGGESTION_RULES) {
      try {
        if (rule.condition(userContext, temporalContext)) {
          const suggestion = rule.generate(userContext, temporalContext);
          suggestions.push(suggestion);
        }
      } catch (error) {
        console.warn(`Error evaluating rule ${rule.id}:`, error);
      }
    }

    // Sort by relevance score and priority
    return suggestions
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.relevanceScore - a.relevanceScore;
      })
      .slice(0, limit);
  }

  /**
   * Get temporal context based on current time and region
   */
  private static getTemporalContext(region?: string): TemporalContext {
    const now = new Date();
    const timezone = this.getTimezone(region);

    // Get localized day and hour
    const dayOfWeek = now.toLocaleDateString('en-US', {
      weekday: 'long',
      timeZone: timezone
    });
    const hour = parseInt(now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      hour12: false,
      timeZone: timezone
    }));
    const dayOfMonth = parseInt(now.toLocaleDateString('en-US', {
      day: 'numeric',
      timeZone: timezone
    }));

    // Determine work days based on region
    const gccRegions = ['kuwait', 'uae', 'saudi', 'qatar', 'bahrain', 'oman'];
    const isGCC = gccRegions.includes(region?.toLowerCase() || '');

    const workDays = isGCC
      ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
      : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    const isWorkDay = workDays.includes(dayOfWeek);
    const isStartOfWeek = isGCC ? dayOfWeek === 'Sunday' : dayOfWeek === 'Monday';
    const isEndOfWeek = isGCC ? dayOfWeek === 'Thursday' : dayOfWeek === 'Friday';

    // Month boundaries
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const isEndOfMonth = dayOfMonth >= lastDayOfMonth - 2;
    const isStartOfMonth = dayOfMonth <= 3;

    return {
      dayOfWeek,
      hour,
      isWorkDay,
      isStartOfWeek,
      isEndOfWeek,
      isStartOfMonth,
      isEndOfMonth
    };
  }

  /**
   * Get timezone for a region
   */
  private static getTimezone(region?: string): string {
    const timezoneMap: Record<string, string> = {
      kuwait: 'Asia/Kuwait',
      uae: 'Asia/Dubai',
      saudi: 'Asia/Riyadh',
      us: 'America/New_York',
      uk: 'Europe/London',
      india: 'Asia/Kolkata'
    };

    return timezoneMap[region?.toLowerCase() || ''] || 'UTC';
  }

  /**
   * Get a specific suggestion by ID
   */
  static getSuggestionById(id: string): ProactiveSuggestion | null {
    const rule = SUGGESTION_RULES.find(r => r.id === id);
    if (!rule) return null;

    // Generate with minimal context
    const minimalUserContext: UserContext = {
      connectedIntegrations: [],
      recentWorkflows: []
    };
    const minimalTemporalContext = this.getTemporalContext();

    return rule.generate(minimalUserContext, minimalTemporalContext);
  }

  /**
   * Dismiss a suggestion (for tracking)
   */
  static dismissSuggestion(suggestionId: string): void {
    // This would typically update user preferences in storage
    // For now, just log it
    console.log(`Suggestion dismissed: ${suggestionId}`);
  }

  /**
   * Mark a suggestion as actioned
   */
  static markActioned(suggestionId: string): void {
    // Track that user took action on this suggestion
    console.log(`Suggestion actioned: ${suggestionId}`);
  }

  /**
   * Get suggestions for a specific context
   */
  static getSuggestionsForWorkflow(
    workflowName: string,
    connectedIntegrations: string[]
  ): ProactiveSuggestion[] {
    const suggestions: ProactiveSuggestion[] = [];

    // After email workflow, suggest notification
    if (workflowName.toLowerCase().includes('email') &&
        !connectedIntegrations.includes('slack')) {
      suggestions.push({
        id: 'add_slack_notification',
        type: 'integration',
        title: 'Add Slack Notifications',
        description: 'Want me to also notify you on Slack when this runs?',
        reason: 'Stay informed without checking email',
        priority: 'medium',
        relevanceScore: 75,
        actionType: 'connect_integration',
        actionPayload: { toolkit: 'slack' }
      });
    }

    // After any workflow, suggest logging
    if (!connectedIntegrations.includes('googlesheets')) {
      suggestions.push({
        id: 'add_logging',
        type: 'optimization',
        title: 'Track This Workflow',
        description: 'Log each run to a spreadsheet for tracking',
        reason: 'Keep records of all automations',
        priority: 'low',
        relevanceScore: 60,
        actionType: 'connect_integration',
        actionPayload: { toolkit: 'googlesheets' }
      });
    }

    return suggestions;
  }

  /**
   * Get time-based greeting and suggestion
   */
  static getGreetingWithSuggestion(
    region?: string,
    userContext?: Partial<UserContext>
  ): { greeting: string; suggestion?: ProactiveSuggestion } {
    const temporal = this.getTemporalContext(region);

    let greeting = 'Hello!';
    if (temporal.hour >= 5 && temporal.hour < 12) {
      greeting = 'Good morning!';
    } else if (temporal.hour >= 12 && temporal.hour < 17) {
      greeting = 'Good afternoon!';
    } else if (temporal.hour >= 17 && temporal.hour < 22) {
      greeting = 'Good evening!';
    }

    // Add work context
    if (temporal.isStartOfWeek && temporal.isWorkDay && temporal.hour >= 8 && temporal.hour < 10) {
      greeting += ' Ready to start the week strong?';
    } else if (temporal.isEndOfWeek && temporal.hour >= 15) {
      greeting += " Almost time to wrap up the week!";
    }

    // Get a relevant suggestion if we have user context
    let suggestion: ProactiveSuggestion | undefined;
    if (userContext) {
      const fullContext: UserContext = {
        connectedIntegrations: userContext.connectedIntegrations || [],
        recentWorkflows: userContext.recentWorkflows || [],
        region,
        ...userContext
      };
      const suggestions = this.getSuggestions(fullContext, 1);
      suggestion = suggestions[0];
    }

    return { greeting, suggestion };
  }
}

export default ProactiveSuggestionsService;
