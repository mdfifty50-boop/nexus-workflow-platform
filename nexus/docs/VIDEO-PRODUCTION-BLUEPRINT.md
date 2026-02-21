# Nexus Demo Video — $0 Production Blueprint

**Created:** 2026-02-20
**Budget:** $0 (all free tools)
**Target Length:** 75 seconds (flexible 60-90s)
**Audience:** Global business professionals, solopreneurs, SMBs + GCC mention
**Voice:** English only
**Quality Target:** ~88% of a $5K professional production

---

## THE 10 TOOLS — COMPLETE $0 TOOLKIT

| Step | Tool | Why This One Wins | Install/Access |
|------|------|-------------------|----------------|
| **Voiceover** | edge-tts (`en-US-AndrewMultilingualNeural`) | 8.5/10 naturalness, unlimited, commercial use, zero signup | `pip install edge-tts` |
| **VO cleanup** | Adobe Podcast Enhance (podcast.adobe.com) | AI studio-quality enhancement, 1 hr/day free | Browser |
| **Cinematic B-roll** | Pexels + Mixkit stock footage | Real 4K, no watermark, no attribution, commercial use | Browser download |
| **Abstract tech visuals** | Kling AI (66 credits/day) | Custom data-flow animations matching Nexus brand colors | app.klingai.com |
| **Screen recording** | OBS Studio | Real Nexus app, 1080p, unlimited, no watermark | obsproject.com |
| **Screen replacement** | DaVinci Resolve Free (Fusion Planar Tracker) | Hollywood compositing technique, completely free | blackmagicdesign.com |
| **Animated mockups** | Animockup (animockup.com) | No watermark, no signup, 20+ device frames | Browser |
| **Background music** | Pixabay Music | Commercial use, zero attribution, huge library | pixabay.com/music/ |
| **Sound effects** | Mixkit SFX + Pixabay SFX | Commercial use, zero attribution | mixkit.co + pixabay.com/sound-effects/ |
| **Editing + export** | DaVinci Resolve Free | Professional grade, color grading, Fairlight audio, Fusion VFX | Same install |

---

## VOICEOVER — TOP 5 FREE ENGLISH TTS (Quality Ranked)

| Rank | Voice | Platform | Quality | Free Tier | Commercial? |
|------|-------|----------|---------|-----------|-------------|
| 1 | Chatterbox (clone any voice) | Resemble AI (local, MIT license) | 9.5/10 | Unlimited (needs 4GB+ VRAM GPU) | Yes |
| 2 | en-US-AndrewMultilingualNeural | edge-tts | 8.5/10 | Unlimited, no signup, no API key | Yes |
| 3 | en-US-AvaMultilingualNeural | edge-tts | 8.5/10 | Unlimited, no signup, no API key | Yes |
| 4 | Kokoro-82M "Adam"/"Bella" | Self-hosted (Apache 2.0) | 8.5/10 | Unlimited (runs on CPU at 3-11x real-time) | Yes |
| 5 | OpenAudio S1-mini | Fish Audio (Apache 2.0) | 9/10 | Unlimited (needs GPU) or 8K hosted credits/mo | Yes |

### Quick Start (Recommended Path)
```bash
pip install edge-tts
edge-tts --voice en-US-AndrewMultilingualNeural --text "Your script here" --write-media voiceover.mp3 --write-subtitles voiceover.srt
```

### If You Have a GPU (4GB+ VRAM) — Push to 9.5/10
Resemble Chatterbox clones any professional voice from 5 seconds of audio. MIT license. Beat ElevenLabs in blind tests (63.75% preference).
- GitHub: https://github.com/resemble-ai/chatterbox

---

## VIDEO STRATEGY — 70% STOCK + 30% AI

Stock footage beats AI video for anything with humans. AI wins for abstract tech visuals.

| Shot Type | Source | Search Terms |
|-----------|--------|-------------|
| Person at laptop/phone | Pexels | `business woman laptop smile`, `professional satisfaction computer` |
| Device for compositing | Pexels | `laptop green screen`, `phone green screen` |
| Data flow / node animations | Kling AI (66 credits/day) | Prompt: "Abstract visualization of glowing data streams flowing between connected nodes..." |
| Diverse teams | Pexels | `diverse team office`, `multicultural business meeting` |
| Lifestyle / time saved | Pexels + Mixkit | `work life balance`, `coffee break professional` |
| Real Nexus UI | OBS Studio | Record `npm run dev` at 1080p |

### AI Video Generation Free Tiers (For Abstract Shots)

| Platform | Free Credits | Refresh | Resolution | Best For |
|----------|-------------|---------|------------|----------|
| Kling AI | 66/day | Daily | 720p | Daily iteration, realistic scenes |
| Vidu AI | 800/mo + unlimited off-peak | Monthly + off-peak | 720p | Bulk generation during off-hours |
| PixVerse | 100 + 60/day | Daily | 720p | Sustained free usage |
| Seedance 2.0 | 60+/day (via Dreamina) | Daily | Up to 2K | Highest quality |
| Hailuo | 1,000 signup | Never | 720p | Best cinematic quality (one-time) |

### Open Source (Local, No Watermark, Unlimited)

| Model | VRAM | Resolution | License |
|-------|------|-----------|---------|
| Wan 2.1 (1.3B) | 8GB+ | 720p | Apache 2.0 |
| LTX-2 | 24-48GB | 4K/50fps | Apache 2.0 |
| CogVideoX (2B) | 8-12GB | 720p | Apache 2.0 |

---

## THE 7-SCENE STORYBOARD

### Scene 1: THE HOOK (0:00-0:03, 3 seconds)
**Visual:** Black screen. Text types itself: "What if your workflows built themselves?" Cursor blinks. Text dissolves into particles → reforms as Nexus logo.
**VO:** "What if your workflows... built themselves?"
**Music:** Single low bass note. Tension. Anticipation.
**Tool:** Canva (typewriter effect) or DaVinci Resolve Fusion (text+ node)

### Scene 2: THE PAIN (0:03-0:13, 10 seconds)
**Visual:** Rapid cuts (2/sec): browser tabs (Gmail, Sheets, Slack), frantic copy-paste, red notification badges multiplying, clock fast-forwarding. Then slow: stat "4.5 hours/week wasted" fades from white to amber.
**VO:** "You open Gmail. Copy. Switch to Sheets. Paste. Back to Slack. Repeat. Four and a half hours every single week — gone."
**Music:** Rhythmic, anxious beat during chaos. Dramatic pause for stat.
**Tool:** Canva (tab mockups) + OBS (screen switching) + DaVinci Resolve (rapid cuts, text overlays)

### Scene 3: THE REVEAL (0:13-0:20, 7 seconds)
**Visual:** Dark BG. Nexus logo fades in with glow. Tagline types: "Just tell it what you need." Transitions to actual Nexus chat interface with blinking cursor.
**VO:** "Meet Nexus. Just tell it what you need — in plain English."
**Music:** Anxious beat resolves to confident, warm synth. The "hero arrives."
**Tool:** Canva (logo animation) + OBS (Nexus chat UI) + DaVinci Resolve (zoom transition)

### Scene 4: THE MAGIC MOMENT (0:20-0:45, 25 seconds) — CENTERPIECE
**Visual:**
- 0:20-0:25: Cursor types: "When I get an email with an attachment, save it to Dropbox and notify me on Slack."
- 0:25-0:32: WorkflowPreviewCard animates in. Three nodes appear one by one: [Gmail] → [Dropbox] → [Slack]. Connection lines draw themselves.
- 0:32-0:38: One-click connect flow: Gmail ✓, Dropbox ✓, Slack ✓. Execute button lights green.
- 0:38-0:45: Click Execute. Progress animation flows through nodes. All turn green. "Workflow Active" badge. Text: "Built in seconds. Runs forever."

**VO:** "Type what you want. Watch it appear. 'When I get an email with an attachment, save it to Dropbox and notify me on Slack.' That's it. Nexus understands your intent, builds the workflow, and connects your apps — one click each. Hit execute. Done. Built in seconds. Runs forever."
**Music:** Building momentum. Click SFX on each node. Completion chime on green.
**Tool:** OBS (record REAL Nexus app working) + DaVinci Resolve (cursor highlighting, zoom effects, SFX)

### Scene 5: THE BREADTH (0:45-0:55, 10 seconds)
**Visual:** Grid of 500+ app icons (Gmail, Slack, Notion, Sheets, Dropbox, GitHub, Trello, Asana, Stripe, etc.) in floating/honeycomb pattern. "500+" appears center. Then 3 rapid workflow examples stack: "Slack summaries," "GitHub tracking," "Invoice pipeline."
**VO:** "Five hundred apps. Infinite combinations. Email pipelines. Slack summaries. GitHub tracking. Whatever your business runs on — Nexus connects it."
**Music:** Peak energy, rhythmic pulse matching icon appearances.
**Tool:** Canva (icon grid) + OBS (3 workflow recordings) + DaVinci Resolve (composite)

### Scene 6: GCC CALLOUT (0:55-1:02, 7 seconds)
**Visual:** Minimal world map outline. Global glow + bright GCC point. Text: "Built for global teams." Then: "GCC-ready. Arabic-first." with "جاهز للخليج". Brief flash of RTL interface. WhatsApp/KNET badges.
**VO:** "Built for teams everywhere. And with native Arabic support, regional integrations, and GCC business intelligence — Nexus speaks your language."
**Music:** Warm, global. Subtle Middle Eastern melodic inflection (one note, not stereotypical).
**Tool:** Canva (map) + OBS (RTL mode recording) + DaVinci Resolve (composite)

### Scene 7: CTA (1:02-1:10, 8 seconds)
**Visual:** Dark BG. Nexus logo center. "Your workflows, in plain English." Chat input field with blinking cursor. "Try Nexus Free" button. URL. "No credit card required." Subtle particle animation BG.
**VO:** "Your workflows, in plain English. Try Nexus free — no credit card, no complicated setup. Just tell Nexus what you need."
**Music:** Final chord resolution. Confident. Gentle fade.
**Tool:** Canva (end card) + DaVinci Resolve Fusion (particle emitter BG)

---

## COMPLETE VOICEOVER SCRIPT (170 words, ~75 seconds)

```
[HOOK — 0:00-0:03]
What if your workflows... built themselves?

[PAIN — 0:03-0:13]
You open Gmail. Copy. Switch to Sheets. Paste. Back to Slack.
Repeat. Four and a half hours, every single week — gone.

[REVEAL — 0:13-0:20]
Meet Nexus. Just tell it what you need — in plain English.

[MAGIC MOMENT — 0:20-0:45]
Type what you want. Watch it appear.
"When I get an email with an attachment, save it to Dropbox
and notify me on Slack." That's it.
Nexus understands your intent, builds the workflow,
and connects your apps — one click each.
Hit execute. Done.
Built in seconds. Runs forever.

[BREADTH — 0:45-0:55]
Five hundred apps. Infinite combinations. Email pipelines.
Slack summaries. GitHub tracking. Whatever your business
runs on — Nexus connects it.

[GCC CALLOUT — 0:55-1:02]
Built for teams everywhere. And with native Arabic support,
regional integrations, and GCC business intelligence —
Nexus speaks your language.

[CTA — 1:02-1:10]
Your workflows, in plain English.
Try Nexus free — no credit card, no complicated setup.
Just tell Nexus what you need.
```

### Script Variations

**Variation A (Social Media/Emotional):**
Hook: "You didn't start your business to copy-paste between spreadsheets."

**Variation B (Product Hunt/Technical):**
Magic: "Natural language to structured workflow. One prompt. Nexus parses intent, resolves integrations via Composio's 500+ app library, and provisions OAuth connections inline."

**Variation C (GCC-Targeted Ads):**
Hook: "كل شي يشتغل لحاله." ("Everything runs by itself.") → "Meet Nexus..."

---

## MUSIC DIRECTION

**Search terms for free libraries:**
- Pixabay: "modern synth hopeful", "startup product launch", "minimal electronic ambient"
- Mixkit: "technology corporate", "innovation minimal"

**Energy arc:**
```
0:00-0:03  | Single bass note, tension
0:03-0:13  | Rhythmic, slightly anxious beat (chaos section)
0:13-0:20  | Beat resolves into confident, warm progression (hero arrives)
0:20-0:45  | Building momentum, steady rhythm (demo section)
0:45-0:55  | Peak energy, fastest rhythm (500+ apps montage)
0:55-1:02  | Warm, global-feeling, slightly melodic (GCC section)
1:02-1:10  | Final chord resolution, gentle fade (CTA)
```

---

## SOCIAL MEDIA CUT-DOWNS

| Platform | Duration | Scenes to Include | Aspect Ratio |
|----------|----------|-------------------|--------------|
| YouTube (hero) | 75s full | All 7 scenes | 16:9 |
| Twitter/X | 30s | Hook + Magic Moment + CTA | 16:9 |
| Instagram Reel | 30s | Hook + Magic Moment + CTA | 9:16 vertical |
| TikTok | 15-30s | Hook + Magic Moment only | 9:16 vertical |
| LinkedIn | 45s | Hook + Pain + Magic + CTA | 16:9 |
| Product Hunt | 75s full | All (PH audience watches full) | 16:9 |
| Website hero | 15s | Magic Moment only (autoplay, muted, looped) | 16:9 |

---

## POWER MOVES — BONUS FREE CREDITS

| Trick | What You Get |
|-------|-------------|
| Google Student Deal (.edu email, by Apr 30 2026) | Veo 3.1 FREE 12 months — best AI video |
| Google Cloud new account | $300 credits → Veo via Vertex AI |
| AWS new account | $200 credits + Polly 1M chars/month for 12 months |
| Kling AI daily refresh | 66 credits every 24 hours |
| Vidu AI off-peak | Unlimited video generation during off-hours |
| Wan 2.1 locally (8GB VRAM) | Unlimited AI video, no watermark, Apache 2.0 |
| Chatterbox locally (4GB VRAM) | Unlimited voice cloning, MIT license |
| PixVerse referrals | 50-60 credits per referral, escalating |

---

## PRE-PRODUCTION CHECKLIST

- [ ] Nexus dev server runs cleanly (`npm run dev`, no console errors)
- [ ] Chat interface in clean state (no previous messages)
- [ ] Demo query produces clean WorkflowPreviewCard
- [ ] OBS configured: 1920x1080, 30fps, high quality
- [ ] Browser in clean profile (no bookmarks bar, no extensions)
- [ ] DaVinci Resolve installed with Fusion page accessible
- [ ] Music track selected and downloaded from Pixabay
- [ ] Voiceover generated via edge-tts
- [ ] Canva designs prepared: icon grid, end card, text overlays
- [ ] Minimum 3 takes planned for Scene 4 (Magic Moment)
- [ ] RTL/Arabic mode screenshot captured for Scene 6
- [ ] Stock footage downloaded from Pexels (hero shot, diverse team, device green screen)
- [ ] SFX downloaded from Mixkit (whoosh, click, chime)

---

## POST-PRODUCTION WORKFLOW (DaVinci Resolve)

1. **Import** all raw footage, VO audio, music, Canva exports
2. **Edit Page** — Assemble rough cut per storyboard timeline
3. **Sync** voiceover to visuals using scene timing marks
4. **Fusion Page** — Typewriter text (Scene 1), particle dissolve, map glow (Scene 6), particle BG (Scene 7)
5. **Color Page** — Consistent grade, subtle vignette, accurate Nexus UI colors
6. **Fairlight Page** — Audio mix: VO at -6dB, music at -18dB, SFX at -12dB
7. **Deliver Page** — Export: H.264, 1080p, 30fps, 20-30 Mbps, AAC 320kbps

---

## EXPORT SETTINGS

| Platform | Format | Resolution | Bitrate | Notes |
|----------|--------|-----------|---------|-------|
| YouTube | H.264 MP4 | 1920x1080 | 20-30 Mbps | Standard upload |
| Website hero | H.264 MP4 | 1920x1080 | 8-10 Mbps | Smaller file, autoplay |
| Instagram/TikTok | H.264 MP4 | 1080x1920 | 15-20 Mbps | Vertical reframe |
| Twitter/X | H.264 MP4 | 1920x1080 | 15-20 Mbps | Under 2:20 limit |

---

## QUALITY ASSESSMENT

| Element | $0 Quality | Gap vs $5K Production |
|---------|-----------|----------------------|
| Video editing | 100% | 0% — DaVinci Resolve IS professional |
| Screen replacement | 95% | 5% — same Fusion planar tracker |
| Stock footage | 85% | 15% — slightly less variety |
| Background music | 95% | 5% — Pixabay has excellent tracks |
| Sound effects | 95% | 5% — plenty of quality options |
| English voiceover | 85% | 15% — edge-tts Andrew is very natural |
| Subtitles | 95% | 5% — Whisper is extremely accurate |
| **Overall** | **~88%** | **~12% gap** |

---

*This document is the complete production bible for the Nexus demo video. Every scene, every word, every tool. Total cost: $0.00.*
