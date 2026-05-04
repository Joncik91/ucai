// Regression test for UCAI-001: engine state preserved mid-flight on SessionEnd
// Tests the fix in hooks/handlers/session-end-handler.js

const assert = require("assert")
const fs = require("fs")
const path = require("path")
const { spawnSync } = require("child_process")
const os = require("os")

function setupTempDir() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ucai-test-"))
  const claudeDir = path.join(tmpDir, ".claude")
  fs.mkdirSync(claudeDir, { recursive: true })
  return tmpDir
}

function cleanupTempDir(tmpDir) {
  fs.rmSync(tmpDir, { recursive: true, force: true })
}

function runHandler(tmpDir) {
  const handlerPath = path.resolve(__dirname, "..", "hooks", "handlers", "session-end-handler.js")
  const result = spawnSync("node", [handlerPath], {
    cwd: tmpDir,
    input: "",
    encoding: "utf8",
  })
  return result
}

function testBuildEngineMidFlightPreserved() {
  const tmpDir = setupTempDir()
  try {
    const buildEnginePath = path.join(tmpDir, ".claude", "ucai-build-engine.local.json")
    const engineData = { snapshot: { project: { state: "building" } } }
    fs.writeFileSync(buildEnginePath, JSON.stringify(engineData, null, 2), "utf8")

    const result = runHandler(tmpDir)

    assert.strictEqual(result.status, 0, "Handler should exit cleanly")
    assert.strictEqual(
      fs.existsSync(buildEnginePath),
      true,
      "Build engine file should be preserved when state is not complete"
    )
  } finally {
    cleanupTempDir(tmpDir)
  }
}

function testBuildEngineCompleteDeleted() {
  const tmpDir = setupTempDir()
  try {
    const buildEnginePath = path.join(tmpDir, ".claude", "ucai-build-engine.local.json")
    const engineData = { snapshot: { project: { state: "complete" } } }
    fs.writeFileSync(buildEnginePath, JSON.stringify(engineData, null, 2), "utf8")

    const result = runHandler(tmpDir)

    assert.strictEqual(result.status, 0, "Handler should exit cleanly")
    assert.strictEqual(
      fs.existsSync(buildEnginePath),
      false,
      "Build engine file should be deleted when state is complete"
    )
  } finally {
    cleanupTempDir(tmpDir)
  }
}

function testShipEngineMidFlightPreserved() {
  const tmpDir = setupTempDir()
  try {
    const shipEnginePath = path.join(tmpDir, ".claude", "ucai-ship-engine.local.json")
    const engineData = { snapshot: { project: { state: "testing" } } }
    fs.writeFileSync(shipEnginePath, JSON.stringify(engineData, null, 2), "utf8")

    const result = runHandler(tmpDir)

    assert.strictEqual(result.status, 0, "Handler should exit cleanly")
    assert.strictEqual(
      fs.existsSync(shipEnginePath),
      true,
      "Ship engine file should be preserved when state is not complete"
    )
  } finally {
    cleanupTempDir(tmpDir)
  }
}

function testShipEngineCompleteDeleted() {
  const tmpDir = setupTempDir()
  try {
    const shipEnginePath = path.join(tmpDir, ".claude", "ucai-ship-engine.local.json")
    const engineData = { snapshot: { project: { state: "complete" } } }
    fs.writeFileSync(shipEnginePath, JSON.stringify(engineData, null, 2), "utf8")

    const result = runHandler(tmpDir)

    assert.strictEqual(result.status, 0, "Handler should exit cleanly")
    assert.strictEqual(
      fs.existsSync(shipEnginePath),
      false,
      "Ship engine file should be deleted when state is complete"
    )
  } finally {
    cleanupTempDir(tmpDir)
  }
}

function testMissingEngineFileHandlerExitsCleanly() {
  const tmpDir = setupTempDir()
  try {
    const result = runHandler(tmpDir)

    assert.strictEqual(result.status, 0, "Handler should exit cleanly even with no engine files present")
  } finally {
    cleanupTempDir(tmpDir)
  }
}

function testMalformedEngineJsonPreserved() {
  const tmpDir = setupTempDir()
  try {
    const buildEnginePath = path.join(tmpDir, ".claude", "ucai-build-engine.local.json")
    fs.writeFileSync(buildEnginePath, "{ invalid json", "utf8")

    const result = runHandler(tmpDir)

    assert.strictEqual(result.status, 0, "Handler should exit cleanly")
    assert.strictEqual(
      fs.existsSync(buildEnginePath),
      true,
      "Malformed engine file should be preserved (not deleted)"
    )
  } finally {
    cleanupTempDir(tmpDir)
  }
}

function testNonEngineStateFilesAlwaysDeleted() {
  const tmpDir = setupTempDir()
  try {
    const iteratePath = path.join(tmpDir, ".claude", "ucai-iterate.local.md")
    const shipStatePath = path.join(tmpDir, ".claude", "ucai-ship.local.md")
    const formatterCachePath = path.join(tmpDir, ".claude", "ucai-formatter-cache.local.json")

    fs.writeFileSync(iteratePath, "# Iterate state", "utf8")
    fs.writeFileSync(shipStatePath, "# Ship state", "utf8")
    fs.writeFileSync(formatterCachePath, "{}", "utf8")

    // Also include a mid-flight build engine to confirm it is preserved alongside the deletions
    const buildEnginePath = path.join(tmpDir, ".claude", "ucai-build-engine.local.json")
    const engineData = { snapshot: { project: { state: "building" } } }
    fs.writeFileSync(buildEnginePath, JSON.stringify(engineData, null, 2), "utf8")

    const result = runHandler(tmpDir)

    assert.strictEqual(result.status, 0, "Handler should exit cleanly")
    assert.strictEqual(fs.existsSync(iteratePath), false, "Iterate state should be deleted")
    assert.strictEqual(fs.existsSync(shipStatePath), false, "Ship state should be deleted")
    assert.strictEqual(fs.existsSync(formatterCachePath), false, "Formatter cache should be deleted")
    assert.strictEqual(
      fs.existsSync(buildEnginePath),
      true,
      "Build engine should be preserved since not complete"
    )
  } finally {
    cleanupTempDir(tmpDir)
  }
}

function runAllTests() {
  const tests = [
    { name: "Build engine mid-flight preserved", fn: testBuildEngineMidFlightPreserved },
    { name: "Build engine complete deleted", fn: testBuildEngineCompleteDeleted },
    { name: "Ship engine mid-flight preserved", fn: testShipEngineMidFlightPreserved },
    { name: "Ship engine complete deleted", fn: testShipEngineCompleteDeleted },
    { name: "Missing engine file handler exits cleanly", fn: testMissingEngineFileHandlerExitsCleanly },
    { name: "Malformed engine JSON preserved", fn: testMalformedEngineJsonPreserved },
    { name: "Non-engine state files always deleted", fn: testNonEngineStateFilesAlwaysDeleted },
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
