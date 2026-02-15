---
description: Generate a structured PRD with codebase and web research
argument-hint: Feature description
---

# Planning — PRD Generation

You are helping a developer plan a feature before building it. Your goal is to produce a structured Product Requirements Document (PRD) at `.claude/prd.md` that captures research, requirements, and architecture — ready to feed into `/build`.

## Core Principles

- **Research before requirements**: Understand the codebase and domain first.
- **Parallel discovery**: Launch multiple agents simultaneously for speed.
- **Web + codebase**: Research both existing code patterns and external best practices.
- **Approval before output**: Never write the PRD without user sign-off.
- **Track progress**: Use TodoWrite throughout.

## Skill Loading — MANDATORY

Before starting Phase 2, you MUST identify and load relevant skills. This is not optional.

1. Determine the type of work: backend/API, frontend/UI, architecture, testing, DevOps
2. Load the matching skill using the Skill tool: `Skill(ucai:senior-backend)`, `Skill(ucai:senior-frontend)`, `Skill(ucai:senior-architect)`, `Skill(ucai:senior-qa)`, `Skill(ucai:senior-devops)`, `Skill(ucai:code-reviewer)`
3. Always load `Skill(ucai:senior-architect)` — planning is architecture work
4. Apply the skill's guidance throughout all subsequent phases

**You MUST load at least one skill before proceeding. State which skill(s) you loaded and why.**

---

## Phase 1: Understand

**Goal**: Know what needs to be planned.

Feature request: $ARGUMENTS

**Actions**:
1. Create todo list with all phases
2. If `.claude/prd.md` already exists, read it and ask: "A PRD already exists. Overwrite with a new plan, or abort?" **Wait for user decision before continuing.**
3. If the feature is unclear, ask:
   - What problem does this solve?
   - What should it do?
   - Who is the target user?
   - Any known constraints?
4. Summarize understanding and confirm with user

---

## Phase 2: Discovery

**Goal**: Research the codebase and external sources in parallel.

**MANDATORY**: You MUST use the Task tool to launch explorer agents. Do NOT skip agents and research yourself — agents provide parallel discovery across codebase and web sources that you cannot replicate in a single pass.

**Actions**:
1. Launch 3 `ucai:explorer` agents in parallel using the Task tool, each with a different focus:
   - **Codebase patterns**: "Find features similar to [feature] in this codebase. Trace their implementation, identify reusable patterns, architecture layers, and integration points. Return 5-10 key files."
   - **Codebase architecture**: "Map the overall architecture, module boundaries, data flow, and conventions relevant to [feature area]. Return 5-10 key files."
   - **Web research**: "Search the web for best practices, design patterns, framework documentation, and API references relevant to [feature]. Prioritize official docs and authoritative sources. Return key findings with URLs."

2. **Wait for all agents to complete** before proceeding
3. After agents return, read key files they identified
4. Present a consolidated discovery summary:
   - Relevant codebase patterns found
   - External best practices and references
   - Key insights that should inform requirements

---

## Phase 3: Requirements

**Goal**: Define what the feature must do.

**CRITICAL**: Do not skip this phase.

**Actions**:
1. Based on discovery findings and user request, draft requirements:

   **Functional Requirements** (MoSCoW):
   - Must have: [essential capabilities]
   - Should have: [important but not critical]
   - Won't have: [explicitly out of scope]

   **Non-Functional Requirements**:
   - Performance, security, UX, compatibility considerations

   **Edge Cases & Constraints**:
   - Known limitations from codebase analysis
   - Integration constraints

   **Acceptance Criteria**:
   - Testable criteria for verifying the feature is complete

2. Present requirements to user for validation
3. **DO NOT PROCEED TO ARCHITECTURE WITHOUT APPROVAL**

If the user says "whatever you think is best", provide your recommendation and get explicit confirmation.

---

## Phase 4: Architecture

**Goal**: Propose a high-level technical approach.

**MANDATORY**: You MUST use the Task tool to launch architect agents. Do NOT skip agents and design the architecture yourself.

**Actions**:
1. Launch 1-2 `ucai:architect` agents using the Task tool:
   - "Given these requirements [summary] and these codebase patterns [summary], propose a high-level architecture. Include: key components, data flow, integration points, files to create/modify. Keep it high-level — detailed design happens in /build."

2. **Wait for all agents to complete** before proceeding
3. Review the architecture proposal
4. Present to user: components, data flow, key decisions, trade-offs
5. **DO NOT PROCEED WITHOUT USER APPROVAL**
6. Incorporate user feedback

---

## Phase 5: Output PRD

**Goal**: Write the PRD to `.claude/prd.md`.

**Actions**:
1. Compile all findings into the PRD using this structure:

```markdown
---
feature: [Feature name]
created: [ISO 8601 date]
status: draft
---

# PRD: [Feature Name]

## Overview
[1-2 paragraphs: what the feature is, why it's needed]

## Discovery

### Codebase Patterns
[Key patterns found, with file:line references]

### Research Findings
[Best practices, docs, references with URLs]

## Requirements

### Functional Requirements
#### Must Have
- [Requirement]

#### Should Have
- [Requirement]

#### Won't Have (This Release)
- [Out of scope item]

### Non-Functional Requirements
- **Performance**: [Constraints]
- **Security**: [Considerations]
- **UX**: [Guidelines]

### Edge Cases
- [Edge case]

### Acceptance Criteria
- [ ] [Criterion]

## Architecture

### High-Level Design
[Component overview, key abstractions]

### Key Decisions
- **[Decision]**: [Rationale]

### Integration Points
- [Where this connects to existing code]

### Files to Create/Modify
- [Preliminary file list]

## References
- [URL with description]
```

3. Present the PRD draft to the user
3. **DO NOT WRITE THE FILE WITHOUT USER APPROVAL**
5. Write `.claude/prd.md`
6. Confirm: "PRD written to `.claude/prd.md`. Run `/build [feature]` to implement — the build command will auto-load this PRD as context."
