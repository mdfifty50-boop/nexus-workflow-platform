/**
 * IntegrationDiscoveryService.ts
 *
 * Smart integration discovery that suggests integrations based on
 * user's business type, region, and workflow patterns.
 *
 * SAFE: This is a NEW file - does not modify any protected code.
 */

export interface IntegrationSuggestion {
  toolkit: string;
  name: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  estimatedValue: string;
}

export interface BusinessProfile {
  type: string;
  region: string;
  teamSize: 'solo' | 'small' | 'medium' | 'enterprise';
  primaryLanguage: string;
  existingIntegrations: string[];
}

/**
 * Integration metadata for intelligent suggestions
 */
const INTEGRATION_METADATA: Record<string, {
  name: string;
  category: string;
  regions: string[];
  businessTypes: string[];
  teamSizes: string[];
  languages: string[];
  complementaryTools: string[];
  alternativeTo: string[];
}> = {
  // Communication
  gmail: {
    name: 'Gmail',
    category: 'email',
    regions: ['global'],
    businessTypes: ['*'],
    teamSizes: ['*'],
    languages: ['*'],
    complementaryTools: ['googlesheets', 'slack', 'notion'],
    alternativeTo: ['outlook']
  },
  outlook: {
    name: 'Outlook',
    category: 'email',
    regions: ['global'],
    businessTypes: ['enterprise', 'corporate'],
    teamSizes: ['medium', 'enterprise'],
    languages: ['*'],
    complementaryTools: ['teams', 'onedrive'],
    alternativeTo: ['gmail']
  },
  slack: {
    name: 'Slack',
    category: 'communication',
    regions: ['global'],
    businessTypes: ['saas', 'agency', 'startup'],
    teamSizes: ['small', 'medium', 'enterprise'],
    languages: ['*'],
    complementaryTools: ['github', 'notion', 'googlecalendar'],
    alternativeTo: ['teams', 'discord']
  },
  teams: {
    name: 'Microsoft Teams',
    category: 'communication',
    regions: ['global'],
    businessTypes: ['enterprise', 'corporate', 'education'],
    teamSizes: ['medium', 'enterprise'],
    languages: ['*'],
    complementaryTools: ['outlook', 'onedrive', 'sharepoint'],
    alternativeTo: ['slack', 'discord']
  },
  whatsapp: {
    name: 'WhatsApp Business',
    category: 'communication',
    regions: ['kuwait', 'gcc', 'mena', 'latam', 'india', 'sea'],
    businessTypes: ['retail', 'ecommerce', 'service', 'consulting'],
    teamSizes: ['solo', 'small', 'medium'],
    languages: ['arabic', 'spanish', 'portuguese', 'hindi'],
    complementaryTools: ['hubspot', 'salesforce', 'googlesheets'],
    alternativeTo: []
  },
  discord: {
    name: 'Discord',
    category: 'communication',
    regions: ['global'],
    businessTypes: ['gaming', 'community', 'creator'],
    teamSizes: ['solo', 'small'],
    languages: ['*'],
    complementaryTools: ['github', 'twitter'],
    alternativeTo: ['slack']
  },

  // Productivity
  notion: {
    name: 'Notion',
    category: 'productivity',
    regions: ['global'],
    businessTypes: ['saas', 'agency', 'startup', 'creator'],
    teamSizes: ['solo', 'small', 'medium'],
    languages: ['*'],
    complementaryTools: ['slack', 'gmail', 'googlecalendar'],
    alternativeTo: ['confluence', 'coda']
  },
  googlesheets: {
    name: 'Google Sheets',
    category: 'productivity',
    regions: ['global'],
    businessTypes: ['*'],
    teamSizes: ['*'],
    languages: ['*'],
    complementaryTools: ['gmail', 'slack', 'zapier'],
    alternativeTo: ['excel', 'airtable']
  },
  googlecalendar: {
    name: 'Google Calendar',
    category: 'calendar',
    regions: ['global'],
    businessTypes: ['*'],
    teamSizes: ['*'],
    languages: ['*'],
    complementaryTools: ['gmail', 'zoom', 'slack'],
    alternativeTo: ['outlook']
  },
  trello: {
    name: 'Trello',
    category: 'project-management',
    regions: ['global'],
    businessTypes: ['agency', 'marketing', 'small-business'],
    teamSizes: ['solo', 'small', 'medium'],
    languages: ['*'],
    complementaryTools: ['slack', 'gmail'],
    alternativeTo: ['asana', 'monday']
  },
  asana: {
    name: 'Asana',
    category: 'project-management',
    regions: ['global'],
    businessTypes: ['agency', 'enterprise', 'marketing'],
    teamSizes: ['small', 'medium', 'enterprise'],
    languages: ['*'],
    complementaryTools: ['slack', 'gmail', 'googledrive'],
    alternativeTo: ['trello', 'monday', 'linear']
  },
  linear: {
    name: 'Linear',
    category: 'project-management',
    regions: ['global'],
    businessTypes: ['saas', 'startup', 'engineering'],
    teamSizes: ['small', 'medium'],
    languages: ['*'],
    complementaryTools: ['github', 'slack', 'notion'],
    alternativeTo: ['jira', 'asana']
  },

  // Storage
  dropbox: {
    name: 'Dropbox',
    category: 'storage',
    regions: ['global'],
    businessTypes: ['*'],
    teamSizes: ['*'],
    languages: ['*'],
    complementaryTools: ['gmail', 'slack'],
    alternativeTo: ['googledrive', 'onedrive', 'box']
  },
  googledrive: {
    name: 'Google Drive',
    category: 'storage',
    regions: ['global'],
    businessTypes: ['*'],
    teamSizes: ['*'],
    languages: ['*'],
    complementaryTools: ['gmail', 'googlesheets', 'slack'],
    alternativeTo: ['dropbox', 'onedrive']
  },
  onedrive: {
    name: 'OneDrive',
    category: 'storage',
    regions: ['global'],
    businessTypes: ['enterprise', 'corporate'],
    teamSizes: ['medium', 'enterprise'],
    languages: ['*'],
    complementaryTools: ['outlook', 'teams'],
    alternativeTo: ['googledrive', 'dropbox']
  },

  // Developer Tools
  github: {
    name: 'GitHub',
    category: 'developer',
    regions: ['global'],
    businessTypes: ['saas', 'startup', 'agency'],
    teamSizes: ['*'],
    languages: ['*'],
    complementaryTools: ['slack', 'linear', 'notion'],
    alternativeTo: ['gitlab', 'bitbucket']
  },

  // CRM & Sales
  hubspot: {
    name: 'HubSpot',
    category: 'crm',
    regions: ['global'],
    businessTypes: ['saas', 'agency', 'consulting', 'ecommerce'],
    teamSizes: ['small', 'medium'],
    languages: ['*'],
    complementaryTools: ['gmail', 'slack', 'googlesheets'],
    alternativeTo: ['salesforce', 'pipedrive']
  },
  salesforce: {
    name: 'Salesforce',
    category: 'crm',
    regions: ['global'],
    businessTypes: ['enterprise', 'corporate'],
    teamSizes: ['medium', 'enterprise'],
    languages: ['*'],
    complementaryTools: ['outlook', 'slack'],
    alternativeTo: ['hubspot']
  },

  // Finance
  stripe: {
    name: 'Stripe',
    category: 'payments',
    regions: ['global'],
    businessTypes: ['saas', 'ecommerce', 'marketplace'],
    teamSizes: ['*'],
    languages: ['*'],
    complementaryTools: ['slack', 'googlesheets', 'quickbooks'],
    alternativeTo: ['paypal']
  },
  quickbooks: {
    name: 'QuickBooks',
    category: 'accounting',
    regions: ['us', 'canada', 'uk', 'australia'],
    businessTypes: ['small-business', 'consulting', 'retail'],
    teamSizes: ['solo', 'small', 'medium'],
    languages: ['english'],
    complementaryTools: ['stripe', 'gmail', 'googlesheets'],
    alternativeTo: ['xero', 'freshbooks']
  },

  // Social Media
  twitter: {
    name: 'Twitter/X',
    category: 'social',
    regions: ['global'],
    businessTypes: ['creator', 'media', 'marketing'],
    teamSizes: ['*'],
    languages: ['*'],
    complementaryTools: ['slack', 'googlesheets'],
    alternativeTo: []
  },
  linkedin: {
    name: 'LinkedIn',
    category: 'social',
    regions: ['global'],
    businessTypes: ['recruiting', 'b2b', 'consulting', 'saas'],
    teamSizes: ['*'],
    languages: ['*'],
    complementaryTools: ['hubspot', 'gmail', 'slack'],
    alternativeTo: []
  },

  // Video & Meetings
  zoom: {
    name: 'Zoom',
    category: 'video',
    regions: ['global'],
    businessTypes: ['*'],
    teamSizes: ['*'],
    languages: ['*'],
    complementaryTools: ['googlecalendar', 'slack', 'notion'],
    alternativeTo: ['meet', 'teams']
  }
};

/**
 * Regional intelligence for integration suggestions
 */
const REGIONAL_PREFERENCES: Record<string, {
  primaryCommunication: string[];
  preferredPayments: string[];
  popularTools: string[];
  languageSupport: string[];
}> = {
  kuwait: {
    primaryCommunication: ['whatsapp', 'slack'],
    preferredPayments: ['stripe'], // KNET integration would be ideal
    popularTools: ['googlesheets', 'gmail', 'notion'],
    languageSupport: ['arabic', 'english']
  },
  gcc: {
    primaryCommunication: ['whatsapp', 'teams', 'slack'],
    preferredPayments: ['stripe'],
    popularTools: ['googlesheets', 'gmail', 'teams'],
    languageSupport: ['arabic', 'english']
  },
  mena: {
    primaryCommunication: ['whatsapp', 'telegram'],
    preferredPayments: ['stripe'],
    popularTools: ['googlesheets', 'gmail'],
    languageSupport: ['arabic', 'english', 'french']
  },
  us: {
    primaryCommunication: ['slack', 'teams'],
    preferredPayments: ['stripe', 'square'],
    popularTools: ['slack', 'notion', 'asana'],
    languageSupport: ['english']
  },
  uk: {
    primaryCommunication: ['slack', 'teams'],
    preferredPayments: ['stripe'],
    popularTools: ['slack', 'notion', 'trello'],
    languageSupport: ['english']
  },
  india: {
    primaryCommunication: ['whatsapp', 'slack'],
    preferredPayments: ['stripe', 'razorpay'],
    popularTools: ['googlesheets', 'slack', 'notion'],
    languageSupport: ['english', 'hindi']
  }
};

/**
 * Service for intelligent integration discovery
 */
export class IntegrationDiscoveryService {
  /**
   * Get personalized integration suggestions
   */
  static getSuggestions(profile: BusinessProfile): IntegrationSuggestion[] {
    const suggestions: IntegrationSuggestion[] = [];
    const existingSet = new Set(profile.existingIntegrations.map(i => i.toLowerCase()));

    // Get regional preferences
    const regionPrefs = REGIONAL_PREFERENCES[profile.region.toLowerCase()] ||
                        REGIONAL_PREFERENCES['us']; // Default to US

    // Score each integration
    for (const [toolkit, meta] of Object.entries(INTEGRATION_METADATA)) {
      if (existingSet.has(toolkit)) continue; // Skip already connected

      let score = 0;
      let reasons: string[] = [];

      // Region match
      if (meta.regions.includes('global') || meta.regions.includes(profile.region.toLowerCase())) {
        score += 20;
      }

      // Business type match
      if (meta.businessTypes.includes('*') ||
          meta.businessTypes.includes(profile.type.toLowerCase())) {
        score += 30;
        reasons.push(`Great for ${profile.type} businesses`);
      }

      // Team size match
      if (meta.teamSizes.includes('*') ||
          meta.teamSizes.includes(profile.teamSize)) {
        score += 15;
      }

      // Regional preference boost
      if (regionPrefs.primaryCommunication.includes(toolkit)) {
        score += 25;
        reasons.push(`Popular in ${profile.region}`);
      }
      if (regionPrefs.popularTools.includes(toolkit)) {
        score += 20;
      }

      // Complementary to existing integrations
      const complementaryCount = meta.complementaryTools.filter(t =>
        existingSet.has(t)
      ).length;
      if (complementaryCount > 0) {
        score += complementaryCount * 15;
        reasons.push(`Works great with your existing tools`);
      }

      // Only suggest if score is meaningful
      if (score >= 30) {
        suggestions.push({
          toolkit,
          name: meta.name,
          reason: reasons[0] || `Recommended for ${meta.category}`,
          priority: score >= 60 ? 'high' : score >= 45 ? 'medium' : 'low',
          category: meta.category,
          estimatedValue: this.estimateValue(toolkit, profile)
        });
      }
    }

    // Sort by priority and return top suggestions
    return suggestions
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
      .slice(0, 10);
  }

  /**
   * Estimate value of connecting an integration
   */
  private static estimateValue(toolkit: string, _profile: BusinessProfile): string {
    // Rough estimates based on common automation patterns
    const valueEstimates: Record<string, string> = {
      gmail: '3-5 hours/week',
      slack: '2-3 hours/week',
      whatsapp: '5-8 hours/week',
      googlesheets: '2-4 hours/week',
      notion: '2-3 hours/week',
      hubspot: '4-6 hours/week',
      stripe: '2-3 hours/week',
      github: '2-4 hours/week',
      zoom: '1-2 hours/week',
      googlecalendar: '1-2 hours/week'
    };

    return valueEstimates[toolkit] || '1-2 hours/week';
  }

  /**
   * Get integration combinations that work well together
   */
  static getRecommendedCombinations(region: string): Array<{
    name: string;
    integrations: string[];
    useCase: string;
  }> {
    const regionLower = region.toLowerCase();
    const isGCC = ['kuwait', 'uae', 'saudi', 'qatar', 'bahrain', 'oman'].includes(regionLower);

    const combinations = [
      {
        name: 'Essential Productivity',
        integrations: ['gmail', 'googlesheets', 'slack'],
        useCase: 'Email tracking, data logging, team notifications'
      },
      {
        name: 'Developer Workflow',
        integrations: ['github', 'slack', 'linear'],
        useCase: 'Code changes, issue tracking, team updates'
      },
      {
        name: 'Sales Pipeline',
        integrations: ['gmail', 'hubspot', 'slack'],
        useCase: 'Lead capture, CRM updates, deal notifications'
      }
    ];

    // Add region-specific combination
    if (isGCC) {
      combinations.unshift({
        name: 'GCC Business Essential',
        integrations: ['whatsapp', 'googlesheets', 'gmail'],
        useCase: 'Customer communication, order tracking, email backup'
      });
    }

    return combinations;
  }

  /**
   * Get alternative integrations for a given tool
   */
  static getAlternatives(toolkit: string): string[] {
    const meta = INTEGRATION_METADATA[toolkit.toLowerCase()];
    return meta?.alternativeTo || [];
  }

  /**
   * Check if user is missing critical integrations for their use case
   */
  static getMissingCritical(
    profile: BusinessProfile,
    intendedUseCase: string
  ): IntegrationSuggestion[] {
    const useCaseRequirements: Record<string, string[]> = {
      'email-automation': ['gmail', 'googlesheets'],
      'team-communication': ['slack', 'gmail'],
      'customer-support': ['whatsapp', 'hubspot', 'slack'],
      'developer-workflow': ['github', 'slack'],
      'sales-pipeline': ['hubspot', 'gmail', 'slack'],
      'content-management': ['notion', 'googledrive', 'slack'],
      'finance-tracking': ['stripe', 'googlesheets', 'slack']
    };

    const required = useCaseRequirements[intendedUseCase] || [];
    const existingSet = new Set(profile.existingIntegrations.map(i => i.toLowerCase()));

    return required
      .filter(t => !existingSet.has(t))
      .map(toolkit => {
        const meta = INTEGRATION_METADATA[toolkit];
        return {
          toolkit,
          name: meta?.name || toolkit,
          reason: `Required for ${intendedUseCase.replace('-', ' ')}`,
          priority: 'high' as const,
          category: meta?.category || 'other',
          estimatedValue: this.estimateValue(toolkit, profile)
        };
      });
  }
}

export default IntegrationDiscoveryService;
