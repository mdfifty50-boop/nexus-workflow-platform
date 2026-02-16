# validate-fixes.ps1 - Zero-token fix registry validation
# Run this WITHOUT Claude to save tokens
# Usage: powershell -ExecutionPolicy Bypass -File nexus/scripts/validate-fixes.ps1

param(
    [switch]$Verbose,
    [switch]$FixOnly
)

$ErrorActionPreference = "Continue"
$registryPath = Join-Path $PSScriptRoot ".." "FIX_REGISTRY.json"

if (-not (Test-Path $registryPath)) {
    Write-Host "ERROR: FIX_REGISTRY.json not found at $registryPath" -ForegroundColor Red
    exit 1
}

$registry = Get-Content $registryPath -Raw | ConvertFrom-Json
$totalFixes = $registry.fixes.Count
$markersPresent = 0
$markersMissing = 0
$missingList = @()

Write-Host "FIX REGISTRY VALIDATION" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host "Total fixes: $totalFixes"
Write-Host ""

foreach ($fix in $registry.fixes) {
    if (-not $fix.codeMarker) { continue }

    $found = $false
    foreach ($file in $fix.files) {
        $fullPath = Join-Path $PSScriptRoot ".." $file.Replace("nexus/", "")
        if (-not $fullPath.StartsWith("nexus")) {
            $fullPath = Join-Path $PSScriptRoot ".." ".." $file
        }

        # Try multiple path resolutions
        $searchPaths = @(
            (Join-Path $PSScriptRoot ".." $file.Replace("nexus/", "")),
            (Join-Path $PSScriptRoot ".." ".." $file),
            $file
        )

        foreach ($sp in $searchPaths) {
            if (Test-Path $sp) {
                $content = Get-Content $sp -Raw -ErrorAction SilentlyContinue
                if ($content -and $content.Contains($fix.codeMarker)) {
                    $found = $true
                    break
                }
            }
        }
        if ($found) { break }
    }

    if ($found) {
        $markersPresent++
        if ($Verbose) {
            Write-Host "  OK  $($fix.id) - $($fix.codeMarker)" -ForegroundColor Green
        }
    } else {
        $markersMissing++
        $missingList += $fix
        Write-Host "  MISSING  $($fix.id) - $($fix.codeMarker) - $($fix.title)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "RESULTS" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host "Markers Present: $markersPresent" -ForegroundColor Green
Write-Host "Markers Missing: $markersMissing" -ForegroundColor $(if ($markersMissing -gt 0) { "Red" } else { "Green" })

if ($markersMissing -gt 0) {
    Write-Host ""
    Write-Host "MISSING FIXES (RESTORE IMMEDIATELY):" -ForegroundColor Red
    foreach ($fix in $missingList) {
        Write-Host "  $($fix.id): $($fix.title)" -ForegroundColor Yellow
        Write-Host "    Marker: $($fix.codeMarker)" -ForegroundColor Yellow
        Write-Host "    Files: $($fix.files -join ', ')" -ForegroundColor Yellow
    }
    exit 1
} else {
    Write-Host ""
    Write-Host "ALL FIX MARKERS PRESENT" -ForegroundColor Green
    exit 0
}
