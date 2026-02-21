---
description: Generate or update project documentation from codebase and specs
argument-hint: "[scope: api|readme|deploy|all]"
disable-model-invocation: true
---

# Documentation Generation

You are helping a developer generate or update project documentation. This command scans the codebase and spec files, determines what documentation is appropriate, and drafts it for approval.

## Core Principles

- **Scan before writing**: Understand what the project has before deciding what docs to generate
- **Adapt to the project**: A CLI tool needs different docs than a web app
- **Reference specs**: Use project.md and requirements.md as source material when available
- **Approval before writing**: Never write documentation files without user sign-off
- **Track progress**: Use TodoWrite throughout

## Skill Loading — MANDATORY

Before starting analysis, you MUST load relevant skills.

1. Always load `Skill(ucai:senior-architect)` — documentation is architecture communication
2. If scope is specific, also load the domain skill:
   - API docs → `Skill(ucai:senior-backend)`
   - Component/UI docs → `Skill(ucai:senior-frontend)`
   - Deployment docs → `Skill(ucai:senior-devops)`
3. Apply the skill's guidance throughout all subsequent phases

**You MUST load at least one skill before proceeding. State which skill(s) you loaded and why.**

---

## Phase 1: Scope

**Goal**: Determine what documentation to generate.

Input: $ARGUMENTS

**Actions**:
1. Create todo list with all phases (1–5)
2. **Load project context** (if available):
   - Check `.claude/project.md` — read for vision, goals, tech stack
   - Check `.claude/requirements.md` — read for feature list and completion status
   - Check `CLAUDE.md` — read for project conventions and structure
3. **Check existing documentation**:
   - Use Glob to find: `README.md`, `docs/**/*`, `API.md`, `CONTRIBUTING.md`, `DEPLOYMENT.md`, `CHANGELOG.md`
   - Note what exists, what looks stale, what's missing
4. **Determine scope**:
   - If `$ARGUMENTS` is empty → propose what docs to generate based on project analysis (Phase 2 will inform this)
   - If `$ARGUMENTS` specifies a scope (e.g., "api", "readme", "deploy", "all") → narrow to that scope
   - If `$ARGUMENTS` is a file path → update that specific file
5. Present to user: "Found [existing docs]. Will generate/update [proposed docs]. Confirm?"
6. **Wait for user confirmation before proceeding**

---

## Phase 2: Analyze

**Goal**: Understand the project deeply enough to write accurate documentation.

**MANDATORY**: You MUST use the Task tool to launch agents. Do NOT skip agents and analyze yourself.

**Actions**:
1. Launch 2-3 agents in parallel using the Task tool:

   - **Project scanner** (`ucai:project-scanner`, haiku): "[haiku] Analyze the codebase structure for documentation purposes. Identify: public APIs and their signatures, CLI commands and their options, entry points, exported modules, configuration options, environment variables, data models, and key abstractions. Return a structured inventory of what should be documented."

   - **Docs auditor** (`ucai:explorer`, sonnet, max_turns: 12): "[sonnet] Level: quick. Find all existing documentation in the project: README.md, inline JSDoc/docstrings, code comments, docs/ folder, markdown files, configuration examples. Assess what's current, what's stale, and what's missing. Return findings with file:line references."

   - **Setup analyst** (`ucai:explorer`, sonnet, max_turns: 12): "[sonnet] Level: quick. Identify the project's setup and deployment model. What does someone need to know to install, configure, and run this project? Check: package.json scripts, Dockerfile, docker-compose, CI/CD configs, environment files (.env.example), and any setup scripts. Return a step-by-step setup flow."

   Include project context (tech stack, constraints) in each agent's prompt if available.

2. **Wait for all agents to complete** before proceeding
3. Read key files identified by agents
4. Determine which doc types apply based on what exists:

   | Project has | Generate |
   |-------------|----------|
   | API endpoints (REST/GraphQL) | API documentation |
   | CLI commands | Usage / command reference |
   | Environment variables / config files | Configuration section |
   | Dockerfile / deploy scripts / CI config | Deployment guide |
   | `.claude/project.md` | Use vision/goals for README intro |
   | `.claude/requirements.md` | Use completed features for feature list |
   | Multiple contributors or open source | Contributing guide |

5. Present analysis summary: what the project has, what docs are recommended, and why

---

## Phase 3: Draft

**Goal**: Write the documentation.

**Actions**:
1. Draft all documentation based on analysis findings and confirmed scope
2. Structure depends on scope:

   **README** (if in scope):
   - Project name and one-line description
   - What it does and why (from project.md if available)
   - Installation / setup steps (from setup analyst findings)
   - Usage examples (from API/CLI analysis)
   - Configuration (environment variables, config files)
   - Feature list (from requirements.md completed items if available)
   - Contributing (if open source)
   - License

   **API docs** (if in scope):
   - Overview and base URL
   - Authentication (if applicable)
   - Endpoints grouped by resource: method, path, description, request/response shapes, error codes
   - Examples with curl or fetch

   **Deployment guide** (if in scope):
   - Prerequisites
   - Environment setup
   - Build steps
   - Deployment steps (per platform if multiple)
   - Monitoring / health checks

   **All**: generate whichever are appropriate based on Phase 2 analysis

3. Reference actual code, not assumptions — use file:line references from agent findings
4. Present the complete draft to user

---

## Phase 4: Approve

**Goal**: Get user sign-off before writing files.

**DO NOT WRITE ANY FILES WITHOUT USER APPROVAL**

**Actions**:
1. Present the complete documentation draft, clearly showing:
   - Which files will be created or updated
   - The full content of each file
2. Ask which sections to keep, modify, or remove
3. Incorporate feedback
4. If major changes requested, re-draft and present again

---

## Phase 5: Write

**Goal**: Write the approved documentation files.

**Actions**:
1. Write approved documentation to the appropriate locations:
   - `README.md` → project root
   - API docs → `docs/api.md` or `API.md`
   - Deployment guide → `docs/deployment.md` or `DEPLOYMENT.md`
   - Contributing guide → `CONTRIBUTING.md`
   - Other docs → `docs/` directory
2. If updating existing files, preserve sections the user didn't ask to change
3. Mark todos complete
4. Summarize: files generated/updated, paths, suggested next steps (e.g., "Review and commit the docs")
