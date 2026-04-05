#!/usr/bin/env node

// Ucai Ship Setup Script
// Creates state file for the /ship autonomous pipeline

const fs = require("fs")
const path = require("path")

function parseArgs(args) {
  let maxFixAttempts = 5
  let noWorktree = false
  let noPr = false
  let ciWatch = false
  const specParts = []

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "-h":
      case "--help":
        console.log(`Ucai Ship - Autonomous spec-to-PR pipeline

USAGE:
  /ship [SPEC...] [OPTIONS]

ARGUMENTS:
  SPEC...    Inline spec, file path (.md), or FRD slug reference

OPTIONS:
  --max-fix-attempts <n>   Max test/lint fix retries per milestone (default: 5)
  --no-worktree            Work in current directory instead of isolated worktree
  --no-pr                  Skip PR creation
  --ci-watch               Watch CI after PR and fix failures
  -h, --help               Show this help message

DESCRIPTION:
  Autonomous pipeline: spec -> explore -> implement -> test -> fix -> PR.
  Zero approval gates. Runs in a worktree by default.

EXAMPLES:
  /ship Add user authentication with JWT tokens
  /ship .claude/frds/auth.md
  /ship auth --ci-watch
  /ship Build a REST API for todos --max-fix-attempts 10 --no-worktree`)
        process.exit(0)
        break
      case "--max-fix-attempts":
        if (!args[i + 1] || !/^\d+$/.test(args[i + 1])) {
          console.error("Error: --max-fix-attempts requires a positive integer")
          process.exit(1)
        }
        maxFixAttempts = parseInt(args[++i], 10)
        break
      case "--no-worktree":
        noWorktree = true
        break
      case "--no-pr":
        noPr = true
        break
      case "--ci-watch":
        ciWatch = true
        break
      default:
        specParts.push(args[i])
    }
  }

  return {
    maxFixAttempts,
    noWorktree,
    noPr,
    ciWatch,
    spec: specParts.join(" "),
  }
}

function detectSpecSource(spec) {
  // Check if it's a file path
  if (spec.endsWith(".md") && fs.existsSync(spec)) {
    return "path"
  }

  // Check if it's an FRD slug
  const frdPath = path.join(".claude", "frds", spec + ".md")
  if (fs.existsSync(frdPath)) {
    return "frd"
  }

  // Check without .md extension in frds directory
  const frdDir = path.join(".claude", "frds")
  if (fs.existsSync(frdDir)) {
    try {
      const files = fs.readdirSync(frdDir)
      const match = files.find(
        (f) => f.replace(".md", "").toLowerCase() === spec.toLowerCase()
      )
      if (match) return "frd"
    } catch {}
  }

  return "inline"
}

function main(args) {
  const { maxFixAttempts, noWorktree, noPr, ciWatch, spec } = parseArgs(args)

  if (!spec) {
    console.error(
      "Error: No spec provided. Usage: /ship <spec> [--max-fix-attempts N] [--no-worktree] [--no-pr] [--ci-watch]"
    )
    process.exit(1)
  }

  const specSource = detectSpecSource(spec)

  // Create state file
  fs.mkdirSync(".claude", { recursive: true })

  const content = `---
active: true
phase: 0
milestone: null
fix_attempts: 0
max_fix_attempts: ${maxFixAttempts}
test_cmd: null
lint_cmd: null
format_cmd: null
started_at: "${new Date().toISOString()}"
spec_source: "${specSource}"
worktree: ${!noWorktree}
no_pr: ${noPr}
ci_watch: ${ciWatch}
---

${spec}
`

  fs.writeFileSync(".claude/ucai-ship.local.md", content)

  // Output setup confirmation
  console.log(`Ucai ship pipeline activated.

Spec: ${spec}
Source: ${specSource}
Worktree: ${!noWorktree ? "yes (isolated)" : "no (working directory)"}
PR creation: ${noPr ? "disabled" : "enabled"}
CI watch: ${ciWatch ? "enabled" : "disabled"}
Max fix attempts: ${maxFixAttempts}

The pipeline will run autonomously through all phases.
The Stop hook will keep the session alive until completion.`)
}

// Tokenize a string respecting single and double quotes
function tokenize(str) {
  const tokens = []
  let current = ""
  let inSingle = false
  let inDouble = false

  for (let i = 0; i < str.length; i++) {
    const ch = str[i]
    const atBoundary = current === ""

    if (ch === "'" && !inDouble && (atBoundary || inSingle)) {
      inSingle = !inSingle
    } else if (ch === '"' && !inSingle && (atBoundary || inDouble)) {
      inDouble = !inDouble
    } else if (/\s/.test(ch) && !inSingle && !inDouble) {
      if (current) {
        tokens.push(current)
        current = ""
      }
    } else {
      current += ch
    }
  }
  if (current) tokens.push(current)
  return tokens
}

// Support --stdin mode
if (process.argv.includes("--stdin")) {
  let input = ""
  process.stdin.setEncoding("utf8")
  process.stdin.on("data", (chunk) => (input += chunk))
  process.stdin.on("end", () => {
    const args = tokenize(input.trim())
    main(args)
  })
} else {
  main(process.argv.slice(2))
}
