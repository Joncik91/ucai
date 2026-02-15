#!/usr/bin/env node

// Ucai Iterate Setup Script
// Creates state file for the /iterate loop

const fs = require("fs")
const path = require("path")

function parseArgs(args) {
  let maxIterations = 0
  let completionPromise = "null"
  const promptParts = []

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "-h":
      case "--help":
        console.log(`Ucai Iterate - Controlled autonomous iteration

USAGE:
  /iterate [TASK...] [OPTIONS]

ARGUMENTS:
  TASK...    Description of what to accomplish (can be multiple words)

OPTIONS:
  --max-iterations <n>           Maximum iterations before auto-stop (default: unlimited)
  --completion-promise '<text>'  Promise phrase that signals genuine completion
  -h, --help                     Show this help message

DESCRIPTION:
  Starts a controlled iteration loop using the native Stop hook.
  Each iteration sees your previous work in files and git history.
  The loop continues until the task is genuinely complete.

EXAMPLES:
  /iterate Build a REST API for user management --completion-promise 'All endpoints working and tested' --max-iterations 15
  /iterate Fix the authentication bug --max-iterations 5
  /iterate Refactor the database layer --completion-promise 'All tests passing'

STOPPING:
  - Reaches --max-iterations
  - You output <promise>YOUR_PHRASE</promise> when genuinely true
  - Use /cancel-iterate to stop manually`)
        process.exit(0)
        break
      case "--max-iterations":
        if (!args[i + 1] || !/^\d+$/.test(args[i + 1])) {
          console.error("Error: --max-iterations requires a positive integer")
          process.exit(1)
        }
        maxIterations = parseInt(args[++i], 10)
        break
      case "--completion-promise":
        if (!args[i + 1]) {
          console.error("Error: --completion-promise requires a text argument")
          process.exit(1)
        }
        completionPromise = args[++i]
        break
      default:
        promptParts.push(args[i])
    }
  }

  return { maxIterations, completionPromise, prompt: promptParts.join(" ") }
}

function main(args) {
  const { maxIterations, completionPromise, prompt } = parseArgs(args)

  if (!prompt) {
    console.error(
      "Error: No task provided. Usage: /iterate <task> [--max-iterations N] [--completion-promise TEXT]"
    )
    process.exit(1)
  }

  // Create state file
  fs.mkdirSync(".claude", { recursive: true })

  const promiseYaml =
    completionPromise !== "null" ? JSON.stringify(completionPromise) : "null"
  const content = `---
active: true
iteration: 1
max_iterations: ${maxIterations}
completion_promise: ${promiseYaml}
started_at: "${new Date().toISOString()}"
---

${prompt}
`

  fs.writeFileSync(".claude/ucai-iterate.local.md", content)

  // Output setup confirmation
  const maxDisplay = maxIterations > 0 ? maxIterations : "unlimited"
  const promiseDisplay =
    completionPromise !== "null"
      ? completionPromise
      : "none (use --max-iterations to limit)"

  console.log(`Ucai iterate loop activated.

Task: ${prompt}
Iteration: 1
Max iterations: ${maxDisplay}
Completion promise: ${promiseDisplay}

The Stop hook will feed this task back after each iteration.
Your previous work is visible in files and git history.`)

  if (completionPromise !== "null") {
    console.log(
      "\nTo complete: output <promise>" + completionPromise + "</promise>"
    )
    console.log("ONLY when the statement is genuinely true.")
  }
}

// Tokenize a string respecting single and double quotes
// Only enters quote mode at token boundaries so mid-word apostrophes (user's) stay literal
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

// Support --stdin mode: read arguments from stdin as a single string
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
