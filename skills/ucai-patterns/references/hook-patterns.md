# Hook Patterns

## What Hooks Are

Hooks are lifecycle event handlers that run external scripts (bash/python) at key points during a Claude Code session. They are the primary way to extend and control behavior without modifying prompts.

## Hook Events

| Event | When | Use For |
|-------|------|---------|
| `SessionStart` | Session begins | Inject project context |
| `PreToolUse` | Before a tool runs | Guardrails, validation |
| `PostToolUse` | After a tool runs | Logging, verification |
| `Stop` | Claude tries to exit | Iteration control |
| `UserPromptSubmit` | User sends input | Input processing |

## Configuration

Hooks are defined in `hooks.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "python3 ${CLAUDE_PLUGIN_ROOT}/hooks/handler.py",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

Key fields:
- **matcher**: Regex to filter which tools trigger the hook
- **type**: `command` (run script) or `prompt` (ask Claude)
- **command**: Script to execute (use `${CLAUDE_PLUGIN_ROOT}` for plugin-relative paths)
- **timeout**: Seconds before hook times out

## Exit Codes

- **0**: Hook ran successfully, operation continues
- **1**: Error — show stderr to user only
- **2**: Block the operation — show stderr to Claude

## Pattern: Session Context Injection

Inject project-specific context at session start:

```bash
#!/usr/bin/env bash
cat << 'EOF'
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "Your project-specific context here..."
  }
}
EOF
exit 0
```

This replaces the need for prompting ceremonies. Every session starts with the right context automatically.

## Pattern: Iteration Control (Stop Hook)

Block exit and feed the task back for another iteration:

```bash
#!/bin/bash
# Read state file, check completion criteria
# If not done:
jq -n \
  --arg prompt "$TASK" \
  --arg msg "Iteration $N" \
  '{"decision": "block", "reason": $prompt, "systemMessage": $msg}'
```

The Stop hook output format:
- `decision: "block"` — prevents exit
- `reason` — the prompt fed back to Claude
- `systemMessage` — context shown to Claude about the iteration

This is the native version of Ralph loops. No bash wrapper needed.

## Pattern: Write Guardrails (PreToolUse)

Prevent writes to sensitive files:

```json
{
  "matcher": "Write|Edit",
  "hooks": [{
    "type": "command",
    "command": "python3 ${CLAUDE_PLUGIN_ROOT}/hooks/check-sensitive-files.py"
  }]
}
```

The handler checks the file path and exits with code 2 to block writes to `.env`, credentials, or other sensitive files.

## Hooks vs. CLAUDE.md

Use **CLAUDE.md** for: project facts, conventions, architecture decisions — information that helps Claude write better code.

Use **hooks** for: behavioral control, guardrails, automation, context injection — things that need to happen reliably regardless of what's in context.

Hooks are deterministic. CLAUDE.md is guidance. For anything that MUST happen, use hooks.
