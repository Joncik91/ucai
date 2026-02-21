  name: senior-frontend
  description: Frontend development and design skill for building distinctive, production-grade interfaces. Use when building React components, optimizing performance, analyzing bundle sizes,
  scaffolding projects, implementing accessibility, reviewing frontend code quality, performing visual overhauls, or designing UI/UX systems. Generates creative, polished code that avoids generic AI
   aesthetics.
  ---

  # Senior Frontend Engineer

  Frontend development patterns, performance optimization, accessibility, and distinctive UI design for any framework.

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

  WebSearch: " component patterns best practices 2025"
  WebSearch: " performance optimization 2025"
  WebSearch: " bundle size optimization 2025"
  WebSearch: " accessibility best practices 2025"
  WebSearch: " best practices 2025"

  ---

  ## Step 3: Design Thinking

  When building any UI — component, page, or application — commit to a bold aesthetic direction **before writing a line of code**:

  - **Purpose**: What problem does this interface solve? Who uses it?
  - **Tone**: Pick an extreme and own it. Brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art
  deco/geometric, soft/pastel, industrial/utilitarian — commit to one direction and execute it with precision.
  - **Differentiation**: What makes this unforgettable? What is the one thing someone will remember?
  - **Constraints**: Framework, performance budget, accessibility requirements.

  **The goal is intentionality, not intensity.** Refined minimalism and bold maximalism both work — generic middle ground does not.

  ### Typography

  Choose fonts that are beautiful, unique, and characterful. Pair a distinctive display font with a refined body font.

  - **Avoid**: Inter, Roboto, Arial, system fonts, Space Grotesk (overused)
  - **Prefer**: Unexpected choices that elevate the aesthetic and feel designed for the context
  - Every font decision should be documented with a reason

  ### Color and Theme

  Commit to a cohesive aesthetic. Use CSS variables for consistency.

  - Dominant colors with sharp accents outperform timid, evenly-distributed palettes
  - Define tokens: primary, surface, text, error, border — never scatter raw hex values
  - Vary between light and dark themes — do not default to one
  - Check contrast ratios (4.5:1 for body text, 3:1 for large text)

  ### Motion

  Use animation for effects and micro-interactions. Prioritize CSS-only for HTML; Motion library for React when available.

  - One well-orchestrated page load with staggered reveals creates more delight than scattered micro-interactions
  - Use scroll-triggering and hover states that surprise
  - Match animation complexity to the aesthetic vision — maximalist designs need elaborate motion, refined designs need restraint

  ### Spatial Composition

  - Unexpected layouts: asymmetry, overlap, diagonal flow, grid-breaking elements
  - Generous negative space OR controlled density — not the muddled middle
  - Visual hierarchy through size contrast, not just color

  ### Backgrounds and Visual Details

  Create atmosphere and depth rather than defaulting to solid colors:

  - Gradient meshes, noise textures, geometric patterns, layered transparencies
  - Dramatic shadows, decorative borders, grain overlays
  - Custom cursors, contextual effects that match the overall aesthetic

  ### Aesthetic Anti-Patterns

  Never use generic AI-generated aesthetics:

  - Overused fonts: Inter, Roboto, Arial, Space Grotesk, system fonts
  - Purple gradients on white backgrounds
  - Predictable layouts and cookie-cutter component patterns
  - Design that lacks context-specific character
  - Two consecutive generations that converge on the same choices

  ---

  ## Step 4: Universal Frontend Principles

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
  - **Image optimization**: use the framework image component or `<picture>` + `srcset`; never serve 2x the display size
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
  - **Server state vs client state**: use a data-fetching library for server state (TanStack Query, SWR, Apollo) — do not store it in global store
  - **Derived state**: compute from source of truth — do not sync two pieces of state
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

  ---

  ## Review Checklist

  Before any frontend PR:

  - [ ] Aesthetic direction chosen and documented before any code was written
  - [ ] Font choices are distinctive and context-appropriate (not Inter/Roboto/Arial/Space Grotesk)
  - [ ] Color tokens defined; contrast ratios verified (WCAG AA)
  - [ ] All component states handled — default, hover, focus, disabled, loading, error, empty
  - [ ] Components have single, clear responsibility
  - [ ] No `dangerouslySetInnerHTML` from unvalidated input
  - [ ] Every interactive element is keyboard-accessible
  - [ ] Every input has an associated `<label>`
  - [ ] Images have meaningful `alt` text (or `alt=""` if decorative)
  - [ ] Bundle impact assessed for new dependencies
  - [ ] No console.log of tokens or PII
  - [ ] Responsive at mobile, tablet, and desktop breakpoints