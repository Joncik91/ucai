---
name: senior-frontend
description: Frontend development skill for React, Next.js, TypeScript, and Tailwind CSS applications. Use when building React components, optimizing Next.js performance, analyzing bundle sizes, scaffolding frontend projects, implementing accessibility, reviewing frontend code quality, performing visual overhauls, or designing UI/UX systems.
---

# Senior Frontend Engineer

Frontend development patterns, performance optimization, accessibility, and UI design systems for any framework.

---

## Step 1: Detect the Stack

Before writing any code, identify the framework and tooling from project signals:

| Signal file / pattern | Stack |
|----------------------|-------|
| `next.config.*` | Next.js (React) |
| `nuxt.config.*` | Nuxt (Vue) |
| `svelte.config.*` | SvelteKit |
| `astro.config.*` | Astro |
| `remix.config.*` / `@remix-run` in package.json | Remix (React) |
| `angular.json` | Angular |
| `vite.config.*` + React | Vite + React |
| `vite.config.*` + Vue | Vite + Vue |
| `tailwind.config.*` | Tailwind CSS |
| `styled-components` / `emotion` in package.json | CSS-in-JS |

Check: `cat package.json`, `ls -la`, `cat vite.config.*` — whichever applies.

---

## Step 2: Research Current Practices

Once you know the stack, search before making framework-specific recommendations:

```
WebSearch: "<framework> component patterns best practices 2025"
WebSearch: "<framework> performance optimization 2025"
WebSearch: "<framework> bundle size optimization 2025"
WebSearch: "<framework> accessibility best practices 2025"
WebSearch: "<css approach> best practices 2025"
```

---

## Step 3: Universal Frontend Principles

These apply regardless of framework.

### Component Design

- **Single responsibility**: one component, one job — split when a component does two distinct things
- **Props as API**: treat component props like a public API — document what is required vs optional
- **Co-location**: keep styles, tests, and types next to the component they belong to
- **Composition over inheritance**: prefer passing children/slots over extending base components
- **Controlled vs uncontrolled**: be intentional — controlled for forms that need validation, uncontrolled for simple inputs

### Performance

- **Render budget**: components should render in under 16ms for 60fps; profile before optimizing
- **Lazy loading**: code-split at route boundaries; defer below-fold components
- **Image optimization**: use the framework's image component or `<picture>` + `srcset`; never serve 2x the display size
- **Memoization**: only add when profiling shows a problem — premature memoization adds complexity for no gain
- **Bundle analysis**: regularly audit bundle size; flag dependencies over 50kb that can be replaced or lazy-loaded

### Accessibility (a11y)

- **Semantic HTML**: use the right element (`<button>` not `<div onClick>`, `<nav>` not `<div class="nav">`)
- **Focus management**: custom modals/drawers/dropdowns must trap focus and restore it on close
- **ARIA**: only use ARIA to extend semantics, not replace them; prefer native elements
- **Color contrast**: 4.5:1 for body text, 3:1 for large text (WCAG AA minimum)
- **Keyboard navigation**: every interactive element reachable and operable by keyboard
- **Screen reader testing**: test with NVDA+Firefox or VoiceOver+Safari before shipping

### State Management

- **Locality first**: co-locate state with the component that owns it; lift only when needed
- **Server state vs client state**: use a data-fetching library for server state (TanStack Query, SWR, Apollo) — don't store it in global store
- **Derived state**: compute from source of truth — don't sync two pieces of state
- **Global store**: only for genuinely cross-cutting state (auth user, theme, feature flags)

### Forms

- **Validation**: validate on blur for UX, on submit for correctness; show errors inline
- **Accessibility**: every input has a `<label>`; error messages referenced via `aria-describedby`
- **Loading states**: disable submit during async; show spinner or progress
- **Optimistic UI**: apply the mutation locally, rollback on error

### Security

- **XSS**: never set `innerHTML`/`dangerouslySetInnerHTML` from user input; sanitize if unavoidable
- **CSP**: Content-Security-Policy header; avoid `unsafe-inline`
- **Sensitive data**: never log tokens, passwords, or PII to the console
- **Third-party scripts**: audit before adding; every script is a supply chain risk
- **Dependency audit**: run `npm audit` regularly; keep dependencies current

### UI Design

Before writing any styles, decide:

1. **Typography**: choose a font pairing and document why
2. **Color palette**: define primary, surface, text, error tokens; check contrast ratios
3. **Spacing scale**: use a consistent scale (4/8/16/24/32/48/64px); avoid magic numbers
4. **Component states**: design all states — default, hover, focus, disabled, loading, error, empty

---

## Review Checklist

Before any frontend PR:

- [ ] Components have single, clear responsibility
- [ ] No `dangerouslySetInnerHTML` from unvalidated input
- [ ] Every interactive element is keyboard-accessible
- [ ] Every input has an associated `<label>`
- [ ] Images have meaningful `alt` text (or `alt=""` if decorative)
- [ ] Loading, error, and empty states are handled
- [ ] Bundle impact assessed for new dependencies
- [ ] No console.log of tokens or PII
- [ ] Color contrast meets WCAG AA
- [ ] Responsive at mobile, tablet, and desktop breakpoints
