# Ucai — Use Claude Code As Is

## Philosophy

Ucai is not a framework. It is a Claude Code plugin that uses the tool's native architecture — commands, agents, hooks, and skills — exactly as Anthropic designed them.

Community frameworks (GSD, BMAD, Ralph, Agent OS) solve real problems but were built from the outside looking in. Ucai solves the same problems from the inside out:

- **Context rot** → SessionStart hooks + native context management (not bash wrappers)
- **No structure** → Commands with phased workflows + parallel agents (not persona prompts)
- **No guardrails** → PreToolUse/PostToolUse hooks (not mega CLAUDE.md configs)
- **No iteration** → Stop hooks for controlled loops (not external scripts)
- **No onboarding** → Agent-powered project analysis (not template dumps)

## Principles

1. **Use native systems** — Commands, agents, hooks, skills. Not wrappers.
2. **Context is a public good** — Only add what Claude doesn't already know. Use progressive disclosure via skills.
3. **Agents are not personas** — They have model assignments, tool declarations, and focused missions. Not personalities.
4. **Explicit approval gates** — Never proceed without user decision at architecture and implementation boundaries.
5. **Parallel by default** — Spawn multiple focused agents simultaneously. Consolidate results.
6. **CLAUDE.md is for project guidelines** — Not framework configuration. Keep it about the codebase.

## Commands

- `/init` — Analyze a project and generate proper CLAUDE.md + setup
- `/build` — Feature development with explore → design → approve → implement → review
- `/iterate` — Controlled autonomous iteration using native Stop hooks
- `/review` — Multi-agent code review with parallel validation

## Architecture

This plugin follows the exact same structure as Anthropic's own plugins (feature-dev, code-review, ralph-wiggum):

```
ucai/
├── commands/     # Slash commands (markdown + YAML frontmatter)
├── agents/       # Subagents (markdown with model/tools/description)
├── hooks/        # Lifecycle handlers (hooks.json + shell scripts)
└── skills/       # Progressive disclosure (SKILL.md + references/)
```

Every component maps to a native Claude Code system. Nothing is invented.
