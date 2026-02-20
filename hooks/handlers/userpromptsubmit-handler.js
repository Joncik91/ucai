#!/usr/bin/env node

// Ucai UserPromptSubmit Hook
// If an iterate loop is active, injects loop context into additionalContext

const fs = require("fs")

const STATE_FILE = ".claude/ucai-iterate.local.md"

let input = ""
process.stdin.setEncoding("utf8")
process.stdin.on("data", (chunk) => (input += chunk))
process.stdin.on("end", () => {
  try {
    if (!fs.existsSync(STATE_FILE)) {
      process.exit(0)
    }

    const stateContent = fs.readFileSync(STATE_FILE, "utf8")
    const fmMatch = stateContent.match(/^---\r?\n([\s\S]*?)\r?\n---/)
    if (!fmMatch) {
      process.exit(0)
    }

    const frontmatter = fmMatch[1]
    function getField(name) {
      const m = frontmatter.match(new RegExp("^" + name + ":\\s*(.*)$", "m"))
      return m ? m[1].trim() : null
    }

    const iteration = getField("iteration")
    const maxIterations = getField("max_iterations")
    let completionPromise = getField("completion_promise")
    if (completionPromise && completionPromise.startsWith('"') && completionPromise.endsWith('"')) {
      completionPromise = completionPromise.slice(1, -1)
    }

    const maxDisplay = maxIterations && maxIterations !== "0" ? maxIterations : "unlimited"
    let msg = "Ucai iterate loop active (iteration " + iteration + "/" + maxDisplay + ")"
    if (completionPromise && completionPromise !== "null") {
      msg += " — complete by outputting <promise>" + completionPromise + "</promise>"
    }

    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "UserPromptSubmit",
        additionalContext: msg
      }
    }))
    process.exit(0)
  } catch {
    process.exit(0)
  }
})
