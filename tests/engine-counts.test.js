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
// gates are all mentioned). Each call site declares which metrics it
// expects to find on its line; if the label is reworded into a form the
// parser doesn't recognize (e.g. "dependencies"/"logic gates") or an
// earlier plain-usage mention of the filename has no numbers on it, the
// test fails loudly instead of silently registering zero assertions.
//
// README.md:72 documents the build engine's counts a third way, in prose
// with no script filename ("ContingencyEngine (never-forget) tracks N
// dependencies, N logic gates, and N shadow tasks per build") — parsed
// separately by extractContingencyEngineSummaryCounts, anchored on that
// fixed phrase. "shadow tasks" there means the total reaction count
// (project.tasks[].reactions.length summed), not project.tasks.length.
//
// docs/workflow-guide.md:138 documents the build engine's counts a fourth
// way, in a table cell with no script filename ("**Initializes enforcement
// engine** (N deps, N gates)") — parsed by extractAnchoredShortFormCounts,
// anchored on the fixed phrase "Initializes enforcement engine" (distinct
// from the unrelated, count-free "Initialize enforcement engine." bullet
// elsewhere in the same file), reusing the same short-form "deps"/"gates"
// token pattern as extractDocumentedCounts.
//
// docs/workflow-guide.md:197 documents the ship engine's counts a fifth
// way, again with no script filename ("Each phase runs a gate check (N
// deps, N gates)") — also parsed by extractAnchoredShortFormCounts, anchored
// on the fixed phrase "Each phase runs a gate check". Both anchored
// short-form sites live in the same file, so each is checked against the
// engine it actually documents (build for :138, ship for :197) rather than
// assumed from position.
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
const WORKFLOW_GUIDE_PATH = path.join(REPO_ROOT, "docs", "workflow-guide.md")

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "ucai-engine-counts-test-"))
}

function removeTmpDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true })
}

// Run a setup script as a subprocess in tmpDir, the way a user invoking it
// from a project root would, then read back the engine state file it wrote
// to <tmpDir>/.claude and count dependencies/tasks/logicGates/shadow
// reactions directly from the generated snapshot. "shadowReactions" is the
// total count of reactions (original + auto-generated shadow reactions)
// across all tasks -- this is the number setup-build-engine.js itself
// prints as "Shadow Reactions" and README.md:72 documents as "shadow tasks".
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
    shadowReactions: project.tasks.reduce((sum, t) => sum + t.reactions.length, 0),
  }
}

// Find the line in `content` that documents counts for `scriptFilename`,
// then extract the integers that precede "deps", "tasks", or "gates" on
// that line. Which of the three metrics appear varies by doc (README's
// tree diagram only mentions deps and gates; CLAUDE.md's table row mentions
// all three), so callers pass `expectedMetrics` -- the exact set that MUST
// be present on the documenting line -- and this function asserts every one
// of them was actually found, rather than silently returning an empty
// object when the label is reworded (e.g. "dependencies"/"logic gates")
// or a count is dropped from the prose.
//
// A candidate line must mention the script filename AND carry at least one
// recognized count token. Requiring both stops an earlier plain-usage
// mention of the filename (with no numbers on the line, e.g. a `node
// scripts/setup-build-engine.js --feature "..."` example) from stealing the
// match away from the real documentation line.
function extractDocumentedCounts(content, scriptFilename, expectedMetrics) {
  const pattern = /(\d+)\s+(deps|tasks|gates)\b/g

  const matches = content
    .split("\n")
    .filter((line) => line.includes(scriptFilename))
    .map((line) => {
      const counts = {}
      pattern.lastIndex = 0
      let match
      while ((match = pattern.exec(line)) !== null) {
        counts[match[2]] = Number(match[1])
      }
      return { line, counts }
    })
    .filter(({ counts }) => Object.keys(counts).length > 0)

  assert.strictEqual(
    matches.length,
    1,
    `expected exactly one line mentioning "${scriptFilename}" with documented deps/tasks/gates counts, ` +
      `found ${matches.length} (a reworded label with no recognized count token, or a stray plain-usage ` +
      `mention of the filename, can cause this)`
  )

  const { line, counts } = matches[0]

  for (const metric of expectedMetrics) {
    assert.ok(
      metric in counts,
      `line "${line.trim()}" mentions "${scriptFilename}" but does not document a "${metric}" count`
    )
  }

  return { line, counts }
}

// README.md:72 documents the build engine's counts in a third format,
// unrelated to any setup script filename: prose naming "dependencies",
// "logic gates", and "shadow tasks" (the latter being the total reaction
// count, i.e. generated.shadowReactions, not generated.tasks). Located by
// its fixed anchor phrase "ContingencyEngine (never-forget) tracks" so that
// rewording elsewhere in the surrounding bullet list doesn't affect it.
function extractContingencyEngineSummaryCounts(content) {
  const anchor = "ContingencyEngine (never-forget) tracks"
  const lines = content.split("\n").filter((line) => line.includes(anchor))
  assert.strictEqual(
    lines.length,
    1,
    `expected exactly one line containing "${anchor}", found ${lines.length}`
  )
  const line = lines[0]

  const pattern = /(\d+)\s+(dependencies|logic gates|shadow tasks)\b/g
  const counts = {}
  let match
  while ((match = pattern.exec(line)) !== null) {
    const key = { dependencies: "deps", "logic gates": "gates", "shadow tasks": "shadowReactions" }[match[2]]
    counts[key] = Number(match[1])
  }

  for (const metric of ["deps", "gates", "shadowReactions"]) {
    assert.ok(
      metric in counts,
      `line "${line.trim()}" does not document a "${metric}" count`
    )
  }

  return { line, counts }
}

// docs/workflow-guide.md:138 documents the build engine's counts a fourth
// way: a table cell with no script filename, anchored on the fixed phrase
// `anchor`, using the same short-form "N deps"/"N gates" token pattern as
// extractDocumentedCounts. Kept as its own function (rather than reusing
// extractDocumentedCounts) because the match key here is a fixed anchor
// phrase, not a script filename.
function extractAnchoredShortFormCounts(content, anchor, expectedMetrics) {
  const pattern = /(\d+)\s+(deps|tasks|gates)\b/g

  const lines = content.split("\n").filter((line) => line.includes(anchor))
  assert.strictEqual(
    lines.length,
    1,
    `expected exactly one line containing "${anchor}", found ${lines.length}`
  )
  const line = lines[0]

  const counts = {}
  let match
  while ((match = pattern.exec(line)) !== null) {
    counts[match[2]] = Number(match[1])
  }

  for (const metric of expectedMetrics) {
    assert.ok(
      metric in counts,
      `line "${line.trim()}" contains "${anchor}" but does not document a "${metric}" count`
    )
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
// gates/shadowReactions) matches the corresponding value in `generated`,
// naming the doc file, the metric, and both the documented and generated
// numbers on failure.
function assertDocMatchesGenerated(docLabel, docPath, line, documented, generated) {
  for (const metric of ["deps", "tasks", "gates", "shadowReactions"]) {
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
  const workflowGuide = fs.readFileSync(WORKFLOW_GUIDE_PATH, "utf8")

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
  ok("build engine: generated shadow reactions count matches ground truth", () => {
    assert.strictEqual(
      buildGenerated.shadowReactions,
      144,
      `expected 144 shadow reactions, got ${buildGenerated.shadowReactions}`
    )
  })

  const readmeBuild = extractDocumentedCounts(readme, "setup-build-engine.js", ["deps", "gates"])
  assertDocMatchesGenerated("README.md build engine line", "README.md", readmeBuild.line, readmeBuild.counts, buildGenerated)

  const claudeMdBuild = extractDocumentedCounts(claudeMd, "setup-build-engine.js", ["deps", "tasks", "gates"])
  assertDocMatchesGenerated("CLAUDE.md build engine line", "CLAUDE.md", claudeMdBuild.line, claudeMdBuild.counts, buildGenerated)

  const readmeContingencySummary = extractContingencyEngineSummaryCounts(readme)
  assertDocMatchesGenerated(
    "README.md ContingencyEngine summary line",
    "README.md",
    readmeContingencySummary.line,
    readmeContingencySummary.counts,
    buildGenerated
  )

  const workflowGuideBuild = extractAnchoredShortFormCounts(
    workflowGuide,
    "Initializes enforcement engine",
    ["deps", "gates"]
  )
  assertDocMatchesGenerated(
    "docs/workflow-guide.md enforcement engine line",
    "docs/workflow-guide.md",
    workflowGuideBuild.line,
    workflowGuideBuild.counts,
    buildGenerated
  )

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

  const readmeShip = extractDocumentedCounts(readme, "setup-ship-engine.js", ["deps", "gates"])
  assertDocMatchesGenerated("README.md ship engine line", "README.md", readmeShip.line, readmeShip.counts, shipGenerated)

  const claudeMdShip = extractDocumentedCounts(claudeMd, "setup-ship-engine.js", ["deps", "tasks", "gates"])
  assertDocMatchesGenerated("CLAUDE.md ship engine line", "CLAUDE.md", claudeMdShip.line, claudeMdShip.counts, shipGenerated)

  const workflowGuideShip = extractAnchoredShortFormCounts(
    workflowGuide,
    "Each phase runs a gate check",
    ["deps", "gates"]
  )
  assertDocMatchesGenerated(
    "docs/workflow-guide.md phase gate check line",
    "docs/workflow-guide.md",
    workflowGuideShip.line,
    workflowGuideShip.counts,
    shipGenerated
  )

  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

main()
