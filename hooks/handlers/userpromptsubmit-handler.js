#!/usr/bin/env node

// Ucai UserPromptSubmit Hook
// If an iterate loop is active, injects loop context into additionalContext
// If tasks/todo.md has unchecked items, injects active task

const fs = require("fs")

const STATE_FILE = ".claude/ucai-iterate.local.md"
const TODO_FILE = "tasks/todo.md"

// Early exit before stdin if no iterate loop AND no tasks
const hasIterate = fs.existsSync(STATE_FILE)
const hasTodo = fs.existsSync(TODO_FILE)

if (!hasIterate && !hasTodo) {
  process.exit(0)
}

let input = ""
process.stdin.setEncoding("utf8")
process.stdin.on("data", (chunk) => (input += chunk))
process.stdin.on("end", () => {
  try {
    const parts = []

    // Iterate loop context
    if (hasIterate) {
      const stateContent = fs.readFileSync(STATE_FILE, "utf8")
      const fmMatch = stateContent.match(/^---\r?\n([\s\S]*?)\r?\n---/)
      if (fmMatch) {
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
        parts.push(msg)
      }
    }

    // Active task from tasks/todo.md
    if (hasTodo) {
      const todoContent = fs.readFileSync(TODO_FILE, "utf8")
      const uncheckedMatch = todoContent.match(/- \[ \] (.+)/)
      if (uncheckedMatch) {
        parts.push("Active task: " + uncheckedMatch[1].trim())
      }
    }

    if (parts.length > 0) {
      process.stdout.write(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "UserPromptSubmit",
          additionalContext: parts.join(". ")
        }
      }))
    }
    process.exit(0)
  } catch {
    process.exit(0)
  }
})
