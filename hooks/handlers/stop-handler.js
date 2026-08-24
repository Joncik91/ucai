#!/usr/bin/env node

// Ucai Stop Hook
// Drives the /ship pipeline by feeding the task back as input until phase 8

const fs = require("fs")
const path = require("path")

const SHIP_STATE_FILE = ".claude/ucai-ship.local.md"
const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, "../..")

// No ship pipeline active — nothing to do
if (!fs.existsSync(SHIP_STATE_FILE)) {
  process.exit(0)
}

handleShipPipeline()

function handleShipPipeline() {
  try {
    const stateContent = fs.readFileSync(SHIP_STATE_FILE, "utf8")

    const fmMatch = stateContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
    if (!fmMatch) {
      console.error("Ucai ship: State file has no frontmatter")
      process.exit(0)
    }

    const frontmatter = fmMatch[1]
    const specText = fmMatch[2].trim()

    function getShipField(name) {
      const m = frontmatter.match(new RegExp("^" + name + ":\\s*(.*)$", "m"))
      return m ? m[1].trim() : null
    }

    const phase = parseInt(getShipField("phase"), 10)
    const milestone = getShipField("milestone")

    if (isNaN(phase)) {
      console.error("Ucai ship: State file corrupted (phase: '" + getShipField("phase") + "')")
      process.exit(0)
    }

    // Pipeline complete — allow exit
    if (phase >= 8) {
      try { fs.unlinkSync(SHIP_STATE_FILE) } catch {}
      process.exit(0)
    }

    // Phase-aware continuation prompts
    const phaseNames = [
      "Setup",
      "Spec Resolution",
      "Explore",
      "Detect Infrastructure",
      "Implement",
      "Verify Loop",
      "Light Review",
      "Create PR",
      "Cleanup & Report",
    ]

    const phaseName = phaseNames[phase] || "Phase " + phase
    const milestoneInfo = milestone && milestone !== "null" ? " | Milestone: " + milestone : ""

    let continuationPrompt
    if (phase <= 1) {
      continuationPrompt = "Continue the /ship pipeline. Resolve the spec and start exploring the codebase. Spec: " + specText
    } else if (phase === 2) {
      continuationPrompt = "Continue /ship. Explore the codebase for the feature, then detect infrastructure. Spec: " + specText
    } else if (phase === 3) {
      continuationPrompt = "Continue /ship. Detect project infrastructure (tests, lint, format), then start implementing. Spec: " + specText
    } else if (phase === 4) {
      continuationPrompt = "Continue /ship. Implement the feature, write tests, commit per milestone. After implementation, run the verify loop. Spec: " + specText
    } else if (phase === 5) {
      continuationPrompt = "Continue /ship. Run the verify loop — execute tests and lint, fix failures. Then do a light review. Spec: " + specText
    } else if (phase === 6) {
      continuationPrompt = "Continue /ship. Run a light code review on the changes, then create the PR. Spec: " + specText
    } else if (phase === 7) {
      continuationPrompt = "Continue /ship. Create the PR, then clean up and report results. Spec: " + specText
    } else {
      continuationPrompt = "Continue the /ship pipeline from phase " + phase + ". Spec: " + specText
    }

    // Enhance with engine context if available
    let engineContext = ""
    try {
      const factory = require(path.join(PLUGIN_ROOT, "scripts", "engine-factory.js"))
      const status = factory.readEngineStatus("ship") || factory.readEngineStatus("build")
      if (status) {
        engineContext = " | Engine: " + status.completeTasks + "/" + status.totalTasks + " tasks, " + status.completeDeps + "/" + status.totalDeps + " deps"
        if (status.lastBlockedGate) engineContext += " | blocked: " + status.lastBlockedGate.slice(0, 50)
      }
    } catch {}

    const systemMsg = "Ucai ship pipeline — Phase " + phase + ": " + phaseName + milestoneInfo + engineContext + " | Complete all remaining phases."

    const result = JSON.stringify({
      decision: "block",
      reason: continuationPrompt,
      systemMessage: systemMsg,
    })

    process.stdout.write(result)
    process.exit(0)
  } catch (err) {
    // Preserve state on error so the pipeline can be resumed/inspected —
    // only the phase >= 8 completion path above deletes SHIP_STATE_FILE.
    console.error("Ucai ship: " + err.message)
    process.exit(0)
  }
}
