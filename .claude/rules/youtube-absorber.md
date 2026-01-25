# YouTube Auto-Absorber Rule

## AUTO-DETECTION (CRITICAL)

When you see a YouTube URL in user's message:
- `youtube.com/watch?v=`
- `youtu.be/`
- `youtube.com/shorts/`

**IMMEDIATELY** trigger full content extraction - DO NOT just describe the video or use partial methods.

## FULL EXTRACTION PIPELINE

### Method 1: Script-based (PREFERRED - gets transcript + visuals)

```powershell
powershell -ExecutionPolicy Bypass -File ".claude/scripts/ytabsorb.ps1" -URL "URL_HERE"
```

Then read:
1. `C:\Users\PC\.ytabsorb\{VIDEO_ID}\transcript.txt` - Full transcript
2. `C:\Users\PC\.ytabsorb\{VIDEO_ID}\frames\key_*.jpg` - Keyframes (sample 10-15)

### Method 2: MCP Transcript (FALLBACK - text only)

If script fails or dependencies missing:
```
mcp__youtube-transcript__get_transcript url: "URL" lang: "en"
```

**WARNING:** This only gets text, misses all visual content.

### Method 3: Playwright scrape (LAST RESORT - metadata only)

Only if both above fail. Gets title, description, timestamps - NOT full content.

## OUTPUT FORMAT

After absorbing, ALWAYS provide:

```markdown
## VIDEO ABSORBED: [Title]
**Channel:** [Creator] | **Duration:** [Time] | **URL:** [Link]

### Summary (12 bullets max)
- ...

### Step-by-Step Workflow (from visuals + transcript)
1. ...

### Key Numbers/Settings Mentioned
- ...

### Action Items
- [ ] ...

### Red Flags / Weak Claims
- ...

### Cached At
- Transcript: ~/.ytabsorb/{id}/transcript.txt
- Frames: ~/.ytabsorb/{id}/frames/ ({N} images)
```

## NEVER DO THESE

- ❌ Say "I can't watch videos" - you CAN via transcript + frames
- ❌ Only read video title/description - that's NOT absorbing
- ❌ Use MCP tool if it returns "[object Object]" - fallback to script
- ❌ Skip visual content - keyframes are critical for tutorials

## INSTALL DEPENDENCIES

If user hasn't installed dependencies yet:

```cmd
.claude\scripts\install-ytabsorb.cmd
```

Or manually:
```
winget install yt-dlp.yt-dlp
winget install Gyan.FFmpeg
pip install -U openai-whisper
```
