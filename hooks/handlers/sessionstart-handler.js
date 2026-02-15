#!/usr/bin/env node

// Ucai SessionStart Hook
// Injects useful context: plugin status, git branch, iterate loop, CLAUDE.md

const fs = require("fs")
const { execSync } = require("child_process")

const STATE_FILE = ".claude/ucai-iterate.local.md"

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
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
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
