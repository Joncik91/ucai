---
description: Controlled autonomous iteration using native Stop hooks
argument-hint: TASK [--max-iterations N] [--completion-promise TEXT]
allowed-tools: Bash(${CLAUDE_PLUGIN_ROOT}/scripts/setup-iterate.sh:*)
---

# Iterate Command

Execute the setup script to initialize the iteration loop:

```!
"${CLAUDE_PLUGIN_ROOT}/scripts/setup-iterate.sh" $ARGUMENTS
```

You are now in a controlled iteration loop. Work on the task described above.

## How This Works

- When you try to exit, the Stop hook feeds the SAME TASK back to you
- You see your previous work in files and git history
- Each iteration builds on the last
- The loop ends when: max iterations reached, or your completion promise is genuinely true

## Iteration Guidelines

1. **Start each iteration** by reviewing what exists (check files, git diff, test results)
2. **Identify what's incomplete or broken** from the previous iteration
3. **Make focused progress** — don't redo work that's already correct
4. **Track progress** with TodoWrite so each iteration picks up where the last left off
5. **Be honest about completion** — only claim done when it's genuinely done

CRITICAL: If a completion promise is set, you may ONLY output it when the statement is completely and unequivocally TRUE. Do not output false promises to exit the loop.
