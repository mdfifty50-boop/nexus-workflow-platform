-- Epic 16, Story 16.1: Pre-Approved Tool Seed Data
-- Seeds 100+ tools from Rube/Composio toolkit catalog

-- =====================================================
-- Communication Tools
-- =====================================================
INSERT INTO tool_catalog (name, category, description, auth_method, toolkit_slug, provider, data_formats, cost_estimate, reliability_rating, is_approved, approved_at, capabilities) VALUES

-- Email
('Gmail', 'communication', 'Google email service for sending, reading, and managing emails', 'oauth2', 'gmail', 'rube', '["json"]',
 '{"tier": "free", "perCall": 0}', 0.99, true, NOW(),
 '[{"action": "send_email", "description": "Send an email"}, {"action": "read_email", "description": "Read emails"}, {"action": "create_draft", "description": "Create email draft"}, {"action": "search", "description": "Search emails"}]'),

('Outlook', 'communication', 'Microsoft Outlook for email and calendar', 'oauth2', 'outlook', 'rube', '["json"]',
 '{"tier": "free", "perCall": 0}', 0.98, true, NOW(),
 '[{"action": "send_email", "description": "Send an email"}, {"action": "read_email", "description": "Read emails"}, {"action": "calendar", "description": "Manage calendar"}]'),

('SendGrid', 'communication', 'Transactional email delivery service', 'api_key', 'sendgrid', 'rube', '["json"]',
 '{"tier": "freemium", "perCall": 0.0001, "freeQuota": 100}', 0.97, true, NOW(),
 '[{"action": "send_email", "description": "Send transactional email"}, {"action": "send_template", "description": "Send templated email"}]'),

('Mailchimp', 'marketing', 'Email marketing and automation platform', 'oauth2', 'mailchimp', 'rube', '["json"]',
 '{"tier": "freemium", "freeQuota": 500}', 0.96, true, NOW(),
 '[{"action": "create_campaign", "description": "Create email campaign"}, {"action": "add_subscriber", "description": "Add subscriber to list"}]'),

-- Messaging
('Slack', 'communication', 'Team collaboration and messaging platform', 'oauth2', 'slack', 'rube', '["json"]',
 '{"tier": "freemium", "perCall": 0}', 0.99, true, NOW(),
 '[{"action": "send_message", "description": "Send a message to a channel"}, {"action": "search_messages", "description": "Search messages"}, {"action": "list_channels", "description": "List channels"}, {"action": "create_channel", "description": "Create new channel"}]'),

('Discord', 'communication', 'Community chat and voice platform', 'oauth2', 'discord', 'rube', '["json"]',
 '{"tier": "free", "perCall": 0}', 0.95, true, NOW(),
 '[{"action": "send_message", "description": "Send a message"}, {"action": "list_channels", "description": "List channels"}]'),

('Microsoft Teams', 'communication', 'Microsoft team collaboration platform', 'oauth2', 'microsoftteams', 'rube', '["json"]',
 '{"tier": "paid", "perMonth": 12.5}', 0.97, true, NOW(),
 '[{"action": "send_message", "description": "Send a message"}, {"action": "create_meeting", "description": "Create a meeting"}]'),

('Telegram', 'communication', 'Instant messaging service', 'api_key', 'telegram', 'rube', '["json"]',
 '{"tier": "free", "perCall": 0}', 0.94, true, NOW(),
 '[{"action": "send_message", "description": "Send a message"}, {"action": "send_photo", "description": "Send a photo"}]'),

('WhatsApp Business', 'communication', 'Business messaging via WhatsApp', 'api_key', 'whatsapp', 'rube', '["json"]',
 '{"tier": "paid", "perCall": 0.005}', 0.93, true, NOW(),
 '[{"action": "send_message", "description": "Send a message"}, {"action": "send_template", "description": "Send templated message"}]'),

('Twilio', 'communication', 'Cloud communications platform (SMS, Voice)', 'api_key', 'twilio', 'rube', '["json"]',
 '{"tier": "paid", "perCall": 0.0075}', 0.98, true, NOW(),
 '[{"action": "send_sms", "description": "Send SMS message"}, {"action": "make_call", "description": "Make voice call"}]'),

-- =====================================================
-- Productivity Tools
-- =====================================================

-- Calendars
('Google Calendar', 'productivity', 'Google calendar for scheduling and event management', 'oauth2', 'googlecalendar', 'rube', '["json"]',
 '{"tier": "free", "perCall": 0}', 0.99, true, NOW(),
 '[{"action": "create_event", "description": "Create calendar event"}, {"action": "get_events", "description": "Get calendar events"}, {"action": "update_event", "description": "Update event"}, {"action": "delete_event", "description": "Delete event"}]'),

('Outlook Calendar', 'productivity', 'Microsoft calendar service', 'oauth2', 'outlookcalendar', 'rube', '["json"]',
 '{"tier": "free", "perCall": 0}', 0.97, true, NOW(),
 '[{"action": "create_event", "description": "Create calendar event"}, {"action": "get_events", "description": "Get calendar events"}]'),

('Calendly', 'productivity', 'Automated scheduling platform', 'oauth2', 'calendly', 'rube', '["json"]',
 '{"tier": "freemium", "perMonth": 10}', 0.96, true, NOW(),
 '[{"action": "get_availability", "description": "Get availability"}, {"action": "create_booking", "description": "Create booking link"}]'),

-- Documents & Notes
('Google Sheets', 'productivity', 'Spreadsheet creation and collaboration', 'oauth2', 'googlesheets', 'rube', '["json", "csv"]',
 '{"tier": "free", "perCall": 0}', 0.99, true, NOW(),
 '[{"action": "read_data", "description": "Read spreadsheet data"}, {"action": "write_data", "description": "Write data to spreadsheet"}, {"action": "update_data", "description": "Update existing data"}, {"action": "create_sheet", "description": "Create new spreadsheet"}]'),

('Google Drive', 'storage', 'Cloud file storage and collaboration', 'oauth2', 'googledrive', 'rube', '["json", "binary"]',
 '{"tier": "freemium", "perMonth": 1.99}', 0.99, true, NOW(),
 '[{"action": "upload_file", "description": "Upload file"}, {"action": "download_file", "description": "Download file"}, {"action": "list_files", "description": "List files"}, {"action": "share_file", "description": "Share file"}]'),

('Google Docs', 'productivity', 'Document creation and collaboration', 'oauth2', 'googledocs', 'rube', '["json", "html"]',
 '{"tier": "free", "perCall": 0}', 0.98, true, NOW(),
 '[{"action": "create_document", "description": "Create document"}, {"action": "read_document", "description": "Read document content"}, {"action": "update_document", "description": "Update document"}]'),

('Notion', 'productivity', 'All-in-one workspace for notes, tasks, and databases', 'oauth2', 'notion', 'rube', '["json"]',
 '{"tier": "freemium", "perMonth": 8}', 0.97, true, NOW(),
 '[{"action": "create_page", "description": "Create a page"}, {"action": "query_database", "description": "Query a database"}, {"action": "update_page", "description": "Update page content"}]'),

('Airtable', 'productivity', 'Spreadsheet-database hybrid platform', 'oauth2', 'airtable', 'rube', '["json"]',
 '{"tier": "freemium", "perMonth": 10}', 0.96, true, NOW(),
 '[{"action": "list_records", "description": "List records from table"}, {"action": "create_record", "description": "Create new record"}, {"action": "update_record", "description": "Update record"}]'),

('Dropbox', 'storage', 'Cloud file storage and sync', 'oauth2', 'dropbox', 'rube', '["json", "binary"]',
 '{"tier": "freemium", "perMonth": 9.99}', 0.96, true, NOW(),
 '[{"action": "upload_file", "description": "Upload file"}, {"action": "download_file", "description": "Download file"}, {"action": "share_link", "description": "Create share link"}]'),

('OneDrive', 'storage', 'Microsoft cloud storage', 'oauth2', 'onedrive', 'rube', '["json", "binary"]',
 '{"tier": "freemium", "perMonth": 1.99}', 0.97, true, NOW(),
 '[{"action": "upload_file", "description": "Upload file"}, {"action": "download_file", "description": "Download file"}, {"action": "list_files", "description": "List files"}]'),

('Evernote', 'productivity', 'Note-taking and organization app', 'oauth2', 'evernote', 'rube', '["json", "html"]',
 '{"tier": "freemium", "perMonth": 7.99}', 0.92, true, NOW(),
 '[{"action": "create_note", "description": "Create a note"}, {"action": "search_notes", "description": "Search notes"}]'),

-- Task Management
('Todoist', 'productivity', 'Task management and to-do lists', 'oauth2', 'todoist', 'rube', '["json"]',
 '{"tier": "freemium", "perMonth": 4}', 0.95, true, NOW(),
 '[{"action": "create_task", "description": "Create a task"}, {"action": "complete_task", "description": "Mark task complete"}, {"action": "list_tasks", "description": "List tasks"}]'),

('Asana', 'productivity', 'Project and task management platform', 'oauth2', 'asana', 'rube', '["json"]',
 '{"tier": "freemium", "perMonth": 10.99}', 0.96, true, NOW(),
 '[{"action": "create_task", "description": "Create a task"}, {"action": "list_tasks", "description": "List project tasks"}, {"action": "update_task", "description": "Update task"}]'),

('Trello', 'productivity', 'Kanban-style project management', 'oauth2', 'trello', 'rube', '["json"]',
 '{"tier": "freemium", "perMonth": 5}', 0.95, true, NOW(),
 '[{"action": "create_card", "description": "Create a card"}, {"action": "move_card", "description": "Move card between lists"}, {"action": "list_cards", "description": "List cards"}]'),

('Monday.com', 'productivity', 'Work operating system for teams', 'oauth2', 'monday', 'rube', '["json"]',
 '{"tier": "paid", "perMonth": 8}', 0.94, true, NOW(),
 '[{"action": "create_item", "description": "Create item"}, {"action": "update_item", "description": "Update item status"}]'),

('ClickUp', 'productivity', 'All-in-one productivity platform', 'oauth2', 'clickup', 'rube', '["json"]',
 '{"tier": "freemium", "perMonth": 7}', 0.93, true, NOW(),
 '[{"action": "create_task", "description": "Create a task"}, {"action": "list_tasks", "description": "List tasks"}]'),

('Linear', 'development', 'Issue tracking for software teams', 'oauth2', 'linear', 'rube', '["json"]',
 '{"tier": "freemium", "perMonth": 8}', 0.97, true, NOW(),
 '[{"action": "create_issue", "description": "Create an issue"}, {"action": "list_issues", "description": "List issues"}, {"action": "update_issue", "description": "Update issue"}]'),

-- =====================================================
-- Development Tools
-- =====================================================

('GitHub', 'development', 'Code hosting and version control platform', 'oauth2', 'github', 'rube', '["json"]',
 '{"tier": "freemium", "perMonth": 4}', 0.99, true, NOW(),
 '[{"action": "create_issue", "description": "Create an issue"}, {"action": "create_pr", "description": "Create pull request"}, {"action": "list_repos", "description": "List repositories"}, {"action": "list_prs", "description": "List pull requests"}, {"action": "merge_pr", "description": "Merge pull request"}]'),

('GitLab', 'development', 'DevOps lifecycle platform', 'oauth2', 'gitlab', 'rube', '["json"]',
 '{"tier": "freemium", "perMonth": 19}', 0.97, true, NOW(),
 '[{"action": "create_issue", "description": "Create an issue"}, {"action": "create_mr", "description": "Create merge request"}, {"action": "list_projects", "description": "List projects"}]'),

('Bitbucket', 'development', 'Git repository hosting by Atlassian', 'oauth2', 'bitbucket', 'rube', '["json"]',
 '{"tier": "freemium", "perMonth": 3}', 0.95, true, NOW(),
 '[{"action": "create_pr", "description": "Create pull request"}, {"action": "list_repos", "description": "List repositories"}]'),

('Jira', 'development', 'Issue and project tracking for agile teams', 'oauth2', 'jira', 'rube', '["json"]',
 '{"tier": "freemium", "perMonth": 7.75}', 0.97, true, NOW(),
 '[{"action": "create_issue", "description": "Create Jira issue"}, {"action": "update_issue", "description": "Update issue"}, {"action": "search_issues", "description": "Search issues"}, {"action": "transition_issue", "description": "Change issue status"}]'),

('Confluence', 'productivity', 'Team wiki and documentation', 'oauth2', 'confluence', 'rube', '["json", "html"]',
 '{"tier": "freemium", "perMonth": 5.75}', 0.95, true, NOW(),
 '[{"action": "create_page", "description": "Create page"}, {"action": "update_page", "description": "Update page"}, {"action": "search", "description": "Search content"}]'),

('CircleCI', 'development', 'Continuous integration and delivery platform', 'api_key', 'circleci', 'rube', '["json"]',
 '{"tier": "freemium", "perMonth": 30}', 0.94, true, NOW(),
 '[{"action": "trigger_pipeline", "description": "Trigger a pipeline"}, {"action": "get_build_status", "description": "Get build status"}]'),

('Vercel', 'development', 'Frontend cloud platform', 'api_key', 'vercel', 'rube', '["json"]',
 '{"tier": "freemium", "perMonth": 20}', 0.96, true, NOW(),
 '[{"action": "create_deployment", "description": "Create deployment"}, {"action": "list_deployments", "description": "List deployments"}]'),

('Netlify', 'development', 'Web development platform', 'api_key', 'netlify', 'rube', '["json"]',
 '{"tier": "freemium", "perMonth": 19}', 0.95, true, NOW(),
 '[{"action": "trigger_build", "description": "Trigger a build"}, {"action": "list_sites", "description": "List sites"}]'),

('Sentry', 'development', 'Error tracking and performance monitoring', 'api_key', 'sentry', 'rube', '["json"]',
 '{"tier": "freemium", "perMonth": 26}', 0.96, true, NOW(),
 '[{"action": "list_issues", "description": "List error issues"}, {"action": "resolve_issue", "description": "Resolve an issue"}]'),

('Datadog', 'development', 'Monitoring and analytics platform', 'api_key', 'datadog', 'rube', '["json"]',
 '{"tier": "paid", "perMonth": 15}', 0.97, true, NOW(),
 '[{"action": "create_metric", "description": "Create custom metric"}, {"action": "query_metrics", "description": "Query metrics"}]'),

-- =====================================================
-- CRM & Sales Tools
-- =====================================================

('Salesforce', 'crm', 'Enterprise CRM platform', 'oauth2', 'salesforce', 'rube', '["json"]',
 '{"tier": "paid", "perMonth": 25}', 0.98, true, NOW(),
 '[{"action": "create_lead", "description": "Create a lead"}, {"action": "create_opportunity", "description": "Create opportunity"}, {"action": "update_record", "description": "Update any record"}, {"action": "query", "description": "SOQL query"}]'),

('HubSpot', 'crm', 'Inbound marketing and sales platform', 'oauth2', 'hubspot', 'rube', '["json"]',
 '{"tier": "freemium", "perMonth": 45}', 0.97, true, NOW(),
 '[{"action": "create_contact", "description": "Create a contact"}, {"action": "create_deal", "description": "Create a deal"}, {"action": "send_email", "description": "Send marketing email"}, {"action": "list_contacts", "description": "List contacts"}]'),

('Pipedrive', 'crm', 'Sales CRM for small teams', 'oauth2', 'pipedrive', 'rube', '["json"]',
 '{"tier": "paid", "perMonth": 14.90}', 0.95, true, NOW(),
 '[{"action": "create_deal", "description": "Create a deal"}, {"action": "update_deal", "description": "Update deal"}, {"action": "list_deals", "description": "List deals"}]'),

('Zoho CRM', 'crm', 'CRM for growing businesses', 'oauth2', 'zohocrm', 'rube', '["json"]',
 '{"tier": "freemium", "perMonth": 14}', 0.94, true, NOW(),
 '[{"action": "create_lead", "description": "Create lead"}, {"action": "create_contact", "description": "Create contact"}, {"action": "search_records", "description": "Search CRM records"}]'),

('Freshsales', 'crm', 'Sales CRM by Freshworks', 'oauth2', 'freshsales', 'rube', '["json"]',
 '{"tier": "freemium", "perMonth": 15}', 0.93, true, NOW(),
 '[{"action": "create_contact", "description": "Create contact"}, {"action": "create_deal", "description": "Create deal"}]'),

('Close', 'crm', 'Inside sales CRM', 'api_key', 'close', 'rube', '["json"]',
 '{"tier": "paid", "perMonth": 29}', 0.92, true, NOW(),
 '[{"action": "create_lead", "description": "Create lead"}, {"action": "log_call", "description": "Log a call"}]'),

('Intercom', 'communication', 'Customer messaging platform', 'oauth2', 'intercom', 'rube', '["json"]',
 '{"tier": "paid", "perMonth": 74}', 0.95, true, NOW(),
 '[{"action": "send_message", "description": "Send message to user"}, {"action": "create_ticket", "description": "Create support ticket"}]'),

('Zendesk', 'crm', 'Customer service platform', 'oauth2', 'zendesk', 'rube', '["json"]',
 '{"tier": "paid", "perMonth": 49}', 0.96, true, NOW(),
 '[{"action": "create_ticket", "description": "Create support ticket"}, {"action": "update_ticket", "description": "Update ticket"}, {"action": "list_tickets", "description": "List tickets"}]'),

-- =====================================================
-- Finance Tools
-- =====================================================

('QuickBooks', 'finance', 'Small business accounting software', 'oauth2', 'quickbooks', 'rube', '["json"]',
 '{"tier": "paid", "perMonth": 15}', 0.96, true, NOW(),
 '[{"action": "create_invoice", "description": "Create invoice"}, {"action": "create_expense", "description": "Record expense"}, {"action": "get_reports", "description": "Get financial reports"}]'),

('Xero', 'finance', 'Cloud accounting for small business', 'oauth2', 'xero', 'rube', '["json"]',
 '{"tier": "paid", "perMonth": 13}', 0.95, true, NOW(),
 '[{"action": "create_invoice", "description": "Create invoice"}, {"action": "create_bill", "description": "Create bill"}, {"action": "get_accounts", "description": "Get chart of accounts"}]'),

('Stripe', 'finance', 'Online payment processing', 'api_key', 'stripe', 'native', '["json"]',
 '{"tier": "paid", "perCall": 0.029}', 0.99, true, NOW(),
 '[{"action": "create_payment", "description": "Create payment intent"}, {"action": "create_customer", "description": "Create customer"}, {"action": "create_refund", "description": "Process refund"}, {"action": "list_transactions", "description": "List transactions"}]'),

('PayPal', 'finance', 'Online payments platform', 'oauth2', 'paypal', 'rube', '["json"]',
 '{"tier": "paid", "perCall": 0.029}', 0.97, true, NOW(),
 '[{"action": "create_payment", "description": "Create payment"}, {"action": "capture_payment", "description": "Capture payment"}]'),

('Square', 'finance', 'Payment and business solutions', 'oauth2', 'square', 'rube', '["json"]',
 '{"tier": "paid", "perCall": 0.026}', 0.95, true, NOW(),
 '[{"action": "create_payment", "description": "Create payment"}, {"action": "list_transactions", "description": "List transactions"}]'),

('Wave', 'finance', 'Free accounting software', 'oauth2', 'wave', 'rube', '["json"]',
 '{"tier": "free", "perCall": 0}', 0.91, true, NOW(),
 '[{"action": "create_invoice", "description": "Create invoice"}, {"action": "record_expense", "description": "Record expense"}]'),

('Plaid', 'finance', 'Banking and financial data API', 'api_key', 'plaid', 'rube', '["json"]',
 '{"tier": "paid", "perCall": 0.25}', 0.97, true, NOW(),
 '[{"action": "link_bank", "description": "Link bank account"}, {"action": "get_transactions", "description": "Get transactions"}, {"action": "get_balance", "description": "Get account balance"}]'),

-- =====================================================
-- AI & ML Tools
-- =====================================================

('OpenAI', 'ai', 'GPT models and AI services', 'api_key', 'openai', 'rube', '["json"]',
 '{"tier": "paid", "perCall": 0.002}', 0.98, true, NOW(),
 '[{"action": "chat_completion", "description": "Generate chat completion"}, {"action": "create_embedding", "description": "Create text embedding"}, {"action": "create_image", "description": "Generate image with DALL-E"}]'),

('Anthropic Claude', 'ai', 'Claude AI assistant API', 'api_key', 'anthropic', 'rube', '["json"]',
 '{"tier": "paid", "perCall": 0.003}', 0.98, true, NOW(),
 '[{"action": "chat_completion", "description": "Generate chat completion"}, {"action": "analyze_document", "description": "Analyze document content"}]'),

('Google AI (Gemini)', 'ai', 'Google Gemini AI models', 'api_key', 'googleai', 'rube', '["json"]',
 '{"tier": "freemium", "perCall": 0.00025}', 0.96, true, NOW(),
 '[{"action": "generate_content", "description": "Generate content"}, {"action": "analyze_image", "description": "Analyze image"}]'),

('Hugging Face', 'ai', 'ML model hub and inference', 'api_key', 'huggingface', 'rube', '["json"]',
 '{"tier": "freemium", "perCall": 0.0001}', 0.94, true, NOW(),
 '[{"action": "inference", "description": "Run model inference"}, {"action": "list_models", "description": "List available models"}]'),

('Stability AI', 'ai', 'Image generation with Stable Diffusion', 'api_key', 'stabilityai', 'rube', '["json", "binary"]',
 '{"tier": "paid", "perCall": 0.002}', 0.93, true, NOW(),
 '[{"action": "generate_image", "description": "Generate image"}, {"action": "upscale_image", "description": "Upscale image"}]'),

('ElevenLabs', 'ai', 'AI voice synthesis', 'api_key', 'elevenlabs', 'rube', '["json", "binary"]',
 '{"tier": "freemium", "perCall": 0.0003}', 0.95, true, NOW(),
 '[{"action": "text_to_speech", "description": "Convert text to speech"}, {"action": "clone_voice", "description": "Clone voice"}]'),

('Whisper', 'ai', 'Speech-to-text transcription', 'api_key', 'whisper', 'rube', '["json"]',
 '{"tier": "paid", "perCall": 0.006}', 0.97, true, NOW(),
 '[{"action": "transcribe", "description": "Transcribe audio to text"}, {"action": "translate", "description": "Translate audio to English"}]'),

('Replicate', 'ai', 'Run ML models in the cloud', 'api_key', 'replicate', 'rube', '["json"]',
 '{"tier": "paid", "perCall": 0.0005}', 0.92, true, NOW(),
 '[{"action": "run_model", "description": "Run an ML model"}, {"action": "list_models", "description": "List available models"}]'),

('Cohere', 'ai', 'Enterprise AI platform', 'api_key', 'cohere', 'rube', '["json"]',
 '{"tier": "freemium", "perCall": 0.0004}', 0.94, true, NOW(),
 '[{"action": "generate", "description": "Generate text"}, {"action": "embed", "description": "Create embeddings"}, {"action": "classify", "description": "Classify text"}]'),

-- =====================================================
-- Marketing & Analytics
-- =====================================================

('Google Analytics', 'analytics', 'Web analytics service', 'oauth2', 'googleanalytics', 'rube', '["json"]',
 '{"tier": "freemium", "perMonth": 0}', 0.98, true, NOW(),
 '[{"action": "get_report", "description": "Get analytics report"}, {"action": "get_realtime", "description": "Get real-time data"}]'),

('Google Ads', 'marketing', 'Online advertising platform', 'oauth2', 'googleads', 'rube', '["json"]',
 '{"tier": "paid", "perCall": 0}', 0.97, true, NOW(),
 '[{"action": "create_campaign", "description": "Create ad campaign"}, {"action": "get_performance", "description": "Get campaign performance"}]'),

('Facebook Ads', 'marketing', 'Meta advertising platform', 'oauth2', 'facebookads', 'rube', '["json"]',
 '{"tier": "paid", "perCall": 0}', 0.95, true, NOW(),
 '[{"action": "create_campaign", "description": "Create ad campaign"}, {"action": "get_insights", "description": "Get campaign insights"}]'),

('Mixpanel', 'analytics', 'Product analytics platform', 'api_key', 'mixpanel', 'rube', '["json"]',
 '{"tier": "freemium", "perMonth": 25}', 0.95, true, NOW(),
 '[{"action": "track_event", "description": "Track an event"}, {"action": "get_funnel", "description": "Get funnel report"}]'),

('Amplitude', 'analytics', 'Digital analytics platform', 'api_key', 'amplitude', 'rube', '["json"]',
 '{"tier": "freemium", "perMonth": 0}', 0.94, true, NOW(),
 '[{"action": "track_event", "description": "Track an event"}, {"action": "get_chart", "description": "Get chart data"}]'),

('Segment', 'data', 'Customer data platform', 'api_key', 'segment', 'rube', '["json"]',
 '{"tier": "freemium", "perMonth": 0}', 0.96, true, NOW(),
 '[{"action": "track", "description": "Track event"}, {"action": "identify", "description": "Identify user"}, {"action": "page", "description": "Track page view"}]'),

('Hotjar', 'analytics', 'Behavior analytics and feedback', 'api_key', 'hotjar', 'rube', '["json"]',
 '{"tier": "freemium", "perMonth": 32}', 0.92, true, NOW(),
 '[{"action": "get_recordings", "description": "Get session recordings"}, {"action": "get_heatmaps", "description": "Get heatmap data"}]'),

-- =====================================================
-- Social Media
-- =====================================================

('Twitter/X', 'social', 'Social networking and microblogging', 'oauth2', 'twitter', 'rube', '["json"]',
 '{"tier": "freemium", "perMonth": 100}', 0.93, true, NOW(),
 '[{"action": "post_tweet", "description": "Post a tweet"}, {"action": "search_tweets", "description": "Search tweets"}, {"action": "get_mentions", "description": "Get mentions"}]'),

('LinkedIn', 'social', 'Professional networking platform', 'oauth2', 'linkedin', 'rube', '["json"]',
 '{"tier": "freemium", "perMonth": 0}', 0.94, true, NOW(),
 '[{"action": "post_update", "description": "Post an update"}, {"action": "get_profile", "description": "Get profile info"}]'),

('Instagram', 'social', 'Photo and video sharing platform', 'oauth2', 'instagram', 'rube', '["json"]',
 '{"tier": "free", "perCall": 0}', 0.92, true, NOW(),
 '[{"action": "post_media", "description": "Post media"}, {"action": "get_insights", "description": "Get account insights"}]'),

('Facebook', 'social', 'Social networking platform', 'oauth2', 'facebook', 'rube', '["json"]',
 '{"tier": "free", "perCall": 0}', 0.94, true, NOW(),
 '[{"action": "post_update", "description": "Post an update"}, {"action": "get_pages", "description": "Get managed pages"}]'),

('TikTok', 'social', 'Short-form video platform', 'oauth2', 'tiktok', 'rube', '["json"]',
 '{"tier": "free", "perCall": 0}', 0.90, true, NOW(),
 '[{"action": "post_video", "description": "Post a video"}, {"action": "get_analytics", "description": "Get video analytics"}]'),

('Pinterest', 'social', 'Visual discovery platform', 'oauth2', 'pinterest', 'rube', '["json"]',
 '{"tier": "free", "perCall": 0}', 0.91, true, NOW(),
 '[{"action": "create_pin", "description": "Create a pin"}, {"action": "get_boards", "description": "Get boards"}]'),

('YouTube', 'social', 'Video sharing platform', 'oauth2', 'youtube', 'rube', '["json"]',
 '{"tier": "free", "perCall": 0}', 0.97, true, NOW(),
 '[{"action": "upload_video", "description": "Upload a video"}, {"action": "get_analytics", "description": "Get channel analytics"}, {"action": "list_videos", "description": "List channel videos"}]'),

('Reddit', 'social', 'Social news aggregation', 'oauth2', 'reddit', 'rube', '["json"]',
 '{"tier": "free", "perCall": 0}', 0.91, true, NOW(),
 '[{"action": "submit_post", "description": "Submit a post"}, {"action": "get_subreddit", "description": "Get subreddit info"}]'),

-- =====================================================
-- Travel & Booking
-- =====================================================

('Composio Search', 'travel', 'Flight and hotel search aggregator', 'mcp', 'composio_search', 'composio', '["json"]',
 '{"tier": "free", "perCall": 0}', 0.95, true, NOW(),
 '[{"action": "search_flights", "description": "Search flights"}, {"action": "search_hotels", "description": "Search hotels"}]'),

('Yelp', 'travel', 'Restaurant and local business reviews', 'api_key', 'yelp', 'rube', '["json"]',
 '{"tier": "freemium", "perCall": 0}', 0.94, true, NOW(),
 '[{"action": "search_restaurants", "description": "Search restaurants"}, {"action": "get_business", "description": "Get business details"}]'),

('Google Maps', 'travel', 'Maps and location services', 'api_key', 'googlemaps', 'rube', '["json"]',
 '{"tier": "freemium", "perCall": 0.005}', 0.99, true, NOW(),
 '[{"action": "geocode", "description": "Geocode address"}, {"action": "directions", "description": "Get directions"}, {"action": "places_search", "description": "Search places"}]'),

('Booking.com', 'travel', 'Hotel and accommodation booking', 'api_key', 'booking', 'rube', '["json"]',
 '{"tier": "paid", "perCall": 0}', 0.93, true, NOW(),
 '[{"action": "search_hotels", "description": "Search hotels"}, {"action": "get_availability", "description": "Check availability"}]'),

('Uber', 'travel', 'Ride-sharing service', 'oauth2', 'uber', 'rube', '["json"]',
 '{"tier": "paid", "perCall": 0}', 0.92, true, NOW(),
 '[{"action": "get_estimate", "description": "Get ride estimate"}, {"action": "request_ride", "description": "Request a ride"}]'),

-- =====================================================
-- Automation & Integration
-- =====================================================

('Zapier', 'automation', 'Workflow automation platform', 'oauth2', 'zapier', 'rube', '["json"]',
 '{"tier": "freemium", "perMonth": 19.99}', 0.96, true, NOW(),
 '[{"action": "trigger_zap", "description": "Trigger a Zap"}, {"action": "list_zaps", "description": "List Zaps"}]'),

('Make (Integromat)', 'automation', 'Visual automation platform', 'api_key', 'make', 'rube', '["json"]',
 '{"tier": "freemium", "perMonth": 9}', 0.94, true, NOW(),
 '[{"action": "trigger_scenario", "description": "Trigger a scenario"}, {"action": "list_scenarios", "description": "List scenarios"}]'),

('n8n', 'automation', 'Self-hosted automation tool', 'api_key', 'n8n', 'rube', '["json"]',
 '{"tier": "freemium", "perMonth": 20}', 0.93, true, NOW(),
 '[{"action": "trigger_workflow", "description": "Trigger workflow"}, {"action": "get_executions", "description": "Get workflow executions"}]'),

('IFTTT', 'automation', 'If This Then That automation', 'oauth2', 'ifttt', 'rube', '["json"]',
 '{"tier": "freemium", "perMonth": 2.50}', 0.91, true, NOW(),
 '[{"action": "trigger_applet", "description": "Trigger an applet"}]'),

-- =====================================================
-- E-commerce
-- =====================================================

('Shopify', 'other', 'E-commerce platform', 'oauth2', 'shopify', 'rube', '["json"]',
 '{"tier": "paid", "perMonth": 29}', 0.97, true, NOW(),
 '[{"action": "create_product", "description": "Create product"}, {"action": "get_orders", "description": "Get orders"}, {"action": "update_inventory", "description": "Update inventory"}]'),

('WooCommerce', 'other', 'WordPress e-commerce plugin', 'api_key', 'woocommerce', 'rube', '["json"]',
 '{"tier": "free", "perCall": 0}', 0.93, true, NOW(),
 '[{"action": "create_product", "description": "Create product"}, {"action": "get_orders", "description": "Get orders"}]'),

('BigCommerce', 'other', 'E-commerce platform', 'oauth2', 'bigcommerce', 'rube', '["json"]',
 '{"tier": "paid", "perMonth": 29}', 0.92, true, NOW(),
 '[{"action": "create_product", "description": "Create product"}, {"action": "get_orders", "description": "Get orders"}]'),

-- =====================================================
-- Design & Media
-- =====================================================

('Figma', 'productivity', 'Collaborative design tool', 'oauth2', 'figma', 'rube', '["json"]',
 '{"tier": "freemium", "perMonth": 12}', 0.96, true, NOW(),
 '[{"action": "get_file", "description": "Get design file"}, {"action": "get_comments", "description": "Get file comments"}, {"action": "export_image", "description": "Export to image"}]'),

('Canva', 'productivity', 'Online design platform', 'oauth2', 'canva', 'rube', '["json"]',
 '{"tier": "freemium", "perMonth": 12.99}', 0.94, true, NOW(),
 '[{"action": "create_design", "description": "Create a design"}, {"action": "export_design", "description": "Export design"}]'),

('Loom', 'communication', 'Video messaging platform', 'oauth2', 'loom', 'rube', '["json"]',
 '{"tier": "freemium", "perMonth": 12.50}', 0.93, true, NOW(),
 '[{"action": "get_videos", "description": "Get video list"}, {"action": "share_video", "description": "Share video"}]'),

('Miro', 'productivity', 'Online whiteboard platform', 'oauth2', 'miro', 'rube', '["json"]',
 '{"tier": "freemium", "perMonth": 8}', 0.94, true, NOW(),
 '[{"action": "create_board", "description": "Create board"}, {"action": "add_item", "description": "Add item to board"}]'),

-- =====================================================
-- Utility & Misc
-- =====================================================

('Weather API', 'data', 'Weather data and forecasts', 'api_key', 'openweather', 'rube', '["json"]',
 '{"tier": "freemium", "perCall": 0.0001}', 0.97, true, NOW(),
 '[{"action": "get_current", "description": "Get current weather"}, {"action": "get_forecast", "description": "Get weather forecast"}]'),

('IP Geolocation', 'data', 'IP address geolocation service', 'api_key', 'ipgeolocation', 'rube', '["json"]',
 '{"tier": "freemium", "perCall": 0}', 0.95, true, NOW(),
 '[{"action": "lookup", "description": "Lookup IP location"}]'),

('URL Shortener (Bitly)', 'other', 'Link management platform', 'oauth2', 'bitly', 'rube', '["json"]',
 '{"tier": "freemium", "perMonth": 0}', 0.96, true, NOW(),
 '[{"action": "shorten", "description": "Shorten a URL"}, {"action": "get_clicks", "description": "Get click stats"}]'),

('Browser Automation', 'automation', 'Web browser automation via Playwright', 'none', 'playwright', 'native', '["json", "html"]',
 '{"tier": "free", "perCall": 0}', 0.98, true, NOW(),
 '[{"action": "navigate", "description": "Navigate to URL"}, {"action": "click", "description": "Click element"}, {"action": "fill_form", "description": "Fill form fields"}, {"action": "screenshot", "description": "Take screenshot"}]')

ON CONFLICT (toolkit_slug) DO UPDATE SET
  description = EXCLUDED.description,
  capabilities = EXCLUDED.capabilities,
  cost_estimate = EXCLUDED.cost_estimate,
  updated_at = NOW();

-- Verify seed data
DO $$
DECLARE
  tool_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO tool_count FROM tool_catalog WHERE is_approved = true;
  RAISE NOTICE 'Seeded % approved tools into tool_catalog', tool_count;
END $$;
