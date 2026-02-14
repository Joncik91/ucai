# Context Management Patterns

## The Problem

Context windows are finite. Long sessions degrade. Earlier information gets lost when context fills up. The community frameworks' answer is fresh subagent spawning (GSD) or external loops (Ralph). The native answer is simpler.

## Native Solutions

### 1. SessionStart Hooks

Inject essential project context at the beginning of every session. This replaces the need for mega CLAUDE.md files.

```json
{
  "hooks": {
    "SessionStart": [{
      "hooks": [{
        "type": "command",
        "command": "${CLAUDE_PLUGIN_ROOT}/hooks/handlers/session-start.sh"
      }]
    }]
  }
}
```

The handler reads your project's CLAUDE.md and injects it as `additionalContext`. Every session starts with the right context without manual setup.

### 2. TodoWrite for Progress Tracking

TodoWrite survives context compaction. When Claude's context gets compressed, your todo list remains intact. This means each phase of work knows what's been done and what's left.

Use TodoWrite at the start of any multi-step task. Update it as you go. It's your progress ledger.

### 3. Skills with Progressive Disclosure

Three levels of loading:
1. **Metadata** (~100 words) — always in context via the `description` field
2. **SKILL.md body** (<5k words) — loaded when the skill triggers
3. **References** (unlimited) — loaded only when specifically needed

This is how Anthropic manages document processing skills that have 17k+ bytes of instructions without wasting context on sessions that don't need them.

### 4. File System State

Use `.local.md` files in `.claude/` for persistent state between iterations and sessions:
- `.claude/ucai-iterate.local.md` — iteration loop state
- Files ending in `.local.md` are git-ignored by convention

### 5. Subagent Context Isolation

Each agent spawned via the Task tool gets a fresh context window. This is the native version of what GSD does with "fresh subagent contexts." The tool already does this — you don't need a framework to manage it.

## What NOT to Do

- **Don't stuff CLAUDE.md with instructions for Claude** — it's for project facts
- **Don't repeat what Claude knows** — React conventions, Python best practices, etc. are already in training
- **Don't load everything upfront** — use progressive disclosure
- **Don't build custom state management** — use TodoWrite, .local.md files, and git
