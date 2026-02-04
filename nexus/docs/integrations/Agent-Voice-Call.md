# Agent Voice Call Integration Guide

**Status:** Phase 2 (Pending Kuwait Phone Number)
**Last Updated:** 2026-02-03
**Priority:** High - Core GCC Feature

---

## Overview

This document contains the complete setup guide for integrating AI voice calls into Nexus workflows. The system uses ElevenLabs Conversational AI with a Kuwait phone number (+965) for GCC market credibility.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEXUS VOICE CALL FLOW                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  User creates workflow with "Call" action                       │
│  WorkflowPreviewCard collects: phone number, message/script     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Nexus Backend triggers ElevenLabs API                          │
│  POST /v1/convai/conversation/outbound-call                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  ElevenLabs → SIP Trunk → Kuwait Number Provider                │
│  Outbound call placed from +965 xxxx xxxx                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  AI Agent conducts conversation (Arabic/English)                │
│  Conversation logged and returned to Nexus                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Current Setup (Completed)

### ElevenLabs Configuration

| Item | Value |
|------|-------|
| Agent Name | Nexus Voice Assistant |
| Agent ID | `agent_5301kghx4yw7ef0rywjv84dybgeg` |
| Phone Number ID | `phnum_8001kgj26baperjsvp40rp6pzxmv` |
| Current Phone | +1 518 255 7079 (US - Twilio Trial) |
| Label | Nexus Voice Agent |

### Twilio Configuration

| Item | Value |
|------|-------|
| Account Status | Trial ($14.35 remaining) |
| Kuwait Geo-Permissions | ENABLED |
| Integration | Native with ElevenLabs |

### Test Call Results (2026-02-03)

- **Destination:** +965 9004 4104 (Kuwait)
- **Status:** SUCCESS - Call connected
- **Voice:** English (needs Arabic configuration)
- **Note:** Trial account message played

---

## Phase 2: Kuwait Phone Number Setup

### Why Kuwait Number is Required

1. **Local Presence:** Calls from +965 build trust with GCC users
2. **Caller ID:** Users see a local number, not international
3. **Compliance:** Some GCC businesses only accept local calls
4. **Cost:** Local calls are cheaper for recipients

### Provider Comparison

| Provider | Monthly Cost | Number Types | Activation | SIP Support | Recommendation |
|----------|--------------|--------------|------------|-------------|----------------|
| **DIDLogic** | ~$50-100 | Local, National, Mobile, Toll-Free | 8-48 hours | Yes | **BEST VALUE** |
| AVOXI | $191.99 | National | KYC required | Yes | Premium option |
| Global Call Forwarding | $198.95 | National, 2-Way | 1-7 days | Yes | Reliable |
| United World Telecom | $198.95 | National | 1-7 days | Yes | Same as above |

### Recommended Provider: DIDLogic

**Website:** https://didlogic.com/virtual-phone-numbers/kuwait/

**Why DIDLogic:**
- Lowest cost (~$50-100/month vs $200 for others)
- Mobile numbers available (9xxx xxxx format - looks personal)
- Fast activation (8 hours)
- SIP trunking included
- No channel/seat fees

**KYC Requirements:**
- Business registration (if applicable)
- ID/Passport
- Proof of address
- May require in-region address

---

## SIP Trunk Setup Instructions

### Step 1: Get Kuwait Number from DIDLogic

1. Create account at https://didlogic.com
2. Go to Dashboard → Numbers → Buy a Number
3. Select Country: Kuwait (+965)
4. Choose number type: Mobile (recommended) or National
5. Complete KYC verification
6. Note your SIP credentials:
   - SIP Server/Host
   - Username
   - Password
   - Port (usually 5060 or 5061 for TLS)

### Step 2: Configure ElevenLabs SIP Trunk

1. Go to https://elevenlabs.io/app/agents/phone-numbers
2. Click **"Import a phone number from SIP trunk"**
3. Fill in the configuration:

```
Label: Nexus Kuwait Line
Phone Number: +965XXXXXXXX (your Kuwait number in E.164 format)

INBOUND SETTINGS:
- Transport: TLS (recommended) or TCP
- Media Encryption: Required (recommended)

OUTBOUND SETTINGS:
- Address: [DIDLogic SIP server hostname]
- Port: 5061 (for TLS) or 5060 (for TCP)
- Transport: TLS
- Media Encryption: Required

AUTHENTICATION:
- Username: [Your DIDLogic SIP username]
- Password: [Your DIDLogic SIP password]
```

4. Click **"Import"**
5. Assign to agent: **Nexus Voice Assistant**

### Step 3: Test the Connection

1. Go to Phone Numbers → Your Kuwait number
2. Click **"Outbound call"**
3. Select agent: Nexus Voice Assistant
4. Enter test number: Your personal number
5. Click **"Send Test Call"**
6. Verify call connects and AI speaks

---

## Arabic Voice Configuration

### Current Issue
Test call used English voice. Need to configure Arabic (Gulf dialect).

### Steps to Add Arabic Voice

1. Go to https://elevenlabs.io/app/agents/agents
2. Select **Nexus Voice Assistant**
3. Go to **Voice** settings
4. Options:
   - Use ElevenLabs Arabic voice (if available)
   - Clone a custom Arabic voice
   - Use multilingual voice with Arabic support

### Recommended Arabic Voices

| Voice | Provider | Dialect | Quality |
|-------|----------|---------|---------|
| ElevenLabs Multilingual | ElevenLabs | MSA + Gulf | High |
| Custom Clone | ElevenLabs | Gulf (Kuwaiti) | Highest |

### Language Detection

Configure agent to:
1. Detect caller's language from first response
2. Switch between Arabic/English automatically
3. Default to Arabic for +965 numbers

---

## Cost Estimates

### Setup Costs
- ElevenLabs SIP configuration: **FREE**
- DIDLogic account: **FREE**
- Kuwait number activation: **FREE** (included in monthly)

### Monthly Costs

| Item | Cost |
|------|------|
| Kuwait Number (DIDLogic) | $50-100 |
| ElevenLabs Starter Plan | $5-22 |
| **Base Monthly** | **$55-122** |

### Per-Minute Costs

| Component | Cost/Minute |
|-----------|-------------|
| ElevenLabs AI Voice | $0.06-0.12 |
| SIP Termination | $0.02-0.05 |
| **Total** | **$0.08-0.17** |

### Usage Scenarios

| Scenario | Calls/Month | Minutes | Est. Total |
|----------|-------------|---------|------------|
| Light | 50 | 250 | $70-100 |
| Medium | 200 | 1,000 | $150-200 |
| Heavy | 500 | 2,500 | $300-400 |

---

## Nexus Integration Code

### Backend API Endpoint

Location: `server/routes/voice.ts` (to be created)

```typescript
// POST /api/voice/outbound-call
interface OutboundCallRequest {
  to: string;           // E.164 format: +96590044104
  agentId?: string;     // Default: Nexus Voice Assistant
  context?: {           // Passed to AI agent
    userName?: string;
    purpose?: string;
    language?: 'ar' | 'en' | 'auto';
    workflowId?: string;
  };
}

interface OutboundCallResponse {
  callId: string;
  status: 'initiated' | 'ringing' | 'connected' | 'completed' | 'failed';
  duration?: number;
  transcript?: string;
}
```

### ElevenLabs API Call

```typescript
const response = await fetch('https://api.elevenlabs.io/v1/convai/conversation/outbound-call', {
  method: 'POST',
  headers: {
    'xi-api-key': process.env.ELEVENLABS_API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    agent_id: 'agent_5301kghx4yw7ef0rywjv84dybgeg',
    agent_phone_number_id: 'phnum_XXXXXX', // Kuwait number ID
    to_phone_number: '+96590044104',
    conversation_initiation_data: {
      custom_data: {
        user_name: context.userName,
        purpose: context.purpose
      }
    }
  })
});
```

### Frontend Service

Location: `src/services/VoiceCallService.ts` (to be created)

```typescript
export class VoiceCallService {
  async initiateCall(phoneNumber: string, context?: CallContext): Promise<CallResult> {
    const response = await fetch('/api/voice/outbound-call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: phoneNumber, context })
    });
    return response.json();
  }

  async getCallStatus(callId: string): Promise<CallStatus> {
    const response = await fetch(`/api/voice/call/${callId}/status`);
    return response.json();
  }
}
```

---

## Workflow Integration

### Tool Definition

```typescript
// In workflow tools catalog
{
  id: 'voice_call',
  name: 'AI Voice Call',
  description: 'Make an AI-powered voice call',
  category: 'communication',
  icon: 'phone',
  enabled: false, // DISABLED until Phase 2
  requiredParams: ['phoneNumber'],
  optionalParams: ['message', 'language', 'voiceId'],
  provider: 'elevenlabs',
  status: 'coming_soon'
}
```

### WorkflowPreviewCard Integration

When voice_call tool is used:
1. Show phone number input field
2. Show optional message/script field
3. Show language selector (Arabic/English/Auto)
4. Execute via VoiceCallService

---

## Security Considerations

1. **Rate Limiting:** Max 10 calls/minute per user
2. **Number Validation:** Only allow valid E.164 numbers
3. **Consent:** User must confirm before call is placed
4. **Recording Disclosure:** AI must disclose call may be recorded
5. **Cost Caps:** Set monthly spending limits per user

---

## Troubleshooting

### Call Not Connecting

1. Check SIP credentials are correct
2. Verify Kuwait number is active
3. Check ElevenLabs agent is assigned
4. Verify geo-permissions in Twilio/SIP provider

### Poor Audio Quality

1. Use TLS transport (not TCP)
2. Enable media encryption
3. Check network latency to SIP server

### Wrong Language

1. Configure agent's default language
2. Set language detection in agent prompt
3. Pass language hint in conversation_initiation_data

---

## Links & Resources

### Providers
- DIDLogic: https://didlogic.com/virtual-phone-numbers/kuwait/
- AVOXI: https://www.avoxi.com/kuwait-virtual-phone-numbers/
- Global Call Forwarding: https://www.globalcallforwarding.com/services/virtual-phone-numbers/kuwait-virtual-phone-numbers/

### ElevenLabs Documentation
- SIP Trunking: https://elevenlabs.io/docs/agents-platform/phone-numbers/sip-trunking
- Outbound Calls API: https://elevenlabs.io/docs/api-reference/sip-trunk/outbound-call
- Agents Platform: https://elevenlabs.io/app/agents

### Nexus Dashboard
- ElevenLabs Agents: https://elevenlabs.io/app/agents/agents
- Phone Numbers: https://elevenlabs.io/app/agents/phone-numbers

---

## Checklist for Phase 2 Activation

- [ ] Sign up for DIDLogic account
- [ ] Complete KYC verification
- [ ] Purchase Kuwait phone number (+965)
- [ ] Note SIP credentials
- [ ] Configure SIP trunk in ElevenLabs
- [ ] Assign Kuwait number to Nexus Voice Assistant
- [ ] Configure Arabic voice
- [ ] Test outbound call to Kuwait
- [ ] Create backend API endpoint
- [ ] Create frontend VoiceCallService
- [ ] Enable voice_call tool in workflow catalog
- [ ] Update WorkflowPreviewCard for voice calls
- [ ] Add rate limiting and security
- [ ] Test end-to-end workflow

---

## Contact & Support

- **ElevenLabs Support:** https://help.elevenlabs.io
- **DIDLogic Support:** https://didlogic.com/support/
- **Twilio Support:** https://support.twilio.com

---

*Document created by Nexus AI Assistant*
*Ready for Phase 2 implementation when Kuwait number is acquired*
