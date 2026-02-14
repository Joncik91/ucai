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

## Hook Patterns

Hooks are lifecycle event handlers. They are the primary extension point.

**Five events**: SessionStart, PreToolUse, PostToolUse, Stop, UserPromptSubmit

**Key patterns**:
- SessionStart: Inject project context
- PreToolUse: Guardrails before writes/edits
- Stop: Iteration control (block exit, feed task back)
- Exit code 2 blocks the operation

For detailed patterns, see: `references/hook-patterns.md`
