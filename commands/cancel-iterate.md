---
description: Cancel active iterate loop
allowed-tools: Bash(test -f .claude/ucai-iterate.local.md:*), Bash(rm .claude/ucai-iterate.local.md), Read(.claude/ucai-iterate.local.md)
---

# Cancel Iterate

To cancel the iterate loop:

1. Check if `.claude/ucai-iterate.local.md` exists using Bash: `test -f .claude/ucai-iterate.local.md && echo "EXISTS" || echo "NOT_FOUND"`

2. **If NOT_FOUND**: Say "No active iterate loop found."

3. **If EXISTS**:
   - Read `.claude/ucai-iterate.local.md` to get the current iteration number
   - Remove the file using Bash: `rm .claude/ucai-iterate.local.md`
   - Report: "Cancelled iterate loop (was at iteration N)"
