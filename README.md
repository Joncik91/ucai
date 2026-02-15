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
| No planning | Manual PRD docs or skipped entirely | /plan command with discovery agents + structured PRD output |
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
/ucai:plan
/ucai:build
/ucai:iterate
/ucai:review
/ucai:cancel-iterate
```

Run `/help` to see them listed.

## Getting Started

Once installed, open any project and run:

```
/ucai:init
```

This analyzes your codebase with parallel agents and generates a CLAUDE.md with real project facts — tech stack, conventions, structure, key files. Review the proposal and approve.

For larger features, start with a plan:

```
/ucai:plan Add user authentication with OAuth
```

This runs discovery agents (codebase + web research), walks through requirements and architecture with approval gates, and outputs a structured PRD to `.claude/prd.md`.

Then build a feature:

```
/ucai:build Add a health check endpoint
```

The build command walks through 7 phases — understand, explore, clarify, design, build, verify, done — with approval gates at each boundary. You stay in control. If a `.claude/prd.md` exists from `/plan`, it's automatically loaded as context.

For tasks that need multiple passes:

```
/ucai:iterate Refactor the auth module --max-iterations 5
```

Claude works autonomously, and each time it tries to stop, the Stop hook feeds the task back. It reviews its own previous work, continues, and repeats until done or the iteration limit is hit.

## Commands

### `/ucai:init` — Project Onboarding
Analyzes your project with parallel agents and generates a proper CLAUDE.md with actual project facts — not framework config.

```
/ucai:init
/ucai:init /path/to/project
```

### `/ucai:plan` — PRD Generation
5-phase workflow: Understand → Discovery → Requirements → Architecture → Output.
Spawns parallel agents for codebase and web research. Produces a structured PRD at `.claude/prd.md` with approval gates at requirements and architecture boundaries.

```
/ucai:plan Add real-time notifications
/ucai:plan Migrate from REST to GraphQL
```

### `/ucai:build` — Feature Development
7-phase workflow: Understand → Explore → Clarify → Design → Build → Verify → Done.
Uses parallel agents at explore, design, and review phases. Explicit user approval gates.
Auto-loads `.claude/prd.md` as context if present. Detects and loads relevant skills (plugin and project-level) based on the feature being built.

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
├── plugin.json                   # Plugin manifest
├── marketplace.json              # Marketplace listing
├── CLAUDE.md                     # Project guidelines
├── commands/                     # Slash commands
│   ├── init.md                   # /init
│   ├── plan.md                   # /plan
│   ├── build.md                  # /build
│   ├── iterate.md                # /iterate
│   ├── review.md                 # /review
│   └── cancel-iterate.md        # /cancel-iterate
├── agents/                       # Subagents (all read-only, sonnet)
│   ├── project-scanner.md        # Codebase analysis
│   ├── explorer.md               # Deep exploration
│   ├── architect.md              # Architecture design
│   ├── reviewer.md               # Code review
│   └── verifier.md               # Acceptance validation
├── hooks/                        # Lifecycle handlers
│   ├── hooks.json                # Hook configuration
│   └── handlers/
│       ├── sessionstart-handler.js  # Context injection (git branch, iterate status, skills)
│       ├── pretooluse-guard.js      # Config file protection
│       └── stop-handler.js          # Iteration control
├── scripts/
│   └── setup-iterate.js          # Iterate loop setup
└── skills/                       # Progressive disclosure (auto-loaded by Claude Code)
    ├── ucai-patterns/            # Claude Code best practices
    ├── senior-backend/           # API design, databases, auth
    ├── senior-frontend/          # React, Next.js, Tailwind
    ├── senior-architect/         # System design, ADRs
    ├── code-reviewer/            # Code review automation
    ├── senior-qa/                # Testing patterns
    └── senior-devops/            # CI/CD, deployment
```

Every component is a native Claude Code system. Nothing invented.

## Skills

Ucai ships with 7 curated skills that Claude Code auto-loads based on context:

| Skill | Activates when |
|-------|---------------|
| **ucai-patterns** | Working with Claude Code plugins, hooks, agents |
| **senior-backend** | Building APIs, databases, authentication |
| **senior-frontend** | React, Next.js, Tailwind, component design |
| **senior-architect** | System design, architecture decisions, ADRs |
| **code-reviewer** | Reviewing code quality, PRs, anti-patterns |
| **senior-qa** | Testing strategies, coverage, E2E testing |
| **senior-devops** | CI/CD pipelines, deployment, infrastructure |

Engineering skills sourced from [alirezarezvani/claude-skills](https://github.com/alirezarezvani/claude-skills) (MIT). Browse [skillsmp.com](https://skillsmp.com) for 200,000+ community skills.

### Project-Level Custom Skills

You can also create custom skills in any project:

```
your-project/
└── .claude/
    └── skills/
        └── my-skill/
            ├── SKILL.md          # Required: YAML frontmatter (name, description) + body
            └── references/       # Optional: additional detail loaded on demand
```

Example `SKILL.md`:

```markdown
---
name: my-api-conventions
description: Use when building or modifying API endpoints in this project
---

# API Conventions

- All endpoints return JSON with `{ data, error, meta }` envelope
- Use zod for request validation
- ...
```

Claude Code automatically discovers project-level skills alongside plugin skills — no configuration needed.

## Principles

1. **Use native systems** — Commands, agents, hooks, skills. Not wrappers.
2. **Context is a public good** — Only add what Claude doesn't know. Progressive disclosure.
3. **Agents are not personas** — Model assignments, tool declarations, focused missions.
4. **Explicit approval gates** — Never proceed without user decision.
5. **Parallel by default** — Spawn focused agents simultaneously. Consolidate.
6. **CLAUDE.md is for project facts** — Not framework configuration.
