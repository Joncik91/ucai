# Ucai — Use Claude Code As Is

A Claude Code plugin that solves the same problems as community frameworks (GSD, BMAD, Ralph, Agent OS, CCPM) — but using the tool's native architecture instead of fighting it.

## Why

Community frameworks were built from the outside looking in. They solve real problems — context rot, lack of structure, no guardrails, no iteration control — but they do it by wrapping the tool in bash scripts, mega-prompts, and persona engineering.

Ucai was built from the inside out. We read the source code. We studied how Anthropic builds their own plugins. Every component maps 1:1 to a native Claude Code system.

| Problem | Framework Approach | Ucai (Native) Approach |
|---------|-------------------|----------------------|
| Context rot | Bash wrappers spawning fresh sessions | Task tool already gives fresh context per agent |
| No structure | Persona prompts + ceremonies | Commands with phased workflows + parallel agents |
| No guardrails | CLAUDE.md rules (hope-based) | PreToolUse hooks (deterministic) |
| No iteration | External bash loops | Stop hooks (native, built-in) |
| No planning | Manual PRD docs or skipped entirely | Spec-driven `/plan` with discovery agents + structured output |
| No project lifecycle | 15+ commands, external state | `/plan` at two levels + files that commands auto-load |
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

### Existing project (brownfield)

Open any project and run:

```
/ucai:init
```

This analyzes your codebase with parallel agents and generates a CLAUDE.md with real project facts — tech stack, conventions, structure, key files.

### New project (greenfield)

Start with a project-level plan:

```
/ucai:plan
```

With no arguments, this enters project-level mode — it asks what you're building, researches the domain with parallel agents, and produces a project spec and full requirements backlog:

- `.claude/project.md` — Vision, goals, target users, constraints, tech stack
- `.claude/requirements.md` — Full feature backlog with MoSCoW priorities

### Plan a feature

```
/ucai:plan Add user authentication with OAuth
```

With arguments, this creates a feature-level PRD grounded in your project spec (if available). Each feature gets its own PRD at `.claude/prds/<slug>.md` — never overwritten.

### Build a feature

```
/ucai:build Add a health check endpoint
```

The build command walks through 7 phases — understand, explore, clarify, design, build, verify, done — with approval gates at each boundary. It auto-loads the full spec chain: project.md, requirements.md, and the matching PRD. When done, it marks the feature complete in requirements.md.

### Iterate

```
/ucai:iterate Refactor the auth module --max-iterations 5
```

Claude works autonomously, and each time it tries to stop, the Stop hook feeds the task back. It reviews its own previous work, continues, and repeats until done or the iteration limit is hit.

## Spec-Driven Development

Ucai uses a spec chain — persistent files that carry context across sessions:

```
/plan                          → .claude/project.md + .claude/requirements.md
/plan add auth                 → .claude/prds/auth.md
/plan add payments             → .claude/prds/payments.md
/build add auth                → requirements.md updated (auth ✅)
/build add payments            → requirements.md updated (payments ✅)
```

Every session knows what exists, what was decided, and what's next. No external memory service, no vector DB — just files that commands read and write.

```
.claude/
├── project.md              # Vision, goals, users, constraints
├── requirements.md         # Feature backlog (checkboxes track progress)
└── prds/
    ├── auth.md             # Feature PRD (preserved)
    └── payments.md         # Feature PRD (preserved)
```

## Commands

### `/ucai:init` — Project Onboarding
Analyzes your project with parallel agents and generates a proper CLAUDE.md with actual project facts — not framework config.

```
/ucai:init
/ucai:init /path/to/project
```

### `/ucai:plan` — Project Spec & Feature PRDs
Works at two levels:

**No arguments** — Project-level planning for greenfield or project definition:
```
/ucai:plan
```
Phases: Understand → Discovery → Project Definition → Requirements Backlog → Output. Produces `.claude/project.md` and `.claude/requirements.md`.

**With arguments** — Feature-level PRD generation:
```
/ucai:plan Add real-time notifications
/ucai:plan Migrate from REST to GraphQL
```
Phases: Understand → Discovery → Requirements → Architecture → Output. Produces `.claude/prds/<slug>.md`. Auto-loads project spec as context if available.

### `/ucai:build` — Feature Development
7-phase workflow: Understand → Explore → Clarify → Design → Build → Verify → Done.
Uses parallel agents at explore, design, and review phases. Explicit user approval gates.
Auto-loads the full spec chain (project.md, requirements.md, matching PRD). Marks features complete in requirements.md when done.

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
Parallel agents independently review for conventions, bugs, and security. Validates against project specs if available. Results validated and filtered.

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
│   ├── plan.md                   # /plan (project + feature modes)
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
│       ├── sessionstart-handler.js  # Context injection (git branch, iterate status, specs, skills)
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
2. **Spec-driven** — Every piece of work traces back to a specification.
3. **Context is a public good** — Only add what Claude doesn't know. Progressive disclosure.
4. **Agents are not personas** — Model assignments, tool declarations, focused missions.
5. **Explicit approval gates** — Never proceed without user decision.
6. **Parallel by default** — Spawn focused agents simultaneously. Consolidate.
7. **CLAUDE.md is for project facts** — Not framework configuration.
