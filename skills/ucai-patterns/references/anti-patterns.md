# Anti-Patterns

Named mistakes to avoid when building Claude Code plugins. Each has a symptom, why it fails, and the fix.

## Agent Anti-Patterns

### Overhead Spawn
**Symptom**: Spawning a sub-agent for a task that takes one tool call.
**Why it fails**: Agent spawn overhead (context setup, tool loading) exceeds the work itself.
**Fix**: If the task is atomic (single file read, one edit, one search), do it directly in the command.

### Unscoped Agent
**Symptom**: Agent has access to Write, Edit, Read, Glob, Grep, Bash, and everything else.
**Why it fails**: Agents with write access can accidentally modify files outside their mission. Read-only agents (`Explore` subagent type) cannot break things.
**Fix**: Restrict tools to what the agent actually needs. Use `Explore` for analysis/research agents.

### Monolith Agent
**Symptom**: One agent handles exploration, implementation, testing, and review.
**Why it fails**: Context fills up fast. Agent loses focus. No parallelism possible.
**Fix**: Split into focused agents (explorer, implementer, reviewer). Spawn in parallel where independent.

### Split File
**Symptom**: Two parallel agents both write to the same file.
**Why it fails**: Last write wins. Earlier agent's work is silently overwritten.
**Fix**: Assign exclusive file ownership per agent. If two agents need the same file, make it sequential or consolidate in the orchestrating command.

## Hook Anti-Patterns

### Console Corruption
**Symptom**: Hook uses `console.log()` for output.
**Why it fails**: Claude Code parses hook stdout as JSON. `console.log()` adds a newline and may interleave with the JSON output, causing parse failures.
**Fix**: Always use `process.stdout.write(JSON.stringify(...))` for hook output. Use `console.error()` for debug logging.

### Bare Path Join
**Symptom**: Building paths with string concatenation (`dir + "/" + file`).
**Why it fails**: Windows uses backslashes. Missing segments produce invalid paths. No normalization.
**Fix**: Always use `path.resolve()` or `path.join()`. Normalize Windows paths with `.replace(/\\/g, "/")` when needed for display.

### Missing CRLF
**Symptom**: Frontmatter regex fails on Windows: `/^---\n/` doesn't match `---\r\n`.
**Why it fails**: Windows line endings are `\r\n`. Regex without `\r?` silently fails to parse.
**Fix**: Always use `\r?` before `\n` in frontmatter patterns: `/^---\r?\n([\s\S]*?)\r?\n---/`

### Blind Block
**Symptom**: Stop hook blocks exit without checking if state file exists or is valid.
**Why it fails**: Blocks the user from exiting when there is no active loop. Requires force-quit.
**Fix**: Check state file existence and validate frontmatter before any blocking decision. Exit cleanly on invalid state.

## Command Anti-Patterns

### Implementing Commander
**Symptom**: Command markdown contains implementation logic (writing code, editing files directly).
**Why it fails**: Commands are orchestrators. They coordinate phases and approval gates. Implementation belongs in agents or direct tool calls delegated by the command.
**Fix**: Commands define phases with goals and actions. Agents do the work. Commands consolidate results.

### Missing Gate
**Symptom**: Destructive phase (file deletion, dependency changes, release tagging) runs without user approval.
**Why it fails**: No opportunity to catch mistakes before irreversible changes.
**Fix**: Add **BOLD CAPS** approval gates before destructive phases. Wait for explicit user confirmation.

### Eager Loading
**Symptom**: Command reads all spec files, all source files, and all config at the start.
**Why it fails**: Burns context window before any work begins. Most loaded context is never used.
**Fix**: Load context progressively. Phase 1 loads what Phase 1 needs. Later phases load on demand.

## Skill Anti-Patterns

### CLAUDE.md Stuffing
**Symptom**: Framework conventions, API patterns, or coding standards dumped into CLAUDE.md.
**Why it fails**: CLAUDE.md is loaded every session. Framework knowledge Claude already has wastes context.
**Fix**: CLAUDE.md is for project-specific facts only (file structure, dev commands, conventions unique to this project). Framework knowledge belongs in skills loaded on demand.

### Monolith Skill
**Symptom**: Single SKILL.md file with 500+ lines covering everything.
**Why it fails**: Entire skill loads into context even when only one section is relevant.
**Fix**: Main SKILL.md has summaries and Red Flags. Detailed content lives in `references/` files loaded on demand.

### Headless Skill
**Symptom**: Skill directory has reference files but SKILL.md has no frontmatter.
**Why it fails**: SessionStart scans for `name` and `description` in YAML frontmatter. No frontmatter = skill is invisible.
**Fix**: Every SKILL.md needs frontmatter with `name` and `description`. The description triggers skill loading.
