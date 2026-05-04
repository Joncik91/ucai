# Changelog

All notable changes to Ucai are documented here.

## [v2.3.0] - 2026-05-04

### Added
- **Test authorship and review separation**: Tests in `/build`, `/ship`, and `/debug` are now authored by a Task subagent (not by the implementing agent) and reviewed by a different agent against an anti-gaming checklist. Mirrors the production-code author/reviewer separation already used in `/build` Phase 6.
- **Anti-Gaming Verdicts in `skills/qa/SKILL.md`**: 10 language-agnostic principles aligned with the [Pragma](https://github.com/Joncik91/pragma) test-gaming detector — `mocked-away`, `target_not_covered`/`orphan_test`, `swallowed`, `tautological`, `conditional`, `mismatched`, `monkeypatched`/`module_attr_reassignment`/`module_shimmed`, `skipped`/`xfail_gaming`, `no_success_assertion`, `semantic_gaming`. Soft prescription whether or not Pragma is installed; composes with Pragma's hooks as defense-in-depth when present.
- **Authorship Discipline section in `skills/qa/SKILL.md`**: codifies that tests are authored by a different agent than the one that wrote the production code under test, that the author imports the production symbol directly (no reimplementation), and that the author self-checks against the verdicts before returning.
- **Reviewer escalation ladder**: `/build` Phase 7 and `/ship` Phase 4 use `ucai:reviewer` (sonnet) by default; if the reviewer flags blocking verdicts and the author's first retry still fails, retry 2 escalates to `ucai:reviewer-opus` for a deeper read. Halts only if opus also flags.
- **Pre-flight requirement audit** (build/ship implementation, architect agent, architect/backend/frontend skills, tech_decision_guide): question requirements before writing code, prefer deletion over optimization, reason from fundamentals not analogy. Sharpens the existing post-write Elegance checkpoint with an unconditional pre-flight check.
- **Failure-mode analysis** (debug Phase 3, reviewer + reviewer-opus, code review checklist, verifier): every flagged issue or PASS is paired with concrete failure scenarios drawn from the code, not theoretical ones.
- **Design-pivot clause** in `/build` Elegance checkpoint: pivot if the implementation reveals the design was wrong; do not defend code already written.

### Changed
- `commands/build.md` Phase 7 Step A: replaces inline test writing with subagent authorship + reviewer gate + escalation ladder.
- `commands/ship.md` Phase 4 step e: per-milestone subagent author + reviewer gate before commit; halts count against `max_fix_attempts`.
- `commands/debug.md` Phase 5 step 2: subagent writes regression test; existing parallel reviewer prompt extended to apply Anti-Gaming Verdicts to the test.
- `commands/build.md` Phase 5: drops the `>50 lines / >3 files` gate for the new pre-flight Algorithm Audit (must fire before code is written, not after); existing post-write Elegance checkpoint stays gated.
- `agents/verifier.md`: when acceptance criteria reference *tested behavior*, the verifier now checks that the test calls the production target directly and asserts on real return values — not on its own mock setup.
- `agents/architect.md`, `agents/reviewer.md`, `agents/reviewer-opus.md`: pre-flight audit and per-issue failure-mode analysis folded into their core review responsibilities.
- `skills/architect/SKILL.md`, `skills/architect/references/tech_decision_guide.md`, `skills/backend/SKILL.md`, `skills/frontend/SKILL.md`, `skills/code-reviewer/references/code_review_checklist.md`, `skills/ucai-patterns/SKILL.md`: First Principles preambles, Algorithm Audit pre-checks, and Pathological Honesty notes added to relevant principle surfaces.

### Notes
- No new agents, no new commands, no new hooks — the discipline is in *who calls what*, not in new agent definitions.
- Aggregate footprint: 18 files, +80/-27.
- Pragma plugin (when installed) provides hard PreToolUse/PostToolUse enforcement at the Edit/Write layer; Ucai's verdicts list is the soft prescription that applies regardless of Pragma's presence.

## [v2.2.0] - 2026-04-06

### Added
- **Enforcement engine (never-forget integration)**: Programmatic phase enforcement for `/build` and `/ship` pipelines using a `ContingencyEngine` with dependencies, logic gates, shadow tasks, and audit trail
- **`scripts/engine-factory.js`**: Create, load, save, delete engines; `readEngineStatus()` for hooks
- **`scripts/engine-gates.js`**: CLI to evaluate logic gates for a target task — outputs `{allowed, blockers, warnings}`
- **`scripts/update-engine.js`**: CLI to update dependency/task state with proof of work
- **`scripts/setup-build-engine.js`**: Creates build engine with 16 dependencies, 8 tasks, 10 logic gates, 128 shadow reactions
- **`scripts/setup-ship-engine.js`**: Creates ship engine with 13 dependencies, 9 tasks, 7 logic gates
- **`scripts/lib/never-forget/`**: Vendored never-forget dist (ESM, zero runtime deps, loaded via dynamic import)
- **Gate checks in `/build`**: Every phase boundary runs `engine-gates.js` — blocked gates halt progression and report missing prerequisites
- **Gate checks in `/ship`**: Same pattern but autonomous — blocked gates trigger auto-remedy or degrade to warnings
- **Engine state updates**: Every phase completion updates dependency states with proof and marks tasks complete
- **SessionStart engine status**: Reports engine task/dep completion and last blocked gate
- **UserPromptSubmit engine context**: Injects engine status with blocking dep info into every prompt
- **Stop hook engine context**: Enhanced ship continuation prompts with precise dependency/gate status
- **PreCompact engine recovery**: Includes engine state summary in systemMessage for context recovery
- **SessionEnd engine cleanup**: Deletes `.claude/ucai-{build|ship}-engine.local.json` alongside existing cleanup

### Changed
- `/build` command: added engine initialization in Phase 1, gate checks before each phase, state updates after each phase
- `/ship` command: same engine integration pattern with autonomous gate handling
- CLAUDE.md: added Engine Enforcement section, updated layers, key files, context chain
- README: updated positioning to acknowledge enforcement engine extension, added Enforcement Engine section, updated architecture diagram and principles

### never-forget library changes (separate repo)
- Added `ContingencyEngine.fromSnapshot()` static factory for deserialization
- Added `ContingencyEngine.toSnapshot()` instance method for serialization
- Added `EngineSnapshot` type to public API
- 3 new tests (round-trip, JSON serialization, isolation) — 70 total tests passing

## [v2.1.0] - 2026-04-05

### Added
- **`/cancel-ship` command**: Cancel an active ship pipeline with cleanup warnings for worktrees, remote branches, and partial PRs
- **Decision Guide** in workflow-guide.md: Quick answers for which explorer, /build vs /ship, /init timing, re-running /plan
- **Terminology section** in workflow-guide.md: Defines "build order step" vs "milestone" vs "phase" — three scopes, not interchangeable
- **Failure Recovery table** in `/build`: How to recover from interruption at each phase
- **Build order sequencing algorithm** in `/plan` Phase 5P: Topological sort with concrete steps instead of vague "identify dependencies"
- **Acceptance criteria capture** in `/build` Phase 1: Explicitly asks user for testable criteria when no FRD exists
- **Agent synthesis steps** in `/debug`, `/plan`, `/docs`: Explicit consolidation of agent findings before proceeding
- **Mood selection criteria** in `/plan` Phase 4P: Maps product interaction model to aesthetic direction
- **Version bump arbitration** in `/release`: Flags ambiguous breaking changes from diff when commit messages are unclear
- **Completion promise definition** in `/iterate`: Documents exact matching behavior (trim, collapse whitespace, exact comparison)

### Changed
- **TodoWrite → tasks/todo.md**: Standardized all references across 6 commands, 7 agents, 3 skill files. Agents no longer list TodoWrite in tools (read-only agents don't track progress)
- **`/ship` phase count**: Docs now correctly say "9 phases (0-8)" and include Phase 8: Cleanup & Report
- **`/build` Phase 5 approval gate**: Collapsed redundant HARD-GATE + action step into single clear gate
- **`/build` Phase 5 QA skill**: Loaded early for testability guidance during implementation, not just Phase 7
- **`/build` Phase 6 consolidation**: Agent findings merged into severity-ranked list with disagreement flagging
- **`/build` Phase transitions**: Explicit carry-forward notes between Phase 3→4 and Phase 5→6
- **`/plan` Phase 5P**: Restructured into 4 sub-steps (Prioritize, Sequence, Cross-cutting, Approve) separating MoSCoW from build order
- **Lessons consolidation clarity**: Docs now explicitly state SessionStart warns, /ship auto-consolidates, /build and /debug don't
- **PreCompact scope**: Docs clarify it fires for ALL commands, not just /ship and /iterate
- **README**: Updated command count (12), descriptions, added /cancel-ship
- **SessionStart hook**: Announces /cancel-ship alongside /cancel-iterate
- Decision criteria centralized in workflow-guide.md (single source of truth, commands reference not duplicate)

## [v2.0.1] - 2026-04-05

### Fixed
- Remove semicolons from `stop-handler.js` to match project-wide no-semicolon convention
- Rename `receiving-code-review` skill to `review-responder` for consistent agent-noun naming
- Fix workflow guide claiming skills "load automatically" — clarified that commands load them
- Update CLAUDE.md to remove stale "uses semicolons" note and bump version references

### Changed
- Command descriptions improved for clarity: `/build` ("guided... with approval gates"), `/init` ("analyze codebase... with project conventions"), `/iterate` ("autonomous loop... until done or max iterations")
- Version bumped to 2.0.1 in plugin.json, marketplace.json, CLAUDE.md

## [v2.0.0] - 2026-04-05

### Added
- **`/ship` command**: Zero-gate autonomous pipeline — spec to PR with no human
  approval gates. 8 phases: Setup → Spec Resolution → Explore → Detect Infrastructure
  → Implement → Verify Loop → Light Review → Create PR → Cleanup. Supports worktree
  isolation (default), CI watching, configurable fix retry limits.
- **`/bootstrap` command**: Scaffold test, lint, and CI infrastructure for projects
  that lack it. Detects tech stack, recommends standard tools, scaffolds with one
  approval gate, verifies everything passes.
- **PostToolUse auto-format hook**: Runs after every Write/Edit, detects project
  formatter (Prettier, Black, Ruff, gofmt, rustfmt), caches detection result,
  formats the changed file. Fails silently — never blocks.
- **`scripts/detect-infra.js`**: Shared utility that detects test/lint/format/CI
  commands from project files. Outputs JSON. Used by `/ship` and `/bootstrap`.
- **`scripts/run-tests.js`**: Deterministic test runner. Uses detect-infra for
  command detection, executes tests, outputs JSON with pass/fail + summary.
- **`scripts/setup-ship.js`**: Ship state file creator. Parses arguments, creates
  `.claude/ucai-ship.local.md`. Mirrors setup-iterate.js pattern.
- **`scripts/consolidate-lessons.js`**: Consolidates `tasks/lessons.md` when >100
  entries. Groups by rule, merges duplicates, keeps last 20 recent.
- **Ship state in Stop hook**: Phase-aware continuation prompts keep the pipeline
  running. Priority: iterate > ship > normal exit.
- **Ship state awareness**: SessionStart, UserPromptSubmit, PreCompact, and
  SessionEnd handlers all recognize and handle ship pipeline state.
- **Formatter cache cleanup**: SessionEnd cleans up
  `.claude/ucai-formatter-cache.local.json` alongside iterate/ship state.

### Changed
- SessionStart message updated to include `/ship` and `/bootstrap` commands
- Stop hook now checks both iterate and ship state files (iterate takes priority)
- CLAUDE.md updated to document v2.0 architecture (11 commands, 8 hooks)

## [v1.2.1] - 2026-04-05

### Added
- **Project scale assessment**: `/plan` Phase 1P classifies projects as
  Mini/Small/Normal/Large based on scope signals, calibrating build order
  step count and milestone granularity throughout the planning flow

### Changed
- `/plan` Phase 5P build order now references project scale classification
  with explicit step count ranges; exceeding the upper bound requires justification
- `/plan` Phase 3F.5 milestone scoping replaces "more is better" bias with
  scale-calibrated counts: Mini/Small → 1-2, Normal → 2-3, Large → 3+

### Fixed
- Sequential todo.md updates — mark each phase complete individually
  instead of batching (fixes progress tracking during multi-phase commands)

## [v1.2.0] - 2026-04-04

### Added
- **Persistent task tracking**: `/build` and `/debug` write `tasks/todo.md`
  with YAML frontmatter and checkable phase items, overwritten per session
- **Self-improvement loop**: `/build` Phase 8 and `/debug` Phase 5 append
  corrections and non-obvious decisions to `tasks/lessons.md` (append-only,
  `count` in frontmatter for O(1) hook reads)
- **Lessons loading**: `/build` Phase 1, `/debug` Phase 1, `/review` Phase 1,
  and `/docs` Phase 2 load `tasks/lessons.md` and apply relevant patterns
- **Elegance checkpoint**: `/build` Phase 5 pauses for non-trivial changes
  (>50 lines new code or >3 files modified) to challenge implementation quality
- **Staff engineer gate**: `/build` Phase 6 self-checks abstraction level,
  shortcuts, integration quality, and error paths before launching review agents
- **QA/TDD integration**: `/build` Phase 7 now writes automated tests
  (unit/integration/E2E as appropriate) before manual testing, loading
  `Skill(ucai:qa)` for framework guidance
- **Debug regression tests**: `/debug` Phase 5 writes regression tests
  before launching review agents, loading `Skill(ucai:qa)`
- **SessionStart task/lessons awareness**: announces "Tasks: X/Y done" and
  "Lessons: N entries" when files exist; warns when lessons exceed 100 entries
- **PreCompact task/lessons awareness**: surfaces task progress and latest
  lesson title before context compaction
- **UserPromptSubmit active task injection**: injects "Active task: ..."
  from first unchecked item in `tasks/todo.md`

### Changed
- `/debug` Phase 3: diagnosis and fix plan merged into single approval gate
  (was two separate gates)
- `/debug` Phase 4: autonomous execution after approval (no second gate)
- `/review` Phase 1: feeds lessons patterns to reviewer agents
- `/docs` Phase 2: extracts gotchas from lessons for documentation
- Removed `senior-` prefix from all skill references across commands,
  agents, and reference files (22 occurrences)
- Plugin version bumped to 1.2.0

### Documentation
- README: added self-improvement loop section, updated feature list,
  command descriptions, skill count (7 → 8), architecture diagram,
  and principles (added #8 learn from corrections, #9 verify before done)
- Workflow guide: updated phase table, debug/review/docs descriptions,
  added self-improvement loop section with hook injection table,
  added `tasks/` files to file reference
- CLAUDE.md: updated hook descriptions, context chain, version references

## [v1.1.0] - 2026-02-20

### Added
- SubagentStop handler — blocks subagents that return empty final
  messages; injects a one-line result preview into session context
  for non-empty outputs (`subagent-stop-handler.js`)
- PreCompact handler — if an iterate loop is active, reads loop
  state and injects it into the compaction summary so iteration
  survives context window fills (`precompact-handler.js`)
- UserPromptSubmit handler — injects active iterate loop context
  into every user prompt turn; non-blocking (`userpromptsubmit-handler.js`)
- SessionEnd handler — cleans up stale iterate state file on
  session termination (`session-end-handler.js`)

### Changed
- PreToolUse guard: replaced hard deny with `permissionDecision: "ask"`
  so users can intentionally edit plugin config files when needed
- PreToolUse guard: added `updatedInput` path normalization
  (backslash → forward slash) for cross-platform Write/Edit compat

### Documentation
- CLAUDE.md Hook conventions: all 7 hooks documented (added
  UserPromptSubmit, SubagentStop, MCP note; updated Stop entry)
- CLAUDE.md Key Files: added userpromptsubmit-handler.js and
  subagent-stop-handler.js entries
- README: added hook lifecycle coverage to "What Ucai Gives You"
- workflow-guide: added PreCompact context preservation note in
  the iterate section
