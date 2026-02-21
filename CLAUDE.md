# Ucai — Use Claude Code As Is

## Overview
A Claude Code plugin that leverages native architecture — commands, agents, hooks,
and skills — exactly as Anthropic designed them. v1.1 delivers full hook lifecycle
coverage and a PreToolUse guard that protects plugin config files.

## Tech Stack
- **Runtime**: Node.js 18+ (CommonJS, zero external dependencies)
- **Plugin format**: Markdown (YAML frontmatter) + JSON configs
- **Platform**: Windows/Linux/macOS, CI matrix: Node 18 × 20 on ubuntu + windows

## Development Commands
No build step. Validation only:
```bash
# Local dev
claude --plugin-dir ./ucai

# JSON syntax
node -e "JSON.parse(require('fs').readFileSync('plugin.json', 'utf8'))"
node -e "JSON.parse(require('fs').readFileSync('hooks/hooks.json', 'utf8'))"
node -e "JSON.parse(require('fs').readFileSync('.claude-plugin/marketplace.json', 'utf8'))"

# JS syntax (all handlers + scripts)
for file in hooks/handlers/*.js scripts/*.js; do node -c "$file" || exit 1; done

# Smoke test
output=$(node hooks/handlers/sessionstart-handler.js)
node -e "const o=JSON.parse(process.argv[1]); if(!o.hookSpecificOutput) process.exit(1)" "$output"
```

## Architecture

### Layers
- **commands/** — Orchestration: phased workflows with user approval gates. Write/Edit only here.
- **agents/** — Execution: read-only analysis workers, spawned in parallel via Task tool.
- **hooks/handlers/** — Lifecycle: context injection, state management, config protection.
- **skills/** — Knowledge: progressive disclosure domain expertise, loaded on-demand.
- **scripts/** — Utilities: `setup-iterate.js` for iterate loop initialization.

### Commands (9 slash commands)
`/init`, `/plan`, `/build` (8-phase, most complex), `/debug`, `/review`, `/docs`,
`/release`, `/iterate`, `/cancel-iterate`

### Agents (8, all read-only — no Write/Edit)
| Agent | Model | Max Turns | Purpose |
|-------|-------|-----------|---------|
| `project-scanner` | haiku | — | Fast structure + convention analysis |
| `explorer-haiku` | haiku | 12 | Quick scan (~8 tool calls) |
| `explorer` | sonnet | 20 | Balanced analysis (~15 tool calls) |
| `explorer-opus` | opus | 30 | Deep analysis (~25 tool calls) |
| `architect` | opus | — | Feature architecture + implementation blueprint |
| `reviewer` | sonnet | — | Code review with confidence scoring |
| `reviewer-opus` | opus | — | Deep review for subtle/high-impact issues |
| `verifier` | sonnet | — | Acceptance criteria validation |

### Hooks (7 lifecycle handlers, all in `hooks/handlers/`)
| Hook | Handler | Purpose |
|------|---------|---------|
| SessionStart | `sessionstart-handler.js` | Git branch, iterate status, spec files, skills |
| PreToolUse (Write\|Edit) | `pretooluse-guard.js` | Guard config files (ask before modifying) |
| UserPromptSubmit | `userpromptsubmit-handler.js` | Inject iterate context when loop active |
| Stop | `stop-handler.js` | Block exit to continue iterate loop |
| SubagentStop | `subagent-stop-handler.js` | Block on empty output; inject 1-line preview |
| PreCompact | `precompact-handler.js` | Surface iterate state before compaction |
| SessionEnd | `session-end-handler.js` | Delete stale iterate state on termination |

### Iterate Loop
State file: `.claude/ucai-iterate.local.md` (gitignored). YAML frontmatter holds
`iteration`, `max_iterations`, `completion_promise`; body holds the task.
Stop hook reads state → feeds task back → checks limits → continues or exits.

### Context Chain
- `/plan` → `.claude/project.md` + `.claude/requirements.md` (with build order)
- `/plan <feature>` → `.claude/frds/<slug>.md` (never overwritten)
- All commands auto-load whatever spec files exist in `.claude/`
- SessionStart announces `[plugin]` and `[project]` skills; Claude decides which to load

### Config Protection
PreToolUse guards: `plugin.json`, `hooks/hooks.json`, `.claude-plugin/marketplace.json`,
`CLAUDE.md`, and all skill `.md` files. Emits `permissionDecision: "ask"`.

## Conventions

### JavaScript
- No semicolons (ASI) — **exception**: `stop-handler.js` uses them; follow file-local style
- Double quotes for all strings
- `camelCase` variables/functions, `SCREAMING_SNAKE_CASE` constants
- Hook output: `process.stdout.write(JSON.stringify(...))` — never `console.log()` in hooks
- Debug logging: `console.error()` only
- Stdin: `process.stdin.setEncoding("utf8")` → `.on("data")` → `.on("end")` + try/catch
- Paths: always `path.resolve()` / `path.join()`, never string concatenation
- Windows backslash: `.replace(/\\/g, "/")`
- CRLF-aware frontmatter regex: `\r?` (e.g. `/^---\r?\n([\s\S]*?)\r?\n---/`)
- Case-insensitive path compare: guard with `process.platform === "win32"`

### Markdown (commands / agents / skills)
- YAML frontmatter fields by type:
  - Commands: `description`, `argument-hint`, `allowed-tools`
  - Agents: `name`, `description`, `tools`, `model`, `color`
  - Skills: `name`, `description`
- Phase structure: `## Phase N: Name` → `**Goal**:` + `**Actions**:`
- Approval gates stated in **BOLD CAPS**

### File naming
All files `kebab-case`. Exception: `SKILL.md` is uppercase.

### MCP
`plugin.json` supports optional `mcpServers` field. Ucai omits it by design (no external deps).

## Key Files
| File | Purpose |
|------|---------|
| `plugin.json` | Plugin manifest (name, version 1.1.0, keywords) |
| `.claude-plugin/marketplace.json` | Marketplace listing metadata |
| `hooks/hooks.json` | Hook registration (7 events, timeouts, matchers) |
| `hooks/handlers/sessionstart-handler.js` | Most complex handler (7.8 KB): git, iterate, skills |
| `hooks/handlers/stop-handler.js` | Iteration control (5.4 KB, uses semicolons) |
| `hooks/handlers/pretooluse-guard.js` | Config file protection (permissionDecision: ask) |
| `scripts/setup-iterate.js` | Iterate setup: parses `--max-iterations`, `--completion-promise` |
| `commands/build.md` | Most complex command: 8-phase feature workflow |
| `.github/workflows/ci.yml` | CI: file exist + JSON syntax + JS syntax + smoke test |
| `skills/ucai-patterns/SKILL.md` | Best practices for Claude Code plugin development |
