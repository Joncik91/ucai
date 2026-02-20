# Ucai — Use Claude Code As Is

A Claude Code plugin that solves the same problems as GSD, BMAD, Ralph, and Agent OS — but using Claude Code's native architecture instead of fighting it.

Ucai was built from the inside out.
We read the source code. We studied how Anthropic builds their own plugins.
Every component maps 1:1 to a native Claude Code system — no wrappers, no personas, no bash loops.

## 🥊 Frameworks vs. Ucai — What's Actually Different?

Community frameworks were built from the outside in — wrapping Claude Code in bash scripts, mega-prompts, and persona engineering.

Ucai is built from the inside out — using Claude Code's native systems exactly as Anthropic designed them.

| Problem | Framework Approach | Ucai (Native) Approach |
|---------|-------------------|----------------------|
| Context rot | Bash wrappers spawning fresh sessions | Task tool already gives fresh context per agent |
| No structure | Persona prompts + ceremonies | Commands with phased workflows + parallel agents |
| No guardrails | CLAUDE.md rules (hope-based) | PreToolUse hooks (deterministic) |
| No iteration | External bash loops | Stop hooks (native, built-in) |
| No planning | Manual PRD/FRD docs or skipped entirely | `/plan` with discovery agents + structured file output |
| No onboarding | Template CLAUDE.md dumps | Agent-powered codebase analysis |

## ✨ What Ucai Gives You

- Project planning with discovery agents
- Feature-level FRDs with optional agile milestone breakdown
- 8-phase build workflow with parallel agents
- Native autonomous iteration (`/ucai:iterate`)
- Multi‑agent code review
- Structured debugging
- Documentation generation
- Release automation
- Built-in senior-level skills (backend, frontend, QA, DevOps, architecture)

All using native Claude Code commands, agents, hooks, and skills.

## ⚡ Quickstart

### Requirements

Claude Code **v1.0.33+**. Check with:

```
claude --version
```

### Install (Marketplace)

Inside an interactive Claude Code session:

```
/plugin marketplace add Joncik91/ucai
/plugin install ucai@ucai-marketplace
```

This installs Ucai globally — available in every project and every session.

### Development / Local Testing

```bash
claude --plugin-dir ./ucai
```

## 🧪 Verify Installation

All commands are namespaced under `ucai:`:

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

## 🚀 Getting Started

### Greenfield (New Project)

Start with a project-level plan:

```
/ucai:plan
```

This produces:

- `.claude/project.md` — Vision, goals, users, constraints
- `.claude/requirements.md` — Feature backlog + sequenced build order

Then build features:

```
/ucai:build Core scraping pipeline
/ucai:build Endpoint system
```

For large or complex features (agile mode):

```
/ucai:plan Desktop app advanced features
# /plan detects complexity and suggests milestone breakdown
# Produces FRD with M1..MN milestones

/ucai:build Desktop app advanced features
# /build lists pending milestones, you pick one, it scopes the session
# Repeat for each milestone
```

Generate project guidelines:

```
/ucai:init
```

Ship:

```
/ucai:docs
/ucai:release patch
```

### Brownfield (Existing Project)

Start with onboarding:

```
/ucai:init
```

This analyzes your codebase with parallel agents and generates a real, fact-based CLAUDE.md.

Plan a roadmap:

```
/ucai:plan
```

Build features:

```
/ucai:build Add real-time notifications
```

Debug:

```
/ucai:debug TypeError: Cannot read property 'map' of undefined
```

Ship:

```
/ucai:docs
/ucai:release patch
```

## 🔁 Iterate (Native Autonomous Loops)

```
/ucai:iterate Refactor the auth module --max-iterations 5
```

Ucai uses native Stop hooks — no bash wrappers.
Claude works autonomously, reviews its own work, and continues until done or the iteration limit is reached.

## 🧠 How Context Persists

> Commands write files. Other commands read them. That's it — native Read/Write tools, no external memory.

```
.claude/
├── project.md
├── requirements.md
└── frds/
    ├── auth.md
    └── payments.md
```

Every command auto-loads what exists.
New sessions instantly know the project state.

## 🧩 Commands

### `/ucai:init` — Project Onboarding
Analyzes your project with parallel agents and generates a real CLAUDE.md.

```
/ucai:init
/ucai:init /path/to/project
```

### `/ucai:plan` — Project Spec & Feature FRDs

Two modes:

**Project-level:**
```
/ucai:plan
```
Produces `project.md` + `requirements.md`.

**Feature-level:**
```
/ucai:plan Add real-time notifications
/ucai:plan Migrate from REST to GraphQL
```
Produces `.claude/frds/<slug>.md`. Auto-loads project spec as context if available.

For large features (≥4 Must Have requirements or ≥3 user flows), `/plan` automatically suggests **agile mode** — breaking requirements into independently-buildable milestones stored in the same FRD. Each `/build` run targets one milestone at a time.

### `/ucai:build` — Feature Development

8-phase workflow with parallel agents and explicit approval gates.

```
/ucai:build Add user authentication with JWT
/ucai:build Refactor the database layer to use connection pooling
```

### `/ucai:iterate` — Controlled Autonomous Iteration

Native Stop hooks. No wrappers.

```
/ucai:iterate Build a REST API --completion-promise 'All endpoints working and tested' --max-iterations 15
/ucai:iterate Fix the auth bug --max-iterations 5
```

### `/ucai:review` — Multi-Agent Code Review

Parallel agents check conventions, bugs, security.

```
/ucai:review
/ucai:review src/auth/
```

### `/ucai:debug` — Structured Debugging

Parallel investigation agents trace root causes.

```
/ucai:debug TypeError: Cannot read property 'map' of undefined
/ucai:debug Login fails after session timeout
```

### `/ucai:docs` — Documentation Generation

Generates README, API docs, deployment guides.

```
/ucai:docs
/ucai:docs api
/ucai:docs readme
```

### `/ucai:release` — Changelog & Version Bump

Reads git history, bumps version, creates tag.

```
/ucai:release patch
/ucai:release minor
/ucai:release v2.1.0
```

### `/ucai:cancel-iterate`

Stops an active iteration loop.

## 🏗 Architecture

```
ucai/
├── plugin.json
├── marketplace.json
├── CLAUDE.md
├── commands/
├── agents/
├── hooks/
├── scripts/
└── skills/
```

Every component is a native Claude Code system. Nothing invented.

## 🧠 Built‑In Skills

Ucai ships with 7 curated skills auto-loaded by Claude Code:

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

You can also add project-level custom skills under `.claude/skills/`.

## 🧭 Principles

1. **Use native systems** — Commands, agents, hooks, skills
2. **Files are context** — No external memory
3. **Context is a public good** — Only add what Claude doesn't know
4. **Agents are not personas** — Real model assignments + tools
5. **Explicit approval gates** — Never proceed without user decision
6. **Parallel by default** — Spawn focused agents simultaneously
7. **CLAUDE.md is for project facts** — Not framework config

## ⭐ Support the Project

If Ucai helps you ship faster, consider starring the repo.
