# Design tokens (specification)

Status: **Implemented** in `src/styles/tokens.css` (the only place design values live). Redesigned 2026-11-17 from an editorial look (serif headlines, cream and copper) to a developer-tooling look, using the owner's palette. Dark only; `color-scheme: dark`.

## 1. Colour

Contrast ratios were **computed** (WCAG 2.x relative luminance) on 2026-11-17. Every neutral keeps blue less than or equal to red, so there is no blue tint anywhere.

| Token | Value | Role | on `bg` | on `surface-1` | on `surface-2` |
| --- | --- | --- | --- | --- | --- |
| `--color-bg` | `#141414` | Page background | n/a | n/a | n/a |
| `--color-surface-1` | `#20201F` | Cards and panels | n/a | n/a | n/a |
| `--color-surface-2` | `#2C2C2A` | Elevated: panel headers, icon tiles, code | n/a | n/a | n/a |
| `--color-border` | `#3A3A37` | Hairlines (decorative) | 1.61 | 1.43 | 1.23 |
| `--color-border-strong` | `#5A5955` | Outlines on ghost buttons | 2.63 | 2.33 | 2.00 |
| `--color-text` | `#ECEAE4` | Primary text | 15.31 | 13.55 | 11.63 |
| `--color-text-muted` | `#B2AEA6` | Secondary text | 8.33 | 7.38 | 6.33 |
| `--color-text-subtle` | `#8F8C84` | Captions | 5.48 | 4.86 | **4.17 (fails)** |
| `--color-accent` / `--color-sage` | `#A3B18A` | Primary accent: links, focus ring, primary button, "Run" status | 8.08 | 7.15 | 6.14 |
| `--color-accent-hover` | `#B7C4A0` | Hover on accent | 10.02 | 8.87 | 7.61 |
| `--color-amber` | `#D4A65A` | Secondary accent: motion in diagrams, "User-reported" status, small labels | 8.25 | 7.30 | 6.26 |
| `--color-amber-hover` | `#E2BA78` | Hover on amber | 10.11 | 8.95 | 7.68 |
| `--color-danger` | `#E0786A` | Errors (rarely) | 6.20 | 5.49 | 4.71 |
| `--color-plate` | `#E9E7E1` | Light mat behind report figures drawn on white. Never used for text | n/a | n/a | n/a |

Rules from the numbers:
- `--color-text-subtle` only on `bg` and `surface-1`, 14 px or larger; never on `surface-2`.
- Borders are decorative (1.2 to 1.6:1). Anything meaningful (focus ring, button outline) uses accent, `text-muted` or `border-strong`.
- Primary button: `#141414` text on sage is 8.08:1.
- Gradients: none. Shadows: one hairline and one hover shadow.

## 2. Typography

| Token | Value | Use |
| --- | --- | --- |
| `--font-display-stack` and `--font-body-stack` | `'Geist'`, then system sans | Headings and body (weight 600 for headings with letter-spacing -0.035em, 400 for text) |
| `--font-mono-stack` | `'Geist Mono'`, then system monospace | Eyebrow labels, spec strip, status badges, metrics, code, tags, section numbers |
| Scale | `--step--1` 0.875rem to `--step-5` up to 4rem (fluid) | 7 sizes |
| Rules | `font-synthesis: none`; `tabular-nums` on tables and fact lists; `text-wrap: balance` on headings, `pretty` on paragraphs | |

Fonts and licences: `docs/fonts.md`.

## 3. Spacing, radius, shadow

Spacing scale 4, 8, 12, 16, 24, 32, 48, 72, 112 px (`--space-1..9`). Radius `--radius-sm` 4 px, `--radius-md` 10 px, badges fully round. `--shadow-1` hairline, `--shadow-2` hover only.

## 4. Motion

`--duration-fast` 120 ms, `--duration-base` 200 ms, `--duration-slow` 320 ms, `--ease-out` `cubic-bezier(0.22, 1, 0.36, 1)`. Properties: opacity, transform, colour. Reduced motion zeroes all durations and removes transforms.

Diagram flow animation (new): key request paths in the architecture diagrams use `.d-flow`, an amber dashed stroke that moves at 1.4 s per 12 px of dash offset. It runs only under `prefers-reduced-motion: no-preference`; otherwise the dashes are drawn static. CSS only.

## 5. Breakpoints

`sm` 480, `md` 768, `lg` 1024, `xl` 1280 px. Test widths: 320 (reflow), 390 (phone), 820 (tablet), 1440 (desktop).

## 6. Focus and interaction

Focus ring 2 px solid accent, 3 px offset, never removed. Touch targets at least 44 px. Links in running text are underlined.
