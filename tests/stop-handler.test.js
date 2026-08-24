// Regression test for the /ship Stop-hook loop guard in hooks/handlers/stop-handler.js.
//
// stop_hook_active is true on every Stop event after the first block within a
// turn, and stays true across every subsequent Stop until the user submits a
// new prompt. A presence-based guard ("exit if stop_hook_active") would cap a
// healthy 8-phase /ship run at one hook-driven continuation. The guard must
// instead be progress-based: only honor stop_hook_active (exit without
// blocking) when neither `phase` nor `milestone` has advanced since the last
// block. `phase` alone is not a sufficient signal — Phase 4 (Implement) loops
// over every milestone, with the Phase 5 verify loop nested inside, before
// `phase` is ever updated (ship.md:141-161) — so a genuine stall is also
// given a small budget of consecutive no-progress Stops before the guard
// gives up, rather than treating the first one as fatal.

const assert = require("assert")
const fs = require("fs")
const path = require("path")
const { spawnSync } = require("child_process")
const os = require("os")

function setupTempDir() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ucai-stop-test-"))
  fs.mkdirSync(path.join(tmpDir, ".claude"), { recursive: true })
  return tmpDir
}

function cleanupTempDir(tmpDir) {
  fs.rmSync(tmpDir, { recursive: true, force: true })
}

function shipStatePath(tmpDir) {
  return path.join(tmpDir, ".claude", "ucai-ship.local.md")
}

function writeShipState(tmpDir, fields) {
  const lines = ["---"]
  for (const [name, value] of Object.entries(fields)) {
    lines.push(name + ": " + value)
  }
  lines.push("---", "", "Test spec")
  fs.writeFileSync(shipStatePath(tmpDir), lines.join("\n"), "utf8")
}

function readShipField(tmpDir, name) {
  const content = fs.readFileSync(shipStatePath(tmpDir), "utf8")
  const m = content.match(new RegExp("^" + name + ":\\s*(.*)$", "m"))
  return m ? m[1].trim() : null
}

function runHandler(tmpDir, hookInput) {
  const handlerPath = path.resolve(__dirname, "..", "hooks", "handlers", "stop-handler.js")
  const result = spawnSync("node", [handlerPath], {
    cwd: tmpDir,
    input: JSON.stringify(hookInput),
    encoding: "utf8",
  })
  return result
}

function isBlockDecision(result) {
  if (!result.stdout) return false
  try {
    return JSON.parse(result.stdout).decision === "block"
  } catch {
    return false
  }
}

function testFirstStopBlocksAndRecordsPhase() {
  const tmpDir = setupTempDir()
  try {
    writeShipState(tmpDir, { phase: 0, milestone: "null" })

    const result = runHandler(tmpDir, { stop_hook_active: false })

    assert.strictEqual(result.status, 0, "Handler should exit cleanly")
    assert.strictEqual(isBlockDecision(result), true, "First Stop should block to continue phase 0")
    assert.strictEqual(readShipField(tmpDir, "last_blocked_phase"), "0", "last_blocked_phase should record phase 0")
  } finally {
    cleanupTempDir(tmpDir)
  }
}

function testStopHookActiveWithProgressStillBlocks() {
  // Multi-Stop sequence: Stop #1 blocks at phase 0. Claude advances the
  // pipeline to phase 1, then Stop #2 fires with stop_hook_active: true
  // (set by the runtime because the previous Stop blocked). Since phase (1)
  // advanced past last_blocked_phase (0), this must still block — the
  // pipeline must not be capped at one continuation.
  const tmpDir = setupTempDir()
  try {
    writeShipState(tmpDir, { phase: 0, milestone: "null" })
    const first = runHandler(tmpDir, { stop_hook_active: false })
    assert.strictEqual(isBlockDecision(first), true, "Stop #1 should block")

    // Simulate Claude advancing the pipeline to phase 1 before Stop #2 fires.
    const advanced = fs.readFileSync(shipStatePath(tmpDir), "utf8").replace(/^phase:.*$/m, "phase: 1")
    fs.writeFileSync(shipStatePath(tmpDir), advanced, "utf8")

    const second = runHandler(tmpDir, { stop_hook_active: true })

    assert.strictEqual(second.status, 0, "Stop #2 should exit cleanly")
    assert.strictEqual(
      isBlockDecision(second),
      true,
      "Stop #2 must still block: phase advanced since the last block, so this is a healthy continuation, not a stall"
    )
    assert.strictEqual(readShipField(tmpDir, "last_blocked_phase"), "1", "last_blocked_phase should advance to 1")
  } finally {
    cleanupTempDir(tmpDir)
  }
}

function testStopHookActiveWithNoProgressAllowsStopAfterBudget() {
  // A single stalled Stop must NOT immediately end the pipeline: `phase`
  // alone is not a complete progress signal (see
  // testMilestoneProgressWithinPhaseStillBlocks), and error-recovery turns
  // legitimately leave state untouched for one turn. So a genuine stall
  // (phase AND milestone both unchanged) gets a small budget of consecutive
  // no-progress Stops before the guard gives up. Drive that budget to
  // exhaustion and confirm the guard only yields once it's exceeded,
  // preserving state throughout.
  const tmpDir = setupTempDir()
  try {
    writeShipState(tmpDir, {
      phase: 1,
      milestone: "null",
      last_blocked_phase: 1,
      last_blocked_milestone: "null",
      stall_count: 0,
    })

    // First two no-progress Stops stay within budget: must still block.
    for (let i = 1; i <= 2; i++) {
      const result = runHandler(tmpDir, { stop_hook_active: true })
      assert.strictEqual(isBlockDecision(result), true, "Stall #" + i + " within budget should still block")
      assert.strictEqual(
        readShipField(tmpDir, "stall_count"),
        String(i),
        "stall_count should track consecutive no-progress Stops"
      )
    }

    // Third consecutive no-progress Stop exceeds the budget: must yield.
    const result = runHandler(tmpDir, { stop_hook_active: true })
    assert.strictEqual(result.status, 0, "Handler should exit cleanly")
    assert.strictEqual(isBlockDecision(result), false, "Stall exceeding the budget must not block")
    assert.strictEqual(fs.existsSync(shipStatePath(tmpDir)), true, "State file must be preserved on a stall, not deleted")
    assert.strictEqual(readShipField(tmpDir, "stall_count"), "3", "stall_count should record the exhausted budget")
  } finally {
    cleanupTempDir(tmpDir)
  }
}

function testMilestoneProgressWithinPhaseStillBlocks() {
  // Phase 4 (Implement) loops over every milestone -- with the Phase 5
  // verify loop nested inside -- before `phase` is ever updated
  // (ship.md:141-161), so `phase` alone does not move for many legitimate
  // Stops in a row within that stretch. `milestone` does move, and must be
  // treated as progress even though phase is unchanged and stop_hook_active
  // is true and a prior stall was already recorded.
  const tmpDir = setupTempDir()
  try {
    writeShipState(tmpDir, {
      phase: 3,
      milestone: "m1-parser",
      last_blocked_phase: 3,
      last_blocked_milestone: "m0-lexer",
      stall_count: 2,
    })

    const result = runHandler(tmpDir, { stop_hook_active: true })

    assert.strictEqual(
      isBlockDecision(result),
      true,
      "Milestone advanced since the last block, so this must block even though phase and stop_hook_active look identical to a stall"
    )
    assert.strictEqual(readShipField(tmpDir, "last_blocked_milestone"), "m1-parser", "last_blocked_milestone should advance")
    assert.strictEqual(readShipField(tmpDir, "stall_count"), "0", "stall_count should reset on milestone progress")
  } finally {
    cleanupTempDir(tmpDir)
  }
}

function testFixAttemptsProgressWithinPhaseStillBlocks() {
  // Phase 5's verify loop (ship.md:176-190) increments `fix_attempts` up to
  // `max_fix_attempts` (default 5, scripts/setup-ship.js:10) while `phase`
  // and `milestone` are both pinned by design for the whole loop. Each fix
  // attempt ends in a Stop with stop_hook_active: true. `fix_attempts`
  // advancing must count as progress even though phase and milestone look
  // identical to a stall, or the STALL_LIMIT budget (3) is exhausted well
  // inside the spec-permitted 5 attempts and the pipeline silently yields
  // mid-verify-loop.
  const tmpDir = setupTempDir()
  try {
    writeShipState(tmpDir, {
      phase: 4,
      milestone: "m1-auth",
      fix_attempts: 0,
      max_fix_attempts: 5,
      last_blocked_phase: 4,
      last_blocked_milestone: "m1-auth",
      last_blocked_fix_attempts: 0,
      stall_count: 0,
    })

    // Drive 4 consecutive fix attempts (well past the old STALL_LIMIT of 3)
    // with stop_hook_active: true and phase/milestone unchanged, as ship.md's
    // verify loop does. All must still block.
    for (let attempt = 1; attempt <= 4; attempt++) {
      const advanced = fs
        .readFileSync(shipStatePath(tmpDir), "utf8")
        .replace(/^fix_attempts:.*$/m, "fix_attempts: " + attempt)
      fs.writeFileSync(shipStatePath(tmpDir), advanced, "utf8")

      const result = runHandler(tmpDir, { stop_hook_active: true })

      assert.strictEqual(
        isBlockDecision(result),
        true,
        "Fix attempt " + attempt + " should block: fix_attempts advanced since the last block, so this is verify-loop progress, not a stall"
      )
      assert.strictEqual(
        readShipField(tmpDir, "last_blocked_fix_attempts"),
        String(attempt),
        "last_blocked_fix_attempts should advance to " + attempt
      )
      assert.strictEqual(readShipField(tmpDir, "stall_count"), "0", "stall_count should stay 0 while fix_attempts is progressing")
    }
  } finally {
    cleanupTempDir(tmpDir)
  }
}

function testEightConsecutiveBlocksReachPhase8() {
  // End-to-end trace of the exact scenario the review flagged: 8 phases,
  // each driven by a Stop event with stop_hook_active: true (as the runtime
  // sets on every continuation after the first block), with progress
  // advancing by one phase between each Stop. All 8 must block/advance;
  // completion at phase 8 must delete the state file.
  const tmpDir = setupTempDir()
  try {
    writeShipState(tmpDir, { phase: 0, milestone: "null" })

    let stopHookActive = false
    for (let phase = 0; phase < 8; phase++) {
      const result = runHandler(tmpDir, { stop_hook_active: stopHookActive })
      assert.strictEqual(
        isBlockDecision(result),
        true,
        "Stop at phase " + phase + " should block (pipeline not complete)"
      )
      // Simulate Claude completing this phase and advancing to the next.
      const advanced = fs
        .readFileSync(shipStatePath(tmpDir), "utf8")
        .replace(/^phase:.*$/m, "phase: " + (phase + 1))
      fs.writeFileSync(shipStatePath(tmpDir), advanced, "utf8")
      stopHookActive = true
    }

    const final = runHandler(tmpDir, { stop_hook_active: true })
    assert.strictEqual(isBlockDecision(final), false, "Phase 8 should allow exit, not block")
    assert.strictEqual(fs.existsSync(shipStatePath(tmpDir)), false, "State file should be deleted on completion")
  } finally {
    cleanupTempDir(tmpDir)
  }
}

function runAllTests() {
  const tests = [
    { name: "First Stop blocks and records last_blocked_phase", fn: testFirstStopBlocksAndRecordsPhase },
    { name: "stop_hook_active with progress still blocks (no 1-continuation cap)", fn: testStopHookActiveWithProgressStillBlocks },
    {
      name: "stop_hook_active with no progress allows stop after stall budget exhausted",
      fn: testStopHookActiveWithNoProgressAllowsStopAfterBudget,
    },
    { name: "milestone progress within an unchanged phase still blocks", fn: testMilestoneProgressWithinPhaseStillBlocks },
    { name: "fix_attempts progress within an unchanged phase/milestone still blocks", fn: testFixAttemptsProgressWithinPhaseStillBlocks },
    { name: "8 consecutive hook-driven Stops reach phase 8 completion", fn: testEightConsecutiveBlocksReachPhase8 },
  ]

  let passed = 0
  let failed = 0

  for (const test of tests) {
    try {
      test.fn()
      console.log("PASS " + test.name)
      passed++
    } catch (err) {
      console.error("FAIL " + test.name)
      console.error("     " + err.message)
      failed++
    }
  }

  console.log("\n" + passed + " passed, " + failed + " failed")
  process.exit(failed > 0 ? 1 : 0)
}

runAllTests()
