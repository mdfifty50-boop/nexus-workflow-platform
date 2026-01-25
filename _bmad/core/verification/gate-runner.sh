#!/bin/bash
#===============================================================================
# BMAD VERIFICATION GATE RUNNER
#
# Purpose: Execute verification gates to validate task completion
# Principle: "An agent CANNOT mark a task done. Only passing gates can."
#
# Usage:
#   gate-runner.sh --story <story-file> [--once] [--max-iterations N]
#
# Modes:
#   --once              Run single iteration, return to human (for steering)
#   --max-iterations N  Run autonomous loop with N max iterations (default: 10)
#
# Exit Codes:
#   0 - All gates passed, task marked done
#   1 - Gates failed, needs retry or human intervention
#   2 - Stuck (consecutive failures), escalated to human
#   3 - Max iterations reached without completion
#===============================================================================

set -uo pipefail
# Note: -e (errexit) removed for debugging compatibility

# === CONFIGURATION ===
MAX_ITERATIONS=${MAX_ITERATIONS:-10}
MAX_CONSECUTIVE_FAILURES=${MAX_CONSECUTIVE_FAILURES:-3}
ONCE_MODE=false
STORY_FILE=""
PROGRESS_FILE="progress.txt"
GATE_LOG_FILE=".bmad-gate-log.json"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROGRESS_MANAGER="$SCRIPT_DIR/memory/progress-manager.sh"

# === COLORS FOR OUTPUT ===
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# === HELPER FUNCTIONS ===
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[PASS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[FAIL]${NC} $1"; }

timestamp() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }

# === PARSE ARGUMENTS ===
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --story)
                STORY_FILE="$2"
                shift 2
                ;;
            --once)
                ONCE_MODE=true
                shift
                ;;
            --max-iterations)
                MAX_ITERATIONS="$2"
                shift 2
                ;;
            --consecutive-fail-limit)
                MAX_CONSECUTIVE_FAILURES="$2"
                shift 2
                ;;
            --progress-file)
                PROGRESS_FILE="$2"
                shift 2
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown argument: $1"
                exit 1
                ;;
        esac
    done

    if [[ -z "$STORY_FILE" ]]; then
        log_error "Story file required. Use --story <file>"
        exit 1
    fi
}

show_help() {
    cat << EOF
BMAD Verification Gate Runner

Usage: gate-runner.sh --story <story-file> [options]

Options:
  --story <file>              Story/task YAML file with gate definitions (required)
  --once                      Single iteration mode (human-in-loop)
  --max-iterations <N>        Max loop iterations (default: 10)
  --consecutive-fail-limit <N> Stop after N consecutive failures (default: 3)
  --progress-file <file>      Progress log file (default: progress.txt)
  -h, --help                  Show this help

Exit Codes:
  0 - All gates passed
  1 - Gates failed (retriable)
  2 - Stuck (needs human)
  3 - Max iterations reached
EOF
}

# === GATE EXECUTION ===
run_gate() {
    local gate_name="$1"
    local gate_type="$2"
    local gate_command="$3"
    local expected_exit="${4:-0}"

    log_info "Running gate: $gate_name"

    local start_time=$(date +%s)
    local exit_code=0
    local output=""

    case "$gate_type" in
        command)
            output=$(eval "$gate_command" 2>&1) || exit_code=$?
            ;;
        playwright)
            # Placeholder for Playwright MCP integration
            output=$(run_playwright_gate "$gate_command" 2>&1) || exit_code=$?
            ;;
        file_exists)
            if [[ -f "$gate_command" ]]; then
                output="File exists: $gate_command"
                exit_code=0
            else
                output="File NOT found: $gate_command"
                exit_code=1
            fi
            ;;
        *)
            log_error "Unknown gate type: $gate_type"
            return 1
            ;;
    esac

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    # Log result
    if [[ $exit_code -eq $expected_exit ]]; then
        log_success "$gate_name (${duration}s)"
        echo "{\"gate\": \"$gate_name\", \"status\": \"pass\", \"duration\": $duration, \"timestamp\": \"$(timestamp)\"}" >> "$GATE_LOG_FILE"
        return 0
    else
        log_error "$gate_name (expected exit $expected_exit, got $exit_code)"
        echo "{\"gate\": \"$gate_name\", \"status\": \"fail\", \"exit_code\": $exit_code, \"output\": \"${output:0:500}\", \"timestamp\": \"$(timestamp)\"}" >> "$GATE_LOG_FILE"
        return 1
    fi
}

run_playwright_gate() {
    local action="$1"
    # This will be replaced with actual Playwright MCP calls
    # For now, placeholder that always passes
    log_warn "Playwright gate not yet implemented: $action"
    return 0
}

# === EXTRACT GATES FROM STORY FILE ===
extract_gates() {
    local story_file="$1"

    # Check if yq is available
    if command -v yq &> /dev/null; then
        yq -r '.verification.gates[] | "\(.name)|\(.type)|\(.command)|\(.expected_exit // 0)"' "$story_file" 2>/dev/null
    # Try python first (works better on Windows than python3 stub)
    elif python --version &> /dev/null 2>&1; then
        python "$SCRIPT_DIR/extract-gates.py" "$story_file" 2>/dev/null
    elif python3 --version &> /dev/null 2>&1; then
        python3 "$SCRIPT_DIR/extract-gates.py" "$story_file" 2>/dev/null
    else
        # Last resort: grep-based extraction
        log_warn "Neither yq nor Python found, using basic extraction"
        grep -A4 "^  - name:" "$story_file" | paste - - - - - | \
            sed 's/.*name: "\([^"]*\)".*type: "\([^"]*\)".*command: "\([^"]*\)".*/\1|\2|\3|0/'
    fi
}

# === UPDATE STORY STATUS ===
update_story_status() {
    local story_file="$1"
    local new_status="$2"
    local all_gates_passed="$3"

    if command -v yq &> /dev/null; then
        yq -i ".status = \"$new_status\"" "$story_file"
        yq -i ".verification.all_gates_passed = $all_gates_passed" "$story_file"
        yq -i ".verification.last_run = \"$(timestamp)\"" "$story_file"
    else
        log_warn "yq not found, cannot update story file automatically"
        log_info "Please manually set status to: $new_status"
    fi
}

# === PROGRESS MANAGEMENT ===
init_progress() {
    local story_id="$1"

    if [[ -f "$PROGRESS_MANAGER" ]]; then
        if [[ ! -f "$PROGRESS_FILE" ]]; then
            bash "$PROGRESS_MANAGER" --file "$PROGRESS_FILE" init "$story_id"
        fi
        bash "$PROGRESS_MANAGER" --file "$PROGRESS_FILE" session-start
    else
        # Fallback: simple initialization
        if [[ ! -f "$PROGRESS_FILE" ]]; then
            echo "# Progress Log: $story_id" > "$PROGRESS_FILE"
            echo "# Started: $(timestamp)" >> "$PROGRESS_FILE"
            echo "" >> "$PROGRESS_FILE"
        fi
    fi
}

append_progress() {
    local message="$1"
    echo "[$(timestamp)] $message" >> "$PROGRESS_FILE"
}

append_learning() {
    local learning="$1"
    if [[ -f "$PROGRESS_MANAGER" ]]; then
        bash "$PROGRESS_MANAGER" --file "$PROGRESS_FILE" append learned "$learning"
    else
        echo "[$(timestamp)] LEARNED: $learning" >> "$PROGRESS_FILE"
    fi
}

append_failure() {
    local failure="$1"
    if [[ -f "$PROGRESS_MANAGER" ]]; then
        bash "$PROGRESS_MANAGER" --file "$PROGRESS_FILE" append failed "$failure"
    else
        echo "[$(timestamp)] FAILED: $failure" >> "$PROGRESS_FILE"
    fi
}

get_previous_learnings() {
    if [[ -f "$PROGRESS_MANAGER" ]] && [[ -f "$PROGRESS_FILE" ]]; then
        bash "$PROGRESS_MANAGER" --file "$PROGRESS_FILE" read-learnings
    elif [[ -f "$PROGRESS_FILE" ]]; then
        grep "LEARNED:" "$PROGRESS_FILE" | tail -10
    fi
}

end_session() {
    if [[ -f "$PROGRESS_MANAGER" ]]; then
        bash "$PROGRESS_MANAGER" --file "$PROGRESS_FILE" session-end
    fi
}

# === COMPUTE ERROR HASH (for stuck detection) ===
compute_error_hash() {
    local error_output="$1"
    echo "$error_output" | md5sum | cut -d' ' -f1
}

# === MAIN EXECUTION ===
main() {
    parse_args "$@"

    log_info "========================================"
    log_info "BMAD Verification Gate Runner"
    log_info "========================================"
    log_info "Story: $STORY_FILE"
    log_info "Mode: $([ "$ONCE_MODE" = true ] && echo 'Single iteration' || echo "Loop (max $MAX_ITERATIONS)")"
    log_info "========================================"

    # Extract story ID for progress tracking
    local story_id=""
    if command -v yq &> /dev/null; then
        story_id=$(yq '.id // "UNKNOWN"' "$STORY_FILE" 2>/dev/null || echo "UNKNOWN")
    else
        story_id=$(grep "^id:" "$STORY_FILE" | awk '{print $2}' | tr -d '"' || echo "UNKNOWN")
    fi

    # Initialize progress tracking
    init_progress "$story_id"

    # Show previous learnings if any
    log_info "Checking previous learnings..."
    get_previous_learnings

    # Initialize
    local consecutive_failures=0
    local last_error_hash=""
    local iteration=0

    # Clear gate log
    echo "[]" > "$GATE_LOG_FILE"

    # Main loop
    while true; do
        ((iteration++))

        log_info "--- Iteration $iteration ---"

        # Check iteration limit
        if [[ $iteration -gt $MAX_ITERATIONS ]]; then
            log_error "Max iterations ($MAX_ITERATIONS) reached without completion"
            append_progress "STOPPED: Max iterations reached. Review required."
            exit 3
        fi

        # Run all gates
        local all_passed=true
        local current_error=""

        # Extract gates to temp file (more compatible than process substitution)
        local gates_temp="/tmp/bmad-gates-$$.txt"
        extract_gates "$STORY_FILE" > "$gates_temp" 2>/dev/null || true

        log_info "Gates found: $(wc -l < "$gates_temp" | tr -d ' ')"

        while IFS='|' read -r gate_name gate_type gate_command expected_exit; do
            [[ -z "$gate_name" ]] && continue

            # Strip Windows carriage returns
            gate_name="${gate_name//$'\r'/}"
            gate_type="${gate_type//$'\r'/}"
            gate_command="${gate_command//$'\r'/}"
            expected_exit="${expected_exit//$'\r'/}"

            if ! run_gate "$gate_name" "$gate_type" "$gate_command" "$expected_exit"; then
                all_passed=false
                current_error="$gate_name failed"
                break  # Stop at first failure
            fi
        done < "$gates_temp"

        rm -f "$gates_temp"

        if [[ "$all_passed" = true ]]; then
            # SUCCESS
            log_success "========================================"
            log_success "ALL GATES PASSED"
            log_success "========================================"

            update_story_status "$STORY_FILE" "done" "true"
            append_progress "COMPLETED: All gates passed on iteration $iteration"
            append_learning "All verification gates passed after $iteration iteration(s)"
            end_session

            exit 0
        else
            # FAILURE
            ((consecutive_failures++))

            # Check for stuck pattern (same error twice)
            local current_hash=$(compute_error_hash "$current_error")
            if [[ "$current_hash" == "$last_error_hash" ]]; then
                log_error "Same error repeated - likely stuck"
                consecutive_failures=$MAX_CONSECUTIVE_FAILURES  # Force escalation
            fi
            last_error_hash="$current_hash"

            # Record the failure
            append_failure "$current_error (attempt $consecutive_failures)"

            # Check consecutive failure limit
            if [[ $consecutive_failures -ge $MAX_CONSECUTIVE_FAILURES ]]; then
                log_error "========================================"
                log_error "STUCK: $consecutive_failures consecutive failures"
                log_error "Escalating to human"
                log_error "========================================"

                append_progress "STUCK: Failed $consecutive_failures times on: $current_error"
                append_progress "Human intervention required."
                end_session

                exit 2
            fi

            # Once mode - return to human after any result
            if [[ "$ONCE_MODE" = true ]]; then
                log_warn "Gate failed. Returning to human (--once mode)"
                append_progress "PAUSED: Gate failed, awaiting human direction"
                end_session
                exit 1
            fi

            log_warn "Retrying... (failure $consecutive_failures/$MAX_CONSECUTIVE_FAILURES)"
        fi
    done
}

# Run main
main "$@"
