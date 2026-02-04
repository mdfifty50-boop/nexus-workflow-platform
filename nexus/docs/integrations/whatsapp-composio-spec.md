# WhatsApp Business API Integration Specification

**Version:** 1.0.0
**Last Updated:** 2026-02-02
**Status:** Implementation Ready
**Author:** Nexus Development Team

---

## Executive Summary

This document specifies the integration between Nexus and WhatsApp Business API via Composio. WhatsApp is the primary communication channel for GCC professionals (lawyers, doctors, SME owners) and serves as the core interface for Nexus workflows.

### Key Business Value
| Persona | Pain Point | WhatsApp Solution | ROI |
|---------|------------|-------------------|-----|
| Lawyer (Tareq) | 25+ hrs/week chasing signatures | Automated reminders + document sharing | $97K-195K/year |
| Doctor (Abbas) | Scheduling chaos via WhatsApp | Structured booking + auto-confirmations | $78K-177K/year |
| SME Owner | Invoice chasing, payment delays | Payment reminders + KNET links | $33K-67K/year |

---

## 1. Composio WhatsApp Toolkit Overview

### 1.1 Authentication Methods

| Method | Use Case | Security Level |
|--------|----------|----------------|
| **OAuth 2.0** | Primary - User connects their WhatsApp Business account | High |
| **API Key** | Service-to-service calls (backend workflows) | Medium |

### 1.2 Account Requirements

- **WhatsApp Business Account** required (Personal WhatsApp NOT supported)
- **Facebook Business Manager** account
- **Verified Business** status for full template access
- **Phone Number** registered with WhatsApp Business API

---

## 2. Available Tools (19 Total)

### 2.1 Message Sending Tools

| Tool Slug | Description | Use Case |
|-----------|-------------|----------|
| `WHATSAPP_SEND_MESSAGE` | Send plain text messages | General communication |
| `WHATSAPP_SEND_TEMPLATE_MESSAGE` | Send pre-approved templates | Marketing, reminders, notifications |
| `WHATSAPP_SEND_MEDIA` | Send media via URL | Document sharing, images |
| `WHATSAPP_SEND_MEDIA_BY_ID` | Send pre-uploaded media | Cached files, faster delivery |
| `WHATSAPP_SEND_REPLY` | Reply to specific message | Threaded conversations |
| `WHATSAPP_SEND_CONTACTS` | Share contact cards | Client referrals |
| `WHATSAPP_SEND_LOCATION` | Share GPS coordinates | Office locations, meeting points |

### 2.2 Interactive Message Tools

| Tool Slug | Description | Limits |
|-----------|-------------|--------|
| `WHATSAPP_SEND_INTERACTIVE_BUTTONS` | Quick action buttons | Max 3 buttons |
| `WHATSAPP_SEND_INTERACTIVE_LIST` | Menu with sections | Max 10 sections, 10 rows each |

### 2.3 Template Management Tools

| Tool Slug | Description |
|-----------|-------------|
| `WHATSAPP_CREATE_MESSAGE_TEMPLATE` | Create new template for approval |
| `WHATSAPP_DELETE_MESSAGE_TEMPLATE` | Remove existing template |
| `WHATSAPP_GET_MESSAGE_TEMPLATES` | List all templates |
| `WHATSAPP_GET_TEMPLATE_STATUS` | Check approval status |

### 2.4 Media Management Tools

| Tool Slug | Description | Notes |
|-----------|-------------|-------|
| `WHATSAPP_GET_MEDIA` | Download media | URL valid for 5 minutes |
| `WHATSAPP_GET_MEDIA_INFO` | Get media metadata | Size, type, hash |
| `WHATSAPP_UPLOAD_MEDIA` | Upload to WhatsApp servers | Required for `SEND_MEDIA_BY_ID` |

### 2.5 Account Tools

| Tool Slug | Description |
|-----------|-------------|
| `WHATSAPP_GET_BUSINESS_PROFILE` | Get business name, description, address |
| `WHATSAPP_GET_PHONE_NUMBER` | Get specific number details |
| `WHATSAPP_GET_PHONE_NUMBERS` | List all registered numbers |

---

## 3. Critical Constraints

### 3.1 The 24-Hour Messaging Window

```
┌─────────────────────────────────────────────────────────────────┐
│                    WhatsApp Messaging Rules                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Customer sends message ─────► 24-HOUR WINDOW OPENS             │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────────┐    Within 24 hours:                       │
│  │ Session Message  │ ◄── FREE text, media, buttons, lists     │
│  └──────────────────┘                                           │
│                                                                  │
│  After 24 hours expires:                                        │
│  ┌──────────────────┐                                           │
│  │ Template Message │ ◄── MUST use pre-approved template       │
│  │ (Marketing/Util) │     Subject to per-message cost          │
│  └──────────────────┘                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Implementation Strategy:**
1. Track last customer message timestamp per conversation
2. Check window status before sending
3. Auto-switch to template if window expired
4. Pre-create templates for common workflows

### 3.2 File Size Limits

| Media Type | Max Size | Supported Formats |
|------------|----------|-------------------|
| Images | 16 MB | JPEG, PNG |
| Documents | 100 MB | PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX |
| Audio | 16 MB | MP3, AAC, AMR, OGG |
| Video | 16 MB | MP4, 3GP |
| Stickers | 100 KB | WEBP |

### 3.3 Interactive Element Limits

| Element | Limit | Recommendation |
|---------|-------|----------------|
| Quick Reply Buttons | 3 max | Use for simple yes/no/maybe choices |
| List Sections | 10 max | Group related options (e.g., time slots) |
| Rows per Section | 10 max | Keep lists scannable |
| Button Text | 20 chars | Keep concise |
| List Row Title | 24 chars | Keep scannable |

---

## 4. OAuth Flow Implementation

### 4.1 Connection Flow

```
┌──────────┐     ┌───────────┐     ┌──────────┐     ┌──────────┐
│  Nexus   │     │ Composio  │     │ Facebook │     │ WhatsApp │
│  Client  │     │   OAuth   │     │  Login   │     │ Business │
└────┬─────┘     └─────┬─────┘     └────┬─────┘     └────┬─────┘
     │                 │                 │                │
     │ 1. Connect      │                 │                │
     │────────────────►│                 │                │
     │                 │                 │                │
     │ 2. OAuth URL    │                 │                │
     │◄────────────────│                 │                │
     │                 │                 │                │
     │ 3. Redirect to FB                 │                │
     │────────────────────────────────────►               │
     │                 │                 │                │
     │                 │    4. User grants permissions    │
     │                 │                 │◄───────────────│
     │                 │                 │                │
     │ 5. Callback with code             │                │
     │◄──────────────────────────────────│                │
     │                 │                 │                │
     │ 6. Exchange     │                 │                │
     │────────────────►│                 │                │
     │                 │                 │                │
     │ 7. Access Token │                 │                │
     │◄────────────────│                 │                │
     │                 │                 │                │
```

### 4.2 Required Permissions (Scopes)

```typescript
const WHATSAPP_SCOPES = [
  'whatsapp_business_messaging',
  'whatsapp_business_management',
  'business_management',
  'pages_messaging'
];
```

### 4.3 Token Management

- **Access Token TTL:** 60 days (Composio handles refresh)
- **Refresh Strategy:** Automatic via Composio
- **Error Handling:** Catch 401 → Trigger re-auth flow

---

## 5. Implementation Architecture

### 5.1 Service Layer

```typescript
// nexus/server/services/WhatsAppService.ts

interface WhatsAppService {
  // Connection Management
  initiateConnection(userId: string): Promise<OAuthUrl>;
  checkConnectionStatus(userId: string): Promise<ConnectionStatus>;

  // Messaging
  sendMessage(params: SendMessageParams): Promise<MessageResult>;
  sendTemplateMessage(params: TemplateParams): Promise<MessageResult>;
  sendInteractiveButtons(params: ButtonsParams): Promise<MessageResult>;
  sendInteractiveList(params: ListParams): Promise<MessageResult>;

  // Media
  uploadMedia(file: Buffer, type: MediaType): Promise<MediaId>;
  sendMedia(params: MediaParams): Promise<MessageResult>;

  // Templates
  createTemplate(params: CreateTemplateParams): Promise<TemplateResult>;
  getTemplates(): Promise<Template[]>;
  getTemplateStatus(templateId: string): Promise<TemplateStatus>;

  // Webhooks
  handleIncomingMessage(payload: WebhookPayload): Promise<void>;
  handleStatusUpdate(payload: StatusPayload): Promise<void>;
}
```

### 5.2 Webhook Handler

```typescript
// nexus/server/routes/whatsapp-webhook.ts

interface WebhookPayload {
  object: 'whatsapp_business_account';
  entry: [{
    id: string;
    changes: [{
      field: 'messages' | 'message_template_status_update';
      value: MessageValue | TemplateStatusValue;
    }];
  }];
}

// Webhook Events to Handle:
// 1. messages - Incoming customer messages
// 2. message_template_status_update - Template approval/rejection
// 3. message_status - Delivery/read receipts
```

### 5.3 Tool Slug Mapping

```typescript
// Add to TOOL_SLUGS in WorkflowPreviewCard.tsx

const TOOL_SLUGS: Record<string, Record<string, string>> = {
  // ... existing tools ...

  whatsapp: {
    send: 'WHATSAPP_SEND_MESSAGE',
    'send-template': 'WHATSAPP_SEND_TEMPLATE_MESSAGE',
    'send-media': 'WHATSAPP_SEND_MEDIA',
    'send-buttons': 'WHATSAPP_SEND_INTERACTIVE_BUTTONS',
    'send-list': 'WHATSAPP_SEND_INTERACTIVE_LIST',
    reply: 'WHATSAPP_SEND_REPLY',
    'send-location': 'WHATSAPP_SEND_LOCATION',
    'send-contact': 'WHATSAPP_SEND_CONTACTS',
    'upload-media': 'WHATSAPP_UPLOAD_MEDIA',
    'create-template': 'WHATSAPP_CREATE_MESSAGE_TEMPLATE',
    'list-templates': 'WHATSAPP_GET_MESSAGE_TEMPLATES',
  }
};

// Default action for WhatsApp
const defaultActions: Record<string, string> = {
  // ... existing defaults ...
  whatsapp: 'send',
};
```

---

## 6. Pre-Built Templates for Nexus Workflows

### 6.1 Lawyer Workflows

| Template Name | Purpose | Variables |
|---------------|---------|-----------|
| `nexus_signature_reminder` | Chase signatures | {{client_name}}, {{document_name}}, {{days_pending}} |
| `nexus_court_reminder` | Court date notification | {{case_number}}, {{date}}, {{location}} |
| `nexus_document_ready` | Document pickup | {{document_type}}, {{office_hours}} |
| `nexus_payment_reminder_legal` | Invoice follow-up | {{invoice_number}}, {{amount}}, {{due_date}} |

### 6.2 Doctor Workflows

| Template Name | Purpose | Variables |
|---------------|---------|-----------|
| `nexus_appointment_confirm` | Booking confirmation | {{patient_name}}, {{date}}, {{time}}, {{doctor}} |
| `nexus_appointment_reminder` | 24hr reminder | {{patient_name}}, {{date}}, {{time}} |
| `nexus_lab_results_ready` | Results notification | {{patient_name}}, {{test_type}} |
| `nexus_prescription_ready` | Pharmacy pickup | {{patient_name}}, {{pharmacy_name}} |

### 6.3 SME Owner Workflows

| Template Name | Purpose | Variables |
|---------------|---------|-----------|
| `nexus_invoice_sent` | New invoice notification | {{client_name}}, {{invoice_number}}, {{amount}} |
| `nexus_payment_reminder` | Overdue reminder | {{client_name}}, {{amount}}, {{days_overdue}} |
| `nexus_order_confirmation` | Order placed | {{customer_name}}, {{order_id}}, {{total}} |
| `nexus_shipping_update` | Delivery status | {{customer_name}}, {{tracking_number}} |

---

## 7. Error Handling

### 7.1 Error Categories

| Error Code | Meaning | User Message | Action |
|------------|---------|--------------|--------|
| `131047` | Re-engagement required | "We need permission to message this contact" | Show template option |
| `131051` | Message window expired | "24-hour window closed, using template" | Auto-switch to template |
| `130429` | Rate limit exceeded | "Taking a short break..." | Exponential backoff |
| `131009` | Message too long | "Message shortened automatically" | Truncate + continue |
| `100` | Invalid parameter | "Something went wrong, trying again" | Log + retry with defaults |

### 7.2 Retry Strategy

```typescript
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableErrors: [130429, 500, 503]
};
```

---

## 8. Rate Limits

### 8.1 Messaging Tier Limits

| Tier | Unique Recipients/24h | Requirements |
|------|----------------------|--------------|
| Tier 1 (New) | 1,000 | Verified business |
| Tier 2 | 10,000 | Quality rating: Medium+ |
| Tier 3 | 100,000 | Quality rating: High |
| Tier 4 | Unlimited | Sustained high quality |

### 8.2 API Rate Limits

- **Messages:** 80 requests/second per phone number
- **Media uploads:** 50 requests/minute
- **Template creation:** 10 requests/hour

---

## 9. Security Considerations

### 9.1 Data Handling

- **PII in templates:** Minimize, use variables
- **Media retention:** 5-minute URL validity
- **Webhook verification:** Validate signature on every request

### 9.2 Webhook Verification

```typescript
function verifyWebhookSignature(
  signature: string,
  body: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(`sha256=${expectedSignature}`)
  );
}
```

---

## 10. Testing Strategy

### 10.1 Connection Tests

```typescript
describe('WhatsApp Connection', () => {
  test('initiates OAuth flow');
  test('handles callback and stores token');
  test('refreshes expired token');
  test('detects disconnected state');
});
```

### 10.2 Message Tests

```typescript
describe('WhatsApp Messaging', () => {
  test('sends text message within 24h window');
  test('auto-switches to template after window expires');
  test('sends interactive buttons');
  test('sends interactive list');
  test('handles media upload and send');
});
```

### 10.3 Workflow Integration Tests

```typescript
describe('WhatsApp Workflows', () => {
  test('signature reminder workflow executes');
  test('appointment confirmation workflow executes');
  test('invoice reminder workflow executes');
});
```

---

## 11. Migration Path from AiSensy

The current `WhatsApp.tsx` shows "Coming Soon". Migration steps:

1. **Phase 1:** Enable Composio WhatsApp connection in Integrations page
2. **Phase 2:** Update WhatsApp.tsx to show connection status
3. **Phase 3:** Add WhatsApp as workflow trigger/action
4. **Phase 4:** Remove AiSensy references (currently unused)

---

## 12. Implementation Checklist

### 12.1 Backend Tasks
- [ ] Create `WhatsAppService.ts`
- [ ] Create webhook route `/api/whatsapp-webhook`
- [ ] Add WhatsApp to Composio integration list
- [ ] Add tool slug mappings
- [ ] Create pre-built templates

### 12.2 Frontend Tasks
- [ ] Update `WhatsApp.tsx` from "Coming Soon"
- [ ] Add WhatsApp connection in Integrations
- [ ] Add WhatsApp nodes to workflow builder
- [ ] Create template management UI

### 12.3 Testing Tasks
- [ ] Unit tests for WhatsAppService
- [ ] Integration tests with Composio sandbox
- [ ] E2E tests for complete workflows
- [ ] Arabic message handling tests

---

## Appendix A: Tool Parameter Schemas

### A.1 WHATSAPP_SEND_MESSAGE

```typescript
interface SendMessageParams {
  phone_number_id: string;  // Your business phone number ID
  to: string;               // Recipient phone (E.164 format: +96550123456)
  text: string;             // Message body (max 4096 chars)
  preview_url?: boolean;    // Show link previews
}
```

### A.2 WHATSAPP_SEND_TEMPLATE_MESSAGE

```typescript
interface SendTemplateParams {
  phone_number_id: string;
  to: string;
  template: {
    name: string;           // Template name (e.g., 'nexus_signature_reminder')
    language: {
      code: string;         // e.g., 'en', 'ar'
    };
    components?: [{
      type: 'header' | 'body' | 'button';
      parameters: [{
        type: 'text' | 'image' | 'document';
        text?: string;
        image?: { link: string };
        document?: { link: string; filename: string };
      }];
    }];
  };
}
```

### A.3 WHATSAPP_SEND_INTERACTIVE_BUTTONS

```typescript
interface SendButtonsParams {
  phone_number_id: string;
  to: string;
  interactive: {
    type: 'button';
    header?: {
      type: 'text' | 'image' | 'document';
      text?: string;
    };
    body: {
      text: string;
    };
    footer?: {
      text: string;
    };
    action: {
      buttons: [{
        type: 'reply';
        reply: {
          id: string;      // Unique button ID
          title: string;   // Button text (max 20 chars)
        };
      }]; // Max 3 buttons
    };
  };
}
```

### A.4 WHATSAPP_SEND_INTERACTIVE_LIST

```typescript
interface SendListParams {
  phone_number_id: string;
  to: string;
  interactive: {
    type: 'list';
    header?: {
      type: 'text';
      text: string;
    };
    body: {
      text: string;
    };
    footer?: {
      text: string;
    };
    action: {
      button: string;      // Menu button text
      sections: [{
        title: string;     // Section header
        rows: [{
          id: string;      // Row ID
          title: string;   // Row title (max 24 chars)
          description?: string;
        }]; // Max 10 rows per section
      }]; // Max 10 sections
    };
  };
}
```

---

## Appendix B: Webhook Payload Examples

### B.1 Incoming Message

```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "BUSINESS_ACCOUNT_ID",
    "changes": [{
      "field": "messages",
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "16505551234",
          "phone_number_id": "PHONE_NUMBER_ID"
        },
        "contacts": [{
          "profile": { "name": "Kerry Fisher" },
          "wa_id": "16315551234"
        }],
        "messages": [{
          "from": "16315551234",
          "id": "wamid.ID",
          "timestamp": "1677721600",
          "type": "text",
          "text": { "body": "Hello!" }
        }]
      }
    }]
  }]
}
```

### B.2 Button Click Response

```json
{
  "messages": [{
    "from": "16315551234",
    "id": "wamid.ID",
    "timestamp": "1677721700",
    "type": "interactive",
    "interactive": {
      "type": "button_reply",
      "button_reply": {
        "id": "confirm_yes",
        "title": "Yes, confirm"
      }
    }
  }]
}
```

---

*End of WhatsApp Composio Integration Specification*
