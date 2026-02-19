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
| No planning | Manual PRD docs or skipped entirely | `/plan` with discovery agents + structured file output |
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
/ucai:debug
/ucai:docs
/ucai:release
/ucai:iterate
/ucai:review
/ucai:cancel-iterate
```

Run `/help` to see them listed.

## Getting Started

### New project (greenfield)

Start with a project-level plan:

```
/ucai:plan
```

With no arguments, this enters project-level mode — it asks what you're building, researches the domain with parallel agents, and produces a project spec with a full requirements backlog and build order:

- `.claude/project.md` — Vision, goals, target users, constraints, tech stack
- `.claude/requirements.md` — Feature backlog with MoSCoW priorities + sequenced build order

Then build features step by step from the build order:

```
/ucai:build Core scraping pipeline
/ucai:build Endpoint system
```

For complex steps, optionally create a detailed PRD first:

```
/ucai:plan Core scraping pipeline
/ucai:build Core scraping pipeline
```

Once you have code, generate project guidelines:

```
/ucai:init
```

When ready to share or ship:

```
/ucai:docs
/ucai:release patch
```

### Existing project (brownfield)

Open any project and start with onboarding:

```
/ucai:init
```

This analyzes your codebase with parallel agents and generates a CLAUDE.md with real project facts — tech stack, conventions, structure, key files.

To plan a roadmap, run `/plan` with no arguments to define project scope and requirements. Then build features from the build order:

```
/ucai:plan
/ucai:build Add real-time notifications
```

To debug issues:

```
/ucai:debug TypeError: Cannot read property 'map' of undefined
```

When ready to share or ship:

```
/ucai:docs
/ucai:release patch
```

### Iterate

```
/ucai:iterate Refactor the auth module --max-iterations 5
```

Claude works autonomously, and each time it tries to stop, the Stop hook feeds the task back. It reviews its own previous work, continues, and repeats until done or the iteration limit is hit.

## How Context Persists

Commands write files. Other commands read them. That's it — native Read/Write tools, no external memory.

```
/plan                          → .claude/project.md + .claude/requirements.md
/plan add auth                 → .claude/prds/auth.md
/build add auth                → requirements.md updated (auth ✅)
/docs                          → README.md, docs/ (project-dependent)
/release patch                 → CHANGELOG.md + version bump + git tag
```

```
.claude/
├── project.md              # Vision, goals, users, constraints
├── requirements.md         # Feature backlog (checkboxes track progress)
└── prds/
    ├── auth.md             # Feature PRD (preserved)
    └── payments.md         # Feature PRD (preserved)
```

Each command auto-loads whatever exists. A new session reads the files and knows what's been planned, built, and what's next. The SessionStart hook announces progress and the next build order step.

## Commands

### `/ucai:init` — Project Onboarding
Analyzes your project with parallel agents and generates a proper CLAUDE.md with actual project facts — not framework config. Uses project.md as context if available.

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
Phases: Understand → Discovery → Project Definition → Requirements Backlog → Output. Produces `.claude/project.md` and `.claude/requirements.md` (with sequenced build order).

**With arguments** — Feature-level PRD generation (optional, for complex features):
```
/ucai:plan Add real-time notifications
/ucai:plan Migrate from REST to GraphQL
```
Phases: Understand → Discovery → Requirements → Architecture → Output. Produces `.claude/prds/<slug>.md`. Auto-loads project spec as context if available.

### `/ucai:build` — Feature Development
8-phase workflow: Understand → Explore → Clarify → Design → Build → Verify → Test → Done.
Uses parallel agents at explore, design, and review phases. Mandatory manual testing gate before marking complete. Explicit user approval gates.
Auto-loads project.md, requirements.md, and matching PRD if they exist. Checks build order for dependencies and marks all covered requirements done when complete.

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

### `/ucai:debug` — Structured Debugging
Parallel investigation agents trace bugs through the codebase, analyze recent changes, and identify root cause. Proposes a targeted fix with approval gate.

```
/ucai:debug TypeError: Cannot read property 'map' of undefined
/ucai:debug Login fails after session timeout
```

### `/ucai:docs` — Documentation Generation
Scans codebase and spec files to generate appropriate documentation. Adapts to what the project has — API docs, README, deployment guide. References project.md and requirements.md if available.

```
/ucai:docs
/ucai:docs api
/ucai:docs readme
```

### `/ucai:release` — Changelog & Version Bump
Reads git history since last tag, categorizes changes, generates a changelog, bumps the version, and creates a git tag. Cross-references requirements.md for completed features.

```
/ucai:release patch
/ucai:release minor
/ucai:release v2.1.0
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
│   ├── debug.md                  # /debug
│   ├── docs.md                   # /docs
│   ├── release.md                # /release
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
2. **Files are context** — Commands write specs, other commands read them. No external memory needed.
3. **Context is a public good** — Only add what Claude doesn't know. Progressive disclosure.
4. **Agents are not personas** — Model assignments, tool declarations, focused missions.
5. **Explicit approval gates** — Never proceed without user decision.
6. **Parallel by default** — Spawn focused agents simultaneously. Consolidate.
7. **CLAUDE.md is for project facts** — Not framework configuration.
