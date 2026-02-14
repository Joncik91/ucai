#!/bin/bash

# Ucai Iterate Setup Script
# Creates state file for the /iterate loop

set -euo pipefail

# Parse arguments
PROMPT_PARTS=()
MAX_ITERATIONS=0
COMPLETION_PROMISE="null"

while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--help)
      cat << 'HELP_EOF'
Ucai Iterate - Controlled autonomous iteration

USAGE:
  /iterate [TASK...] [OPTIONS]

ARGUMENTS:
  TASK...    Description of what to accomplish (can be multiple words)

OPTIONS:
  --max-iterations <n>           Maximum iterations before auto-stop (default: unlimited)
  --completion-promise '<text>'  Promise phrase that signals genuine completion
  -h, --help                     Show this help message

DESCRIPTION:
  Starts a controlled iteration loop using the native Stop hook.
  Each iteration sees your previous work in files and git history.
  The loop continues until the task is genuinely complete.

EXAMPLES:
  /iterate Build a REST API for user management --completion-promise 'All endpoints working and tested' --max-iterations 15
  /iterate Fix the authentication bug --max-iterations 5
  /iterate Refactor the database layer --completion-promise 'All tests passing'

STOPPING:
  - Reaches --max-iterations
  - You output <promise>YOUR_PHRASE</promise> when genuinely true
  - Use /cancel-iterate to stop manually
HELP_EOF
      exit 0
      ;;
    --max-iterations)
      if [[ -z "${2:-}" ]] || ! [[ "$2" =~ ^[0-9]+$ ]]; then
        echo "Error: --max-iterations requires a positive integer" >&2
        exit 1
      fi
      MAX_ITERATIONS="$2"
      shift 2
      ;;
    --completion-promise)
      if [[ -z "${2:-}" ]]; then
        echo "Error: --completion-promise requires a text argument" >&2
        exit 1
      fi
      COMPLETION_PROMISE="$2"
      shift 2
      ;;
    *)
      PROMPT_PARTS+=("$1")
      shift
      ;;
  esac
done

PROMPT="${PROMPT_PARTS[*]}"

if [[ -z "$PROMPT" ]]; then
  echo "Error: No task provided. Usage: /iterate <task> [--max-iterations N] [--completion-promise TEXT]" >&2
  exit 1
fi

# Create state file
mkdir -p .claude

if [[ -n "$COMPLETION_PROMISE" ]] && [[ "$COMPLETION_PROMISE" != "null" ]]; then
  COMPLETION_PROMISE_YAML="\"$COMPLETION_PROMISE\""
else
  COMPLETION_PROMISE_YAML="null"
fi

cat > .claude/ucai-iterate.local.md <<EOF
---
active: true
iteration: 1
max_iterations: $MAX_ITERATIONS
completion_promise: $COMPLETION_PROMISE_YAML
started_at: "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
---

$PROMPT
EOF

# Output setup confirmation
cat <<EOF
Ucai iterate loop activated.

Task: $PROMPT
Iteration: 1
Max iterations: $(if [[ $MAX_ITERATIONS -gt 0 ]]; then echo $MAX_ITERATIONS; else echo "unlimited"; fi)
Completion promise: $(if [[ "$COMPLETION_PROMISE" != "null" ]]; then echo "$COMPLETION_PROMISE"; else echo "none (use --max-iterations to limit)"; fi)

The Stop hook will feed this task back after each iteration.
Your previous work is visible in files and git history.
EOF

if [[ "$COMPLETION_PROMISE" != "null" ]]; then
  echo ""
  echo "To complete: output <promise>$COMPLETION_PROMISE</promise>"
  echo "ONLY when the statement is genuinely true."
fi
