# Ucai — Use Claude Code As Is

## Overview
A Claude Code plugin that uses the tool's native architecture — commands, agents, hooks, and skills — exactly as Anthropic designed them. Not a framework.

## Tech Stack
- **Runtime**: Node.js (CommonJS, no external dependencies)
- **Plugin format**: Markdown (YAML frontmatter) + JSON configs
- **Platform**: Cross-platform (Windows/Linux/macOS), tested on Node 18 and 20

## Project Structure
```
ucai/
├── commands/          # Slash commands (markdown + YAML frontmatter)
├── agents/            # Subagents (markdown with model/tools/description)
├── hooks/             # Lifecycle handlers (hooks.json + Node.js scripts)
│   └── handlers/      # Hook handler scripts
├── scripts/           # Utility scripts (Node.js)
├── skills/            # Progressive disclosure (SKILL.md + references/)
├── .claude-plugin/    # Plugin install metadata
└── .github/           # Issue templates, PR template, CI workflow
```

## Commands
- `/init` — Analyze project, generate CLAUDE.md. Uses project.md as context if available.
- `/plan` — Project spec (no args) or feature FRD (with args). Outputs to `.claude/project.md` + `.claude/requirements.md` or `.claude/frds/<slug>.md`
- `/build` — Feature development: explore → design → approve → implement → review → manual test.
- `/debug` — Structured debugging: investigate → diagnose → fix → verify. Parallel agents.
- `/docs` — Generate/update documentation from codebase + spec files.
- `/release` — Changelog generation, version bump, git tag. Cross-references requirements.md.
- `/iterate` — Controlled autonomous iteration via Stop hooks
- `/review` — Multi-agent parallel code review
- `/cancel-iterate` — Stop an active iterate loop

## Development
- **Dev mode**: `claude --plugin-dir ./ucai`
- **Install from marketplace**: `/plugin marketplace add Joncik91/ucai`
- **No build step**: Pure runtime plugin, no compilation
- **No test suite**: Manual testing via dev mode
- **No linter/formatter**: No ESLint or Prettier configured

## CI Validation
All checks run via `.github/workflows/ci.yml` (ubuntu + windows × node 18 + 20):
```bash
# Validate required files exist
for file in plugin.json .claude-plugin/marketplace.json hooks/hooks.json CLAUDE.md README.md; do
  [ -f "$file" ] || exit 1; done

# Validate JSON syntax
node -e "JSON.parse(require('fs').readFileSync('plugin.json', 'utf8'))"
node -e "JSON.parse(require('fs').readFileSync('hooks/hooks.json', 'utf8'))"

# Syntax-check all JS files
node -c hooks/handlers/sessionstart-handler.js
node -c hooks/handlers/pretooluse-guard.js
node -c hooks/handlers/stop-handler.js
node -c scripts/setup-iterate.js

# Validate frontmatter presence in commands and agents
head -1 commands/*.md | grep -q "^---"
head -1 agents/*.md | grep -q "^---"

# Smoke test: handler produces valid JSON with correct shape
output=$(node hooks/handlers/sessionstart-handler.js)
node -e "const o=JSON.parse(process.argv[1]); if(!o.hookSpecificOutput) process.exit(1)" "$output"
```

## Architecture Patterns

### Commands orchestrate, agents execute
Commands define phased workflows with approval gates. Agents are read-only workers spawned in parallel via the Task tool. Implementation (Write/Edit) happens only in commands, after user approval.

### Hook conventions
- **SessionStart**: `sessionstart-handler.js` injects git branch, iterate status, CLAUDE.md presence, spec file status, available skills
- **PreToolUse**: `pretooluse-guard.js` guards plugin config files (Write/Edit matcher)
- **Stop**: `stop-handler.js` for iteration control
- **Paths**: Always use `${CLAUDE_PLUGIN_ROOT}` with quotes for Windows compatibility

### Skill awareness
- Commands include a "Skill Awareness" section that instructs Claude to check SessionStart context for available skills
- SessionStart hook scans both plugin skills (`skills/*/SKILL.md`) and project skills (`.claude/skills/*/SKILL.md`)
- Skills announced as `[plugin] name (desc)` or `[project] name (desc)` — Claude decides which to load
- Project-level skills follow the same structure as plugin skills: `SKILL.md` with YAML frontmatter + optional `references/`

### Context chain
- `/plan` (no args) produces `.claude/project.md` + `.claude/requirements.md` (with build order)
- `/plan <feature>` produces `.claude/frds/<slug>.md` (per-feature, never overwritten, optional)
- All commands auto-load whatever spec files exist in `.claude/`
- `/build` reads build order to identify step dependencies and marks covered requirements done
- SessionStart hook announces project name, progress (N/M done), and next build order step
- Legacy `.claude/prd.md` and `.claude/prds/` still detected as fallback

### State management
- Local state files: `.claude/*.local.md` (gitignored)
- Permanent spec files: `.claude/project.md`, `.claude/requirements.md`, `.claude/frds/*.md` (tracked in git)
- YAML frontmatter for structured fields, markdown body for content
- Parsed with regex (`/^---\r?\n([\s\S]*?)\r?\n---/`) — use `\r?` for Windows CRLF compatibility

## Conventions

### JavaScript
- No semicolons (ASI style) — **exception**: `stop-handler.js` and `pretooluse-guard.js` have them; follow file-local style
- Double quotes for strings
- `camelCase` variables/functions, `SCREAMING_SNAKE_CASE` constants
- Shebang (`#!/usr/bin/env node`) on executable scripts
- Empty catch blocks for cleanup operations
- No external dependencies — Node.js builtins only (`fs`, `path`, `readline`, `child_process`)
- Hook scripts use `process.stdout.write()` for JSON output, `console.error()` for logging (never `console.log()` in hooks)
- Stdin accumulation pattern in all handlers: `process.stdin.on("data"/"end")`
- Cross-platform paths: always `path.resolve()`/`path.join()`, never string concatenation
- Windows path normalization: `.replace(/\\/g, "/")` and case-insensitive comparison via `process.platform === "win32"`

### Markdown (commands/agents/skills)
- YAML frontmatter with type-specific fields
- Commands: `description`, `argument-hint`, `allowed-tools`
- Agents: `name`, `description`, `tools`, `model`, `color`
- Skills: `name`, `description`
- Phased workflows use `## Phase N: Name` headers with `**Goal**:` and `**Actions**:` sub-sections
- Approval gates stated explicitly in bold/caps

### File naming
- All files: `kebab-case`
- Commands/agents/skills: `.md`
- Scripts/handlers: `.js`

### Agent design
- Model assignments: haiku (project-scanner), sonnet (explorer, reviewer, verifier), opus (architect)
- Read-only tools only (no Write/Edit)
- Color-coded: yellow (scanner), cyan (explorer), green (architect), red (reviewer), blue (verifier)
- Explorer agents support 3 thoroughness levels: **quick** (~8 calls, max_turns: 12), **medium** (~15 calls, max_turns: 20), **thorough** (~25 calls, max_turns: 30)
- Commands specify level + max_turns when spawning explorers; prefix agent prompt with "Level: <level>"

## Principles
1. Use native systems — commands, agents, hooks, skills. Not wrappers.
2. Context is a public good — only add what Claude doesn't already know.
3. Agents are not personas — they have model assignments, tool declarations, and focused missions.
4. Explicit approval gates — never proceed without user decision at boundaries.
5. Parallel by default — spawn multiple focused agents simultaneously.
6. CLAUDE.md is for project guidelines — not framework configuration.

## Key Files
- `plugin.json` — Plugin manifest
- `.claude-plugin/marketplace.json` — Marketplace listing metadata
- `hooks/hooks.json` — Hook configuration
- `hooks/handlers/sessionstart-handler.js` — Session context injection (most complex handler)
- `hooks/handlers/stop-handler.js` — Iteration control logic
- `hooks/handlers/pretooluse-guard.js` — Config file protection hook
- `scripts/setup-iterate.js` — Iterate loop setup
- `commands/build.md` — Most complex command (8-phase workflow)
- `skills/ucai-patterns/SKILL.md` — Best practices skill
- `.github/workflows/ci.yml` — CI validation pipeline
