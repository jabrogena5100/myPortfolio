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

## Redesign (2026-11-17): what the owner's brief asked for, and what was used

The owner supplied a brief for a "Vercel and Linear" feel with Next.js, TypeScript, Tailwind, shadcn/ui, Motion, Lucide, Playwright, Geist Sans and Geist Mono. The existing Astro architecture was kept ("existing project architecture where possible"). Mapping:

| In the brief | Used here | Why |
| --- | --- | --- |
| Next.js | **Not adopted.** Astro stays | The site is static, ships one tiny script and runs under a strict CSP. Next.js adds a React runtime and is a major architecture change; the look does not depend on it |
| shadcn/ui | **Not adopted** | It is built on React and Radix. Components here are small Astro components on native elements (`<details>`, `<nav>`, tables) |
| Motion (library) | **Not adopted.** CSS transitions, CSS View Transitions and CSS keyframes | No bundle cost, works under `script-src 'self'`, reduced motion is one media query. Can be added if a specific interaction needs it |
| Lucide icons | **Adopted**: `lucide-static` 1.74.0 (ISC), ten icons inlined at build time | Decorative only; no runtime cost |
| Geist Sans and Geist Mono | **Adopted** (OFL 1.1, `docs/fonts.md`) | |
| Tailwind | Already in use for the reset only; tokens are plain CSS variables | |
| Playwright | Already in use | |
| Animated request/data flows in diagrams | **Adopted**, CSS only, key edges only | See `design/TOKENS.md` section 4 |
| "Terminal elements" | Only a panel of real recorded results | A fake terminal would break the project's evidence rule |
