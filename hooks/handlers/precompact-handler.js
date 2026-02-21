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
    const taskBody = fmMatch[2] ? fmMatch[2].trim() : ""

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

    const lines = ["[Ucai iterate loop — pre-compaction recovery context]"]
    lines.push("Iteration: " + iteration + "/" + maxDisplay)
    if (completionPromise && completionPromise !== "null") {
      lines.push("Completion promise: <promise>" + completionPromise + "</promise>")
    }
    lines.push("State file: .claude/ucai-iterate.local.md")
    if (taskBody) {
      lines.push("")
      lines.push("Task:")
      lines.push(taskBody)
    }
    lines.push("")
    lines.push("Continue the iterate loop after compaction. The task and iteration state are preserved on disk.")

    process.stdout.write(JSON.stringify({ systemMessage: lines.join("\n") }))
    process.exit(0)
  } catch {
    process.exit(0)
  }
})
