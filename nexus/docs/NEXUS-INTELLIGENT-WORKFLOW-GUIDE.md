# Nexus Intelligent Workflow Guide

**Created:** 2026-01-14
**Purpose:** Capture targeted intelligence for smart workflow recommendations
**CEO Vision:** "Nexus should intuitively have smartness to provide intelligent solutions that makes user's business life run surprisingly easy"

---

## Critical Gap Identified: Meeting Recording & Dialect Transcription

### The Problem Statement
When a user requests: *"Make all my meetings documented and summarized into Notion and send an email to the CEO every Friday"*

**Nexus must intelligently ask:**
1. What meeting platform do you use? (Zoom, Google Meet, Teams, In-person)
2. What language/dialect are meetings conducted in?
3. Where do you want summaries stored?

**NOT just execute a partial workflow.**

---

## Complete Meeting Documentation Chain

```
┌─────────────────────────────────────────────────────────────────┐
│                    MEETING RECORDING LAYER                       │
│  (What captures the audio?)                                      │
│  Google Meet | Zoom | Microsoft Teams | In-Person Device         │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                 TRANSCRIPTION LAYER                              │
│  (What converts speech to text?)                                 │
│  Fireflies.ai | Deepgram | Speechmatics | ElevenLabs Scribe     │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                 AI SUMMARIZATION LAYER                           │
│  (What extracts key points, action items?)                       │
│  Claude/GPT | Fireflies AI Apps | Deepgram Summarize             │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                 STORAGE LAYER                                    │
│  (Where are summaries saved?)                                    │
│  Notion | Google Docs | Google Sheets | Confluence               │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                 NOTIFICATION LAYER                               │
│  (How is CEO/team notified?)                                     │
│  Gmail | Slack | Microsoft Teams | WhatsApp                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Kuwaiti/Gulf Arabic Dialect Support

### Best Tools for Kuwaiti Arabic (ar-KW)

| Tool | Gulf Arabic Support | Accuracy | Integration |
|------|---------------------|----------|-------------|
| **Deepgram** | Yes (via Rube MCP) | ~90% | Direct API via Composio |
| **Speechmatics** | Yes (Gulf dialect) | 90%+ | API integration needed |
| **ElevenLabs Scribe** | Yes (Gulf Arabic) | 96.9% (3.1% WER) | API integration needed |
| **Voiser** | Yes (ar-KW specific) | 99% claimed | Web-based |
| **NeuralSpace VoiceAI** | Yes (dialectal models) | 91% average | API integration needed |
| **Fireflies.ai** | Arabic (via Rube MCP) | Good | Direct via Composio |

### Recommended Solution for Kuwait SME

**Primary Recommendation: Deepgram + Fireflies.ai**

Why:
1. **Deepgram** - Already integrated via Rube MCP, supports Arabic with language code
2. **Fireflies.ai** - Already integrated via Rube MCP, joins meetings automatically
3. Both work with the existing Composio/Rube infrastructure

**Alternative for Best Kuwaiti Dialect Accuracy:**
- **ElevenLabs Scribe** - 96.9% accuracy, explicit Gulf Arabic support
- **Speechmatics** - Enterprise-grade, explicit Gulf dialect model

---

## Intelligent Workflow Recommendations

### When User Says: "Document my meetings"

**Nexus Should Ask:**

```
I'll help you set up automatic meeting documentation. Let me ask a few questions:

1. What meeting platform do you primarily use?
   [ ] Google Meet
   [ ] Zoom
   [ ] Microsoft Teams
   [ ] In-person meetings (need mobile recording)

2. What language are your meetings conducted in?
   [ ] English
   [ ] Arabic (Modern Standard)
   [ ] Arabic (Gulf/Kuwaiti dialect) ← IMPORTANT FOR KUWAIT
   [ ] Mixed languages

3. Where do you want meeting summaries saved?
   [ ] Notion
   [ ] Google Docs
   [ ] Google Sheets
   [ ] Email only

4. Who should receive the summaries?
   [ ] Just me
   [ ] My team (specify Slack channel)
   [ ] CEO weekly digest
```

### Smart Recommendations Based on Answers

**If Gulf/Kuwaiti Arabic selected:**
```
For Kuwaiti dialect meetings, I recommend:

RECORDING: Fireflies.ai bot (auto-joins Google Meet/Zoom)
           └─ Supports Arabic transcription

TRANSCRIPTION: Deepgram Speech-to-Text
               └─ Set language: "ar" with Gulf Arabic model
               └─ 90%+ accuracy on dialectal Arabic

ENHANCEMENT: For 99% accuracy on Kuwaiti dialect, consider:
             └─ ElevenLabs Scribe (best Gulf Arabic support)
             └─ Speechmatics (enterprise option)

SUMMARIZATION: Claude AI analysis of transcript
               └─ Extract action items, decisions, follow-ups
               └─ Generate Arabic OR English summary

STORAGE: Your choice of Notion/Google Docs

NOTIFICATION: Weekly email digest to CEO
```

---

## Available Tools via Rube MCP/Composio

### Currently Integrated (Ready to Use)

| Category | Tools |
|----------|-------|
| **Meeting Recording** | `FIREFLIES_ADD_TO_LIVE`, `GOOGLEMEET_GET_RECORDINGS_BY_CONFERENCE_RECORD_ID` |
| **Transcription** | `DEEPGRAM_SPEECH_TO_TEXT_PRE_RECORDED`, `FIREFLIES_GET_TRANSCRIPT_BY_ID`, `GOOGLEMEET_GET_TRANSCRIPTS_BY_CONFERENCE_RECORD_ID` |
| **Summarization** | `DEEPGRAM_SUMMARIZE_AUDIO`, `FIREFLIES_FETCH_AI_APP_OUTPUTS` |
| **Storage** | `NOTION_CREATE_NOTION_PAGE`, `NOTION_ADD_MULTIPLE_PAGE_CONTENT`, `GOOGLEDOCS_*`, `GOOGLESHEETS_*` |
| **Notification** | `GMAIL_SEND_EMAIL`, `SLACK_SEND_MESSAGE` |

### Connection Status (as of 2026-01-14)

| Toolkit | Status | Action Needed |
|---------|--------|---------------|
| Gmail | ACTIVE | Ready |
| Google Calendar | ACTIVE | Ready |
| Google Sheets | ACTIVE | Ready |
| Fireflies.ai | NOT CONNECTED | Authorize via Composio |
| Deepgram | NOT CONNECTED | Authorize via Composio |
| Notion | NOT CONNECTED | Authorize via Composio |
| Google Drive | NOT CONNECTED | Authorize via Composio |
| Google Meet | NOT CONNECTED | Authorize via Composio |

---

## One-Click Meeting Workflow Implementation

### Ideal User Experience

**User types:** "Record and summarize my daily standup meetings in Kuwaiti Arabic"

**Nexus responds:**
```
Setting up your Arabic meeting documentation workflow:

STEP 1: Connect Required Apps
        [Connect Fireflies.ai] ← Click to authorize
        [Connect Deepgram] ← Click to authorize
        [Connect Notion] ← Click to authorize

STEP 2: Configure Meeting Recording
        └─ Fireflies bot will auto-join your Google Meet calls
        └─ Language set to: Arabic (Gulf dialect)

STEP 3: Configure Transcription
        └─ Deepgram will transcribe audio to text
        └─ Optimized for Kuwaiti Arabic dialect

STEP 4: Configure Summaries
        └─ AI will extract: Key decisions, Action items, Follow-ups
        └─ Saved to: Notion page "Daily Standups"

STEP 5: Configure Notifications
        └─ Weekly digest email every Friday to CEO

[ACTIVATE WORKFLOW] ← One click to enable everything
```

---

## Technical Implementation Notes

### Deepgram Arabic Configuration

```javascript
// For Gulf/Kuwaiti Arabic
const transcriptionConfig = {
  audio_url: "https://...",
  content_type: "audio/mp3",
  language: "ar",  // Arabic
  punctuate: true,
  smart_format: true,
  diarize: true,  // Identify different speakers
  model: "general"  // Or "enhanced" for better accuracy
};
```

### Fireflies Arabic Configuration

```javascript
// When adding bot to meeting
const firefliesConfig = {
  meeting_link: "https://meet.google.com/xxx-xxxx-xxx",
  language: "Arabic",  // Fireflies language setting
  duration: 60,
  title: "Daily Standup - " + new Date().toISOString()
};
```

---

## Action Items for Nexus Development

### Priority 1: Smart Intent Detection
- [ ] Detect when user mentions "meetings" or "transcription"
- [ ] Auto-ask about language/dialect preference
- [ ] Recommend appropriate tools based on dialect

### Priority 2: Arabic Dialect Intelligence
- [ ] Add dialect selection to workflow builder
- [ ] Map dialects to correct API parameters
- [ ] Test with actual Kuwaiti Arabic audio samples

### Priority 3: One-Click Workflow Templates
- [ ] Create "Meeting Documentation" template
- [ ] Pre-configure for Gulf Arabic
- [ ] Include all required connection prompts

### Priority 4: Integration Testing
- [ ] Test Fireflies.ai with Arabic meetings
- [ ] Test Deepgram with Kuwaiti dialect audio
- [ ] Verify Notion integration for Arabic text

---

## Sources & References

- [Speechmatics Arabic STT](https://www.speechmatics.com/speech-to-text/arabic) - Gulf dialect support
- [ElevenLabs Scribe Arabic](https://elevenlabs.io/speech-to-text/arabic) - 96.9% accuracy
- [Voiser Kuwaiti Arabic](https://voiser.net/speech-to-text/arabic-kuwait-transcribe) - ar-KW specific
- [NeuralSpace Dialectal Arabic](https://medium.com/neuralspace/introducing-dialectal-speech-to-text-models-for-arabic-2a6f712e7163)
- [Fireflies Multi-language](https://fireflies.ai/blog/fireflies-multi-language-transcription/) - 100+ languages
- [Speech-to-Text for Arabic Dialects](https://www.aimtechnologies.co/2025/05/06/speech-to-text-for-arabic-dialects-bridging-the-gap/)

---

## CEO Directive Captured

> "Nexus should intuitively have this kind of smartness to provide intelligent solutions that makes user's business life run surprisingly easy."

**Translation to Product Requirements:**
1. Don't just execute partial workflows - ask smart questions first
2. Understand regional/dialect requirements (Kuwait SME focus)
3. Recommend the RIGHT tools, not just available tools
4. Make complex integrations feel like "one click"
5. Proactively identify gaps in user's request

---

*This document will be updated as we implement these intelligent features tonight.*
