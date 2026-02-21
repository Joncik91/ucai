---
name: ucai-patterns
description: Use when the user asks about Claude Code best practices, how to write agents, how to use hooks, how to manage context, or how to work effectively with Claude Code's native systems
---

# Ucai Patterns

Best practices for working with Claude Code's native architecture. These patterns are derived from how Anthropic builds their own plugins.

## Context Management

The context window is a shared resource. Protect it.

**Native tools for context**:
- **SessionStart hooks**: Inject project-specific context at session start
- **TodoWrite**: Track progress so context compaction doesn't lose your place
- **Skills with progressive disclosure**: Metadata always loaded, details on demand
- **File system**: Use .local.md files for persistent state between iterations

**Anti-patterns**:
- Stuffing CLAUDE.md with framework instructions (use project facts only)
- Repeating information Claude already knows (conventions of popular frameworks, etc.)
- Loading everything upfront instead of on demand

For detailed patterns, see: `references/context-management.md`

**Red Flags — Context Management**

| Thought | Reality |
|---------|---------|
| "CLAUDE.md is the right place for this framework pattern" | CLAUDE.md is for project facts only. Framework conventions belong in skills. |
| "I'll load all context upfront to be safe" | Upfront loading burns context before it's needed. Load on demand. |
| "The context window is large enough" | Large ≠ infinite. Shared resource. Protect it. |

## Agent Patterns

Agents are focused workers, not personas.

**Native agent format**: Markdown files with YAML frontmatter declaring name, description, tools, model, and color. Each agent has a specific mission.

**Key patterns**:
- Spawn 2-3 agents in parallel for independent analysis
- Assign appropriate models (sonnet for exploration, opus for deep bug analysis)
- Restrict tool access to what each agent needs
- Consolidate results in the orchestrating command, not in another agent

For detailed patterns, see: `references/agent-patterns.md`

**Red Flags — Agent Patterns**

| Thought | Reality |
|---------|---------|
| "I'll spawn agents one at a time for clarity" | Serial spawning wastes 2-3 seconds per round-trip. Batch in one message. |
| "This agent needs all tools available" | Restrict tools to what the agent actually needs. Scope matters. |
| "I'll have one agent do everything" | Focused agents outperform generalist agents on complex tasks. |

## Batch Operations

The golden rule: **1 message = ALL related operations**. Every round-trip to Claude adds latency. Batch everything that can go together.

**Good patterns**:
- Spawn ALL parallel agents in one message (multiple Task calls in one response)
- Read ALL files you need in one message (multiple Read calls simultaneously)
- Batch ALL TodoWrite updates in a single call, not one per item
- Stage all writes for one phase before moving to the next

**Anti-patterns**:
- Spawning one agent, waiting for it, then spawning the next
- Reading files one at a time in a loop across multiple messages
- Calling TodoWrite once per todo item across separate turns

**Why it matters**: In a 5-agent parallel analysis, serial spawning adds 4 unnecessary round-trips. At 2-3 seconds per round-trip, that is 8-12 seconds of pure latency before any work begins. Batching collapses this to a single round-trip.

For detailed patterns, see: `references/agent-patterns.md`

**Red Flags — Batch Operations**

| Thought | Reality |
|---------|---------|
| "I'll read this file, then decide what to read next" | Speculatively read everything potentially useful in one message. |
| "I'll update todos one at a time as I finish each" | Batch all TodoWrite updates in a single call. |
| "Let me spawn this agent first, then spawn the next" | All parallel agents go in one message. Always. |
| "Sequential is safer" | Sequential adds latency with zero safety benefit for independent tasks. |

## Hook Patterns

Hooks are lifecycle event handlers. They are the primary extension point.

**Hook events**: SessionStart, PreToolUse, PostToolUse, PostToolUseFailure, Stop, UserPromptSubmit, SubagentStop, SubagentStart, PreCompact, SessionEnd, PermissionRequest

**Key patterns**:
- SessionStart: Inject project context
- PreToolUse: Guardrails before writes/edits
- Stop: Iteration control (block exit, feed task back)
- Exit code 2 blocks the operation

For detailed patterns, see: `references/hook-patterns.md`

**Red Flags — Hook Patterns**

| Thought | Reality |
|---------|---------|
| "The hook will handle this automatically" | Hooks run on lifecycle events. Read the handler to confirm scope. |
| "Exit code 2 might be too aggressive" | Exit code 2 is the designed block mechanism. Use it when blocking is correct. |
| "I'll skip the Stop hook iteration check" | The iterate loop depends on the Stop hook. Skipping breaks the loop. |
