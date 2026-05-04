# Ucai — Use Claude Code As Is

## Overview
A Claude Code plugin that leverages native architecture — commands, agents, hooks,
and skills — exactly as Anthropic designed them. v2.3 adds discipline layers on
top of v2.2's enforcement engine: pre-flight requirement audits before code is
written, per-issue failure-mode analysis on every review, design-pivot clauses,
and strict author/reviewer separation for tests with anti-gaming verdicts
aligned with the [Pragma](https://github.com/Joncik91/pragma) detector. v2.2
added the never-forget enforcement engine — programmatic phase enforcement via
ContingencyEngine with dependencies, logic gates, shadow tasks, and audit trail.
v2.0 added autonomous execution — `/ship` (zero-gate spec-to-PR pipeline),
`/bootstrap` (infrastructure scaffolding), PostToolUse auto-formatting,
deterministic test execution, and lessons consolidation. Built on the Cherny
methodology: persistent task tracking, self-improvement loop, TDD integration,
and elegance checkpoints.

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
node -e "JSON.parse(require('fs').readFileSync('.claude-plugin/plugin.json', 'utf8'))"
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
- **scripts/** — Utilities: `setup-iterate.js`, `setup-ship.js`, `detect-infra.js`, `run-tests.js`, `consolidate-lessons.js`.
- **scripts/lib/never-forget/** — Vendored never-forget engine (ESM, zero deps): dependency validation, logic gates, shadow tasks, audit trail.

### Commands (12 slash commands)
`/init`, `/plan`, `/build` (8-phase, guided), `/ship` (9-phase, autonomous), `/bootstrap`,
`/debug`, `/review`, `/docs`, `/release`, `/iterate`, `/cancel-iterate`, `/cancel-ship`

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

### Hooks (8 lifecycle handlers, all in `hooks/handlers/`)
| Hook | Handler | Purpose |
|------|---------|---------|
| SessionStart | `sessionstart-handler.js` | Git branch, iterate/ship status, task progress, lessons, specs, skills |
| PostToolUse (Write\|Edit) | `posttooluse-format-handler.js` | Auto-format files after write/edit operations |
| PreToolUse (Write\|Edit) | `pretooluse-guard.js` | Guard config files (ask before modifying) |
| UserPromptSubmit | `userpromptsubmit-handler.js` | Inject iterate/ship context + active task from todo.md |
| Stop | `stop-handler.js` | Block exit to continue iterate loop or ship pipeline |
| SubagentStop | `subagent-stop-handler.js` | Block on empty output; inject 1-line preview |
| PreCompact | `precompact-handler.js` | Surface iterate/ship state, task progress, latest lesson before compaction |
| SessionEnd | `session-end-handler.js` | Delete stale iterate/ship state + formatter cache on termination |

### Iterate Loop
State file: `.claude/ucai-iterate.local.md` (gitignored). YAML frontmatter holds
`iteration`, `max_iterations`, `completion_promise`; body holds the task.
Stop hook reads state → feeds task back → checks limits → continues or exits.

### Ship Pipeline
State file: `.claude/ucai-ship.local.md` (gitignored). YAML frontmatter holds
`phase`, `milestone`, `fix_attempts`, `max_fix_attempts`, `test_cmd`, `lint_cmd`,
`format_cmd`, `spec_source`, `worktree`, `no_pr`, `ci_watch`; body holds the spec.
Stop hook reads state → feeds phase-aware continuation → resumes pipeline.
Priority: iterate > ship > normal exit.

### Context Chain
- `/plan` → `.claude/project.md` + `.claude/requirements.md` (with build order)
- `/plan <feature>` → `.claude/frds/<slug>.md` (never overwritten)
- `/build`, `/debug` → `tasks/todo.md` (overwritten per session), `tasks/lessons.md` (append-only)
- `/ship` → `.claude/ucai-ship.local.md` (pipeline state), uses same context chain as `/build`
- All commands auto-load whatever spec files exist in `.claude/`
- `/build`, `/debug`, `/review`, `/docs`, `/ship` load `tasks/lessons.md` for known patterns
- SessionStart announces `[plugin]` and `[project]` skills; Claude decides which to load
- Formatter cache: `.claude/ucai-formatter-cache.local.json` (session-scoped, cleaned on SessionEnd)
- Engine state: `.claude/ucai-{build|ship}-engine.local.json` (session-scoped, cleaned on SessionEnd)

### Config Protection
PreToolUse guards: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`,
`hooks/hooks.json`, `CLAUDE.md`, and all skill `.md` files. Emits `permissionDecision: "ask"`.

### Engine Enforcement (never-forget integration)
Both `/build` and `/ship` use a `ContingencyEngine` for programmatic phase enforcement:
- **Dependencies**: Track prerequisites (specs loaded, code implemented, tests passing)
- **Logic gates**: Block phase transitions until dependencies are met (`neq complete` → block)
- **Shadow tasks**: Auto-generated reactions ensure every dependency is addressed per task
- **Audit trail**: Observer events log gate passes/blocks, state transitions, missed reactions
- State persisted in `.claude/ucai-{build|ship}-engine.local.json` (session-scoped, cleaned on SessionEnd)
- Engine scripts: `engine-factory.js` (create/load/save), `engine-gates.js` (evaluate), `update-engine.js` (update state)
- Hooks read engine JSON (read-only) for status injection; commands call scripts for gate checks and state updates
- Backward compatible: if engine JSON is missing, commands and hooks fall back to existing behavior

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
| `.claude-plugin/plugin.json` | Plugin manifest (name, version 2.3.1, keywords) |
| `hooks/hooks.json` | Hook registration (8 events, timeouts, matchers) |
| `hooks/handlers/sessionstart-handler.js` | Most complex handler (7.8 KB): git, iterate, skills |
| `hooks/handlers/stop-handler.js` | Iteration control (5.4 KB) |
| `hooks/handlers/pretooluse-guard.js` | Config file protection (permissionDecision: ask) |
| `scripts/setup-iterate.js` | Iterate setup: parses `--max-iterations`, `--completion-promise` |
| `scripts/setup-ship.js` | Ship setup: parses `--max-fix-attempts`, `--no-worktree`, `--ci-watch` |
| `scripts/detect-infra.js` | Detect test/lint/format/CI commands from project files |
| `scripts/run-tests.js` | Deterministic test runner, outputs JSON with pass/fail + summary |
| `scripts/consolidate-lessons.js` | Consolidate lessons.md when >100 entries |
| `scripts/engine-factory.js` | ContingencyEngine create/load/save/delete + readEngineStatus |
| `scripts/engine-gates.js` | CLI: evaluate logic gates for a target task |
| `scripts/update-engine.js` | CLI: update dependency/task state with proof |
| `scripts/setup-build-engine.js` | Create build engine with 17 deps, 8 tasks, 11 gates |
| `scripts/setup-ship-engine.js` | Create ship engine with 13 deps, 9 tasks, 7 gates |
| `scripts/lib/never-forget/` | Vendored never-forget dist (ESM, imported via dynamic import) |
| `hooks/handlers/posttooluse-format-handler.js` | Auto-format after Write/Edit (caches detection) |
| `commands/build.md` | Most complex command: 8-phase feature workflow |
| `.github/workflows/ci.yml` | CI: file exist + JSON syntax + JS syntax + smoke test |
| `skills/ucai-patterns/SKILL.md` | Best practices for Claude Code plugin development |
