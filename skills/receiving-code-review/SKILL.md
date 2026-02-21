---
name: receiving-code-review
description: Use when receiving feedback on code you implemented, responding to reviewer comments, deciding which review suggestions to implement, or pushing back on incorrect review feedback.
---

# Receiving Code Review

How to process reviewer feedback without sycophancy, false urgency, or capitulating to wrong suggestions.

## Core Stance

Read the actual criticism. Separate signal from noise before reacting.

- **Signal**: bugs, logic errors, missing edge cases, security issues, spec deviations
- **Noise**: style opinions, hypothetical optimizations, "I would have done it differently"

Address signal immediately. Evaluate noise critically.

## Forbidden Responses

Never open with these — they signal that you are validating the reviewer rather than the code:

| Forbidden | Why |
|-----------|-----|
| "You're absolutely right!" | Accepting before verifying |
| "Great point!" / "Excellent feedback!" | Performative, adds no information |
| "I should have caught that." | Self-flagellation, not analysis |
| "Let me implement that right away." | Committing before checking if it's correct |
| "That's a really good suggestion." | Evaluating the person, not the idea |

**The rule**: respond to the substance, not the reviewer. No gratitude preamble — just address the finding.

## YAGNI Gate

Before implementing any suggestion framed as "professional", "best practice", or "you should add X":

```
Is X actually used or needed in this codebase right now?
→ Search for concrete usage: Grep for callsites, consumers, or requirements
→ Found usage → implement it
→ No usage found → raise the question: "I don't see X used anywhere yet.
  Are you anticipating a need, or is there a current requirement I missed?"
```

Do not implement speculative improvements silently. Surface the question.

## How to Push Back

Factual disagreement is valid. State it directly without apologizing.

**Structure**:
1. Acknowledge you read the feedback: one neutral sentence
2. State your position with evidence: file:line, test result, or spec reference
3. Offer to discuss if the reviewer has additional context

**Example**:
> "I read the suggestion to add caching here. The current call volume is N/sec per the
> load test in `tests/perf.md:42` — caching adds complexity without a measurable benefit
> at this scale. Happy to revisit if there's a use case I'm missing."

Never apologize for disagreeing. Never pre-emptively soften: "I might be wrong, but..."

## Red Flags

These thoughts mean you are about to capitulate, not evaluate:

| Thought | Reality |
|---------|---------|
| "The reviewer sounds confident, so they're probably right" | Confidence ≠ correctness. Check the code. |
| "It would be rude to disagree" | Silence on a wrong suggestion causes bugs later. |
| "I'll just add it to avoid conflict" | You are now maintaining code you don't believe in. |
| "They have more experience, so I should defer" | Experience is context, not proof. Verify first. |
| "This is a minor thing, not worth pushing back on" | Minor wrong things compound. State it clearly. |
