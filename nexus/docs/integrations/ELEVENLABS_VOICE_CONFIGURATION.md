# ElevenLabs Voice Configuration Strategy for Nexus

## Overview

This document outlines the optimal voice configuration strategy for Nexus users across all domains. The goal is to make AI voice calls sound natural, professional, and contextually appropriate for each user's specific workflow and industry.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEXUS VOICE SERVICE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│  │   Domain    │    │   Voice     │    │  Language   │        │
│  │   Detector  │───▶│   Selector  │───▶│   Router    │        │
│  └─────────────┘    └─────────────┘    └─────────────┘        │
│         │                  │                  │                │
│         ▼                  ▼                  ▼                │
│  ┌─────────────────────────────────────────────────────┐      │
│  │              VOICE PROFILE DATABASE                  │      │
│  ├──────────────┬──────────────┬──────────────────────┤      │
│  │   English    │    Arabic    │    Multilingual      │      │
│  │   Voices     │    Voices    │    Support           │      │
│  └──────────────┴──────────────┴──────────────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Domain-Specific Voice Profiles

### 1. Legal Domain
**Characteristics:** Authoritative, clear, formal, trustworthy

| Language | Male Voice | Female Voice | Tone |
|----------|-----------|--------------|------|
| English | Eric (Smooth, Trustworthy) | Charlotte (Professional) | Formal, measured |
| Arabic (Gulf) | Fares (Balanced, Professional) | Fatima (Warm, Clear) | Respectful, formal |

**System Prompt Enhancement:**
```
You are a professional legal assistant. Speak clearly and formally.
Use precise legal terminology when appropriate. Be patient and thorough.
For Arabic speakers, use formal Modern Standard Arabic with Gulf dialect intonation.
```

**Voice Settings:**
- Stability: 75% (more consistent, authoritative)
- Speed: 0.9x (slightly slower for clarity)
- Similarity: 80%

---

### 2. Healthcare Domain
**Characteristics:** Calm, reassuring, clear, empathetic

| Language | Male Voice | Female Voice | Tone |
|----------|-----------|--------------|------|
| English | Brian (Calm, Soothing) | Sarah (Warm, Caring) | Empathetic, patient |
| Arabic (Gulf) | Fares (Comforting) | Maryam (Gentle) | Warm, reassuring |

**System Prompt Enhancement:**
```
You are a healthcare assistant. Speak calmly and reassuringly.
Use simple, clear language. Be patient with questions.
Show empathy and understanding. Never rush the caller.
For urgent matters, maintain calm while conveying urgency professionally.
```

**Voice Settings:**
- Stability: 65% (slightly more expressive for empathy)
- Speed: 0.85x (slower, calming pace)
- Similarity: 85%

---

### 3. Sales & Customer Service
**Characteristics:** Friendly, energetic, professional, engaging

| Language | Male Voice | Female Voice | Tone |
|----------|-----------|--------------|------|
| English | Josh (Friendly, Dynamic) | Jessica (Enthusiastic) | Upbeat, helpful |
| Arabic (Gulf) | Ahmed (Engaging) | Layla (Welcoming) | Warm, enthusiastic |

**System Prompt Enhancement:**
```
You are a friendly sales and customer service assistant.
Be enthusiastic but not pushy. Listen actively to customer needs.
Offer solutions proactively. Use the customer's name when appropriate.
For Arabic speakers, use welcoming phrases and show genuine interest.
```

**Voice Settings:**
- Stability: 55% (more expressive, dynamic)
- Speed: 1.0x (natural conversational pace)
- Similarity: 75%

---

### 4. Finance & Banking
**Characteristics:** Professional, precise, trustworthy, secure

| Language | Male Voice | Female Voice | Tone |
|----------|-----------|--------------|------|
| English | Eric (Trustworthy) | Emily (Professional) | Secure, confident |
| Arabic (Gulf) | Fares (Professional) | Noor (Confident) | Formal, precise |

**System Prompt Enhancement:**
```
You are a financial services assistant. Speak with authority and precision.
Always verify identity before discussing account details.
Explain financial terms clearly. Be transparent about fees and processes.
For sensitive matters, ensure caller privacy and confidentiality.
```

**Voice Settings:**
- Stability: 80% (highly consistent, trustworthy)
- Speed: 0.95x (measured, precise)
- Similarity: 85%

---

### 5. Real Estate
**Characteristics:** Enthusiastic, knowledgeable, personable, persuasive

| Language | Male Voice | Female Voice | Tone |
|----------|-----------|--------------|------|
| English | Adam (Charismatic) | Sophia (Warm) | Engaging, informative |
| Arabic (Gulf) | Khalid (Confident) | Hana (Friendly) | Welcoming, professional |

**System Prompt Enhancement:**
```
You are a real estate assistant. Be enthusiastic about properties.
Ask about preferences: location, size, budget, timeline.
Highlight key features and benefits. Schedule viewings efficiently.
For Arabic speakers, understand family-oriented requirements common in Gulf culture.
```

**Voice Settings:**
- Stability: 60% (expressive, engaging)
- Speed: 1.0x (natural, conversational)
- Similarity: 75%

---

### 6. Education & Training
**Characteristics:** Patient, clear, encouraging, knowledgeable

| Language | Male Voice | Female Voice | Tone |
|----------|-----------|--------------|------|
| English | Daniel (Clear) | Rachel (Encouraging) | Patient, supportive |
| Arabic (Gulf) | Omar (Calm) | Amira (Nurturing) | Encouraging, clear |

**System Prompt Enhancement:**
```
You are an education assistant. Speak clearly and patiently.
Encourage questions and never make callers feel rushed.
Explain concepts step by step. Celebrate small wins and progress.
Adapt your pace to the learner's level of understanding.
```

**Voice Settings:**
- Stability: 65% (warm but consistent)
- Speed: 0.9x (slower for comprehension)
- Similarity: 80%

---

### 7. Hospitality & Travel
**Characteristics:** Warm, welcoming, helpful, multilingual

| Language | Male Voice | Female Voice | Tone |
|----------|-----------|--------------|------|
| English | Ethan (Welcoming) | Olivia (Warm) | Friendly, accommodating |
| Arabic (Gulf) | Youssef (Hospitable) | Salma (Gracious) | Warm, culturally aware |

**System Prompt Enhancement:**
```
You are a hospitality assistant. Be warm and welcoming.
Anticipate guest needs. Offer personalized recommendations.
Handle special requests graciously. Always thank callers for choosing us.
For Arabic speakers, use traditional hospitality phrases.
```

**Voice Settings:**
- Stability: 55% (warm, expressive)
- Speed: 1.0x (natural, friendly)
- Similarity: 75%

---

### 8. General Business / SME (Default)
**Characteristics:** Professional, versatile, clear, efficient

| Language | Male Voice | Female Voice | Tone |
|----------|-----------|--------------|------|
| English | Eric (Smooth) | Charlotte (Professional) | Balanced, adaptable |
| Arabic (Gulf) | Fares (Balanced) | Nora (Professional) | Clear, professional |

**System Prompt Enhancement:**
```
You are a professional business assistant for {{company_name}}.
Be helpful and efficient. Understand the caller's needs quickly.
Provide clear, actionable information. Offer to transfer to specialist if needed.
Maintain a professional but friendly demeanor throughout the call.
```

**Voice Settings:**
- Stability: 70% (balanced)
- Speed: 1.0x (natural)
- Similarity: 80%

---

## Language Configuration

### Supported Languages & Dialects

| Language | Primary Dialect | Voice Options | Auto-Detection |
|----------|----------------|---------------|----------------|
| English | American/British | 15+ voices | Yes |
| Arabic | Gulf (Kuwait, Saudi, UAE) | 5+ voices | Yes |
| Arabic | Levantine | 3+ voices | Yes |
| Arabic | Egyptian | 3+ voices | Yes |
| Arabic | MSA | 5+ voices | Yes |

### Gulf Arabic Specific Recommendations

For Kuwait and Gulf region users:
1. **Fares** - Male, Gulf Arabic, Professional (RECOMMENDED for business)
2. **Ahmed** - Male, Gulf Arabic, Friendly (for customer service)
3. **Fatima** - Female, Gulf Arabic, Professional (for formal interactions)
4. **Layla** - Female, Gulf Arabic, Warm (for hospitality)

### Language Auto-Detection

```typescript
// Auto-detect language from first user utterance
const detectLanguage = (utterance: string): 'en' | 'ar' => {
  const arabicPattern = /[\u0600-\u06FF]/;
  return arabicPattern.test(utterance) ? 'ar' : 'en';
};

// Switch voice mid-call if language changes
const handleLanguageSwitch = (newLanguage: string) => {
  // Update voice to appropriate language voice
  // Maintain domain context and personality
};
```

---

## Nexus Implementation

### Voice Configuration Service

```typescript
// server/services/ElevenLabsVoiceService.ts

interface VoiceProfile {
  id: string;
  name: string;
  language: 'en' | 'ar';
  dialect?: 'gulf' | 'levantine' | 'egyptian' | 'msa';
  gender: 'male' | 'female';
  characteristics: string[];
  domains: string[];
  stability: number;
  speed: number;
  similarity: number;
}

interface DomainConfig {
  domain: string;
  systemPrompt: string;
  voiceProfiles: {
    en: { male: string; female: string };
    ar: { male: string; female: string };
  };
  voiceSettings: {
    stability: number;
    speed: number;
    similarity: number;
  };
}

const VOICE_PROFILES: VoiceProfile[] = [
  {
    id: 'fares',
    name: 'Fares - Comforting, Balanced and Clear',
    language: 'ar',
    dialect: 'gulf',
    gender: 'male',
    characteristics: ['professional', 'warm', 'clear'],
    domains: ['legal', 'finance', 'healthcare', 'business'],
    stability: 0.75,
    speed: 1.0,
    similarity: 0.80
  },
  {
    id: 'eric',
    name: 'Eric - Smooth, Trustworthy',
    language: 'en',
    gender: 'male',
    characteristics: ['trustworthy', 'smooth', 'professional'],
    domains: ['legal', 'finance', 'business'],
    stability: 0.75,
    speed: 1.0,
    similarity: 0.80
  },
  // ... more profiles
];

const DOMAIN_CONFIGS: DomainConfig[] = [
  {
    domain: 'legal',
    systemPrompt: `You are a professional legal assistant...`,
    voiceProfiles: {
      en: { male: 'eric', female: 'charlotte' },
      ar: { male: 'fares', female: 'fatima' }
    },
    voiceSettings: { stability: 0.75, speed: 0.9, similarity: 0.80 }
  },
  // ... more domains
];
```

### User Preferences Storage

```typescript
// Database schema for user voice preferences
interface UserVoicePreferences {
  userId: string;
  domain: string;
  language: 'en' | 'ar' | 'auto';
  preferredGender: 'male' | 'female' | 'no_preference';
  voiceId?: string; // Override specific voice
  customSettings?: {
    stability?: number;
    speed?: number;
    similarity?: number;
  };
}
```

### API Endpoints

```typescript
// Voice configuration API
router.get('/api/voice/profiles', getAvailableVoices);
router.get('/api/voice/domains', getDomainConfigs);
router.post('/api/voice/preferences', saveUserPreferences);
router.get('/api/voice/recommend/:domain', getRecommendedVoice);
```

---

## User Interface for Voice Selection

### Settings Page Components

1. **Domain Selector** - User selects their primary business domain
2. **Language Preference** - English, Arabic, or Auto-detect
3. **Voice Preview** - Listen to available voices
4. **Voice Preference** - Male/Female preference
5. **Advanced Settings** - Stability, Speed, Similarity sliders
6. **Test Call** - Make a test call to hear the configured voice

### Voice Selection Flow

```
User opens Settings > Voice Configuration
        │
        ▼
┌─────────────────────────────────────┐
│  1. What's your primary domain?     │
│  [ ] Legal    [ ] Healthcare        │
│  [ ] Finance  [ ] Sales             │
│  [ ] Real Estate [ ] Education      │
│  [ ] Hospitality [ ] General        │
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────┐
│  2. Preferred language?             │
│  [English] [Arabic] [Auto-detect]   │
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────┐
│  3. Voice preference?               │
│  [Male] [Female] [No preference]    │
│                                     │
│  Recommended: Fares (Gulf Arabic)   │
│  [▶ Preview] [▶ Test Call]         │
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────┐
│  4. Fine-tune (optional)            │
│  Stability: [====----] 70%          │
│  Speed:     [=====---] 90%          │
│  Tone:      [======--] 80%          │
└─────────────────────────────────────┘
```

---

## ElevenLabs Agent Configuration

### Agent: Nexus Voice Assistant
- **Agent ID:** `agent_5301kghx4yw7ef0rywjv84dybgeg`
- **Default Language:** English
- **Additional Languages:** Arabic
- **LLM:** Gemini 2.5 Flash (optimized for conversation)

### Dynamic Variables for Personalization

```
{{company_name}} - User's company name
{{domain}} - Business domain
{{language}} - Preferred language
{{caller_name}} - If known from CRM
{{context}} - Call context from workflow
```

### Workflow Integration

When a Nexus workflow triggers a voice call:

```typescript
// Workflow step: Make AI Voice Call
{
  id: 'voice_call_step',
  type: 'action',
  integrationId: 'elevenlabs',
  config: {
    toolSlug: 'ELEVENLABS_VOICE_CALL',
    params: {
      phone_number: '{{contact.phone}}',
      domain: '{{workflow.domain}}',
      language: 'auto',
      context: '{{workflow.context}}',
      company_name: '{{user.company}}',
      callback_url: '{{webhook.url}}'
    }
  }
}
```

---

## Cost Optimization

### ElevenLabs Pricing Tiers

| Tier | Characters/Month | Cost | Recommended For |
|------|-----------------|------|-----------------|
| Starter | 30,000 | $5/mo | Testing/Development |
| Creator | 100,000 | $22/mo | Small business |
| Pro | 500,000 | $99/mo | Medium business |
| Scale | 2,000,000 | $330/mo | Enterprise |

### Cost-Saving Strategies

1. **Cache common responses** - Pre-generate common greetings
2. **Use variables** - Dynamic insertion reduces unique generations
3. **Optimize prompts** - Shorter, more efficient responses
4. **Batch processing** - Group non-urgent calls

---

## Implementation Checklist

- [x] ElevenLabs account created (md.fifty50@gmail.com)
- [x] Nexus Voice Assistant agent created
- [x] Arabic language added
- [ ] Fares (Gulf Arabic) voice assigned to Arabic
- [ ] Domain-specific system prompts configured
- [ ] Voice configuration service implemented
- [ ] User preferences UI created
- [ ] Telnyx integration for phone numbers
- [ ] End-to-end testing with real calls

---

## Next Steps

1. **Complete Arabic Voice Assignment** - Manually assign Fares via ElevenLabs dashboard
2. **Implement Voice Service** - Create `ElevenLabsVoiceService.ts`
3. **Add Voice Settings UI** - Settings page component
4. **Telnyx Setup** - Phone number acquisition
5. **Integration Testing** - Test with real calls

---

*Document Version: 1.0*
*Last Updated: 2026-02-03*
*Author: Nexus Development Team*
