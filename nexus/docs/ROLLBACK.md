# Nexus Platform - Rollback Procedures

**Version:** 1.0.0
**Date:** January 12, 2026
**Status:** Production Ready

---

## Overview

This document outlines rollback procedures for the Nexus AI Workflow Automation Platform. Rollback procedures are critical for quickly recovering from failed deployments or critical bugs in production.

---

## 1. Rollback Decision Matrix

### When to Rollback

| Scenario | Severity | Action | Timeline |
|----------|----------|--------|----------|
| Site completely down | P1 - Critical | Immediate rollback | < 15 minutes |
| Authentication broken | P1 - Critical | Immediate rollback | < 15 minutes |
| Payment processing broken | P1 - Critical | Immediate rollback | < 15 minutes |
| Data corruption detected | P1 - Critical | Immediate rollback + DB restore | < 30 minutes |
| Major feature broken | P2 - High | Assess, then rollback | < 1 hour |
| Performance degradation > 50% | P2 - High | Assess, then rollback | < 1 hour |
| Error rate > 10% | P2 - High | Assess, then rollback | < 1 hour |
| Minor feature broken | P3 - Medium | Hotfix preferred | < 4 hours |
| UI/cosmetic issues | P4 - Low | Hotfix preferred | Next release |

### Decision Flowchart

```
Incident Detected
       |
       v
Is the site accessible?
       |
   No -+-> IMMEDIATE ROLLBACK (P1)
       |
      Yes
       |
       v
Is authentication working?
       |
   No -+-> IMMEDIATE ROLLBACK (P1)
       |
      Yes
       |
       v
Is payment processing working?
       |
   No -+-> IMMEDIATE ROLLBACK (P1)
       |
      Yes
       |
       v
Is error rate > 10%?
       |
  Yes -+-> ASSESS AND ROLLBACK (P2)
       |
       No
       |
       v
Can users complete core workflows?
       |
   No -+-> ASSESS AND ROLLBACK (P2)
       |
      Yes
       |
       v
HOTFIX OR WAIT FOR NEXT RELEASE
```

---

## 2. Frontend Rollback (Vercel)

### 2.1 Quick Rollback via Vercel Dashboard

**Fastest method - takes < 2 minutes:**

1. Go to [Vercel Dashboard](https://vercel.com)
2. Select the Nexus project
3. Click **Deployments** tab
4. Find the last known good deployment
5. Click the three dots menu (...)
6. Select **Promote to Production**
7. Confirm the promotion

### 2.2 Rollback via Vercel CLI

```bash
# List recent deployments
vercel ls nexus-platform

# Rollback to specific deployment
vercel rollback [deployment-url]

# Example:
vercel rollback nexus-platform-abc123.vercel.app
```

### 2.3 Rollback via Git Revert

```bash
# Identify the problematic commit
git log --oneline -10

# Revert the commit
git revert HEAD

# Or revert multiple commits
git revert HEAD~3..HEAD

# Push the revert (triggers new deployment)
git push origin main
```

### 2.4 Emergency: Instant Rollback Script

```bash
#!/bin/bash
# scripts/emergency-rollback.sh

# Configuration
PROJECT_NAME="nexus-platform"
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"

# Get the previous production deployment
PREVIOUS_DEPLOYMENT=$(vercel ls $PROJECT_NAME --prod | head -n 2 | tail -n 1 | awk '{print $1}')

if [ -z "$PREVIOUS_DEPLOYMENT" ]; then
    echo "ERROR: Could not find previous deployment"
    exit 1
fi

echo "Rolling back to: $PREVIOUS_DEPLOYMENT"

# Perform rollback
vercel rollback $PREVIOUS_DEPLOYMENT --yes

# Notify Slack
if [ -n "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data '{"text":"EMERGENCY ROLLBACK executed for Nexus Platform. Rolled back to: '$PREVIOUS_DEPLOYMENT'"}' \
        $SLACK_WEBHOOK_URL
fi

echo "Rollback complete!"
```

---

## 3. Database Rollback (Supabase)

### 3.1 Point-in-Time Recovery (PITR)

**Available on Supabase Pro plan:**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings** > **Database**
4. Click **Point in Time Recovery**
5. Select the target timestamp
6. Confirm recovery

**Note:** PITR creates a NEW database. You'll need to update connection strings.

### 3.2 Manual Database Restore from Backup

```bash
# Download the backup from Supabase
# Go to Settings > Database > Backups > Download

# Restore to a new database
psql -h db.NEW-PROJECT.supabase.co -U postgres -d postgres < backup.sql

# Update environment variables to point to new database
# Redeploy the application
```

### 3.3 Migration Rollback

If a migration caused the issue:

```sql
-- Check current migration status
SELECT * FROM supabase_migrations.schema_migrations ORDER BY version DESC;

-- Manually rollback the problematic migration
-- (You need to write the inverse of the migration)

-- Example: If migration added a column
ALTER TABLE workflows DROP COLUMN new_column;

-- Update the migrations table
DELETE FROM supabase_migrations.schema_migrations
WHERE version = '20260112000001';
```

### 3.4 Data-Only Rollback

For data issues without schema changes:

```sql
-- If you have audit logging, restore from audit
-- Example: Restore deleted workflows from audit log

INSERT INTO workflows (id, name, description, project_id, owner_id, created_at)
SELECT
    (old_data->>'id')::uuid,
    old_data->>'name',
    old_data->>'description',
    (old_data->>'project_id')::uuid,
    (old_data->>'owner_id')::uuid,
    (old_data->>'created_at')::timestamp
FROM audit_log
WHERE table_name = 'workflows'
  AND action = 'DELETE'
  AND created_at > NOW() - INTERVAL '24 hours';
```

---

## 4. Backend Rollback (Express Server)

### 4.1 Railway Rollback

If using Railway for backend:

```bash
# Via Railway CLI
railway rollback

# Or via dashboard
# Go to Railway > Deployments > Select previous > Rollback
```

### 4.2 Docker-based Rollback

```bash
# List available images
docker images nexus-backend

# Roll back to previous version
docker stop nexus-backend
docker run -d --name nexus-backend \
  -e NODE_ENV=production \
  -e SUPABASE_URL=$SUPABASE_URL \
  nexus-backend:previous-tag
```

### 4.3 Version Tag Strategy

Always tag releases before deployment:

```bash
# Before deployment
git tag v1.2.3
git push origin v1.2.3

# To rollback
git checkout v1.2.2
git push -f origin main  # CAUTION: Force push

# Or better: Deploy specific tag
vercel --prod --env TAG=v1.2.2
```

---

## 5. Integration Rollback

### 5.1 OAuth Configuration Rollback

If OAuth changes caused issues:

1. Go to the OAuth provider (Google, Salesforce, etc.)
2. Restore previous redirect URIs
3. Restore previous scopes
4. Update Supabase Auth configuration

### 5.2 API Key Rotation (if compromised)

```bash
# 1. Generate new API keys in respective dashboards

# 2. Update environment variables
vercel env rm ANTHROPIC_API_KEY production
vercel env add ANTHROPIC_API_KEY production

# 3. Redeploy
vercel --prod

# 4. Revoke old keys in provider dashboards
```

---

## 6. Rollback Communication

### 6.1 Internal Communication Template

```markdown
**INCIDENT: Rollback Initiated**

**Time:** [TIMESTAMP]
**Severity:** [P1/P2/P3]
**Impact:** [Brief description of user impact]

**Action Taken:**
- Rolled back to deployment: [DEPLOYMENT_ID]
- Database restored to: [TIMESTAMP] (if applicable)

**Current Status:** [Stable/Monitoring/Investigating]

**Next Steps:**
1. [Action item 1]
2. [Action item 2]

**Point of Contact:** [Name/Slack handle]
```

### 6.2 External Communication (Status Page)

```markdown
**Incident: Service Degradation**

[TIME] - Investigating
We are currently investigating reports of [issue description].

[TIME] - Identified
We have identified the issue and are implementing a fix.

[TIME] - Resolved
The issue has been resolved. We apologize for any inconvenience.

**Post-mortem:** A detailed analysis will be shared within 48 hours.
```

---

## 7. Rollback Testing Procedure

### 7.1 Quarterly Rollback Drill

Every quarter, perform a rollback drill:

1. **Prepare:**
   - Schedule during low-traffic period
   - Notify team members
   - Have monitoring dashboards ready

2. **Execute:**
   - Deploy a test change to staging
   - Practice rollback procedure
   - Measure time to rollback

3. **Document:**
   - Record actual rollback time
   - Note any issues encountered
   - Update procedures if needed

### 7.2 Rollback Time Targets

| Component | Target Rollback Time |
|-----------|---------------------|
| Frontend (Vercel) | < 2 minutes |
| Database (migration) | < 10 minutes |
| Database (full restore) | < 30 minutes |
| Backend services | < 5 minutes |
| Full system | < 15 minutes |

---

## 8. Post-Rollback Actions

### 8.1 Immediate Actions

- [ ] Verify site is accessible
- [ ] Verify authentication works
- [ ] Verify critical user flows work
- [ ] Check error rates are back to normal
- [ ] Monitor for 30 minutes

### 8.2 Short-term Actions (< 24 hours)

- [ ] Document the incident
- [ ] Identify root cause
- [ ] Create fix for the issue
- [ ] Test fix thoroughly in staging
- [ ] Plan re-deployment

### 8.3 Post-mortem Template

```markdown
# Incident Post-Mortem

**Date:** [Date]
**Duration:** [Start time] - [End time]
**Impact:** [Number of users affected, revenue impact]

## Summary
[1-2 sentence summary of what happened]

## Timeline
- [TIME] - [Event]
- [TIME] - [Event]
- [TIME] - Rollback initiated
- [TIME] - Service restored

## Root Cause
[Detailed explanation of what caused the incident]

## Resolution
[What was done to resolve the issue]

## Lessons Learned
1. [Lesson 1]
2. [Lesson 2]

## Action Items
| Action | Owner | Due Date |
|--------|-------|----------|
| [Action] | [Name] | [Date] |

## Prevention
[What we will do to prevent this from happening again]
```

---

## 9. Emergency Contacts

### Internal Team

| Role | Name | Contact |
|------|------|---------|
| On-Call Engineer | [Rotation] | [PagerDuty] |
| Engineering Lead | [Name] | [Phone/Slack] |
| Product Owner | [Name] | [Phone/Slack] |
| CEO/CTO | [Name] | [Phone] |

### External Support

| Service | Support Contact | SLA |
|---------|-----------------|-----|
| Vercel | vercel.com/support | < 1 hour (Pro) |
| Supabase | supabase.com/support | < 4 hours (Pro) |
| Anthropic | support@anthropic.com | Best effort |
| Stripe | dashboard.stripe.com/support | < 1 hour |

---

## 10. Rollback Checklist

### Before Rollback

- [ ] Confirm rollback is necessary (decision matrix)
- [ ] Identify target version/deployment
- [ ] Notify team via Slack
- [ ] Have monitoring dashboards open

### During Rollback

- [ ] Execute rollback procedure
- [ ] Monitor for errors
- [ ] Verify critical flows

### After Rollback

- [ ] Confirm site is stable
- [ ] Update status page
- [ ] Notify stakeholders
- [ ] Schedule post-mortem
- [ ] Create incident report

---

## Quick Reference Card

```
EMERGENCY ROLLBACK COMMANDS
===========================

Vercel (Frontend):
  vercel rollback [deployment-url]

  OR via Dashboard:
  Vercel > Project > Deployments > ... > Promote to Production

Database (Supabase):
  Use PITR in Dashboard > Settings > Database

Backend (if separate):
  railway rollback
  OR: docker run nexus-backend:previous-tag

After Rollback:
  1. Verify site works
  2. Check error rates
  3. Notify team
  4. Document incident
```

---

**Document Version:** 1.0
**Last Updated:** January 12, 2026
**Owner:** Engineering Team
**Review Schedule:** Quarterly
