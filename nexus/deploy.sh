#!/bin/bash

# Nexus Deployment Script for Mac/Linux
# Run: chmod +x deploy.sh && ./deploy.sh

echo "================================"
echo "  NEXUS DEPLOYMENT ASSISTANT"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Step 1: Check Prerequisites
echo -e "${YELLOW}STEP 1: Checking Prerequisites...${NC}"
echo ""

ALL_GOOD=true

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}[OK] Node.js installed: $NODE_VERSION${NC}"
else
    echo -e "${RED}[ERROR] Node.js not found. Please install from https://nodejs.org${NC}"
    ALL_GOOD=false
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}[OK] npm installed: $NPM_VERSION${NC}"
else
    echo -e "${RED}[ERROR] npm not found${NC}"
    ALL_GOOD=false
fi

# Check git
if command_exists git; then
    GIT_VERSION=$(git --version)
    echo -e "${GREEN}[OK] Git installed: $GIT_VERSION${NC}"
else
    echo -e "${YELLOW}[WARNING] Git not found. You'll need it for GitHub deployment${NC}"
fi

echo ""

if [ "$ALL_GOOD" = false ]; then
    echo -e "${RED}Please install missing prerequisites and run this script again.${NC}"
    exit 1
fi

# Step 2: Check if we're in the right directory
echo -e "${YELLOW}STEP 2: Verifying Project Directory...${NC}"
echo ""

if [ ! -f "package.json" ]; then
    echo -e "${RED}[ERROR] package.json not found. Please run this script from the nexus directory.${NC}"
    exit 1
fi

echo -e "${GREEN}[OK] Found package.json${NC}"
echo ""

# Step 3: Install Dependencies
echo -e "${YELLOW}STEP 3: Installing Dependencies...${NC}"
echo ""

if [ -d "node_modules" ]; then
    echo -e "${CYAN}Dependencies already installed. Skipping...${NC}"
else
    echo -e "${CYAN}Installing npm packages (this may take a few minutes)...${NC}"
    npm install

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}[OK] Dependencies installed${NC}"
    else
        echo -e "${RED}[ERROR] Failed to install dependencies${NC}"
        exit 1
    fi
fi

echo ""

# Step 4: Check Environment Variables
echo -e "${YELLOW}STEP 4: Checking Environment Configuration...${NC}"
echo ""

if [ ! -f ".env" ]; then
    echo -e "${YELLOW}[WARNING] .env file not found${NC}"
    echo -e "${CYAN}Creating .env from template...${NC}"

    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}[OK] Created .env file${NC}"
        echo ""
        echo -e "${RED}IMPORTANT: Edit .env file with your Supabase credentials!${NC}"
        echo -e "${CYAN}  1. Go to https://supabase.com and create a project${NC}"
        echo -e "${CYAN}  2. Copy your Project URL and Anon Key${NC}"
        echo -e "${CYAN}  3. Update .env file with those values${NC}"
        echo ""

        # Offer to open .env file
        read -p "Open .env file now? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            ${EDITOR:-nano} .env
        fi
    else
        echo -e "${RED}[ERROR] .env.example not found${NC}"
    fi
else
    echo -e "${GREEN}[OK] .env file exists${NC}"

    # Check if env vars are set
    if grep -q "your_supabase\|your_" .env; then
        echo -e "${YELLOW}[WARNING] .env contains placeholder values${NC}"
        echo -e "${YELLOW}Please update .env with real Supabase credentials${NC}"
    else
        echo -e "${GREEN}[OK] .env appears configured${NC}"
    fi
fi

echo ""

# Step 5: Build Project
echo -e "${YELLOW}STEP 5: Building Production Version...${NC}"
echo ""

echo -e "${CYAN}Running production build...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}[OK] Build successful!${NC}"

    # Show build size
    if [ -d "dist" ]; then
        DIST_SIZE=$(du -sh dist | cut -f1)
        echo -e "${CYAN}Build size: $DIST_SIZE${NC}"
    fi
else
    echo -e "${RED}[ERROR] Build failed. Check error messages above.${NC}"
    exit 1
fi

echo ""

# Step 6: Deployment Options
echo -e "${YELLOW}STEP 6: Deployment Options${NC}"
echo ""

echo -e "${CYAN}Your build is ready! Choose deployment method:${NC}"
echo ""
echo -e "${NC}Option 1: Deploy to Vercel (Recommended)${NC}"
echo -e "  - Run: npm install -g vercel"
echo -e "  - Run: vercel --prod"
echo -e "  - Follow the prompts"
echo ""
echo -e "${NC}Option 2: Deploy via GitHub + Vercel Website${NC}"
echo -e "  - Push code to GitHub"
echo -e "  - Connect GitHub repo to Vercel"
echo -e "  - Vercel will auto-deploy"
echo ""
echo -e "${NC}Option 3: Manual Deploy${NC}"
echo -e "  - Upload 'dist' folder to any static host"
echo -e "  - Configure environment variables"
echo ""

read -p "Install Vercel CLI now? (y/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${CYAN}Installing Vercel CLI...${NC}"
    npm install -g vercel

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}[OK] Vercel CLI installed${NC}"
        echo ""
        echo -e "${CYAN}To deploy, run:${NC}"
        echo -e "${YELLOW}  vercel login${NC}"
        echo -e "${YELLOW}  vercel --prod${NC}"
        echo ""
    fi
fi

# Final Summary
echo ""
echo "================================"
echo "  DEPLOYMENT CHECKLIST"
echo "================================"
echo ""

if [ -f ".env" ]; then
    echo -e "${GREEN}[X]${NC} .env file created and configured"
else
    echo "[ ] .env file created and configured"
fi

if [ -d "node_modules" ]; then
    echo -e "${GREEN}[X]${NC} Dependencies installed"
else
    echo "[ ] Dependencies installed"
fi

if [ -d "dist" ]; then
    echo -e "${GREEN}[X]${NC} Production build created"
else
    echo "[ ] Production build created"
fi

echo -e "${YELLOW}[ ]${NC} Supabase project created"
echo -e "${YELLOW}[ ]${NC} Database migration run"
echo -e "${YELLOW}[ ]${NC} Deployed to Vercel"
echo -e "${YELLOW}[ ]${NC} Environment variables set in Vercel"
echo -e "${YELLOW}[ ]${NC} Tested live application"

echo ""
echo -e "${CYAN}Next Steps:${NC}"
echo "1. Create Supabase project at https://supabase.com"
echo "2. Run SQL migration from supabase/migrations/"
echo "3. Deploy to Vercel: vercel --prod"
echo "4. Set environment variables in Vercel dashboard"
echo "5. Test your live app!"
echo ""
echo "Full instructions: See DEPLOY-NOW.md"
echo ""
echo "================================"
echo -e "${GREEN}  READY TO DEPLOY!${NC}"
echo "================================"
echo ""
