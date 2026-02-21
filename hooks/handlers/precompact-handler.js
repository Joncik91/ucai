#!/usr/bin/env node

// Ucai PreCompact Hook
// If an iterate loop is active, surfaces loop state in systemMessage
// before context compaction runs

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
    const fmMatch = stateContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
    if (!fmMatch) {
      process.exit(0)
    }

    const frontmatter = fmMatch[1]
    const rawBody = fmMatch[2] ? fmMatch[2].trim() : ""
    const taskBody = rawBody.length > 200 ? rawBody.slice(0, 200) + "..." : rawBody

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
    let msg = "Ucai iterate loop is active (iteration " + iteration + "/" + maxDisplay + ")"
    if (completionPromise && completionPromise !== "null") {
      msg += " | Completion promise: <promise>" + completionPromise + "</promise>"
    }
    msg += " — state preserved in .claude/ucai-iterate.local.md"
    if (taskBody) {
      msg += " | Task: " + taskBody
    }

    process.stdout.write(JSON.stringify({ systemMessage: msg }))
    process.exit(0)
  } catch {
    process.exit(0)
  }
})
