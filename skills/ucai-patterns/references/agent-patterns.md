# Agent Patterns

## What Agents Are

Agents are markdown files with YAML frontmatter. They define:

```yaml
---
name: agent-name
description: When and how this agent should be used
tools: Glob, Grep, LS, Read, Write, Edit, Bash
model: sonnet
color: green
---

System prompt content here...
```

Each agent gets spawned as a fresh subagent via the Task tool with its own context window, specified model, and restricted tool access.

## Agents Are Not Personas

Frameworks like BMAD define "PM Agent", "Architect Agent", "Developer Agent" with personality prompts. This is misaligned with how the tool works.

Native agents are defined by:
- **Mission**: What specific task they accomplish
- **Model**: Which Claude model (haiku for fast/cheap, sonnet for balanced, opus for deep analysis)
- **Tools**: Which tools they can access
- **Output format**: What they return to the orchestrator

Not by personality, communication style, or role-play instructions.

## Parallel Spawning Pattern

The core orchestration pattern in Claude Code is:

```
Command (orchestrator)
  ├── Spawn 2-3 agents in parallel (independent analysis)
  ├── Read results + key files agents identified
  ├── Consolidate findings
  ├── Ask user for decision (approval gate)
  ├── Spawn 2-3 agents in parallel (next phase)
  └── Consolidate and report
```

This is how Anthropic's feature-dev and code-review plugins work. Key principles:

1. **Parallel, not sequential** — independent agents run simultaneously
2. **Focused scope** — each agent targets a different aspect
3. **Results consolidation happens in the command** — not in another agent
4. **User decisions between phases** — explicit approval gates

## Model Selection

Choose models based on the task, not prestige:

| Task | Model | Reason |
|------|-------|--------|
| Codebase exploration | sonnet | Fast, good at tracing code |
| Architecture design | sonnet | Balanced depth and speed |
| Bug detection | opus | Deep analysis catches subtle bugs |
| Convention checking | sonnet | Pattern matching, not deep reasoning |
| Quick validation | haiku | Fast, cheap, sufficient for checks |

## Tool Restriction

Agents should only have the tools they need:

- **Read-only agents** (explorer, reviewer): `Glob, Grep, LS, Read, NotebookRead`
- **Writing agents** (implementer): Add `Write, Edit, Bash`
- **Research agents**: Add `WebFetch, WebSearch`

Restricting tools prevents agents from making unintended changes and keeps them focused.

## Description Field

The `description` field in agent frontmatter serves as the trigger condition. Write it to clearly state when the agent should be used:

```yaml
description: Deeply analyzes existing codebase features by tracing execution paths, mapping architecture layers, understanding patterns and abstractions, and documenting dependencies to inform new development
```

This helps the orchestrator (command) know which agent to spawn for which task.
