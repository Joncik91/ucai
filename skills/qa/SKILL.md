---
name: qa
description: This skill should be used when the user asks to "generate tests", "write unit tests", "analyze test coverage", "scaffold E2E tests", "set up Playwright", "configure Jest", "implement testing patterns", or "improve test quality".
---

# QA Engineer

Testing patterns, test design, coverage strategy, and quality automation for any language or framework.

---

## Step 1: Detect the Stack

Before writing tests, identify the language, framework, and test tooling:

| Signal | Test framework likely in use |
|--------|------------------------------|
| `vitest.config.*` or `vitest` in package.json | Vitest |
| `jest.config.*` or `jest` in package.json | Jest |
| `playwright.config.*` | Playwright (E2E) |
| `cypress.config.*` | Cypress (E2E) |
| `pytest.ini` / `pyproject.toml` `[tool.pytest.*]` | pytest |
| `*_test.go` files | Go test |
| `*_spec.rb` / `spec/` dir | RSpec |
| `*.test.cs` / `xunit.runner.json` | xUnit / NUnit |
| `*.spec.ts` with Angular | Jasmine + Karma or Jest |

Check: `cat package.json`, `ls -la`, `cat pytest.ini` — whichever applies. Also check existing test files to understand conventions.

---

## Step 2: Research Current Practices

Search for current testing patterns for the detected stack:

```
WebSearch: "<framework> unit testing best practices 2025"
WebSearch: "<test library> mocking patterns 2025"
WebSearch: "Playwright E2E testing patterns 2025"
WebSearch: "<framework> test coverage strategy 2025"
```

---

## Step 3: Universal Testing Principles

These apply regardless of language or test framework.

### Test Pyramid

- **Unit tests (70%)**: fast, isolated, test one thing; mock all dependencies
- **Integration tests (20%)**: test that components work together; use real dependencies where practical
- **E2E tests (10%)**: test critical user journeys against a real browser/API; keep them minimal and stable

### Test Isolation

- Each test is independent — no shared mutable state between tests
- Tests can run in any order and produce the same result
- Clean up after each test (reset DB, clear mocks, restore spies)
- Never depend on test execution order

### Naming Conventions

Use a consistent naming pattern that reads as documentation:

```
<unit>_<condition>_<expected result>

// OR

describe("UserService") {
  describe("createUser") {
    it("returns 409 when email already exists")
    it("hashes password before storing")
    it("sends welcome email on success")
  }
}
```

### What to Test

- **Happy path**: the normal, expected flow works
- **Edge cases**: empty input, max length, boundary values, null/undefined
- **Error paths**: what happens when a dependency fails, input is invalid, or permissions are denied
- **State transitions**: document the before/after state change
- Don't test implementation details — test observable behavior

### Mocking Strategy

- Mock at the boundary (I/O, network, time, randomness) — not inside your own code
- Prefer fakes (in-memory implementations) over mocks for complex dependencies
- Use spies to verify side effects, not to control return values
- Reset all mocks between tests

### Coverage

- Coverage measures what code was executed, not what was verified — don't optimize for the number
- Target: 80%+ line coverage as a floor, not a ceiling
- Prioritize coverage of: auth paths, payment flows, data mutations, error handling
- Untested code that matters > high coverage of trivial code

### Async Testing

- Always await async operations in tests — never fire-and-forget
- Use explicit timeouts for timing-sensitive tests; prefer polling over fixed waits
- For E2E: use `waitForSelector` / `waitForResponse` — never `sleep()`

### Flaky Test Prevention

- Never use `sleep()` / fixed delays — wait for conditions
- Avoid time-dependent assertions — mock the clock
- Isolate external services — use test doubles, not real APIs
- Clean up test data after each run

---

## Authorship Discipline

Tests in this project follow strict author/reviewer separation, mirroring the production-code pattern in `/build` Phase 6:

- **Tests are authored by an agent that did not write the production code under test.** The implementing agent spawns a subagent (via the `Task` tool) for test authorship; the implementer never writes test files. An author who also wrote the production code is structurally biased toward asserting on its own assumptions.
- **The author imports the production symbol directly and calls it.** Not a reimplementation, not a stub, not a hand-rolled fake — the actual exported function or class from the production module.
- **The author self-checks against the Anti-Gaming Verdicts below before returning.** A test that violates any blocking verdict is not a real test, regardless of whether it passes.

After authorship, a *different* agent reviews the tests (`ucai:reviewer` by default; escalates to `ucai:reviewer-opus` if the first review flags blocking verdicts and the author's retry still fails). The reviewer reads the tests + the production target + the verdicts list and flags any matches.

## Anti-Gaming Verdicts

Verdicts aligned with the Pragma test-gaming detector at `/home/joncik/apps/Pragma`. Apply both at authorship (self-check) and at review. Blocking verdicts mean the test does not count as written.

1. **Call the production target directly — not a mock of it.** No `mock.patch("module.func")` / `vi.mock("./module")` / `jest.mock("./module")` / `vi.spyOn(...).mockReturnValue(...)` on the symbol under test. (`mocked-away`)
2. **The production code's lines must execute when the test runs.** A test that "passes" without executing the target's body is an orphan, not a test. (`target_not_covered`, `orphan_test`)
3. **Never swallow the call under test.** No `try { call() } catch (_) {}` / `try: call() except: pass` that suppresses the signal. (`swallowed`)
4. **No tautological assertions.** `assert true`, `assert x == x`, `expect(true).toBe(true)`, `expect(x).toBe(x)` test nothing. (`tautological`)
5. **Assertions run unconditionally.** Every assertion lives at statement level, not nested inside `if`/`for`/`while` branches that may never execute. (`conditional`)
6. **Test name and body must agree.** A test named `*_rejects_*` / `*_throws_*` requires `pytest.raises` / `.toThrow()`, not silent pass. (`mismatched`, `stub_error_match`)
7. **No module-attribute reassignment, `sys.modules` swap, or `monkeypatch.setattr` on the symbol under test.** Inline class redefinitions that shadow the production symbol fall under the same rule. (`module_attr_reassignment`, `module_shimmed`, `monkeypatched`)
8. **No skip markers smuggled to hide stub behavior.** No `pytest.skip(...)`, `@pytest.mark.xfail(strict=True)`, `it.skip`, `it.todo`, `test.failing` that lets a fake test ship green. (`skipped`, `xfail_gaming`)
9. **The test file must contain at least one real assertion on the production target's actual return value or raised exception type.** A file that imports the target but only asserts on locally-defined fakes is an orphan file. (`no_success_assertion`)
10. **Assertions validate behavior, not the test's own mock setup.** A test that calls the production function but asserts on what its mocked dependency returned (instead of what the target produced) is semantically gaming. (`semantic_gaming`)

If the project has Pragma installed, its `Edit|Write|MultiEdit` hooks enforce verdicts 1, 3-8, and parts of 9 at the tool-call layer automatically — this checklist still applies as the soft prescription.

## Review Checklist

Before any test PR:

- [ ] Tests are isolated — no shared mutable state
- [ ] Each test has one clear assertion or outcome
- [ ] Test names describe behavior, not implementation
- [ ] No `sleep()` / fixed delays
- [ ] Mocks reset between tests
- [ ] Error paths tested alongside happy paths
- [ ] Async operations properly awaited
- [ ] Tests pass in isolation and as a suite
- [ ] Coverage added for new code paths
- [ ] No test skipped without explanation
