---
description: Generate changelog, bump version, and create git tag
argument-hint: "[major|minor|patch|vX.Y.Z]"
---

# Release

You are helping a developer prepare a release. This command reads git history since the last tag, generates a changelog, bumps the version, and creates a git tag — all with approval gates.

## Core Principles

- **Git history is the source of truth**: Changelog comes from commits, not guesswork
- **Cross-reference specs**: Connect releases to planned work via requirements.md
- **Never push without permission**: Create the tag locally, let the user push
- **Approval at every step**: Changelog, version bump, and tag each need sign-off
- **Track progress**: Use TodoWrite throughout

## Skill Loading — MANDATORY

Before starting, load the DevOps skill.

1. Load `Skill(ucai:senior-devops)` — releasing is DevOps work

**State that you loaded the skill before proceeding.**

---

## Phase 1: Analyze

**Goal**: Understand the current state and determine the release version.

Input: $ARGUMENTS

**Actions**:
1. Create todo list with all phases (1–4)
2. **Find current version** — check in order, use the first found:
   - `package.json` → `"version"` field
   - `Cargo.toml` → `version` under `[package]`
   - `pyproject.toml` → `version` field
   - `version.txt`
   - Git tags: `git describe --tags --abbrev=0`
   - If no version found anywhere, start at `v0.0.0`
3. **Find last tag**: `git describe --tags --abbrev=0 2>/dev/null`
4. **Get commits since last tag**: `git log <last-tag>..HEAD --oneline`
   - If no tags exist, use `git log --oneline`
5. **Load project context** (if available):
   - Check `.claude/requirements.md` — identify requirements completed since last release (marked `[x]`)
6. **Determine version bump**:
   - If `$ARGUMENTS` specifies a version (e.g., `v2.1.0`): use it directly
   - If `$ARGUMENTS` specifies a bump type (`major`, `minor`, `patch`): apply to current version
   - If `$ARGUMENTS` is empty: analyze commits and suggest:
     - Breaking changes (commit messages with "breaking", "BREAKING CHANGE", major refactors) → suggest `major`
     - New features ("add", "feat", "implement", "new") → suggest `minor`
     - Bug fixes and maintenance only → suggest `patch`
7. Present summary to user:
   - Current version
   - Commits since last release (count + key highlights)
   - Completed requirements (if requirements.md exists)
   - Proposed new version
8. **Wait for user to confirm or adjust the version**

---

## Phase 2: Changelog

**Goal**: Generate a structured changelog from git history.

**Actions**:
1. Categorize commits by type using best-effort classification:

   | Category | Commit patterns |
   |----------|----------------|
   | **Added** | "add", "feat", "implement", "new", "introduce" |
   | **Fixed** | "fix", "bug", "patch", "resolve", "correct" |
   | **Changed** | "refactor", "improve", "update", "enhance", "optimize" |
   | **Removed** | "remove", "delete", "drop", "deprecate" |
   | **Documentation** | "doc", "readme", "comment" |
   | **Other** | Everything else |

   - Match against the first word or conventional commit prefix (e.g., `feat:`, `fix:`)
   - Skip merge commits and version bump commits from previous releases

2. If `.claude/requirements.md` exists, cross-reference:
   - Map completed requirements to commits where possible
   - Include requirement names alongside commit descriptions for richer context

3. Draft changelog entry in Keep a Changelog format:

```markdown
## [vX.Y.Z] - YYYY-MM-DD

### Added
- Description of feature (commit hash)

### Fixed
- Description of fix (commit hash)

### Changed
- Description of change (commit hash)
```

   - Omit empty categories
   - Use clear, user-facing descriptions (rewrite terse commit messages if needed)

4. Present the changelog draft to user
5. **DO NOT PROCEED WITHOUT USER APPROVAL OF THE CHANGELOG**

---

## Phase 3: Version

**Goal**: Bump version and write changelog.

**Actions**:
1. Determine which version file(s) to update (same detection as Phase 1):
   - `package.json`: update `"version"` field
   - `Cargo.toml`: update `version` under `[package]`
   - `pyproject.toml`: update `version` field
   - Other: detect and handle, or ask user which file holds the version
2. Write the version bump to the version file
3. Write the changelog:
   - If `CHANGELOG.md` exists: prepend the new entry after the title/header
   - If `CHANGELOG.md` does not exist: create it with a title and the new entry
4. Present the changes to user (which files were modified, what changed)

---

## Phase 4: Tag

**Goal**: Commit and tag the release.

**DO NOT PROCEED WITHOUT USER APPROVAL**

**Actions**:
1. Stage the changed files (version file + CHANGELOG.md)
2. Create a git commit with message: `Release vX.Y.Z`
3. Create an annotated git tag: `git tag -a vX.Y.Z -m "Release vX.Y.Z"`
4. **Do NOT push** — tell the user to push when ready:
   - `git push && git push --tags`
5. Mark todos complete
6. Summarize:
   - New version: `vX.Y.Z`
   - Changelog highlights (top 3 items)
   - Files changed
   - Tag created
   - Push command to run when ready
