---
description: Structured debugging with parallel investigation agents
argument-hint: Bug description or error message
disable-model-invocation: true
---

# Debugging

You are helping a developer trace and fix a bug. This command uses parallel investigation agents to find the root cause, then proposes a targeted fix in a single approval gate before autonomous execution.

## Core Principles

- **Investigate before guessing**: Launch agents to trace the error, not assume the cause
- **Evidence-based diagnosis**: Every root cause claim needs file:line references
- **Minimal fix**: Address the root cause, not symptoms. Keep changes small
- **Single approval gate**: Diagnosis and fix plan are approved together; execution is autonomous after approval
- **Track progress**: Write and update `tasks/todo.md` to track phase completion
- **Sequential todo updates**: Mark each phase complete in `tasks/todo.md` immediately when it finishes. Never batch-mark multiple phases at once.

## Skill Loading — MANDATORY

Before starting investigation, you MUST load relevant skills based on the bug's domain.

1. Determine where the bug lives: backend, frontend, infrastructure, etc.
2. Load the matching skill: `Skill(ucai:backend)`, `Skill(ucai:frontend)`, `Skill(ucai:devops)`, etc.
3. If unclear, load `Skill(ucai:architect)` as a general-purpose choice

**You MUST load at least one skill before proceeding. State which skill(s) you loaded and why.**

---

## Phase 1: Understand

**Goal**: Know what's broken.

Input: $ARGUMENTS

**Persistent task tracking**: Write `tasks/todo.md` with the debug plan:
```yaml
---
updated: YYYY-MM-DD
command: /debug
feature: <bug-description>
---
```
Body: `## Phase N` sections with `- [ ]` items for each step. Create the `tasks/` directory if it doesn't exist. Overwrite any previous `tasks/todo.md`.

**Lessons loading**: If `tasks/lessons.md` exists, read it and note any patterns relevant to the current bug. Apply known patterns proactively throughout the debug session. If the file doesn't exist, skip silently.

**Actions**:
1. Create todo list with all phases (1–5)
2. Write `tasks/todo.md` with YAML frontmatter and checkable phase items (one `- [ ]` per phase)
3. If `tasks/lessons.md` exists, load it and note relevant patterns
4. **Load project context** (if available):
   - Check `.claude/project.md` — read for tech stack and constraints
   - Check `CLAUDE.md` — read for project conventions
5. Parse the bug report from `$ARGUMENTS`:
   - Is there a stack trace or error message?
   - Is there a specific file or function mentioned?
   - Is this a runtime error, wrong behavior, or performance issue?
6. If the bug is vague, ask:
   - When does it happen? (always, sometimes, specific conditions)
   - Steps to reproduce?
   - Expected vs actual behavior?
   - Any recent changes that might have caused it?
7. Summarize understanding and confirm with user
8. Mark Phase 1 complete in `tasks/todo.md`

---

## Phase 2: Investigate

**Goal**: Gather evidence from the codebase and git history.

**MANDATORY**: You MUST use the Task tool to launch explorer agents. Do NOT skip agents and investigate yourself.

**Actions**:
1. Launch 3 `ucai:explorer-opus` agents in parallel using the Task tool. Prefix each Task description with `[opus]`:

   - **Error tracing** (max_turns: 30): "[opus] Level: thorough. Trace this error through the codebase: [error/bug description]. Start from [error location/stack trace if available]. Follow the call chain — function calls, imports, data flow. Identify where the failure originates. Return 5-10 key files with file:line references and a call chain summary."

   - **Recent changes** (max_turns: 20): "[opus] Level: medium. Investigate recent changes that could have caused [bug]. Run `git log --oneline -20` to see recent commits. Use `git diff HEAD~5` to see what changed. Use Grep to find the function/module involved and check `git log -p --follow` on suspect files. Return a timeline of relevant changes with commit hashes."

   - **Working comparisons** (max_turns: 20): "[opus] Level: medium. Find similar patterns in this codebase that work correctly. The broken behavior is: [bug description]. Search for analogous code paths that handle similar logic successfully. Compare the working implementation with the broken one. Identify what differs. Return 5-10 key files with file:line references."

   Include project context (tech stack, conventions) in each agent's prompt if available.

2. **Wait for all agents to complete** before proceeding
3. Read all key files identified by agents
4. **Synthesize agent findings**: Cross-reference the three investigation threads. Where findings converge (multiple agents point to the same code/cause), treat as high confidence. Where they diverge, investigate the conflicting evidence further before presenting.
5. Present a consolidated investigation summary
5. Mark Phase 2 complete in `tasks/todo.md`

---

## Phase 3: Diagnose & Propose Fix

**Goal**: Identify the root cause with evidence AND propose the fix — single approval gate.

**Actions**:
1. Consolidate agent findings into a diagnosis:
   - **Root cause**: What is actually broken and why (with file:line references)
   - **Evidence trail**: The chain of evidence — files, lines, git commits that support the diagnosis
   - **Mechanism**: Why this root cause produces the observed behavior
   - **Security impact**: Does this bug have security implications? (e.g., exposes sensitive data, bypasses auth, enables injection — if yes, flag it explicitly)
2. If multiple potential causes exist, rank by likelihood and explain the reasoning
3. Propose the fix alongside the diagnosis:
   - Which files to change
   - What the change is (conceptually)
   - Why this fixes the root cause
   - Any risks or side effects
   - **Pathological Honesty**: enumerate 3-6 concrete ways the fix can still break — race conditions, edge inputs, scale cliffs, cascade failures, operator misuse, stale assumptions. Real failure modes, not theoretical ones. If you cannot list at least 3, you have not understood the fix yet.
4. Present the diagnosis AND fix plan together:
   - Root cause explanation (clear, non-technical where possible)
   - Evidence trail (file:line references, git commits)
   - Why this causes what the user is seeing
   - Proposed fix and its rationale
5. **THIS IS THE ONLY APPROVAL GATE** — ask: "Does this diagnosis match, and shall I proceed with the fix?"
6. **DO NOT PROCEED WITHOUT USER CONFIRMATION**
7. After user confirms, mark Phase 3 complete in `tasks/todo.md`

---

## Phase 4: Fix

**Goal**: Apply the approved fix autonomously.

**PREREQUISITE**: User approved the diagnosis and fix plan in Phase 3. No second approval gate — execute.

**Actions**:
1. Implement the fix as proposed in Phase 3
2. Keep the fix minimal — address the root cause, not symptoms
   - If the bug had security implications, confirm the fix closes the vector and does not introduce a new one
3. Follow codebase conventions from CLAUDE.md
4. Mark Phase 4 complete in `tasks/todo.md`

---

## Phase 5: Verify & Capture

**Goal**: Confirm the fix is correct, write regression tests, and capture lessons learned.

**MANDATORY**: Load `Skill(ucai:qa)` — every bug fix should have a regression test that prevents recurrence.

**Actions**:
1. Load `Skill(ucai:qa)` — apply its guidance for regression test design
2. **Write regression test(s)** before launching review agents:
   - Write a test that would have caught this bug (fails without fix, passes with fix)
   - Match the project's existing test framework and conventions
   - If no test infrastructure exists, set it up following the tech stack
   - Run the test(s) — they must pass before proceeding
3. Launch 2 agents in parallel using the Task tool:

   - **Verifier** (`ucai:verifier`, sonnet): "[sonnet] Verify that this fix resolves the bug without introducing regressions. The bug was: [description]. The root cause was: [diagnosis]. The fix was: [changes made]. Check the changed files, trace the execution path, and confirm the fix addresses the root cause. Look for edge cases the fix might miss."

   - **Reviewer** (`ucai:reviewer`, sonnet): "[sonnet] Review this debug fix for code quality, conventions compliance, and potential side effects. The changed files are: [list]. Check for: correctness, style consistency with the codebase, error handling, and any unintended consequences."

4. **Wait for all agents to complete**
5. Present findings to user
6. If issues found, ask user which to address
7. Apply any agreed fixes
6. **Lessons capture**: If the root cause was non-obvious or corrections occurred during this debug session:
   - Append to `tasks/lessons.md` with format:
     ```
     ## YYYY-MM-DD — <short title>

     **Context**: What were you debugging?
     **Root cause**: Why was the bug non-obvious or what correction was needed?
     **Rule**: What should you remember for future debug sessions?
     ```
   - Increment the `count` field in the YAML frontmatter (if `count` is missing, add `count: 1` before incrementing)
   - If `tasks/lessons.md` doesn't exist, create it with frontmatter (`count: 1`) and the entry
   - If the root cause was straightforward and no corrections occurred, skip silently
7. Mark Phase 5 complete in `tasks/todo.md`
8. Summarize: what was broken, why, what was fixed, files changed
