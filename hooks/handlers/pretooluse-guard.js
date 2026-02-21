#!/usr/bin/env node

// Ucai PreToolUse Guard
// Guards Write/Edit calls targeting plugin config files
// Exit code 0 always — decision communicated via hookSpecificOutput:
//   permissionDecision "ask"   = pause and show user a dialog
//   permissionDecision "allow" = auto-approve (path normalization only case)
//   no JSON output             = fast path allow (normal file, clean path)
// updatedInput inside hookSpecificOutput normalizes backslash paths to forward slashes

const path = require("path")

const PROTECTED_FILES = [
  "plugin.json",
  "marketplace.json",
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
    const normalized = filePath.replace(/\\/g, "/")
    const needsNormalization = filePath !== normalized

    const isProtected = process.platform === "win32"
      ? PROTECTED_FILES.some((f) => f.toLowerCase() === relative.toLowerCase())
      : PROTECTED_FILES.includes(relative)

    if (!isProtected && !needsNormalization) {
      process.exit(0)
    }

    const specific = { hookEventName: "PreToolUse" }

    if (isProtected) {
      specific.permissionDecision = "ask"
      specific.permissionDecisionReason =
        relative + " is a protected ucai config file. Allow Claude to modify it?"
    } else {
      specific.permissionDecision = "allow"
    }

    if (needsNormalization) {
      specific.updatedInput = { ...data.tool_input, file_path: normalized }
    }

    process.stdout.write(JSON.stringify({ hookSpecificOutput: specific }))
    process.exit(0)
  } catch {
    process.exit(0)
  }
})
