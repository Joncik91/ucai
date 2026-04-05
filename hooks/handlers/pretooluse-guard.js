#!/usr/bin/env node

// Ucai PreToolUse Guard
// Guards Write/Edit calls targeting plugin config files, CLAUDE.md, and skill files
// Exit code 0 always — decision communicated via hookSpecificOutput:
//   permissionDecision "ask" = pause and show user a dialog
//   no JSON output           = allow (normal file, fast path)

const fs = require("fs")
const path = require("path")

const PROTECTED_FILES = [
  ".claude-plugin/plugin.json",
  ".claude-plugin/marketplace.json",
  "hooks/hooks.json"
]

const PROTECTED_NAMES = [
  "CLAUDE.md"
]

const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || process.cwd()

function isSkillFile(relative) {
  // Match skills/**/SKILL.md or skills/**/*.md under plugin root
  const normalized = relative.replace(/\\/g, "/")
  return /^skills\/.*\.md$/i.test(normalized)
}

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
    const basename = path.basename(relative)

    let isProtected = false
    let reason = ""

    // Check exact protected paths (case-insensitive on Windows)
    if (process.platform === "win32") {
      isProtected = PROTECTED_FILES.some((f) => f.toLowerCase() === relative.toLowerCase())
    } else {
      isProtected = PROTECTED_FILES.includes(relative)
    }

    if (isProtected) {
      reason = relative + " is a protected ucai config file."
    }

    // Check protected filenames (e.g. CLAUDE.md anywhere in project)
    if (!isProtected) {
      const matchName = process.platform === "win32"
        ? PROTECTED_NAMES.some((n) => n.toLowerCase() === basename.toLowerCase())
        : PROTECTED_NAMES.includes(basename)
      if (matchName) {
        isProtected = true
        reason = basename + " is a protected project file."
      }
    }

    // Check skill .md files
    if (!isProtected && isSkillFile(relative)) {
      isProtected = true
      reason = relative + " is a protected ucai skill file."
    }

    if (!isProtected) {
      process.exit(0)
    }

    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "ask",
        permissionDecisionReason:
          reason + " Allow Claude to modify it?"
      }
    }))
    process.exit(0)
  } catch {
    process.exit(0)
  }
})
