#!/usr/bin/env node

// Regression test: keep the documented engine dependency/task/gate counts
// in README.md and CLAUDE.md in sync with what scripts/setup-build-engine.js
// and scripts/setup-ship-engine.js actually generate.
//
// The failure this guards against is documentation drift, not code drift:
// the engine content (scripts/engine-factory.js) is the source of truth,
// and README.md / CLAUDE.md merely describe it. A test that only checked
// the generated counts against hardcoded constants would not catch a
// docs edit going stale after the engine changes — so this test re-derives
// the "expected" numbers from the two doc files at read time and compares
// them against a fresh run of the real setup scripts.
//
// Doc lines are parsed by first locating the setup script's filename on
// the line, then extracting the integers that immediately precede the
// words "deps", "tasks", or "gates" on that line — not by matching a whole
// sentence — so rewording the surrounding prose does not break this test,
// but changing a documented number does. This also lets one parser handle
// both documented shapes: README.md's tree-diagram comment (only deps and
// gates are mentioned there) and CLAUDE.md's table row (deps, tasks, and
// gates are all mentioned).
//
// Plain node script, no test runner. Uses only per-test temp directories
// (via os.tmpdir/path.join) and never touches the repo working tree.
// Portable: no shell-outs, no symlinks, no mode bits -- must run unchanged
// on ubuntu and windows, node 18 and 20.

const assert = require("assert")
const fs = require("fs")
const os = require("os")
const path = require("path")
const { execFileSync } = require("child_process")

const REPO_ROOT = path.resolve(__dirname, "..")
const SCRIPTS = path.join(REPO_ROOT, "scripts")
const SETUP_BUILD_ENGINE = path.join(SCRIPTS, "setup-build-engine.js")
const SETUP_SHIP_ENGINE = path.join(SCRIPTS, "setup-ship-engine.js")
const README_PATH = path.join(REPO_ROOT, "README.md")
const CLAUDE_MD_PATH = path.join(REPO_ROOT, "CLAUDE.md")

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "ucai-engine-counts-test-"))
}

function removeTmpDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true })
}

// Run a setup script as a subprocess in tmpDir, the way a user invoking it
// from a project root would, then read back the engine state file it wrote
// to <tmpDir>/.claude and count dependencies/tasks/logicGates directly from
// the generated snapshot.
function generateEngineCounts(scriptPath, args, tmpDir, engineFileName) {
  execFileSync(process.execPath, [scriptPath, ...args], {
    cwd: tmpDir,
    encoding: "utf8",
  })

  const engineFile = path.join(tmpDir, ".claude", engineFileName)
  const data = JSON.parse(fs.readFileSync(engineFile, "utf8"))
  const project = data.snapshot.project

  return {
    deps: project.dependencies.length,
    tasks: project.tasks.length,
    gates: project.logicGates.length,
  }
}

// Find every line in `content` that mentions `scriptFilename`, then extract
// the integers that precede "deps", "tasks", or "gates" on that line. Which
// of the three metrics appear varies by doc (README's tree diagram only
// mentions deps and gates; CLAUDE.md's table row mentions all three), so
// the return value only contains the keys actually found.
function extractDocumentedCounts(content, scriptFilename) {
  const line = content.split("\n").find((l) => l.includes(scriptFilename))
  assert.ok(line, `no line mentioning "${scriptFilename}" found`)

  const counts = {}
  const pattern = /(\d+)\s+(deps|tasks|gates)\b/g
  let match
  while ((match = pattern.exec(line)) !== null) {
    counts[match[2]] = Number(match[1])
  }
  return { line, counts }
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

// Assert that every metric documented on `line` (a subset of deps/tasks/
// gates) matches the corresponding value in `generated`, naming the doc
// file, the metric, and both the documented and generated numbers on
// failure.
function assertDocMatchesGenerated(docLabel, docPath, line, documented, generated) {
  for (const metric of ["deps", "tasks", "gates"]) {
    if (!(metric in documented)) continue
    ok(`${docLabel}: documented ${metric} count matches generated count`, () => {
      assert.strictEqual(
        documented[metric],
        generated[metric],
        `${docPath} says ${documented[metric]} ${metric} on line "${line.trim()}", ` +
          `but running the real setup script generated ${generated[metric]} ${metric}`
      )
    })
  }
}

function main() {
  console.log("\nengine-counts: README.md/CLAUDE.md documented counts vs. generated engines\n")

  const readme = fs.readFileSync(README_PATH, "utf8")
  const claudeMd = fs.readFileSync(CLAUDE_MD_PATH, "utf8")

  // --- build engine ---
  const buildTmpDir = makeTmpDir()
  let buildGenerated
  try {
    buildGenerated = generateEngineCounts(
      SETUP_BUILD_ENGINE,
      ["--feature", "engine counts test feature"],
      buildTmpDir,
      "ucai-build-engine.local.json"
    )
  } finally {
    removeTmpDir(buildTmpDir)
  }

  ok("build engine: generated deps count matches ground truth", () => {
    assert.strictEqual(buildGenerated.deps, 18, `expected 18 deps, got ${buildGenerated.deps}`)
  })
  ok("build engine: generated tasks count matches ground truth", () => {
    assert.strictEqual(buildGenerated.tasks, 8, `expected 8 tasks, got ${buildGenerated.tasks}`)
  })
  ok("build engine: generated gates count matches ground truth", () => {
    assert.strictEqual(buildGenerated.gates, 11, `expected 11 gates, got ${buildGenerated.gates}`)
  })

  const readmeBuild = extractDocumentedCounts(readme, "setup-build-engine.js")
  assertDocMatchesGenerated("README.md build engine line", "README.md", readmeBuild.line, readmeBuild.counts, buildGenerated)

  const claudeMdBuild = extractDocumentedCounts(claudeMd, "setup-build-engine.js")
  assertDocMatchesGenerated("CLAUDE.md build engine line", "CLAUDE.md", claudeMdBuild.line, claudeMdBuild.counts, buildGenerated)

  // --- ship engine ---
  const shipTmpDir = makeTmpDir()
  let shipGenerated
  try {
    shipGenerated = generateEngineCounts(
      SETUP_SHIP_ENGINE,
      ["--spec", "engine counts test spec"],
      shipTmpDir,
      "ucai-ship-engine.local.json"
    )
  } finally {
    removeTmpDir(shipTmpDir)
  }

  ok("ship engine: generated deps count matches ground truth", () => {
    assert.strictEqual(shipGenerated.deps, 13, `expected 13 deps, got ${shipGenerated.deps}`)
  })
  ok("ship engine: generated tasks count matches ground truth", () => {
    assert.strictEqual(shipGenerated.tasks, 9, `expected 9 tasks, got ${shipGenerated.tasks}`)
  })
  ok("ship engine: generated gates count matches ground truth", () => {
    assert.strictEqual(shipGenerated.gates, 7, `expected 7 gates, got ${shipGenerated.gates}`)
  })

  const readmeShip = extractDocumentedCounts(readme, "setup-ship-engine.js")
  assertDocMatchesGenerated("README.md ship engine line", "README.md", readmeShip.line, readmeShip.counts, shipGenerated)

  const claudeMdShip = extractDocumentedCounts(claudeMd, "setup-ship-engine.js")
  assertDocMatchesGenerated("CLAUDE.md ship engine line", "CLAUDE.md", claudeMdShip.line, claudeMdShip.counts, shipGenerated)

  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

main()
