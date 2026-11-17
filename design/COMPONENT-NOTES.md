# Component notes and 21st.dev provenance

Status: **Proposed**. No component code from 21st.dev or any other library has been installed or copied. This file records what inspired what, for honest attribution, and will list every adopted component with the fields the brief requires if one is ever adopted.

## Inspiration only (no code copied)

| Pattern | Our implementation | Inspired by (page inspected via the 21st.dev MCP, 2026-11-17) | Licence status | Notes |
| --- | --- | --- | --- | --- |
| Pointer spotlight on project cards | `SpotlightCard`: one delegated `pointermove` listener sets `--mx` and `--my` on the hovered card; CSS radial gradient in copper at low opacity; `(hover: hover)` only; off under reduced motion | https://21st.dev/@jahed/components/spotlight-card (source read: per-card `document` listeners and rainbow hue shift, so rejected as code) | MCP returns no licence; public page said "unknown". **Not copied** | Roughly 20 lines of our own. Hover effect must never carry information |
| Editorial hero composition | Astro component: tagline left, headline right on a 12-column grid, CSS `text-wrap: balance`, no entrance blur | https://21st.dev/@felipemenezes098/components/hero-05 (source read) | No licence field. **Not copied** | We keep only the layout idea. No motion library |
| Bento arrangement for capabilities | Plain CSS grid with named areas, no component | Listings only, e.g. https://21st.dev/@kokonutd/components/bento-grid | Not checked | Used if it reads well in review; otherwise a ruled list wins |
| Responsive navigation | Native `<nav>`, skip link, `<details>` mobile menu, Escape-to-close script of about 10 lines | Listings only (several navbars, not read) | Not checked | RyuStoreFront used the same native approach |

## Evaluated and rejected

| Component | Reason |
| --- | --- |
| Container Scroll Animation (Manu Arora, MIT per page) | 3D scroll tilt is the template effect we avoid; requires `framer-motion` |
| Scroll Morph Hero (Prashant Som) | Unknown licence; `framer-motion`; decorative |
| Animated hero (Tommy Jepsen, MIT per page) | Needs `framer-motion`, `lucide-react`, shadcn button; rotating-word pattern adds nothing |
| Motion Footer (Hossain Jahed) | Unknown licence; needs GSAP ScrollTrigger |
| Spotlight (ibelick) | `framer-motion`; listener-removal bug in the source read |

## Template for any future adopted component

Name and URL; why it fits; dependencies; licence and where it was confirmed; what was changed to match tokens; accessibility considerations; bundle impact (measured, not guessed).
