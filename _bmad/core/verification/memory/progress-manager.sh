#!/bin/bash
#===============================================================================
# BMAD Progress Manager
#
# Purpose: Manage progress.txt files for persistent memory across iterations
#
# Usage:
#   progress-manager.sh init <story-id> [--file <path>]
#   progress-manager.sh read [--file <path>]
#   progress-manager.sh append <section> <content> [--file <path>]
#   progress-manager.sh session-start [--file <path>]
#   progress-manager.sh session-end [--file <path>]
#   progress-manager.sh summary [--file <path>]
#===============================================================================

set -euo pipefail

# === CONFIGURATION ===
DEFAULT_PROGRESS_FILE="progress.txt"
PROGRESS_FILE="${PROGRESS_FILE:-$DEFAULT_PROGRESS_FILE}"

# === COLORS ===
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

timestamp() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }
date_only() { date -u +"%Y-%m-%d"; }

# === COMMANDS ===

cmd_init() {
    local story_id="$1"

    if [[ -f "$PROGRESS_FILE" ]]; then
        echo -e "${YELLOW}[WARN]${NC} Progress file already exists: $PROGRESS_FILE"
        echo "Use 'append' to add to existing file, or delete it first."
        return 1
    fi

    cat > "$PROGRESS_FILE" << EOF
# Progress Log: $story_id
# Started: $(timestamp)
# Last Updated: $(timestamp)

---

EOF

    echo -e "${GREEN}[OK]${NC} Initialized progress file: $PROGRESS_FILE"
}

cmd_read() {
    if [[ ! -f "$PROGRESS_FILE" ]]; then
        echo -e "${YELLOW}[WARN]${NC} No progress file found: $PROGRESS_FILE"
        return 0
    fi

    cat "$PROGRESS_FILE"
}

cmd_read_learnings() {
    # Extract only the "Learned" sections for quick context
    if [[ ! -f "$PROGRESS_FILE" ]]; then
        return 0
    fi

    echo "=== KEY LEARNINGS FROM PREVIOUS SESSIONS ==="
    echo ""
    grep -A 20 "### Learned" "$PROGRESS_FILE" | grep -E "^- " || true
    echo ""
    echo "============================================="
}

cmd_session_start() {
    if [[ ! -f "$PROGRESS_FILE" ]]; then
        echo -e "${YELLOW}[WARN]${NC} No progress file. Use 'init' first."
        return 1
    fi

    local session_count
    session_count=$(grep -c "^## Session" "$PROGRESS_FILE" 2>/dev/null) || session_count=0
    local session_num=$((session_count + 1))

    cat >> "$PROGRESS_FILE" << EOF

## Session $session_num - $(timestamp)

### Completed
- (in progress)

### Learned
- (pending)

### Failed
- (none yet)

### Next
- (to be determined)

EOF

    # Update last updated timestamp in header
    sed -i "s/^# Last Updated:.*/# Last Updated: $(timestamp)/" "$PROGRESS_FILE"

    echo -e "${GREEN}[OK]${NC} Started session $session_num"
}

cmd_append() {
    local section="$1"
    local content="$2"

    if [[ ! -f "$PROGRESS_FILE" ]]; then
        echo -e "${YELLOW}[WARN]${NC} No progress file. Use 'init' first."
        return 1
    fi

    # Validate section
    case "$section" in
        completed|learned|failed|next)
            ;;
        *)
            echo "Invalid section: $section"
            echo "Valid sections: completed, learned, failed, next"
            return 1
            ;;
    esac

    # Find the last occurrence of the section and append after it
    local section_header="### ${section^}"  # Capitalize first letter

    # Use awk to append to the last matching section
    awk -v section="$section_header" -v content="- $content" '
    {
        lines[NR] = $0
        if ($0 ~ "^" section) {
            last_section = NR
        }
    }
    END {
        for (i = 1; i <= NR; i++) {
            print lines[i]
            if (i == last_section) {
                # Find the next non-empty, non-list line after section
                j = i + 1
                while (j <= NR && (lines[j] ~ /^- / || lines[j] ~ /^$/)) {
                    j++
                }
                # Insert before that line (after last list item)
                if (j > i + 1) {
                    # There are existing items, we already printed them
                } else {
                    print content
                }
            }
        }
    }
    ' "$PROGRESS_FILE" > "${PROGRESS_FILE}.tmp" && mv "${PROGRESS_FILE}.tmp" "$PROGRESS_FILE"

    # Simpler approach: just append at the end of the file with section marker
    echo "[$section] $content" >> "${PROGRESS_FILE}.append"

    # Update timestamp
    sed -i "s/^# Last Updated:.*/# Last Updated: $(timestamp)/" "$PROGRESS_FILE"

    echo -e "${GREEN}[OK]${NC} Appended to $section"
}

cmd_session_end() {
    if [[ ! -f "$PROGRESS_FILE" ]]; then
        return 0
    fi

    # Update timestamp
    sed -i "s/^# Last Updated:.*/# Last Updated: $(timestamp)/" "$PROGRESS_FILE"

    echo -e "${GREEN}[OK]${NC} Session ended, timestamp updated"
}

cmd_summary() {
    if [[ ! -f "$PROGRESS_FILE" ]]; then
        echo "No progress file found."
        return 0
    fi

    echo "=== PROGRESS SUMMARY ==="
    echo ""
    echo "File: $PROGRESS_FILE"
    echo "Sessions: $(grep -c "^## Session" "$PROGRESS_FILE" 2>/dev/null || echo "0")"
    echo ""

    echo "--- Completed Items ---"
    grep -A 1 "### Completed" "$PROGRESS_FILE" | grep "^- " | grep -v "in progress" | head -10 || echo "(none)"
    echo ""

    echo "--- Key Learnings ---"
    grep -A 5 "### Learned" "$PROGRESS_FILE" | grep "^- " | grep -v "pending" | head -10 || echo "(none)"
    echo ""

    echo "--- Known Failures ---"
    grep -A 3 "### Failed" "$PROGRESS_FILE" | grep "^- " | grep -v "none" | head -5 || echo "(none)"
    echo ""

    echo "--- Next Steps ---"
    grep -A 3 "### Next" "$PROGRESS_FILE" | grep "^- " | grep -v "to be determined" | tail -5 || echo "(none)"
    echo ""
    echo "========================"
}

cmd_for_agent() {
    # Generate a concise context block for the agent
    if [[ ! -f "$PROGRESS_FILE" ]]; then
        echo "No previous progress. This is a fresh start."
        return 0
    fi

    cat << EOF
<previous_progress>
$(cmd_summary)

IMPORTANT: Review the learnings above before starting work.
Do NOT repeat the same failures.
Build on what was completed.
</previous_progress>
EOF
}

# === MAIN ===

show_help() {
    cat << EOF
BMAD Progress Manager

Usage: progress-manager.sh <command> [args]

Commands:
  init <story-id>           Initialize a new progress file
  read                      Display the full progress file
  read-learnings            Display only learned items (quick context)
  session-start             Start a new session entry
  session-end               Close current session (update timestamp)
  append <section> <text>   Append item to section
  summary                   Show condensed summary
  for-agent                 Generate context block for agent

Sections for append:
  completed, learned, failed, next

Options:
  --file <path>             Override default progress file path

Examples:
  progress-manager.sh init US-042
  progress-manager.sh session-start
  progress-manager.sh append learned "API requires snake_case params"
  progress-manager.sh append completed "Created DeleteButton component"
  progress-manager.sh summary
EOF
}

# Parse global options
while [[ $# -gt 0 ]]; do
    case $1 in
        --file)
            PROGRESS_FILE="$2"
            shift 2
            ;;
        *)
            break
            ;;
    esac
done

COMMAND="${1:-help}"
shift || true

case "$COMMAND" in
    init)
        cmd_init "${1:-UNKNOWN}"
        ;;
    read)
        cmd_read
        ;;
    read-learnings)
        cmd_read_learnings
        ;;
    session-start)
        cmd_session_start
        ;;
    session-end)
        cmd_session_end
        ;;
    append)
        cmd_append "${1:-}" "${2:-}"
        ;;
    summary)
        cmd_summary
        ;;
    for-agent)
        cmd_for_agent
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo "Unknown command: $COMMAND"
        show_help
        exit 1
        ;;
esac
