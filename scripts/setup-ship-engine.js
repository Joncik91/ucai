#!/usr/bin/env node

// Ucai Ship Engine Setup
// Creates a ContingencyEngine for the /ship pipeline with all entities

const { createShipEngine, saveEngine } = require("./engine-factory.js")

function main() {
  let spec = ""
  let source = "inline"

  for (let i = 2; i < process.argv.length; i++) {
    switch (process.argv[i]) {
      case "--spec":
        spec = process.argv[++i] || ""
        break
      case "--source":
        source = process.argv[++i] || "inline"
        break
      default:
        if (!spec) spec = process.argv[i]
    }
  }

  // Support --stdin mode
  if (process.argv.includes("--stdin")) {
    let input = ""
    process.stdin.setEncoding("utf8")
    process.stdin.on("data", (chunk) => (input += chunk))
    process.stdin.on("end", async () => {
      spec = input.trim() || spec
      await run(spec, source)
    })
  } else {
    run(spec, source)
  }
}

async function run(spec, source) {
  if (!spec) {
    console.error("Usage: setup-ship-engine.js --spec <text> [--source <frd|path|inline>]")
    process.exit(1)
  }

  const engine = await createShipEngine(spec, source)
  await saveEngine(engine, "ship", { currentPhase: 0, specSource: source })

  const project = engine.getProject()
  console.log(`Ship engine created.

Project: ${project.id}
Spec: ${spec.slice(0, 80)}${spec.length > 80 ? "..." : ""}
State: ${project.state}
Dependencies: ${project.dependencies.length}
Tasks: ${project.tasks.length}
Logic Gates: ${project.logicGates.length}

Engine state saved to .claude/ucai-ship-engine.local.json`)
}

main()
