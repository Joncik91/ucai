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
- Feature-level FRDs with milestone breakdown (each milestone = one fresh context window)
- 8-phase build workflow with parallel agents
- Native autonomous iteration (`/ucai:iterate`)
- Multi-agent code review
- Structured debugging
- Documentation generation
- Release automation
- Hook lifecycle coverage — session context injection, config guardrails, subagent quality gates, and iterate-state preservation across compaction
- Built-in skills (backend, frontend, QA, DevOps, architecture)

All using native Claude Code commands, agents, hooks, and skills.

## ⚡ Quickstart

### Requirements

Claude Code **v2.1.0+**. Check with:

```
claude --version
```

### Install (Marketplace)

Inside an interactive Claude Code session:

```
/plugin marketplace add Joncik91/ucai
/plugin install ucai-plugin@ucai-marketplace
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

## 🧩 Commands

| Command | What it does |
|---------|-------------|
| `/ucai:init` | Analyze codebase with parallel agents → generate real CLAUDE.md |
| `/ucai:plan` | No args: project spec + requirements backlog. With args: feature FRD with milestones |
| `/ucai:build` | 8-phase build workflow — explore, clarify, design, implement, verify, test |
| `/ucai:iterate` | Controlled autonomous iteration via native Stop hooks |
| `/ucai:review` | Parallel agent code review — bugs, security, conventions |
| `/ucai:debug` | Structured debugging — parallel agents trace root cause |
| `/ucai:docs` | Generate README, API docs, deployment guides from codebase + specs |
| `/ucai:release` | Changelog from git history, version bump, git tag |
| `/ucai:cancel-iterate` | Stop an active iteration loop |

→ **[Full workflow guide](docs/workflow-guide.md)** — getting started patterns, milestone-based builds, command deep-dives, context chain reference.

## 🚀 Typical E2E Workflow

### Greenfield project

```
# 1. Define what you're building — project.md + requirements backlog
/ucai:plan

# 2. Generate CLAUDE.md — two valid timings, pick one:
#    Right after /plan  →  if planning settled the stack, folder structure,
#                          and key conventions well enough to write them down now
#    After first /build →  if those choices were left open and only resolved
#                          once implementation started
/ucai:init

# 3. FRD for your first feature (optional but recommended for complex work)
/ucai:plan vertical slice

# 4. Build it — 8-phase: explore → clarify → design → implement → verify → test
/ucai:build vertical slice

# 5. Keep building from the backlog
/ucai:build authentication
/ucai:build notifications
...

# 6. Review, document, release
/ucai:review
/ucai:docs
/ucai:release minor
```

### Existing project

```
# 1. Analyze the codebase → generate CLAUDE.md
/ucai:init

# 2. Create a requirements backlog if one doesn't exist
/ucai:plan

# 3. Jump straight to building
/ucai:build fix the broken auth flow
```

`/ucai:build` auto-loads the FRD created by `/ucai:plan <feature>` when names match. `/ucai:debug`, `/ucai:review`, and `/ucai:docs` are standalone — use them whenever needed.

## 🧠 Built-In Skills

Ucai ships with 7 curated skills auto-loaded by Claude Code:

| Skill | Activates when |
|-------|---------------|
| **ucai-patterns** | Working with Claude Code plugins, hooks, agents |
| **backend** | Building APIs, databases, authentication |
| **frontend** | React, Next.js, Tailwind, component design |
| **architect** | System design, architecture decisions, ADRs |
| **code-reviewer** | Reviewing code quality, PRs, anti-patterns |
| **qa** | Testing strategies, coverage, E2E testing |
| **devops** | CI/CD pipelines, deployment, infrastructure |

## 🏗 Architecture

```
ucai/
├── .claude-plugin/
│   ├── plugin.json
│   └── marketplace.json
├── CLAUDE.md
├── commands/
├── agents/
├── hooks/
├── scripts/
└── skills/
```

Every component is a native Claude Code system. Nothing invented.

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
