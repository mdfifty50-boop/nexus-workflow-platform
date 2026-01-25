/**
 * Nexus Marketing Domain Intelligence Module
 *
 * Provides comprehensive marketing workflow intelligence including:
 * - Content calendar management
 * - Social media automation
 * - Email campaigns and newsletters
 * - Event and webinar promotion
 * - Ad campaign management
 * - Analytics and reporting
 * - Brand asset management
 *
 * Regional Focus: Kuwait/Gulf with Arabic content support,
 * local platform preferences, and regional timing optimization.
 */

import type {
  ImplicitRequirement,
  ClarifyingQuestion,
  ToolRecommendation,
  WorkflowChainStep,
  QuestionOption,
} from '../workflow-intelligence';

// ============================================================================
// TYPES
// ============================================================================

export interface MarketingWorkflowPattern {
  name: string;
  description: string;
  layers: ('input' | 'processing' | 'output' | 'notification')[];
  steps: string[];
  implicitNeeds: string[];
  questions: string[];
  kpis: string[];
  estimatedROI: string;
}

export interface MarketingRegionalContext {
  region: string;
  popularPlatforms: string[];
  bestPostingTimes: Record<string, string>;
  languagePreference: string;
  contentConsiderations: string;
  influencerPlatform: string;
  hashtagStrategy: string;
  culturalEvents: string[];
  adPlatformAvailability: string[];
}

export interface ROICalculation {
  spend: number;
  revenue: number;
  roi: number;
  roiPercentage: string;
  formula: string;
  notes: string[];
}

export interface CampaignPerformance {
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  conversionRate: number;
  cpc: number;
  cpa: number;
  roas: number;
}

export interface ContentCalendarEntry {
  date: string;
  platform: string;
  contentType: string;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  engagement?: number;
}

export interface MarketingAnalysisResult {
  pattern: string | null;
  requirements: ImplicitRequirement[];
  tools: ToolRecommendation[];
  questions: ClarifyingQuestion[];
  regionalContext: MarketingRegionalContext | null;
  confidenceScore: number;
}

// ============================================================================
// MARKETING WORKFLOW PATTERNS
// ============================================================================

export const MARKETING_WORKFLOW_PATTERNS: Record<string, MarketingWorkflowPattern> = {
  // Content Calendar Pattern
  content_calendar: {
    name: 'Content Calendar',
    description: 'Editorial planning, content scheduling, and cross-platform publishing coordination',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'define_content_strategy',
      'create_editorial_calendar',
      'assign_content_creators',
      'draft_content',
      'review_and_approve',
      'schedule_publishing',
      'cross_post_platforms',
      'track_performance',
    ],
    implicitNeeds: [
      'Content ideation and brainstorming tool',
      'Editorial calendar with team collaboration',
      'Content creation workflow and approval chain',
      'Multi-platform scheduling integration',
      'SEO optimization and keyword research',
      'Asset management for images/videos',
      'Performance tracking and analytics',
      'Team notifications for deadlines',
    ],
    questions: [
      'What platforms do you publish content to?',
      'How many team members need calendar access?',
      'What is your content approval workflow?',
      'Do you need SEO optimization features?',
      'What content types do you create (blog, video, social)?',
    ],
    kpis: ['Content output volume', 'Publishing consistency', 'SEO rankings', 'Engagement rate'],
    estimatedROI: 'Increases content output by 40%, reduces planning time by 60%',
  },

  // Blog Publishing Pattern
  blog_publishing: {
    name: 'Blog Publishing',
    description: 'End-to-end blog content creation from ideation to publication and promotion',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'research_topics',
      'create_outline',
      'write_draft',
      'add_media',
      'optimize_seo',
      'review_edit',
      'publish_article',
      'promote_social',
      'track_metrics',
    ],
    implicitNeeds: [
      'Keyword research and topic ideation',
      'Content writing or AI assistance',
      'Image/media sourcing and editing',
      'SEO optimization (meta, schema, keywords)',
      'CMS integration (WordPress, Webflow, etc.)',
      'Social sharing automation',
      'Analytics integration (GA4, etc.)',
    ],
    questions: [
      'What CMS platform do you use?',
      'Do you need AI writing assistance?',
      'What is your target SEO strategy?',
      'Should posts be auto-shared to social media?',
      'Who reviews content before publishing?',
    ],
    kpis: ['Organic traffic', 'Time on page', 'Bounce rate', 'Backlinks acquired'],
    estimatedROI: 'Reduces blog publishing time by 50%, improves SEO rankings by 35%',
  },

  // Social Media Posting Pattern
  social_media_posting: {
    name: 'Social Media Posting',
    description: 'Automated social media content creation, scheduling, and engagement tracking',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'create_content',
      'format_per_platform',
      'add_hashtags',
      'schedule_optimal_time',
      'post_content',
      'monitor_engagement',
      'respond_to_comments',
      'analyze_performance',
    ],
    implicitNeeds: [
      'Content creation/curation tools',
      'Platform-specific formatting (aspect ratios, character limits)',
      'Hashtag research and strategy',
      'Optimal posting time calculation',
      'Multi-platform scheduling',
      'Comment and DM management',
      'Engagement analytics',
      'Competitor monitoring',
    ],
    questions: [
      'Which social platforms do you use?',
      'Do you need content creation assistance?',
      'Should posting times be optimized automatically?',
      'Do you need hashtag recommendations?',
      'Should comments/DMs be managed in one place?',
    ],
    kpis: ['Follower growth', 'Engagement rate', 'Reach/Impressions', 'Click-through rate'],
    estimatedROI: 'Saves 10+ hours/week on social management, increases engagement by 25%',
  },

  // Email Campaign Pattern
  email_campaign: {
    name: 'Email Campaign',
    description: 'Comprehensive email marketing campaign creation, sending, and optimization',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'define_campaign_goal',
      'segment_audience',
      'design_email_template',
      'write_copy',
      'set_up_ab_test',
      'schedule_send',
      'monitor_delivery',
      'track_opens_clicks',
      'analyze_conversions',
    ],
    implicitNeeds: [
      'Email list management and segmentation',
      'Email template builder (drag-and-drop)',
      'Copywriting assistance',
      'A/B testing capabilities',
      'Deliverability optimization',
      'Open/click tracking',
      'Conversion tracking',
      'Unsubscribe management (compliance)',
      'Automation sequences',
    ],
    questions: [
      'What email platform do you currently use?',
      'How large is your email list?',
      'Do you need audience segmentation?',
      'Should A/B testing be automated?',
      'Do you need email automation sequences?',
    ],
    kpis: ['Open rate', 'Click rate', 'Conversion rate', 'Unsubscribe rate', 'Revenue per email'],
    estimatedROI: 'Increases email revenue by 30%, improves open rates by 20%',
  },

  // Newsletter Distribution Pattern
  newsletter_distribution: {
    name: 'Newsletter Distribution',
    description: 'Regular newsletter creation, curation, and subscriber management',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'curate_content',
      'design_layout',
      'personalize_content',
      'preview_test',
      'schedule_send',
      'deliver_newsletter',
      'track_engagement',
      'manage_subscribers',
    ],
    implicitNeeds: [
      'Content curation and aggregation',
      'Newsletter design templates',
      'Personalization tokens',
      'Preview and testing tools',
      'Subscriber list management',
      'Engagement analytics',
      'Growth tracking',
    ],
    questions: [
      'What is your newsletter frequency?',
      'Do you curate external content or create original?',
      'What personalization do you need?',
      'How do subscribers sign up?',
      'Do you monetize through sponsors?',
    ],
    kpis: ['Subscriber growth', 'Open rate', 'Click rate', 'Churn rate'],
    estimatedROI: 'Reduces newsletter creation time by 70%, increases subscriber retention by 15%',
  },

  // Event Promotion Pattern
  event_promotion: {
    name: 'Event Promotion',
    description: 'Multi-channel event marketing from announcement to post-event follow-up',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'create_event_page',
      'design_promotional_assets',
      'launch_announcement',
      'run_ad_campaigns',
      'send_email_invites',
      'post_social_reminders',
      'track_registrations',
      'send_reminders',
      'post_event_follow_up',
    ],
    implicitNeeds: [
      'Event landing page builder',
      'Registration management',
      'Promotional asset creation',
      'Multi-channel campaign coordination',
      'Ad campaign management',
      'Email invitation sequences',
      'Social media promotion',
      'Reminder automation',
      'Post-event survey and follow-up',
    ],
    questions: [
      'Is this an online or in-person event?',
      'What is your registration platform?',
      'Which channels should promote the event?',
      'Do you need paid advertising?',
      'What is your attendee target?',
    ],
    kpis: ['Registrations', 'Attendance rate', 'Cost per registration', 'Post-event engagement'],
    estimatedROI: 'Increases event registrations by 45%, reduces promotional effort by 50%',
  },

  // Webinar Setup Pattern
  webinar_setup: {
    name: 'Webinar Setup',
    description: 'Complete webinar workflow from registration to recording distribution',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'choose_webinar_platform',
      'create_registration_page',
      'set_up_email_sequences',
      'promote_webinar',
      'send_reminders',
      'host_webinar',
      'record_session',
      'distribute_recording',
      'follow_up_attendees',
    ],
    implicitNeeds: [
      'Webinar hosting platform',
      'Registration and landing page',
      'Email reminder sequences',
      'Promotional campaign setup',
      'Live streaming capability',
      'Recording and editing',
      'Recording distribution',
      'Attendee follow-up automation',
    ],
    questions: [
      'What webinar platform do you prefer?',
      'Will the webinar be live or pre-recorded?',
      'Do you need Q&A or chat features?',
      'Should the recording be gated or public?',
      'What is your follow-up strategy?',
    ],
    kpis: ['Registration rate', 'Show-up rate', 'Engagement during webinar', 'Post-webinar conversions'],
    estimatedROI: 'Improves show-up rates by 25%, automates 80% of webinar admin tasks',
  },

  // Press Release Pattern
  press_release: {
    name: 'Press Release',
    description: 'Press release creation, distribution, and media coverage tracking',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'write_press_release',
      'create_media_kit',
      'build_media_list',
      'distribute_release',
      'pitch_journalists',
      'track_coverage',
      'measure_impact',
    ],
    implicitNeeds: [
      'PR writing assistance',
      'Media kit creation',
      'Media database access',
      'Distribution network (PRWeb, PR Newswire)',
      'Journalist outreach tools',
      'Media monitoring',
      'Coverage tracking and analytics',
    ],
    questions: [
      'What is the nature of the announcement?',
      'Do you have an existing media list?',
      'Which distribution services do you use?',
      'Do you need media monitoring?',
      'What is your timeline for coverage?',
    ],
    kpis: ['Media pickups', 'Coverage reach', 'Share of voice', 'Backlinks from coverage'],
    estimatedROI: 'Increases media coverage by 35%, streamlines distribution by 60%',
  },

  // Influencer Outreach Pattern
  influencer_outreach: {
    name: 'Influencer Outreach',
    description: 'Influencer discovery, outreach, campaign management, and ROI tracking',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'define_campaign_goals',
      'identify_influencers',
      'analyze_audience_fit',
      'send_outreach',
      'negotiate_terms',
      'manage_content_approval',
      'track_deliverables',
      'measure_campaign_roi',
    ],
    implicitNeeds: [
      'Influencer discovery platform',
      'Audience analytics and verification',
      'Outreach and CRM tools',
      'Contract and payment management',
      'Content approval workflow',
      'Campaign tracking',
      'ROI measurement',
    ],
    questions: [
      'What platforms are you targeting for influencers?',
      'What is your influencer budget?',
      'Do you prefer micro or macro influencers?',
      'How do you currently find influencers?',
      'What is your content approval process?',
    ],
    kpis: ['Reach', 'Engagement rate', 'Cost per engagement', 'Conversions from influencer content'],
    estimatedROI: 'Reduces influencer identification time by 75%, improves campaign ROI by 40%',
  },

  // Ad Campaign Launch Pattern
  ad_campaign_launch: {
    name: 'Ad Campaign Launch',
    description: 'Paid advertising campaign setup, optimization, and performance tracking',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'define_campaign_objective',
      'set_budget_and_schedule',
      'create_audience_targeting',
      'design_ad_creatives',
      'write_ad_copy',
      'set_up_tracking',
      'launch_campaign',
      'monitor_performance',
      'optimize_and_scale',
    ],
    implicitNeeds: [
      'Ad platform integration (Google, Meta, TikTok)',
      'Audience targeting and segmentation',
      'Creative design tools',
      'Ad copywriting',
      'Conversion tracking setup',
      'Performance monitoring',
      'Budget optimization',
      'A/B testing',
    ],
    questions: [
      'Which ad platforms do you want to use?',
      'What is your campaign objective (awareness, traffic, conversions)?',
      'What is your total budget?',
      'Do you have existing creatives?',
      'What is your target audience?',
    ],
    kpis: ['Impressions', 'CTR', 'CPC', 'CPA', 'ROAS'],
    estimatedROI: 'Improves ROAS by 30%, reduces campaign setup time by 50%',
  },

  // Landing Page Creation Pattern
  landing_page_creation: {
    name: 'Landing Page Creation',
    description: 'High-converting landing page design, development, and optimization',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'define_conversion_goal',
      'research_audience',
      'design_page_layout',
      'write_copy',
      'add_form_and_cta',
      'set_up_tracking',
      'publish_page',
      'run_ab_tests',
      'optimize_conversion',
    ],
    implicitNeeds: [
      'Landing page builder',
      'Copywriting assistance',
      'Form builder',
      'A/B testing tool',
      'Analytics integration',
      'CRM/email integration',
      'Page speed optimization',
    ],
    questions: [
      'What is the primary conversion goal?',
      'What landing page tool do you use?',
      'Do you need form integration?',
      'Should leads go to a CRM?',
      'Do you need A/B testing?',
    ],
    kpis: ['Conversion rate', 'Bounce rate', 'Time on page', 'Form completion rate'],
    estimatedROI: 'Increases conversion rates by 25%, reduces page creation time by 60%',
  },

  // Lead Magnet Delivery Pattern
  lead_magnet_delivery: {
    name: 'Lead Magnet Delivery',
    description: 'Automated lead magnet delivery system with nurture sequences',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'create_lead_magnet',
      'build_opt_in_form',
      'set_up_delivery_automation',
      'configure_thank_you_page',
      'create_nurture_sequence',
      'track_downloads',
      'segment_leads',
      'trigger_follow_up',
    ],
    implicitNeeds: [
      'Lead magnet hosting',
      'Form builder with opt-in',
      'Email automation',
      'Thank you page builder',
      'Lead segmentation',
      'Download tracking',
      'Nurture sequence builder',
    ],
    questions: [
      'What type of lead magnet (ebook, checklist, video)?',
      'Where will the opt-in form be placed?',
      'What email sequence follows delivery?',
      'Do you need lead scoring?',
      'Should leads be tagged by magnet type?',
    ],
    kpis: ['Opt-in rate', 'Download completion', 'Nurture email engagement', 'Lead-to-customer rate'],
    estimatedROI: 'Automates 90% of lead delivery, improves lead quality by 35%',
  },

  // Survey Distribution Pattern
  survey_distribution: {
    name: 'Survey Distribution',
    description: 'Survey creation, distribution, and response analysis',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'create_survey',
      'configure_logic',
      'design_branding',
      'set_distribution_channels',
      'send_survey',
      'track_responses',
      'analyze_results',
      'generate_reports',
    ],
    implicitNeeds: [
      'Survey builder with logic',
      'Multi-channel distribution',
      'Response collection',
      'Data analysis',
      'Reporting and visualization',
      'Integration with CRM/email',
    ],
    questions: [
      'What is the survey purpose (NPS, feedback, research)?',
      'How will you distribute the survey?',
      'Do you need branching logic?',
      'What analysis do you need?',
      'Should results integrate with your CRM?',
    ],
    kpis: ['Response rate', 'Completion rate', 'NPS score', 'Sentiment analysis'],
    estimatedROI: 'Increases response rates by 40%, reduces analysis time by 70%',
  },

  // Analytics Reporting Pattern
  analytics_reporting: {
    name: 'Analytics Reporting',
    description: 'Automated marketing analytics collection and reporting',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'connect_data_sources',
      'define_metrics',
      'set_up_dashboards',
      'automate_data_collection',
      'generate_reports',
      'schedule_delivery',
      'provide_insights',
      'recommend_actions',
    ],
    implicitNeeds: [
      'Multi-platform data connectors',
      'Data aggregation and transformation',
      'Dashboard builder',
      'Automated report generation',
      'KPI tracking',
      'Anomaly detection',
      'AI-powered insights',
    ],
    questions: [
      'What data sources need to be connected?',
      'What KPIs are most important?',
      'How often do you need reports?',
      'Who receives the reports?',
      'Do you need AI-powered insights?',
    ],
    kpis: ['Data accuracy', 'Report delivery time', 'Actionable insights generated'],
    estimatedROI: 'Saves 15+ hours/week on reporting, improves data accuracy by 40%',
  },

  // Brand Asset Management Pattern
  brand_asset_management: {
    name: 'Brand Asset Management',
    description: 'Centralized brand asset storage, organization, and distribution',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'upload_assets',
      'organize_library',
      'set_permissions',
      'create_brand_guidelines',
      'enable_search',
      'distribute_assets',
      'track_usage',
      'manage_versions',
    ],
    implicitNeeds: [
      'Digital asset management (DAM) system',
      'Folder and tag organization',
      'Permission management',
      'Brand guideline documentation',
      'Search and discovery',
      'Asset distribution',
      'Usage analytics',
      'Version control',
    ],
    questions: [
      'How many brand assets do you manage?',
      'Who needs access to assets?',
      'Do you have brand guidelines?',
      'Do you need usage tracking?',
      'What file types do you store?',
    ],
    kpis: ['Asset findability', 'Brand consistency', 'Time to find assets', 'Asset reuse rate'],
    estimatedROI: 'Reduces asset search time by 75%, improves brand consistency by 50%',
  },
};

// ============================================================================
// MARKETING KEYWORDS FOR PATTERN DETECTION
// ============================================================================

export const MARKETING_KEYWORDS: Record<string, string[]> = {
  content_calendar: [
    'content', 'calendar', 'editorial', 'schedule', 'plan', 'planning',
    'content plan', 'editorial calendar', 'content schedule', 'publishing schedule',
    'جدول المحتوى', 'تقويم المحتوى'
  ],

  blog_publishing: [
    'blog', 'article', 'post', 'publish', 'wordpress', 'webflow',
    'write blog', 'blog post', 'article writing', 'content writing',
    'مدونة', 'مقال', 'نشر'
  ],

  social_media_posting: [
    'social', 'instagram', 'twitter', 'linkedin', 'tiktok', 'facebook',
    'post', 'posting', 'schedule post', 'social media', 'snapchat',
    'انستغرام', 'تويتر', 'لينكدإن', 'تيك توك', 'فيسبوك', 'سناب شات'
  ],

  email_campaign: [
    'email', 'campaign', 'email campaign', 'send email', 'email marketing',
    'drip', 'sequence', 'automation', 'newsletter campaign',
    'حملة إيميل', 'بريد إلكتروني', 'حملة تسويقية'
  ],

  newsletter_distribution: [
    'newsletter', 'bulletin', 'digest', 'weekly email', 'subscriber',
    'subscription', 'mailing list', 'email list',
    'نشرة إخبارية', 'نشرة', 'مشتركين'
  ],

  event_promotion: [
    'event', 'promote event', 'event marketing', 'conference', 'workshop',
    'meetup', 'seminar', 'event promotion', 'registration',
    'فعالية', 'حدث', 'تسجيل', 'ورشة عمل'
  ],

  webinar_setup: [
    'webinar', 'online event', 'virtual event', 'live session', 'zoom webinar',
    'web seminar', 'online workshop',
    'ويبينار', 'ندوة عبر الإنترنت'
  ],

  press_release: [
    'press', 'release', 'pr', 'media', 'news', 'announcement',
    'press release', 'media coverage', 'journalist', 'publication',
    'بيان صحفي', 'إعلان صحفي', 'تغطية إعلامية'
  ],

  influencer_outreach: [
    'influencer', 'influencers', 'creator', 'ambassador', 'kol',
    'micro influencer', 'macro influencer', 'brand ambassador', 'collaboration',
    'مؤثر', 'مؤثرين', 'تعاون'
  ],

  ad_campaign_launch: [
    'ad', 'ads', 'advertising', 'paid', 'ppc', 'cpc', 'cpa',
    'google ads', 'facebook ads', 'meta ads', 'tiktok ads', 'campaign',
    'إعلان', 'إعلانات', 'حملة إعلانية'
  ],

  landing_page_creation: [
    'landing page', 'landing', 'lp', 'squeeze page', 'conversion page',
    'opt-in page', 'lead page',
    'صفحة هبوط', 'صفحة التحويل'
  ],

  lead_magnet_delivery: [
    'lead magnet', 'ebook', 'whitepaper', 'checklist', 'guide',
    'free download', 'gated content', 'opt-in',
    'محتوى مجاني', 'دليل', 'كتاب إلكتروني'
  ],

  survey_distribution: [
    'survey', 'feedback', 'nps', 'questionnaire', 'poll',
    'customer feedback', 'satisfaction survey',
    'استبيان', 'استطلاع', 'رأي العملاء'
  ],

  analytics_reporting: [
    'analytics', 'report', 'reporting', 'dashboard', 'metrics',
    'kpi', 'performance', 'insights', 'data',
    'تحليلات', 'تقرير', 'مؤشرات الأداء'
  ],

  brand_asset_management: [
    'brand', 'asset', 'assets', 'dam', 'logo', 'brand kit',
    'brand guidelines', 'media library', 'asset management',
    'علامة تجارية', 'هوية بصرية', 'أصول'
  ],
};

// ============================================================================
// MARKETING IMPLICIT REQUIREMENTS
// ============================================================================

export const MARKETING_IMPLICIT_REQUIREMENTS: Record<string, ImplicitRequirement[]> = {
  content_calendar: [
    {
      category: 'input',
      description: 'Content ideation and topic research',
      reason: 'Ensures content aligns with audience interests and SEO goals',
      priority: 'important',
      suggestedTools: ['Ahrefs', 'SEMrush', 'BuzzSumo', 'AnswerThePublic'],
    },
    {
      category: 'processing',
      description: 'Editorial workflow with approval stages',
      reason: 'Maintains content quality and brand consistency',
      priority: 'critical',
      suggestedTools: ['Notion', 'Asana', 'Monday.com', 'CoSchedule'],
    },
    {
      category: 'processing',
      description: 'Team collaboration and task assignment',
      reason: 'Coordinates multiple content creators and reviewers',
      priority: 'important',
      suggestedTools: ['Slack', 'Microsoft Teams', 'Notion', 'ClickUp'],
    },
    {
      category: 'output',
      description: 'Multi-platform scheduling integration',
      reason: 'Publishes content across all channels from one place',
      priority: 'critical',
      suggestedTools: ['Buffer', 'Hootsuite', 'Later', 'Sprout Social'],
    },
    {
      category: 'notification',
      description: 'Deadline reminders and status updates',
      reason: 'Keeps team on track with publishing schedule',
      priority: 'important',
      suggestedTools: ['Slack', 'Email', 'Asana notifications'],
    },
  ],

  blog_publishing: [
    {
      category: 'input',
      description: 'Keyword research and SEO planning',
      reason: 'Optimizes content for search visibility',
      priority: 'critical',
      suggestedTools: ['Ahrefs', 'SEMrush', 'Moz', 'Ubersuggest'],
    },
    {
      category: 'processing',
      description: 'Content writing assistance',
      reason: 'Speeds up content creation while maintaining quality',
      priority: 'important',
      suggestedTools: ['Jasper', 'Copy.ai', 'Claude AI', 'Grammarly'],
    },
    {
      category: 'processing',
      description: 'On-page SEO optimization',
      reason: 'Ensures content is properly optimized for search engines',
      priority: 'critical',
      suggestedTools: ['Yoast SEO', 'RankMath', 'Surfer SEO', 'Clearscope'],
    },
    {
      category: 'output',
      description: 'CMS integration and publishing',
      reason: 'Publishes content directly to your blog platform',
      priority: 'critical',
      suggestedTools: ['WordPress', 'Webflow', 'Ghost', 'Medium'],
    },
    {
      category: 'notification',
      description: 'Social sharing automation',
      reason: 'Promotes new content across social channels automatically',
      priority: 'important',
      suggestedTools: ['Buffer', 'Hootsuite', 'Zapier', 'IFTTT'],
    },
  ],

  social_media_posting: [
    {
      category: 'input',
      description: 'Platform-specific content formatting',
      reason: 'Different platforms have different optimal formats and sizes',
      priority: 'critical',
      suggestedTools: ['Canva', 'Adobe Express', 'Figma'],
    },
    {
      category: 'processing',
      description: 'Hashtag research and strategy',
      reason: 'Maximizes content discoverability on each platform',
      priority: 'important',
      suggestedTools: ['Hashtagify', 'RiteTag', 'Display Purposes', 'Later'],
    },
    {
      category: 'processing',
      description: 'Optimal posting time calculation',
      reason: 'Posts when your audience is most active',
      priority: 'important',
      suggestedTools: ['Sprout Social', 'Buffer', 'Hootsuite', 'Later'],
    },
    {
      category: 'output',
      description: 'Multi-platform scheduling',
      reason: 'Manages all social accounts from one dashboard',
      priority: 'critical',
      suggestedTools: ['Buffer', 'Hootsuite', 'Sprout Social', 'Later'],
    },
    {
      category: 'notification',
      description: 'Engagement monitoring and alerts',
      reason: 'Notifies you of comments, mentions, and messages',
      priority: 'important',
      suggestedTools: ['Sprout Social', 'Hootsuite', 'Mention', 'Brand24'],
    },
  ],

  email_campaign: [
    {
      category: 'input',
      description: 'Audience segmentation',
      reason: 'Sends targeted emails to specific audience groups',
      priority: 'critical',
      suggestedTools: ['Mailchimp', 'Klaviyo', 'ActiveCampaign', 'HubSpot'],
    },
    {
      category: 'processing',
      description: 'Email template design',
      reason: 'Creates professional, branded emails',
      priority: 'important',
      suggestedTools: ['Mailchimp', 'Stripo', 'BEE Free', 'Canva'],
    },
    {
      category: 'processing',
      description: 'A/B testing setup',
      reason: 'Optimizes subject lines, content, and send times',
      priority: 'important',
      suggestedTools: ['Mailchimp', 'Klaviyo', 'Optimizely'],
    },
    {
      category: 'processing',
      description: 'Deliverability optimization',
      reason: 'Ensures emails reach inbox, not spam',
      priority: 'critical',
      suggestedTools: ['Mailchimp', 'SendGrid', 'Postmark', 'Brevo'],
    },
    {
      category: 'output',
      description: 'Campaign scheduling and sending',
      reason: 'Sends emails at optimal times',
      priority: 'critical',
      suggestedTools: ['Mailchimp', 'Klaviyo', 'Brevo', 'ConvertKit'],
    },
    {
      category: 'notification',
      description: 'Performance tracking and alerts',
      reason: 'Monitors opens, clicks, and conversions',
      priority: 'important',
      suggestedTools: ['Mailchimp', 'Klaviyo', 'Google Analytics'],
    },
  ],

  newsletter_distribution: [
    {
      category: 'input',
      description: 'Content curation and aggregation',
      reason: 'Gathers relevant content for newsletter',
      priority: 'important',
      suggestedTools: ['Feedly', 'Pocket', 'Curated', 'Refind'],
    },
    {
      category: 'processing',
      description: 'Newsletter template design',
      reason: 'Creates consistent, branded newsletter layout',
      priority: 'important',
      suggestedTools: ['Mailchimp', 'Substack', 'Beehiiv', 'ConvertKit'],
    },
    {
      category: 'processing',
      description: 'Personalization and dynamic content',
      reason: 'Tailors content to subscriber preferences',
      priority: 'optional',
      suggestedTools: ['Mailchimp', 'Klaviyo', 'Customer.io'],
    },
    {
      category: 'output',
      description: 'Subscriber management',
      reason: 'Manages subscriptions, preferences, and list health',
      priority: 'critical',
      suggestedTools: ['Mailchimp', 'Substack', 'Beehiiv', 'ConvertKit'],
    },
  ],

  event_promotion: [
    {
      category: 'input',
      description: 'Event landing page creation',
      reason: 'Provides event details and captures registrations',
      priority: 'critical',
      suggestedTools: ['Eventbrite', 'Splash', 'Unbounce', 'Leadpages'],
    },
    {
      category: 'processing',
      description: 'Promotional asset design',
      reason: 'Creates visuals for event marketing',
      priority: 'important',
      suggestedTools: ['Canva', 'Adobe Express', 'Figma'],
    },
    {
      category: 'processing',
      description: 'Multi-channel campaign coordination',
      reason: 'Promotes across email, social, and ads',
      priority: 'critical',
      suggestedTools: ['HubSpot', 'Marketo', 'ActiveCampaign'],
    },
    {
      category: 'output',
      description: 'Registration tracking and management',
      reason: 'Tracks sign-ups and manages attendee data',
      priority: 'critical',
      suggestedTools: ['Eventbrite', 'Splash', 'Zoom Events', 'Hopin'],
    },
    {
      category: 'notification',
      description: 'Automated reminder sequences',
      reason: 'Sends pre-event reminders to boost attendance',
      priority: 'important',
      suggestedTools: ['Mailchimp', 'ActiveCampaign', 'Eventbrite'],
    },
  ],

  webinar_setup: [
    {
      category: 'input',
      description: 'Webinar registration page',
      reason: 'Captures registrations and attendee information',
      priority: 'critical',
      suggestedTools: ['Zoom', 'WebinarJam', 'Demio', 'Livestorm'],
    },
    {
      category: 'processing',
      description: 'Email reminder automation',
      reason: 'Sends automated reminders before the webinar',
      priority: 'critical',
      suggestedTools: ['Zoom', 'Mailchimp', 'ActiveCampaign'],
    },
    {
      category: 'processing',
      description: 'Live streaming and hosting',
      reason: 'Provides reliable webinar hosting platform',
      priority: 'critical',
      suggestedTools: ['Zoom', 'WebinarJam', 'Demio', 'Livestorm'],
    },
    {
      category: 'output',
      description: 'Recording and distribution',
      reason: 'Records webinar and shares with registrants',
      priority: 'important',
      suggestedTools: ['Zoom', 'Vimeo', 'Wistia', 'YouTube'],
    },
    {
      category: 'notification',
      description: 'Post-webinar follow-up',
      reason: 'Sends recording and follow-up to attendees',
      priority: 'important',
      suggestedTools: ['Mailchimp', 'ActiveCampaign', 'HubSpot'],
    },
  ],

  press_release: [
    {
      category: 'input',
      description: 'PR writing assistance',
      reason: 'Helps craft professional press releases',
      priority: 'important',
      suggestedTools: ['Jasper', 'Copy.ai', 'Claude AI'],
    },
    {
      category: 'processing',
      description: 'Media list building',
      reason: 'Identifies relevant journalists and publications',
      priority: 'critical',
      suggestedTools: ['Muck Rack', 'Cision', 'Prowly', 'HARO'],
    },
    {
      category: 'output',
      description: 'Distribution network',
      reason: 'Distributes press release to media outlets',
      priority: 'critical',
      suggestedTools: ['PR Newswire', 'PRWeb', 'GlobeNewswire', 'Business Wire'],
    },
    {
      category: 'notification',
      description: 'Media monitoring and coverage tracking',
      reason: 'Tracks where your press release is picked up',
      priority: 'important',
      suggestedTools: ['Muck Rack', 'Cision', 'Mention', 'Google Alerts'],
    },
  ],

  influencer_outreach: [
    {
      category: 'input',
      description: 'Influencer discovery platform',
      reason: 'Finds relevant influencers in your niche',
      priority: 'critical',
      suggestedTools: ['Upfluence', 'AspireIQ', 'Grin', 'Modash'],
    },
    {
      category: 'processing',
      description: 'Audience authenticity verification',
      reason: 'Verifies influencer audience is real and engaged',
      priority: 'critical',
      suggestedTools: ['HypeAuditor', 'Modash', 'Upfluence'],
    },
    {
      category: 'processing',
      description: 'Outreach and relationship management',
      reason: 'Manages communication with influencers',
      priority: 'important',
      suggestedTools: ['Upfluence', 'AspireIQ', 'Notion', 'HubSpot'],
    },
    {
      category: 'output',
      description: 'Campaign tracking and reporting',
      reason: 'Tracks influencer content performance',
      priority: 'important',
      suggestedTools: ['Upfluence', 'Grin', 'Sprout Social'],
    },
  ],

  ad_campaign_launch: [
    {
      category: 'input',
      description: 'Audience targeting setup',
      reason: 'Defines who will see your ads',
      priority: 'critical',
      suggestedTools: ['Google Ads', 'Meta Ads Manager', 'TikTok Ads'],
    },
    {
      category: 'processing',
      description: 'Ad creative design',
      reason: 'Creates compelling ad visuals and videos',
      priority: 'critical',
      suggestedTools: ['Canva', 'Adobe Express', 'Figma', 'CapCut'],
    },
    {
      category: 'processing',
      description: 'Conversion tracking setup',
      reason: 'Tracks actions taken after ad clicks',
      priority: 'critical',
      suggestedTools: ['Google Tag Manager', 'Meta Pixel', 'TikTok Pixel'],
    },
    {
      category: 'output',
      description: 'Campaign management and optimization',
      reason: 'Manages bids, budgets, and targeting',
      priority: 'critical',
      suggestedTools: ['Google Ads', 'Meta Ads Manager', 'AdEspresso'],
    },
    {
      category: 'notification',
      description: 'Performance alerts and reporting',
      reason: 'Notifies of significant performance changes',
      priority: 'important',
      suggestedTools: ['Google Ads', 'DataBox', 'Supermetrics'],
    },
  ],

  landing_page_creation: [
    {
      category: 'input',
      description: 'Landing page builder',
      reason: 'Creates high-converting landing pages quickly',
      priority: 'critical',
      suggestedTools: ['Unbounce', 'Leadpages', 'Instapage', 'Webflow'],
    },
    {
      category: 'processing',
      description: 'Copywriting assistance',
      reason: 'Writes persuasive landing page copy',
      priority: 'important',
      suggestedTools: ['Jasper', 'Copy.ai', 'Claude AI'],
    },
    {
      category: 'processing',
      description: 'Form and CTA builder',
      reason: 'Creates lead capture forms',
      priority: 'critical',
      suggestedTools: ['Typeform', 'JotForm', 'HubSpot Forms'],
    },
    {
      category: 'output',
      description: 'CRM integration',
      reason: 'Sends leads to your CRM automatically',
      priority: 'important',
      suggestedTools: ['HubSpot', 'Salesforce', 'Pipedrive', 'Zoho CRM'],
    },
  ],

  lead_magnet_delivery: [
    {
      category: 'input',
      description: 'Opt-in form builder',
      reason: 'Captures email addresses for lead magnet',
      priority: 'critical',
      suggestedTools: ['ConvertKit', 'Mailchimp', 'OptinMonster'],
    },
    {
      category: 'processing',
      description: 'Automatic delivery automation',
      reason: 'Sends lead magnet immediately after opt-in',
      priority: 'critical',
      suggestedTools: ['ConvertKit', 'Mailchimp', 'ActiveCampaign'],
    },
    {
      category: 'output',
      description: 'Nurture sequence automation',
      reason: 'Follows up with educational content',
      priority: 'important',
      suggestedTools: ['ConvertKit', 'ActiveCampaign', 'Drip'],
    },
  ],

  survey_distribution: [
    {
      category: 'input',
      description: 'Survey builder with logic',
      reason: 'Creates professional surveys with branching',
      priority: 'critical',
      suggestedTools: ['Typeform', 'SurveyMonkey', 'Google Forms', 'Tally'],
    },
    {
      category: 'processing',
      description: 'Response analysis',
      reason: 'Analyzes survey responses automatically',
      priority: 'important',
      suggestedTools: ['Typeform', 'SurveyMonkey', 'Qualtrics'],
    },
    {
      category: 'output',
      description: 'Reporting and visualization',
      reason: 'Creates visual reports from survey data',
      priority: 'important',
      suggestedTools: ['Typeform', 'Google Data Studio', 'Tableau'],
    },
  ],

  analytics_reporting: [
    {
      category: 'input',
      description: 'Multi-platform data connectors',
      reason: 'Pulls data from all marketing platforms',
      priority: 'critical',
      suggestedTools: ['Supermetrics', 'Funnel', 'Fivetran', 'Stitch'],
    },
    {
      category: 'processing',
      description: 'Dashboard builder',
      reason: 'Creates visual marketing dashboards',
      priority: 'critical',
      suggestedTools: ['Looker Studio', 'Tableau', 'Power BI', 'Databox'],
    },
    {
      category: 'output',
      description: 'Automated report generation',
      reason: 'Creates and sends reports automatically',
      priority: 'important',
      suggestedTools: ['Supermetrics', 'AgencyAnalytics', 'DashThis'],
    },
  ],

  brand_asset_management: [
    {
      category: 'input',
      description: 'Digital asset management (DAM)',
      reason: 'Stores and organizes brand assets',
      priority: 'critical',
      suggestedTools: ['Brandfolder', 'Bynder', 'Frontify', 'Air'],
    },
    {
      category: 'processing',
      description: 'Permission management',
      reason: 'Controls who can access and edit assets',
      priority: 'important',
      suggestedTools: ['Brandfolder', 'Bynder', 'Frontify'],
    },
    {
      category: 'output',
      description: 'Asset distribution',
      reason: 'Shares assets with team and partners',
      priority: 'important',
      suggestedTools: ['Brandfolder', 'Dropbox', 'Google Drive'],
    },
  ],
};

// ============================================================================
// MARKETING TOOL RECOMMENDATIONS
// ============================================================================

export const MARKETING_TOOL_RECOMMENDATIONS: Record<string, ToolRecommendation[]> = {
  // Social Media Management
  social_media: [
    {
      toolSlug: 'BUFFER',
      toolName: 'Buffer',
      score: 95,
      reasons: [
        'User-friendly interface',
        'Excellent scheduling features',
        'Good analytics',
        'Affordable for SMEs',
      ],
      regionalFit: 90,
      alternatives: [
        {
          toolSlug: 'HOOTSUITE',
          toolName: 'Hootsuite',
          reason: 'More comprehensive social listening',
          tradeoff: 'Higher cost, steeper learning curve',
        },
      ],
    },
    {
      toolSlug: 'HOOTSUITE',
      toolName: 'Hootsuite',
      score: 92,
      reasons: [
        'Industry standard for enterprise',
        'Strong social listening',
        'Comprehensive analytics',
        'Team collaboration features',
      ],
      regionalFit: 85,
      alternatives: [],
    },
    {
      toolSlug: 'SPROUT_SOCIAL',
      toolName: 'Sprout Social',
      score: 94,
      reasons: [
        'Best-in-class analytics',
        'Excellent customer engagement tools',
        'Smart inbox for all channels',
        'CRM integration',
      ],
      regionalFit: 85,
      alternatives: [],
    },
    {
      toolSlug: 'LATER',
      toolName: 'Later',
      score: 90,
      reasons: [
        'Visual content planning',
        'Best for Instagram/TikTok',
        'Linkin.bio feature',
        'User-generated content tools',
      ],
      regionalFit: 88,
      alternatives: [],
    },
  ],

  // Email Marketing
  email_marketing: [
    {
      toolSlug: 'MAILCHIMP',
      toolName: 'Mailchimp',
      score: 94,
      reasons: [
        'Industry standard for SMEs',
        'Excellent templates',
        'Good automation features',
        'Free tier available',
      ],
      regionalFit: 90,
      alternatives: [
        {
          toolSlug: 'KLAVIYO',
          toolName: 'Klaviyo',
          reason: 'Better for e-commerce',
          tradeoff: 'Higher cost per contact',
        },
      ],
    },
    {
      toolSlug: 'KLAVIYO',
      toolName: 'Klaviyo',
      score: 96,
      reasons: [
        'Best for e-commerce',
        'Advanced segmentation',
        'Powerful automation',
        'Excellent Shopify integration',
      ],
      regionalFit: 85,
      alternatives: [],
    },
    {
      toolSlug: 'BREVO',
      toolName: 'Brevo (Sendinblue)',
      score: 88,
      reasons: [
        'Affordable for growing lists',
        'SMS marketing included',
        'Good automation',
        'GDPR compliant',
      ],
      regionalFit: 85,
      alternatives: [],
    },
    {
      toolSlug: 'CONVERTKIT',
      toolName: 'ConvertKit',
      score: 90,
      reasons: [
        'Best for creators',
        'Simple automation',
        'Excellent landing pages',
        'Great for newsletters',
      ],
      regionalFit: 82,
      alternatives: [],
    },
    {
      toolSlug: 'ACTIVECAMPAIGN',
      toolName: 'ActiveCampaign',
      score: 93,
      reasons: [
        'Powerful automation',
        'CRM included',
        'Great for complex sequences',
        'Machine learning features',
      ],
      regionalFit: 85,
      alternatives: [],
    },
  ],

  // Design Tools
  design: [
    {
      toolSlug: 'CANVA',
      toolName: 'Canva',
      score: 96,
      reasons: [
        'Easy to use for non-designers',
        'Extensive template library',
        'Brand kit feature',
        'Team collaboration',
      ],
      regionalFit: 95,
      alternatives: [],
    },
    {
      toolSlug: 'FIGMA',
      toolName: 'Figma',
      score: 94,
      reasons: [
        'Professional design tool',
        'Real-time collaboration',
        'Component libraries',
        'Developer handoff',
      ],
      regionalFit: 90,
      alternatives: [],
    },
    {
      toolSlug: 'ADOBE_CREATIVE_CLOUD',
      toolName: 'Adobe Creative Cloud',
      score: 98,
      reasons: [
        'Industry standard',
        'Most powerful tools',
        'Complete suite',
        'Professional results',
      ],
      regionalFit: 90,
      alternatives: [
        {
          toolSlug: 'CANVA',
          toolName: 'Canva',
          reason: 'Much easier learning curve',
          tradeoff: 'Less advanced features',
        },
      ],
    },
    {
      toolSlug: 'CAPCUT',
      toolName: 'CapCut',
      score: 90,
      reasons: [
        'Free video editing',
        'TikTok optimized',
        'Easy to use',
        'Good effects library',
      ],
      regionalFit: 92,
      alternatives: [],
    },
  ],

  // Analytics Tools
  analytics: [
    {
      toolSlug: 'GOOGLE_ANALYTICS',
      toolName: 'Google Analytics 4',
      score: 98,
      reasons: [
        'Industry standard',
        'Free and powerful',
        'Event-based tracking',
        'AI insights',
      ],
      regionalFit: 95,
      alternatives: [],
    },
    {
      toolSlug: 'MIXPANEL',
      toolName: 'Mixpanel',
      score: 92,
      reasons: [
        'Best for product analytics',
        'User journey tracking',
        'Funnel analysis',
        'A/B testing',
      ],
      regionalFit: 85,
      alternatives: [],
    },
    {
      toolSlug: 'HOTJAR',
      toolName: 'Hotjar',
      score: 90,
      reasons: [
        'Heatmaps and recordings',
        'User feedback tools',
        'Form analytics',
        'Easy setup',
      ],
      regionalFit: 88,
      alternatives: [],
    },
    {
      toolSlug: 'LOOKER_STUDIO',
      toolName: 'Looker Studio (Data Studio)',
      score: 94,
      reasons: [
        'Free dashboard builder',
        'Google ecosystem integration',
        'Real-time data',
        'Shareable reports',
      ],
      regionalFit: 92,
      alternatives: [],
    },
  ],

  // Ad Platforms
  advertising: [
    {
      toolSlug: 'GOOGLE_ADS',
      toolName: 'Google Ads',
      score: 98,
      reasons: [
        'Largest reach',
        'Search and display',
        'YouTube advertising',
        'Performance Max campaigns',
      ],
      regionalFit: 95,
      alternatives: [],
    },
    {
      toolSlug: 'META_ADS',
      toolName: 'Meta Business Suite',
      score: 96,
      reasons: [
        'Facebook and Instagram ads',
        'Advanced targeting',
        'Detailed analytics',
        'WhatsApp integration',
      ],
      regionalFit: 90,
      alternatives: [],
    },
    {
      toolSlug: 'TIKTOK_ADS',
      toolName: 'TikTok Ads',
      score: 92,
      reasons: [
        'Fastest growing platform',
        'Younger demographic',
        'Creative ad formats',
        'Strong in Middle East',
      ],
      regionalFit: 95,
      alternatives: [],
    },
    {
      toolSlug: 'SNAPCHAT_ADS',
      toolName: 'Snapchat Ads',
      score: 88,
      reasons: [
        'Very popular in GCC',
        'AR advertising',
        'Young audience',
        'Story ads',
      ],
      regionalFit: 98,
      alternatives: [],
    },
    {
      toolSlug: 'LINKEDIN_ADS',
      toolName: 'LinkedIn Ads',
      score: 90,
      reasons: [
        'B2B targeting',
        'Professional audience',
        'Lead gen forms',
        'Account-based marketing',
      ],
      regionalFit: 85,
      alternatives: [],
    },
  ],

  // SEO Tools
  seo: [
    {
      toolSlug: 'AHREFS',
      toolName: 'Ahrefs',
      score: 98,
      reasons: [
        'Best backlink analysis',
        'Comprehensive keyword research',
        'Site audit',
        'Content explorer',
      ],
      regionalFit: 90,
      alternatives: [],
    },
    {
      toolSlug: 'SEMRUSH',
      toolName: 'SEMrush',
      score: 97,
      reasons: [
        'All-in-one marketing toolkit',
        'Competitor analysis',
        'Content marketing tools',
        'PPC research',
      ],
      regionalFit: 90,
      alternatives: [],
    },
    {
      toolSlug: 'MOZ',
      toolName: 'Moz',
      score: 88,
      reasons: [
        'User-friendly interface',
        'Local SEO features',
        'MozBar extension',
        'Good for beginners',
      ],
      regionalFit: 85,
      alternatives: [],
    },
    {
      toolSlug: 'SURFER_SEO',
      toolName: 'Surfer SEO',
      score: 92,
      reasons: [
        'On-page optimization',
        'Content editor',
        'SERP analyzer',
        'AI content outline',
      ],
      regionalFit: 85,
      alternatives: [],
    },
  ],

  // Influencer Platforms
  influencer: [
    {
      toolSlug: 'UPFLUENCE',
      toolName: 'Upfluence',
      score: 94,
      reasons: [
        'Large influencer database',
        'E-commerce integration',
        'Campaign management',
        'Performance tracking',
      ],
      regionalFit: 85,
      alternatives: [],
    },
    {
      toolSlug: 'ASPIREIQ',
      toolName: 'AspireIQ',
      score: 90,
      reasons: [
        'Community management',
        'Content rights management',
        'Affiliate tracking',
        'Brand ambassador programs',
      ],
      regionalFit: 80,
      alternatives: [],
    },
    {
      toolSlug: 'HYPEAUDITOR',
      toolName: 'HypeAuditor',
      score: 92,
      reasons: [
        'Best for authenticity check',
        'Fake follower detection',
        'Audience analytics',
        'Influencer discovery',
      ],
      regionalFit: 88,
      alternatives: [],
    },
    {
      toolSlug: 'MODASH',
      toolName: 'Modash',
      score: 88,
      reasons: [
        'Good for finding creators',
        'Email finder',
        'Audience insights',
        'Campaign tracking',
      ],
      regionalFit: 85,
      alternatives: [],
    },
  ],

  // Landing Page Builders
  landing_page: [
    {
      toolSlug: 'UNBOUNCE',
      toolName: 'Unbounce',
      score: 95,
      reasons: [
        'AI-powered optimization',
        'Smart traffic feature',
        'Excellent templates',
        'A/B testing',
      ],
      regionalFit: 85,
      alternatives: [],
    },
    {
      toolSlug: 'LEADPAGES',
      toolName: 'Leadpages',
      score: 90,
      reasons: [
        'Easy to use',
        'Good templates',
        'Pop-ups and alert bars',
        'Affordable',
      ],
      regionalFit: 85,
      alternatives: [],
    },
    {
      toolSlug: 'INSTAPAGE',
      toolName: 'Instapage',
      score: 93,
      reasons: [
        'Personalization features',
        'Team collaboration',
        'Analytics',
        'Fast loading',
      ],
      regionalFit: 82,
      alternatives: [],
    },
  ],

  // CRM Tools
  crm: [
    {
      toolSlug: 'HUBSPOT',
      toolName: 'HubSpot',
      score: 96,
      reasons: [
        'All-in-one platform',
        'Free CRM tier',
        'Marketing automation',
        'Sales pipeline',
      ],
      regionalFit: 90,
      alternatives: [],
    },
    {
      toolSlug: 'ZOHO_CRM',
      toolName: 'Zoho CRM',
      score: 88,
      reasons: [
        'Affordable',
        'Arabic interface available',
        'Good customization',
        'Part of Zoho ecosystem',
      ],
      regionalFit: 95,
      alternatives: [],
    },
    {
      toolSlug: 'PIPEDRIVE',
      toolName: 'Pipedrive',
      score: 90,
      reasons: [
        'Sales-focused',
        'Visual pipeline',
        'Easy to use',
        'Good mobile app',
      ],
      regionalFit: 85,
      alternatives: [],
    },
  ],
};

// ============================================================================
// KUWAIT / REGIONAL CONTEXT
// ============================================================================

export const MARKETING_REGIONAL_CONTEXT: Record<string, MarketingRegionalContext> = {
  kuwait: {
    region: 'Kuwait',
    popularPlatforms: ['Instagram', 'TikTok', 'Snapchat', 'Twitter/X', 'WhatsApp'],
    bestPostingTimes: {
      instagram: '7-9 PM Sun-Thu',
      tiktok: '8-10 PM daily',
      twitter: '12-2 PM, 7-9 PM Sun-Thu',
      snapchat: '7-11 PM daily',
      linkedin: '9-11 AM Sun-Thu',
    },
    languagePreference: 'Arabic primary, English secondary',
    contentConsiderations: 'Ramadan calendar, Islamic holidays, National days',
    influencerPlatform: 'Instagram primary, TikTok growing',
    hashtagStrategy: 'Mix of Arabic and English hashtags, local hashtags (#Kuwait, #KWT)',
    culturalEvents: [
      'Ramadan (flexible timing)',
      'Eid Al-Fitr',
      'Eid Al-Adha',
      'Kuwait National Day (Feb 25)',
      'Kuwait Liberation Day (Feb 26)',
      'Summer months (high engagement, people indoors)',
    ],
    adPlatformAvailability: ['Google Ads', 'Meta Ads', 'TikTok Ads', 'Snapchat Ads', 'Twitter/X Ads'],
  },
  uae: {
    region: 'United Arab Emirates',
    popularPlatforms: ['Instagram', 'TikTok', 'LinkedIn', 'Twitter/X', 'YouTube'],
    bestPostingTimes: {
      instagram: '7-9 PM Sun-Thu',
      tiktok: '8-10 PM daily',
      twitter: '12-2 PM, 7-9 PM Sun-Thu',
      linkedin: '9-11 AM Sun-Thu',
      youtube: '7-10 PM daily',
    },
    languagePreference: 'English primary (diverse expat population), Arabic secondary',
    contentConsiderations: 'Ramadan, UAE National Day (Dec 2), Dubai Shopping Festival',
    influencerPlatform: 'Instagram and TikTok equally popular',
    hashtagStrategy: 'English hashtags more common, #Dubai #UAE #AbuDhabi',
    culturalEvents: [
      'Ramadan',
      'Eid Al-Fitr',
      'Eid Al-Adha',
      'UAE National Day (Dec 2)',
      'Dubai Shopping Festival (Jan-Feb)',
      'Expo events',
    ],
    adPlatformAvailability: ['Google Ads', 'Meta Ads', 'TikTok Ads', 'Snapchat Ads', 'LinkedIn Ads'],
  },
  saudi: {
    region: 'Saudi Arabia',
    popularPlatforms: ['TikTok', 'Instagram', 'Snapchat', 'Twitter/X', 'YouTube'],
    bestPostingTimes: {
      instagram: '7-10 PM Sun-Thu',
      tiktok: '8-11 PM daily',
      twitter: '12-2 PM, 8-10 PM Sun-Thu',
      snapchat: '7-11 PM daily',
      youtube: '8-11 PM daily',
    },
    languagePreference: 'Arabic primary (local dialect common)',
    contentConsiderations: 'Ramadan, Hajj season, Vision 2030 events, Saudi National Day',
    influencerPlatform: 'TikTok leading, Instagram strong',
    hashtagStrategy: 'Arabic hashtags dominant, #السعودية #الرياض',
    culturalEvents: [
      'Ramadan',
      'Eid Al-Fitr',
      'Eid Al-Adha and Hajj season',
      'Saudi National Day (Sep 23)',
      'Riyadh Season (Oct-Mar)',
      'Vision 2030 events',
    ],
    adPlatformAvailability: ['Google Ads', 'Meta Ads', 'TikTok Ads', 'Snapchat Ads', 'Twitter/X Ads'],
  },
};

// ============================================================================
// MARKETING ROI CALCULATIONS
// ============================================================================

/**
 * Calculate Marketing Campaign ROI
 */
export function calculateCampaignROI(
  spend: number,
  revenue: number
): ROICalculation {
  const roi = revenue - spend;
  const roiPercentage = spend > 0 ? ((revenue - spend) / spend) * 100 : 0;

  const notes: string[] = [];

  if (roiPercentage < 0) {
    notes.push('Campaign is running at a loss - consider optimizing targeting or creatives');
  } else if (roiPercentage < 100) {
    notes.push('Positive ROI but below 100% - review cost efficiency');
  } else if (roiPercentage >= 300) {
    notes.push('Excellent ROI - consider scaling budget');
  }

  return {
    spend,
    revenue,
    roi,
    roiPercentage: `${roiPercentage.toFixed(1)}%`,
    formula: `((${revenue} - ${spend}) / ${spend}) x 100`,
    notes,
  };
}

/**
 * Calculate Campaign Performance Metrics
 */
export function calculateCampaignPerformance(
  impressions: number,
  clicks: number,
  conversions: number,
  spend: number,
  revenue: number
): CampaignPerformance {
  return {
    impressions,
    clicks,
    conversions,
    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
    conversionRate: clicks > 0 ? (conversions / clicks) * 100 : 0,
    cpc: clicks > 0 ? spend / clicks : 0,
    cpa: conversions > 0 ? spend / conversions : 0,
    roas: spend > 0 ? revenue / spend : 0,
  };
}

/**
 * Get Optimal Posting Time for a Platform and Region
 */
export function getOptimalPostingTime(
  platform: string,
  region: string = 'kuwait'
): string {
  const regionContext = MARKETING_REGIONAL_CONTEXT[region.toLowerCase()];
  if (!regionContext) {
    return 'Regional data not available';
  }

  const platformLower = platform.toLowerCase();
  return regionContext.bestPostingTimes[platformLower] || 'Optimal time not specified for this platform';
}

/**
 * Calculate Engagement Rate
 */
export function calculateEngagementRate(
  engagements: number,
  followers: number,
  reach?: number
): { rate: number; benchmark: string; assessment: string } {
  // Use reach if available, otherwise use followers
  const base = reach || followers;
  const rate = base > 0 ? (engagements / base) * 100 : 0;

  let benchmark = 'Unknown';
  let assessment = 'Unable to assess';

  // Industry benchmarks vary by platform, using general guidelines
  if (rate < 1) {
    benchmark = 'Below average';
    assessment = 'Consider improving content quality or targeting';
  } else if (rate < 3) {
    benchmark = 'Average';
    assessment = 'Room for improvement in content strategy';
  } else if (rate < 6) {
    benchmark = 'Good';
    assessment = 'Performing well, maintain strategy';
  } else {
    benchmark = 'Excellent';
    assessment = 'Outstanding engagement, consider case study';
  }

  return { rate, benchmark, assessment };
}

// ============================================================================
// MARKETING DOMAIN INTELLIGENCE CLASS
// ============================================================================

export class MarketingDomainIntelligence {
  private region: string;
  private regionalContext: MarketingRegionalContext | null;

  constructor(region: string = 'kuwait') {
    this.region = region.toLowerCase();
    this.regionalContext = MARKETING_REGIONAL_CONTEXT[this.region] || null;
  }

  /**
   * Detect marketing workflow pattern from user request
   */
  detectMarketingPattern(request: string): string | null {
    const normalizedRequest = request.toLowerCase();
    let bestMatch: string | null = null;
    let highestScore = 0;

    for (const [pattern, keywords] of Object.entries(MARKETING_KEYWORDS)) {
      const score = keywords.filter(kw =>
        normalizedRequest.includes(kw.toLowerCase())
      ).length;

      if (score > highestScore) {
        highestScore = score;
        bestMatch = pattern;
      }
    }

    // Require at least 1 keyword match for marketing patterns
    return highestScore >= 1 ? bestMatch : null;
  }

  /**
   * Get implicit requirements for a marketing pattern
   */
  getImplicitRequirements(pattern: string): ImplicitRequirement[] {
    const requirements = MARKETING_IMPLICIT_REQUIREMENTS[pattern] || [];

    // Add regional considerations
    if (this.regionalContext && pattern) {
      const patternDef = MARKETING_WORKFLOW_PATTERNS[pattern];
      if (patternDef) {
        // Add platform-specific requirements for the region
        if (pattern === 'social_media_posting' && this.regionalContext.popularPlatforms) {
          requirements.push({
            category: 'processing',
            description: `Optimize for ${this.regionalContext.region} popular platforms: ${this.regionalContext.popularPlatforms.join(', ')}`,
            reason: `These platforms have the highest engagement in ${this.regionalContext.region}`,
            priority: 'important',
            suggestedTools: this.regionalContext.popularPlatforms,
          });
        }

        // Add language consideration
        if (this.regionalContext.languagePreference) {
          requirements.push({
            category: 'processing',
            description: `Content should be in ${this.regionalContext.languagePreference}`,
            reason: `Language preference for ${this.regionalContext.region} market`,
            priority: 'important',
            suggestedTools: ['Google Translate', 'DeepL', 'Native translators'],
          });
        }
      }
    }

    return requirements;
  }

  /**
   * Get tool recommendations for a marketing pattern
   */
  getToolRecommendations(pattern: string, region?: string): ToolRecommendation[] {
    const effectiveRegion = region || this.region;
    const recommendations: ToolRecommendation[] = [];

    // Map pattern to tool category
    const categoryMapping: Record<string, string[]> = {
      content_calendar: ['social_media', 'design'],
      blog_publishing: ['seo', 'design'],
      social_media_posting: ['social_media', 'design'],
      email_campaign: ['email_marketing'],
      newsletter_distribution: ['email_marketing'],
      event_promotion: ['email_marketing', 'advertising', 'design'],
      webinar_setup: ['email_marketing'],
      press_release: ['crm'],
      influencer_outreach: ['influencer', 'social_media'],
      ad_campaign_launch: ['advertising', 'analytics'],
      landing_page_creation: ['landing_page', 'analytics'],
      lead_magnet_delivery: ['email_marketing', 'landing_page'],
      survey_distribution: ['analytics'],
      analytics_reporting: ['analytics'],
      brand_asset_management: ['design'],
    };

    const categories = categoryMapping[pattern] || ['social_media'];

    // Get tools from each category
    categories.forEach(category => {
      const categoryTools = MARKETING_TOOL_RECOMMENDATIONS[category] || [];
      recommendations.push(...categoryTools);
    });

    // Sort by score and regional fit
    return recommendations
      .sort((a, b) => {
        const scoreA = a.score * (effectiveRegion === 'kuwait' ? a.regionalFit / 100 : 1);
        const scoreB = b.score * (effectiveRegion === 'kuwait' ? b.regionalFit / 100 : 1);
        return scoreB - scoreA;
      })
      .slice(0, 10); // Return top 10
  }

  /**
   * Get clarifying questions for a marketing pattern
   */
  getClarifyingQuestions(pattern: string): ClarifyingQuestion[] {
    const questions: ClarifyingQuestion[] = [];
    const patternDef = MARKETING_WORKFLOW_PATTERNS[pattern];
    let questionId = 1;

    if (!patternDef) return questions;

    // Pattern-specific questions from the pattern definition
    patternDef.questions.forEach((questionText, index) => {
      questions.push({
        id: `marketing_q${questionId++}`,
        question: questionText,
        category: this.categorizeQuestion(questionText),
        options: this.generateOptionsForQuestion(questionText, pattern),
        required: index < 3, // First 3 questions are required
        relevanceScore: 100 - (index * 10),
      });
    });

    // Add regional-specific questions
    if (this.region === 'kuwait') {
      if (pattern === 'social_media_posting') {
        questions.push({
          id: `marketing_q${questionId++}`,
          question: 'Which platforms are most important for your Kuwait audience?',
          category: 'platform',
          options: [
            { value: 'instagram', label: 'Instagram', description: 'Most popular platform in Kuwait', implications: ['Focus on visual content'] },
            { value: 'tiktok', label: 'TikTok', description: 'Fastest growing in Kuwait', implications: ['Short-form video content'] },
            { value: 'snapchat', label: 'Snapchat', description: 'Very popular in GCC', implications: ['Stories and AR content'] },
            { value: 'twitter', label: 'Twitter/X', description: 'News and discussions', implications: ['Real-time engagement'] },
            { value: 'all', label: 'All platforms', description: 'Multi-platform strategy' },
          ],
          required: true,
          relevanceScore: 95,
        });

        questions.push({
          id: `marketing_q${questionId++}`,
          question: 'Should content be in Arabic, English, or both?',
          category: 'language',
          options: [
            { value: 'arabic', label: 'Arabic only', description: 'Local audience focus', implications: ['Higher local engagement'] },
            { value: 'english', label: 'English only', description: 'Expat and international audience' },
            { value: 'both', label: 'Bilingual', description: 'Maximum reach in Kuwait', implications: ['Double content creation effort'] },
          ],
          required: true,
          relevanceScore: 95,
        });
      }

      if (pattern === 'ad_campaign_launch') {
        questions.push({
          id: `marketing_q${questionId++}`,
          question: 'Which ad platforms work best for your Kuwait audience?',
          category: 'platform',
          options: [
            { value: 'snapchat', label: 'Snapchat Ads', description: 'Highest reach in Kuwait youth', implications: ['Story and AR ads'] },
            { value: 'instagram', label: 'Instagram/Meta Ads', description: 'Strong visual advertising', implications: ['Image and video ads'] },
            { value: 'tiktok', label: 'TikTok Ads', description: 'Growing rapidly', implications: ['Video-first content'] },
            { value: 'google', label: 'Google Ads', description: 'Search and display', implications: ['Intent-based targeting'] },
          ],
          required: true,
          relevanceScore: 95,
        });
      }

      if (pattern === 'influencer_outreach') {
        questions.push({
          id: `marketing_q${questionId++}`,
          question: 'Do you prefer local Kuwait influencers or GCC-wide reach?',
          category: 'audience',
          options: [
            { value: 'kuwait_only', label: 'Kuwait Only', description: 'Local influencers with Kuwait audience', implications: ['Higher relevance, smaller reach'] },
            { value: 'gcc', label: 'GCC-Wide', description: 'Influencers with Gulf audience', implications: ['Larger reach, may need localization'] },
            { value: 'both', label: 'Mix of Both', description: 'Combined strategy' },
          ],
          required: true,
          relevanceScore: 90,
        });
      }
    }

    return questions;
  }

  /**
   * Get the workflow chain for a marketing pattern
   */
  getWorkflowChain(pattern: string): WorkflowChainStep[] {
    const patternDef = MARKETING_WORKFLOW_PATTERNS[pattern];
    if (!patternDef) return [];

    const chain: WorkflowChainStep[] = [];

    patternDef.steps.forEach((stepName, index) => {
      const layer = patternDef.layers[Math.min(index, patternDef.layers.length - 1)];
      const implicitReq = MARKETING_IMPLICIT_REQUIREMENTS[pattern]?.[index];

      chain.push({
        step: index + 1,
        layer,
        description: this.humanizeStepName(stepName),
        requiredCapability: implicitReq?.description || stepName,
        suggestedTools: implicitReq?.suggestedTools || [],
        isResolved: false,
      });
    });

    return chain;
  }

  /**
   * Get regional context for marketing operations
   */
  getRegionalContext(): MarketingRegionalContext | null {
    return this.regionalContext;
  }

  /**
   * Get optimal posting time for a platform
   */
  getOptimalPostingTime(platform: string): string {
    return getOptimalPostingTime(platform, this.region);
  }

  /**
   * Calculate campaign ROI
   */
  calculateCampaignROI(spend: number, revenue: number): ROICalculation {
    return calculateCampaignROI(spend, revenue);
  }

  /**
   * Get popular platforms for the current region
   */
  getPopularPlatforms(): string[] {
    return this.regionalContext?.popularPlatforms || [];
  }

  /**
   * Get cultural events to consider for content planning
   */
  getCulturalEvents(): string[] {
    return this.regionalContext?.culturalEvents || [];
  }

  /**
   * Get hashtag strategy for the region
   */
  getHashtagStrategy(): string {
    return this.regionalContext?.hashtagStrategy || 'No regional hashtag strategy available';
  }

  /**
   * Get available ad platforms for the region
   */
  getAvailableAdPlatforms(): string[] {
    return this.regionalContext?.adPlatformAvailability || [];
  }

  /**
   * Validate marketing budget for Kuwait (KWD)
   */
  validateKWDBudget(amount: number, campaignType: 'social' | 'ads' | 'influencer' | 'event'): {
    valid: boolean;
    warning?: string;
    recommendation?: string;
  } {
    if (this.region !== 'kuwait') {
      return { valid: true };
    }

    const thresholds = {
      social: { min: 50, max: 10000, recommended: { min: 100, max: 1000 } },
      ads: { min: 100, max: 50000, recommended: { min: 300, max: 5000 } },
      influencer: { min: 50, max: 25000, recommended: { min: 200, max: 3000 } },
      event: { min: 500, max: 100000, recommended: { min: 1000, max: 10000 } },
    };

    const threshold = thresholds[campaignType];

    if (amount < threshold.min || amount > threshold.max) {
      return {
        valid: false,
        warning: `Budget ${amount} KWD seems unusual for ${campaignType} campaign. Expected range: ${threshold.min} - ${threshold.max} KWD`,
      };
    }

    if (amount < threshold.recommended.min) {
      return {
        valid: true,
        recommendation: `Budget ${amount} KWD is below recommended minimum of ${threshold.recommended.min} KWD for effective ${campaignType} campaigns in Kuwait`,
      };
    }

    if (amount > threshold.recommended.max) {
      return {
        valid: true,
        warning: `Budget ${amount} KWD is above typical ${campaignType} budget. Ensure proper ROI tracking is in place.`,
      };
    }

    return { valid: true };
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private categorizeQuestion(questionText: string): ClarifyingQuestion['category'] {
    const text = questionText.toLowerCase();

    if (text.includes('how often') || text.includes('frequency') || text.includes('schedule')) {
      return 'frequency';
    }
    if (text.includes('who') || text.includes('team') || text.includes('audience')) {
      return 'audience';
    }
    if (text.includes('format') || text.includes('template') || text.includes('design')) {
      return 'format';
    }
    if (text.includes('platform') || text.includes('tool') || text.includes('use')) {
      return 'platform';
    }
    if (text.includes('region') || text.includes('country') || text.includes('language')) {
      return 'region';
    }

    return 'integration';
  }

  private generateOptionsForQuestion(questionText: string, _pattern: string): QuestionOption[] {
    const text = questionText.toLowerCase();

    // Which platforms do you publish to / use
    if (text.includes('platform') || text.includes('social') || text.includes('which')) {
      return [
        { value: 'instagram', label: 'Instagram', description: 'Photo and video platform' },
        { value: 'tiktok', label: 'TikTok', description: 'Short-form video' },
        { value: 'twitter', label: 'Twitter/X', description: 'Text and discussions' },
        { value: 'linkedin', label: 'LinkedIn', description: 'Professional network' },
        { value: 'facebook', label: 'Facebook', description: 'General social network' },
        { value: 'multiple', label: 'Multiple Platforms', description: 'Cross-platform strategy' },
      ];
    }

    // CMS / blog platform
    if (text.includes('cms') || text.includes('blog')) {
      return [
        { value: 'wordpress', label: 'WordPress', description: 'Most popular CMS' },
        { value: 'webflow', label: 'Webflow', description: 'Visual website builder' },
        { value: 'ghost', label: 'Ghost', description: 'Publisher-focused CMS' },
        { value: 'medium', label: 'Medium', description: 'Publishing platform' },
        { value: 'other', label: 'Other', description: 'Different platform' },
      ];
    }

    // Email platform
    if (text.includes('email platform') || text.includes('email tool')) {
      return [
        { value: 'mailchimp', label: 'Mailchimp', description: 'Popular email platform' },
        { value: 'klaviyo', label: 'Klaviyo', description: 'E-commerce focused' },
        { value: 'brevo', label: 'Brevo', description: 'Affordable option' },
        { value: 'convertkit', label: 'ConvertKit', description: 'Creator focused' },
        { value: 'other', label: 'Other', description: 'Different platform' },
      ];
    }

    // Frequency questions
    if (text.includes('how often') || text.includes('frequency')) {
      return [
        { value: 'daily', label: 'Daily', description: 'Every day' },
        { value: 'weekly', label: 'Weekly', description: 'Once per week' },
        { value: 'bi_weekly', label: 'Bi-weekly', description: 'Every two weeks' },
        { value: 'monthly', label: 'Monthly', description: 'Once per month' },
      ];
    }

    // Yes/No questions
    if (text.includes('do you need') || text.includes('should')) {
      return [
        { value: 'yes', label: 'Yes', description: 'Enable this feature' },
        { value: 'no', label: 'No', description: 'Skip this feature' },
        { value: 'maybe', label: 'Not Sure', description: 'Need more information' },
      ];
    }

    // Team/access questions
    if (text.includes('team') || text.includes('access') || text.includes('who')) {
      return [
        { value: 'individual', label: 'Just me', description: 'Single user' },
        { value: 'small_team', label: 'Small team (2-5)', description: '2-5 people' },
        { value: 'large_team', label: 'Large team (6+)', description: '6+ people' },
        { value: 'agency', label: 'Agency/External', description: 'External partners' },
      ];
    }

    // Default options
    return [
      { value: 'yes', label: 'Yes', description: 'Enable this feature' },
      { value: 'no', label: 'No', description: 'Skip this feature' },
    ];
  }

  private humanizeStepName(stepName: string): string {
    const mapping: Record<string, string> = {
      // Content Calendar
      define_content_strategy: 'Define content strategy and themes',
      create_editorial_calendar: 'Create editorial calendar',
      assign_content_creators: 'Assign content to creators',
      draft_content: 'Draft content pieces',
      review_and_approve: 'Review and approve content',
      schedule_publishing: 'Schedule for publishing',
      cross_post_platforms: 'Cross-post to platforms',
      track_performance: 'Track content performance',

      // Blog Publishing
      research_topics: 'Research topics and keywords',
      create_outline: 'Create content outline',
      write_draft: 'Write first draft',
      add_media: 'Add images and media',
      optimize_seo: 'Optimize for SEO',
      review_edit: 'Review and edit',
      publish_article: 'Publish article',
      promote_social: 'Promote on social media',
      track_metrics: 'Track performance metrics',

      // Social Media
      create_content: 'Create social content',
      format_per_platform: 'Format for each platform',
      add_hashtags: 'Add hashtags and tags',
      schedule_optimal_time: 'Schedule at optimal time',
      post_content: 'Publish content',
      monitor_engagement: 'Monitor engagement',
      respond_to_comments: 'Respond to comments and DMs',
      analyze_performance: 'Analyze performance',

      // Email Campaign
      define_campaign_goal: 'Define campaign goal',
      segment_audience: 'Segment target audience',
      design_email_template: 'Design email template',
      write_copy: 'Write email copy',
      set_up_ab_test: 'Set up A/B tests',
      schedule_send: 'Schedule send time',
      monitor_delivery: 'Monitor delivery',
      track_opens_clicks: 'Track opens and clicks',
      analyze_conversions: 'Analyze conversions',

      // Newsletter
      curate_content: 'Curate newsletter content',
      design_layout: 'Design newsletter layout',
      personalize_content: 'Add personalization',
      preview_test: 'Preview and test',
      deliver_newsletter: 'Send newsletter',
      track_engagement: 'Track subscriber engagement',
      manage_subscribers: 'Manage subscriber list',

      // Event Promotion
      create_event_page: 'Create event landing page',
      design_promotional_assets: 'Design promotional assets',
      launch_announcement: 'Launch announcement campaign',
      run_ad_campaigns: 'Run paid ad campaigns',
      send_email_invites: 'Send email invitations',
      post_social_reminders: 'Post social media reminders',
      track_registrations: 'Track registrations',
      send_reminders: 'Send event reminders',
      post_event_follow_up: 'Post-event follow-up',

      // Webinar
      choose_webinar_platform: 'Choose webinar platform',
      create_registration_page: 'Create registration page',
      set_up_email_sequences: 'Set up reminder emails',
      promote_webinar: 'Promote webinar',
      host_webinar: 'Host live webinar',
      record_session: 'Record session',
      distribute_recording: 'Distribute recording',
      follow_up_attendees: 'Follow up with attendees',

      // Press Release
      write_press_release: 'Write press release',
      create_media_kit: 'Create media kit',
      build_media_list: 'Build media contact list',
      distribute_release: 'Distribute press release',
      pitch_journalists: 'Pitch to journalists',
      track_coverage: 'Track media coverage',
      measure_impact: 'Measure PR impact',

      // Influencer Outreach
      define_campaign_goals: 'Define campaign goals',
      identify_influencers: 'Identify potential influencers',
      analyze_audience_fit: 'Analyze audience fit',
      send_outreach: 'Send outreach messages',
      negotiate_terms: 'Negotiate terms and rates',
      manage_content_approval: 'Manage content approval',
      track_deliverables: 'Track deliverables',
      measure_campaign_roi: 'Measure campaign ROI',

      // Ad Campaign
      define_campaign_objective: 'Define campaign objective',
      set_budget_and_schedule: 'Set budget and schedule',
      create_audience_targeting: 'Create audience targeting',
      design_ad_creatives: 'Design ad creatives',
      write_ad_copy: 'Write ad copy',
      set_up_tracking: 'Set up conversion tracking',
      launch_campaign: 'Launch campaign',
      monitor_performance: 'Monitor performance',
      optimize_and_scale: 'Optimize and scale',

      // Landing Page
      define_conversion_goal: 'Define conversion goal',
      research_audience: 'Research target audience',
      design_page_layout: 'Design page layout',
      add_form_and_cta: 'Add form and CTA',
      publish_page: 'Publish landing page',
      run_ab_tests: 'Run A/B tests',
      optimize_conversion: 'Optimize for conversion',

      // Lead Magnet
      create_lead_magnet: 'Create lead magnet content',
      build_opt_in_form: 'Build opt-in form',
      set_up_delivery_automation: 'Set up delivery automation',
      configure_thank_you_page: 'Configure thank you page',
      create_nurture_sequence: 'Create nurture sequence',
      track_downloads: 'Track downloads',
      segment_leads: 'Segment leads',
      trigger_follow_up: 'Trigger follow-up automation',

      // Survey
      create_survey: 'Create survey',
      configure_logic: 'Configure branching logic',
      design_branding: 'Apply branding',
      set_distribution_channels: 'Set distribution channels',
      send_survey: 'Send survey',
      track_responses: 'Track responses',
      analyze_results: 'Analyze results',
      generate_reports: 'Generate reports',

      // Analytics
      connect_data_sources: 'Connect data sources',
      define_metrics: 'Define key metrics',
      set_up_dashboards: 'Set up dashboards',
      automate_data_collection: 'Automate data collection',
      schedule_delivery: 'Schedule report delivery',
      provide_insights: 'Provide actionable insights',
      recommend_actions: 'Recommend optimization actions',

      // Brand Assets
      upload_assets: 'Upload brand assets',
      organize_library: 'Organize asset library',
      set_permissions: 'Set access permissions',
      create_brand_guidelines: 'Create brand guidelines',
      enable_search: 'Enable search and discovery',
      distribute_assets: 'Distribute to team',
      track_usage: 'Track asset usage',
      manage_versions: 'Manage asset versions',
    };

    return mapping[stepName] || stepName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default MarketingDomainIntelligence;

// Convenience functions
export function createMarketingIntelligence(region: string = 'kuwait'): MarketingDomainIntelligence {
  return new MarketingDomainIntelligence(region);
}

export function detectMarketingWorkflow(request: string): string | null {
  const intelligence = new MarketingDomainIntelligence();
  return intelligence.detectMarketingPattern(request);
}

export function analyzeMarketingRequest(
  request: string,
  region: string = 'kuwait'
): MarketingAnalysisResult {
  const intelligence = new MarketingDomainIntelligence(region);
  const pattern = intelligence.detectMarketingPattern(request);

  return {
    pattern,
    requirements: pattern ? intelligence.getImplicitRequirements(pattern) : [],
    tools: pattern ? intelligence.getToolRecommendations(pattern) : [],
    questions: pattern ? intelligence.getClarifyingQuestions(pattern) : [],
    regionalContext: intelligence.getRegionalContext(),
    confidenceScore: pattern ? 85 : 50, // Higher confidence if pattern detected
  };
}

// Note: getOptimalPostingTime, calculateCampaignPerformance, and calculateEngagementRate
// are already exported at their function definitions above
