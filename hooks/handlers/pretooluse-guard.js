#!/usr/bin/env node

// Ucai PreToolUse Guard
// Blocks Write/Edit calls targeting plugin config files
// Exit code 2 = block operation (stderr shown to Claude)
// Exit code 0 = allow operation

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

    const resolved = path.resolve(filePath)
    const relative = path.relative(PLUGIN_ROOT, resolved).replace(/\\/g, "/")

    const isProtected = process.platform === "win32"
      ? PROTECTED_FILES.some((f) => f.toLowerCase() === relative.toLowerCase())
      : PROTECTED_FILES.includes(relative)

    if (isProtected) {
      process.stderr.write(
        "BLOCKED: " + relative + " is a protected ucai config file. " +
        "Ask the user for permission before modifying it."
      )
      process.exit(2)
    }

    process.exit(0)
  } catch {
    process.exit(0)
  }
})
