# Nexus Platform Setup Guide

This guide will help you configure all the integrations needed for Nexus to function properly.

## Quick Start

1. **Deploy to Vercel** (if not already done)
2. **Add environment variables** in Vercel Dashboard
3. **Redeploy** to apply changes

## Required Environment Variables

### 1. Claude AI (Required)
Powers all AI features - chat, workflow automation, document analysis.

```
ANTHROPIC_API_KEY=sk-ant-api03-...
```

**Get your key:**
1. Go to [Anthropic Console](https://console.anthropic.com)
2. Create an account or sign in
3. Go to API Keys
4. Create a new key
5. Copy the key (starts with `sk-ant-`)

### 2. Email Integration (Recommended)
Enables sending emails from workflows.

```
RESEND_API_KEY=re_...
```

**Get your key:**
1. Go to [Resend](https://resend.com)
2. Create a free account (100 emails/day free)
3. Go to API Keys in dashboard
4. Create a new key
5. Copy the key (starts with `re_`)

### 3. HubSpot CRM (Optional)
Enables CRM features - create contacts, manage deals.

```
HUBSPOT_ACCESS_TOKEN=pat-na1-...
```

**Get your token:**
1. Go to [HubSpot](https://app.hubspot.com)
2. Create a free account or sign in
3. Go to Settings → Integrations → Private Apps
4. Create a new private app
5. Add scopes: `crm.objects.contacts.read`, `crm.objects.contacts.write`
6. Copy the access token

### 4. Supabase (Required - Already configured)
Database and authentication - should already be set up.

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

## Adding Variables to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **nexus** project
3. Click **Settings** tab
4. Click **Environment Variables** in left sidebar
5. Add each variable:
   - Name: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-api03-...`
   - Environment: Select all (Production, Preview, Development)
6. Click **Save**
7. Repeat for each variable

## Redeploy

After adding environment variables:

1. Go to **Deployments** tab
2. Click the **...** menu on the latest deployment
3. Select **Redeploy**
4. Wait for deployment to complete

## Verify Setup

After redeploying:

1. Visit your Nexus site
2. Go to **Integrations** page
3. Check that services show "Connected" status
4. Try the AI Chatbot - it should respond
5. Try sending an email through a workflow

## Troubleshooting

### AI Chat not working
- Check that `ANTHROPIC_API_KEY` is set correctly
- The key should start with `sk-ant-`
- Make sure you redeployed after adding the variable

### Emails not sending
- Check that `RESEND_API_KEY` is set
- Free tier: 100 emails/day, from `@resend.dev` domain only
- For custom domains, verify your domain in Resend

### CRM features not working
- HubSpot integration is optional
- Add `HUBSPOT_ACCESS_TOKEN` for CRM features
- Make sure the token has correct scopes

## Architecture

```
Frontend (Vite + React)
    ↓
/api/* (Vercel Serverless Functions)
    ↓
├── /api/chat → Claude AI
├── /api/send-email → Resend
├── /api/execute-workflow → Multi-step execution
├── /api/integrations/hubspot → HubSpot CRM
└── /api/health → Status check
    ↓
Supabase (Database + Auth)
```

## Security

- API keys are stored server-side only (never exposed to browser)
- All AI and integration calls go through Vercel serverless functions
- The old `VITE_ANTHROPIC_API_KEY` (client-side) is deprecated

## Cost Estimates

| Service | Free Tier | Paid |
|---------|-----------|------|
| Claude AI | None | ~$3/1M tokens (Haiku) |
| Resend | 100 emails/day | $20/mo for 50k emails |
| HubSpot | Free CRM | Varies |
| Supabase | 500MB DB, 50k auth | $25/mo |
| Vercel | 100GB bandwidth | $20/mo |

## Need Help?

- Check the [Integrations](/integrations) page for status
- Review Vercel deployment logs for errors
- Contact support or create an issue
