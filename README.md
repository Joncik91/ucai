# Ucai — Use Claude Code As Is

A Claude Code plugin that solves the same problems as GSD, BMAD, Ralph, and Agent OS — but using Claude Code's native architecture instead of fighting it. v2.2 adds programmatic enforcement: phase dependencies are mechanically verified, not just instructed.

Ucai was built from the inside out.
We read the source code. We studied how Anthropic builds their own plugins.
Every component maps 1:1 to a native Claude Code system — no wrappers, no personas, no bash loops.
v2.2 extends this with the [never-forget](https://github.com/Joncik91/never-forget) engine — a programmatic enforcement layer that makes phase skipping impossible.

## 🥊 Frameworks vs. Ucai — What's Actually Different?

Community frameworks were built from the outside in — wrapping Claude Code in bash scripts, mega-prompts, and persona engineering.

Ucai is built from the inside out — using Claude Code's native systems exactly as Anthropic designed them.

| Problem | Framework Approach | Ucai (Native) Approach |
|---------|-------------------|----------------------|
| Context rot | Bash wrappers spawning fresh sessions | Task tool already gives fresh context per agent |
| No structure | Persona prompts + ceremonies | Commands with phased workflows + parallel agents |
| No guardrails | CLAUDE.md rules (hope-based) | PreToolUse hooks + ContingencyEngine (deterministic) |
| No iteration | External bash loops | Stop hooks (native, built-in) |
| No automation | Manual build → test → fix → PR | Zero-gate `/ship` pipeline: spec → PR autonomously |
| No formatting | Hope-based or CI-only | PostToolUse hook auto-formats every write |
| No planning | Manual PRD/FRD docs or skipped entirely | `/plan` with discovery agents + structured file output |
| No onboarding | Template CLAUDE.md dumps | Agent-powered codebase analysis |
| No learning | Same mistakes every session | Self-improvement loop — `tasks/lessons.md` persists corrections across sessions |
| No task tracking | Manual or forgotten | Persistent `tasks/todo.md` — hooks inject active task into every prompt |

## ✨ What Ucai Gives You

- Project planning with discovery agents
- Feature-level FRDs with milestone breakdown (each milestone = one fresh context window)
- 8-phase build workflow with parallel agents, elegance checkpoints, and staff engineer self-checks
- Persistent task tracking (`tasks/todo.md`) and self-improvement loop (`tasks/lessons.md`)
- Automated test writing (TDD) integrated into build and debug workflows
- Native autonomous iteration (`/ucai:iterate`)
- Multi-agent code review with lessons-aware pattern detection
- Structured debugging with single approval gate and autonomous execution
- Documentation generation with gotcha extraction from lessons
- Release automation
- Autonomous spec-to-PR pipeline (`/ship`) — zero approval gates, worktree isolation, auto-test, auto-fix, auto-PR
- Infrastructure scaffolding (`/bootstrap`) — scaffold tests, linting, and CI for projects that lack them
- PostToolUse auto-formatting — every file write runs through your project's formatter
- Lessons consolidation — automatic cleanup when corrections exceed 100 entries
- Hook lifecycle coverage — session context injection, task/lessons awareness, config guardrails, subagent quality gates, and iterate/ship state preservation across compaction
- **Programmatic phase enforcement** — ContingencyEngine (never-forget) tracks 16 dependencies, 10 logic gates, and 128 shadow tasks per build. Gates mechanically block phase transitions until prerequisites are met. Full audit trail.
- Built-in skills (backend, frontend, QA, DevOps, architecture, code review, and more)

All using native Claude Code commands, agents, hooks, and skills — extended with a programmatic enforcement engine.

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
/ucai:ship
/ucai:bootstrap
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
| `/ucai:build` | 8-phase guided build with approval gates at each phase |
| `/ucai:ship` | 9-phase autonomous spec-to-PR — zero gates, worktree isolation, auto-test, auto-fix, auto-PR |
| `/ucai:bootstrap` | Scaffold test, lint, and CI infrastructure for projects that lack it |
| `/ucai:iterate` | Autonomous loop: repeats a task until done or max iterations |
| `/ucai:review` | Parallel agent code review — bugs, security, conventions, lessons-aware |
| `/ucai:debug` | Structured debugging — single approval gate, autonomous fix, regression tests |
| `/ucai:docs` | Generate README, API docs, deployment guides from codebase + specs + lessons |
| `/ucai:release` | Changelog from git history, version bump, git tag |
| `/ucai:cancel-iterate` | Stop an active iteration loop |
| `/ucai:cancel-ship` | Stop an active ship pipeline |

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

### Autonomous (hands-off)

```
# 1. Plan the project + feature
/ucai:plan
/ucai:plan real-time notifications

# 2. Ship it — autonomous: implement → test → fix → PR
/ucai:ship real-time notifications

# 3. Review the PR in GitHub
# Claude handled everything: implementation, tests, formatting, PR creation
```

If your project has no tests or linting, run `/ucai:bootstrap` first — `/ship` needs infrastructure to verify against.

`/ucai:build` auto-loads the FRD created by `/ucai:plan <feature>` when names match. `/ucai:debug`, `/ucai:review`, and `/ucai:docs` are standalone — use them whenever needed.

## 🧠 Built-In Skills

Ucai ships with 8 curated skills auto-loaded by Claude Code:

| Skill | Activates when |
|-------|---------------|
| **architect** | System design, architecture decisions, ADRs |
| **backend** | Building APIs, databases, authentication |
| **frontend** | React, Next.js, Tailwind, component design |
| **qa** | Testing strategies, coverage, TDD, E2E testing |
| **devops** | CI/CD pipelines, deployment, infrastructure |
| **code-reviewer** | Reviewing code quality, PRs, anti-patterns |
| **review-responder** | Responding to reviewer feedback, deciding which suggestions to implement |
| **ucai-patterns** | Working with Claude Code plugins, hooks, agents |

## 🔄 Self-Improvement Loop

Ucai learns from corrections. When you correct Claude during a `/build` or `/debug` session, the pattern is captured in `tasks/lessons.md`. Future sessions load these lessons and apply them proactively.

- **SessionStart** announces lessons count and warns when consolidation is needed (>100 entries)
- **`/build` Phase 1** and **`/debug` Phase 1** load relevant lessons before starting work
- **`/review`** feeds known patterns to reviewer agents
- **`/docs`** extracts gotchas from lessons for documentation

This is inspired by [Boris Cherny's methodology](https://getpushtoprod.substack.com/p/how-the-creator-of-claude-code-actually) — persistent correction capture is the highest-ROI investment for AI-assisted development.

## 🔒 Enforcement Engine (never-forget)

UCAI's `/build` and `/ship` pipelines use a [ContingencyEngine](https://github.com/Joncik91/never-forget) for programmatic phase enforcement. This is the difference between "Claude usually follows the instructions" and "Claude literally cannot skip Phase 4."

**How it works:**

| Concept | What it does |
|---------|-------------|
| **Dependencies** | Track prerequisites with states (identified → drafted → complete) and proof of work |
| **Logic Gates** | Block phase transitions until dependencies are met (e.g., "architecture must be approved before coding") |
| **Shadow Tasks** | Auto-generated reactions ensure every dependency is addressed per task — nothing silently skipped |
| **Audit Trail** | Observer events log every gate pass/block, state transition, and missed reaction |

**Per pipeline:**

| Pipeline | Dependencies | Tasks | Logic Gates | Shadow Reactions |
|----------|-------------|-------|-------------|-----------------|
| `/build` | 16 | 8 | 10 (all `block`) | 128 |
| `/ship` | 13 | 9 | 7 (`block` + `warn`) | auto-generated |

**Gate check before every phase:**
```
Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/engine-gates.js" --pipeline build --task task-design)
→ {"allowed": false, "blockers": ["Complete codebase exploration before designing"]}
```

**State update after every phase:**
```
Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/update-engine.js" --pipeline build --dep dep-codebase-map --state complete --proof "12 files mapped")
```

Engine state persists in `.claude/ucai-{build|ship}-engine.local.json` (session-scoped, cleaned on exit). All hooks inject engine status into context. Backward compatible — if the engine file is missing, everything falls back to instruction-based flow.

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
│   ├── setup-iterate.js
│   ├── setup-ship.js
│   ├── detect-infra.js
│   ├── run-tests.js
│   ├── consolidate-lessons.js
│   ├── engine-factory.js       ← ContingencyEngine create/load/save
│   ├── engine-gates.js         ← evaluate logic gates per phase
│   ├── update-engine.js        ← update dependency/task state
│   ├── setup-build-engine.js   ← init build engine (16 deps, 10 gates)
│   ├── setup-ship-engine.js    ← init ship engine (13 deps, 7 gates)
│   └── lib/never-forget/       ← vendored enforcement engine (zero deps)
├── skills/
└── tasks/                  ← created at runtime by commands
    ├── todo.md             ← persistent task tracking (overwritten per session)
    └── lessons.md          ← self-improvement loop (append-only)
```

Every orchestration component is a native Claude Code system. The enforcement layer (never-forget) is the only extension — it adds mechanical verification that native architecture doesn't provide.

## 🧭 Principles

1. **Use native systems** — Commands, agents, hooks, skills (extended with programmatic enforcement)
2. **Files are context** — No external memory
3. **Context is a public good** — Only add what Claude doesn't know
4. **Agents are not personas** — Real model assignments + tools
5. **Explicit approval gates** — Never proceed without user decision
6. **Parallel by default** — Spawn focused agents simultaneously
7. **CLAUDE.md is for project facts** — Not framework config
8. **Learn from corrections** — Capture patterns in lessons, apply them proactively
9. **Verify before done** — Automated tests + manual confirmation, never just agent review
10. **Two modes** — `/build` when you want control, `/ship` when you want speed

## ⭐ Support the Project

If Ucai helps you ship faster, consider starring the repo.
