# Ucai Workflow Guide

A practical walkthrough of every command, when to use each one, and how they connect.

---

## The Context Chain

Every command reads and writes files in `.claude/` and `tasks/`. This is how state persists across sessions — no external memory, just files.

```
.claude/
├── project.md          ← written by /plan (no args)
├── requirements.md     ← written by /plan (no args), updated by /build
└── frds/
    ├── auth.md         ← written by /plan <feature>
    └── payments.md

tasks/
├── todo.md             ← written by /build, /debug (overwritten per session)
└── lessons.md          ← appended by /build, /debug (persistent across sessions)
```

Commands auto-load whatever exists. Start a new session and `/build` already knows your project vision, backlog status, feature architecture, and lessons from past sessions.

---

## Full Workflow: New Project

### 1. Define the project spec

```
/ucai:plan
```

No arguments = project-level planning. Takes you through:

1. **Discovery** — parallel agents research domain best practices, architecture patterns, and (for brownfield) your existing codebase
2. **Project definition** — vision, goals, target users, constraints, tech stack with rationale
3. **UI design system** — if your project has a UI, defines typography, color, spacing, and component tone as a contract for all future builds
4. **Requirements backlog** — MoSCoW-prioritized features with a sequenced build order

Produces:
- `.claude/project.md` — the project contract
- `.claude/requirements.md` — backlog + build order

---

### 2. Plan a feature (optional but recommended for complex work)

```
/ucai:plan Add real-time notifications
/ucai:plan User authentication with JWT
```

With arguments = feature-level FRD. Takes you through discovery, requirements, and architecture for that specific feature. Produces `.claude/frds/<slug>.md`.

**When to run `/plan <feature>` before `/build`:**
- The feature touches multiple subsystems
- You need to make architecture decisions upfront
- The feature is large enough that building without a spec would cause rework

**When to skip directly to `/build`:**
- Small, well-understood features
- You already know the design

#### Milestones (all features)

**Every FRD has milestones.** This is not optional. Even a "small" feature should be split into 2+ milestones to keep each `/build` session focused and avoid context overflow.

**Why milestones matter:**
- Each `/build` session runs with a fresh context window
- Long sessions hit context limits → compaction → lost context → bugs
- Small milestones = short sessions = reliable implementation

`/plan` breaks features into small, independently-buildable milestones. Each milestone has:
- **Scope**: specific files/functions/behaviors
- **Depends on**: prior milestone(s) or "None"
- **Acceptance criteria**: 2-4 testable bullet points

Example FRD structure:

```markdown
## Milestones

### M1: Secret Detail Panel
**Scope**: Functional requirement 1 (detail panel)
**Depends on**: None
**Acceptance criteria**:
- [ ] Row click opens Sheet panel from right
- [ ] Panel shows key name, masked value, scope badge, timestamps

### M2: Environment Switcher
**Scope**: Functional requirement 2 (env tabs)
**Depends on**: M1
**Acceptance criteria**:
- [ ] Tab bar renders per Project.environments
- [ ] resolve_env() called on tab switch
```

**Guidelines:**
- Minimum 2 milestones (even for small features)
- Each milestone should be completable in one focused `/build` session
- Prefer more smaller milestones over fewer larger ones
- A milestone touching 5+ files or having 5+ acceptance criteria is probably too big

---

### 3. Build a feature

```
/ucai:build Add real-time notifications
/ucai:build User authentication with JWT
```

8-phase workflow:

| Phase | What happens |
|-------|-------------|
| **1 Understand** | Loads specs, writes `tasks/todo.md`, loads `tasks/lessons.md` for relevant patterns. Checks build order dependencies. |
| **2 Explore** | Parallel agents map the codebase — similar features, architecture, testing patterns |
| **3 Clarify** | Resolves ambiguities before any design. You answer questions. |
| **4 Design** | Architect agents generate 3 approaches (minimal / clean / pragmatic). You choose. |
| **5 Build** | Implements the chosen design. Approval-gated. Elegance checkpoint for non-trivial changes (>50 lines or >3 files). |
| **6 Verify** | Staff engineer self-check, then verifier + reviewer agents check correctness, conventions, and quality. |
| **7 Test** | Writes automated tests (unit/integration/E2E as appropriate), then generates a manual test checklist. Waits for you to confirm. |
| **8 Done** | Marks requirements done. Updates milestone criteria. Captures lessons from corrections. |

Phase 1 shows the milestone list and asks which to build:

```
Which milestone do you want to build?

  M1: Secret Detail Panel — pending
  M2: Environment Switcher — pending
  M3: Import Flow — pending
```

After you select, phases 2–8 are scoped entirely to that milestone. Phase 8 marks its acceptance criteria done in the FRD and tells you what's next.

---

### 4. Onboard the codebase

```
/ucai:init
```

Launches parallel agents to analyze your codebase structure, tech stack, conventions, and key files. Produces a fact-based `CLAUDE.md` — not a template, an actual description of your project.

**When to run `/init` on a new project — two valid timings:**

- **Right after `/plan`** — if planning produced thorough architectural decisions: the tech stack is chosen, the folder structure is defined, key conventions are decided (state management approach, API style, testing framework, etc.). At this point you know exactly what CLAUDE.md should say, even before writing code.
- **After the first `/build`** — if planning left those choices open and they were only resolved during implementation. Wait until code exists, then run `/init` to capture what was actually built.

For brownfield (existing) projects, `/init` is the starting point — run it before anything else.

---

### 5. Iterate autonomously (optional)

```
/ucai:iterate Refactor the auth module --max-iterations 5
/ucai:iterate Build a REST API --completion-promise 'All endpoints working' --max-iterations 15
```

Uses native Stop hooks. Claude works autonomously, reviews its own output, and continues until the completion promise is met or the iteration limit is reached.

**Context compaction is handled automatically.** If the context window fills during a long iteration run, the PreCompact hook reads the iterate state, task progress, and latest lesson, then injects them into the compaction summary — so the loop continues without losing track of where it is.

Stop at any time:

```
/ucai:cancel-iterate
```

---

### 6. Review code

```
/ucai:review
/ucai:review src/auth/
```

Parallel agents check for bugs, security issues, convention violations, and code quality. If `tasks/lessons.md` exists, known patterns are fed to reviewer agents so they catch project-specific issues.

---

### 7. Debug

```
/ucai:debug TypeError: Cannot read property 'map' of undefined
/ucai:debug Login fails silently after session timeout
```

Parallel agents investigate in different directions — recent changes, execution paths, similar patterns in the codebase. Diagnosis and fix plan are presented in a **single approval gate**. After you approve, execution is **autonomous** — no second gate. Verification includes writing **regression tests** to prevent recurrence, then captures lessons for non-obvious root causes.

---

### 8. Generate docs

```
/ucai:docs
/ucai:docs readme
/ucai:docs api
```

Reads codebase + spec files + lessons, generates appropriate documentation. Extracts gotchas from `tasks/lessons.md` for documentation. Adapts to project type — API service gets API reference, web app gets user-facing README, library gets usage guide.

Output goes to the project root or `docs/`, not `.claude/`.

---

### 9. Ship a release

```
/ucai:release patch
/ucai:release minor
/ucai:release v2.1.0
```

Reads git history since the last tag, cross-references `requirements.md` to connect features to the release, generates a changelog, bumps version, creates a git tag.

---

## Self-Improvement Loop

Ucai learns from your corrections across sessions. This is not a gimmick — it's the highest-ROI practice from [Boris Cherny's methodology](https://getpushtoprod.substack.com/p/how-the-creator-of-claude-code-actually).

**How it works:**

1. During `/build` or `/debug`, if you correct Claude or a non-obvious decision is made, the pattern is captured in `tasks/lessons.md`
2. Each entry has: Context, Root cause, Rule — structured so future sessions can apply it
3. On session start, hooks announce lessons count and task progress
4. Commands load lessons in Phase 1 and apply relevant patterns proactively
5. When lessons exceed 100 entries, SessionStart warns that consolidation is needed

**What hooks surface:**

| Hook | What it injects |
|------|----------------|
| **SessionStart** | "Tasks: X/Y done" + "Lessons: N entries" (+ warning if >100) |
| **UserPromptSubmit** | "Active task: ..." from first unchecked item in `tasks/todo.md` |
| **PreCompact** | Task progress + latest lesson title (survives context compaction) |

---

## Typical Session Patterns

### Starting a new project

```
/ucai:plan                              # define project spec + backlog
/ucai:init                              # if plan settled stack + conventions → generate CLAUDE.md now
/ucai:plan Vertical slice               # optional: FRD for first build
/ucai:build Vertical slice              # build step 1 from build order
/ucai:init                              # if stack/conventions were left open → generate CLAUDE.md now
/ucai:build Authentication              # build step 2
...
/ucai:docs                              # generate documentation
/ucai:release minor                     # tag and changelog
```

### Joining an existing project

```
/ucai:init                              # analyze codebase → CLAUDE.md
/ucai:plan                              # create requirements backlog if missing
/ucai:build Fix the broken auth flow    # jump straight to building
```

### Feature with milestones

```
/ucai:plan Desktop app advanced features   # breaks into M1..M6 milestones
# Approve → FRD written

/ucai:build Desktop app advanced features  # shows milestone list → pick M1
# Builds M1, marks M1 done in FRD

/ucai:build Desktop app advanced features  # shows M2..M6 remaining → pick M2
# Repeat until all milestones done
```

### Bug triage

```
/ucai:debug Payment webhook returns 500 after third retry
# Parallel agents trace the bug
# Root cause + fix plan presented in single gate
# You approve → fix applied autonomously
# Regression test written → lessons captured
```

---

## `.claude/` and `tasks/` File Reference

| File | Written by | Read by | Purpose |
|------|-----------|---------|---------|
| `project.md` | `/plan` | `/build`, `/docs`, `/release`, `/debug` | Project vision, tech stack, design system |
| `requirements.md` | `/plan` | `/build`, `/release` | Feature backlog + build order |
| `frds/<slug>.md` | `/plan <feature>` | `/build` | Per-feature requirements + architecture + milestones |
| `CLAUDE.md` | `/init`, `/build` | All commands | Codebase conventions and project facts |
| `*.local.md` | Internal | Internal | Session state (gitignored) |
| `tasks/todo.md` | `/build`, `/debug` | Hooks (SessionStart, PreCompact, UserPromptSubmit) | Persistent task tracking per session |
| `tasks/lessons.md` | `/build`, `/debug` | Hooks + `/build`, `/debug`, `/review`, `/docs` | Self-improvement loop — corrections and patterns |

---

## Tips

**Let the build order drive you.** After `/plan`, `requirements.md` has a sequenced build order. Follow it — later features depend on earlier ones being done.

**FRDs are optional but valuable.** `/build` works without a FRD. But for features with non-obvious architecture or multiple approaches, running `/plan <feature>` first saves rework in Phase 4.

**Milestones keep sessions focused.** Use them for features, not projects. Each milestone = one fresh context window = reliable implementation.

**Phase 7 writes tests AND requires manual testing.** Automated tests (unit, integration, or E2E as appropriate) are written first, then a manual test checklist is generated. `/build` won't proceed to Phase 8 until you confirm both pass.

**Lessons compound.** The more you correct Claude, the better it gets — corrections are captured in `tasks/lessons.md` and applied in future sessions. Don't hold back on corrections; they're the highest-ROI investment.

**Skills load automatically.** Ucai ships with 8 skills (backend, frontend, architect, QA, DevOps, code-reviewer, receiving-code-review, ucai-patterns). Commands load them at the start of each relevant session. You don't need to manage this manually.
