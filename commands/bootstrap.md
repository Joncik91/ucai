---
description: Scaffold test, lint, and CI infrastructure for projects that lack it
argument-hint: "[test|lint|ci|all]"
disable-model-invocation: true
---

# Bootstrap Project Infrastructure

You are helping a developer set up the foundational infrastructure that enables autonomous development workflows. Without tests, linting, and CI, there is no feedback loop — Claude cannot verify its own work.

## Core Principles

- **Minimal viable infrastructure**: Scaffold the simplest thing that works, not a complete CI/CD platform.
- **Real tests, not dummy tests**: The example test should test an actual function in the codebase.
- **Standard tools for the stack**: Use what the ecosystem expects (Vitest for JS, pytest for Python, etc.).
- **One approval gate**: Present the plan, get approval, then scaffold everything.

## Skill Loading

Before Phase 2, load relevant skills:
- `Skill(ucai:qa)` — for test framework selection and patterns
- `Skill(ucai:devops)` — for CI pipeline scaffolding

---

## Phase 1: Detect

**Goal**: Inventory what infrastructure exists and what is missing.

Scope: $ARGUMENTS (default: "all")

**Actions**:
1. Run infrastructure detection: `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/detect-infra.js")`
2. Parse the JSON output to understand:
   - Tech stack (language, framework, package manager)
   - Test framework (detected? which one? config file?)
   - Linter (detected? which one? config file?)
   - Formatter (detected? which one? config file?)
   - CI pipeline (detected? which platform? config file?)
3. If `$ARGUMENTS` specifies a scope (test, lint, ci), filter findings to only that scope
4. Present findings clearly:
   - "**Found**: [list what exists with tool names and config files]"
   - "**Missing**: [list what needs scaffolding]"
5. If nothing is missing: "Your project already has all infrastructure. You're ready for `/ship`." — stop here.

---

## Phase 2: Recommend

**Goal**: Propose the right tools for this stack.

**Actions**:
1. Based on the detected stack, recommend standard tools:

   **JavaScript/TypeScript**:
   - Test: Vitest (fast, ESM-native, compatible with Jest API)
   - Format: Prettier
   - Lint: ESLint (flat config)
   - CI: GitHub Actions

   **Python**:
   - Test: pytest
   - Format: Black or Ruff format
   - Lint: Ruff
   - CI: GitHub Actions

   **Go**:
   - Test: built-in `go test`
   - Format: `gofmt` (built-in)
   - Lint: `golangci-lint`
   - CI: GitHub Actions

   **Rust**:
   - Test: built-in `cargo test`
   - Format: `rustfmt` (built-in)
   - Lint: `clippy` (built-in)
   - CI: GitHub Actions

2. For test scaffolding, identify ONE real function in the codebase to write a test for. Not a dummy "1 + 1 = 2" test — find an actual utility, helper, or pure function.
3. For CI, propose a minimal workflow: install deps → run tests → run lint.
4. Present the full proposal with specific file paths and contents.

---

## Phase 3: Scaffold

**WAIT FOR USER APPROVAL before proceeding.**

**Goal**: Create the infrastructure files.

**Actions**:
1. Install dev dependencies:
   - JS: `npm install -D vitest` (or appropriate for package manager)
   - Python: `pip install pytest` (or add to dev dependencies)
   - Go/Rust: no install needed (built-in)
2. Create configuration files:
   - Test config (vitest.config.ts, pytest.ini, etc.)
   - Format config (.prettierrc, pyproject.toml [tool.black], etc.)
   - Lint config (eslint.config.js, pyproject.toml [tool.ruff], etc.)
3. Add scripts to package.json (or Makefile equivalent):
   - `"test"`: run test suite
   - `"lint"`: run linter
   - `"format"`: run formatter
4. Create ONE real example test file that tests an actual function from the codebase
5. Create CI workflow file (`.github/workflows/ci.yml` or equivalent)

---

## Phase 4: Verify

**Goal**: Confirm everything works.

**Actions**:
1. Run the test suite — must pass: `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/run-tests.js")`
2. Run the formatter — must pass
3. Run the linter — must pass
4. If any tool fails: fix the issue and retry
5. Report results:
   - "**Test command**: `npm test` — PASS"
   - "**Lint command**: `npm run lint` — PASS"
   - "**Format command**: `npm run format` — PASS"
   - "**CI config**: `.github/workflows/ci.yml` — created"
6. Conclude: "Your project is now ready for `/ship`."
