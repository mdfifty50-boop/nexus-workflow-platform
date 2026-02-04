# Nexus Deployment Guide

## Branch Workflow (IMPORTANT - Read First)

### Branch Structure

```
golden-path (development)
     │
     │ PR: "Ready for Testing"
     ▼
  staging (pre-production testing)
     │
     │ PR: "Ready for Production"
     ▼
   main (production - live site)
```

### Branch Purposes

| Branch | Purpose | Deploys To | Who Can Push |
|--------|---------|------------|--------------|
| `golden-path` | Active development | Dev preview | Anyone |
| `staging` | Pre-production testing | staging URL | Via PR only |
| `main` | Production | Live site | Via PR only |

### Daily Development Workflow

```bash
# 1. Work on golden-path
git checkout golden-path
git pull origin golden-path
# ... make changes ...
git add . && git commit -m "Feature: description"
git push origin golden-path

# 2. Ready for testing? Create PR: golden-path → staging
# On GitHub, create Pull Request

# 3. Tested on staging? Create PR: staging → main
# On GitHub, create Pull Request to go live
```

### Quick Reference

| Action | Command |
|--------|---------|
| Switch to dev | `git checkout golden-path` |
| Switch to staging | `git checkout staging` |
| Sync after merge | `git pull origin <branch>` |

### Emergency Hotfix

```bash
git checkout main && git pull
git checkout -b hotfix/bug-name
# fix the bug
git add . && git commit -m "Hotfix: description"
# Create PR: hotfix → main (urgent)
# Then also merge to staging and golden-path
```

### Rollback (Vercel)

1. Go to Vercel → Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"

---

## Prerequisites

### Required Services
1. **Supabase Account** - Database, authentication, and storage
2. **Vercel Account** - Frontend hosting
3. **GitHub Account** - Code repository and CI/CD
4. **AWS Account** (Optional) - For backend workflow execution

### Environment Variables
Create these environment variables in your deployment platform:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Optional: Analytics
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
```

## Deployment Steps

### 1. Deploy Database (Supabase)

1. Go to [https://supabase.com](https://supabase.com) and create a new project
2. Navigate to **SQL Editor** and run the migration:
   ```bash
   cat supabase/migrations/20260106000001_initial_setup.sql
   ```
3. Copy your project URL and anon key from **Settings** > **API**

### 2. Deploy Frontend (Vercel)

#### Option A: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

#### Option B: GitHub Integration
1. Push code to GitHub
2. Go to [https://vercel.com](https://vercel.com)
3. Click "Import Project" and select your repository
4. Configure environment variables in Vercel dashboard
5. Deploy

### 3. Configure GitHub Actions (CI/CD)

1. Go to your GitHub repository **Settings** > **Secrets**
2. Add the following secrets:
   - `VERCEL_TOKEN` - Generate from Vercel dashboard
   - `VERCEL_ORG_ID` - Found in Vercel team settings
   - `VERCEL_PROJECT_ID` - Found in Vercel project settings

3. Push to `develop` branch for staging deployment
4. Push to `main` branch for production deployment

### 4. Configure Supabase Storage (for avatars)

1. In Supabase dashboard, go to **Storage**
2. Create a new bucket called `avatars`
3. Set bucket as **Public**
4. Configure CORS if needed:
   ```json
   {
     "allowedOrigins": ["https://your-domain.com"],
     "allowedMethods": ["GET", "POST", "PUT", "DELETE"],
     "allowedHeaders": ["*"],
     "maxAgeSeconds": 3600
   }
   ```

### 5. Configure Authentication Providers

#### Email/Password (Default)
Already configured in Supabase migration.

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
4. In Supabase dashboard:
   - Go to **Authentication** > **Providers**
   - Enable **Google**
   - Add Client ID and Secret

#### Magic Links
Already configured. Customize email templates in:
**Authentication** > **Email Templates**

## Post-Deployment

### 1. Test Authentication
- Sign up with email/password
- Verify email confirmation works
- Test Google OAuth (if configured)

### 2. Test Database
- Create a project
- Create a workflow
- Execute a workflow
- Verify data appears in Supabase dashboard

### 3. Set Up Monitoring
- Enable Vercel Analytics
- Configure Supabase logs and alerts
- Set up error tracking (Sentry, optional)

### 4. Configure Custom Domain
1. In Vercel dashboard, go to **Domains**
2. Add your custom domain
3. Configure DNS records as instructed
4. Update `VITE_SUPABASE_URL` redirect URLs

## Environment-Specific Configurations

### Development
```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your_local_key
```

### Staging
```env
VITE_SUPABASE_URL=https://staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_staging_key
```

### Production
```env
VITE_SUPABASE_URL=https://prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_prod_key
```

## Troubleshooting

### Build Fails
- Check Node.js version (requires 20+)
- Clear `node_modules` and reinstall: `rm -rf node_modules package-lock.json && npm install`
- Verify environment variables are set

### Authentication Not Working
- Verify Supabase URL and keys are correct
- Check redirect URLs in Supabase dashboard
- Ensure email confirmation is configured

### Database Connection Issues
- Verify RLS policies are enabled
- Check user permissions in Supabase
- Review database logs in Supabase dashboard

## Scaling Considerations

### Performance
- Enable Vercel Edge caching
- Use Supabase connection pooling
- Implement CDN for static assets

### Security
- Enable rate limiting in Supabase
- Configure CORS properly
- Use environment variables for all secrets
- Enable Supabase audit logs

### Cost Optimization
- Monitor Supabase database usage
- Use Vercel bandwidth analytics
- Implement pagination for large datasets
- Cache frequently accessed data

## Backup Strategy

### Database Backups
- Enable automatic backups in Supabase (Pro plan)
- Export database daily: `pg_dump`
- Store backups in S3 or similar

### Code Backups
- Use Git for version control
- Tag releases: `git tag v1.0.0`
- Keep deployment artifacts

## Support

For deployment issues:
- Check [Vercel Status](https://vercel-status.com)
- Check [Supabase Status](https://status.supabase.com)
- Review application logs in respective dashboards
