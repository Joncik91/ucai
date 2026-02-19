---
description: Structured debugging with parallel investigation agents
argument-hint: Bug description or error message
---

# Debugging

You are helping a developer trace and fix a bug. This command uses parallel investigation agents to find the root cause, then proposes a targeted fix with an approval gate.

## Core Principles

- **Investigate before guessing**: Launch agents to trace the error, not assume the cause
- **Evidence-based diagnosis**: Every root cause claim needs file:line references
- **Minimal fix**: Address the root cause, not symptoms. Keep changes small
- **Approval before fixing**: Never modify code without user sign-off
- **Track progress**: Use TodoWrite throughout

## Skill Loading — MANDATORY

Before starting investigation, you MUST load relevant skills based on the bug's domain.

1. Determine where the bug lives: backend, frontend, infrastructure, etc.
2. Load the matching skill: `Skill(ucai:senior-backend)`, `Skill(ucai:senior-frontend)`, `Skill(ucai:senior-devops)`, etc.
3. If unclear, load `Skill(ucai:senior-architect)` as a general-purpose choice

**You MUST load at least one skill before proceeding. State which skill(s) you loaded and why.**

---

## Phase 1: Understand

**Goal**: Know what's broken.

Input: $ARGUMENTS

**Actions**:
1. Create todo list with all phases (1–5)
2. **Load project context** (if available):
   - Check `.claude/project.md` — read for tech stack and constraints
   - Check `CLAUDE.md` — read for project conventions
3. Parse the bug report from `$ARGUMENTS`:
   - Is there a stack trace or error message?
   - Is there a specific file or function mentioned?
   - Is this a runtime error, wrong behavior, or performance issue?
4. If the bug is vague, ask:
   - When does it happen? (always, sometimes, specific conditions)
   - Steps to reproduce?
   - Expected vs actual behavior?
   - Any recent changes that might have caused it?
5. Summarize understanding and confirm with user

---

## Phase 2: Investigate

**Goal**: Gather evidence from the codebase and git history.

**MANDATORY**: You MUST use the Task tool to launch explorer agents. Do NOT skip agents and investigate yourself.

**Actions**:
1. Launch 3 `ucai:explorer` agents in parallel using the Task tool:

   - **Error tracing**: "Trace this error through the codebase: [error/bug description]. Start from [error location/stack trace if available]. Follow the call chain — function calls, imports, data flow. Identify where the failure originates. Return 5-10 key files with file:line references and a call chain summary."

   - **Recent changes**: "Investigate recent changes that could have caused [bug]. Run `git log --oneline -20` to see recent commits. Use `git diff HEAD~5` to see what changed. Use Grep to find the function/module involved and check `git log -p --follow` on suspect files. Return a timeline of relevant changes with commit hashes."

   - **Working comparisons**: "Find similar patterns in this codebase that work correctly. The broken behavior is: [bug description]. Search for analogous code paths that handle similar logic successfully. Compare the working implementation with the broken one. Identify what differs. Return 5-10 key files with file:line references."

   Include project context (tech stack, conventions) in each agent's prompt if available.

2. **Wait for all agents to complete** before proceeding
3. Read all key files identified by agents
4. Present a consolidated investigation summary

---

## Phase 3: Diagnose

**Goal**: Identify the root cause with evidence.

**Actions**:
1. Consolidate agent findings into a diagnosis:
   - **Root cause**: What is actually broken and why (with file:line references)
   - **Evidence trail**: The chain of evidence — files, lines, git commits that support the diagnosis
   - **Mechanism**: Why this root cause produces the observed behavior
2. If multiple potential causes exist, rank by likelihood and explain the reasoning
3. Present the diagnosis to the user:
   - Root cause explanation (clear, non-technical where possible)
   - Evidence trail (file:line references, git commits)
   - Why this causes what the user is seeing
4. Ask: "Does this diagnosis match what you're seeing?"
5. **DO NOT PROCEED TO FIX WITHOUT USER CONFIRMATION**

---

## Phase 4: Fix

**Goal**: Apply a targeted fix.

**DO NOT START WITHOUT USER APPROVAL OF THE DIAGNOSIS**

**Actions**:
1. Propose the fix before implementing:
   - Which files to change
   - What the change is (conceptually)
   - Why this fixes the root cause
   - Any risks or side effects
2. Keep the fix minimal — address the root cause, not symptoms
3. Follow codebase conventions from CLAUDE.md
4. **Wait for user approval of the proposed fix**
5. Implement the fix
6. Update todos as you progress

---

## Phase 5: Verify

**Goal**: Confirm the fix is correct and clean.

**Actions**:
1. Launch 2 agents in parallel using the Task tool:

   - **Verifier** (`ucai:verifier`): "Verify that this fix resolves the bug without introducing regressions. The bug was: [description]. The root cause was: [diagnosis]. The fix was: [changes made]. Check the changed files, trace the execution path, and confirm the fix addresses the root cause. Look for edge cases the fix might miss."

   - **Reviewer** (`ucai:reviewer`): "Review this debug fix for code quality, conventions compliance, and potential side effects. The changed files are: [list]. Check for: correctness, style consistency with the codebase, error handling, and any unintended consequences."

2. **Wait for all agents to complete**
3. Present findings to user
4. If issues found, ask user which to address
5. Apply any agreed fixes
6. Mark todos complete
7. Summarize: what was broken, why, what was fixed, files changed
