---
description: Project spec (no args) or feature PRD (with args)
argument-hint: [feature description]
---

# Planning

You are helping a developer plan before building. This command works at two levels:

- **No arguments** (`/plan`): Define the project — vision, goals, and full requirements backlog
- **With arguments** (`/plan <feature>`): Create a feature PRD grounded in the project spec

## Core Principles

- **Spec-driven**: Every piece of work traces back to a specification
- **Research before requirements**: Understand the codebase and domain first
- **Parallel discovery**: Launch multiple agents simultaneously for speed
- **Approval before output**: Never write files without user sign-off
- **Track progress**: Use TodoWrite throughout

## Skill Loading — MANDATORY

Before starting discovery phases, you MUST identify and load relevant skills. This is not optional.

1. Always load `Skill(ucai:senior-architect)` — planning is architecture work
2. For feature-level planning, also load the domain skill: `Skill(ucai:senior-backend)`, `Skill(ucai:senior-frontend)`, etc.
3. Apply the skill's guidance throughout all subsequent phases

**You MUST load at least one skill before proceeding. State which skill(s) you loaded and why.**

---

## Phase 0: Route

**Goal**: Determine planning level.

Input: $ARGUMENTS

**Decision**:
- If `$ARGUMENTS` is empty or whitespace → **Project-Level Mode** (Phases 1P–5P)
- If `$ARGUMENTS` has content → **Feature-Level Mode** (Phases 1F–5F)

---

# Project-Level Mode

Use this mode when starting a new project or defining project scope for the first time.

## Phase 1P: Understand the Project

**Goal**: Know what needs to be built.

**Actions**:
1. Create todo list with all project-level phases (1P–5P)
2. If `.claude/project.md` already exists, read it and ask: "A project spec already exists. Overwrite, refine, or abort?" **Wait for user decision.**
3. If `.claude/requirements.md` already exists, note this — it will be regenerated alongside the project spec.
4. Determine if this is greenfield (no source code) or brownfield (existing codebase):
   - Use Glob to check for source files: `**/*.{js,ts,jsx,tsx,py,go,rs,java,rb,php,cs,cpp,c,swift,kt}`
5. Ask the user:
   - What are you building? (brief description)
   - What problem does it solve? Who is the target user?
   - Any known constraints? (tech stack preferences, deployment target, timeline)
6. Summarize understanding and confirm with user

---

## Phase 2P: Discovery

**Goal**: Research the domain and establish technical foundation.

**MANDATORY**: You MUST use the Task tool to launch explorer agents. Do NOT skip agents and research yourself.

**Actions**:
1. Launch 2-3 `ucai:explorer` agents in parallel using the Task tool:
   - **Domain research**: "Search the web for best practices, architecture patterns, and framework documentation relevant to [project type]. Prioritize official docs. Return key findings with URLs."
   - **Similar projects**: "Search the web for open-source projects similar to [project description]. Analyze their architecture, tech stack choices, and patterns. Return key findings."
   - **Codebase analysis** (brownfield only): "Analyze the existing codebase structure, tech stack, conventions, and patterns. Return 5-10 key files and architectural insights."

2. **Wait for all agents to complete** before proceeding
3. Present a consolidated discovery summary:
   - Domain best practices and references
   - Recommended patterns and architecture approaches
   - Tech stack recommendations (if greenfield)

---

## Phase 3P: Project Definition

**Goal**: Define the project spec.

**Actions**:
1. Based on discovery and user input, draft the project definition:

   - **Vision**: What this project is and why it exists (2-3 sentences)
   - **Goals**: Concrete project goals (3-5 items)
   - **Target Users**: User personas with descriptions
   - **Constraints**: Technical, business, or timeline constraints
   - **Tech Stack**: Languages, frameworks, key dependencies (decided or recommended)
   - **Non-Functional Requirements**: Performance, security, scalability targets

2. Present the draft to the user for validation
3. **DO NOT PROCEED WITHOUT APPROVAL**

---

## Phase 4P: Requirements Backlog

**Goal**: Define the full feature backlog.

**CRITICAL**: Do not skip this phase.

**Actions**:
1. Based on project definition and discovery, draft the complete feature backlog:

   **Must Have**: Essential features for MVP
   **Should Have**: Important but not launch-blocking
   **Could Have**: Nice-to-have if time permits
   **Won't Have (This Release)**: Explicitly out of scope

   Each feature should be a concise line item: `- [ ] Feature name — brief description`

2. Identify cross-cutting concerns (auth, error handling, logging, testing strategy)
3. Present the backlog to the user for validation
4. **DO NOT PROCEED WITHOUT APPROVAL**

If the user says "whatever you think is best", provide your recommendation and get explicit confirmation.

---

## Phase 5P: Output

**Goal**: Write the project spec files.

**Actions**:
1. Compile findings into `project.md`:

```markdown
---
name: [Project Name]
created: [ISO 8601 date]
status: draft
---

# Project: [Name]

## Vision
[What this project is and why it exists]

## Goals
- [Goal 1]
- [Goal 2]

## Target Users
- [Persona]: [description]

## Constraints
- [Constraint]

## Tech Stack
- [Language/framework/dependency]

## Non-Functional Requirements
- **Performance**: [targets]
- **Security**: [requirements]
- **Scalability**: [expectations]
```

2. Compile the backlog into `requirements.md`:

```markdown
---
project: [Project Name]
created: [ISO 8601 date]
updated: [ISO 8601 date]
---

# Requirements

## Must Have
- [ ] [Feature] — [brief description]

## Should Have
- [ ] [Feature] — [brief description]

## Could Have
- [ ] [Feature] — [brief description]

## Won't Have (This Release)
- [Feature] — [reason excluded]

## Cross-Cutting Concerns
- [Security, performance, testing, etc.]
```

3. Present both documents to the user
4. **DO NOT WRITE FILES WITHOUT USER APPROVAL**
5. Create `.claude/` directory if it does not exist
6. Write `.claude/project.md` and `.claude/requirements.md`
7. Confirm: "Project spec written. Run `/plan <feature>` to create a PRD for any feature from the backlog, or `/build <feature>` to start implementing directly."

---

# Feature-Level Mode

Use this mode when planning a specific feature. Produces a per-feature PRD.

## Phase 1F: Understand

**Goal**: Know what needs to be planned.

Feature request: $ARGUMENTS

**Actions**:
1. Create todo list with all feature-level phases (1F–5F)
2. Generate a slug from the feature name: lowercase, strip leading verbs (add/implement/create/build), replace non-alphanumeric characters with hyphens, collapse consecutive hyphens, trim leading/trailing hyphens
3. **Load project context** (if available):
   - Check `.claude/project.md` — if found, read and summarize project vision and constraints
   - Check `.claude/requirements.md` — if found, read and confirm this feature is in the backlog
4. Check for existing PRD at `.claude/prds/<slug>.md`. If found, ask: "A PRD for this feature already exists. Overwrite, refine, or abort?" **Wait for user decision.**
5. If the feature is unclear, ask:
   - What problem does this solve?
   - What should it do?
   - Any known constraints?
6. Summarize understanding and confirm with user

---

## Phase 2F: Discovery

**Goal**: Research the codebase and external sources in parallel.

**MANDATORY**: You MUST use the Task tool to launch explorer agents. Do NOT skip agents and research yourself.

**Actions**:
1. Launch 3 `ucai:explorer` agents in parallel using the Task tool, each with a different focus:
   - **Codebase patterns**: "Find features similar to [feature] in this codebase. Trace their implementation, identify reusable patterns, architecture layers, and integration points. Return 5-10 key files."
   - **Codebase architecture**: "Map the overall architecture, module boundaries, data flow, and conventions relevant to [feature area]. Return 5-10 key files."
   - **Web research**: "Search the web for best practices, design patterns, framework documentation, and API references relevant to [feature]. Prioritize official docs and authoritative sources. Return key findings with URLs."

   If project.md exists, include project context (tech stack, constraints) in each agent's prompt.

2. **Wait for all agents to complete** before proceeding
3. After agents return, read key files they identified
4. Present a consolidated discovery summary

---

## Phase 3F: Requirements

**Goal**: Define what the feature must do.

**CRITICAL**: Do not skip this phase.

**Actions**:
1. Based on discovery findings, user request, and project context (if available), draft requirements:

   **Functional Requirements** (MoSCoW):
   - Must have: [essential capabilities]
   - Should have: [important but not critical]
   - Won't have: [explicitly out of scope]

   **Non-Functional Requirements**:
   - Performance, security, UX, compatibility considerations
   - Cross-reference with project-level NFRs from project.md if available

   **Edge Cases & Constraints**:
   - Known limitations from codebase analysis
   - Integration constraints

   **Acceptance Criteria**:
   - Testable criteria for verifying the feature is complete

2. Present requirements to user for validation
3. **DO NOT PROCEED TO ARCHITECTURE WITHOUT APPROVAL**

If the user says "whatever you think is best", provide your recommendation and get explicit confirmation.

---

## Phase 4F: Architecture

**Goal**: Propose a high-level technical approach.

**MANDATORY**: You MUST use the Task tool to launch architect agents. Do NOT skip agents and design the architecture yourself.

**Actions**:
1. Launch 1-2 `ucai:architect` agents using the Task tool:
   - "Given these requirements [summary] and these codebase patterns [summary], propose a high-level architecture. Include: key components, data flow, integration points, files to create/modify. Keep it high-level — detailed design happens in /build."

   If project.md exists, include tech stack and constraints in the agent's prompt.

2. **Wait for all agents to complete** before proceeding
3. Review the architecture proposal
4. Present to user: components, data flow, key decisions, trade-offs
5. **DO NOT PROCEED WITHOUT USER APPROVAL**
6. Incorporate user feedback

---

## Phase 5F: Output PRD

**Goal**: Write the feature PRD.

**Actions**:
1. Compile all findings into the PRD using this structure:

```markdown
---
feature: [Feature name]
slug: [feature-slug]
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

2. Present the PRD draft to the user
3. **DO NOT WRITE THE FILE WITHOUT USER APPROVAL**
4. Create `.claude/prds/` directory if it does not exist
5. Write `.claude/prds/<slug>.md`
6. Confirm: "PRD written to `.claude/prds/<slug>.md`. Run `/build [feature]` to implement — the build command will auto-load this PRD and any project specs as context."
