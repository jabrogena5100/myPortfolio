# Design tokens (specification)

Status: **Proposed**. Implemented in Phase 2 as one CSS file (`src/styles/tokens.css`) that is the only place colour, type, spacing, radius, shadow, motion and breakpoint values appear. Tailwind's default palette is disabled so a colour outside the tokens cannot be used (the approach RyuStoreFront took).

Dark only for v1 (the brief's direction). A light theme is not built; the CSS root declares `color-scheme: dark`.

## 1. Colour

Contrast ratios were **computed** (WCAG 2.x relative luminance) on 2026-11-17, not estimated.

| Token | Value | Role | on `bg` | on `surface-1` | on `surface-2` |
| --- | --- | --- | --- | --- | --- |
| `--bg` | `#151310` | Page background (warm near-black) | n/a | n/a | n/a |
| `--surface-1` | `#1d1a16` | Raised areas, cards | n/a | n/a | n/a |
| `--surface-2` | `#26221c` | Hover, code blocks | n/a | n/a | n/a |
| `--border` | `#3b352c` | Decorative rules and borders | 1.53 | 1.43 | 1.30 |
| `--text` | `#ece6d9` | Primary text (warm off-white) | 14.91 | 13.94 | 12.72 |
| `--text-muted` | `#a69e90` | Secondary text | 6.99 | 6.53 | 5.96 |
| `--text-subtle` | `#8a8275` | Captions, metadata | 4.88 | 4.56 | **4.16 (fails)** |
| `--accent` (copper) | `#d98b55` | Links, key marks, focus ring | 6.86 | 6.42 | 5.85 |
| `--accent-hover` | `#e5a070` | Hover on accent | 8.47 | 7.92 | 7.22 |
| `--sage` | `#9fb596` | Quiet "verified" status text | 8.41 | 7.86 | 7.17 |
| `--danger` | `#e0786a` | Errors (used rarely) | 6.24 | 5.83 | 5.32 |
| `--plate` | `#ece6d6` | Light mat behind report figures drawn on white (added in Phase 4). Never used for text | n/a | n/a | n/a |

Rules derived from the numbers:
- `--text-subtle` is allowed only on `--bg` and `--surface-1` and only at 14 px or larger; **never** on `--surface-2`.
- `--border` is decorative only (1.3 to 1.5:1). Any border that carries meaning (an input outline, a focus ring) uses `--accent` or `--text-muted`, which exceed 3:1.
- Button: dark `--bg` text on `--accent` background gives 6.86:1.
- No dominant blue anywhere; the palette's hue range is warm neutrals with copper and a desaturated sage.

## 2. Typography

| Token | Value | Note |
| --- | --- | --- |
| `--font-display` | a serif display face, self-hosted | Headlines. **Face not chosen yet**; I propose three candidates with licences in Phase 2 for you to pick (no font is downloaded before then) |
| `--font-body` | a clean sans, self-hosted | Reading text and UI |
| `--font-mono` | system monospace stack | Code snippets and identifiers only |
| Scale (rem, fluid with `clamp`) | `--step--1` 0.875, `--step-0` 1, `--step-1` 1.25, `--step-2` 1.6, `--step-3` 2.1, `--step-4` 2.9, `--step-5` 4 | 7 sizes; display sizes use `clamp` between a phone and a desktop value |
| Line height | body 1.6, headings 1.1 to 1.2 | |
| Measure | `--measure: 68ch` | Reading width |
| Feature | `text-wrap: balance` on headings, `pretty` on paragraphs | CSS only |

## 3. Spacing, radius, shadow

| Token | Value |
| --- | --- |
| Spacing scale (`--space-1..9`) | 4, 8, 12, 16, 24, 32, 48, 72, 112 px |
| Page gutter | 16 px mobile, 32 px tablet, 48 px desktop |
| Max content width | 1200 px; reading column 68ch |
| `--radius-sm` / `--radius-md` | 4 px / 10 px (cards only; no pill-everything) |
| `--shadow-1` | `0 1px 0 rgb(0 0 0 / 0.4)` (a hairline; no glow shadows) |
| `--shadow-2` | `0 12px 32px -16px rgb(0 0 0 / 0.6)` (project card hover only) |

## 4. Motion

| Token | Value |
| --- | --- |
| `--duration-fast` / `--duration-base` | 120 ms / 200 ms |
| `--duration-slow` | 320 ms (page entrance only) |
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` |
| Properties allowed | `opacity`, `transform` (translate up to 12 px), `color`, `background-color`, `border-color` |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` sets all durations to 0 and removes transforms |
| Page transition | CSS View Transitions (cross-document) with a short opacity fade; falls back to none if unsupported |

## 5. Breakpoints

| Token | Min width | Use |
| --- | --- | --- |
| `sm` | 480 px | Larger phones |
| `md` | 768 px | Tablet: two-column sections |
| `lg` | 1024 px | Desktop: 12-column grid |
| `xl` | 1280 px | Wide: extra margin only |

Design and test widths for Playwright: **390** (phone), **820** (tablet), **1440** (desktop).

## 6. Focus and interaction

- Focus ring: 2 px solid `--accent`, 3 px offset, never removed. Contrast with `--bg` is 6.86:1.
- Minimum touch target 44 px.
- Link style in running text: `--accent`, underlined, underline offset 0.2em.
