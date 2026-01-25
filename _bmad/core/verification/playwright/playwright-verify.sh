#!/bin/bash
#===============================================================================
# BMAD Playwright Verification Script
#
# Purpose: Run browser-based verification using Playwright MCP
#
# Usage:
#   playwright-verify.sh --url <url> [options]
#   playwright-verify.sh --gate <gate-config-file>
#
# This script prepares the environment and context for Playwright MCP calls.
# The actual MCP calls are made by the agent through Claude's tool interface.
#===============================================================================

set -euo pipefail

# === CONFIGURATION ===
DEFAULT_BASE_URL="http://localhost:5173"
BASE_URL="${PLAYWRIGHT_BASE_URL:-$DEFAULT_BASE_URL}"
SCREENSHOT_DIR=".bmad-screenshots"
WAIT_TIMEOUT=30
DEV_SERVER_WAIT=10

# === COLORS ===
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[PLAYWRIGHT]${NC} $1"; }
log_success() { echo -e "${GREEN}[PLAYWRIGHT]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[PLAYWRIGHT]${NC} $1"; }
log_error() { echo -e "${RED}[PLAYWRIGHT]${NC} $1"; }

timestamp() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }

# === HELPER FUNCTIONS ===

check_server_running() {
    local url="$1"
    local max_attempts="${2:-10}"
    local attempt=0

    log_info "Checking if server is running at $url..."

    while [[ $attempt -lt $max_attempts ]]; do
        if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|304"; then
            log_success "Server is running"
            return 0
        fi
        ((attempt++))
        log_info "Waiting for server... (attempt $attempt/$max_attempts)"
        sleep 2
    done

    log_error "Server not responding at $url after $max_attempts attempts"
    return 1
}

start_dev_server() {
    local project_dir="$1"

    log_info "Starting dev server in $project_dir..."

    # Check if already running
    if check_server_running "$BASE_URL" 2; then
        log_info "Dev server already running"
        return 0
    fi

    # Start server in background
    cd "$project_dir"
    npm run dev &
    DEV_SERVER_PID=$!

    log_info "Dev server started (PID: $DEV_SERVER_PID)"

    # Wait for server to be ready
    if ! check_server_running "$BASE_URL" "$DEV_SERVER_WAIT"; then
        log_error "Failed to start dev server"
        return 1
    fi

    return 0
}

ensure_screenshot_dir() {
    mkdir -p "$SCREENSHOT_DIR"
}

# === GATE OUTPUT GENERATION ===

generate_mcp_instructions() {
    local url="$1"
    local assertions="${2:-}"

    cat << EOF
## Playwright MCP Verification Instructions

Execute the following MCP tool calls in sequence:

### Step 1: Navigate to Page
\`\`\`
mcp__playwright__browser_navigate
  url: "$url"
\`\`\`

### Step 2: Wait for Content
\`\`\`
mcp__playwright__browser_wait_for
  time: 2
\`\`\`

### Step 3: Check Console Errors
\`\`\`
mcp__playwright__browser_console_messages
  level: "error"
\`\`\`

**ASSERTION:** Console errors array should be EMPTY.
If there are errors, the gate FAILS.

### Step 4: Get Page Snapshot
\`\`\`
mcp__playwright__browser_snapshot
\`\`\`

**ASSERTIONS:**
$assertions

### Step 5: Take Screenshot (Evidence)
\`\`\`
mcp__playwright__browser_take_screenshot
  filename: "$SCREENSHOT_DIR/verify-$(date +%s).png"
\`\`\`

## Verification Result

After executing all steps, report:
- PLAYWRIGHT_GATE_PASSED if all assertions pass
- PLAYWRIGHT_GATE_FAILED: <reason> if any assertion fails

EOF
}

# === MAIN ===

show_help() {
    cat << EOF
BMAD Playwright Verification

Usage:
  playwright-verify.sh --url <url> [--assert <assertion>]
  playwright-verify.sh --check-server [--base-url <url>]
  playwright-verify.sh --start-server <project-dir>
  playwright-verify.sh --generate-instructions <url> [--assert <assertion>]

Options:
  --url <url>           URL to verify
  --assert <text>       Text/element to assert exists in snapshot
  --base-url <url>      Override default base URL (default: $DEFAULT_BASE_URL)
  --check-server        Just check if server is running
  --start-server <dir>  Start dev server in directory
  --generate-instructions  Output MCP instructions for agent
  --screenshot-dir <dir>   Directory for screenshots (default: $SCREENSHOT_DIR)
  -h, --help            Show this help

Examples:
  playwright-verify.sh --check-server
  playwright-verify.sh --url http://localhost:5173/dashboard --assert "Dashboard"
  playwright-verify.sh --generate-instructions http://localhost:5173/workflows

Note: This script generates instructions for Playwright MCP calls.
The actual browser automation is performed by Claude using MCP tools.
EOF
}

# Parse arguments
URL=""
ASSERTIONS=""
ACTION="verify"
PROJECT_DIR=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --url)
            URL="$2"
            shift 2
            ;;
        --assert)
            ASSERTIONS="${ASSERTIONS}- Snapshot contains: $2\n"
            shift 2
            ;;
        --base-url)
            BASE_URL="$2"
            shift 2
            ;;
        --check-server)
            ACTION="check-server"
            shift
            ;;
        --start-server)
            ACTION="start-server"
            PROJECT_DIR="$2"
            shift 2
            ;;
        --generate-instructions)
            ACTION="generate"
            URL="$2"
            shift 2
            ;;
        --screenshot-dir)
            SCREENSHOT_DIR="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            log_error "Unknown argument: $1"
            show_help
            exit 1
            ;;
    esac
done

case "$ACTION" in
    check-server)
        check_server_running "$BASE_URL"
        ;;
    start-server)
        if [[ -z "$PROJECT_DIR" ]]; then
            log_error "Project directory required for --start-server"
            exit 1
        fi
        start_dev_server "$PROJECT_DIR"
        ;;
    generate)
        if [[ -z "$URL" ]]; then
            log_error "URL required for --generate-instructions"
            exit 1
        fi
        ensure_screenshot_dir
        generate_mcp_instructions "$URL" "$ASSERTIONS"
        ;;
    verify)
        if [[ -z "$URL" ]]; then
            log_error "URL required. Use --url <url>"
            exit 1
        fi

        # Check server first
        if ! check_server_running "$BASE_URL" 3; then
            log_error "Server not running. Start it first or use --start-server"
            exit 1
        fi

        ensure_screenshot_dir
        log_info "Generating MCP verification instructions..."
        generate_mcp_instructions "$URL" "$ASSERTIONS"
        ;;
esac
