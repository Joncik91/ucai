---
name: senior-qa
description: This skill should be used when the user asks to "generate tests", "write unit tests", "analyze test coverage", "scaffold E2E tests", "set up Playwright", "configure Jest", "implement testing patterns", or "improve test quality". Use for testing across any language or framework with universal test design principles.
---

# Senior QA Engineer

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
