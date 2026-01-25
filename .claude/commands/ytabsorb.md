# YouTube Absorber Command

When user provides a YouTube URL (or says "absorb this video"), execute the full content extraction pipeline.

## Detection Patterns

Trigger this workflow when you see:
- `youtube.com/watch?v=`
- `youtu.be/`
- User says "watch this video", "absorb this", "extract from this video"

## Execution Steps

### Step 1: Run the extraction script

```bash
powershell -ExecutionPolicy Bypass -File ".claude/scripts/ytabsorb.ps1" -URL "THE_URL"
```

Or if dependencies aren't installed, guide user:
```
winget install yt-dlp.yt-dlp
winget install Gyan.FFmpeg
pip install -U openai-whisper
```

### Step 2: Read the transcript

After extraction completes, read the transcript file:
```
Read tool: C:\Users\PC\.ytabsorb\{VIDEO_ID}\transcript.txt
```

### Step 3: View keyframes (visual content)

Read the keyframe images to understand visual content:
```
Read tool: C:\Users\PC\.ytabsorb\{VIDEO_ID}\frames\key_0001.jpg
Read tool: C:\Users\PC\.ytabsorb\{VIDEO_ID}\frames\key_0010.jpg
(etc - sample 10-15 frames across the video)
```

### Step 4: Synthesize and output

Provide comprehensive analysis:

```markdown
## VIDEO ABSORBED: [Title]

### Summary (12 bullets max)
- [Key point 1]
- [Key point 2]
...

### Visual Workflow (what was shown on screen)
1. [Step seen in frames]
2. [Step seen in frames]
...

### Key Numbers & Settings
- [Specific values mentioned/shown]

### Action Items Checklist
- [ ] [Action 1]
- [ ] [Action 2]

### Red Flags / Weak Evidence
- [Anything unsubstantiated]

### Files Saved
- Transcript: [path]
- Keyframes: [path] ([N] images)
```

## Caching

Results are cached in `~/.ytabsorb/{video_id}/`. If user asks about the same video again, skip extraction and read from cache.

## Alternative: MCP YouTube Transcript

If yt-dlp/whisper aren't available, try:
```
mcp__youtube-transcript__get_transcript url: "URL" lang: "en"
```

But this only gets text, not visual content.
