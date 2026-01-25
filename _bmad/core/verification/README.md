# BMAD Verification Gate System

> **"An agent CANNOT mark a task done. Only passing gates can."**

This system prevents fake deliverables by requiring automated verification before any task can be marked complete.

## The Problem

AI agents tend to mark tasks as "complete" without proper verification. This leads to:
- Code that doesn't compile
- Tests that don't pass
- Features that don't work
- Wasted time reviewing broken deliverables

## The Solution

**Verification Gates** - automated checks that MUST pass before status can change to "done".

```
Agent claims "Done" → Gates Run → ALL PASS? → Status: done
                               → ANY FAIL? → Status: in_progress (retry)
```

## Quick Start

### 1. Copy Configuration to Project

```bash
cp _bmad/core/verification/bmad-gates.template.yaml .bmad-gates.yaml
```

### 2. Install Pre-Commit Hook

```bash
cp _bmad/core/verification/hooks/pre-commit-verify .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

### 3. Copy CI Workflow

```bash
mkdir -p .github/workflows
cp _bmad/core/verification/ci/bmad-verification.yaml .github/workflows/
```

### 4. Add Gates to Your Stories

Use the template:
```bash
cp _bmad/core/verification/story-template.yaml _bmad-output/stories/US-001.yaml
```

## Usage

### Run Gates Manually

```bash
# Single iteration (human-in-loop)
bash _bmad/core/verification/gate-runner.sh --story path/to/story.yaml --once

# Autonomous loop (max 10 iterations)
bash _bmad/core/verification/gate-runner.sh --story path/to/story.yaml --max-iterations 10
```

### Gate Types

| Type | Purpose | Example |
|------|---------|---------|
| `command` | Run shell command, check exit code | `npm test` |
| `playwright` | Browser verification via MCP | Navigate, check element |
| `file_check` | Verify file exists/content | Component file created |

### Story File Structure

```yaml
id: US-001
title: "Add Delete Button"
status: pending  # Only gate-runner can set to "done"

verification:
  all_gates_passed: false  # Machine-controlled
  gates:
    - name: "TypeScript Compiles"
      type: command
      command: "npm run type-check"
      expected_exit: 0

    - name: "Tests Pass"
      type: command
      command: "npm test"
      expected_exit: 0
```

## Enforcement Layers

### Layer 1: Pre-Commit Hook (Local)
- Blocks commits where status="done" but gates haven't passed
- Immediate feedback
- Can be bypassed with `--no-verify` (leaves audit trail)

### Layer 2: CI Workflow (Remote)
- Runs on every PR
- Cannot be bypassed
- Blocks merge if verification fails

### Layer 3: Status Lock
- `status: done` can only be written by gate-runner
- Agent instructions prohibit manual status changes
- Git blame shows who changed status

## Loop Controls

```yaml
loop_controls:
  max_iterations: 10           # Hard stop
  max_consecutive_failures: 3  # Escalate when stuck
  detect_stuck_pattern: true   # Same error twice = stuck
```

## Files

```
_bmad/core/verification/
├── gate-runner.sh              # Main execution script
├── gate-types/
│   ├── command.yaml            # Shell command gates
│   ├── playwright.yaml         # Browser verification
│   └── file-check.yaml         # File existence/content
├── hooks/
│   └── pre-commit-verify       # Git hook
├── ci/
│   └── bmad-verification.yaml  # GitHub Actions workflow
├── story-template.yaml         # Story file template
├── bmad-gates.template.yaml    # Project config template
└── README.md                   # This file
```

## Philosophy

Based on the "Ralph Wiggum" technique by Jeffrey Huntley:
- Small atomic tasks
- Automated verification (not self-assessment)
- Loop until verified complete
- Escalate when stuck (don't burn tokens)

Reference: https://ghuntley.com/ralph/

## Credits

Inspired by:
- Matt Pocock's video on Ralph Wiggum technique
- Anthropic's "Effective Harnesses for Long-Running Agents"
- BMAD Method workflow patterns
