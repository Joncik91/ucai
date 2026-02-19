# UI Design System & Visual Overhaul Guide

Opinionated design system for building distinctive, human-quality frontends. Use this when performing visual overhauls or building new UIs from scratch.

**Core principle**: Actively avoid the "AI slop" aesthetic — generic, on-distribution outputs that all look the same. Every design decision must be intentional.

---

## Before Writing Any Code

Leave a comment at the top of the main CSS/style section that states:
1. The fonts you chose and why
2. The primary accent color you chose and why
3. One sentence describing the overall aesthetic direction

---

## Typography

Typography instantly signals quality. It is the single highest-leverage design decision.

### Banned Fonts

NEVER use: Inter, Roboto, Arial, Open Sans, Lato, system-ui, default system fonts, Space Grotesk (overused by AI). If they exist in the current codebase, replace them.

### Distinctive Font Choices (Google Fonts)

| Mood | Options |
|------|---------|
| Editorial / authority | Newsreader, Literata, Crimson Pro, Fraunces, Playfair Display, Lora |
| Startup / modern | Bricolage Grotesque, Cabinet Grotesk, Satoshi, General Sans, Outfit, Manrope |
| Technical / precise | IBM Plex Sans, IBM Plex Mono, Source Serif 4, JetBrains Mono |
| Warm / human | DM Serif Display + DM Sans, Syne + Source Sans 3 |

### Pairing Rules

- Always pair a display/heading font with a contrasting body font (serif + sans, geometric + humanist)
- Use extreme weight contrast: 200/300 for body, 800/900 for headings. Never 400 vs 600 — that's invisible
- Size jumps should be dramatic: 3x minimum between body text and hero headings
- Body text for reading-heavy interfaces: minimum 17px, line-height 1.6-1.75, max-width 680px

---

## Color & Theme

Commit fully to a cohesive palette. Use CSS custom properties for every color.

### Rules

- Define all colors in `:root` as CSS variables. Never use hardcoded hex values in component styles
- Choose ONE dominant accent color and use it sparingly — only for primary actions, active states, and key highlights
- Text hierarchy through color weight: primary text at full contrast, secondary at 60%, tertiary at 40%

### What to Avoid

- Purple gradients on white backgrounds (the most clichéd AI aesthetic)
- Evenly-distributed rainbow palettes. Dominant + sharp accent outperforms timid distribution
- Purple anywhere unless explicitly part of the brand
- Gradients as primary backgrounds (use flat warm tones, reserve gradients for small accents)
- Generic color schemes you've seen in other AI-generated interfaces

### Inspiration Sources

Draw from: IDE themes (Dracula, Nord, Catppuccin, Gruvbox), editorial design, architectural photography, ceramic glazes, vintage posters.

### Multi-Mode Theming

If the app has distinct modes (e.g. admin vs user, editing vs viewing), consider using different theme temperatures for each — dark/warm for one, light/cool for the other. Two moods, one product.

---

## Motion & Animation

Philosophy: Motion should feel purposeful, not decorative.

### Page Load

One well-orchestrated staggered reveal with `animation-delay` increments of 80-120ms. Content appears in reading order. This single moment creates more delight than scattered micro-interactions.

### Hover States

Subtle and consistent. `translateY(-2px)` + shadow expansion for cards. Background color shift for buttons. Nothing more.

### Transitions

- 200-400ms, `ease-out` or `cubic-bezier(0.4, 0, 0.2, 1)`. Never linear. Never bouncy unless the brand is explicitly playful
- Smooth height/opacity transitions for expanding content. No instant show/hide

### Implementation

- Prioritize CSS-only animations. Use `@keyframes` and `transition` properties. No JS animation libraries unless absolutely necessary
- Respect `prefers-reduced-motion`: disable animations, keep transitions to opacity only

### Never Use

Parallax scrolling, particle effects, 3D card flips, morphing blob backgrounds, typing animations, or anything that screams "look at my CSS".

---

## Backgrounds & Depth

Create atmosphere. Never default to flat solid colors.

### Techniques

- Use subtle CSS noise/grain textures for depth (background-image with tiny repeating SVG patterns or CSS gradients)
- Layer radial gradients at low opacity for warm ambient backgrounds
- Use subtle box-shadows that feel like real light: `0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)` — not heavy drop shadows

### Background Colors

| Context | Use | Avoid |
|---------|-----|-------|
| Light backgrounds | Off-white (`#FAF8F5`, `#F5F1EB`) | Pure white (`#FFFFFF`) |
| Dark backgrounds | Near-black (`#1C1917`, `#0f0f0f`) | Pure black (`#000000`) |

---

## Layout & Spatial Composition

- Use generous whitespace. When in doubt, add more space. 48px minimum between major sections
- Cards should feel like physical objects: subtle borders, 12-16px border-radius, generous internal padding (24-32px)
- Don't center everything. Asymmetric layouts feel more designed. Consider sidebar + main content patterns
- Max content width for readability: 680px for text, 1200px for dashboards
- Mobile: test all touch targets at 48px minimum. Maintain spatial generosity — don't cram things together just because the screen is smaller

---

## Component Standards

### Navigation

- Minimal. If it doesn't need to be visible, hide it behind interaction
- Active state should feel distinct without being loud — accent-colored indicator bar or text color shift, not a background fill
- Use tooltips over labels where icons are clear enough

### Cards

- Hover: lift (`translateY -2px`) + soft shadow expansion. Nothing more
- Never use heavy borders. Use shadow or subtle 1px borders at low opacity
- Content spacing inside cards: 16-24px padding minimum

### Buttons

| Type | Style |
|------|-------|
| Primary | Filled with accent color, 8-12px border-radius (NOT pill-shaped / rounded-full unless the brand demands it) |
| Secondary | Bordered, transparent background |
| Ghost | Text only, no border, subtle hover background |

All buttons: clear hover and focus states. Never remove focus outlines.

### Forms

- Input fields: generous height (44-48px), clear focus state with accent color ring
- Labels above inputs, never floating/inside
- Error states: warm, specific copy. Never "Invalid input"

### Tables / Lists

- Alternate row backgrounds with very subtle tone shifts, not gray zebra stripes
- Row hover: subtle background shift
- Sort controls: minimal, in the header

### Empty States

- Never show sad faces, generic illustrations, or "No data found"
- Use a single typographic statement in the display font with a clear action below

### Loading States

- Skeleton screens that match the shape of the content they replace, with a subtle shimmer animation
- Never use spinners

### Error States

- Warm, human copy. Never technical error codes visible to users
- "Something went wrong on our end" > "Error 500"

---

## Micro-Details

- Set `::selection` color to match accent at 20% opacity
- Cursor: pointer only on truly interactive elements
- Scrollbars: style them thin on dark themes (webkit-scrollbar)
- Favicon: generate an SVG favicon if one doesn't exist
- Focus states: visible 2px offset outline in accent color. NEVER remove focus outlines
- Border-radius consistency: pick one radius (8px, 12px, or 16px) and use it everywhere. Don't mix

---

## Accessibility

- All color contrast must meet WCAG AA (4.5:1 body text, 3:1 large text)
- Don't rely on color alone for status — pair with icons or text labels
- Proper heading hierarchy (h1 → h2 → h3, no skips)
- All interactive elements keyboard navigable
- ARIA labels on non-obvious interactive elements
- Respect `prefers-reduced-motion` and `prefers-color-scheme`

---

## What NOT to Do

- No purple anywhere unless explicitly part of the brand
- No gradients as primary backgrounds
- No emoji as icons in the UI
- No "Powered by AI" badges or sparkle icons
- No shadows heavier than `0 4px 24px rgba(0,0,0,0.08)` in light mode
- No placeholder SVG illustrations
- No cookie-cutter SaaS patterns: hero with laptop mockup, three-column feature grid, testimonial carousel
- No Inter. No Roboto. No system-ui
- No rounded-full / pill-shaped buttons unless the brand is explicitly playful
- No generic color schemes you've seen in other AI-generated interfaces

---

## Final Verification Checklist

After completing any visual overhaul, verify:

1. Does every page feel cohesive — same fonts, same palette, same spacing rhythm?
2. Is there ONE moment of visual delight on page load (the staggered animation)?
3. Would someone look at this and say "a designer made this" rather than "an AI made this"?
4. Does the reading experience prioritize content over chrome?
5. Is it accessible — keyboard navigable, proper contrast, screen reader compatible?

If the answer to any of these is no, fix it before calling it done.
