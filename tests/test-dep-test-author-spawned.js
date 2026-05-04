#!/usr/bin/env node
// Tests for dep-test-author-spawned gate enforcement (issue #5)
// Verifies: new dep exists, initial state, gate wiring, CLI transitions, gate clearance
// Run: node tests/test-dep-test-author-spawned.js
//
// Uses execSync with hardcoded script paths only — no user-supplied input in commands.

const assert = require("assert")
const fs = require("fs")
const os = require("os")
const path = require("path")
const { execFileSync } = require("child_process")

const WORKTREE = path.resolve(__dirname, "..")
const SCRIPTS = path.join(WORKTREE, "scripts")

async function loadFactory() {
  return require(path.join(SCRIPTS, "engine-factory.js"))
}

function makeTmpDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ucai-test-"))
  fs.mkdirSync(path.join(dir, ".claude"), { recursive: true })
  return dir
}

function removeTmpDir(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true })
  } catch (_) {}
}

// Run a CLI script in a given cwd, return parsed JSON stdout
function runScript(scriptPath, args, cwd) {
  const out = execFileSync(process.execPath, [scriptPath, ...args], {
    cwd,
    encoding: "utf8",
  })
  return JSON.parse(out)
}

async function main() {
  const { createBuildEngine, saveEngine } = await loadFactory()

  // --- Test 1: dep-test-author-spawned dependency exists after createBuildEngine ---
  {
    const engine = await createBuildEngine("test-feature", "test-feature")
    const project = engine.getProject()
    const dep = project.dependencies.find((d) => d.id === "dep-test-author-spawned")
    assert.ok(dep !== undefined, "dep-test-author-spawned must exist in build engine dependencies")
    console.log("PASS 1: dep-test-author-spawned dependency exists")

    // --- Test 2: dep starts in 'drafted' state (bootstrapped, not complete) ---
    assert.strictEqual(
      dep.state,
      "drafted",
      "dep-test-author-spawned must start in 'drafted' state (not 'complete' or 'identified')"
    )
    console.log("PASS 2: dep-test-author-spawned starts in 'drafted' state")

    // --- Test 3: gate-test-author-before-done targets task-done as a block ---
    const gate = project.logicGates.find((g) => g.id === "gate-test-author-before-done")
    assert.ok(gate !== undefined, "gate-test-author-before-done must exist in build engine gates")
    assert.strictEqual(gate.action.target, "task-done", "gate must target task-done")
    assert.strictEqual(gate.action.type, "block", "gate must be type 'block'")
    console.log("PASS 3: gate-test-author-before-done exists, targets task-done with block action")
  }

  // --- CLI tests require a temp dir with its own engine file ---
  const tmpDir = makeTmpDir()
  try {
    // Seed the temp dir: chdir so factory writes to tmpDir/.claude/ucai-build-engine.local.json
    const origCwd = process.cwd()
    process.chdir(tmpDir)
    const seedEngine = await createBuildEngine("cli-test-feature", "cli-test-feature")
    await saveEngine(seedEngine, "build", { currentPhase: 7, featureSlug: "cli-test-feature" })
    process.chdir(origCwd)

    const engineFile = path.join(tmpDir, ".claude", "ucai-build-engine.local.json")
    assert.ok(fs.existsSync(engineFile), "engine file must exist in tmpDir after seeding")

    // --- Test 4: task-done is blocked when dep-test-author-spawned is not complete ---
    {
      const result = runScript(
        path.join(SCRIPTS, "engine-gates.js"),
        ["--pipeline", "build", "--task", "task-done"],
        tmpDir
      )
      assert.strictEqual(result.allowed, false, "task-done must be blocked in initial state")
      const authorBlocker = result.blockers.some((b) => /author/i.test(b))
      assert.ok(
        authorBlocker,
        "blockers must include a message matching /author/i when dep-test-author-spawned is not complete"
      )
      console.log("PASS 4: task-done is blocked when dep-test-author-spawned is not complete")
    }

    // --- Test 5: update-engine transitions dep-test-author-spawned to complete ---
    {
      const result = runScript(
        path.join(SCRIPTS, "update-engine.js"),
        [
          "--pipeline", "build",
          "--dep", "dep-test-author-spawned",
          "--state", "complete",
          "--proof", "subagent dispatched: tests for engine-factory.js — dep count, gate wiring, CLI transitions",
        ],
        tmpDir
      )
      assert.strictEqual(result.ok, true, "update-engine.js must return ok:true for dep-test-author-spawned transition")

      // Verify state in saved snapshot
      const saved = JSON.parse(fs.readFileSync(engineFile, "utf8"))
      const dep = saved.snapshot.project.dependencies.find((d) => d.id === "dep-test-author-spawned")
      assert.ok(dep !== undefined, "dep-test-author-spawned must exist in saved snapshot")
      assert.strictEqual(
        dep.state,
        "complete",
        "dep-test-author-spawned must be 'complete' in saved snapshot after update"
      )
      console.log("PASS 5: update-engine.js transitions dep-test-author-spawned to 'complete' in snapshot")
    }

    // --- Test 6: gate-test-author-before-done clears after dep is complete ---
    {
      const result = runScript(
        path.join(SCRIPTS, "engine-gates.js"),
        ["--pipeline", "build", "--task", "task-done"],
        tmpDir
      )
      const authorBlockerStillPresent = result.blockers.some((b) => /author/i.test(b))
      assert.strictEqual(
        authorBlockerStillPresent,
        false,
        "gate-test-author-before-done blocker must be gone after dep-test-author-spawned is complete"
      )
      console.log("PASS 6: gate-test-author-before-done clears after dep-test-author-spawned is complete")
    }
  } finally {
    removeTmpDir(tmpDir)
  }

  console.log("\nAll tests passed.")
}

main().catch((err) => {
  console.error("FAIL:", err.message)
  process.exit(1)
})
