#!/usr/bin/env node

// Regression tests for scripts/engine-gates.js's fail-loud gate policy.
//
// The policy: "no engine state file on disk" is the ONLY condition allowed
// to pass through permissively (allowed:true, degraded:true, with a
// notice). Every other non-evaluable condition — a corrupt engine file, an
// unknown --task, or an uncaught exception — must fail closed
// (allowed:false, with a reason). Warn gates never block, but warnings
// must always be present in the JSON payload.
//
// Plain node script, no test runner. Uses only a per-test temp directory
// (via os.tmpdir/path.join) and never touches the repo working tree.
// Portable: no shell-outs, no symlinks, no mode bits — must run unchanged
// on ubuntu and windows, node 18 and 20.

const assert = require("assert")
const fs = require("fs")
const os = require("os")
const path = require("path")
const { execFileSync } = require("child_process")

const SCRIPTS = path.resolve(__dirname, "..", "scripts")
const ENGINE_GATES = path.join(SCRIPTS, "engine-gates.js")

function makeTmpDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ucai-engine-gates-test-"))
  fs.mkdirSync(path.join(dir, ".claude"), { recursive: true })
  return dir
}

function removeTmpDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true })
}

// Run engine-gates.js as a subprocess in the given cwd and parse its stdout
// JSON. Never throws on a non-zero exit — engine-gates.js always exits 0
// and communicates failure via the JSON payload, not the exit code.
function runGates(args, cwd) {
  const out = execFileSync(process.execPath, [ENGINE_GATES, ...args], {
    cwd,
    encoding: "utf8",
  })
  return JSON.parse(out)
}

// Build a real ship or build engine state file in tmpDir/.claude by
// requiring engine-factory.js in-process (no subprocess, no shell-out) and
// temporarily chdir-ing so it writes to the right place. Restores cwd
// afterward regardless of outcome.
async function seedEngine(tmpDir, { pipeline, phase }) {
  const factory = require(path.join(SCRIPTS, "engine-factory.js"))
  const origCwd = process.cwd()
  try {
    process.chdir(tmpDir)
    const engine =
      pipeline === "build"
        ? await factory.createBuildEngine("engine-gates-test-feature", "engine-gates-test-feature")
        : await factory.createShipEngine("engine gates test spec", "manual")
    await factory.saveEngine(engine, pipeline, { currentPhase: phase })
  } finally {
    process.chdir(origCwd)
  }
}

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

async function testNoEngineFileIsDegradedAllowed() {
  const tmpDir = makeTmpDir()
  try {
    const result = runGates(["--pipeline", "build", "--task", "task-explore"], tmpDir)

    ok("no engine file: allowed is true", () => {
      assert.strictEqual(result.allowed, true, `expected allowed:true, got ${JSON.stringify(result)}`)
    })
    ok("no engine file: degraded is true", () => {
      assert.strictEqual(result.degraded, true, `expected degraded:true, got ${JSON.stringify(result)}`)
    })
    ok("no engine file: a human-readable notice is present in the stdout payload", () => {
      assert.strictEqual(typeof result.notice, "string", "expected a string notice field")
      assert.ok(result.notice.length > 0, "notice must not be empty")
    })
    ok("no engine file: warnings array is present", () => {
      assert.ok(Array.isArray(result.warnings), "warnings must always be present in the payload")
    })
  } finally {
    removeTmpDir(tmpDir)
  }
}

async function testCorruptEngineFileFailsClosed() {
  const tmpDir = makeTmpDir()
  try {
    const engineFile = path.join(tmpDir, ".claude", "ucai-build-engine.local.json")
    fs.writeFileSync(engineFile, "{ this is not valid json", "utf8")

    const result = runGates(["--pipeline", "build", "--task", "task-explore"], tmpDir)

    ok("corrupt engine file: allowed is false", () => {
      assert.strictEqual(result.allowed, false, `expected allowed:false, got ${JSON.stringify(result)}`)
    })
    ok("corrupt engine file: a reason is present in the stdout payload", () => {
      assert.strictEqual(typeof result.reason, "string", "expected a string reason field")
      assert.ok(result.reason.length > 0, "reason must not be empty")
    })
    ok("corrupt engine file: it does NOT report degraded:true (this is a failure, not a pass-through)", () => {
      assert.notStrictEqual(result.degraded, true, "a corrupt file must fail closed, not degrade permissively")
    })
  } finally {
    removeTmpDir(tmpDir)
  }
}

async function testUnknownTaskFailsClosed() {
  const tmpDir = makeTmpDir()
  try {
    await seedEngine(tmpDir, { pipeline: "build", phase: 1 })

    const result = runGates(["--pipeline", "build", "--task", "task-does-not-exist-typo"], tmpDir)

    ok("unknown --task: allowed is false", () => {
      assert.strictEqual(result.allowed, false, `expected allowed:false, got ${JSON.stringify(result)}`)
    })
    ok("unknown --task: a reason is present in the stdout payload", () => {
      assert.strictEqual(typeof result.reason, "string", "expected a string reason field")
      assert.ok(result.reason.length > 0, "reason must not be empty")
    })
  } finally {
    removeTmpDir(tmpDir)
  }
}

async function testValidTaskWithTriggeredBlockGateFailsClosedWithMessage() {
  const tmpDir = makeTmpDir()
  try {
    // Freshly created build engine: structural deps are "drafted", not
    // "complete", so the block gates guarding task-explore are triggered.
    await seedEngine(tmpDir, { pipeline: "build", phase: 1 })

    const result = runGates(["--pipeline", "build", "--task", "task-explore"], tmpDir)

    ok("triggered block gate: allowed is false", () => {
      assert.strictEqual(result.allowed, false, `expected allowed:false, got ${JSON.stringify(result)}`)
    })
    ok("triggered block gate: blockers include the gate's message", () => {
      assert.ok(Array.isArray(result.blockers), "blockers must be an array")
      assert.ok(
        result.blockers.some((b) => /milestone/i.test(b) || /skill/i.test(b)),
        `expected a blocker message about milestone/skills, got ${JSON.stringify(result.blockers)}`
      )
    })
  } finally {
    removeTmpDir(tmpDir)
  }
}

async function testValidTaskWithOnlyWarnGateIsAllowedWithWarning() {
  const tmpDir = makeTmpDir()
  try {
    // Freshly created ship engine at task-ship-pr: the only gate targeting
    // task-ship-pr is a "warn" gate (review not complete). No "block" gate
    // targets task-ship-pr, so this must be allowed even though the
    // underlying dependency is unsatisfied.
    await seedEngine(tmpDir, { pipeline: "ship", phase: 6 })

    const result = runGates(["--pipeline", "ship", "--task", "task-ship-pr"], tmpDir)

    ok("warn-only gate: allowed is true", () => {
      assert.strictEqual(result.allowed, true, `expected allowed:true, got ${JSON.stringify(result)}`)
    })
    ok("warn-only gate: blockers is empty", () => {
      assert.deepStrictEqual(result.blockers, [], `expected no blockers, got ${JSON.stringify(result.blockers)}`)
    })
    ok("warn-only gate: warnings is present and non-empty in the payload", () => {
      assert.ok(Array.isArray(result.warnings), "warnings must be an array")
      assert.ok(result.warnings.length > 0, "a degraded (warn-triggered) run must surface its warning")
    })
  } finally {
    removeTmpDir(tmpDir)
  }
}

async function runAllTests() {
  console.log("\nengine-gates: fail-loud gate policy\n")

  await testNoEngineFileIsDegradedAllowed()
  await testCorruptEngineFileFailsClosed()
  await testUnknownTaskFailsClosed()
  await testValidTaskWithTriggeredBlockGateFailsClosedWithMessage()
  await testValidTaskWithOnlyWarnGateIsAllowedWithWarning()

  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

runAllTests()
