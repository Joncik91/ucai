---
description: Cancel active ship pipeline
allowed-tools: Bash(test -f .claude/ucai-ship.local.md:*), Bash(rm .claude/ucai-ship.local.md), Bash(git worktree list*), Read(.claude/ucai-ship.local.md)
disable-model-invocation: true
---

# Cancel Ship

To cancel the ship pipeline:

1. Check if `.claude/ucai-ship.local.md` exists using Bash: `test -f .claude/ucai-ship.local.md && echo "EXISTS" || echo "NOT_FOUND"`

2. **If NOT_FOUND**: Say "No active ship pipeline found."

3. **If EXISTS**:
   - Read `.claude/ucai-ship.local.md` to get the current phase, milestone, and any worktree/branch info
   - Remove the file using Bash: `rm .claude/ucai-ship.local.md`
   - Report: "Cancelled ship pipeline (was at Phase N: PhaseName, milestone: M)"

4. **Cleanup warnings** (check each, report what applies):
   - Run `git worktree list` — if a ship worktree exists, warn: "Ship worktree still exists at [path]. Run `git worktree remove [path]` to clean up, or inspect it first."
   - If the state file mentioned a branch that was pushed, warn: "Remote branch [name] may still exist. Run `git push origin --delete [name]` if you want to remove it."
   - If a PR was created, warn: "A PR may have been created. Check your GitHub repo and close it if no longer needed."

5. Do NOT auto-delete worktrees, branches, or PRs — the user decides what to keep.
