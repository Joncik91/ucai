#!/usr/bin/env node

// Ucai SessionStart Hook
// Injects useful context: plugin status, git branch, iterate loop, CLAUDE.md, skills

const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

const STATE_FILE = ".claude/ucai-iterate.local.md"
const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, "../..")

function getGitBranch() {
  try {
    return execSync("git rev-parse --abbrev-ref HEAD", {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim()
  } catch {
    return null
  }
}

function getIterateStatus() {
  if (!fs.existsSync(STATE_FILE)) return null

  try {
    const content = fs.readFileSync(STATE_FILE, "utf8")
    const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
    if (!fmMatch) return null

    const frontmatter = fmMatch[1]
    function getField(name) {
      const m = frontmatter.match(new RegExp("^" + name + ":\\s*(.*)$", "m"))
      return m ? m[1].trim() : null
    }

    const iteration = getField("iteration")
    const maxIterations = getField("max_iterations")
    const maxDisplay = maxIterations && maxIterations !== "0" ? maxIterations : "unlimited"

    return "iteration " + iteration + "/" + maxDisplay
  } catch {
    return null
  }
}

function hasClaudeMd() {
  return fs.existsSync("CLAUDE.md")
}

function scanSkillsDir(dir, source) {
  if (!fs.existsSync(dir)) return []

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    const skills = []

    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const skillFile = path.join(dir, entry.name, "SKILL.md")
      if (!fs.existsSync(skillFile)) continue

      try {
        const content = fs.readFileSync(skillFile, "utf8")
        const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
        if (!fmMatch) continue

        const fm = fmMatch[1]
        const nameMatch = fm.match(/^name:\s*(.+?)[\r]?$/m)
        const descMatch = fm.match(/^description:\s*(.+?)[\r]?$/m)
        if (nameMatch) {
          const name = nameMatch[1].trim()
          const desc = descMatch ? descMatch[1].trim() : ""
          skills.push("[" + source + "] " + name + (desc ? " (" + desc + ")" : ""))
        }
      } catch {}
    }

    return skills
  } catch {
    return []
  }
}

function scanInstalledPlugins(cacheDir) {
  if (!fs.existsSync(cacheDir)) return []
  const skills = []

  try {
    for (const marketplace of fs.readdirSync(cacheDir, { withFileTypes: true })) {
      if (!marketplace.isDirectory()) continue
      const marketDir = path.join(cacheDir, marketplace.name)

      for (const plugin of fs.readdirSync(marketDir, { withFileTypes: true })) {
        if (!plugin.isDirectory()) continue
        const pluginDir = path.join(marketDir, plugin.name)

        for (const version of fs.readdirSync(pluginDir, { withFileTypes: true })) {
          if (!version.isDirectory()) continue
          const versionDir = path.join(pluginDir, version.name)
          skills.push(...scanSkillsDir(versionDir, "installed"))
        }
      }
    }
  } catch {}

  return skills
}

function getSpecStatus() {
  const parts = []

  const hasProject = fs.existsSync(".claude/project.md")
  const hasRequirements = fs.existsSync(".claude/requirements.md")

  // Announce project name if project.md exists
  if (hasProject) {
    try {
      var projectContent = fs.readFileSync(".claude/project.md", "utf8")
      var projFm = projectContent.match(/^---\r?\n([\s\S]*?)\r?\n---/)
      if (projFm) {
        var nameMatch = projFm[1].match(/^name:\s*(.+?)[\r]?$/m)
        if (nameMatch) {
          parts.push("Project: " + nameMatch[1].trim())
        }
      }
    } catch {}
  }

  // Parse requirements for progress and next step
  if (hasRequirements) {
    try {
      var reqContent = fs.readFileSync(".claude/requirements.md", "utf8")
      var done = (reqContent.match(/- \[x\]/g) || []).length
      var todo = (reqContent.match(/- \[ \]/g) || []).length
      var total = done + todo
      if (total > 0) {
        parts.push(done + "/" + total + " requirements done")
      }

      // Find next build order step with uncompleted requirements
      var buildOrderMatch = reqContent.match(/## Build Order\r?\n([\s\S]*?)(?=\r?\n## |\r?\n$|$)/)
      if (buildOrderMatch) {
        var lines = buildOrderMatch[1].split(/\r?\n/).filter(function (l) { return /^\d+\./.test(l.trim()) })
        for (var i = 0; i < lines.length; i++) {
          var coversMatch = lines[i].match(/covers:\s*(.+?)(?:\s*—|$)/)
          if (coversMatch) {
            var coveredFeatures = coversMatch[1].split(",").map(function (f) { return f.trim() })
            var allDone = coveredFeatures.every(function (feat) {
              return reqContent.indexOf("- [x] " + feat) !== -1
            })
            if (!allDone) {
              var stepName = lines[i].match(/\*\*(.+?)\*\*/)
              if (stepName) {
                parts.push("Next: step " + (i + 1) + " — " + stepName[1])
              }
              break
            }
          }
        }
      }
    } catch {}
  }

  // Announce PRDs
  var prdsDir = ".claude/prds"
  if (fs.existsSync(prdsDir)) {
    try {
      var prdFiles = fs.readdirSync(prdsDir)
        .filter(function (f) { return f.endsWith(".md") })
        .map(function (f) { return f.replace(/\.md$/, "") })
      if (prdFiles.length > 0) {
        parts.push("PRDs: " + prdFiles.join(", "))
      }
    } catch {}
  }

  // Legacy fallback
  if (parts.length === 0 && fs.existsSync(".claude/prd.md")) {
    parts.push("Legacy PRD found (prd.md)")
  }

  return parts.length > 0 ? parts.join(" | ") : null
}

function getAvailableSkills() {
  const homeDir = process.env.HOME || process.env.USERPROFILE || ""
  const pluginSkills = scanSkillsDir(path.join(PLUGIN_ROOT, "skills"), "plugin")
  const projectSkills = scanSkillsDir(path.join(process.cwd(), ".claude", "skills"), "project")
  const userSkills = homeDir ? scanSkillsDir(path.join(homeDir, ".claude", "skills"), "user") : []
  const installedSkills = homeDir ? scanInstalledPlugins(path.join(homeDir, ".claude", "plugins", "cache")) : []
  const all = pluginSkills.concat(projectSkills).concat(userSkills).concat(installedSkills)
  return all.length > 0 ? all.join(", ") : null
}

function main() {
  const parts = [
    "Ucai plugin is active. Use /init to analyze this project, /build for feature development, /iterate for autonomous iteration, or /review for code review."
  ]

  const branch = getGitBranch()
  if (branch) {
    parts.push("Git branch: " + branch)
  }

  const iterateStatus = getIterateStatus()
  if (iterateStatus) {
    parts.push("Iterate loop active: " + iterateStatus)
  }

  if (!hasClaudeMd()) {
    parts.push("No CLAUDE.md found. Run /init to generate project guidelines.")
  }

  const specStatus = getSpecStatus()
  if (specStatus) {
    parts.push(specStatus)
  }

  const skills = getAvailableSkills()
  if (skills) {
    parts.push("Available skills: " + skills)
  }

  const context = parts.join(" | ")

  const result = JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: context,
    },
  })

  process.stdout.write(result)
}

main()
