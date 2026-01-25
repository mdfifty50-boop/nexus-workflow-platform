# ytabsorb.ps1 - YouTube Content Absorber for Claude Code
# Extracts transcript + keyframes from YouTube videos for full AI analysis

param(
    [Parameter(Mandatory=$true)]
    [string]$URL
)

$ErrorActionPreference = "Continue"  # Allow warnings from external tools

# Refresh PATH to pick up newly installed tools
$env:Path = [Environment]::GetEnvironmentVariable('Path', 'User') + ';' + [Environment]::GetEnvironmentVariable('Path', 'Machine')

# Configuration
$WORKDIR = "$HOME\.ytabsorb"
$SCENE_THRESHOLD = 0.30  # Lower = more frames captured (was 0.35)

# Dynamic frame limit based on video duration
# ~3-4 frames per minute for tutorials
function Get-MaxFrames {
    param([int]$durationSeconds)
    $minutes = [math]::Ceiling($durationSeconds / 60)
    $frames = $minutes * 4  # 4 frames per minute

    # Clamp between 40 and 200
    if ($frames -lt 40) { return 40 }
    if ($frames -gt 200) { return 200 }
    return $frames
}

# Will be set after getting video duration
$MAX_FRAMES = 120  # Default for ~30min video

# Extract video ID from URL
function Get-VideoId {
    param([string]$url)
    if ($url -match "v=([a-zA-Z0-9_-]{11})") {
        return $matches[1]
    } elseif ($url -match "youtu\.be/([a-zA-Z0-9_-]{11})") {
        return $matches[1]
    } elseif ($url -match "^([a-zA-Z0-9_-]{11})$") {
        return $url
    }
    throw "Could not extract video ID from URL"
}

# Check dependencies
function Test-Dependencies {
    $missing = @()
    if (-not (Get-Command "yt-dlp" -ErrorAction SilentlyContinue)) { $missing += "yt-dlp" }
    if (-not (Get-Command "whisper" -ErrorAction SilentlyContinue)) { $missing += "whisper" }
    if (-not (Get-Command "ffmpeg" -ErrorAction SilentlyContinue)) { $missing += "ffmpeg" }

    if ($missing.Count -gt 0) {
        Write-Host "Missing dependencies: $($missing -join ', ')" -ForegroundColor Red
        Write-Host ""
        Write-Host "Install with:" -ForegroundColor Yellow
        Write-Host "  winget install yt-dlp.yt-dlp" -ForegroundColor Cyan
        Write-Host "  winget install Gyan.FFmpeg" -ForegroundColor Cyan
        Write-Host "  pip install -U openai-whisper" -ForegroundColor Cyan
        exit 1
    }
}

# Main execution
Test-Dependencies

$VID = Get-VideoId $URL
$VIDDIR = "$WORKDIR\$VID"
$TRANSCRIPT = "$VIDDIR\transcript.txt"
$FRAMES_DIR = "$VIDDIR\frames"
$SUMMARY = "$VIDDIR\summary.md"

# Create directories
New-Item -ItemType Directory -Force -Path $VIDDIR | Out-Null
New-Item -ItemType Directory -Force -Path $FRAMES_DIR | Out-Null

Write-Host "========================================" -ForegroundColor Green
Write-Host "  YOUTUBE ABSORBER - $VID" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Check cache
if ((Test-Path $TRANSCRIPT) -and (Test-Path "$FRAMES_DIR\*.jpg")) {
    Write-Host "[CACHED] Found existing extraction for $VID" -ForegroundColor Yellow
    Write-Host "Transcript: $TRANSCRIPT"
    Write-Host "Frames: $FRAMES_DIR"
} else {
    # Step 1: Try to get subtitles first (fastest)
    Write-Host "[1/4] Checking for existing captions..." -ForegroundColor Cyan
    $subFile = "$VIDDIR\subs.en.vtt"
    # Suppress stderr warnings from yt-dlp (they're usually non-fatal)
    $null = yt-dlp --skip-download --write-auto-sub --sub-lang en --sub-format vtt -o "$VIDDIR\subs" $URL 2>&1

    $hasSubtitles = Test-Path "$VIDDIR\subs.en.vtt"

    if ($hasSubtitles) {
        Write-Host "  Found auto-captions, converting..." -ForegroundColor Green
        # Convert VTT to plain text
        $vttContent = Get-Content "$VIDDIR\subs.en.vtt" -Raw
        $plainText = $vttContent -replace "WEBVTT.*\n\n", "" -replace "\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}.*\n", "" -replace "<[^>]+>", "" -replace "\n\n+", "`n"
        $plainText | Out-File -FilePath $TRANSCRIPT -Encoding UTF8
    } else {
        # Step 2: Download audio and transcribe with Whisper
        Write-Host "[2/4] No captions found. Downloading audio..." -ForegroundColor Cyan
        $audioFile = "$VIDDIR\audio.mp3"
        $null = yt-dlp -x --audio-format mp3 -o $audioFile $URL 2>&1

        Write-Host "[2/4] Transcribing with Whisper (this may take a few minutes)..." -ForegroundColor Cyan
        $null = whisper $audioFile --model small --language en --output_format txt --output_dir $VIDDIR 2>&1

        # Whisper outputs audio.txt
        if (Test-Path "$VIDDIR\audio.txt") {
            Move-Item -Force "$VIDDIR\audio.txt" $TRANSCRIPT
        }
    }

    # Step 3: Get video duration and download
    Write-Host "[3/4] Getting video info and downloading..." -ForegroundColor Cyan
    $videoFile = "$VIDDIR\video.mp4"

    # Get duration first
    $durationStr = (yt-dlp --get-duration $URL 2>&1 | Where-Object { $_ -notmatch "WARNING" }) | Select-Object -First 1
    if ($durationStr) {
        # Parse duration (formats: "31:03" or "1:23:45")
        $parts = $durationStr.Split(":")
        if ($parts.Count -eq 2) {
            $durationSeconds = [int]$parts[0] * 60 + [int]$parts[1]
        } elseif ($parts.Count -eq 3) {
            $durationSeconds = [int]$parts[0] * 3600 + [int]$parts[1] * 60 + [int]$parts[2]
        } else {
            $durationSeconds = 1800  # Default 30 min
        }
        $MAX_FRAMES = Get-MaxFrames $durationSeconds
        $durationMin = [math]::Round($durationSeconds / 60, 1)
        Write-Host "  Duration: $durationMin min -> Max frames: $MAX_FRAMES" -ForegroundColor Green
    }

    if (-not (Test-Path $videoFile)) {
        $null = yt-dlp -f "bv*[height<=720]+ba/b[height<=720]" -o $videoFile $URL 2>&1
    }

    # Step 4: Extract keyframes only (scene changes)
    Write-Host "[4/4] Extracting keyframes (scene changes, max $MAX_FRAMES)..." -ForegroundColor Cyan
    $null = ffmpeg -hide_banner -loglevel error -i $videoFile -vf "select='gt(scene,$SCENE_THRESHOLD)',scale=1280:-1" -vsync vfr "$FRAMES_DIR\key_%04d.jpg" 2>&1

    # Limit to MAX_FRAMES (dynamic based on duration)
    $frames = Get-ChildItem "$FRAMES_DIR\key_*.jpg" | Sort-Object Name
    if ($frames.Count -gt $MAX_FRAMES) {
        # Instead of deleting extras, evenly sample to keep distribution
        $keepEvery = [math]::Ceiling($frames.Count / $MAX_FRAMES)
        $toKeep = @()
        for ($i = 0; $i -lt $frames.Count; $i += $keepEvery) {
            $toKeep += $frames[$i].FullName
        }
        foreach ($f in $frames) {
            if ($f.FullName -notin $toKeep) {
                Remove-Item -Force $f.FullName
            }
        }
        Write-Host "  Sampled down to ~$MAX_FRAMES keyframes (evenly distributed)" -ForegroundColor Yellow
    }
}

# Count results
$frameCount = (Get-ChildItem "$FRAMES_DIR\key_*.jpg" -ErrorAction SilentlyContinue).Count
$transcriptLines = if (Test-Path $TRANSCRIPT) { (Get-Content $TRANSCRIPT).Count } else { 0 }

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  EXTRACTION COMPLETE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Video ID:    $VID" -ForegroundColor White
Write-Host "Transcript:  $TRANSCRIPT ($transcriptLines lines)" -ForegroundColor White
Write-Host "Keyframes:   $FRAMES_DIR ($frameCount images)" -ForegroundColor White
Write-Host ""
Write-Host "TO ABSORB IN CLAUDE:" -ForegroundColor Yellow
Write-Host "1. Read transcript: Read tool -> $TRANSCRIPT" -ForegroundColor Cyan
Write-Host "2. View frames: Read tool -> $FRAMES_DIR\key_0001.jpg (etc)" -ForegroundColor Cyan
Write-Host ""

# Output paths for Claude to use
Write-Output "YTABSORB_TRANSCRIPT=$TRANSCRIPT"
Write-Output "YTABSORB_FRAMES=$FRAMES_DIR"
Write-Output "YTABSORB_VIDEO_ID=$VID"
