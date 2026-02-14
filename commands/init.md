---
description: Analyze project and generate CLAUDE.md + setup
argument-hint: [project-path]
---

# Project Initialization

You are setting up a project to work effectively with Claude Code. Your goal is to analyze the codebase and generate accurate, useful project guidelines — not a framework config dump.

## Core Principle

CLAUDE.md should contain **project facts** that Claude doesn't already know: conventions, architecture decisions, build commands, and patterns specific to this codebase. Nothing generic.

---

## Phase 1: Detection (MANDATORY — do this BEFORE anything else)

**Goal**: Determine whether this is an existing project or an empty/new one.

Project path: $ARGUMENTS (default: current directory)

**Actions**:
1. Create a todo list to track progress
2. Use Glob to search for source code files: `**/*.{js,ts,jsx,tsx,py,go,rs,java,rb,php,cs,cpp,c,swift,kt}` and package manifests: `{package.json,pyproject.toml,Cargo.toml,go.mod,Gemfile,composer.json,*.csproj,pom.xml,build.gradle}`
3. **Decision gate — you MUST follow this strictly**:
   - If **zero source code files AND zero package manifests** are found → go to **Phase 2B** (do NOT launch scanners)
   - If source code or package manifests exist → go to **Phase 2A**

**IMPORTANT**: Do NOT launch project-scanner agents on an empty project. They will waste tokens scanning nothing.

---

## Phase 2A: Analysis (Existing Project)

**Goal**: Understand the project deeply before writing anything.

**Actions**:
1. Launch 2-3 project-scanner agents in parallel, each targeting a different aspect:
   - Agent 1: "Analyze the tech stack, dependencies, and build/test/lint commands"
   - Agent 2: "Map the directory structure, architecture patterns, and module organization"
   - Agent 3: "Extract coding conventions, naming patterns, and formatting rules from existing code"

2. After agents return, read all key files they identified
3. Consolidate findings into a unified project understanding
4. Proceed to Phase 3

---

## Phase 2B: Scaffolding (Empty/New Project)

**Goal**: Gather the user's intent and create a useful starting CLAUDE.md.

**Do NOT launch any scanner agents.** Go straight to asking the user.

**Actions**:
1. Tell the user this is an empty project and you'll ask a few questions to scaffold a CLAUDE.md
2. Ask the user:
   - What are you building? (brief description)
   - What tech stack do you plan to use? (languages, frameworks, databases)
   - Any specific conventions you want to follow? (naming, structure, testing approach)
   - Any known constraints? (monorepo, specific deployment target, etc.)
3. **Wait for answers before proceeding**
4. Proceed to Phase 3 with the user's answers as the basis (instead of scanner results)

---

## Phase 3: CLAUDE.md Generation

**Goal**: Write a CLAUDE.md that contains only what Claude needs to know.

**Structure to follow**:

```markdown
# [Project Name]

## Overview
[1-2 sentences: what this project is and does]

## Tech Stack
[Languages, frameworks, key dependencies]

## Development Commands
[Build, test, lint, format — the actual commands]

## Architecture
[Key patterns, layers, module boundaries]

## Conventions
[Naming, imports, error handling, testing patterns — only what's specific to this project]

## Key Files
[Entry points and important files for orientation]
```

**Rules**:
- Only include facts specific to this project
- No generic programming advice
- No framework instructions or persona definitions
- Keep it under 200 lines — concise is key
- Every line should help Claude write better code for THIS project
- For empty projects: document the planned stack and intended conventions so future sessions have context

**Actions**:
1. Draft the CLAUDE.md content
2. Present it to the user for review
3. **Wait for user approval before writing the file**
4. Write CLAUDE.md to the project root

---

## Phase 4: Optional Setup

**Goal**: Suggest additional setup based on what was discovered.

Based on the project analysis, suggest (but don't force):
- If the project has security-sensitive files (.env, credentials): suggest a PreToolUse hook
- If the project has specific test patterns: note the test command in CLAUDE.md
- If the project has CI/CD: note the pipeline structure

**Actions**:
1. Present recommendations to the user
2. Only set up what the user approves
3. Mark all todos complete and summarize what was done
