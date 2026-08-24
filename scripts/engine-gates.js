#!/usr/bin/env node

// Ucai Engine Gates
// Evaluate logic gates for a target task, output JSON {allowed, blockers, warnings}
//
// Split policy: only "no engine state file on disk" is a legitimate
// non-engine workflow and is allowed through (degraded:true, with a
// notice). Every other non-evaluable condition — a corrupt/unloadable
// engine file, a --task that matches no task in the engine, or any
// uncaught exception — fails closed (allowed:false, with a reason) so a
// broken or mistyped invocation can never be silently permissive. All
// notices/reasons are written to stdout in the JSON payload (not just
// stderr) since the consumer is the model reading stdout.

const fs = require("fs")
const path = require("path")
const { loadEngine, BUILD_ENGINE_FILE, SHIP_ENGINE_FILE } = require("./engine-factory.js")

function parseArgs(args) {
  let pipeline = null
  let task = null

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--pipeline":
        pipeline = args[++i]
        break
      case "--task":
        task = args[++i]
        break
    }
  }

  if (!pipeline || !task) {
    console.error("Usage: engine-gates.js --pipeline <build|ship> --task <task-id>")
    process.exit(1)
  }

  return { pipeline, task }
}

function getEngineFilePath(pipeline) {
  if (pipeline === "build") return BUILD_ENGINE_FILE
  if (pipeline === "ship") return SHIP_ENGINE_FILE
  throw new Error(`Unknown pipeline: ${pipeline}`)
}

async function evaluateGatesForTask(engine, targetTaskId) {
  const project = engine.getProject()
  const nf = await import("file:///" + path.resolve(__dirname, "lib", "never-forget", "index.js").replace(/\\/g, "/"))

  const taskExists = project.tasks.some((t) => t.id === targetTaskId)
  if (!taskExists) {
    return { blockers: [], warnings: [], unknownTask: true }
  }

  const blockers = []
  const warnings = []

  for (const gate of project.logicGates) {
    if (!gate.enabled || gate.action.target !== targetTaskId) continue

    const { triggered } = nf.evaluateGate(gate, project)

    if (triggered) {
      const msg = gate.action.message || `Gate "${gate.name}" triggered`
      if (gate.action.type === "block") {
        blockers.push(msg)
      } else if (gate.action.type === "warn") {
        warnings.push(msg)
      }
    }
  }

  return { blockers, warnings, unknownTask: false }
}

function writeAllowed(extra) {
  process.stdout.write(JSON.stringify({ allowed: true, blockers: [], warnings: [], ...extra }))
}

function writeBlocked(reason, extra) {
  process.stdout.write(JSON.stringify({ allowed: false, blockers: [reason], warnings: [], reason, ...extra }))
}

async function main() {
  const { pipeline, task } = parseArgs(process.argv.slice(2))

  const filePath = getEngineFilePath(pipeline)

  // Genuinely no engine state file: a legitimate non-engine workflow.
  // This is the ONLY condition allowed to pass through permissively.
  if (!fs.existsSync(filePath)) {
    writeAllowed({
      degraded: true,
      noEngine: true,
      notice: `No engine state file found at "${filePath}" for pipeline "${pipeline}". Treating this as a legitimate non-engine workflow and allowing through in degraded mode — gates were not evaluated.`,
    })
    return
  }

  // The file exists: verify it actually parses as JSON before attempting
  // to load it, so a corrupt file produces a precise, stdout-visible
  // reason instead of loadEngine's swallowed-and-logged-to-stderr null.
  try {
    JSON.parse(fs.readFileSync(filePath, "utf8"))
  } catch (err) {
    writeBlocked(
      `Engine state file at "${filePath}" for pipeline "${pipeline}" exists but is corrupt and could not be parsed: ${err.message}. Failing closed rather than silently permitting.`
    )
    return
  }

  const engine = await loadEngine(pipeline)
  if (!engine) {
    writeBlocked(
      `Engine state file at "${filePath}" for pipeline "${pipeline}" exists but failed to load. Failing closed rather than silently permitting.`
    )
    return
  }

  const { blockers, warnings, unknownTask } = await evaluateGatesForTask(engine, task)

  if (unknownTask) {
    writeBlocked(
      `Task "${task}" was not found in the "${pipeline}" engine's task list — likely a typo in --task. It matches zero gates because it matches zero tasks, not because it is clear. Failing closed rather than silently permitting.`
    )
    return
  }

  const allowed = blockers.length === 0

  process.stdout.write(JSON.stringify({ allowed, blockers, warnings }))
}

main().catch((err) => {
  console.error("engine-gates error:", err.message)
  writeBlocked(`Unexpected error while evaluating gates: ${err.message}. Failing closed rather than silently permitting.`, {
    error: err.message,
  })
})
