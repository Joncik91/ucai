---
feature: Cherny Methodology Upgrade
slug: cherny-methodology-upgrade
created: 2026-04-04
status: draft
---

# FRD: Cherny Methodology Upgrade

> **For Claude:** To implement this FRD, run `/build cherny-methodology-upgrade`. The build command will auto-load this file and ask which milestone to build. Each milestone runs in a fresh context window.
>
> **Branch:** All milestones must be built on the `methodology-upgrade` branch (not `main`). This branch will be merged into `main` once all milestones are complete. Switch to it before starting: `git checkout methodology-upgrade`.

## Overview

Embed Boris Cherny's Claude Code methodology into ucai's existing commands and hooks. The plugin keeps its current architecture (commands orchestrate, agents execute, hooks manage lifecycle, skills provide knowledge) but gains: persistent task tracking (`tasks/todo.md`), a self-improvement loop (`tasks/lessons.md`), elegance and quality checkpoints in `/build`, autonomous bug fixing in `/debug`, and lessons-aware review and documentation.

This is not a restructuring — it's an upgrade. Every command stays. Every agent stays. Every hook stays. The methodology principles get woven into the existing fabric.

## Discovery

### Codebase Patterns
- All commands already use TodoWrite (in-memory), approval gates, skill loading, parallel agents
- Spec chain (`project.md` → `requirements.md` → FRD) is the standard context flow
- Hooks are self-contained Node scripts: `fs.existsSync()` → `readFileSync()` → regex parse → `process.stdout.write(JSON.stringify(...))`
- Checkbox counting pattern exists in `sessionstart-handler.js:133-139` for requirements.md — reusable for todo.md
- `getField()` with CRLF-aware regex is duplicated across handlers (no shared module, by design)
- PreCompact and UserPromptSubmit currently early-exit when no iterate state — needs restructuring to also fire for task state

### Research Findings
- Cherny ships 20-30 PRs/day using plan-first workflow with parallel Claude instances
- Self-improvement loop pattern is well-established: persistent lessons file + consolidation at ~100 entries
- Community converges: correction capture is highest ROI investment, verification must be a separate agent/phase
- Sources: [Push to Prod](https://getpushtoprod.substack.com/p/how-the-creator-of-claude-code-actually), [MindStudio learnings loop](https://www.mindstudio.ai/blog/how-to-build-learnings-loop-claude-code-skills), [Addy Osmani self-improving agents](https://addyosmani.com/blog/self-improving-agents/)

## Requirements

### Functional Requirements
#### Must Have
- `tasks/todo.md` written by `/build` and `/debug` at Phase 1 with checkable items
- `tasks/lessons.md` appended by `/build` (Phase 8) and `/debug` (Phase 5) after corrections/non-obvious decisions
- SessionStart hook announces task progress ("Tasks: X/Y done") and lessons count ("Lessons: N entries")
- SessionStart warns when lessons exceed 100 entries
- PreCompact hook surfaces task progress and latest lesson title before compaction
- UserPromptSubmit hook injects first unchecked item as "Active task: ..."
- `/build` Phase 5 elegance checkpoint: "Is there a more elegant way?" for non-trivial changes (>50 lines or >3 files), skip for simple fixes
- `/build` Phase 6 staff engineer gate: abstraction level, shortcuts, integration quality, error paths — self-check before user testing
- `/build` Phase 1 and `/debug` Phase 1 load `tasks/lessons.md` and apply relevant patterns proactively
- `/debug` Phase 3 merges diagnosis + fix proposal into single approval gate
- `/debug` Phase 4 becomes autonomous execution (no second gate)
- `/review` Phase 1 reads lessons, feeds known patterns to reviewer agents
- `/docs` Phase 2 reads lessons, extracts gotchas to document
- All commands reinforce subagent-first strategy for research phases

#### Won't Have (This Release)
- Automated scoring/trust system for self-improvement
- Session-end summary writing
- Recursive self-improvement agent
- Shared module extraction for hook utilities

### Non-Functional Requirements
- **Dependencies**: Zero new external dependencies
- **Compatibility**: Existing spec chain untouched, all CI tests pass
- **Platform**: Windows/Linux/macOS — CRLF-aware, path.join() everywhere
- **Performance**: Hook additions < 5ms (two small file reads on SSD)

### Edge Cases
- `tasks/` directory doesn't exist — hooks return null, no errors
- `tasks/lessons.md` has no frontmatter — `count` defaults to 0, body scan fallback
- `tasks/todo.md` has no unchecked items — UserPromptSubmit skips injection
- Two concurrent sessions append to lessons.md — acceptable, entries are self-contained blocks
- `tasks/todo.md` overwritten mid-session by another command — hooks always read fresh

### Acceptance Criteria
- [ ] `tasks/todo.md` is created by `/build` Phase 1 with YAML frontmatter and checkable phase items
- [ ] `tasks/todo.md` is created by `/debug` Phase 1 with YAML frontmatter and checkable phase items
- [ ] `tasks/lessons.md` is appended by `/build` Phase 8 when corrections occurred
- [ ] `tasks/lessons.md` is appended by `/debug` Phase 5 for non-obvious root causes
- [ ] SessionStart output includes "Tasks: X/Y done" when `tasks/todo.md` exists
- [ ] SessionStart output includes "Lessons: N entries" when `tasks/lessons.md` exists
- [ ] SessionStart warns when lessons > 100 entries
- [ ] PreCompact system message includes task progress and latest lesson
- [ ] UserPromptSubmit injects "Active task: ..." from first unchecked todo item
- [ ] `/build` has elegance checkpoint in Phase 5 (skipped for trivial changes)
- [ ] `/build` has staff engineer self-check in Phase 6
- [ ] `/debug` presents diagnosis + fix plan in single Phase 3 gate
- [ ] `/debug` Phase 4 executes without a second approval gate
- [ ] `/review` feeds lessons patterns to reviewer agents
- [ ] `/docs` extracts gotchas from lessons for documentation
- [ ] All existing CI tests pass (`node -c`, JSON parse, smoke test)
- [ ] Hooks handle missing `tasks/` directory gracefully (no errors)

## Architecture

### High-Level Design

```
tasks/todo.md ←── written by /build, /debug (Phase 1)
     │                read by hooks (sessionstart, precompact, userpromptsubmit)
     │
tasks/lessons.md ←── appended by /build (Phase 8), /debug (Phase 5)
     │                  read by hooks (sessionstart, precompact)
     │                  read by /build (Phase 1), /debug (Phase 1),
     │                         /review (Phase 1), /docs (Phase 2)
```

Commands write, hooks read. No shared modules — each handler stays self-contained.

### Key Decisions
- **No shared module**: Handlers are independent Node processes with 10s timeout. 15 lines of duplication across 3 handlers < extraction threshold. Matches existing convention.
- **`tasks/` tracked in git**: Team-shared knowledge (unlike `.claude/ucai-iterate.local.md` which is session-local). Created by commands, not hooks.
- **`count` in lessons frontmatter**: O(1) count check in hooks without body scanning. Command that appends also increments.
- **Elegance threshold**: >50 lines new code OR >3 modified files. Prevents over-engineering on small changes.
- **Single debug gate**: Diagnosis + fix plan merged into one approval. Autonomous execution after approval.

### Integration Points
- SessionStart hook: extend `main()` parts[] assembly (after spec status block)
- PreCompact hook: restructure early exit from iterate-only to conditional
- UserPromptSubmit hook: same restructure, add task injection
- Build command: 4 insertion points (Phase 1, 5, 6, 8)
- Debug command: 4 changes (Phase 1 additions, Phase 3 expansion, Phase 4 simplification, Phase 5 addition)
- Review/Docs commands: 1 insertion point each

### Files to Create/Modify
**Modified (8 files)**:
- `hooks/handlers/sessionstart-handler.js` — +35 lines
- `hooks/handlers/precompact-handler.js` — +30 lines, 3 lines restructured
- `hooks/handlers/userpromptsubmit-handler.js` — +15 lines, early exit restructured
- `commands/build.md` — 4 insertion points
- `commands/debug.md` — 4 changes (2 insertions, 1 expansion, 1 simplification)
- `commands/review.md` — 1 insertion
- `commands/docs.md` — 1 insertion

**Created (0 files)**: None. `tasks/todo.md` and `tasks/lessons.md` are created at runtime by commands.

### Data Model

**`tasks/todo.md`** (overwritten per command session):
```yaml
---
updated: 2026-04-04
command: /build
feature: user-authentication
---
```
Body: `## Phase N` sections with `- [ ]` / `- [x]` checkable items.

**`tasks/lessons.md`** (append-only):
```yaml
---
updated: 2026-04-04
count: 3
---
```
Body: `## YYYY-MM-DD — Title` entries with `**Context**:`, `**Root cause**:`, `**Rule**:` fields.

### Security Notes
- `tasks/` files contain no secrets — plaintext markdown about workflow state
- No user input reaches shell execution or HTML output through these changes
- Hook file reads are wrapped in try/catch with silent failures — no error leakage

## Milestones

> **Each milestone is one `/build` session with a fresh context window. Keep them small and focused.**

### M1: Hook Layer
**Scope**: `sessionstart-handler.js`, `precompact-handler.js`, `userpromptsubmit-handler.js` — add task/lesson file reading and context injection across all three hooks.
**Depends on**: None

**Acceptance criteria**:
- [x] SessionStart announces "Tasks: X/Y done" and "Lessons: N entries" when files exist
- [x] SessionStart warns when lessons > 100 entries
- [x] PreCompact surfaces task progress and latest lesson in system message
- [x] UserPromptSubmit injects "Active task: ..." from first unchecked item
- [x] All hooks handle missing `tasks/` directory gracefully
- [x] Existing smoke test passes: `node hooks/handlers/sessionstart-handler.js` outputs valid JSON

### M2: `/build` Upgrade
**Scope**: `commands/build.md` — add todo tracking, lessons loading, elegance checkpoint, staff engineer gate, and lessons capture.
**Depends on**: M1

**Acceptance criteria**:
- [x] Phase 1 writes `tasks/todo.md` with YAML frontmatter and checkable phase items
- [x] Phase 1 loads `tasks/lessons.md` and notes relevant patterns
- [x] Phase 5 includes elegance checkpoint (skipped for trivial changes)
- [x] Phase 6 includes staff engineer self-check
- [x] Phase 8 appends to `tasks/lessons.md` when corrections occurred
- [x] Existing 8-phase workflow and approval gates preserved

### M3: `/debug` Autonomous Mode
**Scope**: `commands/debug.md` — add todo tracking, lessons loading, merge approval gates, add lessons capture.
**Depends on**: M1

**Acceptance criteria**:
- [x] Phase 1 writes `tasks/todo.md` with debug plan
- [x] Phase 1 loads `tasks/lessons.md` for relevant patterns
- [x] Phase 3 presents diagnosis AND fix plan in single gate
- [x] Phase 4 executes fix autonomously (no second approval gate)
- [x] Phase 5 appends lessons for non-obvious root causes
- [x] Verification phase still runs after fix

### M4: Remaining Commands + Cleanup
**Scope**: `commands/review.md`, `commands/docs.md` — lessons integration. Subagent reinforcement audit across all commands.
**Depends on**: M1

**Acceptance criteria**:
- [ ] `/review` Phase 1 reads lessons, feeds patterns to reviewer agents
- [ ] `/docs` Phase 2 reads lessons, extracts gotchas to document
- [ ] Both handle missing lessons file gracefully
- [ ] All CI tests pass

## References
- [How the Creator of Claude Code Actually Uses Claude Code](https://getpushtoprod.substack.com/p/how-the-creator-of-claude-code-actually)
- [MindStudio: How to Build a Learnings Loop](https://www.mindstudio.ai/blog/how-to-build-learnings-loop-claude-code-skills)
- [Addy Osmani: Self-Improving Coding Agents](https://addyosmani.com/blog/self-improving-agents/)
- [Boris Cherny's 100-Line Workflow](https://mindwiredai.com/2026/03/25/claude-code-creator-workflow-claudemd/)
- [Building Claude Code — Pragmatic Engineer](https://newsletter.pragmaticengineer.com/p/building-claude-code-with-boris-cherny)
