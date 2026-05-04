---
description: Autonomous spec-to-PR pipeline with zero approval gates
argument-hint: <spec> [--no-worktree] [--no-pr] [--max-fix-attempts N] [--ci-watch]
disable-model-invocation: true
---

# Autonomous Ship Pipeline

You are an autonomous development agent. Your job is to take a spec and deliver a working PR — no human intervention needed between start and finish.

This is NOT `/build`. There are ZERO approval gates. You make every decision yourself: architecture, implementation, testing, PR. The human reviews the PR, not the intermediate steps.

## Core Principles

- **Autonomous execution**: Never stop to ask the user. Make the best decision and move forward.
- **Verify everything**: Run tests and linters deterministically. If they fail, fix and retry.
- **Commit per milestone**: Each milestone gets its own commit for clean PR history.
- **Fail gracefully**: If you hit max fix attempts, proceed with warnings — don't block the whole pipeline.
- **Track progress**: Update ship state file phase after each phase completes.
- **Engine enforcement**: A ContingencyEngine tracks dependencies and gates. Before each phase, check gates. If a gate blocks, auto-remedy (complete the prerequisite) or degrade to a warning — never stop to ask the user. After each phase, update engine state.

## Skill Loading

Before Phase 2, identify and load relevant skills automatically:
- Determine work type from the spec (backend, frontend, full-stack, infrastructure)
- Load matching skill(s): `Skill(ucai:backend)`, `Skill(ucai:frontend)`, `Skill(ucai:architect)`, `Skill(ucai:qa)`, `Skill(ucai:devops)`
- Apply skill guidance throughout all phases

---

## Phase 0: Setup

**Goal**: Parse arguments, set up isolation, load context.

**Actions**:
1. Initialize the ship pipeline: `echo '$ARGUMENTS' | Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/setup-ship.js" --stdin)`
2. Read the created state file `.claude/ucai-ship.local.md` to confirm setup
3. Unless `--no-worktree` was specified, enter a worktree for isolation:
   - Generate a branch name from the spec: `ship/<slug>-<timestamp>`
   - Use the worktree to isolate all changes from the user's working directory
4. Load project context (skip silently if files don't exist):
   - `.claude/project.md` — project vision, tech stack, constraints
   - `.claude/requirements.md` — backlog, build order
   - `CLAUDE.md` — project conventions
   - `tasks/lessons.md` — known patterns and past corrections
5. **Initialize engine**: `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/setup-ship-engine.js" --spec "$ARGUMENTS")`
6. **Update engine**: `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/update-engine.js" --pipeline ship --dep dep-ship-state-init --state complete --proof "state file created")`
7. Update ship state: set `phase: 0` complete

---

## Phase 1: Spec Resolution

**Goal**: Compile a concrete spec with acceptance criteria.

**Actions**:
1. Determine spec source (the setup script detected this in `spec_source` field):

   **If `frd`**: Read the FRD from `.claude/frds/<slug>.md`. Find the `## Milestones` section. Auto-select the FIRST incomplete milestone (one with unchecked `- [ ]` criteria). Note the milestone name, scope, and acceptance criteria. All subsequent work is scoped to this milestone only.

   **If `path`**: Read the referenced file as the full spec. Extract any acceptance criteria, requirements, or success conditions mentioned.

   **If `inline`**: The spec is the text itself. Generate a quick internal plan:
   - What needs to be built
   - Key acceptance criteria (infer from the spec — what would "done" look like?)
   - Architecture approach (choose the simplest viable approach)
   - Do NOT write an FRD file — hold the plan in context

2. Compile the **effective spec**:
   - Feature description (1-2 sentences)
   - Acceptance criteria (checkable list)
   - Architecture approach (brief)
   - Scope boundaries (what this does NOT include)

3. **Update engine**: `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/update-engine.js" --pipeline ship --dep dep-ship-spec-resolved --state complete --proof "<spec summary>")` and `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/update-engine.js" --pipeline ship --task task-ship-spec --state complete --phase 1)`
4. Update ship state: set `phase: 1`, set `milestone` if applicable

---

## Phase 2: Explore

**Gate check**: `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/engine-gates.js" --pipeline ship --task task-ship-explore)` — if `allowed: false`, auto-remedy (complete the prerequisite phase) before proceeding.

**Goal**: Map relevant codebase areas — fast.

**Actions**:
1. If FRD exists and has a `### Discovery` section with codebase findings: skip agent exploration entirely. Use the FRD data.

2. Otherwise, launch 2 explorer agents in parallel (in a SINGLE message):
   - **Agent 1** (ucai:explorer-haiku): "Map codebase patterns relevant to: [feature description]. Find: existing similar implementations, relevant utilities, integration points. Quick scan — focus on the 5-10 most relevant files."
   - **Agent 2** (ucai:explorer-haiku): "Map architecture for: [feature description]. Find: directory structure conventions, naming patterns, test file locations, config patterns."

3. Read the key files the agents identified (at minimum the top 3-5).

4. Compile a Codebase Map:
   - Key files to modify
   - Patterns to follow
   - Integration points
   - Test file locations and conventions

5. **Update engine**: `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/update-engine.js" --pipeline ship --dep dep-ship-codebase-mapped --state complete --proof "<file count> files mapped")` and `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/update-engine.js" --pipeline ship --task task-ship-explore --state complete --phase 2)`
6. Update ship state: set `phase: 2`

---

## Phase 3: Detect Infrastructure

**Goal**: Ensure the project has test/lint/format tools available for verification.

**Actions**:
1. Run infrastructure detection: `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/detect-infra.js")`
2. Parse the JSON output
3. Record detected commands in the ship state file by updating the frontmatter:
   - `test_cmd`: the test command (or null if none)
   - `lint_cmd`: the lint command (or null)
   - `format_cmd`: the format command (or null)

4. **If test framework is missing**:
   - Log warning: "No test framework detected — scaffolding minimal test infrastructure."
   - Based on detected stack, install the minimal test tool:
     - JS/TS: `npm install -D vitest` + create `vitest.config.ts` + add `"test": "vitest run"` to package.json
     - Python: ensure pytest is available + create `conftest.py`
     - Go/Rust: built-in, nothing to install
   - Create ONE example test for an existing function to validate the setup works
   - Re-run detection to confirm

5. **If linter/formatter is missing**: Note it but proceed — these are nice-to-have, not blockers.

6. **Update engine**: `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/update-engine.js" --pipeline ship --dep dep-ship-infra-detected --state complete --proof "<test_cmd>,<lint_cmd>,<format_cmd>")` and `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/update-engine.js" --pipeline ship --task task-ship-infra --state complete --phase 3)`
7. Update ship state: set `phase: 3`

---

## Phase 4: Implement

**Gate check**: `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/engine-gates.js" --pipeline ship --task task-ship-implement)` — if `allowed: false`, auto-remedy before proceeding.

**Goal**: Build the feature, milestone by milestone.

**Actions**:
1. If spec has milestones, iterate through remaining milestones sequentially. If no milestones, treat the entire spec as a single implementation pass.

2. For each milestone (or single pass):
   a. Review the acceptance criteria for this milestone
   b. Read the relevant files from the Codebase Map
   c. **Algorithm Audit (pre-flight)**: before writing, ask in order: (1) is this requirement load-bearing or aspirational — can we drop it? (2) for each new dependency or framework: can ~10 lines of vanilla logic do the job? (3) only after deletion, optimize. Reject "we need X because everyone uses X" — reason from the data structure's fundamentals, not analogy.
   d. Implement the feature following:
      - Project conventions from CLAUDE.md
      - Patterns from the loaded skill(s)
      - Lessons from tasks/lessons.md
      - Codebase patterns found in Phase 2
   e. Write tests alongside the implementation (TDD when practical, tests-after otherwise)
   f. After implementation is complete, create a git commit:
      - Stage specific files (not `git add -A`)
      - Commit message: concise description of what this milestone delivers
   g. **Immediately proceed to Phase 5 (Verify Loop) for this milestone**
   h. After verification passes, move to the next milestone

3. **Update engine**: `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/update-engine.js" --pipeline ship --dep dep-ship-code-implemented --state complete --proof "<commit hashes>")` and `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/update-engine.js" --pipeline ship --task task-ship-implement --state complete --phase 4)`
4. Update ship state: set `phase: 4`, update `milestone` as each completes

---

## Phase 5: Verify Loop

**Gate check**: `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/engine-gates.js" --pipeline ship --task task-ship-verify)` — if `allowed: false`, auto-remedy before proceeding.

**Goal**: Deterministically run tests and lint. Auto-fix failures. Loop until green or max attempts.

This phase runs AFTER EACH MILESTONE in Phase 4, not just once at the end.

**Actions**:

### Step 1: Run tests
1. Execute: `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/run-tests.js")`
2. Parse the JSON output
3. If `passed: true`: proceed to Step 2
4. If `passed: false`:
   a. Read the `output` field to identify failing tests
   b. Increment `fix_attempts` in ship state
   c. If `fix_attempts >= max_fix_attempts`:
      - Log: "Max fix attempts (N) reached. Proceeding with test failures."
      - Record the failures as warnings
      - Proceed to Step 2
   d. Fix the implementation or tests based on the error output
   e. Amend the milestone commit: `git add <files> && git commit --amend --no-edit`
   f. Go back to Step 1

### Step 2: Run formatter (if detected)
1. If `format_cmd` is set: run it on the changed files
2. If files changed after formatting: amend the commit

### Step 3: Run linter (if detected)
1. If `lint_cmd` is set: execute it
2. If lint fails:
   a. Increment `fix_attempts`
   b. If over max: log warning, proceed
   c. Fix lint issues
   d. Amend the commit
   e. Re-run linter
3. If lint passes: proceed

### Step 4: Reset
1. Reset `fix_attempts` to 0 in ship state (for next milestone)
2. **Update engine**: `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/update-engine.js" --pipeline ship --dep dep-ship-tests-pass --state complete --proof "<test summary>")` and (if lint passed) `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/update-engine.js" --pipeline ship --dep dep-ship-lint-pass --state complete --proof "<lint result>")` and (if format applied) `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/update-engine.js" --pipeline ship --dep dep-ship-format-applied --state complete --proof "formatted")` and `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/update-engine.js" --pipeline ship --task task-ship-verify --state complete --phase 5)`
3. Update ship state: set `phase: 5`

---

## Phase 6: Light Review

**Gate check**: `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/engine-gates.js" --pipeline ship --task task-ship-review)` — if `allowed: false`, auto-remedy before proceeding.

**Goal**: Quick automated review — catch obvious bugs before PR.

**Actions**:
1. Get the diff of all changes: `git diff main...HEAD` (or appropriate base branch)
2. Launch 1 reviewer agent:
   - Use `ucai:reviewer` (sonnet) — faster than opus, sufficient for a light pass
   - Prompt: "Review this diff for bugs, security issues, and correctness. Only report issues with confidence >= 90. Changed files: [list]. Diff: [diff summary]"
3. If critical issues found (confidence >= 90):
   a. Auto-fix them
   b. Amend the relevant commit
   c. Re-run the verify loop (Phase 5) once more
4. If only minor issues: log them in the PR description as "Known minor issues"
5. If FRD milestone exists, mark all acceptance criteria checkboxes as `[x]`
6. **Update engine**: `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/update-engine.js" --pipeline ship --dep dep-ship-review-clean --state complete --proof "<review summary>")` and `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/update-engine.js" --pipeline ship --task task-ship-review --state complete --phase 6)`
7. Update ship state: set `phase: 6`

---

## Phase 7: Create PR

**Gate check**: `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/engine-gates.js" --pipeline ship --task task-ship-pr)` — note warnings but proceed (ship is autonomous).

**Goal**: Push changes and create a pull request.

**Actions**:
1. If `no_pr` is set in ship state: skip to Phase 8

2. Ensure all changes are committed (should already be from Phase 4/5)

3. Push the branch:
   ```
   git push -u origin HEAD
   ```

4. Create the PR using `gh`:
   - Title: derived from spec/milestone name (under 70 chars)
   - Body structure:
     ```
     ## Summary
     [1-3 bullet points describing what was built]

     ## Acceptance Criteria
     [Checked list from the spec]

     ## Test Results
     [Test command + pass/fail + summary line]

     ## Known Issues
     [Any warnings from verify loop, minor review findings]

     ---
     Shipped autonomously by Ucai /ship
     ```

5. If `ci_watch` is enabled:
   a. Poll CI status: `gh pr checks` every 30 seconds
   b. Timeout after 10 minutes
   c. If CI fails:
      - Read failure logs: `gh pr checks --json name,status,conclusion`
      - Attempt to fix the CI failure
      - Commit, push, re-poll
      - Max 3 CI fix attempts
   d. If CI passes: log success

6. **Update engine**: `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/update-engine.js" --pipeline ship --dep dep-ship-pr-created --state complete --proof "<PR URL or 'skipped'>")` and `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/update-engine.js" --pipeline ship --task task-ship-pr --state complete --phase 7)`
7. Update ship state: set `phase: 7`

---

## Phase 8: Cleanup & Report

**Goal**: Update project state, capture lessons, exit cleanly.

**Actions**:
1. **Update FRD** (if applicable):
   - Mark the completed milestone's acceptance criteria as `[x]`
   - Check if all milestones are now complete
   - If more remain: note "Remaining milestones: [list]"

2. **Update requirements** (if `.claude/requirements.md` exists):
   - Find the feature in the backlog
   - Mark completed requirement checkboxes as `[x]`

3. **Capture lessons** (if any corrections occurred during the pipeline):
   - Append to `tasks/lessons.md` with the standard format:
     ```
     ## YYYY-MM-DD — <lesson title>
     **Context**: What happened during /ship
     **Root cause**: Why the fix was needed
     **Rule**: Pattern to apply in future
     ```

4. **Consolidate lessons** (if `tasks/lessons.md` has >100 entries):
   - Run: `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/consolidate-lessons.js")`
   - If output is valid, overwrite `tasks/lessons.md` with consolidated content

5. **Finalize engine**: Update remaining deps and task:
   - `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/update-engine.js" --pipeline ship --dep dep-ship-frd-updated --state complete --proof "<FRD update summary or 'no FRD'>")`
   - `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/update-engine.js" --pipeline ship --dep dep-ship-requirements-updated --state complete --proof "<requirements update or 'none'>")`
   - `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/update-engine.js" --pipeline ship --dep dep-ship-lessons-captured --state complete --proof "<lesson count or 'none'>")`
   - `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/update-engine.js" --pipeline ship --task task-ship-cleanup --state complete --phase 8)`
6. **Delete ship state**: Remove `.claude/ucai-ship.local.md`
   - Engine state file (`.claude/ucai-ship-engine.local.json`) will be cleaned up by the SessionEnd hook.

6. **Print summary**:
   ```
   ✓ Ship pipeline complete

   Feature: [spec summary]
   Milestone: [milestone name, if applicable]
   Commits: [N commits]
   Tests: [pass/fail summary]
   PR: [URL or "skipped"]
   CI: [pass/fail/not watched]

   Remaining milestones: [list or "none — feature complete"]
   ```

---

## Error Recovery

If the pipeline encounters an unrecoverable error at any phase:
1. Do NOT silently fail — report exactly what happened and at which phase
2. Leave the ship state file intact (the Stop hook will attempt to resume)
3. If in a worktree, keep it (user can inspect the partial work)
4. Suggest: "The ship pipeline failed at Phase N. You can: (a) fix the issue and re-run `/ship`, (b) switch to `/build` for guided development, or (c) inspect the worktree at [path]."

---

## Stop Hook Integration

The Stop hook reads `.claude/ucai-ship.local.md` and blocks session exit if the pipeline is not complete (phase < 8). It feeds back a phase-aware continuation prompt so the pipeline resumes where it left off.

If the session context gets compacted, the PreCompact hook preserves the ship state (phase, milestone, fix attempts) so the pipeline can continue seamlessly.

You should update the `phase` field in `.claude/ucai-ship.local.md` as you complete each phase. This is how the Stop hook knows where to resume.

To update the phase, read the file, replace the `phase: N` line, and write it back.
