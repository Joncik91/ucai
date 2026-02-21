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

## Agent Patterns

Agents are focused workers, not personas.

**Native agent format**: Markdown files with YAML frontmatter declaring name, description, tools, model, and color. Each agent has a specific mission.

**Key patterns**:
- Spawn 2-3 agents in parallel for independent analysis
- Assign appropriate models (sonnet for exploration, opus for deep bug analysis)
- Restrict tool access to what each agent needs
- Consolidate results in the orchestrating command, not in another agent

For detailed patterns, see: `references/agent-patterns.md`

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

## Hook Patterns

Hooks are lifecycle event handlers. They are the primary extension point.

**Hook events**: SessionStart, PreToolUse, PostToolUse, PostToolUseFailure, Stop, UserPromptSubmit, SubagentStop, SubagentStart, PreCompact, SessionEnd, PermissionRequest

**Key patterns**:
- SessionStart: Inject project context
- PreToolUse: Guardrails before writes/edits
- Stop: Iteration control (block exit, feed task back)
- Exit code 2 blocks the operation

For detailed patterns, see: `references/hook-patterns.md`
