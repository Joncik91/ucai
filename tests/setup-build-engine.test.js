#!/usr/bin/env node

// Regression test: dep-fast-track-mode in build engine
// Authored by test-author subagent (not the dep implementer).
// Calls createBuildEngine() directly — no mocks, no stubs.

const assert = require("assert")
const path = require("path")

const { createBuildEngine } = require(path.resolve(__dirname, "../scripts/engine-factory.js"))

let passed = 0
let failed = 0

function ok(label, fn) {
  try {
    fn()
    console.log(`  PASS  ${label}`)
    passed++
  } catch (err) {
    console.log(`  FAIL  ${label}`)
    console.log(`        ${err.message}`)
    failed++
  }
}

async function main() {
  console.log("\nsetup-build-engine: dep-fast-track-mode regression\n")

  const engine = await createBuildEngine("fast-track test feature", "fast-track-test")
  const project = engine.getProject()

  // 1. dep exists
  ok("dep-fast-track-mode is present in dependencies", () => {
    const dep = project.dependencies.find((d) => d.id === "dep-fast-track-mode")
    assert.ok(dep, "dep-fast-track-mode not found in project.dependencies")
  })

  // 2. satisfiedBy and description match spec
  ok("dep-fast-track-mode has correct satisfiedBy array", () => {
    const dep = project.dependencies.find((d) => d.id === "dep-fast-track-mode")
    assert.ok(dep, "dep-fast-track-mode not found")
    assert.deepStrictEqual(
      dep.satisfiedBy,
      ["fast_track_explicit", "fast_track_implicit"],
      `Expected satisfiedBy ["fast_track_explicit","fast_track_implicit"], got ${JSON.stringify(dep.satisfiedBy)}`
    )
  })

  ok("dep-fast-track-mode has correct description", () => {
    const dep = project.dependencies.find((d) => d.id === "dep-fast-track-mode")
    assert.ok(dep, "dep-fast-track-mode not found")
    assert.strictEqual(
      dep.description,
      "User opted into FRD fast-track for phases 2-4",
      `Unexpected description: ${dep.description}`
    )
  })

  // 3. Not a gate blocker — no gate references it as condition.subject
  ok("no logic gate blocks on dep-fast-track-mode", () => {
    const blocking = project.logicGates.filter(
      (g) => g.condition && g.condition.subject === "dep-fast-track-mode"
    )
    assert.strictEqual(
      blocking.length,
      0,
      `Found ${blocking.length} gate(s) gating on dep-fast-track-mode: ${blocking.map((g) => g.id).join(", ")}`
    )
  })

  // 4. No task reaction references it
  ok("no task reaction requires dep-fast-track-mode", () => {
    const blocking = project.tasks.filter(
      (t) => t.reactions && t.reactions.some((r) => r.dep === "dep-fast-track-mode")
    )
    assert.strictEqual(
      blocking.length,
      0,
      `Found ${blocking.length} task(s) with reactions on dep-fast-track-mode: ${blocking.map((t) => t.id).join(", ")}`
    )
  })

  console.log(`\n${passed} passed, ${failed} failed\n`)
  if (failed > 0) process.exit(1)
}

main().catch((err) => {
  console.error("Unexpected error:", err.message)
  process.exit(1)
})
