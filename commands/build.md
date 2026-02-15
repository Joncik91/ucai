---
description: Feature development with exploration, design, and review
argument-hint: Feature description
---

# Feature Development

You are helping a developer implement a new feature. Follow a systematic approach: understand deeply, design with options, get approval, then build and verify.

## Core Principles

- **Ask, don't assume**: Identify all ambiguities and ask. Wait for answers.
- **Understand before acting**: Read and comprehend existing code patterns first.
- **Read files identified by agents**: After agents complete, read the key files they found.
- **Simple and elegant**: Prioritize readable, maintainable code.
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

**PRD context**: Check if `.claude/prd.md` exists. If it does, read it and summarize it to the user. Ask: "I found an existing PRD. Should I use it as the specification for this build?"

If the user confirms:
- Phase 2 (Explore): Use PRD's Discovery section as a starting point — focus agents on areas not already covered
- Phase 3 (Clarify): Use PRD's Requirements as the baseline — only clarify gaps or changes since the PRD was written
- Phase 4 (Design): Present PRD's Architecture as one option alongside architect-generated alternatives
- Phase 6 (Verify): Use PRD's Acceptance Criteria for verification

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

**Actions**:
1. Launch 2-3 explorer agents in parallel, each targeting a different aspect:
   - "Find features similar to [feature] and trace their implementation"
   - "Map the architecture and abstractions for [relevant area]"
   - "Identify UI patterns, testing approaches, or extension points relevant to [feature]"

   Each agent should return a list of 5-10 key files.

2. After agents return, read all identified files
3. Present comprehensive summary of findings

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
1. Launch 2-3 architect agents in parallel with different focuses:
   - Minimal changes (smallest change, maximum reuse)
   - Clean architecture (maintainability, elegant abstractions)
   - Pragmatic balance (speed + quality)
2. Review all approaches and form your recommendation
3. Present to user: brief summary of each, trade-offs, your recommendation with reasoning
4. **Ask user which approach they prefer**

---

## Phase 5: Build

**Goal**: Implement the feature.

**DO NOT START WITHOUT USER APPROVAL**

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
1. Launch a verifier agent with the acceptance criteria from Phase 1
2. Launch 2 reviewer agents in parallel:
   - Focus on bugs and functional correctness
   - Focus on conventions and code quality
3. Consolidate findings and identify issues worth fixing
4. **Present findings to user**: fix now, fix later, or proceed as-is
5. Address issues based on user decision
6. **If fixes were applied, re-run reviewers on the changed files** — fixes can introduce new issues. Repeat steps 2-5 until clean or user approves remaining items.

---

## Phase 7: Done

**Goal**: Document what was accomplished and keep project guidelines current.

**Actions**:
1. Mark all todos complete
2. Summarize:
   - What was built
   - Key decisions made
   - Files modified/created
   - Suggested next steps
3. **CLAUDE.md refresh**: If a CLAUDE.md exists, check whether this feature introduced changes that should be reflected:
   - New architecture patterns or layers
   - New development commands (build, test, lint)
   - New key files or entry points
   - Changed conventions or dependencies
   - If updates are needed, present the proposed changes to the user and **wait for approval** before editing CLAUDE.md
   - If nothing meaningful changed, skip silently — do not update for trivial additions
