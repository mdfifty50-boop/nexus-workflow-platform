# build-check.ps1 - Zero-token build verification
# Run this WITHOUT Claude to save tokens
# Usage: powershell -ExecutionPolicy Bypass -File nexus/scripts/build-check.ps1

param(
    [switch]$Quick  # Skip full Vite build, only TypeScript check
)

$ErrorActionPreference = "Continue"
$nexusDir = Join-Path $PSScriptRoot ".."

Write-Host "BUILD CHECK" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan

# Step 1: TypeScript check
Write-Host ""
Write-Host "[1/3] TypeScript Check..." -ForegroundColor Yellow
Push-Location $nexusDir
$tsResult = & npx tsc --noEmit 2>&1
$tsExitCode = $LASTEXITCODE
Pop-Location

if ($tsExitCode -eq 0) {
    Write-Host "  TypeScript: PASS" -ForegroundColor Green
} else {
    Write-Host "  TypeScript: FAIL" -ForegroundColor Red
    $tsResult | Select-Object -Last 20 | ForEach-Object { Write-Host "    $_" -ForegroundColor Red }
}

if (-not $Quick) {
    # Step 2: Vite build
    Write-Host ""
    Write-Host "[2/3] Vite Build..." -ForegroundColor Yellow
    Push-Location $nexusDir
    $buildResult = & npm run build 2>&1
    $buildExitCode = $LASTEXITCODE
    Pop-Location

    if ($buildExitCode -eq 0) {
        Write-Host "  Vite Build: PASS" -ForegroundColor Green
    } else {
        Write-Host "  Vite Build: FAIL" -ForegroundColor Red
        $buildResult | Select-Object -Last 10 | ForEach-Object { Write-Host "    $_" -ForegroundColor Red }
    }
} else {
    Write-Host ""
    Write-Host "[2/3] Vite Build: SKIPPED (--Quick mode)" -ForegroundColor Gray
    $buildExitCode = 0
}

# Step 3: Package check
Write-Host ""
Write-Host "[3/3] Package Check..." -ForegroundColor Yellow
$pkgPath = Join-Path $nexusDir "package.json"
if (Test-Path $pkgPath) {
    Write-Host "  package.json: PRESENT" -ForegroundColor Green
} else {
    Write-Host "  package.json: MISSING" -ForegroundColor Red
}

# Summary
Write-Host ""
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan

$allPass = ($tsExitCode -eq 0) -and ($buildExitCode -eq 0)
if ($allPass) {
    Write-Host "BUILD STATUS: PASS" -ForegroundColor Green
    exit 0
} else {
    Write-Host "BUILD STATUS: FAIL" -ForegroundColor Red
    exit 1
}
