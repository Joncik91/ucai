---
description: Feature development with exploration, design, and review
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
- **Track progress**: Use TodoWrite throughout.

## Skill Loading — MANDATORY

Before starting Phase 2, you MUST identify and load relevant skills. This is not optional.

1. Determine the type of work: backend/API, frontend/UI, architecture, testing, DevOps, code review
2. Load the matching skill using the Skill tool: `Skill(ucai:senior-backend)`, `Skill(ucai:senior-frontend)`, `Skill(ucai:senior-architect)`, `Skill(ucai:senior-qa)`, `Skill(ucai:senior-devops)`, `Skill(ucai:code-reviewer)`
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
4. **Agile mode check**: If an FRD was found and loaded, check its YAML frontmatter for `mode: agile`.
   - If `mode: agile` is present, find the `## Milestones` section in the FRD
   - List all milestones with their name, scope summary, and completion status (`- [ ]` = pending, `- [x]` = done)
   - Skip milestones that are already fully complete (all criteria checked)
   - Ask: "This FRD uses agile mode. Which milestone do you want to build next? [list remaining milestones]"
   - **Wait for user to select a milestone**
   - Note the selected milestone's name, scope, and acceptance criteria — throughout phases 2–8, scope all work to this milestone only. Do not implement or review code outside its defined scope.
5. Ask: "I found [list specs found]. Should I use these as context for this build?"

If the user confirms:
- Phase 2 (Explore): Use FRD's Discovery section as a starting point — focus agents on areas not already covered
- Phase 3 (Clarify): Use FRD's Requirements as the baseline — only clarify gaps or changes since the FRD was written
- Phase 4 (Design): Present FRD's Architecture as one option alongside architect-generated alternatives
- Phase 6 (Verify): Use FRD's Acceptance Criteria for verification

If the user declines, proceed with $ARGUMENTS only.

**Actions**:
1. Create todo list with all phases
2. If the feature is unclear, ask:
   - What problem does this solve?
   - What should it do?
   - Any constraints or requirements?
3. Summarize understanding and confirm with user

---

## Phase 2: Explore

**Goal**: Map the relevant codebase.

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
6. Compile a **Codebase Map** from agent findings — you will paste this into Phase 4 and Phase 6 agent prompts:
   ```
   Codebase Map:
   - Key files: [file:line — role], [file:line — role], ...
   - Architecture: [patterns, layers, abstractions]
   - Integration points: [where new code connects to existing code]
   - Testing: [framework, test file locations, conventions]
   - Conventions: [naming, structure, error handling rules]
   ```

---

## Phase 3: Clarify

**Goal**: Resolve all ambiguities before designing.

**CRITICAL**: Do not skip this phase.

**Actions**:
1. Review codebase findings and feature request
2. Identify underspecified aspects: edge cases, error handling, integration points, scope, design preferences, backward compatibility, performance
3. Present all questions in a clear, organized list
4. **Wait for answers before proceeding**

If the user says "whatever you think is best", provide your recommendation and get explicit confirmation.

---

## Phase 4: Design

**Goal**: Present architecture options with trade-offs.

**Actions**:
1. Launch 2-3 `ucai:architect` agents in parallel using the Task tool. Prefix each Task description with `[opus]`. Include the Codebase Map compiled in Phase 2 in each prompt:
   - "[opus] Minimal changes: design [feature] using the smallest change, maximizing reuse. [paste Codebase Map]"
   - "[opus] Clean architecture: design [feature] prioritizing maintainability and elegant abstractions. [paste Codebase Map]"
   - "[opus] Pragmatic balance: design [feature] balancing speed and quality. [paste Codebase Map]"
2. Review all approaches and form your recommendation
3. Present to user: brief summary of each, trade-offs, your recommendation with reasoning
4. **Ask user which approach they prefer**

---

## Phase 5: Build

**Goal**: Implement the feature.

<HARD-GATE>
DO NOT start writing code until the user explicitly approves the chosen approach.
Approval of the design in Phase 4 is NOT approval to begin implementation.
</HARD-GATE>

**Actions**:
1. Wait for explicit user approval of the chosen approach
2. Read all relevant files identified in previous phases
3. Implement following the chosen architecture
4. Follow codebase conventions strictly
5. Update todos as you progress

---

## Phase 6: Verify

**Goal**: Ensure the implementation meets requirements.

**Actions**:
1. Launch all 3 agents simultaneously in a single Task tool message (not sequentially):
   - `ucai:verifier`: acceptance criteria from Phase 1 (or FRD if loaded). Include the Codebase Map from Phase 2.
   - `ucai:reviewer`: focus on bugs and functional correctness. Include the Codebase Map from Phase 2.
   - `ucai:reviewer-opus`: focus on conventions, code quality, SOLID principle adherence, and DRY violations. Include the Codebase Map from Phase 2.
2. **Wait for all 3 to complete**, then consolidate findings and identify issues worth fixing
3. **Present findings to user**: fix now, fix later, or proceed as-is
4. Address issues based on user decision
5. **If fixes were applied, re-run all 3 agents in parallel on the changed files** — fixes can introduce new issues. Repeat steps 1-4 until clean or user approves remaining items.

---

## Phase 7: Test

**Goal**: The user manually verifies the feature works.

**CRITICAL**: This phase is mandatory. No agent review can replace a human testing the actual software.

**Actions**:
1. Based on what was built, generate a **concrete test checklist**:
   - The exact command(s) to start or run the app
   - Specific actions to perform with expected results (e.g., "Run `bm add https://example.com` — should print confirmation with auto-fetched title")
   - Edge cases worth trying manually
2. If acceptance criteria exist (from FRD or Phase 3), map each criterion to a specific test action
3. Present the checklist to the user
4. **WAIT for the user to test and confirm it works**
5. If the user reports issues: fix them, re-run agent review on changed files (Phase 6 step 2), then return here with an updated checklist
6. Only proceed to Phase 8 after the user confirms testing passed

**Checklist principles**:
- **Concrete**: not "verify it works" but "run X, expect Y"
- **Includes startup**: tell the user exactly how to run the app
- **Proportional**: small utility = 3-4 checks, full feature = 8-10
- **No skipping**: agents said it's fine is not enough — the user must confirm

---

## Phase 8: Done

**Goal**: Document what was accomplished and keep project guidelines current.

**Actions**:
1. Mark all todos complete
2. Summarize:
   - What was built
   - Key decisions made
   - Files modified/created
   - Suggested next steps
3. **Requirements update**: If `.claude/requirements.md` exists:
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
4. **Milestone update**: If the FRD had `mode: agile` and a milestone was selected in Phase 1:
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
5. **CLAUDE.md refresh**: If a CLAUDE.md exists, check whether this feature introduced changes that should be reflected:
   - New architecture patterns or layers
   - New development commands (build, test, lint)
   - New key files or entry points
   - Changed conventions or dependencies
   - If updates are needed, present the proposed changes to the user and **wait for approval** before editing CLAUDE.md
   - If nothing meaningful changed, skip silently — do not update for trivial additions
