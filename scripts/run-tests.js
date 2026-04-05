#!/usr/bin/env node

// Ucai Test Runner
// Detects and runs the project's test command
// Outputs JSON with pass/fail status and summary

const { execFileSync } = require("child_process")
const fs = require("fs")
const path = require("path")

function detectTestCommand() {
  // Use detect-infra.js for detection
  const detectScript = path.resolve(__dirname, "detect-infra.js")
  try {
    const infraJson = execFileSync("node", [detectScript], {
      encoding: "utf8",
      timeout: 15000,
    })
    const infra = JSON.parse(infraJson)
    return infra.test
  } catch {
    return { detected: false, command: null, framework: null }
  }
}

function runCommand(command) {
  // Split command into executable and args for execFileSync
  // Handle common patterns: "npm test", "npx vitest run", "python -m pytest"
  const parts = command.split(/\s+/)
  const exe = parts[0]
  const args = parts.slice(1)

  return execFileSync(exe, args, {
    encoding: "utf8",
    timeout: 300000, // 5 minute timeout for tests
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env, CI: "true", FORCE_COLOR: "0" },
  })
}

function parseSummary(output, framework) {
  // Extract summary line from test output based on framework
  const lines = output.split("\n").filter((l) => l.trim())

  if (framework === "vitest" || framework === "jest") {
    const testLine = lines.find((l) => /Tests:\s+\d/.test(l) || /\d+ passed/.test(l))
    if (testLine) return testLine.trim()
  }

  if (framework === "pytest") {
    const resultLine = lines.find((l) => /\d+ passed/.test(l) || /FAILED/.test(l))
    if (resultLine) return resultLine.trim()
  }

  if (framework === "go-test") {
    const resultLines = lines.filter((l) => /^(ok|FAIL)\s/.test(l))
    if (resultLines.length > 0) return resultLines.join("; ")
  }

  if (framework === "cargo-test") {
    const resultLine = lines.find((l) => /test result:/.test(l))
    if (resultLine) return resultLine.trim()
  }

  if (framework === "rspec") {
    const resultLine = lines.find((l) => /\d+ examples?/.test(l))
    if (resultLine) return resultLine.trim()
  }

  // Generic fallback: last non-empty line
  return lines[lines.length - 1] || "No summary available"
}

function main() {
  const testInfo = detectTestCommand()

  if (!testInfo.detected) {
    const result = {
      passed: false,
      test_cmd: null,
      framework: null,
      output: "No test command detected. Run /bootstrap to scaffold test infrastructure.",
      summary: "No test framework found",
    }
    process.stdout.write(JSON.stringify(result, null, 2))
    process.exit(1)
  }

  let testOutput = ""
  let passed = false

  try {
    testOutput = runCommand(testInfo.command)
    passed = true
  } catch (err) {
    // Non-zero exit code means tests failed
    testOutput = (err.stdout || "") + "\n" + (err.stderr || "")
    passed = false
  }

  // Trim output to last 200 lines to avoid massive payloads
  const outputLines = testOutput.split("\n")
  const trimmedOutput =
    outputLines.length > 200
      ? "... (trimmed to last 200 lines)\n" + outputLines.slice(-200).join("\n")
      : testOutput

  const summary = parseSummary(testOutput, testInfo.framework)

  const result = {
    passed,
    test_cmd: testInfo.command,
    framework: testInfo.framework,
    output: trimmedOutput.trim(),
    summary,
  }

  process.stdout.write(JSON.stringify(result, null, 2))
  process.exit(passed ? 0 : 1)
}

main()
