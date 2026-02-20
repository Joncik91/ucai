# Changelog

All notable changes to Ucai are documented here.

## [v1.1.0] - 2026-02-20

### Added
- SubagentStop handler — blocks subagents that return empty final
  messages; injects a one-line result preview into session context
  for non-empty outputs (`subagent-stop-handler.js`)
- PreCompact handler — if an iterate loop is active, reads loop
  state and injects it into the compaction summary so iteration
  survives context window fills (`precompact-handler.js`)
- UserPromptSubmit handler — injects active iterate loop context
  into every user prompt turn; non-blocking (`userpromptsubmit-handler.js`)
- SessionEnd handler — cleans up stale iterate state file on
  session termination (`session-end-handler.js`)

### Changed
- PreToolUse guard: replaced hard deny with `permissionDecision: "ask"`
  so users can intentionally edit plugin config files when needed
- PreToolUse guard: added `updatedInput` path normalization
  (backslash → forward slash) for cross-platform Write/Edit compat

### Documentation
- CLAUDE.md Hook conventions: all 7 hooks documented (added
  UserPromptSubmit, SubagentStop, MCP note; updated Stop entry)
- CLAUDE.md Key Files: added userpromptsubmit-handler.js and
  subagent-stop-handler.js entries
- README: added hook lifecycle coverage to "What Ucai Gives You"
- workflow-guide: added PreCompact context preservation note in
  the iterate section
