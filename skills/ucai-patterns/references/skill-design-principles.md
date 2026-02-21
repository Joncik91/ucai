# Skill and Command Design Principles

When writing discipline-enforcing content in UCAI skills and commands (gates, mandatory
steps, Red Flags tables), use these principles deliberately. Based on empirical LLM
persuasion research showing compliance increases from 33% → 72% with the right techniques
(Meincke et al., 2025, N=28,000 conversations).

---

## Principles by Content Type

| Content Type | Use | Avoid |
|--------------|-----|-------|
| Discipline-enforcing (gates, HARD-GATE, Red Flags) | Authority + Commitment + Social Proof | **Liking**, Reciprocity |
| Guidance / technique skills | Moderate Authority + Unity | Liking |
| Collaborative workflows | Unity + Commitment | — |
| Reference documentation | Clarity only | All persuasion techniques |

---

## The Five Principles

### Authority
Use absolute language for non-negotiable rules.

```
✅ "You MUST load a skill before Phase 2. This is not optional."
✅ "NEVER write to config files without reading them first."
❌ "You should probably load a skill before Phase 2."
```

### Commitment
Require explicit acknowledgment before proceeding. Announcements and TodoWrite create commitment.

```
✅ "State which skill(s) you loaded and why."
✅ "Create a todo list with all phases before starting."
❌ "Feel free to track progress if you like."
```

### Social Proof
Frame rules as universal practice, not exceptions.

```
✅ "Every build starts with skill loading. No build skips it."
✅ "Agents always run in parallel. Serial spawning is never correct."
❌ "In most cases, you should load a skill."
```

### Scarcity
Attach timing constraints to prevent procrastination.

```
✅ "Before Phase 2, you MUST identify and load relevant skills."
✅ "Do this now — not after exploring, not after clarifying."
❌ "At some point you should load the relevant skills."
```

### Unity
Frame as shared goals in collaborative sections.

```
✅ "We keep config files protected so no session breaks the plugin."
✅ "Our codebase conventions make the iterate loop reliable."
❌ "You are required to follow the conventions."
```

---

## Never Use

**Liking**: Phrases like "I appreciate your effort", "This is a great approach" inside
skill instructions. Creates sycophancy — Claude validates the suggestion instead of
evaluating it.

**Reciprocity**: "Since you've done X, now do Y." Introduces transaction framing where
compliance should be unconditional.

---

## Implementation Intentions

"When X, do Y" formulations are more effective than "generally do Y":

```
✅ "When you identify ambiguity in Phase 3, present it as a numbered list and wait."
✅ "When a reviewer suggests adding X, run the YAGNI gate before responding."
❌ "Generally, present ambiguities to the user."
```

The "When X" framing reduces cognitive load — Claude does not need to decide whether
the rule applies. It triggers automatically on the condition.

---

## Gate Function Pattern

For anti-patterns where Claude must check before acting, write a gate as pseudocode:

```
Gate: [Decision question]
→ Condition A → Action A
→ Condition B → Action B
```

Gates are more effective than prose descriptions because they are executable.
Claude reads them as instructions, not suggestions.
