#!/usr/bin/env bash

# Ucai SessionStart Hook
# Injects project CLAUDE.md context at session start
# Only adds context if a CLAUDE.md exists in the project

CLAUDE_MD=""

# Check for CLAUDE.md in current directory
if [[ -f "CLAUDE.md" ]]; then
  CLAUDE_MD=$(cat "CLAUDE.md")
fi

# If no CLAUDE.md found, provide minimal context
if [[ -z "$CLAUDE_MD" ]]; then
  cat << 'EOF'
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "Ucai plugin is active. Use /init to analyze this project and generate a CLAUDE.md, /build to develop features, /iterate for autonomous iteration, or /review for code review."
  }
}
EOF
  exit 0
fi

# Escape the CLAUDE.md content for JSON
ESCAPED=$(python3 -c "
import sys, json
content = sys.stdin.read()
print(json.dumps(content))
" <<< "$CLAUDE_MD")

# Remove surrounding quotes from json.dumps output
ESCAPED="${ESCAPED:1:-1}"

# Output with project context
cat << EOF
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "Ucai plugin is active. Project guidelines from CLAUDE.md:\\n\\n${ESCAPED}"
  }
}
EOF

exit 0
