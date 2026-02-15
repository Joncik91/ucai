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

function getAvailableSkills() {
  const pluginSkills = scanSkillsDir(path.join(PLUGIN_ROOT, "skills"), "plugin")
  const projectSkills = scanSkillsDir(path.join(process.cwd(), ".claude", "skills"), "project")
  const all = pluginSkills.concat(projectSkills)
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
