# Cycle 3 - Agent 2: Kuwait Payment Gateway & Composio Coverage Investigation

**Date:** 2026-02-15
**Agent:** 2 (Tool Selection Specialist)
**Cycle:** 3 of 20
**Mission:** Investigate Composio toolkit coverage for Kuwait-critical integrations

---

## EXECUTIVE SUMMARY

**Composio does NOT have native toolkits for any Kuwait-specific payment gateway (Tap, MyFatoorah, UPayments, KNET).** However, Composio DOES have full WhatsApp Business API support (19 tools). The codebase already has a comprehensive KNET mock service and CustomIntegrationService infrastructure that can bridge the gap for payment gateways via API-key-based custom integration.

---

## 1. COMPOSIO TOOLKIT COVERAGE AUDIT

### 1.1 Tap Payment Gateway

| Attribute | Finding |
|-----------|---------|
| **In Composio?** | NO - Not found in Composio's 877+ toolkits |
| **API Type** | REST API with API Key authentication (Bearer token) |
| **Base URL** | `https://api.tap.company/v2/` |
| **Test Key** | `sk_test_oqAcdQztv84agVkCBZEup0Hh` |
| **Key Endpoints** | Charges, Authorizations, Refunds, Invoices, Tokens, Payouts |
| **Payment Methods** | KNET, Visa, Mastercard, Amex, Apple Pay, Google Pay, Samsung Pay, Tabby, mada, Fawry, STC Pay |
| **Docs** | https://developers.tap.company/ |
| **Integration Effort** | MEDIUM - Clean REST API, well-documented, API key auth is simple |

**Key Insight:** Tap is the BEST candidate for a unified Kuwait payment integration because it abstracts KNET + cards + digital wallets behind a single API. Users say "accept payment" and Tap handles the KNET/Visa/mada routing internally.

### 1.2 MyFatoorah

| Attribute | Finding |
|-----------|---------|
| **In Composio?** | NO - Not found |
| **API Type** | REST API with Bearer token authentication |
| **Base URLs** | `https://portal.myfatoorah.com/` (general), region-specific for SA/QA/EG |
| **Key Endpoints** | Embedded Payment, Hosted Payment, Invoicing, Direct Payment, Refunds, Recurring, Card Tokenization |
| **Payment Methods** | KNET, Visa, Mastercard, Apple Pay, Samsung Pay, mada, Benefit, STC Pay |
| **Docs** | https://docs.myfatoorah.com/ |
| **Integration Effort** | MEDIUM - Multiple integration modes (embedded, hosted, direct), Bearer auth |

**Key Insight:** MyFatoorah is the market leader in Kuwait. Most established businesses already have MyFatoorah accounts. Supporting both Tap AND MyFatoorah covers >90% of Kuwait commerce.

### 1.3 UPayments

| Attribute | Finding |
|-----------|---------|
| **In Composio?** | NO - Not found |
| **API Type** | REST API with Bearer token (API Key) |
| **Base URL** | Sandbox: `https://sandboxapi.upayments.com/api/v1/`, Production via merchant dashboard |
| **Key Endpoints** | Make Charge, Check Payment Status, Create Refund, Add Card, Customer Token |
| **Payment Methods** | K-Net, Visa, Mastercard, Apple Pay, Google Pay, Samsung Pay |
| **Docs** | https://developers.upayments.com/ |
| **Integration Effort** | LOW-MEDIUM - Simple charge/refund API, PCI-DSS Level 1 compliant |

### 1.4 KNET (Direct)

| Attribute | Finding |
|-----------|---------|
| **In Composio?** | NO - Not found |
| **API Type** | Legacy HTTP POST with transport password + resource key encryption |
| **Endpoints** | Sandbox: `kpaytest.com.kw`, Production: `kpay.com.kw` |
| **Auth** | Merchant ID + Transport Password + Resource Key + Terminal ID (NOT standard API key) |
| **Codebase Status** | ALREADY IMPLEMENTED (mock) in `nexus/src/lib/payments/` |
| **Integration Effort** | HIGH - Non-standard auth, signature generation, complex redirect flow |

**Key Insight:** Direct KNET integration is ALREADY scaffolded in the codebase with full type definitions, mock service, config, and callback handling. Real implementation stubs exist at `knet-service.ts:372-420`. However, Tap/MyFatoorah/UPayments all abstract KNET internally, making direct KNET integration unnecessary for most use cases.

### 1.5 WhatsApp Business API

| Attribute | Finding |
|-----------|---------|
| **In Composio?** | YES - Full support with 19 tools |
| **Tools Available** | Send Message, Send Reply, Send Media, Send Template Message, Send Interactive Buttons, Send Interactive List, Send Contacts, Send Location, Upload Media, Get Business Profile, Get Phone Numbers, Create/Delete/Get Message Templates, Get Template Status, Get Media, Get Media Info |
| **Auth** | OAuth (managed by Composio) |
| **Codebase Status** | ALREADY in TOOL_SLUGS mapping (line 465-478 of WorkflowPreviewCard.tsx) |
| **Also Available** | TimelinesAI toolkit for WhatsApp CRM management |

**VERDICT: WhatsApp is FULLY COVERED. No gap here.**

---

## 2. EXISTING CODEBASE INFRASTRUCTURE

### 2.1 CustomIntegrationService Pattern

**File:** `nexus/server/services/CustomIntegrationService.ts`

This service is the primary bridge for apps not in Composio. It provides:

```typescript
interface AppAPIInfo {
  name: string;
  displayName: string;
  apiDocsUrl: string;
  apiKeyUrl?: string;
  keyPattern?: RegExp;       // Validates API key format
  keyHint: string;           // Human-readable hint
  setupSteps: string[];      // Step-by-step guide
  baseUrl: string;           // API base URL
  authType: 'api_key' | 'bearer' | 'basic' | 'oauth';
  authHeader?: string;       // Custom header name
  testEndpoint?: string;     // Connection verification
  category: string;
}
```

The service already has 100+ apps registered with:
- API documentation URLs and key pages
- Key format validation via regex
- Step-by-step setup instructions
- Connection testing via test endpoints
- Credential storage (in-memory, production would use encrypted Supabase)
- Direct API execution with stored credentials

**CRITICAL FINDING:** None of the Kuwait payment gateways (Tap, MyFatoorah, UPayments) are in the KNOWN_APP_APIS registry yet.

### 2.2 APIKeyAcquisitionCard UI

**File:** `nexus/src/components/chat/APIKeyAcquisitionCard.tsx`

Already built, with a flow:
1. Show app info + "Get API Key" button
2. Opens API key page in new tab
3. Shows step-by-step instructions
4. Clipboard detection for paste
5. Format validation
6. Connection testing
7. Success/error handling

This is the UX pattern needed for Kuwait payment gateway onboarding.

### 2.3 KNET Service (Mock)

**Files:**
- `nexus/src/lib/payments/knet-types.ts` - 560 lines of types (Payment, Verification, Refund, Callback, UI State)
- `nexus/src/lib/payments/knet-config.ts` - 376 lines (endpoints, merchant config, currency with 3 decimal KWD, callbacks, timeouts)
- `nexus/src/lib/payments/knet-service.ts` - 649 lines (full mock with real API stubs)

The KNET infrastructure is comprehensive:
- KWD currency formatting (3 decimal places, 1 KWD = 1000 fils)
- Arabic/English localization
- Sandbox/production endpoint switching
- Payment initialization, verification, refund, transaction inquiry
- Mock mode for development
- Real implementation stubs (throw "not implemented")

### 2.4 Generic Orchestration System

The 5-layer orchestration system (`USE_GENERIC_ORCHESTRATION = true`) in WorkflowPreviewCard.tsx already handles unknown toolkits:

1. **Layer 1:** Dynamic tool discovery via `RUBE_SEARCH_TOOLS`
2. **Layer 2:** Schema caching (24hr in localStorage)
3. **Layer 3:** Pattern-based UX translation
4. **Layer 4:** State machine for param collection
5. **Layer 5:** Execution via `RUBE_MULTI_EXECUTE_TOOL`

For payment gateways NOT in Composio, this system falls through to the `CustomIntegrationService` path.

### 2.5 Rube proxy_execute Pattern

The Rube MCP's `proxy_execute` function can make direct API calls to any connected toolkit:

```python
proxy_execute(method, endpoint, toolkit, query_params=None, body=None, headers=None)
```

This is available in the remote workbench for recipe execution but is NOT wired into the frontend workflow execution path yet.

---

## 3. STRATEGY: INTEGRATING KUWAIT PAYMENT GATEWAYS

### Strategy A: CustomIntegrationService Extension (RECOMMENDED - Phase 1)

Add Tap, MyFatoorah, and UPayments to `KNOWN_APP_APIS` in CustomIntegrationService.ts:

```typescript
// In server/services/CustomIntegrationService.ts → KNOWN_APP_APIS

tap_payments: {
  name: 'tap_payments',
  displayName: 'Tap Payments',
  apiDocsUrl: 'https://developers.tap.company/',
  apiKeyUrl: 'https://dashboard.tap.company/developers',
  keyPattern: /^sk_(test|live)_[A-Za-z0-9]{20,50}$/,
  keyHint: 'Starts with sk_test_ (sandbox) or sk_live_ (production)',
  setupSteps: [
    'Go to Tap Dashboard → Developers',
    'Copy your Secret API Key',
    'For testing, use the test key (starts with sk_test_)',
  ],
  baseUrl: 'https://api.tap.company/v2',
  authType: 'bearer',
  testEndpoint: '/charges',
  category: 'PAYMENTS',
},

myfatoorah: {
  name: 'myfatoorah',
  displayName: 'MyFatoorah',
  apiDocsUrl: 'https://docs.myfatoorah.com/',
  apiKeyUrl: 'https://portal.myfatoorah.com/',
  keyPattern: /^[A-Za-z0-9_-]{40,100}$/,
  keyHint: 'Bearer token from MyFatoorah portal (40+ characters)',
  setupSteps: [
    'Log into MyFatoorah Portal',
    'Go to Settings → API Key',
    'Generate or copy your API token',
  ],
  baseUrl: 'https://apitest.myfatoorah.com',
  authType: 'bearer',
  testEndpoint: '/v2/GetPaymentMethods',
  category: 'PAYMENTS',
},

upayments: {
  name: 'upayments',
  displayName: 'UPayments',
  apiDocsUrl: 'https://developers.upayments.com/',
  apiKeyUrl: 'https://developers.upayments.com/reference/overview',
  keyPattern: /^[A-Za-z0-9_-]{20,80}$/,
  keyHint: 'API key from UPayments merchant dashboard',
  setupSteps: [
    'Log into UPayments Merchant Dashboard',
    'Navigate to API Settings',
    'Copy your API Key',
  ],
  baseUrl: 'https://sandboxapi.upayments.com/api/v1',
  authType: 'bearer',
  testEndpoint: '/check-payment-button-status',
  category: 'PAYMENTS',
},
```

**Effort:** ~50 lines of config + test endpoints. LOW.

### Strategy B: TOOL_SLUGS Extension (Phase 2)

Add payment gateway tool slugs to WorkflowPreviewCard.tsx for workflow node rendering:

```typescript
// Add to TOOL_SLUGS in WorkflowPreviewCard.tsx
tap: {
  charge: 'CUSTOM_TAP_CREATE_CHARGE',
  refund: 'CUSTOM_TAP_CREATE_REFUND',
  invoice: 'CUSTOM_TAP_CREATE_INVOICE',
  default: 'CUSTOM_TAP_CREATE_CHARGE',
},
myfatoorah: {
  payment: 'CUSTOM_MYFATOORAH_CREATE_PAYMENT',
  invoice: 'CUSTOM_MYFATOORAH_SEND_INVOICE',
  refund: 'CUSTOM_MYFATOORAH_REFUND',
  default: 'CUSTOM_MYFATOORAH_CREATE_PAYMENT',
},
upayments: {
  charge: 'CUSTOM_UPAYMENTS_MAKE_CHARGE',
  refund: 'CUSTOM_UPAYMENTS_CREATE_REFUND',
  default: 'CUSTOM_UPAYMENTS_MAKE_CHARGE',
},
knet: {
  pay: 'CUSTOM_KNET_INITIALIZE_PAYMENT',
  verify: 'CUSTOM_KNET_VERIFY_PAYMENT',
  refund: 'CUSTOM_KNET_REFUND',
  default: 'CUSTOM_KNET_INITIALIZE_PAYMENT',
},
```

**Execution Path:** These `CUSTOM_*` slugs would route to `CustomIntegrationService.executeRequest()` instead of Rube MCP.

### Strategy C: Unified Payment Abstraction Layer (Phase 3)

Create a `KuwaitPaymentService` that abstracts all 4 gateways behind a single interface:

```typescript
// nexus/src/services/KuwaitPaymentService.ts
interface PaymentRequest {
  amount: number;          // In KWD (3 decimal places)
  description: string;
  customerEmail?: string;
  customerPhone?: string;
  gateway: 'tap' | 'myfatoorah' | 'upayments' | 'knet';
}

interface PaymentResult {
  success: boolean;
  transactionId: string;
  redirectUrl?: string;    // For KNET redirect flow
  receiptUrl?: string;
}

class KuwaitPaymentService {
  async createPayment(request: PaymentRequest): Promise<PaymentResult>;
  async verifyPayment(transactionId: string, gateway: string): Promise<PaymentVerification>;
  async refundPayment(transactionId: string, amount: number, gateway: string): Promise<RefundResult>;
  async getAvailableGateways(): Promise<string[]>;  // Based on stored API keys
}
```

The AI would recommend the best gateway based on:
- Which gateways the user has API keys for
- Payment method needed (KNET only vs international cards)
- Transaction amount (some gateways have different fee structures)

### Strategy D: Composio Feature Request (Long-term)

File a feature request with Composio to add Tap and MyFatoorah as native toolkits. Given that Composio targets AI agent workflows and MENA is a growing market, they may add these. But this is a 3-6 month timeline and should NOT block development.

---

## 4. IMPLEMENTATION PRIORITY

| Phase | Action | Effort | Impact |
|-------|--------|--------|--------|
| **Phase 1** | Add Tap/MyFatoorah/UPayments to `KNOWN_APP_APIS` in CustomIntegrationService | 2-3 hours | Users can onboard payment gateways via API key flow |
| **Phase 2** | Add `CUSTOM_*` tool slugs + custom execution path | 1-2 days | Payment nodes appear in workflow visualization |
| **Phase 3** | Build KuwaitPaymentService abstraction | 3-5 days | Unified payment interface, AI auto-selects gateway |
| **Phase 4** | Wire KNET real API (knet-service.ts stubs) | 2-3 days | Direct KNET for businesses without Tap/MyFatoorah |
| **Phase 5** | Request Composio native support | 0 effort | Wait for Composio to add, then migrate |

**Recommended approach:** Tap as primary recommendation (covers KNET + cards + wallets in one integration), MyFatoorah as alternative (market leader), UPayments as third option. Direct KNET only for legacy integrations.

---

## 5. GAP ANALYSIS SUMMARY

| Integration | In Composio? | In TOOL_SLUGS? | In CustomIntegration? | In Codebase? | Gap |
|-------------|-------------|----------------|----------------------|--------------|-----|
| **Tap** | NO | NO | NO | NO | Full gap - needs CustomIntegration entry + execution path |
| **MyFatoorah** | NO | NO | NO | NO | Full gap - needs CustomIntegration entry + execution path |
| **UPayments** | NO | NO | NO | NO | Full gap - needs CustomIntegration entry + execution path |
| **KNET (direct)** | NO | NO | NO | YES (mock) | Partially built - mock service exists, real API stubs need implementation |
| **WhatsApp Business** | YES (19 tools) | YES (7 actions) | N/A | YES (full) | **NO GAP** - fully supported |

---

## 6. RISK ASSESSMENT

### High Risk
- **PCI Compliance:** Handling payment credentials requires PCI-DSS awareness. CustomIntegrationService stores API keys in-memory (acceptable for server-side secret keys, NOT for card data). Card data never touches Nexus servers since all gateways handle it via redirect/embedded forms.
- **KWD Precision:** KWD uses 3 decimal places. The existing `knet-config.ts` handles this correctly. All payment services must preserve 3-decimal precision.

### Medium Risk
- **Gateway API Changes:** Tap and MyFatoorah update APIs periodically. Schema caching in the orchestration layer should have shorter TTLs for payment tools.
- **Sandbox vs Production:** Different base URLs per gateway. Must not accidentally use sandbox in production. Existing KNET config pattern (environment-based switching) should be replicated.

### Low Risk
- **WhatsApp:** Fully supported, no gaps.
- **CustomIntegrationService architecture:** Already battle-tested with 100+ apps, well-structured interface.

---

## 7. RECOMMENDATIONS FOR BOARDROOM

1. **IMMEDIATE (Phase 1):** Add Tap, MyFatoorah, UPayments to CustomIntegrationService. This is ~50 lines of config and unlocks API key onboarding for all three gateways immediately.

2. **SHORT-TERM (Phase 2):** Add payment workflow nodes so users can say "When I get a new order, charge via Tap and notify me on WhatsApp" and see it as a visual workflow with payment + WhatsApp nodes.

3. **MEDIUM-TERM (Phase 3):** Build KuwaitPaymentService abstraction so the AI can intelligently recommend "I'll use Tap since it supports KNET + Visa in one integration" vs "You already have MyFatoorah connected, I'll use that."

4. **DO NOT pursue direct KNET integration** unless a customer explicitly requires it. Tap/MyFatoorah/UPayments all wrap KNET internally. The existing KNET mock service is valuable for UI development but the real API implementation (Phase 4) should be deprioritized.

5. **WhatsApp requires zero additional work** - it is the strongest integration point for Kuwait workflows.

---

## 8. FILES REFERENCED

| File | Lines | Purpose |
|------|-------|---------|
| `nexus/server/services/CustomIntegrationService.ts` | 2500+ | Custom API key integration service (100+ apps, needs Kuwait payment entries) |
| `nexus/server/routes/customIntegrations.ts` | ~200 | REST routes for custom integration management |
| `nexus/src/components/chat/WorkflowPreviewCard.tsx` | 5500+ | TOOL_SLUGS mapping (line 426-773), workflow execution engine |
| `nexus/src/components/chat/APIKeyAcquisitionCard.tsx` | ~300 | UI for API key onboarding (reusable for payment gateways) |
| `nexus/src/lib/payments/knet-service.ts` | 649 | KNET mock service with real API stubs |
| `nexus/src/lib/payments/knet-config.ts` | 376 | KNET config (endpoints, merchant, currency, callbacks) |
| `nexus/src/lib/payments/knet-types.ts` | 561 | KNET TypeScript type definitions |
| `nexus/src/services/RubeExecutionBridge.ts` | ~400 | Bridge from Nexus workflows to Rube MCP |
| `nexus/src/services/orchestration/GenericSchemaResolver.ts` | ~400 | 5-layer orchestration for unknown toolkits |
