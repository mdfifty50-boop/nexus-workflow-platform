# Nexus Platform - Production Deployment Guide

**Version:** 2.0.0
**Date:** January 12, 2026
**Status:** Production Ready

---

## Overview

This comprehensive guide covers deploying the Nexus AI Workflow Automation Platform to production. It includes all necessary steps from initial setup to post-deployment verification.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Environment Configuration](#2-environment-configuration)
3. [Database Deployment (Supabase)](#3-database-deployment-supabase)
4. [Frontend Deployment (Vercel)](#4-frontend-deployment-vercel)
5. [Backend Deployment (Optional)](#5-backend-deployment-optional)
6. [Domain Configuration](#6-domain-configuration)
7. [CI/CD Pipeline](#7-cicd-pipeline)
8. [Post-Deployment Verification](#8-post-deployment-verification)
9. [Scaling Considerations](#9-scaling-considerations)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Prerequisites

### Required Accounts

| Service | Purpose | Tier Required |
|---------|---------|---------------|
| [Supabase](https://supabase.com) | Database, Auth, Storage | Free (Pro recommended) |
| [Vercel](https://vercel.com) | Frontend hosting | Free (Pro recommended) |
| [GitHub](https://github.com) | Code repository, CI/CD | Free |
| [Anthropic](https://console.anthropic.com) | Claude AI API | Pay-as-you-go |
| [Stripe](https://stripe.com) | Payment processing | Standard |

### Local Requirements

```bash
# Node.js 20+
node --version  # Should output v20.x or higher

# npm 10+
npm --version

# Git
git --version

# Vercel CLI
npm install -g vercel
```

### Environment Variables Master List

```env
# === REQUIRED ===

# Supabase (Database & Auth)
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Server-side only

# === OPTIONAL (but recommended) ===

# Anthropic (AI Features)
VITE_ANTHROPIC_API_KEY=sk-ant-api03-...

# Stripe (Payments)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Analytics
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_PAYMENTS=true
```

---

## 2. Environment Configuration

### 2.1 Development Environment

Create `.env.local` (never commit this file):

```env
# Development
NODE_ENV=development

# Supabase Local or Cloud Dev
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-local-anon-key

# Optional: Use cloud Supabase in dev
# VITE_SUPABASE_URL=https://dev-project.supabase.co
# VITE_SUPABASE_ANON_KEY=dev-anon-key
```

### 2.2 Staging Environment

```env
# Staging
NODE_ENV=staging

VITE_SUPABASE_URL=https://staging-xxx.supabase.co
VITE_SUPABASE_ANON_KEY=staging-anon-key

# Use test API keys
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 2.3 Production Environment

Configure in Vercel Dashboard or via CLI:

```bash
# Add production environment variables
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel env add VITE_ANTHROPIC_API_KEY production
vercel env add VITE_STRIPE_PUBLISHABLE_KEY production
```

---

## 3. Database Deployment (Supabase)

### 3.1 Create Production Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Configure:
   - **Name:** nexus-production
   - **Database Password:** Generate strong password (save it!)
   - **Region:** Choose closest to users (e.g., us-east-1)
   - **Plan:** Pro recommended for production

### 3.2 Run Database Migrations

```bash
# Navigate to project directory
cd nexus

# Option 1: Via Supabase CLI
supabase link --project-ref [project-id]
supabase db push

# Option 2: Manual SQL execution
# Copy contents of supabase/migrations/20260106000001_initial_setup.sql
# Paste in Supabase SQL Editor and run
```

### 3.3 Verify Database Setup

```sql
-- Run in Supabase SQL Editor
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- Should see:
-- users
-- projects
-- project_members
-- workflows
-- workflow_executions
-- integration_credentials
```

### 3.4 Configure Row Level Security

RLS is enabled by the migration. Verify:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- All tables should show 't' for rowsecurity
```

### 3.5 Set Up Storage Buckets

```sql
-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Create workflow-outputs bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('workflow-outputs', 'workflow-outputs', false);
```

### 3.6 Configure Authentication

1. Go to **Authentication** > **Providers**
2. Enable **Email** (default)
3. Configure **Google OAuth**:
   - Client ID from Google Cloud Console
   - Client Secret
   - Redirect URL: `https://[project].supabase.co/auth/v1/callback`

4. Configure email templates in **Authentication** > **Email Templates**

---

## 4. Frontend Deployment (Vercel)

### 4.1 Connect Repository

```bash
# Option 1: Via CLI
vercel link

# Follow prompts to connect to existing project or create new
```

Or via Dashboard:
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Configure project settings

### 4.2 Configure Build Settings

**Framework Preset:** Vite
**Build Command:** `npm run build`
**Output Directory:** `dist`
**Install Command:** `npm install`
**Node.js Version:** 20.x

### 4.3 Set Environment Variables

In Vercel Dashboard > Project > Settings > Environment Variables:

| Variable | Environment | Value |
|----------|-------------|-------|
| VITE_SUPABASE_URL | Production | https://xxx.supabase.co |
| VITE_SUPABASE_ANON_KEY | Production | eyJ... |
| VITE_ANTHROPIC_API_KEY | Production | sk-ant-... |
| VITE_STRIPE_PUBLISHABLE_KEY | Production | pk_live_... |

### 4.4 Deploy

```bash
# Deploy to production
vercel --prod

# Or push to main branch (if auto-deploy enabled)
git push origin main
```

### 4.5 Verify Deployment

```bash
# Check deployment status
vercel ls

# View production URL
vercel inspect [deployment-url]
```

---

## 5. Backend Deployment (Optional)

If using the Express backend for advanced features:

### 5.1 Railway Deployment

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up
```

### 5.2 Environment Variables for Backend

```env
# Server
PORT=3001
NODE_ENV=production

# Database
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# AI
ANTHROPIC_API_KEY=sk-ant-...

# Payments
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 5.3 Health Check Endpoint

Verify backend is running:

```bash
curl https://your-backend.railway.app/api/health

# Expected response:
# {"status":"healthy","timestamp":"2026-01-12T..."}
```

---

## 6. Domain Configuration

### 6.1 Add Custom Domain in Vercel

1. Go to **Project** > **Settings** > **Domains**
2. Add your domain (e.g., `app.nexus-platform.com`)
3. Configure DNS as instructed

### 6.2 DNS Configuration

Add these records at your DNS provider:

| Type | Name | Value |
|------|------|-------|
| A | @ | 76.76.21.21 |
| CNAME | www | cname.vercel-dns.com |

Or for subdomain:

| Type | Name | Value |
|------|------|-------|
| CNAME | app | cname.vercel-dns.com |

### 6.3 SSL Configuration

Vercel automatically provisions SSL certificates. Verify:

```bash
curl -I https://app.nexus-platform.com

# Should see: HTTP/2 200
# And: strict-transport-security header
```

### 6.4 Update Supabase Redirect URLs

In Supabase Dashboard > Authentication > URL Configuration:

- **Site URL:** `https://app.nexus-platform.com`
- **Redirect URLs:**
  - `https://app.nexus-platform.com/dashboard`
  - `https://app.nexus-platform.com/auth/callback`

---

## 7. CI/CD Pipeline

### 7.1 GitHub Actions Configuration

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

  deploy-preview:
    needs: test
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Vercel CLI
        run: npm install -g vercel

      - name: Deploy Preview
        run: vercel --token=${{ secrets.VERCEL_TOKEN }}

  deploy-production:
    needs: test
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Vercel CLI
        run: npm install -g vercel

      - name: Deploy Production
        run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

### 7.2 Required GitHub Secrets

Add in GitHub > Repository > Settings > Secrets:

- `VERCEL_TOKEN` - From Vercel account settings
- `VERCEL_ORG_ID` - From Vercel project settings
- `VERCEL_PROJECT_ID` - From Vercel project settings

---

## 8. Post-Deployment Verification

### 8.1 Smoke Test Checklist

```bash
# Run automated checks
npm run test:e2e -- --project=production

# Or manual verification:
```

- [ ] Landing page loads
- [ ] Sign up flow works
- [ ] Login flow works (email + Google)
- [ ] Dashboard loads for authenticated users
- [ ] Can create a project
- [ ] Can create a workflow
- [ ] Workflow execution starts
- [ ] Profile page accessible
- [ ] Integrations page accessible
- [ ] Settings update correctly

### 8.2 Performance Verification

```bash
# Using Lighthouse CLI
npm install -g lighthouse
lighthouse https://app.nexus-platform.com --view

# Target scores:
# Performance: > 90
# Accessibility: > 90
# Best Practices: > 90
# SEO: > 90
```

### 8.3 Security Verification

```bash
# Check headers
curl -I https://app.nexus-platform.com

# Should include:
# x-frame-options: DENY
# x-content-type-options: nosniff
# strict-transport-security: max-age=...
```

### 8.4 Monitor for 24 Hours

- Watch error rates in Sentry
- Monitor Vercel Analytics
- Check Supabase logs
- Verify no unauthorized access attempts

---

## 9. Scaling Considerations

### 9.1 Database Scaling

| Users | Supabase Plan | Connection Pool |
|-------|---------------|-----------------|
| < 1,000 | Free | Default (15) |
| 1,000 - 10,000 | Pro | 50 |
| 10,000 - 100,000 | Pro + Pooler | 200 |
| > 100,000 | Enterprise | Custom |

### 9.2 Frontend Scaling

Vercel handles scaling automatically. For high traffic:

- Enable Edge caching
- Use ISR for static pages
- Optimize bundle size

### 9.3 API Rate Limiting

Implement rate limiting for API endpoints:

```typescript
// Recommended limits
const RATE_LIMITS = {
  auth: '10 per minute',
  api: '100 per minute',
  workflow_execution: '20 per minute',
}
```

### 9.4 Cost Optimization

| Service | Optimization Strategy |
|---------|----------------------|
| Supabase | Connection pooling, query optimization |
| Vercel | Edge caching, ISR |
| Anthropic | Use Haiku for simple tasks, cache responses |
| Stripe | Webhook batching |

---

## 10. Troubleshooting

### 10.1 Build Failures

```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 10.2 Database Connection Issues

```bash
# Test connection
psql "postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres"

# Check connection count
SELECT count(*) FROM pg_stat_activity;
```

### 10.3 Authentication Not Working

1. Verify Supabase URL and keys are correct
2. Check redirect URLs in Supabase dashboard
3. Verify CORS settings
4. Check browser console for errors

### 10.4 Environment Variables Not Loading

```bash
# Verify in Vercel
vercel env ls

# Redeploy after changes
vercel --prod
```

### 10.5 Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid API key" | Wrong Supabase key | Check VITE_SUPABASE_ANON_KEY |
| "CORS error" | Missing origin | Add domain to Supabase CORS |
| "RLS violation" | Policy issue | Check RLS policies |
| "Rate limited" | Too many requests | Implement caching/throttling |

---

## Quick Deployment Commands

```bash
# Full production deployment
npm run build && vercel --prod

# Database migration
supabase db push

# Check deployment status
vercel ls --prod

# View logs
vercel logs [deployment-url]

# Rollback
vercel rollback
```

---

**Document Version:** 2.0
**Last Updated:** January 12, 2026
**Owner:** Engineering Team
**Next Review:** Before major releases
