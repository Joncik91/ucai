#!/usr/bin/env node

// Ucai Engine Factory
// Create, load, save, and delete ContingencyEngine instances for /build and /ship pipelines

const fs = require("fs")
const path = require("path")

const ENGINE_DIR = ".claude"
const BUILD_ENGINE_FILE = path.join(ENGINE_DIR, "ucai-build-engine.local.json")
const SHIP_ENGINE_FILE = path.join(ENGINE_DIR, "ucai-ship-engine.local.json")

function getEngineFile(pipeline) {
  if (pipeline === "build") return BUILD_ENGINE_FILE
  if (pipeline === "ship") return SHIP_ENGINE_FILE
  throw new Error(`Unknown pipeline: ${pipeline}`)
}

async function loadNeverForget() {
  const libPath = path.resolve(__dirname, "lib", "never-forget", "index.js")
  return await import("file:///" + libPath.replace(/\\/g, "/"))
}

// --- Build Pipeline Entity Definitions ---

function getBuildDependencies() {
  return [
    { id: "dep-spec-chain", name: "Spec Chain Loaded", priority: "required", state: "identified" },
    { id: "dep-milestone-selected", name: "Milestone Selected", priority: "required", state: "identified" },
    { id: "dep-acceptance-criteria", name: "Acceptance Criteria Defined", priority: "required", state: "identified" },
    { id: "dep-skills-loaded", name: "Skills Loaded", priority: "required", state: "identified" },
    { id: "dep-codebase-map", name: "Codebase Map Compiled", priority: "required", state: "identified" },
    { id: "dep-clarifications", name: "Clarifications Resolved", priority: "required", state: "identified" },
    { id: "dep-architecture-approved", name: "Architecture Approved", priority: "required", state: "identified" },
    { id: "dep-implementation-go", name: "Implementation Authorized", priority: "required", state: "identified" },
    { id: "dep-code-implemented", name: "Code Implemented", priority: "required", state: "identified" },
    { id: "dep-agents-reviewed", name: "Agent Review Complete", priority: "required", state: "identified" },
    { id: "dep-issues-resolved", name: "Issues Resolved", priority: "required", state: "identified" },
    { id: "dep-test-author-spawned", name: "Test Author Subagent Dispatched", priority: "required", state: "identified" },
    { id: "dep-tests-written", name: "Tests Written", priority: "required", state: "identified" },
    { id: "dep-manual-test-passed", name: "Manual Testing Confirmed", priority: "required", state: "identified" },
    { id: "dep-lessons-captured", name: "Lessons Captured", priority: "recommended", state: "identified" },
    { id: "dep-requirements-updated", name: "Requirements Updated", priority: "recommended", state: "identified" },
    { id: "dep-milestone-updated", name: "Milestone Updated", priority: "recommended", state: "identified" },
  ]
}

function getBuildTasks() {
  return [
    { id: "task-understand", name: "Phase 1: Understand", state: "pending", reactions: [] },
    { id: "task-explore", name: "Phase 2: Explore", state: "pending", reactions: [] },
    { id: "task-clarify", name: "Phase 3: Clarify", state: "pending", reactions: [] },
    { id: "task-design", name: "Phase 4: Design", state: "pending", reactions: [] },
    { id: "task-build", name: "Phase 5: Build", state: "pending", reactions: [] },
    { id: "task-verify", name: "Phase 6: Verify", state: "pending", reactions: [] },
    { id: "task-test", name: "Phase 7: Test", state: "pending", reactions: [] },
    { id: "task-done", name: "Phase 8: Done", state: "pending", reactions: [] },
  ]
}

function getBuildGates() {
  return [
    {
      id: "gate-milestone-before-explore", name: "Milestone Required Before Explore", enabled: true,
      condition: { subject: "dep-milestone-selected", property: "state", operator: "neq", value: "complete" },
      action: { type: "block", target: "task-explore", message: "Select a milestone before exploring the codebase" },
    },
    {
      id: "gate-skills-before-explore", name: "Skills Required Before Explore", enabled: true,
      condition: { subject: "dep-skills-loaded", property: "state", operator: "neq", value: "complete" },
      action: { type: "block", target: "task-explore", message: "Load at least one domain skill before exploration" },
    },
    {
      id: "gate-map-before-design", name: "Codebase Map Before Design", enabled: true,
      condition: { subject: "dep-codebase-map", property: "state", operator: "neq", value: "complete" },
      action: { type: "block", target: "task-design", message: "Complete codebase exploration before designing" },
    },
    {
      id: "gate-clarify-before-design", name: "Clarifications Before Design", enabled: true,
      condition: { subject: "dep-clarifications", property: "state", operator: "neq", value: "complete" },
      action: { type: "block", target: "task-design", message: "Resolve all clarifications before designing" },
    },
    {
      id: "gate-approval-before-build", name: "Architecture Approval Before Build", enabled: true,
      condition: { subject: "dep-architecture-approved", property: "state", operator: "neq", value: "complete" },
      action: { type: "block", target: "task-build", message: "Get user approval on architecture before implementing" },
    },
    {
      id: "gate-go-before-build", name: "Implementation Go Before Build", enabled: true,
      condition: { subject: "dep-implementation-go", property: "state", operator: "neq", value: "complete" },
      action: { type: "block", target: "task-build", message: "User must say 'go' before implementation starts" },
    },
    {
      id: "gate-code-before-verify", name: "Code Before Verify", enabled: true,
      condition: { subject: "dep-code-implemented", property: "state", operator: "neq", value: "complete" },
      action: { type: "block", target: "task-verify", message: "Complete implementation before running verification" },
    },
    {
      id: "gate-issues-before-test", name: "Issues Resolved Before Test", enabled: true,
      condition: { subject: "dep-issues-resolved", property: "state", operator: "neq", value: "complete" },
      action: { type: "block", target: "task-test", message: "Resolve all review issues before testing" },
    },
    {
      id: "gate-test-author-before-done", name: "Test Author Dispatch Before Done", enabled: true,
      condition: { subject: "dep-test-author-spawned", property: "state", operator: "neq", value: "complete" },
      action: { type: "block", target: "task-done", message: "Test author subagent must be dispatched before completion — implementing agent may not write tests directly" },
    },
    {
      id: "gate-tests-before-done", name: "Tests Before Done", enabled: true,
      condition: { subject: "dep-tests-written", property: "state", operator: "neq", value: "complete" },
      action: { type: "block", target: "task-done", message: "Automated tests must pass before completion" },
    },
    {
      id: "gate-manual-before-done", name: "Manual Test Before Done", enabled: true,
      condition: { subject: "dep-manual-test-passed", property: "state", operator: "neq", value: "complete" },
      action: { type: "block", target: "task-done", message: "User must confirm manual testing before marking done" },
    },
  ]
}

// --- Ship Pipeline Entity Definitions ---

function getShipDependencies() {
  return [
    { id: "dep-ship-state-init", name: "State File Created", priority: "required", state: "identified" },
    { id: "dep-ship-spec-resolved", name: "Spec Resolved", priority: "required", state: "identified" },
    { id: "dep-ship-codebase-mapped", name: "Codebase Mapped", priority: "required", state: "identified" },
    { id: "dep-ship-infra-detected", name: "Infrastructure Detected", priority: "required", state: "identified" },
    { id: "dep-ship-code-implemented", name: "Code Implemented", priority: "required", state: "identified" },
    { id: "dep-ship-tests-pass", name: "Tests Passing", priority: "required", state: "identified" },
    { id: "dep-ship-lint-pass", name: "Lint Passing", priority: "recommended", state: "identified" },
    { id: "dep-ship-format-applied", name: "Formatting Applied", priority: "optional", state: "identified" },
    { id: "dep-ship-review-clean", name: "Review Clean", priority: "recommended", state: "identified" },
    { id: "dep-ship-pr-created", name: "PR Created", priority: "recommended", state: "identified" },
    { id: "dep-ship-frd-updated", name: "FRD Updated", priority: "recommended", state: "identified" },
    { id: "dep-ship-requirements-updated", name: "Requirements Updated", priority: "recommended", state: "identified" },
    { id: "dep-ship-lessons-captured", name: "Lessons Captured", priority: "optional", state: "identified" },
  ]
}

function getShipTasks() {
  return [
    { id: "task-ship-setup", name: "Phase 0: Setup", state: "pending", reactions: [] },
    { id: "task-ship-spec", name: "Phase 1: Spec Resolution", state: "pending", reactions: [] },
    { id: "task-ship-explore", name: "Phase 2: Explore", state: "pending", reactions: [] },
    { id: "task-ship-infra", name: "Phase 3: Detect Infrastructure", state: "pending", reactions: [] },
    { id: "task-ship-implement", name: "Phase 4: Implement", state: "pending", reactions: [] },
    { id: "task-ship-verify", name: "Phase 5: Verify Loop", state: "pending", reactions: [] },
    { id: "task-ship-review", name: "Phase 6: Light Review", state: "pending", reactions: [] },
    { id: "task-ship-pr", name: "Phase 7: Create PR", state: "pending", reactions: [] },
    { id: "task-ship-cleanup", name: "Phase 8: Cleanup & Report", state: "pending", reactions: [] },
  ]
}

function getShipGates() {
  return [
    {
      id: "gate-ship-state-before-spec", name: "State Before Spec", enabled: true,
      condition: { subject: "dep-ship-state-init", property: "state", operator: "neq", value: "complete" },
      action: { type: "block", target: "task-ship-spec", message: "State file must be created before spec resolution" },
    },
    {
      id: "gate-ship-spec-before-explore", name: "Spec Before Explore", enabled: true,
      condition: { subject: "dep-ship-spec-resolved", property: "state", operator: "neq", value: "complete" },
      action: { type: "block", target: "task-ship-explore", message: "Resolve spec before exploring codebase" },
    },
    {
      id: "gate-ship-map-before-implement", name: "Map Before Implement", enabled: true,
      condition: { subject: "dep-ship-codebase-mapped", property: "state", operator: "neq", value: "complete" },
      action: { type: "block", target: "task-ship-implement", message: "Map codebase before implementing" },
    },
    {
      id: "gate-ship-infra-before-verify", name: "Infra Before Verify", enabled: true,
      condition: { subject: "dep-ship-infra-detected", property: "state", operator: "neq", value: "complete" },
      action: { type: "block", target: "task-ship-verify", message: "Detect infrastructure before running verify loop" },
    },
    {
      id: "gate-ship-code-before-verify", name: "Code Before Verify", enabled: true,
      condition: { subject: "dep-ship-code-implemented", property: "state", operator: "neq", value: "complete" },
      action: { type: "block", target: "task-ship-verify", message: "Implement code before verification" },
    },
    {
      id: "gate-ship-verify-before-review", name: "Verify Before Review", enabled: true,
      condition: { subject: "dep-ship-tests-pass", property: "state", operator: "neq", value: "complete" },
      action: { type: "block", target: "task-ship-review", message: "Complete verify loop before review" },
    },
    {
      id: "gate-ship-review-before-pr", name: "Review Before PR", enabled: true,
      condition: { subject: "dep-ship-review-clean", property: "state", operator: "neq", value: "complete" },
      action: { type: "warn", target: "task-ship-pr", message: "Review not complete — proceeding with warnings" },
    },
  ]
}

// --- Public API ---

async function createBuildEngine(featureName, featureSlug) {
  const nf = await loadNeverForget()
  const engine = new nf.ContingencyEngine({
    id: "build-" + featureSlug + "-" + Date.now(),
    name: featureName,
    complexityThreshold: 20,
    requireProofOfWork: false,
  })

  for (const dep of getBuildDependencies()) engine.addDependency(dep)
  for (const task of getBuildTasks()) engine.addTask(task)
  for (const gate of getBuildGates()) engine.addLogicGate(gate)
  engine.generateShadowTasks()

  // Advance structural deps to "drafted" so entry gate passes
  const structuralDeps = getBuildDependencies().map((d) => d.id)
  for (const depId of structuralDeps) {
    engine.updateDependencyState(depId, "drafted")
  }
  engine.passEntryGate()
  engine.startBuilding()

  return engine
}

async function createShipEngine(specText, specSource, options = {}) {
  const nf = await loadNeverForget()
  const slug = specText.slice(0, 30).replace(/[^a-zA-Z0-9]+/g, "-").replace(/-+$/, "").toLowerCase()
  const engine = new nf.ContingencyEngine({
    id: "ship-" + slug + "-" + Date.now(),
    name: specText.slice(0, 80),
    complexityThreshold: 25,
    requireProofOfWork: false,
  })

  for (const dep of getShipDependencies()) engine.addDependency(dep)
  for (const task of getShipTasks()) engine.addTask(task)
  for (const gate of getShipGates()) engine.addLogicGate(gate)
  engine.generateShadowTasks()

  // Advance structural deps to "drafted" so entry gate passes
  const structuralDeps = getShipDependencies().map((d) => d.id)
  for (const depId of structuralDeps) {
    engine.updateDependencyState(depId, "drafted")
  }
  engine.passEntryGate()
  engine.startBuilding()

  return engine
}

async function loadEngine(pipeline) {
  const filePath = getEngineFile(pipeline)
  if (!fs.existsSync(filePath)) return null

  try {
    const raw = fs.readFileSync(filePath, "utf8")
    const data = JSON.parse(raw)
    const nf = await loadNeverForget()
    return nf.ContingencyEngine.fromSnapshot(data.snapshot)
  } catch (err) {
    console.error("Failed to load engine:", err.message)
    return null
  }
}

async function saveEngine(engine, pipeline, meta = {}) {
  const filePath = getEngineFile(pipeline)
  fs.mkdirSync(path.dirname(filePath), { recursive: true })

  const data = {
    engineVersion: "1.0.0",
    snapshot: engine.toSnapshot(),
    meta: {
      pipeline,
      savedAt: new Date().toISOString(),
      ...meta,
    },
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
}

function deleteEngine(pipeline) {
  const filePath = getEngineFile(pipeline)
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  } catch {}
}

function engineExists(pipeline) {
  return fs.existsSync(getEngineFile(pipeline))
}

// --- Sync read for hooks (no engine methods, just JSON parsing) ---

function readEngineStatus(pipeline) {
  const filePath = getEngineFile(pipeline)
  if (!fs.existsSync(filePath)) return null

  try {
    const raw = fs.readFileSync(filePath, "utf8")
    const data = JSON.parse(raw)
    const project = data.snapshot.project
    const events = data.snapshot.events || []
    const meta = data.meta || {}

    const totalDeps = project.dependencies.length
    const completeDeps = project.dependencies.filter(
      (d) => d.state === "complete" || d.state === "verified"
    ).length
    const totalTasks = project.tasks.length
    const completeTasks = project.tasks.filter((t) => t.state === "complete").length

    const lastBlocked = [...events].reverse().find((e) => e.type === "gate_blocked")

    return {
      pipeline: meta.pipeline || pipeline,
      projectState: project.state,
      totalDeps,
      completeDeps,
      totalTasks,
      completeTasks,
      lastBlockedGate: lastBlocked ? lastBlocked.details : null,
      currentPhase: meta.currentPhase || null,
    }
  } catch {
    return null
  }
}

module.exports = {
  createBuildEngine,
  createShipEngine,
  loadEngine,
  saveEngine,
  deleteEngine,
  engineExists,
  readEngineStatus,
  BUILD_ENGINE_FILE,
  SHIP_ENGINE_FILE,
}
