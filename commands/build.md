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

---

## Phase 1: Understand

**Goal**: Know what needs to be built.

Feature request: $ARGUMENTS

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

---

## Phase 7: Done

**Goal**: Document what was accomplished.

**Actions**:
1. Mark all todos complete
2. Summarize:
   - What was built
   - Key decisions made
   - Files modified/created
   - Suggested next steps
