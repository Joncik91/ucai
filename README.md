# Ucai — Use Claude Code As Is

A Claude Code plugin that solves the same problems as community frameworks (GSD, BMAD, Ralph, Agent OS) — but using the tool's native architecture instead of fighting it.

## Why

Community frameworks were built from the outside looking in. They solve real problems — context rot, lack of structure, no guardrails, no iteration control — but they do it by wrapping the tool in bash scripts, mega-prompts, and persona engineering.

Ucai was built from the inside out. We read the source code. We studied how Anthropic builds their own plugins. Every component maps 1:1 to a native Claude Code system.

| Problem | Framework Approach | Ucai (Native) Approach |
|---------|-------------------|----------------------|
| Context rot | Bash wrappers spawning fresh sessions | Task tool already gives fresh context per agent |
| No structure | Persona prompts + ceremonies | Commands with phased workflows + parallel agents |
| No guardrails | CLAUDE.md rules (hope-based) | PreToolUse hooks (deterministic) |
| No iteration | External bash loops | Stop hooks (native, built-in) |
| No onboarding | Template CLAUDE.md dumps | Agent-powered codebase analysis |

## Installation

Requires Claude Code **v1.0.33+** (`claude --version` to check).

### From marketplace (recommended)

Inside an interactive Claude Code session:

```
/plugin marketplace add Joncik91/ucai
/plugin install ucai@ucai-marketplace
```

This installs Ucai globally — available in every project, every session.

### For development/testing

```bash
claude --plugin-dir ./ucai
```

### Verify installation

After installing, all commands are namespaced under `ucai:`:

```
/ucai:init
/ucai:build
/ucai:iterate
/ucai:review
/ucai:cancel-iterate
```

Run `/help` to see them listed.

## Commands

### `/ucai:init` — Project Onboarding
Analyzes your project with parallel agents and generates a proper CLAUDE.md with actual project facts — not framework config.

```
/ucai:init
/ucai:init /path/to/project
```

### `/ucai:build` — Feature Development
7-phase workflow: Understand → Explore → Clarify → Design → Build → Verify → Done.
Uses parallel agents at explore, design, and review phases. Explicit user approval gates.

```
/ucai:build Add user authentication with JWT
/ucai:build Refactor the database layer to use connection pooling
```

### `/ucai:iterate` — Controlled Autonomous Iteration
Native Ralph-style loops using Stop hooks. No bash wrappers.

```
/ucai:iterate Build a REST API --completion-promise 'All endpoints working and tested' --max-iterations 15
/ucai:iterate Fix the auth bug --max-iterations 5
```

### `/ucai:review` — Multi-Agent Code Review
Parallel agents independently review for conventions, bugs, and security. Results validated and filtered.

```
/ucai:review
/ucai:review src/auth/
```

### `/ucai:cancel-iterate` — Stop Iterate Loop
Cancels an active iteration loop.

## Architecture

```
ucai/
├── .claude-plugin/plugin.json    # Plugin manifest
├── CLAUDE.md                     # Philosophy
├── commands/                     # Slash commands
│   ├── init.md                   # /init
│   ├── build.md                  # /build
│   ├── iterate.md                # /iterate
│   ├── review.md                 # /review
│   └── cancel-iterate.md        # /cancel-iterate
├── agents/                       # Subagents
│   ├── project-scanner.md        # Codebase analysis
│   ├── explorer.md               # Deep exploration
│   ├── architect.md              # Architecture design
│   ├── reviewer.md               # Code review
│   └── verifier.md               # Acceptance validation
├── hooks/                        # Lifecycle handlers
│   ├── hooks.json                # Hook configuration
│   └── handlers/
│       ├── session-start.sh      # Context injection
│       └── stop-handler.sh       # Iteration control
├── scripts/
│   └── setup-iterate.sh          # Iterate loop setup
└── skills/                       # Progressive disclosure
    └── ucai-patterns/
        ├── SKILL.md              # Best practices
        └── references/
            ├── context-management.md
            ├── agent-patterns.md
            └── hook-patterns.md
```

Every component is a native Claude Code system. Nothing invented.

## Principles

1. **Use native systems** — Commands, agents, hooks, skills. Not wrappers.
2. **Context is a public good** — Only add what Claude doesn't know. Progressive disclosure.
3. **Agents are not personas** — Model assignments, tool declarations, focused missions.
4. **Explicit approval gates** — Never proceed without user decision.
5. **Parallel by default** — Spawn focused agents simultaneously. Consolidate.
6. **CLAUDE.md is for project facts** — Not framework configuration.
