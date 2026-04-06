#!/usr/bin/env node

// Ucai Build Engine Setup
// Creates a ContingencyEngine for the /build pipeline with all entities

const { createBuildEngine, saveEngine } = require("./engine-factory.js")

function parseArgs(args) {
  let feature = ""
  let slug = ""

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--feature":
        feature = args[++i] || ""
        break
      case "--slug":
        slug = args[++i] || ""
        break
    }
  }

  if (!feature) {
    console.error("Usage: setup-build-engine.js --feature <name> [--slug <slug>]")
    process.exit(1)
  }

  if (!slug) {
    slug = feature
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40)
  }

  return { feature, slug }
}

async function main() {
  const { feature, slug } = parseArgs(process.argv.slice(2))

  const engine = await createBuildEngine(feature, slug)
  await saveEngine(engine, "build", { currentPhase: 1, featureSlug: slug })

  const project = engine.getProject()
  console.log(`Build engine created.

Project: ${project.id}
Feature: ${feature}
State: ${project.state}
Dependencies: ${project.dependencies.length}
Tasks: ${project.tasks.length}
Logic Gates: ${project.logicGates.length}
Shadow Reactions: ${project.tasks.reduce((sum, t) => sum + t.reactions.length, 0)}

Engine state saved to .claude/ucai-build-engine.local.json`)
}

main().catch((err) => {
  console.error("setup-build-engine error:", err.message)
  process.exit(1)
})
