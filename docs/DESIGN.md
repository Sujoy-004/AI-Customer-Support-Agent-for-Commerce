---
version: alpha
name: OpenCode-design-analysis
description: |
  A terminal-native marketing system rendered entirely in Berkeley Mono — every word on the page, from the hero headline down to the footer fine print, is monospaced. The page itself reads like a manpage or a static-site README: warm cream canvas (`#fdfcfc`), nearly-black ink (`#201d1d`), 4px-radius rectangles for the few interactive elements, and bracketed `[+]`/`[-]` ASCII markers used as bullets. The brand's only "visual moment" is a single dark hero card that mocks up the OpenCode TUI itself — black background, monospaced terminal output, ASCII pipe characters, and a wordmark rendered as block-pixel ASCII. Every section sits as a hairline-bordered text block on the cream canvas with no shadows, no gradients, no decorative imagery, and no non-monospaced character anywhere in the system.

colors:
  primary: "#201d1d"; on-primary: "#fdfcfc"; ink: "#201d1d"; ink-deep: "#0f0000"
  charcoal: "#302c2c"; body: "#424245"; mute: "#646262"; stone: "#6e6e73"; ash: "#9a9898"
  canvas: "#fdfcfc"; surface-soft: "#f8f7f7"; surface-card: "#f1eeee"
  surface-dark: "#201d1d"; surface-dark-elevated: "#302c2c"
  hairline: "rgba(15,0,0,0.12)"; hairline-strong: "#646262"
  on-dark: "#fdfcfc"; on-dark-mute: "#9a9898"
  accent: "#007aff"; accent-hover: "#0056b3"; accent-active: "#004085"
  warning: "#ff9f0a"; warning-hover: "#cc7f08"; warning-active: "#995f06"
  danger: "#ff3b30"; danger-hover: "#d70015"; danger-active: "#a50011"
  success: "#30d158"

typography:
  display-xl: { fontFamily: Berkeley Mono, fontSize: 38px, fontWeight: 700, lineHeight: 1.5, letterSpacing: 0 }
  heading-md: { fontFamily: Berkeley Mono, fontSize: 16px, fontWeight: 700, lineHeight: 1.5, letterSpacing: 0 }
  body-md: { fontFamily: Berkeley Mono, fontSize: 16px, fontWeight: 400, lineHeight: 1.5, letterSpacing: 0 }
  body-strong: { fontFamily: Berkeley Mono, fontSize: 16px, fontWeight: 500, lineHeight: 1.5, letterSpacing: 0 }
  body-tight: { fontFamily: Berkeley Mono, fontSize: 16px, fontWeight: 500, lineHeight: 1, letterSpacing: 0 }
  link-md: { fontFamily: Berkeley Mono, fontSize: 16px, fontWeight: 400, lineHeight: 1.5, letterSpacing: 0 }
  button-md: { fontFamily: Berkeley Mono, fontSize: 16px, fontWeight: 500, lineHeight: 2, letterSpacing: 0 }
  caption-md: { fontFamily: Berkeley Mono, fontSize: 14px, fontWeight: 400, lineHeight: 2, letterSpacing: 0 }

rounded: { none: 0px, sm: 4px, full: 9999px }
spacing: { xxs: 1px, xs: 4px, sm: 8px, md: 12px, lg: 16px, xl: 24px, xxl: 32px, section: 96px }

components:
  button-primary: { backgroundColor: "{colors.primary}", textColor: "{colors.on-primary}", typography: "{typography.button-md}", rounded: "{rounded.sm}", padding: "4px 20px", height: 36px }
  button-primary-active: { backgroundColor: "{colors.ink-deep}", textColor: "{colors.on-primary}", typography: "{typography.button-md}", rounded: "{rounded.sm}" }
  button-secondary: { backgroundColor: "{colors.canvas}", textColor: "{colors.ink}", typography: "{typography.button-md}", rounded: "{rounded.sm}", padding: "4px 20px" }
  button-tab: { backgroundColor: transparent, textColor: "{colors.mute}", typography: "{typography.button-md}", rounded: "{rounded.none}", padding: "8px 16px" }
  button-tab-active: { backgroundColor: transparent, textColor: "{colors.ink}", typography: "{typography.button-md}", rounded: "{rounded.none}" }
  button-disabled: { backgroundColor: "{colors.surface-card}", textColor: "{colors.ash}", rounded: "{rounded.sm}" }
  badge-news: { backgroundColor: "{colors.surface-dark}", textColor: "{colors.on-dark}", typography: "{typography.caption-md}", rounded: "{rounded.sm}", padding: "2px 8px" }
  text-input: { backgroundColor: "{colors.surface-soft}", textColor: "{colors.ink}", typography: "{typography.body-md}", rounded: "{rounded.sm}", padding: "8px 12px", height: 40px }
  text-input-focused: { backgroundColor: "{colors.canvas}", textColor: "{colors.ink}", rounded: "{rounded.sm}" }
  textarea: { backgroundColor: "{colors.surface-soft}", textColor: "{colors.ink}", typography: "{typography.body-md}", rounded: "{rounded.sm}", padding: 12px }
  install-snippet: { backgroundColor: "{colors.surface-card}", textColor: "{colors.ink}", typography: "{typography.body-md}", rounded: "{rounded.sm}", padding: "12px 16px" }
  hero-tui-mockup: { backgroundColor: "{colors.surface-dark}", textColor: "{colors.on-dark}", typography: "{typography.body-md}", rounded: "{rounded.none}", padding: "64px 32px" }
  tui-prompt-row: { backgroundColor: "{colors.surface-dark-elevated}", textColor: "{colors.on-dark}", typography: "{typography.body-md}", rounded: "{rounded.sm}", padding: "8px 12px" }
  list-row: { backgroundColor: "{colors.canvas}", textColor: "{colors.body}", typography: "{typography.body-md}", rounded: "{rounded.none}", padding: "8px 0px" }
  faq-row: { backgroundColor: "{colors.canvas}", textColor: "{colors.ink}", typography: "{typography.body-md}", rounded: "{rounded.none}", padding: "12px 0px" }
  testimonial-row: { backgroundColor: "{colors.surface-soft}", textColor: "{colors.body}", typography: "{typography.body-md}", rounded: "{rounded.sm}", padding: "16px 20px" }
  chart-tile: { backgroundColor: "{colors.canvas}", textColor: "{colors.body}", typography: "{typography.caption-md}", rounded: "{rounded.none}", padding: 16px }
  primary-nav: { backgroundColor: "{colors.canvas}", textColor: "{colors.ink}", typography: "{typography.body-strong}", rounded: "{rounded.none}", height: 56px }
  footer-section: { backgroundColor: "{colors.canvas}", textColor: "{colors.body}", typography: "{typography.caption-md}", rounded: "{rounded.none}", padding: "32px 0px" }
  link-inline: { textColor: "{colors.ink}", typography: "{typography.link-md}" }
  badge-section-label: { backgroundColor: transparent, textColor: "{colors.ink}", typography: "{typography.heading-md}", rounded: "{rounded.none}" }
---

## Overview

OpenCode's marketing site is rendered entirely in Berkeley Mono. The page reads like a manpage: warm cream canvas (`#fdfcfc`), nearly-black ink (`#201d1d`), ASCII bracket markers (`[+]`/`[-]`/`[x]`) in place of icons, and a block-pixel ASCII wordmark. No sans-serif, no display face, no italics. Sections are hairline-bordered text blocks with 96px vertical rhythm. The single visual moment is a full-bleed dark hero TUI mockup. The semantic palette ships the full Apple HIG accent ramp (`#007aff`, `#ff3b30`, `#ff9f0a`, `#30d158`) — these appear in-product, not on marketing chrome.

**Key Characteristics:**
- 100% Berkeley Mono — no sans-serif fallback anywhere
- Cream canvas (`#fdfcfc`) as the only body background
- Single dark surface reserved for hero TUI mockup
- 4px radius on interactives; sections are sharp 1px hairline rectangles
- ASCII bracket markers as bullet glyphs
- Block-pixel ASCII wordmark as brand identity
- 96px section rhythm with no decorative dividers

## Colors
See YAML frontmatter for exhaustive palette. Key notes beyond the YAML:
- Ink (`#201d1d`) is the brand's only "color" — headlines, body, primary CTA fill, nav links.
- Surface Dark is identical to Ink — one near-black for text and dark surfaces.
- Semantic accent colors (Apple Blue, Red, Orange, Green) are reserved for in-product TUI, not marketing CTAs.
- Hairline (`rgba(15,0,0,0.12)`) has a warm tint matching the cream canvas undertone.

## Typography
See YAML frontmatter for token values. Key notes beyond the YAML:
- Single-font (Berkeley Mono) decision is the brand identity — "the marketing page is a man page."
- Fallback stack: IBM Plex Mono → ui-monospace → SFMono-Regular → Menlo → Monaco → Consolas → Liberation Mono → Courier New.
- Hierarchy built from size and weight contrast on one face. Button labels use deliberate line-height 2.0 for calm spacing inside 4px-radius rectangles.
- **Open-source substitutes:** JetBrains Mono (closest match), IBM Plex Mono (official fallback), Geist Mono. Keep line-height values when substituting.

## Layout
- **Base unit:** 8px with 1/2/4px steps for tight gaps.
- **Section rhythm:** 96px between major blocks — no decorative dividers.
- **Max width:** ~960px content column; hero TUI full-bleed within ~1100px frame.
- **Two-column split** on `/enterprise` (~360px text + ~480px form); home is single-column.
- **Footer:** 5-up links at desktop → 2-up at tablet → 1-up at mobile.
- **Whitespace:** Structural and generous. Content left-flush, ASCII bracket bullets instead of indent-based layout.

## Elevation & Depth
No drop shadows. No floating elements. Four levels:
| Level | Treatment | Use |
|-------|-----------|-----|
| 0 — Flat | No border, no shadow | Body sections, list rows, footer |
| 1 — Hairline rule | 1px solid hairline | Section dividers |
| 2 — Hairline strong | 1px solid hairline-strong | Tab strip, emphasized divider |
| 3 — Inverted dark | surface-dark fill | Hero TUI mockup (color, not shadow) |

Decorative depth comes from typography density: ASCII wordmark, faux terminal interface with keybinding hints, inline ASCII charts.

## Shapes
Two-radius vocabulary: 4px (`rounded.sm`) for interactives, 0px for everything else. Avatar circles (testimonial rows) are the only `rounded.full` elements. No photography — visuals are ASCII wordmark, inline ASCII charts, avatar dots, and monospaced character glyphs.

## Components
See YAML frontmatter for all component tokens. Notes beyond YAML:
- **button-primary:** Used for Download, Get started, Send, Subscribe, Read docs.
- **button-primary-active:** Pressed state drops background to ink-deep.
- **button-secondary:** Outlined alternative with hairline-strong border.
- **button-tab/active:** Install-tab strip (curl/npm/bun/brew/yay). Active state adds 2px ash underline.
- **badge-news:** Small dark chip for News/Beta/Live now tags inline with body copy.
- **badge-section-label:** Bare heading line with hairline rule below — functions as label without chip background.
- **text-input/focused:** Focus flips background to canvas and border to ink — no halo, no glow.
- **install-snippet:** Curl command with copy-icon. Sits below tab strip.
- **hero-tui-mockup:** Full-bleed dark container with ASCII wordmark, command prompt row, keybinding hints.
- **list-row:** Each row starts with ASCII bracket marker + bold label + description.
- **faq-row:** Uses `+`/`−` ASCII markers for expand/collapse state.
- **testimonial-row:** 32px avatar circle + name/role/company + quote.
- **chart-tile:** Inline ASCII sparse-line plot with Fig N. caption.
- **primary-nav:** ASCII wordmark left, nav links center-right, Download CTA far right.
- **footer-section:** 5-column link grid with vertical hairline rules + copyright row.
- **link-inline:** Ink color with underline — no Apple Blue on marketing surfaces.

## Do's and Don'ts

### Do
- Render every text role in Berkeley Mono — single-font decision is the entire identity
- Keep cream canvas as the only body background
- Use ASCII bracket markers as bullets, toggles, section glyphs — they are the brand's only iconography
- Anchor dark hero TUI mockup exactly once per landing page
- Reserve semantic accent ramp for in-TUI states; marketing stays monochrome
- Use 4px radius on interactives and 0px on containers
- Stack sections at 96px rhythm with only 1px hairline rules between

### Don't
- No sans-serif, display face, or italic — Berkeley Mono carries everything
- No drop shadows, gradients, or atmospheric backgrounds
- Don't replace ASCII bracket markers with SVG icons
- Don't use accent colors on marketing CTAs
- Don't pad cards with 24px+ internal padding
- Don't render wordmark as vector logo — always block-pixel ASCII
- Don't fill hero mockup with photography — text-only terminal command line

## Responsive Behavior

| Breakpoint | Width | Key Changes |
|------------|-------|-------------|
| desktop-large | 1280px+ | 960px column, 5-up footer |
| desktop | 1024px | Same layout, nav horizontal |
| tablet | 850px | Footer → 2-up; enterprise form stacks |
| tablet-narrow | 768px | Nav → hamburger drawer; Download stays visible |
| mobile | 640px | Single-column; hero display 38px → ~28px; section padding tightens |

**Touch targets:** All interactives at ~36-40px height, meeting WCAG AA. Footer links get ~28px line-height + 8px padding for ~44px tappable row.

**Collapsing strategy:** Hero TUI full-bleed at all widths; install snippet + tab strip full-width on mobile; section padding 96px → 64px → 48px; hero headline 38px → ~28px mobile.

**Image behavior:** No raster images except favicon/OG. All visuals are type or inline SVG — scale without aspect-ratio issues.

## Iteration Guide
1. Focus on ONE component at a time. Pull its YAML entry and verify every property resolves.
2. Reference tokens directly (`{colors.ink}`, `{component.hero-tui-mockup}`) — do not paraphrase.
3. Run `npx @google/design.md lint DESIGN.md` after edits.
4. Add new variants as separate component entries (`-active`, `-disabled`).
5. Default body to body-md; use body-strong for emphasis; display-xl strictly for hero headline.
6. Keep surface-dark scarce — at most one full-bleed dark mockup per page.
7. Before adding new tokens, ask if the component can be expressed with existing ASCII-bracket + 4px-radius + Berkeley Mono vocabulary.

## Known Gaps
- Mobile screenshots not captured — responsive behavior synthesized from desktop evidence.
- Hover states not documented per system policy.
- In-product TUI screenshots beyond hero mockup not captured.
- `/go` page not extracted.
- Form validation state styling not present in captured surfaces.
