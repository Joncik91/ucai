#!/usr/bin/env node

// Ucai PreCompact Hook
// Surfaces iterate loop state, task progress, and latest lesson
// in systemMessage before context compaction runs

const fs = require("fs")
const path = require("path")

const STATE_FILE = ".claude/ucai-iterate.local.md"
const SHIP_STATE_FILE = ".claude/ucai-ship.local.md"
const TODO_FILE = "tasks/todo.md"
const LESSONS_FILE = "tasks/lessons.md"
const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, "../..")

let input = ""
process.stdin.setEncoding("utf8")
process.stdin.on("data", (chunk) => (input += chunk))
process.stdin.on("end", () => {
  try {
    const hasIterate = fs.existsSync(STATE_FILE)
    const hasShip = fs.existsSync(SHIP_STATE_FILE)
    const hasTodo = fs.existsSync(TODO_FILE)
    const hasLessons = fs.existsSync(LESSONS_FILE)

    if (!hasIterate && !hasShip && !hasTodo && !hasLessons) {
      process.exit(0)
    }

    const lines = []

    // Iterate state
    if (hasIterate) {
      const stateContent = fs.readFileSync(STATE_FILE, "utf8")
      const fmMatch = stateContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
      if (fmMatch) {
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

        lines.push("[Ucai iterate loop — pre-compaction recovery context]")
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
      }
    }

    // Ship pipeline state
    if (hasShip) {
      try {
        const shipContent = fs.readFileSync(SHIP_STATE_FILE, "utf8")
        const shipFm = shipContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
        if (shipFm) {
          const frontmatter = shipFm[1]
          const specText = shipFm[2] ? shipFm[2].trim() : ""

          function getShipField(name) {
            const m = frontmatter.match(new RegExp("^" + name + ":\\s*(.*)$", "m"))
            return m ? m[1].trim() : null
          }

          const phase = getShipField("phase")
          const milestone = getShipField("milestone")
          const fixAttempts = getShipField("fix_attempts")
          const maxFixAttempts = getShipField("max_fix_attempts")
          const testCmd = getShipField("test_cmd")
          const lintCmd = getShipField("lint_cmd")

          const phaseNames = [
            "Setup", "Spec Resolution", "Explore", "Detect Infrastructure",
            "Implement", "Verify Loop", "Light Review", "Create PR", "Cleanup"
          ]
          const phaseName = phaseNames[parseInt(phase, 10)] || "Phase " + phase

          lines.push("[Ucai ship pipeline — pre-compaction recovery context]")
          lines.push("Phase: " + phase + " (" + phaseName + ")")
          if (milestone && milestone !== "null") lines.push("Milestone: " + milestone)
          if (fixAttempts && fixAttempts !== "0") lines.push("Fix attempts: " + fixAttempts + "/" + maxFixAttempts)
          if (testCmd && testCmd !== "null") lines.push("Test command: " + testCmd)
          if (lintCmd && lintCmd !== "null") lines.push("Lint command: " + lintCmd)
          lines.push("State file: .claude/ucai-ship.local.md")
          if (specText) {
            lines.push("")
            lines.push("Spec:")
            lines.push(specText)
          }
          lines.push("")
          lines.push("Continue the /ship pipeline from Phase " + phase + " after compaction.")
        }
      } catch {}
    }

    // Task progress
    if (hasTodo) {
      try {
        const todoContent = fs.readFileSync(TODO_FILE, "utf8")
        const done = (todoContent.match(/- \[x\]/g) || []).length
        const todo = (todoContent.match(/- \[ \]/g) || []).length
        const total = done + todo
        if (total > 0) {
          lines.push("[Ucai task progress — pre-compaction recovery context]")
          lines.push("Tasks: " + done + "/" + total + " done")
          // Find first unchecked item
          const uncheckedMatch = todoContent.match(/- \[ \] (.+)/)
          if (uncheckedMatch) {
            lines.push("Active task: " + uncheckedMatch[1].trim())
          }
        }
      } catch {}
    }

    // Latest lesson
    if (hasLessons) {
      try {
        const lessonsContent = fs.readFileSync(LESSONS_FILE, "utf8")
        const fmMatch = lessonsContent.match(/^---\r?\n([\s\S]*?)\r?\n---/)
        let count = 0
        if (fmMatch) {
          const countMatch = fmMatch[1].match(/^count:\s*(\d+)/m)
          if (countMatch) {
            count = parseInt(countMatch[1], 10)
          }
        }
        if (count === 0) {
          count = (lessonsContent.match(/^## \d{4}-\d{2}-\d{2}/gm) || []).length
        }
        if (count > 0) {
          lines.push("[Ucai lessons — pre-compaction recovery context]")
          lines.push("Lessons: " + count + " entries")
          // Extract latest lesson title (last ## heading)
          const headings = lessonsContent.match(/^## \d{4}-\d{2}-\d{2} .+$/gm)
          if (headings && headings.length > 0) {
            lines.push("Latest: " + headings[headings.length - 1].replace(/^## /, ""))
          }
        }
      } catch {}
    }

    // Engine state summary
    try {
      const factory = require(path.join(PLUGIN_ROOT, "scripts", "engine-factory.js"))
      for (const pipeline of ["build", "ship"]) {
        const status = factory.readEngineStatus(pipeline)
        if (!status) continue
        lines.push("[Ucai engine (" + pipeline + ") — pre-compaction recovery context]")
        lines.push("State: " + status.projectState + " | Tasks: " + status.completeTasks + "/" + status.totalTasks + " | Deps: " + status.completeDeps + "/" + status.totalDeps)
        if (status.lastBlockedGate) lines.push("Last blocked gate: " + status.lastBlockedGate)
        lines.push("Engine state file: .claude/ucai-" + pipeline + "-engine.local.json")
      }
    } catch {}

    if (lines.length > 0) {
      process.stdout.write(JSON.stringify({ systemMessage: lines.join("\n") }))
    }
    process.exit(0)
  } catch {
    process.exit(0)
  }
})
