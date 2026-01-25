/**
 * Custom Integration Service
 *
 * Enables Nexus to work with apps not natively supported by Composio
 * by letting users provide their own API keys.
 *
 * Features:
 * - Known API documentation URLs for 100+ apps
 * - API key format validation
 * - Secure credential storage
 * - Direct API execution with stored credentials
 */

// Known API documentation URLs and key patterns
export interface AppAPIInfo {
  name: string
  displayName: string
  apiDocsUrl: string
  apiKeyUrl?: string // Direct link to API key page if different from docs
  keyPattern?: RegExp // Pattern to validate API key format
  keyHint: string // Human-readable hint about key format
  setupSteps: string[] // Step-by-step instructions
  baseUrl: string // API base URL
  authType: 'api_key' | 'bearer' | 'basic' | 'oauth' // How to use the key
  authHeader?: string // Custom header name if not standard
  testEndpoint?: string // Endpoint to test the key works
  category: string
}

export const KNOWN_APP_APIS: Record<string, AppAPIInfo> = {
  // Accounting
  wave: {
    name: 'wave',
    displayName: 'Wave Accounting',
    apiDocsUrl: 'https://developer.waveapps.com/hc/en-us/articles/360019968212-API-Reference',
    apiKeyUrl: 'https://developer.waveapps.com/hc/en-us/articles/360032720311-Manage-API-keys',
    keyPattern: /^[A-Za-z0-9_-]{32,64}$/,
    keyHint: '32-64 character alphanumeric key',
    setupSteps: [
      'Go to Wave → Settings → Integrations',
      'Click "API & Webhooks"',
      'Create a new Full Access Token',
      'Copy the token (it won\'t be shown again!)',
    ],
    baseUrl: 'https://gql.waveapps.com/graphql/public',
    authType: 'bearer',
    testEndpoint: '/graphql/public',
    category: 'ACCOUNTING',
  },

  freshbooks: {
    name: 'freshbooks',
    displayName: 'FreshBooks',
    apiDocsUrl: 'https://www.freshbooks.com/api/start',
    apiKeyUrl: 'https://my.freshbooks.com/#/developer',
    keyPattern: /^[a-f0-9]{64}$/,
    keyHint: '64 character hex string',
    setupSteps: [
      'Go to FreshBooks → Settings → Developer Portal',
      'Create a new application',
      'Copy the Client Secret',
    ],
    baseUrl: 'https://api.freshbooks.com',
    authType: 'bearer',
    category: 'ACCOUNTING',
  },

  kashoo: {
    name: 'kashoo',
    displayName: 'Kashoo',
    apiDocsUrl: 'https://www.kashoo.com/api-docs',
    keyPattern: /^[A-Za-z0-9]{20,40}$/,
    keyHint: '20-40 character alphanumeric key',
    setupSteps: [
      'Go to Kashoo → Settings → API Access',
      'Generate a new API key',
      'Copy the key',
    ],
    baseUrl: 'https://api.kashoo.com/v2',
    authType: 'api_key',
    authHeader: 'X-API-Key',
    category: 'ACCOUNTING',
  },

  // CRM
  pipeline_crm: {
    name: 'pipeline_crm',
    displayName: 'Pipeline CRM',
    apiDocsUrl: 'https://app.pipelinecrm.com/api/docs',
    apiKeyUrl: 'https://app.pipelinecrm.com/admin/api',
    keyPattern: /^[a-f0-9]{32}$/,
    keyHint: '32 character hex string',
    setupSteps: [
      'Go to Pipeline CRM → Admin → API',
      'Click "Generate API Key"',
      'Copy the key immediately',
    ],
    baseUrl: 'https://api.pipelinecrm.com/api/v3',
    authType: 'api_key',
    authHeader: 'X-API-Token',
    category: 'CRM',
  },

  close: {
    name: 'close',
    displayName: 'Close CRM',
    apiDocsUrl: 'https://developer.close.com/',
    apiKeyUrl: 'https://app.close.com/settings/api/',
    keyPattern: /^api_[A-Za-z0-9]{32,}$/,
    keyHint: 'Starts with "api_" followed by 32+ characters',
    setupSteps: [
      'Go to Close → Settings → API Keys',
      'Create a new API key',
      'Copy the full key including "api_" prefix',
    ],
    baseUrl: 'https://api.close.com/api/v1',
    authType: 'basic', // Close uses API key as username
    testEndpoint: '/me/',
    category: 'CRM',
  },

  copper: {
    name: 'copper',
    displayName: 'Copper CRM',
    apiDocsUrl: 'https://developer.copper.com/introduction/overview.html',
    apiKeyUrl: 'https://app.copper.com/companies/mine/app_settings/api_keys',
    keyPattern: /^[a-f0-9]{32,64}$/,
    keyHint: '32-64 character hex string',
    setupSteps: [
      'Go to Copper → Settings → Integrations → API Keys',
      'Create a new API key',
      'Copy the key and note your email (needed for auth)',
    ],
    baseUrl: 'https://api.copper.com/developer_api/v1',
    authType: 'api_key',
    authHeader: 'X-PW-AccessToken',
    category: 'CRM',
  },

  insightly: {
    name: 'insightly',
    displayName: 'Insightly',
    apiDocsUrl: 'https://api.insightly.com/v3.1/Help',
    apiKeyUrl: 'https://crm.insightly.com/Users/UserSettings',
    keyPattern: /^[a-f0-9-]{36}$/,
    keyHint: 'UUID format (36 characters with dashes)',
    setupSteps: [
      'Go to Insightly → User Settings → API',
      'Copy your API Key',
    ],
    baseUrl: 'https://api.insightly.com/v3.1',
    authType: 'basic',
    testEndpoint: '/Users/Me',
    category: 'CRM',
  },

  // ERP
  odoo: {
    name: 'odoo',
    displayName: 'Odoo ERP',
    apiDocsUrl: 'https://www.odoo.com/documentation/17.0/developer/reference/external_api.html',
    keyPattern: /^[A-Za-z0-9]{32,}$/,
    keyHint: '32+ character alphanumeric key',
    setupSteps: [
      'Go to Odoo → Settings → Users',
      'Click your user → Preferences',
      'Find "API Keys" section',
      'Create and copy a new API key',
    ],
    baseUrl: '', // User provides their Odoo instance URL
    authType: 'api_key',
    category: 'ERP',
  },

  // Project Management
  basecamp: {
    name: 'basecamp',
    displayName: 'Basecamp',
    apiDocsUrl: 'https://github.com/basecamp/bc3-api',
    apiKeyUrl: 'https://launchpad.37signals.com/integrations',
    keyPattern: /^[A-Za-z0-9]{20,}$/,
    keyHint: 'Personal access token',
    setupSteps: [
      'Go to Basecamp → Your Avatar → My Integrations',
      'Create a new integration or use existing',
      'Copy the access token',
    ],
    baseUrl: 'https://3.basecampapi.com',
    authType: 'bearer',
    category: 'PROJECT',
  },

  teamwork: {
    name: 'teamwork',
    displayName: 'Teamwork',
    apiDocsUrl: 'https://developer.teamwork.com/',
    apiKeyUrl: 'https://www.teamwork.com/launchpad/login',
    keyPattern: /^tk[A-Za-z0-9]{20,}$/,
    keyHint: 'Starts with "tk" followed by alphanumeric',
    setupSteps: [
      'Go to Teamwork → Your Profile → API & Mobile',
      'Find your API token',
      'Copy the token',
    ],
    baseUrl: 'https://yoursite.teamwork.com',
    authType: 'basic',
    category: 'PROJECT',
  },

  // E-commerce
  bigcommerce: {
    name: 'bigcommerce',
    displayName: 'BigCommerce',
    apiDocsUrl: 'https://developer.bigcommerce.com/docs/start/about',
    apiKeyUrl: 'https://login.bigcommerce.com/deep-links/settings/api-accounts',
    keyPattern: /^[a-z0-9]{32,}$/,
    keyHint: 'API Access Token (32+ characters)',
    setupSteps: [
      'Go to BigCommerce → Settings → API Accounts',
      'Create a new API Account',
      'Copy the Access Token',
    ],
    baseUrl: 'https://api.bigcommerce.com/stores/{store_hash}/v3',
    authType: 'bearer',
    authHeader: 'X-Auth-Token',
    category: 'ECOMMERCE',
  },

  woocommerce: {
    name: 'woocommerce',
    displayName: 'WooCommerce',
    apiDocsUrl: 'https://woocommerce.github.io/woocommerce-rest-api-docs/',
    keyPattern: /^ck_[a-f0-9]{40}$/,
    keyHint: 'Consumer Key starting with "ck_"',
    setupSteps: [
      'Go to WooCommerce → Settings → Advanced → REST API',
      'Add a new key with Read/Write access',
      'Copy both Consumer Key and Consumer Secret',
    ],
    baseUrl: 'https://yoursite.com/wp-json/wc/v3',
    authType: 'basic', // Uses consumer key:secret
    category: 'ECOMMERCE',
  },

  // Support
  helpscout: {
    name: 'helpscout',
    displayName: 'Help Scout',
    apiDocsUrl: 'https://developer.helpscout.com/',
    apiKeyUrl: 'https://secure.helpscout.net/members/api-keys/',
    keyPattern: /^[a-f0-9]{64}$/,
    keyHint: '64 character hex string',
    setupSteps: [
      'Go to Help Scout → Your Profile → API Keys',
      'Create a new API key',
      'Copy the key',
    ],
    baseUrl: 'https://api.helpscout.net/v2',
    authType: 'bearer',
    testEndpoint: '/users/me',
    category: 'SUPPORT',
  },

  crisp: {
    name: 'crisp',
    displayName: 'Crisp',
    apiDocsUrl: 'https://docs.crisp.chat/api/v1/',
    apiKeyUrl: 'https://app.crisp.chat/settings/tokens/',
    keyPattern: /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/,
    keyHint: 'UUID format token',
    setupSteps: [
      'Go to Crisp → Settings → API Tokens',
      'Create a new token',
      'Copy the token ID and key',
    ],
    baseUrl: 'https://api.crisp.chat/v1',
    authType: 'basic',
    category: 'SUPPORT',
  },

  // Analytics
  plausible: {
    name: 'plausible',
    displayName: 'Plausible Analytics',
    apiDocsUrl: 'https://plausible.io/docs/stats-api',
    apiKeyUrl: 'https://plausible.io/settings/api-keys',
    keyPattern: /^[A-Za-z0-9_-]{40,}$/,
    keyHint: '40+ character API key',
    setupSteps: [
      'Go to Plausible → Settings → API Keys',
      'Create a new API key',
      'Copy the key',
    ],
    baseUrl: 'https://plausible.io/api/v1',
    authType: 'bearer',
    testEndpoint: '/stats/aggregate',
    category: 'ANALYTICS',
  },

  // HR
  bamboohr: {
    name: 'bamboohr',
    displayName: 'BambooHR',
    apiDocsUrl: 'https://documentation.bamboohr.com/docs/getting-started',
    apiKeyUrl: 'https://documentation.bamboohr.com/docs/getting-started',
    keyPattern: /^[a-f0-9]{32}$/,
    keyHint: '32 character hex API key',
    setupSteps: [
      'Log into your BambooHR account',
      'Click your name (top right) → API Keys',
      'Click "Add New Key"',
      'Name it and copy the key',
    ],
    baseUrl: 'https://api.bamboohr.com/api/gateway.php/{company}/v1',
    authType: 'basic',
    testEndpoint: '/employees/directory',
    category: 'HR',
  },

  // Payments
  paddle: {
    name: 'paddle',
    displayName: 'Paddle',
    apiDocsUrl: 'https://developer.paddle.com/api-reference/overview',
    apiKeyUrl: 'https://vendors.paddle.com/authentication',
    keyPattern: /^[a-f0-9]{64}$/,
    keyHint: '64 character hex API key',
    setupSteps: [
      'Go to Paddle → Developer Tools → Authentication',
      'Copy your API Key',
    ],
    baseUrl: 'https://api.paddle.com',
    authType: 'bearer',
    category: 'PAYMENTS',
  },

  lemonsqueezy: {
    name: 'lemonsqueezy',
    displayName: 'Lemon Squeezy',
    apiDocsUrl: 'https://docs.lemonsqueezy.com/api',
    apiKeyUrl: 'https://app.lemonsqueezy.com/settings/api',
    keyPattern: /^[a-zA-Z0-9]{40,}$/,
    keyHint: '40+ character alphanumeric key',
    setupSteps: [
      'Go to Lemon Squeezy → Settings → API',
      'Create a new API key',
      'Copy the key',
    ],
    baseUrl: 'https://api.lemonsqueezy.com/v1',
    authType: 'bearer',
    testEndpoint: '/users/me',
    category: 'PAYMENTS',
  },

  // ============================================================================
  // EXPANDED DATABASE - 80+ Additional Apps (Jan 21, 2026)
  // DO NOT DELETE - This section is protected by CRITICAL_FIXES.md
  // ============================================================================

  // === MORE CRM ===
  freshsales: {
    name: 'freshsales',
    displayName: 'Freshsales',
    apiDocsUrl: 'https://developer.freshsales.io/api/#authentication',
    apiKeyUrl: 'https://developer.freshsales.io/api/#authentication',
    keyPattern: /^[a-zA-Z0-9]{20,}$/,
    keyHint: '20+ character API key',
    setupSteps: [
      'Log into Freshsales',
      'Go to Settings (gear icon) → API Settings',
      'Copy your API key (or generate one)',
    ],
    baseUrl: 'https://YOURDOMAIN.freshsales.io/api',
    authType: 'api_key',
    authHeader: 'Authorization',
    category: 'CRM',
  },

  zoho_crm: {
    name: 'zoho_crm',
    displayName: 'Zoho CRM',
    apiDocsUrl: 'https://www.zoho.com/crm/developer/docs/api/v6/',
    apiKeyUrl: 'https://api-console.zoho.com/',
    keyPattern: /^[a-zA-Z0-9.]{30,}$/,
    keyHint: 'OAuth access token from API Console',
    setupSteps: [
      'Go to Zoho API Console',
      'Create a Self Client',
      'Generate access token',
      'Copy the token',
    ],
    baseUrl: 'https://www.zohoapis.com/crm/v6',
    authType: 'bearer',
    category: 'CRM',
  },

  agile_crm: {
    name: 'agile_crm',
    displayName: 'Agile CRM',
    apiDocsUrl: 'https://github.com/agilecrm/rest-api#api-key',
    apiKeyUrl: 'https://github.com/agilecrm/rest-api#api-key',
    keyPattern: /^[a-zA-Z0-9]{20,}$/,
    keyHint: 'REST API key from account settings',
    setupSteps: [
      'Log into Agile CRM',
      'Go to Admin Settings → API & Analytics',
      'Copy your REST API key',
    ],
    baseUrl: 'https://YOURDOMAIN.agilecrm.com/dev/api',
    authType: 'basic',
    category: 'CRM',
  },

  capsule: {
    name: 'capsule',
    displayName: 'Capsule CRM',
    apiDocsUrl: 'https://developer.capsulecrm.com/v2/overview/authentication',
    apiKeyUrl: 'https://developer.capsulecrm.com/v2/overview/authentication',
    keyPattern: /^[a-f0-9]{32}$/,
    keyHint: '32 character hex token',
    setupSteps: [
      'Log into Capsule CRM',
      'Go to My Preferences → API Tokens',
      'Generate a new token',
      'Copy the token',
    ],
    baseUrl: 'https://api.capsulecrm.com/api/v2',
    authType: 'bearer',
    testEndpoint: '/users/me',
    category: 'CRM',
  },

  nutshell: {
    name: 'nutshell',
    displayName: 'Nutshell CRM',
    apiDocsUrl: 'https://developers.nutshell.com/',
    keyPattern: /^[a-zA-Z0-9]{32,}$/,
    keyHint: 'API key from settings',
    setupSteps: [
      'Go to Nutshell → Setup → API Keys',
      'Create a new API key',
      'Copy the key',
    ],
    baseUrl: 'https://app.nutshell.com/api/v1',
    authType: 'basic',
    category: 'CRM',
  },

  streak: {
    name: 'streak',
    displayName: 'Streak',
    apiDocsUrl: 'https://streak.readme.io/',
    apiKeyUrl: 'https://streak.com/api',
    keyPattern: /^[a-f0-9]{32}$/,
    keyHint: '32 character API key',
    setupSteps: [
      'Go to Streak → Integrations → Streak API',
      'Copy your API key',
    ],
    baseUrl: 'https://api.streak.com/api/v1',
    authType: 'basic',
    testEndpoint: '/users/me',
    category: 'CRM',
  },

  // === EMAIL MARKETING ===
  mailchimp: {
    name: 'mailchimp',
    displayName: 'Mailchimp',
    apiDocsUrl: 'https://mailchimp.com/developer/marketing/',
    apiKeyUrl: 'https://us1.admin.mailchimp.com/account/api/',
    keyPattern: /^[a-f0-9]{32}-us\d+$/,
    keyHint: 'API key ending with datacenter (e.g., xxx-us14)',
    setupSteps: [
      'Go to Mailchimp → Account → Extras → API Keys',
      'Create a new API key',
      'Copy the full key including datacenter suffix',
    ],
    baseUrl: 'https://us1.api.mailchimp.com/3.0',
    authType: 'basic',
    testEndpoint: '/ping',
    category: 'MARKETING',
  },

  activecampaign: {
    name: 'activecampaign',
    displayName: 'ActiveCampaign',
    apiDocsUrl: 'https://developers.activecampaign.com/reference/overview',
    apiKeyUrl: 'https://developers.activecampaign.com/reference/overview',
    keyPattern: /^[a-f0-9]{64}$/,
    keyHint: '64 character hex API key',
    setupSteps: [
      'Log into ActiveCampaign',
      'Go to Settings → Developer',
      'Copy your API URL and API Key',
    ],
    baseUrl: 'https://YOURACCOUNT.api-us1.com/api/3',
    authType: 'api_key',
    authHeader: 'Api-Token',
    category: 'MARKETING',
  },

  convertkit: {
    name: 'convertkit',
    displayName: 'ConvertKit',
    apiDocsUrl: 'https://developers.convertkit.com/',
    apiKeyUrl: 'https://app.convertkit.com/account_settings/advanced_settings',
    keyPattern: /^[a-zA-Z0-9_]{20,}$/,
    keyHint: 'API Key or API Secret',
    setupSteps: [
      'Go to ConvertKit → Settings → Advanced',
      'Copy your API Key',
    ],
    baseUrl: 'https://api.convertkit.com/v3',
    authType: 'api_key',
    testEndpoint: '/account',
    category: 'MARKETING',
  },

  drip: {
    name: 'drip',
    displayName: 'Drip',
    apiDocsUrl: 'https://developer.drip.com/',
    apiKeyUrl: 'https://www.getdrip.com/user/edit',
    keyPattern: /^[a-zA-Z0-9]{20,}$/,
    keyHint: 'API Token from user settings',
    setupSteps: [
      'Go to Drip → User Settings → API Token',
      'Copy your token',
    ],
    baseUrl: 'https://api.getdrip.com/v2',
    authType: 'bearer',
    category: 'MARKETING',
  },

  getresponse: {
    name: 'getresponse',
    displayName: 'GetResponse',
    apiDocsUrl: 'https://apidocs.getresponse.com/v3',
    apiKeyUrl: 'https://app.getresponse.com/api',
    keyPattern: /^[a-zA-Z0-9]{32,}$/,
    keyHint: '32+ character API key',
    setupSteps: [
      'Go to GetResponse → Tools → Integrations & API → API',
      'Generate a new API key',
    ],
    baseUrl: 'https://api.getresponse.com/v3',
    authType: 'api_key',
    authHeader: 'X-Auth-Token',
    testEndpoint: '/accounts',
    category: 'MARKETING',
  },

  brevo: {
    name: 'brevo',
    displayName: 'Brevo (Sendinblue)',
    apiDocsUrl: 'https://developers.brevo.com/',
    apiKeyUrl: 'https://app.brevo.com/settings/keys/api',
    keyPattern: /^xkeysib-[a-f0-9]{64}-[a-zA-Z0-9]+$/,
    keyHint: 'Starts with "xkeysib-"',
    setupSteps: [
      'Go to Brevo → Settings → SMTP & API → API Keys',
      'Create a new API key',
      'Copy the key',
    ],
    baseUrl: 'https://api.brevo.com/v3',
    authType: 'api_key',
    authHeader: 'api-key',
    testEndpoint: '/account',
    category: 'MARKETING',
  },

  klaviyo: {
    name: 'klaviyo',
    displayName: 'Klaviyo',
    apiDocsUrl: 'https://developers.klaviyo.com/',
    apiKeyUrl: 'https://www.klaviyo.com/account#api-keys-tab',
    keyPattern: /^pk_[a-f0-9]{32}$/,
    keyHint: 'Starts with "pk_" (private key)',
    setupSteps: [
      'Go to Klaviyo → Account → Settings → API Keys',
      'Copy your Private API Key (starts with pk_)',
    ],
    baseUrl: 'https://a.klaviyo.com/api',
    authType: 'api_key',
    authHeader: 'Authorization',
    category: 'MARKETING',
  },

  aweber: {
    name: 'aweber',
    displayName: 'AWeber',
    apiDocsUrl: 'https://api.aweber.com/',
    keyPattern: /^[a-zA-Z0-9]{20,}$/,
    keyHint: 'OAuth access token',
    setupSteps: [
      'Go to AWeber Developer area',
      'Create an application',
      'Generate access tokens',
    ],
    baseUrl: 'https://api.aweber.com/1.0',
    authType: 'bearer',
    category: 'MARKETING',
  },

  constant_contact: {
    name: 'constant_contact',
    displayName: 'Constant Contact',
    apiDocsUrl: 'https://developer.constantcontact.com/',
    keyPattern: /^[a-zA-Z0-9-]{36}$/,
    keyHint: 'API Key (UUID format)',
    setupSteps: [
      'Go to Constant Contact Developer Portal',
      'Create an application',
      'Copy your API key',
    ],
    baseUrl: 'https://api.cc.email/v3',
    authType: 'bearer',
    category: 'MARKETING',
  },

  campaign_monitor: {
    name: 'campaign_monitor',
    displayName: 'Campaign Monitor',
    apiDocsUrl: 'https://www.campaignmonitor.com/api/getting-started/',
    apiKeyUrl: 'https://www.campaignmonitor.com/api/getting-started/',
    keyPattern: /^[a-zA-Z0-9]{32,}$/,
    keyHint: 'API key from account settings',
    setupSteps: [
      'Log into Campaign Monitor',
      'Go to Account Settings → API Keys',
      'View and copy your API key',
    ],
    baseUrl: 'https://api.createsend.com/api/v3.3',
    authType: 'basic',
    testEndpoint: '/systemdate.json',
    category: 'MARKETING',
  },

  mailjet: {
    name: 'mailjet',
    displayName: 'Mailjet',
    apiDocsUrl: 'https://dev.mailjet.com/',
    apiKeyUrl: 'https://app.mailjet.com/account/apikeys',
    keyPattern: /^[a-f0-9]{32}$/,
    keyHint: 'API Key and Secret Key pair',
    setupSteps: [
      'Go to Mailjet → Account → API Keys',
      'Copy your API Key and Secret Key',
    ],
    baseUrl: 'https://api.mailjet.com/v3.1',
    authType: 'basic',
    testEndpoint: '/user',
    category: 'MARKETING',
  },

  moosend: {
    name: 'moosend',
    displayName: 'Moosend',
    apiDocsUrl: 'https://moosendapp.docs.apiary.io/',
    apiKeyUrl: 'https://identity.moosend.com/tokens',
    keyPattern: /^[a-f0-9-]{36}$/,
    keyHint: 'API Key (UUID format)',
    setupSteps: [
      'Go to Moosend → Settings → API Key',
      'Copy your API key',
    ],
    baseUrl: 'https://api.moosend.com/v3',
    authType: 'api_key',
    category: 'MARKETING',
  },

  omnisend: {
    name: 'omnisend',
    displayName: 'Omnisend',
    apiDocsUrl: 'https://api-docs.omnisend.com/',
    apiKeyUrl: 'https://app.omnisend.com/integrations/api-keys',
    keyPattern: /^[a-f0-9]{32}$/,
    keyHint: '32 character API key',
    setupSteps: [
      'Go to Omnisend → Store Settings → API Keys',
      'Generate a new API key',
    ],
    baseUrl: 'https://api.omnisend.com/v3',
    authType: 'api_key',
    authHeader: 'X-API-KEY',
    category: 'MARKETING',
  },

  customerio: {
    name: 'customerio',
    displayName: 'Customer.io',
    apiDocsUrl: 'https://customer.io/docs/api/',
    apiKeyUrl: 'https://fly.customer.io/settings/api_credentials',
    keyPattern: /^[a-f0-9]{32,}$/,
    keyHint: 'API Key from settings',
    setupSteps: [
      'Go to Customer.io → Settings → API Credentials',
      'Copy your Site ID and API Key',
    ],
    baseUrl: 'https://track.customer.io/api/v1',
    authType: 'basic',
    category: 'MARKETING',
  },

  // === MORE E-COMMERCE ===
  shopify: {
    name: 'shopify',
    displayName: 'Shopify',
    apiDocsUrl: 'https://shopify.dev/docs/api',
    keyPattern: /^shpat_[a-f0-9]{32}$/,
    keyHint: 'Admin API access token (starts with shpat_)',
    setupSteps: [
      'Go to Shopify Admin → Settings → Apps → Develop apps',
      'Create or open an app',
      'Install app and copy Admin API access token',
    ],
    baseUrl: 'https://yourstore.myshopify.com/admin/api/2024-01',
    authType: 'api_key',
    authHeader: 'X-Shopify-Access-Token',
    category: 'ECOMMERCE',
  },

  gumroad: {
    name: 'gumroad',
    displayName: 'Gumroad',
    apiDocsUrl: 'https://app.gumroad.com/api',
    apiKeyUrl: 'https://app.gumroad.com/settings/advanced',
    keyPattern: /^[a-f0-9]{32}$/,
    keyHint: '32 character access token',
    setupSteps: [
      'Go to Gumroad → Settings → Advanced → Application API',
      'Copy your Access Token',
    ],
    baseUrl: 'https://api.gumroad.com/v2',
    authType: 'api_key',
    testEndpoint: '/user',
    category: 'ECOMMERCE',
  },

  sellfy: {
    name: 'sellfy',
    displayName: 'Sellfy',
    apiDocsUrl: 'https://sellfy.com/docs/api/',
    keyPattern: /^[a-zA-Z0-9]{32,}$/,
    keyHint: 'API key from account',
    setupSteps: [
      'Go to Sellfy → Settings → API',
      'Generate or copy your API key',
    ],
    baseUrl: 'https://sellfy.com/api/v2',
    authType: 'bearer',
    category: 'ECOMMERCE',
  },

  podia: {
    name: 'podia',
    displayName: 'Podia',
    apiDocsUrl: 'https://www.podia.com/api',
    apiKeyUrl: 'https://app.podia.com/settings/integrations',
    keyPattern: /^[a-zA-Z0-9]{20,}$/,
    keyHint: 'API key from integrations',
    setupSteps: [
      'Go to Podia → Settings → Integrations',
      'Copy your API key',
    ],
    baseUrl: 'https://api.podia.com',
    authType: 'bearer',
    category: 'ECOMMERCE',
  },

  thinkific: {
    name: 'thinkific',
    displayName: 'Thinkific',
    apiDocsUrl: 'https://developers.thinkific.com/',
    apiKeyUrl: 'https://yourschool.thinkific.com/manage/api',
    keyPattern: /^[a-f0-9]{32}$/,
    keyHint: '32 character API key',
    setupSteps: [
      'Go to Thinkific → Settings → API',
      'Copy your API key',
    ],
    baseUrl: 'https://api.thinkific.com/api/public/v1',
    authType: 'api_key',
    authHeader: 'X-Auth-API-Key',
    category: 'ECOMMERCE',
  },

  teachable: {
    name: 'teachable',
    displayName: 'Teachable',
    apiDocsUrl: 'https://docs.teachable.com/',
    keyPattern: /^[a-zA-Z0-9]{32,}$/,
    keyHint: 'API key from settings',
    setupSteps: [
      'Go to Teachable → Settings → API',
      'Generate a new API key',
    ],
    baseUrl: 'https://yourschool.teachable.com/api/v1',
    authType: 'bearer',
    category: 'ECOMMERCE',
  },

  ecwid: {
    name: 'ecwid',
    displayName: 'Ecwid',
    apiDocsUrl: 'https://api-docs.ecwid.com/',
    apiKeyUrl: 'https://my.ecwid.com/cp/CP.html#develop-apps',
    keyPattern: /^secret_[a-zA-Z0-9]{32,}$/,
    keyHint: 'Secret token (starts with secret_)',
    setupSteps: [
      'Go to Ecwid → Apps → My Apps',
      'Create or open your app',
      'Copy the secret token',
    ],
    baseUrl: 'https://app.ecwid.com/api/v3',
    authType: 'bearer',
    category: 'ECOMMERCE',
  },

  squarespace: {
    name: 'squarespace',
    displayName: 'Squarespace Commerce',
    apiDocsUrl: 'https://developers.squarespace.com/',
    apiKeyUrl: 'https://yoursite.squarespace.com/config/settings/developer-api-keys',
    keyPattern: /^[a-f0-9-]{36}$/,
    keyHint: 'API key (UUID format)',
    setupSteps: [
      'Go to Squarespace → Settings → Advanced → Developer API Keys',
      'Generate a new API key',
    ],
    baseUrl: 'https://api.squarespace.com/1.0',
    authType: 'bearer',
    category: 'ECOMMERCE',
  },

  // === MORE SUPPORT ===
  freshdesk: {
    name: 'freshdesk',
    displayName: 'Freshdesk',
    apiDocsUrl: 'https://developers.freshdesk.com/api/#authentication',
    apiKeyUrl: 'https://developers.freshdesk.com/api/#authentication',
    keyPattern: /^[a-zA-Z0-9]{20,}$/,
    keyHint: 'API key from profile settings',
    setupSteps: [
      'Log into Freshdesk',
      'Click profile icon (top right) → Profile Settings',
      'Find your API Key on the right side',
      'Copy the API key',
    ],
    baseUrl: 'https://YOURDOMAIN.freshdesk.com/api/v2',
    authType: 'basic',
    testEndpoint: '/agents/me',
    category: 'SUPPORT',
  },

  intercom: {
    name: 'intercom',
    displayName: 'Intercom',
    apiDocsUrl: 'https://developers.intercom.com/',
    apiKeyUrl: 'https://app.intercom.com/a/developer-signup',
    keyPattern: /^dG9rO[a-zA-Z0-9=]+$/,
    keyHint: 'Access token (base64 encoded)',
    setupSteps: [
      'Go to Intercom → Settings → Developers → Developer Hub',
      'Create an app and copy access token',
    ],
    baseUrl: 'https://api.intercom.io',
    authType: 'bearer',
    testEndpoint: '/me',
    category: 'SUPPORT',
  },

  groove: {
    name: 'groove',
    displayName: 'Groove',
    apiDocsUrl: 'https://www.groovehq.com/docs/api-overview',
    apiKeyUrl: 'https://www.groovehq.com/docs/api-overview',
    keyPattern: /^[a-f0-9]{40}$/,
    keyHint: '40 character API token',
    setupSteps: [
      'Log into Groove',
      'Go to Settings → API',
      'Click Personal Access Tokens tab',
      'Create a new token',
    ],
    baseUrl: 'https://api.groovehq.com/v1',
    authType: 'bearer',
    category: 'SUPPORT',
  },

  livechat: {
    name: 'livechat',
    displayName: 'LiveChat',
    apiDocsUrl: 'https://developers.livechat.com/',
    apiKeyUrl: 'https://developers.livechat.com/console/',
    keyPattern: /^[a-zA-Z0-9]{32,}$/,
    keyHint: 'API key from Developer Console',
    setupSteps: [
      'Go to LiveChat Developer Console',
      'Create an app',
      'Copy the API key',
    ],
    baseUrl: 'https://api.livechatinc.com/v3.5',
    authType: 'bearer',
    category: 'SUPPORT',
  },

  tidio: {
    name: 'tidio',
    displayName: 'Tidio',
    apiDocsUrl: 'https://www.tidio.com/api/',
    apiKeyUrl: 'https://www.tidio.com/panel/settings/developer',
    keyPattern: /^[a-f0-9]{32}$/,
    keyHint: 'Public API key',
    setupSteps: [
      'Go to Tidio → Settings → Developer',
      'Copy your API key',
    ],
    baseUrl: 'https://api.tidio.co',
    authType: 'api_key',
    category: 'SUPPORT',
  },

  front: {
    name: 'front',
    displayName: 'Front',
    apiDocsUrl: 'https://dev.frontapp.com/',
    apiKeyUrl: 'https://app.frontapp.com/settings/developers',
    keyPattern: /^[a-zA-Z0-9_-]{20,}$/,
    keyHint: 'API token from developer settings',
    setupSteps: [
      'Go to Front → Settings → Developers → API Tokens',
      'Create a new token',
    ],
    baseUrl: 'https://api2.frontapp.com',
    authType: 'bearer',
    testEndpoint: '/me',
    category: 'SUPPORT',
  },

  kayako: {
    name: 'kayako',
    displayName: 'Kayako',
    apiDocsUrl: 'https://developer.kayako.com/api/v1/reference',
    apiKeyUrl: 'https://developer.kayako.com/api/v1/reference',
    keyPattern: /^[a-zA-Z0-9]{32,}$/,
    keyHint: 'API key from settings',
    setupSteps: [
      'Log into Kayako',
      'Go to Admin → API',
      'Generate a new API key',
    ],
    baseUrl: 'https://YOURDOMAIN.kayako.com/api/v1',
    authType: 'basic',
    category: 'SUPPORT',
  },

  // === MORE ANALYTICS ===
  fathom: {
    name: 'fathom',
    displayName: 'Fathom Analytics',
    apiDocsUrl: 'https://usefathom.com/api',
    apiKeyUrl: 'https://app.usefathom.com/settings/api',
    keyPattern: /^[a-zA-Z0-9]{20,}$/,
    keyHint: 'API Key from settings',
    setupSteps: [
      'Go to Fathom → Settings → API',
      'Create a new API key',
    ],
    baseUrl: 'https://api.usefathom.com/v1',
    authType: 'bearer',
    testEndpoint: '/account',
    category: 'ANALYTICS',
  },

  simpleanalytics: {
    name: 'simpleanalytics',
    displayName: 'Simple Analytics',
    apiDocsUrl: 'https://docs.simpleanalytics.com/api',
    apiKeyUrl: 'https://simpleanalytics.com/account#api',
    keyPattern: /^sa_api_key_[a-zA-Z0-9]{32}$/,
    keyHint: 'Starts with "sa_api_key_"',
    setupSteps: [
      'Go to Simple Analytics → Account → API',
      'Create a new API key',
    ],
    baseUrl: 'https://simpleanalytics.com/api',
    authType: 'api_key',
    authHeader: 'Api-Key',
    category: 'ANALYTICS',
  },

  amplitude: {
    name: 'amplitude',
    displayName: 'Amplitude',
    apiDocsUrl: 'https://www.docs.developers.amplitude.com/',
    apiKeyUrl: 'https://analytics.amplitude.com/settings/projects',
    keyPattern: /^[a-f0-9]{32}$/,
    keyHint: 'API Key and Secret Key pair',
    setupSteps: [
      'Go to Amplitude → Settings → Projects → API Keys',
      'Copy your API Key and Secret Key',
    ],
    baseUrl: 'https://amplitude.com/api/2',
    authType: 'basic',
    category: 'ANALYTICS',
  },

  mixpanel: {
    name: 'mixpanel',
    displayName: 'Mixpanel',
    apiDocsUrl: 'https://developer.mixpanel.com/',
    apiKeyUrl: 'https://mixpanel.com/settings/project',
    keyPattern: /^[a-f0-9]{32}$/,
    keyHint: '32 character project token',
    setupSteps: [
      'Go to Mixpanel → Settings → Project Settings',
      'Copy your Project Token and API Secret',
    ],
    baseUrl: 'https://mixpanel.com/api/2.0',
    authType: 'basic',
    category: 'ANALYTICS',
  },

  posthog: {
    name: 'posthog',
    displayName: 'PostHog',
    apiDocsUrl: 'https://posthog.com/docs/api',
    apiKeyUrl: 'https://app.posthog.com/project/settings',
    keyPattern: /^phx_[a-zA-Z0-9]{32,}$/,
    keyHint: 'Personal API key (starts with phx_)',
    setupSteps: [
      'Go to PostHog → Settings → Personal API Keys',
      'Create a new key',
    ],
    baseUrl: 'https://app.posthog.com/api',
    authType: 'bearer',
    testEndpoint: '/user',
    category: 'ANALYTICS',
  },

  heap: {
    name: 'heap',
    displayName: 'Heap Analytics',
    apiDocsUrl: 'https://developers.heap.io/',
    apiKeyUrl: 'https://heapanalytics.com/app/settings/api',
    keyPattern: /^[a-zA-Z0-9]{32,}$/,
    keyHint: 'API key from settings',
    setupSteps: [
      'Go to Heap → Settings → API',
      'Copy your API key',
    ],
    baseUrl: 'https://heapanalytics.com/api',
    authType: 'bearer',
    category: 'ANALYTICS',
  },

  june: {
    name: 'june',
    displayName: 'June.so',
    apiDocsUrl: 'https://www.june.so/docs/api',
    apiKeyUrl: 'https://app.june.so/settings/api',
    keyPattern: /^[a-zA-Z0-9]{32,}$/,
    keyHint: 'Write key from settings',
    setupSteps: [
      'Go to June → Settings → API Keys',
      'Copy your Write Key',
    ],
    baseUrl: 'https://api.june.so/api',
    authType: 'basic',
    category: 'ANALYTICS',
  },

  // === MORE HR ===
  gusto: {
    name: 'gusto',
    displayName: 'Gusto',
    apiDocsUrl: 'https://docs.gusto.com/',
    keyPattern: /^[a-zA-Z0-9]{20,}$/,
    keyHint: 'OAuth access token',
    setupSteps: [
      'Go to Gusto Developer Portal',
      'Create an application',
      'Complete OAuth flow to get access token',
    ],
    baseUrl: 'https://api.gusto.com/v1',
    authType: 'bearer',
    testEndpoint: '/me',
    category: 'HR',
  },

  rippling: {
    name: 'rippling',
    displayName: 'Rippling',
    apiDocsUrl: 'https://developer.rippling.com/',
    keyPattern: /^[a-zA-Z0-9]{32,}$/,
    keyHint: 'API key from developer settings',
    setupSteps: [
      'Go to Rippling → IT → API Management',
      'Create a new API key',
    ],
    baseUrl: 'https://api.rippling.com/platform/api',
    authType: 'bearer',
    category: 'HR',
  },

  personio: {
    name: 'personio',
    displayName: 'Personio',
    apiDocsUrl: 'https://developer.personio.de/docs/getting-started-with-the-personio-api',
    apiKeyUrl: 'https://developer.personio.de/docs/getting-started-with-the-personio-api',
    keyPattern: /^[a-zA-Z0-9-]{36,}$/,
    keyHint: 'Client ID and Secret pair',
    setupSteps: [
      'Log into Personio',
      'Go to Settings → Integrations → API Credentials',
      'Create new credentials',
      'Copy Client ID and Secret',
    ],
    baseUrl: 'https://api.personio.de/v1',
    authType: 'bearer',
    category: 'HR',
  },

  deel: {
    name: 'deel',
    displayName: 'Deel',
    apiDocsUrl: 'https://developer.deel.com/',
    apiKeyUrl: 'https://app.deel.com/developer',
    keyPattern: /^[a-zA-Z0-9]{40,}$/,
    keyHint: 'API token from developer settings',
    setupSteps: [
      'Go to Deel → Settings → Developer → API Access',
      'Create a new token',
    ],
    baseUrl: 'https://api.deel.com/rest/v2',
    authType: 'bearer',
    category: 'HR',
  },

  factorial: {
    name: 'factorial',
    displayName: 'Factorial HR',
    apiDocsUrl: 'https://apidoc.factorialhr.com/',
    apiKeyUrl: 'https://api.factorialhr.com/settings/api-keys',
    keyPattern: /^[a-f0-9]{64}$/,
    keyHint: '64 character API key',
    setupSteps: [
      'Go to Factorial → Settings → API Keys',
      'Generate a new key',
    ],
    baseUrl: 'https://api.factorialhr.com/api/v1',
    authType: 'bearer',
    testEndpoint: '/me',
    category: 'HR',
  },

  hibob: {
    name: 'hibob',
    displayName: 'HiBob',
    apiDocsUrl: 'https://apidocs.hibob.com/',
    apiKeyUrl: 'https://app.hibob.com/settings/integrations',
    keyPattern: /^[a-zA-Z0-9-]{36}$/,
    keyHint: 'API token (UUID format)',
    setupSteps: [
      'Go to HiBob → Settings → Integrations → Service Users',
      'Create a service user',
      'Copy the API token',
    ],
    baseUrl: 'https://api.hibob.com/v1',
    authType: 'bearer',
    category: 'HR',
  },

  // === MORE PAYMENTS ===
  chargebee: {
    name: 'chargebee',
    displayName: 'Chargebee',
    apiDocsUrl: 'https://apidocs.chargebee.com/',
    apiKeyUrl: 'https://yoursite.chargebee.com/apikeys/keys',
    keyPattern: /^[a-z]+_[A-Za-z0-9]{20,}$/,
    keyHint: 'API key with site prefix',
    setupSteps: [
      'Go to Chargebee → Settings → Configure Chargebee → API Keys',
      'Create a new Full Access API Key',
    ],
    baseUrl: 'https://yoursite.chargebee.com/api/v2',
    authType: 'basic',
    category: 'PAYMENTS',
  },

  recurly: {
    name: 'recurly',
    displayName: 'Recurly',
    apiDocsUrl: 'https://developers.recurly.com/',
    apiKeyUrl: 'https://yoursite.recurly.com/settings/api_keys',
    keyPattern: /^[a-f0-9]{32}$/,
    keyHint: '32 character private API key',
    setupSteps: [
      'Go to Recurly → Integrations → API Credentials',
      'Copy your Private API Key',
    ],
    baseUrl: 'https://v3.recurly.com',
    authType: 'basic',
    category: 'PAYMENTS',
  },

  square: {
    name: 'square',
    displayName: 'Square',
    apiDocsUrl: 'https://developer.squareup.com/',
    apiKeyUrl: 'https://developer.squareup.com/apps',
    keyPattern: /^EAAAlg[a-zA-Z0-9_-]{40,}$/,
    keyHint: 'Access token (starts with EAAAlg)',
    setupSteps: [
      'Go to Square Developer Dashboard',
      'Create or open an application',
      'Copy your Access Token',
    ],
    baseUrl: 'https://connect.squareup.com/v2',
    authType: 'bearer',
    testEndpoint: '/merchants/me',
    category: 'PAYMENTS',
  },

  paypal: {
    name: 'paypal',
    displayName: 'PayPal',
    apiDocsUrl: 'https://developer.paypal.com/docs/api/overview/',
    apiKeyUrl: 'https://developer.paypal.com/dashboard/applications/live',
    keyPattern: /^[a-zA-Z0-9-_]{20,}$/,
    keyHint: 'Client ID and Secret pair',
    setupSteps: [
      'Go to PayPal Developer → My Apps & Credentials',
      'Create or select an app',
      'Copy Client ID and Secret',
    ],
    baseUrl: 'https://api-m.paypal.com/v1',
    authType: 'basic',
    category: 'PAYMENTS',
  },

  // === PROJECT MANAGEMENT ===
  wrike: {
    name: 'wrike',
    displayName: 'Wrike',
    apiDocsUrl: 'https://developers.wrike.com/',
    apiKeyUrl: 'https://www.wrike.com/frontend/apps/index.html#/api',
    keyPattern: /^[a-zA-Z0-9]{20,}$/,
    keyHint: 'Permanent token from apps page',
    setupSteps: [
      'Go to Wrike → Apps & Integrations → API',
      'Create a new permanent token',
    ],
    baseUrl: 'https://www.wrike.com/api/v4',
    authType: 'bearer',
    testEndpoint: '/contacts?me=true',
    category: 'PROJECT',
  },

  monday: {
    name: 'monday',
    displayName: 'Monday.com',
    apiDocsUrl: 'https://developer.monday.com/api-reference/docs/authentication',
    apiKeyUrl: 'https://developer.monday.com/api-reference/docs/authentication',
    keyPattern: /^[a-zA-Z0-9]{200,}$/,
    keyHint: 'Personal API token (long string)',
    setupSteps: [
      'Click your avatar (bottom-left) → Developers',
      'Go to "My access tokens" tab',
      'Click "Show" to reveal or generate a new token',
      'Copy the token',
    ],
    baseUrl: 'https://api.monday.com/v2',
    authType: 'bearer',
    category: 'PROJECT',
  },

  clickup: {
    name: 'clickup',
    displayName: 'ClickUp',
    apiDocsUrl: 'https://clickup.com/api/developer-portal/authentication/#generate-your-personal-api-token',
    apiKeyUrl: 'https://clickup.com/api/developer-portal/authentication/#generate-your-personal-api-token',
    keyPattern: /^pk_[a-zA-Z0-9_]{20,}$/,
    keyHint: 'API token (starts with pk_)',
    setupSteps: [
      'Click your avatar (bottom-left) → Settings',
      'Click "Apps" in the sidebar',
      'Under "API Token", click "Generate" or "Regenerate"',
      'Copy the token immediately (won\'t be shown again)',
    ],
    baseUrl: 'https://api.clickup.com/api/v2',
    authType: 'bearer',
    testEndpoint: '/user',
    category: 'PROJECT',
  },

  smartsheet: {
    name: 'smartsheet',
    displayName: 'Smartsheet',
    apiDocsUrl: 'https://smartsheet.redoc.ly/',
    apiKeyUrl: 'https://app.smartsheet.com/b/home?dlp=eyJ0eXBlIjoiYWNjb3VudCIsInN1YlR5cGUiOiJhcGkifQ',
    keyPattern: /^[a-zA-Z0-9]{32,}$/,
    keyHint: 'Access token from account settings',
    setupSteps: [
      'Go to Smartsheet → Account → Personal Settings → API Access',
      'Generate a new access token',
    ],
    baseUrl: 'https://api.smartsheet.com/2.0',
    authType: 'bearer',
    testEndpoint: '/users/me',
    category: 'PROJECT',
  },

  airtable: {
    name: 'airtable',
    displayName: 'Airtable',
    apiDocsUrl: 'https://airtable.com/developers/web/api/introduction',
    apiKeyUrl: 'https://airtable.com/create/tokens',
    keyPattern: /^pat[a-zA-Z0-9.]{50,}$/,
    keyHint: 'Personal access token (starts with pat)',
    setupSteps: [
      'Go to Airtable → Account → Developer Hub → Personal access tokens',
      'Create a new token with required scopes',
    ],
    baseUrl: 'https://api.airtable.com/v0',
    authType: 'bearer',
    category: 'PROJECT',
  },

  notion_api: {
    name: 'notion_api',
    displayName: 'Notion API',
    apiDocsUrl: 'https://developers.notion.com/',
    apiKeyUrl: 'https://www.notion.so/my-integrations',
    keyPattern: /^secret_[a-zA-Z0-9]{40,}$/,
    keyHint: 'Integration secret (starts with secret_)',
    setupSteps: [
      'Go to Notion → Settings → Integrations → Develop your own',
      'Create a new integration',
      'Copy the Internal Integration Secret',
    ],
    baseUrl: 'https://api.notion.com/v1',
    authType: 'bearer',
    authHeader: 'Authorization',
    testEndpoint: '/users/me',
    category: 'PROJECT',
  },

  coda: {
    name: 'coda',
    displayName: 'Coda',
    apiDocsUrl: 'https://coda.io/developers/apis/v1',
    apiKeyUrl: 'https://coda.io/account',
    keyPattern: /^[a-f0-9-]{36}$/,
    keyHint: 'API token (UUID format)',
    setupSteps: [
      'Go to Coda → Account Settings → API Settings',
      'Generate a new API token',
    ],
    baseUrl: 'https://coda.io/apis/v1',
    authType: 'bearer',
    testEndpoint: '/whoami',
    category: 'PROJECT',
  },

  linear: {
    name: 'linear',
    displayName: 'Linear',
    apiDocsUrl: 'https://developers.linear.app/',
    apiKeyUrl: 'https://linear.app/settings/api',
    keyPattern: /^lin_api_[a-zA-Z0-9]{40,}$/,
    keyHint: 'API key (starts with lin_api_)',
    setupSteps: [
      'Go to Linear → Settings → API → Personal API Keys',
      'Create a new API key',
    ],
    baseUrl: 'https://api.linear.app/graphql',
    authType: 'bearer',
    category: 'PROJECT',
  },

  height: {
    name: 'height',
    displayName: 'Height',
    apiDocsUrl: 'https://www.notion.so/Height-API-Documentation-27dd05f7a9864ef5b3f39c89a7c2a6dc',
    apiKeyUrl: 'https://height.app/settings/tokens',
    keyPattern: /^[a-zA-Z0-9_-]{40,}$/,
    keyHint: 'API secret token',
    setupSteps: [
      'Go to Height → Settings → API Tokens',
      'Create a new token',
    ],
    baseUrl: 'https://api.height.app',
    authType: 'api_key',
    authHeader: 'Authorization',
    category: 'PROJECT',
  },

  // === COMMUNICATION ===
  twilio: {
    name: 'twilio',
    displayName: 'Twilio',
    apiDocsUrl: 'https://www.twilio.com/docs/usage/api',
    apiKeyUrl: 'https://console.twilio.com/us1/account/keys-credentials/api-keys',
    keyPattern: /^SK[a-f0-9]{32}$/,
    keyHint: 'Account SID and Auth Token (or API Key)',
    setupSteps: [
      'Go to Twilio Console → Account → API Keys',
      'Create a new API key or use Account SID + Auth Token',
    ],
    baseUrl: 'https://api.twilio.com/2010-04-01',
    authType: 'basic',
    category: 'COMMUNICATION',
  },

  sendgrid: {
    name: 'sendgrid',
    displayName: 'SendGrid',
    apiDocsUrl: 'https://docs.sendgrid.com/api-reference',
    apiKeyUrl: 'https://app.sendgrid.com/settings/api_keys',
    keyPattern: /^SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}$/,
    keyHint: 'API key (starts with SG.)',
    setupSteps: [
      'Go to SendGrid → Settings → API Keys',
      'Create a new API key',
    ],
    baseUrl: 'https://api.sendgrid.com/v3',
    authType: 'bearer',
    testEndpoint: '/user/profile',
    category: 'COMMUNICATION',
  },

  mailgun: {
    name: 'mailgun',
    displayName: 'Mailgun',
    apiDocsUrl: 'https://documentation.mailgun.com/',
    apiKeyUrl: 'https://app.mailgun.com/app/account/security/api_keys',
    keyPattern: /^[a-f0-9]{32}-[a-f0-9]{8}-[a-f0-9]{8}$/,
    keyHint: 'Private API key',
    setupSteps: [
      'Go to Mailgun → Account → Settings → API Security',
      'Copy your Private API key',
    ],
    baseUrl: 'https://api.mailgun.net/v3',
    authType: 'basic',
    category: 'COMMUNICATION',
  },

  postmark: {
    name: 'postmark',
    displayName: 'Postmark',
    apiDocsUrl: 'https://postmarkapp.com/developer',
    apiKeyUrl: 'https://account.postmarkapp.com/servers',
    keyPattern: /^[a-f0-9-]{36}$/,
    keyHint: 'Server API Token (UUID format)',
    setupSteps: [
      'Go to Postmark → Servers → Select Server → API Tokens',
      'Copy the Server API Token',
    ],
    baseUrl: 'https://api.postmarkapp.com',
    authType: 'api_key',
    authHeader: 'X-Postmark-Server-Token',
    testEndpoint: '/server',
    category: 'COMMUNICATION',
  },

  messagebird: {
    name: 'messagebird',
    displayName: 'MessageBird',
    apiDocsUrl: 'https://developers.messagebird.com/',
    apiKeyUrl: 'https://dashboard.messagebird.com/en/developers/access',
    keyPattern: /^[a-zA-Z0-9]{25,}$/,
    keyHint: 'Live API key',
    setupSteps: [
      'Go to MessageBird Dashboard → Developers → API Access',
      'Copy your Live API key',
    ],
    baseUrl: 'https://rest.messagebird.com',
    authType: 'api_key',
    authHeader: 'Authorization',
    testEndpoint: '/balance',
    category: 'COMMUNICATION',
  },

  plivo: {
    name: 'plivo',
    displayName: 'Plivo',
    apiDocsUrl: 'https://www.plivo.com/docs/',
    apiKeyUrl: 'https://console.plivo.com/dashboard/',
    keyPattern: /^[A-Z0-9]{20}$/,
    keyHint: 'Auth ID and Auth Token pair',
    setupSteps: [
      'Go to Plivo Console → Dashboard',
      'Copy your Auth ID and Auth Token',
    ],
    baseUrl: 'https://api.plivo.com/v1/Account',
    authType: 'basic',
    category: 'COMMUNICATION',
  },

  // === SCHEDULING ===
  calendly: {
    name: 'calendly',
    displayName: 'Calendly',
    apiDocsUrl: 'https://developer.calendly.com/',
    apiKeyUrl: 'https://calendly.com/integrations/api_webhooks',
    keyPattern: /^eyJraWQiOi[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/,
    keyHint: 'Personal access token (JWT format)',
    setupSteps: [
      'Go to Calendly → Integrations → API & Webhooks',
      'Generate a new Personal Access Token',
    ],
    baseUrl: 'https://api.calendly.com',
    authType: 'bearer',
    testEndpoint: '/users/me',
    category: 'SCHEDULING',
  },

  calcom: {
    name: 'calcom',
    displayName: 'Cal.com',
    apiDocsUrl: 'https://cal.com/docs/api-reference',
    apiKeyUrl: 'https://app.cal.com/settings/developer/api-keys',
    keyPattern: /^cal_[a-zA-Z0-9]{32,}$/,
    keyHint: 'API key (starts with cal_)',
    setupSteps: [
      'Go to Cal.com → Settings → Developer → API Keys',
      'Create a new API key',
    ],
    baseUrl: 'https://api.cal.com/v1',
    authType: 'api_key',
    testEndpoint: '/me',
    category: 'SCHEDULING',
  },

  acuity: {
    name: 'acuity',
    displayName: 'Acuity Scheduling',
    apiDocsUrl: 'https://developers.acuityscheduling.com/',
    apiKeyUrl: 'https://secure.acuityscheduling.com/app.php?key=api&action=settings',
    keyPattern: /^[a-f0-9]{32}$/,
    keyHint: 'User ID and API Key pair',
    setupSteps: [
      'Go to Acuity → Integrations → API',
      'Copy your User ID and API Key',
    ],
    baseUrl: 'https://acuityscheduling.com/api/v1',
    authType: 'basic',
    testEndpoint: '/me',
    category: 'SCHEDULING',
  },

  // === FORMS ===
  typeform: {
    name: 'typeform',
    displayName: 'Typeform',
    apiDocsUrl: 'https://developer.typeform.com/',
    apiKeyUrl: 'https://admin.typeform.com/user/tokens',
    keyPattern: /^tfp_[a-zA-Z0-9_]{40,}$/,
    keyHint: 'Personal access token (starts with tfp_)',
    setupSteps: [
      'Go to Typeform → Account → Personal tokens',
      'Generate a new token',
    ],
    baseUrl: 'https://api.typeform.com',
    authType: 'bearer',
    testEndpoint: '/me',
    category: 'FORMS',
  },

  jotform: {
    name: 'jotform',
    displayName: 'JotForm',
    apiDocsUrl: 'https://api.jotform.com/docs/',
    apiKeyUrl: 'https://www.jotform.com/myaccount/api',
    keyPattern: /^[a-f0-9]{32}$/,
    keyHint: '32 character API key',
    setupSteps: [
      'Go to JotForm → Settings → API',
      'Create a new API key',
    ],
    baseUrl: 'https://api.jotform.com',
    authType: 'api_key',
    testEndpoint: '/user',
    category: 'FORMS',
  },

  tally: {
    name: 'tally',
    displayName: 'Tally',
    apiDocsUrl: 'https://tally.so/help/integrations/webhooks',
    keyPattern: /^[a-zA-Z0-9]{20,}$/,
    keyHint: 'API key from settings',
    setupSteps: [
      'Go to Tally → Workspace Settings → API',
      'Copy your API key',
    ],
    baseUrl: 'https://api.tally.so',
    authType: 'bearer',
    category: 'FORMS',
  },

  // === SURVEYS ===
  surveymonkey: {
    name: 'surveymonkey',
    displayName: 'SurveyMonkey',
    apiDocsUrl: 'https://developer.surveymonkey.com/',
    apiKeyUrl: 'https://developer.surveymonkey.com/apps/',
    keyPattern: /^[a-zA-Z0-9_-]{40,}$/,
    keyHint: 'Access token from app settings',
    setupSteps: [
      'Go to SurveyMonkey Developer Portal',
      'Create an app or use existing',
      'Copy the access token',
    ],
    baseUrl: 'https://api.surveymonkey.com/v3',
    authType: 'bearer',
    testEndpoint: '/users/me',
    category: 'SURVEYS',
  },

  delighted: {
    name: 'delighted',
    displayName: 'Delighted',
    apiDocsUrl: 'https://delighted.com/docs/api',
    apiKeyUrl: 'https://delighted.com/integrations/api',
    keyPattern: /^[a-zA-Z0-9]{32,}$/,
    keyHint: 'API key from integrations',
    setupSteps: [
      'Go to Delighted → Integrations → API',
      'Copy your API key',
    ],
    baseUrl: 'https://api.delighted.com/v1',
    authType: 'basic',
    testEndpoint: '/metrics.json',
    category: 'SURVEYS',
  },

  hotjar: {
    name: 'hotjar',
    displayName: 'Hotjar',
    apiDocsUrl: 'https://help.hotjar.com/hc/en-us/articles/360034378394-API-Reference',
    keyPattern: /^[a-zA-Z0-9]{32,}$/,
    keyHint: 'Personal API token',
    setupSteps: [
      'Go to Hotjar → Settings → Personal → API Key',
      'Generate a new key',
    ],
    baseUrl: 'https://insights.hotjar.com/api/v2',
    authType: 'bearer',
    category: 'SURVEYS',
  },

  // === SOCIAL MEDIA ===
  buffer: {
    name: 'buffer',
    displayName: 'Buffer',
    apiDocsUrl: 'https://buffer.com/developers/api',
    apiKeyUrl: 'https://buffer.com/developers/apps',
    keyPattern: /^[0-9]\/[a-f0-9]{32}$/,
    keyHint: 'Access token from app',
    setupSteps: [
      'Go to Buffer Developer Portal',
      'Create an app',
      'Copy the access token',
    ],
    baseUrl: 'https://api.bufferapp.com/1',
    authType: 'api_key',
    testEndpoint: '/user.json',
    category: 'SOCIAL',
  },

  // === VIDEO ===
  loom: {
    name: 'loom',
    displayName: 'Loom',
    apiDocsUrl: 'https://dev.loom.com/',
    apiKeyUrl: 'https://www.loom.com/my-account/developer',
    keyPattern: /^[a-f0-9]{32,}$/,
    keyHint: 'Developer API key',
    setupSteps: [
      'Go to Loom → Account Settings → Developer',
      'Generate a new API key',
    ],
    baseUrl: 'https://www.loom.com/v1',
    authType: 'bearer',
    category: 'VIDEO',
  },

  wistia: {
    name: 'wistia',
    displayName: 'Wistia',
    apiDocsUrl: 'https://wistia.com/support/developers/data-api',
    apiKeyUrl: 'https://wistia.com/support/developers/data-api',
    keyPattern: /^[a-f0-9]{64}$/,
    keyHint: '64 character API token',
    setupSteps: [
      'Log into Wistia',
      'Go to Account Settings → API Access',
      'Create a new access token',
      'Copy the token',
    ],
    baseUrl: 'https://api.wistia.com/v1',
    authType: 'bearer',
    testEndpoint: '/account.json',
    category: 'VIDEO',
  },

  mux: {
    name: 'mux',
    displayName: 'Mux',
    apiDocsUrl: 'https://docs.mux.com/',
    apiKeyUrl: 'https://dashboard.mux.com/settings/access-tokens',
    keyPattern: /^[a-f0-9-]{36}$/,
    keyHint: 'Token ID and Secret pair',
    setupSteps: [
      'Go to Mux Dashboard → Settings → Access Tokens',
      'Create a new token',
      'Copy Token ID and Secret',
    ],
    baseUrl: 'https://api.mux.com',
    authType: 'basic',
    category: 'VIDEO',
  },

  // === DOCUMENT SIGNING ===
  docusign: {
    name: 'docusign',
    displayName: 'DocuSign',
    apiDocsUrl: 'https://developers.docusign.com/',
    apiKeyUrl: 'https://admindemo.docusign.com/api-integrator-key',
    keyPattern: /^[a-f0-9-]{36}$/,
    keyHint: 'Integration Key (UUID format)',
    setupSteps: [
      'Go to DocuSign Admin → API and Keys',
      'Add or select an Integrator Key',
      'Generate access token',
    ],
    baseUrl: 'https://demo.docusign.net/restapi/v2.1',
    authType: 'bearer',
    category: 'DOCUMENTS',
  },

  hellosign: {
    name: 'hellosign',
    displayName: 'HelloSign (Dropbox Sign)',
    apiDocsUrl: 'https://developers.hellosign.com/',
    apiKeyUrl: 'https://app.hellosign.com/home/myAccount#api',
    keyPattern: /^[a-f0-9]{64}$/,
    keyHint: '64 character API key',
    setupSteps: [
      'Go to HelloSign → Settings → API',
      'Copy your API key',
    ],
    baseUrl: 'https://api.hellosign.com/v3',
    authType: 'basic',
    testEndpoint: '/account',
    category: 'DOCUMENTS',
  },

  pandadoc: {
    name: 'pandadoc',
    displayName: 'PandaDoc',
    apiDocsUrl: 'https://developers.pandadoc.com/',
    apiKeyUrl: 'https://app.pandadoc.com/a/#/settings/integrations/api',
    keyPattern: /^[a-f0-9]{64}$/,
    keyHint: 'API Key from settings',
    setupSteps: [
      'Go to PandaDoc → Settings → Integrations → API',
      'Create a new API key',
    ],
    baseUrl: 'https://api.pandadoc.com/public/v1',
    authType: 'api_key',
    authHeader: 'Authorization',
    category: 'DOCUMENTS',
  },

  // === FILE STORAGE ===
  box: {
    name: 'box',
    displayName: 'Box',
    apiDocsUrl: 'https://developer.box.com/',
    apiKeyUrl: 'https://app.box.com/developers/console',
    keyPattern: /^[a-zA-Z0-9]{32}$/,
    keyHint: 'Developer token or OAuth token',
    setupSteps: [
      'Go to Box Developer Console',
      'Create or select an app',
      'Generate a developer token',
    ],
    baseUrl: 'https://api.box.com/2.0',
    authType: 'bearer',
    testEndpoint: '/users/me',
    category: 'STORAGE',
  },

  cloudinary: {
    name: 'cloudinary',
    displayName: 'Cloudinary',
    apiDocsUrl: 'https://cloudinary.com/documentation/',
    apiKeyUrl: 'https://cloudinary.com/console/settings/security',
    keyPattern: /^[0-9]{15}$/,
    keyHint: 'API Key and Secret pair',
    setupSteps: [
      'Go to Cloudinary Console → Settings → Security',
      'Copy your API Key and API Secret',
    ],
    baseUrl: 'https://api.cloudinary.com/v1_1',
    authType: 'basic',
    category: 'STORAGE',
  },

  uploadcare: {
    name: 'uploadcare',
    displayName: 'Uploadcare',
    apiDocsUrl: 'https://uploadcare.com/docs/start/',
    apiKeyUrl: 'https://app.uploadcare.com/projects/-/api-keys/',
    keyPattern: /^[a-f0-9]{20}$/,
    keyHint: 'Public key and Secret key pair',
    setupSteps: [
      'Go to Uploadcare → Project → API Keys',
      'Copy your Public Key and Secret Key',
    ],
    baseUrl: 'https://api.uploadcare.com',
    authType: 'api_key',
    authHeader: 'Authorization',
    category: 'STORAGE',
  },

  // === SEARCH ===
  algolia: {
    name: 'algolia',
    displayName: 'Algolia',
    apiDocsUrl: 'https://www.algolia.com/doc/',
    apiKeyUrl: 'https://dashboard.algolia.com/account/api-keys',
    keyPattern: /^[a-f0-9]{32}$/,
    keyHint: 'Admin API Key (32 characters)',
    setupSteps: [
      'Go to Algolia Dashboard → Settings → API Keys',
      'Copy your Admin API Key and Application ID',
    ],
    baseUrl: 'https://yourappid-dsn.algolia.net',
    authType: 'api_key',
    authHeader: 'X-Algolia-API-Key',
    category: 'SEARCH',
  },

  meilisearch: {
    name: 'meilisearch',
    displayName: 'Meilisearch',
    apiDocsUrl: 'https://docs.meilisearch.com/',
    keyPattern: /^[a-f0-9]{64}$/,
    keyHint: 'Master key or API key',
    setupSteps: [
      'Deploy Meilisearch with a master key',
      'Or create an API key via the API',
    ],
    baseUrl: 'http://localhost:7700',
    authType: 'bearer',
    testEndpoint: '/health',
    category: 'SEARCH',
  },

  // === AI/ML ===
  openai: {
    name: 'openai',
    displayName: 'OpenAI',
    apiDocsUrl: 'https://platform.openai.com/docs/',
    apiKeyUrl: 'https://platform.openai.com/api-keys',
    keyPattern: /^sk-[a-zA-Z0-9]{48}$/,
    keyHint: 'API key (starts with sk-)',
    setupSteps: [
      'Go to OpenAI Platform → API Keys',
      'Create a new secret key',
    ],
    baseUrl: 'https://api.openai.com/v1',
    authType: 'bearer',
    testEndpoint: '/models',
    category: 'AI',
  },

  anthropic: {
    name: 'anthropic',
    displayName: 'Anthropic (Claude)',
    apiDocsUrl: 'https://docs.anthropic.com/',
    apiKeyUrl: 'https://console.anthropic.com/settings/keys',
    keyPattern: /^sk-ant-[a-zA-Z0-9-]{90,}$/,
    keyHint: 'API key (starts with sk-ant-)',
    setupSteps: [
      'Go to Anthropic Console → API Keys',
      'Create a new key',
    ],
    baseUrl: 'https://api.anthropic.com/v1',
    authType: 'api_key',
    authHeader: 'x-api-key',
    category: 'AI',
  },

  replicate: {
    name: 'replicate',
    displayName: 'Replicate',
    apiDocsUrl: 'https://replicate.com/docs/',
    apiKeyUrl: 'https://replicate.com/account/api-tokens',
    keyPattern: /^r8_[a-zA-Z0-9]{37}$/,
    keyHint: 'API token (starts with r8_)',
    setupSteps: [
      'Go to Replicate → Account → API Tokens',
      'Create a new token',
    ],
    baseUrl: 'https://api.replicate.com/v1',
    authType: 'bearer',
    testEndpoint: '/account',
    category: 'AI',
  },

  // === DATABASE ===
  supabase_external: {
    name: 'supabase_external',
    displayName: 'Supabase (External)',
    apiDocsUrl: 'https://supabase.com/docs/guides/api',
    apiKeyUrl: 'https://app.supabase.com/project/_/settings/api',
    keyPattern: /^eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/,
    keyHint: 'Service role key (JWT format)',
    setupSteps: [
      'Go to Supabase Project → Settings → API',
      'Copy the service_role key (NOT anon key)',
    ],
    baseUrl: 'https://yourproject.supabase.co/rest/v1',
    authType: 'api_key',
    authHeader: 'apikey',
    category: 'DATABASE',
  },

  planetscale: {
    name: 'planetscale',
    displayName: 'PlanetScale',
    apiDocsUrl: 'https://planetscale.com/docs/concepts/api-overview',
    apiKeyUrl: 'https://app.planetscale.com/settings/service-tokens',
    keyPattern: /^pscale_tkn_[a-zA-Z0-9_-]{40,}$/,
    keyHint: 'Service token (starts with pscale_tkn_)',
    setupSteps: [
      'Go to PlanetScale → Organization Settings → Service Tokens',
      'Create a new token',
    ],
    baseUrl: 'https://api.planetscale.com/v1',
    authType: 'bearer',
    category: 'DATABASE',
  },

  neon: {
    name: 'neon',
    displayName: 'Neon',
    apiDocsUrl: 'https://neon.tech/docs/reference/api-reference',
    apiKeyUrl: 'https://console.neon.tech/app/settings/api-keys',
    keyPattern: /^[a-zA-Z0-9]{64}$/,
    keyHint: 'API key from settings',
    setupSteps: [
      'Go to Neon Console → Account Settings → API Keys',
      'Create a new API key',
    ],
    baseUrl: 'https://console.neon.tech/api/v2',
    authType: 'bearer',
    testEndpoint: '/projects',
    category: 'DATABASE',
  },
}

export interface StoredCredential {
  userId: string
  appName: string
  apiKey: string
  additionalConfig?: Record<string, string> // For things like company subdomain
  createdAt: Date
  lastUsed?: Date
  isValid: boolean
}

export interface APIKeyValidationResult {
  valid: boolean
  formatValid: boolean
  connectionValid?: boolean
  error?: string
  hint?: string
}

export interface SetupFlowState {
  appName: string
  appInfo: AppAPIInfo
  apiDocsOpened: boolean
  awaitingKey: boolean
  keyValidated: boolean
}

// App name aliases - map common variations to their canonical KNOWN_APP_APIS key
// EXPANDED ALIASES DATABASE - Comprehensive name mappings (Jan 21, 2026)
// DO NOT DELETE - This section is protected by CRITICAL_FIXES.md
const APP_NAME_ALIASES: Record<string, string> = {
  // ========== CRM ALIASES ==========
  'pipeline': 'pipeline_crm',
  'pipelinecrm': 'pipeline_crm',
  'pipelines': 'pipeline_crm',
  'pipelines_crm': 'pipeline_crm',
  'close.io': 'close',
  'closeio': 'close',
  'close_io': 'close',
  'fresh_sales': 'freshsales',
  'zohocrm': 'zoho_crm',
  'zoho': 'zoho_crm',
  'agilecrm': 'agile_crm',
  'agile': 'agile_crm',
  'capsulecrm': 'capsule',
  'nutshellcrm': 'nutshell',
  'streakcrm': 'streak',
  'streak_crm': 'streak',

  // ========== ACCOUNTING ALIASES ==========
  'wave_accounting': 'wave',
  'waveapps': 'wave',
  'fresh_books': 'freshbooks',

  // ========== MARKETING ALIASES ==========
  'mailchimp_email': 'mailchimp',
  'active_campaign': 'activecampaign',
  'convert_kit': 'convertkit',
  'get_response': 'getresponse',
  'sendinblue': 'brevo',  // Rebranded from Sendinblue
  'send_in_blue': 'brevo',
  'constant_contact': 'constantcontact',
  'constantcontact_email': 'constantcontact',
  'campaign_monitor': 'campaignmonitor',
  'mail_jet': 'mailjet',
  'customer_io': 'customerio',
  'customer.io': 'customerio',

  // ========== E-COMMERCE ALIASES ==========
  'woo': 'woocommerce',
  'woo_commerce': 'woocommerce',
  'bigcom': 'bigcommerce',
  'big_commerce': 'bigcommerce',
  'gum_road': 'gumroad',
  'lemon_squeezy': 'lemonsqueezy',
  'lemon': 'lemonsqueezy',
  'think_ific': 'thinkific',
  'square_space': 'squarespace',
  'ecwid_store': 'ecwid',

  // ========== PROJECT MANAGEMENT ALIASES ==========
  'basecamp3': 'basecamp',
  'basecamp_3': 'basecamp',
  'monday.com': 'monday',
  'mondaycom': 'monday',
  'click_up': 'clickup',
  'smart_sheet': 'smartsheet',
  'air_table': 'airtable',
  'notion_database': 'notion_api',
  'notionapi': 'notion_api',
  'coda_doc': 'coda',
  'linearapp': 'linear',
  'linear_app': 'linear',
  'height_app': 'height',

  // ========== SUPPORT ALIASES ==========
  'fresh_desk': 'freshdesk',
  'help_scout': 'helpscout',
  'helpscoutapp': 'helpscout',
  'intercomio': 'intercom',
  'intercom_io': 'intercom',
  'groovehq': 'groove',
  'groove_hq': 'groove',
  'live_chat': 'livechat',
  'livechatinc': 'livechat',
  'tidio_chat': 'tidio',
  'frontapp': 'front',
  'front_app': 'front',
  'kayako_help': 'kayako',

  // ========== HR ALIASES ==========
  'bamboo': 'bamboohr',
  'bamboo_hr': 'bamboohr',
  'gustohq': 'gusto',
  'gusto_hr': 'gusto',
  'rippling_hr': 'rippling',
  'personio_hr': 'personio',
  'deelhq': 'deel',
  'deel_hr': 'deel',
  'factorial_hr': 'factorial',
  'hi_bob': 'hibob',
  'hibobhr': 'hibob',

  // ========== ANALYTICS ALIASES ==========
  'plausible_analytics': 'plausible',
  'fathom_analytics': 'fathom',
  'simple_analytics': 'simpleanalytics',
  'mixpanel_analytics': 'mixpanel',
  'amplitude_analytics': 'amplitude',
  'post_hog': 'posthog',
  'posthoganalytics': 'posthog',
  'heapio': 'heap',
  'heap_analytics': 'heap',
  'juneio': 'june',
  'june_analytics': 'june',

  // ========== PAYMENTS ALIASES ==========
  'charge_bee': 'chargebee',
  'recurlyinc': 'recurly',
  'squareup': 'square',
  'square_up': 'square',
  'paypalapi': 'paypal',

  // ========== COMMUNICATION ALIASES ==========
  'twilio_sms': 'twilio',
  'twilioapi': 'twilio',
  'send_grid': 'sendgrid',
  'sendgridapi': 'sendgrid',
  'mail_gun': 'mailgun',
  'mailgunapi': 'mailgun',
  'postmarkapp': 'postmark',
  'postmark_email': 'postmark',
  'message_bird': 'messagebird',
  'plivoapi': 'plivo',

  // ========== SCHEDULING ALIASES ==========
  'calendly_schedule': 'calendly',
  'cal_com': 'calcom',
  'cal.com': 'calcom',
  'acuity_scheduling': 'acuity',
  'acuityscheduling': 'acuity',

  // ========== FORMS ALIASES ==========
  'type_form': 'typeform',
  'jot_form': 'jotform',
  'tally_so': 'tally',
  'tally.so': 'tally',

  // ========== SURVEYS ALIASES ==========
  'survey_monkey': 'surveymonkey',
  'delighted_nps': 'delighted',
  'hot_jar': 'hotjar',

  // ========== SOCIAL ALIASES ==========
  'bufferapp': 'buffer',
  'buffer_app': 'buffer',

  // ========== VIDEO ALIASES ==========
  'loomhq': 'loom',
  'loom_video': 'loom',
  'wistia_video': 'wistia',
  'mux_video': 'mux',
  'muxapi': 'mux',

  // ========== DOCUMENTS ALIASES ==========
  'docu_sign': 'docusign',
  'docusignapi': 'docusign',
  'hello_sign': 'hellosign',
  'dropbox_sign': 'hellosign',  // HelloSign rebranded to Dropbox Sign
  'panda_doc': 'pandadoc',
  'pandadocapi': 'pandadoc',

  // ========== STORAGE ALIASES ==========
  'box_storage': 'box',
  'boxapi': 'box',
  'cloudinaryapi': 'cloudinary',
  'upload_care': 'uploadcare',

  // ========== SEARCH ALIASES ==========
  'algolia_search': 'algolia',
  'algoliasearch': 'algolia',
  'meili_search': 'meilisearch',

  // ========== AI ALIASES ==========
  'openaiapi': 'openai',
  'open_ai': 'openai',
  'chatgpt': 'openai',
  'gpt': 'openai',
  'anthropicapi': 'anthropic',
  'claude': 'anthropic',
  'claude_ai': 'anthropic',
  'replicateapi': 'replicate',
  'replicate_ai': 'replicate',

  // ========== DATABASE ALIASES ==========
  'supabase_api': 'supabase_external',
  'supabaseapi': 'supabase_external',
  'planet_scale': 'planetscale',
  'planetscaledb': 'planetscale',
  'neon_db': 'neon',
  'neondb': 'neon',
  'neon_postgres': 'neon',
}

class CustomIntegrationService {
  // In-memory storage (would be encrypted Supabase in production)
  private credentials: Map<string, StoredCredential> = new Map()

  /**
   * Get API info for an app (if we know about it)
   * Supports aliases for common name variations
   */
  getAppAPIInfo(appName: string): AppAPIInfo | null {
    const normalized = appName.toLowerCase().replace(/[\s-]/g, '_')

    // First check direct match
    if (KNOWN_APP_APIS[normalized]) {
      return KNOWN_APP_APIS[normalized]
    }

    // Then check aliases
    const aliasKey = APP_NAME_ALIASES[normalized]
    if (aliasKey && KNOWN_APP_APIS[aliasKey]) {
      return KNOWN_APP_APIS[aliasKey]
    }

    return null
  }

  /**
   * Get all known apps with API info
   */
  getAllKnownApps(): AppAPIInfo[] {
    return Object.values(KNOWN_APP_APIS)
  }

  /**
   * Get apps by category
   */
  getAppsByCategory(category: string): AppAPIInfo[] {
    return Object.values(KNOWN_APP_APIS).filter(
      (app) => app.category.toLowerCase() === category.toLowerCase()
    )
  }

  /**
   * Validate API key format (doesn't test connection)
   */
  validateKeyFormat(appName: string, apiKey: string): APIKeyValidationResult {
    const appInfo = this.getAppAPIInfo(appName)

    if (!appInfo) {
      return {
        valid: false,
        formatValid: false,
        error: `Unknown app: ${appName}`,
        hint: 'This app is not in our database. You can still try the key.',
      }
    }

    if (!appInfo.keyPattern) {
      // No pattern defined, accept any non-empty key
      return {
        valid: apiKey.length > 0,
        formatValid: apiKey.length > 0,
        hint: appInfo.keyHint,
      }
    }

    const formatValid = appInfo.keyPattern.test(apiKey)

    return {
      valid: formatValid,
      formatValid,
      error: formatValid ? undefined : `Key doesn't match expected format`,
      hint: appInfo.keyHint,
    }
  }

  /**
   * Test if an API key actually works by making a test request
   */
  async testConnection(appName: string, apiKey: string, additionalConfig?: Record<string, string>): Promise<APIKeyValidationResult> {
    const appInfo = this.getAppAPIInfo(appName)

    if (!appInfo) {
      return {
        valid: false,
        formatValid: false,
        error: `Unknown app: ${appName}`,
      }
    }

    // First validate format
    const formatResult = this.validateKeyFormat(appName, apiKey)
    if (!formatResult.formatValid) {
      return formatResult
    }

    // If no test endpoint, just return format validation
    if (!appInfo.testEndpoint) {
      return {
        valid: true,
        formatValid: true,
        hint: 'Key format is valid. Connection test not available for this app.',
      }
    }

    try {
      // Build the request
      let baseUrl = appInfo.baseUrl
      if (additionalConfig?.baseUrl) {
        baseUrl = additionalConfig.baseUrl
      }

      const url = `${baseUrl}${appInfo.testEndpoint}`
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      // Set auth header based on auth type
      switch (appInfo.authType) {
        case 'bearer':
          headers['Authorization'] = `Bearer ${apiKey}`
          break
        case 'api_key':
          headers[appInfo.authHeader || 'X-API-Key'] = apiKey
          break
        case 'basic':
          const credentials = Buffer.from(`${apiKey}:`).toString('base64')
          headers['Authorization'] = `Basic ${credentials}`
          break
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
      })

      if (response.ok || response.status === 401 || response.status === 403) {
        // 401/403 means the endpoint exists but key is wrong
        const connectionValid = response.ok

        return {
          valid: connectionValid,
          formatValid: true,
          connectionValid,
          error: connectionValid ? undefined : 'API key was rejected by the server',
          hint: connectionValid ? 'Connection successful!' : 'Key format is correct but was rejected. Check if the key has the right permissions.',
        }
      }

      return {
        valid: false,
        formatValid: true,
        connectionValid: false,
        error: `API returned status ${response.status}`,
      }
    } catch (error) {
      return {
        valid: false,
        formatValid: true,
        connectionValid: false,
        error: `Connection failed: ${error instanceof Error ? error.message : String(error)}`,
        hint: 'Could not reach the API. Check if the URL is correct.',
      }
    }
  }

  /**
   * Save user credentials (encrypted in production)
   */
  saveCredentials(userId: string, appName: string, apiKey: string, additionalConfig?: Record<string, string>): void {
    const key = `${userId}:${appName}`
    this.credentials.set(key, {
      userId,
      appName,
      apiKey,
      additionalConfig,
      createdAt: new Date(),
      isValid: true,
    })
    console.log(`[CustomIntegration] Saved credentials for ${appName} (user: ${userId})`)
  }

  /**
   * Get stored credentials
   */
  getCredentials(userId: string, appName: string): StoredCredential | null {
    const key = `${userId}:${appName}`
    return this.credentials.get(key) || null
  }

  /**
   * Check if user has credentials for an app
   */
  hasCredentials(userId: string, appName: string): boolean {
    return this.getCredentials(userId, appName) !== null
  }

  /**
   * Delete stored credentials
   */
  deleteCredentials(userId: string, appName: string): boolean {
    const key = `${userId}:${appName}`
    return this.credentials.delete(key)
  }

  /**
   * Execute an API request using stored credentials
   */
  async executeRequest(
    userId: string,
    appName: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    endpoint: string,
    body?: Record<string, unknown>
  ): Promise<{ success: boolean; data?: unknown; error?: string }> {
    const credentials = this.getCredentials(userId, appName)
    if (!credentials) {
      return { success: false, error: `No credentials found for ${appName}` }
    }

    const appInfo = this.getAppAPIInfo(appName)
    if (!appInfo) {
      return { success: false, error: `Unknown app: ${appName}` }
    }

    try {
      let baseUrl = appInfo.baseUrl
      if (credentials.additionalConfig?.baseUrl) {
        baseUrl = credentials.additionalConfig.baseUrl
      }

      const url = `${baseUrl}${endpoint}`
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      // Set auth header based on auth type
      switch (appInfo.authType) {
        case 'bearer':
          headers['Authorization'] = `Bearer ${credentials.apiKey}`
          break
        case 'api_key':
          headers[appInfo.authHeader || 'X-API-Key'] = credentials.apiKey
          break
        case 'basic':
          const creds = Buffer.from(`${credentials.apiKey}:`).toString('base64')
          headers['Authorization'] = `Basic ${creds}`
          break
      }

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      })

      // Update last used
      credentials.lastUsed = new Date()

      if (!response.ok) {
        return {
          success: false,
          error: `API returned ${response.status}: ${response.statusText}`,
        }
      }

      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: `Request failed: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }

  /**
   * Generate the setup flow response for chat UI
   */
  generateSetupResponse(appName: string): {
    found: boolean
    appInfo?: AppAPIInfo
    message: string
    setupCard?: {
      type: 'api_key_acquisition'
      appName: string
      displayName: string
      apiDocsUrl: string
      apiKeyUrl?: string
      steps: string[]
      keyHint: string
    }
  } {
    const appInfo = this.getAppAPIInfo(appName)

    if (!appInfo) {
      return {
        found: false,
        message: `I don't have API documentation for "${appName}" in my database yet. You can try searching for "${appName} API documentation" online, or I can help you find alternatives with native support.`,
      }
    }

    return {
      found: true,
      appInfo,
      message: `I can help you connect ${appInfo.displayName}! Click below to get your API key, then paste it here.`,
      setupCard: {
        type: 'api_key_acquisition',
        appName: appInfo.name,
        displayName: appInfo.displayName,
        apiDocsUrl: appInfo.apiDocsUrl,
        apiKeyUrl: appInfo.apiKeyUrl || appInfo.apiDocsUrl,
        steps: appInfo.setupSteps,
        keyHint: appInfo.keyHint,
      },
    }
  }
}

export const customIntegrationService = new CustomIntegrationService()
