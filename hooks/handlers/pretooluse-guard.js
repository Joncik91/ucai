#!/usr/bin/env node

// Ucai PreToolUse Guard
// Guards Write/Edit calls targeting plugin config files
// Exit code 0 always — decision communicated via hookSpecificOutput:
//   permissionDecision "ask" = pause and show user a dialog
//   no JSON output           = allow (normal file, fast path)

const path = require("path")

const PROTECTED_FILES = [
  "plugin.json",
  ".claude-plugin/marketplace.json",
  "hooks/hooks.json"
]

const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || process.cwd()

let input = ""
process.stdin.setEncoding("utf8")
process.stdin.on("data", (chunk) => (input += chunk))
process.stdin.on("end", () => {
  try {
    const data = JSON.parse(input)
    const filePath = data.tool_input?.file_path
    if (!filePath) {
      process.exit(0)
    }

    const resolved = path.resolve(PLUGIN_ROOT, filePath)
    const relative = path.relative(PLUGIN_ROOT, resolved).replace(/\\/g, "/")

    const isProtected = process.platform === "win32"
      ? PROTECTED_FILES.some((f) => f.toLowerCase() === relative.toLowerCase())
      : PROTECTED_FILES.includes(relative)

    if (!isProtected) {
      process.exit(0)
    }

    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "ask",
        permissionDecisionReason:
          relative + " is a protected ucai config file. Allow Claude to modify it?"
      }
    }))
    process.exit(0)
  } catch {
    process.exit(0)
  }
})
