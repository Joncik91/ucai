# Ucai Workflow Guide

A practical walkthrough of every command, when to use each one, and how they connect.

---

## The Context Chain

Every command reads and writes files in `.claude/` and `tasks/`. This is how state persists across sessions — no external memory, just files.

```
.claude/
├── project.md                          ← written by /plan (no args)
├── requirements.md                     ← written by /plan (no args), updated by /build, /ship
├── ucai-ship.local.md                  ← ship pipeline state (gitignored)
├── ucai-iterate.local.md               ← iterate loop state (gitignored)
├── ucai-formatter-cache.local.json     ← formatter detection cache (gitignored)
└── frds/
    ├── auth.md                         ← written by /plan <feature>
    └── payments.md

tasks/
├── todo.md             ← written by /build, /debug (overwritten per session)
└── lessons.md          ← appended by /build, /debug, /ship (persistent across sessions)
```

Commands auto-load whatever exists. Start a new session and `/build` already knows your project vision, backlog status, feature architecture, and lessons from past sessions.

---

## Terminology

Three scopes of work, from largest to smallest:

| Term | Scope | Example |
|------|-------|---------|
| **Build order step** | A unit of work in `requirements.md` Build Order. May cover multiple features. Executed via `/build`. | "Step 2: Authentication — covers: login, registration, password reset" |
| **Milestone** | A subdivision of a feature FRD. One `/build` session per milestone. | "M1: Data Layer", "M2: API Endpoints" |
| **Phase** | A step within a single command execution. | "Phase 3: Clarify", "Phase 5: Build" |

These are NOT interchangeable. A build order step may contain a feature with 3 milestones, and each milestone's `/build` run has 8 phases.

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

### 6. Ship a feature autonomously

```
/ucai:ship Add user authentication with JWT
/ucai:ship auth                                    # references .claude/frds/auth.md
/ucai:ship .claude/frds/payments.md --ci-watch     # watches CI after PR
```

`/ship` is the autonomous counterpart to `/build`. Same quality — zero approval gates. It runs in a worktree by default so you're never blocked.

**When to use `/ship` vs `/build`:**

| | `/build` | `/ship` |
|---|---------|---------|
| **Approval gates** | 3 (clarify, design, pre-implement) | 0 |
| **Human reviews** | Design choices during build | The PR after it's done |
| **Best for** | Unclear requirements, first-time architecture | Clear specs, proven patterns |
| **Isolation** | Works in your directory | Worktree by default |

**The 9 phases (0-8):**

0. **Setup** — Parse spec, enter worktree, load project context + lessons
1. **Spec Resolution** — Auto-select next FRD milestone (or generate internal plan for inline specs)
2. **Explore** — 2 fast explorer agents map the codebase
3. **Detect Infrastructure** — Find test/lint/format commands. If missing, scaffold minimal infrastructure inline.
4. **Implement** — Build milestone by milestone, commit per milestone
5. **Verify Loop** — Run tests → if fail: fix + retry (up to N attempts). Run formatter. Run linter → if fail: fix + retry.
6. **Light Review** — 1 reviewer agent catches critical bugs. Auto-fixes confidence >= 90 issues.
7. **Create PR** — Push, create PR via `gh`, optionally watch CI and fix failures.
8. **Cleanup & Report** — Update FRD milestones, mark requirements done, capture lessons, print summary.

Stop at any time: `/ucai:cancel-ship`

**Flags:**

| Flag | Default | Effect |
|------|---------|--------|
| `--no-worktree` | off | Work in current directory instead of isolated worktree |
| `--no-pr` | off | Skip PR creation |
| `--max-fix-attempts N` | 5 | Max test/lint fix retries per milestone |
| `--ci-watch` | off | Poll CI after PR creation, auto-fix failures |

**How it stays running:** The Stop hook reads `.claude/ucai-ship.local.md` and blocks session exit until all phases complete. If context compacts, the PreCompact hook preserves phase, milestone, and fix attempt state.

**Missing infrastructure?** If `/ship` detects no test framework, it scaffolds a minimal one inline (same logic as `/bootstrap`). You don't need to run `/bootstrap` separately — but you can if you want to review what gets scaffolded.

---

### 7. Bootstrap infrastructure

```
/ucai:bootstrap
/ucai:bootstrap test
/ucai:bootstrap lint
```

For projects without test, lint, or CI infrastructure. Detects your tech stack, recommends standard tools, and scaffolds everything with a single approval gate.

**What it scaffolds:**

| Stack | Test | Format | Lint | CI |
|-------|------|--------|------|----|
| JS/TS | Vitest | Prettier | ESLint | GitHub Actions |
| Python | pytest | Black/Ruff | Ruff | GitHub Actions |
| Go | `go test` | `gofmt` | `golangci-lint` | GitHub Actions |
| Rust | `cargo test` | `rustfmt` | `clippy` | GitHub Actions |

Creates one real example test (testing an actual function, not a dummy), adds scripts to package.json (or equivalent), and verifies everything passes before finishing.

**Connection to `/ship`:** `/ship` Phase 3 runs the same detection. If it finds nothing, it bootstraps inline. `/bootstrap` is the standalone version for when you want to review and approve the setup explicitly.

---

### 8. Review code

```
/ucai:review
/ucai:review src/auth/
```

Parallel agents check for bugs, security issues, convention violations, and code quality. If `tasks/lessons.md` exists, known patterns are fed to reviewer agents so they catch project-specific issues.

---

### 9. Debug

```
/ucai:debug TypeError: Cannot read property 'map' of undefined
/ucai:debug Login fails silently after session timeout
```

Parallel agents investigate in different directions — recent changes, execution paths, similar patterns in the codebase. Diagnosis and fix plan are presented in a **single approval gate**. After you approve, execution is **autonomous** — no second gate. Verification includes writing **regression tests** to prevent recurrence, then captures lessons for non-obvious root causes.

---

### 10. Generate docs

```
/ucai:docs
/ucai:docs readme
/ucai:docs api
```

Reads codebase + spec files + lessons, generates appropriate documentation. Extracts gotchas from `tasks/lessons.md` for documentation. Adapts to project type — API service gets API reference, web app gets user-facing README, library gets usage guide.

Output goes to the project root or `docs/`, not `.claude/`.

---

### 11. Ship a release

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
5. When lessons exceed 100 entries:
   - **SessionStart hook** *warns*: "WARNING: >100 entries — consider consolidation"
   - **`/ship` Phase 8** *auto-consolidates* (groups by rule, merges duplicates, keeps last 20 recent)
   - **`/build` and `/debug` do NOT auto-consolidate** — heed the SessionStart warning and run the script manually
   - **Manual consolidation**: `node scripts/consolidate-lessons.js` outputs consolidated content to stdout

**What hooks surface:**

| Hook | What it injects |
|------|----------------|
| **SessionStart** | "Tasks: X/Y done" + "Lessons: N entries" (+ warning if >100) + ship/iterate status |
| **PostToolUse** | Auto-formats files after Write/Edit (detects Prettier, Black, gofmt, rustfmt, etc.) |
| **UserPromptSubmit** | "Active task: ..." + iterate/ship context from state files |
| **PreCompact** | Task progress + latest lesson + iterate/ship state (survives context compaction). Fires for ALL commands, not just /ship and /iterate. |

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

### Autonomous shipping

```
/ucai:plan Real-time notifications         # create FRD with milestones
/ucai:ship Real-time notifications          # autonomous: implement → test → fix → PR
# Review the PR in GitHub — Claude handled everything
# /ship auto-selects the next incomplete milestone each run
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
| `ucai-iterate.local.md` | `/iterate` | Stop hook, SessionStart, PreCompact, UserPromptSubmit | Iterate loop state (gitignored) |
| `ucai-ship.local.md` | `/ship` | Stop hook, SessionStart, PreCompact, UserPromptSubmit | Ship pipeline state — phase, milestone, fix attempts (gitignored) |
| `ucai-formatter-cache.local.json` | PostToolUse hook | PostToolUse hook | Formatter detection cache (cleaned by SessionEnd) |
| `tasks/todo.md` | `/build`, `/debug` | Hooks (SessionStart, PreCompact, UserPromptSubmit) | Persistent task tracking per session |
| `tasks/lessons.md` | `/build`, `/debug`, `/ship` | Hooks + `/build`, `/debug`, `/review`, `/docs`, `/ship` | Self-improvement loop — corrections and patterns |

---

## Tips

**Let the build order drive you.** After `/plan`, `requirements.md` has a sequenced build order. Follow it — later features depend on earlier ones being done.

**FRDs are optional but valuable.** `/build` works without a FRD. But for features with non-obvious architecture or multiple approaches, running `/plan <feature>` first saves rework in Phase 4.

**Milestones keep sessions focused.** Use them for features, not projects. Each milestone = one fresh context window = reliable implementation.

**Phase 7 writes tests AND requires manual testing.** Automated tests (unit, integration, or E2E as appropriate) are written first, then a manual test checklist is generated. `/build` won't proceed to Phase 8 until you confirm both pass.

**Lessons compound.** The more you correct Claude, the better it gets — corrections are captured in `tasks/lessons.md` and applied in future sessions. Don't hold back on corrections; they're the highest-ROI investment.

**Skills are loaded by commands.** Ucai ships with 8 skills (backend, frontend, architect, QA, DevOps, code-reviewer, review-responder, ucai-patterns). Each command loads relevant skills at the start of its workflow — you don't need to invoke them separately.

**`/ship` vs `/build`.** Use `/build` when you want to review design choices, when requirements are unclear, or when you're building something for the first time. Use `/ship` when the spec is clear, patterns are established, and you want autonomous execution.

**Bootstrap first.** If your project has no tests, run `/ucai:bootstrap` before `/ucai:ship`. `/ship` can scaffold inline, but `/bootstrap` gives you a chance to review what gets created.

---

## Decision Guide

Quick answers to common "which do I use?" questions.

### Which explorer agent?

| Agent | Model | Cost | Use when |
|-------|-------|------|----------|
| `ucai:explorer-haiku` | haiku | Low | Quick validation, structure scanning, FRD spot-checks (~8 tool calls) |
| `ucai:explorer` | sonnet | Medium | Default for most exploration — balanced depth and cost (~15 tool calls) |
| `ucai:explorer-opus` | opus | High | Complex debugging, security audits, tracing subtle call chains (~25 tool calls) |

**Depth selection** (quick/medium/thorough):
- **quick**: You already know roughly where the code is, just need file paths confirmed
- **medium** (default): You know the general area but need patterns, conventions, and integration points
- **thorough**: You have no idea how the codebase works, or the feature touches many subsystems

### When to /plan first vs /build directly?

- **`/plan` first** when: feature touches 3+ subsystems, architecture is unclear, you want milestones to break work across sessions
- **`/build` directly** when: feature is small, design is obvious, you already know the approach

### When to /build vs /ship?

- **`/build`** when: requirements are unclear, first time building in this area, you want to review design choices at each phase
- **`/ship`** when: FRD exists with clear milestones, patterns are established, you trust autonomous execution

### When to run /init?

- **After `/plan`**: if planning settled the tech stack, conventions, and folder structure
- **After first `/build`**: if those decisions were deferred and only resolved during implementation
- **Rule of thumb**: run `/init` when CLAUDE.md would have concrete facts to state, not just intentions

### Can I re-run /plan after a partial build?

Yes. `/plan <feature>` detects the existing FRD and asks: "Overwrite, refine, or abort?" Choose "refine" to update the FRD with lessons from implementation while preserving completed milestone status.

### Is the review confidence threshold (80) a hard cutoff?

No — it's a guideline. Agents may report security-related issues at 75-79. The validation phase exists to catch false positives. The threshold is a filter, not a wall.
