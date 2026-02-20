---
description: Multi-agent code review with parallel validation
argument-hint: [file-path or scope]
---

# Code Review

You are performing a thorough code review using parallel agents for independent analysis.

## Context

- Review scope: $ARGUMENTS (default: unstaged changes via `git diff`)
- Current git status: !`git status`
- Current git diff: !`git diff HEAD`

## Skill Loading — MANDATORY

Before starting Phase 2, you MUST load the `ucai:code-reviewer` skill — this is a code review workflow.

1. Load: `Skill(ucai:code-reviewer)`
2. Also load the domain skill matching the code being reviewed: `Skill(ucai:senior-backend)`, `Skill(ucai:senior-frontend)`, etc.
3. Apply the skill's guidance when evaluating code quality and conventions

**You MUST load at least one skill before proceeding. State which skill(s) you loaded and why.**

---

## Phase 1: Scope

**Goal**: Determine what to review.

**Actions**:
1. Create todo list
2. If $ARGUMENTS specifies files or a PR, use that scope
3. If no arguments, review unstaged changes from git diff
4. If no changes found, tell the user and stop
5. Find any CLAUDE.md files in the project for guideline reference
6. Check for `.claude/project.md` and `.claude/requirements.md`. If found, read them — pass project conventions and non-functional requirements (security, performance targets) as context to Phase 2 reviewer agents so they can validate against project-level specs.

---

## Phase 2: Parallel Review

**Goal**: Get independent perspectives on the code.

**MANDATORY**: You MUST use the Task tool to launch 3 reviewer agents in parallel. Do NOT skip agents and review the code yourself — independent parallel review catches issues that single-pass review misses.

**Actions**:
Launch 3 `ucai:reviewer` agents in parallel using the Task tool:

- **Agent 1** (`model: sonnet`): "[sonnet] Review for CLAUDE.md compliance and project convention adherence"
- **Agent 2** (`model: opus`): "[opus] Review for bugs, logic errors, and functional correctness"
- **Agent 3** (`model: opus`): "[opus] Review for security vulnerabilities and performance issues"

Each agent should return issues with:
- Confidence score (0-100)
- File path and line number
- Description and fix suggestion

**CRITICAL**: We only want HIGH SIGNAL issues (confidence >= 80). Do not flag:
- Pre-existing issues
- Style nitpicks a linter would catch
- Hypothetical issues that depend on specific inputs
- Subjective improvements

---

## Phase 3: Validation

**Goal**: Filter false positives.

**Actions**:
1. Collect all issues from the 3 agents
2. For each issue with confidence >= 80, verify it by checking the actual code
3. Discard any issue that doesn't hold up under scrutiny
4. Group validated issues by severity (Critical / Important)

---

## Phase 4: Report

**Goal**: Present actionable findings.

**Actions**:
1. If issues found: list each with description, file:line, and fix suggestion
2. If no issues found: "No issues found. Checked for bugs, conventions, and security."
3. **DO NOT FIX ISSUES WITHOUT USER APPROVAL** — ask which issues (if any) to fix now
4. Mark todos complete
