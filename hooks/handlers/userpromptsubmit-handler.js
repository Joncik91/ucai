#!/usr/bin/env node

// Ucai UserPromptSubmit Hook
// If an iterate loop is active, injects loop context into additionalContext
// If tasks/todo.md has unchecked items, injects active task

const fs = require("fs")
const path = require("path")

const STATE_FILE = ".claude/ucai-iterate.local.md"
const SHIP_STATE_FILE = ".claude/ucai-ship.local.md"
const TODO_FILE = "tasks/todo.md"
const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, "../..")

// Early exit before stdin if no iterate loop AND no ship AND no tasks AND no engine
const hasIterate = fs.existsSync(STATE_FILE)
const hasShip = fs.existsSync(SHIP_STATE_FILE)
const hasTodo = fs.existsSync(TODO_FILE)
const hasEngine = fs.existsSync(".claude/ucai-build-engine.local.json") || fs.existsSync(".claude/ucai-ship-engine.local.json")

if (!hasIterate && !hasShip && !hasTodo && !hasEngine) {
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

    // Ship pipeline context
    if (hasShip) {
      try {
        const shipContent = fs.readFileSync(SHIP_STATE_FILE, "utf8")
        const shipFm = shipContent.match(/^---\r?\n([\s\S]*?)\r?\n---/)
        if (shipFm) {
          const frontmatter = shipFm[1]
          function getShipField(name) {
            const m = frontmatter.match(new RegExp("^" + name + ":\\s*(.*)$", "m"))
            return m ? m[1].trim() : null
          }

          const phase = getShipField("phase")
          const milestone = getShipField("milestone")
          const phaseNames = [
            "Setup", "Spec Resolution", "Explore", "Detect Infrastructure",
            "Implement", "Verify Loop", "Light Review", "Create PR", "Cleanup"
          ]
          const phaseName = phaseNames[parseInt(phase, 10)] || "Phase " + phase
          let msg = "Ucai ship pipeline active — Phase " + phase + ": " + phaseName
          if (milestone && milestone !== "null") msg += " | Milestone: " + milestone
          parts.push(msg)
        }
      } catch {}
    }

    // Active task from tasks/todo.md
    if (hasTodo) {
      const todoContent = fs.readFileSync(TODO_FILE, "utf8")
      const uncheckedMatch = todoContent.match(/- \[ \] (.+)/)
      if (uncheckedMatch) {
        parts.push("Active task: " + uncheckedMatch[1].trim())
      }
    }

    // Engine status
    if (hasEngine) {
      try {
        const factory = require(path.join(PLUGIN_ROOT, "scripts", "engine-factory.js"))
        for (const pipeline of ["build", "ship"]) {
          const status = factory.readEngineStatus(pipeline)
          if (!status) continue
          let msg = "Engine (" + pipeline + "): " + status.completeTasks + "/" + status.totalTasks + " tasks, " + status.completeDeps + "/" + status.totalDeps + " deps"
          if (status.lastBlockedGate) msg += " | blocked: " + status.lastBlockedGate.slice(0, 50)
          parts.push(msg)
        }
      } catch {}
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
