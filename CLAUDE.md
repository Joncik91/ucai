# Ucai — Use Claude Code As Is

## Overview
A Claude Code plugin that uses the tool's native architecture — commands, agents, hooks, and skills — exactly as Anthropic designed them. Not a framework.

## Tech Stack
- **Runtime**: Node.js (CommonJS, no external dependencies)
- **Plugin format**: Markdown (YAML frontmatter) + JSON configs
- **Platform**: Cross-platform (Windows/Linux/macOS)

## Project Structure
```
ucai/
├── commands/          # Slash commands (markdown + YAML frontmatter)
├── agents/            # Subagents (markdown with model/tools/description)
├── hooks/             # Lifecycle handlers (hooks.json + Node.js scripts)
│   └── handlers/      # Hook handler scripts
├── scripts/           # Utility scripts (Node.js)
├── skills/            # Progressive disclosure (SKILL.md + references/)
└── .claude-plugin/    # Plugin install metadata
```

## Commands
- `/init` — Analyze project, generate CLAUDE.md
- `/build` — Feature development: explore → design → approve → implement → review
- `/iterate` — Controlled autonomous iteration via Stop hooks
- `/review` — Multi-agent parallel code review
- `/cancel-iterate` — Stop an active iterate loop

## Development
- **Dev mode**: `claude --plugin-dir ./ucai`
- **Install from marketplace**: `/plugin marketplace add Joncik91/ucai`
- **No build step**: Pure runtime plugin, no compilation
- **No test suite**: Manual testing via dev mode
- **No linter/formatter**: No ESLint or Prettier configured

## Architecture Patterns

### Commands orchestrate, agents execute
Commands define phased workflows with approval gates. Agents are read-only workers spawned in parallel via the Task tool. Implementation (Write/Edit) happens only in commands, after user approval.

### Hook conventions
- **SessionStart**: Inline `echo` for simple context injection
- **Stop**: External Node.js script (`stop-handler.js`) for iteration control
- **Paths**: Always use `${CLAUDE_PLUGIN_ROOT}` with quotes for Windows compatibility

### State management
- Local state files: `.claude/*.local.md` (gitignored)
- YAML frontmatter for structured fields, markdown body for content
- Parsed with regex (`/^---\n([\s\S]*?)\n---\n([\s\S]*)$/`)

## Conventions

### JavaScript
- No semicolons (ASI style)
- Double quotes for strings
- `camelCase` variables/functions, `SCREAMING_SNAKE_CASE` constants
- Shebang (`#!/usr/bin/env node`) on executable scripts
- Empty catch blocks for cleanup operations
- No external dependencies — Node.js builtins only (`fs`, `readline`, `path`)

### Markdown (commands/agents/skills)
- YAML frontmatter with type-specific fields
- Commands: `description`, `argument-hint`, `allowed-tools`
- Agents: `name`, `description`, `tools`, `model`, `color`
- Skills: `name`, `description`
- Phased workflows use `## Phase N: Name` headers
- Approval gates stated explicitly in bold/caps

### File naming
- All files: `kebab-case`
- Commands/agents/skills: `.md`
- Scripts/handlers: `.js`

### Agent design
- All agents use `sonnet` model
- Read-only tools only (no Write/Edit)
- Color-coded: yellow (scanner), cyan (explorer), green (architect), red (reviewer), blue (verifier)

## Principles
1. Use native systems — commands, agents, hooks, skills. Not wrappers.
2. Context is a public good — only add what Claude doesn't already know.
3. Agents are not personas — they have model assignments, tool declarations, and focused missions.
4. Explicit approval gates — never proceed without user decision at boundaries.
5. Parallel by default — spawn multiple focused agents simultaneously.
6. CLAUDE.md is for project guidelines — not framework configuration.

## Key Files
- `plugin.json` — Plugin manifest
- `marketplace.json` — Marketplace listing metadata
- `hooks/hooks.json` — Hook configuration
- `hooks/handlers/stop-handler.js` — Iteration control logic
- `scripts/setup-iterate.js` — Iterate loop setup
- `commands/build.md` — Most complex command (7-phase workflow)
- `skills/ucai-patterns/SKILL.md` — Best practices skill
