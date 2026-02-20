# Ucai Workflow Guide

A practical walkthrough of every command, when to use each one, and how they connect.

---

## The Context Chain

Every command reads and writes files in `.claude/`. This is how state persists across sessions — no external memory, just files.

```
.claude/
├── project.md          ← written by /plan (no args)
├── requirements.md     ← written by /plan (no args), updated by /build
└── frds/
    ├── auth.md         ← written by /plan <feature>
    └── payments.md
```

Commands auto-load whatever exists. Start a new session and `/build` already knows your project vision, backlog status, and feature architecture.

---

## Full Workflow: New Project

### 1. Onboard the codebase

```
/ucai:init
```

Launches parallel agents to analyze your codebase structure, tech stack, conventions, and key files. Produces a fact-based `CLAUDE.md` — not a template, an actual description of your project.

Run this first on any project, greenfield or brownfield. On a greenfield project with no source files yet it generates a starter `CLAUDE.md` from your description.

---

### 2. Define the project spec

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

### 3. Plan a feature (optional but recommended for complex work)

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

#### Agile mode (large features)

If `/plan` detects ≥4 Must Have requirements or ≥3 distinct user flows, it suggests **agile mode**:

> "I found 6 Must Have requirements and 5 user flows — this is a large feature. Would you like agile mode?"

If you accept, `/plan` defines milestones (M1..MN), each independently buildable. The FRD gets a `mode: agile` flag and a `## Milestones` section with per-milestone scope, dependencies, and acceptance criteria.

Example FRD structure in agile mode:

```markdown
---
mode: agile
---

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

---

### 4. Build a feature

```
/ucai:build Add real-time notifications
/ucai:build User authentication with JWT
```

8-phase workflow:

| Phase | What happens |
|-------|-------------|
| **1 Understand** | Loads project.md, requirements.md, FRD (if any). Checks build order dependencies. |
| **2 Explore** | Parallel agents map the codebase — similar features, architecture, testing patterns |
| **3 Clarify** | Resolves ambiguities before any design. You answer questions. |
| **4 Design** | Architect agents generate 3 approaches (minimal / clean / pragmatic). You choose. |
| **5 Build** | Implements the chosen design. Approval-gated — does not start without your go-ahead. |
| **6 Verify** | Verifier + reviewer agents check correctness, conventions, and quality. |
| **7 Test** | Generates a concrete manual test checklist. Waits for you to confirm it passes. |
| **8 Done** | Marks requirements done in requirements.md. Updates milestone in FRD if agile. |

**With an agile FRD**, Phase 1 shows the milestone list and asks which to build:

```
This FRD uses agile mode. Which milestone do you want to build next?

  M1: Secret Detail Panel — pending
  M2: Environment Switcher — pending
  M3: Import Flow — pending
```

After you select, phases 2–8 are scoped entirely to that milestone. Phase 8 marks its acceptance criteria done in the FRD and tells you what's next.

---

### 5. Iterate autonomously (optional)

```
/ucai:iterate Refactor the auth module --max-iterations 5
/ucai:iterate Build a REST API --completion-promise 'All endpoints working' --max-iterations 15
```

Uses native Stop hooks. Claude works autonomously, reviews its own output, and continues until the completion promise is met or the iteration limit is reached.

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

Parallel agents check for bugs, security issues, convention violations, and code quality. Pass a path to scope the review.

---

### 7. Debug

```
/ucai:debug TypeError: Cannot read property 'map' of undefined
/ucai:debug Login fails silently after session timeout
```

Parallel agents investigate in different directions — recent changes, execution paths, similar patterns in the codebase. Converge on a root cause, propose a fix.

---

### 8. Generate docs

```
/ucai:docs
/ucai:docs readme
/ucai:docs api
```

Reads codebase + spec files, generates appropriate documentation. Adapts to project type — API service gets API reference, web app gets user-facing README, library gets usage guide.

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

## Typical Session Patterns

### Starting a new project

```
/ucai:init                              # generate CLAUDE.md
/ucai:plan                              # define project spec + backlog
/ucai:plan Vertical slice               # optional: FRD for first build
/ucai:build Vertical slice              # build step 1 from build order
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

### Large feature in agile mode

```
/ucai:plan Desktop app advanced features   # detects 6 requirements → suggests agile
# Accept → defines M1..M6 milestones
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
# Root cause identified
# Fix proposed → you approve → applied
```

---

## `.claude/` File Reference

| File | Written by | Read by | Purpose |
|------|-----------|---------|---------|
| `project.md` | `/plan` | `/build`, `/docs`, `/release`, `/debug` | Project vision, tech stack, design system |
| `requirements.md` | `/plan` | `/build`, `/release` | Feature backlog + build order |
| `frds/<slug>.md` | `/plan <feature>` | `/build` | Per-feature requirements + architecture + milestones |
| `CLAUDE.md` | `/init`, `/build` | All commands | Codebase conventions and project facts |
| `*.local.md` | Internal | Internal | Session state (gitignored) |

---

## Tips

**Let the build order drive you.** After `/plan`, `requirements.md` has a sequenced build order. Follow it — later features depend on earlier ones being done.

**FRDs are optional but valuable.** `/build` works without a FRD. But for features with non-obvious architecture or multiple approaches, running `/plan <feature>` first saves rework in Phase 4.

**Agile mode is for features, not projects.** Use it when a single feature is too large to build in one session. Don't use it to replace project-level planning.

**Phase 7 is mandatory.** Agent review is not a substitute for running the software. `/build` won't proceed to Phase 8 until you confirm the manual test checklist passes.

**Skills load automatically.** Ucai ships with 7 senior-level skills (backend, frontend, architect, QA, DevOps, code-reviewer, ucai-patterns). Commands load them at the start of each relevant session. You don't need to manage this manually.
