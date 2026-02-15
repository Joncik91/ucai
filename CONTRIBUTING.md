# Contributing to Ucai

## Setup

```bash
git clone https://github.com/Joncik91/ucai.git
cd ucai
```

## Development

Test the plugin locally by pointing Claude Code at your clone:

```bash
claude --plugin-dir ./ucai
```

All commands will be available as `/ucai:init`, `/ucai:plan`, etc. Changes to commands, agents, and skills take effect on the next invocation — no build step.

Hook handler changes (`hooks/handlers/*.js`) take effect on the next session start.

## Project Structure

- `commands/*.md` — Slash commands (markdown + YAML frontmatter)
- `agents/*.md` — Subagents (read-only, sonnet model)
- `hooks/hooks.json` — Hook configuration
- `hooks/handlers/*.js` — Hook handler scripts (Node.js, no external deps)
- `scripts/*.js` — Utility scripts
- `skills/*/SKILL.md` — Skills with optional `references/` directories

## Conventions

- **JavaScript**: No semicolons, double quotes, camelCase, Node.js builtins only
- **Markdown**: YAML frontmatter, `## Phase N: Name` headers for workflows
- **File naming**: kebab-case everywhere
- **Agents**: Always `sonnet` model, read-only tools only

## Submitting Changes

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Test with `claude --plugin-dir ./ucai` — run the affected commands manually
4. Verify CI passes: JSON is valid, frontmatter exists, handlers parse correctly
5. Open a PR with a clear description of what changed and why

## Reporting Issues

Use [GitHub Issues](https://github.com/Joncik91/ucai/issues). Include:

- Claude Code version (`claude --version`)
- Which command you ran
- What you expected vs what happened
- Any error output

## Architecture Decisions

Ucai uses Claude Code's native systems — commands, agents, hooks, skills. If your change introduces something that doesn't map to a native system, it probably doesn't belong here. See the [README](README.md) for principles.
