#!/usr/bin/env node

// Ucai Infrastructure Detection
// Detects test, lint, format, and CI commands from project files
// Outputs JSON to stdout for use by /ship and /bootstrap

const fs = require("fs")
const path = require("path")

function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile()
  } catch {
    return false
  }
}

function dirExists(dirPath) {
  try {
    return fs.statSync(dirPath).isDirectory()
  } catch {
    return false
  }
}

function globExists(pattern) {
  // Simple glob check for common config patterns
  const dir = path.dirname(pattern)
  const base = path.basename(pattern)
  const targetDir = dir === "." ? process.cwd() : path.resolve(dir)

  try {
    const files = fs.readdirSync(targetDir)
    if (base.includes("*")) {
      const prefix = base.split("*")[0]
      return files.some((f) => f.startsWith(prefix))
    }
    return files.includes(base)
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

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8")
  } catch {
    return null
  }
}

function detectStack() {
  const stack = { language: null, framework: null, packageManager: null }

  if (fileExists("package.json")) {
    stack.language = "javascript"
    const pkg = readJson("package.json")
    if (pkg) {
      const allDeps = Object.keys({
        ...(pkg.dependencies || {}),
        ...(pkg.devDependencies || {}),
      })
      if (fileExists("tsconfig.json") || allDeps.some((d) => d === "typescript")) {
        stack.language = "typescript"
      }
      if (allDeps.includes("next")) stack.framework = "next"
      else if (allDeps.includes("nuxt")) stack.framework = "nuxt"
      else if (allDeps.includes("svelte")) stack.framework = "svelte"
      else if (allDeps.includes("react")) stack.framework = "react"
      else if (allDeps.includes("vue")) stack.framework = "vue"
      else if (allDeps.includes("express")) stack.framework = "express"
      else if (allDeps.includes("fastify")) stack.framework = "fastify"
    }
    if (fileExists("bun.lockb") || fileExists("bun.lock")) stack.packageManager = "bun"
    else if (fileExists("pnpm-lock.yaml")) stack.packageManager = "pnpm"
    else if (fileExists("yarn.lock")) stack.packageManager = "yarn"
    else stack.packageManager = "npm"
  } else if (fileExists("pyproject.toml") || fileExists("setup.py") || fileExists("requirements.txt")) {
    stack.language = "python"
    if (fileExists("pyproject.toml")) {
      const content = readFile("pyproject.toml")
      if (content && content.includes("django")) stack.framework = "django"
      else if (content && content.includes("fastapi")) stack.framework = "fastapi"
      else if (content && content.includes("flask")) stack.framework = "flask"
    }
  } else if (fileExists("go.mod")) {
    stack.language = "go"
  } else if (fileExists("Cargo.toml")) {
    stack.language = "rust"
  } else if (fileExists("Gemfile")) {
    stack.language = "ruby"
    stack.framework = "rails"
  } else if (fileExists("pom.xml") || fileExists("build.gradle") || fileExists("build.gradle.kts")) {
    stack.language = "java"
  } else if (fileExists("mix.exs")) {
    stack.language = "elixir"
  }

  return stack
}

function detectTestCommand(stack) {
  const result = { detected: false, command: null, framework: null, configFile: null }

  if (stack.language === "javascript" || stack.language === "typescript") {
    const pkg = readJson("package.json")
    const scripts = pkg?.scripts || {}
    const allDeps = Object.keys({
      ...(pkg?.dependencies || {}),
      ...(pkg?.devDependencies || {}),
    })

    // Check for test script in package.json
    if (scripts.test && scripts.test !== 'echo "Error: no test specified" && exit 1') {
      result.detected = true
      const runner = stack.packageManager === "bun" ? "bun" : stack.packageManager === "pnpm" ? "pnpm" : stack.packageManager === "yarn" ? "yarn" : "npm"
      result.command = runner + (runner === "npm" ? " test" : " run test")
    }

    // Detect specific framework
    if (globExists("vitest.config.*") || allDeps.includes("vitest")) {
      result.framework = "vitest"
      if (!result.detected) {
        result.detected = true
        result.command = "npx vitest run"
      }
      result.configFile = "vitest.config.*"
    } else if (globExists("jest.config.*") || allDeps.includes("jest")) {
      result.framework = "jest"
      if (!result.detected) {
        result.detected = true
        result.command = "npx jest"
      }
      result.configFile = "jest.config.*"
    } else if (globExists("playwright.config.*") || allDeps.includes("@playwright/test")) {
      result.framework = "playwright"
      result.configFile = "playwright.config.*"
    }
  } else if (stack.language === "python") {
    if (fileExists("pytest.ini") || fileExists("conftest.py")) {
      result.detected = true
      result.command = "python -m pytest"
      result.framework = "pytest"
      result.configFile = "pytest.ini"
    } else {
      const pyproject = readFile("pyproject.toml")
      if (pyproject && pyproject.includes("[tool.pytest")) {
        result.detected = true
        result.command = "python -m pytest"
        result.framework = "pytest"
        result.configFile = "pyproject.toml"
      }
    }
  } else if (stack.language === "go") {
    result.detected = true
    result.command = "go test ./..."
    result.framework = "go-test"
  } else if (stack.language === "rust") {
    result.detected = true
    result.command = "cargo test"
    result.framework = "cargo-test"
  } else if (stack.language === "ruby") {
    if (fileExists("Rakefile") || dirExists("spec")) {
      result.detected = true
      result.command = "bundle exec rspec"
      result.framework = "rspec"
    }
  } else if (stack.language === "elixir") {
    result.detected = true
    result.command = "mix test"
    result.framework = "exunit"
  }

  // Makefile fallback
  if (!result.detected && fileExists("Makefile")) {
    const makefile = readFile("Makefile")
    if (makefile && /^test\s*:/m.test(makefile)) {
      result.detected = true
      result.command = "make test"
      result.framework = "makefile"
    }
  }

  return result
}

function detectLintCommand(stack) {
  const result = { detected: false, command: null, tool: null, configFile: null }

  if (stack.language === "javascript" || stack.language === "typescript") {
    const pkg = readJson("package.json")
    const scripts = pkg?.scripts || {}
    const allDeps = Object.keys({
      ...(pkg?.dependencies || {}),
      ...(pkg?.devDependencies || {}),
    })

    if (scripts.lint) {
      result.detected = true
      const runner = stack.packageManager === "npm" ? "npm run" : stack.packageManager + " run"
      result.command = runner + " lint"
    }

    if (globExists(".eslintrc*") || allDeps.includes("eslint") || fileExists("eslint.config.js") || fileExists("eslint.config.mjs")) {
      result.tool = "eslint"
      result.configFile = ".eslintrc*"
      if (!result.detected) {
        result.detected = true
        result.command = "npx eslint . --fix"
      }
    }
  } else if (stack.language === "python") {
    const pyproject = readFile("pyproject.toml")
    if (pyproject && pyproject.includes("[tool.ruff")) {
      result.detected = true
      result.command = "python -m ruff check . --fix"
      result.tool = "ruff"
      result.configFile = "pyproject.toml"
    } else if (fileExists(".flake8") || (pyproject && pyproject.includes("[tool.flake8"))) {
      result.detected = true
      result.command = "python -m flake8 ."
      result.tool = "flake8"
    }
  } else if (stack.language === "go") {
    result.detected = true
    result.command = "golangci-lint run"
    result.tool = "golangci-lint"
    if (fileExists(".golangci.yml") || fileExists(".golangci.yaml")) {
      result.configFile = ".golangci.yml"
    }
  } else if (stack.language === "rust") {
    result.detected = true
    result.command = "cargo clippy -- -D warnings"
    result.tool = "clippy"
  }

  return result
}

function detectFormatCommand(stack) {
  const result = { detected: false, command: null, tool: null, configFile: null }

  if (stack.language === "javascript" || stack.language === "typescript") {
    const pkg = readJson("package.json")
    const scripts = pkg?.scripts || {}
    const allDeps = Object.keys({
      ...(pkg?.dependencies || {}),
      ...(pkg?.devDependencies || {}),
    })

    if (scripts.format) {
      result.detected = true
      const runner = stack.packageManager === "npm" ? "npm run" : stack.packageManager + " run"
      result.command = runner + " format"
    }

    if (globExists(".prettierrc*") || allDeps.includes("prettier") || fileExists("prettier.config.js") || fileExists("prettier.config.mjs")) {
      result.tool = "prettier"
      result.configFile = ".prettierrc*"
      if (!result.detected) {
        result.detected = true
        result.command = "npx prettier --write ."
      }
    }
  } else if (stack.language === "python") {
    const pyproject = readFile("pyproject.toml")
    if (pyproject && pyproject.includes("[tool.black")) {
      result.detected = true
      result.command = "python -m black ."
      result.tool = "black"
      result.configFile = "pyproject.toml"
    } else if (pyproject && pyproject.includes("[tool.ruff")) {
      result.detected = true
      result.command = "python -m ruff format ."
      result.tool = "ruff-format"
      result.configFile = "pyproject.toml"
    }
  } else if (stack.language === "go") {
    result.detected = true
    result.command = "gofmt -w ."
    result.tool = "gofmt"
  } else if (stack.language === "rust") {
    result.detected = true
    result.command = "cargo fmt"
    result.tool = "rustfmt"
    if (fileExists("rustfmt.toml")) result.configFile = "rustfmt.toml"
  }

  return result
}

function detectCI() {
  const result = { detected: false, platform: null, configFile: null }

  if (dirExists(".github/workflows")) {
    result.detected = true
    result.platform = "github-actions"
    result.configFile = ".github/workflows/"
  } else if (fileExists(".gitlab-ci.yml")) {
    result.detected = true
    result.platform = "gitlab-ci"
    result.configFile = ".gitlab-ci.yml"
  } else if (fileExists("Jenkinsfile")) {
    result.detected = true
    result.platform = "jenkins"
    result.configFile = "Jenkinsfile"
  } else if (fileExists(".circleci/config.yml")) {
    result.detected = true
    result.platform = "circleci"
    result.configFile = ".circleci/config.yml"
  } else if (fileExists("azure-pipelines.yml")) {
    result.detected = true
    result.platform = "azure-devops"
    result.configFile = "azure-pipelines.yml"
  }

  return result
}

function main() {
  const stack = detectStack()
  const test = detectTestCommand(stack)
  const lint = detectLintCommand(stack)
  const format = detectFormatCommand(stack)
  const ci = detectCI()

  const output = {
    stack,
    test,
    lint,
    format,
    ci,
    summary: {
      has_tests: test.detected,
      has_lint: lint.detected,
      has_format: format.detected,
      has_ci: ci.detected,
      missing: [],
    },
  }

  if (!test.detected) output.summary.missing.push("test")
  if (!lint.detected) output.summary.missing.push("lint")
  if (!format.detected) output.summary.missing.push("format")
  if (!ci.detected) output.summary.missing.push("ci")

  process.stdout.write(JSON.stringify(output, null, 2))
}

main()
