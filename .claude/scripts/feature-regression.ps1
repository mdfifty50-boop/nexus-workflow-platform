# feature-regression.ps1 - Run regression tests against feature_list.json
# Based on Leon van Zyl's autonomous coding methodology

param(
    [Parameter(Mandatory=$false)]
    [string]$Mode = "check",

    [Parameter(Mandatory=$false)]
    [string]$FeatureId = "",

    [Parameter(Mandatory=$false)]
    [switch]$All,

    [Parameter(Mandatory=$false)]
    [switch]$Failed
)

$FEATURE_FILE = "$PSScriptRoot\..\..\feature_list.json"

function Get-Features {
    if (-not (Test-Path $FEATURE_FILE)) {
        Write-Host "ERROR: feature_list.json not found at $FEATURE_FILE" -ForegroundColor Red
        exit 1
    }
    return Get-Content $FEATURE_FILE -Raw | ConvertFrom-Json
}

function Save-Features($data) {
    $data.lastUpdated = (Get-Date).ToString("yyyy-MM-dd")
    $data | ConvertTo-Json -Depth 10 | Out-File $FEATURE_FILE -Encoding UTF8
}

function Show-Status {
    $data = Get-Features
    $total = $data.features.Count
    $passed = ($data.features | Where-Object { $_.passes -eq $true }).Count
    $failed = $total - $passed

    Write-Host ""
    Write-Host "======================================================" -ForegroundColor Cyan
    Write-Host "        NEXUS FEATURE REGRESSION STATUS" -ForegroundColor Cyan
    Write-Host "======================================================" -ForegroundColor Cyan
    Write-Host "  Total Features: $total" -ForegroundColor White
    Write-Host "  Passing:        $passed" -ForegroundColor Green
    Write-Host "  Failing:        $failed" -ForegroundColor $(if($failed -gt 0){'Red'}else{'Green'})
    Write-Host "======================================================" -ForegroundColor Cyan
    Write-Host ""

    foreach ($feature in $data.features | Sort-Object priority) {
        if ($feature.passes) {
            $status = "[PASS]"
            $color = "Green"
        } else {
            $status = "[FAIL]"
            $color = "Red"
        }
        Write-Host "  $($feature.id) $status - $($feature.name)" -ForegroundColor $color
    }
    Write-Host ""
}

function Show-Feature($id) {
    $data = Get-Features
    $feature = $data.features | Where-Object { $_.id -eq $id }

    if (-not $feature) {
        Write-Host "ERROR: Feature '$id' not found" -ForegroundColor Red
        return
    }

    if ($feature.passes) {
        $status = "PASSING"
        $color = "Green"
    } else {
        $status = "FAILING"
        $color = "Red"
    }

    Write-Host ""
    Write-Host "======================================================" -ForegroundColor Cyan
    Write-Host "  $($feature.name)" -ForegroundColor White
    Write-Host "======================================================" -ForegroundColor Cyan
    Write-Host "  ID:       $($feature.id)" -ForegroundColor White
    Write-Host "  Priority: $($feature.priority)" -ForegroundColor White
    Write-Host "  Status:   $status" -ForegroundColor $color
    Write-Host "  Test:     $($feature.testFile)" -ForegroundColor White
    Write-Host "------------------------------------------------------" -ForegroundColor Cyan
    Write-Host "  VERIFICATION STEPS:" -ForegroundColor Yellow

    $stepNum = 1
    foreach ($step in $feature.steps) {
        Write-Host "    $stepNum. $step" -ForegroundColor White
        $stepNum++
    }

    Write-Host "------------------------------------------------------" -ForegroundColor Cyan
    Write-Host "  CRITICAL PATHS:" -ForegroundColor Yellow
    foreach ($path in $feature.criticalPaths) {
        Write-Host "    - $path" -ForegroundColor White
    }
    Write-Host "======================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Set-FeatureStatus($id, $passes) {
    $data = Get-Features
    $feature = $data.features | Where-Object { $_.id -eq $id }

    if (-not $feature) {
        Write-Host "ERROR: Feature '$id' not found" -ForegroundColor Red
        return
    }

    $feature.passes = $passes
    Save-Features $data

    if ($passes) {
        $status = "PASS"
        $color = "Green"
    } else {
        $status = "FAIL"
        $color = "Red"
    }
    Write-Host "[$id] Marked as $status" -ForegroundColor $color
}

function Get-NextFeature {
    $data = Get-Features
    $next = $data.features | Where-Object { $_.passes -eq $false } | Sort-Object priority | Select-Object -First 1

    if ($next) {
        Write-Host ""
        Write-Host "NEXT FEATURE TO VERIFY:" -ForegroundColor Yellow
        Show-Feature $next.id
    } else {
        Write-Host ""
        Write-Host "ALL FEATURES PASSING!" -ForegroundColor Green
        Write-Host ""
    }
}

switch ($Mode) {
    "check" {
        Show-Status
    }
    "list" {
        Show-Status
    }
    "show" {
        if ($FeatureId) {
            Show-Feature $FeatureId
        } else {
            Write-Host "Usage: -Mode show -FeatureId epic-1" -ForegroundColor Yellow
        }
    }
    "pass" {
        if ($FeatureId) {
            Set-FeatureStatus $FeatureId $true
        } elseif ($All) {
            $data = Get-Features
            foreach ($f in $data.features) { $f.passes = $true }
            Save-Features $data
            Write-Host "All features marked as PASS" -ForegroundColor Green
        } else {
            Write-Host "Usage: -Mode pass -FeatureId epic-1" -ForegroundColor Yellow
        }
    }
    "fail" {
        if ($FeatureId) {
            Set-FeatureStatus $FeatureId $false
        } elseif ($All) {
            $data = Get-Features
            foreach ($f in $data.features) { $f.passes = $false }
            Save-Features $data
            Write-Host "All features marked as FAIL" -ForegroundColor Red
        } else {
            Write-Host "Usage: -Mode fail -FeatureId epic-1" -ForegroundColor Yellow
        }
    }
    "next" {
        Get-NextFeature
    }
    "reset" {
        $data = Get-Features
        foreach ($f in $data.features) { $f.passes = $false }
        Save-Features $data
        Write-Host "All features reset to FAIL (ready for regression)" -ForegroundColor Yellow
    }
    default {
        Write-Host ""
        Write-Host "FEATURE REGRESSION TOOL" -ForegroundColor Cyan
        Write-Host "========================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Usage:" -ForegroundColor Yellow
        Write-Host "  -Mode check              Show all feature statuses"
        Write-Host "  -Mode show -FeatureId X  Show details for feature X"
        Write-Host "  -Mode pass -FeatureId X  Mark feature X as passing"
        Write-Host "  -Mode fail -FeatureId X  Mark feature X as failing"
        Write-Host "  -Mode pass -All          Mark ALL features as passing"
        Write-Host "  -Mode reset              Reset all features to failing"
        Write-Host "  -Mode next               Show next failing feature"
        Write-Host ""
    }
}
