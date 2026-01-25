# Nexus Deployment Script for Windows PowerShell
# Run this script to automate parts of the deployment

Write-Host "================================" -ForegroundColor Cyan
Write-Host "  NEXUS DEPLOYMENT ASSISTANT" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Step 1: Check Prerequisites
Write-Host "STEP 1: Checking Prerequisites..." -ForegroundColor Yellow
Write-Host ""

$allGood = $true

# Check Node.js
if (Test-Command node) {
    $nodeVersion = node --version
    Write-Host "[OK] Node.js installed: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Node.js not found. Please install from https://nodejs.org" -ForegroundColor Red
    $allGood = $false
}

# Check npm
if (Test-Command npm) {
    $npmVersion = npm --version
    Write-Host "[OK] npm installed: $npmVersion" -ForegroundColor Green
} else {
    Write-Host "[ERROR] npm not found" -ForegroundColor Red
    $allGood = $false
}

# Check git
if (Test-Command git) {
    $gitVersion = git --version
    Write-Host "[OK] Git installed: $gitVersion" -ForegroundColor Green
} else {
    Write-Host "[WARNING] Git not found. You'll need it for GitHub deployment" -ForegroundColor Yellow
}

Write-Host ""

if (-not $allGood) {
    Write-Host "Please install missing prerequisites and run this script again." -ForegroundColor Red
    exit 1
}

# Step 2: Check if we're in the right directory
Write-Host "STEP 2: Verifying Project Directory..." -ForegroundColor Yellow
Write-Host ""

if (-not (Test-Path "package.json")) {
    Write-Host "[ERROR] package.json not found. Please run this script from the nexus directory." -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Found package.json" -ForegroundColor Green
Write-Host ""

# Step 3: Install Dependencies
Write-Host "STEP 3: Installing Dependencies..." -ForegroundColor Yellow
Write-Host ""

if (Test-Path "node_modules") {
    Write-Host "Dependencies already installed. Skipping..." -ForegroundColor Gray
} else {
    Write-Host "Installing npm packages (this may take a few minutes)..." -ForegroundColor Cyan
    npm install

    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# Step 4: Check Environment Variables
Write-Host "STEP 4: Checking Environment Configuration..." -ForegroundColor Yellow
Write-Host ""

if (-not (Test-Path ".env")) {
    Write-Host "[WARNING] .env file not found" -ForegroundColor Yellow
    Write-Host "Creating .env from template..." -ForegroundColor Cyan

    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "[OK] Created .env file" -ForegroundColor Green
        Write-Host ""
        Write-Host "IMPORTANT: Edit .env file with your Supabase credentials!" -ForegroundColor Red -BackgroundColor Yellow
        Write-Host "  1. Go to https://supabase.com and create a project" -ForegroundColor Cyan
        Write-Host "  2. Copy your Project URL and Anon Key" -ForegroundColor Cyan
        Write-Host "  3. Update .env file with those values" -ForegroundColor Cyan
        Write-Host ""

        # Offer to open .env file
        $openFile = Read-Host "Open .env file now? (y/n)"
        if ($openFile -eq "y") {
            notepad .env
        }
    } else {
        Write-Host "[ERROR] .env.example not found" -ForegroundColor Red
    }
} else {
    Write-Host "[OK] .env file exists" -ForegroundColor Green

    # Check if env vars are set
    $envContent = Get-Content ".env"
    if ($envContent -match "your_supabase" -or $envContent -match "your_") {
        Write-Host "[WARNING] .env contains placeholder values" -ForegroundColor Yellow
        Write-Host "Please update .env with real Supabase credentials" -ForegroundColor Yellow
    } else {
        Write-Host "[OK] .env appears configured" -ForegroundColor Green
    }
}

Write-Host ""

# Step 5: Build Project
Write-Host "STEP 5: Building Production Version..." -ForegroundColor Yellow
Write-Host ""

Write-Host "Running production build..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Build successful!" -ForegroundColor Green

    # Show build size
    if (Test-Path "dist") {
        $distSize = (Get-ChildItem -Path dist -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
        Write-Host "Build size: $([math]::Round($distSize, 2)) MB" -ForegroundColor Cyan
    }
} else {
    Write-Host "[ERROR] Build failed. Check error messages above." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 6: Deployment Options
Write-Host "STEP 6: Deployment Options" -ForegroundColor Yellow
Write-Host ""

Write-Host "Your build is ready! Choose deployment method:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option 1: Deploy to Vercel (Recommended)" -ForegroundColor White
Write-Host "  - Run: npm install -g vercel" -ForegroundColor Gray
Write-Host "  - Run: vercel --prod" -ForegroundColor Gray
Write-Host "  - Follow the prompts" -ForegroundColor Gray
Write-Host ""
Write-Host "Option 2: Deploy via GitHub + Vercel Website" -ForegroundColor White
Write-Host "  - Push code to GitHub" -ForegroundColor Gray
Write-Host "  - Connect GitHub repo to Vercel" -ForegroundColor Gray
Write-Host "  - Vercel will auto-deploy" -ForegroundColor Gray
Write-Host ""
Write-Host "Option 3: Manual Deploy" -ForegroundColor White
Write-Host "  - Upload 'dist' folder to any static host" -ForegroundColor Gray
Write-Host "  - Configure environment variables" -ForegroundColor Gray
Write-Host ""

$deployChoice = Read-Host "Install Vercel CLI now? (y/n)"

if ($deployChoice -eq "y") {
    Write-Host ""
    Write-Host "Installing Vercel CLI..." -ForegroundColor Cyan
    npm install -g vercel

    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Vercel CLI installed" -ForegroundColor Green
        Write-Host ""
        Write-Host "To deploy, run:" -ForegroundColor Cyan
        Write-Host "  vercel login" -ForegroundColor Yellow
        Write-Host "  vercel --prod" -ForegroundColor Yellow
        Write-Host ""
    }
}

# Final Summary
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "  DEPLOYMENT CHECKLIST" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[" -NoNewline
if (Test-Path ".env") { Write-Host "X" -ForegroundColor Green -NoNewline } else { Write-Host " " -NoNewline }
Write-Host "] .env file created and configured"

Write-Host "[" -NoNewline
if (Test-Path "node_modules") { Write-Host "X" -ForegroundColor Green -NoNewline } else { Write-Host " " -NoNewline }
Write-Host "] Dependencies installed"

Write-Host "[" -NoNewline
if (Test-Path "dist") { Write-Host "X" -ForegroundColor Green -NoNewline } else { Write-Host " " -NoNewline }
Write-Host "] Production build created"

Write-Host "[ ] Supabase project created" -ForegroundColor Yellow
Write-Host "[ ] Database migration run" -ForegroundColor Yellow
Write-Host "[ ] Deployed to Vercel" -ForegroundColor Yellow
Write-Host "[ ] Environment variables set in Vercel" -ForegroundColor Yellow
Write-Host "[ ] Tested live application" -ForegroundColor Yellow

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Create Supabase project at https://supabase.com" -ForegroundColor White
Write-Host "2. Run SQL migration from supabase/migrations/" -ForegroundColor White
Write-Host "3. Deploy to Vercel: vercel --prod" -ForegroundColor White
Write-Host "4. Set environment variables in Vercel dashboard" -ForegroundColor White
Write-Host "5. Test your live app!" -ForegroundColor White
Write-Host ""
Write-Host "Full instructions: See DEPLOY-NOW.md" -ForegroundColor Gray
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "  READY TO DEPLOY!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
