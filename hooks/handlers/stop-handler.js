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

// Read hook input from stdin
let input = ""
process.stdin.setEncoding("utf8")
process.stdin.on("data", (chunk) => (input += chunk))
process.stdin.on("end", () => {
  let stopHookActive = false
  try {
    const hookData = JSON.parse(input)
    stopHookActive = Boolean(hookData.stop_hook_active)
  } catch {
    // Malformed hook input — fall through to normal handling
  }

  handleShipPipeline(stopHookActive)
})

// Read/write a single frontmatter field in the ship state file's YAML block.
function getShipField(frontmatter, name) {
  const m = frontmatter.match(new RegExp("^" + name + ":\\s*(.*)$", "m"))
  return m ? m[1].trim() : null
}

// Set one or more frontmatter fields, adding them if absent. Used to persist
// loop-guard bookkeeping (last_blocked_phase, last_blocked_milestone,
// stall_count) across Stop events.
function setShipFields(stateContent, fields) {
  const fmMatch = stateContent.match(/^(---\r?\n)([\s\S]*?)(\r?\n---\r?\n[\s\S]*)$/)
  if (!fmMatch) return stateContent

  let frontmatter = fmMatch[2]
  for (const name of Object.keys(fields)) {
    const value = fields[name]
    const fieldRe = new RegExp("^" + name + ":.*$", "m")
    if (fieldRe.test(frontmatter)) {
      frontmatter = frontmatter.replace(fieldRe, () => name + ": " + value)
    } else {
      frontmatter += "\n" + name + ": " + value
    }
  }

  return fmMatch[1] + frontmatter + fmMatch[3]
}

function handleShipPipeline(stopHookActive) {
  try {
    const stateContent = fs.readFileSync(SHIP_STATE_FILE, "utf8")

    const fmMatch = stateContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
    if (!fmMatch) {
      console.error("Ucai ship: State file has no frontmatter")
      process.exit(0)
    }

    const frontmatter = fmMatch[1]
    const specText = fmMatch[2].trim()

    const phase = parseInt(getShipField(frontmatter, "phase"), 10)
    const milestone = getShipField(frontmatter, "milestone")

    if (isNaN(phase)) {
      console.error("Ucai ship: State file corrupted (phase: '" + getShipField(frontmatter, "phase") + "')")
      process.exit(0)
    }

    // Pipeline complete — allow exit
    if (phase >= 8) {
      try { fs.unlinkSync(SHIP_STATE_FILE) } catch {}
      process.exit(0)
    }

    // Loop guard. Per the vendor docs
    // (https://code.claude.com/docs/en/hooks — Stop input, and Stop
    // decision control), the 8-consecutive-block cap is unconditional and
    // this hook cannot extend or bypass it: "Claude Code overrides the hook
    // and ends the turn after 8 consecutive blocks", and that cap applies
    // the same way to `hookSpecificOutput.additionalContext` as to
    // `decision: "block"` ("the same loop protections ... namely the
    // stop_hook_active input and the 8-consecutive-continuation cap"). What
    // this guard does instead: once the pipeline looks stalled, it yields
    // (stops blocking) early so a stuck run gives back the rest of that
    // 8-block budget rather than burning it on retries that make no
    // progress. `phase` alone is not a sufficient progress signal: it is
    // constant for the entire duration of a phase, and Phase 4 (Implement,
    // ship.md:141-161) loops over every milestone — with Phase 5's verify
    // loop nested inside — before phase is ever updated, so many
    // legitimate Stops can land with an unchanged phase. `milestone`
    // (ship.md:161) does move within that stretch, so progress includes
    // "milestone changed". Within a single milestone, Phase 5's verify
    // loop (ship.md:176-190) also pins both phase and milestone for up to
    // `max_fix_attempts` (default 5, scripts/setup-ship.js:10) consecutive
    // Stops while it increments `fix_attempts` on each retry — so
    // `fix_attempts` changing is also progress, not a stall. Error-recovery
    // turns (ship.md:339) leave all three fields untouched by design, so
    // even a genuine stall is given a small budget (stall_count) of
    // consecutive no-progress Stops before we yield, rather than treating
    // the very first one as fatal. Matches
    // hooks/handlers/subagent-stop-handler.js's use of stop_hook_active for
    // the presence check, but gates it on a progress budget instead of bare
    // presence.
    const lastBlockedPhaseRaw = parseInt(getShipField(frontmatter, "last_blocked_phase"), 10)
    const lastBlockedPhase = isNaN(lastBlockedPhaseRaw) ? -1 : lastBlockedPhaseRaw
    const lastBlockedMilestone = getShipField(frontmatter, "last_blocked_milestone")
    const fixAttempts = getShipField(frontmatter, "fix_attempts")
    const lastBlockedFixAttempts = getShipField(frontmatter, "last_blocked_fix_attempts")
    const stallCountRaw = parseInt(getShipField(frontmatter, "stall_count"), 10)
    const stallCount = isNaN(stallCountRaw) ? 0 : stallCountRaw

    // Chosen heuristic, not a vendor-specified value — how many consecutive
    // no-progress Stops to tolerate before yielding.
    const STALL_LIMIT = 3
    // milestone and fix_attempts are compared as normalized strings (rather
    // than raw getShipField output) because both can be legitimately absent
    // from older/hand-built state files: on the first Stop, both sides are
    // absent (JS null); after that Stop writes last_blocked_milestone /
    // last_blocked_fix_attempts, the field literally contains the text
    // "null" while milestone / fix_attempts itself is still absent (JS
    // null). A raw `!==` would see those as different — JS null !== the
    // string "null" — and misreport progress on every subsequent Stop even
    // though nothing changed, permanently defeating the stall guard.
    const progressed =
      phase > lastBlockedPhase ||
      String(milestone) !== String(lastBlockedMilestone) ||
      String(fixAttempts) !== String(lastBlockedFixAttempts)
    const nextStallCount = progressed ? 0 : stallCount + 1

    if (stopHookActive && !progressed && nextStallCount >= STALL_LIMIT) {
      console.error(
        "Ucai ship: stop hook already active with no phase/milestone progress across " +
          nextStallCount +
          " consecutive Stops (phase " +
          phase +
          (milestone && milestone !== "null" ? ", milestone " + milestone : "") +
          "); allowing session to stop to avoid an infinite loop."
      )
      try {
        fs.writeFileSync(SHIP_STATE_FILE, setShipFields(stateContent, { stall_count: nextStallCount }))
      } catch {}
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

    // Record that we blocked at this phase/milestone/fix_attempts, and the
    // running stall count, so the next Stop event (which will arrive with
    // stop_hook_active: true) can tell progress from a stall.
    try {
      fs.writeFileSync(
        SHIP_STATE_FILE,
        setShipFields(stateContent, {
          last_blocked_phase: phase,
          last_blocked_milestone: milestone,
          last_blocked_fix_attempts: fixAttempts,
          stall_count: nextStallCount,
        })
      )
    } catch {}

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
