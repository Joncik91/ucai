#!/usr/bin/env node

// Ucai PostToolUse Format Handler
// Auto-formats files after Write/Edit operations
// Detects project formatter, caches result, runs silently
// Never blocks on failure — formatting is best-effort

const fs = require("fs")
const path = require("path")
const { execFileSync } = require("child_process")

const CACHE_FILE = ".claude/ucai-formatter-cache.local.json"

function readCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"))
  } catch {
    return null
  }
}

function writeCache(data) {
  try {
    fs.mkdirSync(".claude", { recursive: true })
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data))
  } catch {
    // Cache write failure is not critical
  }
}

function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile()
  } catch {
    return false
  }
}

function globExists(pattern) {
  const dir = path.dirname(pattern)
  const base = path.basename(pattern)
  const targetDir = dir === "." ? process.cwd() : path.resolve(dir)
  try {
    const files = fs.readdirSync(targetDir)
    const prefix = base.split("*")[0]
    return files.some((f) => f.startsWith(prefix))
  } catch {
    return false
  }
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"))
  } catch {
    return null
  }
}

function detectFormatter() {
  // Check cache first
  const cached = readCache()
  if (cached) return cached

  const result = { detected: false, exe: null, args: null, extensions: [] }

  // JavaScript/TypeScript projects
  if (fileExists("package.json")) {
    const pkg = readJson("package.json")
    const allDeps = Object.keys({
      ...(pkg?.dependencies || {}),
      ...(pkg?.devDependencies || {}),
    })

    if (globExists(".prettierrc*") || allDeps.includes("prettier") || fileExists("prettier.config.js") || fileExists("prettier.config.mjs")) {
      result.detected = true
      result.exe = "npx"
      result.args = ["prettier", "--write"]
      result.extensions = [".js", ".jsx", ".ts", ".tsx", ".css", ".scss", ".json", ".md", ".html", ".vue", ".svelte"]
      writeCache(result)
      return result
    }
  }

  // Python projects
  if (fileExists("pyproject.toml")) {
    const content = fs.readFileSync("pyproject.toml", "utf8")
    if (content.includes("[tool.black")) {
      result.detected = true
      result.exe = "python3"
      result.args = ["-m", "black"]
      result.extensions = [".py"]
      writeCache(result)
      return result
    }
    if (content.includes("[tool.ruff")) {
      result.detected = true
      result.exe = "python3"
      result.args = ["-m", "ruff", "format"]
      result.extensions = [".py"]
      writeCache(result)
      return result
    }
  }

  // Go projects
  if (fileExists("go.mod")) {
    result.detected = true
    result.exe = "gofmt"
    result.args = ["-w"]
    result.extensions = [".go"]
    writeCache(result)
    return result
  }

  // Rust projects
  if (fileExists("Cargo.toml")) {
    result.detected = true
    result.exe = "rustfmt"
    result.args = []
    result.extensions = [".rs"]
    writeCache(result)
    return result
  }

  // No formatter found — cache the negative result too
  writeCache(result)
  return result
}

function formatFile(filePath, formatter) {
  const ext = path.extname(filePath)

  // Only format files with matching extensions
  if (formatter.extensions.length > 0 && !formatter.extensions.includes(ext)) {
    return
  }

  try {
    execFileSync(formatter.exe, [...formatter.args, filePath], {
      timeout: 10000,
      stdio: ["pipe", "pipe", "pipe"],
    })
  } catch {
    // Formatter failure is never critical — log and continue
    console.error("Ucai format: Failed to format " + filePath)
  }
}

// Main: read hook input from stdin
let input = ""
process.stdin.setEncoding("utf8")
process.stdin.on("data", (chunk) => (input += chunk))
process.stdin.on("end", () => {
  try {
    const hookData = JSON.parse(input)
    const toolInput = hookData.tool_input || {}
    const filePath = toolInput.file_path

    if (!filePath) {
      process.exit(0)
    }

    const formatter = detectFormatter()
    if (!formatter.detected) {
      process.exit(0)
    }

    formatFile(filePath, formatter)
  } catch {
    // Silent failure — never block on format errors
  }

  process.exit(0)
})
