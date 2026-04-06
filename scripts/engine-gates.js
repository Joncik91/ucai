#!/usr/bin/env node

// Ucai Engine Gates
// Evaluate logic gates for a target task, output JSON {allowed, blockers, warnings}

const path = require("path")
const { loadEngine } = require("./engine-factory.js")

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

async function evaluateGatesForTask(engine, targetTaskId) {
  const project = engine.getProject()
  const nf = await import("file:///" + path.resolve(__dirname, "lib", "never-forget", "index.js").replace(/\\/g, "/"))

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

  return { blockers, warnings }
}

async function main() {
  const { pipeline, task } = parseArgs(process.argv.slice(2))

  const engine = await loadEngine(pipeline)
  if (!engine) {
    process.stdout.write(JSON.stringify({ allowed: true, blockers: [], warnings: [], noEngine: true }))
    return
  }

  const { blockers, warnings } = await evaluateGatesForTask(engine, task)
  const allowed = blockers.length === 0

  process.stdout.write(JSON.stringify({ allowed, blockers, warnings }))
}

main().catch((err) => {
  console.error("engine-gates error:", err.message)
  process.stdout.write(JSON.stringify({ allowed: true, blockers: [], warnings: [], error: err.message }))
})
