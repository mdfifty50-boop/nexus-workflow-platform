# Voice Control Panel - UX Design & Placement

## Overview

This document defines WHERE and HOW users configure voice settings in Nexus workflows.

## Control Panel Locations

### 1. Global Voice Preferences (Settings Page)

**Location:** Settings → New "Voice & AI" section

**Purpose:** Set default voice preferences that apply to ALL workflows

```
Settings Page
├── Account
├── Notifications
├── Security
├── Billing
├── Appearance
├── Voice & AI  ← NEW SECTION
│   ├── Business Domain (Legal, Healthcare, Sales, etc.)
│   ├── Language Preference (English, Arabic, Auto-detect)
│   ├── Voice Gender Preference (Male, Female, No preference)
│   ├── Test Voice (Play sample)
│   └── Advanced Settings (Stability, Speed, Similarity)
└── API & Integrations
```

### 2. Workflow-Specific Voice Settings (Post "Run Beta")

**Location:** WorkflowPreviewCard → Settings gear icon (visible after workflow is active)

**Trigger:** When workflow contains ElevenLabs voice steps

```
┌─────────────────────────────────────────────────────────────────┐
│  🔊 WhatsApp Lead Follow-up Workflow                    ⚙️ 🔊  │
│  Status: ACTIVE ✓                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [WhatsApp] ──→ [HubSpot] ──→ [Voice Call] ──→ [Slack]        │
│                                       │                         │
│                               ┌───────▼───────┐                │
│                               │ Voice Settings │                │
│                               │ • Eric (EN)    │                │
│                               │ • Fares (AR)   │                │
│                               │ [Configure]    │                │
│                               └───────────────┘                │
│                                                                 │
│  [Pause] [Edit] [View Logs] [Voice Settings]                   │
└─────────────────────────────────────────────────────────────────┘
```

### 3. In-Workflow Voice Node Settings

**Location:** Click on Voice node in workflow visualization

**Purpose:** Configure voice for specific call step

```
┌─────────────────────────────────────────────────────────────┐
│  AI Voice Call - Step 3                           ✕        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Voice Configuration                                        │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  📞 Calling: {{contact.phone}}                        │ │
│  │                                                       │ │
│  │  Voice:                                              │ │
│  │  [English ▼] [Male ▼]                               │ │
│  │  Recommended: Eric - Smooth, Trustworthy             │ │
│  │  [▶ Preview Voice]                                   │ │
│  │                                                       │ │
│  │  Language Detection:                                 │ │
│  │  [✓] Auto-detect caller language                    │ │
│  │  [✓] Switch to Arabic if caller speaks Arabic       │ │
│  │                                                       │ │
│  │  Tone (for this workflow):                          │ │
│  │  [Professional ▼]                                   │ │
│  │                                                       │ │
│  │  Advanced ▾                                          │ │
│  │  └─ Stability: [====----] 70%                       │ │
│  │  └─ Speed: [=====---] 90%                           │ │
│  │  └─ Similarity: [======--] 80%                      │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  [Save] [Reset to Defaults]                                │
└─────────────────────────────────────────────────────────────┘
```

---

## User Flow

### First-Time Setup

```
User creates workflow with voice call step
                │
                ▼
┌─────────────────────────────────────┐
│ "Configure Voice for AI Calls"      │
│                                     │
│ 1. What's your primary domain?      │
│    [Legal] [Healthcare] [Sales] ... │
│                                     │
│ 2. Preferred language?              │
│    [English] [Arabic] [Auto]        │
│                                     │
│ 3. Voice preference?                │
│    [Male] [Female] [No preference]  │
│                                     │
│ Recommended: Eric (English), Fares  │
│ (Arabic)                            │
│                                     │
│ [▶ Test Voice] [Save & Continue]    │
└─────────────────────────────────────┘
                │
                ▼
        Workflow executes with configured voice
```

### Post "Run Beta" - Active Workflow

```
User clicks "Run Beta" → Workflow activates
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│  ✅ Workflow Active!                                        │
│                                                             │
│  Your workflow is now running. Incoming WhatsApp messages   │
│  will trigger the automation.                               │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐│
│  │ 🔊 Voice Call Settings                                 ││
│  │ Currently using: Eric (English), Fares (Arabic)        ││
│  │ Domain: Legal | Tone: Professional                     ││
│  │                                                        ││
│  │ [Adjust Voice Settings]                                ││
│  └────────────────────────────────────────────────────────┘│
│                                                             │
│  [View Workflow] [Pause Workflow] [Settings]               │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### Files to Create

```
nexus/
├── server/
│   ├── services/
│   │   └── ElevenLabsVoiceService.ts    ← Voice configuration logic
│   └── routes/
│       └── voice.ts                      ← API endpoints
├── src/
│   ├── components/
│   │   └── voice/
│   │       ├── VoiceConfigurationPanel.tsx  ← Main config UI
│   │       ├── VoicePreview.tsx             ← Test voice button
│   │       ├── VoiceNodeSettings.tsx        ← Per-node settings
│   │       └── VoiceSettingsSection.tsx     ← Settings page section
│   ├── hooks/
│   │   └── useVoiceConfig.ts                ← React hook for voice config
│   └── services/
│       └── VoiceConfigService.ts            ← Client-side service
```

### API Endpoints

```typescript
// Voice configuration API
GET    /api/voice/config           → Get user's voice config
POST   /api/voice/config           → Save voice config
GET    /api/voice/profiles         → List available voices
GET    /api/voice/domains          → List domain presets
POST   /api/voice/preview          → Generate preview audio
GET    /api/voice/workflow/:id     → Get workflow-specific voice config
POST   /api/voice/workflow/:id     → Save workflow-specific voice config
```

### Database Schema

```sql
-- User voice preferences
CREATE TABLE user_voice_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  domain VARCHAR(50) DEFAULT 'business',
  language VARCHAR(10) DEFAULT 'auto',
  preferred_gender VARCHAR(20) DEFAULT 'no_preference',
  voice_id_en VARCHAR(100),
  voice_id_ar VARCHAR(100),
  stability DECIMAL(3,2) DEFAULT 0.70,
  speed DECIMAL(3,2) DEFAULT 1.00,
  similarity DECIMAL(3,2) DEFAULT 0.80,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow-specific voice overrides
CREATE TABLE workflow_voice_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES workflows(id),
  node_id VARCHAR(100),
  voice_id VARCHAR(100),
  language VARCHAR(10),
  tone VARCHAR(50),
  custom_prompt TEXT,
  settings JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Integration Points

### WorkflowPreviewCard.tsx

Add voice settings button when workflow contains ElevenLabs nodes:

```typescript
// Check if workflow has voice steps
const hasVoiceSteps = workflowSpec.steps.some(
  step => step.tool === 'elevenlabs' || step.type === 'voice_call'
)

// Show voice settings panel
{hasVoiceSteps && workflowStatus === 'active' && (
  <VoiceConfigurationPanel
    workflowId={workflow.id}
    defaultConfig={userVoiceConfig}
    onSave={handleVoiceConfigSave}
  />
)}
```

### Settings.tsx

Add Voice & AI section:

```typescript
const settingsSections = [
  { id: 'account', name: 'Account', icon: User },
  { id: 'notifications', name: 'Notifications', icon: Bell },
  { id: 'security', name: 'Security', icon: Shield },
  { id: 'billing', name: 'Billing', icon: CreditCard },
  { id: 'appearance', name: 'Appearance', icon: Palette },
  { id: 'voice', name: 'Voice & AI', icon: Mic },  // ← NEW
  { id: 'integrations', name: 'API & Integrations', icon: Key },
]
```

---

## Mobile UX Considerations

### Voice Settings on Mobile

- Full-screen modal for voice configuration
- Large tap targets (44x44px minimum)
- Voice preview plays through device speaker
- Simple toggle for language auto-detection

### Post "Run Beta" on Mobile

- Bottom sheet with quick voice settings
- Swipe up for full settings panel
- Voice preview button prominently displayed

---

## Implementation Priority

1. **Phase 1:** ElevenLabsVoiceService (backend)
2. **Phase 2:** VoiceConfigurationPanel (frontend)
3. **Phase 3:** Settings page Voice & AI section
4. **Phase 4:** WorkflowPreviewCard integration
5. **Phase 5:** Voice node settings in workflow editor

---

*Document Version: 1.0*
*Last Updated: 2026-02-03*
