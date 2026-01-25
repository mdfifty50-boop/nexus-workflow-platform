# Integration API Specifications - Nexus Platform

**Date:** 2026-01-06
**Author:** Mohammed
**Purpose:** Address Blocker #7 from Implementation Readiness Report - Document OAuth scopes and API requirements for external integrations

---

## Executive Summary

This document specifies OAuth scopes, API endpoints, rate limits, and implementation requirements for Nexus platform integrations with Salesforce, HubSpot, Gmail, Slack, and other external services.

**Integration Categories:**
1. **CRM Systems** - Salesforce, HubSpot
2. **Email Providers** - Gmail, Outlook
3. **Communication** - Slack, Microsoft Teams
4. **Calendar** - Google Calendar, Outlook Calendar
5. **Payment** - Stripe (webhook-based, no OAuth)

---

## Salesforce Integration

### OAuth 2.0 Configuration

**Auth URL:** `https://login.salesforce.com/services/oauth2/authorize`
**Token URL:** `https://login.salesforce.com/services/oauth2/token`
**Scopes Required:**
```
api refresh_token offline_access
```

**OAuth Flow:**
```typescript
const authUrl = `https://login.salesforce.com/services/oauth2/authorize?` +
  `client_id=${SALESFORCE_CLIENT_ID}&` +
  `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
  `response_type=code&` +
  `scope=api%20refresh_token%20offline_access`;
```

### API Endpoints Used

| Endpoint | Method | Purpose | Rate Limit |
|----------|--------|---------|------------|
| `/services/data/v58.0/sobjects/Lead` | GET | Fetch leads | 1,000/day |
| `/services/data/v58.0/sobjects/Lead` | POST | Create lead | 1,000/day |
| `/services/data/v58.0/sobjects/Lead/{id}` | PATCH | Update lead | 1,000/day |
| `/services/data/v58.0/query` | GET | SOQL queries | 15,000/day |

### Story Implementation

**Story 6.1:** Salesforce OAuth Connection
- Store credentials in `integration_credentials` table (encrypted)
- Refresh token every 2 hours (expires in 3 hours)
- Handle `INVALID_SESSION_ID` errors with auto-refresh

**Story 6.2:** CRM Data Sync
- Sync leads, contacts, opportunities
- Use bulk API for >200 records
- Implement webhook listener for real-time updates

---

## HubSpot Integration

### OAuth 2.0 Configuration

**Auth URL:** `https://app.hubspot.com/oauth/authorize`
**Token URL:** `https://api.hubapi.com/oauth/v1/token`
**Scopes Required:**
```
crm.objects.contacts.read
crm.objects.contacts.write
crm.objects.companies.read
crm.objects.companies.write
crm.objects.deals.read
crm.objects.deals.write
```

### API Endpoints

| Endpoint | Method | Purpose | Rate Limit |
|----------|--------|---------|------------|
| `/crm/v3/objects/contacts` | GET | List contacts | 100 req/10s |
| `/crm/v3/objects/contacts` | POST | Create contact | 100 req/10s |
| `/crm/v3/objects/contacts/{id}` | PATCH | Update contact | 100 req/10s |
| `/crm/v3/objects/contacts/batch/read` | POST | Batch read | 4 req/s |

### Rate Limit Handling

```typescript
// Implement token bucket algorithm
class HubSpotRateLimiter {
  private tokens = 100;
  private lastRefill = Date.now();

  async acquire(): Promise<void> {
    // Refill bucket (100 tokens per 10 seconds)
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(100, this.tokens + timePassed * 10);
    this.lastRefill = now;

    if (this.tokens < 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.acquire();
    }

    this.tokens -= 1;
  }
}
```

---

## Gmail Integration

### OAuth 2.0 Configuration

**Auth URL:** `https://accounts.google.com/o/oauth2/v2/auth`
**Token URL:** `https://oauth2.googleapis.com/token`
**Scopes Required:**
```
https://www.googleapis.com/auth/gmail.send
https://www.googleapis.com/auth/gmail.readonly
https://www.googleapis.com/auth/gmail.modify
```

### API Endpoints

| Endpoint | Method | Purpose | Rate Limit |
|----------|--------|---------|------------|
| `/gmail/v1/users/me/messages/send` | POST | Send email | 100/user/second |
| `/gmail/v1/users/me/messages` | GET | List messages | 250 quota units/user/second |
| `/gmail/v1/users/me/messages/{id}` | GET | Get message | 5 quota units/request |

### Gmail API Quotas

**Daily Limits:**
- 1 billion quota units per day (shared across all endpoints)
- 250 quota units per user per second

**Cost per Operation:**
- Send email: 100 quota units
- List messages: 5 quota units
- Get message: 5 quota units

**Story Implementation:**
- Cache message list for 5 minutes to reduce quota usage
- Batch operations where possible
- Implement exponential backoff for 429 errors

---

## Google Calendar Integration

### OAuth 2.0 Configuration

**Scopes Required:**
```
https://www.googleapis.com/auth/calendar
https://www.googleapis.com/auth/calendar.events
```

### API Endpoints

| Endpoint | Method | Purpose | Rate Limit |
|----------|--------|---------|------------|
| `/calendar/v3/calendars/primary/events` | GET | List events | 1M req/day |
| `/calendar/v3/calendars/primary/events` | POST | Create event | 1M req/day |
| `/calendar/v3/calendars/primary/events/{id}` | PATCH | Update event | 1M req/day |

---

## Slack Integration

### OAuth 2.0 Configuration

**Auth URL:** `https://slack.com/oauth/v2/authorize`
**Token URL:** `https://slack.com/api/oauth.v2.access`
**Scopes Required:**
```
chat:write
chat:write.public
channels:read
users:read
files:write
```

### API Endpoints

| Endpoint | Method | Purpose | Rate Limit |
|----------|--------|---------|------------|
| `/api/chat.postMessage` | POST | Send message | Tier 3 (50+ req/min) |
| `/api/conversations.list` | GET | List channels | Tier 2 (20 req/min) |
| `/api/users.info` | GET | Get user info | Tier 4 (100+ req/min) |

### Rate Limit Tiers

- **Tier 1:** 1+ requests per minute
- **Tier 2:** 20+ requests per minute
- **Tier 3:** 50+ requests per minute
- **Tier 4:** 100+ requests per minute

---

## Integration Credentials Storage

### Database Schema

```sql
CREATE TABLE integration_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID NOT NULL REFERENCES users(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  provider TEXT NOT NULL, -- 'salesforce', 'hubspot', 'gmail', etc.
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  scopes TEXT[], -- Array of granted scopes
  metadata JSONB DEFAULT '{}'::jsonb, -- Provider-specific data
  UNIQUE(user_id, project_id, provider)
);

-- Encryption key stored in AWS Secrets Manager
-- Never log or expose tokens in plain text
```

### Token Encryption

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ENCRYPTION_KEY = process.env.INTEGRATION_TOKEN_ENCRYPTION_KEY; // 32 bytes
const ALGORITHM = 'aes-256-gcm';

function encryptToken(token: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

function decryptToken(encryptedToken: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedToken.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

---

## Resolution of Blocker #7

**Original Blocker:** Epic 6 stories cannot be implemented without integration API specs

**Status:** ✅ **RESOLVED**

**Deliverables:**
1. ✅ OAuth scopes for Salesforce, HubSpot, Gmail, Slack
2. ✅ API endpoints and rate limits
3. ✅ Token encryption strategy
4. ✅ Rate limit handling patterns
5. ✅ Database schema for credentials storage

**Implementation Readiness:** Epic 6 (Integrations) can now proceed
