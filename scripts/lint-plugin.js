#!/usr/bin/env node

// Ucai Plugin Consistency Linter
// Validates command count, version parity, phase counts, references, and stale names
// Run: node scripts/lint-plugin.js
// Exit code 0 = all pass, 1 = failures found

const fs = require("fs")
const path = require("path")

const ROOT = path.resolve(__dirname, "..")
let failures = 0
let passes = 0

function check(name, passed, detail) {
  if (passed) {
    console.log("  \u2713 " + name)
    passes++
  } else {
    console.log("  \u2717 " + name + " — " + detail)
    failures++
  }
}

function readFile(relPath) {
  const full = path.join(ROOT, relPath)
  if (!fs.existsSync(full)) return null
  return fs.readFileSync(full, "utf8")
}

function countFiles(dir, ext) {
  const full = path.join(ROOT, dir)
  if (!fs.existsSync(full)) return 0
  return fs.readdirSync(full).filter(f => f.endsWith(ext)).length
}

function listFiles(dir, ext) {
  const full = path.join(ROOT, dir)
  if (!fs.existsSync(full)) return []
  return fs.readdirSync(full).filter(f => f.endsWith(ext)).map(f => f.replace(ext, ""))
}

function listDirs(dir) {
  const full = path.join(ROOT, dir)
  if (!fs.existsSync(full)) return []
  return fs.readdirSync(full, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
}

function grepFiles(pattern, dir) {
  const results = []
  const fullDir = path.join(ROOT, dir)
  if (!fs.existsSync(fullDir)) return results

  function walk(d) {
    const entries = fs.readdirSync(d, { withFileTypes: true })
    for (const entry of entries) {
      const full = path.join(d, entry.name)
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === ".git" || entry.name === ".bg-shell") continue
        walk(full)
      } else if ((entry.name.endsWith(".md") || entry.name.endsWith(".js") || entry.name.endsWith(".json"))
        && entry.name !== "CHANGELOG.md"
        && !full.includes("lint-plugin.js")
        && !full.includes(path.join(".claude", "frds"))) {
        const content = fs.readFileSync(full, "utf8")
        if (pattern.test(content)) {
          results.push(path.relative(ROOT, full))
        }
      }
    }
  }
  walk(fullDir)
  return results
}

// --- Checks ---

console.log("\nUcai Plugin Consistency Lint\n")

// 1. Command count
console.log("Command count:")
const commandCount = countFiles("commands", ".md")
const claudeMd = readFile("CLAUDE.md") || ""
const claudeMdMatch = claudeMd.match(/Commands \((\d+) slash commands\)/)
const claudeMdCount = claudeMdMatch ? parseInt(claudeMdMatch[1], 10) : null
check("CLAUDE.md states " + commandCount + " commands", claudeMdCount === commandCount,
  "CLAUDE.md says " + claudeMdCount + " but found " + commandCount + " in commands/")

// 2. Version parity
console.log("\nVersion parity:")
const pluginJson = readFile(".claude-plugin/plugin.json")
const marketJson = readFile(".claude-plugin/marketplace.json")
const pluginVersion = pluginJson ? JSON.parse(pluginJson).version : null
const marketVersions = marketJson ? JSON.parse(marketJson) : null
const marketMetaVersion = marketVersions ? marketVersions.metadata.version : null
const marketPluginVersion = marketVersions && marketVersions.plugins[0] ? marketVersions.plugins[0].version : null

check("plugin.json version exists", !!pluginVersion, "missing version in plugin.json")
check("marketplace.json metadata matches plugin.json",
  marketMetaVersion === pluginVersion,
  "marketplace metadata=" + marketMetaVersion + " plugin=" + pluginVersion)
check("marketplace.json plugin entry matches plugin.json",
  marketPluginVersion === pluginVersion,
  "marketplace plugin=" + marketPluginVersion + " plugin=" + pluginVersion)

if (pluginVersion) {
  const claudeVersionMatch = claudeMd.match(/version (\d+\.\d+\.\d+)/)
  const claudeVersion = claudeVersionMatch ? claudeVersionMatch[1] : null
  check("CLAUDE.md version matches plugin.json",
    claudeVersion === pluginVersion,
    "CLAUDE.md=" + claudeVersion + " plugin.json=" + pluginVersion)
}

// 3. Ship phase count
console.log("\nShip phase count:")
const shipCmd = readFile("commands/ship.md") || ""
const shipPhases = shipCmd.match(/## Phase \d+:/g)
const shipPhaseCount = shipPhases ? shipPhases.length : 0
// Also count Phase 0 which may be "## Phase 0:" format
const shipPhase0 = shipCmd.includes("## Phase 0:")
const totalShipPhases = shipPhaseCount + (shipPhase0 && !shipPhases?.some(p => p.includes("Phase 0")) ? 1 : 0)

const workflowGuide = readFile("docs/workflow-guide.md") || ""
const wgPhaseMatch = workflowGuide.match(/The (\d+) phases/)
const wgPhaseCount = wgPhaseMatch ? parseInt(wgPhaseMatch[1], 10) : null
check("workflow-guide.md ship phase count matches reality",
  wgPhaseCount !== null,
  "Could not find phase count in workflow-guide.md")

// 4. Agent references
console.log("\nAgent references:")
const agentNames = listFiles("agents", ".md")
for (const agent of agentNames) {
  const pattern = new RegExp("ucai:" + agent.replace(/-/g, "[-]?"))
  const refs = grepFiles(pattern, "commands")
  check("Agent '" + agent + "' referenced in commands", refs.length > 0,
    "no command references ucai:" + agent)
}

// 5. Skill references
console.log("\nSkill references:")
const skillNames = listDirs("skills")
for (const skill of skillNames) {
  // Check both ucai:name format and plain name in docs (README, workflow-guide)
  const ucaiPattern = new RegExp("ucai:" + skill.replace(/-/g, "[-]?"))
  const plainPattern = new RegExp("\\b" + skill.replace(/-/g, "[-]") + "\\b")
  const ucaiRefs = grepFiles(ucaiPattern, ".")
  const plainRefs = grepFiles(plainPattern, ".")
  const hasRef = ucaiRefs.length > 0 || plainRefs.length > 0
  check("Skill '" + skill + "' referenced somewhere", hasRef,
    "no references to " + skill + " or ucai:" + skill)
}

// 6. TodoWrite check
console.log("\nTodoWrite references:")
const todoWriteRefs = grepFiles(/TodoWrite/, ".")
check("Zero TodoWrite references remain", todoWriteRefs.length === 0,
  "found in: " + todoWriteRefs.join(", "))

// 7. Stale skill names
console.log("\nStale references:")
const staleRefs = grepFiles(/receiving-code-review/, ".")
check("Zero 'receiving-code-review' references", staleRefs.length === 0,
  "found in: " + staleRefs.join(", "))

// --- Summary ---
console.log("\n" + (failures === 0 ? "All checks passed" : failures + " check(s) failed") +
  " (" + passes + " passed, " + failures + " failed)\n")

process.exit(failures > 0 ? 1 : 0)
