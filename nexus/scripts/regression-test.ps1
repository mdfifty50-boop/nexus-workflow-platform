# regression-test.ps1 - Automated Regression Test Suite for Nexus Fix Registry
# Zero-token: runs without Claude, validates all fix markers and generates reports
#
# Usage (from nexus/ directory):
#   powershell -ExecutionPolicy Bypass -File scripts/regression-test.ps1
#   powershell -ExecutionPolicy Bypass -File scripts/regression-test.ps1 -Verbose
#   powershell -ExecutionPolicy Bypass -File scripts/regression-test.ps1 -Category "OAuth"
#   powershell -ExecutionPolicy Bypass -File scripts/regression-test.ps1 -CriticalOnly
#
# Exit codes:
#   0 = All marker checks passed
#   1 = One or more marker checks failed
#   2 = Fatal error (missing registry, malformed JSON, etc.)

param(
    [switch]$Verbose,
    [switch]$CriticalOnly,
    [string]$Category = "",
    [switch]$JsonOutput,
    [switch]$Help
)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
$ErrorActionPreference = "Continue"
$scriptDir  = $PSScriptRoot
$nexusRoot  = Split-Path $scriptDir -Parent
$projectRoot = Split-Path $nexusRoot -Parent
$registryPath = Join-Path $nexusRoot "FIX_REGISTRY.json"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# ---------------------------------------------------------------------------
# Help
# ---------------------------------------------------------------------------
if ($Help) {
    Write-Host @"

  Nexus Regression Test Suite
  ===========================

  Validates that all code markers from FIX_REGISTRY.json exist in the codebase.
  Groups results by category, tracks pass/fail, and lists manual test commands.

  USAGE:
    powershell -ExecutionPolicy Bypass -File scripts/regression-test.ps1 [options]

  OPTIONS:
    -Verbose       Show PASS results in addition to FAILs
    -CriticalOnly  Only check fixes marked as critical: true
    -Category X    Only check fixes in category X (e.g., "OAuth", "WhatsApp")
    -JsonOutput    Output results as JSON (for CI integration)
    -Help          Show this help message

  EXIT CODES:
    0  All checked markers found
    1  One or more markers missing
    2  Fatal error (registry not found, JSON parse error)

"@ -ForegroundColor Cyan
    exit 0
}

# ---------------------------------------------------------------------------
# Banner
# ---------------------------------------------------------------------------
function Write-Banner {
    Write-Host ""
    Write-Host "  ================================================================" -ForegroundColor DarkCyan
    Write-Host "    NEXUS FIX REGISTRY - REGRESSION TEST SUITE" -ForegroundColor Cyan
    Write-Host "    $timestamp" -ForegroundColor DarkGray
    Write-Host "  ================================================================" -ForegroundColor DarkCyan
    Write-Host ""
}

# ---------------------------------------------------------------------------
# Load and parse registry
# ---------------------------------------------------------------------------
function Load-Registry {
    if (-not (Test-Path $registryPath)) {
        Write-Host "  FATAL: FIX_REGISTRY.json not found" -ForegroundColor Red
        Write-Host "  Expected: $registryPath" -ForegroundColor Red
        Write-Host "  Run this script from the nexus/ directory." -ForegroundColor Yellow
        exit 2
    }

    try {
        $raw = Get-Content $registryPath -Raw -ErrorAction Stop
        $parsed = $raw | ConvertFrom-Json -ErrorAction Stop
        return $parsed
    }
    catch {
        Write-Host "  FATAL: Failed to parse FIX_REGISTRY.json" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "  The file may contain malformed JSON." -ForegroundColor Yellow
        exit 2
    }
}

# ---------------------------------------------------------------------------
# Resolve file path from registry-relative path to absolute
# ---------------------------------------------------------------------------
function Resolve-FixFilePath {
    param([string]$RelativePath)

    # Registry paths look like "nexus/src/components/chat/WorkflowPreviewCard.tsx"
    # We need to try multiple resolution strategies.

    $candidates = @()

    # Strategy 1: Strip "nexus/" prefix and resolve from nexus root
    $stripped = $RelativePath -replace "^nexus/", ""
    $candidates += Join-Path $nexusRoot $stripped

    # Strategy 2: Resolve from project root (parent of nexus)
    $candidates += Join-Path $projectRoot $RelativePath

    # Strategy 3: Treat as absolute (unlikely but safe)
    $candidates += $RelativePath

    foreach ($path in $candidates) {
        if (Test-Path $path) {
            return $path
        }
    }
    return $null
}

# ---------------------------------------------------------------------------
# Check if a code marker exists in any of the listed files
# ---------------------------------------------------------------------------
function Test-Marker {
    param(
        [string]$Marker,
        [string[]]$Files
    )

    if (-not $Marker -or $Marker.Trim() -eq "") {
        # Fix has no marker -- cannot validate via code search
        return @{
            Status = "SKIP"
            Reason = "No code marker defined"
            File   = $null
        }
    }

    if (-not $Files -or $Files.Count -eq 0) {
        return @{
            Status = "SKIP"
            Reason = "No files listed"
            File   = $null
        }
    }

    foreach ($relFile in $Files) {
        $absPath = Resolve-FixFilePath $relFile
        if (-not $absPath) {
            continue  # File not found, try next
        }

        try {
            $content = Get-Content $absPath -Raw -ErrorAction Stop
            if ($content -and $content.Contains($Marker)) {
                return @{
                    Status = "PASS"
                    Reason = "Marker found"
                    File   = $absPath
                }
            }
        }
        catch {
            # Could not read file, try next
            continue
        }
    }

    # If we get here, marker was not found in any file
    # Determine if it is because files are missing or marker is absent
    $anyFileExists = $false
    foreach ($relFile in $Files) {
        $absPath = Resolve-FixFilePath $relFile
        if ($absPath) { $anyFileExists = $true; break }
    }

    if (-not $anyFileExists) {
        return @{
            Status = "FAIL"
            Reason = "None of the listed files exist"
            File   = $null
        }
    }

    return @{
        Status = "FAIL"
        Reason = "Marker not found in any listed file"
        File   = $null
    }
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
Write-Banner

$registry = Load-Registry
$fixes = $registry.fixes

# Show registry metadata
Write-Host "  Registry Version : $($registry._version)" -ForegroundColor White
Write-Host "  Last Updated     : $($registry._lastUpdated)" -ForegroundColor White
Write-Host "  Total Fixes      : $($fixes.Count)" -ForegroundColor White

# Apply filters
if ($CriticalOnly) {
    $fixes = $fixes | Where-Object { $_.critical -eq $true }
    Write-Host "  Filter           : Critical only ($($fixes.Count) fixes)" -ForegroundColor Yellow
}
if ($Category -ne "") {
    $fixes = $fixes | Where-Object { $_.category -eq $Category }
    Write-Host "  Filter           : Category = '$Category' ($($fixes.Count) fixes)" -ForegroundColor Yellow
}

if ($fixes.Count -eq 0) {
    Write-Host ""
    Write-Host "  No fixes match the given filters." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "  ----------------------------------------------------------------" -ForegroundColor DarkGray

# ---------------------------------------------------------------------------
# Run checks, group by category
# ---------------------------------------------------------------------------
$results     = @()
$passCnt     = 0
$failCnt     = 0
$skipCnt     = 0
$categories  = @{}
$manualTests = @()

foreach ($fix in $fixes) {
    $id       = $fix.id
    $cat      = if ($fix.category) { $fix.category } else { "Uncategorized" }
    $marker   = $fix.codeMarker
    $title    = $fix.title
    $critical = $fix.critical
    $files    = $fix.files
    $testCmd  = $fix.testCommand

    # Also check extended markers if present (e.g., FIX-064 has codeMarkerExt, codeMarkerAlias)
    $allMarkers = @()
    if ($marker) { $allMarkers += $marker }
    if ($fix.codeMarkerExt) { $allMarkers += $fix.codeMarkerExt }
    if ($fix.codeMarkerAlias) { $allMarkers += $fix.codeMarkerAlias }

    # Test the primary marker (or skip if none)
    $check = Test-Marker -Marker $marker -Files $files

    $entry = @{
        Id       = $id
        Category = $cat
        Title    = $title
        Critical = $critical
        Marker   = $marker
        Status   = $check.Status
        Reason   = $check.Reason
        Files    = $files
        FoundIn  = $check.File
        TestCmd  = $testCmd
    }

    $results += $entry

    # Track per-category
    if (-not $categories.ContainsKey($cat)) {
        $categories[$cat] = @{ Pass = 0; Fail = 0; Skip = 0; Items = @() }
    }
    $categories[$cat].Items += $entry

    switch ($check.Status) {
        "PASS" {
            $passCnt++
            $categories[$cat].Pass++
        }
        "FAIL" {
            $failCnt++
            $categories[$cat].Fail++
        }
        "SKIP" {
            $skipCnt++
            $categories[$cat].Skip++
        }
    }

    # Collect manual test commands
    if ($testCmd -and $testCmd.Trim() -ne "" -and $testCmd -ne "N/A" -and -not $testCmd.StartsWith("N/A")) {
        $manualTests += @{
            Id      = $id
            Title   = $title
            TestCmd = $testCmd
        }
    }
}

# ---------------------------------------------------------------------------
# Output: Grouped by Category
# ---------------------------------------------------------------------------
Write-Host ""
Write-Host "  RESULTS BY CATEGORY" -ForegroundColor Cyan
Write-Host "  ================================================================" -ForegroundColor DarkCyan

$sortedCategories = $categories.Keys | Sort-Object

foreach ($cat in $sortedCategories) {
    $catData = $categories[$cat]
    $catTotal = $catData.Pass + $catData.Fail + $catData.Skip
    $catLabel = "$cat ($($catData.Pass)/$catTotal passed"
    if ($catData.Fail -gt 0) {
        $catLabel += ", $($catData.Fail) FAILED"
    }
    if ($catData.Skip -gt 0) {
        $catLabel += ", $($catData.Skip) skipped"
    }
    $catLabel += ")"

    $catColor = if ($catData.Fail -gt 0) { "Red" } else { "Green" }
    Write-Host ""
    Write-Host "  [$cat]" -ForegroundColor $catColor
    Write-Host "  $('-' * 40)" -ForegroundColor DarkGray

    foreach ($item in $catData.Items) {
        $icon = switch ($item.Status) {
            "PASS" { "[PASS]" }
            "FAIL" { "[FAIL]" }
            "SKIP" { "[SKIP]" }
        }
        $color = switch ($item.Status) {
            "PASS" { "Green" }
            "FAIL" { "Red" }
            "SKIP" { "DarkYellow" }
        }

        $criticalTag = if ($item.Critical) { " *CRITICAL*" } else { "" }

        if ($item.Status -eq "FAIL" -or $Verbose -or ($item.Status -eq "SKIP" -and $Verbose)) {
            Write-Host "    $icon $($item.Id): $($item.Title)$criticalTag" -ForegroundColor $color
            if ($item.Status -eq "FAIL") {
                Write-Host "           Marker : $($item.Marker)" -ForegroundColor DarkYellow
                Write-Host "           Files  : $($item.Files -join ', ')" -ForegroundColor DarkYellow
                Write-Host "           Reason : $($item.Reason)" -ForegroundColor DarkYellow
            }
        }
    }
}

# ---------------------------------------------------------------------------
# Output: Summary
# ---------------------------------------------------------------------------
Write-Host ""
Write-Host "  ================================================================" -ForegroundColor DarkCyan
Write-Host "  SUMMARY" -ForegroundColor Cyan
Write-Host "  ================================================================" -ForegroundColor DarkCyan
Write-Host ""

$totalChecked = $passCnt + $failCnt + $skipCnt
Write-Host "  Total fixes checked : $totalChecked" -ForegroundColor White
Write-Host "  Passed              : $passCnt" -ForegroundColor Green
Write-Host "  Failed              : $failCnt" -ForegroundColor $(if ($failCnt -gt 0) { "Red" } else { "Green" })
Write-Host "  Skipped (no marker) : $skipCnt" -ForegroundColor DarkYellow
Write-Host ""

# List all failed fixes prominently
if ($failCnt -gt 0) {
    Write-Host "  FAILED FIXES - REQUIRE IMMEDIATE ATTENTION" -ForegroundColor Red
    Write-Host "  ----------------------------------------------------------------" -ForegroundColor Red
    $failedItems = $results | Where-Object { $_.Status -eq "FAIL" }
    foreach ($item in $failedItems) {
        $criticalTag = if ($item.Critical) { " [CRITICAL]" } else { "" }
        Write-Host "    $($item.Id)$criticalTag : $($item.Title)" -ForegroundColor Red
        Write-Host "      Marker : $($item.Marker)" -ForegroundColor Yellow
        Write-Host "      Files  : $($item.Files -join ', ')" -ForegroundColor Yellow
        Write-Host "      Reason : $($item.Reason)" -ForegroundColor Yellow
        Write-Host ""
    }
}

# List manual test commands
if ($manualTests.Count -gt 0) {
    Write-Host ""
    Write-Host "  MANUAL TEST CHECKLIST ($($manualTests.Count) items)" -ForegroundColor Cyan
    Write-Host "  ----------------------------------------------------------------" -ForegroundColor DarkCyan
    $testIndex = 1
    foreach ($test in $manualTests) {
        Write-Host "    $testIndex. [$($test.Id)] $($test.Title)" -ForegroundColor White
        Write-Host "       Test: $($test.TestCmd)" -ForegroundColor DarkGray
        $testIndex++
    }
}

# ---------------------------------------------------------------------------
# Output: JSON (for CI pipelines)
# ---------------------------------------------------------------------------
if ($JsonOutput) {
    $jsonResult = @{
        timestamp    = $timestamp
        version      = $registry._version
        totalFixes   = $totalChecked
        passed       = $passCnt
        failed       = $failCnt
        skipped      = $skipCnt
        exitCode     = if ($failCnt -gt 0) { 1 } else { 0 }
        failedFixes  = @($results | Where-Object { $_.Status -eq "FAIL" } | ForEach-Object {
            @{
                id       = $_.Id
                title    = $_.Title
                marker   = $_.Marker
                files    = $_.Files
                reason   = $_.Reason
                critical = $_.Critical
            }
        })
        categories   = @{}
    }

    foreach ($cat in $sortedCategories) {
        $catData = $categories[$cat]
        $jsonResult.categories[$cat] = @{
            pass = $catData.Pass
            fail = $catData.Fail
            skip = $catData.Skip
        }
    }

    $jsonPath = Join-Path $nexusRoot "regression-results.json"
    $jsonResult | ConvertTo-Json -Depth 5 | Out-File $jsonPath -Encoding UTF8
    Write-Host ""
    Write-Host "  JSON results written to: $jsonPath" -ForegroundColor DarkGray
}

# ---------------------------------------------------------------------------
# Final status
# ---------------------------------------------------------------------------
Write-Host ""
if ($failCnt -gt 0) {
    $criticalFails = ($results | Where-Object { $_.Status -eq "FAIL" -and $_.Critical -eq $true }).Count
    Write-Host "  RESULT: REGRESSION DETECTED" -ForegroundColor Red
    if ($criticalFails -gt 0) {
        Write-Host "  $criticalFails critical fix(es) are missing markers!" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "  Run '/regression' in Claude Code to auto-fix." -ForegroundColor Yellow
    Write-Host ""
    exit 1
} else {
    Write-Host "  RESULT: ALL MARKERS PRESENT - NO REGRESSIONS DETECTED" -ForegroundColor Green
    Write-Host ""
    exit 0
}
