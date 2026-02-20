---
description: Project spec (no args) or feature FRD (with args)
argument-hint: [feature description]
---

# Planning

You are helping a developer plan before building. This command works at two levels:

- **No arguments** (`/plan`): Define the project — vision, goals, and full requirements backlog
- **With arguments** (`/plan <feature>`): Create a feature FRD grounded in the project spec

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
1. Create todo list with all project-level phases (1P–6P)
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
1. Launch 2-3 `ucai:explorer` agents in parallel using the Task tool (level: **thorough**, max_turns: 30):
   - **Domain research**: "Level: thorough. Search the web for best practices, architecture patterns, and framework documentation relevant to [project type]. Prioritize official docs. Return key findings with URLs."
   - **Similar projects**: "Level: medium. Search the web for open-source projects similar to [project description]. Analyze their architecture, tech stack choices, and patterns. Return key findings."
   - **Codebase analysis** (brownfield only): "Level: thorough. Analyze the existing codebase structure, tech stack, conventions, and patterns. Return 5-10 key files and architectural insights."

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
   - **Tech Stack**: Languages, frameworks, key dependencies with rationale
     - For each major dependency choice, state *why* over alternatives (e.g., "Prisma over Drizzle — better migration tooling for solo dev workflow")
     - Focus on choices that are painful to reverse later (ORM, state management, CSS approach, auth provider)
   - **Non-Functional Requirements**: Performance, security, scalability targets

2. Present the draft to the user for validation
3. **DO NOT PROCEED WITHOUT APPROVAL**

---

## Phase 4P: UI Design System

**Goal**: Define a cohesive visual language that every future `/build` with UI will inherit.

**Condition**: Only enter this phase if the project has a user-facing UI (web app, dashboard, landing page, mobile). Skip to Phase 5P if the project is a CLI, API, background service, or library.

**Actions**:
1. Load `Skill(ucai:senior-frontend)` — apply its UI Design System guidance throughout this phase
2. Determine whether the project has a UI: infer from the tech stack (Phase 3P) or ask the user directly
3. If UI confirmed, draft each decision below and present as a block for user approval:

   **Aesthetic mood** — drives all other choices, pick one:
   - **Editorial**: refined, content-first, long-form reading (Newsreader/Literata + warm off-white)
   - **Startup / modern**: energetic, bold, product-focused (Bricolage Grotesque/Satoshi + clean white or dark)
   - **Technical**: precise, data-dense, structured (IBM Plex Sans/Mono + cool gray or dark theme)
   - **Warm / human**: approachable, friendly, community-oriented (DM Serif Display + DM Sans + off-white)

   **Typography** (per skill guidelines — Inter, Roboto, Arial, system-ui are banned):
   - Heading font: [specific Google Font] — [why, one sentence]
   - Body font: [specific Google Font] — [why, one sentence — must contrast with heading: serif + sans]
   - Weight contrast: 200–300 body, 800–900 headings

   **Color system**:
   - Background: [off-white `#FAF8F5` / cool gray / dark — never pure white or pure black]
   - Text: [near-black `#1C1917` or equivalent — never pure black]
   - Accent: ONE dominant accent color, used sparingly (primary actions, active states, key highlights) — [hex + rationale]
   - All colors defined as CSS custom properties in `:root`, never hardcoded in components

   **Layout defaults**:
   - Border radius: ONE size everywhere — [8px / 12px / 16px]
   - Max content width: 680px for prose, 1200px for dashboards
   - Section spacing: 48px minimum between major sections

   **Component tone** (informs how every component is built):
   - Buttons: 8–12px radius (not pill), primary filled / secondary bordered / ghost text-only
   - Loading: skeleton screens with shimmer — never spinners
   - Empty states: typographic statement + action — never "No data found" or sad-face illustrations
   - Error copy: human-readable — "Something went wrong on our end", not "Error 500"

4. Present the full design system draft to the user
5. **DO NOT PROCEED WITHOUT APPROVAL** — incorporate feedback, then continue

This design system is written into `project.md` and acts as the contract for all subsequent feature builds. A solo dev who defers these decisions to individual `/build` runs gets visual chaos.

---

## Phase 5P: Requirements Backlog

**Goal**: Define the full feature backlog.

**CRITICAL**: Do not skip this phase.

**Actions**:
1. Based on project definition and discovery, draft the complete feature backlog:

   **Must Have**: Essential features for MVP
   **Should Have**: Important but not launch-blocking
   **Could Have**: Nice-to-have if time permits
   **Won't Have (This Release)**: Explicitly out of scope

   Each feature should be a concise line item: `- [ ] Feature name — brief description`

2. **Build order** — This is critical. Do NOT just list features flat. You MUST:
   - Identify dependencies between features (what requires what)
   - Define a **vertical slice** as the first build target: the smallest set of features that proves the end-to-end flow works
   - Sequence the remaining Must Have features in logical build order after the vertical slice
   - Add a `## Build Order` section to requirements.md with numbered steps and dependency notes

3. Identify cross-cutting concerns (auth, error handling, logging, testing strategy)
4. Present the backlog AND the build order to the user for validation
5. **DO NOT PROCEED WITHOUT APPROVAL**

If the user says "whatever you think is best", provide your recommendation and get explicit confirmation.

---

## Phase 6P: Output

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
- **[Category]**: [choice] — [why over alternatives]
- **[Category]**: [choice] — [why over alternatives]

## Design System
<!-- Only include if the project has a UI — output from Phase 4P -->
- **Aesthetic**: [mood — editorial / startup / technical / warm] — [one sentence why]
- **Heading font**: [font name] — [why]
- **Body font**: [font name] — [why]
- **Background**: [color/hex — never pure white or black]
- **Text**: [color/hex — never pure black]
- **Accent**: [color/hex] — [why this color, used sparingly]
- **Border radius**: [px] everywhere
- **Loading**: skeleton screens with shimmer
- **Empty states**: typographic statement + action
- **Error copy**: human-readable ("Something went wrong on our end")

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

## Build Order
1. **Vertical slice**: [name] — covers: [feature A], [feature B], [feature C]
2. **[Step name]** — covers: [feature D], [feature E] — depends on: step 1
3. **[Step name]** — covers: [feature F] — depends on: step 2

## Cross-Cutting Concerns
- [Security, performance, testing, etc.]
```

3. Present both documents to the user
4. **DO NOT WRITE FILES WITHOUT USER APPROVAL**
5. Create `.claude/` directory if it does not exist
6. Write `.claude/project.md` and `.claude/requirements.md`
7. Confirm: "Project spec written. Pick the next step from the Build Order and run `/build <step>` to start implementing. For complex steps, you can optionally run `/plan <step>` first to create a detailed FRD."

---

# Feature-Level Mode

Use this mode when planning a specific feature. Produces a per-feature FRD.

## Phase 1F: Understand

**Goal**: Know what needs to be planned.

Feature request: $ARGUMENTS

**Actions**:
1. Create todo list with all feature-level phases (1F–5F)
2. Generate a slug from the feature name: lowercase, strip leading verbs (add/implement/create/build), replace non-alphanumeric characters with hyphens, collapse consecutive hyphens, trim leading/trailing hyphens
3. **Load project context** (if available):
   - Check `.claude/project.md` — if found, read and summarize project vision and constraints
   - Check `.claude/requirements.md` — if found, read and confirm this feature is in the backlog. Check the Build Order section to understand where this feature fits in the sequence and what it depends on.
4. Check for existing FRD at `.claude/frds/<slug>.md`. If found, ask: "An FRD for this feature already exists. Overwrite, refine, or abort?" **Wait for user decision.**
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
1. Launch 3 `ucai:explorer` agents in parallel using the Task tool (level: **medium**, max_turns: 20), each with a different focus:
   - **Codebase patterns**: "Level: medium. Find features similar to [feature] in this codebase. Trace their implementation, identify reusable patterns, architecture layers, and integration points. Return 5-10 key files."
   - **Codebase architecture**: "Level: medium. Map the overall architecture, module boundaries, data flow, and conventions relevant to [feature area]. Return 5-10 key files."
   - **Web research**: "Level: medium. Search the web for best practices, design patterns, framework documentation, and API references relevant to [feature]. Prioritize official docs and authoritative sources. Return key findings with URLs."

   If project.md exists, include project context (tech stack, constraints) in each agent's prompt.

2. **Wait for all agents to complete** before proceeding
3. After agents return, read key files they identified
4. Present a consolidated discovery summary

---

## Phase 3F: Requirements

**Goal**: Define what the feature must do — and how the user moves through it.

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

2. **User Flows** (conditional — only if the feature has user-facing interaction):
   - Sketch the primary journey: "User lands on → clicks → sees → submits → gets feedback"
   - Use a Mermaid flowchart or numbered steps — not wireframes, just the *flow*
   - Include error/edge paths where they matter (e.g., "form fails validation → show inline errors → user corrects → resubmits")
   - A solo dev who skips this builds the wrong screens or misses states

3. Present requirements (and user flows if applicable) to user for validation
4. **DO NOT PROCEED TO ARCHITECTURE WITHOUT APPROVAL**

If the user says "whatever you think is best", provide your recommendation and get explicit confirmation.

---

## Phase 3F.5: Milestone Scoping (Agile Mode — Conditional)

**Condition**: Enter this phase only if:
- The feature has ≥4 Must Have requirements, OR spans ≥3 distinct user flows
- The user has not already indicated they want a single build

**Goal**: Optionally break the feature into independently-buildable milestones.

**Actions**:
1. Count the Must Have requirements and user flows from Phase 3F
2. Present the suggestion:
   > "I found [N] Must Have requirements and [M] user flows — this is a large feature.
   > Would you like **agile mode**? I'll group these into milestones you can build one at a time
   > with separate `/build` runs. Or we can keep it as a single FRD and build it all at once."
3. **Wait for user decision.** If "No", "skip", or "single build" → proceed directly to Phase 4F.
4. If "Yes":
   - Group the Must Have requirements into 2–6 milestones, sequenced in a logical build order
   - Each milestone must be independently deployable (no circular dependencies)
   - For each milestone draft:
     - **Name**: short and descriptive (e.g., "Secret Detail Panel")
     - **Scope**: which functional requirements from Phase 3F this milestone covers
     - **Depends on**: prior milestone(s) by number, or "None"
     - **Acceptance criteria**: 2–5 testable bullet points, more specific than the FRD requirements
   - Should Have items may be assigned to any milestone or collected as a final "Stretch" milestone
   - Present the full milestone breakdown for user approval
   - **DO NOT PROCEED WITHOUT APPROVAL** — incorporate feedback, then continue to Phase 4F with agile mode confirmed

---

## Phase 4F: Architecture

**Goal**: Propose a high-level technical approach — structure, data, interfaces, and visuals as needed.

**MANDATORY**: You MUST use the Task tool to launch architect agents. Do NOT skip agents and design the architecture yourself.

### Step 1: Determine Applicable Sections

Before launching agents, determine which architecture sub-sections apply to this feature. Infer from the feature description, requirements, and codebase context:

| Section | Trigger | Example |
|---------|---------|---------|
| **Core architecture** | Always | Components, data flow, files to create/modify |
| **Data model** | Feature touches persistence (DB, files, external storage) | "user profiles", "order history", "settings" |
| **API surface** | Feature has a client/server boundary | "dashboard", "form submission", "webhook" |
| **UI structure** | Feature is user-facing with visual components | "settings page", "onboarding flow", "admin panel" |
| **Security notes** | Feature touches auth, payments, PII, or external APIs | "login", "checkout", "API keys" |

State which sections apply and why. The user confirms or adjusts at the approval gate below.

### Step 2: Launch Agents

Launch 1-2 `ucai:architect` agents using the Task tool:
- "Given these requirements [summary] and these codebase patterns [summary], propose a high-level architecture. Include: key components, data flow, integration points, files to create/modify. Keep it high-level — detailed design happens in /build."

If project.md exists, include tech stack and constraints in the agent's prompt.

**Wait for all agents to complete** before proceeding.

### Step 3: Draft Architecture (with conditional sections)

**Core architecture** (always):
- Key components and their responsibilities
- Data flow between components
- Integration points with existing code
- Files to create or modify
- Key decisions with rationale and trade-offs

**Data model** (conditional — feature touches persistence):
- Entity definitions with key fields and types
- Relationships between entities (Mermaid ERD if 3+ entities, bullet list if simpler)
- Indexes or constraints that matter for performance
- A solo dev who skips this migrates the schema 3 times

**API surface** (conditional — feature has a client/server boundary):
- Endpoints as a markdown table: method, path, request shape, response shape
- Not an OpenAPI spec — just enough to not surprise yourself later
- Auth requirements per endpoint (if applicable)
- Error response conventions

**UI structure** (conditional — feature is user-facing):
- Component tree: parent → children hierarchy
- Rough layout sketch (ASCII) showing spatial arrangement — not pixels, just structure
- If project.md defines a design direction (fonts, palette, aesthetic), reference it here
- Load `Skill(ucai:senior-frontend)` if not already loaded for design system guidance
- Key states: loading, empty, error, populated

**Security notes** (conditional — feature touches auth, payments, PII, or external APIs):
- 3-5 bullet points on what to watch for
- Not a threat model — just "validate X server-side", "sanitize Y before rendering", "rate-limit Z endpoint", "don't log PII in W"

### Step 4: Present and Approve

Present the full architecture to the user, clearly labeling which conditional sections were included and why.

**DO NOT PROCEED WITHOUT USER APPROVAL.**

Incorporate user feedback.

---

## Phase 5F: Output FRD

**Goal**: Write the feature FRD.

**Actions**:
1. Compile all findings into the FRD using this structure:

```markdown
---
feature: [Feature name]
slug: [feature-slug]
created: [ISO 8601 date]
status: draft
mode: agile    # omit this line for standard (non-agile) FRDs
---

# FRD: [Feature Name]

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

### User Flows
<!-- Only include if the feature has user-facing interaction -->
[Mermaid flowchart or numbered steps showing the primary user journey]

## Architecture

### High-Level Design
[Component overview, key abstractions]

### Key Decisions
- **[Decision]**: [Rationale]

### Integration Points
- [Where this connects to existing code]

### Files to Create/Modify
- [Preliminary file list]

### Data Model
<!-- Only include if the feature touches persistence -->
[Entity definitions, relationships — Mermaid ERD or bullet list]

### API Surface
<!-- Only include if the feature has a client/server boundary -->
| Method | Path | Request | Response |
|--------|------|---------|----------|
| [GET/POST/etc.] | [/path] | [shape] | [shape] |

### UI Structure
<!-- Only include if the feature is user-facing -->
[Component tree + ASCII layout sketch + key states]

### Security Notes
<!-- Only include if the feature touches auth, payments, PII, or external APIs -->
- [Bullet points on what to watch for]

## Milestones
<!-- Only include if mode: agile — output from Phase 3F.5. Remove this section entirely for standard FRDs. -->

### M1: [Name]
**Scope**: [Which Must Have requirements from the list above this milestone covers]
**Depends on**: None

**Acceptance criteria**:
- [ ] [Specific testable criterion]
- [ ] [Specific testable criterion]

### M2: [Name]
**Scope**: [Which requirements]
**Depends on**: M1

**Acceptance criteria**:
- [ ] [Specific testable criterion]
- [ ] [Specific testable criterion]

## References
- [URL with description]
```

2. Present the FRD draft to the user
3. **DO NOT WRITE THE FILE WITHOUT USER APPROVAL**
4. Create `.claude/frds/` directory if it does not exist
5. Write `.claude/frds/<slug>.md`
6. Confirm with an appropriate message based on mode:
   - **Standard**: "FRD written to `.claude/frds/<slug>.md`. Run `/build [feature]` to implement — the build command will auto-load this FRD and any project specs as context."
   - **Agile**: "FRD written to `.claude/frds/<slug>.md` with [N] milestones. Run `/build [feature]` to start — it will detect agile mode and ask which milestone to build. Suggested starting point: M1 ([name])."
