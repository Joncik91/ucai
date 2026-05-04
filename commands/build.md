---
description: Guided feature development with approval gates at each phase
argument-hint: Feature description
disable-model-invocation: true
---

# Feature Development

You are helping a developer implement a new feature. Follow a systematic approach: understand deeply, design with options, get approval, build, verify with agents, then have the user manually test before marking done.

## Core Principles

- **Ask, don't assume**: Identify all ambiguities and ask. Wait for answers.
- **Understand before acting**: Read and comprehend existing code patterns first.
- **Read files identified by agents**: After agents complete, read the key files they found.
- **Simple and elegant**: Prioritize readable, maintainable code.
- **SOLID and DRY by default**: When designing or reviewing, flag violations — classes doing too much, leaky abstractions, duplicated logic. These are architecture concerns, not style preferences.
- **Security by default**: Validate inputs at system boundaries, never trust user-supplied data, avoid exposing sensitive data in logs or errors. Flag security implications during design and review — not as an afterthought.
- **Track progress**: Write and update `tasks/todo.md` to track phase completion.
- **Sequential todo updates**: Mark each phase complete in `tasks/todo.md` immediately when it finishes. Never batch-mark multiple phases at once.
- **Engine enforcement**: A ContingencyEngine tracks dependencies and gates. Before each phase, check gates. After each phase, update engine state. If a gate blocks, do NOT proceed — complete the prerequisite first.

## Skill Loading — MANDATORY

Before starting Phase 2, you MUST identify and load relevant skills. This is not optional.

1. Determine the type of work: backend/API, frontend/UI, architecture, testing, DevOps, code review
2. Load the matching skill using the Skill tool: `Skill(ucai:backend)`, `Skill(ucai:frontend)`, `Skill(ucai:architect)`, `Skill(ucai:qa)`, `Skill(ucai:devops)`, `Skill(ucai:code-reviewer)`
3. Apply the skill's guidance throughout all subsequent phases
4. If the work spans multiple domains (e.g., full-stack), load multiple skills

**You MUST load at least one skill before proceeding. State which skill(s) you loaded and why.**

---

## Phase 1: Understand

**Goal**: Know what needs to be built.

Feature request: $ARGUMENTS

**Spec chain loading**: Load all available project context in order:

1. **Project spec**: Check if `.claude/project.md` exists. If found, read it and summarize the project vision, constraints, and tech stack to the user.
2. **Requirements backlog**: Check if `.claude/requirements.md` exists. If found, read it and show backlog status (how many features done vs remaining). Confirm this feature is in the backlog.
   - **Build order check**: Read the `## Build Order` section. Identify which step this build corresponds to (match by name or covered features). Note which requirement checkboxes this step covers — you will mark ALL of them in Phase 8. If prior steps have uncompleted requirements, warn the user: "Step N depends on step M, which has uncompleted requirements: [list]. Proceed anyway?" Do not block — the user may have reasons.
3. **Feature FRD**: Generate a slug from `$ARGUMENTS` (lowercase, strip leading verbs like add/implement/create/build, replace non-alphanumeric with hyphens). Check for FRD at:
   - First: `.claude/frds/<slug>.md`
   - Fallback: `.claude/prd.md` (legacy single-file format)
   - If found, read and summarize it to the user.
4. **Milestone selection**: If an FRD was found, find the `## Milestones` section.
   - List all milestones with their name, scope summary, and completion status (`- [ ]` = pending, `- [x]` = done)
   - Skip milestones that are already fully complete (all criteria checked)
   - Ask: "Which milestone do you want to build? [list remaining milestones with scope]"
   - **Wait for user to select a milestone**
   - Note the selected milestone's name, scope, and acceptance criteria — throughout phases 2–8, scope all work to this milestone only. Do not implement or review code outside its defined scope.
5. **Capture acceptance criteria**: If a milestone was selected, its acceptance criteria are the verification target for Phase 6. If no FRD exists, ask: "What would 'done' look like for this feature? List 2-4 testable criteria." Record them in `tasks/todo.md`.
6. Ask: "I found [list specs found]. Should I use these as context for this build?"

If the user confirms:
- Phase 2 (Explore): Light validation (1 haiku explorer) if FRD has Discovery section
- Phase 3 (Clarify): Only clarify gaps not covered by FRD Requirements
- Phase 4 (Design): Skip architect agents if FRD has Architecture section
- Phase 6 (Verify): Use FRD's Acceptance Criteria for verification

If the user declines, proceed with $ARGUMENTS only.

**Persistent task tracking**: Write `tasks/todo.md` with the build plan:
```yaml
---
updated: YYYY-MM-DD
command: /build
feature: <feature-name>
---
```
Body: `## Phase N` sections with `- [ ]` items for each step. Create the `tasks/` directory if it doesn't exist. Overwrite any previous `tasks/todo.md`.

**Lessons loading**: If `tasks/lessons.md` exists, read it and note any patterns relevant to the current feature. Apply known patterns proactively throughout the build. If the file doesn't exist, skip silently.

**Actions**:
1. **Initialize engine**: `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/setup-build-engine.js" --feature "$ARGUMENTS")` — creates the ContingencyEngine with all dependencies, tasks, and logic gates.
2. Create todo list with all phases
3. Write `tasks/todo.md` with YAML frontmatter and checkable phase items (one `- [ ]` per phase)
4. If `tasks/lessons.md` exists, load it and note relevant patterns
5. If the feature is unclear, ask:
   - What problem does this solve?
   - What should it do?
   - Any constraints or requirements?
6. Summarize understanding and confirm with user
7. **Update engine** (run each):
   - `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/update-engine.js" --pipeline build --dep dep-spec-chain --state complete --proof "<specs loaded summary>")`
   - `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/update-engine.js" --pipeline build --dep dep-milestone-selected --state complete --proof "<milestone name or 'no FRD'>")`
   - `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/update-engine.js" --pipeline build --dep dep-acceptance-criteria --state complete --proof "<criteria count>")`
   - `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/update-engine.js" --pipeline build --task task-understand --state complete --phase 1)`
8. Mark Phase 1 complete in `tasks/todo.md`

---

## Phase 2: Explore

**Gate check**: `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/engine-gates.js" --pipeline build --task task-explore)` — if `allowed: false`, report blockers and complete prerequisites first.

**Goal**: Map the relevant codebase.

**Output**: Compile a **Codebase Map** — you will paste this into Phase 4 and Phase 6 agent prompts:
```
Codebase Map:
- Key files: [file:line — role], [file:line — role], ...
- Architecture: [patterns, layers, abstractions]
- Integration points: [where new code connects to existing code]
- Testing: [framework, test file locations, conventions]
- Conventions: [naming, structure, error handling rules]
```

### If FRD Covers Discovery AND User Explicitly Opts In to Fast-Track

(e.g., "skip exploration, FRD is enough", "go straight to build")

**Skip the phase.** Compile the Codebase Map directly from the FRD's `## Discovery` section — no explorer agents. Update the engine with proof: `"fast-track skip: FRD Discovery"`. Also set: `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/update-engine.js" --pipeline build --dep dep-fast-track-mode --state complete --proof "user: '<their exact words>'")`. Note: the user is taking responsibility for any gaps the agents would have surfaced.

### If FRD Exists with Discovery Section

**LIGHT VALIDATION** — run 1 quick explorer to spot-check FRD findings, not full discovery.

**Actions**:
1. Read the FRD's `## Discovery` section (you already loaded it in Phase 1)
2. Launch 1 `ucai:explorer-haiku` agent for validation:
   - "[haiku] Level: quick. Do NOT use WebSearch. Validate these FRD findings for [feature]: [list 3-5 key patterns/files from FRD Discovery]. Confirm they still exist in the codebase and note any discrepancies."
3. If validation finds discrepancies → report them, ask user whether to proceed or re-run full discovery
4. If validation passes → compile Codebase Map from FRD findings

### If No FRD or FRD Lacks Discovery

**MANDATORY**: You MUST use the Task tool to launch explorer agents. Do NOT skip agents and read files yourself — agents provide parallel, thorough exploration that you cannot replicate in a single pass.

**Actions**:
1. Ask the user: "How deep should the codebase exploration be? **quick** (haiku, ~8 calls, fast) / **medium** (sonnet, ~15 calls, balanced) / **thorough** (sonnet, ~25 calls, comprehensive) [default: medium]" — wait for answer. Use `ucai:explorer-haiku` (quick, max_turns: 12) or `ucai:explorer` (medium/thorough, max_turns: 20/30). Prefix each Task description with `[haiku]` (quick) or `[sonnet]` (medium/thorough).
2. Launch 2-3 explorer agents in parallel using the Task tool, each targeting a different aspect:
   - "[model] Level: [chosen]. Find features similar to [feature] and trace their implementation"
   - "[model] Level: [chosen]. Map the architecture and abstractions for [relevant area]"
   - "[model] Level: [chosen]. Identify testing approaches, extension points, or patterns relevant to [feature]"

   Each agent should return a list of 5-10 key files.

3. **Wait for all agents to complete** before proceeding
4. After agents return, read all identified files yourself
5. Present comprehensive summary of findings
6. Compile Codebase Map from agent findings

**On completion**:
1. **Update engine**: `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/update-engine.js" --pipeline build --dep dep-skills-loaded --state complete --proof "<skill names>")` and `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/update-engine.js" --pipeline build --dep dep-codebase-map --state complete --proof "<key file count> files mapped")` and `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/update-engine.js" --pipeline build --task task-explore --state complete --phase 2)`
2. Mark Phase 2 complete in `tasks/todo.md`.

---

## Phase 3: Clarify

**Gate check**: `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/engine-gates.js" --pipeline build --task task-clarify)` — if `allowed: false`, report blockers and complete prerequisites first.

**Goal**: Resolve all ambiguities before designing.

**CRITICAL**: Do not skip this phase.

### If FRD Covers Requirements AND User Explicitly Opts In to Fast-Track

(e.g., "skip clarification, FRD is enough", "go straight to build")

**Skip the phase.** Mark clarifications resolved using the FRD's Requirements section as the source. Update the engine with proof: `"fast-track skip: FRD Requirements"`. Also set: `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/update-engine.js" --pipeline build --dep dep-fast-track-mode --state complete --proof "user: '<their exact words>'")` (no-op if already set in Phase 2). Note: the user is taking responsibility for any gaps the agents would have surfaced.

### If FRD Exists with Requirements Section

**Only clarify gaps** — the FRD already defines requirements.

**Actions**:
1. Review the FRD's `## Requirements` section
2. Identify any gaps or changes since the FRD was written:
   - New edge cases discovered during exploration
   - Requirements that seem incomplete or contradictory
   - Implementation details the FRD left unspecified
3. If no gaps: "The FRD covers requirements. No clarifications needed — proceeding to design."
4. If gaps exist: present only those questions, not a full requirements review

### If No FRD or FRD Lacks Requirements

**Actions**:
1. Review codebase findings and feature request
2. Identify underspecified aspects: edge cases, error handling, integration points, scope, design preferences, backward compatibility, performance
3. Present all questions in a clear, organized list
4. **Wait for answers before proceeding**

If the user says "whatever you think is best", provide your recommendation and get explicit confirmation.

**On completion**:
1. **Update engine**: `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/update-engine.js" --pipeline build --dep dep-clarifications --state complete --proof "<clarification summary>")` and `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/update-engine.js" --pipeline build --task task-clarify --state complete --phase 3)`
2. Mark Phase 3 complete in `tasks/todo.md`.

**Transition to Phase 4**: Carry forward the Codebase Map (Phase 2) and all clarification answers (Phase 3). Both feed into architect agent prompts.

---

## Phase 4: Design

**Gate check**: `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/engine-gates.js" --pipeline build --task task-design)` — if `allowed: false`, report blockers and complete prerequisites first.

**Goal**: Present architecture options with trade-offs.

### If FRD Covers Architecture AND User Explicitly Opts In to Fast-Track

(e.g., "skip design, FRD is enough", "go straight to build")

**Skip the phase.** Accept the FRD's `## Architecture` section as the approved design — no architect agents. Update the engine with proof: `"fast-track skip: FRD Architecture"`. Also set: `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/update-engine.js" --pipeline build --dep dep-fast-track-mode --state complete --proof "user: '<their exact words>'")` (no-op if already set). Note: the user is taking responsibility for any gaps the agents would have surfaced.

### If FRD Exists with Architecture Section

**SKIP ARCHITECT AGENTS** — the FRD already contains architecture decisions.

**Actions**:
1. Review the FRD's `## Architecture` section (already loaded in Phase 1)
2. Verify it covers: key components, data flow, integration points, files to create/modify
3. Check if Data Model, API Surface, UI Structure, or Security Notes sections apply (they're conditional in the FRD)
4. Present the architecture summary to the user:
   - "The FRD defines this architecture: [brief summary]. Key decisions: [list 2-3]. Proceed with this design?"
5. **Wait for user confirmation** — if they want alternatives, fall back to spawning architects below

### If No FRD or FRD Lacks Architecture

**Actions**:
1. Launch 2-3 `ucai:architect` agents in parallel using the Task tool. Prefix each Task description with `[opus]`. Include the Codebase Map compiled in Phase 2 in each prompt:
   - "[opus] Minimal changes: design [feature] using the smallest change, maximizing reuse. [paste Codebase Map]"
   - "[opus] Clean architecture: design [feature] prioritizing maintainability and elegant abstractions. [paste Codebase Map]"
   - "[opus] Pragmatic balance: design [feature] balancing speed and quality. [paste Codebase Map]"
2. Review all approaches and form your recommendation
3. Present to user: brief summary of each, trade-offs, your recommendation with reasoning
4. **Ask user which approach they prefer**

**On completion**:
1. **Update engine**: `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/update-engine.js" --pipeline build --dep dep-architecture-approved --state complete --proof "<chosen approach>")` and `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/update-engine.js" --pipeline build --task task-design --state complete --phase 4)`
2. Mark Phase 4 complete in `tasks/todo.md`.

---

## Phase 5: Build

**Gate check**: `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/engine-gates.js" --pipeline build --task task-build)` — if `allowed: false`, report blockers and complete prerequisites first.

**Goal**: Implement the feature.

<HARD-GATE>
DO NOT start writing code until the user says to proceed.
Phase 4 design approval is NOT implementation approval — you must ask separately:
"Ready to implement the [chosen approach] design? Say 'go' to start coding."
</HARD-GATE>

**Actions**:
1. Read all relevant files identified in previous phases
2. If this feature will require tests (most do), load `Skill(ucai:qa)` now — its testing patterns inform how you structure the implementation for testability. This is not redundant with Phase 7; early loading ensures the code is test-friendly.
3. **Algorithm Audit** (pre-flight, always runs — before writing any code): Ask in order: (1) Is this requirement load-bearing or aspirational — can we drop it? (2) For each new dependency or framework: can we get the same result with ~10 lines of vanilla logic? (3) Only after deleting, optimize. Reject "we need X because everyone uses X" — reason from the data structure's fundamentals, not analogy.
4. Implement following the chosen architecture, strictly following codebase conventions
5. **Elegance checkpoint** (non-trivial changes only — >50 lines of new code OR >3 files modified):
   - Pause and ask: "Is there a more elegant way? Could this be simpler?"
   - Challenge your own implementation before proceeding — and pivot if the implementation reveals the design was wrong; don't defend code already written
   - Skip this checkpoint for simple, obvious fixes — don't over-engineer
6. **Update engine**: `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/update-engine.js" --pipeline build --dep dep-implementation-go --state complete --proof "user confirmed go")` and `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/update-engine.js" --pipeline build --dep dep-code-implemented --state complete --proof "<commit hash>")` and `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/update-engine.js" --pipeline build --task task-build --state complete --phase 5)`
7. Mark Phase 5 complete in `tasks/todo.md`

**Transition to Phase 6**: Implementation is complete. All changed files are candidates for verification. Carry forward the acceptance criteria (Phase 1) and Codebase Map (Phase 2).

---

## Phase 6: Verify

**Gate check**: `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/engine-gates.js" --pipeline build --task task-verify)` — if `allowed: false`, report blockers and complete prerequisites first.

**Goal**: Ensure the implementation meets requirements.

**Actions**:
1. **Staff engineer self-check** — before launching agents, honestly assess your own work:
   - **Abstraction level**: Is this the right level? Too clever? Too flat?
   - **Shortcuts**: Did I take any? Are they justified or lazy?
   - **Integration quality**: Does this fit naturally into the existing codebase? Any rough edges?
   - **Error paths**: Are failure modes handled? What happens when things go wrong?
   - If you find issues, fix them before running agents — don't waste agent cycles on known problems.
2. Launch all 3 agents simultaneously in a single Task tool message (not sequentially):
   - `ucai:verifier`: acceptance criteria from Phase 1 (or FRD if loaded). Include the Codebase Map from Phase 2.
   - `ucai:reviewer`: focus on bugs and functional correctness. Include the Codebase Map from Phase 2.
   - `ucai:reviewer-opus`: focus on conventions, code quality, SOLID principle adherence, and DRY violations. Include the Codebase Map from Phase 2.
3. **Wait for all 3 to complete**, then consolidate findings into a severity-ranked list:
   - For each issue: note which agent(s) flagged it, file:line, severity (must-fix / should-fix / optional)
   - Where agents disagree (e.g., one flags an issue, another doesn't), note the disagreement — these get elevated to the user for decision
4. **Present findings to user**: fix now, fix later, or proceed as-is
5. Address issues based on user decision
6. **If fixes were applied, re-run all 3 agents in parallel on the changed files** — fixes can introduce new issues. Repeat steps 2-5 until clean or user approves remaining items.
7. **Update engine**: `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/update-engine.js" --pipeline build --dep dep-agents-reviewed --state complete --proof "<issue count> findings")` and `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/update-engine.js" --pipeline build --dep dep-issues-resolved --state complete --proof "<resolution summary>")` and `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/update-engine.js" --pipeline build --task task-verify --state complete --phase 6)`
8. Mark Phase 6 complete in `tasks/todo.md`

---

## Phase 7: Test

**Gate check**: `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/engine-gates.js" --pipeline build --task task-test)` — if `allowed: false`, report blockers and complete prerequisites first.

**Goal**: Write automated tests AND have the user manually verify.

**CRITICAL**: This phase is mandatory. No agent review can replace a human testing the actual software. Automated tests ensure the feature stays working after future changes.

**MANDATORY**: Ensure `Skill(ucai:qa)` is loaded (it should already be from Phase 5). Apply its guidance for test type selection and patterns.

### Step A: Automated Tests

**Author/reviewer separation**: tests are written by a subagent (not by the implementing agent) and reviewed by a different agent against the qa skill's Anti-Gaming Verdicts. This mirrors Phase 6's production-code separation pattern.

**Actions**:
1. Confirm `Skill(ucai:qa)` is loaded — if not, load it now
2. Determine the right test type(s) for this feature:
   - **Unit tests**: Pure logic, utilities, data transformations
   - **Integration tests**: API endpoints, database queries, service interactions
   - **E2E tests**: User-facing workflows, critical paths
   - Match test type to what was built — don't write unit tests for glue code or E2E tests for a utility function
3. Check for existing test infrastructure:
   - Test framework already in use? (Jest, Vitest, Playwright, pytest, etc.)
   - Test file conventions? (`*.test.ts`, `*.spec.ts`, `__tests__/`, etc.)
   - If no test infrastructure exists, set it up following the project's tech stack
4. **Authorship — spawn a Task subagent** (`subagent_type: general-purpose`, sonnet). The implementing agent does *not* write test files. Prompt embeds: production files written in Phase 5 with paths, acceptance criteria from Phase 1, the project's test framework + file conventions from step 3, the test-type choice from step 2, and an instruction to load `Skill(ucai:qa)` and self-check against its Anti-Gaming Verdicts before returning. Subagent must call the production target directly (no mocks of the function under test) and assert on real return values or exception types. Cover happy path, edge cases from Phase 3 (Clarify), and error paths.
   **Immediately after dispatching the author subagent** (before it completes), record the dispatch: `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/update-engine.js" --pipeline build --dep dep-test-author-spawned --state complete --proof "Task subagent dispatched for test authorship: <brief description of what tests it will write, e.g. 'unit tests for src/parser.js — happy path, null input, error path'>")`. The proof string must name the target file(s) and test scope — "ok" or a bare description without file references is not acceptable.
5. **Review gate — spawn a reviewer subagent** on the test files the author wrote. Default: `ucai:reviewer` (sonnet). Prompt embeds: the test files, the production target paths, and `Skill(ucai:qa)` reference; reviewer applies the Anti-Gaming Verdicts and flags any blocking matches with file:line.
6. **Iterate with escalation** if the reviewer flags blocking verdicts:
   - Retry 1: re-spawn the author subagent with the reviewer's verdict list as feedback. Re-run `ucai:reviewer` on the new tests.
   - Retry 2: if retry 1 still fails, escalate the review to `ucai:reviewer-opus` for a deeper read.
   - Halt only if opus also flags blocking verdicts. Surface the verdict list to the user for a call.
7. Run the tests — they must pass before proceeding. If tests fail, fix the implementation (not the tests — modifying tests to pass is a Pragma `mocked-away`/`semantic_gaming` trigger).

### Step B: Manual Testing

**Actions**:
1. Based on what was built, generate a **concrete test checklist**:
   - The exact command(s) to start or run the app
   - Specific actions to perform with expected results (e.g., "Run `bm add https://example.com` — should print confirmation with auto-fetched title")
   - Edge cases worth trying manually (things hard to automate)
2. If acceptance criteria exist (from FRD or Phase 3), map each criterion to a specific test action
3. Present the checklist to the user
4. **WAIT for the user to test and confirm it works**
5. If the user reports issues: fix them, update tests, re-run agent review on changed files (Phase 6 step 2), then return here with an updated checklist
6. Only proceed to Phase 8 after the user confirms testing passed

**Checklist principles**:
- **Concrete**: not "verify it works" but "run X, expect Y"
- **Includes startup**: tell the user exactly how to run the app
- **Proportional**: small utility = 3-4 checks, full feature = 8-10
- **No skipping**: agents said it's fine is not enough — the user must confirm

**On completion**:
1. **Update engine**: `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/update-engine.js" --pipeline build --dep dep-tests-written --state complete --proof "<test pass summary>")` and `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/update-engine.js" --pipeline build --dep dep-manual-test-passed --state complete --proof "user confirmed")` and `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/update-engine.js" --pipeline build --task task-test --state complete --phase 7)`
2. Mark Phase 7 complete in `tasks/todo.md`.

---

## Phase 8: Done

**Gate check**: `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/engine-gates.js" --pipeline build --task task-done)` — if `allowed: false`, report blockers and complete prerequisites first.

**Goal**: Document what was accomplished and keep project guidelines current.

**Actions**:
1. Mark Phase 8 complete in `tasks/todo.md`
2. Summarize:
   - What was built
   - Key decisions made
   - Files modified/created
   - Suggested next steps
3. **Lessons capture**: If corrections or non-obvious decisions occurred during this build:
   - Append to `tasks/lessons.md` with format:
     ```
     ## YYYY-MM-DD — <short title>

     **Context**: What were you working on?
     **Root cause**: Why did the issue arise or why was the decision non-obvious?
     **Rule**: What should you remember for future builds?
     ```
   - Increment the `count` field in the YAML frontmatter (if `count` is missing, add `count: 1` before incrementing)
   - If `tasks/lessons.md` doesn't exist, create it with frontmatter (`count: 1`) and the entry
   - If no corrections occurred and no non-obvious decisions were made, skip silently
4. **Requirements update**: If `.claude/requirements.md` exists:
   - Re-read `.claude/requirements.md` in full (do not rely on memory from earlier phases)
   - In the `## Build Order` section, find the step matching this build (match by step name or feature argument)
   - From the matching step's `covers:` field, extract each feature name (comma-separated after `covers:`)
   - For each feature name, scan the requirement sections (`## Must Have`, `## Should Have`, etc.) for a `- [ ]` line whose text contains that feature name (fuzzy match — the requirement line may have extra description after a `—`)
   - Collect every matching `- [ ]` line
   - Present the proposed changes to the user:
     ```
     Marking these requirements done in requirements.md:
     - [ ] Feature A  →  - [x] Feature A (completed YYYY-MM-DD)
     - [ ] Feature B  →  - [x] Feature B (completed YYYY-MM-DD)
     ```
   - **Wait for the user to confirm** ("yes", "ok", "looks good", etc.)
   - After confirmation, use the Edit tool to apply each change one at a time:
     - Replace `- [ ] [exact line text]` with `- [x] [exact line text] (completed YYYY-MM-DD)`
     - Replace the `updated:` value in the YAML frontmatter with today's date
   - Confirm: "Requirements updated in `.claude/requirements.md`"
   - If no matching lines are found, tell the user and skip silently
5. **Milestone update**: If a milestone was selected in Phase 1:
   - Re-read the FRD file in full (do not rely on memory — the file may have changed)
   - Find the selected milestone's `**Acceptance criteria**:` block
   - Collect all `- [ ]` criteria in that block
   - Present the proposed changes to the user:
     ```
     Marking M[N]: [Name] complete in .claude/frds/<slug>.md:
     - [ ] Criterion A  →  - [x] Criterion A
     - [ ] Criterion B  →  - [x] Criterion B
     ```
   - **Wait for user confirmation** before editing
   - After confirmation, use the Edit tool to mark each criterion done: `- [ ]` → `- [x]`
   - Count remaining milestones with unchecked criteria
   - If milestones remain: "M[N+1]: [name] is next. Run `/build [feature]` to continue."
   - If all milestones are complete: "All milestones complete — feature is done."
   - If no matching criteria are found, tell the user and skip silently
6. **CLAUDE.md refresh**: If a CLAUDE.md exists, check whether this feature introduced changes that should be reflected:
   - New architecture patterns or layers
   - New development commands (build, test, lint)
   - New key files or entry points
   - Changed conventions or dependencies
   - If updates are needed, present the proposed changes to the user and **wait for approval** before editing CLAUDE.md
   - If nothing meaningful changed, skip silently — do not update for trivial additions
7. **Finalize engine**: Update remaining deps and clean up:
   - `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/update-engine.js" --pipeline build --dep dep-lessons-captured --state complete --proof "<lesson count or 'none needed'>")`
   - `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/update-engine.js" --pipeline build --dep dep-requirements-updated --state complete --proof "<update summary or 'no requirements.md'>")`
   - `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/update-engine.js" --pipeline build --dep dep-milestone-updated --state complete --proof "<milestone summary or 'no FRD'>")`
   - `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/update-engine.js" --pipeline build --task task-done --state complete --phase 8)`
   - The engine state file (`.claude/ucai-build-engine.local.json`) will be cleaned up by the SessionEnd hook.

---

## Failure Recovery

If `/build` fails or is interrupted at any phase:

| Failed at | Recovery |
|-----------|----------|
| Phase 1-3 (Understand/Explore/Clarify) | Re-run `/build <feature>`. No code was written yet. |
| Phase 4 (Design) | Re-run `/build <feature>`. It will re-load the FRD and skip to the milestone you were on. |
| Phase 5 (Build) | Re-run `/build <feature>`, select same milestone. Read the partially-written code and continue. |
| Phase 6 (Verify) | Re-run `/build <feature>`, select same milestone. Skip to verification: "Code is already written — skip to Phase 6." |
| Phase 7 (Test) | Re-run `/build <feature>`. Tests may already exist. Run them and continue. |
| Phase 8 (Done) | Mark requirements manually in `.claude/requirements.md` if the auto-update didn't complete. |

`tasks/todo.md` persists between sessions. When you re-run `/build`, Phase 1 reads it and can see which phases were completed.
