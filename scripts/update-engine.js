#!/usr/bin/env node

// Ucai Engine Update
// Update dependency and/or task state in the engine, then serialize

const { loadEngine, saveEngine } = require("./engine-factory.js")

function parseArgs(args) {
  let pipeline = null
  let dep = null
  let task = null
  let state = null
  let proof = null
  let phase = null

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--pipeline":
        pipeline = args[++i]
        break
      case "--dep":
        dep = args[++i]
        break
      case "--task":
        task = args[++i]
        break
      case "--state":
        state = args[++i]
        break
      case "--proof":
        proof = args[++i]
        break
      case "--phase":
        phase = args[++i] ? parseInt(args[i], 10) : null
        break
    }
  }

  if (!pipeline || (!dep && !task)) {
    console.error("Usage: update-engine.js --pipeline <build|ship> [--dep <dep-id> --state <state> [--proof <text>]] [--task <task-id> --state <state>] [--phase <n>]")
    process.exit(1)
  }

  return { pipeline, dep, task, state, proof, phase }
}

async function main() {
  const { pipeline, dep, task, state, proof, phase } = parseArgs(process.argv.slice(2))

  const engine = await loadEngine(pipeline)
  if (!engine) {
    process.stdout.write(JSON.stringify({ ok: false, error: "No engine state found" }))
    return
  }

  const updates = []

  if (dep && state) {
    engine.updateDependencyState(dep, state, proof || undefined)
    updates.push(`dep:${dep}=${state}`)
  }

  if (task && state) {
    engine.updateTaskState(task, state)
    updates.push(`task:${task}=${state}`)
  }

  const meta = {}
  if (phase !== null && phase !== undefined && !isNaN(phase)) {
    meta.currentPhase = phase
  }

  await saveEngine(engine, pipeline, meta)

  process.stdout.write(JSON.stringify({ ok: true, updates }))
}

main().catch((err) => {
  console.error("update-engine error:", err.message)
  process.stdout.write(JSON.stringify({ ok: false, error: err.message }))
})
